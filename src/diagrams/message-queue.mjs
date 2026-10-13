export const meta = {
  title: 'A producer, a message queue, two consumers and a dead-letter queue',
  width: 520,
  height: 396,
};

const QX = 168; // queue left edge
const QY = 160;
const SLOT = 40;
const QH = 46;
const C1 = { x: 422, y: 76 };
const C2 = { x: 422, y: 238 };
const CW = 80;
const CH = 52;

export default (d) => {
  const slotX = (i) => QX + SLOT * (4 - i); // i = 0 is the head (oldest, right end)
  const server = (x, y, name, pen = 'ink', fill = 'paper') =>
    d.group(() => {
      d.rect(x, y, CW, CH, { pen, fill });
      d.text(x + 26, y + CH / 2, name, { pen, size: 17, bold: true });
      for (const k of [16, 26, 36]) d.line(x + 50, y + k, x + 70, y + k, { pen, thin: true });
    });

  d.step('Producer, queue, consumers');
  server(16, 157, 'shop');
  d.text(56, 236, 'producer', { pen: 'muted', size: 15 });
  d.group(() => {
    d.rect(QX, QY, SLOT * 5, QH, { pen: 'violet', thick: true });
    for (let i = 1; i < 5; i++)
      d.line(QX + SLOT * i, QY + 4, QX + SLOT * i, QY + QH - 4, { pen: 'violet', thin: true });
    d.text(QX + SLOT * 2.5, QY - 22, 'orders queue', { pen: 'violet', size: 17, bold: true });
    d.text(QX + 8, QY + QH + 18, 'tail', { pen: 'muted', size: 14, anchor: 'start' });
    d.text(QX + SLOT * 5 - 8, QY + QH + 18, 'head', { pen: 'muted', size: 14, anchor: 'end' });
  });
  server(C1.x, C1.y, 'C1');
  server(C2.x, C2.y, 'C2');
  d.text(C1.x + CW / 2, 160 + 23, 'consumers', { pen: 'muted', size: 15 });

  d.step('A burst piles up in the queue');
  d.group(() => {
    d.arrow(106, 183, QX - 6, 183, { pen: 'orange', thick: true });
    d.text(122, 140, 'burst:\n1,000/s', { pen: 'orange', size: 15 });
  });
  d.group(() => {
    for (let i = 0; i < 5; i++)
      d.rect(slotX(i) + 5, QY + 9, SLOT - 10, QH - 18, {
        pen: 'orange',
        fill: 'orange',
        label: `m${i + 1}`,
        size: 15,
        rough: 0.6,
      });
  });

  d.step('Consume, then ack');
  d.arrow(QX + SLOT * 5 + 4, QY + 10, C1.x - 6, C1.y + CH / 2, {
    pen: 'blue',
    thick: true,
    label: 'm1',
    labelDx: -10,
  });
  d.text(C1.x + CW / 2, 40, 'done → ack', { pen: 'green', size: 16, bold: true });

  d.step('Crash before ack: delivered again');
  d.group(() => {
    d.rect(C1.x, C1.y, CW, CH, { pen: 'red', fill: 'red', fillStyle: 'hachure' });
    d.text(C1.x + CW / 2, C1.y + CH + 18, 'crash!', { pen: 'red', size: 16, bold: true });
  });
  d.arrow(QX + SLOT * 5 + 4, QY + QH - 10, C2.x - 6, C2.y + CH / 2, {
    pen: 'blue',
    thick: true,
    label: 'm2 again',
    labelDx: -34,
    labelDy: 22,
  });
  d.text(C2.x + CW / 2, 326, 'seen m2?\nthen skip', { pen: 'green', size: 16 });

  d.step('Poison message → dead-letter queue');
  d.arrow(slotX(2) + SLOT / 2, QY + QH + 6, slotX(2) + SLOT / 2, 302, { pen: 'red', thick: true });
  d.text(slotX(2) + SLOT / 2 - 10, 262, 'failed 3×', { pen: 'red', size: 15, anchor: 'end' });
  d.group(() => {
    d.rect(slotX(2) + SLOT / 2 - 60, 306, 120, 40, { pen: 'red', fill: 'red' });
    d.rect(slotX(2) + 5, 313, SLOT - 10, 26, {
      pen: 'red',
      fill: 'paper',
      label: 'm3',
      size: 15,
      rough: 0.6,
    });
    d.text(slotX(2) + SLOT / 2, 366, 'dead-letter queue', { pen: 'red', size: 15, bold: true });
  });
};
