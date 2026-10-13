import { rng } from './types';

/** The napkin's worked example: find two values summing to 13. */
export const PAIR_DEFAULT = [1, 3, 4, 6, 9, 11, 14];
export const PAIR_TARGET = 13;
export const PAIR_MAX_N = 12;

export type PairMove = 'start' | 'too-big' | 'too-small' | 'found' | 'none';

export interface PairFrame {
  L: number;
  R: number;
  /** a[L] + a[R] for this check, or null on the start / give-up frame. */
  sum: number | null;
  move: PairMove;
  /** Indices ruled out so far (never part of the answer). */
  gone: readonly number[];
  /** Checks done so far. */
  checks: number;
  caption: string;
}

/** Opposite-ends pair search on a sorted array. Frame 0 is the start; one frame per check. */
export function pairSumFrames(a: readonly number[], target: number): PairFrame[] {
  let L = 0;
  let R = a.length - 1;
  const gone: number[] = [];
  const out: PairFrame[] = [
    {
      L,
      R,
      sum: null,
      move: 'start',
      gone: [],
      checks: 0,
      caption:
        a.length < 2 ? 'need at least two values' : `L on the smallest, R on the largest · target ${target}`,
    },
  ];
  let checks = 0;
  while (L < R) {
    const x = a[L] as number;
    const y = a[R] as number;
    const sum = x + y;
    checks++;
    if (sum === target) {
      out.push({
        L,
        R,
        sum,
        move: 'found',
        gone: [...gone],
        checks,
        caption: `${x} + ${y} = ${target} · found`,
      });
      return out;
    }
    if (sum > target) {
      gone.push(R);
      out.push({
        L,
        R,
        sum,
        move: 'too-big',
        gone: [...gone],
        checks,
        caption: `${x} + ${y} = ${sum} > ${target}: ${y} is too big even with the smallest partner → drop it, R moves left`,
      });
      R--;
    } else {
      gone.push(L);
      out.push({
        L,
        R,
        sum,
        move: 'too-small',
        gone: [...gone],
        checks,
        caption: `${x} + ${y} = ${sum} < ${target}: ${x} is too small even with the largest partner → drop it, L moves right`,
      });
      L++;
    }
  }
  if (a.length >= 2)
    out.push({
      L,
      R,
      sum: null,
      move: 'none',
      gone: [...gone],
      checks,
      caption: `L and R met: no pair sums to ${target}`,
    });
  return out;
}

/** Pairs a brute-force double loop would try. */
export const bruteChecks = (n: number): number => (n * (n - 1)) / 2;

/** Parse "1, 3 4;6" into a sorted list of at most PAIR_MAX_N integers in -99..99. */
export function parseSorted(text: string): { values: number[]; wasSorted: boolean } {
  const values = (text.match(/-?\d+/g) ?? [])
    .map(Number)
    .filter((v) => v >= -99 && v <= 99)
    .slice(0, PAIR_MAX_N);
  const sorted = [...values].sort((x, y) => x - y);
  return { values: sorted, wasSorted: sorted.every((v, i) => v === values[i]) };
}

/** n distinct sorted values in 1..30, deterministic per seed. */
export function randomSorted(n: number, seed: number): number[] {
  const r = rng(seed);
  const pool = Array.from({ length: 30 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as number, pool[i] as number];
  }
  return pool.slice(0, Math.max(0, Math.min(n, 30))).sort((x, y) => x - y);
}
