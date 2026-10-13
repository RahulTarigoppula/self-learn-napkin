import type { Tracer } from './types';

export interface BinarySearchParams {
  values: number[];
  target: number;
}

export interface BinarySearchState {
  a: readonly number[];
  lo: number;
  hi: number;
  mid: number | null;
  found: number | null;
  done: boolean;
  discarded: ReadonlySet<number>;
}

export function binarySearchProbes(
  values: readonly number[],
  target: number,
): { probes: number[]; index: number } {
  const probes: number[] = [];
  let lo = 0;
  let hi = values.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    probes.push(mid);
    const v = values[mid] as number;
    if (v === target) return { probes, index: mid };
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { probes, index: -1 };
}

export const binarySearch: Tracer<BinarySearchParams, BinarySearchState> = {
  id: 'binary-search',
  title: 'Binary Search',
  defaults: { values: [1, 3, 5, 7, 9, 11, 13, 15], target: 11 },
  init: (p) => ({
    a: p.values,
    lo: 0,
    hi: p.values.length - 1,
    mid: null,
    found: null,
    done: false,
    discarded: new Set(),
  }),
  *run(p) {
    let lo = 0;
    let hi = p.values.length - 1;
    while (lo <= hi) {
      const mid = lo + ((hi - lo) >> 1);
      yield { t: 'probe', i: mid, lo, hi };
      const v = p.values[mid] as number;
      if (v === target(p)) {
        yield { t: 'mark', i: mid, kind: 'path' };
        yield { t: 'caption', text: `found ${p.target} at [${mid}]` };
        yield { t: 'done' };
        return;
      }
      if (v < p.target) lo = mid + 1;
      else hi = mid - 1;
      yield { t: 'range', lo, hi };
    }
    yield { t: 'caption', text: `${p.target} is not here → -1` };
    yield { t: 'done' };
  },
  apply(s, e) {
    switch (e.t) {
      case 'probe':
        return { ...s, mid: e.i, lo: e.lo, hi: e.hi };
      case 'range': {
        const discarded = new Set(s.discarded);
        s.a.forEach((_, i) => {
          if (i < e.lo || i > e.hi) discarded.add(i);
        });
        return { ...s, lo: e.lo, hi: e.hi, discarded };
      }
      case 'mark':
        return { ...s, found: e.i };
      case 'done':
        return { ...s, done: true };
      default:
        return s;
    }
  },
};

const target = (p: BinarySearchParams) => p.target;
