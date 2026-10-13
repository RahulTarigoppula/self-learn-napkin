/**
 * Dynamic-programming tables as "fill, then walk back" frames: LCS, edit distance and 0/1 knapsack.
 * Pure and deterministic. The UI only replays `fills` (one cell per frame) and then `trace`.
 */
export type Cell = readonly [number, number];

/** One cell being computed: its value, the neighbours it looked at and the one that won. */
export interface DpFill {
  r: number;
  c: number;
  v: number;
  from: Cell[];
  win: Cell;
  /** Short glyph for which rule won (↖ ↑ ←, = R D I, +). */
  tag: string;
  caption: string;
}

/** One traceback step. `mark` flags a kept letter / an edit / a taken item; `note` names it. */
export interface DpStep {
  r: number;
  c: number;
  caption: string;
  mark: boolean;
  note?: string;
}

export interface DpRun {
  rows: number;
  cols: number;
  table: number[][];
  /** order[r][c] = index into `fills`, or -1 for a base cell that is known up front. */
  order: number[][];
  fills: DpFill[];
  trace: DpStep[];
}

export interface DpView {
  /** How many fills are visible. */
  filled: number;
  fill: DpFill | null;
  step: DpStep | null;
  path: Cell[];
  /** Traceback steps taken so far (path order, i.e. corner first). */
  steps: DpStep[];
  caption: string;
  done: boolean;
}

const grid = (rows: number, cols: number, v: number): number[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => v));

const get = (t: number[][], r: number, c: number): number => t[r]?.[c] ?? 0;

function set(t: number[][], r: number, c: number, v: number): void {
  const row = t[r];
  if (row) row[c] = v;
}

function shell(rows: number, cols: number) {
  return { rows, cols, table: grid(rows, cols, 0), order: grid(rows, cols, -1), fills: [] as DpFill[] };
}

function push(run: ReturnType<typeof shell>, f: DpFill): void {
  set(run.order, f.r, f.c, run.fills.length);
  set(run.table, f.r, f.c, f.v);
  run.fills.push(f);
}

export const dpFrameCount = (run: DpRun): number => 1 + run.fills.length + run.trace.length;

/** What frame k shows: k = 0 is the base cells, then one fill per frame, then one traceback step per frame. */
export function dpView(run: DpRun, k: number): DpView {
  const last = dpFrameCount(run) - 1;
  const kk = Math.max(0, Math.min(last, Math.floor(k)));
  const F = run.fills.length;
  if (kk === 0)
    return { filled: 0, fill: null, step: null, path: [], steps: [], caption: 'ready', done: false };
  if (kk <= F) {
    const fill = run.fills[kk - 1] as DpFill;
    return { filled: kk, fill, step: null, path: [], steps: [], caption: fill.caption, done: false };
  }
  const steps = run.trace.slice(0, kk - F);
  const step = steps.at(-1) as DpStep;
  return {
    filled: F,
    fill: null,
    step,
    path: steps.map((s) => [s.r, s.c] as const),
    steps,
    caption: step.caption,
    done: kk === last,
  };
}

/** Is cell (r, c) visible in this view (base cell, or already filled)? */
export const shown = (run: DpRun, view: DpView, r: number, c: number): boolean => {
  const o = run.order[r]?.[c] ?? -1;
  return o < view.filled;
};

// ---------------------------------------------------------------- LCS

export interface LcsRun extends DpRun {
  lcs: string;
}

export function lcsRun(x: string, y: string): LcsRun {
  const X = [...x];
  const Y = [...y];
  const m = X.length;
  const n = Y.length;
  const run = shell(m + 1, n + 1);
  const t = run.table;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const a = X[i - 1] as string;
      const b = Y[j - 1] as string;
      const at = `dp[${i}][${j}] `;
      if (a === b) {
        const d = get(t, i - 1, j - 1);
        const from: Cell = [i - 1, j - 1];
        push(run, {
          r: i,
          c: j,
          v: d + 1,
          from: [from],
          win: from,
          tag: '↖',
          caption: `${at}${a} = ${b} → ↖ ${d} + 1 = ${d + 1}`,
        });
      } else {
        const up = get(t, i - 1, j);
        const left = get(t, i, j - 1);
        const upWins = up >= left;
        push(run, {
          r: i,
          c: j,
          v: Math.max(up, left),
          from: [
            [i - 1, j],
            [i, j - 1],
          ],
          win: upWins ? [i - 1, j] : [i, j - 1],
          tag: upWins ? '↑' : '←',
          caption: `${at}${a} ≠ ${b} → max(↑ ${up}, ← ${left}) = ${Math.max(up, left)}`,
        });
      }
    }
  }
  const trace: DpStep[] = [];
  let lcs = '';
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    const a = X[i - 1] as string;
    const b = Y[j - 1] as string;
    if (a === b) {
      trace.push({ r: i, c: j, caption: `${a} = ${b} → keep ${a}, go ↖`, mark: true, note: a });
      lcs = a + lcs;
      i--;
      j--;
    } else if (get(t, i - 1, j) >= get(t, i, j - 1)) {
      trace.push({
        r: i,
        c: j,
        caption: `${a} ≠ ${b} → go ↑ (${get(t, i - 1, j)} ≥ ${get(t, i, j - 1)})`,
        mark: false,
      });
      i--;
    } else {
      trace.push({
        r: i,
        c: j,
        caption: `${a} ≠ ${b} → go ← (${get(t, i, j - 1)} > ${get(t, i - 1, j)})`,
        mark: false,
      });
      j--;
    }
  }
  const len = [...lcs].length;
  trace.push({
    r: i,
    c: j,
    caption: len > 0 ? `stop: LCS = ${lcs} (length ${len})` : 'stop: nothing in common',
    mark: false,
  });
  return { ...run, trace, lcs };
}

// ---------------------------------------------------------------- edit distance

export type EditOp =
  | { op: 'keep'; a: string }
  | { op: 'replace'; a: string; b: string }
  | { op: 'delete'; a: string }
  | { op: 'insert'; b: string };

export const formatEdit = (e: EditOp): string =>
  e.op === 'replace'
    ? `replace ${e.a}→${e.b}`
    : e.op === 'delete'
      ? `delete ${e.a}`
      : e.op === 'insert'
        ? `insert ${e.b}`
        : `keep ${e.a}`;

/** Apply an op list (keeps included) to `a`, left to right. Used to prove a script is valid. */
export function applyEdits(a: string, ops: readonly EditOp[]): string {
  const src = [...a];
  let k = 0;
  let out = '';
  for (const e of ops) {
    if (e.op === 'insert') out += e.b;
    else if (e.op === 'delete') k++;
    else {
      out += e.op === 'keep' ? (src[k] ?? '') : e.b;
      k++;
    }
  }
  return out + src.slice(k).join('');
}

export interface EditRun extends DpRun {
  distance: number;
  /** Every op in order, keeps included. */
  ops: EditOp[];
  /** Only the edits (no keeps), in order. */
  script: EditOp[];
}

export function editRun(a: string, b: string): EditRun {
  const A = [...a];
  const B = [...b];
  const m = A.length;
  const n = B.length;
  const run = shell(m + 1, n + 1);
  const t = run.table;
  for (let i = 0; i <= m; i++) set(t, i, 0, i);
  for (let j = 0; j <= n; j++) set(t, 0, j, j);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const x = A[i - 1] as string;
      const y = B[j - 1] as string;
      const same = x === y;
      const diag = get(t, i - 1, j - 1) + (same ? 0 : 1);
      const del = get(t, i - 1, j) + 1;
      const ins = get(t, i, j - 1) + 1;
      const v = Math.min(diag, del, ins);
      const diagName = same ? 'keep' : 'replace';
      const [win, tag, name]: [Cell, string, string] =
        v === diag
          ? [[i - 1, j - 1], same ? '=' : 'R', diagName]
          : v === del
            ? [[i - 1, j], 'D', 'delete']
            : [[i, j - 1], 'I', 'insert'];
      push(run, {
        r: i,
        c: j,
        v,
        from: [
          [i - 1, j - 1],
          [i - 1, j],
          [i, j - 1],
        ],
        win,
        tag,
        caption: `dp[${i}][${j}] ${x}${same ? '=' : '≠'}${y}: ${diagName} ${diag} · delete ${del} · insert ${ins} → ${name} ${v}`,
      });
    }
  }
  const trace: DpStep[] = [];
  const ops: EditOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const x = A[i - 1] as string;
    const y = B[j - 1] as string;
    const here = get(t, i, j);
    if (i > 0 && j > 0 && here === get(t, i - 1, j - 1) + (x === y ? 0 : 1)) {
      const e: EditOp = x === y ? { op: 'keep', a: x } : { op: 'replace', a: x, b: y };
      ops.unshift(e);
      const keep = e.op === 'keep';
      trace.push({
        r: i,
        c: j,
        caption: keep ? `${x} = ${y} → keep, go ↖` : `${formatEdit(e)}, go ↖`,
        mark: !keep,
        ...(keep ? {} : { note: formatEdit(e) }),
      });
      i--;
      j--;
    } else if (i > 0 && here === get(t, i - 1, j) + 1) {
      const e: EditOp = { op: 'delete', a: x };
      ops.unshift(e);
      trace.push({ r: i, c: j, caption: `${formatEdit(e)}, go ↑`, mark: true, note: formatEdit(e) });
      i--;
    } else {
      const e: EditOp = { op: 'insert', b: y };
      ops.unshift(e);
      trace.push({ r: i, c: j, caption: `${formatEdit(e)}, go ←`, mark: true, note: formatEdit(e) });
      j--;
    }
  }
  const distance = get(t, m, n);
  trace.push({
    r: 0,
    c: 0,
    caption:
      distance === 0 ? 'done: already equal, 0 edits' : `done: ${distance} edit${distance === 1 ? '' : 's'}`,
    mark: false,
  });
  return { ...run, trace, distance, ops, script: ops.filter((e) => e.op !== 'keep') };
}

// ---------------------------------------------------------------- 0/1 knapsack

export interface KnapItem {
  name: string;
  w: number;
  v: number;
}

/** The napkin's worked example: capacity 5 → {B, D}, $7. */
export const KNAPSACK_ITEMS: readonly KnapItem[] = [
  { name: 'A', w: 1, v: 1 },
  { name: 'B', w: 3, v: 4 },
  { name: 'C', w: 4, v: 5 },
  { name: 'D', w: 2, v: 3 },
];
export const KNAPSACK_CAPACITY = 5;

export interface Bag {
  /** Indices into the item list, ascending for DP, in pick order for greedy. */
  chosen: number[];
  value: number;
  weight: number;
}

export interface KnapRun extends DpRun, Bag {}

const names = (items: readonly KnapItem[], idx: number[]) => idx.map((k) => items[k]?.name).join(', ');

export function knapsackRun(items: readonly KnapItem[], cap: number): KnapRun {
  const n = items.length;
  const W = Math.max(0, Math.floor(cap));
  const run = shell(n + 1, W + 1);
  const t = run.table;
  for (let i = 1; i <= n; i++) {
    const it = items[i - 1] as KnapItem;
    for (let c = 0; c <= W; c++) {
      const skip = get(t, i - 1, c);
      const up: Cell = [i - 1, c];
      const at = `dp[${i}][${c}] ${it.name}, c=${c}: `;
      if (it.w <= c) {
        const rest = get(t, i - 1, c - it.w);
        const take = rest + it.v;
        const takes = take > skip;
        push(run, {
          r: i,
          c,
          v: Math.max(skip, take),
          from: [up, [i - 1, c - it.w]],
          win: takes ? [i - 1, c - it.w] : up,
          tag: takes ? '+' : '',
          caption: `${at}skip ${skip} · take ${rest} + ${it.v} = ${take} → ${takes ? 'take' : 'skip'} ${Math.max(skip, take)}`,
        });
      } else {
        push(run, {
          r: i,
          c,
          v: skip,
          from: [up],
          win: up,
          tag: '',
          caption: `${at}${it.w} kg doesn't fit → skip ${skip}`,
        });
      }
    }
  }
  const trace: DpStep[] = [];
  const chosen: number[] = [];
  let c = W;
  for (let i = n; i >= 1; i--) {
    const it = items[i - 1] as KnapItem;
    const here = get(t, i, c);
    const above = get(t, i - 1, c);
    if (here !== above) {
      trace.push({
        r: i,
        c,
        caption: `${here} ≠ ${above} → take ${it.name}, c = ${c} − ${it.w} = ${c - it.w}`,
        mark: true,
        note: it.name,
      });
      chosen.unshift(i - 1);
      c -= it.w;
    } else {
      trace.push({ r: i, c, caption: `${here} = ${above} → skip ${it.name}`, mark: false });
    }
  }
  const value = get(t, n, W);
  const weight = chosen.reduce((s, k) => s + (items[k]?.w ?? 0), 0);
  trace.push({
    r: 0,
    c,
    caption: chosen.length
      ? `bag = {${names(items, chosen)}}: ${weight} kg, $${value}`
      : 'nothing fits, so the bag is empty',
    mark: false,
  });
  return { ...run, trace, chosen, value, weight };
}

/** Greedy by value per kg (ties keep list order): take each item that still fits. Not optimal for 0/1. */
export function greedyByRatio(items: readonly KnapItem[], cap: number): Bag {
  const order = items
    .map((_, k) => k)
    .sort((p, q) => {
      const a = items[p] as KnapItem;
      const b = items[q] as KnapItem;
      return b.v * a.w - a.v * b.w || p - q;
    });
  const chosen: number[] = [];
  let weight = 0;
  let value = 0;
  for (const k of order) {
    const it = items[k] as KnapItem;
    if (weight + it.w <= cap) {
      chosen.push(k);
      weight += it.w;
      value += it.v;
    }
  }
  return { chosen, value, weight };
}
