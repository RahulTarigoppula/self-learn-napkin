import '../../../styles/griddles/sliding-window.css';
import { useMemo, useState } from 'preact/hooks';
import {
  allWindows,
  clampText,
  longestUniqueFrames,
  WINDOW_DEFAULT,
  WINDOW_MAX,
  type WindowFrame,
} from '../../../engine/viz/sliding-window';
import { Controls, Shell, usePlayer } from '../player';

const W = 540;
const PRESETS = [WINDOW_DEFAULT, 'abba', 'pwwkew'];
const show = (c: string) => (c === ' ' ? '␣' : c);

export default function SlidingWindowGriddle() {
  const [text, setText] = useState(WINDOW_DEFAULT);
  const chars = useMemo(() => [...text], [text]);
  const fr = useMemo(() => longestUniqueFrames(text), [text]);
  const p = usePlayer(fr.length, 1100);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as WindowFrame;
  const n = chars.length;
  const cw = W / Math.max(n, 8);
  const x0 = (W - n * cw) / 2;
  const cx = (i: number) => x0 + i * cw + cw / 2;
  const started = f.R >= 0;
  const end = fr.at(-1) as WindowFrame;
  const answer = chars.slice(end.best.start, end.best.start + end.best.len).join('');
  const win = started
    ? chars
        .slice(f.L, f.R + 1)
        .map(show)
        .join('')
    : '';

  const load = (t: string) => {
    setText(clampText(t));
    p.setPlaying(false);
    p.setK(0);
  };

  return (
    <Shell
      title="Sliding window: longest run with no repeats"
      hint="R adds one letter per step; on a repeat inside the window, L jumps past the old copy. Type your own string, or try “abba” to see why an old copy left of L is ignored."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} 176`}
          role="img"
          aria-label={`String ${text || 'empty'}. Window ${started ? `[${f.L}, ${f.R}] "${win}"` : 'empty'}. Best length ${f.best.len}.`}
        >
          {started && (
            <rect
              class="sw__win"
              x={0}
              y={22}
              height={62}
              rx={12}
              style={{
                transform: `translateX(${x0 + f.L * cw + 1}px)`,
                width: `${(f.R - f.L + 1) * cw - 2}px`,
                fill: 'none',
                stroke: f.kind === 'jump' ? 'var(--pen-red)' : 'var(--pen-blue)',
                strokeWidth: 3,
              }}
            />
          )}
          {chars.map((c, i) => {
            const inWin = started && i >= f.L && i <= f.R;
            const isR = i === f.R;
            const isPrev = started && i === f.prev;
            const fill = isR
              ? 'var(--hl)'
              : isPrev && f.kind === 'jump'
                ? 'var(--wash-red)'
                : inWin
                  ? 'var(--wash-blue)'
                  : 'var(--surface-2)';
            const stroke = isR
              ? 'var(--pen-orange)'
              : isPrev
                ? f.kind === 'jump'
                  ? 'var(--pen-red)'
                  : 'var(--pen-muted)'
                : inWin
                  ? 'var(--pen-blue)'
                  : 'var(--pen-muted)';
            const faded = started && i < f.L && !isPrev;
            return (
              <g key={`${i}${c}`} style={{ transform: `translateX(${x0 + i * cw}px)` }}>
                <rect
                  class="anim"
                  x={5}
                  y={29}
                  width={cw - 10}
                  height={48}
                  rx={8}
                  style={{
                    fill,
                    stroke,
                    strokeWidth: 2,
                    strokeDasharray: isPrev && f.kind === 'stale' ? '5 4' : undefined,
                    opacity: faded ? 0.4 : 1,
                  }}
                />
                <text
                  x={cw / 2}
                  y={61}
                  text-anchor="middle"
                  font-size={20}
                  style={{ fill: 'var(--pen-ink)', opacity: faded ? 0.5 : 1 }}
                >
                  {show(c)}
                </text>
                <text
                  x={cw / 2}
                  y={14}
                  text-anchor="middle"
                  font-size={12}
                  style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {i}
                </text>
              </g>
            );
          })}
          {started && (
            <>
              <Pointer x={cx(f.L)} label="L" color="var(--pen-blue)" dy={f.L === f.R ? -10 : 0} />
              <Pointer x={cx(f.R)} label="R" color="var(--pen-orange)" dy={f.L === f.R ? 10 : 0} />
            </>
          )}
          {f.best.len > 0 && (
            <g>
              <path
                class="anim"
                d={`M${x0 + f.best.start * cw + 4} 140 V146 H${x0 + (f.best.start + f.best.len) * cw - 4} V140`}
                style={{ fill: 'none', stroke: 'var(--pen-green)', strokeWidth: 2.5 }}
              />
              <text
                x={x0 + (f.best.start + f.best.len / 2) * cw}
                y={166}
                text-anchor="middle"
                font-size={14}
                style={{ fill: 'var(--pen-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
              >
                best {f.best.len}
              </text>
            </g>
          )}
        </svg>
      </div>
      <div>
        <p class="eyebrow">last seen</p>
        <ul class="sw__map" aria-label="Last-seen index of each character">
          {f.seen.length === 0 && <li class="sw__empty">nothing yet</li>}
          {f.seen.map(([c, i]) => (
            <li key={c} class={`sw__chip${i === f.R ? ' is-new' : i < f.L ? ' is-stale' : ''}`}>
              <b>{show(c)}</b> → {i}
            </li>
          ))}
        </ul>
      </div>
      <div class="gd__stats">
        <span>
          window <b>{started ? `"${win}"` : '-'}</b>
        </span>
        <span>
          best <b>{f.best.len}</b>
        </span>
        <span>
          windows checked <b>{f.R + 1}</b> of <b>{allWindows(n)}</b>
        </span>
        <span>
          L moves <b>{f.lMoves}</b>
        </span>
      </div>
      {p.k === p.last && n > 0 && (
        <p class="gd__verdict gd__verdict--ok" aria-live="polite">
          Longest without repeats: “{[...answer].map(show).join('')}” (length {end.best.len}) at [
          {end.best.start}..
          {end.best.start + end.best.len - 1}], found in one pass of {n} steps.
        </p>
      )}
      <Controls p={p} caption={f.caption} />
      <div class="gd__row">
        <input
          class="gd__input"
          type="text"
          value={text}
          maxLength={WINDOW_MAX}
          onInput={(e) => load((e.target as HTMLInputElement).value)}
          aria-label={`String to scan, up to ${WINDOW_MAX} characters`}
          autoCapitalize="off"
          autoComplete="off"
          spellcheck={false}
        />
        <div class="gd__seg" role="group" aria-label="Example strings">
          {PRESETS.map((s) => (
            <button key={s} type="button" aria-pressed={text === s} onClick={() => load(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Pointer({ x, label, color, dy }: { x: number; label: string; color: string; dy: number }) {
  return (
    <g class="anim" style={{ transform: `translateX(${x + dy}px)` }}>
      <path d="M0 88 l-6 9 h12 z" style={{ fill: color }} />
      <text
        y={116}
        text-anchor="middle"
        font-size={15}
        style={{ fill: color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
      >
        {label}
      </text>
    </g>
  );
}
