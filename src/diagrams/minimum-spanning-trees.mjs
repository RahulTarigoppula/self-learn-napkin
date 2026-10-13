export const meta = { title: "Kruskal's algorithm building a minimum spanning tree, and the cut property", width: 520, height: 400 };

const R = 18;
const N = {
  A: [55, 62],
  B: [185, 40],
  C: [315, 70],
  D: [60, 210],
  E: [190, 200],
  F: [320, 225],
};
// [u, v, w, label position t along the edge, label dx, label dy]; listed in sorted order
const EDGES = [
  ['C', 'F', 1, 0.5, 12, 0],
  ['A', 'D', 2, 0.5, -12, 0],
  ['B', 'E', 3, 0.4, 12, 0],
  ['A', 'B', 4, 0.5, 0, -13],
  ['A', 'E', 5, 0.5, 10, -10],
  ['B', 'C', 6, 0.35, 0, -13],
  ['C', 'E', 7, 0.72, -11, -11],
  ['E', 'F', 8, 0.3, 0, 14],
  ['D', 'E', 9, 0.5, 0, 13],
];
const LX = 392; // sorted list x
const LY = 54;
const LH = 25;

function seg(a, b) {
  const [x1, y1] = N[a];
  const [x2, y2] = N[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  return [x1 + ux * (R + 1), y1 + uy * (R + 1), x2 - ux * (R + 1), y2 - uy * (R + 1)];
}
const take = (d, i) => d.line(...seg(EDGES[i][0], EDGES[i][1]), { pen: 'green', thick: true, single: true });
const mark = (d, i, s, pen) => d.text(LX + 86, LY + i * LH, s, { pen, size: 16, bold: true });

export default (d) => {
  d.step('Connect all six nodes as cheaply as possible');
  d.group(() => {
    for (const [a, b, w, t, dx, dy] of EDGES) {
      const [x1, y1, x2, y2] = seg(a, b);
      d.line(x1, y1, x2, y2, { pen: 'muted', single: true });
      d.text(x1 + (x2 - x1) * t + dx, y1 + (y2 - y1) * t + dy, String(w), { pen: 'blue', mono: true, size: 15, bold: true });
    }
  });
  d.group(() => {
    for (const [id, [x, y]] of Object.entries(N)) d.circle(x, y, R * 2, { pen: 'ink', label: id, size: 16, bold: true, single: true });
  });

  d.step('Kruskal: sort the edges by weight');
  d.group(() => {
    d.text(LX - 8, 24, 'sorted edges', { pen: 'ink', size: 15, bold: true, anchor: 'start' });
    EDGES.forEach(([a, b, w], i) => d.text(LX, LY + i * LH, `${a}–${b}  ${w}`, { pen: 'ink', mono: true, size: 15, anchor: 'start' }));
  });

  d.step('Take 1, 2, 3, 4: each joins two pieces');
  d.group(() => {
    for (let i = 0; i < 4; i++) take(d, i);
  });
  d.group(() => {
    for (let i = 0; i < 4; i++) mark(d, i, '✓', 'green');
  });
  d.text(20, 282, 'union-find sets: {A,B,D,E}  {C,F}', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Skip A–E 5: it would close a cycle');
  d.line(...seg('A', 'E'), { pen: 'red', thick: true, dashed: true, single: true });
  mark(d, 4, '✗', 'red');
  d.text(20, 312, 'A–E: find(A) = find(E), same set → skip', { pen: 'red', size: 15, anchor: 'start' });

  d.step('B–C 6 joins the last piece: done');
  take(d, 5);
  d.group(() => {
    mark(d, 5, '✓', 'green');
    for (let i = 6; i < 9; i++) mark(d, i, '–', 'muted');
    d.text(LX - 8, 282, 'rest: not needed', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.text(20, 342, '5 edges = V − 1, total 1+2+3+4+6 = 16', { pen: 'green', size: 16, bold: true, anchor: 'start' });

  d.step('Why it works: the cut property');
  d.group(() => {
    d.curve([[262, 20], [258, 100], [250, 160], [268, 215], [286, 258]], { pen: 'violet', thick: true, dashed: true });
    d.text(262, 262, 'cut', { pen: 'violet', size: 15, anchor: 'end' });
  });
  d.text(20, 372, 'lightest edge across any cut (here 6) is safe', { pen: 'violet', size: 15, anchor: 'start' });
};
