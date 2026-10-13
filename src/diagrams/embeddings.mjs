export const meta = {
  title: 'Embeddings: from one-hot vectors to a learned table of dense vectors where similar things sit close',
  width: 520,
  height: 420,
};

const OX = 180;
const OY = 290;
const U = 40;
const P = (x, y) => [OX + x * U, OY - y * U];
const TABLE = [
  ['cat', '3', '1'],
  ['dog', '3', '2'],
  ['car', '−1', '3'],
];

export default (d) => {
  d.step('One-hot: every word is equally different');
  d.group(() => {
    d.text(14, 26, 'cat = [0 0 1 0 0 … 0]', { pen: 'muted', size: 15, mono: true, anchor: 'start' });
    d.text(14, 50, 'dog = [0 0 0 1 0 … 0]', { pen: 'muted', size: 15, mono: true, anchor: 'start' });
    d.text(14, 80, '50,000 numbers, one 1', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(14, 102, 'cat · dog = 0 for every pair', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('An embedding table: one dense row per word');
  d.group(() => {
    d.text(426, 18, 'embedding table', { pen: 'blue', size: 15 });
    TABLE.forEach(([w, a, b], i) => {
      const y = 32 + i * 26;
      d.rect(400, y, 50, 26, { pen: 'blue', fill: 'blue', label: a, size: 15, mono: true, rough: 0.5 });
      d.rect(450, y, 50, 26, { pen: 'blue', fill: 'blue', label: b, size: 15, mono: true, rough: 0.5 });
      d.text(392, y + 13, w, { pen: 'ink', size: 15, anchor: 'end' });
    });
    d.text(450, 124, '⋮  (one row per word)', { pen: 'muted', size: 14 });
  });
  d.arrow(240, 38, 340, 46, { pen: 'blue', label: 'look up row', size: 14, labelDy: -14 });

  d.step('Similar words land close together');
  d.group(() => {
    d.line(36, OY, 340, OY, { pen: 'muted', thin: true });
    d.line(OX, 360, OX, 150, { pen: 'muted', thin: true });
  });
  d.group(() => {
    for (const [name, x, y, pen, dx, dy] of [
      ['cat', 3, 1, 'blue', 26, 4],
      ['dog', 3, 2, 'blue', 26, -4],
      ['car', -1, 3, 'orange', -24, 0],
    ]) {
      d.arrow(OX, OY, ...P(x, y), { pen, headSize: 9 });
      d.text(P(x, y)[0] + dx, P(x, y)[1] + dy, name, { pen, size: 16, bold: true });
    }
  });

  d.step('Cosine similarity measures the angle');
  d.group(() => {
    d.arcArrow(OX, OY, 66, 71.6, 56.3, { pen: 'green', thin: true, headSize: 7 });
    d.text(360, 214, 'cos(cat, dog) = 0.96', { pen: 'green', size: 16, bold: true, anchor: 'start' });
  });
  d.group(() => {
    d.arc(OX, OY, 60, 60, -18.4, 71.6, { pen: 'orange', thin: true });
    d.text(360, 242, 'cos(cat, car) = 0', { pen: 'orange', size: 16, bold: true, anchor: 'start' });
    d.text(360, 264, '(at right angles)', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('Directions can carry meaning');
  d.group(() => {
    for (const [name, x, y, dx] of [
      ['man', -2.4, -0.6, -28],
      ['woman', -2.4, -2.2, -38],
      ['king', -1.4, -0.6, 30],
      ['queen', -1.5, -2.3, 36],
    ]) {
      d.dot(...P(x, y), 10, { pen: 'violet', single: true });
      d.text(P(x, y)[0] + dx, P(x, y)[1], name, { pen: 'violet', size: 15, bold: true });
    }
  });
  d.group(() => {
    d.arrow(...P(-2.4, -0.82), ...P(-2.4, -1.98), { pen: 'violet', dashed: true, headSize: 8 });
    d.arrow(...P(-1.4, -0.82), ...P(-1.49, -2.08), { pen: 'violet', dashed: true, headSize: 8 });
  });
  d.text(506, 360, 'king − man + woman', { pen: 'violet', size: 16, bold: true, anchor: 'end' });
  d.text(506, 384, '≈ queen (roughly)', { pen: 'violet', size: 16, anchor: 'end' });
};
