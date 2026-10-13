import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  arcs,
  bellmanFord,
  DIJKSTRA_GRAPH,
  dijkstraFrames,
  dijkstraMistakes,
  fmtDist,
  pathTo,
  type WGraph,
  withDetour,
} from './dijkstra';

const INF = Number.POSITIVE_INFINITY;
const G = DIJKSTRA_GRAPH;

describe('dijkstra frames on the napkin graph', () => {
  const fr = dijkstraFrames(G, 'A');
  const last = fr.at(-1);

  it('final distances and path match the worked example', () => {
    expect(last?.step).toBe('done');
    expect(last?.state.dist).toEqual({ A: 0, B: 3, C: 1, D: 8, E: 10, F: 13 });
    expect(pathTo(last?.state.parent ?? {}, 'F', 'A')).toEqual(['A', 'C', 'B', 'D', 'E', 'F']);
    expect(last?.state.settled).toEqual(['A', 'C', 'B', 'D', 'E', 'F']);
    expect(last?.state.pq).toEqual([]);
  });

  it('starts with only the source in the queue', () => {
    expect(fr[0]?.step).toBe('start');
    expect(fr[0]?.state.pq).toEqual([[0, 'A']]);
    expect(fr[0]?.state.dist.B).toBe(INF);
  });

  it('pop A then relax B = 4 and C = 1, queue sorted', () => {
    expect(fr[1]?.caption).toBe('pop (0, A): it is the smallest, so A is final');
    expect(fr[2]?.caption).toBe('A→B: 0 + 4 = 4 < ∞ → dist[B] = 4');
    expect(fr[3]?.state.pq).toEqual([
      [1, 'C'],
      [4, 'B'],
    ]);
    expect(fr[3]?.state.edge).toEqual(['A', 'C']);
  });

  it('records old values for strike-through (B: ∞ then 4)', () => {
    expect(last?.state.hist.B).toEqual([INF, 4]);
    expect(last?.state.hist.D).toEqual([INF, 9]);
    expect(last?.state.hist.F).toEqual([INF, 14]);
    expect(last?.state.hist.A).toEqual([]);
  });

  it('skips the stale entries (4,B) (9,D) (11,E) (14,F)', () => {
    const stale = fr.filter((f) => f.step === 'stale').map((f) => f.caption.split(' is stale')[0]);
    expect(stale).toEqual(['pop (4, B)', 'pop (9, D)', 'pop (11, E)', 'pop (14, F)']);
  });

  it('every relaxation on this graph improves something (no keeps), 9 relaxes in all', () => {
    expect(fr.filter((f) => f.step === 'keep')).toEqual([]);
    expect(fr.filter((f) => f.step === 'relax')).toHaveLength(9);
  });

  it('logs a keep when the new route is no better', () => {
    const g: WGraph = {
      nodes: ['S', 'T', 'U'],
      edges: [
        { u: 'S', v: 'T', w: 1 },
        { u: 'S', v: 'U', w: 2 },
        { u: 'T', v: 'U', w: 5 },
      ],
    };
    const keep = dijkstraFrames(g, 'S').find((f) => f.step === 'keep');
    expect(keep?.caption).toBe('T→U: 1 + 5 = 6 ≥ 2 → keep 2');
    expect(keep?.state.edge).toEqual(['T', 'U']);
  });

  it('is correct with no negative edges: no mistakes from any source', () => {
    for (const s of G.nodes) expect(dijkstraMistakes(G, s)).toEqual([]);
  });

  it('throws on an unknown source', () => {
    expect(() => dijkstraFrames(G, 'Z')).toThrow('unknown source Z');
  });
});

describe('negative detour', () => {
  const N = withDetour(G, true);

  it('adds G and two one-way edges', () => {
    expect(N.nodes).toContain('G');
    expect(withDetour(G, false)).toBe(G);
    expect(
      arcs(N)
        .get('B')
        ?.some((a) => a.to === 'G'),
    ).toBe(false);
    expect(arcs(N).get('G')).toEqual([{ to: 'B', w: -5 }]);
  });

  it('Dijkstra from A is fooled: B settled at 3, but A→G→B costs 2', () => {
    const fr = dijkstraFrames(N, 'A');
    const bad = fr.find((f) => f.step === 'ignored');
    expect(bad?.caption).toBe('G→B: 7 + (−5) = 2 < 3, but B is already final, so it is ignored!');
    expect(fr.at(-1)?.state.dist).toMatchObject({ B: 3, D: 8, E: 10, F: 13, G: 7 });
    const bf = bellmanFord(N, 'A');
    expect(bf.negativeCycle).toBe(false);
    expect(bf.dist).toEqual({ A: 0, B: 2, C: 1, D: 7, E: 9, F: 12, G: 7 });
    expect(pathTo(bf.parent, 'F', 'A')).toEqual(['A', 'G', 'B', 'D', 'E', 'F']);
    expect(dijkstraMistakes(N, 'A')).toEqual([
      { node: 'B', said: 3, truth: 2 },
      { node: 'D', said: 8, truth: 7 },
      { node: 'E', said: 10, truth: 9 },
      { node: 'F', said: 13, truth: 12 },
    ]);
  });

  it('from F the detour is unreachable in time, so Dijkstra survives', () => {
    expect(dijkstraMistakes(N, 'F')).toEqual([]);
  });

  it('from G the negative edge leaves the source, which is safe', () => {
    expect(dijkstraMistakes(N, 'G')).toEqual([]);
    expect(dijkstraFrames(N, 'G').at(-1)?.state.dist.B).toBe(-5);
  });
});

describe('helpers', () => {
  it('fmtDist', () => {
    expect(fmtDist(INF)).toBe('∞');
    expect(fmtDist(-5)).toBe('−5');
    expect(fmtDist(0)).toBe('0');
    expect(fmtDist(13)).toBe('13');
  });

  it('unreachable nodes stay ∞ and have no path', () => {
    const g: WGraph = { nodes: ['S', 'T', 'U'], edges: [{ u: 'S', v: 'T', w: 2 }] };
    const last = dijkstraFrames(g, 'S').at(-1);
    expect(last?.state.dist.U).toBe(INF);
    expect(last?.caption).toBe('queue empty: 2 of 3 nodes settled');
    expect(pathTo(last?.state.parent ?? {}, 'U', 'S')).toEqual([]);
    expect(pathTo(last?.state.parent ?? {}, 'S', 'S')).toEqual(['S']);
    expect(bellmanFord(g, 'S').dist.U).toBe(INF);
  });

  it('pathTo gives up on a parent cycle', () => {
    expect(pathTo({ X: 'Y', Y: 'X', S: null }, 'X', 'S')).toEqual([]);
  });

  it('the napkin S/X/Y example: Dijkstra says X = 2, truth is 1', () => {
    const g: WGraph = {
      nodes: ['S', 'X', 'Y'],
      edges: [
        { u: 'S', v: 'X', w: 2, directed: true },
        { u: 'S', v: 'Y', w: 3, directed: true },
        { u: 'Y', v: 'X', w: -2, directed: true },
      ],
    };
    expect(dijkstraMistakes(g, 'S')).toEqual([{ node: 'X', said: 2, truth: 1 }]);
  });

  it('Bellman-Ford flags a negative cycle (an undirected negative edge is one)', () => {
    const g: WGraph = { nodes: ['P', 'Q'], edges: [{ u: 'P', v: 'Q', w: -1 }] };
    expect(bellmanFord(g, 'P').negativeCycle).toBe(true);
  });

  it('property: with non-negative weights Dijkstra equals Bellman-Ford', () => {
    const names = ['A', 'B', 'C', 'D', 'E'];
    const edge = fc.record({
      u: fc.constantFrom(...names),
      v: fc.constantFrom(...names),
      w: fc.integer({ min: 0, max: 9 }),
      directed: fc.boolean(),
    });
    fc.assert(
      fc.property(fc.array(edge, { maxLength: 12 }), fc.constantFrom(...names), (edges, s) => {
        const g: WGraph = { nodes: names, edges };
        expect(dijkstraMistakes(g, s)).toEqual([]);
        const last = dijkstraFrames(g, s).at(-1);
        for (const f of dijkstraFrames(g, s))
          for (let i = 1; i < f.state.pq.length; i++)
            expect((f.state.pq[i - 1]?.[0] ?? 0) <= (f.state.pq[i]?.[0] ?? 0)).toBe(true);
        for (const n of names) {
          const p = pathTo(last?.state.parent ?? {}, n, s);
          expect(p.length > 0).toBe(last?.state.dist[n] !== INF);
        }
      }),
      { numRuns: 200 },
    );
  });
});
