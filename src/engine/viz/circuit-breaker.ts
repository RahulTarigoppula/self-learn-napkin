import { rng } from './types';

export type BreakerState = 'closed' | 'open' | 'half-open';

export interface BreakerParams {
  /** one call per second, this many seconds */
  calls: number;
  /** chance (0..1) that a call to the dependency fails outside an outage */
  failRate: number;
  /** calls with index in [start, end) always fail */
  outage: [number, number] | null;
  /** retry failed calls with capped exponential backoff and full jitter */
  retries: boolean;
  /** wrap the dependency in a circuit breaker (off = call it no matter what) */
  breaker: boolean;
  seed: number;
  /** sliding window of outcomes the closed breaker watches */
  window: number;
  /** trip when failures / window ≥ threshold (with a full window) */
  threshold: number;
  /** seconds the breaker stays open before going half-open */
  cooldown: number;
  /** successful trial calls needed in half-open to close */
  trials: number;
  maxRetries: number;
  /** backoff base and cap, ms */
  base: number;
  cap: number;
}

/** The napkin's numbers: ≥ 50 % of the last 20 calls, 30 s cool-down, 3 trials, 3 retries from 100 ms. */
export const BREAKER_DEFAULTS: BreakerParams = {
  calls: 120,
  failRate: 0.1,
  outage: [20, 70],
  retries: false,
  breaker: true,
  seed: 3,
  window: 20,
  threshold: 0.5,
  cooldown: 30,
  trials: 3,
  maxRetries: 3,
  base: 100,
  cap: 1000,
};

/** One attempt: ok, failed at the dependency, or short-circuited (null) without touching it. */
export interface Attempt {
  ok: boolean | null;
  /** jittered wait before this attempt, ms (0 for the first) */
  wait: number;
}

export interface CallRecord {
  t: number;
  /** breaker state when the call arrived */
  state: BreakerState;
  attempts: Attempt[];
  outcome: 'ok' | 'failed' | 'short';
  /** breaker state after the call */
  after: BreakerState;
  /** the closed breaker's window after the call: failures and size */
  window: [number, number];
  /** seconds of cool-down left after the call while open, else 0 */
  coolLeft: number;
}

/** Backoff window before retry n (1-based): min(cap, base × 2^(n−1)). */
export const backoffWindow = (n: number, base: number, cap: number): number =>
  Math.min(cap, base * 2 ** (n - 1));

export function breakerRun(p: BreakerParams): CallRecord[] {
  const r = rng(p.seed);
  // Fixed draws per call so that moving a slider or toggling retries never reshuffles the dice.
  const dice = Array.from({ length: p.calls }, () =>
    Array.from({ length: 1 + p.maxRetries }, () => [r(), r()]),
  );
  let state: BreakerState = 'closed';
  let results: boolean[] = [];
  let openedAt = 0;
  let trialsOk = 0;
  const failChance = (t: number) => (p.outage && t >= p.outage[0] && t < p.outage[1] ? 1 : p.failRate);

  const attempt = (t: number, u: number): boolean | null => {
    if (p.breaker && state === 'open') {
      if (t - openedAt < p.cooldown) return null;
      state = 'half-open';
      trialsOk = 0;
    }
    const ok = u >= failChance(t);
    if (!p.breaker) return ok;
    if (state === 'half-open') {
      if (!ok) {
        state = 'open';
        openedAt = t;
      } else if (++trialsOk >= p.trials) {
        state = 'closed';
        results = [];
      }
      return ok;
    }
    results = [...results, ok].slice(-p.window);
    const fails = results.filter((x) => !x).length;
    if (results.length >= p.window && fails / p.window >= p.threshold) {
      state = 'open';
      openedAt = t;
      results = [];
    }
    return ok;
  };

  return dice.map((d, t) => {
    const before: BreakerState =
      p.breaker && state === 'open' && t - openedAt >= p.cooldown ? 'half-open' : state;
    const attempts: Attempt[] = [];
    for (let n = 0; n <= (p.retries ? p.maxRetries : 0); n++) {
      const [u, j] = d[n] as [number, number];
      const wait = n === 0 ? 0 : Math.round(j * backoffWindow(n, p.base, p.cap));
      const ok = attempt(t, u);
      attempts.push({ ok, wait });
      if (ok !== false) break; // success, or short-circuited: CircuitOpen is never retried
    }
    const outcome = attempts.some((a) => a.ok) ? 'ok' : attempts[0]?.ok === null ? 'short' : 'failed';
    const window: [number, number] = [results.filter((x) => !x).length, results.length];
    const coolLeft = state === 'open' ? Math.max(0, p.cooldown - (t + 1 - openedAt)) : 0;
    return { t, state: before, attempts, outcome, after: state, window, coolLeft };
  });
}

export interface BreakerTotals {
  ok: number;
  failed: number;
  /** calls answered instantly by the open breaker */
  short: number;
  /** attempts that actually reached the dependency */
  hits: number;
  /** attempts the breaker stopped before they reached the dependency */
  saved: number;
  /** times the breaker opened */
  trips: number;
}

/** Totals over the first `upTo` calls (default: all). */
export function breakerTotals(records: readonly CallRecord[], upTo = records.length): BreakerTotals {
  const tot: BreakerTotals = { ok: 0, failed: 0, short: 0, hits: 0, saved: 0, trips: 0 };
  for (const c of records.slice(0, upTo)) {
    tot[c.outcome]++;
    for (const a of c.attempts) {
      if (a.ok === null) tot.saved++;
      else tot.hits++;
    }
    if (c.after === 'open' && c.state !== 'open') tot.trips++;
  }
  return tot;
}

/**
 * One-line caption for a call, e.g. "t = 27 s · closed · call failed → breaker OPEN (29 s to half-open)".
 * Pass breaker = false when the run had no breaker: then there is no state to report.
 */
export function breakerCaption(c: CallRecord, breaker = true): string {
  const n = c.attempts.length - 1;
  const tries = n > 0 ? ` after ${n} retr${n > 1 ? 'ies' : 'y'}` : '';
  if (!breaker) return `t = ${c.t} s · no breaker · call ${c.outcome}${tries}`;
  const what = c.outcome === 'short' ? 'failed fast, bank untouched' : `${c.outcome}${tries}`;
  const flip = c.after !== c.state ? ` → breaker ${c.after.toUpperCase()}` : '';
  const tail =
    c.after === 'open'
      ? ` (${c.coolLeft} s to half-open)`
      : c.after === 'closed' && c.window[1] > 0
        ? ` (${c.window[0]}/${c.window[1]} failed)`
        : '';
  return `t = ${c.t} s · ${c.state} · call ${what}${flip}${tail}`;
}

/** The end-of-run verdict: what the breaker saved, or what its absence cost. */
export function breakerVerdict(
  tot: BreakerTotals,
  calls: number,
  { breaker, retries }: { breaker: boolean; retries: boolean },
): { text: string; good: boolean } {
  if (breaker)
    return {
      text: `The breaker opened ${tot.trips}× and answered ${tot.short} calls instantly: ${tot.saved} attempts never reached the bank.`,
      good: true,
    };
  if (retries)
    return {
      text: `Retry storm: the bank took ${tot.hits} hits for ${calls} calls (${(tot.hits / Math.max(1, calls)).toFixed(1)}× the load).`,
      good: false,
    };
  return {
    text: `No breaker: every failing call still hit the bank and waited for its timeout (${tot.failed} slow failures).`,
    good: false,
  };
}
