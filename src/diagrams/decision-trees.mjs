export const meta = { title: 'A decision tree splitting fourteen loans by debt and income, with Gini impurity at each step', width: 520, height: 420 };

// Scatter: debt 0..10 across, income 0..10 up.
const px = (v) => 44 + 21 * v;
const py = (v) => 232 - 19.5 * v;
const REPAID = [[0.8, 2.5], [1.2, 5.5], [2.8, 1.5], [3, 4.8], [1.8, 6.2], [6, 8], [8.2, 9]];
const DEFAULT = [[2, 4], [5, 2], [6.2, 5], [7, 3], [8.6, 6], [9, 1.5], [5.4, 5.6]];

// Tree layout (right).
const node = (d, x, y, w, label, pen, o = {}, h = 34) =>
  d.rect(x - w / 2, y - h / 2, w, h, { pen, fill: pen, label, size: 15, rough: 0.6, single: true, ...o });

export default (d) => {
  d.step('Fourteen loans');
  d.group(() => {
    d.line(px(0), py(0), px(10), py(0), { pen: 'muted', single: true });
    d.line(px(0), py(0), px(0), py(10), { pen: 'muted', single: true });
    d.text(px(10), py(0) + 16, 'debt →', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(px(0) + 4, py(10) - 12, 'income', { pen: 'muted', size: 15, anchor: 'start' });
    for (const v of [4, 7]) d.text(px(0) - 8, py(v), String(v), { pen: 'muted', size: 13, anchor: 'end' });
    d.text(px(4), py(0) + 14, '4', { pen: 'muted', size: 13 });
  });
  d.group(() => {
    for (const [a, b] of REPAID) d.dot(px(a), py(b), 11, { pen: 'blue', single: true });
    for (const [a, b] of DEFAULT) d.dot(px(a), py(b), 11, { pen: 'red', single: true });
    d.text(px(5), py(10) - 12, 'repaid', { pen: 'blue', size: 15, anchor: 'start', bold: true });
    d.text(px(7.9), py(10) - 12, 'default', { pen: 'red', size: 15, anchor: 'start', bold: true });
  });

  d.step('Measure the mix: Gini impurity');
  d.text(24, 274, 'all 14 loans, 7 : 7  →  Gini = 1 − 0.5² − 0.5² = 0.50', { pen: 'ink', size: 15, anchor: 'start' });

  d.step('Try every split, keep the purest');
  d.line(px(4), py(0), px(4), py(9.8), { pen: 'violet', dashed: true, thick: true });
  d.group(() => {
    node(d, 380, 40, 104, 'debt < 4 ?', 'violet', { bold: true });
    d.arrow(352, 58, 318, 100, { pen: 'muted', label: 'yes', labelDx: -16, size: 14, single: true });
    d.arrow(408, 58, 428, 100, { pen: 'muted', label: 'no', labelDx: 16, size: 14, single: true });
    node(d, 306, 118, 92, 'repaid 5:1', 'blue');
    node(d, 432, 118, 104, 'income ≥ 7 ?', 'violet', { bold: true });
  });
  d.text(24, 302, 'debt < 4:  left 5:1 → 0.28,  right 2:6 → 0.38', { pen: 'violet', size: 15, anchor: 'start' });
  d.text(24, 326, 'weighted 0.33  (income ≥ 7 gives only 0.42)', { pen: 'violet', size: 15, anchor: 'start', bold: true });

  d.step('Recurse on each side');
  d.line(px(4), py(7), px(10), py(7), { pen: 'green', dashed: true, thick: true });
  d.group(() => {
    d.arrow(416, 136, 404, 174, { pen: 'muted', single: true });
    d.arrow(452, 136, 474, 174, { pen: 'muted', single: true });
    node(d, 402, 196, 72, 'default\n0 : 6', 'red', { size: 14 }, 42);
    node(d, 478, 196, 60, 'repaid\n2 : 0', 'green', { size: 14 }, 42);
  });
  d.text(24, 354, 'right side: income ≥ 7 → two pure leaves, Gini 0', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Too deep: it memorises noise');
  d.rect(px(1.9), py(10), px(2.4) - px(1.9), py(0) - py(10), { pen: 'red', fill: 'red', fillStyle: 'hachure', gap: 6, single: true, rough: 0.5 });
  d.group(() => {
    d.line(306, 136, 306, 160, { pen: 'red', dashed: true });
    d.text(300, 180, '+2 splits for\none noisy loan', { pen: 'red', size: 14 });
  });
  d.text(24, 389, 'depth 3 carves a sliver around 1 point; cap max_depth\nor min_samples_leaf and keep the 5:1 leaf instead', { pen: 'red', size: 15, anchor: 'start' });
};
