export const meta = {
  title:
    'Agglomerative clustering of five points with single linkage: merges at 1, 1.41, 2 and 5 drawn as a dendrogram, the linkage rules compared, and a cut at height 3 giving two clusters',
  width: 520,
  height: 420,
};

// A(1,1) B(2,1) C(1,3) D(6,4) E(7,5). Single linkage (checked with scipy): AB 1, DE 1.41, C+AB 2, all 5.
const OX = 30;
const OY = 230;
const S = 28;
const P = (u, v) => [OX + S * u, OY - S * v];
const PTS = { A: [1, 1], B: [2, 1], C: [1, 3], D: [6, 4], E: [7, 5] };
// Where each point's letter goes (dx, dy, anchor), clear of the cluster outlines.
const LABEL = {
  A: [0, -26, 'middle'],
  B: [0, -26, 'middle'],
  C: [12, 0, 'start'],
  D: [0, 26, 'middle'],
  E: [0, -26, 'middle'],
};

// Dendrogram: leaves along the bottom, merge height h drawn at y = HY(h).
const LX = { A: 304, B: 340, C: 376, D: 440, E: 476 };
const BASE = 236;
const HY = (h) => BASE - 34 * h;

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

/** A dendrogram link: two legs up from (x1, y1) and (x2, y2) to height h, joined across. */
const link = (d, x1, y1, x2, y2, h, pen) =>
  d.poly(
    [
      [x1, y1],
      [x1, HY(h)],
      [x2, HY(h)],
      [x2, y2],
    ],
    { pen, thick: true, ...neat },
  );

export default (d) => {
  d.step('Every point starts as its own cluster');
  d.group(() => {
    d.line(OX, OY, OX + S * 8, OY, { pen: 'muted', ...neat });
    d.line(OX, OY, OX, OY - S * 6, { pen: 'muted', ...neat });
  });
  d.group(() => {
    for (const [name, [u, v]] of Object.entries(PTS)) {
      const [x, y] = P(u, v);
      const [dx, dy, anchor] = LABEL[name];
      mark(d, x, y, 'ink');
      d.text(x + dx, y + dy, name, { pen: 'ink', size: 16, bold: true, anchor });
    }
  });
  d.group(() => {
    d.line(286, BASE, 494, BASE, { pen: 'muted', ...neat });
    d.line(286, BASE, 286, HY(5.6), { pen: 'muted', ...neat });
    for (const h of [1, 2, 3, 4, 5]) d.text(280, HY(h), String(h), { pen: 'muted', size: 14, anchor: 'end', mono: true });
    for (const [name, x] of Object.entries(LX)) d.text(x, BASE + 14, name, { pen: 'ink', size: 15, bold: true });
    d.text(292, HY(5.9), 'merge height', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('Merge the closest pair: A + B at 1');
  d.ellipse(...P(1.5, 1), 64, 30, { pen: 'blue', ...neat });
  link(d, LX.A, BASE, LX.B, BASE, 1, 'blue');

  d.step('Next closest: D + E at 1.41');
  d.ellipse(...P(6.5, 4.5), 74, 56, { pen: 'red', ...neat });
  link(d, LX.D, BASE, LX.E, BASE, Math.SQRT2, 'red');

  d.step('Linkage: how far apart are two clusters?');
  d.ellipse(...P(1.4, 1.8), 104, 92, { pen: 'blue', dashed: true, ...neat });
  link(d, (LX.A + LX.B) / 2, HY(1), LX.C, BASE, 2, 'blue');
  d.group(() => {
    d.text(20, 290, 'distance from {A, B} to C:', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(20, 316, 'single: closest pair → 2.00', { pen: 'blue', size: 15, anchor: 'start' });
    d.text(20, 338, 'complete: farthest pair → 2.24', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(20, 360, 'average: mean of pairs → 2.12', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(20, 382, 'Ward: least added variance', { pen: 'muted', size: 15, anchor: 'start' });
  });

  d.step('Last merge: everything at 5');
  d.group(() => {
    d.line(...P(2, 1), ...P(6, 4), { pen: 'violet', dashed: true, ...neat });
    d.text(...P(4.4, 2.0), '5.0', { pen: 'violet', size: 15, mono: true });
  });
  link(d, (LX.A + LX.B + 2 * LX.C) / 4, HY(2), (LX.D + LX.E) / 2, HY(Math.SQRT2), 5, 'violet');
  d.text(300, 362, 'cost: all n² pair distances\n100,000 points → 5 × 10⁹\npairs ≈ 40 GB in float64', {
    pen: 'red',
    size: 14,
    anchor: 'start',
  });

  d.step('Cut the tree to get clusters');
  d.group(() => {
    d.line(288, HY(3), 500, HY(3), { pen: 'orange', dashed: true, thick: true, ...neat });
    d.text(300, 298, 'cut at height 3 → two\nclusters {A, B, C}, {D, E}', { pen: 'orange', size: 15, anchor: 'start' });
  });
};
