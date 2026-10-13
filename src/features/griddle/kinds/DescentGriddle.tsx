import { useMemo, useState } from 'preact/hooks';
import { descend, LOSSES } from '../../../engine/viz/ml';
import { Controls, Shell, usePlayer } from '../player';

const W = 520;
const H = 280;
const PAD = 28;

export default function DescentGriddle() {
  const [lossId, setLossId] = useState('bowl');
  const [lr, setLr] = useState(0.3);
  const [x0, setX0] = useState(-3);
  const loss = LOSSES.find((l) => l.id === lossId) ?? (LOSSES[0] as (typeof LOSSES)[number]);
  const xs = useMemo(() => descend(loss, x0, lr, 40), [loss, x0, lr]);
  const p = usePlayer(xs.length, 420);
  const [lo, hi] = loss.domain;
  const ys = useMemo(
    () => Array.from({ length: 120 }, (_, i) => loss.f(lo + ((hi - lo) * i) / 119)),
    [loss, lo, hi],
  );
  const yMax = Math.max(...ys);
  const yMin = Math.min(...ys);
  const sx = (x: number) => PAD + ((x - lo) / (hi - lo)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD - 20);
  const curve = ys
    .map((y, i) => `${i === 0 ? 'M' : 'L'}${sx(lo + ((hi - lo) * i) / 119).toFixed(1)} ${sy(y).toFixed(1)}`)
    .join(' ');
  const k = Math.min(p.k, xs.length - 1);
  const x = xs[k] as number;
  const clamp = (v: number) => Math.max(lo, Math.min(hi, v));
  const diverged = xs.length < 41 && Math.abs(x) > (hi - lo) * 5;
  const outside = x < lo || x > hi;
  const trail = xs.slice(0, k + 1);
  const g = loss.df(x);
  const caption =
    k === 0
      ? `start at x = ${x0.toFixed(2)}, loss ${loss.f(x0).toFixed(3)}`
      : `step ${k}: slope ${g.toFixed(3)} → x = ${x.toFixed(3)}, loss ${loss.f(x).toFixed(3)}${outside ? ' (off the chart and diverging!)' : ''}`;

  return (
    <Shell
      title="Roll down the loss curve"
      hint="Each step moves against the slope: x ← x − η·slope. Tap the curve to drop the ball somewhere new. Push η past 2 on the bowl and watch it blow up."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={caption}
          onClick={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            setX0(Number((lo + ((px - PAD) / (W - 2 * PAD)) * (hi - lo)).toFixed(2)));
            p.setK(0);
            p.setPlaying(false);
          }}
          style={{ cursor: 'crosshair' }}
        >
          <line
            x1={PAD}
            y1={H - PAD}
            x2={W - PAD}
            y2={H - PAD}
            style={{ stroke: 'var(--pen-muted)', strokeWidth: 1.5 }}
          />
          <text x={W - PAD} y={H - 8} text-anchor="end" font-size={13} style={{ fill: 'var(--pen-muted)' }}>
            weight x
          </text>
          <text x={PAD} y={18} font-size={13} style={{ fill: 'var(--pen-muted)' }}>
            loss
          </text>
          <path
            d={curve}
            style={{ fill: 'none', stroke: 'var(--pen-ink)', strokeWidth: 2.5, strokeLinecap: 'round' }}
          />
          {trail.length > 1 && (
            <polyline
              points={trail
                .map((t) => `${sx(clamp(t)).toFixed(1)},${sy(loss.f(clamp(t))).toFixed(1)}`)
                .join(' ')}
              style={{ fill: 'none', stroke: 'var(--pen-orange)', strokeWidth: 1.8, strokeDasharray: '5 4' }}
            />
          )}
          {trail.map((t, i) => (
            <circle
              key={i}
              cx={sx(clamp(t))}
              cy={sy(loss.f(clamp(t)))}
              r={3}
              style={{ fill: 'var(--pen-orange)', opacity: 0.6 }}
            />
          ))}
          {!outside && (
            <>
              <line
                x1={sx(x) - 40}
                y1={
                  sy(loss.f(x)) +
                  40 * g * ((H - 2 * PAD - 20) / (yMax - yMin || 1)) * ((hi - lo) / (W - 2 * PAD))
                }
                x2={sx(x) + 40}
                y2={
                  sy(loss.f(x)) -
                  40 * g * ((H - 2 * PAD - 20) / (yMax - yMin || 1)) * ((hi - lo) / (W - 2 * PAD))
                }
                style={{ stroke: 'var(--pen-blue)', strokeWidth: 2 }}
              />
              <circle
                class="anim"
                cx={sx(x)}
                cy={sy(loss.f(x)) - 9}
                r={9}
                style={{ fill: 'var(--pen-red)', stroke: 'var(--pen-ink)', strokeWidth: 2 }}
              />
            </>
          )}
        </svg>
      </div>
      {diverged || outside ? (
        <p class="gd__verdict gd__verdict--bad">
          The steps overshoot more each time because the learning rate is too large for this curve.
        </p>
      ) : null}
      <Controls
        p={p}
        caption={caption}
        extra={
          <>
            <label class="gd__row" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              η
              <input
                type="range"
                min={0.02}
                max={2.4}
                step={0.02}
                value={lr}
                onInput={(e) => {
                  setLr(Number((e.target as HTMLInputElement).value));
                  p.setK(0);
                  p.setPlaying(false);
                }}
                aria-label="Learning rate"
                style={{ width: '150px' }}
              />
              <span class="mono">{lr.toFixed(2)}</span>
            </label>
            <div class="gd__seg" role="group" aria-label="Loss curve">
              {LOSSES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={lossId === l.id}
                  onClick={() => {
                    setLossId(l.id);
                    setX0(l.id === 'bowl' ? -3 : 3.6);
                    p.setK(0);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </>
        }
      />
    </Shell>
  );
}
