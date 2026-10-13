export const meta = {
  title: 'Training and test error against model complexity, with dartboards',
  width: 520,
  height: 420,
};

// Plot box: complexity c in [0, 1] across, error in [0, 0.8] up.
const X0 = 60;
const X1 = 496;
const Y0 = 262;
const YS = 280; // px per unit of error
const x = (c) => X0 + 6 + (X1 - X0 - 10) * c;
const y = (e) => Y0 - YS * e;
const NOISE = 0.1;
const test = (c) => NOISE + 0.65 * Math.exp(-4 * c) + 0.45 * c * c; // noise + bias² + variance
const train = (c) => 0.02 + 0.68 * Math.exp(-3.5 * c);
const pts = (f) => Array.from({ length: 13 }, (_, i) => [x(i / 12), y(f(i / 12))]);
const C_BEST = 0.46;

/** A small dartboard with hits at the given offsets. */
function dartboard(d, cx, cy, hits, pen) {
  d.group(() => {
    d.circle(cx, cy, 84, { pen: 'muted', single: true });
    d.circle(cx, cy, 50, { pen: 'muted', single: true });
    d.circle(cx, cy, 16, { pen: 'muted', fill: 'muted', single: true });
    for (const [dx, dy] of hits) d.dot(cx + dx, cy + dy, 10, { pen, single: true });
  });
}

export default (d) => {
  d.step('Axes: model complexity across, error up');
  d.group(() => {
    d.line(X0, Y0, X1, Y0, { pen: 'muted' });
    d.line(X0, Y0, X0, 28, { pen: 'muted' });
    d.text(X0, 18, 'error', { pen: 'muted', size: 15 });
    d.text(X1, Y0 + 18, 'model complexity', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(X0 + 6, Y0 + 18, 'simple', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('Training error falls forever');
  d.curve(pts(train), { pen: 'blue', thick: true });
  d.text(x(0.86), y(NOISE) - 22, 'training error', { pen: 'blue', size: 15, anchor: 'end' });

  d.step('Test error falls, then rises');
  d.curve(pts(test), { pen: 'red', thick: true });
  d.text(X1, y(test(1)) - 18, 'test error', { pen: 'red', size: 15, anchor: 'end' });
  d.group(() => {
    d.line(x(C_BEST), y(test(C_BEST)), x(C_BEST), Y0, { pen: 'green', dashed: true });
    d.dot(x(C_BEST), y(test(C_BEST)), 12, { pen: 'green', label: 'sweet spot', size: 15, dy: -20 });
  });

  d.step('The gap between them is variance');
  const cg = 0.9;
  d.arrow(x(cg), y(test(cg)) + 8, x(cg), y(train(cg)) - 8, { pen: 'violet', both: true, thick: true });
  d.text(x(cg) - 12, y(test(cg)) + 51, 'gap =\nvariance', { pen: 'violet', size: 16, anchor: 'end' });
  d.group(() => {
    d.line(X0 + 4, y(NOISE), X1, y(NOISE), { pen: 'muted', dashed: true });
    d.text(X0 + 10, y(NOISE) + 13, 'noise floor', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('Left: underfit, high bias');
  d.text(x(0.22), 52, 'underfit\nhigh bias', { pen: 'orange', size: 17, bold: true, anchor: 'start' });
  dartboard(
    d,
    74,
    352,
    [
      [22, -18],
      [28, -12],
      [18, -10],
      [26, -22],
      [31, -17],
    ],
    'orange',
  );
  d.text(128, 352, 'tight cluster,\nbut off-centre', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('Right: overfit, high variance');
  d.text(x(0.72), 52, 'overfit\nhigh variance', { pen: 'violet', size: 17, bold: true, anchor: 'start' });
  dartboard(
    d,
    318,
    352,
    [
      [-26, -14],
      [20, 24],
      [-6, 30],
      [28, -20],
      [-18, 18],
      [8, -32],
    ],
    'violet',
  );
  d.text(372, 352, 'centred on\naverage, but\nscattered', { pen: 'violet', size: 15, anchor: 'start' });
};
