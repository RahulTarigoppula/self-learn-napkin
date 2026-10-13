import type { Tracer } from './types';

/* ---------- LRU cache ---------- */

export type LruOp = { op: 'get'; key: number } | { op: 'put'; key: number; value: number };

export interface LruParams {
  capacity: number;
  ops: LruOp[];
}

export interface LruState {
  /** most-recent first */
  entries: readonly [number, number][];
  lastGet: number | null;
  evicted: number | null;
  results: readonly number[];
}

export const LRU_GOLDEN_OPS: LruOp[] = [
  { op: 'put', key: 1, value: 1 },
  { op: 'put', key: 2, value: 2 },
  { op: 'get', key: 1 },
  { op: 'put', key: 3, value: 3 },
  { op: 'get', key: 2 },
  { op: 'put', key: 4, value: 4 },
  { op: 'get', key: 1 },
  { op: 'get', key: 3 },
  { op: 'get', key: 4 },
];

export const lruCache: Tracer<LruParams, LruState> = {
  id: 'lru-cache',
  title: 'LRU Cache',
  defaults: { capacity: 2, ops: LRU_GOLDEN_OPS },
  init: () => ({ entries: [], lastGet: null, evicted: null, results: [] }),
  *run(p) {
    const m = new Map<number, number>(); // insertion order = recency (oldest first)
    for (const o of p.ops) {
      if (o.op === 'get') {
        const v = m.get(o.key);
        if (v === undefined) {
          yield { t: 'op', text: `get(${o.key}) → -1 miss` };
          yield { t: 'set', i: o.key, v: -1 };
        } else {
          m.delete(o.key);
          m.set(o.key, v);
          yield { t: 'op', text: `get(${o.key}) → ${v} hit` };
          yield { t: 'set', i: o.key, v };
        }
      } else {
        yield { t: 'op', text: `put(${o.key}, ${o.value})` };
        if (m.has(o.key)) m.delete(o.key);
        else if (m.size >= p.capacity) {
          const oldest = m.keys().next().value as number;
          m.delete(oldest);
          yield { t: 'evict', key: oldest };
        }
        m.set(o.key, o.value);
        yield { t: 'swap', i: o.key, j: o.value };
      }
    }
    yield { t: 'done' };
  },
  apply(s, e) {
    switch (e.t) {
      case 'op':
        return { ...s, lastGet: null, evicted: null };
      case 'set': {
        // a get: record the result and promote on hit
        const hit = s.entries.find(([k]) => k === e.i);
        const entries = hit ? [hit, ...s.entries.filter(([k]) => k !== e.i)] : s.entries;
        return { ...s, entries, lastGet: e.i, results: [...s.results, e.v] };
      }
      case 'evict':
        return { ...s, evicted: e.key, entries: s.entries.filter(([k]) => k !== e.key) };
      case 'swap':
        // a put: key i with value j goes to the front
        return { ...s, entries: [[e.i, e.j], ...s.entries.filter(([k]) => k !== e.i)] };
      default:
        return s;
    }
  },
};

/** Run the LRU directly: the values every get returned and the keys evicted, in order. */
export function lruRun(capacity: number, ops: readonly LruOp[]): { gets: number[]; evictions: number[] } {
  const gets: number[] = [];
  const evictions: number[] = [];
  for (const e of lruCache.run({ capacity, ops: [...ops] })) {
    if (e.t === 'set') gets.push(e.v);
    if (e.t === 'evict') evictions.push(e.key);
  }
  return { gets, evictions };
}

/* ---------- Token bucket ---------- */

export interface TokenBucketParams {
  capacity: number;
  refillPerSec: number;
  /** request timestamps in seconds, non-decreasing */
  requests: number[];
}

export function tokenBucketRun(p: TokenBucketParams): boolean[] {
  let tokens = p.capacity;
  let last = p.requests[0] ?? 0;
  return p.requests.map((t) => {
    tokens = Math.min(p.capacity, tokens + (t - last) * p.refillPerSec);
    last = t;
    if (tokens >= 1) {
      tokens -= 1;
      return true;
    }
    return false;
  });
}

export interface BucketFrame {
  tokens: number;
  t: number;
  results: boolean[];
  caption: string;
}

/** One frame per request (plus the full bucket at the start) for the token-bucket griddle. */
export function tokenBucketFrames(p: TokenBucketParams): BucketFrame[] {
  const out: BucketFrame[] = [
    { tokens: p.capacity, t: p.requests[0] ?? 0, results: [], caption: `bucket full: ${p.capacity} tokens` },
  ];
  let tokens = p.capacity;
  let last = p.requests[0] ?? 0;
  const results: boolean[] = [];
  for (const t of p.requests) {
    tokens = Math.min(p.capacity, tokens + (t - last) * p.refillPerSec);
    last = t;
    const ok = tokens >= 1;
    if (ok) tokens -= 1;
    results.push(ok);
    out.push({
      tokens,
      t,
      results: [...results],
      caption: `t=${t}s request → ${ok ? 'allowed' : '429 rejected'} · ${Math.floor(tokens)} left`,
    });
  }
  return out;
}

/* ---------- Quorum ---------- */

export const strongQuorum = (n: number, r: number, w: number): boolean => r + w > n;

/** Which replicas a write and a later read touch (writes from the left, reads from the right). */
export function quorumOverlap(
  n: number,
  r: number,
  w: number,
): { write: number[]; read: number[]; both: number[] } {
  const write = Array.from({ length: Math.min(w, n) }, (_, i) => i);
  const read = Array.from({ length: Math.min(r, n) }, (_, i) => n - 1 - i);
  return { write, read, both: write.filter((i) => read.includes(i)) };
}

/* ---------- Hash table with chaining ---------- */

export interface ChainingParams {
  buckets: number;
  maxLoad: number;
  keys: string[];
}

/** A small positive-int hash that is easy to reason about in the griddle. */
export function bucketOf(key: string, buckets: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % buckets;
}

function rebuild(keys: readonly string[], buckets: number): string[][] {
  const t: string[][] = Array.from({ length: buckets }, () => []);
  for (const k of keys) t[bucketOf(k, buckets)]?.push(k);
  return t;
}

export const CHAINING_DEFAULTS: ChainingParams = {
  buckets: 8,
  maxLoad: 0.75,
  keys: ['ant', 'bee', 'cat', 'dog', 'eel', 'fox', 'gnu', 'hen', 'ibis', 'jay', 'koi', 'lynx'],
};

/** Direct simulation used by the griddle and the tests: when resizes happen and the final load. */
export function chainingRun(p: ChainingParams): {
  resizes: { atInsert: number; to: number }[];
  buckets: number;
  load: number;
  table: string[][];
} {
  let buckets = p.buckets;
  const resizes: { atInsert: number; to: number }[] = [];
  p.keys.forEach((_, i) => {
    const n = i + 1;
    if (n / buckets > p.maxLoad) {
      buckets *= 2;
      resizes.push({ atInsert: n, to: buckets });
    }
  });
  return { resizes, buckets, load: p.keys.length / buckets, table: rebuild(p.keys, buckets) };
}

/** Frames for the chaining griddle: one per insert, each carrying the whole table. */
export function chainingFrames(
  p: ChainingParams,
): { table: string[][]; caption: string; hot: string | null }[] {
  const out: { table: string[][]; caption: string; hot: string | null }[] = [
    { table: rebuild([], p.buckets), caption: `${p.buckets} empty buckets`, hot: null },
  ];
  let buckets = p.buckets;
  const ins: string[] = [];
  for (const k of p.keys) {
    ins.push(k);
    const b = bucketOf(k, buckets);
    const chain = rebuild(ins, buckets)[b]?.length ?? 0;
    out.push({
      table: rebuild(ins, buckets),
      caption: `insert "${k}" → bucket ${b}${chain > 1 ? ' (collision, chained)' : ''}`,
      hot: k,
    });
    if (ins.length / buckets > p.maxLoad) {
      const load = ins.length / buckets;
      buckets *= 2;
      out.push({
        table: rebuild(ins, buckets),
        caption: `load ${load.toFixed(2)} > ${p.maxLoad} → resize to ${buckets} and rehash`,
        hot: null,
      });
    }
  }
  return out;
}

/* ---------- BST ---------- */

export interface BstNode {
  v: number;
  l: BstNode | null;
  r: BstNode | null;
}

export function bstInsert(root: BstNode | null, v: number): BstNode {
  if (!root) return { v, l: null, r: null };
  if (v < root.v) return { ...root, l: bstInsert(root.l, v) };
  return { ...root, r: bstInsert(root.r, v) };
}

export const bstFrom = (values: readonly number[]): BstNode | null =>
  values.reduce<BstNode | null>((t, v) => bstInsert(t, v), null);

export function inOrder(t: BstNode | null): number[] {
  return t ? [...inOrder(t.l), t.v, ...inOrder(t.r)] : [];
}

export const height = (t: BstNode | null): number => (t ? 1 + Math.max(height(t.l), height(t.r)) : 0);

export function searchPath(t: BstNode | null, v: number): number[] {
  const path: number[] = [];
  let n = t;
  while (n) {
    path.push(n.v);
    if (v === n.v) break;
    n = v < n.v ? n.l : n.r;
  }
  return path;
}
