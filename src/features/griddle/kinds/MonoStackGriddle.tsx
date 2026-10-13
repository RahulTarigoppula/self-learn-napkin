import '../../../styles/griddles/mono-stack.css';
import { useMemo, useState } from 'preact/hooks';
import { type MonoFrame, monoStackFrames, parseNums, randomNums } from '../../../engine/viz/monotonic-stack';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, usePlayer } from '../player';

const LESSON = [2, 1, 2, 4, 3];
const PRESETS: [string, number[]][] = [
  ['Lesson', LESSON],
  ['Falling', [9, 7, 6, 4, 3, 1]],
  ['Rising', [1, 2, 4, 5, 7, 9]],
];
const W = 560;
const BASE = 236; // baseline of the bars
const LEFT = 40; // label gutter
const BARS = 380; // width of the bar area
const SX = 450; // stack column x
const SW = 96;
const BOX = 21;

export default function MonoStackGriddle() {
  const [nums, setNums] = useState<number[]>(LESSON);
  const [draft, setDraft] = useState(LESSON.join(' '));
  const [seed, setSeed] = useState(7);
  const fr = useMemo(() => monoStackFrames(nums), [nums]);
  const p = usePlayer(fr.length, 750);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as MonoFrame;
  const n = nums.length;
  const slot = BARS / n;
  const bw = Math.min(46, slot * 0.68);
  const max = Math.max(...nums, 1);
  const bx = (i: number) => LEFT + slot * i + slot / 2;
  const top = (i: number) => BASE - 14 - ((nums[i] as number) / max) * 150;
  const bad = parseNums(draft) === null;
  const done = f.phase === 'done';
  const waiting = new Set(f.stack);

  const load = (a: number[]) => {
    setNums(a);
    setDraft(a.join(' '));
    p.setPlaying(false);
    p.setK(0);
  };

  const tone = (i: number): [string, string] => {
    if (i === f.popped) return ['var(--wash-green)', 'var(--pen-green)'];
    if (i === f.i && f.phase !== 'done') return ['var(--hl)', 'var(--pen-orange)'];
    if ((f.by[i] ?? -1) >= 0) return ['var(--wash-green)', 'var(--pen-green)'];
    if (waiting.has(i))
      return done ? ['var(--wash-red)', 'var(--pen-red)'] : ['var(--wash-blue)', 'var(--pen-blue)'];
    return ['var(--surface-2)', 'var(--pen-muted)'];
  };

  const label = `Bars ${nums.join(', ')}. Stack holds ${f.stack.map((j) => nums[j]).join(', ') || 'nothing'}. Answers ${f.ans.join(', ')}.`;

  return (
    <Shell
      title="Next greater element with a stack"
      hint="Each new bar pops every shorter bar still waiting and becomes its answer. Type your own numbers, or try Falling: nothing ever pops."
      p={p}
    >
      <div class="gd__stage paper">
        <svg viewBox={`0 0 ${W} 290`} role="img" aria-label={label}>
          {nums.map((v, i) => {
            const [fill, stroke] = tone(i);
            const y = top(i);
            return (
              <g key={i}>
                <rect
                  class="anim"
                  x={bx(i) - bw / 2}
                  y={y}
                  width={bw}
                  height={BASE - y}
                  rx={6}
                  style={{ fill, stroke, strokeWidth: i === f.i || i === f.popped ? 3 : 2 }}
                />
                <text
                  x={bx(i)}
                  y={y - 6}
                  text-anchor="middle"
                  font-size={17}
                  style={{ fill: 'var(--pen-ink)' }}
                >
                  {v}
                </text>
                <text x={bx(i)} y={BASE + 18} text-anchor="middle" font-size={12} class="ms__mono">
                  {i}
                </text>
                <text
                  x={bx(i)}
                  y={BASE + 44}
                  text-anchor="middle"
                  font-size={16}
                  style={{
                    fill:
                      (f.ans[i] ?? -1) >= 0
                        ? 'var(--pen-green)'
                        : done
                          ? 'var(--pen-red)'
                          : 'var(--pen-muted)',
                    fontWeight: 700,
                  }}
                >
                  {(f.ans[i] ?? -1) >= 0 ? f.ans[i] : done ? '−1' : '·'}
                </text>
              </g>
            );
          })}
          {f.by.map((t, j) => {
            if (t < 0) return null;
            const x1 = bx(j);
            const x2 = bx(t);
            const y1 = top(j) - 24;
            const y2 = top(t) - 24;
            const cy = Math.max(4, Math.min(y1, y2) - 18 - 4 * (t - j));
            const hot = j === f.popped;
            const c = hot ? 'var(--pen-green)' : 'var(--pen-muted)';
            return (
              <g key={`a${j}`} style={{ opacity: hot ? 1 : 0.7 }}>
                <path
                  d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${cy} ${x2} ${y2}`}
                  style={{ fill: 'none', stroke: c, strokeWidth: hot ? 2.6 : 1.6 }}
                />
                <path
                  d={`M${x2 - 5} ${y2 - 7} L${x2} ${y2} L${x2 + 5} ${y2 - 7}`}
                  style={{ fill: 'none', stroke: c, strokeWidth: 2 }}
                />
              </g>
            );
          })}
          <text x={4} y={BASE + 18} font-size={12} class="ms__mono">
            i
          </text>
          <text x={4} y={BASE + 44} font-size={12} class="ms__mono">
            ans
          </text>
          <line x1={SX - 6} y1={BASE} x2={SX - 6} y2={BASE - 10 * (BOX + 2)} class="ms__wall" />
          <line x1={SX + SW + 6} y1={BASE} x2={SX + SW + 6} y2={BASE - 10 * (BOX + 2)} class="ms__wall" />
          <line x1={SX - 6} y1={BASE} x2={SX + SW + 6} y2={BASE} class="ms__wall" />
          {f.stack.map((j, s) => (
            <g key={`s${j}`}>
              <rect
                x={SX}
                y={BASE - (s + 1) * (BOX + 2)}
                width={SW}
                height={BOX}
                rx={5}
                style={{
                  fill: done ? 'var(--wash-red)' : 'var(--wash-blue)',
                  stroke: done ? 'var(--pen-red)' : 'var(--pen-blue)',
                  strokeWidth: s === f.stack.length - 1 ? 2.5 : 1.5,
                }}
              />
              <text
                x={SX + SW / 2}
                y={BASE - s * (BOX + 2) - 7}
                text-anchor="middle"
                font-size={15}
                style={{ fill: 'var(--pen-ink)' }}
              >
                {nums[j]}{' '}
                <tspan class="ms__mono" font-size={11}>
                  [{j}]
                </tspan>
              </text>
            </g>
          ))}
          {f.popped !== null && (
            <g class="ms__ghost">
              <rect x={SX} y={BASE - (f.stack.length + 1) * (BOX + 2)} width={SW} height={BOX} rx={5} />
              <text
                x={SX + SW / 2}
                y={BASE - f.stack.length * (BOX + 2) - 7}
                text-anchor="middle"
                font-size={14}
              >
                pop {nums[f.popped]}
              </text>
            </g>
          )}
          <text x={SX + SW / 2} y={BASE + 18} text-anchor="middle" font-size={13} class="ms__mono">
            stack
          </text>
        </svg>
      </div>
      <div class="gd__stats">
        <span>
          pushes <b>{f.pushes}</b>
        </span>
        <span>
          pops <b>{f.pops}</b>
        </span>
        <span>
          pushes + pops <b>{f.pushes + f.pops}</b> ≤ 2n = <b>{2 * n}</b>
        </span>
      </div>
      {done && (
        <p class="gd__verdict gd__verdict--ok" role="status">
          ✓ O(n): {f.pushes + f.pops} stack operations for n = {n}. Each index pushed once, popped at most
          once.
        </p>
      )}
      <Controls p={p} caption={f.caption} />
      <form
        class="gd__row"
        onSubmit={(e) => {
          e.preventDefault();
          const a = parseNums(draft);
          if (a) load(a);
        }}
      >
        <input
          type="text"
          class="gd__input ms__input mono"
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          aria-label="Array values, 1 to 10 numbers from 0 to 99"
          aria-invalid={bad}
          placeholder="2 1 2 4 3"
        />
        <button type="submit" class="btn" disabled={bad}>
          Use
        </button>
        <button
          type="button"
          class="btn"
          onClick={() => {
            setSeed(seed + 1);
            load(randomNums(8, seed + 1));
          }}
        >
          <Icon name="shuffle" size={16} /> Random
        </button>
        {PRESETS.map(([name, a]) => (
          <button key={name} type="button" class="btn btn--ghost" onClick={() => load(a)}>
            {name}
          </button>
        ))}
      </form>
      {bad && <p class="ms__err">Enter 1–10 whole numbers from 0 to 99.</p>}
    </Shell>
  );
}
