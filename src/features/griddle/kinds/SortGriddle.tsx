import { useMemo, useState } from 'preact/hooks';
import {
  bubbleSort,
  insertionSort,
  mergeSort,
  type SortParams,
  type SortState,
} from '../../../engine/viz/sorts';
import { type Frame, frames, shuffled, type Tracer } from '../../../engine/viz/types';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, Stepper, usePlayer } from '../player';

const ALGOS: Record<string, { tracer: Tracer<SortParams, SortState>; title: string; hint: string }> = {
  'bubble-sort': {
    tracer: bubbleSort,
    title: 'Bubble sort, one comparison at a time',
    hint: 'Run it, scrub the slider, or step with ← →. Highlighted plates are being compared; green ones are parked for good.',
  },
  'insertion-sort': {
    tracer: insertionSort,
    title: 'Insertion sort: grow a sorted prefix',
    hint: 'Watch each new value slide left past every larger one. The number of shifts equals the number of inversions.',
  },
  'merge-sort': {
    tracer: mergeSort,
    title: 'Merge sort: merge sorted halves',
    hint: 'Pairs, then fours, then the whole row: every level merges two sorted runs with two pointers.',
  },
};

const DEFAULT = [5, 3, 8, 1, 9, 2, 7, 4];

export default function SortGriddle({ kind }: { kind: string }) {
  const algo = ALGOS[kind] ?? (ALGOS['bubble-sort'] as (typeof ALGOS)[string]);
  const [values, setValues] = useState<number[]>(DEFAULT);
  const [seed, setSeed] = useState(37);
  const fr = useMemo(() => frames(algo.tracer, { values }), [algo, values]);
  const p = usePlayer(fr.length, kind === 'merge-sort' ? 520 : 620);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as Frame<SortState>;
  const st = f.state;
  const n = st.a.length;
  const max = Math.max(...values, 1);
  const W = 520;
  const H = 230;
  const gap = 10;
  const bw = (W - gap * (n - 1)) / n;
  const byValue = kind !== 'merge-sort' && new Set(values).size === values.length;
  const counts = useMemo(() => {
    let c = 0;
    let s = 0;
    for (let i = 1; i <= p.k && i < fr.length; i++)
      for (const e of fr[i]?.events ?? []) {
        if (e.t === 'compare') c++;
        if (e.t === 'swap' || e.t === 'set') s++;
      }
    return { c, s };
  }, [fr, p.k]);

  const reshuffle = (size: number, sd: number) => {
    setValues(shuffled(size, sd));
    p.setPlaying(false);
    p.setK(0);
  };

  return (
    <Shell title={algo.title} hint={algo.hint} p={p}>
      <div class="gd__stage paper">
        <svg viewBox={`0 0 ${W} ${H + 40}`} role="img" aria-label={`Bars: ${st.a.join(', ')}`}>
          {st.a.map((v, i) => {
            const key = byValue ? `v${v}` : `i${i}`;
            const h = 26 + (v / max) * (H - 40);
            const active = st.active.includes(i);
            const sorted = st.sorted.has(i);
            const fill = active ? 'var(--hl)' : sorted ? 'var(--wash-green)' : 'var(--wash-blue)';
            const stroke = active ? 'var(--pen-orange)' : sorted ? 'var(--pen-green)' : 'var(--pen-blue)';
            return (
              <g key={key} class="anim" style={{ transform: `translateX(${i * (bw + gap)}px)` }}>
                <rect
                  class="anim"
                  x={0}
                  y={H - h}
                  width={bw}
                  height={h}
                  rx={7}
                  style={{ fill, stroke, strokeWidth: 2 }}
                />
                <text
                  x={bw / 2}
                  y={H - h - 9}
                  text-anchor="middle"
                  font-size={18}
                  style={{ fill: 'var(--pen-ink)' }}
                >
                  {v}
                </text>
                <text
                  x={bw / 2}
                  y={H + 26}
                  text-anchor="middle"
                  font-size={13}
                  style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div class="gd__stats">
        <span>
          comparisons <b>{counts.c}</b>
        </span>
        <span>
          {kind === 'bubble-sort' ? 'swaps' : 'writes'} <b>{counts.s}</b>
        </span>
        <span>
          n <b>{n}</b>
        </span>
      </div>
      <Controls
        p={p}
        caption={f.caption}
        extra={
          <>
            <Stepper label="N" value={values.length} min={4} max={12} onChange={(v) => reshuffle(v, seed)} />
            <button
              type="button"
              class="btn"
              onClick={() => {
                setSeed(seed + 1);
                reshuffle(values.length, seed + 1);
              }}
            >
              <Icon name="shuffle" size={17} /> Shuffle
            </button>
          </>
        }
      />
    </Shell>
  );
}
