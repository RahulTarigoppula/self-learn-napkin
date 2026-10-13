import { useMemo, useState } from 'preact/hooks';
import {
  LB_DEFAULTS,
  LB_LABEL,
  LB_STRATEGIES,
  type LbJob,
  type LbStrategy,
  lbCompare,
  lbQueues,
  lbSimulate,
  lbStats,
} from '../../../engine/viz/load-balancer';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, Stepper, usePlayer } from '../player';

const STEP = 50; // simulated ms per frame
const NAMES = 'ABCD';
const W = 520;
const LANE = 54;
const TOP = 26;
const Q0 = 196; // x of the first queue cell
const CELL = 18;
const FIT = Math.floor((W - Q0) / CELL);
const REASON: Record<LbStrategy, string> = {
  'round-robin': 'next in turn',
  'least-conn': 'fewest in flight',
  p2c: 'less busy of two random picks',
};
const heavy = (j: LbJob) => j.work >= 200;
const ms = (x: number) => (x >= 1000 ? `${(x / 1000).toFixed(2)} s` : `${Math.round(x)} ms`);

export default function LoadBalancerGriddle() {
  const [strategy, setStrategy] = useState<LbStrategy>('round-robin');
  const [servers, setServers] = useState(3);
  const [slowOn, setSlowOn] = useState(true);
  const [seed, setSeed] = useState(LB_DEFAULTS.seed);
  const base = useMemo(
    () => ({ ...LB_DEFAULTS, servers, seed, slow: slowOn ? 1 : null }),
    [servers, seed, slowOn],
  );
  const runs = useMemo(
    () => Object.fromEntries(LB_STRATEGIES.map((s) => [s, lbSimulate({ ...base, strategy: s })])),
    [base],
  ) as Record<LbStrategy, LbJob[]>;
  const cmp = useMemo(() => lbCompare(base), [base]);
  const end = Math.max(...LB_STRATEGIES.flatMap((s) => runs[s].map((j) => j.done)));
  const p = usePlayer(Math.ceil(end / STEP) + 1, 90);
  const t = p.k * STEP;
  const jobs = runs[strategy];
  const queues = lbQueues(jobs, servers, t);
  const st = lbStats(jobs, servers, t);
  const fresh = jobs.filter((j) => j.arrive > t - STEP && j.arrive <= t);
  const latest = fresh.at(-1);
  const H = TOP + servers * LANE + 8;
  const laneY = (s: number) => TOP + s * LANE + LANE / 2;
  const caption = latest
    ? `t = ${ms(t)} · #${latest.id} (${latest.work} ms of work) → ${NAMES[latest.server]} (${REASON[strategy]})`
    : `t = ${ms(t)} · ${st.done} of ${jobs.length} requests done`;
  const finished = p.k >= p.last;

  return (
    <Shell
      title="Balance the traffic yourself"
      hint="Requests arrive at the balancer (blue = quick, orange = heavy); each server works its queue one at a time. Run it, then switch the algorithm mid-run: the same traffic replays. Try round robin with B slowed down."
      p={p}
    >
      <div class="gd__seg" role="group" aria-label="Balancing algorithm">
        {LB_STRATEGIES.map((s) => (
          <button key={s} type="button" aria-pressed={strategy === s} onClick={() => setStrategy(s)}>
            {LB_LABEL[s]}
          </button>
        ))}
      </div>
      <div class="gd__stage paper">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${LB_LABEL[strategy]} at ${ms(t)}: ${queues.map((q, s) => `${NAMES[s]} has ${q.length} in flight`).join(', ')}`}
        >
          <rect
            x={4}
            y={H / 2 - 30}
            width={64}
            height={60}
            rx={12}
            style={{ fill: 'var(--wash-blue)', stroke: 'var(--pen-ink)', strokeWidth: 2 }}
          />
          <text x={36} y={H / 2 + 6} text-anchor="middle" font-size={22} style={{ fill: 'var(--pen-ink)' }}>
            LB
          </text>
          {queues.map((_, s) => (
            <line
              key={`w${s}`}
              x1={68}
              y1={H / 2}
              x2={104}
              y2={laneY(s)}
              style={{ stroke: 'var(--border-strong)', strokeWidth: 1.5 }}
            />
          ))}
          {fresh.map((j) => (
            <line
              key={`a${j.id}`}
              x1={68}
              y1={H / 2}
              x2={104}
              y2={laneY(j.server)}
              style={{
                stroke: heavy(j) ? 'var(--pen-orange)' : 'var(--pen-blue)',
                strokeWidth: 4,
                strokeLinecap: 'round',
              }}
            />
          ))}
          {queues.map((q, s) => {
            const slow = slowOn && s === 1;
            const y = TOP + s * LANE + 6;
            return (
              <g key={s}>
                <rect
                  x={104}
                  y={y}
                  width={W - 104}
                  height={LANE - 12}
                  rx={10}
                  style={{ fill: slow ? 'var(--wash-red)' : 'var(--wash-muted)' }}
                />
                <text x={118} y={y + 19} font-size={20} style={{ fill: 'var(--pen-ink)' }}>
                  {NAMES[s]}
                </text>
                <text
                  x={118}
                  y={y + 36}
                  font-size={13}
                  style={{ fill: slow ? 'var(--danger-ink)' : 'var(--ink-muted)' }}
                >
                  {slow ? `${LB_DEFAULTS.slowFactor}× slow` : `${q.length} in flight`}
                </text>
                {q.slice(0, FIT).map((id, i) => {
                  const j = jobs[id] as LbJob;
                  const run = i === 0 ? Math.min(1, (t - j.start) / (j.done - j.start)) : 0;
                  const col = heavy(j) ? 'var(--pen-orange)' : 'var(--pen-blue)';
                  return (
                    <g
                      key={id}
                      class="anim"
                      style={{ transform: `translate(${Q0 + i * CELL}px, ${y + 8}px)` }}
                    >
                      <rect
                        width={CELL - 4}
                        height={LANE - 28}
                        rx={3}
                        style={{ fill: 'var(--surface)', stroke: col, strokeWidth: 2 }}
                      />
                      {i === 0 && (
                        <rect
                          y={(LANE - 28) * (1 - run)}
                          width={CELL - 4}
                          height={(LANE - 28) * run}
                          rx={2}
                          style={{ fill: col }}
                        />
                      )}
                    </g>
                  );
                })}
                {q.length > FIT && (
                  <text
                    x={W - 6}
                    y={y - 2 + LANE / 2}
                    text-anchor="end"
                    font-size={15}
                    style={{ fill: 'var(--danger-ink)' }}
                  >
                    +{q.length - FIT}
                  </text>
                )}
              </g>
            );
          })}
          <text x={104} y={16} font-size={14} style={{ fill: 'var(--ink-muted)' }}>
            server · queue (head is working, fill = progress) →
          </text>
        </svg>
      </div>
      <p class="gd__stats" aria-live="polite">
        <span>
          done{' '}
          <b>
            {st.done}/{jobs.length}
          </b>
        </span>
        <span>
          p50 <b>{ms(st.p50)}</b>
        </span>
        <span>
          p99 <b>{ms(st.p99)}</b>
        </span>
        <span>
          longest queue <b>{st.maxQueue}</b>
        </span>
      </p>
      <Controls p={p} caption={caption} />
      <div class="gd__row">
        <Stepper label="servers" value={servers} min={3} max={4} onChange={setServers} />
        <button type="button" class="btn" aria-pressed={slowOn} onClick={() => setSlowOn((v) => !v)}>
          {slowOn ? 'B is slow' : 'All servers equal'}
        </button>
        <button type="button" class="btn btn--ghost" onClick={() => setSeed((x) => x + 1)}>
          <Icon name="shuffle" size={15} /> New traffic
        </button>
      </div>
      {finished && (
        <p class={`gd__verdict gd__verdict--${strategy === cmp.winner ? 'ok' : 'bad'}`} aria-live="polite">
          {strategy === cmp.winner
            ? `${LB_LABEL[strategy]} wins: the lowest p99 on this traffic.`
            : `${LB_LABEL[cmp.winner]} would beat ${LB_LABEL[strategy]} on p99 here.`}
          <br />
          <span class="mono">
            {LB_STRATEGIES.map((s) => `${LB_LABEL[s]} ${ms(cmp.results[s].p99)}`).join(' · ')}
          </span>
        </p>
      )}
    </Shell>
  );
}
