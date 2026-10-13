export const meta = { title: 'Bubble sort passes over [5,3,8,1,9,2,7,4]', width: 520, height: 420 };

const CW = 38;
const CH = 34;
const X0 = 100;
const cx = (i) => X0 + i * CW + CW / 2;
const RX = 418; // right column

/** One array state: cells, the settled suffix in green, a row label and a note on the right. */
function row(d, y, values, settled, label, note, notePen = 'muted') {
  d.group(() => {
    d.text(14, y + CH / 2, label, { pen: 'muted', size: 16, anchor: 'start' });
    values.forEach((v, i) => {
      const done = i >= values.length - settled;
      d.rect(X0 + i * CW, y, CW, CH, {
        pen: done ? 'green' : 'ink',
        fill: done ? 'green' : undefined,
        rough: 0.6,
        single: true,
        label: String(v),
        size: 18,
        bold: true,
        textPen: done ? 'green' : 'ink',
      });
    });
    if (note) d.text(RX, y + CH / 2, note, { pen: notePen, size: 16, anchor: 'start' });
  });
}

export default (d) => {
  d.step('Eight values in a row');
  row(d, 74, [5, 3, 8, 1, 9, 2, 7, 4], 0, 'start', '');

  d.step('Compare the first pair; swap if out of order');
  d.arrow(cx(0), 66, cx(1), 66, { pen: 'red', both: true, bend: -16, thick: true });
  d.text(cx(0) + CW / 2, 30, '5 > 3: swap', { pen: 'red', size: 17 });
  d.text(cx(2) + 14, 46, 'then 5 vs 8, 8 vs 1, …', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('After pass 1, the 9 is parked at the end');
  d.arrow(cx(4), 112, cx(7) - 4, 150, { pen: 'orange', thick: true, bend: 10 });
  d.text(RX, 124, 'the 9 rides\nto the end', { pen: 'orange', size: 15, anchor: 'start' });
  row(d, 156, [3, 5, 1, 8, 2, 7, 4, 9], 1, 'pass 1', '5 swaps');

  d.step('Each pass parks one more');
  row(d, 206, [3, 1, 5, 2, 7, 4, 8, 9], 2, 'pass 2', '4 swaps');
  row(d, 256, [1, 3, 2, 5, 4, 7, 8, 9], 3, 'pass 3', '3 swaps');
  row(d, 306, [1, 2, 3, 4, 5, 7, 8, 9], 4, 'pass 4', '2 swaps');

  d.step('A clean pass means sorted: stop early');
  d.group(() => {
    d.text(14, 370, 'pass 5', { pen: 'muted', size: 16, anchor: 'start' });
    d.text(X0, 370, '0 swaps → already sorted, stop', {
      pen: 'green',
      size: 17,
      bold: true,
      anchor: 'start',
    });
  });
  d.text(X0, 398, 'total: 25 compares, 14 swaps', { pen: 'ink', size: 16, anchor: 'start' });
};
