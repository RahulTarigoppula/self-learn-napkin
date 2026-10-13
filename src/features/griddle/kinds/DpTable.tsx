import '../../../styles/griddles/dp.css';
import type { Cell, DpRun, DpView } from '../../../engine/viz/dp-table';
import { shown } from '../../../engine/viz/dp-table';

export interface Head {
  main: string;
  sub?: string;
}

const C = 42;
const TOP = 34;
const center = (hw: number, [r, c]: Cell): [number, number] => [hw + c * C + C / 2, TOP + r * C + C / 2];
const same = (a: Cell | undefined, r: number, c: number) => !!a && a[0] === r && a[1] === c;

/**
 * Shared DP grid: headers, cells filling one by one, the neighbours each value came from
 * (winner solid green, other candidates dashed blue) and the traceback path in orange.
 * Tap a filled cell to jump to the frame that computed it.
 */
export function DpTable({
  run,
  view,
  rows,
  cols,
  corner = '',
  headW = 34,
  label,
  tagColor = () => 'var(--ink-muted)',
  onPick,
}: {
  run: DpRun;
  view: DpView;
  rows: Head[];
  cols: Head[];
  corner?: string;
  headW?: number;
  label: string;
  tagColor?: (tag: string) => string;
  onPick?: (frame: number) => void;
}) {
  const hw = headW;
  const fill = view.fill;
  const step = view.step;
  const focus: Cell | null = fill ? [fill.r, fill.c] : step ? [step.r, step.c] : null;
  const marks = new Set(view.steps.filter((s) => s.mark).map((s) => `${s.r},${s.c}`));
  const onPath = new Set(view.path.map(([r, c]) => `${r},${c}`));
  const W = hw + run.cols * C;
  const H = TOP + run.rows * C;

  return (
    <div class="gd__stage paper">
      <svg
        viewBox={`-2 -2 ${W + 4} ${H + 4}`}
        role="img"
        aria-label={`${label}: ${view.caption}`}
        style={{ display: 'block', margin: '0 auto', maxWidth: `${Math.round((W + 4) * 1.35)}px` }}
      >
        <text
          x={hw / 2}
          y={TOP / 2 + 5}
          text-anchor="middle"
          font-size={13}
          style={{ fill: 'var(--ink-muted)' }}
        >
          {corner}
        </text>
        {cols.map((h, c) => (
          <g key={`c${c}`}>
            {focus?.[1] === c && (
              <rect
                x={hw + c * C + 4}
                y={2}
                width={C - 8}
                height={TOP - 6}
                rx={6}
                style={{ fill: 'var(--hl)' }}
              />
            )}
            <text
              x={hw + c * C + C / 2}
              y={TOP / 2 + 6}
              text-anchor="middle"
              font-size={17}
              style={{
                fill: focus?.[1] === c ? 'var(--hl-ink)' : 'var(--pen-ink)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              {h.main}
            </text>
          </g>
        ))}
        {rows.map((h, r) => (
          <g key={`r${r}`}>
            {focus?.[0] === r && (
              <rect
                x={2}
                y={TOP + r * C + 4}
                width={hw - 4}
                height={C - 8}
                rx={6}
                style={{ fill: 'var(--hl)' }}
              />
            )}
            <text
              x={hw / 2}
              y={TOP + r * C + C / 2 + (h.sub ? 0 : 6)}
              text-anchor="middle"
              font-size={17}
              style={{
                fill: focus?.[0] === r ? 'var(--hl-ink)' : 'var(--pen-ink)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              {h.main}
            </text>
            {h.sub && (
              <text
                x={hw / 2}
                y={TOP + r * C + C / 2 + 14}
                text-anchor="middle"
                font-size={11}
                style={{
                  fill: focus?.[0] === r ? 'var(--hl-ink)' : 'var(--ink-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {h.sub}
              </text>
            )}
          </g>
        ))}
        {run.table.map((row, r) =>
          row.map((v, c) => {
            const k = `${r},${c}`;
            const vis = shown(run, view, r, c);
            const order = run.order[r]?.[c] ?? -1;
            const isCur = same(focus ?? undefined, r, c);
            const isWin = same(fill?.win, r, c);
            const isFrom = !!fill?.from.some((f) => f[0] === r && f[1] === c);
            const path = onPath.has(k);
            const bg = isCur
              ? 'var(--hl)'
              : marks.has(k)
                ? 'var(--wash-green)'
                : path
                  ? 'var(--wash-orange)'
                  : isWin
                    ? 'var(--wash-green)'
                    : isFrom
                      ? 'var(--wash-blue)'
                      : order < 0
                        ? 'var(--surface-2)'
                        : 'var(--surface)';
            const stroke =
              isCur || path
                ? 'var(--pen-orange)'
                : isWin
                  ? 'var(--pen-green)'
                  : isFrom
                    ? 'var(--pen-blue)'
                    : 'var(--border-strong)';
            const tag = order >= 0 && vis ? run.fills[order]?.tag : '';
            return (
              <g key={k} class="dp__cell" onClick={() => order >= 0 && onPick?.(order + 1)}>
                <rect
                  class="anim"
                  x={hw + c * C + 2}
                  y={TOP + r * C + 2}
                  width={C - 4}
                  height={C - 4}
                  rx={7}
                  style={{
                    fill: bg,
                    stroke,
                    strokeWidth: isCur || isWin || path ? 2.5 : isFrom ? 2 : 1,
                    strokeDasharray: isFrom && !isWin ? '4 3' : undefined,
                  }}
                />
                {tag && (
                  <text
                    x={hw + c * C + 7}
                    y={TOP + r * C + 14}
                    font-size={11}
                    style={{
                      fill: isCur ? 'var(--hl-ink)' : tagColor(tag),
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {tag}
                  </text>
                )}
                {vis && (
                  <text
                    x={hw + c * C + C / 2}
                    y={TOP + r * C + C / 2 + 7}
                    text-anchor="middle"
                    font-size={isCur ? 19 : 17}
                    style={{ fill: isCur ? 'var(--hl-ink)' : 'var(--pen-ink)' }}
                  >
                    {v}
                  </text>
                )}
              </g>
            );
          }),
        )}
        {fill?.from.map((f) => {
          const [x1, y1] = center(hw, f);
          const [x2, y2] = center(hw, [fill.r, fill.c]);
          const win = same(fill.win, f[0], f[1]);
          return (
            <line
              key={`a${f[0]},${f[1]}`}
              x1={x1 + (x2 - x1) * 0.3}
              y1={y1 + (y2 - y1) * 0.3}
              x2={x1 + (x2 - x1) * 0.7}
              y2={y1 + (y2 - y1) * 0.7}
              style={{
                stroke: win ? 'var(--pen-green)' : 'var(--pen-blue)',
                strokeWidth: win ? 3 : 1.5,
                strokeLinecap: 'round',
                strokeDasharray: win ? undefined : '3 3',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
