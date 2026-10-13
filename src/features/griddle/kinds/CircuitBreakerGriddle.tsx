import '../../../styles/griddles/circuit-breaker.css';
import { useMemo, useState } from 'preact/hooks';
import {
  type BreakerState,
  breakerCaption,
  breakerRun,
  breakerTotals,
  breakerVerdict,
  BREAKER_DEFAULTS as D,
} from '../../../engine/viz/circuit-breaker';
import { Controls, Shell, usePlayer } from '../player';

const W = 520;
const ROW = 30; // seconds per timeline row (= the cool-down)
const CW = (W - 20) / ROW;
const RH = 46;
const OUTAGE = 50;
const NODES: { s: BreakerState; x: number; y: number }[] = [
  { s: 'closed', x: 80, y: 46 },
  { s: 'open', x: 440, y: 46 },
  { s: 'half-open', x: 260, y: 132 },
];
const EDGES: { d: string; label: string; x: number; y: number }[] = [
  { d: 'M132 40 L386 40', label: `≥ ${D.threshold * 100} % of last ${D.window} fail`, x: 260, y: 32 },
  { d: 'M418 90 L312 128', label: `after ${D.cooldown} s`, x: 392, y: 124 },
  { d: 'M210 128 L104 90', label: `${D.trials} trials ok`, x: 128, y: 124 },
  { d: 'M306 110 L400 76', label: 'trial fails', x: 334, y: 82 },
];
const LEGEND = [
  ['ok', 'ok'],
  ['failed', 'failed'],
  ['short', 'failed fast (short-circuited)'],
  ['outage', 'bank outage'],
] as const;

export default function CircuitBreakerGriddle() {
  const [failPct, setFailPct] = useState(D.failRate * 100);
  const [outageAt, setOutageAt] = useState<number | null>(D.outage?.[0] ?? null);
  const [retries, setRetries] = useState(false);
  const [breaker, setBreaker] = useState(true);
  const recs = useMemo(
    () =>
      breakerRun({
        ...D,
        failRate: failPct / 100,
        outage: outageAt === null ? null : [outageAt, outageAt + OUTAGE],
        retries,
        breaker,
      }),
    [failPct, outageAt, retries, breaker],
  );
  const p = usePlayer(recs.length + 1, 150);
  const k = Math.min(p.k, recs.length);
  const cur = recs[k - 1];
  const state: BreakerState = cur ? cur.after : 'closed';
  const tot = breakerTotals(recs, k);
  const H = Math.ceil(recs.length / ROW) * RH + 8;
  const verdict = breakerVerdict(tot, recs.length, { breaker, retries });
  const stats: [string, number][] = [
    ['ok', tot.ok],
    ['failed', tot.failed],
    ['failed fast', tot.short],
    ['bank hits', tot.hits],
    ['calls saved', tot.saved],
  ];

  return (
    <Shell
      title="Trip the circuit breaker"
      hint="One call to the bank per second. The breaker opens when half of the last 20 calls fail, cools down for 30 s, then lets trial calls through. Click the timeline to move the outage. Then switch the breaker off and turn retries on: retry storm."
      p={p}
    >
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} 184`}
          role="img"
          aria-label={`Breaker is ${breaker ? state : 'switched off'}`}
        >
          <defs>
            <marker
              id="cb-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 z" class="cb__head" />
            </marker>
          </defs>
          {EDGES.map((e) => (
            <g key={e.label}>
              <path d={e.d} marker-end="url(#cb-arrow)" class="cb__edge" />
              <text x={e.x} y={e.y} text-anchor="middle" font-size={16} class="cb__muted">
                {e.label}
              </text>
            </g>
          ))}
          {NODES.map((n) => {
            const lit = breaker && n.s === state;
            return (
              <g key={n.s} class={`cb__node cb__node--${n.s}${lit ? ' is-lit' : ''}`}>
                <circle class="anim" cx={n.x} cy={n.y} r={lit ? 46 : 40} />
                <text x={n.x} y={n.y + 6} text-anchor="middle" font-size={lit ? 20 : 18}>
                  {n.s}
                </text>
              </g>
            );
          })}
          {!breaker && (
            <text x={260} y={92} text-anchor="middle" font-size={16} class="cb__off">
              breaker switched off
            </text>
          )}
        </svg>
      </div>
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Timeline: ${tot.ok} ok, ${tot.failed} failed, ${tot.short} failed fast`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const col = Math.floor((((e.clientX - r.left) / r.width) * W - 10) / CW);
            const row = Math.floor((((e.clientY - r.top) / r.height) * H) / RH);
            const at = row * ROW + Math.max(0, Math.min(ROW - 1, col));
            setOutageAt(Math.max(0, Math.min(recs.length - 1, at)));
          }}
        >
          {recs.map((c) => {
            const x = 10 + (c.t % ROW) * CW;
            const y = Math.floor(c.t / ROW) * RH;
            const seen = c.t < k;
            const inOutage = outageAt !== null && c.t >= outageAt && c.t < outageAt + OUTAGE;
            return (
              <g key={c.t}>
                {inOutage && <rect x={x} y={y + 2} width={CW + 0.6} height={RH - 10} class="cb__outage" />}
                {seen && breaker && (
                  <rect x={x} y={y + RH - 10} width={CW} height={4} class={`cb__band cb__band--${c.state}`} />
                )}
                {seen ? (
                  <>
                    <circle cx={x + CW / 2} cy={y + 26} r={5.5} class={`cb__dot cb__dot--${c.outcome}`} />
                    {c.attempts.slice(1).map((a, n) => (
                      <circle
                        key={n}
                        cx={x + 3 + (a.wait / D.cap) * (CW - 6)}
                        cy={y + 15 - n * 5}
                        r={2.4}
                        class={`cb__retry cb__retry--${a.ok === null ? 'short' : a.ok ? 'ok' : 'failed'}`}
                      />
                    ))}
                  </>
                ) : (
                  <circle cx={x + CW / 2} cy={y + 26} r={2} class="cb__todo" />
                )}
                {c.t === k && <rect x={x} y={y + 2} width={CW} height={RH - 10} class="cb__cursor" />}
              </g>
            );
          })}
        </svg>
      </div>
      <div class="gd__legend" aria-hidden="true">
        {LEGEND.map(([c, label]) => (
          <span key={c}>
            <i class={`cb__key cb__key--${c}`} />
            {label}
          </span>
        ))}
        <span>small dots: retries, offset by their jittered wait</span>
      </div>
      <p class="gd__stats" aria-live="polite">
        {stats.map(([label, n]) => (
          <span key={label}>
            {label} <b>{n}</b>
          </span>
        ))}
      </p>
      <Controls p={p} caption={cur ? breakerCaption(cur, breaker) : 'breaker closed: calls pass through'} />
      <label class="gd__row cb__slider">
        bank failure rate
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={failPct}
          aria-label="Bank failure rate (percent)"
          onInput={(e) => setFailPct(Number((e.target as HTMLInputElement).value))}
        />
        <span class="mono">{failPct}%</span>
      </label>
      <div class="gd__row">
        <button
          type="button"
          class="btn"
          aria-pressed={outageAt !== null}
          onClick={() => setOutageAt((o) => (o === null ? 20 : null))}
        >
          {outageAt === null ? 'Trigger outage' : `Outage ${outageAt}–${outageAt + OUTAGE} s`}
        </button>
        <button type="button" class="btn" aria-pressed={retries} onClick={() => setRetries((v) => !v)}>
          Retries {retries ? 'on' : 'off'} (backoff + jitter)
        </button>
        <button type="button" class="btn" aria-pressed={breaker} onClick={() => setBreaker((v) => !v)}>
          Breaker {breaker ? 'on' : 'off'}
        </button>
      </div>
      {k >= recs.length && (
        <p class={`gd__verdict gd__verdict--${verdict.good ? 'ok' : 'bad'}`} aria-live="polite">
          {verdict.text}
        </p>
      )}
    </Shell>
  );
}
