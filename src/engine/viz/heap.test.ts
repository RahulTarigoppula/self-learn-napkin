import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  heapHeight,
  heapifyFrames,
  heapPopFrames,
  heapPushFrames,
  isMinHeap,
  parentOf,
  randomHeapInput,
} from './heap';

const H = [2, 4, 3, 9, 7, 8, 5];

describe('heap helpers', () => {
  it('parent index is ⌊(i−1)/2⌋', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(parentOf)).toEqual([0, 0, 1, 1, 2, 2, 3]);
  });
  it('isMinHeap', () => {
    expect(isMinHeap(H)).toBe(true);
    expect(isMinHeap([])).toBe(true);
    expect(isMinHeap([1, 1, 1])).toBe(true);
    expect(isMinHeap([3, 2])).toBe(false);
    expect(isMinHeap([9, 7, 8, 5, 2, 4, 3])).toBe(false);
  });
  it('height in levels', () => {
    expect([0, 1, 2, 3, 4, 7, 8, 15].map(heapHeight)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe('push (sift up)', () => {
  it('lesson: push 1 → [1,2,3,4,7,8,5,9] in 3 swaps', () => {
    const fr = heapPushFrames(H, 1);
    const end = fr.at(-1);
    expect(end?.a).toEqual([1, 2, 3, 4, 7, 8, 5, 9]);
    expect(end?.swaps).toBe(3);
    expect(end?.done).toBe(true);
    expect(end?.caption).toBe('push 1 ✓ 3 swaps (height 4)');
    expect(fr[0]?.hot).toEqual([7, 3]);
    expect(fr[0]?.bad).toBe(true);
    expect(fr[0]?.a).toEqual([2, 4, 3, 9, 7, 8, 5, 1]);
    expect(fr[0]?.caption).toBe('append 1 at [7]. parent (7−1)/2 = [3] is 9 > 1 ✗');
    expect(fr[1]?.swapped).toBe(true);
    expect(fr[1]?.caption).toBe('swap 1 ↔ 9: 1 rises to [3]');
    expect(fr.at(-2)?.caption).toBe('swap 1 ↔ 2: 1 rises to [0], the root');
  });
  it('a big value stops at once', () => {
    const fr = heapPushFrames(H, 50);
    expect(fr).toHaveLength(2);
    expect(fr[0]?.bad).toBe(false);
    expect(fr[0]?.caption).toContain('≤ 50 ✓ stop');
    expect(fr.at(-1)?.caption).toBe('push 50 ✓ 0 swaps (height 4)');
  });
  it('one swap is singular', () => {
    expect(heapPushFrames([1, 5], 3).at(-1)?.caption).toBe('push 3 ✓ 0 swaps (height 2)');
    expect(heapPushFrames([1, 5, 6, 7], 4).at(-1)?.caption).toBe('push 4 ✓ 1 swap (height 3)');
  });
  it('push into an empty heap', () => {
    const fr = heapPushFrames([], 7);
    expect(fr.map((f) => f.caption)).toEqual([
      'append 7 at [0]: it is the root',
      'push 7 ✓ 0 swaps (height 1)',
    ]);
  });
});

describe('pop (sift down)', () => {
  it('lesson: pop from [2,4,3,9,7,8,5] → [3,4,5,9,7,8]', () => {
    const fr = heapPopFrames(H);
    const end = fr.at(-1);
    expect(end?.a).toEqual([3, 4, 5, 9, 7, 8]);
    expect(end?.swaps).toBe(1);
    expect(end?.caption).toBe('popped 2 ✓ 1 swap, new min 3');
    expect(fr[0]?.a).toEqual([5, 4, 3, 9, 7, 8]);
    expect(fr[1]?.hot).toEqual([2, 0]);
    expect(fr[1]?.bad).toBe(true);
    expect(fr[1]?.caption).toBe('children of [0] at 1, 2: smaller is 3 < 5 ✗');
    expect(fr[3]?.caption).toBe('children of [2] at 5, 6: smaller is 8 ≥ 5 ✓ stop');
  });
  it('sinks to a leaf', () => {
    const fr = heapPopFrames([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(fr.at(-1)?.a).toEqual([2, 4, 3, 8, 5, 6, 7, 9]);
    expect(fr.some((f) => f.caption.endsWith('a leaf: stop'))).toBe(true);
  });
  it('tiny heaps', () => {
    expect(heapPopFrames([]).map((f) => f.caption)).toEqual(['heap is empty: nothing to pop']);
    expect(heapPopFrames([4]).at(-1)?.a).toEqual([]);
    const two = heapPopFrames([1, 5]);
    expect(two.at(-1)?.a).toEqual([5]);
    expect(two.some((f) => f.caption === '[0] has no children: stop')).toBe(true);
    expect(two.at(-1)?.caption).toBe('popped 1 ✓ 0 swaps, new min 5');
  });
  it('popping everything yields sorted order', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 99 }), { maxLength: 15 }), (xs) => {
        let h: number[] = [];
        for (const x of xs) {
          h = heapPushFrames(h, x).at(-1)?.a ?? [];
          expect(isMinHeap(h)).toBe(true);
        }
        const out: number[] = [];
        while (h.length > 0) {
          out.push(h[0] as number);
          h = heapPopFrames(h).at(-1)?.a ?? [];
          expect(isMinHeap(h)).toBe(true);
        }
        expect(out).toEqual([...xs].sort((p, q) => p - q));
      }),
    );
  });
});

describe('heapify', () => {
  it('lesson: [9,7,8,5,2,4,3] → [2,5,3,9,7,4,8] in 4 swaps', () => {
    const fr = heapifyFrames([9, 7, 8, 5, 2, 4, 3]);
    expect(fr[0]?.caption).toBe('heapify: last parent is ⌊7/2⌋−1 = [2]');
    expect(fr.filter((f) => f.caption.startsWith('sift down at')).map((f) => f.caption)).toEqual([
      'sift down at [2] (8)',
      'sift down at [1] (7)',
      'sift down at [0] (9)',
    ]);
    const end = fr.at(-1);
    expect(end?.a).toEqual([2, 5, 3, 9, 7, 4, 8]);
    expect(end?.swaps).toBe(4);
    expect(end?.caption).toBe('heapified ✓ 4 swaps for 7 items');
  });
  it('always yields a heap with the same multiset, swaps ≤ n', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 99 }), { maxLength: 15 }), (xs) => {
        const end = heapifyFrames(xs).at(-1);
        expect(isMinHeap(end?.a ?? [])).toBe(true);
        expect([...(end?.a ?? [])].sort((p, q) => p - q)).toEqual([...xs].sort((p, q) => p - q));
        expect(end?.swaps ?? 0).toBeLessThanOrEqual(xs.length);
      }),
    );
  });
  it('random inputs are deterministic and in range', () => {
    const a = randomHeapInput(10, 3);
    expect(a).toEqual(randomHeapInput(10, 3));
    expect(a.every((v) => v >= 1 && v <= 99)).toBe(true);
  });
});
