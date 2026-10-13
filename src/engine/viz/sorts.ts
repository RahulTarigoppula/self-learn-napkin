import { type Frame, frames, rng, type TraceEvent, type Tracer } from './types';

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

function applySort<S extends SortState>(s: S, e: TraceEvent): S {
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

/* ---------------- Quicksort (Lomuto partition) ---------------- */

export type PivotRule = 'last' | 'random' | 'median3';

export interface QuickParams extends SortParams {
  /** How each partition picks its pivot (it is then swapped to the end, Lomuto style). */
  pivotRule?: PivotRule;
  /** Seed for the random pivot rule. */
  seed?: number;
}

export interface QuickState extends SortState {
  /** Current partition range, or -1 when idle. */
  lo: number;
  hi: number;
  /** Lomuto boundary i: a[lo..i-1] ≤ pivot. -1 when idle. */
  bound: number;
  /** Scanner j: a[i..j] > pivot, a[j+1..hi-1] unknown. -1 before the first compare of a partition. */
  scan: number;
  /** Active call stack of ranges, outermost first; depth = stack.length - 1. */
  stack: readonly { lo: number; hi: number }[];
  maxDepth: number;
}

/** Index of the median of a[lo], a[mid], a[hi]. */
export function medianOfThree(a: readonly number[], lo: number, hi: number): number {
  const mid = lo + ((hi - lo) >> 1);
  const x = a[lo] as number;
  const y = a[mid] as number;
  const z = a[hi] as number;
  if ((x <= y && y <= z) || (z <= y && y <= x)) return mid;
  if ((y <= x && x <= z) || (z <= x && x <= y)) return lo;
  return hi;
}

const RULE_TEXT: Record<PivotRule, string> = { last: 'last', random: 'random', median3: 'median of 3' };

export const quickSort: Tracer<QuickParams, QuickState> = {
  id: 'quicksort',
  title: 'Quicksort',
  defaults: { values: DEFAULT, pivotRule: 'last' },
  init: (p) => ({
    a: [...p.values],
    sorted: new Set(),
    active: [],
    lo: -1,
    hi: -1,
    bound: -1,
    scan: -1,
    stack: [],
    maxDepth: 0,
  }),
  *run(p) {
    const a = [...p.values];
    const rule = p.pivotRule ?? 'last';
    const r = rng(p.seed ?? 1);
    function* sort(lo: number, hi: number, depth: number): Generator<TraceEvent> {
      if (lo > hi) return;
      if (lo === hi) {
        yield { t: 'mark', i: lo, kind: 'sorted' };
        return;
      }
      const pick =
        rule === 'last'
          ? hi
          : rule === 'random'
            ? lo + Math.floor(r() * (hi - lo + 1))
            : medianOfThree(a, lo, hi);
      const pv = a[pick] as number;
      const how = rule === 'last' ? '' : ` (${RULE_TEXT[rule]}${pick === hi ? '' : ', moved to the end'})`;
      yield { t: 'caption', text: `depth ${depth}: partition [${lo}..${hi}] around pivot ${pv}${how}` };
      yield { t: 'range', lo, hi };
      if (pick !== hi) {
        [a[pick], a[hi]] = [a[hi] as number, a[pick] as number];
        yield { t: 'swap', i: pick, j: hi };
      }
      yield { t: 'mark', i: hi, kind: 'pivot' };
      yield { t: 'mark', i: lo, kind: 'current' };
      let i = lo;
      for (let j = lo; j < hi; j++) {
        yield { t: 'compare', i: j, j: hi };
        if ((a[j] as number) <= pv) {
          if (i !== j) {
            [a[i], a[j]] = [a[j] as number, a[i] as number];
            yield { t: 'swap', i, j };
          }
          i++;
          yield { t: 'mark', i, kind: 'current' };
        }
      }
      yield { t: 'caption', text: `pivot ${pv} is home at [${i}]: ${i - lo} left, ${hi - i} right` };
      if (i !== hi) {
        [a[i], a[hi]] = [a[hi] as number, a[i] as number];
        yield { t: 'swap', i, j: hi };
      }
      yield { t: 'mark', i, kind: 'sorted' };
      yield* sort(lo, i - 1, depth + 1);
      yield* sort(i + 1, hi, depth + 1);
    }
    yield* sort(0, a.length - 1, 0);
    yield { t: 'done' };
  },
  apply(s, e) {
    switch (e.t) {
      case 'range': {
        const stack = [...s.stack];
        let top = stack.at(-1);
        while (top && !(e.lo >= top.lo && e.hi <= top.hi)) {
          stack.pop();
          top = stack.at(-1);
        }
        stack.push({ lo: e.lo, hi: e.hi });
        return {
          ...s,
          lo: e.lo,
          hi: e.hi,
          bound: e.lo,
          scan: -1,
          active: [],
          stack,
          maxDepth: Math.max(s.maxDepth, stack.length - 1),
        };
      }
      case 'compare':
        return { ...s, active: [e.i, e.j], scan: e.i };
      case 'mark':
        if (e.kind === 'current') return { ...s, bound: e.i };
        if (e.kind === 'sorted' && e.i === s.pivot)
          return { ...applySort(s, e), pivot: undefined, scan: s.hi };
        return applySort(s, e);
      case 'swap':
        // Placing the pivot: it travels from hi to the boundary.
        if (s.pivot === e.j && e.i === s.bound) return { ...applySort(s, e), pivot: e.i };
        return applySort(s, e);
      case 'done':
        return { ...applySort(s, e), lo: -1, hi: -1, bound: -1, scan: -1, stack: [] };
      default:
        return applySort(s, e);
    }
  },
};

/** Quicksort frames with value-aware captions for every comparison. */
export function quickFrames(p: QuickParams): Frame<QuickState>[] {
  const fr = frames(quickSort, p);
  return fr.map((f, k) => {
    const head = f.events[0];
    if (head?.t !== 'compare') return f;
    const before = (fr[k - 1] as Frame<QuickState>).state;
    const v = before.a[head.i] as number;
    const pv = before.a[head.j] as number;
    if (v > pv) return { ...f, caption: `${v} > ${pv}: stays on the right, j moves on` };
    const moved = f.events.some((e) => e.t === 'swap');
    return {
      ...f,
      caption: moved
        ? `${v} ≤ ${pv}: swap it to [${before.bound}], i → ${f.state.bound}`
        : `${v} ≤ ${pv}: already in place, i → ${f.state.bound}`,
    };
  });
}
