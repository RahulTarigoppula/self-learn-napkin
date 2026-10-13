export const meta = {
  title:
    'Regression losses (squared, absolute, Huber) against the error, mean vs median, and log-loss vs hinge on the margin',
  width: 520,
  height: 420,
};

// Regression panel: error r in [-3, 3], loss in [0, 4]; the loss axis sits at r = 0.
const rx = (r) => 140 + 36 * r;
const ly = (l) => 206 - 40 * l;
const pts = (f, a, b, n = 24) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const r = a + ((b - a) * i) / n;
    return [rx(r), ly(f(r))];
  });
const huber = (r) => (Math.abs(r) <= 1 ? 0.5 * r * r : Math.abs(r) - 0.5);

// Classification panel: margin m in [-2, 3], loss in [0, 3]; the loss axis sits at m = 0.
const mx = (m) => 342 + 32 * (m + 2);
const my = (l) => 206 - 48 * l;
const logistic = (m) => Math.log(1 + Math.exp(-m));

// Number line of delivery times (minutes).
const NY = 330;
const nx = (v) => 30 + 11 * (v - 8);
const TIMES = [10, 12, 14, 16, 48];

export default (d) => {
  d.step('Loss as a function of the error');
  d.group(() => {
    d.line(rx(-3.1), ly(0), rx(3.1), ly(0), { pen: 'muted', single: true });
    d.line(rx(0), ly(0), rx(0), ly(4.3), { pen: 'muted', single: true });
    d.text(rx(0) + 6, ly(4.3) - 4, 'loss', { pen: 'muted', size: 15, anchor: 'start' });
    for (const r of [-2, 2]) d.text(rx(r), ly(0) + 13, r < 0 ? '−2' : '+2', { pen: 'muted', size: 13 });
    d.text(rx(0), ly(0) + 32, 'error r = y − ŷ', { pen: 'muted', size: 15 });
  });

  d.step('Squared error: big misses explode');
  d.curve(
    pts((r) => r * r, -2.05, 2.05),
    { pen: 'blue', thick: true, rough: 0.6 },
  );
  d.text(rx(-2.05) - 6, ly(4) + 8, 'MSE\nr²', { pen: 'blue', size: 16, anchor: 'end', bold: true });

  d.step('Absolute error: every unit costs the same');
  d.poly(
    [
      [rx(-3), ly(3)],
      [rx(0), ly(0)],
      [rx(3), ly(3)],
    ],
    { pen: 'green', thick: true, rough: 0.6 },
  );
  d.text(rx(3) + 6, ly(3) - 4, 'MAE |r|', { pen: 'green', size: 16, anchor: 'start', bold: true });

  d.step('Huber: squared near 0, straight beyond δ');
  d.curve(pts(huber, -3, 3, 30), { pen: 'orange', thick: true, rough: 0.6 });
  d.group(() => {
    d.text(rx(3) + 6, ly(2.5) + 12, 'Huber', { pen: 'orange', size: 16, anchor: 'start', bold: true });
    for (const r of [-1, 1])
      d.line(rx(r), ly(0) - 4, rx(r), ly(0) + 4, { pen: 'orange', thick: true, single: true });
    d.text(rx(1), ly(0) + 13, 'δ', { pen: 'orange', size: 14 });
    d.text(rx(-1), ly(0) + 13, '−δ', { pen: 'orange', size: 14 });
  });

  d.step('Mean vs median: one late delivery');
  d.group(() => {
    d.line(nx(8), NY, nx(50), NY, { pen: 'muted', single: true });
    d.text(nx(8), NY + 40, 'delivery times (min)', { pen: 'muted', size: 14, anchor: 'start' });
    for (const t of TIMES) {
      d.dot(nx(t), NY, 11, { pen: 'ink', single: true });
      d.text(nx(t), NY + 16, String(t), { pen: 'muted', size: 13 });
    }
  });
  d.group(() => {
    d.line(nx(20), NY - 4, nx(20), NY - 26, { pen: 'blue', thick: true, single: true });
    d.text(nx(20) - 14, NY - 38, 'mean 20 ← MSE', { pen: 'blue', size: 15, anchor: 'start' });
  });
  d.group(() => {
    d.line(nx(14), NY - 4, nx(14), NY - 56, { pen: 'green', thick: true, single: true });
    d.text(nx(14) - 4, NY - 68, 'median 14 ← MAE', { pen: 'green', size: 15 });
  });
  d.text(nx(48), NY - 26, 'one outlier', { pen: 'red', size: 15 });

  d.step('Classification: log-loss and hinge');
  d.group(() => {
    d.line(mx(-2.1), my(0), mx(3.1), my(0), { pen: 'muted', single: true });
    d.line(mx(0), my(0), mx(0), my(3.2), { pen: 'muted', single: true });
    d.text(mx(0.5), my(0) + 32, 'margin m = y · score', { pen: 'muted', size: 15 });
    d.text(mx(-1), my(0) + 13, 'wrong', { pen: 'muted', size: 13 });
    d.text(mx(1.5), my(0) + 13, 'right', { pen: 'muted', size: 13 });
  });
  d.poly(
    [
      [mx(-2), my(3)],
      [mx(1), my(0)],
      [mx(3), my(0)],
    ],
    { pen: 'red', thick: true, rough: 0.6 },
  );
  d.curve(
    Array.from({ length: 21 }, (_, i) => {
      const m = -2 + i / 4;
      return [mx(m), my(logistic(m))];
    }),
    { pen: 'violet', thick: true, rough: 0.6 },
  );
  d.group(() => {
    d.text(mx(0.4), my(2.9), 'hinge (SVM)', { pen: 'red', size: 15, anchor: 'start', bold: true });
    d.text(mx(0.4), my(2.45), 'log-loss', { pen: 'violet', size: 15, anchor: 'start', bold: true });
  });
};
