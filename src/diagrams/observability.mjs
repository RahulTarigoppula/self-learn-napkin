export const meta = { title: 'Logs, metrics, a distributed trace, average vs p99 latency, and an SLO error budget', width: 520, height: 420 };

export default (d) => {
  d.step('Logs: one record per event');
  d.group(() => {
    d.text(16, 18, 'logs', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
    d.rect(16, 32, 236, 88, { pen: 'muted', fill: 'paper', single: true });
    d.text(26, 52, 'GET /cart 200 41ms', { pen: 'ink', size: 14, mono: true, anchor: 'start' });
    d.text(26, 76, 'POST /pay 500 trace=ab12', { pen: 'red', size: 14, mono: true, anchor: 'start' });
    d.text(26, 100, 'GET /cart 200 38ms', { pen: 'ink', size: 14, mono: true, anchor: 'start' });
  });

  d.step('Metrics: cheap numbers over time');
  d.group(() => {
    d.text(272, 18, 'metrics', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
    d.line(282, 118, 500, 118, { pen: 'muted', single: true });
    d.line(282, 118, 282, 34, { pen: 'muted', single: true });
  });
  d.group(() => {
    d.curve([[286, 62], [320, 58], [350, 63], [380, 57], [410, 61], [440, 58], [470, 62], [496, 59]], { pen: 'blue' });
    d.text(340, 42, 'requests/s', { pen: 'blue', size: 15 });
  });
  d.group(() => {
    d.curve([[286, 112], [380, 112], [398, 110], [412, 84], [426, 82], [440, 110], [496, 112]], { pen: 'red', thick: true });
    d.text(450, 86, 'errors/s', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('Traces: one request across services');
  d.text(16, 148, 'trace ab12: one span per call', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
  d.group(() => {
    const ms = (t) => 112 + t * 1.1;
    const rows = [
      ['api', 0, 340, 'blue', ''],
      ['auth', 8, 40, 'green', ''],
      ['orders', 48, 332, 'blue', ''],
      ['db', 60, 320, 'red', 'SELECT … 260 ms'],
    ];
    rows.forEach(([name, a, b, pen, label], i) => {
      const y = 162 + i * 26;
      d.text(100, y + 9, name, { pen: 'muted', size: 15, anchor: 'end' });
      d.rect(ms(a), y, ms(b) - ms(a), 18, { pen, fill: pen, rough: 0.5, single: true, label: label || undefined, size: 14 });
    });
  });

  d.step('Percentiles: the average hides the tail');
  d.group(() => {
    d.text(16, 284, 'latency', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
    d.line(24, 392, 250, 392, { pen: 'muted', single: true });
    const bars = [[30, 70], [46, 82], [62, 56], [78, 30], [94, 14], [150, 6], [198, 5], [230, 6]];
    for (const [x, h] of bars) d.rect(x, 392 - h, 12, h, { pen: 'violet', fill: 'violet', rough: 0.5, single: true });
  });
  d.group(() => {
    d.line(70, 302, 70, 392, { pen: 'blue', dashed: true });
    d.text(76, 304, 'avg 60 ms', { pen: 'blue', size: 15, anchor: 'start' });
    d.line(236, 340, 236, 392, { pen: 'red', thick: true });
    d.text(236, 328, 'p99 900 ms', { pen: 'red', size: 15, bold: true, anchor: 'end' });
  });

  d.step('SLO: 99.9 % leaves 43 minutes');
  d.group(() => {
    d.text(272, 284, 'SLO 99.9 % per 30 days', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
    d.text(272, 316, 'budget: 0.1 % × 43,200 min\n= 43.2 min of failure', { pen: 'ink', size: 15, anchor: 'start' });
  });
  d.group(() => {
    d.rect(276, 352, 150, 22, { pen: 'red', fill: 'red', rough: 0.5, single: true });
    d.rect(426, 352, 68, 22, { pen: 'green', fill: 'green', rough: 0.5, single: true });
    d.text(276, 392, '30 min used', { pen: 'red', size: 15, anchor: 'start' });
    d.text(494, 392, '13 left', { pen: 'green', size: 15, anchor: 'end' });
  });
};
