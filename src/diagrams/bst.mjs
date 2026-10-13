export const meta = {
  title: 'Binary search tree: inserts, a search path and a degenerate chain',
  width: 520,
  height: 400,
};

const R = 38; // node diameter
const P = {
  8: [190, 52],
  3: [105, 124],
  10: [275, 124],
  1: [58, 196],
  6: [150, 196],
  14: [330, 196],
  4: [118, 268],
  7: [182, 268],
  13: [298, 268],
};

/** Edge from the bottom of parent to the top of child (stops at the circles). */
function edge(d, a, b, o = { pen: 'muted' }) {
  const [x1, y1] = P[a];
  const [x2, y2] = P[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const r = R / 2 + 2;
  d.line(x1 + ux * r, y1 + uy * r, x2 - ux * r, y2 - uy * r, o);
}

function node(d, k, parent, o = {}, eo = { pen: 'muted' }) {
  d.group(() => {
    if (parent !== undefined) edge(d, parent, k, eo);
    d.circle(P[k][0], P[k][1], R, {
      pen: 'ink',
      fill: 'paper',
      rough: 0.8,
      single: true,
      label: String(k),
      size: 18,
      bold: true,
      ...o,
    });
  });
}

export default (d) => {
  d.step('Smaller to the left, bigger to the right');
  node(d, 8);
  node(d, 3, 8, { pen: 'blue', fill: 'blue' });
  node(d, 10, 8, { pen: 'blue', fill: 'blue' });
  d.text(14, 330, 'left subtree < node < right subtree', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Each insert walks down to an empty spot');
  node(d, 1, 3, { pen: 'blue', fill: 'blue' });
  node(d, 6, 3, { pen: 'blue', fill: 'blue' });
  node(d, 14, 10, { pen: 'blue', fill: 'blue' });

  d.step('Insert 4, 7 and 13');
  node(d, 4, 6, { pen: 'blue', fill: 'blue' });
  node(d, 7, 6, { pen: 'blue', fill: 'blue' });
  d.group(() => {
    edge(d, 8, 10, { pen: 'orange', thick: true });
    edge(d, 10, 14, { pen: 'orange', thick: true });
  });
  node(d, 13, 14, { pen: 'orange', fill: 'orange' }, { pen: 'orange', thick: true });
  d.text(14, 356, '13: right of 8, right of 10, left of 14', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('Search for 6: one path, top to bottom');
  d.group(() => {
    edge(d, 8, 3, { pen: 'red', thick: true });
    d.text(118, 76, '6 < 8', { pen: 'red', size: 16, anchor: 'end' });
  });
  d.group(() => {
    edge(d, 3, 6, { pen: 'red', thick: true });
    d.text(138, 152, '6 > 3', { pen: 'red', size: 16, anchor: 'start' });
  });
  d.circle(P[6][0], P[6][1], R + 10, { pen: 'green', thick: true, rough: 0.9 });
  d.text(14, 382, 'search 6: 3 comparisons, one per level', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Sorted inserts build a chain');
  d.line(360, 24, 360, 312, { pen: 'muted', dashed: true, thin: true });
  d.text(436, 34, 'insert in order:\n1, 2, 3, 4, 5', { pen: 'red', size: 15 });
  d.group(() => {
    const pts = [1, 2, 3, 4, 5].map((v, i) => [384 + i * 26, 88 + i * 52]);
    pts.forEach(([x, y], i) => {
      if (i > 0) {
        const [px, py] = pts[i - 1];
        d.line(px + 8, py + 18, x - 8, y - 18, { pen: 'muted' });
      }
      d.circle(x, y, 34, {
        pen: 'red',
        fill: 'red',
        rough: 0.8,
        single: true,
        label: String(i + 1),
        size: 17,
        bold: true,
      });
    });
  });
  d.text(436, 350, 'a linked list:\nsearch is O(n)', { pen: 'red', size: 15 });
};
