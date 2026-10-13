import '../../../styles/griddles/graphs.css';
import { useMemo, useState } from 'preact/hooks';
import {
  bellmanFord,
  type DFrame,
  DIJKSTRA_GRAPH,
  dijkstraFrames,
  dijkstraMistakes,
  fmtDist,
  pathTo,
  withDetour,
} from '../../../engine/viz/dijkstra';
import { Controls, Shell, usePlayer } from '../player';
import { GEdge, GNode, type Pt, StrikeLabel } from './graphDraw';

const POS: Record<string, Pt> = {
  A: { x: 40, y: 180 },
  B: { x: 170, y: 90 },
  C: { x: 170, y: 270 },
  D: { x: 325, y: 90 },
  E: { x: 325, y: 270 },
  F: { x: 455, y: 180 },
  G: { x: 52, y: 52 },
};
/** Where each distance label sits relative to its node. */
const LABEL_DY: Record<string, number> = { A: 54, B: -36, C: 54, D: -36, E: 54, F: 54, G: -36 };
const on = (path: string[], u: string, v: string) =>
  path.some((n, i) => i > 0 && ((path[i - 1] === u && n === v) || (path[i - 1] === v && n === u)));

type Look = 'cur' | 'final' | 'queued' | 'idle';
const FILL: Record<Look, string> = {
  cur: 'var(--hl)',
  final: 'var(--wash-muted)',
  queued: 'var(--wash-blue)',
  idle: 'var(--surface)',
};
const STROKE: Record<Look, string> = {
  cur: 'var(--pen-orange)',
  final: 'var(--pen-muted)',
  queued: 'var(--pen-blue)',
  idle: 'var(--pen-ink)',
};
/** Colour of the edge being relaxed, by what happened to it. */
const HOT: Partial<Record<DFrame['step'], string>> = { ignored: 'var(--pen-red)', keep: 'var(--pen-muted)' };

export default function DijkstraGriddle() {
  const [neg, setNeg] = useState(false);
  const [source, setSource] = useState('A');
  const [target, setTarget] = useState('F');
  const [tap, setTap] = useState<'source' | 'target'>('source');
  const g = useMemo(() => withDetour(DIJKSTRA_GRAPH, neg), [neg]);
  const fr = useMemo(() => dijkstraFrames(g, source), [g, source]);
  const mistakes = useMemo(() => dijkstraMistakes(g, source), [g, source]);
  const truth = useMemo(() => bellmanFord(g, source), [g, source]);
  const p = usePlayer(fr.length, 750);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as DFrame;
  const s = f.state;
  const done = p.k >= p.last;
  const path = s.settled.includes(target) ? pathTo(s.parent, target, source) : [];
  const seen = fr.slice(0, p.k + 1);
  const pops = seen.filter((x) => x.step === 'pop').length;
  const relaxes = seen.filter((x) => x.step === 'relax').length;
  const stale = seen.filter((x) => x.step === 'stale').length;

  const pick = (n: string, as = tap) => {
    if (as === 'source') {
      setSource(n);
      if (n === target) setTarget(source);
      p.setPlaying(false);
      p.setK(0);
    } else setTarget(n);
  };
  const nodes = g.nodes;
  const minPq = s.pq.find(([d, n]) => !s.settled.includes(n) && d === s.dist[n]);
  const bad = mistakes[0];
  const truePath = pathTo(truth.parent, target, source);
  const stats = [
    ['pops', pops],
    ['relaxations', relaxes],
    ['stale skips', stale],
    ['final', `${s.settled.length}/${nodes.length}`],
  ] as const;
  const verdict = bad
    ? `✗ Wrong! Dijkstra says ${bad.node} = ${fmtDist(bad.said)}, truth is ${fmtDist(bad.truth)}${
        mistakes.length > 1
          ? ` (${mistakes
              .slice(1)
              .map((m) => m.node)
              .join(', ')} inherit the error)`
          : ''
      }. ${bad.node} was final before the −5 edge was seen: negative edges break the greedy rule. Bellman-Ford finds ${
        truePath.length > 1
          ? `${truePath.join('→')} = ${fmtDist(truth.dist[target] as number)}`
          : 'the true distances'
      }.`
    : `✓ ${
        target === source || path.length === 0
          ? `All distances from ${source} are final.`
          : `Shortest ${source}→${target} = ${fmtDist(s.dist[target] as number)} via ${path.join('→')}.`
      }${neg ? ' The −5 edge never undercut a final node from here. Try source A.' : ''}`;

  return (
    <Shell
      title="Dijkstra: settle the closest, relax its roads"
      hint={`Tap a town to set the ${tap}. Step through: pop the queue's minimum, relax its edges, grey = final. Try the −5 edge and watch the greedy rule get fooled.`}
      p={p}
    >
      <div class="gd__stage paper gg-stage">
        <svg
          viewBox="0 -4 495 340"
          role="img"
          aria-label={`Dijkstra from ${source}. ${nodes.map((n) => `${n} ${fmtDist(s.dist[n] as number)}${s.settled.includes(n) ? ' final' : ''}`).join(', ')}. ${f.caption}`}
        >
          {g.edges.map((e) => {
            const cur =
              s.edge &&
              ((s.edge[0] === e.u && s.edge[1] === e.v) ||
                (!e.directed && s.edge[0] === e.v && s.edge[1] === e.u));
            const tree = s.parent[e.v] === e.u || (!e.directed && s.parent[e.u] === e.v);
            const col = cur
              ? (HOT[f.step] ?? 'var(--pen-orange)')
              : tree
                ? 'var(--pen-blue)'
                : 'var(--pen-muted)';
            return (
              <GEdge
                key={`${e.u}${e.v}`}
                a={POS[e.u] as Pt}
                b={POS[e.v] as Pt}
                r={24}
                arrow={e.directed}
                stroke={col}
                width={cur ? 4.5 : tree ? 3.2 : 2}
                under={on(path, e.u, e.v) ? 'var(--hl)' : undefined}
                label={fmtDist(e.w)}
                labelFill={e.w < 0 ? 'var(--pen-red)' : 'var(--pen-blue)'}
              />
            );
          })}
          {nodes.map((n) => {
            const settled = s.settled.includes(n);
            const queued = !settled && s.dist[n] !== Number.POSITIVE_INFINITY;
            const look: Look =
              s.current === n && f.step !== 'stale' ? 'cur' : settled ? 'final' : queued ? 'queued' : 'idle';
            const hit = s.edge?.[1] === n;
            return (
              <g key={n}>
                <GNode
                  p={POS[n] as Pt}
                  label={n}
                  r={24}
                  fontSize={21}
                  onClick={() => pick(n)}
                  fill={FILL[look]}
                  stroke={hit ? (HOT[f.step] ?? 'var(--pen-orange)') : STROKE[look]}
                  ink={look === 'cur' ? 'var(--hl-ink)' : 'var(--pen-ink)'}
                  width={hit ? 4 : 2.2}
                  ring={n === source ? 'var(--pen-green)' : n === target ? 'var(--pen-violet)' : undefined}
                  ringDash={n === target && n !== source ? '5 4' : undefined}
                />
                <StrikeLabel
                  x={(POS[n] as Pt).x}
                  y={(POS[n] as Pt).y + (LABEL_DY[n] ?? 40)}
                  cur={fmtDist(s.dist[n] as number)}
                  old={s.hist[n]?.length ? fmtDist(s.hist[n]?.at(-1) as number) : ''}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <ol class="gg-chips" aria-label="Priority queue, smallest first">
        <li class="gg-chips__label" aria-hidden="true">
          queue
        </li>
        {s.pq.length === 0 && <li class="gg-chip gg-chip--empty">empty</li>}
        {s.pq.map(([d, n]) => {
          const isStale = s.settled.includes(n) || d > (s.dist[n] as number);
          return (
            <li
              key={`${d}${n}`}
              class={`gg-chip${isStale ? ' gg-chip--stale' : minPq?.[1] === n && minPq[0] === d ? ' gg-chip--min' : ''}`}
            >
              ({fmtDist(d)}, {n})
            </li>
          );
        })}
      </ol>
      <div class="gd__stats">
        {stats.map(([k, v]) => (
          <span key={k}>
            {k} <b>{v}</b>
          </span>
        ))}
      </div>
      {done && (
        <p class={`gd__verdict gd__verdict--${bad ? 'bad' : 'ok'}`} aria-live="polite">
          {verdict}
        </p>
      )}
      <Controls
        p={p}
        caption={f.caption}
        extra={
          <>
            <div class="gd__seg" role="group" aria-label="Tapping a town sets">
              {(['source', 'target'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={tap === m} onClick={() => setTap(m)}>
                  tap = {m}
                </button>
              ))}
            </div>
            {(['source', 'target'] as const).map((m) => (
              <label key={m} class="gg-pick">
                {m}
                <select
                  value={m === 'source' ? source : target}
                  onChange={(e) => pick((e.target as HTMLSelectElement).value, m)}
                >
                  {nodes.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <span class="gg-toggles">
              <button
                type="button"
                class="btn"
                aria-pressed={neg}
                onClick={() => {
                  if (neg && (source === 'G' || target === 'G')) {
                    setSource('A');
                    setTarget('F');
                  }
                  setNeg(!neg);
                  p.setPlaying(false);
                  p.setK(0);
                }}
              >
                −5 edge
              </button>
            </span>
          </>
        }
      />
    </Shell>
  );
}
