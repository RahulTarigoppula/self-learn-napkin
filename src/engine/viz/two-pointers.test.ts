import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  bruteChecks,
  PAIR_DEFAULT,
  PAIR_MAX_N,
  PAIR_TARGET,
  pairSumFrames,
  parseSorted,
  randomSorted,
} from './two-pointers';

describe('pair-with-sum (opposite ends)', () => {
  it('napkin walk: 15 big, 12 small, 14 big, 12 small, 13 found in 5 checks vs 21', () => {
    const fr = pairSumFrames(PAIR_DEFAULT, PAIR_TARGET);
    expect(fr.map((f) => f.sum)).toEqual([null, 15, 12, 14, 12, 13]);
    expect(fr.map((f) => f.move)).toEqual(['start', 'too-big', 'too-small', 'too-big', 'too-small', 'found']);
    const end = fr.at(-1);
    expect(end).toMatchObject({ L: 2, R: 4, checks: 5 });
    expect(end?.gone).toEqual([6, 0, 5, 1]);
    expect(bruteChecks(PAIR_DEFAULT.length)).toBe(21);
    expect(fr[1]?.caption).toBe(
      '1 + 14 = 15 > 13: 14 is too big even with the smallest partner → drop it, R moves left',
    );
    expect(fr[2]?.caption).toBe(
      '1 + 11 = 12 < 13: 1 is too small even with the largest partner → drop it, L moves right',
    );
    expect(end?.caption).toBe('4 + 9 = 13 · found');
    expect(fr[0]?.caption).toBe('L on the smallest, R on the largest · target 13');
  });

  it('missing target: pointers meet after n − 1 checks at most', () => {
    const fr = pairSumFrames(PAIR_DEFAULT, 2);
    const end = fr.at(-1);
    expect(end?.move).toBe('none');
    expect(end?.caption).toBe('L and R met: no pair sums to 2');
    expect(end?.checks).toBe(6);
    expect(end?.L).toBe(end?.R);
  });

  it('fewer than two values', () => {
    expect(pairSumFrames([], 3)).toEqual([
      { L: 0, R: -1, sum: null, move: 'start', gone: [], checks: 0, caption: 'need at least two values' },
    ]);
    expect(pairSumFrames([4], 4)).toHaveLength(1);
  });

  it('duplicates: 2 + 2 = 4 uses two different cells', () => {
    expect(pairSumFrames([2, 2], 4).at(-1)).toMatchObject({ move: 'found', L: 0, R: 1 });
  });

  it('property: agrees with brute force and never exceeds n − 1 checks', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -20, max: 20 }), { maxLength: 12 }),
        fc.integer({ min: -45, max: 45 }),
        (raw, t) => {
          const a = [...raw].sort((x, y) => x - y);
          const end = pairSumFrames(a, t).at(-1);
          let exists = false;
          for (let i = 0; i < a.length; i++)
            for (let j = i + 1; j < a.length; j++)
              if ((a[i] as number) + (a[j] as number) === t) exists = true;
          expect(end?.move === 'found').toBe(exists);
          if (exists) expect((a[end?.L as number] as number) + (a[end?.R as number] as number)).toBe(t);
          expect(end?.checks ?? 0).toBeLessThanOrEqual(Math.max(0, a.length - 1));
          for (const g of end?.gone ?? []) expect(g < (end?.L ?? 0) || g > (end?.R ?? 0)).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe('array helpers', () => {
  it('parseSorted keeps integers, sorts, caps the length and range', () => {
    expect(parseSorted('1, 3 4;6')).toEqual({ values: [1, 3, 4, 6], wasSorted: true });
    expect(parseSorted('9 -2 5')).toEqual({ values: [-2, 5, 9], wasSorted: false });
    expect(parseSorted('abc')).toEqual({ values: [], wasSorted: true });
    expect(parseSorted('1 500 -300 2').values).toEqual([1, 2]);
    expect(parseSorted('1 2 3 4 5 6 7 8 9 10 11 12 13 14').values).toHaveLength(PAIR_MAX_N);
  });

  it('randomSorted: distinct, sorted, in 1..30, deterministic', () => {
    const a = randomSorted(8, 3);
    expect(a).toEqual(randomSorted(8, 3));
    expect(a).toHaveLength(8);
    expect(new Set(a).size).toBe(8);
    expect(a).toEqual([...a].sort((x, y) => x - y));
    expect(a.every((v) => v >= 1 && v <= 30)).toBe(true);
    expect(randomSorted(99, 1)).toHaveLength(30);
    expect(randomSorted(-1, 1)).toEqual([]);
  });
});
