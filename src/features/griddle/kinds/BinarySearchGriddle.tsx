import { useMemo, useState } from 'preact/hooks';
import { type BinarySearchState, binarySearch } from '../../../engine/viz/binary-search';
import { type Frame, frames } from '../../../engine/viz/types';
import { Controls, Shell, usePlayer } from '../player';

const VALUES = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91, 99];

export default function BinarySearchGriddle() {
  const [target, setTarget] = useState(56);
  const fr = useMemo(() => frames(binarySearch, { values: VALUES, target }), [target]);
  const p = usePlayer(fr.length, 900);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as Frame<BinarySearchState>;
  const s = f.state;
  const probes = fr
    .slice(1, p.k + 1)
    .flatMap((x) => x.events)
    .filter((e) => e.t === 'probe').length;
  const W = 540;
  const cw = W / VALUES.length;

  const pick = (v: number) => {
    setTarget(v);
    p.setPlaying(false);
    p.setK(0);
  };

  return (
    <Shell
      title="Binary search: halve the range every probe"
      hint="Tap a number to search for it (or try a missing one). lo and hi close in until mid hits the target or they cross."
      p={p}
    >
      <div class="gd__stage paper">
        <svg viewBox={`0 0 ${W} 150`} role="img" aria-label={`Searching for ${target}: ${f.caption}`}>
          {VALUES.map((v, i) => {
            const gone = s.discarded.has(i);
            const isMid = s.mid === i;
            const found = s.found === i;
            const fill = found
              ? 'var(--wash-green)'
              : isMid
                ? 'var(--hl)'
                : gone
                  ? 'var(--surface-2)'
                  : 'var(--wash-blue)';
            return (
              <g
                key={v}
                style={{ transform: `translateX(${i * cw}px)`, cursor: 'pointer' }}
                onClick={() => pick(v)}
              >
                <rect
                  class="anim"
                  x={3}
                  y={30}
                  width={cw - 6}
                  height={46}
                  rx={8}
                  style={{
                    fill,
                    stroke: found ? 'var(--pen-green)' : isMid ? 'var(--pen-orange)' : 'var(--pen-blue)',
                    strokeWidth: 2,
                    opacity: gone ? 0.45 : 1,
                  }}
                />
                <text
                  x={cw / 2}
                  y={60}
                  text-anchor="middle"
                  font-size={18}
                  style={{ fill: 'var(--pen-ink)', opacity: gone ? 0.5 : 1 }}
                >
                  {v}
                </text>
                <text
                  x={cw / 2}
                  y={20}
                  text-anchor="middle"
                  font-size={12}
                  style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {i}
                </text>
              </g>
            );
          })}
          {p.k > 0 && !s.done && (
            <>
              <Pointer x={s.lo * cw + cw / 2} label="lo" color="var(--pen-blue)" row={0} />
              <Pointer
                x={s.hi * cw + cw / 2}
                label="hi"
                color="var(--pen-violet)"
                row={s.hi === s.lo ? 1 : 0}
              />
            </>
          )}
          {s.mid !== null && (
            <Pointer x={s.mid * cw + cw / 2} label="mid" color="var(--pen-orange)" row={2} />
          )}
        </svg>
      </div>
      <div class="gd__stats">
        <span>
          target <b>{target}</b>
        </span>
        <span>
          probes <b>{probes}</b>
        </span>
        <span>
          worst case for n = {VALUES.length}: <b>{Math.floor(Math.log2(VALUES.length)) + 1}</b>
        </span>
      </div>
      <Controls
        p={p}
        caption={f.caption}
        extra={
          <div class="gd__seg" role="group" aria-label="Pick a target">
            {[56, 12, 99, 40].map((v) => (
              <button key={v} type="button" aria-pressed={target === v} onClick={() => pick(v)}>
                {v === 40 ? '40 (missing)' : v}
              </button>
            ))}
          </div>
        }
      />
    </Shell>
  );
}

function Pointer({ x, label, color, row }: { x: number; label: string; color: string; row: number }) {
  const y = 92 + row * 18;
  return (
    <g class="anim" style={{ transform: `translateX(${x}px)` }}>
      <path d={`M0 ${y - 10} l-6 9 h12 z`} style={{ fill: color }} />
      <text
        y={y + 12}
        text-anchor="middle"
        font-size={14}
        style={{ fill: color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
      >
        {label}
      </text>
    </g>
  );
}
