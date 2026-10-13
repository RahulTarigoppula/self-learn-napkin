export const meta = { title: 'Backpressure: a fast producer, a growing queue, a bounded buffer, pull-based demand and Little\'s law', width: 520, height: 420 };

const QX = 170; // queue left
const QY = 62;
const QW = 180;
const QH = 40;
const SLOTS = 6;

export default (d) => {
  const sw = QW / SLOTS;

  d.step('Producer faster than consumer');
  d.group(() => {
    d.rect(16, 54, 108, 56, { pen: 'blue', fill: 'blue' });
    d.text(70, 72, 'producer', { pen: 'blue', size: 16, bold: true });
    d.text(70, 94, '1,000 / s', { pen: 'blue', size: 15, mono: true });
  });
  d.group(() => {
    d.rect(QX, QY, QW, QH, { pen: 'violet', thick: true });
    for (let i = 1; i < SLOTS; i++) d.line(QX + i * sw, QY + 4, QX + i * sw, QY + QH - 4, { pen: 'violet', thin: true, single: true });
    d.text(QX + 46, QY + QH + 16, 'buffer', { pen: 'muted', size: 15 });
  });
  d.group(() => {
    d.rect(396, 54, 108, 56, { pen: 'green', fill: 'green' });
    d.text(450, 72, 'consumer', { pen: 'green', size: 16, bold: true });
    d.text(450, 94, '800 / s', { pen: 'green', size: 15, mono: true });
  });
  d.arrow(128, 82, QX - 6, 82, { pen: 'blue', thick: true });
  d.arrow(QX + QW + 6, 82, 390, 82, { pen: 'green', thick: true });

  d.step('Unbounded queue: memory and latency grow');
  d.group(() => {
    d.line(44, 244, 238, 244, { pen: 'muted' });
    d.line(44, 244, 44, 150, { pen: 'muted' });
    d.text(44, 138, 'queued', { pen: 'muted', size: 15 });
    d.text(232, 262, '60 s', { pen: 'muted', size: 15, mono: true });
  });
  d.group(() => {
    d.line(46, 242, 226, 162, { pen: 'red', thick: true });
    d.text(222, 146, '12,000', { pen: 'red', size: 15, mono: true });
  });
  d.text(262, 200, '+200/s piles up\nwait = 12,000 ÷ 800 = 15 s\nthen: out of memory', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Bound it: block, drop or shed');
  d.group(() => {
    d.line(QX + 4, QY - 8, QX + 4, QY + QH + 8, { pen: 'red', thick: true });
    d.text(QX + QW - 44, QY + QH + 16, 'cap = 100', { pen: 'red', size: 15, bold: true });
  });
  d.group(() => {
    const opt = (x, title, sub) => {
      d.rect(x, 304, 156, 52, { pen: 'orange', fill: 'orange', single: true });
      d.text(x + 78, 320, title, { pen: 'orange', size: 16, bold: true });
      d.text(x + 78, 342, sub, { pen: 'ink', size: 15 });
    };
    opt(16, 'block', 'producer waits');
    opt(182, 'drop', 'oldest or newest');
    opt(348, 'shed', '429 / 503 early');
    d.text(260, 288, 'when the buffer is full:', { pen: 'muted', size: 15 });
  });

  d.step('Pull: the consumer sets the pace');
  d.arrow(450, 48, 70, 48, { pen: 'green', bend: 30, label: 'request(50): send at most 50', size: 15, labelDy: -32 });

  d.step("Little's law: L = λW");
  d.text(260, 380, "Little's law: L = λ × W", { pen: 'violet', size: 16, bold: true });
  d.text(260, 402, 'cap 100 at 800/s → wait ≤ 100 ÷ 800 = 125 ms', { pen: 'violet', size: 15 });
};
