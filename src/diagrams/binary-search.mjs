export const meta = { title: 'Binary search for 11 in a sorted array of eight', width: 520, height: 390 };

const A = [1, 3, 5, 7, 9, 11, 13, 15];
const CW = 52;
const X0 = 52;
const CY = 112;
const CH = 48;
const cx = (i) => X0 + i * CW + CW / 2;
const IY = CY + CH + 15; // index labels
const LOG = 52; // left edge of the probe log

const below = (d, i, label, pen) =>
  d.group(() => {
    d.arrow(cx(i), IY + 46, cx(i), IY + 14, { pen, thick: true });
    d.text(cx(i), IY + 60, label, { pen, size: 17, bold: true });
  });

const above = (d, i, pen) =>
  d.group(() => {
    d.arrow(cx(i), CY - 50, cx(i), CY - 8, { pen, thick: true });
    d.text(cx(i), CY - 64, 'mid', { pen, size: 17, bold: true });
  });

export default (d) => {
  d.step('A sorted array with lo and hi');
  d.group(() => {
    A.forEach((v, i) =>
      d.rect(X0 + i * CW, CY, CW, CH, {
        pen: 'ink',
        rough: 0.7,
        single: true,
        label: String(v),
        size: 20,
        bold: true,
      }),
    );
    A.forEach((_, i) => d.text(cx(i), IY, String(i), { pen: 'muted', size: 15 }));
  });
  d.text(14, 26, 'target = 11', { pen: 'blue', size: 18, bold: true, anchor: 'start' });
  below(d, 0, 'lo', 'violet');
  below(d, 7, 'hi', 'violet');

  d.step('Probe the middle');
  above(d, 3, 'red');
  d.text(LOG, 292, 'probe 1: mid = (0 + 7) / 2 = 3,  a[3] = 7 < 11', {
    pen: 'red',
    size: 16,
    anchor: 'start',
  });

  d.step('Target is bigger: discard the left half');
  d.rect(X0 - 4, CY - 6, CW * 4 + 4, IY + 64 - CY, {
    fill: 'muted',
    fillStyle: 'hachure',
    pen: 'muted',
    thin: true,
    rough: 0.8,
    single: true,
    gap: 6,
  });
  below(d, 4, 'lo', 'violet');
  d.text(LOG, 318, 'so 11 can only be right of index 3:  lo = 4', {
    pen: 'violet',
    size: 16,
    anchor: 'start',
  });

  d.step('Probe the middle of what is left');
  above(d, 5, 'red');
  d.text(LOG, 344, 'probe 2: mid = (4 + 7) / 2 = 5,  a[5] = 11', { pen: 'red', size: 16, anchor: 'start' });

  d.step('Found it');
  d.rect(X0 + 5 * CW + 4, CY + 4, CW - 8, CH - 8, {
    pen: 'green',
    fill: 'green',
    thick: true,
    rough: 0.7,
    single: true,
    label: '11',
    size: 20,
    bold: true,
    textPen: 'green',
  });
  d.text(LOG, 372, 'found at index 5 in 2 probes  ✓', {
    pen: 'green',
    size: 17,
    bold: true,
    anchor: 'start',
  });
  d.text(506, 26, '1,000,000 items: ≤ 20 probes', { pen: 'green', size: 16, anchor: 'end' });
};
