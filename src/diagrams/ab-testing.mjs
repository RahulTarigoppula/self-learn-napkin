export const meta = {
  title: 'A/B test: random split, sample size, run time, peeking, SRM check and the result',
  width: 520,
  height: 420,
};

// Peeking plot: day 1..14 across, z-statistic up.
const GX = 54;
const GY = 286; // z = 0 line
const GW = 210;
const ZS = 22; // px per unit of z
const gx = (day) => GX + ((day - 1) / 13) * GW;
const gy = (z) => GY - z * ZS;
const PATH = [0.4, 1.3, 2.15, 1.7, 1.2, 0.9, 1.1, 0.6, 0.8, 0.3, 0.5, 0.2, 0.6, 0.4];

export default (d) => {
  d.step('Hypothesis and random split');
  d.group(() => {
    d.circle(56, 58, 64, { pen: 'blue', fill: 'blue', label: 'users', size: 16 });
    d.text(56, 106, 'hash(user id)', { pen: 'blue', size: 14 });
  });
  d.arrow(92, 54, 196, 36, { pen: 'blue' });
  d.arrow(92, 70, 196, 88, { pen: 'blue' });
  d.group(() => {
    d.rect(200, 20, 132, 34, { pen: 'muted', fill: 'muted', rough: 0.7, label: 'A: old checkout', size: 15 });
    d.rect(200, 72, 132, 34, { pen: 'orange', fill: 'orange', rough: 0.7, label: 'B: new checkout', size: 15 });
  });
  d.text(348, 52, 'H₀: same conversion\nmetric: orders / user', { pen: 'ink', size: 15, anchor: 'start' });

  d.step('Sample size from baseline and MDE');
  d.text(20, 136, 'baseline 10 % · detect +1 pp (MDE)', { pen: 'muted', size: 15, anchor: 'start' });
  d.text(20, 158, 'α = 0.05 · power = 0.8', { pen: 'muted', size: 15, anchor: 'start' });
  d.text(20, 186, 'n = 14,750 per arm', { pen: 'blue', size: 18, bold: true, anchor: 'start' });

  d.step('Run time: whole weeks');
  d.group(() => {
    for (let i = 0; i < 14; i++) {
      const col = i % 7;
      const row = Math.floor(i / 7);
      d.rect(312 + col * 26, 128 + row * 26, 20, 20, {
        pen: i < 10 ? 'blue' : 'muted',
        fill: i < 10 ? 'blue' : undefined,
        rough: 0.5,
        single: true,
      });
    }
  });
  d.text(404, 194, '3,000 users/day → 10 days;\nround up to 2 full weeks', { pen: 'blue', size: 14 });

  d.step('Do not peek and stop early');
  d.group(() => {
    d.line(GX, GY, GX + GW + 6, GY, { pen: 'muted', single: true });
    d.line(GX, gy(-1.2), GX, gy(2.8), { pen: 'muted', single: true });
    d.text(GX - 8, gy(2.9) - 6, 'z', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(GX + GW, GY + 30, 'day 14', { pen: 'muted', size: 14, anchor: 'end' });
    d.line(GX, gy(1.96), GX + GW, gy(1.96), { pen: 'red', dashed: true });
    d.text(GX + GW + 8, gy(1.96), '1.96', { pen: 'red', size: 14, mono: true, anchor: 'start' });
  });
  d.curve(
    PATH.map((z, i) => [gx(i + 1), gy(z)]),
    { pen: 'violet', thick: true },
  );
  d.group(() => {
    d.dot(gx(3), gy(2.15), 10, { pen: 'red', single: true });
    d.text(gx(3) + 10, gy(2.15) - 18, 'day 3: "significant!"', { pen: 'red', size: 14, anchor: 'start' });
  });
  d.text(314, 262, 'daily peeks, no real effect:\nfalse wins 5 % → ~22 %', {
    pen: 'red',
    size: 15,
    anchor: 'start',
  });

  d.step('Check the split first: SRM');
  d.group(() => {
    d.text(20, 346, 'planned 50 / 50, got', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(20, 368, '15,100 vs 14,400', { pen: 'ink', size: 15, mono: true, anchor: 'start' });
    d.text(20, 392, 'χ² = 16.6, p < 0.0001: broken', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('Read the result and the guardrails');
  d.group(() => {
    d.text(286, 346, 'B − A = +0.85 pp, p = 0.017', { pen: 'green', size: 15, anchor: 'start' });
    d.text(286, 368, '95 % CI: +0.15 to +1.54 pp', { pen: 'green', size: 15, anchor: 'start' });
    d.text(286, 392, 'guardrails: latency, refunds', { pen: 'violet', size: 15, anchor: 'start' });
  });
};
