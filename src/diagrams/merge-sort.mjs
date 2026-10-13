export const meta = {
  title: 'Merge sort on [5,3,8,1,9,2,7,4]: split down, merge up',
  width: 520,
  height: 420,
};

const CW = 30;
const CH = 30;
const G = 14; // gap between groups
const X0 = 62;
const NX = 418; // note column

/** x of cell i when the row is cut into groups of `size` (rows stay centred on the same axis). */
const cellX = (i, size) => {
  const gaps = 8 / size - 1;
  return X0 + i * CW + Math.floor(i / size) * G + ((7 - gaps) * G) / 2;
};

function row(d, y, values, size, pen, note, notePen = 'muted') {
  d.group(() => {
    values.forEach((v, i) => {
      d.rect(cellX(i, size), y, CW, CH, {
        pen,
        fill: pen === 'ink' || pen === 'orange' ? undefined : pen,
        rough: 0.6,
        single: true,
        label: String(v),
        size: 17,
        bold: true,
        textPen: pen,
      });
    });
    if (note) d.text(NX, y + CH / 2, note, { pen: notePen, size: 15, anchor: 'start' });
  });
}

const Y = [18, 62, 106, 150, 210, 254, 298];

export default (d) => {
  d.step('Eight unsorted values');
  row(d, Y[0], [5, 3, 8, 1, 9, 2, 7, 4], 8, 'ink', 'n = 8');

  d.step('Halve until every piece has one value');
  row(d, Y[1], [5, 3, 8, 1, 9, 2, 7, 4], 4, 'ink', '');
  row(d, Y[2], [5, 3, 8, 1, 9, 2, 7, 4], 2, 'ink', '');
  row(d, Y[3], [5, 3, 8, 1, 9, 2, 7, 4], 1, 'orange', '');
  d.text(16, Y[1] + CH / 2, 'split', { pen: 'muted', size: 15, anchor: 'start' });
  d.text(NX, Y[2] + 8, 'log₂ 8 = 3\nlevels of\nhalving', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('Merge neighbours: 1 compare per pair');
  d.line(40, Y[4] - 16, 480, Y[4] - 16, { pen: 'muted', dashed: true, thin: true });
  row(d, Y[4], [3, 5, 1, 8, 2, 9, 4, 7], 2, 'blue', '4 × 1 = 4', 'blue');
  d.text(16, Y[4] + CH / 2, 'merge', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Merge sorted halves with two pointers');
  row(d, Y[5], [1, 3, 5, 8, 2, 4, 7, 9], 4, 'blue', '2 × 3 = 6', 'blue');
  d.text(20, 356, '[3 5]+[1 8]: 3 vs 1 → 1 · 3 vs 8 → 3 · 5 vs 8 → 5 · copy 8', {
    pen: 'blue',
    size: 15,
    anchor: 'start',
  });

  d.step('Final merge: 17 compares in all');
  row(d, Y[6], [1, 2, 3, 4, 5, 7, 8, 9], 8, 'green', '+ 7 = 17', 'green');
  d.text(20, 390, '3 levels × at most n compares each → O(n log n)', {
    pen: 'red',
    size: 16,
    bold: true,
    anchor: 'start',
  });
};
