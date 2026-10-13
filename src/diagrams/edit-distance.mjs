export const meta = { title: 'Edit distance from kitten to sitting: base row and column, three neighbours, the filled table and the edit script', width: 520, height: 420 };

const X = 'kitten'; // rows
const Y = 'sitting'; // columns
const DP = [
  [0, 1, 2, 3, 4, 5, 6, 7],
  [1, 1, 2, 3, 4, 5, 6, 7],
  [2, 2, 1, 2, 3, 4, 5, 6],
  [3, 3, 2, 1, 2, 3, 4, 5],
  [4, 4, 3, 2, 1, 2, 3, 4],
  [5, 5, 4, 3, 2, 2, 3, 4],
  [6, 6, 5, 4, 3, 3, 2, 3],
];
const TX = 60; // left edge of column j = 0
const CW = 32;
const TY = 118; // top of row i = 0
const RH = 28;
const cx = (j) => TX + j * CW + CW / 2;
const ry = (i) => TY + i * RH + RH / 2;
const NX = 328; // notes column
const g = { rough: 0.6, single: true };

const num = (d, i, j, pen = 'ink', bold = true) => d.text(cx(j), ry(i), String(DP[i][j]), { pen, mono: true, size: 15, bold });
const row = (d, i) => d.group(() => { for (let j = 1; j <= 7; j++) num(d, i, j); });
const ring = (d, i, j, pen, o = {}) => d.rect(TX + j * CW + 3, TY + i * RH + 2, CW - 6, RH - 4, { pen, thick: true, ...g, ...o });

export default (d) => {
  d.step('kitten → sitting: three kinds of edit');
  d.text(16, 24, 'kitten → sitting: fewest edits?', { pen: 'ink', size: 18, bold: true, anchor: 'start' });
  d.group(() => {
    const ops = [['insert  +1', 'cat → cart', 'violet'], ['delete  +1', 'cart → cat', 'blue'], ['replace  +1', 'cat → cut', 'red']];
    ops.forEach(([a, b, pen], k) => d.rect(16 + k * 166, 42, 156, 44, { pen, ...g, label: `${a}\n${b}`, size: 15, textPen: 'ink' }));
  });

  d.step('Base row and column');
  d.group(() => {
    for (let i = 0; i <= 7; i++) d.line(TX, TY + i * RH, TX + 8 * CW, TY + i * RH, { pen: 'muted', thin: true, ...g });
    for (let j = 0; j <= 8; j++) d.line(TX + j * CW, TY, TX + j * CW, TY + 7 * RH, { pen: 'muted', thin: true, ...g });
    [...Y].forEach((ch, k) => d.text(cx(k + 1), TY - 13, ch, { pen: 'ink', size: 16, mono: true, bold: true }));
    [...X].forEach((ch, k) => d.text(TX - 13, ry(k + 1), ch, { pen: 'ink', size: 16, mono: true, bold: true }));
    d.text(cx(0), TY - 13, '∅', { pen: 'muted', size: 15 });
    d.text(TX - 13, ry(0), '∅', { pen: 'muted', size: 15 });
  });
  d.group(() => {
    for (let j = 0; j <= 7; j++) num(d, 0, j, 'blue');
    for (let i = 1; i <= 6; i++) num(d, i, 0, 'blue');
  });
  d.text(NX, 146, '∅ → "sit": 3 inserts\n"kit" → ∅: 3 deletes\nrow 0 = j, col 0 = i', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Each cell: the cheapest of three neighbours');
  row(d, 1);
  row(d, 2);
  d.group(() => {
    ring(d, 0, 0, 'red', { thick: false, dashed: true });
    ring(d, 0, 1, 'blue', { thick: false, dashed: true });
    ring(d, 1, 0, 'violet', { thick: false, dashed: true });
    ring(d, 1, 1, 'ink');
  });
  d.group(() => {
    d.text(NX, 196, 'k ≠ s: take the min', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(NX, 218, 'diagonal 0+1 replace', { pen: 'red', size: 15, anchor: 'start' });
    d.text(NX, 238, 'up 1+1 delete', { pen: 'blue', size: 15, anchor: 'start' });
    d.text(NX, 258, 'left 1+1 insert', { pen: 'violet', size: 15, anchor: 'start' });
    d.text(NX, 278, 'same letter: diag +0', { pen: 'green', size: 15, anchor: 'start' });
  });

  d.step('Fill the table: distance 3');
  row(d, 3);
  row(d, 4);
  row(d, 5);
  row(d, 6);
  d.group(() => {
    ring(d, 6, 7, 'green');
    d.text(NX, 304, '= 3 edits', { pen: 'green', size: 17, bold: true, anchor: 'start' });
  });

  d.step('Walk back: the edit script');
  d.group(() => {
    for (const k of [2, 3, 4, 6]) ring(d, k, k, 'green', { thick: false, dashed: true });
    ring(d, 1, 1, 'red');
    ring(d, 5, 5, 'red');
    ring(d, 6, 7, 'violet');
  });
  d.group(() => {
    const ax = (k) => 34 + k * 24;
    [...'kitten '].forEach((ch, k) => d.text(ax(k), 346, ch, { pen: 'ink', size: 16, mono: true, bold: true }));
    [...Y].forEach((ch, k) => d.text(ax(k), 372, ch, { pen: 'ink', size: 16, mono: true, bold: true }));
    d.text(ax(6), 346, '–', { pen: 'muted', size: 16, mono: true });
    for (const k of [0, 4]) d.rect(ax(k) - 11, 333, 22, 52, { pen: 'red', thick: true, ...g });
    d.rect(ax(6) - 11, 333, 22, 52, { pen: 'violet', thick: true, ...g });
  });
  d.text(204, 359, 'replace k → s\nreplace e → i\ninsert g', { pen: 'ink', size: 15, anchor: 'start' });

  d.step('Only two rows are ever needed');
  d.rect(TX - 4, TY + 5 * RH - 3, 8 * CW + 8, 2 * RH + 6, { pen: 'orange', thick: true, dashed: true, ...g });
  d.text(NX, 362, 'a row reads only the\nrow above: keep two,\nO(n) space', { pen: 'orange', size: 15, anchor: 'start' });
};
