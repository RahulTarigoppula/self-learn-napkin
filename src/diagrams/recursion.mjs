export const meta = {
  title: 'factorial(4) on the call stack, and the call tree of fib(4)',
  width: 520,
  height: 420,
};

const FX = 44; // stack frames: left edge
const FW = 190;
const FH = 38;
const fy = (n) => 366 - (4 - n) * 46; // top of the frame for fact(n): fact(4) at the bottom
const fc = (n) => fy(n) + FH / 2; // its vertical centre

const frame = (d, n, label, pen, fill) =>
  d.rect(FX, fy(n), FW, FH, { pen, fill, rough: 0.7, single: true, label, size: 17, bold: n === 1 });

// fib(4) call tree, top right: [x, y, n, parentIndex]
const T = [
  [398, 132, 4, -1],
  [342, 166, 3, 0],
  [456, 166, 2, 0],
  [312, 200, 2, 1],
  [372, 200, 1, 1],
  [432, 200, 1, 2],
  [482, 200, 0, 2],
  [292, 234, 1, 3],
  [332, 234, 0, 3],
];
const ND = 26;

export default (d) => {
  d.step('A base case and a recursive case');
  d.group(() => {
    d.text(20, 26, 'def fact(n):', { size: 18, anchor: 'start' });
    d.text(44, 50, 'if n <= 1: return 1', { size: 18, anchor: 'start', pen: 'green' });
    d.text(44, 74, 'return n * fact(n - 1)', { size: 18, anchor: 'start', pen: 'blue' });
  });
  d.text(306, 50, '← base case: stop', { pen: 'green', size: 16, anchor: 'start' });
  d.text(306, 74, '← recursive case', { pen: 'blue', size: 16, anchor: 'start' });

  d.step('Every call pushes a frame');
  d.group(() => {
    d.arrow(24, fy(4) + FH, 24, fy(1), { pen: 'muted', thin: true });
    d.text(FX, fy(1) - 16, 'call stack grows upward', { pen: 'muted', size: 15, anchor: 'start' });
  });
  frame(d, 4, 'fact(4): 4 × ?', 'blue', 'blue');
  frame(d, 3, 'fact(3): 3 × ?', 'blue', 'blue');
  frame(d, 2, 'fact(2): 2 × ?', 'blue', 'blue');

  d.step('The base case stops the descent');
  frame(d, 1, 'fact(1) → 1', 'green', 'green');
  d.text(24, 150, 'no base case? frames pile up\nuntil RecursionError (~1000)', {
    pen: 'red',
    size: 16,
    anchor: 'start',
  });

  d.step('Unwinding: each frame finishes its multiply');
  for (const [n, txt] of [
    [2, '2 × 1 = 2'],
    [3, '3 × 2 = 6'],
    [4, '4 × 6 = 24 ✓'],
  ]) {
    d.group(() => {
      d.arrow(FX + FW + 4, fc(n - 1), FX + FW + 4, fc(n) - 4, { pen: 'orange', bend: -14, rough: 0.5 });
      d.text(268, fc(n), txt, { pen: n === 4 ? 'green' : 'orange', size: 18, bold: true, anchor: 'start' });
    });
  }

  d.step('Two calls per call: a recursion tree');
  d.text(398, 104, 'fib(4) call tree', { pen: 'violet', size: 16, bold: true });
  d.group(() => {
    for (const [x, y, , p] of T) {
      if (p < 0) continue;
      const [px, py] = T[p];
      const len = Math.hypot(x - px, y - py);
      const ux = (x - px) / len;
      const uy = (y - py) / len;
      d.line(px + (ux * ND) / 2, py + (uy * ND) / 2, x - (ux * ND) / 2, y - (uy * ND) / 2, {
        pen: 'muted',
        thin: true,
        rough: 0.6,
      });
    }
    T.forEach(([x, y, n]) => {
      const twice = n === 2;
      d.circle(x, y, ND, {
        pen: twice ? 'red' : 'violet',
        fill: twice ? 'red' : 'violet',
        rough: 0.6,
        single: true,
        label: String(n),
        size: 16,
        bold: twice,
      });
    });
  });
  d.text(498, 234, 'fib(2)\ntwice!', { pen: 'red', size: 15, anchor: 'end' });
};
