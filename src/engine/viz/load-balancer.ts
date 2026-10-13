import { rng } from './types';

/** The three algorithms the load-balancing napkin compares. */
export type LbStrategy = 'round-robin' | 'least-conn' | 'p2c';
export const LB_STRATEGIES: readonly LbStrategy[] = ['round-robin', 'least-conn', 'p2c'];
export const LB_LABEL: Record<LbStrategy, string> = {
  'round-robin': 'Round robin',
  'least-conn': 'Least connections',
  p2c: 'Power of two',
};

export interface LbParams {
  /** number of backends, 1..6 */
  servers: number;
  /** index of the slow backend, or null when all are equal */
  slow: number | null;
  /** how many times slower the slow backend works (≥ 1) */
  slowFactor: number;
  strategy: LbStrategy;
  /** traffic seed: same seed = same requests for every strategy */
  seed: number;
  /** number of requests */
  n: number;
}

export interface LbJob {
  id: number;
  /** arrival time, ms */
  arrive: number;
  /** work in ms on a normal-speed server */
  work: number;
  server: number;
  start: number;
  done: number;
}

export const LB_DEFAULTS: LbParams = {
  servers: 3,
  slow: 1,
  slowFactor: 3,
  strategy: 'round-robin',
  seed: 7,
  n: 120,
};

/**
 * Deterministic traffic: requests arrive every 0–100 ms (mean 50 ms); 80 % are quick (20–60 ms of work)
 * and 20 % are slow (200–400 ms). That is "anywhere from 5 ms to 5 s" in miniature.
 */
export function lbWorkload(seed: number, n: number): { arrive: number; work: number }[] {
  const r = rng(seed);
  let t = 0;
  return Array.from({ length: n }, () => {
    t += Math.round(r() * 100);
    const long = r() < 0.2;
    const work = long ? 200 + Math.round(r() * 200) : 20 + Math.round(r() * 40);
    return { arrive: t, work };
  });
}

/** Requests in flight on each server at time t (queued or running). A job finishing at t has left. */
export function inFlight(jobs: readonly LbJob[], servers: number, t: number): number[] {
  const out = Array.from({ length: servers }, () => 0);
  for (const j of jobs) if (j.arrive <= t && j.done > t) out[j.server] = (out[j.server] ?? 0) + 1;
  return out;
}

/** Index of the smallest value; ties go to the lowest index. */
const argmin = (xs: readonly number[]): number =>
  xs.reduce((best, x, i) => (x < (xs[best] as number) ? i : best), 0);

/**
 * Each server works its own FIFO queue one request at a time. The balancer picks a server on arrival:
 * round robin cycles; least connections takes the fewest in flight; power of two samples two distinct
 * servers at random and takes the less busy one (ties → the first sampled).
 */
export function lbSimulate(p: LbParams, traffic = lbWorkload(p.seed, p.n)): LbJob[] {
  const servers = Math.max(1, Math.floor(p.servers));
  const pick = rng(p.seed * 7919 + 1);
  const free = Array.from({ length: servers }, () => 0);
  const jobs: LbJob[] = [];
  traffic.forEach((w, id) => {
    const load = inFlight(jobs, servers, w.arrive);
    let server: number;
    if (p.strategy === 'round-robin') server = id % servers;
    else if (p.strategy === 'least-conn') server = argmin(load);
    else if (servers === 1) server = 0;
    else {
      const a = Math.floor(pick() * servers);
      const b = (a + 1 + Math.floor(pick() * (servers - 1))) % servers;
      server = (load[b] as number) < (load[a] as number) ? b : a;
    }
    const speed = server === p.slow ? Math.max(1, p.slowFactor) : 1;
    const start = Math.max(w.arrive, free[server] as number);
    const done = start + w.work * speed;
    free[server] = done;
    jobs.push({ id, arrive: w.arrive, work: w.work, server, start, done });
  });
  return jobs;
}

/** Nearest-rank percentile (q in 0..1) of an unsorted list; 0 for an empty list. */
export function percentile(xs: readonly number[], q: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1));
  return s[i] as number;
}

export interface LbStats {
  done: number;
  p50: number;
  p99: number;
  /** longest queue (requests in flight on one server) seen so far */
  maxQueue: number;
}

/** Stats as of time t (default: the whole run). Latency = done − arrive, of requests finished by t. */
export function lbStats(jobs: readonly LbJob[], servers: number, t = Number.POSITIVE_INFINITY): LbStats {
  const lat = jobs.filter((j) => j.done <= t).map((j) => j.done - j.arrive);
  let maxQueue = 0;
  for (const j of jobs) {
    if (j.arrive > t) break;
    maxQueue = Math.max(maxQueue, ...inFlight(jobs, servers, j.arrive));
  }
  return { done: lat.length, p50: percentile(lat, 0.5), p99: percentile(lat, 0.99), maxQueue };
}

/** Every strategy on the same traffic; `winner` has the lowest p99 (ties → earlier in LB_STRATEGIES). */
export function lbCompare(p: Omit<LbParams, 'strategy'>): {
  results: Record<LbStrategy, LbStats>;
  winner: LbStrategy;
} {
  const results = {} as Record<LbStrategy, LbStats>;
  for (const s of LB_STRATEGIES) results[s] = lbStats(lbSimulate({ ...p, strategy: s }), p.servers);
  const winner = LB_STRATEGIES.reduce((a, b) => (results[b].p99 < results[a].p99 ? b : a));
  return { results, winner };
}

/** Ids queued on each server at time t, the running one first. */
export function lbQueues(jobs: readonly LbJob[], servers: number, t: number): number[][] {
  const q: number[][] = Array.from({ length: servers }, () => []);
  for (const j of jobs) if (j.arrive <= t && j.done > t) q[j.server]?.push(j.id);
  return q;
}
