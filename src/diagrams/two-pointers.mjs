export const meta = {
  title: 'Array memory layout and the two-pointer pair-sum walk',
  width: 520,
  height: 400,
};

const A = [1, 3, 4, 6, 8, 11, 13, 15];
const CW = 44;
const X0 = 20;
const CY = 74; // top of the cells
const CH = 44;
const cx = (i) => X0 + i * CW + CW / 2;
const VX = 388; // verdict column

const ROW0 = 198;
const DY = 44;

function row(d, k, l, r, pen, line1, line2) {
  const y = ROW0 + k * DY;
  d.group(() => {
    d.line(cx(l), y, cx(r), y, { pen: 'muted', thin: true, single: true });
    d.dot(cx(l), y, 12, { pen: 'violet', single: true });
    d.dot(cx(r), y, 12, { pen: 'blue', single: true });
    d.text(cx(l) - 12, y, 'L', { pen: 'violet', size: 16, bold: true, anchor: 'end' });
    d.text(cx(r) + 12, y, 'R', { pen: 'blue', size: 16, bold: true, anchor: 'start' });
    d.text(VX, y - 9, line1, { pen: 'ink', size: 16, anchor: 'start' });
    d.text(VX, y + 10, line2, { pen, size: 15, anchor: 'start' });
  });
}

const gone = (d, i) =>
  d.rect(X0 + i * CW + 3, CY + 3, CW - 6, CH - 6, {
    fill: 'muted',
    fillStyle: 'hachure',
    pen: 'muted',
    thin: true,
    rough: 0.7,
    single: true,
    gap: 9,
  });

export default (d) => {
  d.step('One block of memory, indexed by arithmetic');
  d.group(() => {
    A.forEach((v, i) => {
      d.rect(X0 + i * CW, CY, CW, CH, {
        pen: 'ink',
        rough: 0.7,
        single: true,
        label: String(v),
        size: 19,
        bold: true,
      });
    });
  });
  d.group(() => {
    A.forEach((_, i) => d.text(cx(i), CY + CH + 14, String(i), { pen: 'muted', size: 14 }));
    A.forEach((_, i) =>
      d.text(cx(i), CY - 12, String(1000 + 4 * i), {
        pen: i === 5 ? 'blue' : 'muted',
        size: 13,
        bold: i === 5,
      }),
    );
  });
  d.text(X0, 30, 'address of a[i] = base + 4 × i', { pen: 'blue', size: 17, anchor: 'start' });
  d.text(VX, 96, 'a[5] is at\n1000 + 4×5\n= 1020', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Pointers at both ends: 16 is too small');
  d.text(X0, 162, 'sorted · find a pair summing to 17', { pen: 'ink', size: 16, anchor: 'start' });
  row(d, 0, 0, 7, 'orange', '1 + 15 = 16', 'too small: L →');
  gone(d, 0);

  d.step('18 is too big: drop the 15');
  row(d, 1, 1, 7, 'red', '3 + 15 = 18', 'too big: ← R');
  gone(d, 7);

  d.step('16 again: move L');
  row(d, 2, 1, 6, 'orange', '3 + 13 = 16', 'too small: L →');
  gone(d, 1);

  d.step('17: found in 4 checks');
  row(d, 3, 2, 6, 'green', '4 + 13 = 17', 'found ✓');
  d.group(() => {
    d.rect(X0 + 2 * CW + 3, CY + 3, CW - 6, CH - 6, {
      pen: 'green',
      fill: 'green',
      thick: true,
      rough: 0.7,
      single: true,
    });
    d.rect(X0 + 6 * CW + 3, CY + 3, CW - 6, CH - 6, {
      pen: 'green',
      fill: 'green',
      thick: true,
      rough: 0.7,
      single: true,
    });
    d.text(cx(2), CY + CH / 2, '4', { pen: 'green', size: 19, bold: true });
    d.text(cx(6), CY + CH / 2, '13', { pen: 'green', size: 19, bold: true });
  });
  d.text(X0, 376, 'each check discards one value: ≤ n − 1 checks, O(n)', {
    pen: 'green',
    size: 16,
    anchor: 'start',
  });
};
