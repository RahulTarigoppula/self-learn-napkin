export const meta = {
  title: "Dijkstra's algorithm on a six-node weighted graph with a distance table",
  width: 520,
  height: 420,
};

const R = 19;
const N = {
  A: [50, 112],
  B: [170, 46],
  C: [170, 178],
  D: [320, 46],
  E: [320, 178],
  F: [460, 112],
};
// [u, v, w, label dx, label dy]
const EDGES = [
  ['A', 'B', 4, -10, -10],
  ['A', 'C', 1, -10, 10],
  ['B', 'C', 2, -12, 0],
  ['B', 'D', 5, 0, -12],
  ['C', 'D', 8, 20, 14],
  ['C', 'E', 10, 0, 13],
  ['D', 'E', 2, 12, 0],
  ['D', 'F', 6, 12, -10],
  ['E', 'F', 3, 12, 10],
];
const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
const TX = 104; // first value column centre
const CW = 40;
const TY = 220; // header row centre
const RH = 22;

function seg(a, b) {
  const [x1, y1] = N[a];
  const [x2, y2] = N[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  return [x1 + ux * (R + 2), y1 + uy * (R + 2), x2 - ux * (R + 2), y2 - uy * (R + 2)];
}

function edge(d, a, b, o) {
  d.line(...seg(a, b), { single: true, ...o });
}

function node(d, id, o = {}) {
  const [x, y] = N[id];
  d.circle(x, y, R * 2, { pen: 'ink', label: id, size: 16, bold: true, single: true, ...o });
}

// one table row: label, then values; changed → orange, popped → green bold
function row(d, i, label, vals, popped = '', changed = '') {
  const y = TY + (i + 1) * RH;
  d.group(() => {
    d.text(18, y, label, { pen: popped ? 'green' : 'muted', size: 15, anchor: 'start' });
    vals.forEach((v, k) => {
      const id = COLS[k];
      const pen = id === popped ? 'green' : changed.includes(id) ? 'orange' : v === '∞' ? 'muted' : 'ink';
      d.text(TX + k * CW, y, v, { pen, mono: true, size: 15, bold: id === popped || changed.includes(id) });
    });
  });
}

export default (d) => {
  d.step('A weighted graph; start at A');
  d.group(() => {
    for (const [a, b, w, dx, dy] of EDGES) {
      edge(d, a, b, { pen: 'muted' });
      const [x1, y1, x2, y2] = seg(a, b);
      d.text((x1 + x2) / 2 + dx, (y1 + y2) / 2 + dy, String(w), {
        pen: 'blue',
        mono: true,
        size: 15,
        bold: true,
      });
    }
  });
  for (const id of COLS) node(d, id);
  d.group(() => {
    d.text(18, TY, 'dist', { pen: 'ink', size: 15, anchor: 'start', bold: true });
    COLS.forEach((c, k) => d.text(TX + k * CW, TY, c, { pen: 'ink', size: 15, bold: true }));
    d.line(16, TY + 12, TX + 5.5 * CW, TY + 12, { pen: 'muted', single: true, rough: 0.5 });
  });
  row(d, 0, 'start', ['0', '∞', '∞', '∞', '∞', '∞']);

  d.step('Pop A (0) and relax its edges');
  node(d, 'A', { pen: 'green', fill: 'green' });
  d.group(() => {
    edge(d, 'A', 'B', { pen: 'orange', thick: true });
    edge(d, 'A', 'C', { pen: 'orange', thick: true });
  });
  row(d, 1, 'pop A', ['0', '4', '1', '∞', '∞', '∞'], 'A', 'BC');

  d.step('Pop C (1): a cheaper way to B');
  node(d, 'C', { pen: 'green', fill: 'green' });
  d.group(() => {
    edge(d, 'C', 'B', { pen: 'orange', thick: true });
    edge(d, 'C', 'D', { pen: 'orange', thick: true });
    edge(d, 'C', 'E', { pen: 'orange', thick: true });
  });
  row(d, 2, 'pop C', ['0', '3', '1', '9', '11', '∞'], 'C', 'BDE');

  d.step('Pop B (3), then D (8)');
  node(d, 'B', { pen: 'green', fill: 'green' });
  edge(d, 'B', 'D', { pen: 'orange', thick: true });
  row(d, 3, 'pop B', ['0', '3', '1', '8', '11', '∞'], 'B', 'D');
  node(d, 'D', { pen: 'green', fill: 'green' });
  d.group(() => {
    edge(d, 'D', 'E', { pen: 'orange', thick: true });
    edge(d, 'D', 'F', { pen: 'orange', thick: true });
  });
  row(d, 4, 'pop D', ['0', '3', '1', '8', '10', '14'], 'D', 'EF');

  d.step('Pop E, F; walk parents back from F');
  d.group(() => {
    node(d, 'E', { pen: 'green', fill: 'green' });
    edge(d, 'E', 'F', { pen: 'orange', thick: true });
    node(d, 'F', { pen: 'green', fill: 'green' });
  });
  row(d, 5, 'pop E', ['0', '3', '1', '8', '10', '13'], 'E', 'F');
  d.group(() => {
    for (const [a, b] of [
      ['A', 'C'],
      ['C', 'B'],
      ['B', 'D'],
      ['D', 'E'],
      ['E', 'F'],
    ])
      edge(d, a, b, { pen: 'red', thick: true });
  });
  d.text(18, 386, 'shortest A to F: A→C→B→D→E→F = 13', { pen: 'red', size: 15, bold: true, anchor: 'start' });

  d.step('A negative edge breaks the guarantee');
  d.group(() => {
    const P = { S: [384, 262], X: [482, 262], Y: [433, 338] };
    for (const [id, [x, y]] of Object.entries(P))
      d.circle(x, y, 32, { pen: 'violet', label: id, size: 15, bold: true, single: true });
    d.arrow(401, 262, 464, 262, {
      pen: 'violet',
      single: true,
      headSize: 9,
      label: '2',
      mono: true,
      size: 15,
      labelDy: -11,
    });
    d.arrow(394, 276, 422, 323, {
      pen: 'violet',
      single: true,
      headSize: 9,
      label: '3',
      mono: true,
      size: 15,
      labelDx: -12,
      labelDy: 0,
    });
    d.arrow(444, 323, 472, 277, {
      pen: 'red',
      single: true,
      headSize: 9,
      label: '−2',
      mono: true,
      size: 15,
      labelDx: 18,
      labelDy: 2,
    });
    d.text(433, 226, 'negative edge', { pen: 'violet', size: 15, bold: true });
  });
  d.text(433, 384, 'X locked at 2,\nbut S→Y→X = 1 ✗', { pen: 'red', size: 15 });
};
