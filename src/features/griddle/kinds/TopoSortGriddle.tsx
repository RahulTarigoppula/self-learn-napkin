import '../../../styles/griddles/graphs.css';
import { useMemo, useState } from 'preact/hooks';
import {
  type Arrow,
  arrowKey,
  COURSES,
  type Dag,
  EXTRA_ARROWS,
  findCycle,
  type KFrame,
  kahnFrames,
} from '../../../engine/viz/toposort';
import { Controls, Shell, usePlayer } from '../player';
import { GEdge, GNode, type Pt } from './graphDraw';

const POS: Record<string, Pt> = {
  Intro: { x: 60, y: 70 },
  DS: { x: 230, y: 70 },
  DB: { x: 400, y: 70 },
  Math: { x: 60, y: 215 },
  Algo: { x: 230, y: 215 },
  ML: { x: 400, y: 215 },
};
/** Extra arrows are drawn bent so they never hide the napkin's own arrows. */
const BEND: Record<string, number> = { 'Intro→Math': 34, 'DB→Algo': -26, 'ML→DS': -26, 'Algo→Math': -44 };
const R = 31;

export default function TopoSortGriddle() {
  const [extra, setExtra] = useState<string[]>([]);
  const g: Dag = useMemo(
    () => ({
      nodes: COURSES.nodes,
      arrows: [...COURSES.arrows, ...EXTRA_ARROWS.filter((a) => extra.includes(arrowKey(a)))],
    }),
    [extra],
  );
  const fr = useMemo(() => kahnFrames(g), [g]);
  const p = usePlayer(fr.length, 750);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as KFrame;
  const s = f.state;
  const done = p.k >= p.last;
  const final = fr.at(-1) as KFrame;
  const stuck = final.step === 'stuck';
  const leftovers = g.nodes.filter((n) => !final.state.order.includes(n));
  const cycle = useMemo(() => (stuck ? findCycle(g, leftovers).map(arrowKey) : []), [g, stuck]);
  const showCycle = done && stuck;

  const toggle = (a: Arrow) => {
    const k = arrowKey(a);
    setExtra(extra.includes(k) ? extra.filter((x) => x !== k) : [...extra, k]);
    p.setPlaying(false);
    p.setK(0);
  };

  return (
    <Shell
      title="Kahn's algorithm: peel off what's ready"
      hint="Badges count unmet prerequisites. In-degree 0 → queue → output, then cut its arrows. Add rules below; try ML → DS and watch the queue run dry."
      p={p}
    >
      <div class="gd__stage paper gg-stage">
        <svg
          viewBox="0 0 460 290"
          role="img"
          aria-label={`Course graph, ${g.arrows.length} arrows. In-degrees: ${g.nodes.map((n) => `${n} ${s.indeg[n]}`).join(', ')}. Output so far: ${s.order.join(', ') || 'none'}.`}
        >
          {g.arrows.map((a) => {
            const k = arrowKey(a);
            const isExtra = k in BEND;
            const cur = s.arrow !== null && arrowKey(s.arrow) === k;
            const inCycle = showCycle && cycle.includes(k);
            return (
              <GEdge
                key={k}
                a={POS[a[0]] as Pt}
                b={POS[a[1]] as Pt}
                r={R}
                arrow
                bend={BEND[k] ?? 0}
                stroke={
                  inCycle
                    ? 'var(--pen-red)'
                    : cur
                      ? 'var(--pen-orange)'
                      : isExtra
                        ? 'var(--pen-violet)'
                        : 'var(--pen-ink)'
                }
                width={cur || inCycle ? 4 : 2.2}
                dash={isExtra && !inCycle ? '7 5' : undefined}
                opacity={s.cut.includes(k) && !cur ? 0.22 : 1}
              />
            );
          })}
          {g.nodes.map((n) => {
            const pt = POS[n] as Pt;
            const out = s.order.includes(n);
            const queued = s.queue.includes(n);
            const left = showCycle && leftovers.includes(n);
            const d = s.indeg[n] as number;
            const hit = s.arrow?.[1] === n;
            return (
              <g key={n}>
                <GNode
                  p={pt}
                  r={R}
                  label={n}
                  fontSize={16}
                  fill={
                    s.current === n
                      ? 'var(--hl)'
                      : out
                        ? 'var(--wash-green)'
                        : queued
                          ? 'var(--wash-blue)'
                          : left
                            ? 'var(--wash-red)'
                            : 'var(--surface)'
                  }
                  ink={s.current === n ? 'var(--hl-ink)' : 'var(--pen-ink)'}
                  stroke={
                    left
                      ? 'var(--pen-red)'
                      : out
                        ? 'var(--pen-green)'
                        : queued
                          ? 'var(--pen-blue)'
                          : 'var(--pen-ink)'
                  }
                />
                {!out && (
                  <g class="anim">
                    <rect
                      x={pt.x + 16}
                      y={pt.y - 46}
                      width={26}
                      height={26}
                      rx={6}
                      style={{
                        fill: hit ? 'var(--hl)' : d === 0 ? 'var(--wash-green)' : 'var(--wash-orange)',
                        stroke: d === 0 ? 'var(--pen-green)' : 'var(--pen-orange)',
                        strokeWidth: hit ? 3 : 1.6,
                      }}
                    />
                    <text
                      x={pt.x + 29}
                      y={pt.y - 27}
                      text-anchor="middle"
                      font-size={16}
                      style={{
                        fill: hit ? 'var(--hl-ink)' : 'var(--pen-ink)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    >
                      {d}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <ol class="gg-chips" aria-label="Queue of ready courses">
        <li class="gg-chips__label" aria-hidden="true">
          queue
        </li>
        {s.queue.length === 0 && <li class="gg-chip gg-chip--empty">empty</li>}
        {s.queue.map((n, i) => (
          <li key={n} class={`gg-chip${i === 0 ? ' gg-chip--min' : ''}`}>
            {n}
          </li>
        ))}
      </ol>
      <ol class="gg-chips" aria-label="Output order">
        <li class="gg-chips__label" aria-hidden="true">
          order
        </li>
        {s.order.length === 0 && <li class="gg-chip gg-chip--empty">nothing yet</li>}
        {s.order.map((n, i) => (
          <li key={n} class="gg-chip gg-chip--out">
            {i + 1}. {n}
          </li>
        ))}
      </ol>
      <div class="gd__stats">
        <span>
          output <b>{s.order.length}</b>/{g.nodes.length}
        </span>
        <span>
          arrows cut <b>{s.cut.length}</b>/{g.arrows.length}
        </span>
        <span>
          work <b>O(V + E)</b> = {g.nodes.length} + {g.arrows.length}
        </span>
      </div>
      {done &&
        (stuck ? (
          <p class="gd__verdict gd__verdict--bad" aria-live="polite">
            ✗ Cycle detected: {cycle.map((k) => k.split('→')[0]).join(' → ')} → {cycle[0]?.split('→')[0]}.
            Only {final.state.order.length} of {g.nodes.length} came out; {leftovers.join(', ')} never reached
            in-degree 0, so no valid order exists.
          </p>
        ) : (
          <p class="gd__verdict gd__verdict--ok" aria-live="polite">
            ✓ {g.nodes.length} of {g.nodes.length} out: {final.state.order.join(', ')}. Every arrow points
            forward.
          </p>
        ))}
      <div class="gd__row gg-toggles" role="group" aria-label="Extra prerequisite arrows">
        <span class="eyebrow">add a rule</span>
        {EXTRA_ARROWS.map((a) => (
          <button
            key={arrowKey(a)}
            type="button"
            class="btn"
            aria-pressed={extra.includes(arrowKey(a))}
            onClick={() => toggle(a)}
          >
            {a[0]} → {a[1]}
          </button>
        ))}
      </div>
      <Controls p={p} caption={f.caption} />
    </Shell>
  );
}
