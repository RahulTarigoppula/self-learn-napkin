import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';

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
};

export default function Griddle({ kind }: { kind: string }) {
  const [Comp, setComp] = useState<Kind | null>(null);
  const [failed, setFailed] = useState(false);
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
  if (failed)
    return (
      <div class="gd gd--empty">
        <p>This playground tore. Reload the page to try again.</p>
      </div>
    );
  if (!Comp)
    return (
      <div class="gd gd--empty" aria-busy="true">
        <p>Setting up the playground…</p>
      </div>
    );
  return <Comp kind={kind} />;
}
