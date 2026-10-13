import { useMemo, useState } from 'preact/hooks';
import { auc, confusionAt, rocCurve, THRESHOLD_DATA } from '../../../engine/viz/ml';
import { Shell } from '../player';

const W = 520;

export default function ThresholdGriddle() {
  const [t, setT] = useState(0.5);
  const c = confusionAt(THRESHOLD_DATA, t);
  const roc = useMemo(() => rocCurve(THRESHOLD_DATA), []);
  const area = useMemo(() => auc(roc), [roc]);
  const sx = (s: number) => 20 + s * (W - 40);
  const R = 150;

  return (
    <Shell
      title="Slide the decision threshold"
      hint="Each dot is one example scored by a model (filled = actually positive). Everything right of the line is predicted positive. Watch precision and recall trade off."
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} 150`}
          role="img"
          aria-label={`Threshold ${t.toFixed(2)}: precision ${c.precision.toFixed(2)}, recall ${c.recall.toFixed(2)}`}
        >
          <rect
            x={sx(t)}
            y={10}
            width={sx(1) - sx(t)}
            height={110}
            rx={8}
            style={{ fill: 'var(--wash-orange)', opacity: 0.6 }}
          />
          <line
            x1={20}
            y1={120}
            x2={W - 20}
            y2={120}
            style={{ stroke: 'var(--pen-muted)', strokeWidth: 1.5 }}
          />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <text
              key={v}
              x={sx(v)}
              y={140}
              text-anchor="middle"
              font-size={12}
              style={{ fill: 'var(--pen-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {v}
            </text>
          ))}
          {THRESHOLD_DATA.map((d, i) => {
            const pos = d.label === 1;
            const lane = pos ? 40 : 88;
            const jitter = ((i * 37) % 5) * 4 - 8;
            const predicted = d.score >= t;
            return (
              <circle
                key={i}
                class="anim"
                cx={sx(d.score)}
                cy={lane + jitter}
                r={8}
                style={{
                  fill: pos ? (predicted ? 'var(--pen-green)' : 'var(--pen-red)') : 'var(--surface)',
                  stroke: pos ? 'var(--pen-ink)' : predicted ? 'var(--pen-red)' : 'var(--pen-muted)',
                  strokeWidth: 2,
                }}
              />
            );
          })}
          <text x={22} y={26} font-size={13} style={{ fill: 'var(--pen-ink)' }}>
            actual positives
          </text>
          <text x={22} y={74} font-size={13} style={{ fill: 'var(--pen-muted)' }}>
            actual negatives
          </text>
          <line
            x1={sx(t)}
            y1={6}
            x2={sx(t)}
            y2={124}
            style={{ stroke: 'var(--pen-orange)', strokeWidth: 3 }}
          />
        </svg>
      </div>
      <label class="gd__row" style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
        threshold
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={t}
          onInput={(e) => setT(Number((e.target as HTMLInputElement).value))}
          style={{ flex: 1, minWidth: '160px', height: '44px', accentColor: 'var(--pen-orange)' }}
          aria-label="Decision threshold"
        />
        <span class="mono">{t.toFixed(2)}</span>
      </label>
      <div class="thr">
        <table class="thr__cm">
          <caption class="sr-only">Confusion matrix</caption>
          <thead>
            <tr>
              <td />
              <th scope="col">predicted +</th>
              <th scope="col">predicted −</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">actual +</th>
              <td class="thr__good mono">TP {c.tp}</td>
              <td class="thr__bad mono">FN {c.fn}</td>
            </tr>
            <tr>
              <th scope="row">actual −</th>
              <td class="thr__bad mono">FP {c.fp}</td>
              <td class="thr__good mono">TN {c.tn}</td>
            </tr>
          </tbody>
        </table>
        <dl class="thr__metrics">
          <div>
            <dt>Precision</dt>
            <dd class="mono">{c.precision.toFixed(2)}</dd>
            <dd class="thr__f">TP / (TP + FP)</dd>
          </div>
          <div>
            <dt>Recall</dt>
            <dd class="mono">{c.recall.toFixed(2)}</dd>
            <dd class="thr__f">TP / (TP + FN)</dd>
          </div>
          <div>
            <dt>F1</dt>
            <dd class="mono">{c.f1.toFixed(2)}</dd>
            <dd class="thr__f">harmonic mean</dd>
          </div>
          <div>
            <dt>FPR</dt>
            <dd class="mono">{c.fpr.toFixed(2)}</dd>
            <dd class="thr__f">FP / (FP + TN)</dd>
          </div>
        </dl>
        <svg
          class="thr__roc"
          viewBox={`0 0 ${R + 40} ${R + 40}`}
          role="img"
          aria-label={`ROC curve, AUC ${area.toFixed(2)}`}
        >
          <rect
            x={30}
            y={10}
            width={R}
            height={R}
            style={{ fill: 'var(--surface)', stroke: 'var(--border-strong)' }}
          />
          <line
            x1={30}
            y1={10 + R}
            x2={30 + R}
            y2={10}
            style={{ stroke: 'var(--pen-muted)', strokeDasharray: '4 4' }}
          />
          <polyline
            points={roc
              .map((q) => `${(30 + q.fpr * R).toFixed(1)},${(10 + R - q.tpr * R).toFixed(1)}`)
              .join(' ')}
            style={{ fill: 'none', stroke: 'var(--pen-blue)', strokeWidth: 2.5 }}
          />
          <circle
            class="anim"
            cx={30 + c.fpr * R}
            cy={10 + R - c.recall * R}
            r={6}
            style={{ fill: 'var(--pen-orange)', stroke: 'var(--pen-ink)', strokeWidth: 1.5 }}
          />
          <text
            x={30 + R / 2}
            y={R + 32}
            text-anchor="middle"
            font-size={12}
            style={{ fill: 'var(--pen-muted)' }}
          >
            FPR → (AUC {area.toFixed(2)})
          </text>
          <text
            x={14}
            y={10 + R / 2}
            text-anchor="middle"
            font-size={12}
            transform={`rotate(-90 14 ${10 + R / 2})`}
            style={{ fill: 'var(--pen-muted)' }}
          >
            TPR (recall)
          </text>
        </svg>
      </div>
    </Shell>
  );
}
