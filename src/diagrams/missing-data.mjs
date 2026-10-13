export const meta = {
  title:
    'Three missingness mechanisms (MCAR, MAR, MNAR), mean vs model-based imputation, and a missing-indicator column',
  width: 520,
  height: 420,
};

// 12 people: (age, income £k). Income rises with age.
const P = [
  [21, 30],
  [25, 36],
  [28, 33],
  [33, 44],
  [37, 41],
  [41, 50],
  [45, 47],
  [49, 56],
  [53, 54],
  [57, 63],
  [61, 60],
  [64, 68],
];
const AGE = [18, 67];
const INC = [25, 72];

/** A small filled hexagon: reads as a dot but costs half the bytes of d.dot. */
const mark = (d, x, y, pen, dia = 9, sides = 6) =>
  d.poly(
    Array.from({ length: sides }, (_, i) => [
      x + (dia / 2) * Math.cos((i * 2 * Math.PI) / sides),
      y + (dia / 2) * Math.sin((i * 2 * Math.PI) / sides),
    ]),
    { pen, fill: pen, closed: true, rough: 0.3, single: true },
  );

/** A hollow octagon ring: a missing value, cheaper than d.circle. */
const ring = (d, x, y, pen, dia = 13) =>
  d.poly(
    Array.from({ length: 8 }, (_, i) => [
      x + (dia / 2) * Math.cos((i * Math.PI) / 4),
      y + (dia / 2) * Math.sin((i * Math.PI) / 4),
    ]),
    { pen, thick: true, closed: true, rough: 0.3, single: true },
  );

/** A mini scatter where the `missing` rows are drawn hollow and dashed (income not recorded). */
function mini(d, x0, title, sub, missing, pen) {
  const W = 148;
  const H = 96;
  const y0 = 50;
  const sx = (a) => x0 + 8 + ((a - AGE[0]) / (AGE[1] - AGE[0])) * (W - 14);
  const sy = (v) => y0 + H - 6 - ((v - INC[0]) / (INC[1] - INC[0])) * (H - 12);
  d.group(() => {
    d.text(x0 + W / 2, 24, title, { pen, size: 17, bold: true });
    d.line(x0, y0 + H, x0 + W, y0 + H, { pen: 'muted', thin: true });
    d.line(x0, y0 + H, x0, y0, { pen: 'muted', thin: true });
    P.forEach(([a, v], i) => {
      if (missing.includes(i)) ring(d, sx(a), sy(v), pen);
      else mark(d, sx(a), sy(v), 'blue', 9, 4); // small diamonds keep the three minis light
    });
    d.text(x0 + W / 2, y0 + H + 18, sub, { pen, size: 14 });
  });
}

// Bottom-left: the MAR case, imputed two ways.
const BX0 = 46;
const BX1 = 290;
const BY0 = 382; // x-axis
const BY1 = 222;
const bx = (a) => BX0 + 6 + ((a - AGE[0]) / (AGE[1] - AGE[0])) * (BX1 - BX0 - 12);
const by = (v) => BY0 - 6 - ((v - INC[0]) / (INC[1] - INC[0])) * (BY0 - BY1 - 12);
const OBS = P.slice(3);
const MISS = P.slice(0, 3);
const MEAN = OBS.reduce((s, p) => s + p[1], 0) / OBS.length; // 53.67
const MA = OBS.reduce((s, p) => s + p[0], 0) / OBS.length;
const SLOPE =
  OBS.reduce((s, p) => s + (p[0] - MA) * (p[1] - MEAN), 0) / OBS.reduce((s, p) => s + (p[0] - MA) ** 2, 0);
const fit = (a) => MEAN + SLOPE * (a - MA); // 15.26 + 0.786 · age

export default (d) => {
  d.step('MCAR: missing completely at random');
  mini(d, 16, 'MCAR', 'pure chance', [2, 6, 9], 'violet');

  d.step('MAR: depends on what you can see');
  mini(d, 186, 'MAR', 'depends on age', [0, 1, 2], 'orange');

  d.step('MNAR: depends on the missing value');
  mini(d, 356, 'MNAR', 'depends on income', [9, 10, 11], 'red');

  d.step('Mean imputation: flat and biased');
  d.group(() => {
    d.line(BX0, BY0, BX1, BY0, { pen: 'muted' });
    d.line(BX0, BY0, BX0, BY1 - 8, { pen: 'muted' });
    d.text(BX1, BY0 + 16, 'age', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(BX0 + 8, BY1 - 10, 'income £k (MAR case)', { pen: 'muted', size: 15, anchor: 'start' });
    for (const [a, v] of OBS) mark(d, bx(a), by(v), 'blue', 9);
    for (const [a, v] of MISS) ring(d, bx(a), by(v), 'orange');
  });
  d.group(() => {
    d.line(BX0 + 4, by(MEAN), BX1, by(MEAN), { pen: 'red', dashed: true });
    for (const [a] of MISS) mark(d, bx(a), by(MEAN), 'red', 10);
    d.text(BX0 + 8, by(MEAN) + 16, 'mean 53.7', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('Model-based imputation follows the pattern');
  d.line(bx(19), by(fit(19)), bx(66), by(fit(66)), { pen: 'green', thick: true });
  d.group(() => {
    for (const [a] of MISS) mark(d, bx(a), by(fit(a)), 'green', 10);
    d.text(BX1, by(36), 'predicted\nfrom age', { pen: 'green', size: 15, anchor: 'end' });
  });

  d.step('Add a missing flag; fit on train only');
  d.group(() => {
    const cols = [
      [326, 44, 'age'],
      [370, 66, 'income'],
      [436, 66, 'missing?'],
    ];
    for (const [x, w, h] of cols)
      d.rect(x, 216, w, 28, {
        pen: 'violet',
        fill: 'violet',
        rough: 0.4,
        single: true,
        label: h,
        size: 14,
        textPen: 'ink',
      });
    const rows = [
      ['21', '31.8', '1'],
      ['33', '44', '0'],
      ['25', '34.9', '1'],
    ];
    rows.forEach((r, i) => {
      r.forEach((v, j) => {
        const [x, w] = cols[j];
        const imputed = r[2] === '1' && j === 1;
        d.rect(x, 244 + i * 24, w, 24, {
          pen: 'muted',
          rough: 0.3,
          single: true,
          label: v,
          size: 15,
          mono: true,
          textPen: imputed ? 'green' : j === 2 ? 'violet' : 'ink',
        });
      });
    });
  });
  d.text(414, 340, 'imputer learns its\nvalues from train rows,\nthen fills val and test', {
    pen: 'red',
    size: 14,
  });
};
