export const meta = {
  title: 'Next greater element on [2, 1, 2, 4, 3] with a decreasing stack',
  width: 520,
  height: 384,
};

const A = [2, 1, 2, 4, 3];
const cx = (i) => 72 + i * 56;
const BASE = 172; // bar baseline
const U = 27; // px per unit of height
const BW = 40;
const top = (i) => BASE - A[i] * U;
const AY = 214; // answer row (top)
const SB = 340; // stack snapshots: bottom
const SH = 24;
const LX = 334; // log column

const snap = (d, i, vals) =>
  d.group(() => {
    d.line(cx(i) - 24, SB + 3, cx(i) + 24, SB + 3, { pen: 'muted', rough: 0.5, single: true });
    vals.forEach((v, k) =>
      d.rect(cx(i) - 19, SB - (k + 1) * SH, 38, SH, {
        pen: 'blue',
        fill: 'blue',
        rough: 0.6,
        single: true,
        label: String(v),
        mono: true,
        size: 16,
        bold: true,
      }),
    );
    d.text(cx(i), SB + 18, `i=${i}`, { pen: 'muted', size: 14 });
  });

const ans = (d, i, v, pen) => d.text(cx(i), AY + 16, v, { pen, mono: true, size: 18, bold: true });

const log = (d, y, s, pen) => d.text(LX, y, s, { pen, size: 15, anchor: 'start' });

export default (d) => {
  d.step('For each bar, find the first taller bar to its right');
  d.group(() => {
    d.line(40, BASE, 320, BASE, { pen: 'muted', rough: 0.5, single: true });
    A.forEach((v, i) => {
      d.rect(cx(i) - BW / 2, top(i), BW, v * U, { pen: 'ink', fill: 'muted', rough: 0.6, single: true });
      d.text(cx(i), top(i) - 12, String(v), { pen: 'ink', mono: true, size: 17, bold: true });
    });
  });
  d.group(() => {
    A.forEach((_, i) => d.rect(cx(i) - 19, AY, 38, 32, { pen: 'muted', rough: 0.6, single: true }));
    d.text(42, AY + 16, 'ans', { pen: 'muted', size: 15, anchor: 'end' });
  });
  d.text(LX, 40, 'next greater element:\nfirst bigger value\nto the right, else −1', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
  d.text(44, 268, 'stack after each step', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Values going down just wait on the stack');
  snap(d, 0, [2]);
  snap(d, 1, [2, 1]);
  log(d, 106, '2, then 1: no bigger\nvalue yet → push', 'blue');

  d.step('A bigger value pops the waiters it beats');
  d.arrow(cx(1) + 4, top(1) - 22, cx(2) - 6, top(2) - 22, { pen: 'green', bend: -14, thick: true });
  ans(d, 1, '2', 'green');
  snap(d, 2, [2, 2]);
  log(d, 156, '2 > 1: pop 1 → ans 2\n2 > 2? no → push 2', 'green');

  d.step('One big value can pop several');
  d.group(() => {
    d.arrow(cx(2) + 4, top(2) - 24, cx(3) - 22, top(3) + 14, { pen: 'green', bend: -8, thick: true });
    d.arrow(cx(0), top(0) - 24, cx(3) - 22, top(3) + 2, { pen: 'green', bend: -34, thick: true });
  });
  d.group(() => {
    ans(d, 0, '4', 'green');
    ans(d, 2, '4', 'green');
  });
  snap(d, 3, [4]);
  log(d, 206, '4 pops both 2s:\ntheir answers are 4', 'green');

  d.step('Leftovers get −1, and the whole pass is O(n)');
  snap(d, 4, [4, 3]);
  d.group(() => {
    ans(d, 3, '−1', 'red');
    ans(d, 4, '−1', 'red');
  });
  log(d, 256, 'end: 4 and 3 are\nnever beaten → −1', 'red');
  d.text(LX, 318, 'each index pushed\nonce, popped at\nmost once → O(n)', {
    pen: 'violet',
    size: 16,
    bold: true,
    anchor: 'start',
  });
};
