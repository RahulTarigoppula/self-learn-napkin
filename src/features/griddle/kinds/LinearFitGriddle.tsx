import { useRef, useState } from 'preact/hooks';
import { fitLine, type Pt } from '../../../engine/viz/ml';
import { Shell } from '../player';

const W = 520;
const H = 320;
const START: Pt[] = [
  { x: 0.08, y: 0.22 },
  { x: 0.18, y: 0.3 },
  { x: 0.27, y: 0.27 },
  { x: 0.38, y: 0.44 },
  { x: 0.5, y: 0.46 },
  { x: 0.6, y: 0.58 },
  { x: 0.7, y: 0.56 },
  { x: 0.82, y: 0.74 },
  { x: 0.92, y: 0.77 },
];

/** Drag points (or tap to add) and watch the least-squares line, its residuals and the error update live. */
export default function LinearFitGriddle() {
  const [pts, setPts] = useState<Pt[]>(START);
  const [showRes, setShowRes] = useState(true);
  const drag = useRef<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const f = fitLine(pts);
  const toPt = (e: PointerEvent): Pt => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)),
    };
  };
  const X = (x: number) => x * W;
  const Y = (y: number) => H - y * H;

  return (
    <Shell
      title="Fit a line by least squares"
      hint="Drag any point (or tap empty space to add one). The line minimises the sum of squared vertical gaps — the red residuals. One outlier can swing it a lot."
    >
      <div class="gd__stage paper">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`y = ${f.m.toFixed(2)}x + ${f.b.toFixed(2)}, R² ${f.r2.toFixed(2)}`}
          style={{ touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={(e) => {
            if ((e.target as Element).tagName === 'circle') return;
            setPts([...pts, toPt(e)]);
          }}
          onPointerMove={(e) => {
            const i = drag.current;
            if (i === null) return;
            const p = toPt(e);
            setPts(pts.map((q, j) => (j === i ? p : q)));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <line
            x1={X(0)}
            y1={Y(f.b)}
            x2={X(1)}
            y2={Y(f.m + f.b)}
            style={{ stroke: 'var(--pen-blue)', strokeWidth: 3 }}
          />
          {showRes &&
            pts.map((p, i) => (
              <line
                key={`r${i}`}
                x1={X(p.x)}
                y1={Y(p.y)}
                x2={X(p.x)}
                y2={Y(f.m * p.x + f.b)}
                style={{ stroke: 'var(--pen-red)', strokeWidth: 2, strokeDasharray: '4 3' }}
              />
            ))}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={X(p.x)}
              cy={Y(p.y)}
              r={9}
              style={{
                fill: 'var(--wash-violet)',
                stroke: 'var(--pen-violet)',
                strokeWidth: 2.5,
                cursor: 'grab',
              }}
              onPointerDown={(e) => {
                drag.current = i;
                svg.current?.setPointerCapture(e.pointerId);
              }}
            />
          ))}
        </svg>
      </div>
      <div class="gd__stats">
        <span>
          line{' '}
          <b>
            y = {f.m.toFixed(2)}x {f.b >= 0 ? '+' : '−'} {Math.abs(f.b).toFixed(2)}
          </b>
        </span>
        <span>
          MSE <b>{f.mse.toFixed(4)}</b>
        </span>
        <span>
          R² <b>{f.r2.toFixed(3)}</b>
        </span>
        <span>
          points <b>{pts.length}</b>
        </span>
      </div>
      <div class="gd__row">
        <button type="button" class="btn" aria-pressed={showRes} onClick={() => setShowRes(!showRes)}>
          {showRes ? 'Hide' : 'Show'} residuals
        </button>
        <button type="button" class="btn" onClick={() => setPts([...pts, { x: 0.9, y: 0.08 }])}>
          Add an outlier
        </button>
        <button type="button" class="btn btn--ghost" onClick={() => setPts(START)}>
          Reset
        </button>
      </div>
    </Shell>
  );
}
