import { fnv1a } from './fnv1a';
import { rng } from './types';

export type Pt = { x: number; y: number };

/* ---------- Gradient descent on a 1-D loss ---------- */

export interface Loss {
  id: string;
  label: string;
  f: (x: number) => number;
  df: (x: number) => number;
  domain: [number, number];
}

export const LOSSES: Loss[] = [
  { id: 'bowl', label: 'Convex bowl', f: (x) => 0.5 * (x - 1) ** 2 + 0.4, df: (x) => x - 1, domain: [-4, 6] },
  {
    id: 'bumpy',
    label: 'Two valleys',
    f: (x) => 0.05 * x ** 4 - 0.6 * x ** 2 + 0.35 * x + 2.2,
    df: (x) => 0.2 * x ** 3 - 1.2 * x + 0.35,
    domain: [-4.2, 4.2],
  },
];

/** x_{t+1} = x_t − η·f'(x_t). Stops early if it diverges outside 10× the domain. */
export function descend(loss: Loss, x0: number, lr: number, steps: number): number[] {
  const xs = [x0];
  let x = x0;
  const span = loss.domain[1] - loss.domain[0];
  for (let i = 0; i < steps; i++) {
    x = x - lr * loss.df(x);
    if (!Number.isFinite(x) || Math.abs(x) > span * 10) break;
    xs.push(x);
  }
  return xs;
}

/* ---------- Thresholds, confusion matrix, ROC ---------- */

export interface Scored {
  score: number;
  label: 0 | 1;
}

export interface Confusion {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  fpr: number;
  f1: number;
  accuracy: number;
}

/** Predict positive when score ≥ t. Precision is 1 by convention when nothing is predicted positive. */
export function confusionAt(data: readonly Scored[], t: number): Confusion {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const d of data) {
    const pos = d.score >= t;
    if (pos && d.label === 1) tp++;
    else if (pos) fp++;
    else if (d.label === 1) fn++;
    else tn++;
  }
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const fpr = fp + tn === 0 ? 0 : fp / (fp + tn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { tp, fp, fn, tn, precision, recall, fpr, f1, accuracy: (tp + tn) / Math.max(1, data.length) };
}

/** ROC points (fpr, tpr) for every distinct threshold, from (0,0) to (1,1). */
export function rocCurve(data: readonly Scored[]): { fpr: number; tpr: number }[] {
  const ts = [...new Set(data.map((d) => d.score))].sort((a, b) => b - a);
  const pts = [{ fpr: 0, tpr: 0 }];
  for (const t of ts) {
    const c = confusionAt(data, t);
    pts.push({ fpr: c.fpr, tpr: c.recall });
  }
  pts.push({ fpr: 1, tpr: 1 });
  return pts;
}

/** Area under the ROC curve by the trapezoid rule. */
export function auc(pts: readonly { fpr: number; tpr: number }[]): number {
  let a = 0;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1] as { fpr: number; tpr: number };
    const q = pts[i] as { fpr: number; tpr: number };
    a += ((q.fpr - p.fpr) * (q.tpr + p.tpr)) / 2;
  }
  return a;
}

/** A fixed, believable set of 30 scored examples (12 positives) for the threshold playground. */
const POSITIVE_SCORES = [0.97, 0.93, 0.88, 0.84, 0.8, 0.74, 0.69, 0.63, 0.55, 0.47, 0.38, 0.26];
const NEGATIVE_SCORES = [
  0.71, 0.6, 0.52, 0.45, 0.41, 0.36, 0.33, 0.29, 0.24, 0.21, 0.18, 0.15, 0.12, 0.09, 0.07, 0.05, 0.03, 0.02,
];
export const THRESHOLD_DATA: Scored[] = [
  ...POSITIVE_SCORES.map((score): Scored => ({ score, label: 1 })),
  ...NEGATIVE_SCORES.map((score): Scored => ({ score, label: 0 })),
];

/* ---------- Least squares ---------- */

export function fitLine(pts: readonly Pt[]): { m: number; b: number; mse: number; r2: number } {
  const n = pts.length;
  if (n === 0) return { m: 0, b: 0, mse: 0, r2: 0 };
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  const m = sxx === 0 ? 0 : sxy / sxx;
  const b = my - m * mx;
  let sse = 0;
  let sst = 0;
  for (const p of pts) {
    sse += (p.y - (m * p.x + b)) ** 2;
    sst += (p.y - my) ** 2;
  }
  return { m, b, mse: sse / n, r2: sst === 0 ? 1 : 1 - sse / sst };
}

/* ---------- k-means ---------- */

export function blobs(seed: number, perBlob = 12): Pt[] {
  const r = rng(seed);
  const centres: Pt[] = [
    { x: 0.25, y: 0.3 },
    { x: 0.72, y: 0.28 },
    { x: 0.5, y: 0.75 },
  ];
  const gauss = () => {
    const u = Math.max(1e-9, r());
    const v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return centres.flatMap((c) =>
    Array.from({ length: perBlob }, () => ({
      x: Math.min(0.97, Math.max(0.03, c.x + gauss() * 0.075)),
      y: Math.min(0.97, Math.max(0.03, c.y + gauss() * 0.075)),
    })),
  );
}

const d2 = (a: Pt, b: Pt) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function assign(points: readonly Pt[], centroids: readonly Pt[]): number[] {
  return points.map((p) => {
    let best = 0;
    centroids.forEach((c, i) => {
      if (d2(p, c) < d2(p, centroids[best] as Pt)) best = i;
    });
    return best;
  });
}

/** Move each centroid to the mean of its points (an empty cluster keeps its centroid). */
export function update(points: readonly Pt[], labels: readonly number[], centroids: readonly Pt[]): Pt[] {
  return centroids.map((c, i) => {
    const mine = points.filter((_, j) => labels[j] === i);
    if (mine.length === 0) return c;
    return {
      x: mine.reduce((s, p) => s + p.x, 0) / mine.length,
      y: mine.reduce((s, p) => s + p.y, 0) / mine.length,
    };
  });
}

export const inertia = (points: readonly Pt[], labels: readonly number[], centroids: readonly Pt[]): number =>
  points.reduce((s, p, j) => s + d2(p, centroids[labels[j] ?? 0] as Pt), 0);

/* ---------- Bloom filter ---------- */

/** k bit positions via double hashing: h_i = (h1 + i·h2) mod m. */
export function bloomPositions(word: string, m: number, k: number): number[] {
  const h1 = fnv1a(word);
  const h2 = fnv1a(`${word}#salt`) | 1;
  return Array.from({ length: k }, (_, i) => ((h1 + Math.imul(i, h2)) >>> 0) % m);
}

/** Expected false-positive rate after n insertions: (1 − e^(−kn/m))^k. */
export const bloomFpr = (m: number, k: number, n: number): number => (1 - Math.exp((-k * n) / m)) ** k;
