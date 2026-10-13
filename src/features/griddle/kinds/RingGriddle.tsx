import { useMemo, useRef, useState } from 'preact/hooks';
import { arcShare, makeRing, moved, ownerAt, type Ring, ringAt } from '../../../engine/viz/hash-ring';
import { Shell } from '../player';

const SERVERS: Record<string, string> = {
  A: 'var(--pen-blue)',
  B: 'var(--pen-green)',
  C: 'var(--pen-violet)',
  D: 'var(--pen-orange)',
};
const KEYS: Record<string, number> = {
  k1: 10,
  k2: 55,
  k3: 170,
  k4: 200,
  k5: 300,
  k6: 350,
  k7: 95,
  k8: 128,
  k9: 238,
  k10: 262,
  k11: 318,
  k12: 75,
};
const BASE = { A: 40, B: 160, C: 280 };
const R = 120;
const CX = 160;
const CY = 160;
const pt = (deg: number, r = R): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

export default function RingGriddle() {
  const [dOn, setDOn] = useState(false);
  const [dAngle, setDAngle] = useState(220);
  const [vnodes, setVnodes] = useState(1);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const before: Ring = useMemo(
    () => (vnodes === 1 ? ringAt(BASE) : makeRing(['A', 'B', 'C'], vnodes)),
    [vnodes],
  );
  const after: Ring = useMemo(
    () =>
      !dOn ? before : vnodes === 1 ? ringAt({ ...BASE, D: dAngle }) : makeRing(['A', 'B', 'C', 'D'], vnodes),
    [before, dOn, dAngle, vnodes],
  );
  const movedKeys = useMemo(() => new Set(dOn ? moved(before, after, KEYS) : []), [before, after, dOn]);
  const share = arcShare(after);

  const angleFromEvent = (e: PointerEvent): number => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return dAngle;
    const x = ((e.clientX - r.left) / r.width) * 320 - CX;
    const y = ((e.clientY - r.top) / r.height) * 320 - CY;
    return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360);
  };

  const caption = !dOn
    ? 'Three servers. Each key walks clockwise to the first server it meets.'
    : `add D at ${dAngle}° → ${movedKeys.size} of ${Object.keys(KEYS).length} keys moved (≈ K/N)`;

  return (
    <Shell
      title="Drag a new server around the ring"
      hint="Add server D, then drag it. Only the keys in the arc just before D change owner — everything else stays put. Try more virtual nodes to even out the shares."
    >
      <div class="gd__stage paper ring">
        <svg
          ref={svg}
          viewBox="0 0 320 320"
          role="img"
          aria-label={caption}
          onPointerMove={(e) => {
            if (dragging.current && vnodes === 1) setDAngle(angleFromEvent(e));
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerLeave={() => {
            dragging.current = false;
          }}
          style={{ touchAction: 'none', maxWidth: '420px', margin: '0 auto', display: 'block' }}
        >
          <circle
            cx={CX}
            cy={CY}
            r={R}
            style={{ fill: 'none', stroke: 'var(--pen-ink)', strokeWidth: 2.5 }}
          />
          {Object.entries(KEYS).map(([k, a]) => {
            const o = ownerAt(after, a);
            const [x, y] = pt(a, R - 22);
            const [lx, ly] = pt(a, R - 42);
            return (
              <g key={k}>
                <circle
                  class="anim"
                  cx={x}
                  cy={y}
                  r={movedKeys.has(k) ? 8 : 6}
                  style={{
                    fill: SERVERS[o] ?? 'var(--pen-ink)',
                    stroke: movedKeys.has(k) ? 'var(--pen-ink)' : 'none',
                    strokeWidth: 2,
                  }}
                />
                <text
                  x={lx}
                  y={ly + 4}
                  text-anchor="middle"
                  font-size={11}
                  style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {k}
                </text>
              </g>
            );
          })}
          {after.nodes.map((n) => {
            const [x, y] = pt(n.angle);
            const isD = n.id === 'D' && vnodes === 1;
            return (
              <g
                key={`${n.id}${n.vnode}`}
                style={{ cursor: isD ? 'grab' : 'default' }}
                onPointerDown={(e) => {
                  if (!isD) return;
                  dragging.current = true;
                  (e.currentTarget as SVGGElement).ownerSVGElement?.setPointerCapture(e.pointerId);
                }}
              >
                <rect
                  x={x - (vnodes === 1 ? 14 : 7)}
                  y={y - (vnodes === 1 ? 14 : 7)}
                  width={vnodes === 1 ? 28 : 14}
                  height={vnodes === 1 ? 28 : 14}
                  rx={vnodes === 1 ? 7 : 3}
                  style={{ fill: 'var(--surface)', stroke: SERVERS[n.id], strokeWidth: 2.5 }}
                />
                {vnodes === 1 && (
                  <text
                    x={x}
                    y={y + 6}
                    text-anchor="middle"
                    font-size={16}
                    style={{ fill: SERVERS[n.id], fontWeight: 700 }}
                  >
                    {n.id}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p class="gd__caption mono" aria-live="polite">
        {caption}
      </p>
      <div class="ring__share" role="group" aria-label="Share of the ring per server">
        {Object.entries(share)
          .sort()
          .map(([id, v]) => (
            <div key={id} class="ring__bar">
              <span class="mono" style={{ color: SERVERS[id] }}>
                {id}
              </span>
              <span class="ring__track">
                <span class="anim" style={{ width: `${(v * 100).toFixed(1)}%`, background: SERVERS[id] }} />
              </span>
              <span class="mono">{Math.round(v * 100)}%</span>
            </div>
          ))}
      </div>
      <div class="gd__row">
        <button
          type="button"
          class={`btn ${dOn ? '' : 'btn--primary'}`}
          onClick={() => setDOn(!dOn)}
          aria-pressed={dOn}
        >
          {dOn ? 'Remove server D' : 'Add server D'}
        </button>
        {dOn && vnodes === 1 && (
          <label class="gd__row" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            D at
            <input
              type="range"
              min={0}
              max={359}
              value={dAngle}
              onInput={(e) => setDAngle(Number((e.target as HTMLInputElement).value))}
              aria-label="Position of server D in degrees"
              style={{ width: '160px', accentColor: 'var(--pen-orange)' }}
            />
            <span class="mono">{dAngle}°</span>
          </label>
        )}
        <div class="gd__seg" role="group" aria-label="Virtual nodes per server">
          {[1, 8, 32].map((v) => (
            <button key={v} type="button" aria-pressed={vnodes === v} onClick={() => setVnodes(v)}>
              {v} vnode{v === 1 ? '' : 's'}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}
