export const meta = {
  title:
    'A B+tree index: full scan vs a three-level lookup, fan-out, range scan along linked leaves, and a page split',
  width: 520,
  height: 420,
};

const ROOT = { cx: 220, y: 24 };
const MID = [100, 220, 340]; // internal node centres
const MID_Y = 104;
const LEAF_Y = 190;
const LEAVES = [14, 114, 214]; // leaf x positions, width 80
const HEAP_Y = 298;

export default (d) => {
  // a page holding keys: one cell per key
  const node = (cx, y, keys, o = {}) => {
    const w = 44;
    const x0 = cx - (keys.length * w) / 2;
    keys.forEach((k, i) =>
      d.rect(x0 + i * w, y, w, 32, {
        pen: 'blue',
        fill: 'blue',
        rough: 0.6,
        label: k,
        mono: true,
        size: 14,
        textPen: 'ink',
        ...o,
      }),
    );
  };

  d.step('No index: scan every page');
  d.text(14, 24, 'WHERE id = 142', { pen: 'blue', mono: true, size: 15, anchor: 'start', bold: true });
  d.group(() => {
    ['518, 7', '142, 960', '33, 401', '777, 12'].forEach((t, i) =>
      d.rect(14 + i * 80, HEAP_Y, 72, 30, {
        pen: 'muted',
        fill: 'muted',
        rough: 0.6,
        label: t,
        mono: true,
        size: 14,
        textPen: 'ink',
      }),
    );
    d.text(170, HEAP_Y + 46, 'table rows, unsorted', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    d.arrow(14, 366, 326, 366, { pen: 'red', thick: true });
    d.text(170, 388, 'no index: read every page, O(n)', { pen: 'red', size: 15 });
  });

  d.step('A B+tree: sorted pages, many keys each');
  d.group(() => {
    node(ROOT.cx, ROOT.y, ['300', '600']);
    for (const [cx, keys] of [
      [MID[0], ['100', '200']],
      [MID[1], ['400', '500']],
      [MID[2], ['700', '800']],
    ])
      node(cx, MID_Y, keys);
    d.line(182, 56, MID[0], MID_Y, { pen: 'muted' });
    d.line(220, 56, MID[1], MID_Y, { pen: 'muted' });
    d.line(258, 56, MID[2], MID_Y, { pen: 'muted' });
  });
  d.group(() => {
    ['1–99', '100–199', '200–299'].forEach((t, i) =>
      d.rect(LEAVES[i], LEAF_Y, 80, 32, {
        pen: 'green',
        fill: 'green',
        rough: 0.6,
        label: t,
        mono: true,
        size: 14,
        textPen: 'ink',
      }),
    );
    d.line(62, 136, 54, LEAF_Y, { pen: 'muted' });
    d.line(100, 136, 154, LEAF_Y, { pen: 'muted' });
    d.line(138, 136, 254, LEAF_Y, { pen: 'muted' });
    d.line(MID[1], 136, MID[1] + 30, 166, { pen: 'muted', dashed: true });
    d.line(MID[2], 136, MID[2] + 30, 166, { pen: 'muted', dashed: true });
    d.arrow(96, LEAF_Y + 16, 112, LEAF_Y + 16, { pen: 'green', both: true, thin: true, headSize: 7 });
    d.arrow(196, LEAF_Y + 16, 212, LEAF_Y + 16, { pen: 'green', both: true, thin: true, headSize: 7 });
    d.text(316, LEAF_Y + 16, '…', { pen: 'green', size: 18, bold: true });
  });

  d.step('Lookup: root, inner page, leaf');
  d.arrow(182, 56, MID[0] + 4, MID_Y - 2, { pen: 'red', thick: true });
  d.arrow(100, 136, 152, LEAF_Y - 2, { pen: 'red', thick: true });
  d.arrow(146, 224, 132, HEAP_Y - 4, { pen: 'red', thick: true });
  d.text(176, 244, '142: 3 page reads + the row', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Fan-out: why 3–4 levels are enough');
  d.text(508, 40, '1 page', { pen: 'violet', size: 15, anchor: 'end', bold: true });
  d.text(508, 120, '100 pages', { pen: 'violet', size: 15, anchor: 'end', bold: true });
  d.text(508, 198, '10,000 leaves', { pen: 'violet', size: 15, anchor: 'end', bold: true });
  d.text(508, 218, '≈ 1M keys', { pen: 'violet', size: 15, anchor: 'end' });

  d.step('Range scan: walk the linked leaves');
  d.arrow(196, LEAF_Y + 16, 212, LEAF_Y + 16, { pen: 'green', thick: true, headSize: 8 });
  d.text(176, 268, 'id 150–250: follow the links →', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Writes: pages split, every index pays');
  d.text(426, 296, 'insert 143, leaf full', { pen: 'orange', size: 14 });
  d.rect(346, 310, 160, 28, {
    pen: 'green',
    fill: 'green',
    rough: 0.6,
    label: '100–199',
    mono: true,
    size: 14,
    textPen: 'ink',
  });
  d.arrow(426, 340, 426, 356, { pen: 'orange' });
  d.group(() => {
    d.rect(346, 360, 76, 28, {
      pen: 'orange',
      fill: 'orange',
      rough: 0.6,
      label: '100–149',
      mono: true,
      size: 14,
      textPen: 'ink',
    });
    d.rect(430, 360, 76, 28, {
      pen: 'orange',
      fill: 'orange',
      rough: 0.6,
      label: '150–199',
      mono: true,
      size: 14,
      textPen: 'ink',
    });
  });
  d.text(426, 402, 'parent gets key 150', { pen: 'orange', size: 14 });
};
