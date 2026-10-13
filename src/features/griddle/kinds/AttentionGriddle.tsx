import '../../../styles/griddles/attention.css';
import { useState } from 'preact/hooks';
import {
  ATT_K,
  ATT_Q,
  ATT_TOKENS,
  ATT_V,
  attend,
  attentionMatrix,
  entropyBits,
  nearest,
  type Vec,
} from '../../../engine/viz/attention';
import { Shell } from '../player';

const W = 520;
const BASE = 96; // y of the top of the word boxes
const X = ATT_TOKENS.map((_, i) => 70 + i * 127);
const vec = (v: Vec, sep = ', ') => `(${v.map((x) => Number(x.toFixed(3))).join(sep)})`;
const pct = (w: number) => `${Math.round(w * 100)}%`;

function arc(i: number, j: number): string {
  const a = X[i] as number;
  const b = X[j] as number;
  if (i === j) return `M${a - 12} ${BASE} C${a - 40} ${BASE - 70} ${a + 40} ${BASE - 70} ${a + 12} ${BASE}`;
  return `M${a} ${BASE} Q${(a + b) / 2} ${BASE - 40 - Math.abs(i - j) * 30} ${b} ${BASE}`;
}

export default function AttentionGriddle() {
  const [qi, setQi] = useState(2);
  const [logT, setLogT] = useState(0);
  const [causal, setCausal] = useState(false);
  const tau = 10 ** logT;
  const mask = causal ? ATT_TOKENS.map((_, j) => j <= qi) : undefined;
  const r = attend(ATT_Q[qi] as Vec, ATT_K, ATT_V, { temperature: tau, mask });
  const div = 2 * tau;
  const matrix = attentionMatrix(ATT_Q, ATT_K, ATT_V, tau, causal);
  const top = r.weights.indexOf(Math.max(...r.weights));
  const near = nearest(r.output, ATT_V);
  const bits = entropyBits(r.weights);
  const q = ATT_TOKENS[qi];
  const verdict =
    (r.weights[top] as number) >= 0.6
      ? `"${q}" locks onto "${ATT_TOKENS[top]}" (${pct(r.weights[top] as number)}), so its new vector ≈ v(${ATT_TOKENS[near]}).`
      : bits > 1.8
        ? `Almost uniform (${bits.toFixed(2)} of 2 bits): "${q}" just averages every word.`
        : `"${q}" splits its attention; the biggest share goes to "${ATT_TOKENS[top]}" (${pct(r.weights[top] as number)}).`;
  const select = (i: number) => setQi(i);

  return (
    <Shell
      title="Point a query, watch the weights"
      hint="Tap a word to make it the query. Its query is dotted with every key, divided by √d·τ (√4 = 2), and softmax turns the scores into weights. Try τ near 0.1 (one word takes all), τ = 5 (everyone gets about a quarter), or the causal mask."
    >
      <div class="gd__stage paper">
        <p class="att__sentence">The animal didn't cross the street because it was tired.</p>
        <svg
          viewBox={`0 0 ${W} 176`}
          role="img"
          aria-label={`Query "${q}": ${ATT_TOKENS.map((t, j) => `${t} ${pct(r.weights[j] as number)}`).join(', ')}`}
        >
          {ATT_TOKENS.map((_, j) => {
            const w = r.weights[j] as number;
            if (mask && !mask[j]) return null;
            return (
              <path
                key={`a${qi}-${j}`}
                class="anim att__arc"
                d={arc(qi, j)}
                style={{ strokeWidth: 1.5 + 12 * w, opacity: 0.35 + 0.65 * w }}
              />
            );
          })}
          {ATT_TOKENS.map((t, j) => {
            const hidden = mask && !mask[j];
            return (
              <g
                key={t}
                role="button"
                tabIndex={0}
                aria-pressed={j === qi}
                aria-label={`Use "${t}" as the query`}
                onClick={() => select(j)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(j);
                  }
                }}
                class={`att__tok${j === qi ? ' is-q' : ''}${hidden ? ' is-masked' : ''}`}
              >
                <rect x={(X[j] as number) - 58} y={BASE} width={116} height={74} rx={12} />
                <text x={X[j]} y={BASE + 30} text-anchor="middle" font-size={22}>
                  {t}
                </text>
                <text x={X[j]} y={BASE + 60} text-anchor="middle" font-size={21} class="att__num">
                  {hidden ? 'masked' : (r.weights[j] as number).toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <label class="gd__row att__slider">
        temperature τ
        <input
          type="range"
          min={-1}
          max={0.7}
          step={0.05}
          value={logT}
          aria-label="Temperature"
          aria-valuetext={`tau ${tau.toFixed(2)}`}
          onInput={(e) => setLogT(Number((e.target as HTMLInputElement).value))}
        />
        <span class="mono">
          τ {tau.toFixed(2)} · ÷{div.toFixed(2)}
        </span>
      </label>
      <div class="gd__row">
        <button type="button" class="btn btn--ghost" onClick={() => setLogT(0)} disabled={logT === 0}>
          τ = 1 (÷√d)
        </button>
        <button type="button" class="btn btn--ghost" onClick={() => setLogT(Math.log10(0.5))}>
          forget √d (÷1)
        </button>
        <button type="button" class="btn" aria-pressed={causal} onClick={() => setCausal((c) => !c)}>
          Causal mask {causal ? 'on' : 'off'}
        </button>
      </div>
      <div class="att">
        <table class="att__table mono">
          <caption class="sr-only">Scores and weights for the query {q}</caption>
          <thead>
            <tr>
              <th scope="col">key</th>
              <th scope="col">q·k</th>
              <th scope="col">÷{div.toFixed(1)}</th>
              <th scope="col">weight</th>
            </tr>
          </thead>
          <tbody>
            {ATT_TOKENS.map((t, j) => {
              const w = r.weights[j] as number;
              return (
                <tr key={t} class={j === top ? 'is-top' : ''}>
                  <th scope="row">
                    {t}
                    <small>{vec(ATT_K[j] as Vec, ',')}</small>
                  </th>
                  <td>{r.raw[j]}</td>
                  <td>{Number.isFinite(r.scores[j]) ? (r.scores[j] as number).toFixed(2) : '−∞'}</td>
                  <td>
                    <span class="att__bar" style={{ width: `${w * 100}%` }} />
                    <span class="att__w">{w.toFixed(3)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div class="att__side">
          <p class="att__eq mono">
            q({q}) = {vec(ATT_Q[qi] as Vec)}
          </p>
          <p class="att__eq mono">
            out = Σ w·v = <b>{vec(r.output)}</b>
          </p>
          <svg
            class="att__grid"
            viewBox="0 0 170 120"
            role="img"
            aria-label="All four queries at once: softmax(QKᵀ/√d)"
          >
            <text x={0} y={10} font-size={10} class="att__muted">
              softmax(QKᵀ/√d·τ), tap a row
            </text>
            {matrix.map((row, i) => (
              <g key={i} onClick={() => select(i)} class={`att__row${i === qi ? ' is-q' : ''}`}>
                <text x={44} y={32 + i * 22} text-anchor="end" font-size={10}>
                  {ATT_TOKENS[i]}
                </text>
                {row.map((w, j) => (
                  <rect
                    key={j}
                    class="anim"
                    x={50 + j * 28}
                    y={18 + i * 22}
                    width={26}
                    height={20}
                    rx={3}
                    style={{ fillOpacity: 0.08 + 0.92 * w }}
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>
      <p class="gd__verdict gd__verdict--ok" aria-live="polite">
        {verdict}
      </p>
    </Shell>
  );
}
