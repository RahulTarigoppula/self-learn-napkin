export const meta = {
  title: 'Sorting landscape: comparison vs non-comparison, the decision-tree lower bound, stability',
  width: 520,
  height: 420,
};

// Decision tree for sorting three items a, b, c (insertion-sort order of questions).
const Y = [112, 162, 212, 262];
const NODE_W = 64;
const NODE_H = 28;
const LEAF_W = 48;
const LEAF_H = 26;

const node = (d, x, y, q) => d.ellipse(x, y, NODE_W, NODE_H, { pen: 'blue', label: q, size: 15, rough: 0.7 });
const leaf = (d, x, y, s) =>
  d.rect(x - LEAF_W / 2, y - LEAF_H / 2, LEAF_W, LEAF_H, {
    pen: 'green',
    fill: 'green',
    rough: 0.6,
    label: s,
    size: 16,
    bold: true,
    textPen: 'green',
  });
const edge = (d, x1, y1, x2, y2, h2 = NODE_H) =>
  d.line(x1, y1 + NODE_H / 2, x2, y2 - h2 / 2, { pen: 'muted', thin: true, rough: 0.6 });

export default (d) => {
  d.step('Two families of sorting algorithms');
  d.group(() => {
    d.rect(16, 14, 236, 62, { pen: 'blue', fill: 'blue', rough: 0.7 });
    d.text(134, 34, 'comparison sorts', { pen: 'blue', size: 17, bold: true });
    d.text(134, 58, 'only ask: is a < b ?', { pen: 'ink', size: 15 });
  });
  d.group(() => {
    d.rect(268, 14, 236, 62, { pen: 'violet', fill: 'violet', rough: 0.7 });
    d.text(386, 34, 'non-comparison sorts', { pen: 'violet', size: 17, bold: true });
    d.text(386, 58, 'read the key itself (digits)', { pen: 'ink', size: 15 });
  });

  d.step('A comparison sort is a tree of questions');
  d.group(() => {
    // edges first so node outlines sit on top
    edge(d, 180, Y[0], 100, Y[1]);
    edge(d, 180, Y[0], 260, Y[1]);
    edge(d, 100, Y[1], 60, Y[2], LEAF_H);
    edge(d, 100, Y[1], 140, Y[2]);
    edge(d, 260, Y[1], 220, Y[2], LEAF_H);
    edge(d, 260, Y[1], 300, Y[2]);
    edge(d, 140, Y[2], 105, Y[3], LEAF_H);
    edge(d, 140, Y[2], 175, Y[3], LEAF_H);
    edge(d, 300, Y[2], 265, Y[3], LEAF_H);
    edge(d, 300, Y[2], 335, Y[3], LEAF_H);
    node(d, 180, Y[0], 'a<b?');
    node(d, 100, Y[1], 'b<c?');
    node(d, 260, Y[1], 'a<c?');
    node(d, 140, Y[2], 'a<c?');
    node(d, 300, Y[2], 'b<c?');
    d.text(124, 128, 'yes', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(236, 128, 'no', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('3! = 6 orders need 6 leaves, so 3 levels');
  d.group(() => {
    leaf(d, 60, Y[2], 'abc');
    leaf(d, 220, Y[2], 'bac');
    leaf(d, 105, Y[3], 'acb');
    leaf(d, 175, Y[3], 'cab');
    leaf(d, 265, Y[3], 'bca');
    leaf(d, 335, Y[3], 'cba');
  });
  d.arrow(384, Y[0] - 10, 384, Y[3] + 10, { pen: 'red', both: true, thick: true });
  d.text(398, 170, 'height ≥\nlog₂ 6 ≈ 2.6\n→ 3 compares\nworst case', {
    pen: 'red',
    size: 15,
    anchor: 'start',
  });
  d.text(260, 304, 'n items: n! leaves → height ≥ log₂ n! ≈ n log₂ n', { pen: 'red', size: 16, bold: true });

  d.step('Stable: equal keys keep their order');
  d.group(() => {
    const cell = (x, v, pen) =>
      d.rect(x, 330, 32, 30, {
        pen,
        fill: pen === 'ink' ? undefined : pen,
        rough: 0.6,
        label: v,
        size: 17,
        bold: true,
        textPen: pen,
      });
    cell(20, '2', 'blue');
    cell(52, '1', 'ink');
    cell(84, '2', 'orange');
    d.arrow(126, 345, 168, 345, { pen: 'muted' });
    cell(176, '1', 'ink');
    cell(208, '2', 'blue');
    cell(240, '2', 'orange');
    d.text(284, 345, 'blue 2 still before orange 2', { pen: 'green', size: 15, anchor: 'start' });
  });

  d.step('What real libraries ship');
  d.text(20, 384, 'Python, Java objects, V8: Timsort (merge + insertion)', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
  d.text(20, 404, 'C++ std::sort: introsort (quick + heap + insertion)', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
};
