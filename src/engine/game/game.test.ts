import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  dailyIndex,
  dailyStreak,
  type GameInput,
  LEVELS,
  levelOf,
  nextUp,
  previousDay,
  progressOf,
  unlockedIds,
  xpOf,
} from './game';

const zero: GameInput = {
  read: 0,
  readByTrack: {},
  trackTotals: { dsa: 42, sysdesign: 41, ds: 38 },
  reviews: 0,
  bestStreak: 0,
  quizzesAced: 0,
  quizzesTaken: 0,
  dailyCorrect: 0,
  dailyStreak: 0,
  played: 0,
};

describe('xp and levels', () => {
  it('scores every activity', () => {
    expect(xpOf(zero)).toBe(0);
    expect(
      xpOf({ ...zero, read: 2, reviews: 10, quizzesTaken: 1, quizzesAced: 1, dailyCorrect: 1, played: 2 }),
    ).toBe(40 + 20 + 5 + 10 + 10 + 10);
  });

  it('maps xp onto levels with progress towards the next', () => {
    expect(levelOf(0)).toMatchObject({ level: 1, name: 'Doodler', floor: 0, next: 60, progress: 0 });
    expect(levelOf(30).progress).toBeCloseTo(0.5);
    expect(levelOf(60)).toMatchObject({ level: 2, name: 'Sketcher' });
    expect(levelOf(179).level).toBe(2);
    const top = levelOf(99_999);
    expect(top).toMatchObject({ level: LEVELS.length, next: null, progress: 1 });
  });

  it('levels are strictly increasing', () => {
    for (let i = 1; i < LEVELS.length; i++)
      expect((LEVELS[i] as { xp: number }).xp).toBeGreaterThan((LEVELS[i - 1] as { xp: number }).xp);
  });
});

describe('achievements', () => {
  it('nothing is unlocked at the start', () => {
    expect(unlockedIds(zero)).toEqual([]);
  });

  it('ids are unique and every achievement can be unlocked', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const maxed: GameInput = {
      ...zero,
      read: 121,
      readByTrack: { dsa: 42, sysdesign: 41, ds: 38 },
      reviews: 1000,
      bestStreak: 30,
      quizzesAced: 10,
      quizzesTaken: 10,
      dailyCorrect: 7,
      dailyStreak: 7,
      played: 20,
    };
    expect(unlockedIds(maxed)).toEqual(ids);
  });

  it('thresholds unlock at exactly the stated counts', () => {
    const u = (g: Partial<GameInput>) => unlockedIds({ ...zero, ...g });
    expect(u({ read: 1 })).toContain('first-napkin');
    expect(u({ read: 9 })).not.toContain('ten-napkins');
    expect(u({ read: 10 })).toContain('ten-napkins');
    expect(u({ read: 60 })).not.toContain('half-library');
    expect(u({ read: 61 })).toContain('half-library');
    expect(u({ readByTrack: { ds: 38 } })).toContain('track-ds');
    expect(u({ readByTrack: { ds: 37 } })).not.toContain('track-ds');
    expect(u({ bestStreak: 7 })).toEqual(expect.arrayContaining(['streak-3', 'streak-7']));
    expect(u({ dailyStreak: 6, dailyCorrect: 6 })).not.toContain('daily-7');
    expect(u({ played: 5 })).toContain('tinkerer');
  });

  it('a track with no napkins is never "finished"', () => {
    expect(unlockedIds({ ...zero, trackTotals: {}, readByTrack: {} })).toEqual([]);
  });
});

describe('badge progress', () => {
  const byId = (id: string) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) throw new Error(id);
    return a;
  };

  it('counts towards multi-step goals and caps at the goal', () => {
    expect(progressOf(byId('ten-napkins'), { ...zero, read: 3 })).toEqual({ n: 3, of: 10 });
    expect(progressOf(byId('ten-napkins'), { ...zero, read: 25 })).toEqual({ n: 10, of: 10 });
    expect(progressOf(byId('reviews-100'), { ...zero, reviews: 12 })).toEqual({ n: 12, of: 100 });
    expect(progressOf(byId('streak-7'), { ...zero, bestStreak: 2 })).toEqual({ n: 2, of: 7 });
    expect(progressOf(byId('half-library'), { ...zero, read: 5 })).toEqual({ n: 5, of: 61 });
    expect(progressOf(byId('track-ds'), { ...zero, readByTrack: { ds: 4 } })).toEqual({ n: 4, of: 38 });
  });

  it('has nothing to measure for single-step badges or empty tracks', () => {
    expect(progressOf(byId('first-napkin'), zero)).toBeNull();
    expect(progressOf(byId('quiz-ace'), zero)).toBeNull();
    expect(progressOf(byId('track-ds'), { ...zero, trackTotals: {} })).toBeNull();
  });

  it('a measured badge is full exactly when it unlocks', () => {
    const cases: Partial<GameInput>[] = [
      { read: 9 },
      { read: 10 },
      { reviews: 99 },
      { reviews: 100 },
      { bestStreak: 29 },
      { bestStreak: 30 },
      { played: 4 },
      { played: 20 },
      { quizzesAced: 10 },
      { dailyStreak: 7 },
      { readByTrack: { dsa: 42 } },
    ];
    for (const c of cases) {
      const g = { ...zero, ...c };
      for (const a of ACHIEVEMENTS) {
        const p = progressOf(a, g);
        if (p) expect(p.n >= p.of, `${a.id} with ${JSON.stringify(c)}`).toBe(a.test(g));
      }
    }
  });

  it('points at the locked badge closest to done', () => {
    expect(nextUp(zero, new Set())).toBe('first-napkin');
    const g = { ...zero, read: 8, reviews: 30, bestStreak: 2 };
    expect(nextUp(g, new Set(['first-napkin']))).toBe('ten-napkins');
    expect(nextUp({ ...g, read: 1 }, new Set(['first-napkin']))).toBe('streak-3');
    const all = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(nextUp(zero, all)).toBeNull();
  });
});

describe('daily challenge', () => {
  it('is stable for a day and spread across the pool', () => {
    expect(dailyIndex('2026-10-13', 466)).toBe(dailyIndex('2026-10-13', 466));
    expect(dailyIndex('2026-10-13', 0)).toBe(-1);
    const seen = new Set<number>();
    let day = '2026-12-31';
    for (let i = 0; i < 60; i++) {
      const k = dailyIndex(day, 466);
      expect(k).toBeGreaterThanOrEqual(0);
      expect(k).toBeLessThan(466);
      seen.add(k);
      day = previousDay(day);
    }
    expect(seen.size).toBeGreaterThan(50);
  });

  it('steps back across month and year boundaries', () => {
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
    expect(previousDay('2024-03-01')).toBe('2024-02-29');
    expect(previousDay('2027-01-01')).toBe('2026-12-31');
  });

  it('counts the run of answered days ending today or yesterday', () => {
    const h = { '2026-10-11': true, '2026-10-12': false, '2026-10-13': true };
    expect(dailyStreak(h, '2026-10-13')).toBe(3);
    expect(dailyStreak(h, '2026-10-14')).toBe(3);
    expect(dailyStreak(h, '2026-10-15')).toBe(0);
    expect(dailyStreak({}, '2026-10-13')).toBe(0);
  });
});
