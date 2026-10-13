import { useMemo, useState } from 'preact/hooks';
import {
  dpFrameCount,
  dpView,
  greedyByRatio,
  KNAPSACK_CAPACITY,
  KNAPSACK_ITEMS,
  knapsackRun,
} from '../../../engine/viz/dp-table';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, Stepper, usePlayer } from '../player';
import { DpTable, type Head } from './DpTable';

const ALL = KNAPSACK_ITEMS;

export default function KnapsackGriddle() {
  const [on, setOn] = useState<boolean[]>(() => ALL.map(() => true));
  const [cap, setCap] = useState(KNAPSACK_CAPACITY);
  const items = useMemo(() => ALL.filter((_, k) => on[k]), [on]);
  const run = useMemo(() => knapsackRun(items, cap), [items, cap]);
  const greedy = useMemo(() => greedyByRatio(items, cap), [items, cap]);
  const p = usePlayer(dpFrameCount(run), 300);
  const view = dpView(run, p.k);

  const restart = () => {
    p.setPlaying(false);
    p.setK(0);
  };
  const picked = new Set(view.steps.flatMap((s) => (s.mark && s.note ? [s.note] : [])));
  const greedyNames = new Set(greedy.chosen.map((k) => items[k]?.name));
  const bestSoFar = Math.max(0, ...run.fills.slice(0, view.filled).map((f) => f.v));
  const differs = greedy.value !== run.value;
  const rows: Head[] = [{ main: '∅' }, ...items.map((it) => ({ main: it.name, sub: `${it.w}kg $${it.v}` }))];
  const cols: Head[] = Array.from({ length: cap + 1 }, (_, c) => ({ main: String(c) }));

  return (
    <Shell
      title="Pack the 0/1 knapsack, row by row"
      hint="Toggle items and change the capacity. Each cell: skip (↑) or take (↖ back w columns, plus its value). Then walk back to see what's in the bag. Try capacity 4 or 7, where greedy by $/kg falls short."
      p={p}
    >
      <div class="dp__items" role="group" aria-label="Items">
        {ALL.map((it, k) => {
          const isOn = on[k] ?? false;
          return (
            <button
              key={it.name}
              type="button"
              class={`dp__item${isOn && picked.has(it.name) ? ' is-chosen' : ''}`}
              aria-pressed={isOn}
              aria-label={`Item ${it.name}: ${it.w} kg, $${it.v}${isOn ? ', in the list' : ', left out'}`}
              onClick={() => {
                setOn(on.map((x, i) => (i === k ? !x : x)));
                restart();
              }}
            >
              <b>
                {it.name}
                {isOn && picked.has(it.name) ? ' ✓' : ''}
              </b>
              <span class="mono">
                {it.w} kg · ${it.v}
              </span>
              <span class="mono">${(it.v / it.w).toFixed(2)}/kg</span>
              {view.done && isOn && greedyNames.has(it.name) && <span class="dp__badge">greedy pick</span>}
            </button>
          );
        })}
      </div>
      <DpTable
        run={run}
        view={view}
        rows={rows}
        cols={cols}
        corner="c"
        headW={60}
        label={`Knapsack table, ${items.length} items, capacity ${cap}`}
        tagColor={() => 'var(--success-ink)'}
        onPick={(k) => {
          p.setPlaying(false);
          p.setK(k);
        }}
      />
      <div class="gd__legend">
        <span>
          <i style={{ background: 'var(--hl)' }} />
          this cell
        </span>
        <span>
          <i style={{ background: 'var(--wash-green)' }} />
          winner / taken
        </span>
        <span>
          <i style={{ background: 'var(--wash-blue)' }} />
          other option
        </span>
        <span>+ = taking it won</span>
      </div>
      <div class="gd__stats">
        <span>
          cells{' '}
          <b>
            {view.filled}/{run.fills.length}
          </b>
        </span>
        <span>
          best so far <b>${bestSoFar}</b>
        </span>
        <span>
          brute force would try <b>{2 ** items.length}</b> bags
        </span>
      </div>
      {view.done && (
        <p class={`gd__verdict gd__verdict--${differs ? 'bad' : 'ok'}`} role="status">
          {differs
            ? `Greedy got $${greedy.value}, DP got $${run.value}. Best $/kg first isn't the best bag.`
            : `DP got $${run.value} (${run.weight} kg). Greedy by $/kg got $${greedy.value} too, this time.`}
        </p>
      )}
      <Controls
        p={p}
        caption={view.caption}
        extra={
          <>
            <Stepper
              label="capacity"
              value={cap}
              min={1}
              max={8}
              onChange={(v) => {
                setCap(v);
                restart();
              }}
            />
            <button
              type="button"
              class="btn btn--ghost"
              onClick={() => {
                p.setPlaying(false);
                p.setK(p.last);
              }}
            >
              <Icon name="skipForward" size={15} /> Answer
            </button>
          </>
        }
      />
    </Shell>
  );
}
