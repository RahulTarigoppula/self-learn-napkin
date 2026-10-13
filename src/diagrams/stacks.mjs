export const meta = {
  title: 'A stack, the bracket-matching trace for {[()]} and ([)], and postfix evaluation',
  width: 520,
  height: 420,
};

// one mini stack snapshot: a floor line and cells piled bottom-up; items = [[label, pen], …]
const mini = (d, cx, bottom, items, cw, ch) =>
  d.group(() => {
    d.line(cx - cw / 2 - 5, bottom + 3, cx + cw / 2 + 5, bottom + 3, {
      pen: 'muted',
      rough: 0.5,
      single: true,
    });
    items.forEach(([label, pen], k) =>
      d.rect(cx - cw / 2, bottom - (k + 1) * ch, cw, ch, {
        pen,
        fill: pen,
        rough: 0.6,
        single: true,
        label,
        mono: true,
        size: 16,
        bold: true,
      }),
    );
  });

// bracket trace, top right
const BX = (i) => 206 + i * 56;
const BB = 180; // bottom of the bracket snapshots
const BCH = 24;

// bottom row: failing case (left) and postfix (right)
const FX = (i) => 46 + i * 56;
const PX = (i) => 290 + i * 50;
const LB = 360;
const LCH = 22;

export default (d) => {
  d.step('Last in, first out');
  d.group(() => {
    d.poly(
      [
        [24, 110],
        [24, 232],
        [136, 232],
        [136, 110],
      ],
      { pen: 'ink', thick: true, rough: 0.6 },
    );
    [
      ['5', 'muted'],
      ['8', 'muted'],
      ['2', 'blue'],
    ].forEach(([v, pen], k) =>
      d.rect(32, 192 - k * 36, 96, 34, {
        pen,
        fill: pen,
        rough: 0.6,
        single: true,
        label: v,
        mono: true,
        size: 18,
        bold: true,
      }),
    );
  });
  d.group(() => {
    d.arrow(58, 38, 58, 112, { pen: 'blue', thick: true });
    d.text(52, 24, 'push', { pen: 'blue', size: 17, bold: true });
  });
  d.group(() => {
    d.arrow(104, 112, 104, 38, { pen: 'orange', thick: true });
    d.text(110, 24, 'pop', { pen: 'orange', size: 17, bold: true });
  });
  d.text(142, 138, '← top', { pen: 'blue', size: 16, anchor: 'start' });
  d.text(22, 252, 'a list [5, 8, 2]: the end is the top', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Opening brackets are pushed');
  d.text(346, 22, 'is  {[()]}  balanced?', { pen: 'ink', size: 17, bold: true });
  d.group(() =>
    [...'{[()]}'].forEach((ch, i) =>
      d.text(BX(i), 52, ch, { pen: i < 3 ? 'blue' : 'green', mono: true, size: 20, bold: true }),
    ),
  );
  const open = [
    ['{', 'blue'],
    ['[', 'blue'],
    ['(', 'blue'],
  ];
  for (let i = 0; i < 3; i++) {
    mini(d, BX(i), BB, open.slice(0, i + 1), 34, BCH);
  }
  d.group(() => [0, 1, 2].forEach((i) => d.text(BX(i), 198, 'push', { pen: 'blue', size: 15 })));

  d.step('Each closer must match the top');
  for (let i = 3; i < 6; i++) {
    mini(d, BX(i), BB, open.slice(0, 5 - i), 34, BCH);
  }
  d.group(() => [3, 4, 5].forEach((i) => d.text(BX(i), 198, 'pop ✓', { pen: 'green', size: 15 })));
  d.text(BX(5) + 26, 222, 'empty at the end → balanced ✓', {
    pen: 'green',
    size: 16,
    bold: true,
    anchor: 'end',
  });

  d.step('A mismatch fails immediately');
  d.text(20, 276, 'fails:  ( [ ) ]', { pen: 'red', size: 17, bold: true, anchor: 'start' });
  d.group(() =>
    ['(', '[', ')'].forEach((ch, i) =>
      d.text(FX(i), 300, ch, { pen: i === 2 ? 'red' : 'blue', mono: true, size: 18, bold: true }),
    ),
  );
  mini(d, FX(0), LB, [['(', 'blue']], 32, LCH);
  mini(
    d,
    FX(1),
    LB,
    [
      ['(', 'blue'],
      ['[', 'blue'],
    ],
    32,
    LCH,
  );
  mini(
    d,
    FX(2),
    LB,
    [
      ['(', 'blue'],
      ['[', 'red'],
    ],
    32,
    LCH,
  );
  d.text(FX(2) + 30, 336, '✗', { pen: 'red', size: 22, bold: true, anchor: 'start' });
  d.text(20, 392, ') needs ( but the top is [', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Postfix: numbers in, operators pop two');
  d.text(268, 276, 'postfix:  3 4 + 2 *', { pen: 'violet', size: 17, bold: true, anchor: 'start' });
  d.group(() =>
    ['3', '4', '+', '2', '*'].forEach((t, i) =>
      d.text(PX(i), 300, t, {
        pen: i === 2 || i === 4 ? 'orange' : 'violet',
        mono: true,
        size: 18,
        bold: true,
      }),
    ),
  );
  const V = 'violet';
  const O = 'orange';
  [
    [['3', V]],
    [
      ['3', V],
      ['4', V],
    ],
    [['7', O]],
    [
      ['7', O],
      ['2', V],
    ],
    [['14', 'green']],
  ].forEach((items, i) => mini(d, PX(i), LB, items, 32, LCH));
  d.text(PX(2), 378, '3+4', { pen: O, size: 15 });
  d.text(PX(4), 378, '7×2', { pen: O, size: 15 });
  d.text(504, 400, 'one item left = 14 ✓', { pen: 'green', size: 16, bold: true, anchor: 'end' });
};
