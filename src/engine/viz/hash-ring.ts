import { fnv1a } from './fnv1a';
import type { TraceEvent } from './types';

export const angle = (s: string): number => (fnv1a(s) / 2 ** 32) * 360;

export interface RingNode {
  id: string;
  angle: number;
  vnode: number;
}
/** Nodes sorted by angle. */
export interface Ring {
  nodes: RingNode[];
}

export function makeRing(servers: readonly string[], vnodes = 1): Ring {
  return {
    nodes: servers
      .flatMap((s) =>
        Array.from({ length: vnodes }, (_, v) => ({
          id: s,
          vnode: v,
          angle: angle(vnodes === 1 ? s : `${s}#${v}`),
        })),
      )
      .sort((a, b) => a.angle - b.angle),
  };
}

/** A ring with hand-placed positions (the griddle lets you drag servers). */
export const ringAt = (positions: Record<string, number>): Ring => ({
  nodes: Object.entries(positions)
    .map(([id, a]) => ({ id, vnode: 0, angle: ((a % 360) + 360) % 360 }))
    .sort((a, b) => a.angle - b.angle),
});

/** The first node clockwise at or after the angle, wrapping around. */
export function ownerAt(ring: Ring, a: number): string {
  const first = ring.nodes[0];
  if (!first) return '';
  return (ring.nodes.find((n) => n.angle >= a) ?? first).id;
}

export const owner = (ring: Ring, keyName: string): string => ownerAt(ring, angle(keyName));

export function owners(ring: Ring, keys: Record<string, number>): Record<string, string> {
  return Object.fromEntries(Object.entries(keys).map(([k, a]) => [k, ownerAt(ring, a)]));
}

/** Which keys change owner between two rings. */
export function moved(before: Ring, after: Ring, keys: Record<string, number>): string[] {
  const a = owners(before, keys);
  const b = owners(after, keys);
  return Object.keys(keys).filter((k) => a[k] !== b[k]);
}

export function* addServer(
  ring: Ring,
  keys: readonly string[],
  server: string,
  vnodes = 1,
): Generator<TraceEvent> {
  const before = Object.fromEntries(keys.map((k) => [k, owner(ring, k)]));
  const after = makeRing([...new Set(ring.nodes.map((n) => n.id)), server], vnodes);
  yield { t: 'caption', text: `add ${server} at ${angle(server).toFixed(0)}°` };
  let n = 0;
  for (const k of keys) {
    const o = owner(after, k);
    if (o !== before[k]) {
      n++;
      yield { t: 'move', key: k, from: before[k] as string, to: o };
    }
  }
  yield { t: 'caption', text: `${n} of ${keys.length} keys moved (≈ K/N)` };
  yield { t: 'done' };
}

/** Share of the circle each server owns (for showing how vnodes even out the arcs). */
export function arcShare(ring: Ring): Record<string, number> {
  const share: Record<string, number> = {};
  const n = ring.nodes.length;
  ring.nodes.forEach((node, i) => {
    const prev = ring.nodes[(i - 1 + n) % n] as RingNode;
    const span = n === 1 ? 360 : (node.angle - prev.angle + 360) % 360;
    share[node.id] = (share[node.id] ?? 0) + span / 360;
  });
  return share;
}
