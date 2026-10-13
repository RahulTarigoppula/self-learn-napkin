export const meta = {
  title: 'Null distribution of coin flips, the p-value tails, alpha cut-offs, a confidence interval and Bonferroni',
  width: 520,
  height: 420,
};

// Null distribution: heads in 100 fair flips, mean 50, SD 5 (normal approximation drawn).
const BY = 196; // baseline
const PK = 118; // peak height
const hx = (h) => 44 + (h - 32) * 12; // 32..68 heads -> 44..476
const dens = (h) => Math.exp(-((h - 50) ** 2) / 50);
const hy = (h) => BY - PK * dens(h);
const curvePts = (from, to, n) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const h = from + ((to - from) * i) / n;
    return [hx(h), hy(h)];
  });

// Confidence-interval axis: proportion 0.40..0.80
const CY = 300;
const cx = (p) => 60 + (p - 0.4) * 1000;

export default (d) => {
  d.step('Assume the null: a fair coin');
  d.group(() => {
    d.line(hx(32), BY, hx(68), BY, { pen: 'muted', single: true });
    for (const h of [35, 40, 45, 50, 55, 60, 65]) {
      d.line(hx(h), BY, hx(h), BY + 5, { pen: 'muted', single: true });
      d.text(hx(h), BY + 16, String(h), { pen: 'muted', size: 14, mono: true });
    }
    d.text(hx(68), BY + 34, 'heads in 100 flips', { pen: 'muted', size: 14, anchor: 'end' });
  });
  d.curve(curvePts(32, 68, 24), { pen: 'blue', thick: true });
  d.text(20, 24, 'H₀: fair coin → heads ≈ 50 ± 5 (SD)', { pen: 'blue', size: 16, anchor: 'start' });

  d.step('Our data: 62 heads');
  d.group(() => {
    d.line(hx(62), BY, hx(62), 78, { pen: 'red', thick: true });
    d.text(hx(62) + 8, 92, '62 heads\nz = 2.4', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('p-value: as extreme or more, if H₀ is true');
  d.poly([[hx(62), BY], ...curvePts(62, 68, 6), [hx(68), BY]], {
    closed: true,
    pen: 'red',
    fill: 'red',
    thin: true,
  });
  d.poly([[hx(32), BY], ...curvePts(32, 38, 6), [hx(38), BY]], {
    closed: true,
    pen: 'red',
    fill: 'red',
    thin: true,
  });
  d.group(() => {
    d.arrow(hx(64.6), 172, hx(64.2), BY - 6, { pen: 'red', thin: true, headSize: 7 });
    d.arrow(hx(36), 178, hx(35.8), BY - 6, { pen: 'red', thin: true, headSize: 7 });
    d.text(hx(62) + 8, 156, 'p = 0.021', { pen: 'red', size: 17, bold: true, anchor: 'start' });
    d.text(hx(38) - 6, 150, '≤ 38 counts\ntoo', { pen: 'red', size: 14, anchor: 'end' });
  });

  d.step('Compare with α = 0.05');
  d.group(() => {
    d.line(hx(40.2), BY, hx(40.2), 96, { pen: 'orange', dashed: true });
    d.line(hx(59.8), BY, hx(59.8), 96, { pen: 'orange', dashed: true });
    d.text(hx(50), 178, '95 % of fair runs', { pen: 'orange', size: 14 });
  });
  d.text(20, 48, 'p < α → reject H₀ (not "H₀ is 2 % likely")', {
    pen: 'orange',
    size: 15,
    anchor: 'start',
  });

  d.step('95 % confidence interval for P(heads)');
  d.group(() => {
    d.line(cx(0.4), CY, cx(0.8), CY, { pen: 'muted', single: true });
    for (const p of [0.4, 0.5, 0.6, 0.7, 0.8]) {
      d.line(cx(p), CY, cx(p), CY + 5, { pen: 'muted', single: true });
      d.text(cx(p), CY + 16, p.toFixed(1), { pen: 'muted', size: 14, mono: true });
    }
  });
  d.group(() => {
    d.line(cx(0.525), CY - 14, cx(0.715), CY - 14, { pen: 'green', thick: true });
    d.line(cx(0.525), CY - 21, cx(0.525), CY - 7, { pen: 'green', thick: true });
    d.line(cx(0.715), CY - 21, cx(0.715), CY - 7, { pen: 'green', thick: true });
    d.dot(cx(0.62), CY - 14, 10, { pen: 'green', single: true });
    d.text(cx(0.62), CY - 38, '95 % CI: 0.62 ± 0.095 = [0.525, 0.715]', { pen: 'green', size: 15 });
  });
  d.group(() => {
    d.dot(cx(0.5), CY, 9, { pen: 'blue', single: true });
    d.text(cx(0.5) - 8, CY - 14, 'H₀', { pen: 'blue', size: 15, anchor: 'end' });
  });

  d.step('Twenty tests: Bonferroni');
  d.group(() => {
    for (let i = 0; i < 20; i++) {
      const bad = i === 13;
      d.rect(24 + i * 18, 342, 13, 13, {
        pen: bad ? 'red' : 'muted',
        fill: bad ? 'red' : undefined,
        rough: 0.5,
        single: true,
      });
    }
  });
  d.text(398, 349, '20 useless tests', { pen: 'muted', size: 14, anchor: 'start' });
  d.text(24, 378, 'P(≥ 1 false positive) = 1 − 0.95²⁰ = 64 %', { pen: 'red', size: 15, anchor: 'start' });
  d.text(24, 400, 'Bonferroni: test each at 0.05 / 20 = 0.0025', { pen: 'violet', size: 15, anchor: 'start' });
};
