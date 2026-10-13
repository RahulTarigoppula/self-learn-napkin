import type { ComponentType } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { recordPlayed } from '../game/store';

/** Each playground is its own chunk, loaded only when its napkin scrolls into view. */
type Kind = ComponentType<{ kind: string }>;
const LOADERS: Record<string, () => Promise<{ default: Kind }>> = {
  'bubble-sort': () => import('./kinds/SortGriddle'),
  'insertion-sort': () => import('./kinds/SortGriddle'),
  'merge-sort': () => import('./kinds/SortGriddle'),
  bst: () => import('./kinds/BstGriddle'),
  'k-means': () => import('./kinds/KMeansGriddle'),
  'bloom-filter': () => import('./kinds/BloomGriddle'),
  'linear-fit': () => import('./kinds/LinearFitGriddle'),
  'binary-search': () => import('./kinds/BinarySearchGriddle'),
  'bfs-grid': () => import('./kinds/GridGriddle'),
  'hash-chaining': () => import('./kinds/ChainingGriddle'),
  'hash-ring': () => import('./kinds/RingGriddle'),
  quorum: () => import('./kinds/QuorumGriddle'),
  'token-bucket': () => import('./kinds/BucketGriddle'),
  'lru-cache': () => import('./kinds/LruGriddle'),
  'gradient-descent': () => import('./kinds/DescentGriddle'),
  threshold: () => import('./kinds/ThresholdGriddle'),
  quicksort: () => import('./kinds/QuickSortGriddle'),
  'two-pointers': () => import('./kinds/TwoPointersGriddle'),
  'sliding-window': () => import('./kinds/SlidingWindowGriddle'),
  'monotonic-stack': () => import('./kinds/MonoStackGriddle'),
  heap: () => import('./kinds/HeapGriddle'),
  'union-find': () => import('./kinds/UnionFindGriddle'),
  lcs: () => import('./kinds/StringDpGriddle'),
  'edit-distance': () => import('./kinds/StringDpGriddle'),
  knapsack: () => import('./kinds/KnapsackGriddle'),
  dijkstra: () => import('./kinds/DijkstraGriddle'),
  'topological-sort': () => import('./kinds/TopoSortGriddle'),
  mst: () => import('./kinds/MstGriddle'),
  'load-balancer': () => import('./kinds/LoadBalancerGriddle'),
  'circuit-breaker': () => import('./kinds/CircuitBreakerGriddle'),
  attention: () => import('./kinds/AttentionGriddle'),
};

export default function Griddle({ kind }: { kind: string }) {
  const [Comp, setComp] = useState<Kind | null>(null);
  const [failed, setFailed] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  // The first real interaction counts this playground as "tried" (XP + achievements).
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const once = () => {
      el.removeEventListener('pointerdown', once, true);
      el.removeEventListener('keydown', once, true);
      void recordPlayed(kind).catch(() => undefined);
    };
    el.addEventListener('pointerdown', once, true);
    el.addEventListener('keydown', once, true);
    return () => {
      el.removeEventListener('pointerdown', once, true);
      el.removeEventListener('keydown', once, true);
    };
  }, [kind]);
  useEffect(() => {
    const load = LOADERS[kind];
    if (!load) {
      setFailed(true);
      return;
    }
    load()
      .then((m) => setComp(() => m.default))
      .catch((e: unknown) => {
        console.error('griddle failed to load', e);
        setFailed(true);
      });
  }, [kind]);
  return (
    <div ref={wrap} class="gd-wrap">
      {failed ? (
        <div class="gd gd--empty">
          <p>This playground tore. Reload the page to try again.</p>
        </div>
      ) : Comp ? (
        <Comp kind={kind} />
      ) : (
        <div class="gd gd--empty" aria-busy="true">
          <p>Setting up the playground…</p>
        </div>
      )}
    </div>
  );
}
