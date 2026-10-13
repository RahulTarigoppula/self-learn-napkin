import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { edgeName, kruskalFrames, MST_GRAPH, type MstGraph, mst, sortedEdges } from './kruskal';

const G = MST_GRAPH;
const names = (idx: number[]) => idx.map((i) => edgeName(G.edges[i] as (typeof G.edges)[number]));

/** Brute force: cheapest set of V − 1 edges that connects every node. */
function bruteMst(g: MstGraph): number {
  const n = g.nodes.length;
  let best = Number.POSITIVE_INFINITY;
  const m = g.edges.length;
  for (let mask = 0; mask < 1 << m; mask++) {
    let bits = 0;
    for (let i = 0; i < m; i++) if (mask & (1 << i)) bits++;
    if (bits !== n - 1) continue;
    const p: Record<string, string> = Object.fromEntries(g.nodes.map((x) => [x, x]));
    const find = (x: string): string => (p[x] === x ? x : find(p[x] as string));
    let sum = 0;
    let ok = true;
    for (let i = 0; i < m; i++) {
      if (!(mask & (1 << i))) continue;
      const e = g.edges[i] as MstGraph['edges'][number];
      const a = find(e.u);
      const b = find(e.v);
      if (a === b) ok = false;
      p[a] = b;
      sum += e.w;
    }
    if (ok) best = Math.min(best, sum);
  }
  return best;
}

describe('Kruskal on the napkin graph', () => {
  const fr = kruskalFrames(G);
  const last = fr.at(-1);

  it('sorts C–F 1, A–D 2, B–E 3, A–B 4, A–E 5, B–C 6, …', () => {
    expect(names(sortedEdges(G))).toEqual(['C–F', 'A–D', 'B–E', 'A–B', 'A–E', 'B–C', 'C–E', 'E–F', 'D–E']);
  });

  it('keeps 1, 2, 3, 4, skips A–E 5, keeps B–C 6 and stops: total 16', () => {
    const steps = fr.slice(1, -1).map((f) => `${f.step} ${names([f.state.current as number])[0]}`);
    expect(steps).toEqual(['keep C–F', 'keep A–D', 'keep B–E', 'keep A–B', 'skip A–E', 'keep B–C']);
    expect(last?.state.total).toBe(16);
    expect(last?.state.kept).toBe(5);
    expect(last?.caption).toBe('5 edges = V − 1 → spanning tree, total 16');
    expect(mst(G)).toEqual({ total: 16, edges: [0, 1, 3, 4, 6] });
    expect(bruteMst(G)).toBe(16);
  });

  it('captions and pieces after A–B 4: {A,B,D,E} and {C,F}', () => {
    const ab = fr[4];
    expect(ab?.caption).toBe('A–B 4: joins two pieces → keep · total 10');
    const p = ab?.state.piece ?? {};
    expect(p.A).toBe(p.B);
    expect(p.A).toBe(p.D);
    expect(p.A).toBe(p.E);
    expect(p.C).toBe(p.F);
    expect(p.A).not.toBe(p.C);
    expect(fr[5]?.caption).toBe('A–E 5: A and E already connected → skip (cycle)');
    expect(fr[5]?.state.total).toBe(10);
  });

  it('starts with six separate pieces and nothing decided', () => {
    expect(fr[0]?.caption).toBe('6 pieces; sort the 9 edges cheapest first');
    expect(new Set(Object.values(fr[0]?.state.piece ?? {})).size).toBe(6);
    expect(fr[0]?.state.decided).toEqual({});
  });
});

describe('edited weights', () => {
  const edit = (i: number, w: number): MstGraph => ({
    nodes: G.nodes,
    edges: G.edges.map((e, j) => (j === i ? { ...e, w } : e)),
  });

  it('making A–E cheap (1) swaps it in for A–B: total 13', () => {
    const r = mst(edit(2, 1));
    expect(r.total).toBe(13);
    expect(names(r.edges)).toContain('A–E');
    expect(names(r.edges)).not.toContain('A–B');
  });

  it('ties keep list order', () => {
    expect(sortedEdges(edit(1, 1)).slice(0, 2)).toEqual([1, 6]);
  });

  it('a disconnected graph gives a forest', () => {
    const g: MstGraph = { nodes: ['P', 'Q', 'R'], edges: [{ u: 'P', v: 'Q', w: 3 }] };
    const last = kruskalFrames(g).at(-1);
    expect(last?.caption).toBe('only 1 of 2 edges, so the graph is disconnected (a forest)');
    expect(last?.state.total).toBe(3);
  });

  it('property: total equals brute force for any weights', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 12 }), { minLength: 9, maxLength: 9 }), (ws) => {
        const g: MstGraph = { nodes: G.nodes, edges: G.edges.map((e, i) => ({ ...e, w: ws[i] as number })) };
        const r = mst(g);
        expect(r.edges).toHaveLength(5);
        expect(r.total).toBe(bruteMst(g));
      }),
      { numRuns: 120 },
    );
  });
});
