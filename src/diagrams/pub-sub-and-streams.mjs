export const meta = {
  title: 'Work queue vs pub/sub, and a partitioned log with consumer groups and offsets',
  width: 520,
  height: 420,
};

const CW = 30; // one log cell
const LX = 150; // log left edge
const ROWS = [
  { p: 'P0', y: 172, n: 7 },
  { p: 'P1', y: 232, n: 5 },
  { p: 'P2', y: 292, n: 6 },
];
const RH = 30;

export default (d) => {
  const box = (x, y, w, h, label, pen, size = 15) =>
    d.rect(x, y, w, h, { pen, fill: pen, label, size, bold: true, single: true });
  const row = ({ p, y, n }, pen) =>
    d.group(() => {
      d.text(LX - 10, y + RH / 2, p, { pen, size: 16, bold: true, anchor: 'end' });
      d.rect(LX, y, n * CW, RH, { pen, thick: true, single: true });
      for (let i = 1; i < n; i++)
        d.line(LX + i * CW, y + 3, LX + i * CW, y + RH - 3, { pen, thin: true, single: true });
      for (let i = 0; i < n; i++)
        d.text(LX + i * CW + CW / 2, y + RH / 2, String(i), { pen: 'muted', size: 15, mono: true });
    });

  d.step('Work queue vs pub/sub topic');
  d.group(() => {
    d.text(16, 22, 'work queue', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
    d.rect(16, 52, 76, 30, { pen: 'violet', thick: true, single: true });
    d.line(41, 55, 41, 79, { pen: 'violet', thin: true, single: true });
    d.line(66, 55, 66, 79, { pen: 'violet', thin: true, single: true });
    box(160, 36, 70, 26, 'W1', 'blue');
    box(160, 76, 70, 26, 'W2', 'muted');
    d.arrow(96, 62, 154, 50, { pen: 'blue', thick: true, label: 'm1', labelDy: -12 });
    d.text(16, 126, 'each message → ONE worker', { pen: 'blue', size: 15, anchor: 'start' });
  });
  d.line(258, 18, 258, 134, { pen: 'muted', dashed: true, thin: true });
  d.group(() => {
    d.text(276, 22, 'pub/sub topic', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
    box(276, 52, 64, 28, 'topic', 'violet');
    box(420, 24, 84, 24, 'email', 'green');
    box(420, 54, 84, 24, 'billing', 'green');
    box(420, 84, 84, 24, 'analytics', 'green');
    for (const y of [36, 66, 96]) d.arrow(344, 66, 414, y, { pen: 'green' });
    d.text(276, 126, 'each → EVERY subscriber', { pen: 'green', size: 15, anchor: 'start' });
  });

  d.step('A stream is an append-only log');
  row(ROWS[0], 'violet');
  d.group(() => {
    d.rect(LX + 7 * CW, ROWS[0].y, CW, RH, {
      pen: 'orange',
      fill: 'orange',
      dashed: true,
      label: '7',
      mono: true,
      size: 15,
      single: true,
    });
    d.text(LX + 7.5 * CW, ROWS[0].y - 14, 'append', { pen: 'orange', size: 15, bold: true });
    d.text(LX, ROWS[0].y - 14, 'offset = slot number', { pen: 'muted', size: 15, anchor: 'start' });
  });

  d.step('Partitions: the key picks one');
  row(ROWS[1], 'violet');
  row(ROWS[2], 'violet');
  d.group(() => {
    d.rect(14, 240, 76, 44, { pen: 'ink', fill: 'paper', label: 'producer', size: 15, single: true });
    for (const r of ROWS) d.arrow(94, 262, LX - 34, r.y + RH / 2, { pen: 'ink', thin: true });
  });
  d.group(() => {
    d.highlight(LX + 2 * CW + 2, ROWS[1].y + 4, 3 * CW - 4, RH - 8);
    d.text(54, 314, 'user:7\n→ always P1', { pen: 'orange', size: 15, bold: true });
  });

  d.step('Consumer group: one partition, one consumer');
  d.group(() => {
    d.rect(420, 166, 88, 162, { pen: 'blue', dashed: true, thin: true });
    d.text(464, 344, 'billing group', { pen: 'blue', size: 15, bold: true });
    box(434, 178, 60, 28, 'C1', 'blue', 16);
    box(434, 290, 60, 28, 'C2', 'blue', 16);
  });
  d.group(() => {
    d.arrow(LX + 8 * CW + 4, ROWS[0].y + RH / 2, 430, 190, { pen: 'blue' });
    d.arrow(LX + 5 * CW + 4, ROWS[1].y + RH / 2, 430, 200, { pen: 'blue' });
    d.arrow(LX + 6 * CW + 4, ROWS[2].y + RH / 2, 430, 304, { pen: 'blue' });
  });

  d.step('Offsets, retention and replay');
  d.group(() => {
    d.arrow(LX + 5 * CW + CW / 2, 354, LX + 5 * CW + CW / 2, ROWS[2].y + RH + 4, {
      pen: 'blue',
      thick: true,
    });
    d.text(LX + 5 * CW + CW / 2, 370, 'billing at 5', { pen: 'blue', size: 15 });
  });
  d.group(() => {
    d.arrow(LX + CW + CW / 2, 354, LX + CW + CW / 2, ROWS[2].y + RH + 4, { pen: 'violet', thick: true });
    d.text(LX + CW + CW / 2, 370, 'analytics at 1', { pen: 'violet', size: 15 });
  });
  d.text(260, 402, 'kept 7 days · rewind an offset to replay', { pen: 'red', size: 15, bold: true });
};
