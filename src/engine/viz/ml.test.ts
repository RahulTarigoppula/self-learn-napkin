import { describe, expect, it } from 'vitest';
import {
  assign,
  auc,
  blobs,
  bloomFpr,
  bloomPositions,
  confusionAt,
  descend,
  fitLine,
  inertia,
  LOSSES,
  rocCurve,
  THRESHOLD_DATA,
  update,
} from './ml';

const bowl = LOSSES[0] as (typeof LOSSES)[number];

describe('gradient descent', () => {
  it('converges on the bowl with a sensible learning rate', () => {
    const xs = descend(bowl, -3, 0.3, 40);
    expect(xs.at(-1)).toBeCloseTo(1, 3);
  });
  it('oscillates but still converges for 1 < η < 2 and diverges for η > 2', () => {
    const osc = descend(bowl, -3, 1.6, 60);
    expect(Math.sign((osc[1] as number) - 1)).toBe(-Math.sign((osc[2] as number) - 1));
    expect(osc.at(-1)).toBeCloseTo(1, 2);
    expect(descend(bowl, -3, 2.2, 200).length).toBeLessThan(201);
  });
  it('bumpy loss has two valleys', () => {
    const b = LOSSES[1] as (typeof LOSSES)[number];
    const left = descend(b, -3, 0.05, 400).at(-1) as number;
    const right = descend(b, 3, 0.05, 400).at(-1) as number;
    expect(left).toBeLessThan(0);
    expect(right).toBeGreaterThan(0);
    expect(Math.abs(b.df(left))).toBeLessThan(1e-3);
  });
});

describe('confusion and ROC', () => {
  it('computes a confusion matrix at a threshold', () => {
    const c = confusionAt(THRESHOLD_DATA, 0.5);
    expect(c.tp + c.fn).toBe(12);
    expect(c.fp + c.tn).toBe(18);
    expect(c).toMatchObject({ tp: 9, fp: 3, fn: 3, tn: 15 });
    expect(c.precision).toBeCloseTo(0.75);
    expect(c.recall).toBeCloseTo(0.75);
  });
  it('predicting nothing positive has precision 1 by convention and recall 0', () => {
    const c = confusionAt(THRESHOLD_DATA, 1.1);
    expect(c.precision).toBe(1);
    expect(c.recall).toBe(0);
    expect(c.f1).toBe(0);
  });
  it('ROC runs from (0,0) to (1,1) and AUC is between 0.5 and 1', () => {
    const r = rocCurve(THRESHOLD_DATA);
    expect(r[0]).toEqual({ fpr: 0, tpr: 0 });
    expect(r.at(-1)).toEqual({ fpr: 1, tpr: 1 });
    const a = auc(r);
    expect(a).toBeGreaterThan(0.8);
    expect(a).toBeLessThanOrEqual(1);
    expect(
      auc([
        { fpr: 0, tpr: 0 },
        { fpr: 1, tpr: 1 },
      ]),
    ).toBe(0.5);
  });
});

describe('least squares', () => {
  it('fits a perfect line exactly', () => {
    const f = fitLine([0, 1, 2, 3].map((x) => ({ x, y: 2 * x + 1 })));
    expect(f.m).toBeCloseTo(2);
    expect(f.b).toBeCloseTo(1);
    expect(f.mse).toBeCloseTo(0);
    expect(f.r2).toBeCloseTo(1);
  });
  it('handles degenerate input', () => {
    expect(fitLine([])).toEqual({ m: 0, b: 0, mse: 0, r2: 0 });
    expect(
      fitLine([
        { x: 1, y: 2 },
        { x: 1, y: 2 },
      ]).r2,
    ).toBe(1);
  });
});

describe('k-means', () => {
  it('inertia never increases across assign/update rounds', () => {
    const pts = blobs(37);
    let cs = [pts[0], pts[1], pts[2]] as { x: number; y: number }[];
    let labels = assign(pts, cs);
    let prev = inertia(pts, labels, cs);
    for (let i = 0; i < 6; i++) {
      cs = update(pts, labels, cs);
      labels = assign(pts, cs);
      const now = inertia(pts, labels, cs);
      expect(now).toBeLessThanOrEqual(prev + 1e-12);
      prev = now;
    }
    expect(blobs(37)).toEqual(pts);
  });
  it('an empty cluster keeps its centroid', () => {
    expect(
      update(
        [{ x: 0, y: 0 }],
        [0],
        [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
        ],
      )[1],
    ).toEqual({ x: 5, y: 5 });
  });
});

describe('bloom filter', () => {
  it('k positions in range, deterministic', () => {
    const p = bloomPositions('napkin', 32, 3);
    expect(p).toHaveLength(3);
    for (const i of p) expect(i).toBeGreaterThanOrEqual(0);
    for (const i of p) expect(i).toBeLessThan(32);
    expect(bloomPositions('napkin', 32, 3)).toEqual(p);
  });
  it('false-positive formula', () => {
    expect(bloomFpr(32, 3, 0)).toBe(0);
    expect(bloomFpr(1000, 7, 100)).toBeCloseTo(0.0082, 3);
  });
});
