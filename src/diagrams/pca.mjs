export const meta = {
  title:
    'PCA on five 2-D points: centre on the mean, find the diagonal direction of maximum variance, project onto it, the perpendicular second component with 90 % / 10 % explained variance, and the covariance eigenvectors',
  width: 520,
  height: 420,
};

// A(1,2) B(2,1) C(3,4) D(4,3) E(5,5). Mean (3,3); covariance [[2.5, 2], [2, 2.5]] (n − 1);
// eigenvalues 4.5 and 0.5, PC1 = (0.71, 0.71). Checked with numpy and scikit-learn.
const OX = 40;
const OY = 250;
const S = 36;
const P = (u, v) => [OX + S * u, OY - S * v];
const PTS = { A: [1, 2], B: [2, 1], C: [3, 4], D: [4, 3], E: [5, 5] };
const LABEL = {
  A: [-10, 0, 'end'],
  B: [10, 4, 'start'],
  C: [-10, 0, 'end'],
  D: [8, 16, 'start'],
  E: [-10, -6, 'end'],
};
// Foot of the perpendicular from each point onto PC1 (the diagonal through the mean).
const FOOT = { A: [1.5, 1.5], B: [1.5, 1.5], C: [3.5, 3.5], D: [3.5, 3.5], E: [5, 5] };

// PC1 score number line (bottom left)
const NX = (s) => 150 + 36 * s;
const NY = 332;

/** A small filled hexagon: reads as a dot but costs half the bytes of d.dot. */
const mark = (d, x, y, pen, dia = 11) =>
  d.poly(
    Array.from({ length: 6 }, (_, i) => [
      x + (dia / 2) * Math.cos((i * Math.PI) / 3),
      y + (dia / 2) * Math.sin((i * Math.PI) / 3),
    ]),
    { pen, fill: pen, closed: true, rough: 0.3, single: true },
  );
const neat = { rough: 0.5, single: true };
const RX = 286;

export default (d) => {
  d.step('Five points in two features');
  d.group(() => {
    d.line(OX, OY, OX + S * 6, OY, { pen: 'muted', ...neat });
    d.line(OX, OY, OX, OY - S * 6, { pen: 'muted', ...neat });
    d.text(OX + S * 6, OY + 14, 'x₁', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(OX - 8, OY - S * 5.8, 'x₂', { pen: 'muted', size: 14, anchor: 'end' });
  });
  d.group(() => {
    for (const [name, [u, v]] of Object.entries(PTS)) {
      const [x, y] = P(u, v);
      const [dx, dy, anchor] = LABEL[name];
      mark(d, x, y, 'blue');
      d.text(x + dx, y + dy, name, { pen: 'blue', size: 15, bold: true, anchor });
    }
  });

  d.step('Centre: subtract the mean');
  d.group(() => {
    const [x, y] = P(3, 3);
    d.line(x - 9, y - 9, x + 9, y + 9, { pen: 'orange', thick: true, rough: 0.3, single: true });
    d.line(x - 9, y + 9, x + 9, y - 9, { pen: 'orange', thick: true, rough: 0.3, single: true });
  });
  d.text(RX, 40, 'mean = (3, 3)\nsubtract it: the mean\nbecomes the new origin', {
    pen: 'orange',
    size: 15,
    anchor: 'start',
  });

  d.step('Find the direction of maximum spread');
  d.group(() => {
    d.line(...P(0.3, 3), ...P(5.8, 3), { pen: 'muted', dashed: true, ...neat });
    d.text(...P(0.35, 2.62), 'var 2.5', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.group(() => {
    d.line(...P(0.4, 0.4), ...P(5.8, 5.8), { pen: 'green', thick: true, ...neat });
    d.text(196, 34, 'PC1: var 4.5', { pen: 'green', size: 15, anchor: 'end' });
  });
  d.text(RX, 118, 'PC1: the direction where\nthe projected points\nvary the most', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Project onto PC1: 2-D → 1-D');
  d.group(() => {
    for (const name of ['A', 'B', 'C', 'D']) {
      d.line(...P(...PTS[name]), ...P(...FOOT[name]), { pen: 'violet', thin: true, dashed: true, ...neat });
    }
    for (const f of [FOOT.A, FOOT.C]) mark(d, ...P(...f), 'violet', 8);
  });
  d.group(() => {
    d.line(NX(-3.2), NY, NX(3.4), NY, { pen: 'muted', ...neat });
    d.text(20, NY - 42, 'PC1 score', { pen: 'muted', size: 14, anchor: 'start' });
    for (const [s, lab, val] of [
      [-2.12, 'A, B', '−2.12'],
      [0.71, 'C, D', '0.71'],
      [2.83, 'E', '2.83'],
    ]) {
      mark(d, NX(s), NY, 'violet', 10);
      d.text(NX(s), NY - 16, lab, { pen: 'violet', size: 14, bold: true });
      d.text(NX(s), NY + 18, val, { pen: 'violet', size: 14, mono: true });
    }
  });

  d.step('PC2 and explained variance');
  d.group(() => {
    d.line(...P(1.9, 4.1), ...P(4.1, 1.9), { pen: 'red', ...neat });
    d.text(...P(4.25, 1.55), 'PC2', { pen: 'red', size: 14, anchor: 'start' });
  });
  d.group(() => {
    d.text(RX, 190, 'explained variance', { pen: 'muted', size: 14, anchor: 'start' });
    d.rect(RX + 40, 204, 4.5 * 30, 16, { pen: 'green', fill: 'green', ...neat });
    d.text(RX + 34, 212, 'PC1', { pen: 'green', size: 14, anchor: 'end' });
    d.text(RX + 46 + 4.5 * 30, 212, '90 %', { pen: 'green', size: 14, anchor: 'start', mono: true });
    d.rect(RX + 40, 228, 0.5 * 30, 16, { pen: 'red', fill: 'red', ...neat });
    d.text(RX + 34, 236, 'PC2', { pen: 'red', size: 14, anchor: 'end' });
    d.text(RX + 46 + 0.5 * 30, 236, '10 %', { pen: 'red', size: 14, anchor: 'start', mono: true });
  });

  d.step('Under the hood: eigenvectors');
  d.group(() => {
    d.text(RX, 286, 'covariance matrix', { pen: 'muted', size: 14, anchor: 'start' });
    d.text(RX, 314, '[ 2.5  2.0 ]\n[ 2.0  2.5 ]', { pen: 'ink', size: 15, anchor: 'start', mono: true });
  });
  d.text(RX, 366, 'eigenvalues 4.5, 0.5\neigenvectors (0.71, 0.71)\nand (−0.71, 0.71)', {
    pen: 'blue',
    size: 14,
    anchor: 'start',
  });
};
