export const meta = { title: 'Gradient boosting: start from the mean, fit stumps to the residuals, add them with shrinkage, stop early', width: 520, height: 420 };

const XS = [1, 2, 3, 4, 5, 6];
const YS = [1, 1, 4, 7, 4, 1];
const F0 = 3;
const F1 = [2, 2, 3.5, 3.5, 3.5, 3.5];

// Top panel: the data and the model. Bottom panel: residuals and the tree fitted to them.
const px = (x) => 62 + 46 * (x - 1);
const py = (y) => 182 - 19 * y;
const ry = (r) => 306 - 19 * r;

/** A step function over x in [0.6, 6.4] that jumps at `at`. */
const steps = (d, yf, at, a, b, o) => {
  d.poly([[px(0.6), yf(a)], [px(at), yf(a)], [px(at), yf(b)], [px(6.4), yf(b)]], { rough: 0.4, single: true, ...o });
};

// Early-stopping plot (bottom-right): trees 0..1 across, error 0..1 up.
const ex = (t) => 362 + 142 * t;
const ey = (e) => 396 - 82 * e;
const train = (t) => 0.06 + 0.84 * Math.exp(-4.5 * t);
const val = (t) => 0.3 + 0.6 * Math.exp(-6 * t) + 0.32 * t * t;

export default (d) => {
  d.step('Start with the mean');
  d.group(() => {
    d.line(px(0.5), py(0), px(6.5), py(0), { pen: 'muted', single: true });
    d.line(px(0.5), py(0), px(0.5), py(7.8), { pen: 'muted', single: true });
    d.text(px(0.5) + 4, py(7.8) - 10, 'y', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(px(6.5), py(0) + 13, 'x', { pen: 'muted', size: 15, anchor: 'end' });
    for (const v of [1, 4, 7]) d.text(px(0.5) - 8, py(v), String(v), { pen: 'muted', size: 13, anchor: 'end' });
    XS.forEach((x, i) => d.dot(px(x), py(YS[i]), 11, { pen: 'ink', single: true }));
  });
  d.line(px(0.6), py(F0), px(6.4), py(F0), { pen: 'muted', dashed: true, thick: true });
  d.text(346, 40, 'F₀ = mean = 3', { pen: 'ink', size: 15, anchor: 'start', bold: true });

  d.step('Residuals: what is left to explain');
  d.group(() => {
    XS.forEach((x, i) => d.line(px(x), py(YS[i]), px(x), py(F0), { pen: 'red', thick: true, single: true }));
  });
  d.text(346, 74, 'residuals y − F₀:\n−2, −2, 1, 4, 1, −2', { pen: 'red', size: 14, anchor: 'start' });

  d.step('Tree 1 fits the residuals');
  d.group(() => {
    d.line(px(0.5), ry(0), px(6.5), ry(0), { pen: 'muted', single: true });
    d.text(px(0.5) - 8, ry(0), '0', { pen: 'muted', size: 13, anchor: 'end' });
    d.text(px(0.5) + 4, ry(4.4), 'residuals', { pen: 'muted', size: 14, anchor: 'start' });
    XS.forEach((x, i) => d.dot(px(x), ry(YS[i] - F0), 10, { pen: 'red', single: true }));
  });
  steps(d, ry, 2.5, -2, 1, { pen: 'blue', thick: true });
  d.text(346, 234, 'tree 1: x < 2.5 ?\nleaves −2 and +1', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Add it, shrunk by η = 0.5');
  steps(d, py, 2.5, 2, 3.5, { pen: 'violet', thick: true });
  d.text(346, 116, 'F₁ = F₀ + 0.5 · tree 1\nerror 30 → 21', { pen: 'violet', size: 15, anchor: 'start' });

  d.step('Tree 2 fits the new residuals');
  d.group(() => {
    XS.forEach((x, i) => d.dot(px(x) + 9, ry(YS[i] - F1[i]), 9, { pen: 'orange', single: true }));
  });
  steps(d, ry, 5.5, 0.5, -2.5, { pen: 'orange', thick: true });
  d.poly([[px(0.6), py(2.25)], [px(2.5), py(2.25)], [px(2.5), py(3.75)], [px(5.5), py(3.75)], [px(5.5), py(2.25)], [px(6.4), py(2.25)]], { pen: 'green', thick: true, rough: 0.4, single: true });
  d.text(346, 272, 'tree 2: x < 5.5 ?', { pen: 'orange', size: 15, anchor: 'start' });
  d.text(346, 160, 'F₂ = F₁ + 0.5 · tree 2\nerror 21 → 15.4', { pen: 'green', size: 15, anchor: 'start', bold: true });

  d.step('Many small steps, stop early');
  d.group(() => {
    d.line(ex(0), ey(0), ex(1), ey(0), { pen: 'muted', single: true });
    d.line(ex(0), ey(0), ex(0), ey(1), { pen: 'muted', single: true });
    d.text(ex(0) + 4, ey(1) - 9, 'error', { pen: 'muted', size: 13, anchor: 'start' });
    d.text(ex(1), ey(0) + 12, '# trees', { pen: 'muted', size: 13, anchor: 'end' });
  });
  d.curve(Array.from({ length: 13 }, (_, i) => [ex(i / 12), ey(train(i / 12))]), { pen: 'blue', thick: true, rough: 0.5, single: true });
  d.curve(Array.from({ length: 13 }, (_, i) => [ex(i / 12), ey(val(i / 12))]), { pen: 'orange', thick: true, rough: 0.5 });
  d.group(() => {
    d.text(ex(1) + 2, ey(train(1)) - 12, 'train', { pen: 'blue', size: 13, anchor: 'end' });
    d.text(ex(1) + 2, ey(val(1)) - 12, 'validation', { pen: 'orange', size: 13, anchor: 'end' });
    d.line(ex(0.43), ey(0), ex(0.43), ey(0.95), { pen: 'red', dashed: true });
    d.text(ex(0.43) + 5, ey(0.95), 'stop', { pen: 'red', size: 14, anchor: 'start', bold: true });
  });
};
