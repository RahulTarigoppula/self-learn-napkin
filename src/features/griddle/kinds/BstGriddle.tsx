import { useMemo, useState } from 'preact/hooks';
import { type BstNode, bstFrom, height, searchPath } from '../../../engine/viz/systems';
import { Icon } from '../../ui/Icon';
import { Shell } from '../player';

const START = [8, 3, 10, 1, 6, 14, 4, 7, 13];
interface Placed {
  v: number;
  x: number;
  y: number;
  px?: number;
  py?: number;
}

function layout(t: BstNode | null): Placed[] {
  const out: Placed[] = [];
  let i = 0;
  const walk = (n: BstNode | null, depth: number, parent?: Placed) => {
    if (!n) return;
    walk(n.l, depth + 1, undefined);
    const me: Placed = { v: n.v, x: i++, y: depth };
    if (parent) {
      me.px = parent.x;
      me.py = parent.y;
    }
    out.push(me);
    walk(n.r, depth + 1, undefined);
  };
  walk(t, 0);
  // link parents in a second pass (in-order index gives x)
  const byV = new Map(out.map((p) => [p.v, p]));
  const link = (n: BstNode | null) => {
    if (!n) return;
    for (const c of [n.l, n.r]) {
      if (!c) continue;
      const child = byV.get(c.v);
      const par = byV.get(n.v);
      if (child && par) {
        child.px = par.x;
        child.py = par.y;
      }
      link(c);
    }
  };
  link(t);
  return out;
}

export default function BstGriddle() {
  const [values, setValues] = useState<number[]>(START);
  const [query, setQuery] = useState<number | null>(6);
  const [draft, setDraft] = useState('');
  const tree = useMemo(() => bstFrom(values), [values]);
  const nodes = useMemo(() => layout(tree), [tree]);
  const path = useMemo(() => (query === null ? [] : searchPath(tree, query)), [tree, query]);
  const found = query !== null && path.at(-1) === query;
  const n = nodes.length;
  const h = height(tree);
  const W = 540;
  const dx = W / Math.max(1, n);
  const dy = Math.min(70, 300 / Math.max(1, h));
  const X = (i: number) => dx * i + dx / 2;
  const Y = (d: number) => 30 + d * dy;

  const insert = (e: Event) => {
    e.preventDefault();
    const v = Number(draft);
    if (!Number.isInteger(v) || v < 0 || v > 99 || values.includes(v)) return;
    setValues([...values, v]);
    setQuery(v);
    setDraft('');
  };

  return (
    <Shell
      title="Grow and search a binary search tree"
      hint="Smaller keys go left, larger go right. Insert values (try 1, 2, 3, 4… in order to see a tree degrade into a list) and tap a node to search for it."
    >
      <div class="gd__stage paper">
        <svg viewBox={`0 0 ${W} ${Y(h - 1) + 34}`} role="img" aria-label={`BST of ${n} keys, height ${h}`}>
          {nodes.map(
            (p) =>
              p.px !== undefined &&
              p.py !== undefined && (
                <line
                  key={`e${p.v}`}
                  x1={X(p.px)}
                  y1={Y(p.py)}
                  x2={X(p.x)}
                  y2={Y(p.y)}
                  style={{
                    stroke:
                      path.includes(p.v) && path.includes(nodes.find((q) => q.x === p.px)?.v ?? -1)
                        ? 'var(--pen-orange)'
                        : 'var(--pen-muted)',
                    strokeWidth: 2.2,
                  }}
                />
              ),
          )}
          {nodes.map((p) => {
            const onPath = path.includes(p.v);
            return (
              <g key={p.v} onClick={() => setQuery(p.v)} style={{ cursor: 'pointer' }}>
                <circle
                  class="anim"
                  cx={X(p.x)}
                  cy={Y(p.y)}
                  r={18}
                  style={{
                    fill:
                      found && p.v === query ? 'var(--wash-green)' : onPath ? 'var(--hl)' : 'var(--surface)',
                    stroke: onPath ? 'var(--pen-orange)' : 'var(--pen-ink)',
                    strokeWidth: 2,
                  }}
                />
                <text
                  x={X(p.x)}
                  y={Y(p.y) + 6}
                  text-anchor="middle"
                  font-size={16}
                  style={{ fill: 'var(--pen-ink)', fontWeight: 700 }}
                >
                  {p.v}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p class="gd__caption mono" aria-live="polite">
        {query === null
          ? 'tap a node to search'
          : `search ${query}: ${path.join(' → ')} ${found ? '✓ found' : '✗ not found'} in ${path.length} comparisons`}
      </p>
      <div class="gd__stats">
        <span>
          keys <b>{n}</b>
        </span>
        <span>
          height <b>{h}</b>
        </span>
        <span>
          a perfectly balanced tree would need <b>{Math.ceil(Math.log2(n + 1))}</b> levels
        </span>
      </div>
      <form class="gd__row" onSubmit={insert}>
        <input
          class="gd__input"
          inputMode="numeric"
          value={draft}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          placeholder="0–99"
          aria-label="Value to insert"
        />
        <button type="submit" class="btn" disabled={!draft}>
          <Icon name="plus" size={16} /> Insert
        </button>
        <button type="button" class="btn btn--ghost" onClick={() => setValues([1, 2, 3, 4, 5, 6, 7])}>
          Sorted inserts
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          onClick={() => {
            setValues(START);
            setQuery(6);
          }}
        >
          Reset
        </button>
      </form>
    </Shell>
  );
}
