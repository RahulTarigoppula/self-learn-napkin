export type MarkKind = 'sorted' | 'pivot' | 'current' | 'visited' | 'frontier' | 'path';

export type TraceEvent =
  | { t: 'compare'; i: number; j: number }
  | { t: 'swap'; i: number; j: number }
  | { t: 'set'; i: number; v: number }
  | { t: 'mark'; i: number; kind: MarkKind }
  | { t: 'probe'; i: number; lo: number; hi: number }
  | { t: 'range'; lo: number; hi: number }
  | { t: 'visit'; r: number; c: number }
  | { t: 'enqueue'; r: number; c: number }
  | { t: 'path'; cells: [number, number][] }
  | { t: 'op'; text: string }
  | { t: 'evict'; key: number }
  | { t: 'move'; key: string; from: string; to: string }
  | { t: 'caption'; text: string }
  | { t: 'done' };

export interface Tracer<P, S> {
  id: string;
  title: string;
  defaults: P;
  init(p: P): S;
  run(p: P): Generator<TraceEvent>;
  apply(s: S, e: TraceEvent): S;
}

/** One "beat" of a visualisation: the state after it, the events it contains and its caption. */
export interface Frame<S> {
  state: S;
  events: TraceEvent[];
  caption: string;
}

/** Events that start a new beat. Everything else (swap, mark, set, …) folds into the current beat. */
const BEAT: ReadonlySet<TraceEvent['t']> = new Set(['compare', 'probe', 'visit', 'op', 'caption', 'done']);

export function captionFor(events: readonly TraceEvent[]): string {
  const [head, next] = events;
  if (!head) return 'ready';
  switch (head.t) {
    case 'compare':
      return next?.t === 'swap' && next.i === head.i && next.j === head.j
        ? `compare(${head.i},${head.j}) → swap`
        : next?.t === 'set'
          ? `compare(${head.i},${head.j}) → shift`
          : `compare(${head.i},${head.j})`;
    case 'probe':
      return `probe [${head.i}]  lo=${head.lo} hi=${head.hi}`;
    case 'visit':
      return `visit (${head.r},${head.c})`;
    case 'op':
    case 'caption': {
      const evict = events.find((e) => e.t === 'evict');
      return evict ? `${head.text} → evict ${evict.key}` : head.text;
    }
    case 'done':
      return 'done';
    case 'mark':
      return head.kind === 'sorted' ? `${head.i} is in place` : `${head.kind} ${head.i}`;
    default:
      return head.t;
  }
}

/** Replay a tracer into frames. Frame 0 is the initial state; each later frame is one beat. */
export function frames<P, S>(tracer: Tracer<P, S>, p: P): Frame<S>[] {
  let state = tracer.init(p);
  const out: Frame<S>[] = [{ state, events: [], caption: 'ready' }];
  let beat: TraceEvent[] = [];
  const flush = () => {
    if (beat.length === 0) return;
    out.push({ state, events: beat, caption: captionFor(beat) });
    beat = [];
  };
  for (const e of tracer.run(p)) {
    if (BEAT.has(e.t)) flush();
    state = tracer.apply(state, e);
    beat.push(e);
  }
  flush();
  return out;
}

export const count = (events: Iterable<TraceEvent>, t: TraceEvent['t']): number => {
  let n = 0;
  for (const e of events) if (e.t === t) n++;
  return n;
};

/** Deterministic PRNG (mulberry32). The engine never calls Math.random. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** n distinct values 1..9-ish, shuffled deterministically. */
export function shuffled(n: number, seed: number): number[] {
  const r = rng(seed);
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j] as number, a[i] as number];
  }
  return a;
}
