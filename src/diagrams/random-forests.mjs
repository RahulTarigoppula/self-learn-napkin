export const meta = { title: 'Random forest: bootstrap samples, trees on random features, a majority vote, out-of-bag rows and falling variance', width: 520, height: 420 };

const CW = 26; // cell width
const X0 = 86;
const cx = (i) => X0 + CW * i;
const ROWS = [
  { name: 'tree 1', y: 70, rows: [3, 7, 7, 1, 9, 2, 9, 5, 10, 3], oob: '4, 6, 8' },
  { name: 'tree 2', y: 102, rows: [6, 2, 8, 8, 4, 1, 6, 4, 4, 5], oob: '3, 7, 9, 10' },
  { name: 'tree 3', y: 134, rows: [5, 9, 2, 9, 6, 6, 1, 3, 9, 8], oob: '4, 7, 10' },
];
const TREES = [
  { x: 112, f: 'x2', vote: 'A', pen: 'blue' },
  { x: 212, f: 'x7', vote: 'B', pen: 'red' },
  { x: 312, f: 'x5', vote: 'A', pen: 'blue' },
];

const cells = (d, y, labels, o = {}) => {
  const pen = o.pen ?? 'muted';
  const top = y - 12;
  const bot = y + 12;
  // outline + one serpentine stroke for the dividers: 2 paths instead of 10 boxes
  d.group(() => {
    d.rect(cx(0), top, CW * labels.length, 24, { pen, rough: 0.4, single: true });
    const pts = [];
    for (let i = 1; i < labels.length; i++) pts.push(...(i % 2 ? [[cx(i), top], [cx(i), bot]] : [[cx(i), bot], [cx(i), top]]));
    d.poly(pts, { pen, rough: 0.3, single: true, thin: true });
    labels.forEach((v, i) => d.text(cx(i) + CW / 2, y, String(v), { pen: o.textPen ?? 'ink', size: 14, mono: true }));
  });
};

const tinyTree = (d, x, y, f) => {
  d.group(() => {
    d.poly([[x - 26, y + 38], [x, y + 10], [x + 26, y + 38]], { pen: 'green', single: true });
    for (const dx of [-26, 26]) d.poly([[x + dx - 13, y + 62], [x + dx, y + 38], [x + dx + 13, y + 62]], { pen: 'green', single: true });
    d.circle(x, y, 26, { pen: 'green', fill: 'green', single: true, label: f, size: 13, mono: true, textPen: 'ink' });
  });
};

// Error vs number of trees (bottom-right).
const ex = (b) => 388 + 112 * (Math.log10(b) / 2.3);
const ey = (e) => 352 - 300 * e;
// error = floor (bias², noise and the ρσ² term) + (1 − ρ)σ²/B: falls like 1/B, then flattens
const err = (b) => 0.11 + 0.144 / b;

export default (d) => {
  d.step('One training set: ten rows');
  d.text(X0 - 10, 34, 'data', { pen: 'ink', size: 15, anchor: 'end', bold: true });
  cells(d, 34, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { pen: 'ink' });

  d.step('Bootstrap: draw 10 rows with replacement');
  for (const r of ROWS) {
    d.group(() => {
      d.text(X0 - 10, r.y, r.name, { pen: 'green', size: 14, anchor: 'end' });
    });
    cells(d, r.y, r.rows, { pen: 'green' });
  }
  d.group(() => {
    d.text(366, 34, 'out-of-bag', { pen: 'muted', size: 14, anchor: 'start', bold: true });
    for (const r of ROWS) d.text(366, r.y, r.oob, { pen: 'muted', size: 14, anchor: 'start', mono: true });
  });

  d.step('A tree per sample, random features per split');
  for (const t of TREES) tinyTree(d, t.x, 182, t.f);
  d.text(212, 264, 'each split: √p random features (3 of 9)', { pen: 'green', size: 14 });

  d.step('Majority vote');
  d.group(() => {
    for (const t of TREES) {
      d.text(t.x, 290, t.vote, { pen: t.pen, size: 18, bold: true });
      d.arrow(t.x, 302, 212 + (t.x - 212) * 0.3, 330, { pen: 'muted', single: true, headSize: 8 });
    }
  });
  d.rect(117, 336, 190, 30, { pen: 'blue', fill: 'blue', rough: 0.6, label: 'forest says A (2 of 3)', size: 15, bold: true });

  d.step('Out-of-bag rows: a free test set');
  d.group(() => {
    d.circle(370, ROWS[0].y, 20, { pen: 'orange', thick: true });
    d.circle(370, ROWS[2].y, 20, { pen: 'orange', thick: true });
  });
  d.text(24, 396, 'row 4: unseen by trees 1 and 3 → only they predict it', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('More trees: lower variance');
  d.group(() => {
    d.line(ex(1), ey(0), ex(200), ey(0), { pen: 'muted', single: true });
    d.line(ex(1), ey(0), ex(1), ey(0.3), { pen: 'muted', single: true });
    d.text(ex(200), ey(0) + 13, '# trees', { pen: 'muted', size: 13, anchor: 'end' });
    d.text(ex(1) + 4, ey(0.3) - 10, 'test error', { pen: 'muted', size: 13, anchor: 'start' });
    d.line(ex(1), ey(err(1)), ex(200), ey(err(1)), { pen: 'red', dashed: true, thin: true });
    d.text(ex(200), ey(err(1)) - 10, '1 tree', { pen: 'red', size: 13, anchor: 'end' });
  });
  d.curve(Array.from({ length: 16 }, (_, i) => {
    const b = 10 ** ((i / 15) * 2.3);
    return [ex(b), ey(err(b))];
  }), { pen: 'violet', thick: true, rough: 0.5 });
  d.text(ex(200), ey(0.11) + 16, 'forest', { pen: 'violet', size: 14, anchor: 'end', bold: true });
};
