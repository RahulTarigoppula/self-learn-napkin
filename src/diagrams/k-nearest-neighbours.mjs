export const meta = {
  title:
    'k-nearest neighbours: a new point Q, its 3 nearest neighbours voting red, k = 1 flipping to blue, Euclidean vs Manhattan distance, the curse of dimensionality and KD-tree splits',
  width: 520,
  height: 420,
};

// Main plot: data units 0…10 on both axes, 24 px per unit (equal aspect so circles are true distances).
const OX = 36;
const OY = 262;
const S = 24;
const P = (u, v) => [OX + S * u, OY - S * v];
const Q = [5, 5];

const BLUE = [
  [5.6, 4.4],
  [3.6, 3.9],
  [6.6, 3.8],
  [2, 2],
  [3.2, 1.5],
  [7.6, 2.2],
  [8.2, 4.0],
];
const RED = [
  [4.0, 5.6],
  [6.1, 5.9],
  [5.0, 7.2],
  [3, 8.2],
  [6.6, 8.4],
  [8.2, 7.0],
];

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
const RX = 300; // right-hand annotation column

export default (d) => {
  d.step('A new point: red or blue?');
  d.group(() => {
    d.line(OX, OY, OX + S * 10, OY, { pen: 'muted', ...neat });
    d.line(OX, OY, OX, OY - S * 10, { pen: 'muted', ...neat });
  });
  d.group(() => {
    for (const [u, v] of BLUE) mark(d, ...P(u, v), 'blue');
    for (const [u, v] of RED) mark(d, ...P(u, v), 'red');
  });
  mark(d, ...P(...Q), 'orange', 13);
  d.text(RX, 40, '13 labelled points and a\nnew point Q (orange)', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('k = 3: the nearest three vote');
  d.circle(...P(...Q), 2 * S * 1.55, { pen: 'green', thick: true, ...neat });
  d.text(RX, 96, 'k = 3: 2 red, 1 blue\n→ predict red', { pen: 'green', size: 16, anchor: 'start' });

  d.step('k decides: 1 overfits, 13 underfits');
  d.circle(...P(...Q), 2 * S * 1.0, { pen: 'orange', dashed: true, ...neat });
  d.text(RX, 160, 'k = 1: blue (one point,\nmaybe noise, decides)\nk = 13: blue, 7 vs 6\n(the majority wins)', {
    pen: 'orange',
    size: 14,
    anchor: 'start',
  });

  d.step('Distance: metric and scale');
  d.text(20, 296, 'distance from A to B', { pen: 'muted', size: 14, anchor: 'start' });
  d.group(() => {
    const A = [40, 396];
    const B = [100, 316]; // 60 across, 80 up: a 3-4-5 triangle
    d.line(...A, ...B, { pen: 'green', thick: true, ...neat });
    d.poly([A, [B[0], A[1]], B], { pen: 'orange', thick: true, dashed: true, ...neat });
    mark(d, ...A, 'ink', 8);
    mark(d, ...B, 'ink', 8);
    d.text(A[0] - 8, A[1] - 10, 'A', { pen: 'ink', size: 14, anchor: 'end' });
    d.text(B[0] - 8, B[1] - 4, 'B', { pen: 'ink', size: 14, anchor: 'end' });
  });
  d.text(122, 330, 'Euclidean √(3² + 4²) = 5', { pen: 'green', size: 14, anchor: 'start' });
  d.text(122, 356, 'Manhattan 3 + 4 = 7', { pen: 'orange', size: 14, anchor: 'start' });
  d.text(122, 384, 'scale features first!', { pen: 'red', size: 14, anchor: 'start', bold: true });

  d.step('High dimensions: all points are far');
  d.text(398, 304, 'farthest ÷ nearest distance\n(1,000 random points)', { pen: 'muted', size: 13 });
  for (const [i, [dim, ratio]] of [
    ['2', 73],
    ['10', 3.8],
    ['100', 1.4],
    ['1000', 1.1],
  ].entries()) {
    const y = 338 + i * 20;
    const w = Math.max(3, 60 * Math.log10(ratio));
    d.group(() => {
      d.text(352, y, `d=${dim}`, { pen: 'ink', size: 14, anchor: 'end', mono: true });
      d.rect(360, y - 6, w, 12, { pen: 'violet', fill: 'violet', ...neat });
      d.text(366 + w, y, `${ratio}×`, { pen: 'violet', size: 14, anchor: 'start', mono: true });
    });
  }

  d.step('Faster search: KD-trees and ANN');
  d.group(() => {
    d.line(...P(5.3, 0.2), ...P(5.3, 9.8), { pen: 'violet', dashed: true, ...neat });
    d.line(...P(0.2, 4.75), ...P(5.3, 4.75), { pen: 'violet', dashed: true, ...neat });
    d.line(...P(5.3, 5.4), ...P(9.8, 5.4), { pen: 'violet', dashed: true, ...neat });
  });
  d.text(RX, 236, 'KD-tree: cut space into\nboxes, search nearby ones', {
    pen: 'violet',
    size: 14,
    anchor: 'start',
  });
};
