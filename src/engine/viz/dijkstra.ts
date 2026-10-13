/** Dijkstra (textbook: a settled node is final) as frames, plus Bellman-Ford as the ground truth. */

export interface WEdge {
  u: string;
  v: string;
  w: number;
  /** Directed edges go u → v only; the rest are two-way roads. */
  directed?: boolean;
}

export interface WGraph {
  nodes: readonly string[];
  edges: readonly WEdge[];
}

/** The napkin's six towns (same roads and weights as its story and worked example). */
export const DIJKSTRA_GRAPH: WGraph = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    { u: 'A', v: 'B', w: 4 },
    { u: 'A', v: 'C', w: 1 },
    { u: 'B', v: 'C', w: 2 },
    { u: 'B', v: 'D', w: 5 },
    { u: 'C', v: 'D', w: 8 },
    { u: 'C', v: 'E', w: 10 },
    { u: 'D', v: 'E', w: 2 },
    { u: 'D', v: 'F', w: 6 },
    { u: 'E', v: 'F', w: 3 },
  ],
};

/**
 * The "negative edge" toggle: a one-way detour A → G → B with G → B = −5.
 * One-way, so it creates no negative cycle; from A it makes B cheaper (2) only after B is settled (3).
 */
export const NEGATIVE_DETOUR: WGraph = {
  nodes: ['G'],
  edges: [
    { u: 'A', v: 'G', w: 7, directed: true },
    { u: 'G', v: 'B', w: -5, directed: true },
  ],
};

export const withDetour = (g: WGraph, on: boolean): WGraph =>
  on ? { nodes: [...g.nodes, ...NEGATIVE_DETOUR.nodes], edges: [...g.edges, ...NEGATIVE_DETOUR.edges] } : g;

export interface Arc {
  to: string;
  w: number;
}

/** Outgoing arcs per node, in edge-list order (two-way edges appear at both ends). */
export function arcs(g: WGraph): Map<string, Arc[]> {
  const out = new Map<string, Arc[]>(g.nodes.map((n) => [n, []]));
  for (const e of g.edges) {
    out.get(e.u)?.push({ to: e.v, w: e.w });
    if (!e.directed) out.get(e.v)?.push({ to: e.u, w: e.w });
  }
  return out;
}

/** ∞ for unreached, a real minus sign for negatives. */
export const fmtDist = (d: number): string =>
  d === Number.POSITIVE_INFINITY ? '∞' : d < 0 ? `−${-d}` : String(d);

export type DStep = 'start' | 'pop' | 'stale' | 'relax' | 'keep' | 'ignored' | 'done';

export interface DState {
  dist: Readonly<Record<string, number>>;
  /** Values each node's distance held before its current one, oldest first. */
  hist: Readonly<Record<string, readonly number[]>>;
  parent: Readonly<Record<string, string | null>>;
  settled: readonly string[];
  /** The priority queue, ascending, with stale entries included (lazy deletion). */
  pq: readonly (readonly [number, string])[];
  current: string | null;
  edge: readonly [string, string] | null;
}

export interface DFrame {
  state: DState;
  step: DStep;
  caption: string;
}

const byPq = (a: readonly [number, string], b: readonly [number, string]) =>
  a[0] - b[0] || (a[1] < b[1] ? -1 : 1);

/** Frames of textbook Dijkstra: pop the minimum, skip stale entries, relax edges to unsettled nodes. */
export function dijkstraFrames(g: WGraph, source: string): DFrame[] {
  if (!g.nodes.includes(source)) throw new Error(`unknown source ${source}`);
  const adj = arcs(g);
  const dist: Record<string, number> = {};
  const hist: Record<string, number[]> = {};
  const parent: Record<string, string | null> = {};
  for (const n of g.nodes) {
    dist[n] = Number.POSITIVE_INFINITY;
    hist[n] = [];
    parent[n] = null;
  }
  dist[source] = 0;
  const settled: string[] = [];
  let pq: [number, string][] = [[0, source]];
  const out: DFrame[] = [];
  const snap = (step: DStep, caption: string, current: string | null, edge: [string, string] | null) =>
    out.push({
      step,
      caption,
      state: {
        dist: { ...dist },
        hist: Object.fromEntries(Object.entries(hist).map(([k, v]) => [k, [...v]])),
        parent: { ...parent },
        settled: [...settled],
        pq: pq.map((e) => [e[0], e[1]] as const),
        current,
        edge,
      },
    });

  snap('start', `dist[${source}] = 0, everyone else ∞; queue holds (0, ${source})`, null, null);
  while (pq.length > 0) {
    const [d, u] = pq.shift() as [number, string];
    if (settled.includes(u)) {
      snap(
        'stale',
        `pop (${fmtDist(d)}, ${u}) is stale: ${u} is already final at ${fmtDist(dist[u] as number)}`,
        u,
        null,
      );
      continue;
    }
    settled.push(u);
    snap('pop', `pop (${fmtDist(d)}, ${u}): it is the smallest, so ${u} is final`, u, null);
    for (const { to, w } of adj.get(u) as Arc[]) {
      const nd = d + w;
      const old = dist[to] as number;
      const sum = `${fmtDist(d)} + ${w < 0 ? `(${fmtDist(w)})` : w} = ${fmtDist(nd)}`;
      if (settled.includes(to)) {
        if (nd < old)
          snap(
            'ignored',
            `${u}→${to}: ${sum} < ${fmtDist(old)}, but ${to} is already final, so it is ignored!`,
            u,
            [u, to],
          );
        continue;
      }
      if (nd < old) {
        (hist[to] as number[]).push(old);
        dist[to] = nd;
        parent[to] = u;
        pq = [...pq, [nd, to] as [number, string]].sort(byPq);
        snap('relax', `${u}→${to}: ${sum} < ${fmtDist(old)} → dist[${to}] = ${fmtDist(nd)}`, u, [u, to]);
      } else {
        snap('keep', `${u}→${to}: ${sum} ≥ ${fmtDist(old)} → keep ${fmtDist(old)}`, u, [u, to]);
      }
    }
  }
  snap('done', `queue empty: ${settled.length} of ${g.nodes.length} nodes settled`, null, null);
  return out;
}

/** Walk parents back from the target. Empty when the target was never reached. */
export function pathTo(
  parent: Readonly<Record<string, string | null>>,
  target: string,
  source: string,
): string[] {
  const path: string[] = [];
  let cur: string | null = target;
  while (cur !== null && path.length <= Object.keys(parent).length) {
    path.unshift(cur);
    if (cur === source) return path;
    cur = parent[cur] ?? null;
  }
  return [];
}

export interface BfResult {
  dist: Record<string, number>;
  parent: Record<string, string | null>;
  negativeCycle: boolean;
}

/** Bellman-Ford: V − 1 rounds of relaxing every arc, then one more round to detect a negative cycle. */
export function bellmanFord(g: WGraph, source: string): BfResult {
  const adj = arcs(g);
  const dist: Record<string, number> = {};
  const parent: Record<string, string | null> = {};
  for (const n of g.nodes) {
    dist[n] = Number.POSITIVE_INFINITY;
    parent[n] = null;
  }
  dist[source] = 0;
  const round = (): boolean => {
    let changed = false;
    for (const [u, list] of adj) {
      const du = dist[u] as number;
      if (du === Number.POSITIVE_INFINITY) continue;
      for (const { to, w } of list) {
        if (du + w < (dist[to] as number)) {
          dist[to] = du + w;
          parent[to] = u;
          changed = true;
        }
      }
    }
    return changed;
  };
  for (let i = 1; i < g.nodes.length; i++) if (!round()) break;
  return { dist, parent, negativeCycle: round() };
}

export interface Mismatch {
  node: string;
  said: number;
  truth: number;
}

/** Where Dijkstra's final answer differs from Bellman-Ford's. */
export function dijkstraMistakes(g: WGraph, source: string): Mismatch[] {
  const last = dijkstraFrames(g, source).at(-1) as DFrame;
  const bf = bellmanFord(g, source);
  return g.nodes
    .filter((n) => last.state.dist[n] !== bf.dist[n])
    .map((n) => ({ node: n, said: last.state.dist[n] as number, truth: bf.dist[n] as number }));
}
