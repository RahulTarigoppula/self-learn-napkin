/**
 * Scaled dot-product attention on the attention napkin's worked example:
 * four words, d = 4 queries/keys (so √d = 2), 2-number values.
 */

export type Vec = readonly number[];

export const ATT_TOKENS = ['animal', 'street', 'it', 'tired'] as const;

/** Keys and values are the napkin's. q(it) = (1,1,1,1) is the napkin's; the other queries are hand-picked. */
export const ATT_K: readonly Vec[] = [
  [2, 2, 1, 1],
  [1, -1, 1, -1],
  [1, 0, 0, 0],
  [1, 1, 0, 0],
];
export const ATT_Q: readonly Vec[] = [
  [1, 1, 0, 0], // animal: mostly itself
  [0, -1, 1, 0], // street: itself
  [1, 1, 1, 1], // it: animal (the napkin's example)
  [1, 0, 0, 1], // tired: who is tired? the animal
];
export const ATT_V: readonly Vec[] = [
  [1, 0],
  [0, 1],
  [0.5, 0.5],
  [0, 0.5],
];

export const dot = (a: Vec, b: Vec): number => a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);

/**
 * Softmax with the max subtracted first (same result, no overflow). −∞ entries (masked) get weight 0;
 * an all-masked row returns all zeros instead of 0/0.
 */
export function softmax(xs: readonly number[]): number[] {
  const m = Math.max(...xs);
  if (!Number.isFinite(m)) return xs.map(() => 0);
  const e = xs.map((x) => Math.exp(x - m));
  const sum = e.reduce((s, x) => s + x, 0);
  return e.map((x) => x / sum);
}

export interface AttendResult {
  /** q·k for each key */
  raw: number[];
  /** raw / divisor, −∞ where masked */
  scores: number[];
  weights: number[];
  /** Σ wᵢ·vᵢ */
  output: number[];
}

/**
 * One query against every key. `divisor` is √d by default; `temperature` multiplies it
 * (τ < 1 sharpens, τ > 1 flattens). `mask[i] = false` hides key i (score −∞ → weight 0).
 */
export function attend(
  q: Vec,
  K: readonly Vec[],
  V: readonly Vec[],
  {
    temperature = 1,
    divisor = Math.sqrt(q.length),
    mask,
  }: { temperature?: number; divisor?: number; mask?: readonly boolean[] } = {},
): AttendResult {
  const raw = K.map((k) => dot(q, k));
  const scores = raw.map((s, i) =>
    mask && !mask[i] ? Number.NEGATIVE_INFINITY : s / (divisor * temperature),
  );
  const weights = softmax(scores);
  const dim = V[0]?.length ?? 0;
  const output = Array.from({ length: dim }, (_, j) =>
    weights.reduce((s, w, i) => s + w * (V[i]?.[j] ?? 0), 0),
  );
  return { raw, scores, weights, output };
}

/** The whole n × n weight matrix softmax(QKᵀ / (√d·τ)), optionally causal (row i sees keys 0..i). */
export function attentionMatrix(
  Q: readonly Vec[],
  K: readonly Vec[],
  V: readonly Vec[],
  temperature = 1,
  causal = false,
): number[][] {
  return Q.map(
    (q, i) => attend(q, K, V, { temperature, mask: causal ? K.map((_, j) => j <= i) : undefined }).weights,
  );
}

/** Index of the value vector closest (Euclidean) to v. */
export function nearest(v: Vec, V: readonly Vec[]): number {
  let best = 0;
  let bestD = Number.POSITIVE_INFINITY;
  V.forEach((u, i) => {
    const d = u.reduce((s, x, j) => s + (x - (v[j] ?? 0)) ** 2, 0);
    if (d < bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

/** Shannon entropy of a weight row in bits: 0 = one-hot, log2(n) = uniform. */
export const entropyBits = (w: readonly number[]): number =>
  w.reduce((s, x) => (x > 0 ? s - x * Math.log2(x) : s), 0);
