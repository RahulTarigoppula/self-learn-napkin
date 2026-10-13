/** Disjoint-set forest: parent pointers plus sizes (meaningful only at roots). */
export interface Dsu {
  parent: number[];
  size: number[];
}

export interface UfOptions {
  bySize: boolean;
  compress: boolean;
}

/** One beat of a find / union for the griddle. */
export interface UfFrame extends Dsu {
  /** nodes on the find path being shown, start → root */
  path: number[];
  /** the root-to-root link just made: [child root, new parent] */
  link: [number, number] | null;
  /** pointer hops so far in this operation */
  hops: number;
  verdict: 'joined' | 'cycle' | 'separate' | 'found' | null;
  caption: string;
}

export const dsuInit = (n: number): Dsu => ({
  parent: Array.from({ length: n }, (_, i) => i),
  size: Array.from({ length: n }, () => 1),
});

/** The path from x up to its root (no mutation). */
export function pathToRoot(d: Dsu, x: number): number[] {
  const path = [x];
  let cur = x;
  while (d.parent[cur] !== cur) {
    cur = d.parent[cur] as number;
    path.push(cur);
  }
  return path;
}

export const rootOf = (d: Dsu, x: number): number => pathToRoot(d, x).at(-1) as number;

export function setCount(d: Dsu): number {
  return d.parent.filter((p, i) => p === i).length;
}

/** Depth of x (root = 0). */
export const depthOf = (d: Dsu, x: number): number => pathToRoot(d, x).length - 1;

/** The tallest tree, in edges. */
export function maxDepth(d: Dsu): number {
  return d.parent.reduce((m, _, i) => Math.max(m, depthOf(d, i)), 0);
}

const clone = (d: Dsu): Dsu => ({ parent: [...d.parent], size: [...d.size] });

class Rec {
  out: UfFrame[] = [];
  hops = 0;
  constructor(public d: Dsu) {}
  push(f: Partial<UfFrame> & { caption: string }) {
    this.out.push({ ...clone(this.d), path: [], link: null, hops: this.hops, verdict: null, ...f });
  }
  /** find with optional compression: a frame for the climb and one for the repointing. */
  find(x: number, compress: boolean): number {
    const path = pathToRoot(this.d, x);
    const root = path.at(-1) as number;
    this.hops += path.length - 1;
    this.push({
      path,
      caption:
        path.length === 1
          ? `find(${x}): ${x} is a root`
          : `find(${x}): ${path.join(' → ')} (${path.length - 1} hop${path.length === 2 ? '' : 's'})`,
    });
    const far = path.slice(0, -2); // nodes not already pointing at the root
    if (compress && far.length > 0) {
      for (const v of far) this.d.parent[v] = root;
      this.push({
        path: [...far, root],
        caption: `compress: ${far.join(', ')} now point${far.length === 1 ? 's' : ''} straight at ${root}`,
      });
    }
    return root;
  }
}

/** find(x) as frames. Returns the frames and the new forest (compressed if asked). */
export function findFrames(d: Dsu, x: number, opts: UfOptions): { frames: UfFrame[]; dsu: Dsu } {
  const rec = new Rec(clone(d));
  const root = rec.find(x, opts.compress);
  rec.push({ path: [root], verdict: 'found', caption: `find(${x}) = ${root}: the root names the set` });
  return { frames: rec.out, dsu: rec.d };
}

/** union(a, b) as frames. Same root → no change and a "would close a cycle" verdict. */
export function unionFrames(d: Dsu, a: number, b: number, opts: UfOptions): { frames: UfFrame[]; dsu: Dsu } {
  const rec = new Rec(clone(d));
  const ra = rec.find(a, opts.compress);
  const rb = rec.find(b, opts.compress);
  if (ra === rb) {
    rec.push({
      path: [ra],
      verdict: 'cycle',
      caption: `same root ${ra}: already connected, edge ${a}–${b} would close a cycle`,
    });
    return { frames: rec.out, dsu: rec.d };
  }
  const { parent, size } = rec.d;
  let big = ra;
  let small = rb;
  if (opts.bySize && (size[ra] as number) < (size[rb] as number)) [big, small] = [rb, ra];
  const sb = size[big] as number;
  const ss = size[small] as number;
  parent[small] = big;
  size[big] = sb + ss;
  rec.push({
    link: [small, big],
    verdict: 'joined',
    caption: opts.bySize
      ? `sizes ${sb} vs ${ss}: ${sb === ss ? 'tie, second' : 'smaller'} under ${sb === ss ? 'first' : 'bigger'} → parent[${small}] = ${big}`
      : `link second root under first → parent[${small}] = ${big}`,
  });
  return { frames: rec.out, dsu: rec.d };
}

/** "Would edge a–b close a cycle?": two finds, no union. */
export function sameSetFrames(
  d: Dsu,
  a: number,
  b: number,
  opts: UfOptions,
): { frames: UfFrame[]; dsu: Dsu } {
  const rec = new Rec(clone(d));
  const ra = rec.find(a, opts.compress);
  const rb = rec.find(b, opts.compress);
  rec.push(
    ra === rb
      ? { path: [ra], verdict: 'cycle', caption: `same root ${ra}: edge ${a}–${b} would close a cycle` }
      : {
          path: [ra, rb],
          verdict: 'separate',
          caption: `roots ${ra} ≠ ${rb}: edge ${a}–${b} is safe, no cycle`,
        },
  );
  return { frames: rec.out, dsu: rec.d };
}

export type UfOp = { op: 'union'; a: number; b: number } | { op: 'find'; x: number };

/** The lesson's script: three pairs, two merges, a compressing find, then a cycle check. */
export const UF_LESSON: UfOp[] = [
  { op: 'union', a: 0, b: 1 },
  { op: 'union', a: 2, b: 3 },
  { op: 'union', a: 4, b: 5 },
  { op: 'union', a: 1, b: 3 },
  { op: 'union', a: 4, b: 1 },
  { op: 'find', x: 3 },
  { op: 'union', a: 1, b: 3 },
];

/** union(i+1, i) for every i: without union by size this builds one long chain. */
export const ufChain = (n: number): UfOp[] =>
  Array.from({ length: n - 1 }, (_, i) => ({ op: 'union', a: i + 1, b: i }));

/** Run a script, concatenating frames; hops accumulate across the whole script. */
export function scriptFrames(d: Dsu, ops: readonly UfOp[], opts: UfOptions): { frames: UfFrame[]; dsu: Dsu } {
  let cur = d;
  let base = 0;
  const frames: UfFrame[] = [];
  for (const o of ops) {
    const r = o.op === 'union' ? unionFrames(cur, o.a, o.b, opts) : findFrames(cur, o.x, opts);
    for (const f of r.frames) frames.push({ ...f, hops: f.hops + base });
    base += r.frames.at(-1)?.hops ?? 0;
    cur = r.dsu;
  }
  return { frames, dsu: cur };
}

export interface Placed {
  id: number;
  x: number;
  y: number;
}

/** Lay the forest out: roots left to right by id, children by id, one column per leaf. */
export function forestLayout(d: Dsu): { nodes: Placed[]; cols: number; rows: number } {
  const n = d.parent.length;
  const kids: number[][] = Array.from({ length: n }, () => []);
  d.parent.forEach((p, i) => {
    if (p !== i) kids[p]?.push(i);
  });
  const nodes: Placed[] = [];
  let col = 0;
  let rows = 0;
  const place = (v: number, depth: number): number => {
    rows = Math.max(rows, depth + 1);
    const ch = kids[v] as number[];
    let x: number;
    if (ch.length === 0) x = col++;
    else {
      const xs = ch.map((c) => place(c, depth + 1));
      x = ((xs[0] as number) + (xs.at(-1) as number)) / 2;
    }
    nodes.push({ id: v, x, y: depth });
    return x;
  };
  d.parent.forEach((p, i) => {
    if (p === i) place(i, 0);
  });
  nodes.sort((p, q) => p.id - q.id);
  return { nodes, cols: col, rows };
}
