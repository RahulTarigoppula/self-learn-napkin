export const meta = {
  title: 'Prefix sums: build P, range sum as P[r+1] − P[l], subarray sum = k, and the 2D version',
  width: 520,
  height: 420,
};

const A = [3, 1, 4, 1, 5, 2];
const P = [0, 3, 4, 8, 9, 14, 16];
const CW = 52;
const X0 = 70; // left edge of a[0]; P[i] is centred on the left edge of a[i]
const AY = 36;
const PY = 112;
const H = 40;
const ax = (i) => X0 + i * CW + CW / 2; // centre of a[i]
const px = (i) => X0 + i * CW; // centre of P[i]

const ring = (d, i, pen) => d.rect(px(i) - 22, PY - 4, 44, H + 8, { pen, thick: true, rough: 0.6 });

export default (d) => {
  d.step('An array of numbers');
  d.group(() => {
    d.text(24, AY + H / 2, 'a', { pen: 'ink', size: 20, bold: true, anchor: 'start' });
    A.forEach((v, i) =>
      d.rect(X0 + i * CW, AY, CW, H, { pen: 'ink', rough: 0.6, label: String(v), size: 19, bold: true }),
    );
    A.forEach((_, i) => d.text(ax(i), AY + H + 12, String(i), { pen: 'muted', size: 14 }));
  });

  d.step('Build P: running totals, one pass');
  d.text(24, 16, 'P[0] = 0,   P[i+1] = P[i] + a[i]', { pen: 'blue', size: 16, anchor: 'start' });
  d.group(() => {
    d.text(24, PY + H / 2, 'P', { pen: 'blue', size: 20, bold: true, anchor: 'start' });
    P.forEach((v, i) =>
      d.rect(px(i) - 22, PY, 44, H, {
        pen: 'blue',
        fill: 'blue',
        rough: 0.6,
        label: String(v),
        size: 18,
        bold: true,
        textPen: 'blue',
      }),
    );
    P.forEach((_, i) => d.text(px(i), PY + H + 12, String(i), { pen: 'muted', size: 14 }));
  });
  d.text(420, 132, 'P[i] = sum of\nthe first i\nvalues', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Any range sum is one subtraction');
  d.rect(X0 + CW - 3, AY - 4, 4 * CW + 6, H + 8, { pen: 'green', thick: true, rough: 0.5 });
  ring(d, 1, 'green');
  ring(d, 5, 'green');
  d.text(24, 226, 'a[1] + … + a[4] = P[5] − P[1] = 14 − 3 = 11', {
    pen: 'green',
    size: 16,
    bold: true,
    anchor: 'start',
  });

  d.step('Sum = 5? Find prefixes exactly 5 apart');
  d.group(() => {
    // two lanes so the overlapping pairs (1→3 and 2→4) do not cross
    for (const [i, j, lane] of [
      [1, 3, 0],
      [2, 4, 1],
      [4, 5, 0],
    ])
      d.arrow(px(i) + 4, PY + H + 24 + lane * 18, px(j) - 4, PY + H + 24 + lane * 18, {
        pen: 'orange',
        bend: 8,
        rough: 0.5,
      });
  });
  d.group(() => {
    d.text(24, 252, '14 − 9, 9 − 4, 8 − 3: three subarrays sum to 5', {
      pen: 'orange',
      size: 16,
      anchor: 'start',
    });
    d.text(24, 274, 'hash map: how often was P[j] − 5 seen before?', {
      pen: 'orange',
      size: 15,
      anchor: 'start',
    });
  });

  d.step('2D: add back the corner');
  d.line(20, 292, 500, 292, { pen: 'muted', dashed: true, thin: true });
  d.group(() => {
    const G = 48;
    const gx = 28;
    const gy = 306;
    d.rect(gx, gy, G, G, { pen: 'violet', fill: 'violet', rough: 0.6, label: 'A', size: 18, bold: true });
    d.rect(gx + G, gy, G, G, {
      pen: 'red',
      fill: 'red',
      fillStyle: 'hachure',
      rough: 0.6,
      label: 'B',
      size: 18,
      bold: true,
    });
    d.rect(gx, gy + G, G, G, {
      pen: 'red',
      fill: 'red',
      fillStyle: 'hachure',
      rough: 0.6,
      label: 'C',
      size: 18,
      bold: true,
    });
    d.rect(gx + G, gy + G, G, G, {
      pen: 'green',
      fill: 'green',
      thick: true,
      rough: 0.6,
      label: 'box',
      size: 16,
      bold: true,
    });
  });
  d.group(() => {
    d.text(146, 320, 'box = all − (A+B) − (A+C) + A', { pen: 'ink', size: 17, bold: true, anchor: 'start' });
    d.text(146, 354, 'A was subtracted twice,\nso add it back once', {
      pen: 'violet',
      size: 15,
      anchor: 'start',
    });
    d.text(146, 394, 'four lookups in a 2D prefix table: O(1)', { pen: 'muted', size: 15, anchor: 'start' });
  });
};
