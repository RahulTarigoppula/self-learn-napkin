import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  dsuInit,
  findFrames,
  forestLayout,
  maxDepth,
  pathToRoot,
  rootOf,
  sameSetFrames,
  scriptFrames,
  setCount,
  UF_LESSON,
  type UfOp,
  ufChain,
  unionFrames,
} from './union-find';

const BEST = { bySize: true, compress: true };
const NAIVE = { bySize: false, compress: false };

describe('union-find lesson trace', () => {
  it('reproduces every parent[] row of the worked example', () => {
    let d = dsuInit(6);
    const rows: number[][] = [];
    for (const op of UF_LESSON) {
      d = scriptFrames(d, [op], BEST).dsu;
      rows.push([...d.parent]);
    }
    expect(rows[2]).toEqual([0, 0, 2, 2, 4, 4]);
    expect(rows[3]).toEqual([0, 0, 0, 2, 4, 4]);
    expect(rows[4]).toEqual([0, 0, 0, 2, 0, 4]);
    expect(rows[5]).toEqual([0, 0, 0, 0, 0, 4]);
    expect(rows[6]).toEqual([0, 0, 0, 0, 0, 4]);
    expect(setCount(d)).toBe(1);
    expect(d.size[0]).toBe(6);
  });
  it('union(4,1) hangs the smaller root under the bigger', () => {
    const d = scriptFrames(dsuInit(6), UF_LESSON.slice(0, 4), BEST).dsu;
    const r = unionFrames(d, 4, 1, BEST);
    expect(r.frames.at(-1)?.link).toEqual([4, 0]);
    expect(r.frames.at(-1)?.caption).toBe('sizes 4 vs 2: smaller under bigger → parent[4] = 0');
    expect(r.frames.at(-1)?.verdict).toBe('joined');
    // without union by size, the second root goes under the first
    const n = unionFrames(d, 4, 1, { bySize: false, compress: true });
    expect(n.frames.at(-1)?.link).toEqual([0, 4]);
    expect(n.frames.at(-1)?.caption).toBe('link second root under first → parent[0] = 4');
  });
  it('tie caption', () => {
    expect(unionFrames(dsuInit(2), 0, 1, BEST).frames.at(-1)?.caption).toBe(
      'sizes 1 vs 1: tie, second under first → parent[1] = 0',
    );
  });
  it('find(3) climbs 3 → 2 → 0 and compresses', () => {
    const d = scriptFrames(dsuInit(6), UF_LESSON.slice(0, 5), BEST).dsu;
    const r = findFrames(d, 3, BEST);
    expect(r.frames.map((f) => f.caption)).toEqual([
      'find(3): 3 → 2 → 0 (2 hops)',
      'compress: 3 now points straight at 0',
      'find(3) = 0: the root names the set',
    ]);
    expect(r.frames[0]?.path).toEqual([3, 2, 0]);
    expect(r.frames.at(-1)?.hops).toBe(2);
    expect(r.frames.at(-1)?.verdict).toBe('found');
    expect(r.dsu.parent[3]).toBe(0);
    // the input is not mutated
    expect(d.parent[3]).toBe(2);
    // without compression the pointer stays
    expect(findFrames(d, 3, NAIVE).dsu.parent[3]).toBe(2);
  });
  it('a repeated union is a cycle', () => {
    const r = scriptFrames(dsuInit(6), UF_LESSON, BEST);
    const last = r.frames.at(-1);
    expect(last?.verdict).toBe('cycle');
    expect(last?.caption).toBe('same root 0: already connected, edge 1–3 would close a cycle');
    expect(last?.link).toBeNull();
  });
  it('captions for roots and single hops', () => {
    const d = dsuInit(3);
    expect(findFrames(d, 1, BEST).frames[0]?.caption).toBe('find(1): 1 is a root');
    const j = unionFrames(d, 0, 1, BEST).dsu;
    expect(findFrames(j, 1, BEST).frames[0]?.caption).toBe('find(1): 1 → 0 (1 hop)');
  });
});

describe('sameSetFrames', () => {
  it('reports cycle or separate without merging', () => {
    const d = scriptFrames(dsuInit(6), UF_LESSON.slice(0, 3), BEST).dsu; // {0,1} {2,3} {4,5}
    const sep = sameSetFrames(d, 1, 3, BEST);
    expect(sep.frames.at(-1)?.verdict).toBe('separate');
    expect(sep.frames.at(-1)?.caption).toBe('roots 0 ≠ 2: edge 1–3 is safe, no cycle');
    expect(sep.frames.at(-1)?.path).toEqual([0, 2]);
    expect(setCount(sep.dsu)).toBe(3);
    const cyc = sameSetFrames(d, 0, 1, BEST);
    expect(cyc.frames.at(-1)?.verdict).toBe('cycle');
    expect(cyc.frames.at(-1)?.caption).toBe('same root 0: edge 0–1 would close a cycle');
    expect(cyc.frames.at(-1)?.hops).toBe(1);
  });
});

describe('chain: why both tricks matter', () => {
  it('naive unions build a chain of height n−1; find(0) costs n−1 hops', () => {
    const r = scriptFrames(dsuInit(8), ufChain(8), NAIVE);
    expect(maxDepth(r.dsu)).toBe(7);
    expect(pathToRoot(r.dsu, 0)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    const f = findFrames(r.dsu, 0, NAIVE);
    expect(f.frames.at(-1)?.hops).toBe(7);
    // compression flattens it in one go
    const c = findFrames(r.dsu, 0, BEST);
    expect(maxDepth(c.dsu)).toBe(1);
    expect(findFrames(c.dsu, 0, BEST).frames.at(-1)?.hops).toBe(1);
  });
  it('union by size keeps the same script flat', () => {
    const r = scriptFrames(dsuInit(8), ufChain(8), { bySize: true, compress: false });
    expect(maxDepth(r.dsu)).toBe(1);
    expect(r.frames.at(-1)?.hops).toBe(5);
  });
  it('script hops accumulate', () => {
    // lesson: 0+0+0 + (1+1) + (0+1) + 2 + (1+1) = 7 hops in total
    const r = scriptFrames(dsuInit(6), UF_LESSON, BEST);
    expect(r.frames.at(-1)?.hops).toBe(7);
    // naive chain: every find starts at a root, so building it is free
    expect(scriptFrames(dsuInit(8), ufChain(8), NAIVE).frames.at(-1)?.hops).toBe(0);
  });
});

describe('invariants (property)', () => {
  const opArb = fc.oneof(
    fc.record({ op: fc.constant('union' as const), a: fc.nat(7), b: fc.nat(7) }),
    fc.record({ op: fc.constant('find' as const), x: fc.nat(7) }),
  );
  it('roots agree with a naive component labelling; by-size height ≤ log2 n', () => {
    fc.assert(
      fc.property(fc.array(opArb, { maxLength: 20 }), fc.boolean(), fc.boolean(), (ops, bySize, compress) => {
        const r = scriptFrames(dsuInit(8), ops as UfOp[], { bySize, compress });
        for (const f of r.frames) expect(f.parent).toHaveLength(8);
        const label = Array.from({ length: 8 }, (_, i) => i);
        for (const o of ops)
          if (o.op === 'union') {
            const from = label[o.a];
            const to = label[o.b];
            for (let i = 0; i < 8; i++) if (label[i] === from) label[i] = to as number;
          }
        for (let i = 0; i < 8; i++)
          for (let j = 0; j < 8; j++)
            expect(rootOf(r.dsu, i) === rootOf(r.dsu, j)).toBe(label[i] === label[j]);
        expect(setCount(r.dsu)).toBe(new Set(label).size);
        if (bySize) expect(maxDepth(r.dsu)).toBeLessThanOrEqual(3);
        const roots = r.dsu.parent.filter((p, i) => p === i);
        expect(roots.reduce((s, x) => s + (r.dsu.size[x] as number), 0)).toBe(8);
      }),
    );
  });
});

describe('forestLayout', () => {
  it('singletons sit in one row', () => {
    const l = forestLayout(dsuInit(4));
    expect(l.cols).toBe(4);
    expect(l.rows).toBe(1);
    expect(l.nodes.map((p) => [p.id, p.x, p.y])).toEqual([
      [0, 0, 0],
      [1, 1, 0],
      [2, 2, 0],
      [3, 3, 0],
    ]);
  });
  it('parents centre over their children', () => {
    const d = scriptFrames(dsuInit(6), UF_LESSON.slice(0, 4), BEST).dsu; // [0,0,0,2,4,4]
    const l = forestLayout(d);
    expect(l.rows).toBe(3);
    const at = (id: number) => l.nodes.find((p) => p.id === id);
    expect(at(1)).toEqual({ id: 1, x: 0, y: 1 });
    expect(at(3)).toEqual({ id: 3, x: 1, y: 2 });
    expect(at(2)).toEqual({ id: 2, x: 1, y: 1 });
    expect(at(0)?.x).toBe(0.5);
    expect(at(5)).toEqual({ id: 5, x: 2, y: 1 });
    expect(at(4)).toEqual({ id: 4, x: 2, y: 0 });
    expect(l.cols).toBe(3);
  });
});
