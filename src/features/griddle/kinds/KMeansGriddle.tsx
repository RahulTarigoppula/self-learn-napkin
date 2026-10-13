import { useState } from 'preact/hooks';
import { assign, blobs, inertia, type Pt, update } from '../../../engine/viz/ml';
import { rng } from '../../../engine/viz/types';
import { Icon } from '../../ui/Icon';
import { Shell, Stepper } from '../player';

const COLORS = [
  'var(--pen-blue)',
  'var(--pen-red)',
  'var(--pen-green)',
  'var(--pen-violet)',
  'var(--pen-orange)',
];
const W = 520;
const H = 340;

function initCentroids(k: number, seed: number): Pt[] {
  const r = rng(seed);
  return Array.from({ length: k }, () => ({ x: 0.1 + r() * 0.8, y: 0.1 + r() * 0.8 }));
}

export default function KMeansGriddle() {
  const [points, setPoints] = useState<Pt[]>(() => blobs(37));
  const [k, setK] = useState(3);
  const [seed, setSeed] = useState(5);
  const [cents, setCents] = useState<Pt[]>(() => initCentroids(3, 5));
  const [labels, setLabels] = useState<number[] | null>(null);
  const [phase, setPhase] = useState<'assign' | 'update'>('assign');
  const [rounds, setRounds] = useState(0);
  const [log, setLog] = useState(
    'Random centroids dropped. Step to assign every point to its nearest centroid.',
  );

  const reset = (nk: number, ns: number) => {
    setK(nk);
    setSeed(ns);
    setCents(initCentroids(nk, ns));
    setLabels(null);
    setPhase('assign');
    setRounds(0);
    setLog('Random centroids dropped. Step to assign every point to its nearest centroid.');
  };

  const step = () => {
    if (phase === 'assign') {
      const l = assign(points, cents);
      const changed = labels ? l.filter((x, i) => x !== labels[i]).length : l.length;
      setLabels(l);
      setPhase('update');
      setLog(
        labels && changed === 0
          ? `Converged: no point changed cluster. Inertia ${inertia(points, l, cents).toFixed(3)}.`
          : `Assign: ${changed} point${changed === 1 ? '' : 's'} picked a (new) nearest centroid.`,
      );
    } else if (labels) {
      const c = update(points, labels, cents);
      const moved = c.reduce(
        (s, p, i) => s + Math.hypot(p.x - (cents[i] as Pt).x, p.y - (cents[i] as Pt).y),
        0,
      );
      setCents(c);
      setPhase('assign');
      setRounds(rounds + 1);
      setLog(
        `Update: each centroid moved to the mean of its points (total shift ${moved.toFixed(3)}). Inertia ${inertia(points, labels, c).toFixed(3)}.`,
      );
    }
  };

  return (
    <Shell
      title="Run k-means by hand"
      hint="Alternate two moves: assign each point to its nearest centroid, then move each centroid to the mean of its points. Tap the canvas to add points; try different k and starts."
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={log}
          style={{ cursor: 'crosshair' }}
          onClick={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            setPoints([...points, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }]);
            setLabels(null);
            setPhase('assign');
          }}
        >
          {labels &&
            points.map((p, i) => {
              const c = cents[labels[i] ?? 0] as Pt;
              return (
                <line
                  key={`l${i}`}
                  x1={p.x * W}
                  y1={p.y * H}
                  x2={c.x * W}
                  y2={c.y * H}
                  style={{ stroke: COLORS[labels[i] ?? 0], strokeWidth: 0.8, opacity: 0.35 }}
                />
              );
            })}
          {points.map((p, i) => (
            <circle
              key={i}
              class="anim"
              cx={p.x * W}
              cy={p.y * H}
              r={6}
              style={{
                fill: labels ? COLORS[labels[i] ?? 0] : 'var(--pen-muted)',
                stroke: 'var(--surface)',
                strokeWidth: 1.5,
              }}
            />
          ))}
          {cents.map((c, i) => (
            <g key={`c${i}`} class="anim" style={{ transform: `translate(${c.x * W}px, ${c.y * H}px)` }}>
              <path
                d="M-11 -11 L11 11 M11 -11 L-11 11"
                style={{ stroke: 'var(--pen-ink)', strokeWidth: 6, strokeLinecap: 'round' }}
              />
              <path
                d="M-11 -11 L11 11 M11 -11 L-11 11"
                style={{ stroke: COLORS[i], strokeWidth: 3.5, strokeLinecap: 'round' }}
              />
            </g>
          ))}
        </svg>
      </div>
      <p class="gd__caption" aria-live="polite">
        {log}
      </p>
      <div class="gd__row">
        <button type="button" class="btn btn--primary" onClick={step}>
          <Icon name="skipForward" size={16} /> {phase === 'assign' ? 'Assign points' : 'Move centroids'}
        </button>
        <span class="muted mono">round {rounds}</span>
        <Stepper label="k" value={k} min={2} max={5} onChange={(v) => reset(v, seed)} />
        <button type="button" class="btn" onClick={() => reset(k, seed + 1)}>
          <Icon name="shuffle" size={16} /> New start
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          onClick={() => {
            setPoints(blobs(37));
            reset(k, seed);
          }}
        >
          Reset points
        </button>
      </div>
    </Shell>
  );
}
