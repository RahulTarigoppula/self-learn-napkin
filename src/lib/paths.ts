/** Curated learning paths: an ordered walk through napkins for a goal. Missing ids are skipped. */
export interface LearningPath {
  id: string;
  title: string;
  blurb: string;
  icon: 'target' | 'layers' | 'sparkles' | 'flame';
  ids: string[];
}

export const PATHS: LearningPath[] = [
  {
    id: 'dsa-essentials',
    title: 'Coding interview essentials',
    blurb: 'The patterns behind most coding rounds, in the order they build on each other.',
    icon: 'target',
    ids: [
      'dsa/big-o-basics',
      'dsa/arrays-and-pointers',
      'dsa/two-pointers',
      'dsa/sliding-window',
      'dsa/hash-tables',
      'dsa/binary-search',
      'dsa/stacks',
      'dsa/linked-lists',
      'dsa/trees-and-traversals',
      'dsa/heaps',
      'dsa/bfs-and-dfs',
      'dsa/dynamic-programming',
      'dsa/backtracking',
    ],
  },
  {
    id: 'system-design-kit',
    title: 'System design interview kit',
    blurb: 'Estimate, scale, cache, partition, replicate — then put it together in real designs.',
    icon: 'layers',
    ids: [
      'sysdesign/back-of-envelope',
      'sysdesign/client-server-basics',
      'sysdesign/load-balancing',
      'sysdesign/caching',
      'sysdesign/sharding',
      'sysdesign/consistent-hashing',
      'sysdesign/replication',
      'sysdesign/cap-theorem',
      'sysdesign/message-queues',
      'sysdesign/rate-limiting',
      'sysdesign/design-url-shortener',
      'sysdesign/design-news-feed',
    ],
  },
  {
    id: 'ml-foundations',
    title: 'Machine learning foundations',
    blurb: 'From framing a problem to evaluating a model honestly — the core every DS interview checks.',
    icon: 'sparkles',
    ids: [
      'ds/ml-problem-framing',
      'ds/train-val-test',
      'ds/bias-variance',
      'ds/linear-regression',
      'ds/logistic-regression',
      'ds/gradient-descent',
      'ds/regularisation',
      'ds/decision-trees',
      'ds/precision-recall-roc',
      'ds/cross-validation',
    ],
  },
  {
    id: 'distributed-data',
    title: 'Distributed data, demystified',
    blurb:
      'How data stays correct across many machines: replication, quorums, consensus and their trade-offs.',
    icon: 'flame',
    ids: [
      'sysdesign/replication',
      'sysdesign/consistency-models',
      'sysdesign/cap-theorem',
      'sysdesign/quorum-n-r-w',
      'sysdesign/read-repair',
      'sysdesign/raft-leader-election',
      'sysdesign/two-phase-commit-vs-sagas',
      'sysdesign/geo-replication',
    ],
  },
];
