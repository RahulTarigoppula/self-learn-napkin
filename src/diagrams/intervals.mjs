export const meta = {
  title: 'Intervals on a timeline: overlap test, merging, and counting meeting rooms with a sweep',
  width: 520,
  height: 420,
};

const X0 = 30;
const U = 26; // units per hour
const x = (t) => X0 + t * U;
const IV = [
  [1, 3],
  [2, 6],
  [8, 10],
  [15, 18],
];
const ROW = (k) => 26 + k * 28; // top of row k
const BH = 18;
const AXY = 146; // axis
const MY = 196; // merged row
const BASE = 330; // sweep plot baseline
const STEP = 30;

const bar = (d, s, e, y, pen, o = {}) =>
  d.rect(x(s), y, x(e) - x(s), BH, {
    pen,
    fill: pen,
    rough: 0.6,
    label: `${s}–${e}`,
    size: 14,
    bold: true,
    ...o,
  });

export default (d) => {
  d.step('Intervals sorted by start');
  d.group(() => {
    IV.forEach(([s, e], k) => bar(d, s, e, ROW(k), 'blue', k === 0 ? { label: undefined } : {}));
    d.text(x(1) - 6, ROW(0) + BH / 2, '1–3', { pen: 'blue', size: 14, bold: true, anchor: 'end' });
  });
  d.group(() => {
    d.line(x(0), AXY, x(18) + 4, AXY, { pen: 'muted', rough: 0.4 });
    for (let t = 0; t <= 18; t += 2) {
      d.line(x(t), AXY - 4, x(t), AXY + 4, { pen: 'muted', thin: true, rough: 0.3 });
      d.text(x(t), AXY + 14, String(t), { pen: 'muted', size: 14 });
    }
  });

  d.step('Overlap test');
  d.rect(x(2), ROW(0) - 4, x(3) - x(2), ROW(1) + BH + 4 - (ROW(0) - 4), {
    pen: 'red',
    fill: 'red',
    fillStyle: 'hachure',
    thin: true,
    rough: 0.5,
    gap: 4,
  });
  d.group(() => {
    d.text(x(7), ROW(0) + 6, 'overlap if a.s < b.e and b.s < a.e', { pen: 'red', size: 15, anchor: 'start' });
    d.text(x(7), ROW(1) + 12, '1 < 6 and 2 < 3 ✓', { pen: 'red', size: 15, bold: true, anchor: 'start' });
  });

  d.step('Merge: extend while they overlap');
  d.text(X0, MY - 14, 'merged', { pen: 'green', size: 15, bold: true, anchor: 'start' });
  d.group(() =>
    [
      [1, 6],
      [8, 10],
      [15, 18],
    ].forEach(([s, e]) => bar(d, s, e, MY, 'green', { thick: true })),
  );
  d.text(x(11), MY - 14, '2 ≤ 3, so [1,3] grows to [1,6]', { pen: 'green', size: 14, anchor: 'start' });

  d.step('Meeting rooms: sweep and count');
  d.text(X0, 244, 'rooms in use: +1 at a start, −1 at an end', { pen: 'violet', size: 15, anchor: 'start' });
  d.group(() => {
    d.line(x(0), BASE, x(18) + 4, BASE, { pen: 'muted', rough: 0.4 });
    for (const n of [1, 2]) d.text(18, BASE - n * STEP, String(n), { pen: 'muted', size: 14 });
  });
  const ev = [
    [1, 1],
    [2, 2],
    [3, 1],
    [6, 0],
    [8, 1],
    [10, 0],
    [15, 1],
    [18, 0],
  ];
  const pts = [[x(0), BASE]];
  let level = 0;
  for (const [t, n] of ev) {
    pts.push([x(t), BASE - level * STEP], [x(t), BASE - n * STEP]);
    level = n;
  }
  d.poly(pts, { pen: 'violet', thick: true, rough: 0.4 });

  d.step('The peak is the answer');
  d.dot((x(2) + x(3)) / 2, BASE - 2 * STEP, 10, { pen: 'red' });
  d.text(x(3) + 12, BASE - 2 * STEP, 'peak = 2 → 2 rooms', {
    pen: 'red',
    size: 16,
    bold: true,
    anchor: 'start',
  });
  d.text(X0, 366, 'or: sort by start, keep a min-heap of end times;', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
  d.text(X0, 388, 'reuse a room when the earliest end ≤ the next start', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
};
