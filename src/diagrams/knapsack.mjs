export const meta = {
  title: '0/1 knapsack: the dp table filled row by row, take or skip, walking back, and the one-row version',
  width: 520,
  height: 420,
};

// items in row order: name, weight, value; capacity 5
const ITEMS = [
  ['A', 1, 1],
  ['B', 3, 4],
  ['C', 4, 5],
  ['D', 2, 3],
];
const DP = [
  [0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1],
  [0, 1, 1, 4, 5, 5],
  [0, 1, 1, 4, 5, 6],
  [0, 1, 3, 4, 5, 7],
];
const TX = 100; // left edge of column c = 0
const CW = 40;
const TY = 108; // top of row i = 0
const RH = 28;
const cx = (c) => TX + c * CW + CW / 2;
const ry = (i) => TY + i * RH + RH / 2;
const NX = 352; // notes column

const g = { rough: 0.6, single: true };
const row = (d, i, pen = 'ink') =>
  d.group(() =>
    DP[i].forEach((v, c) =>
      d.text(cx(c), ry(i), String(v), { pen, mono: true, size: 16, bold: i > 0 && c > 0 }),
    ),
  );
const ring = (d, i, c, pen, o = {}) =>
  d.rect(TX + c * CW + 3, TY + i * RH + 2, CW - 6, RH - 4, { pen, thick: true, ...g, ...o });

export default (d) => {
  d.step('Four items, a 5 kg bag');
  d.group(() => {
    ITEMS.forEach(([n, w, v], k) =>
      d.rect(16 + k * 84, 16, 76, 44, {
        pen: 'blue',
        fill: 'blue',
        ...g,
        label: `${n}: ${w} kg\n$${v}`,
        size: 15,
        textPen: 'ink',
      }),
    );
  });
  d.rect(360, 16, 148, 44, {
    pen: 'orange',
    thick: true,
    ...g,
    label: 'bag holds 5 kg\nmaximise $',
    size: 15,
    textPen: 'ink',
  });

  d.step('The table: one row per item');
  d.group(() => {
    for (let i = 0; i <= 5; i++)
      d.line(TX, TY + i * RH, TX + 6 * CW, TY + i * RH, { pen: 'muted', thin: true, ...g });
    for (let c = 0; c <= 6; c++)
      d.line(TX + c * CW, TY, TX + c * CW, TY + 5 * RH, { pen: 'muted', thin: true, ...g });
    for (let c = 0; c <= 5; c++) d.text(cx(c), TY - 12, String(c), { pen: 'muted', size: 15 });
    d.text(TX - 8, TY - 12, 'capacity', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(TX - 8, ry(0), 'none', { pen: 'muted', size: 14, anchor: 'end' });
    ITEMS.forEach(([n, w, v], k) =>
      d.text(TX - 8, ry(k + 1), `+${n} ${w}kg $${v}`, { pen: 'blue', size: 14, anchor: 'end' }),
    );
  });
  row(d, 0, 'muted');
  row(d, 1);
  d.text(16, 272, 'dp[i][c] = best $ from the first i items, capacity c', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });

  d.step('Each cell: take or skip');
  row(d, 2);
  d.group(() => {
    ring(d, 2, 4, 'red');
    ring(d, 1, 4, 'blue');
    ring(d, 1, 1, 'green');
  });
  d.text(NX, 206, 'B at c = 4:\nskip → 1\ntake → 1 + $4 = 5', { pen: 'red', size: 15, anchor: 'start' });
  d.group(() => {
    const m = { size: 15, mono: true, anchor: 'start' };
    d.text(16, 298, 'dp[i][c] = max(', { pen: 'ink', ...m });
    d.text(151, 298, 'dp[i−1][c]', { pen: 'blue', bold: true, ...m });
    d.text(241, 298, ',', { pen: 'ink', ...m });
    d.text(259, 298, 'dp[i−1][c−w] + v', { pen: 'green', bold: true, ...m });
    d.text(403, 298, ')', { pen: 'ink', ...m });
    d.text(196, 318, 'skip', { pen: 'blue', size: 14 });
    d.text(331, 318, 'take (if w ≤ c)', { pen: 'green', size: 14 });
  });

  d.step('Fill the rest: the answer is 7');
  row(d, 3);
  row(d, 4);
  d.group(() => {
    ring(d, 4, 5, 'green');
    d.text(NX + 6, 252, 'best = $7', { pen: 'green', size: 17, bold: true, anchor: 'start' });
  });

  d.step('Walk back to find the items');
  d.group(() => {
    ring(d, 3, 5, 'orange', { dashed: true, thick: false });
    ring(d, 1, 3, 'orange', { dashed: true, thick: false });
    ring(d, 3, 3, 'orange');
    ring(d, 2, 3, 'orange');
    ring(d, 1, 0, 'orange');
  });
  d.text(NX, 134, '7 ≠ 6: took D\n4 = 4: skipped C\n4 ≠ 1: took B\n→ {B, D} = $7', {
    pen: 'orange',
    size: 15,
    anchor: 'start',
    bold: true,
  });

  d.step('One row, updated right to left');
  d.group(() => {
    d.text(TX - 8, 372, 'dp[c]', { pen: 'violet', size: 15, anchor: 'end' });
    DP[3].forEach((v, c) =>
      d.rect(TX + c * CW, 358, CW, 28, {
        pen: 'violet',
        ...g,
        label: String(v),
        size: 16,
        mono: true,
        textPen: 'ink',
      }),
    );
    for (let c = 0; c <= 5; c++) d.text(cx(c), 398, String(c), { pen: 'muted', size: 14 });
  });
  d.arrow(cx(3), 355, cx(5) - 4, 355, {
    pen: 'violet',
    bend: -14,
    label: '4 + 3 → 7',
    labelDy: -21,
    size: 15,
    thick: true,
  });
  d.text(NX, 376, 'item D, c = 5 → 2:\nread dp[c−2] before\nit is overwritten', {
    pen: 'violet',
    size: 15,
    anchor: 'start',
  });
};
