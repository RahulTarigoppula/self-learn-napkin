import { buildQueue } from '../engine/fsrs/queue';
import {
  applyRating,
  createEmptyCard,
  dayKey,
  daysBetween,
  type Grade,
  State,
  scheduler,
} from '../engine/fsrs/scheduler';
import { streak } from '../engine/progress/streak';
import { withBase } from '../lib/base';
import type { NapkinDB, ReviewCard, Session, SessionLine } from './dexie';

export interface DeckItem {
  id: string;
  slug: string;
  track: 'dsa' | 'sysdesign' | 'ds';
  number: number;
  title: string;
  kind: 'qa' | 'cloze';
  front: string;
  back: string;
  /** raw cloze text with {{…}} (cloze cards only) */
  cloze?: string;
  source?: { name: string; licence: string };
}

export interface Deck {
  track: string;
  generatedAt: string;
  cardCount: number;
  contentHash: string;
  items: DeckItem[];
}

export const tz = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

let deckPromise: Promise<Deck> | null = null;
export function loadDeck(): Promise<Deck> {
  deckPromise ??= fetch(withBase('decks/all.json')).then((r) => {
    if (!r.ok) throw new Error(`deck ${r.status}`);
    return r.json() as Promise<Deck>;
  });
  deckPromise.catch(() => {
    deckPromise = null;
  });
  return deckPromise;
}

/** Idempotent: adds a row per new deck id, hides ids that left the deck (never deletes history). */
export async function seed(
  db: NapkinDB,
  deck: Deck,
  now = new Date(),
): Promise<{ added: number; orphaned: number }> {
  const hash = (await db.settings.get('deckHash'))?.value;
  if (hash === deck.contentHash) return { added: 0, orphaned: 0 };
  const ids = new Set(deck.items.map((i) => i.id));
  let added = 0;
  let orphaned = 0;
  await db.transaction('rw', db.cards, db.settings, async () => {
    const existing = new Map((await db.cards.toArray()).map((c) => [c.id, c]));
    const fresh: ReviewCard[] = [];
    for (const item of deck.items) {
      const prev = existing.get(item.id);
      if (!prev) {
        fresh.push({
          ...createEmptyCard(now),
          id: item.id,
          slug: item.slug,
          track: item.track,
          origin: 'deck',
          orphan: 0,
        });
      } else if (prev.orphan === 1) {
        await db.cards.update(item.id, { orphan: 0 });
      }
    }
    for (const c of existing.values()) {
      if (c.origin === 'deck' && c.orphan === 0 && !ids.has(c.id)) {
        await db.cards.update(c.id, { orphan: 1 });
        orphaned++;
      }
    }
    await db.cards.bulkAdd(fresh);
    added = fresh.length;
    await db.settings.put({ key: 'deckHash', value: deck.contentHash });
  });
  return { added, orphaned };
}

export async function ensureSeeded(db: NapkinDB): Promise<Deck> {
  const deck = await loadDeck();
  await seed(db, deck);
  return deck;
}

/** The review queue right now. `topic` limits it to one napkin's cards (all of them, due or not). */
export async function currentQueue(
  db: NapkinDB,
  now: Date,
  newPerDay: number,
  topic?: string | null,
): Promise<ReviewCard[]> {
  if (topic) {
    const cards = await db.cards
      .where('slug')
      .equals(topic)
      .and((c) => c.orphan === 0)
      .toArray();
    return cards.sort((a, b) => a.due.getTime() - b.due.getTime());
  }
  const [all, read] = await Promise.all([db.cards.orderBy('due').toArray(), readSlugs(db)]);
  return buildQueue(unlockedCards(all, read), now, newPerDay, dayKey(now, tz())).items;
}

const readSlugs = async (db: NapkinDB): Promise<Set<string>> =>
  new Set((await db.reads.toArray()).map((r) => r.slug));

/**
 * A new deck card is only introduced once the learner has marked its napkin read, so nobody is asked to
 * recall a topic they have never seen. Cards already introduced (any state but New) and the learner's own
 * highlight cards always pass.
 */
export function unlockedCards<C extends Pick<ReviewCard, 'state' | 'slug' | 'origin'>>(
  cards: readonly C[],
  read: ReadonlySet<string>,
): C[] {
  return cards.filter((c) => c.state !== State.New || c.origin === 'highlight' || read.has(c.slug));
}

/** New cards still waiting in napkins the learner has read (ignores today's new-card limit). */
export async function unlockedNewCount(db: NapkinDB): Promise<number> {
  const [fresh, read] = await Promise.all([
    db.cards.where('state').equals(State.New).toArray(),
    readSlugs(db),
  ]);
  return unlockedCards(
    fresh.filter((c) => c.orphan === 0),
    read,
  ).length;
}

export async function dueCount(db: NapkinDB, now: Date, newPerDay: number): Promise<number> {
  return (await currentQueue(db, now, newPerDay)).length;
}

export async function everReviewed(db: NapkinDB): Promise<boolean> {
  return (await db.logs.count()) > 0;
}

/** Commit a rating in one transaction. Throws if the write fails, so the caller keeps the card. */
export async function rate(
  db: NapkinDB,
  card: ReviewCard,
  grade: Grade,
  sessionId: string,
  now = new Date(),
  f = scheduler(),
): Promise<ReviewCard> {
  const { card: next, log } = applyRating(card, grade, now, f);
  const today = dayKey(now, tz());
  const row: ReviewCard = {
    ...card,
    ...next,
    introducedOn: card.introducedOn ?? (card.state === State.New ? today : undefined),
  } as ReviewCard;
  if (row.introducedOn === undefined) delete row.introducedOn;
  await db.transaction('rw', db.cards, db.logs, db.days, async () => {
    await db.cards.put(row);
    await db.logs.add({ ...log, cardId: card.id, sessionId, dayKey: today });
    const d = (await db.days.get(today)) ?? { dayKey: today, reviews: 0, newCards: 0, napkinsRead: 0 };
    await db.days.put({
      ...d,
      reviews: d.reviews + 1,
      newCards: d.newCards + (card.state === State.New ? 1 : 0),
    });
  });
  return row;
}

export const lineFor = (title: string, grade: Grade, now: Date, next: ReviewCard): SessionLine => ({
  cardId: next.id,
  title,
  rating: grade as 1 | 2 | 3 | 4,
  days: daysBetween(now, next.due),
});

export async function saveSession(db: NapkinDB, s: Omit<Session, 'receiptNo'>): Promise<Session> {
  const last = await db.sessions.orderBy('receiptNo').last();
  const session: Session = { ...s, receiptNo: (last?.receiptNo ?? 0) + 1 };
  await db.sessions.put(session);
  return session;
}

/** Record that a napkin was read today (once per napkin per day). */
export async function markRead(db: NapkinDB, slug: string, now = new Date()): Promise<void> {
  const today = dayKey(now, tz());
  await db.transaction('rw', db.reads, db.days, async () => {
    const prev = await db.reads.get(slug);
    const firstToday = !prev || dayKey(new Date(prev.readAt), tz()) !== today;
    await db.reads.put({ slug, readAt: now.getTime(), finished: 1 });
    if (firstToday) {
      const d = (await db.days.get(today)) ?? { dayKey: today, reviews: 0, newCards: 0, napkinsRead: 0 };
      await db.days.put({ ...d, napkinsRead: d.napkinsRead + 1 });
    }
  });
}

/** Settings key for finished quick-quiz rounds (the home checklist ticks off "Try a quick quiz" from it). */
export const QUICK_QUIZ_KEY = 'quickQuiz';
interface QuickQuizStat {
  rounds: number;
  best: number;
  at: number;
}

export async function recordQuickQuiz(
  db: NapkinDB,
  score: number,
  total: number,
  now = Date.now(),
): Promise<void> {
  const prev = (await db.settings.get(QUICK_QUIZ_KEY))?.value as Partial<QuickQuizStat> | undefined;
  const value: QuickQuizStat = {
    rounds: (prev?.rounds ?? 0) + 1,
    best: Math.max(prev?.best ?? 0, total ? score / total : 0),
    at: now,
  };
  await db.settings.put({ key: QUICK_QUIZ_KEY, value });
}

export async function quickQuizRounds(db: NapkinDB): Promise<number> {
  return ((await db.settings.get(QUICK_QUIZ_KEY))?.value as Partial<QuickQuizStat> | undefined)?.rounds ?? 0;
}

export async function streakNow(db: NapkinDB, now = new Date()): Promise<{ current: number; best: number }> {
  return streak(await db.days.toArray(), dayKey(now, tz()));
}

export const newSessionId = (now = new Date()): string =>
  `s-${now.getTime().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
