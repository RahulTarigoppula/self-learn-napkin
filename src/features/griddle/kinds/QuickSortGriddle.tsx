import { useMemo, useState } from 'preact/hooks';
import { type PivotRule, type QuickState, quickFrames } from '../../../engine/viz/sorts';
import { count, type Frame, shuffled } from '../../../engine/viz/types';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, Stepper, usePlayer } from '../player';

const NAPKIN = [5, 3, 8, 1, 9, 2, 7, 4];
const RULES: [PivotRule, string][] = [
  ['last', 'last'],
  ['random', 'random'],
  ['median3', 'median of 3'],
];
const LEGEND = [
  ['var(--wash-red)', 'pivot'],
  ['var(--wash-green)', '≤ pivot'],
  ['var(--wash-blue)', '> pivot'],
  ['var(--surface-2)', 'not scanned yet'],
  ['var(--wash-violet)', 'home for good'],
] as const;
const W = 520;
const H = 190;
const GAP = 8;

/** Region colours for one bar: home, pivot, ≤ pivot, > pivot, unknown, or waiting outside the range. */
function look(s: QuickState, x: number): { fill: string; stroke: string; dim: boolean } {
  if (s.sorted.has(x)) return { fill: 'var(--wash-violet)', stroke: 'var(--pen-violet)', dim: false };
  if (x < s.lo || x > s.hi) return { fill: 'var(--surface-2)', stroke: 'var(--pen-muted)', dim: true };
  if (x === s.pivot) return { fill: 'var(--wash-red)', stroke: 'var(--pen-red)', dim: false };
  if (x < s.bound) return { fill: 'var(--wash-green)', stroke: 'var(--pen-green)', dim: false };
  if (x <= s.scan) return { fill: 'var(--wash-blue)', stroke: 'var(--pen-blue)', dim: false };
  return { fill: 'var(--surface-2)', stroke: 'var(--pen-muted)', dim: false };
}

export default function QuickSortGriddle() {
  const [values, setValues] = useState<number[]>(NAPKIN);
  const [seed, setSeed] = useState(11);
  const [rule, setRule] = useState<PivotRule>('last');
  const fr = useMemo(() => quickFrames({ values, pivotRule: rule, seed }), [values, rule, seed]);
  const p = usePlayer(fr.length, 650);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as Frame<QuickState>;
  const s = f.state;
  const n = s.a.length;
  const bw = (W - GAP * (n - 1)) / n;
  const cx = (i: number) => i * (bw + GAP) + bw / 2;
  const maxV = Math.max(...values, 1);
  const finalDepth = (fr.at(-1) as Frame<QuickState>).state.maxDepth;
  const stackY = H + 76;
  const cmp = (upto: number) =>
    count(
      fr.slice(1, upto + 1).flatMap((x) => x.events),
      'compare',
    );
  const total = cmp(fr.length);
  const sofar = cmp(p.k);
  const worst = (n * (n - 1)) / 2;
  const nlogn = Math.round(n * Math.log2(Math.max(n, 1)));
  const sortedInput = values.every((v, i) => i === 0 || v > (values[i - 1] as number));
  const partitioning = s.pivot !== undefined && s.lo >= 0;

  const load = (next: number[]) => {
    setValues(next);
    p.setPlaying(false);
    p.setK(0);
  };
  const pickRule = (r: PivotRule) => {
    if (r === 'random' && rule === 'random') setSeed(seed + 1);
    setRule(r);
    p.setPlaying(false);
    p.setK(0);
  };

  return (
    <Shell
      title="Quicksort: partition around a pivot"
      hint="Run it or step with ← →. i guards the ≤ side, j scans. Try “sorted” with the last pivot, then median of 3, and watch the count drop. Tap random again to re-roll."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 -22 ${W} ${stackY + 36 + (finalDepth + 1) * 12}`}
          role="img"
          aria-label={`Array ${s.a.join(', ')}. ${f.caption}`}
        >
          {s.a.map((v, i) => {
            const c = look(s, i);
            const h = 24 + (v / maxV) * (H - 34);
            const active = s.active.includes(i);
            return (
              <g key={`v${v}`} class="anim" style={{ transform: `translateX(${i * (bw + GAP)}px)` }}>
                <rect
                  class="anim"
                  x={0}
                  y={H - h}
                  width={bw}
                  height={h}
                  rx={7}
                  style={{
                    fill: c.fill,
                    stroke: active ? 'var(--pen-orange)' : c.stroke,
                    strokeWidth: active ? 3 : 2,
                    strokeDasharray: c.fill === 'var(--surface-2)' && !c.dim ? '5 4' : undefined,
                    opacity: c.dim ? 0.45 : 1,
                  }}
                />
                <text
                  x={bw / 2}
                  y={H - h - 8}
                  text-anchor="middle"
                  font-size={18}
                  style={{ fill: 'var(--pen-ink)' }}
                >
                  {v}
                </text>
              </g>
            );
          })}
          {s.a.map((_, i) => (
            <text
              key={`ix${i}`}
              x={cx(i)}
              y={H + 18}
              text-anchor="middle"
              font-size={12}
              style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {i}
            </text>
          ))}
          {partitioning && (
            <Arrow x={cx(Math.min(s.bound, n - 1))} y={H + 30} label="i" color="var(--pen-green)" />
          )}
          {partitioning && s.scan >= s.lo && s.scan < s.hi && (
            <Arrow x={cx(s.scan)} y={H + 52} label="j" color="var(--pen-orange)" />
          )}
          {s.stack.map((r, d) => {
            const y = stackY + d * 12;
            const x1 = r.lo * (bw + GAP) + 2;
            const x2 = r.hi * (bw + GAP) + bw - 2;
            const top = d === s.stack.length - 1;
            return (
              <path
                key={`${r.lo}-${r.hi}`}
                d={`M${x1} ${y - 5} V${y} H${x2} V${y - 5}`}
                style={{
                  fill: 'none',
                  stroke: top ? 'var(--pen-red)' : 'var(--pen-muted)',
                  strokeWidth: top ? 2.5 : 1.5,
                }}
              />
            );
          })}
          <text
            x={0}
            y={stackY - 10}
            font-size={12}
            style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
          >
            call stack · depth {Math.max(0, s.stack.length - 1)}
          </text>
        </svg>
      </div>
      <div class="gd__legend">
        {LEGEND.map(([bg, label]) => (
          <span key={label}>
            <i
              style={{
                background: bg,
                outline: bg === 'var(--surface-2)' ? '1px dashed var(--pen-muted)' : undefined,
              }}
            />
            {label}
          </span>
        ))}
      </div>
      <div class="gd__stats">
        {[
          ['comparisons', `${sofar}/${total}`],
          ['n·log₂n ≈', nlogn],
          ['worst n(n−1)/2 =', worst],
          ['max depth', finalDepth],
        ].map(([label, v]) => (
          <span key={label}>
            {label} <b>{v}</b>
          </span>
        ))}
      </div>
      {p.k === p.last && n > 1 && (
        <p
          class={`gd__verdict ${total === worst ? 'gd__verdict--bad' : 'gd__verdict--ok'}`}
          aria-live="polite"
        >
          {total === worst
            ? `Sorted, but it took all ${worst} comparisons: every pivot landed at an end. That is the O(n²) worst case.`
            : `Sorted in ${total} comparisons, ${worst - total} fewer than the worst case.`}
        </p>
      )}
      <Controls
        p={p}
        caption={f.caption}
        extra={
          <>
            <Stepper
              label="N"
              value={n}
              min={4}
              max={12}
              onChange={(v) =>
                load(sortedInput ? Array.from({ length: v }, (_, i) => i + 1) : shuffled(v, seed))
              }
            />
            <button
              type="button"
              class="btn"
              onClick={() => {
                setSeed(seed + 1);
                load(shuffled(n, seed + 1));
              }}
            >
              <Icon name="shuffle" size={17} /> Shuffle
            </button>
          </>
        }
      />
      <div class="gd__row">
        <div class="gd__seg" role="group" aria-label="Pivot rule">
          {RULES.map(([r, label]) => (
            <button key={r} type="button" aria-pressed={rule === r} onClick={() => pickRule(r)}>
              {label}
            </button>
          ))}
        </div>
        <div class="gd__seg" role="group" aria-label="Starting array">
          <button type="button" aria-pressed={values.join() === NAPKIN.join()} onClick={() => load(NAPKIN)}>
            napkin
          </button>
          <button
            type="button"
            aria-pressed={sortedInput}
            onClick={() => load(Array.from({ length: n }, (_, i) => i + 1))}
          >
            sorted
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Arrow({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g class="anim" style={{ transform: `translateX(${x}px)` }}>
      <path d={`M0 ${y - 8} l-6 9 h12 z`} style={{ fill: color }} />
      <text
        x={10}
        y={y + 2}
        font-size={15}
        style={{ fill: color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
      >
        {label}
      </text>
    </g>
  );
}
