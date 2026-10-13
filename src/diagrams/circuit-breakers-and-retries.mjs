export const meta = { title: 'A cascading failure, deadlines, retries with jittered backoff, and the circuit breaker state machine', width: 520, height: 420 };

export default (d) => {
  const svc = (x, w, label, pen) => d.rect(x, 24, w, 40, { pen, fill: pen, label, size: 16, bold: true, single: true });

  d.step('A slow dependency spreads');
  d.group(() => {
    svc(16, 92, 'checkout', 'blue');
    svc(212, 100, 'payments', 'blue');
    d.arrow(112, 44, 208, 44, { pen: 'blue', single: true });
    d.arrow(316, 44, 408, 44, { pen: 'blue', single: true });
  });
  d.group(() => {
    d.rect(412, 24, 92, 40, { pen: 'red', fill: 'red', fillStyle: 'hachure', label: 'bank', size: 16, bold: true, textPen: 'red', single: true });
    d.text(458, 84, 'slow: 30 s', { pen: 'red', size: 15 });
  });
  d.group(() => {
    d.text(262, 90, '200 of 200 threads\nstuck waiting', { pen: 'red', size: 15 });
    d.text(62, 84, 'stuck too', { pen: 'red', size: 15 });
  });

  d.step('Timeouts and a shared deadline');
  d.text(160, 30, '1 s total', { pen: 'orange', size: 15, bold: true });
  d.text(362, 30, '0.7 s left', { pen: 'orange', size: 15, bold: true });

  d.step('Retry with backoff and full jitter');
  d.text(260, 132, 'retry n: sleep random(0, 100 ms × 2^(n−1))', { pen: 'violet', size: 15, mono: true });
  d.group(() => {
    const rows = [
      ['retry 1', 100, 63],
      ['retry 2', 200, 141],
      ['retry 3', 400, 92],
    ];
    rows.forEach(([name, max, pick], i) => {
      const y = 158 + i * 24;
      d.text(100, y, name, { pen: 'muted', size: 15, anchor: 'end' });
      d.rect(110, y - 6, max * 0.75, 12, { pen: 'violet', fill: 'violet', rough: 0.6, single: true });
      d.dot(110 + pick * 0.75, y, 10, { pen: 'red' });
      d.text(118 + max * 0.75, y, `0–${max} ms`, { pen: 'violet', size: 15, anchor: 'start' });
    });
  });

  d.step('Breaker trips: closed → open');
  d.group(() => {
    d.ellipse(84, 282, 124, 56, { pen: 'green', fill: 'green', single: true });
    d.text(84, 274, 'CLOSED', { pen: 'green', size: 16, bold: true });
    d.text(84, 294, 'calls pass', { pen: 'ink', size: 15 });
  });
  d.arrow(150, 278, 366, 278, { pen: 'red', thick: true, label: '≥ 50 % of last 20 failed', size: 15, labelDy: -14 });
  d.group(() => {
    d.ellipse(434, 282, 124, 56, { pen: 'red', fill: 'red', single: true });
    d.text(434, 274, 'OPEN', { pen: 'red', size: 16, bold: true });
    d.text(434, 294, 'fail fast', { pen: 'ink', size: 15 });
  });

  d.step('Half-open: trial calls decide');
  d.group(() => {
    d.ellipse(260, 376, 140, 56, { pen: 'orange', fill: 'orange', single: true });
    d.text(260, 368, 'HALF-OPEN', { pen: 'orange', size: 16, bold: true });
    d.text(260, 388, 'a few trials', { pen: 'ink', size: 15 });
  });
  d.arrow(452, 314, 326, 362, { pen: 'orange', single: true, label: 'after 30 s', size: 15, labelDx: 54, labelDy: 18 });
  d.arrow(290, 346, 388, 306, { pen: 'red', single: true, label: 'trial fails', size: 15, labelDx: -52, labelDy: -12 });
  d.arrow(186, 366, 80, 314, { pen: 'green', thick: true, single: true, bend: -16, label: 'trials OK', size: 15, labelDx: -40, labelDy: 22 });
};
