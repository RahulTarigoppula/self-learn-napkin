export const meta = {
  title: 'Latency numbers on a log scale, then a napkin estimate of QPS and storage for a photo app',
  width: 520,
  height: 420,
};

// log axis: 1 ns at X0, one decade every DEC units, 1 s at X0 + 9·DEC
const X0 = 44;
const DEC = 48;
const AY = 112;
const xOf = (ns) => X0 + Math.log10(ns) * DEC;

export default (d) => {
  // a rough box with mono text, used for the estimate chains
  const box = (x, y, w, text, pen) =>
    d.rect(x, y - 17, w, 34, { pen, fill: pen, label: text, mono: true, size: 17, rough: 0.8 });
  // three boxes joined by two labelled arrows
  const chain = (y, pen, [a, b, c], [opAB, opBC]) => {
    box(24, y, 90, a, pen);
    d.arrow(118, y, 200, y, { pen, label: opAB, labelDy: -17 });
    box(204, y, 116, b, pen);
    d.arrow(324, y, 402, y, { pen, label: opBC, labelDy: -17 });
    box(406, y, 90, c, pen);
  };

  d.step('A ladder of powers of ten');
  d.text(X0 - 6, 34, 'how long things take (log scale)', { pen: 'muted', size: 15, anchor: 'start' });
  d.group(() => {
    d.arrow(X0 - 8, AY, X0 + 9 * DEC + 16, AY, { pen: 'ink', thick: true });
    for (let k = 0; k <= 9; k++)
      d.line(X0 + k * DEC, AY - 5, X0 + k * DEC, AY + 5, { pen: 'ink', thin: true });
  });
  d.group(() => {
    for (const [k, t] of [
      [0, '1 ns'],
      [3, '1 µs'],
      [6, '1 ms'],
      [9, '1 s'],
    ])
      d.text(X0 + k * DEC, AY + 22, t, { pen: 'muted', size: 15 });
  });
  d.text(118, 172, 'each tick = 10× slower', { pen: 'muted', size: 15 });

  d.step('Inside one machine');
  d.group(() => {
    d.dot(xOf(100), AY, 12, { pen: 'green' });
    d.text(xOf(100), AY - 34, 'RAM read\n100 ns', { pen: 'green', size: 15 });
  });
  d.group(() => {
    d.dot(xOf(1e5), AY, 12, { pen: 'blue' });
    d.text(xOf(1e5) - 6, AY - 34, 'SSD read\n100 µs', { pen: 'blue', size: 15 });
  });
  d.group(() => {
    d.dot(xOf(1e7), AY, 12, { pen: 'orange' });
    d.text(xOf(1e7) + 14, AY - 34, 'disk seek\n10 ms', { pen: 'orange', size: 15 });
  });

  d.step('Leaving the machine');
  d.group(() => {
    d.dot(xOf(5e5), AY, 12, { pen: 'violet' });
    d.text(xOf(5e5) - 8, AY + 52, 'same-DC\nround trip\n0.5 ms', { pen: 'violet', size: 15, anchor: 'end' });
  });
  d.group(() => {
    d.dot(xOf(1.5e8), AY, 12, { pen: 'red' });
    d.text(xOf(1.5e8) + 4, AY + 58, 'across an\nocean\n~150 ms', { pen: 'red', size: 15 });
  });

  d.step('Users per day → requests per second');
  d.line(24, 214, 496, 214, { pen: 'muted', thin: true, dashed: true });
  d.text(24, 238, 'photo app: 10 M daily users × 100 views', { pen: 'muted', size: 15, anchor: 'start' });
  chain(280, 'blue', ['10 M DAU', '1 B views', '10 k QPS'], ['×100', '÷10^5 s']);
  d.text(496, 316, 'peak ×3 ≈ 30 k', { pen: 'red', size: 15, anchor: 'end' });

  d.step('Uploads → storage per year');
  chain(356, 'orange', ['2 M/day', '4 TB/day', '1.5 PB'], ['×2 MB', '×365']);
  d.text(496, 392, '×3 copies ≈ 4.4 PB', { pen: 'red', size: 15, anchor: 'end' });
};
