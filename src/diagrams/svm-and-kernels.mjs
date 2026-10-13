export const meta = {
  title:
    'SVM: many separating lines, the maximum-margin street with its support vectors, an outlier paying hinge loss, the kernel trick lifting 1-D points to (x, x²), and RBF gamma',
  width: 520,
  height: 420,
};

// Top plot: data units 0…4.4 on both axes, 46 px per unit (equal aspect so the margin looks perpendicular).
// Hard-margin SVM on these points (checked with scikit-learn): w = (1, 1), b = −4, margin 2/‖w‖ = √2 ≈ 1.41.
const OX = 44;
const OY = 226;
const S = 46;
const px = (u) => OX + S * u;
const py = (v) => OY - S * v;
const P = (u, v) => [px(u), py(v)];

const BLUE = [
  [1, 2],
  [2, 1],
  [0.8, 0.9],
  [0.4, 2.0],
  [1.8, 0.4],
];
const RED = [
  [3, 2],
  [2, 3],
  [3.2, 3.4],
  [4, 2.5],
  [2.6, 4.0],
];
const SV = [
  [1, 2],
  [2, 1],
  [3, 2],
  [2, 3],
];

// Bottom-left number line (1-D data) and bottom-right lifted plot (x, x²).
const NX = (x) => 120 + 30 * x;
const NY = 284;
const LX = (x) => 410 + 28 * x;
const LY = (x2) => 398 - 10 * x2;
const ONE_D = [-3, -2, -1, 0, 1, 2, 3];
const isRed = (x) => Math.abs(x) <= 1;

/** A small filled hexagon: reads as a dot but costs half the bytes of d.dot. */
const mark = (d, x, y, pen, dia = 9) =>
  d.poly(
    Array.from({ length: 6 }, (_, i) => [
      x + (dia / 2) * Math.cos((i * Math.PI) / 3),
      y + (dia / 2) * Math.sin((i * Math.PI) / 3),
    ]),
    { pen, fill: pen, closed: true, rough: 0.3, single: true },
  );

const neat = { rough: 0.5, single: true };

export default (d) => {
  d.step('Many lines separate the classes');
  d.group(() => {
    d.line(OX, OY, px(4.5), OY, { pen: 'muted', ...neat });
    d.line(OX, OY, OX, py(4.4), { pen: 'muted', ...neat });
    d.text(px(4.5), OY + 14, 'x₁', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(OX - 8, py(4.3), 'x₂', { pen: 'muted', size: 14, anchor: 'end' });
  });
  d.group(() => {
    for (const [u, v] of BLUE) mark(d, ...P(u, v), 'blue');
    for (const [u, v] of RED) mark(d, ...P(u, v), 'red');
  });
  d.line(...P(1.2, 4.4), ...P(3.4, 0), { pen: 'muted', thin: true, single: true });
  d.line(...P(0, 3.2), ...P(4.4, 0.9), { pen: 'muted', thin: true, single: true });
  d.text(290, 44, 'both thin lines separate\nblue from red —\nwhich one is best?', {
    pen: 'muted',
    size: 15,
    anchor: 'start',
  });

  d.step('The widest street: maximum margin');
  d.line(...P(0, 4), ...P(4, 0), { pen: 'ink', thick: true, ...neat });
  d.group(() => {
    d.line(...P(0, 3), ...P(3, 0), { pen: 'green', dashed: true, ...neat });
    d.line(...P(0.6, 4.4), ...P(4.4, 0.6), { pen: 'green', dashed: true, ...neat });
  });
  d.arrow(...P(1.5, 1.5), ...P(2.5, 2.5), { pen: 'green', both: true, thick: true, headSize: 9, single: true });
  d.text(290, 112, 'w·x + b = 0 in the middle\nmargin = 2 / ‖w‖ = 1.41', {
    pen: 'green',
    size: 15,
    anchor: 'start',
  });

  d.step('Support vectors hold the street');
  d.group(() => {
    for (const [u, v] of SV) d.circle(...P(u, v), 22, { pen: 'orange', thick: true, ...neat });
  });
  d.text(290, 166, 'support vectors: only\nthese 4 points fix the line', {
    pen: 'orange',
    size: 15,
    anchor: 'start',
  });

  d.step('Soft margin: hinge loss and C');
  d.group(() => {
    mark(d, ...P(2.6, 1.7), 'blue');
    d.circle(...P(2.6, 1.7), 22, { pen: 'violet', thick: true, ...neat });
  });
  d.text(290, 226, 'ringed blue outlier: hinge\nmax(0, 1 − y·f(x)) = 1.3\nC = 1: keep street, pay 1.3\nC = 100: squeeze to 0.49', {
    pen: 'violet',
    size: 14,
    anchor: 'start',
  });

  d.step('Kernel trick: lift x to (x, x²)');
  d.group(() => {
    d.line(NX(-3.5), NY, NX(3.5), NY, { pen: 'muted', ...neat });
    for (const x of ONE_D) mark(d, NX(x), NY, isRed(x) ? 'red' : 'blue');
    d.text(NX(0), NY + 20, 'x = −3 … 3: no single cut works', { pen: 'muted', size: 14 });
  });
  d.arrow(NX(3.5) + 6, NY, LX(-3) - 14, NY, { pen: 'ink', label: '(x, x²)', mono: true, size: 14, single: true });
  d.group(() => {
    d.line(LX(-3.3), LY(0) + 6, LX(3.3), LY(0) + 6, { pen: 'muted', ...neat });
    for (const x of ONE_D) mark(d, LX(x), LY(x * x), isRed(x) ? 'red' : 'blue');
  });
  d.group(() => {
    d.line(LX(-3.3), LY(2.5), LX(3.3), LY(2.5), { pen: 'green', dashed: true, thick: true, ...neat });
    d.text(LX(-3.3) - 6, LY(2.5), 'x² = 2.5', { pen: 'green', size: 14, anchor: 'end' });
  });

  d.step('RBF kernel: γ sets the reach');
  d.text(128, 324, 'RBF: K = exp(−γ‖x − z‖²)', { pen: 'ink', size: 14, mono: true });
  for (const [bx, label, smooth] of [
    [18, 'small γ', true],
    [134, 'large γ', false],
  ]) {
    d.group(() => {
      d.text(bx + 52, 346, label, { pen: smooth ? 'green' : 'red', size: 15 });
      d.rect(bx, 357, 104, 48, { pen: 'muted', ...neat });
      const reds = [
        [bx + 34, 372],
        [bx + 52, 390],
        [bx + 70, 374],
      ];
      const blues = [
        [bx + 14, 395],
        [bx + 88, 368],
        [bx + 92, 394],
      ];
      for (const [x, y] of reds) mark(d, x, y, 'red', 7);
      for (const [x, y] of blues) mark(d, x, y, 'blue', 7);
      if (smooth) d.ellipse(bx + 52, 381, 64, 38, { pen: 'green', rough: 0.6, single: true });
      else for (const [x, y] of reds) d.circle(x, y, 17, { pen: 'red', rough: 0.4, single: true });
    });
  }
};
