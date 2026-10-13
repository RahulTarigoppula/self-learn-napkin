import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { bfsGrid, DEFAULT_GRID } from './bfs-grid';
import { binarySearch, binarySearchProbes } from './binary-search';
import { fnv1a } from './fnv1a';
import { addServer, angle, arcShare, makeRing, moved, owners, ringAt } from './hash-ring';
import { bubbleSort, insertionShifts, insertionSort, inversions, mergeSort } from './sorts';
import {
  bstFrom,
  CHAINING_DEFAULTS,
  chainingFrames,
  chainingRun,
  height,
  inOrder,
  LRU_GOLDEN_OPS,
  lruCache,
  lruRun,
  quorumOverlap,
  searchPath,
  strongQuorum,
  tokenBucketFrames,
  tokenBucketRun,
} from './systems';
import { captionFor, count, frames, shuffled } from './types';

const V = [5, 3, 8, 1, 9, 2, 7, 4];

describe('sort tracers', () => {
  it('bubble sort (early exit): 25 compares, 14 swaps, 5 passes', () => {
    const ev = [...bubbleSort.run({ values: V })];
    expect(count(ev, 'compare')).toBe(25);
    expect(count(ev, 'swap')).toBe(14);
    expect(ev[0]).toEqual({ t: 'compare', i: 0, j: 1 });
    expect(ev.find((e) => e.t === 'swap')).toEqual({ t: 'swap', i: 0, j: 1 });
    // passes = number of sorted marks emitted before the early exit fills the rest
    const passes = ev.filter((e, i) => e.t === 'mark' && ev[i - 1]?.t !== 'mark').length;
    expect(passes).toBe(5);
    const fr = frames(bubbleSort, { values: V });
    expect(fr.at(-1)?.state.a).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
  });

  it('bubble sort (naive): 28 compares, 14 swaps', () => {
    const ev = [...bubbleSort.run({ values: V, earlyExit: false })];
    expect(count(ev, 'compare')).toBe(28);
    expect(count(ev, 'swap')).toBe(14);
  });

  it('insertion sort: 14 shifts, sorted', () => {
    expect(insertionShifts(V)).toBe(14);
    expect(frames(insertionSort, { values: V }).at(-1)?.state.a).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
  });

  it('merge sort: 17 compares, sorted', () => {
    const ev = [...mergeSort.run({ values: V })];
    expect(count(ev, 'compare')).toBe(17);
    expect(frames(mergeSort, { values: V }).at(-1)?.state.a).toEqual([1, 2, 3, 4, 5, 7, 8, 9]);
  });

  it('first beat caption is compare(0,1) → swap and marks bars 0 and 1', () => {
    const fr = frames(bubbleSort, { values: V });
    expect(fr[0]?.caption).toBe('ready');
    expect(fr[1]?.caption).toBe('compare(0,1) → swap');
    expect(fr[1]?.state.active).toEqual([0, 1]);
    expect(fr[1]?.state.a.slice(0, 2)).toEqual([3, 5]);
    expect(fr.at(-1)?.caption).toBe('done');
  });

  it('property: sorts end sorted; bubble swaps = insertion shifts = inversions', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 50 }), { maxLength: 16 }), (a) => {
        const sorted = [...a].sort((x, y) => x - y);
        for (const t of [bubbleSort, insertionSort, mergeSort])
          expect(frames(t, { values: a }).at(-1)?.state.a).toEqual(sorted);
        expect(count(bubbleSort.run({ values: a }), 'swap')).toBe(inversions(a));
        expect(insertionShifts(a)).toBe(inversions(a));
      }),
      { numRuns: 200 },
    );
  });

  it('shuffles deterministically', () => {
    expect(shuffled(7, 37)).toEqual(shuffled(7, 37));
    expect([...shuffled(7, 37)].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('binary search', () => {
  const A = [1, 3, 5, 7, 9, 11, 13, 15];
  it('target 11 probes [3,5] and is found at 5', () => {
    expect(binarySearchProbes(A, 11)).toEqual({ probes: [3, 5], index: 5 });
    const fr = frames(binarySearch, { values: A, target: 11 });
    expect(fr.at(-1)?.state.found).toBe(5);
    expect(fr.at(-1)?.state.done).toBe(true);
  });
  it('target 4 probes [3,1,2] and returns -1', () => {
    expect(binarySearchProbes(A, 4)).toEqual({ probes: [3, 1, 2], index: -1 });
    const fr = frames(binarySearch, { values: A, target: 4 });
    expect(fr.at(-1)?.state.found).toBeNull();
    expect(fr.some((f) => f.caption.includes('-1'))).toBe(true);
    expect(fr[1]?.caption).toBe('probe [3]  lo=0 hi=7');
  });
});

describe('BFS on a grid', () => {
  it('visits 18 cells including the goal and finds the 8-edge path', () => {
    const ev = [...bfsGrid.run(bfsGrid.defaults)];
    expect(count(ev, 'visit')).toBe(18);
    const path = ev.find((e) => e.t === 'path');
    expect(path && path.t === 'path' && path.cells).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [3, 1],
      [4, 1],
      [4, 2],
      [4, 3],
      [4, 4],
    ]);
    const fr = frames(bfsGrid, bfsGrid.defaults);
    expect(fr.at(-1)?.state.path).toHaveLength(9);
    expect(fr[1]?.caption).toBe('visit (0,0)');
  });

  it('DFS also reaches the goal; unreachable goals say so', () => {
    const d = [...bfsGrid.run({ ...bfsGrid.defaults, mode: 'dfs' })];
    expect(d.some((e) => e.t === 'path')).toBe(true);
    const walled = [...bfsGrid.run({ grid: ['.#', '#.'], start: [0, 0], goal: [1, 1] })];
    expect(walled.some((e) => e.t === 'caption' && e.text === 'goal unreachable')).toBe(true);
    expect(DEFAULT_GRID).toHaveLength(5);
  });
});

describe('systems tracers', () => {
  it('LRU(2) golden: gets [1,-1,-1,3,4], evictions [2,1]', () => {
    expect(lruRun(2, LRU_GOLDEN_OPS)).toEqual({ gets: [1, -1, -1, 3, 4], evictions: [2, 1] });
    const fr = frames(lruCache, lruCache.defaults);
    expect(fr.at(-1)?.state.entries.map(([k]) => k)).toEqual([4, 3]);
    expect(fr.some((f) => f.caption === 'put(3, 3) → evict 2')).toBe(true);
    expect(
      lruRun(1, [
        { op: 'put', key: 1, value: 1 },
        { op: 'put', key: 1, value: 9 },
        { op: 'get', key: 1 },
      ]).gets,
    ).toEqual([9]);
  });

  it('token bucket(5, 1/s): seven at t=0 then one at t=3', () => {
    const p = { capacity: 5, refillPerSec: 1, requests: [0, 0, 0, 0, 0, 0, 0, 3] };
    expect(tokenBucketRun(p)).toEqual([true, true, true, true, true, false, false, true]);
    const fr = tokenBucketFrames(p);
    expect(fr).toHaveLength(9);
    expect(fr[6]?.caption).toContain('429');
    expect(fr.at(-1)?.tokens).toBe(2);
  });

  it('quorum R + W > N', () => {
    const v: [number, number, number][] = [
      [3, 2, 2],
      [3, 1, 1],
      [3, 1, 3],
      [3, 3, 1],
      [5, 2, 3],
    ];
    expect(v.map(([n, r, w]) => strongQuorum(n, r, w))).toEqual([true, false, true, true, false]);
    expect(quorumOverlap(3, 2, 2).both).toEqual([1]);
    expect(quorumOverlap(5, 2, 3).both).toEqual([]);
  });

  it('hash table with chaining resizes to 16 on the 7th insert; final load 0.75', () => {
    const r = chainingRun(CHAINING_DEFAULTS);
    expect(r.resizes).toEqual([{ atInsert: 7, to: 16 }]);
    expect(r.load).toBe(0.75);
    expect(r.table.flat()).toHaveLength(12);
    const fr = chainingFrames(CHAINING_DEFAULTS);
    expect(fr.some((f) => f.caption.includes('resize to 16'))).toBe(true);
  });

  it('BST golden', () => {
    const t = bstFrom([8, 3, 10, 1, 6, 14, 4, 7, 13]);
    expect(inOrder(t)).toEqual([1, 3, 4, 6, 7, 8, 10, 13, 14]);
    expect(height(t)).toBe(4);
    expect(searchPath(t, 6)).toEqual([8, 3, 6]);
    expect(searchPath(t, 5)).toEqual([8, 3, 6, 4]);
  });
});

describe('hash ring', () => {
  it('fnv1a32 goldens', () => {
    expect(['', 'a', 'foobar', 'napkin'].map(fnv1a)).toEqual([
      0x811c9dc5, 0xe40c292c, 0xbf9cf968, 0x4b329dd2,
    ]);
  });

  const keys = { k1: 10, k2: 55, k3: 170, k4: 200, k5: 300, k6: 350 };
  const ring = ringAt({ A: 40, B: 160, C: 280 });

  it('owners are clockwise and wrap', () => {
    expect(owners(ring, keys)).toEqual({ k1: 'A', k2: 'B', k3: 'C', k4: 'C', k5: 'A', k6: 'A' });
  });

  it('adding D@220 moves only k3 and k4, both to D', () => {
    const after = ringAt({ A: 40, B: 160, C: 280, D: 220 });
    expect(moved(ring, after, keys)).toEqual(['k3', 'k4']);
    expect(owners(after, keys).k3).toBe('D');
    expect(owners(after, keys).k4).toBe('D');
  });

  it('removing B moves only k2, to C', () => {
    const after = ringAt({ A: 40, C: 280 });
    expect(moved(ring, after, keys)).toEqual(['k2']);
    expect(owners(after, keys).k2).toBe('C');
  });

  it('addServer streams moves and a K/N caption', () => {
    const r = makeRing(['A', 'B', 'C']);
    const ks = Array.from({ length: 12 }, (_, i) => `k${i + 1}`);
    const ev = [...addServer(r, ks, 'D')];
    expect(ev[0]).toEqual({ t: 'caption', text: `add D at ${angle('D').toFixed(0)}°` });
    const n = ev.filter((e) => e.t === 'move').length;
    expect(ev.at(-2)).toEqual({ t: 'caption', text: `${n} of 12 keys moved (≈ K/N)` });
    expect(captionFor(ev.slice(-2, -1))).toContain('keys moved');
  });

  it('virtual nodes even out the arcs', () => {
    const one = Object.values(arcShare(makeRing(['A', 'B', 'C'], 1)));
    const many = Object.values(arcShare(makeRing(['A', 'B', 'C'], 64)));
    const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
    expect(spread(many)).toBeLessThan(spread(one));
    expect(many.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    expect(arcShare(makeRing(['A']))).toEqual({ A: 1 });
  });
});
