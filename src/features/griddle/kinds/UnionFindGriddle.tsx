import '../../../styles/griddles/union-find.css';
import { useState } from 'preact/hooks';
import {
  dsuInit,
  findFrames,
  forestLayout,
  maxDepth,
  pathToRoot,
  sameSetFrames,
  scriptFrames,
  setCount,
  UF_LESSON,
  type UfFrame,
  type UfOptions,
  ufChain,
  unionFrames,
} from '../../../engine/viz/union-find';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, usePlayer } from '../player';

const N = 8;
const W = 560;
const R = 15;
const IDS = Array.from({ length: N }, (_, i) => i);
const fresh = (): UfFrame[] => [
  {
    ...dsuInit(N),
    path: [],
    link: null,
    hops: 0,
    verdict: null,
    caption: '8 singletons: everyone is their own root',
  },
];

export default function UnionFindGriddle() {
  const [fr, setFr] = useState<UfFrame[]>(fresh);
  const [before, setBefore] = useState(0);
  const [opts, setOpts] = useState<UfOptions>({ bySize: true, compress: true });
  const [a, setA] = useState(1);
  const [b, setB] = useState(3);
  const [picking, setPicking] = useState(false);
  const p = usePlayer(fr.length, 900);
  const f = (fr[Math.min(p.k, fr.length - 1)] ?? fr[0]) as UfFrame;
  const prev = fr[Math.max(0, p.k - 1)] ?? f;
  const cur = fr.at(-1) as UfFrame;
  const { nodes, cols, rows } = forestLayout(f);
  const colW = W / Math.max(cols, 5);
  const x0 = (W - cols * colW) / 2;
  const dy = Math.min(64, 296 / Math.max(1, rows - 1));
  const AY = Math.max(170, 26 + (rows - 1) * dy + 58); // parent[] row sits under the forest
  const at = (id: number): [number, number] => {
    const q = nodes[id] ?? { x: 0, y: 0 };
    return [x0 + (q.x + 0.5) * colW, 26 + q.y * dy];
  };
  const preview = picking ? pathToRoot(f, a) : [];
  const onPath = new Set([...f.path, ...preview]);
  const cw = W / N;

  const run = (r: { frames: UfFrame[] }, reset = false, play = true) => {
    setBefore(reset ? 0 : before + cur.hops);
    setFr(reset ? [...fresh(), ...r.frames] : r.frames);
    setPicking(false);
    p.setK(0);
    p.setPlaying(play);
  };

  const click = (v: number) => {
    if (!picking) {
      setA(v);
      setPicking(true);
    } else if (v === a) setPicking(false);
    else {
      setB(v);
      run(unionFrames(cur, a, v, opts));
    }
  };

  const toggle = (key: keyof UfOptions) => setOpts({ ...opts, [key]: !opts[key] });

  return (
    <Shell
      title="Union-find: merge sets, follow pointers"
      hint="Tap two nodes to union them; arrows are parent pointers. Try Chain with union by size off, then find(0), then turn on path compression and find(0) again."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} ${AY + 50}`}
          role="img"
          aria-label={`parent = [${f.parent.join(', ')}]; ${setCount(f)} sets. ${f.caption}`}
        >
          {f.parent.map((par, v) => {
            if (par === v) return null;
            const [x1, y1] = at(v);
            const [x2, y2] = at(par);
            const len = Math.hypot(x2 - x1, y2 - y1) || 1;
            const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
            const [ex, ey] = [x2 - ux * (R + 3), y2 - uy * (R + 3)];
            const cls =
              f.link?.[0] === v
                ? 'uf__edge is-link'
                : onPath.has(v) && onPath.has(par)
                  ? 'uf__edge is-path'
                  : 'uf__edge';
            return (
              <g key={`e${v}`} class={cls}>
                <line x1={x1 + ux * R} y1={y1 + uy * R} x2={ex} y2={ey} />
                <path
                  d={`M${ex - ux * 9 - uy * 5} ${ey - uy * 9 + ux * 5} L${ex} ${ey} L${ex - ux * 9 + uy * 5} ${ey - uy * 9 - ux * 5}`}
                />
              </g>
            );
          })}
          {IDS.map((v) => {
            const [cx, cy] = at(v);
            const root = f.parent[v] === v;
            const sel = picking && v === a;
            const cls = `uf__node${onPath.has(v) ? ' is-path' : ''}${root ? ' is-root' : ''}${sel ? ' is-sel' : ''}`;
            return (
              <g
                key={v}
                class={cls}
                role="button"
                tabIndex={0}
                aria-label={`node ${v}${root ? ', a root' : `, parent ${f.parent[v]}`}${sel ? ', selected' : ''}`}
                onClick={() => click(v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    click(v);
                  }
                }}
              >
                <circle class="anim" cx={cx} cy={cy} r={R} />
                <text x={cx} y={cy + 6} text-anchor="middle" font-size={17}>
                  {v}
                </text>
                {root && (f.size[v] ?? 1) > 1 && (
                  <text x={cx + R + 3} y={cy - R + 4} font-size={11} class="uf__size">
                    ×{f.size[v]}
                  </text>
                )}
              </g>
            );
          })}
          <text x={4} y={AY - 6} font-size={11} class="uf__mono">
            parent[i]
          </text>
          {f.parent.map((par, i) => (
            <g key={`c${i}`} class={`uf__cell${prev.parent[i] !== par && p.k > 0 ? ' is-new' : ''}`}>
              <rect x={i * cw + 3} y={AY} width={cw - 6} height={30} rx={6} />
              <text x={i * cw + cw / 2} y={AY + 21} text-anchor="middle" font-size={16}>
                {par}
              </text>
              <text x={i * cw + cw / 2} y={AY + 46} text-anchor="middle" font-size={11} class="uf__mono">
                {i}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div class="gd__stats">
        <span>
          sets <b>{setCount(f)}</b>
        </span>
        <span>
          tallest tree <b>{maxDepth(f)}</b>
        </span>
        <span>
          pointer hops <b>{before + f.hops}</b>
        </span>
      </div>
      {f.verdict && f.verdict !== 'found' && (
        <p class={`gd__verdict gd__verdict--${f.verdict === 'cycle' ? 'bad' : 'ok'}`} role="status">
          {f.verdict === 'cycle'
            ? `✗ ${f.caption}`
            : f.verdict === 'joined'
              ? `✓ joined: ${setCount(f)} set${setCount(f) === 1 ? '' : 's'} left`
              : `✓ ${f.caption}`}
        </p>
      )}
      <Controls p={p} caption={picking ? `picked ${a}: now tap the node to union it with` : f.caption} />
      <div class="gd__row">
        <label class="uf__pick">
          a
          <select value={a} onChange={(e) => setA(Number((e.target as HTMLSelectElement).value))}>
            {IDS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label class="uf__pick">
          b
          <select value={b} onChange={(e) => setB(Number((e.target as HTMLSelectElement).value))}>
            {IDS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          class="btn btn--primary"
          disabled={a === b}
          onClick={() => run(unionFrames(cur, a, b, opts))}
        >
          union({a}, {b})
        </button>
        <button type="button" class="btn" onClick={() => run(sameSetFrames(cur, a, b, opts))}>
          Cycle? {a}–{b}
        </button>
        <button type="button" class="btn" onClick={() => run(findFrames(cur, a, opts))}>
          <Icon name="search" size={16} /> find({a})
        </button>
      </div>
      <div class="gd__row">
        <label class="uf__opt">
          <input type="checkbox" checked={opts.bySize} onChange={() => toggle('bySize')} /> union by size
        </label>
        <label class="uf__opt">
          <input type="checkbox" checked={opts.compress} onChange={() => toggle('compress')} /> path
          compression
        </label>
        <button
          type="button"
          class="btn btn--ghost"
          onClick={() => run(scriptFrames(dsuInit(N), UF_LESSON, opts), true)}
        >
          <Icon name="play" size={15} /> Lesson
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          onClick={() => run(scriptFrames(dsuInit(N), ufChain(N), opts), true)}
        >
          Chain
        </button>
        <button type="button" class="btn btn--ghost" onClick={() => run({ frames: [] }, true, false)}>
          <Icon name="replay" size={16} /> Reset
        </button>
      </div>
    </Shell>
  );
}
