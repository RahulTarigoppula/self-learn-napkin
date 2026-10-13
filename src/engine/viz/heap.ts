import { rng } from './types';

/** One beat of a sift: the array, the edge being checked (child, parent) and whether it is broken. */
export interface HeapFrame {
  a: number[];
  /** [child index, parent index] under inspection, or null */
  hot: [number, number] | null;
  /** true when the hot edge violates parent ≤ child */
  bad: boolean;
  /** true when this beat swapped the hot pair */
  swapped: boolean;
  /** swaps so far in this operation */
  swaps: number;
  done: boolean;
  caption: string;
}

export const parentOf = (i: number): number => Math.floor((i - 1) / 2);

export function isMinHeap(a: readonly number[]): boolean {
  for (let i = 1; i < a.length; i++) if ((a[parentOf(i)] as number) > (a[i] as number)) return false;
  return true;
}

/** Levels in a complete tree of n nodes (0 for an empty heap). */
export const heapHeight = (n: number): number => (n === 0 ? 0 : Math.floor(Math.log2(n)) + 1);

class Recorder {
  out: HeapFrame[] = [];
  swaps = 0;
  constructor(public h: number[]) {}
  push(f: Partial<HeapFrame> & { caption: string }) {
    this.out.push({
      a: [...this.h],
      hot: null,
      bad: false,
      swapped: false,
      swaps: this.swaps,
      done: false,
      ...f,
    });
  }
  swap(i: number, j: number) {
    const h = this.h;
    [h[i], h[j]] = [h[j] as number, h[i] as number];
    this.swaps++;
  }
  /** Sift h[i] down until both children are ≥ it. */
  siftDown(i: number) {
    const h = this.h;
    const n = h.length;
    for (;;) {
      const l = 2 * i + 1;
      if (l >= n) {
        this.push({ caption: `[${i}] has no children: stop` });
        return;
      }
      const r = l + 1;
      const c = r < n && (h[r] as number) < (h[l] as number) ? r : l;
      const v = h[i] as number;
      const cv = h[c] as number;
      const bad = cv < v;
      this.push({
        hot: [c, i],
        bad,
        caption: `children of [${i}] at ${2 * i + 1}, ${2 * i + 2}: smaller is ${cv}${bad ? ` < ${v} ✗` : ` ≥ ${v} ✓ stop`}`,
      });
      if (!bad) return;
      this.swap(i, c);
      const leaf = 2 * c + 1 >= n;
      this.push({
        hot: [c, i],
        swapped: true,
        caption: `swap ${v} ↔ ${cv}: ${v} sinks to [${c}]${leaf ? ', a leaf: stop' : ''}`,
      });
      if (leaf) return;
      i = c;
    }
  }
  finish(caption: string) {
    this.push({ done: true, caption });
    return this.out;
  }
}

/** push x: append at the end, then sift up. */
export function heapPushFrames(a: readonly number[], x: number): HeapFrame[] {
  const rec = new Recorder([...a, x]);
  const h = rec.h;
  let i = h.length - 1;
  if (i === 0) rec.push({ caption: `append ${x} at [0]: it is the root` });
  while (i > 0) {
    const p = parentOf(i);
    const pv = h[p] as number;
    const bad = x < pv;
    rec.push({
      hot: [i, p],
      bad,
      caption: `${i === h.length - 1 ? `append ${x} at [${i}]. ` : ''}parent (${i}−1)/2 = [${p}] is ${pv}${bad ? ` > ${x} ✗` : ` ≤ ${x} ✓ stop`}`,
    });
    if (!bad) break;
    rec.swap(i, p);
    rec.push({
      hot: [i, p],
      swapped: true,
      caption: `swap ${x} ↔ ${pv}: ${x} rises to [${p}]${p === 0 ? ', the root' : ''}`,
    });
    i = p;
  }
  return rec.finish(
    `push ${x} ✓ ${rec.swaps} swap${rec.swaps === 1 ? '' : 's'} (height ${heapHeight(h.length)})`,
  );
}

/** pop the min: move the last item to the root, then sift down. Empty heap → one "empty" frame. */
export function heapPopFrames(a: readonly number[]): HeapFrame[] {
  if (a.length === 0) return new Recorder([]).finish('heap is empty: nothing to pop');
  const min = a[0] as number;
  if (a.length === 1) return new Recorder([]).finish(`pop ${min}: the heap is now empty`);
  const last = a.at(-1) as number;
  const rec = new Recorder([last, ...a.slice(1, -1)]);
  rec.push({ caption: `pop min ${min}; move the last item ${last} to the root` });
  rec.siftDown(0);
  return rec.finish(`popped ${min} ✓ ${rec.swaps} swap${rec.swaps === 1 ? '' : 's'}, new min ${rec.h[0]}`);
}

/** Bottom-up heapify: sift down every parent from the last one back to the root. O(n). */
export function heapifyFrames(a: readonly number[]): HeapFrame[] {
  const rec = new Recorder([...a]);
  const last = Math.floor(a.length / 2) - 1;
  rec.push({ caption: `heapify: last parent is ⌊${a.length}/2⌋−1 = [${last}]` });
  for (let i = last; i >= 0; i--) {
    rec.push({ hot: null, caption: `sift down at [${i}] (${rec.h[i]})` });
    rec.siftDown(i);
  }
  return rec.finish(`heapified ✓ ${rec.swaps} swaps for ${a.length} items`);
}

/** n deterministic values in 1..99. */
export function randomHeapInput(n: number, seed: number): number[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(r() * 99));
}
