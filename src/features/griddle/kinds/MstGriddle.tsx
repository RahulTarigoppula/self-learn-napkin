import '../../../styles/griddles/graphs.css';
import { useMemo, useState } from 'preact/hooks';
import {
  edgeName,
  kruskalFrames,
  type MFrame,
  MST_GRAPH,
  type MstGraph,
  sortedEdges,
} from '../../../engine/viz/kruskal';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, Stepper, usePlayer } from '../player';
import { GEdge, GNode, type Pt } from './graphDraw';

const POS: Record<string, Pt> = {
  A: { x: 50, y: 60 },
  B: { x: 200, y: 36 },
  C: { x: 370, y: 78 },
  D: { x: 56, y: 240 },
  E: { x: 210, y: 222 },
  F: { x: 376, y: 262 },
};
/** One colour per piece, picked by the piece's alphabetically first town. */
const PIECE = ['blue', 'green', 'orange', 'violet', 'muted', 'red'];
const NAPKIN_TOTAL = 16;

export default function MstGriddle() {
  const [weights, setWeights] = useState<number[]>(MST_GRAPH.edges.map((e) => e.w));
  const [sel, setSel] = useState(2);
  const g: MstGraph = useMemo(
    () => ({
      nodes: MST_GRAPH.nodes,
      edges: MST_GRAPH.edges.map((e, i) => ({ ...e, w: weights[i] as number })),
    }),
    [weights],
  );
  const fr = useMemo(() => kruskalFrames(g), [g]);
  const order = useMemo(() => sortedEdges(g), [g]);
  const p = usePlayer(fr.length, 800);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as MFrame;
  const s = f.state;
  const done = p.k >= p.last;
  const final = (fr.at(-1) as MFrame).state;
  const edited = weights.some((w, i) => w !== MST_GRAPH.edges[i]?.w);
  const colour = (n: string) => {
    const first = g.nodes.findIndex((m) => s.piece[m] === s.piece[n]);
    return PIECE[first] ?? 'muted';
  };
  const pieces = new Set(Object.values(s.piece)).size;
  const selEdge = g.edges[sel] as MstGraph['edges'][number];

  const setW = (w: number) => {
    setWeights(weights.map((x, i) => (i === sel ? w : x)));
    p.setK(0);
    p.setPlaying(true);
  };
  const status = (i: number) =>
    s.current === i
      ? 'current'
      : (s.decided[i] ?? (done || s.kept === g.nodes.length - 1 ? 'unused' : 'idle'));

  return (
    <Shell
      title="Kruskal: cheapest edge first, never a loop"
      hint="Edges are tried cheapest first. Same colour = already connected, so that edge would close a cycle. Pick an edge and change its weight; try making A–E 1 or C–F 10."
      p={p}
    >
      <div class="mst">
        <div class="gd__stage paper gg-stage">
          <svg
            viewBox="10 4 410 290"
            role="img"
            aria-label={`${pieces} pieces, ${s.kept} edges kept, total ${s.total}. ${f.caption}`}
          >
            {g.edges.map((e, i) => {
              const st = status(i);
              const dec = s.decided[i];
              return (
                <GEdge
                  key={edgeName(e)}
                  a={POS[e.u] as Pt}
                  b={POS[e.v] as Pt}
                  stroke={
                    dec === 'keep'
                      ? 'var(--pen-green)'
                      : dec === 'skip'
                        ? 'var(--pen-red)'
                        : 'var(--pen-muted)'
                  }
                  width={dec === 'keep' ? 5 : dec === 'skip' ? 3 : 2}
                  dash={dec === 'skip' ? '7 6' : undefined}
                  under={st === 'current' ? 'var(--hl)' : undefined}
                  opacity={st === 'unused' ? 0.4 : 1}
                  label={i === sel ? `✎${e.w}` : e.w}
                  labelFill={i === sel ? 'var(--pen-violet)' : 'var(--pen-blue)'}
                  labelSize={22}
                  onClick={() => setSel(i)}
                />
              );
            })}
            {g.nodes.map((n) => (
              <GNode
                key={n}
                p={POS[n] as Pt}
                label={n}
                r={24}
                fontSize={21}
                fill={`var(--wash-${colour(n)})`}
                stroke={`var(--pen-${colour(n)})`}
                width={3}
              />
            ))}
          </svg>
        </div>
        <ol class="mst__list" aria-label="Edges, cheapest first. Choose one to edit its weight.">
          {order.map((i) => {
            const e = g.edges[i] as MstGraph['edges'][number];
            const st = status(i);
            const mark = { keep: '✓', skip: '✗ cycle', current: '▶', unused: '·', idle: '' }[st];
            return (
              <li key={i}>
                <button
                  type="button"
                  class={`is-${st}`}
                  aria-pressed={i === sel}
                  aria-label={`${edgeName(e)} weight ${e.w}${st === 'idle' ? '' : `, ${st}`}`}
                  onClick={() => setSel(i)}
                >
                  <span>
                    {edgeName(e)} {e.w}
                  </span>
                  <b>{mark}</b>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <div class="gd__stats">
        <span>
          pieces <b>{pieces}</b>
        </span>
        <span>
          edges kept <b>{s.kept}</b>/{g.nodes.length - 1}
        </span>
        <span>
          total weight <b>{s.total}</b>
        </span>
      </div>
      {done && (
        <p class="gd__verdict gd__verdict--ok" aria-live="polite">
          ✓ MST complete: {final.kept} edges, total {final.total}
          {edited
            ? final.total === NAPKIN_TOTAL
              ? ', the same total as the napkin.'
              : `, ${final.total < NAPKIN_TOTAL ? 'cheaper' : 'dearer'} than the napkin's ${NAPKIN_TOTAL}.`
            : ' = 1 + 2 + 3 + 4 + 6. A–E was skipped: A and E were already joined.'}
        </p>
      )}
      <div class="gd__row">
        <Stepper label={`${edgeName(selEdge)} weight`} value={selEdge.w} min={1} max={15} onChange={setW} />
        <button
          type="button"
          class="btn btn--ghost"
          disabled={!edited}
          onClick={() => {
            setWeights(MST_GRAPH.edges.map((e) => e.w));
            p.setPlaying(false);
            p.setK(0);
          }}
        >
          <Icon name="replay" size={16} /> Napkin weights
        </button>
      </div>
      <Controls p={p} caption={f.caption} />
    </Shell>
  );
}
