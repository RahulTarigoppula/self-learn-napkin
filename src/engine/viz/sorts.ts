import type { Tracer } from './types';

export interface SortParams {
  values: number[];
  earlyExit?: boolean;
}

export interface SortState {
  a: number[];
  sorted: ReadonlySet<number>;
  active: readonly number[];
  pivot?: number | undefined;
}

const DEFAULT = [5, 3, 8, 1, 9, 2, 7, 4];

const base = {
  defaults: { values: DEFAULT } as SortParams,
  init: (p: SortParams): SortState => ({ a: [...p.values], sorted: new Set(), active: [] }),
};

function applySort(s: SortState, e: Parameters<Tracer<SortParams, SortState>['apply']>[1]): SortState {
  switch (e.t) {
    case 'compare':
      return { ...s, active: [e.i, e.j] };
    case 'swap': {
      const a = [...s.a];
      [a[e.i], a[e.j]] = [a[e.j] as number, a[e.i] as number];
      return { ...s, a, active: [e.i, e.j] };
    }
    case 'set': {
      const a = [...s.a];
      a[e.i] = e.v;
      return { ...s, a, active: [e.i] };
    }
    case 'mark':
      if (e.kind === 'sorted') return { ...s, sorted: new Set([...s.sorted, e.i]) };
      if (e.kind === 'pivot') return { ...s, pivot: e.i };
      return s;
    case 'done':
      return { ...s, active: [], pivot: undefined, sorted: new Set(s.a.map((_, i) => i)) };
    default:
      return s;
  }
}

export const bubbleSort: Tracer<SortParams, SortState> = {
  ...base,
  id: 'bubble-sort',
  title: 'Bubble Sort',
  *run(p) {
    const a = [...p.values];
    const early = p.earlyExit ?? true;
    for (let end = a.length - 1; end > 0; end--) {
      let swapped = false;
      for (let i = 0; i < end; i++) {
        yield { t: 'compare', i, j: i + 1 };
        if ((a[i] as number) > (a[i + 1] as number)) {
          [a[i], a[i + 1]] = [a[i + 1] as number, a[i] as number];
          swapped = true;
          yield { t: 'swap', i, j: i + 1 };
        }
      }
      yield { t: 'mark', i: end, kind: 'sorted' };
      if (early && !swapped) {
        for (let k = 0; k < end; k++) yield { t: 'mark', i: k, kind: 'sorted' };
        break;
      }
    }
    yield { t: 'done' };
  },
  apply: applySort,
};

/** Insertion sort as "shift right, then drop the key in": each shift is a `set`. */
export const insertionSort: Tracer<SortParams, SortState> = {
  ...base,
  id: 'insertion-sort',
  title: 'Insertion Sort',
  *run(p) {
    const a = [...p.values];
    for (let i = 1; i < a.length; i++) {
      const key = a[i] as number;
      let j = i - 1;
      while (j >= 0) {
        yield { t: 'compare', i: j, j: j + 1 };
        if ((a[j] as number) <= key) break;
        a[j + 1] = a[j] as number;
        yield { t: 'set', i: j + 1, v: a[j] as number };
        j--;
      }
      a[j + 1] = key;
      yield { t: 'set', i: j + 1, v: key };
    }
    yield { t: 'done' };
  },
  apply: applySort,
};

/** Number of element shifts insertion sort performs (= the inversion count). */
export function insertionShifts(values: readonly number[]): number {
  let n = 0;
  const a = [...values];
  for (let i = 1; i < a.length; i++) {
    const key = a[i] as number;
    let j = i - 1;
    while (j >= 0 && (a[j] as number) > key) {
      a[j + 1] = a[j] as number;
      j--;
      n++;
    }
    a[j + 1] = key;
  }
  return n;
}

export const inversions = (values: readonly number[]): number => {
  let n = 0;
  for (let i = 0; i < values.length; i++)
    for (let j = i + 1; j < values.length; j++) if ((values[i] as number) > (values[j] as number)) n++;
  return n;
};

export const mergeSort: Tracer<SortParams, SortState> = {
  ...base,
  id: 'merge-sort',
  title: 'Merge Sort',
  *run(p) {
    const a = [...p.values];
    function* sort(lo: number, hi: number): Generator<Parameters<typeof applySort>[1]> {
      if (hi - lo < 1) return;
      const mid = (lo + hi) >> 1;
      yield* sort(lo, mid);
      yield* sort(mid + 1, hi);
      const merged: number[] = [];
      let i = lo;
      let j = mid + 1;
      while (i <= mid && j <= hi) {
        yield { t: 'compare', i, j };
        if ((a[i] as number) <= (a[j] as number)) merged.push(a[i++] as number);
        else merged.push(a[j++] as number);
      }
      while (i <= mid) merged.push(a[i++] as number);
      while (j <= hi) merged.push(a[j++] as number);
      for (let k = 0; k < merged.length; k++) {
        a[lo + k] = merged[k] as number;
        yield { t: 'set', i: lo + k, v: merged[k] as number };
      }
    }
    yield* sort(0, a.length - 1);
    yield { t: 'done' };
  },
  apply: applySort,
};
