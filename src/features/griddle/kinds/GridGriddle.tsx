import { useMemo, useState } from 'preact/hooks';
import { type BfsState, bfsGrid, key } from '../../../engine/viz/bfs-grid';
import { type Frame, frames } from '../../../engine/viz/types';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, usePlayer } from '../player';

const START: [number, number] = [0, 0];
const INITIAL = ['...#...', '.#.#.#.', '.#...#.', '.####..', '...#...', '.#...#.', '...#...'];

export default function GridGriddle() {
  const [grid, setGrid] = useState<string[]>(INITIAL);
  const [mode, setMode] = useState<'bfs' | 'dfs'>('bfs');
  const rows = grid.length;
  const cols = (grid[0] ?? '').length;
  const goal: [number, number] = [rows - 1, cols - 1];
  const fr = useMemo(() => frames(bfsGrid, { grid, start: START, goal, mode }), [grid, mode]);
  const p = usePlayer(fr.length, 260);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as Frame<BfsState>;
  const s = f.state;
  const C = 52;
  const path = new Set(s.path);

  const toggle = (r: number, c: number) => {
    if ((r === START[0] && c === START[1]) || (r === goal[0] && c === goal[1])) return;
    setGrid(
      grid.map((row, ri) =>
        ri !== r ? row : row.slice(0, c) + (row[c] === '#' ? '.' : '#') + row.slice(c + 1),
      ),
    );
    p.setPlaying(false);
    p.setK(0);
  };

  return (
    <Shell
      title="Breadth-first vs depth-first on a grid"
      hint="Tap cells to draw walls. BFS spreads in rings from the start (queue); DFS dives down one corridor (stack). Numbers show visit order."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${cols * C} ${rows * C}`}
          role="img"
          aria-label={`${mode.toUpperCase()} on a ${rows} by ${cols} grid: ${f.caption}`}
        >
          {grid.map((row, r) =>
            [...row].map((ch, c) => {
              const k = key(r, c);
              const wall = ch === '#';
              const isStart = r === START[0] && c === START[1];
              const isGoal = r === goal[0] && c === goal[1];
              const fill = wall
                ? 'var(--pen-ink)'
                : path.has(k)
                  ? 'var(--hl)'
                  : s.current === k
                    ? 'var(--pen-orange)'
                    : s.visited.has(k)
                      ? 'var(--wash-blue)'
                      : s.frontier.has(k)
                        ? 'var(--wash-violet)'
                        : 'var(--surface)';
              const order = s.order.get(k);
              return (
                <g key={k} onClick={() => toggle(r, c)} style={{ cursor: 'pointer' }}>
                  <rect
                    class="anim"
                    x={c * C + 3}
                    y={r * C + 3}
                    width={C - 6}
                    height={C - 6}
                    rx={9}
                    style={{
                      fill,
                      stroke: wall ? 'var(--pen-ink)' : 'var(--border-strong)',
                      strokeWidth: 1.5,
                    }}
                  />
                  {(isStart || isGoal) && (
                    <text
                      x={c * C + C / 2}
                      y={r * C + C / 2 + 6}
                      text-anchor="middle"
                      font-size={17}
                      style={{ fill: 'var(--pen-ink)', fontWeight: 700 }}
                    >
                      {isStart ? 'S' : 'G'}
                    </text>
                  )}
                  {!isStart && !isGoal && order !== undefined && !wall && (
                    <text
                      x={c * C + C / 2}
                      y={r * C + C / 2 + 5}
                      text-anchor="middle"
                      font-size={13}
                      style={{ fill: 'var(--pen-ink)', fontFamily: 'var(--font-mono)' }}
                    >
                      {order}
                    </text>
                  )}
                </g>
              );
            }),
          )}
        </svg>
      </div>
      <div class="gd__legend">
        <span>
          <i style={{ background: 'var(--wash-violet)' }} />
          frontier ({mode === 'bfs' ? 'queue' : 'stack'})
        </span>
        <span>
          <i style={{ background: 'var(--wash-blue)' }} />
          visited
        </span>
        <span>
          <i style={{ background: 'var(--hl)' }} />
          path found
        </span>
        <span>
          visited <b class="mono">{s.visited.size}</b> · path{' '}
          <b class="mono">{Math.max(0, s.path.length - 1)}</b> edges
        </span>
      </div>
      <Controls
        p={p}
        caption={f.caption}
        extra={
          <>
            <div class="gd__seg" role="group" aria-label="Algorithm">
              {(['bfs', 'dfs'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => {
                    setMode(m);
                    p.setK(0);
                  }}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              class="btn"
              onClick={() => {
                setGrid(INITIAL);
                p.setK(0);
              }}
            >
              <Icon name="replay" size={16} /> Reset walls
            </button>
          </>
        }
      />
    </Shell>
  );
}
