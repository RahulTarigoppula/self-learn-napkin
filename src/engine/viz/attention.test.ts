import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ATT_K,
  ATT_Q,
  ATT_TOKENS,
  ATT_V,
  attend,
  attentionMatrix,
  dot,
  entropyBits,
  nearest,
  softmax,
} from './attention';

const IT = ATT_TOKENS.indexOf('it');
const round = (xs: readonly number[], d = 3) => xs.map((x) => Number(x.toFixed(d)));

describe('softmax', () => {
  it('matches the quiz: scores 2 and 0 → 0.88 and 0.12', () => {
    expect(round(softmax([2, 0]), 2)).toEqual([0.88, 0.12]);
  });
  it('is stable for huge scores and zeroes masked ones', () => {
    expect(round(softmax([1000, 1000]))).toEqual([0.5, 0.5]);
    expect(softmax([1, Number.NEGATIVE_INFINITY])).toEqual([1, 0]);
  });
  it('returns zeros, not NaN, for a fully masked row', () => {
    expect(softmax([Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY])).toEqual([0, 0]);
  });
});

describe('the napkin worked example: "it" attends', () => {
  const r = attend(ATT_Q[IT] as number[], ATT_K, ATT_V);
  it('dot products 6, 0, 1, 2 → ÷2 → scores 3, 0, 0.5, 1', () => {
    expect(r.raw).toEqual([6, 0, 1, 2]);
    expect(r.scores).toEqual([3, 0, 0.5, 1]);
  });
  it('weights 0.789, 0.039, 0.065, 0.107', () => {
    expect(round(r.weights)).toEqual([0.789, 0.039, 0.065, 0.107]);
  });
  it('output (0.822, 0.125), nearest to v(animal)', () => {
    expect(round(r.output)).toEqual([0.822, 0.125]);
    expect(ATT_TOKENS[nearest(r.output, ATT_V)]).toBe('animal');
  });
});

describe('the other hand-picked queries', () => {
  it('animal: scores 2, 0, 0.5, 1', () => {
    const r = attend(ATT_Q[0] as number[], ATT_K, ATT_V);
    expect(r.scores).toEqual([2, 0, 0.5, 1]);
    expect(round(r.weights)).toEqual([0.579, 0.078, 0.129, 0.213]);
  });
  it('street looks mostly at itself', () => {
    const r = attend(ATT_Q[1] as number[], ATT_K, ATT_V);
    expect(r.scores).toEqual([-0.5, 1, 0, -0.5]);
    expect(round(r.weights)).toEqual([0.123, 0.551, 0.203, 0.123]);
  });
  it('tired: the animal is the one that is tired', () => {
    const r = attend(ATT_Q[3] as number[], ATT_K, ATT_V);
    expect(r.scores).toEqual([1.5, 0, 0.5, 0.5]);
    expect(round(r.weights)).toEqual([0.51, 0.114, 0.188, 0.188]);
  });
});

describe('temperature, divisor and mask', () => {
  const q = ATT_Q[IT] as number[];
  it('a low temperature sharpens towards one-hot, a high one flattens towards ¼ each', () => {
    expect(attend(q, ATT_K, ATT_V, { temperature: 0.1 }).weights[0]).toBeGreaterThan(0.999);
    for (const w of attend(q, ATT_K, ATT_V, { temperature: 100 }).weights) expect(w).toBeCloseTo(0.25, 1);
  });
  it('without the √d scaling the scores are the raw dot products', () => {
    const r = attend(q, ATT_K, ATT_V, { divisor: 1 });
    expect(r.scores).toEqual([6, 0, 1, 2]);
    expect(r.weights[0]).toBeGreaterThan(0.97);
  });
  it('a causal mask hides later words and re-normalises the rest', () => {
    const r = attend(q, ATT_K, ATT_V, { mask: [true, true, true, false] });
    expect(r.scores[3]).toBe(Number.NEGATIVE_INFINITY);
    expect(round(r.weights)).toEqual([0.883, 0.044, 0.073, 0]);
  });
  it('the causal matrix is lower-triangular and the first row is one-hot', () => {
    const m = attentionMatrix(ATT_Q, ATT_K, ATT_V, 1, true);
    expect(m[0]).toEqual([1, 0, 0, 0]);
    m.forEach((row, i) => {
      row.forEach((w, j) => {
        if (j > i) expect(w).toBe(0);
      });
    });
    expect(round(attentionMatrix(ATT_Q, ATT_K, ATT_V)[IT] as number[])).toEqual([0.789, 0.039, 0.065, 0.107]);
  });
  it('handles an empty value list', () => {
    expect(attend([1], [[1]], []).output).toEqual([]);
  });
});

describe('helpers', () => {
  it('dot multiplies matching entries and adds', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    expect(dot([1, 2], [3])).toBe(3);
  });
  it('entropy: 0 bits for one-hot, 2 bits for uniform over 4', () => {
    expect(entropyBits([1, 0, 0, 0])).toBe(0);
    expect(entropyBits([0.25, 0.25, 0.25, 0.25])).toBe(2);
  });
  it('nearest picks the closest vector', () => {
    expect(nearest([0.1, 0.9], ATT_V)).toBe(1);
  });
});

describe('properties', () => {
  const vec = fc.array(fc.integer({ min: -3, max: 3 }), { minLength: 4, maxLength: 4 });
  it('weights sum to 1 and the output stays inside the values’ bounding box', () => {
    fc.assert(
      fc.property(vec, fc.double({ min: 0.1, max: 5, noNaN: true }), (q, t) => {
        const r = attend(q, ATT_K, ATT_V, { temperature: t });
        expect(r.weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 9);
        for (const j of [0, 1]) {
          const col = ATT_V.map((v) => v[j] as number);
          expect(r.output[j]).toBeGreaterThanOrEqual(Math.min(...col) - 1e-9);
          expect(r.output[j]).toBeLessThanOrEqual(Math.max(...col) + 1e-9);
        }
      }),
    );
  });
  it('raising the temperature never increases the top weight', () => {
    fc.assert(
      fc.property(vec, fc.double({ min: 0.1, max: 4, noNaN: true }), (q, t) => {
        const top = (tt: number) => Math.max(...attend(q, ATT_K, ATT_V, { temperature: tt }).weights);
        expect(top(t + 0.5)).toBeLessThanOrEqual(top(t) + 1e-12);
      }),
    );
  });
});
