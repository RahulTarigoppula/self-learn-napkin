import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  bubbleSort,
  insertionSort,
  medianOfThree,
  mergeSort,
  type PivotRule,
  type QuickState,
  quickFrames,
  quickSort,
} from './sorts';
import { count, type Frame, frames } from './types';

const V = [5, 3, 8, 1, 9, 2, 7, 4];
const SORTED8 = [1, 2, 3, 4, 5, 6, 7, 8];
const compares = (values: number[], pivotRule: PivotRule = 'last', seed = 1) =>
  count(quickSort.run({ values, pivotRule, seed }), 'compare');
const last = (fr: Frame<QuickState>[]) => (fr.at(-1) as Frame<QuickState>).state;

describe('quicksort (Lomuto)', () => {
  it('napkin array: 7 + 2 + 3 + 2 + 1 = 15 comparisons, sorted', () => {
    expect(compares(V)).toBe(15);
    const fr = quickFrames({ values: V });
    expect(last(fr).a).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
    expect(last(fr).sorted.size).toBe(8);
    expect(last(fr).lo).toBe(-1);
    expect(last(fr).stack).toEqual([]);
  });

  it('first partition gives [3,1,2,4,9,8,7,5] with 4 home at index 3', () => {
    const fr = quickFrames({ values: V });
    const k = fr.findIndex((f) => f.caption.startsWith('pivot 4 is home'));
    expect(fr[k]?.caption).toBe('pivot 4 is home at [3]: 3 left, 4 right');
    expect(fr[k]?.state.a).toEqual([3, 1, 2, 4, 9, 8, 7, 5]);
    expect(fr[k]?.state.sorted.has(3)).toBe(true);
    expect(fr[k]?.state.pivot).toBeUndefined();
    // swaps in the scan: 3↔5, 1↔5, 2↔8 (self-swaps are skipped)
    const scanSwaps = fr
      .slice(1, k)
      .flatMap((f) => f.events)
      .filter((e) => e.t === 'swap');
    expect(scanSwaps).toEqual([
      { t: 'swap', i: 0, j: 1 },
      { t: 'swap', i: 1, j: 3 },
      { t: 'swap', i: 2, j: 5 },
    ]);
  });

  it('captions explain each comparison', () => {
    const caps = quickFrames({ values: V }).map((f) => f.caption);
    expect(caps[0]).toBe('ready');
    expect(caps[1]).toBe('depth 0: partition [0..7] around pivot 4');
    expect(caps[2]).toBe('5 > 4: stays on the right, j moves on');
    expect(caps[3]).toBe('3 ≤ 4: swap it to [0], i → 1');
    expect(caps).toContain('8 ≤ 9: already in place, i → 6');
    expect(caps.at(-1)).toBe('done');
  });

  it('sorted input with last pivot is the O(n²) worst case: n(n−1)/2 = 28', () => {
    expect(compares(SORTED8)).toBe(28);
    expect(last(frames(quickSort, { values: SORTED8 })).maxDepth).toBe(6);
  });

  it('median of three rescues sorted input', () => {
    expect(compares(SORTED8, 'median3')).toBe(13);
    const fr = quickFrames({ values: SORTED8, pivotRule: 'median3' });
    expect(fr[1]?.caption).toBe('depth 0: partition [0..7] around pivot 4 (median of 3, moved to the end)');
    expect(fr[1]?.state.a).toEqual([1, 2, 3, 8, 5, 6, 7, 4]);
    expect(fr[1]?.state.pivot).toBe(7);
    expect(last(fr).a).toEqual(SORTED8);
    expect(last(fr).maxDepth).toBe(2);
  });

  it('random pivot is deterministic per seed and still sorts', () => {
    expect(compares(SORTED8, 'random', 5)).toBe(compares(SORTED8, 'random', 5));
    const fr = quickFrames({ values: SORTED8, pivotRule: 'random', seed: 5 });
    expect(last(fr).a).toEqual(SORTED8);
    expect(fr[1]?.caption).toMatch(/^depth 0: partition \[0\.\.7\] around pivot \d \(random/);
  });

  it('defaults to the last-pivot rule and seed 1', () => {
    expect(quickSort.defaults.pivotRule).toBe('last');
    expect(count(quickSort.run({ values: V, pivotRule: 'random' }), 'compare')).toBe(
      compares(V, 'random', 1),
    );
  });

  it('call stack tracks depth: right sibling pops the left subtree', () => {
    const fr = frames(quickSort, { values: V });
    const ranges = fr.filter((f) => f.events.some((e) => e.t === 'range')).map((f) => f.state.stack);
    expect(ranges).toEqual([
      [{ lo: 0, hi: 7 }],
      [
        { lo: 0, hi: 7 },
        { lo: 0, hi: 2 },
      ],
      [
        { lo: 0, hi: 7 },
        { lo: 4, hi: 7 },
      ],
      [
        { lo: 0, hi: 7 },
        { lo: 4, hi: 7 },
        { lo: 5, hi: 7 },
      ],
      [
        { lo: 0, hi: 7 },
        { lo: 4, hi: 7 },
        { lo: 5, hi: 7 },
        { lo: 5, hi: 6 },
      ],
    ]);
    expect(last(fr).maxDepth).toBe(3);
  });

  it('empty and single-element arrays', () => {
    expect(quickFrames({ values: [] }).map((f) => f.caption)).toEqual(['ready', 'done']);
    const one = quickFrames({ values: [7] });
    expect(last(one).a).toEqual([7]);
    expect(last(one).sorted.has(0)).toBe(true);
    expect(compares([2, 1])).toBe(1);
  });

  it('medianOfThree picks lo, mid or hi', () => {
    expect(medianOfThree([1, 2, 3], 0, 2)).toBe(1);
    expect(medianOfThree([3, 2, 1], 0, 2)).toBe(1);
    expect(medianOfThree([2, 1, 3], 0, 2)).toBe(0);
    expect(medianOfThree([2, 3, 1], 0, 2)).toBe(0);
    expect(medianOfThree([1, 3, 2], 0, 2)).toBe(2);
    expect(medianOfThree([3, 1, 2], 0, 2)).toBe(2);
    expect(medianOfThree([4, 4, 4], 0, 2)).toBe(1);
    expect(medianOfThree([9, 5], 0, 1)).toBe(0);
  });

  it('property: every rule sorts, keeps Lomuto invariants, and never beats n(n−1)/2', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 20 }), { maxLength: 12 }),
        fc.constantFrom<PivotRule>('last', 'random', 'median3'),
        fc.integer({ min: 0, max: 1000 }),
        (a, pivotRule, seed) => {
          const fr = quickFrames({ values: a, pivotRule, seed });
          expect(last(fr).a).toEqual([...a].sort((x, y) => x - y));
          for (const { state: s } of fr) {
            if (s.pivot === undefined || s.lo < 0) continue;
            const pv = s.a[s.pivot] as number;
            for (let x = s.lo; x < s.bound; x++) expect(s.a[x]).toBeLessThanOrEqual(pv);
            for (let x = s.bound; x <= s.scan; x++) expect(s.a[x]).toBeGreaterThan(pv);
          }
          const n = a.length;
          expect(compares(a, pivotRule, seed)).toBeLessThanOrEqual((n * (n - 1)) / 2);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('sorted input + last pivot always costs exactly n(n−1)/2', () => {
    for (let n = 1; n <= 12; n++) {
      const a = Array.from({ length: n }, (_, i) => i + 1);
      expect(compares(a)).toBe((n * (n - 1)) / 2);
    }
  });

  it('the other sorts are untouched', () => {
    expect(count(bubbleSort.run({ values: V }), 'compare')).toBe(25);
    expect(last(frames(insertionSort, { values: V }) as never).a).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
    expect(count(mergeSort.run({ values: V }), 'compare')).toBe(17);
  });
});
