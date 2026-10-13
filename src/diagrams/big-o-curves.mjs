export const meta = { title: 'Big-O growth curves: O(1) to O(2^n)', width: 520, height: 420 };

// Plot frame: origin bottom-left, t ∈ [0, 1] across, "work" up.
const X0 = 62;
const Y0 = 318;
const W = 322;
const TOP = 44;
const H = Y0 - TOP;

/** Sample f(t) (height in px above the axis) into points, clipped at the top of the plot. */
function plot(f, t0 = 0.02) {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = t0 + ((1 - t0) * i) / 40;
    const h = f(t);
    if (h > H) {
      // find where it crosses the top and stop there
      let lo = pts.length ? (pts[pts.length - 1][0] - X0) / W : t0;
      let hi = t;
      for (let k = 0; k < 20; k++) {
        const m = (lo + hi) / 2;
        if (f(m) > H) hi = m;
        else lo = m;
      }
      pts.push([X0 + lo * W, TOP]);
      return pts;
    }
    pts.push([X0 + t * W, Y0 - h]);
  }
  return pts;
}

const lg = (x) => Math.log2(x);
const f1 = () => 26;
const flog = (t) => 16 * lg(1 + 8 * t);
const fn = (t) => 150 * t;
const fnlogn = (t) => 150 * t * (1 + 0.24 * lg(1 + 7 * t));
const fn2 = (t) => 700 * t * t;
const f2n = (t) => 1.2 * (2 ** (19 * t) - 1);

export default (d) => {
  d.step('Axes: n across, work up');
  d.arrow(X0, Y0, X0 + W + 30, Y0, { pen: 'muted', thick: true });
  d.arrow(X0, Y0, X0, TOP - 22, { pen: 'muted', thick: true });
  d.text(X0 + W + 24, Y0 + 22, 'input size n', { pen: 'muted', size: 16, anchor: 'end' });
  d.text(X0 - 12, 104, 'work', { pen: 'muted', size: 16, anchor: 'end' });
  d.text(X0 - 12, 124, '(steps)', { pen: 'muted', size: 14, anchor: 'end' });

  d.step('O(1) and O(log n) stay flat');
  d.group(() => {
    d.curve(plot(f1), { pen: 'blue', thick: true });
    d.text(X0 + W + 10, Y0 - 22, 'O(1)', { pen: 'blue', size: 17, anchor: 'start' });
  });
  d.group(() => {
    d.curve(plot(flog), { pen: 'blue', thick: true });
    d.text(X0 + W + 10, Y0 - flog(1) - 12, 'O(log n)', { pen: 'blue', size: 17, anchor: 'start' });
  });

  d.step('O(n) and O(n log n) climb');
  d.group(() => {
    d.curve(plot(fn), { pen: 'green', thick: true });
    d.text(X0 + W + 10, Y0 - fn(1), 'O(n)', { pen: 'green', size: 17, anchor: 'start' });
  });
  d.group(() => {
    d.curve(plot(fnlogn), { pen: 'green', thick: true });
    d.text(X0 + W + 10, Y0 - fnlogn(1) - 4, 'O(n log n)', { pen: 'green', size: 17, anchor: 'start' });
    d.text(X0 + W + 10, Y0 - fnlogn(1) + 18, 'sorting floor', { pen: 'green', size: 14, anchor: 'start' });
  });

  d.step('O(n²) and O(2ⁿ) leave the napkin');
  d.group(() => {
    const p = plot(fn2);
    d.curve(p, { pen: 'red', thick: true });
    const [x] = p[p.length - 1];
    d.text(x + 8, TOP - 16, 'O(n²)', { pen: 'red', size: 17, anchor: 'start' });
  });
  d.group(() => {
    const p = plot(f2n);
    d.curve(p, { pen: 'red', thick: true });
    const [x] = p[p.length - 1];
    d.text(x - 8, TOP - 16, 'O(2ⁿ)', { pen: 'red', size: 17, anchor: 'end' });
  });

  d.step('Drop the constants and small terms');
  const y = 372;
  d.text(40, y, '3', { size: 22, anchor: 'start' });
  d.text(62, y, 'n²', { size: 22, anchor: 'start' });
  d.text(102, y, '+ 200n + 5000', { size: 22, anchor: 'start' });
  d.group(() => {
    d.line(36, y + 3, 54, y - 4, { pen: 'red', thick: true });
    d.line(100, y + 2, 272, y - 2, { pen: 'red', thick: true });
    d.text(46, y + 28, 'constant', { pen: 'muted', size: 14 });
    d.text(110, y + 28, 'lower-order terms', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.arrow(290, y, 330, y, { pen: 'red', thick: true });
  d.text(342, y, 'O(n²)', { pen: 'red', size: 24, bold: true, anchor: 'start' });
};
