import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  inFlight,
  LB_DEFAULTS,
  LB_STRATEGIES,
  type LbJob,
  type LbParams,
  lbCompare,
  lbQueues,
  lbSimulate,
  lbStats,
  lbWorkload,
  percentile,
} from './load-balancer';

/** One 100 ms request, then three 10 ms ones every 10 ms, on two servers. */
const TINY = [
  { arrive: 0, work: 100 },
  { arrive: 10, work: 10 },
  { arrive: 20, work: 10 },
  { arrive: 30, work: 10 },
];
const two = (strategy: LbParams['strategy'], extra: Partial<LbParams> = {}): LbParams => ({
  ...LB_DEFAULTS,
  servers: 2,
  slow: null,
  strategy,
  ...extra,
});
const lat = (jobs: LbJob[]) => jobs.map((j) => j.done - j.arrive);

describe('percentile (nearest rank)', () => {
  it('matches hand-computed ranks', () => {
    const xs = [50, 10, 40, 20, 30];
    expect(percentile(xs, 0.5)).toBe(30);
    expect(percentile(xs, 0.99)).toBe(50);
    expect(percentile(xs, 0)).toBe(10);
    expect(percentile(xs, 1)).toBe(50);
    expect(percentile([], 0.5)).toBe(0);
    expect(
      percentile(
        Array.from({ length: 100 }, (_, i) => i + 1),
        0.99,
      ),
    ).toBe(99);
  });
  it('does not mutate its input', () => {
    const xs = [3, 1, 2];
    percentile(xs, 0.5);
    expect(xs).toEqual([3, 1, 2]);
  });
});

describe('workload', () => {
  it('is deterministic, ordered and inside the documented ranges', () => {
    const a = lbWorkload(7, 120);
    expect(a).toEqual(lbWorkload(7, 120));
    expect(a).not.toEqual(lbWorkload(8, 120));
    for (let i = 1; i < a.length; i++) {
      const gap = (a[i]?.arrive as number) - (a[i - 1]?.arrive as number);
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(100);
    }
    for (const w of a) expect((w.work >= 20 && w.work <= 60) || (w.work >= 200 && w.work <= 400)).toBe(true);
    expect(a.some((w) => w.work >= 200)).toBe(true);
  });
});

describe('strategies on a hand-checked trace', () => {
  it('round robin alternates and queues the third request behind the long one', () => {
    const jobs = lbSimulate(two('round-robin'), TINY);
    expect(jobs.map((j) => j.server)).toEqual([0, 1, 0, 1]);
    expect(lat(jobs)).toEqual([100, 10, 90, 10]);
    expect(jobs[2]).toMatchObject({ start: 100, done: 110 });
  });

  it('least connections steers around the busy server', () => {
    const jobs = lbSimulate(two('least-conn'), TINY);
    expect(jobs.map((j) => j.server)).toEqual([0, 1, 1, 1]);
    expect(lat(jobs)).toEqual([100, 10, 10, 10]);
  });

  it('power of two on two servers always samples both, so it matches least connections', () => {
    const jobs = lbSimulate(two('p2c'), TINY);
    expect(lat(jobs)).toEqual([100, 10, 10, 10]);
  });

  it('power of two with one server sends everything to it', () => {
    const jobs = lbSimulate(two('p2c', { servers: 1 }), TINY);
    expect(jobs.every((j) => j.server === 0)).toBe(true);
    expect(lat(jobs)).toEqual([100, 100, 100, 100]);
  });

  it('a slow server multiplies its work (and a factor below 1 is clamped)', () => {
    const slow = lbSimulate(two('round-robin', { slow: 1, slowFactor: 3 }), TINY);
    expect(lat(slow)).toEqual([100, 30, 90, 40]);
    const clamped = lbSimulate(two('round-robin', { slow: 1, slowFactor: 0.2 }), TINY);
    expect(lat(clamped)).toEqual([100, 10, 90, 10]);
  });

  it('treats zero servers as one', () => {
    expect(lbSimulate(two('least-conn', { servers: 0 }), TINY).every((j) => j.server === 0)).toBe(true);
  });
});

describe('in flight, queues and stats', () => {
  const jobs = lbSimulate(two('round-robin'), TINY);
  it('counts requests in flight; a request finishing at t has left', () => {
    expect(inFlight(jobs, 2, 0)).toEqual([1, 0]);
    expect(inFlight(jobs, 2, 25)).toEqual([2, 0]);
    expect(inFlight(jobs, 2, 20)).toEqual([2, 0]);
    expect(inFlight(jobs, 2, 35)).toEqual([2, 1]);
    expect(inFlight(jobs, 2, 110)).toEqual([0, 0]);
  });
  it('lists queues running-first', () => {
    expect(lbQueues(jobs, 2, 50)).toEqual([[0, 2], []]);
    expect(lbQueues(jobs, 2, 105)).toEqual([[2], []]);
  });
  it('stats as of a time only count finished requests', () => {
    expect(lbStats(jobs, 2, -1)).toEqual({ done: 0, p50: 0, p99: 0, maxQueue: 0 });
    expect(lbStats(jobs, 2, 25)).toEqual({ done: 1, p50: 10, p99: 10, maxQueue: 2 });
    expect(lbStats(jobs, 2)).toEqual({ done: 4, p50: 10, p99: 100, maxQueue: 2 });
  });
});

describe('the default story: server B is 3× slow', () => {
  const { results, winner } = lbCompare(LB_DEFAULTS);
  it('round robin keeps feeding B and its p99 explodes', () => {
    expect(results['round-robin'].p99).toBe(3615);
    expect(results['round-robin'].maxQueue).toBe(14);
  });
  it('least connections wins on p99; power of two is close behind', () => {
    expect(winner).toBe('least-conn');
    expect(results['least-conn'].p99).toBe(705);
    expect(results.p2c.p99).toBe(972);
    expect(results.p2c.p99).toBeLessThan(results['round-robin'].p99);
  });
  it('every request finishes under every strategy', () => {
    for (const s of LB_STRATEGIES) expect(results[s].done).toBe(LB_DEFAULTS.n);
  });
  it('ties go to the first strategy', () => {
    expect(lbCompare({ ...LB_DEFAULTS, servers: 1 }).winner).toBe('round-robin');
  });
});

describe('invariants (property)', () => {
  it('FIFO per server, work conserved, p2c never picks a strict maximum', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 2, max: 4 }),
        fc.constantFrom(...LB_STRATEGIES),
        fc.option(fc.integer({ min: 0, max: 3 }), { nil: null }),
        (seed, servers, strategy, slow) => {
          const p: LbParams = { ...LB_DEFAULTS, seed, servers, strategy, slow, n: 40 };
          const jobs = lbSimulate(p);
          const lastDone = Array.from({ length: servers }, () => 0);
          jobs.forEach((j, i) => {
            expect(j.start).toBeGreaterThanOrEqual(Math.max(j.arrive, lastDone[j.server] as number));
            expect(j.done - j.start).toBe(j.work * (j.server === slow ? 3 : 1));
            lastDone[j.server] = j.done;
            if (strategy === 'p2c') {
              const load = inFlight(jobs.slice(0, i), servers, j.arrive);
              const mine = load[j.server] as number;
              expect(load.some((l, s) => s !== j.server && l >= mine)).toBe(true);
            }
          });
        },
      ),
      { numRuns: 60 },
    );
  });
});
