export const meta = {
  title:
    'k-means on six points: two random starts, assign to the nearest centroid, move centroids to the means, repeat until stable while inertia falls, the elbow for choosing k, and failure on rings',
  width: 520,
  height: 420,
};

// Six points, k = 2, starting centroids on (1,1) and (3,1). Checked with numpy / scikit-learn:
// inertia 131 (assign) → 36.75 (update) → 18.69 (assign) → 9.33 (update), then nothing changes.
const OX = 36;
const OY = 268;
const S = 27;
const P = (u, v) => [OX + S * u, OY - S * v];
const LEFT = [
  [1, 1],
  [3, 1],
  [1, 3],
];
const RIGHT = [
  [6, 5],
  [8, 6],
  [7, 7],
];

/** A small filled hexagon: reads as a dot but costs half the bytes of d.dot. */
const mark = (d, x, y, pen, dia = 11) =>
  d.poly(
    Array.from({ length: 6 }, (_, i) => [
      x + (dia / 2) * Math.cos((i * Math.PI) / 3),
      y + (dia / 2) * Math.sin((i * Math.PI) / 3),
    ]),
    { pen, fill: pen, closed: true, rough: 0.3, single: true },
  );
/** Centroid: a bold × */
const cross = (d, x, y, pen) =>
  d.group(() => {
    d.line(x - 8, y - 8, x + 8, y + 8, { pen, thick: true, rough: 0.3, single: true });
    d.line(x - 8, y + 8, x + 8, y - 8, { pen, thick: true, rough: 0.3, single: true });
  });
const neat = { rough: 0.5, single: true };

// Inertia-per-step chart (top right)
const IX = (i) => 330 + 50 * i;
const IY = (v) => 128 - 0.68 * v;
// Elbow chart (middle right)
const EX = (k) => 330 + 38 * (k - 1);
const EY = (v) => 262 - 1.05 * v;

export default (d) => {
  d.step('Six points, two random starts');
  d.group(() => {
    d.line(OX, OY, OX + S * 9, OY, { pen: 'muted', ...neat });
    d.line(OX, OY, OX, OY - S * 8, { pen: 'muted', ...neat });
  });
  d.group(() => {
    for (const [u, v] of [...LEFT, ...RIGHT]) mark(d, ...P(u, v), 'muted');
  });
  cross(d, ...P(1, 1), 'blue');
  cross(d, ...P(3, 1), 'red');
  d.text(OX + 4, 22, 'k = 2: two random starts', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Assign: each point to its nearest ×');
  d.group(() => {
    for (const [u, v] of RIGHT) d.line(...P(u, v), ...P(3, 1), { pen: 'red', thin: true, dashed: true, ...neat });
    d.line(...P(1, 3), ...P(1, 1), { pen: 'blue', thin: true, dashed: true, ...neat });
  });
  d.group(() => {
    for (const [u, v] of LEFT) mark(d, ...P(u, v), u === 1 ? 'blue' : 'red');
    for (const [u, v] of RIGHT) mark(d, ...P(u, v), 'red');
  });

  d.step('Update: move each × to its mean');
  d.group(() => {
    d.arrow(...P(0.75, 1.2), ...P(0.75, 1.85), { pen: 'blue', headSize: 7, ...neat });
    cross(d, ...P(1, 2), 'blue');
  });
  d.group(() => {
    d.arrow(...P(3.3, 1.3), ...P(5.6, 4.3), { pen: 'red', headSize: 9, ...neat });
    cross(d, ...P(6, 4.75), 'red');
  });
  d.group(() => {
    d.line(IX(0) - 10, IY(0), IX(3) + 14, IY(0), { pen: 'muted', ...neat });
    d.text(IX(0) - 10, 20, 'inertia after each step', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.group(() => {
    d.poly(
      [
        [IX(0), IY(131)],
        [IX(1), IY(36.75)],
      ],
      { pen: 'ink', ...neat },
    );
    mark(d, IX(0), IY(131), 'ink', 8);
    mark(d, IX(1), IY(36.75), 'ink', 8);
    d.text(IX(0) + 10, IY(131) + 2, '131', { pen: 'ink', size: 14, anchor: 'start', mono: true });
    d.text(IX(1) + 8, IY(36.75) - 12, '36.8', { pen: 'ink', size: 14, anchor: 'start', mono: true });
  });

  d.step('Repeat until nothing changes');
  d.group(() => {
    mark(d, ...P(3, 1), 'blue');
    d.circle(...P(3, 1), 24, { pen: 'blue', ...neat });
  });
  d.group(() => {
    d.arrow(...P(1.25, 1.95), ...P(1.55, 1.75), { pen: 'blue', headSize: 7, ...neat });
    cross(d, ...P(5 / 3, 5 / 3), 'blue');
    d.arrow(...P(6.3, 5.0), ...P(6.8, 5.7), { pen: 'red', headSize: 7, ...neat });
    cross(d, ...P(7, 6), 'red');
  });
  d.group(() => {
    d.poly(
      [
        [IX(1), IY(36.75)],
        [IX(2), IY(18.69)],
        [IX(3), IY(9.33)],
      ],
      { pen: 'green', ...neat },
    );
    mark(d, IX(2), IY(18.69), 'green', 8);
    mark(d, IX(3), IY(9.33), 'green', 8);
    d.text(IX(2), IY(18.69) - 14, '18.7', { pen: 'green', size: 14, mono: true });
    d.text(IX(3), IY(9.33) - 14, '9.3', { pen: 'green', size: 14, mono: true });
  });
  d.text(OX + 4, 42, 'no point moves → stop', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Choosing k: elbow and silhouette');
  d.group(() => {
    d.line(EX(1) - 10, EY(0), EX(5) + 10, EY(0), { pen: 'muted', ...neat });
    for (const k of [1, 2, 3, 4, 5]) d.text(EX(k), EY(0) + 14, String(k), { pen: 'muted', size: 14, mono: true });
    d.text(EX(5) + 16, EY(0) + 14, 'k', { pen: 'muted', size: 14, anchor: 'start' });
    d.text(EX(1) - 10, 158, 'best inertia for each k', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.group(() => {
    const pts = [80.2, 9.33, 6.0, 3.0, 1.0].map((v, i) => [EX(i + 1), EY(v)]);
    d.poly(pts, { pen: 'violet', ...neat });
    for (const [x, y] of pts) mark(d, x, y, 'violet', 7);
    d.circle(EX(2), EY(9.33), 22, { pen: 'orange', thick: true, ...neat });
    d.text(EX(1) + 10, EY(80.2), '80.2', { pen: 'violet', size: 14, mono: true, anchor: 'start' });
    d.text(EX(2) + 14, EY(9.33) - 22, 'elbow at k = 2', { pen: 'orange', size: 15, anchor: 'start' });
  });
  d.text(320, 300, 'silhouette: 0.69 at k = 2,\n0.39 at k = 3', { pen: 'violet', size: 14, anchor: 'start' });

  d.step('Failure modes and k-means++');
  d.group(() => {
    d.circle(76, 362, 84, { pen: 'blue', ...neat });
    d.circle(76, 362, 34, { pen: 'blue', ...neat });
    d.line(76, 314, 76, 408, { pen: 'red', thick: true, dashed: true, ...neat });
    d.text(132, 340, 'rings: k-means cuts\nstraight, not around', { pen: 'red', size: 14, anchor: 'start' });
  });
  d.text(132, 388, 'k-means++: pick each new\nstart far away (prob ∝ D²)', {
    pen: 'green',
    size: 14,
    anchor: 'start',
  });
};
