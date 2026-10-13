/** Kahn's algorithm as frames: in-degrees, a FIFO queue of ready nodes, and the output order. */

export type Arrow = readonly [string, string];

export interface Dag {
  nodes: readonly string[];
  arrows: readonly Arrow[];
}

/** The napkin's courses: A → B means take A before B. */
export const COURSES: Dag = {
  nodes: ['Intro', 'Math', 'DS', 'Algo', 'DB', 'ML'],
  arrows: [
    ['Intro', 'DS'],
    ['Math', 'DS'],
    ['Math', 'Algo'],
    ['DS', 'Algo'],
    ['DS', 'DB'],
    ['Algo', 'ML'],
    ['DB', 'ML'],
  ],
};

/** Extra rules the user can switch on. ML → DS and Algo → Math close a cycle; DB → Algo does with Algo → Math. */
export const EXTRA_ARROWS: readonly Arrow[] = [
  ['Intro', 'Math'],
  ['DB', 'Algo'],
  ['ML', 'DS'],
  ['Algo', 'Math'],
];

export const arrowKey = (a: Arrow): string => `${a[0]}→${a[1]}`;

export type KStep = 'start' | 'pop' | 'cut' | 'done' | 'stuck';

export interface KState {
  indeg: Readonly<Record<string, number>>;
  queue: readonly string[];
  order: readonly string[];
  /** Arrows already "removed" (their source was output), by arrowKey. */
  cut: readonly string[];
  current: string | null;
  arrow: Arrow | null;
}

export interface KFrame {
  state: KState;
  step: KStep;
  caption: string;
}

export function inDegrees(g: Dag): Record<string, number> {
  const d: Record<string, number> = Object.fromEntries(g.nodes.map((n) => [n, 0]));
  for (const [, v] of g.arrows) d[v] = (d[v] ?? 0) + 1;
  return d;
}

/** Frames of Kahn's algorithm; the last frame is 'done' (all output) or 'stuck' (a cycle remains). */
export function kahnFrames(g: Dag): KFrame[] {
  const indeg = inDegrees(g);
  let queue = g.nodes.filter((n) => indeg[n] === 0);
  const order: string[] = [];
  const cut: string[] = [];
  const out: KFrame[] = [];
  const snap = (step: KStep, caption: string, current: string | null, arrow: Arrow | null) =>
    out.push({
      step,
      caption,
      state: { indeg: { ...indeg }, queue: [...queue], order: [...order], cut: [...cut], current, arrow },
    });

  snap(
    'start',
    queue.length > 0
      ? `in-degree 0: ${queue.join(', ')} → queue`
      : 'no node has in-degree 0, so the queue starts empty',
    null,
    null,
  );
  while (queue.length > 0) {
    const v = queue[0] as string;
    queue = queue.slice(1);
    order.push(v);
    snap('pop', `pop ${v} → output #${order.length}`, v, null);
    for (const a of g.arrows) {
      if (a[0] !== v) continue;
      const w = a[1];
      const before = indeg[w] as number;
      indeg[w] = before - 1;
      cut.push(arrowKey(a));
      const ready = before - 1 === 0;
      if (ready) queue = [...queue, w];
      snap('cut', `${v}→${w}: ${w} ${before}→${before - 1}${ready ? ` → ${w} joins the queue` : ''}`, v, a);
    }
  }
  const left = g.nodes.length - order.length;
  if (left === 0) snap('done', `${order.length} of ${g.nodes.length} output: a valid order`, null, null);
  else
    snap(
      'stuck',
      `queue empty with ${left} left (${g.nodes.filter((n) => !order.includes(n)).join(', ')}): cycle!`,
      null,
      null,
    );
  return out;
}

/** True when every arrow points forward in the order and every node appears once. */
export function isTopoOrder(g: Dag, order: readonly string[]): boolean {
  if (order.length !== g.nodes.length || new Set(order).size !== order.length) return false;
  const pos = new Map(order.map((n, i) => [n, i]));
  return g.arrows.every(([u, v]) => (pos.get(u) ?? Number.POSITIVE_INFINITY) < (pos.get(v) ?? -1));
}

/**
 * A directed cycle among the leftover nodes (each has an incoming arrow from another leftover).
 * Walk incoming arrows backwards until a node repeats. Returns the cycle's arrows in forward order.
 */
export function findCycle(g: Dag, leftovers: readonly string[]): Arrow[] {
  const left = new Set(leftovers);
  const start = leftovers[0];
  if (start === undefined) return [];
  const seen = new Map<string, number>();
  const walk: string[] = [];
  let cur: string | undefined = start;
  while (cur !== undefined && !seen.has(cur)) {
    seen.set(cur, walk.length);
    walk.push(cur);
    const at: string = cur;
    cur = g.arrows.find(([u, v]) => v === at && left.has(u))?.[0];
  }
  if (cur === undefined) return [];
  // walk[i] has an incoming arrow from walk[i + 1]; the loop is walk[seen(cur)..] back to cur.
  const loop = walk.slice(seen.get(cur));
  return loop.map((v, i) => [(loop[i + 1] ?? cur) as string, v] as Arrow).reverse();
}
