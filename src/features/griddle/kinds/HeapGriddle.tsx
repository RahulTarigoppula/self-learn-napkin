import '../../../styles/griddles/heap.css';
import { useState } from 'preact/hooks';
import {
  type HeapFrame,
  heapHeight,
  heapifyFrames,
  heapPopFrames,
  heapPushFrames,
  parentOf,
  randomHeapInput,
} from '../../../engine/viz/heap';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, usePlayer } from '../player';

const LESSON = [2, 4, 3, 9, 7, 8, 5];
const MAX = 15;
const W = 560;
const DY = 56;
const AY = 262; // array row top
const CW = 36;

const start = (a: number[], caption: string): HeapFrame[] => [
  { a, hot: null, bad: false, swapped: false, swaps: 0, done: true, caption },
];

function pos(i: number): [number, number] {
  const d = Math.floor(Math.log2(i + 1));
  const k = i - (2 ** d - 1);
  return [((k + 0.5) * W) / 2 ** d, 26 + d * DY];
}

export default function HeapGriddle() {
  const [fr, setFr] = useState<HeapFrame[]>(() => start(LESSON, 'min-heap: every parent ≤ its children'));
  const [before, setBefore] = useState(0);
  const [draft, setDraft] = useState('1');
  const [seed, setSeed] = useState(11);
  const p = usePlayer(fr.length, 800);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as HeapFrame;
  const cur = (fr.at(-1) as HeapFrame).a;
  const a = f.a;
  const n = a.length;
  const hot = new Set(f.hot ?? []);
  const broken = a.filter((v, i) => i > 0 && (a[parentOf(i)] as number) > v).length;
  const x = Number(draft);
  const okDraft = draft.trim() !== '' && Number.isInteger(x) && x >= 0 && x <= 99;
  const ax = (i: number) => (W - n * CW) / 2 + i * CW;

  const run = (frames: HeapFrame[], reset = false) => {
    setBefore(reset ? 0 : before + (fr.at(-1) as HeapFrame).swaps);
    setFr(frames);
    p.setK(0);
    p.setPlaying(true);
  };

  const tone = (i: number): [string, string, string] =>
    hot.has(i)
      ? f.swapped
        ? ['var(--wash-green)', 'var(--pen-green)', 'var(--pen-ink)']
        : ['var(--hl)', f.bad ? 'var(--pen-red)' : 'var(--pen-orange)', 'var(--hl-ink)']
      : ['var(--surface)', 'var(--pen-ink)', 'var(--pen-ink)'];

  const edgeStyle = (i: number) => {
    const isHot = f.hot?.[0] === i;
    const bad = (a[parentOf(i)] as number) > (a[i] as number);
    const stroke = isHot
      ? f.swapped
        ? 'var(--pen-green)'
        : bad
          ? 'var(--pen-red)'
          : 'var(--pen-blue)'
      : bad
        ? 'var(--pen-red)'
        : 'var(--pen-muted)';
    return { stroke, strokeWidth: isHot ? 4 : 2, strokeDasharray: bad && !isHot ? '5 4' : undefined };
  };

  const [hc, hp] = f.hot ?? [-1, -1];
  const arcDepth = 18 + Math.min(40, (hc - hp) * 4);

  return (
    <Shell
      title="Sift a min-heap, tree and array"
      hint="The tree is just the array read level by level: parent of i is ⌊(i−1)/2⌋. Insert a tiny value to watch it rise to the root, or heapify a random array and watch the red edges vanish."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} ${AY + CW + 86}`}
          role="img"
          aria-label={`Heap array [${a.join(', ')}]. ${broken === 0 ? 'Valid min-heap' : `${broken} broken edges`}. ${f.caption}`}
        >
          {a.map((_, i) => {
            if (i === 0) return null;
            const [x1, y1] = pos(parentOf(i));
            const [x2, y2] = pos(i);
            return <line key={`e${i}`} x1={x1} y1={y1} x2={x2} y2={y2} style={edgeStyle(i)} />;
          })}
          {a.map((v, i) => {
            const [cx, cy] = pos(i);
            const [fill, stroke, ink] = tone(i);
            return (
              <g key={`n${i}`}>
                <circle
                  class="anim"
                  cx={cx}
                  cy={cy}
                  r={18}
                  style={{ fill, stroke, strokeWidth: hot.has(i) ? 3 : 2 }}
                />
                <text
                  x={cx}
                  y={cy + 6}
                  text-anchor="middle"
                  font-size={17}
                  style={{ fill: ink, fontWeight: 700 }}
                >
                  {v}
                </text>
                <text x={cx + 21} y={cy - 12} font-size={10} class="hp__idx">
                  {i}
                </text>
              </g>
            );
          })}
          {a.map((v, i) => {
            const [fill, stroke, ink] = tone(i);
            return (
              <g key={`c${i}`}>
                <rect
                  class="anim"
                  x={ax(i) + 2}
                  y={AY}
                  width={CW - 4}
                  height={CW - 4}
                  rx={6}
                  style={{ fill, stroke, strokeWidth: 2 }}
                />
                <text
                  x={ax(i) + CW / 2}
                  y={AY + 22}
                  text-anchor="middle"
                  font-size={16}
                  style={{ fill: ink, fontWeight: 700 }}
                >
                  {v}
                </text>
                <text x={ax(i) + CW / 2} y={AY + CW + 10} text-anchor="middle" font-size={11} class="hp__idx">
                  {i}
                </text>
              </g>
            );
          })}
          {f.hot && (
            <g class="hp__arc">
              <path
                d={`M${ax(hc) + CW / 2} ${AY + CW + 14} Q${(ax(hc) + ax(hp)) / 2 + CW / 2} ${AY + CW + 14 + arcDepth * 1.6} ${ax(hp) + CW / 2} ${AY + CW + 14}`}
              />
              <path
                d={`M${ax(hp) + CW / 2 - 5} ${AY + CW + 22} L${ax(hp) + CW / 2} ${AY + CW + 14} L${ax(hp) + CW / 2 + 5} ${AY + CW + 22}`}
              />
              <text
                x={(ax(hc) + ax(hp)) / 2 + CW / 2}
                y={AY + CW + 30 + arcDepth * 0.8}
                text-anchor="middle"
                font-size={12}
              >
                ({hc}−1)/2 = {hp}
              </text>
            </g>
          )}
        </svg>
      </div>
      <div class="gd__stats">
        <span>
          swaps <b>{before + f.swaps}</b>
        </span>
        <span>
          size <b>{n}</b>
        </span>
        <span>
          height <b>{heapHeight(n)}</b>
        </span>
        <span>
          min <b>{n > 0 ? a[0] : '—'}</b>
        </span>
      </div>
      <p class={`gd__verdict gd__verdict--${broken === 0 ? 'ok' : 'bad'}`} role="status">
        {broken === 0
          ? '✓ heap property holds: every parent ≤ its children'
          : `✗ ${broken} edge${broken === 1 ? '' : 's'} break parent ≤ child`}
      </p>
      <Controls p={p} caption={f.caption} />
      <form
        class="gd__row"
        onSubmit={(e) => {
          e.preventDefault();
          if (okDraft && cur.length < MAX) run(heapPushFrames(cur, x));
        }}
      >
        <input
          type="text"
          class="gd__input hp__input mono"
          inputMode="numeric"
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          aria-label="Value to insert, 0 to 99"
          aria-invalid={!okDraft}
          placeholder="0–99"
        />
        <button type="submit" class="btn btn--primary" disabled={!okDraft || cur.length >= MAX}>
          <Icon name="plus" size={16} /> Insert
        </button>
        <button type="button" class="btn" disabled={cur.length === 0} onClick={() => run(heapPopFrames(cur))}>
          <Icon name="minus" size={16} /> Pop min
        </button>
        <button
          type="button"
          class="btn"
          onClick={() => {
            setSeed(seed + 1);
            run(heapifyFrames(randomHeapInput(10, seed + 1)), true);
          }}
        >
          <Icon name="shuffle" size={16} /> Heapify random
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          onClick={() => run(heapifyFrames([9, 7, 8, 5, 2, 4, 3]), true)}
        >
          Heapify lesson
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          onClick={() => run(start(LESSON, 'min-heap: every parent ≤ its children'), true)}
        >
          <Icon name="replay" size={16} /> Reset
        </button>
      </form>
      {cur.length >= MAX && <p class="hp__note">Full at 15 (4 levels). Pop a few first.</p>}
    </Shell>
  );
}
