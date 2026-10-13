import { useMemo, useState } from 'preact/hooks';
import {
  bruteChecks,
  PAIR_DEFAULT,
  PAIR_TARGET,
  type PairFrame,
  pairSumFrames,
  parseSorted,
  randomSorted,
} from '../../../engine/viz/two-pointers';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, Stepper, usePlayer } from '../player';

const W = 540;
const ARC: Record<PairFrame['move'], string> = {
  start: 'var(--pen-muted)',
  'too-big': 'var(--pen-red)',
  'too-small': 'var(--pen-blue)',
  found: 'var(--pen-green)',
  none: 'var(--pen-muted)',
};

export default function TwoPointersGriddle() {
  const [values, setValues] = useState<number[]>(PAIR_DEFAULT);
  const [target, setTarget] = useState(PAIR_TARGET);
  const [draft, setDraft] = useState(PAIR_DEFAULT.join(', '));
  const [note, setNote] = useState('');
  const [seed, setSeed] = useState(4);
  const fr = useMemo(() => pairSumFrames(values, target), [values, target]);
  const p = usePlayer(fr.length, 1100);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as PairFrame;
  const n = values.length;
  const cw = W / Math.max(n, 1);
  const cx = (i: number) => i * cw + cw / 2;
  const end = fr.at(-1) as PairFrame;
  const live = f.move !== 'start' && f.move !== 'none';

  const restart = () => {
    p.setPlaying(false);
    p.setK(0);
  };
  const load = (next: number[], t = target) => {
    setValues(next);
    setDraft(next.join(', '));
    setTarget(t);
    restart();
  };
  const apply = () => {
    const r = parseSorted(draft);
    setNote(
      r.values.length < 2
        ? 'Need at least two numbers.'
        : r.wasSorted
          ? ''
          : 'Sorted it for you: the walk needs sorted order.',
    );
    if (r.values.length >= 2) load(r.values);
  };

  return (
    <Shell
      title="Two pointers: pair with a target sum"
      hint="Too big? Drop the right end. Too small? Drop the left end. Change the target or the array, then run it. Try a target that doesn't exist."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} 170`}
          role="img"
          aria-label={`Array ${values.join(', ')}, target ${target}. ${f.caption}`}
        >
          {live && (
            <g>
              <path
                class="anim"
                d={`M${cx(f.L)} 50 Q${(cx(f.L) + cx(f.R)) / 2} ${f.R - f.L > 1 ? -6 : 14} ${cx(f.R)} 50`}
                style={{ fill: 'none', stroke: ARC[f.move], strokeWidth: 2.5, strokeDasharray: '6 4' }}
              />
              <text
                x={(cx(f.L) + cx(f.R)) / 2}
                y={f.R - f.L > 1 ? 14 : 24}
                text-anchor="middle"
                font-size={16}
                style={{ fill: ARC[f.move], fontFamily: 'var(--font-mono)', fontWeight: 700 }}
              >
                {f.sum} {f.move === 'too-big' ? '>' : f.move === 'too-small' ? '<' : '='} {target}
              </text>
            </g>
          )}
          {values.map((v, i) => {
            const gone = f.gone.includes(i) && !(live && (i === f.L || i === f.R));
            const on = i === f.L || i === f.R;
            const found = f.move === 'found' && on;
            const fill = found
              ? 'var(--wash-green)'
              : live && on
                ? 'var(--hl)'
                : gone
                  ? 'var(--surface-2)'
                  : 'var(--wash-blue)';
            const stroke = found ? 'var(--pen-green)' : live && on ? 'var(--pen-orange)' : 'var(--pen-blue)';
            return (
              <g key={`${i}-${v}`} style={{ transform: `translateX(${i * cw}px)` }}>
                <rect
                  class="anim"
                  x={3}
                  y={56}
                  width={cw - 6}
                  height={44}
                  rx={8}
                  style={{ fill, stroke, strokeWidth: 2, opacity: gone ? 0.4 : 1 }}
                />
                {gone && (
                  <path d={`M10 94 L${cw - 10} 62`} style={{ stroke: 'var(--pen-muted)', strokeWidth: 2 }} />
                )}
                <text
                  x={cw / 2}
                  y={85}
                  text-anchor="middle"
                  font-size={18}
                  style={{ fill: 'var(--pen-ink)', opacity: gone ? 0.5 : 1 }}
                >
                  {v}
                </text>
                <text
                  x={cw / 2}
                  y={116}
                  text-anchor="middle"
                  font-size={12}
                  style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {i}
                </text>
              </g>
            );
          })}
          {n >= 2 && f.move !== 'none' && (
            <>
              <Pointer x={cx(f.L)} label="L" color="var(--pen-blue)" />
              <Pointer x={cx(f.R)} label="R" color="var(--pen-violet)" />
            </>
          )}
        </svg>
      </div>
      <div class="gd__stats">
        <span>
          target <b>{target}</b>
        </span>
        <span>
          checks <b>{f.checks}</b>
        </span>
        <span>
          brute force n(n−1)/2 = <b>{bruteChecks(n)}</b>
        </span>
        <span>
          ruled out <b>{f.gone.length}</b>
        </span>
      </div>
      {p.k === p.last && n >= 2 && (
        <p
          class={`gd__verdict ${end.move === 'found' ? 'gd__verdict--ok' : 'gd__verdict--bad'}`}
          aria-live="polite"
        >
          {end.move === 'found'
            ? `Found ${values[end.L]} + ${values[end.R]} = ${target} at [${end.L}] and [${end.R}] in ${end.checks} checks, not ${bruteChecks(n)}.`
            : `No pair sums to ${target}, proved in ${end.checks} checks instead of ${bruteChecks(n)}.`}
        </p>
      )}
      <Controls
        p={p}
        caption={f.caption}
        extra={
          <>
            <Stepper
              label="target"
              value={target}
              min={-198}
              max={198}
              onChange={(t) => {
                setTarget(t);
                restart();
              }}
            />
            <button
              type="button"
              class="btn"
              onClick={() => {
                const next = randomSorted(n >= 2 ? n : 7, seed);
                setSeed(seed + 1);
                setNote('');
                load(next, (next[1] as number) + (next[next.length - 2] as number));
              }}
            >
              <Icon name="shuffle" size={17} /> Random
            </button>
          </>
        }
      />
      <form
        class="gd__row"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <input
          class="gd__input"
          style={{ width: '230px', maxWidth: '100%' }}
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          aria-label="Array values, comma separated"
          inputMode="numeric"
        />
        <button type="submit" class="btn">
          <Icon name="check" size={16} /> Use array
        </button>
        <button type="button" class="btn btn--ghost" onClick={() => load(PAIR_DEFAULT, PAIR_TARGET)}>
          Napkin example
        </button>
        {note && (
          <span class="muted" role="status">
            {note}
          </span>
        )}
      </form>
    </Shell>
  );
}

function Pointer({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <g class="anim" style={{ transform: `translateX(${x}px)` }}>
      <path d="M0 124 l-7 10 h14 z" style={{ fill: color }} />
      <text
        y={154}
        text-anchor="middle"
        font-size={16}
        style={{ fill: color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
      >
        {label}
      </text>
    </g>
  );
}
