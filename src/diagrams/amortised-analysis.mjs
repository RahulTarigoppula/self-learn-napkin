export const meta = {
  title: 'Dynamic array doubling: cost of each append and the amortised bound',
  width: 520,
  height: 420,
};

// Bar chart frame: append number k = 1..17 across, cost up.
const BX = 58; // x of the first bar
const STEP = 24;
const BW = 16;
const BASE = 370;
const UNIT = 11;
const N = 17;
const bx = (k) => BX + (k - 1) * STEP;
const isPow2 = (m) => m > 0 && (m & (m - 1)) === 0;
// Capacity starts at 1 and doubles: append k finds the array full when k − 1 is a power of two.
const cost = (k) => (isPow2(k - 1) ? k : 1); // 1 write + (k − 1) copies

function bar(d, k, pen) {
  const h = cost(k) * UNIT;
  d.rect(bx(k), BASE - h, BW, h, { pen, fill: pen, rough: 0.5, thin: true });
}

export default (d) => {
  d.step('An array that doubles when it is full');
  d.group(() => {
    'abcd'
      .split('')
      .forEach((c, i) =>
        d.rect(24 + i * 30, 30, 30, 30, { pen: 'ink', fill: 'muted', rough: 0.6, label: c, size: 17 }),
      );
    d.text(84, 76, 'full: capacity 4', { pen: 'muted', size: 15 });
  });
  d.arrow(152, 45, 208, 45, { pen: 'red', thick: true, label: 'copy 4', size: 15, labelDy: -17 });
  d.group(() => {
    'abcde   '
      .split('')
      .forEach((c, i) =>
        d.rect(218 + i * 30, 30, 30, 30, {
          pen: c === 'e' ? 'orange' : 'ink',
          fill: c === 'e' ? 'orange' : c === ' ' ? undefined : 'muted',
          rough: 0.6,
          label: c.trim(),
          size: 17,
        }),
      );
    d.text(338, 76, 'new capacity 8, then write e', { pen: 'muted', size: 15 });
  });

  d.step('Most appends cost 1');
  d.group(() => {
    d.arrow(BX - 12, BASE, BX + N * STEP + 4, BASE, { pen: 'muted' });
    d.arrow(BX - 12, BASE, BX - 12, 150, { pen: 'muted' });
    d.text(BX - 22, 160, 'cost', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(BX + N * STEP + 4, BASE + 38, 'append #', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(bx(1) + BW / 2, BASE + 16, '1', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    for (let k = 1; k <= N; k++) if (!isPow2(k - 1)) bar(d, k, 'blue');
  });

  d.step('A full array copies everything');
  d.group(() => {
    for (const k of [2, 3, 5, 9, 17]) {
      bar(d, k, 'red');
      d.text(bx(k) + BW / 2, BASE + 16, String(k), { pen: 'red', size: 14 });
    }
  });
  d.text(bx(17) + BW, BASE - cost(17) * UNIT - 14, '1 + 16 copies', { pen: 'red', size: 15, anchor: 'end' });

  d.step('Add it all up: under 3 per append');
  d.text(BX, 176, '17 writes + (1+2+4+8+16) copies', { pen: 'ink', size: 16, anchor: 'start' });
  d.text(BX, 198, '= 48 ≤ 3 × 17  →  O(1) amortised', {
    pen: 'green',
    size: 16,
    bold: true,
    anchor: 'start',
  });

  d.step('Banker’s view: charge 3, bank the rest');
  d.line(BX - 8, BASE - 3 * UNIT, BX + N * STEP - 4, BASE - 3 * UNIT, {
    pen: 'orange',
    dashed: true,
    thick: true,
  });
  d.text(BX, 234, 'charge 3 per append: a cheap one banks 2,', { pen: 'orange', size: 15, anchor: 'start' });
  d.text(BX, 254, 'and the bank pays for the next copy', { pen: 'orange', size: 15, anchor: 'start' });
};
