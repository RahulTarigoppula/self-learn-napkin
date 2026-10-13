export const meta = { title: 'Bellman-Ford relaxing every edge in passes, with a negative edge and a negative cycle', width: 520, height: 420 };

const R = 20;
const N = { S: [52, 118], B: [180, 46], A: [180, 190], C: [308, 118] };
// [u, v, w, label dx, label dy]
const EDGES = [
  ['A', 'C', 3, 12, 10],
  ['B', 'A', -2, 16, 0],
  ['S', 'B', 4, -10, -10],
  ['S', 'A', 5, -10, 10],
  ['B', 'C', 6, 12, -10],
];
const COLS = ['S', 'A', 'B', 'C'];
const VX = 116; // first value column
const CW = 46;
const TY = 238; // header row
const RH = 22;

function seg(a, b) {
  const [x1, y1] = N[a];
  const [x2, y2] = N[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  return [x1 + ux * (R + 3), y1 + uy * (R + 3), x2 - ux * (R + 4), y2 - uy * (R + 4)];
}

const fmtW = (w) => (w < 0 ? `−${-w}` : String(w));

function row(d, i, label, vals, changed = '', pen = 'ink') {
  const y = TY + (i + 1) * RH;
  d.group(() => {
    d.text(18, y, label, { pen: pen === 'ink' ? 'muted' : pen, size: 15, anchor: 'start' });
    vals.forEach((v, k) => {
      const hit = changed.includes(COLS[k]);
      d.text(VX + k * CW, y, v, { pen: hit ? 'orange' : v === '∞' ? 'muted' : pen, mono: true, size: 15, bold: hit });
    });
  });
}

export default (d) => {
  d.step('A graph with one negative edge');
  d.group(() => {
    for (const [a, b, w, dx, dy] of EDGES) {
      const [x1, y1, x2, y2] = seg(a, b);
      const neg = w < 0;
      d.arrow(x1, y1, x2, y2, { pen: neg ? 'red' : 'muted', single: true, headSize: 9 });
      d.text((x1 + x2) / 2 + dx, (y1 + y2) / 2 + dy, fmtW(w), { pen: neg ? 'red' : 'blue', mono: true, size: 15, bold: true });
    }
  });
  d.group(() => {
    for (const [id, [x, y]] of Object.entries(N)) d.circle(x, y, R * 2, { pen: 'ink', label: id, size: 16, bold: true, single: true });
  });
  d.group(() => {
    d.text(370, 34, 'edge order', { pen: 'ink', size: 15, bold: true, anchor: 'start' });
    EDGES.forEach(([a, b, w], i) =>
      d.text(370, 60 + i * 24, `${i + 1}  ${a}→${b}  ${fmtW(w)}`, { pen: w < 0 ? 'red' : 'ink', mono: true, size: 15, anchor: 'start' }),
    );
  });
  d.group(() => {
    d.text(18, TY, 'dist', { pen: 'ink', size: 15, bold: true, anchor: 'start' });
    COLS.forEach((c, k) => d.text(VX + k * CW, TY, c, { pen: 'ink', size: 15, bold: true }));
    d.line(16, TY + 12, VX + 3.5 * CW, TY + 12, { pen: 'muted', single: true, rough: 0.5 });
  });
  row(d, 0, 'start', ['0', '∞', '∞', '∞']);

  d.step('Pass 1: relax all 5 edges in order');
  row(d, 1, 'pass 1', ['0', '5', '4', '10'], 'ABC');
  d.text(300, TY + 2 * RH, 'edges 1–2 start at ∞: no help', { pen: 'muted', size: 14, anchor: 'start' });

  d.step('Pass 2: the negative edge pays off');
  row(d, 2, 'pass 2', ['0', '2', '4', '8'], 'AC');
  d.text(300, TY + 3 * RH, 'B→A: 4 − 2 = 2 < 5', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Pass 3 = V − 1: all distances final');
  row(d, 3, 'pass 3', ['0', '2', '4', '5'], 'C');
  d.group(() => {
    for (const [a, b] of [['S', 'B'], ['B', 'A'], ['A', 'C']]) d.line(...seg(a, b), { pen: 'green', thick: true, single: true });
  });
  d.text(300, TY + 4 * RH, 'S→B→A→C = 5 ✓', { pen: 'green', size: 15, bold: true, anchor: 'start' });

  d.step('One extra pass: nothing changes');
  row(d, 4, 'check', ['0', '2', '4', '5'], '', 'green');
  d.text(300, TY + 5 * RH, 'no change → no neg. cycle', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Add C→B −6: a negative cycle');
  d.group(() => {
    d.arrow(N.C[0] - 6, N.C[1] - 22, N.B[0] + 22, N.B[1] - 8, { pen: 'red', thick: true, bend: 30, headSize: 9 });
    d.text(282, 30, '−6', { pen: 'red', mono: true, size: 15, bold: true });
  });
  d.text(18, 386, 'cycle B→A→C→B = −2 + 3 − 6 = −5: the check pass\nstill lowers A, B and C, so report a negative cycle', { pen: 'red', size: 15, anchor: 'start' });
};
