export const meta = { title: 'A min-heap as a tree and an array: push with sift-up, pop with sift-down', width: 520, height: 420 };

const D = 32; // node diameter
const HEAP = [2, 4, 3, 9, 7, 8, 5];
const POS = [
  [260, 40],
  [160, 92],
  [360, 92],
  [110, 144],
  [210, 144],
  [310, 144],
  [410, 144],
  [85, 196],
];
const CW = 38; // array cell width
const AX = 112; // array left edge

function edge(d, i, j, o = {}) {
  const [x1, y1] = POS[i];
  const [x2, y2] = POS[j];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const r = D / 2 + 2;
  d.line(x1 + ux * r, y1 + uy * r, x2 - ux * r, y2 - uy * r, { pen: 'muted', single: true, ...o });
}

function cells(d, y, vals, pen = 'ink', mark = {}) {
  vals.forEach((v, i) =>
    d.rect(AX + i * CW, y, CW, 28, { pen: mark[i] ?? pen, fill: mark[i], rough: 0.5, single: true, label: String(v), size: 16, mono: true }),
  );
}

export default (d) => {
  d.step('A complete tree stored in an array');
  d.group(() => {
    for (let j = 1; j < HEAP.length; j++) edge(d, (j - 1) >> 1, j);
    HEAP.forEach((v, i) => d.circle(...POS[i], D, { pen: 'ink', rough: 0.7, single: true, label: String(v), size: 17, bold: true }));
  });
  d.group(() => {
    d.text(14, 252, 'heap', { pen: 'ink', size: 16, anchor: 'start', bold: true });
    for (let i = 0; i < 8; i++) d.text(AX + i * CW + CW / 2, 228, String(i), { pen: 'muted', size: 14, mono: true });
    cells(d, 238, HEAP);
  });
  d.text(78, 30, 'children of i:\n2i+1 and 2i+2', { pen: 'blue', size: 15 });

  d.step('Heap property: every parent ≤ its children');
  d.circle(...POS[0], D + 12, { pen: 'green', thick: true, rough: 0.8, single: true });
  d.text(468, 34, 'parent ≤\nchildren', { pen: 'green', size: 15 });

  d.step('Push 1: append it at the end');
  d.group(() => {
    edge(d, 3, 7, { pen: 'orange' });
    d.circle(...POS[7], D, { pen: 'orange', fill: 'orange', rough: 0.7, single: true, label: '1', size: 17, bold: true });
  });
  d.rect(AX + 7 * CW, 238, CW, 28, { pen: 'orange', fill: 'orange', rough: 0.5, single: true, label: '1', size: 16, mono: true });

  d.step('Sift up: swap with the parent while smaller');
  d.group(() => {
    d.arrow(66, 180, 88, 132, { pen: 'orange', thick: true, bend: -10, single: true, rough: 0.6 });
    d.arrow(98, 122, 140, 82, { pen: 'orange', thick: true, bend: -10, single: true, rough: 0.6 });
    d.arrow(160, 66, 236, 30, { pen: 'orange', thick: true, bend: -12, single: true, rough: 0.6 });
  });
  d.group(() => {
    d.text(14, 296, 'push 1', { pen: 'orange', size: 16, anchor: 'start', bold: true });
    cells(d, 282, [1, 2, 3, 4, 7, 8, 5, 9], 'ink', { 0: 'orange', 1: 'orange', 3: 'orange', 7: 'orange' });
  });
  d.text(434, 296, '3 swaps', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('Pop: last item to the root, then sift down');
  d.arrow(426, 126, 280, 34, { pen: 'red', thick: true, single: true, rough: 0.6, bend: 58, label: 'last → root', labelDx: 50, labelDy: -18 });
  d.arrow(272, 58, 340, 104, { pen: 'red', thick: true, single: true, rough: 0.6, bend: -16 });
  d.group(() => {
    d.text(14, 340, 'pop → 2', { pen: 'red', size: 16, anchor: 'start', bold: true });
    cells(d, 326, [3, 4, 5, 9, 7, 8], 'ink', { 0: 'red', 2: 'red' });
  });
  d.text(358, 340, '5 sinks below 3', { pen: 'red', size: 15, anchor: 'start' });
  d.text(260, 392, 'both are O(log n): one step per level', { pen: 'muted', size: 15 });
};
