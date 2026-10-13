import { afterEach, describe, expect, it } from 'vitest';
import { Rating, State } from '../engine/fsrs/scheduler';
import { NapkinDB } from './dexie';
import {
  currentQueue,
  type Deck,
  markRead,
  quickQuizRounds,
  rate,
  recordQuickQuiz,
  seed,
  unlockedCards,
  unlockedNewCount,
} from './review';

const NOW = new Date('2026-09-06T09:41:00Z');

const item = (slug: string, n: number) => ({
  id: `${slug}#${n}`,
  slug,
  track: 'dsa' as const,
  number: 1,
  title: slug,
  kind: 'qa' as const,
  front: 'q',
  back: 'a',
});

const deck: Deck = {
  track: 'all',
  generatedAt: '2026-09-01',
  cardCount: 9,
  contentHash: 'h1',
  items: [
    ...[0, 1, 2, 3].map((n) => item('dsa/heaps', n)),
    ...[0, 1, 2, 3, 4].map((n) => item('dsa/tries', n)),
  ],
};

let db: NapkinDB;
let k = 0;
const fresh = async () => {
  db = new NapkinDB(`review-test-${k++}`);
  await seed(db, deck, NOW);
  return db;
};
afterEach(async () => {
  await db?.delete();
});

describe('unlockedCards', () => {
  const card = (slug: string, state: State, origin: 'deck' | 'highlight' = 'deck') => ({
    slug,
    state,
    origin,
  });

  it('keeps new deck cards only for napkins that were read', () => {
    const cards = [card('a', State.New), card('b', State.New), card('b', State.Review)];
    expect(unlockedCards(cards, new Set(['a']))).toEqual([card('a', State.New), card('b', State.Review)]);
  });

  it("always keeps introduced cards and the learner's own highlights", () => {
    const cards = [card('a', State.Learning), card('a', State.Relearning), card('a', State.New, 'highlight')];
    expect(unlockedCards(cards, new Set())).toEqual(cards);
  });
});

describe('the review queue only introduces cards from napkins you have read', () => {
  it('a brand-new learner has nothing due', async () => {
    await fresh();
    expect(await currentQueue(db, NOW, 10)).toEqual([]);
    expect(await unlockedNewCount(db)).toBe(0);
  });

  it("marking a napkin read unlocks that napkin's cards and no others", async () => {
    await fresh();
    await markRead(db, 'dsa/heaps', NOW);
    const q = await currentQueue(db, NOW, 10);
    expect(q.map((c) => c.slug)).toEqual(['dsa/heaps', 'dsa/heaps', 'dsa/heaps', 'dsa/heaps']);
    expect(await unlockedNewCount(db)).toBe(4);
  });

  it('still respects the daily new-card limit', async () => {
    await fresh();
    await markRead(db, 'dsa/heaps', NOW);
    await markRead(db, 'dsa/tries', NOW);
    expect(await currentQueue(db, NOW, 6)).toHaveLength(6);
  });

  it('cards already introduced stay in the queue whatever was read', async () => {
    await fresh();
    const c = await db.cards.get('dsa/tries#0');
    if (!c) throw new Error('seed failed');
    // Rated through a topic review without marking the napkin read.
    await rate(db, c, Rating.Again, 's-test', NOW);
    const later = new Date(NOW.getTime() + 24 * 3_600_000);
    const q = await currentQueue(db, later, 10);
    expect(q.map((x) => x.id)).toEqual(['dsa/tries#0']);
  });

  it('a topic review still shows every card of that napkin', async () => {
    await fresh();
    expect(await currentQueue(db, NOW, 10, 'dsa/tries')).toHaveLength(5);
  });
});

describe('quick quiz rounds', () => {
  it('counts finished rounds', async () => {
    await fresh();
    expect(await quickQuizRounds(db)).toBe(0);
    await recordQuickQuiz(db, 4, 5);
    await recordQuickQuiz(db, 2, 5);
    expect(await quickQuizRounds(db)).toBe(2);
  });
});
