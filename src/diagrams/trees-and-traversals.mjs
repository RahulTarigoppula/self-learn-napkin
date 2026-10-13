export const meta = {
  title: 'One 7-node tree walked four ways: pre-order, in-order, post-order and level-order',
  width: 520,
  height: 410,
};

const R = 36; // node diameter
const OFF = 27; // distance of the walk-around contour from a node's centre
const P = {
  4: [240, 52],
  2: [160, 128],
  6: [320, 128],
  1: [120, 204],
  3: [200, 204],
  5: [280, 204],
  7: [360, 204],
};
const KIDS = { 4: [2, 6], 2: [1, 3], 6: [5, 7] };

function edge(d, a, b) {
  const [x1, y1] = P[a];
  const [x2, y2] = P[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const r = R / 2 + 2;
  d.line(x1 + ux * r, y1 + uy * r, x2 - ux * r, y2 - uy * r, { pen: 'muted', single: true });
}

/** Points of the "walk around the tree" contour: left of a node, then its left subtree, under it, right subtree, right of it. */
function tour(k, out = []) {
  const [x, y] = P[k];
  const [l, r] = KIDS[k] ?? [];
  out.push([x - OFF, y]);
  if (l) tour(l, out);
  out.push([x, y + OFF]);
  if (r) tour(r, out);
  out.push([x + OFF, y]);
  return out;
}

const ROWS = [
  ['pre-order', '4 2 1 3 6 5 7', 'node, left, right · copy', 'red'],
  ['in-order', '1 2 3 4 5 6 7', 'left, node, right · sorted', 'blue'],
  ['post-order', '1 3 2 5 7 6 4', 'left, right, node · delete', 'green'],
  ['level-order', '4 2 6 1 3 5 7', 'level by level · a queue', 'orange'],
];

function row(d, i) {
  const [name, seq, use, pen] = ROWS[i];
  const y = 290 + i * 32;
  d.group(() => {
    d.text(14, y, name, { pen, size: 16, anchor: 'start', bold: true });
    d.text(122, y, seq, { pen, size: 16, mono: true, anchor: 'start' });
    d.text(266, y, use, { pen: 'muted', size: 15, anchor: 'start' });
  });
}

function dots(d, pen, where) {
  d.group(() => {
    for (const k of Object.keys(P)) {
      const [x, y] = P[k];
      const [dx, dy] = where === 'left' ? [-OFF, 0] : where === 'below' ? [0, OFF] : [OFF, 0];
      d.circle(x + dx, y + dy, 10, { pen, single: true, thick: true, rough: 0.4 });
    }
  });
}

export default (d) => {
  d.step('Root, children, leaves, depth and height');
  d.group(() => {
    for (const [p, kids] of Object.entries(KIDS)) for (const c of kids) edge(d, Number(p), c);
    for (const k of Object.keys(P))
      d.circle(P[k][0], P[k][1], R, {
        pen: 'ink',
        fill: 'paper',
        rough: 0.8,
        single: true,
        label: k,
        size: 18,
        bold: true,
      });
  });
  d.group(() => {
    for (const [lv, y] of [
      [0, 52],
      [1, 128],
      [2, 204],
    ])
      d.text(14, y, `depth ${lv}`, { pen: 'muted', size: 15, anchor: 'start' });
  });
  d.text(272, 30, 'root', { pen: 'violet', size: 16, anchor: 'start' });
  d.text(240, 254, 'leaves: 1 3 5 7  ·  height = 2', { pen: 'muted', size: 15 });

  d.step('Pre-order: visit a node before its children');
  d.curve(tour(4), { pen: 'muted', dashed: true, thin: true, rough: 0.5, single: true });
  dots(d, 'red', 'left');
  row(d, 0);

  d.step('In-order: left subtree, node, right subtree');
  dots(d, 'blue', 'below');
  row(d, 1);

  d.step('Post-order: children first, node last');
  dots(d, 'green', 'right');
  row(d, 2);

  d.step('Level-order: breadth-first with a queue');
  d.text(456, 40, 'queue', { pen: 'orange', size: 16, bold: true });
  d.group(() => {
    ['[4]', '[2 6]', '[6 1 3]', '[1 3 5 7]'].forEach((q, i) =>
      d.text(456, 72 + i * 30, q, { pen: 'orange', size: 15, mono: true }),
    );
  });
  d.text(456, 206, 'pop the front,\npush its\nchildren', { pen: 'muted', size: 14 });
  row(d, 3);
};
