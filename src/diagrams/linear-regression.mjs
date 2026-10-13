export const meta = {
  title: 'Least-squares line through five points, its squared residuals, R² and an outlier',
  width: 520,
  height: 420,
};

// Plot: hours x in [0, 6.5] across (44 px/unit), score y in [0, 6] up (40 px/unit). Residual squares use
// the y scale for both sides, so a residual of r draws as an r × r square.
const S = 40;
const X0 = 52;
const Y0 = 296;
const px = (x) => X0 + 44 * x;
const py = (y) => Y0 - S * y;

const XS = [1, 2, 3, 4, 5];
const YS = [2, 4, 5, 4, 5];
const fit = (x) => 2.2 + 0.6 * x; // least-squares line
const out = (x) => 3.8 - (0.6 / 7) * x; // refit with the outlier (6, 1)
// side of each residual square: -1 = draw it left of the point, +1 = right
const SIDE = [1, -1, -1, 1, 1];

export default (d) => {
  d.step('Five students: hours vs score');
  d.group(() => {
    d.line(X0, Y0, px(6.6), Y0, { pen: 'muted', single: true });
    d.line(X0, Y0, X0, py(6.2), { pen: 'muted', single: true });
    for (const x of [1, 2, 3, 4, 5, 6]) d.text(px(x), Y0 + 13, String(x), { pen: 'muted', size: 13 });
    for (const y of [2, 4, 6]) d.text(X0 - 9, py(y), String(y), { pen: 'muted', size: 13, anchor: 'end' });
    d.text(px(6.6), Y0 + 30, 'hours studied x', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(X0 - 2, py(6.2) - 14, 'score y', { pen: 'muted', size: 15, anchor: 'start' });
  });
  d.group(() => {
    XS.forEach((x, i) => d.dot(px(x), py(YS[i]), 11, { pen: 'blue', single: true }));
  });

  d.step('Residuals from a guess');
  d.line(px(0.1), py(4), px(6.5), py(4), { pen: 'muted', dashed: true });
  d.group(() => {
    XS.forEach((x, i) => {
      if (YS[i] !== 4) d.line(px(x), py(YS[i]), px(x), py(4), { pen: 'orange', thick: true, single: true });
    });
  });
  d.text(358, 58, 'guess ŷ = 4 (mean)\nΣr² = 6', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('Least squares: the smallest Σr²');
  d.line(px(0.1), py(fit(0.1)), px(6.4), py(fit(6.4)), { pen: 'green', thick: true });
  d.group(() => {
    XS.forEach((x, i) => {
      const r = YS[i] - fit(x);
      const s = Math.abs(r) * S;
      const top = Math.min(py(YS[i]), py(fit(x)));
      const left = SIDE[i] > 0 ? px(x) : px(x) - s;
      d.rect(left, top, s, s, {
        pen: 'red',
        fill: 'red',
        fillStyle: 'hachure',
        gap: 5,
        single: true,
        rough: 0.5,
      });
    });
  });
  d.text(358, 124, 'best ŷ = 2.2 + 0.6x\nΣr² = 2.4 (smallest)', {
    pen: 'green',
    size: 15,
    anchor: 'start',
    bold: true,
  });

  d.step('Solve it in one line');
  d.group(() => {
    d.circle(px(3), py(4), 20, { pen: 'violet', thick: true });
    d.text(px(3) + 10, py(4) + 40, 'x̄, ȳ = 3, 4', { pen: 'violet', size: 14, anchor: 'start' });
  });
  d.text(260, 344, 'slope = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)² = 6 / 10 = 0.6', { pen: 'violet', size: 15, mono: true });

  d.step('R²: how much of the spread it explains');
  d.group(() => {
    d.text(92, 374, 'guess', { pen: 'muted', size: 15, anchor: 'end' });
    d.rect(100, 366, 6 * 30, 16, { pen: 'orange', fill: 'orange', rough: 0.5 });
    d.text(288, 374, '6', { pen: 'orange', size: 15, anchor: 'start' });
    d.text(92, 400, 'line', { pen: 'muted', size: 15, anchor: 'end' });
    d.rect(100, 392, 2.4 * 30, 16, { pen: 'green', fill: 'green', rough: 0.5 });
    d.text(180, 400, '2.4', { pen: 'green', size: 15, anchor: 'start' });
  });
  d.text(330, 387, 'R² = 1 − 2.4/6 = 0.6', { pen: 'ink', size: 17, anchor: 'start', bold: true });

  d.step('One outlier drags the line');
  d.group(() => {
    d.dot(px(6), py(1), 12, { pen: 'red' });
    d.text(px(6) + 12, py(1) + 1, '(6, 1)', { pen: 'red', size: 14, anchor: 'start' });
  });
  d.line(px(0.1), py(out(0.1)), px(6.4), py(out(6.4)), { pen: 'red', dashed: true, thick: true });
  d.text(358, 214, 'one outlier:\nslope 0.6 → −0.09', { pen: 'red', size: 15, anchor: 'start' });
};
