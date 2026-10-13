import { useState } from 'preact/hooks';
import { quorumOverlap, strongQuorum } from '../../../engine/viz/systems';
import { Shell, Stepper } from '../player';

export default function QuorumGriddle() {
  const [n, setN] = useState(3);
  const [w, setW] = useState(2);
  const [r, setR] = useState(2);
  const W = Math.min(w, n);
  const R = Math.min(r, n);
  const { write, read, both } = quorumOverlap(n, R, W);
  const strong = strongQuorum(n, R, W);
  const span = 520;
  const gap = span / n;

  return (
    <Shell
      title="Tune N, W and R"
      hint="A write lands on W replicas (v2, from the left). A later read asks R replicas (from the right). If the two sets must overlap, the read is guaranteed to see v2."
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${span} 210`}
          role="img"
          aria-label={`N=${n}, W=${W}, R=${R}: ${strong ? 'reads always overlap the latest write' : 'a read can miss the latest write'}`}
        >
          <text x={8} y={22} font-size={15} style={{ fill: 'var(--pen-blue)' }}>
            write v2 → W = {W}
          </text>
          <text x={span - 8} y={22} text-anchor="end" font-size={15} style={{ fill: 'var(--pen-violet)' }}>
            R = {R} ← read
          </text>
          {Array.from({ length: n }, (_, i) => {
            const cx = gap * i + gap / 2;
            const isW = write.includes(i);
            const isR = read.includes(i);
            const isBoth = both.includes(i);
            return (
              <g key={i}>
                <ellipse
                  cx={cx}
                  cy={78}
                  rx={Math.min(34, gap / 2 - 6)}
                  ry={10}
                  style={{ fill: 'var(--surface)', stroke: 'var(--pen-ink)', strokeWidth: 2 }}
                />
                <rect
                  class="anim"
                  x={cx - Math.min(34, gap / 2 - 6)}
                  y={78}
                  width={Math.min(68, gap - 12)}
                  height={56}
                  style={{
                    fill: isBoth ? 'var(--hl)' : isW ? 'var(--wash-blue)' : 'var(--surface)',
                    stroke: 'var(--pen-ink)',
                    strokeWidth: 2,
                  }}
                />
                <ellipse
                  cx={cx}
                  cy={134}
                  rx={Math.min(34, gap / 2 - 6)}
                  ry={10}
                  style={{
                    fill: isBoth ? 'var(--hl)' : isW ? 'var(--wash-blue)' : 'var(--surface)',
                    stroke: 'var(--pen-ink)',
                    strokeWidth: 2,
                  }}
                />
                <text
                  x={cx}
                  y={112}
                  text-anchor="middle"
                  font-size={17}
                  style={{ fill: 'var(--pen-ink)', fontWeight: 700 }}
                >
                  {isW ? 'v2' : 'v1'}
                </text>
                <text
                  x={cx}
                  y={168}
                  text-anchor="middle"
                  font-size={13}
                  style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  replica {i + 1}
                </text>
                {isR && (
                  <text
                    x={cx}
                    y={196}
                    text-anchor="middle"
                    font-size={14}
                    style={{ fill: 'var(--pen-violet)', fontWeight: 700 }}
                  >
                    read ✓
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p class={`gd__verdict ${strong ? 'gd__verdict--ok' : 'gd__verdict--bad'}`} aria-live="polite">
        R + W = {R + W} {strong ? '>' : '≤'} N = {n}, so{' '}
        {strong
          ? `every read set overlaps every write set (here on ${both.length} replica${both.length === 1 ? '' : 's'}) and reads see v2.`
          : 'the read can land only on stale replicas and return v1.'}
      </p>
      <div class="gd__row">
        <Stepper label="N" value={n} min={1} max={7} onChange={(v) => setN(v)} />
        <Stepper label="W" value={W} min={1} max={n} onChange={setW} />
        <Stepper label="R" value={R} min={1} max={n} onChange={setR} />
      </div>
      <p class="gd__hint">
        Fast writes: W = 1 (but then you need R = N). Fast reads: R = 1 (needs W = N). The popular middle
        ground is W = R = ⌊N/2⌋ + 1, which also survives ⌈N/2⌉ − 1 replicas being down.
      </p>
    </Shell>
  );
}
