export const meta = {
  title:
    'Ridge regularisation taming a degree-9 polynomial, and the L2 circle vs L1 diamond constraint pictures',
  width: 520,
  height: 420,
};

// ---------- Top panel: degree-9 polynomial through 10 noisy points of sin(2πx) ----------
const XS = Array.from({ length: 10 }, (_, i) => i / 9);
const NOISE = [0.15, -0.2, 0.1, 0.25, -0.15, 0.05, -0.25, 0.1, 0.2, -0.1];
const YS = XS.map((x, i) => Math.sin(2 * Math.PI * x) + NOISE[i]);

/** Least squares by Householder QR (A is m×n, m ≥ n). */
function lstsq(A, b) {
  A = A.map((r) => r.slice());
  b = b.slice();
  const m = A.length;
  const n = A[0].length;
  for (let k = 0; k < n; k++) {
    const x = [];
    for (let i = k; i < m; i++) x.push(A[i][k]);
    const alpha = -Math.sign(x[0] || 1) * Math.hypot(...x);
    const v = x.slice();
    v[0] -= alpha;
    const vn = Math.hypot(...v);
    if (vn === 0) continue;
    for (let i = 0; i < v.length; i++) v[i] /= vn;
    for (let j = k; j < n; j++) {
      let s = 0;
      for (let i = k; i < m; i++) s += v[i - k] * A[i][j];
      for (let i = k; i < m; i++) A[i][j] -= 2 * v[i - k] * s;
    }
    let s = 0;
    for (let i = k; i < m; i++) s += v[i - k] * b[i];
    for (let i = k; i < m; i++) b[i] -= 2 * v[i - k] * s;
  }
  const w = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * w[j];
    w[i] = s / A[i][i];
  }
  return w;
}

/** Ridge fit of a degree-9 polynomial; the intercept is not penalised. */
function ridge(lam) {
  const A = XS.map((x) => Array.from({ length: 10 }, (_, k) => x ** k));
  const b = YS.slice();
  for (let k = 1; k < 10; k++) {
    const r = new Array(10).fill(0);
    r[k] = Math.sqrt(lam);
    A.push(r);
    b.push(0);
  }
  return lstsq(A, b);
}
const poly = (w) => (x) => w.reduce((s, c, k) => s + c * x ** k, 0);

const PX = (x) => 44 + 440 * x;
const PY = (y) => 104 - 41 * y;
const curvePts = (f) => Array.from({ length: 61 }, (_, i) => [PX(i / 60), PY(f(i / 60))]);

// ---------- Bottom panels: loss contours in weight space ----------
const WS = [1.0, 1.6]; // unregularised optimum
const TH = (-30 * Math.PI) / 180;
const EA = 1;
const EB = 3; // eigenvalues of the quadratic loss
const [C, S] = [Math.cos(TH), Math.sin(TH)];
const AM = [
  [EA * C * C + EB * S * S, (EA - EB) * C * S],
  [(EA - EB) * C * S, EA * S * S + EB * C * C],
];
const loss = ([w1, w2]) => {
  const a = w1 - WS[0];
  const b = w2 - WS[1];
  return a * (AM[0][0] * a + AM[0][1] * b) + b * (AM[1][0] * a + AM[1][1] * b);
};
/** Points of the contour loss = c (an ellipse around WS). */
const contour = (c) =>
  Array.from({ length: 33 }, (_, i) => {
    const p = (2 * Math.PI * i) / 32;
    const u = Math.sqrt(c / EA) * Math.cos(p);
    const v = Math.sqrt(c / EB) * Math.sin(p);
    return [WS[0] + C * u - S * v, WS[1] + S * u + C * v];
  });
// Ridge: best point on the circle |w| = 1 (scan). Lasso: best point on the diamond |w1| + |w2| = 1 (scan).
let ridgeBest = [1, 0];
for (let i = 0; i < 3600; i++) {
  const a = (i * Math.PI) / 1800;
  const p = [Math.cos(a), Math.sin(a)];
  if (loss(p) < loss(ridgeBest)) ridgeBest = p;
}
let lassoBest = [1, 0];
const DIAMOND = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];
for (let i = 0; i < 4000; i++) {
  const k = Math.floor(i / 1000);
  const f = (i % 1000) / 1000;
  const p = [
    DIAMOND[k][0] * (1 - f) + DIAMOND[k + 1][0] * f,
    DIAMOND[k][1] * (1 - f) + DIAMOND[k + 1][1] * f,
  ];
  if (loss(p) < loss(lassoBest)) lassoBest = p;
}

const SC = 38; // px per weight unit
function panel(d, ox, oy, title, pen) {
  const X = ([w1, w2]) => [ox + SC * w1, oy - SC * w2];
  d.group(() => {
    d.arrow(ox - 1.2 * SC, oy, ox + 3 * SC, oy, { pen: 'muted', thin: true });
    d.arrow(ox, oy + 1.15 * SC, ox, oy - 3.4 * SC, { pen: 'muted', thin: true });
    d.text(ox + 3 * SC + 6, oy, 'w₁', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(ox - 10, oy - 3.3 * SC, 'w₂', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(ox + 3.2 * SC, 226, title, { pen, size: 16, bold: true, anchor: 'end' });
  });
  return X;
}

/** Loss contours, the unpenalised optimum and a pointer label to it. */
function contours(d, X, level) {
  d.group(() => {
    for (const f of [0.08, 0.4, 1])
      d.curve(contour(f * level).map(X), { pen: 'muted', thin: true, single: true });
    d.dot(...X(WS), 8, { pen: 'ink' });
  });
}

export default (d) => {
  d.step('Degree 9, no penalty: it wiggles');
  d.group(() => {
    d.line(PX(0) - 8, PY(0), PX(1) + 8, PY(0), { pen: 'muted', thin: true });
    for (let i = 0; i < 10; i++) d.dot(PX(XS[i]), PY(YS[i]), 9, { pen: 'blue', single: true });
  });
  d.curve(curvePts(poly(ridge(0))), { pen: 'red', thick: true });
  d.text(PX(0.35), 182, 'λ = 0: weights up to ≈ 580,000', { pen: 'red', size: 15 });

  d.step('A small λ: smooth and close to the truth');
  d.curve(curvePts(poly(ridge(1e-3))), { pen: 'green', thick: true });
  d.text(PX(1) + 6, 26, 'λ = 0.001\njust right', { pen: 'green', size: 15, anchor: 'end' });

  d.step('Too much λ: it underfits');
  d.curve(curvePts(poly(ridge(1))), { pen: 'orange', thick: true });
  d.text(PX(0.78), PY(0.4), 'λ = 1: too flat', { pen: 'orange', size: 15 });

  d.step('L2 (ridge): a circle, weights shrink');
  {
    const X = panel(d, 66, 358, 'L2 · ridge', 'blue');
    d.circle(...X([0, 0]), 2 * SC, { pen: 'blue', fill: 'blue' });
    contours(d, X, loss(ridgeBest));
    d.group(() => {
      d.dot(...X(ridgeBest), 11, { pen: 'red' });
      d.text(X([1.2, 0])[0], 384, 'both shrink,\nneither is 0', { pen: 'red', size: 15, anchor: 'start' });
    });
  }

  d.step('L1 (lasso): a diamond, a weight hits 0');
  {
    const X = panel(d, 320, 358, 'L1 · lasso', 'violet');
    d.poly(DIAMOND.map(X), { pen: 'violet', fill: 'violet', closed: true });
    contours(d, X, loss(lassoBest));
    d.group(() => {
      d.dot(...X(lassoBest), 11, { pen: 'red' });
      d.text(X([1.2, 0])[0], 384, 'hits a corner:\nw₁ = 0 exactly', {
        pen: 'red',
        size: 15,
        anchor: 'start',
      });
    });
  }
};
