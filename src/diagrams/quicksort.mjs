export const meta = {
  title: 'Quicksort with Lomuto partition on [5,3,8,1,9,2,7,4]',
  width: 520,
  height: 420,
};

const CW = 36;
const CH = 32;
const X0 = 88;
const NX = 396; // note column
const cx = (i) => X0 + i * CW + CW / 2;

/** One array row; pens[i] colours cell i (ink = untouched). `gaps` lists indices followed by a small visual gap. */
function row(d, y, values, pens, label, gaps = []) {
  d.group(() => {
    d.text(14, y + CH / 2, label, { pen: 'muted', size: 15, anchor: 'start' });
    values.forEach((v, i) => {
      const pen = pens[i] ?? 'ink';
      const shift = gaps.filter((g) => i > g).length * 7 - gaps.length * 3;
      d.rect(X0 + i * CW + shift, y, CW, CH, {
        pen,
        fill: pen === 'ink' ? undefined : pen,
        rough: 0.6,
        single: true,
        label: String(v),
        size: 18,
        bold: true,
        textPen: pen,
      });
    });
  });
}

const Y = [36, 102, 168, 234];
const G = 'green';
const B = 'blue';
const R = 'red';

export default (d) => {
  d.step('Pick the last value as the pivot');
  row(d, Y[0], [5, 3, 8, 1, 9, 2, 7, 4], ['ink', 'ink', 'ink', 'ink', 'ink', 'ink', 'ink', R], 'start');
  d.text(cx(7), Y[0] - 14, 'pivot', { pen: R, size: 15 });
  d.text(NX, Y[0] + CH / 2, 'pivot = 4', { pen: R, size: 15, anchor: 'start' });

  d.step('Scan once: values ≤ 4 swap to the front');
  row(d, Y[1], [3, 1, 2, 5, 9, 8, 7, 4], [G, G, G, B, B, B, B, R], 'scan');
  d.group(() => {
    d.line(X0 + 3 * CW, Y[1] - 8, X0 + 3 * CW, Y[1] + CH + 8, { pen: 'ink', thick: true, rough: 0.5 });
    d.text(X0 + 3 * CW, Y[1] - 18, 'i', { pen: 'ink', size: 15, bold: true });
  });
  d.text(NX, Y[1] + CH / 2, '3 swaps:\n3↔5, 1↔5,\n2↔8', { pen: G, size: 14, anchor: 'start' });

  d.step('Swap the pivot into slot i: it is final');
  d.arrow(cx(3), Y[1] + CH + 5, cx(7), Y[1] + CH + 5, { pen: R, both: true, bend: 12, thin: true });
  row(d, Y[2], [3, 1, 2, 4, 9, 8, 7, 5], [G, G, G, R, B, B, B, B], 'place');
  d.text(NX, Y[2] + CH / 2, '7 compares,\n4 is home', { pen: R, size: 15, anchor: 'start' });

  d.step('Recurse on each side');
  row(d, Y[3], [1, 2, 3, 4, 5, 7, 8, 9], [G, G, G, G, G, G, G, G], 'recurse', [2, 3]);
  d.text(NX, Y[3] + CH / 2, '15 compares\nin total', { pen: G, size: 15, anchor: 'start' });

  d.step('Sorted input + last pivot = worst case');
  d.text(14, 296, 'sorted [1..8], pivot = last:', { pen: R, size: 15, anchor: 'start' });
  d.group(() => {
    for (let k = 0; k < 7; k++) {
      const n = 8 - k;
      d.rect(16, 310 + k * 14, n * 22, 10, { pen: R, fill: R, rough: 0.5, thin: true });
    }
  });
  d.text(214, 330, 'each split peels off one value', { pen: 'ink', size: 15, anchor: 'start' });
  d.text(214, 356, '7+6+…+1 = 28 compares = O(n²)', { pen: R, size: 15, bold: true, anchor: 'start' });
  d.text(214, 384, 'fix: random or median-of-3 pivot', { pen: G, size: 15, anchor: 'start' });
};
