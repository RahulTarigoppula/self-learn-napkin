export const meta = { title: 'Backtracking: the subsets decision tree and 4-queens with pruning', width: 520, height: 420 };

// subsets of [1, 2, 3]: left child = take, right child = skip
const LEVEL_Y = [34, 84, 134, 184];
const TREE = [
  [[260, '[ ]']],
  [[130, '[1]'], [390, '[ ]']],
  [[65, '[1,2]'], [195, '[1]'], [325, '[2]'], [455, '[ ]']],
  [[32, '[1,2,3]'], [97, '[1,2]'], [162, '[1,3]'], [227, '[1]'], [292, '[2,3]'], [357, '[2]'], [422, '[3]'], [487, '[ ]']],
];

const C = 28; // board cell
const BY = 240; // board top
const BOARDS = [34, 200, 366]; // board left edges

function board(d, bx) {
  d.group(() => {
    for (let k = 0; k <= 4; k++) {
      d.line(bx, BY + k * C, bx + 4 * C, BY + k * C, { pen: 'muted', single: true, rough: 0.5 });
      d.line(bx + k * C, BY, bx + k * C, BY + 4 * C, { pen: 'muted', single: true, rough: 0.5 });
    }
  });
}
const cell = (bx, r, c) => [bx + c * C + C / 2, BY + r * C + C / 2];
const queen = (d, bx, r, c, pen = 'blue') => d.text(...cell(bx, r, c), 'Q', { pen, size: 17, bold: true });
function deadRow(d, bx, r) {
  d.group(() => {
    for (let c = 0; c < 4; c++) d.text(...cell(bx, r, c), '✗', { pen: 'red', size: 15, bold: true });
  });
}

export default (d) => {
  d.step('Subsets: one take-or-skip decision per element');
  d.group(() => {
    for (let lv = 1; lv < 4; lv++)
      TREE[lv].forEach(([x], i) => {
        const [px] = TREE[lv - 1][i >> 1];
        d.line(px, LEVEL_Y[lv - 1] + 10, x, LEVEL_Y[lv] - 10, { pen: 'muted', single: true, rough: 0.6 });
      });
    TREE.forEach((lvl, lv) =>
      lvl.forEach(([x, s]) => d.text(x, LEVEL_Y[lv], s, { pen: lv === 3 ? 'green' : 'ink', mono: true, size: lv === 3 ? 13 : 14, bold: lv === 3 })),
    );
  });
  d.group(() => {
    d.text(14, 59, '1?', { pen: 'violet', size: 15, anchor: 'start', bold: true });
    d.text(14, 109, '2?', { pen: 'violet', size: 15, anchor: 'start', bold: true });
    d.text(14, 159, '3?', { pen: 'violet', size: 15, anchor: 'start', bold: true });
    d.text(176, 50, 'take', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(344, 50, 'skip', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('Choose, explore, unchoose');
  d.group(() => {
    const pts = [[260, 44], [130, 74], [130, 94], [195, 124], [195, 144], [162, 174]];
    d.line(...pts[0], ...pts[1], { pen: 'orange', thick: true, single: true });
    d.line(...pts[2], ...pts[3], { pen: 'orange', thick: true, single: true });
    d.line(...pts[4], ...pts[5], { pen: 'orange', thick: true, single: true });
  });
  d.arrow(146, 170, 178, 136, { pen: 'red', dashed: true, bend: -12, headSize: 8 });
  d.text(260, 212, 'path [1] → take 3 → [1,3] → record → pop → [1]', { pen: 'red', size: 15 });

  d.step('4-queens: row 2 has no safe square');
  board(d, BOARDS[0]);
  d.group(() => {
    queen(d, BOARDS[0], 0, 0);
    queen(d, BOARDS[0], 1, 2);
  });
  deadRow(d, BOARDS[0], 2);
  d.text(BOARDS[0] + 2 * C, 378, 'dead end:\nprune, undo', { pen: 'red', size: 15 });

  d.step('Backtrack: move the row-1 queen');
  board(d, BOARDS[1]);
  d.group(() => {
    queen(d, BOARDS[1], 0, 0);
    queen(d, BOARDS[1], 1, 3, 'orange');
    queen(d, BOARDS[1], 2, 1);
  });
  deadRow(d, BOARDS[1], 3);
  d.text(BOARDS[1] + 2 * C, 378, 'row 3 dead too:\nback up to row 0', { pen: 'red', size: 15 });

  d.step('Row 0 → column 1: a solution');
  board(d, BOARDS[2]);
  d.group(() => {
    queen(d, BOARDS[2], 0, 1, 'green');
    queen(d, BOARDS[2], 1, 3, 'green');
    queen(d, BOARDS[2], 2, 0, 'green');
    queen(d, BOARDS[2], 3, 2, 'green');
  });
  d.text(BOARDS[2] + 2 * C, 378, 'columns [1,3,0,2]\n8 placements tried', { pen: 'green', size: 15, bold: true });
};
