/** Kruskal's minimum spanning tree as frames: sorted edges, union-find pieces, a running total. */

export interface MstEdge {
  u: string;
  v: string;
  w: number;
}

export interface MstGraph {
  nodes: readonly string[];
  edges: readonly MstEdge[];
}

/** The napkin's six towns and nine possible cables. */
export const MST_GRAPH: MstGraph = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    { u: 'A', v: 'B', w: 4 },
    { u: 'A', v: 'D', w: 2 },
    { u: 'A', v: 'E', w: 5 },
    { u: 'B', v: 'E', w: 3 },
    { u: 'B', v: 'C', w: 6 },
    { u: 'C', v: 'E', w: 7 },
    { u: 'C', v: 'F', w: 1 },
    { u: 'E', v: 'F', w: 8 },
    { u: 'D', v: 'E', w: 9 },
  ],
};

export const edgeName = (e: MstEdge): string => `${e.u}–${e.v}`;

/** Edge indices cheapest first; ties keep their original order (a stable sort). */
export const sortedEdges = (g: MstGraph): number[] =>
  g.edges
    .map((e, i) => [e.w, i] as const)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([, i]) => i);

export type Verdict = 'keep' | 'skip';
export type MStep = 'start' | Verdict | 'done';

export interface MState {
  /** Edge index → decision, for the edges considered so far. */
  decided: Readonly<Record<number, Verdict>>;
  /** Node → its piece's representative (the union-find root). */
  piece: Readonly<Record<string, string>>;
  total: number;
  kept: number;
  current: number | null;
}

export interface MFrame {
  state: MState;
  step: MStep;
  caption: string;
}

export function kruskalFrames(g: MstGraph): MFrame[] {
  const parent: Record<string, string> = Object.fromEntries(g.nodes.map((n) => [n, n]));
  const find = (x: string): string => {
    let r = x;
    while (parent[r] !== r) r = parent[r] as string;
    return r;
  };
  const decided: Record<number, Verdict> = {};
  let total = 0;
  let kept = 0;
  const out: MFrame[] = [];
  const snap = (step: MStep, caption: string, current: number | null) =>
    out.push({
      step,
      caption,
      state: {
        decided: { ...decided },
        piece: Object.fromEntries(g.nodes.map((n) => [n, find(n)])),
        total,
        kept,
        current,
      },
    });
  const need = g.nodes.length - 1;
  snap('start', `${g.nodes.length} pieces; sort the ${g.edges.length} edges cheapest first`, null);
  for (const i of sortedEdges(g)) {
    if (kept === need) break;
    const e = g.edges[i] as MstEdge;
    const ru = find(e.u);
    const rv = find(e.v);
    if (ru === rv) {
      decided[i] = 'skip';
      snap('skip', `${edgeName(e)} ${e.w}: ${e.u} and ${e.v} already connected → skip (cycle)`, i);
      continue;
    }
    parent[ru] = rv;
    decided[i] = 'keep';
    total += e.w;
    kept++;
    snap('keep', `${edgeName(e)} ${e.w}: joins two pieces → keep · total ${total}`, i);
  }
  snap(
    'done',
    kept === need
      ? `${kept} edges = V − 1 → spanning tree, total ${total}`
      : `only ${kept} of ${need} edges, so the graph is disconnected (a forest)`,
    null,
  );
  return out;
}

/** Final total and kept edge indices (convenience for comparisons). */
export function mst(g: MstGraph): { total: number; edges: number[] } {
  const last = kruskalFrames(g).at(-1) as MFrame;
  const edges = Object.entries(last.state.decided)
    .filter(([, v]) => v === 'keep')
    .map(([k]) => Number(k));
  return { total: last.state.total, edges: edges.sort((a, b) => a - b) };
}
