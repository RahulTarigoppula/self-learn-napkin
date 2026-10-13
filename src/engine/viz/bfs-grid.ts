import type { Tracer } from './types';

export type Cell = [number, number];

export interface BfsParams {
  grid: string[];
  start: Cell;
  goal: Cell;
  mode?: 'bfs' | 'dfs';
}

export interface BfsState {
  grid: readonly string[];
  visited: ReadonlySet<string>;
  frontier: ReadonlySet<string>;
  current: string | null;
  path: readonly string[];
  order: ReadonlyMap<string, number>;
}

export const key = (r: number, c: number): string => `${r},${c}`;
/** Neighbour order: up, down, left, right. Coordinates are (row, col). */
const DIRS: Cell[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export const DEFAULT_GRID = ['..#..', '.##..', '.....', '#.##.', '.....'];

export const bfsGrid: Tracer<BfsParams, BfsState> = {
  id: 'bfs-grid',
  title: 'BFS on a grid',
  defaults: { grid: DEFAULT_GRID, start: [0, 0], goal: [4, 4], mode: 'bfs' },
  init: (p) => ({
    grid: p.grid,
    visited: new Set(),
    frontier: new Set([key(...p.start)]),
    current: null,
    path: [],
    order: new Map(),
  }),
  *run(p) {
    const rows = p.grid.length;
    const cols = (p.grid[0] ?? '').length;
    const open = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols && p.grid[r]?.[c] !== '#';
    const parent = new Map<string, string | null>([[key(...p.start), null]]);
    const box: Cell[] = [p.start];
    const dfs = p.mode === 'dfs';
    const seen = new Set<string>();
    while (box.length > 0) {
      const [r, c] = (dfs ? box.pop() : box.shift()) as Cell;
      if (dfs) {
        if (seen.has(key(r, c))) continue;
        seen.add(key(r, c));
      }
      yield { t: 'visit', r, c };
      if (r === p.goal[0] && c === p.goal[1]) {
        const cells: Cell[] = [];
        let k: string | null | undefined = key(r, c);
        while (k) {
          const [pr, pc] = k.split(',').map(Number) as Cell;
          cells.unshift([pr, pc]);
          k = parent.get(k);
        }
        yield { t: 'path', cells };
        yield { t: 'caption', text: `goal reached in ${cells.length - 1} edges` };
        yield { t: 'done' };
        return;
      }
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!open(nr, nc)) continue;
        if (dfs) {
          if (seen.has(key(nr, nc))) continue;
          parent.set(key(nr, nc), key(r, c));
        } else {
          if (parent.has(key(nr, nc))) continue; // mark when you enqueue, not when you dequeue
          parent.set(key(nr, nc), key(r, c));
        }
        box.push([nr, nc]);
        yield { t: 'enqueue', r: nr, c: nc };
      }
    }
    yield { t: 'caption', text: 'goal unreachable' };
    yield { t: 'done' };
  },
  apply(s, e) {
    switch (e.t) {
      case 'visit': {
        const k = key(e.r, e.c);
        const frontier = new Set(s.frontier);
        frontier.delete(k);
        const order = new Map(s.order);
        if (!order.has(k)) order.set(k, order.size);
        return { ...s, current: k, visited: new Set([...s.visited, k]), frontier, order };
      }
      case 'enqueue':
        return { ...s, frontier: new Set([...s.frontier, key(e.r, e.c)]) };
      case 'path':
        return { ...s, path: e.cells.map(([r, c]) => key(r, c)) };
      default:
        return s;
    }
  },
};
