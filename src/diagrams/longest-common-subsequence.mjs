export const meta = { title: 'Longest common subsequence of ABCBD and BDCAB: matching letters, the dp table, and walking back', width: 520, height: 420 };

const X = 'ABCBD'; // rows
const Y = 'BDCAB'; // columns
const DP = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1],
  [0, 1, 1, 1, 1, 2],
  [0, 1, 1, 2, 2, 2],
  [0, 1, 1, 2, 2, 3],
  [0, 1, 2, 2, 2, 3],
];
const TX = 56; // left edge of column j = 0
const CW = 40;
const TY = 150; // top of row i = 0
const RH = 32;
const cx = (j) => TX + j * CW + CW / 2;
const ry = (i) => TY + i * RH + RH / 2;
const NX = 308; // notes column
const g = { rough: 0.6, single: true };

const row = (d, i, pen = 'ink') =>
  d.group(() => DP[i].forEach((v, j) => (i > 0 && j === 0 ? null : d.text(cx(j), ry(i), String(v), { pen, mono: true, size: 16, bold: i > 0 }))));
const ring = (d, i, j, pen, o = {}) => d.rect(TX + j * CW + 4, TY + i * RH + 3, CW - 8, RH - 6, { pen, thick: true, ...g, ...o });

export default (d) => {
  d.step('Two strings, letters matched in order');
  d.group(() => {
    d.text(90, 34, 'X', { pen: 'muted', size: 17, bold: true, anchor: 'end' });
    d.text(90, 92, 'Y', { pen: 'muted', size: 17, bold: true, anchor: 'end' });
    [...X].forEach((ch, k) => d.rect(101 + k * CW, 20, 30, 28, { pen: 'ink', ...g, label: ch, size: 16, mono: true, bold: true }));
    [...Y].forEach((ch, k) => d.rect(101 + k * CW, 78, 30, 28, { pen: 'ink', ...g, label: ch, size: 16, mono: true, bold: true }));
  });
  d.group(() => {
    for (const [a, b] of [[1, 0], [2, 2], [3, 4]]) d.line(116 + a * CW, 50, 116 + b * CW, 76, { pen: 'green', thick: true, ...g });
  });
  d.text(NX, 62, 'BCB is in both, in\norder. Letters may be\nskipped; match lines\nnever cross', { pen: 'green', size: 15, anchor: 'start' });

  d.step('The table: prefixes of X against prefixes of Y');
  d.group(() => {
    for (let i = 0; i <= 6; i++) d.line(TX, TY + i * RH, TX + 6 * CW, TY + i * RH, { pen: 'muted', thin: true, ...g });
    for (let j = 0; j <= 6; j++) d.line(TX + j * CW, TY, TX + j * CW, TY + 6 * RH, { pen: 'muted', thin: true, ...g });
    [...Y].forEach((ch, k) => d.text(cx(k + 1), TY - 14, ch, { pen: 'blue', size: 17, mono: true, bold: true }));
    [...X].forEach((ch, k) => d.text(TX - 14, ry(k + 1), ch, { pen: 'blue', size: 17, mono: true, bold: true }));
    d.text(cx(0), TY - 14, '∅', { pen: 'muted', size: 15 });
    d.text(TX - 14, ry(0), '∅', { pen: 'muted', size: 15 });
  });
  d.group(() => {
    row(d, 0, 'muted');
    for (let i = 1; i <= 5; i++) d.text(cx(0), ry(i), '0', { pen: 'muted', mono: true, size: 16 });
  });
  d.text(NX, 178, 'dp[i][j] = LCS length\nof the first i letters\nof X and first j of Y.\nEmpty prefix → 0', { pen: 'ink', size: 15, anchor: 'start' });

  d.step('Letters match: diagonal + 1');
  row(d, 1);
  row(d, 2);
  d.group(() => {
    ring(d, 1, 4, 'green', { dashed: true, thick: false });
    ring(d, 2, 5, 'green');
    d.arrow(cx(4) + 10, ry(1) + 9, cx(5) - 10, ry(2) - 9, { pen: 'green', headSize: 7, ...g });
  });
  d.text(NX, 246, 'B = B: extend the LCS\nof both shorter prefixes:\ndiagonal 1 + 1 = 2', { pen: 'green', size: 15, anchor: 'start' });

  d.step('No match: the larger of up and left');
  row(d, 3);
  row(d, 4);
  row(d, 5);
  d.group(() => {
    ring(d, 4, 5, 'violet', { dashed: true, thick: false });
    ring(d, 5, 4, 'violet', { dashed: true, thick: false });
    ring(d, 5, 5, 'violet');
  });
  d.text(NX, 318, 'D ≠ B: drop the last\nletter of one string,\nkeep the better:\nmax(3, 2) = 3', { pen: 'violet', size: 15, anchor: 'start' });

  d.step('Walk back to read the LCS');
  d.group(() => {
    for (const [i, j] of [[5, 5], [3, 4], [2, 2], [1, 0]]) ring(d, i, j, 'orange', { dashed: true, thick: false });
    for (const [i, j] of [[4, 5], [3, 3], [2, 1]]) ring(d, i, j, 'orange', { fill: 'orange' });
  });
  d.group(() => {
    for (const [i, j] of [[4, 5], [3, 3], [2, 1]]) d.text(cx(j), ry(i), String(DP[i][j]), { pen: 'ink', mono: true, size: 16, bold: true });
  });
  d.text(16, 384, 'from the corner: on a match go diagonal and keep the letter,\nelse step to the larger neighbour → B, C, B → read back: BCB', { pen: 'orange', size: 15, anchor: 'start' });
};
