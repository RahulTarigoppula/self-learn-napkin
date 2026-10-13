export const meta = {
  title: 'Sliding windows: a fixed window of 3, and the longest substring without repeats in "abcbad"',
  width: 520,
  height: 400,
};

// top: fixed window over numbers
const N = [2, 1, 5, 1, 3, 2];
const NW = 44;
const NX = 20;
const NY = 50;
const nx = (i) => NX + i * NW + NW / 2;

// bottom: variable window over a string
const S = 'abcbad';
const SW = 48;
const SX = 20;
const SY = 178;
const SH = 44;
const sx = (i) => SX + i * SW;

const bracket = (d, l, r, y, label, pen, bold = false) =>
  d.group(() => {
    d.poly(
      [
        [sx(l) + 4, y - 8],
        [sx(l) + 4, y],
        [sx(r + 1) - 4, y],
        [sx(r + 1) - 4, y - 8],
      ],
      { pen, thick: true, rough: 0.5 },
    );
    d.text(sx(r + 1) + 6, y - 3, label, { pen, size: 16, bold, anchor: 'start' });
  });

export default (d) => {
  d.step('Fixed window: add one, drop one');
  d.text(NX, 16, 'fixed k = 3: largest window sum', { pen: 'ink', size: 16, anchor: 'start' });
  d.group(() => {
    N.forEach((v, i) =>
      d.rect(NX + i * NW, NY, NW, 40, { pen: 'ink', rough: 0.6, label: String(v), size: 18, bold: true }),
    );
    N.forEach((_, i) => d.text(nx(i), NY + 52, String(i), { pen: 'muted', size: 14 }));
  });
  d.rect(NX + 2 * NW - 3, NY - 4, 3 * NW + 6, 48, { pen: 'blue', thick: true, rough: 0.5 });
  d.group(() => {
    d.text(nx(1), 38, '− 1', { pen: 'red', size: 16, bold: true });
    d.text(nx(4), 38, '+ 3', { pen: 'green', size: 16, bold: true });
  });
  d.text(318, 70, 'sums: 8, 7, 9, 6\n7 − 1 + 3 = 9 (max)', { pen: 'blue', size: 16, anchor: 'start' });

  d.step('Variable window: grow R while it is valid');
  d.line(20, 130, 500, 130, { pen: 'muted', dashed: true, thin: true });
  d.text(SX, 152, 'longest substring with no repeated letter', { pen: 'ink', size: 16, anchor: 'start' });
  d.group(() => {
    [...S].forEach((c, i) =>
      d.rect(sx(i), SY, SW, SH, { pen: 'ink', rough: 0.6, label: c, size: 20, bold: true }),
    );
    [...S].forEach((_, i) => d.text(sx(i) + SW / 2, SY + SH + 12, String(i), { pen: 'muted', size: 14 }));
  });
  bracket(d, 0, 2, 262, '"abc"  length 3', 'green');

  d.step('A repeat: shrink from the left');
  d.group(() => {
    for (const i of [1, 3])
      d.rect(sx(i) + 5, SY + 5, SW - 10, SH - 10, { pen: 'red', thick: true, rough: 0.6 });
  });
  bracket(d, 2, 3, 298, '"cb"  b repeated → L = 2', 'red');

  d.step('Grow again: the best window');
  bracket(d, 2, 5, 334, '"cbad"  length 4 ✓', 'green', true);
  d.text(SX, 362, 'the old a at index 0 is left of L: no repeat', {
    pen: 'muted',
    size: 15,
    anchor: 'start',
  });

  d.step('Both pointers only move right: O(n)');
  d.group(() => {
    const rows = [
      ['R', 'blue', [0, 1, 2, 3, 4, 5]],
      ['L', 'orange', [0, 0, 0, 2, 2, 2]],
    ];
    rows.forEach(([name, pen, vals], k) => {
      d.text(338, 186 + k * 26, name, { pen, size: 17, bold: true });
      vals.forEach((v, j) => d.text(366 + j * 24, 186 + k * 26, String(v), { pen, size: 17 }));
    });
    d.text(422, 238, 'never move back', { pen: 'muted', size: 15 });
  });
  d.text(SX, 388, 'each moves ≤ n times: ≤ 2n steps, so O(n)', {
    pen: 'blue',
    size: 16,
    bold: true,
    anchor: 'start',
  });
};
