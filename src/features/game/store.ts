import { getDb, type NapkinDB } from '../../db/dexie';
import { streakNow, tz } from '../../db/review';
import { dayKey } from '../../engine/fsrs/scheduler';
import { ACHIEVEMENTS, dailyStreak, type GameInput, unlockedIds } from '../../engine/game/game';
import { award, celebrate } from './celebrate';

/** Game progress that has no table of its own. Lives in the settings table, so it travels with a backup. */
export interface GameRecord {
  /** best score per napkin quiz: slug → [best, total] */
  quiz: Record<string, [number, number]>;
  /** daily challenge: day key → answered correctly */
  daily: Record<string, boolean>;
  /** playground kinds the learner has interacted with */
  played: string[];
  /** achievement id → unlock time (ms) */
  unlocked: Record<string, number>;
}

const KEY = 'game';
const empty = (): GameRecord => ({ quiz: {}, daily: {}, played: [], unlocked: {} });

export async function loadGame(db: NapkinDB = getDb()): Promise<GameRecord> {
  const row = await db.settings.get(KEY);
  return { ...empty(), ...((row?.value as Partial<GameRecord> | undefined) ?? {}) };
}

async function update(fn: (g: GameRecord) => void): Promise<GameRecord> {
  const db = getDb();
  const g = await loadGame(db);
  fn(g);
  await db.settings.put({ key: KEY, value: g });
  return g;
}

/** Merge a backup's game record into ours: best scores win, days and unlocks are unioned. */
export function mergeGame(a: Partial<GameRecord>, b: Partial<GameRecord>): GameRecord {
  const base = { ...empty(), ...a };
  const out: GameRecord = {
    ...base,
    quiz: { ...base.quiz },
    daily: { ...base.daily },
    played: [...base.played],
    unlocked: { ...base.unlocked },
  };
  for (const [slug, [best, total]] of Object.entries(b.quiz ?? {}))
    if ((out.quiz[slug]?.[0] ?? -1) < best) out.quiz[slug] = [best, total];
  for (const [d, ok] of Object.entries(b.daily ?? {})) out.daily[d] = Boolean(out.daily[d]) || ok;
  out.played = [...new Set([...out.played, ...(b.played ?? [])])];
  for (const [id, t] of Object.entries(b.unlocked ?? {}))
    out.unlocked[id] = Math.min(out.unlocked[id] ?? t, t);
  return out;
}

export const today = (): string => dayKey(new Date(), tz());

export const recordQuiz = (slug: string, score: number, total: number) =>
  update((g) => {
    if ((g.quiz[slug]?.[0] ?? -1) < score) g.quiz[slug] = [score, total];
  }).then(() => checkAchievements());

export const recordDaily = (correct: boolean) =>
  update((g) => {
    const d = today();
    if (!(d in g.daily)) g.daily[d] = correct;
  }).then(() => checkAchievements());

export const recordPlayed = (kind: string) =>
  update((g) => {
    if (!g.played.includes(kind)) g.played.push(kind);
  }).then(() => checkAchievements());

function trackTotals(): Record<string, number> {
  try {
    return JSON.parse(
      document.querySelector<HTMLElement>('[data-track-totals]')?.dataset.trackTotals ?? '{}',
    ) as Record<string, number>;
  } catch {
    return {};
  }
}

export async function gameInput(g?: GameRecord): Promise<GameInput> {
  const db = getDb();
  const [rec, reads, days, st] = await Promise.all([
    g ? Promise.resolve(g) : loadGame(db),
    db.reads.toArray(),
    db.days.toArray(),
    streakNow(db),
  ]);
  const readByTrack: Record<string, number> = {};
  for (const r of reads) {
    const t = r.slug.split('/')[0] ?? '';
    readByTrack[t] = (readByTrack[t] ?? 0) + 1;
  }
  const quizzes = Object.values(rec.quiz);
  return {
    read: reads.length,
    readByTrack,
    trackTotals: trackTotals(),
    reviews: days.reduce((n, d) => n + d.reviews, 0),
    bestStreak: st.best,
    quizzesAced: quizzes.filter(([best, total]) => total > 0 && best >= total).length,
    quizzesTaken: quizzes.length,
    dailyCorrect: Object.values(rec.daily).filter(Boolean).length,
    dailyStreak: dailyStreak(rec.daily, today()),
    played: rec.played.length,
  };
}

let checking: Promise<void> | null = null;
/** Store newly earned achievements and celebrate them (at most two toasts at once). */
export function checkAchievements(): Promise<void> {
  checking ??= (async () => {
    try {
      const db = getDb();
      const g = await loadGame(db);
      const fresh = unlockedIds(await gameInput(g)).filter((id) => !(id in g.unlocked));
      if (fresh.length === 0) return;
      const now = Date.now();
      // A brand-new record (first visit after an update) unlocks silently instead of spamming toasts.
      const quiet = Object.keys(g.unlocked).length === 0 && fresh.length > 3;
      await update((r) => {
        for (const id of fresh) r.unlocked[id] = now;
      });
      if (quiet) return;
      const shown = fresh.slice(0, 2);
      for (const id of shown) {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (a) award(`Achievement unlocked: ${a.title}`, a.how, a.icon);
      }
      if (fresh.length > shown.length)
        award(`+${fresh.length - shown.length} more achievements`, 'See them all on Progress', 'star');
      celebrate();
      document.dispatchEvent(new CustomEvent('napkin:game'));
    } catch (e) {
      console.warn('achievements unavailable', e);
    } finally {
      checking = null;
    }
  })();
  return checking;
}
