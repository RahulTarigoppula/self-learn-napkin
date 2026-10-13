export const meta = {
  title: 'Token bucket rate limiter: capacity 5, refill 1 per second, burst of 7',
  width: 520,
  height: 410,
};

const CHIP = 36;
const GAP = 8;
const X0 = 108;
const CY0 = 30; // chip row top
// token slots inside the bucket: three on the bottom row, two above
const SLOTS = [
  [232, 206],
  [260, 206],
  [288, 206],
  [246, 178],
  [274, 178],
];

export default (d) => {
  const chipX = (i) => X0 + i * (CHIP + GAP);
  const token = ([x, y], pen) => d.circle(x, y, 24, { pen, fill: pen, rough: 0.6, single: true });

  d.step('A bucket of 5 tokens, refilled 1 per second');
  d.group(() => {
    d.poly(
      [
        [198, 128],
        [206, 232],
        [314, 232],
        [322, 128],
      ],
      { pen: 'ink', thick: true },
    );
    d.text(188, 196, 'capacity 5', { pen: 'muted', size: 16, anchor: 'end' });
  });
  d.group(() => SLOTS.forEach((p) => token(p, 'green')));
  d.group(() => {
    d.poly(
      [
        [120, 106],
        [250, 106],
        [250, 114],
      ],
      { pen: 'muted', thick: true },
    );
    d.dot(250, 122, 9, { pen: 'green' });
    d.text(122, 90, '+1 token / s', { pen: 'green', size: 16, anchor: 'start' });
  });

  d.step('A burst of 7 requests at once');
  d.group(() => {
    for (let i = 0; i < 7; i++)
      d.rect(chipX(i), CY0, CHIP, 30, {
        pen: 'blue',
        fill: 'blue',
        label: `r${i + 1}`,
        size: 15,
        rough: 0.6,
        single: true,
      });
    d.text(X0 - 14, CY0 + 15, 't = 0', { pen: 'blue', size: 16, anchor: 'end', bold: true });
  });

  d.step('r1–r5 each take a token');
  d.line(chipX(0), CY0 + 40, chipX(4) + CHIP, CY0 + 40, { pen: 'green', thick: true });
  d.group(() =>
    SLOTS.forEach(([x, y]) =>
      d.circle(x, y, 24, { pen: 'muted', fill: 'paper', dashed: true, rough: 0.6, single: true }),
    ),
  );
  d.group(() => {
    d.arrow(222, 234, 150, 298, { pen: 'green', thick: true });
    d.rect(40, 304, 140, 48, { pen: 'green', fill: 'green', label: 'API: 5 served', size: 16, bold: true });
  });

  d.step('r6, r7 find it empty: 429');
  d.line(chipX(5), CY0 + 40, chipX(6) + CHIP, CY0 + 40, { pen: 'red', thick: true });
  d.group(() => {
    d.arrow(chipX(6) + CHIP / 2, CY0 + 48, 422, 298, { pen: 'red', thick: true });
    d.rect(352, 304, 140, 48, { pen: 'red', fill: 'red', label: '429 Too Many', size: 16, bold: true });
  });
  d.text(326, 256, 'empty at t = 0', { pen: 'red', size: 16, bold: true });

  d.step('Three seconds later: 3 tokens back');
  d.group(() => SLOTS.slice(0, 3).forEach((p) => token(p, 'orange')));
  d.text(188, 224, 't = 3 s: +3', { pen: 'orange', size: 16, anchor: 'end', bold: true });

  d.step('Other limiters');
  d.text(260, 382, 'leaky bucket: steady outflow · fixed window: 2× at edges', { pen: 'violet', size: 15 });
};
