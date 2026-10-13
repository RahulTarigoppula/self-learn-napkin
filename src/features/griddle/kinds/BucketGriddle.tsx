import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../ui/Icon';
import { Shell, Stepper } from '../player';

interface Hit {
  id: number;
  ok: boolean;
  t: number;
}

/** A live token bucket: tokens drip in at `rate` per second up to `cap`; each request spends one. */
export default function BucketGriddle() {
  const [cap, setCap] = useState(5);
  const [rate, setRate] = useState(1);
  const [tokens, setTokens] = useState(5);
  const [log, setLog] = useState<Hit[]>([]);
  const state = useRef({ tokens: 5, last: performance.now(), id: 0, cap: 5, rate: 1 });

  useEffect(() => {
    state.current.cap = cap;
    state.current.rate = rate;
    state.current.tokens = Math.min(state.current.tokens, cap);
  }, [cap, rate]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = state.current;
      const now = performance.now();
      s.tokens = Math.min(s.cap, s.tokens + ((now - s.last) / 1000) * s.rate);
      s.last = now;
      setTokens(s.tokens);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const send = (count: number) => {
    const s = state.current;
    const out: Hit[] = [];
    for (let i = 0; i < count; i++) {
      const ok = s.tokens >= 1;
      if (ok) s.tokens -= 1;
      out.push({ id: ++s.id, ok, t: performance.now() });
    }
    setTokens(s.tokens);
    setLog((l) => [...out.reverse(), ...l].slice(0, 14));
  };

  const accepted = log.filter((h) => h.ok).length;
  const W = 220;
  const H = 230;
  const level = tokens / cap;

  return (
    <Shell
      title="A live token bucket"
      hint="Tokens drip in continuously. Each request needs one token; with the bucket empty, requests get HTTP 429. Bursts up to the capacity are fine — sustained traffic is capped at the refill rate."
    >
      <div class="bucket">
        <div class="gd__stage paper bucket__stage">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${Math.floor(tokens)} of ${cap} tokens`}>
            <path
              d={`M30 30 L40 ${H - 20} Q${W / 2} ${H - 4} ${W - 40} ${H - 20} L${W - 30} 30`}
              style={{ fill: 'none', stroke: 'var(--pen-ink)', strokeWidth: 3 }}
            />
            <clipPath id="bucket-clip">
              <path d={`M30 30 L40 ${H - 20} Q${W / 2} ${H - 4} ${W - 40} ${H - 20} L${W - 30} 30 Z`} />
            </clipPath>
            <rect
              x={0}
              y={30 + (1 - level) * (H - 40)}
              width={W}
              height={H}
              clip-path="url(#bucket-clip)"
              style={{ fill: 'var(--wash-blue)' }}
            />
            {Array.from({ length: cap }, (_, i) => {
              const filled = i < Math.floor(tokens);
              const col = i % 3;
              const row = Math.floor(i / 3);
              return (
                <circle
                  key={i}
                  class="anim"
                  cx={W / 2 + (col - 1) * 44}
                  cy={H - 42 - row * 40}
                  r={15}
                  style={{
                    fill: filled ? 'var(--pen-orange)' : 'transparent',
                    stroke: filled ? 'var(--text-orange)' : 'var(--border-strong)',
                    strokeWidth: 2,
                    strokeDasharray: filled ? 'none' : '4 4',
                  }}
                />
              );
            })}
            <text x={W / 2} y={20} text-anchor="middle" font-size={16} style={{ fill: 'var(--pen-blue)' }}>
              +{rate} token{rate === 1 ? '' : 's'}/s ↓
            </text>
          </svg>
          <p class="bucket__count mono" aria-live="polite">
            {tokens.toFixed(1)} / {cap}
          </p>
        </div>
        <div class="bucket__side">
          <div class="gd__row">
            <button type="button" class="btn btn--primary" onClick={() => send(1)}>
              <Icon name="arrowRight" size={16} /> Send 1 request
            </button>
            <button type="button" class="btn" onClick={() => send(7)}>
              Burst × 7
            </button>
          </div>
          <ol class="bucket__log" aria-label="Recent requests, newest first">
            {log.length === 0 && <li class="muted">No requests yet — send some.</li>}
            {log.map((h) => (
              <li key={h.id} class={h.ok ? 'ok' : 'no'}>
                <span class="mono">#{h.id}</span> {h.ok ? '200 OK' : '429 Too Many Requests'}
              </li>
            ))}
          </ol>
          <p class="gd__stats">
            <span>
              recent accepted <b>{accepted}</b>
            </span>
            <span>
              rejected <b>{log.length - accepted}</b>
            </span>
          </p>
          <div class="gd__row">
            <Stepper label="capacity" value={cap} min={1} max={9} onChange={setCap} />
            <Stepper label="refill /s" value={rate} min={1} max={5} onChange={setRate} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
