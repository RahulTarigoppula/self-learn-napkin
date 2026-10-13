import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  type BreakerParams,
  backoffWindow,
  breakerCaption,
  breakerRun,
  breakerTotals,
  breakerVerdict,
  type CallRecord,
  BREAKER_DEFAULTS as D,
} from './circuit-breaker';

const run = (p: Partial<BreakerParams>) => breakerRun({ ...D, ...p });
const states = (r: CallRecord[], from: number, to: number) => r.slice(from, to).map((c) => c.state);
const span = (s: string, n: number) => Array.from({ length: n }, () => s);

describe('backoff with full jitter', () => {
  it('windows double from the base and stop at the cap (the quiz: retry 5 → 1,000 ms)', () => {
    expect([1, 2, 3, 4, 5].map((n) => backoffWindow(n, 100, 1000))).toEqual([100, 200, 400, 800, 1000]);
  });
  it('every jittered wait lands inside its window', () => {
    for (const c of run({ retries: true, breaker: false, failRate: 1, outage: null }))
      c.attempts.forEach((a, n) => {
        expect(a.wait).toBeGreaterThanOrEqual(0);
        expect(a.wait).toBeLessThanOrEqual(n === 0 ? 0 : backoffWindow(n, 100, 1000));
      });
  });
});

describe('breaker state machine, hand-checked', () => {
  it('a 30-call outage on a healthy bank: trips at 50 % of 20, sleeps 30 s, 3 trials close it', () => {
    const r = run({ failRate: 0, outage: [10, 40] });
    // calls 0–9 ok; 10–19 fail → 10 of the last 20 failed (50 %) → opens after call 19
    expect([r[18]?.window, r[19]?.window]).toEqual([
      [9, 19],
      [0, 0],
    ]);
    expect(r[19]).toMatchObject({ state: 'closed', outcome: 'failed', after: 'open' });
    expect([r[19]?.coolLeft, r[20]?.coolLeft, r[48]?.coolLeft, r[52]?.coolLeft]).toEqual([29, 28, 0, 0]);
    expect(states(r, 20, 49)).toEqual(span('open', 29));
    expect(r.slice(20, 49).every((c) => c.outcome === 'short')).toBe(true);
    // cool-down over at t = 49 (19 + 30): three successful trials, then closed
    expect(states(r, 49, 52)).toEqual(span('half-open', 3));
    expect(r[51]?.after).toBe('closed');
    expect(states(r, 52, 120)).toEqual(span('closed', 68));
    expect(breakerTotals(r)).toEqual({ ok: 81, failed: 10, short: 29, hits: 91, saved: 29, trips: 1 });
  });

  it('a failed trial re-opens for another cool-down', () => {
    const r = run({ failRate: 1, outage: null });
    expect(r[19]?.after).toBe('open');
    expect(r[49]).toMatchObject({ state: 'half-open', outcome: 'failed', after: 'open' });
    expect(r[50]?.state).toBe('open');
    expect(r[79]).toMatchObject({ state: 'half-open', after: 'open' });
    expect(breakerTotals(r).trips).toBe(4);
  });

  it('never trips on a window that is not full yet, or under the threshold', () => {
    const r = run({ failRate: 0, outage: [0, 9] });
    expect(r.every((c) => c.state === 'closed')).toBe(true);
    expect(breakerTotals(r, 30)).toMatchObject({ ok: 21, failed: 9, trips: 0 });
  });
});

describe('retries', () => {
  it('fill the window faster: the breaker trips mid-call and the next attempt is not retried', () => {
    const r = run({ failRate: 0, outage: [10, 40], retries: true });
    expect(r[10]?.attempts.map((a) => a.ok)).toEqual([false, false, false, false]);
    expect(r[12]?.attempts.map((a) => a.ok)).toEqual([false, false, null]);
    expect(r[12]).toMatchObject({ outcome: 'failed', after: 'open' });
    expect(states(r, 13, 42)).toEqual(span('open', 29));
    expect(r[44]?.after).toBe('closed');
    expect(breakerTotals(r)).toEqual({ ok: 88, failed: 3, short: 29, hits: 98, saved: 30, trips: 1 });
  });

  it('without a breaker they turn an outage into a storm: 4 hits per call', () => {
    const t = breakerTotals(run({ failRate: 1, outage: null, retries: true, breaker: false }));
    expect(t).toEqual({ ok: 0, failed: 120, short: 0, hits: 480, saved: 0, trips: 0 });
  });

  it('a retry can rescue a transient failure', () => {
    const r = run({ failRate: 0.5, outage: null, retries: true, breaker: false });
    expect(r.some((c) => c.outcome === 'ok' && c.attempts.length > 1)).toBe(true);
  });
});

describe('the default story (napkin trace)', () => {
  const r = run({});
  it('opens two seconds-ish into the outage, re-opens after a failed trial, then closes', () => {
    expect(r.findIndex((c) => c.after === 'open')).toBe(27);
    expect(r[57]).toMatchObject({ state: 'half-open', outcome: 'failed', after: 'open' });
    expect(states(r, 87, 90)).toEqual(span('half-open', 3));
    expect(r[89]?.after).toBe('closed');
    expect(breakerTotals(r)).toMatchObject({ short: 58, saved: 58, trips: 2 });
  });
  it('without the breaker the bank takes every call during the outage', () => {
    const off = breakerTotals(run({ breaker: false }));
    expect(off.hits).toBe(120);
    expect(off.short).toBe(0);
    expect(breakerTotals(run({ breaker: false, retries: true })).hits).toBeGreaterThan(250);
  });
  it('totals up to a point are a prefix of the full run', () => {
    expect(breakerTotals(r, 0)).toEqual({ ok: 0, failed: 0, short: 0, hits: 0, saved: 0, trips: 0 });
    expect(breakerTotals(r, 28).trips).toBe(1);
  });
});

describe('properties', () => {
  it('fixed dice: first attempts ignore the retry toggle, and more failure never helps', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.double({ min: 0, max: 0.9, noNaN: true }),
        (seed, f) => {
          const base = { seed, breaker: false, outage: null };
          const a = run({ ...base, failRate: f });
          const b = run({ ...base, failRate: f, retries: true });
          const worse = run({ ...base, failRate: f + 0.1 });
          a.forEach((c, i) => {
            expect(b[i]?.attempts[0]?.ok).toBe(c.attempts[0]?.ok);
            if (c.outcome === 'failed') expect(worse[i]?.outcome).toBe('failed');
          });
        },
      ),
      { numRuns: 50 },
    );
  });
  it('every call is counted once and attempts are hits or saves', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.boolean(),
        (seed, failRate, retries) => {
          const r = run({ seed, failRate, retries });
          const t = breakerTotals(r);
          expect(t.ok + t.failed + t.short).toBe(r.length);
          expect(t.hits + t.saved).toBe(r.reduce((s, c) => s + c.attempts.length, 0));
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe('captions and verdicts', () => {
  const r = run({ failRate: 0, outage: [10, 40] });
  it('narrates each call', () => {
    expect(breakerCaption(r[5] as CallRecord)).toBe('t = 5 s · closed · call ok (0/6 failed)');
    expect(breakerCaption(r[19] as CallRecord)).toBe(
      't = 19 s · closed · call failed → breaker OPEN (29 s to half-open)',
    );
    expect(breakerCaption(r[20] as CallRecord)).toBe(
      't = 20 s · open · call failed fast, bank untouched (28 s to half-open)',
    );
    expect(breakerCaption(r[49] as CallRecord)).toBe('t = 49 s · half-open · call ok');
    expect(breakerCaption(r[51] as CallRecord)).toBe('t = 51 s · half-open · call ok → breaker CLOSED');
    const storm = run({ failRate: 0, outage: [10, 40], retries: true });
    expect(breakerCaption(storm[10] as CallRecord)).toBe(
      't = 10 s · closed · call failed after 3 retries (4/14 failed)',
    );
    const one = run({ failRate: 0.5, outage: null, retries: true, breaker: false }).find(
      (c) => c.attempts.length === 2,
    ) as CallRecord;
    expect(breakerCaption(one)).toMatch(/call ok after 1 retry$/);
    expect(breakerCaption(one, false)).toBe(`t = ${one.t} s · no breaker · call ok after 1 retry`);
    expect(breakerCaption(r[0] as CallRecord, false)).toBe('t = 0 s · no breaker · call ok');
    const four = run({ failRate: 1, outage: null, retries: true, breaker: false })[0] as CallRecord;
    expect(breakerCaption(four, false)).toBe('t = 0 s · no breaker · call failed after 3 retries');
  });
  it('sums up the run', () => {
    const tot = breakerTotals(r);
    expect(breakerVerdict(tot, 120, { breaker: true, retries: false })).toEqual({
      text: 'The breaker opened 1× and answered 29 calls instantly: 29 attempts never reached the bank.',
      good: true,
    });
    const storm = breakerTotals(run({ failRate: 1, outage: null, retries: true, breaker: false }));
    expect(breakerVerdict(storm, 120, { breaker: false, retries: true }).text).toBe(
      'Retry storm: the bank took 480 hits for 120 calls (4.0× the load).',
    );
    expect(breakerVerdict(storm, 0, { breaker: false, retries: true }).text).toContain('480.0×');
    expect(breakerVerdict(tot, 120, { breaker: false, retries: false })).toMatchObject({ good: false });
  });
});
