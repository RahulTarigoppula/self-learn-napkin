export const meta = {
  title: 'Two pointers: pair sum from both ends, and removing duplicates with read/write pointers',
  width: 520,
  height: 420,
};

const CW = 44;
const X0 = 20;
const cx = (i) => X0 + i * CW + CW / 2;
const LX = 346; // right-hand column

// top: opposite ends
const A = [1, 3, 4, 6, 9, 11, 14];
const AY = 74;
const AH = 40;

// bottom: same direction
const B = [1, 1, 2, 2, 2, 3, 5];
const BY = 226; // before row
const CY = 322; // after row
const BH = 38;

const cell = (d, i, y, h, v, o = {}) =>
  d.rect(X0 + i * CW, y, CW, h, {
    pen: 'ink',
    rough: 0.6,
    single: true,
    label: String(v),
    size: 19,
    bold: true,
    ...o,
  });
// A ruled-out cell: a muted wash over the cell, with its value re-lettered in muted ink on top.
const gone = (d, i, y, h, v) =>
  d.group(() => {
    d.rect(X0 + i * CW + 3, y + 3, CW - 6, h - 6, { pen: 'muted', fill: 'muted', thin: true, rough: 0.6, single: true });
    d.text(cx(i), y + h / 2, String(v), { pen: 'muted', size: 19, bold: true });
  });

const logLine = (d, k, sum, act, pen) =>
  d.group(() => {
    d.text(LX, 44 + k * 22, sum, { pen, size: 16, anchor: 'start' });
    d.text(505, 44 + k * 22, act, { pen, size: 16, bold: true, anchor: 'end' });
  });

export default (d) => {
  d.step('Sorted array, one pointer at each end');
  d.text(X0, 20, 'opposite ends: find a pair with sum 13', { pen: 'ink', size: 17, anchor: 'start' });
  d.group(() => {
    A.forEach((v, i) => cell(d, i, AY, AH, v));
    A.forEach((_, i) => d.text(cx(i), AY + AH + 12, String(i), { pen: 'muted', size: 14 }));
  });
  d.group(() => {
    d.text(cx(0), 44, 'L', { pen: 'violet', size: 17, bold: true });
    d.arrow(cx(0), 54, cx(0), AY - 4, { pen: 'violet', thick: true });
    d.text(cx(6), 44, 'R', { pen: 'blue', size: 17, bold: true });
    d.arrow(cx(6), 54, cx(6), AY - 4, { pen: 'blue', thick: true });
  });

  d.step('Too big: R steps left. Too small: L steps right');
  logLine(d, 0, '1 + 14 = 15', 'R ←', 'red');
  gone(d, 6, AY, AH, A[6]);
  logLine(d, 1, '1 + 11 = 12', 'L →', 'orange');
  gone(d, 0, AY, AH, A[0]);

  d.step('Each check rules out one value: O(n)');
  logLine(d, 2, '3 + 11 = 14', 'R ←', 'red');
  gone(d, 5, AY, AH, A[5]);
  logLine(d, 3, '3 + 9 = 12', 'L →', 'orange');
  gone(d, 1, AY, AH, A[1]);
  d.group(() => {
    for (const [i, t] of [
      [2, 'L'],
      [4, 'R'],
    ]) {
      d.arrow(cx(i), 162, cx(i), 140, { pen: 'green', thick: true });
      d.text(cx(i), 174, t, { pen: 'green', size: 17, bold: true });
    }
  });
  d.text(LX, 140, '4 + 9 = 13 ✓', { pen: 'green', size: 18, bold: true, anchor: 'start' });
  d.text(LX, 166, '5 checks, not 21 pairs', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Same direction: R reads every cell');
  d.line(X0, 194, 500, 194, { pen: 'muted', dashed: true, thin: true });
  d.group(() => {
    d.text(X0 + 4, 208, 'R reads every cell', { pen: 'blue', size: 15, anchor: 'start' });
    d.arrow(170, 208, 320, 208, { pen: 'blue', thick: true });
  });
  d.group(() => B.forEach((v, i) => cell(d, i, BY, BH, v)));
  d.text(LX, 236, 'remove duplicates', { pen: 'ink', size: 17, bold: true, anchor: 'start' });
  d.text(LX, 276, 'keep a[R] only if it\ndiffers from the\nlast value kept', {
    pen: 'blue',
    size: 15,
    anchor: 'start',
  });
  for (const i of [1, 3, 4]) gone(d, i, BY, BH, B[i]);

  d.step('W writes kept values to the front');
  d.group(() => {
    [1, 2, 3, 5, 2, 3, 5].forEach((v, i) =>
      i < 4
        ? cell(d, i, CY, BH, v, { pen: 'green', fill: 'green', textPen: 'green' })
        : cell(d, i, CY, BH, v, { pen: 'muted', textPen: 'muted' }),
    );
    B.forEach((_, i) => d.text(cx(i), CY + BH + 12, String(i), { pen: 'muted', size: 14 }));
  });
  d.group(() => {
    for (const [from, to] of [
      [2, 1],
      [5, 2],
      [6, 3],
    ])
      d.arrow(cx(from) - 4, BY + BH + 4, cx(to) + 6, CY - 4, { pen: 'orange', bend: 6, rough: 0.6 });
  });
  d.group(() => {
    d.arrow(cx(4), 404, cx(4), CY + BH + 22, { pen: 'orange', thick: true });
    d.text(cx(4) + 14, 398, 'W = 4 = new length', { pen: 'orange', size: 16, bold: true, anchor: 'start' });
  });
  d.text(LX, 342, 'one pass, O(1) extra', { pen: 'green', size: 15, anchor: 'start' });
};
