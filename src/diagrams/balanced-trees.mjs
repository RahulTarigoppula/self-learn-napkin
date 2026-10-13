export const meta = {
  title: 'Balanced trees: a degenerate chain, an AVL right rotation, a red-black tree and a B-tree node',
  width: 520,
  height: 420,
};

const D = 30; // node diameter

function edge(d, [x1, y1], [x2, y2], o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const r = D / 2 + 2;
  d.line(x1 + ux * r, y1 + uy * r, x2 - ux * r, y2 - uy * r, { pen: 'muted', single: true, ...o });
}

function nd(d, [x, y], label, o = {}) {
  d.circle(x, y, o.dia ?? D, {
    pen: 'ink',
    rough: 0.7,
    single: true,
    label: String(label),
    size: 16,
    bold: true,
    ...o,
  });
}

/** Draw a tree from { key: [x, y] } and [[parent, child], ...] as one element. */
function tree(d, P, E, style = () => ({})) {
  d.group(() => {
    for (const [a, b] of E) edge(d, P[a], P[b]);
    for (const k of Object.keys(P)) nd(d, P[k], k, style(Number(k)));
  });
}

const CHAIN = { 10: [28, 40], 20: [50, 84], 30: [72, 128], 40: [94, 172] };
const BEFORE = { 30: [245, 46], 20: [195, 96], 40: [295, 96], 10: [165, 146], 25: [225, 146] };
const AFTER = { 20: [430, 46], 10: [385, 96], 30: [468, 96], 5: [360, 146], 25: [444, 146], 40: [492, 146] };
const RB = { 20: [110, 272], 10: [65, 310], 30: [155, 310], 5: [40, 348], 25: [130, 348], 40: [180, 348] };

export default (d) => {
  d.step('Sorted inserts build a chain');
  d.group(() => {
    const ks = [10, 20, 30, 40];
    ks.forEach((k, i) => {
      if (i > 0) edge(d, CHAIN[ks[i - 1]], CHAIN[k]);
      nd(d, CHAIN[k], k, { pen: 'red', fill: 'red', dia: 28 });
    });
  });
  d.text(52, 212, 'height n − 1\nO(n) search', { pen: 'red', size: 14 });

  d.step('AVL: every balance factor is −1, 0 or +1');
  tree(d, BEFORE, [
    [30, 20],
    [30, 40],
    [20, 10],
    [20, 25],
  ]);
  d.text(240, 234, 'bf = height(L) − height(R)', { pen: 'muted', size: 15 });

  d.step('Insert 5: node 30 is out of balance');
  d.group(() => {
    edge(d, BEFORE[10], [140, 196], { pen: 'orange' });
    nd(d, [140, 196], 5, { pen: 'orange', fill: 'orange' });
  });
  d.group(() => {
    d.text(224, 30, '+2', { pen: 'red', size: 16, bold: true, anchor: 'end' });
    d.text(174, 80, '+1', { pen: 'red', size: 15, anchor: 'end' });
    d.text(144, 130, '+1', { pen: 'red', size: 15, anchor: 'end' });
  });

  d.step('Rotate right at 30: 20 moves up');
  d.arrow(282, 40, 398, 40, { pen: 'blue', thick: true, label: 'rotate right', size: 15, labelDy: -16 });
  tree(
    d,
    AFTER,
    [
      [20, 10],
      [20, 30],
      [10, 5],
      [30, 25],
      [30, 40],
    ],
    (k) => (k === 25 ? { pen: 'orange', fill: 'orange' } : k === 20 ? { pen: 'blue', fill: 'blue' } : {}),
  );
  d.text(432, 196, '25 changes parent\nheight 3 → 2', { pen: 'green', size: 15 });

  d.step('Red-black: colours instead of heights');
  d.line(14, 252, 506, 252, { pen: 'muted', dashed: true, thin: true, single: true });
  tree(
    d,
    RB,
    [
      [20, 10],
      [20, 30],
      [10, 5],
      [30, 25],
      [30, 40],
    ],
    (k) =>
      k === 30 || k === 5
        ? { pen: 'red', fill: 'red', dia: 28 }
        : { pen: 'ink', fill: 'ink', textPen: 'paper', dia: 28 },
  );
  d.group(() => {
    d.text(90, 264, 'black', { pen: 'ink', size: 14, anchor: 'end' });
    d.text(174, 298, 'red', { pen: 'red', size: 14, anchor: 'start' });
  });
  d.text(14, 386, 'no red node has a red child\n2 black nodes on every path', {
    pen: 'muted',
    size: 14,
    anchor: 'start',
  });

  d.step('B-tree: many keys per node, few levels');
  d.group(() => {
    d.rect(322, 266, 106, 34, { pen: 'violet', fill: 'violet', rough: 0.6, single: true });
    d.line(375, 268, 375, 298, { pen: 'violet', single: true });
    d.text(348, 283, '20', { pen: 'violet', size: 16, mono: true, bold: true });
    d.text(402, 283, '40', { pen: 'violet', size: 16, mono: true, bold: true });
  });
  d.group(() => {
    for (const [x, keys, px] of [
      [252, '5  10', 324],
      [344, '25 30', 375],
      [436, '50 60', 426],
    ]) {
      d.line(px, 302, x + 36, 334, { pen: 'muted', single: true });
      d.rect(x, 336, 72, 30, { pen: 'violet', rough: 0.6, single: true, label: keys, size: 15, mono: true });
    }
  });
  d.text(380, 392, 'one node = one disk page:\nwide, shallow, few reads', { pen: 'muted', size: 14 });
};
