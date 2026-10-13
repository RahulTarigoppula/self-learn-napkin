import { describe, expect, it } from 'vitest';
import { buildQueue, plateLabel, type QueueCard } from './queue';
import {
  applyRating,
  createEmptyCard,
  dayKey,
  daysBetween,
  intervalLabel,
  preview,
  Rating,
  State,
  scheduler,
  spokenInterval,
} from './scheduler';

const NOW = new Date('2026-09-06T09:41:00Z');
const f = scheduler({ enable_fuzz: false });

describe('dayKey', () => {
  it('is the local calendar date in the zone', () => {
    expect(dayKey(NOW, 'UTC')).toBe('2026-09-06');
    expect(dayKey(new Date('2026-09-06T20:00:00Z'), 'Asia/Kolkata')).toBe('2026-09-07');
    expect(dayKey(new Date('2026-09-06T19:30:00Z'), 'Asia/Kolkata')).toBe('2026-09-07'); // 01:00 IST
  });
});

describe('FSRS invariants', () => {
  const card = createEmptyCard(NOW);

  it('orders the four outcomes', () => {
    const r = f.repeat(card, NOW);
    const d = (g: Rating.Again | Rating.Hard | Rating.Good | Rating.Easy) => r[g].card.due.getTime();
    expect(d(Rating.Again)).toBeLessThanOrEqual(d(Rating.Hard));
    expect(d(Rating.Hard)).toBeLessThanOrEqual(d(Rating.Good));
    expect(d(Rating.Good)).toBeLessThanOrEqual(d(Rating.Easy));
    expect(d(Rating.Easy)).toBeGreaterThan(d(Rating.Again));
  });

  it('a first Good is a learning/review step logged at now', () => {
    const { card: next, log } = applyRating(card, Rating.Good, NOW, f);
    expect([State.Learning, State.Review]).toContain(next.state);
    expect(next.reps).toBe(1);
    expect(next.lapses).toBe(0);
    expect(next.due.getTime()).toBeGreaterThan(NOW.getTime());
    expect(log.rating).toBe(3);
    expect(log.review.getTime()).toBe(NOW.getTime());
  });

  it('Good then Again at the due date is a lapse with a shorter interval', () => {
    let c = applyRating(card, Rating.Good, NOW, f).card;
    c = applyRating(c, Rating.Good, c.due, f).card;
    c = applyRating(c, Rating.Good, c.due, f).card;
    const before = c.scheduled_days;
    const lapsed = applyRating(c, Rating.Again, c.due, f).card;
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.scheduled_days).toBeLessThan(before);
  });

  it('twelve Goods grow the interval past 30 days, never shrinking', () => {
    let c = card;
    let t = NOW;
    const intervals: number[] = [];
    for (let i = 0; i < 12; i++) {
      c = applyRating(c, Rating.Good, t, f).card;
      intervals.push(c.scheduled_days);
      t = c.due;
    }
    for (let i = 1; i < intervals.length; i++)
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1] as number);
    expect(intervals[11]).toBeGreaterThan(30);
  });

  it('matches the committed golden snapshot', async () => {
    const r = f.repeat(card, NOW);
    const snap = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].map((g) => ({
      rating: g,
      state: r[g as Rating.Good].card.state,
      due: r[g as Rating.Good].card.due.toISOString(),
      stability: Number(r[g as Rating.Good].card.stability.toFixed(4)),
      difficulty: Number(r[g as Rating.Good].card.difficulty.toFixed(4)),
    }));
    await expect(JSON.stringify(snap, null, 2)).toMatchFileSnapshot(
      '../../../tests/fixtures/fsrs/golden-card.snapshot.json',
    );
  });

  it('fuzz is deterministic for identical inputs', () => {
    const fz = scheduler();
    let a = createEmptyCard(NOW);
    let b = createEmptyCard(NOW);
    for (let i = 0; i < 6; i++) {
      a = applyRating(a, Rating.Good, a.due, fz).card;
      b = applyRating(b, Rating.Good, b.due, fz).card;
    }
    expect(a.due.toISOString()).toBe(b.due.toISOString());
  });
});

describe('labels', () => {
  it('formats compact intervals', () => {
    const at = (m: number) => new Date(NOW.getTime() + m * 60_000);
    expect(intervalLabel(NOW, at(1))).toBe('1m');
    expect(intervalLabel(NOW, at(0))).toBe('1m');
    expect(intervalLabel(NOW, at(90))).toBe('2h');
    expect(intervalLabel(NOW, at(4 * 1440))).toBe('4d');
    expect(intervalLabel(NOW, at(45 * 1440))).toBe('1.5mo');
  });

  it('speaks intervals for accessible names', () => {
    expect(spokenInterval('1d')).toBe('1 day');
    expect(spokenInterval('12d')).toBe('12 days');
    expect(spokenInterval('10m')).toBe('10 minutes');
    expect(spokenInterval('1h')).toBe('1 hour');
    expect(spokenInterval('1.5mo')).toBe('1.5 months');
    expect(spokenInterval('soon')).toBe('soon');
  });

  it('previews four plunger labels for a new card', () => {
    const p = preview(createEmptyCard(NOW), NOW, f);
    expect(Object.keys(p)).toEqual(['again', 'hard', 'good', 'easy']);
    expect(p.again).toMatch(/^\d+m$/);
  });

  it('counts whole days', () => {
    expect(daysBetween(NOW, new Date(NOW.getTime() + 4.2 * 86_400_000))).toBe(4);
    expect(daysBetween(NOW, new Date(NOW.getTime() - 86_400_000))).toBe(0);
  });
});

describe('queue golden', () => {
  const H = 3_600_000;
  const D = 24 * H;
  const offsets = [-3 * D, -2 * D, -D, -H, -60_000, 60_000, H, D, 2 * D, 3 * D];
  const today = '2026-09-06';
  const due: QueueCard[] = offsets.map((o, i) => ({
    id: `r${i}`,
    due: new Date(NOW.getTime() + o),
    state: State.Review,
    orphan: 0,
  }));
  const fresh: QueueCard[] = Array.from({ length: 25 }, (_, i) => ({
    id: `n${i}`,
    due: NOW,
    state: State.New,
    orphan: 0,
  }));
  const introducedToday: QueueCard = {
    id: 'x',
    due: new Date(NOW.getTime() + D),
    state: State.Learning,
    orphan: 0,
    introducedOn: today,
  };
  const cards = [...[...due].reverse(), ...fresh, introducedToday];

  it('5 overdue in ascending due order, 9 new, plate 14 due', () => {
    const q = buildQueue(cards, NOW, 10, today);
    expect(q.due.map((c) => c.id)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4']);
    expect(q.fresh).toHaveLength(9);
    expect(q.items).toHaveLength(14);
    expect(q.items.slice(0, 4).map((c) => c.id)).toEqual(['r0', 'r1', 'r2', 'n0']);
    expect(plateLabel(q.items.length, true)).toBe('14 due');
  });

  it('newPerDay 0 still shows the reviews', () => {
    const q = buildQueue(cards, NOW, 0, today);
    expect(plateLabel(q.items.length, true)).toBe('5 due');
  });

  it('nothing due and nothing new is Clean', () => {
    const q = buildQueue([introducedToday], NOW, 10, today);
    expect(q.isEmpty).toBe(true);
    expect(plateLabel(q.items.length, true)).toBe('Clean');
  });

  it('orphans never appear; first run says Pull one; loading shows a dash', () => {
    const q = buildQueue([{ ...due[0], orphan: 1 } as QueueCard], NOW, 10, today);
    expect(q.isEmpty).toBe(true);
    expect(plateLabel(3, false)).toBe('Pull one');
    expect(plateLabel(null, false)).toBe('…');
  });
});
