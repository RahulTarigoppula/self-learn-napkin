export const meta = {
  title: 'Central limit theorem: skewed waiting times, sample means of 4 and 25 turning into a bell, standard error',
  width: 520,
  height: 420,
};

// Waiting times ~ Exponential(mean 2 min, SD 2). The mean of n of them ~ Gamma(shape n, scale 2/n).
const X0 = 72;
const XS = 44; // px per minute, 0..6 minutes
const mx = (t) => X0 + t * XS;
const PANEL_H = 64;
const BASE = [112, 206, 300]; // baselines of the three panels

const lgam = (k) => {
  let s = 0;
  for (let i = 2; i < k; i++) s += Math.log(i);
  return s;
};
const gammaPdf = (x, k, th) =>
  x <= 0 ? (k === 1 ? 1 / th : 0) : Math.exp((k - 1) * Math.log(x) - x / th - lgam(k) - k * Math.log(th));

/** Curve of the sampling distribution for sample size n, scaled to the panel height. */
function meanCurve(n, base) {
  const xs = Array.from({ length: 31 }, (_, i) => 0.02 + (i / 30) * 5.98);
  const ys = xs.map((x) => gammaPdf(x, n, 2 / n));
  const top = Math.max(...ys);
  return xs.map((x, i) => [mx(x), base - (PANEL_H * ys[i]) / top]);
}

const axis = (d, base, label) => {
  d.line(X0, base, mx(6.1), base, { pen: 'muted', single: true });
  d.text(X0 - 8, base - 26, label, { pen: 'muted', size: 15, anchor: 'end' });
};

export default (d) => {
  d.step('A skewed population: waiting times');
  d.group(() => {
    axis(d, BASE[0], 'n = 1');
    for (const t of [0, 2, 4, 6]) d.text(mx(t), BASE[0] + 14, String(t), { pen: 'muted', size: 14, mono: true });
  });
  d.curve(meanCurve(1, BASE[0]), { pen: 'blue', thick: true, rough: 0.5 });
  d.group(() => {
    d.line(mx(2), 40, mx(2), BASE[0] + 3, { pen: 'green', dashed: true });
    d.line(mx(2), BASE[0] + 24, mx(2), BASE[2], { pen: 'green', dashed: true });
    d.text(mx(2) + 6, 34, 'mean 2 min', { pen: 'green', size: 15, anchor: 'start' });
  });
  d.text(mx(6.1) + 10, BASE[0] + 14, 'minutes', { pen: 'muted', size: 14, anchor: 'start' });

  d.step('Average 4 waits at a time');
  axis(d, BASE[1], 'n = 4');
  d.curve(meanCurve(4, BASE[1]), { pen: 'violet', thick: true, rough: 0.5 });

  d.step('Average 25: a bell appears');
  axis(d, BASE[2], 'n = 25');
  d.curve(meanCurve(25, BASE[2]), { pen: 'red', thick: true, rough: 0.5 });

  d.step('Spread shrinks: SE = σ / √n');
  d.group(() => {
    d.text(362, BASE[0] - 26, 'SE = 2/√1 = 2', { pen: 'blue', size: 14, mono: true, anchor: 'start' });
    d.text(362, BASE[1] - 26, 'SE = 2/√4 = 1', { pen: 'violet', size: 14, mono: true, anchor: 'start' });
    d.text(362, BASE[2] - 26, 'SE = 2/√25 = 0.4', { pen: 'red', size: 14, mono: true, anchor: 'start' });
  });

  d.step('95 % of means: 2 ± 1.96 × 0.4');
  d.group(() => {
    d.line(mx(1.216), BASE[2] + 12, mx(2.784), BASE[2] + 12, { pen: 'orange', thick: true });
    d.line(mx(1.216), BASE[2] + 6, mx(1.216), BASE[2] + 18, { pen: 'orange', thick: true });
    d.line(mx(2.784), BASE[2] + 6, mx(2.784), BASE[2] + 18, { pen: 'orange', thick: true });
    d.text(mx(1.216), BASE[2] + 36, '1.22 to 2.78 holds 95 % of the sample means', {
      pen: 'orange',
      size: 15,
      anchor: 'start',
    });
  });

  d.step('When it fails');
  d.text(20, 372, 'needs: finite variance · independence · enough n', { pen: 'ink', size: 15, anchor: 'start' });
  d.text(20, 396, 'fails: heavy tails (Cauchy), correlated data', { pen: 'red', size: 15, anchor: 'start' });
};
