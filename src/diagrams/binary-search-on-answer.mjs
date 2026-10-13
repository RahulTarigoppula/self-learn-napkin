export const meta = {
  title: 'Binary search on the answer: the smallest ship capacity that ships [3,2,2,4,1,4] in 3 days',
  width: 520,
  height: 400,
};

const W = [3, 2, 2, 4, 1, 4];
const PW = 44;
const PX = 110;
const PY = 24;
const px = (i) => PX + i * PW;

const LO = 4;
const HI = 16;
const CW = 36;
const LX = 26;
const LY = 166;
const LH = 36;
const lx = (c) => LX + (c - LO) * CW + CW / 2; // centre of capacity c

const probe = (d, k, c) =>
  d.circle(lx(c), 238, 22, { pen: 'blue', fill: 'blue', rough: 0.5, label: String(k), size: 14, bold: true });

export default (d) => {
  d.step('Packages in order, 3 days');
  d.group(() => {
    d.text(20, PY + 20, 'weights', { pen: 'muted', size: 16, anchor: 'start' });
    W.forEach((w, i) =>
      d.rect(px(i), PY, PW, 40, { pen: 'ink', rough: 0.6, label: String(w), size: 19, bold: true }),
    );
  });
  d.text(392, PY + 20, 'D = 3 days', { pen: 'ink', size: 18, bold: true, anchor: 'start' });

  d.step('Check one capacity: load greedily');
  d.group(() => {
    for (const [l, r, s, pen, k] of [
      [0, 1, 5, 'blue', 1],
      [2, 3, 6, 'violet', 2],
      [4, 5, 5, 'orange', 3],
    ]) {
      d.poly(
        [
          [px(l) + 4, 72],
          [px(l) + 4, 80],
          [px(r + 1) - 4, 80],
          [px(r + 1) - 4, 72],
        ],
        { pen, thick: true, rough: 0.5 },
      );
      d.text((px(l) + px(r + 1)) / 2, 96, `day ${k} = ${s}`, { pen, size: 15 });
    }
    d.text(20, 88, 'cap 6', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
  });
  d.group(() => {
    d.text(392, 84, 'cap 6: 3 days ✓', { pen: 'green', size: 16, anchor: 'start' });
    d.text(392, 108, 'cap 5: 4 days ✗', { pen: 'red', size: 16, anchor: 'start' });
  });

  d.step('Works / fails is monotone');
  d.text(LX, 148, 'every capacity from 4 (max weight) to 16 (total)', {
    pen: 'ink',
    size: 16,
    anchor: 'start',
  });
  d.group(() => {
    for (let c = LO; c <= HI; c++) {
      const ok = c >= 6;
      d.rect(LX + (c - LO) * CW, LY, CW, LH, {
        pen: ok ? 'green' : 'red',
        fill: ok ? 'green' : 'red',
        rough: 0.6,
        label: String(c),
        size: 16,
        bold: true,
      });
    }
  });
  d.group(() => {
    d.text(lx(4), 216, 'lo', { pen: 'violet', size: 16, bold: true });
    d.text(lx(16), 216, 'hi', { pen: 'violet', size: 16, bold: true });
  });

  d.step('Binary search for the first ✓');
  d.group(() =>
    [
      [1, 10],
      [2, 7],
      [3, 5],
      [4, 6],
    ].forEach(([k, c]) => probe(d, k, c)),
  );
  d.group(() => {
    d.text(LX, 276, '1: mid 10 ✓ → hi = 10', { pen: 'green', size: 16, anchor: 'start' });
    d.text(LX, 300, '2: mid 7 ✓ → hi = 7', { pen: 'green', size: 16, anchor: 'start' });
    d.text(270, 276, '3: mid 5 ✗ → lo = 6', { pen: 'red', size: 16, anchor: 'start' });
    d.text(270, 300, '4: mid 6 ✓ → hi = 6', { pen: 'green', size: 16, anchor: 'start' });
  });

  d.step('lo meets hi: the answer');
  d.rect(LX + 2 * CW - 4, LY - 5, CW + 8, LH + 10, { pen: 'green', thick: true, rough: 0.5 });
  d.text(LX, 340, 'lo = hi = 6: the smallest capacity that works', {
    pen: 'green',
    size: 17,
    bold: true,
    anchor: 'start',
  });
  d.text(LX, 370, '4 checks of O(n) each, not 13: O(n log(sum))', { pen: 'blue', size: 16, anchor: 'start' });
};
