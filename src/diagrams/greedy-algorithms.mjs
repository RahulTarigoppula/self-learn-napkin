export const meta = { title: 'Greedy interval scheduling by earliest finish time, and a coin-change counter-example', width: 520, height: 420 };

// meetings, already sorted by finish time
const M = [
  ['A', 1, 4],
  ['B', 3, 5],
  ['C', 0, 6],
  ['D', 5, 7],
  ['E', 3, 9],
  ['F', 6, 10],
  ['G', 8, 11],
];
const X0 = 70; // x of time 0
const U = 34; // px per hour
const Y0 = 40; // first row centre
const RH = 26;
const tx = (t) => X0 + t * U;
const ry = (i) => Y0 + i * RH;

function bar(d, i, o) {
  const [, s, e] = M[i];
  d.rect(tx(s), ry(i) - 9, (e - s) * U, 18, { rough: 0.6, single: true, ...o });
}
const mark = (d, i, ok) => d.text(500, ry(i), ok ? '✓' : '✗', { pen: ok ? 'green' : 'muted', size: 16, bold: true });

function coin(d, x, y, v, pen) {
  d.circle(x, y, 30, { pen, fill: pen, label: String(v), mono: true, size: 15, bold: true, single: true });
}

export default (d) => {
  d.step('One room: fit in as many meetings as possible');
  d.group(() => {
    M.forEach(([id], i) => {
      d.text(36, ry(i), id, { pen: 'ink', size: 16, bold: true });
      bar(d, i, { pen: 'blue', fill: 'blue' });
    });
  });
  d.group(() => {
    d.line(tx(0), 230, tx(12), 230, { pen: 'muted', single: true, rough: 0.5 });
    for (let t = 0; t <= 12; t += 2) d.text(tx(t), 246, String(t), { pen: 'muted', mono: true, size: 14 });
    d.text(20, 246, 'hour', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('Take the meeting that ends first: A');
  bar(d, 0, { pen: 'green', fill: 'green', thick: true });
  d.line(tx(4), 26, tx(4), 222, { pen: 'orange', dashed: true, single: true });
  d.group(() => {
    mark(d, 0, true);
    mark(d, 1, false);
    mark(d, 2, false);
  });

  d.step('Next one starting at or after 4: D');
  bar(d, 3, { pen: 'green', fill: 'green', thick: true });
  d.line(tx(7), 26, tx(7), 222, { pen: 'orange', dashed: true, single: true });
  d.group(() => {
    mark(d, 3, true);
    mark(d, 4, false);
    mark(d, 5, false);
  });

  d.step('Then G: 3 meetings, the maximum');
  bar(d, 6, { pen: 'green', fill: 'green', thick: true });
  mark(d, 6, true);
  d.text(20, 276, 'earliest finish → A, D, G = 3 meetings', { pen: 'green', size: 16, bold: true, anchor: 'start' });

  d.step('Exchange argument: swapping in A is safe');
  d.group(() => {
    d.rect(tx(3) - 3, ry(1) - 12, 2 * U + 6, 24, { pen: 'violet', rough: 0.6, single: true, dashed: true });
    d.arrow(tx(3) - 8, ry(1) + 2, tx(1) + 4, ry(0) + 12, { pen: 'violet', bend: -12, headSize: 8 });
  });
  d.text(20, 302, 'any best plan (B, D, G) → swap B for A, still no clash', { pen: 'violet', size: 15, anchor: 'start' });

  d.step('But greedy can fail: coins {1, 3, 4}, make 6');
  d.group(() => {
    d.text(20, 338, 'largest coin first:', { pen: 'red', size: 15, anchor: 'start' });
    coin(d, 200, 338, 4, 'red');
    coin(d, 240, 338, 1, 'red');
    coin(d, 280, 338, 1, 'red');
    d.text(312, 338, '3 coins ✗', { pen: 'red', size: 16, bold: true, anchor: 'start' });
  });
  d.group(() => {
    d.text(20, 382, 'best:', { pen: 'green', size: 15, anchor: 'start' });
    coin(d, 200, 382, 3, 'green');
    coin(d, 240, 382, 3, 'green');
    d.text(312, 382, '2 coins ✓', { pen: 'green', size: 16, bold: true, anchor: 'start' });
  });
};
