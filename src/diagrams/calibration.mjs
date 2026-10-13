export const meta = {
  title: 'Calibration: reliability diagram, an overconfident model, Brier score and Platt / isotonic fixes',
  width: 520,
  height: 420,
};

// Reliability plot: predicted probability across, observed fraction up.
const X0 = 58;
const Y0 = 368;
const S = 232;
const P = (pred, obs) => [X0 + S * pred, Y0 - S * obs];

// Overconfident model: says p, truth is sigma(logit(p) / 2).
const BINS = [0.1, 0.3, 0.5, 0.7, 0.9];
const truth = (p) => {
  const z = Math.log(p / (1 - p)) / 2;
  return 1 / (1 + Math.exp(-z));
};

export default (d) => {
  d.step('Calibrated: 0.8 means 8 in 10');
  d.text(20, 22, '10 emails, each scored 0.8 by the model', { pen: 'muted', size: 15, anchor: 'start' });
  d.group(() => {
    for (let i = 0; i < 10; i++) {
      const spam = i < 8;
      d.rect(24 + i * 27, 40, 21, 21, {
        pen: spam ? 'red' : 'green',
        fill: spam ? 'red' : 'green',
        rough: 0.6,
        single: true,
      });
    }
  });
  d.text(306, 51, '8 spam, 2 not: calibrated', { pen: 'red', size: 16, bold: true, anchor: 'start' });

  d.step('The reliability diagram');
  d.group(() => {
    d.line(X0, Y0, X0 + S + 6, Y0, { pen: 'muted', single: true });
    d.line(X0, Y0, X0, Y0 - S - 8, { pen: 'muted', single: true });
    d.text(X0 - 6, Y0 - S - 22, 'share actually spam', { pen: 'muted', size: 14, anchor: 'start' });
    d.text(X0 + S, Y0 + 18, 'predicted p', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(X0 - 8, Y0, '0', { pen: 'muted', size: 14, mono: true, anchor: 'end' });
    d.text(X0 - 8, Y0 - S, '1', { pen: 'muted', size: 14, mono: true, anchor: 'end' });
  });
  d.group(() => {
    d.line(...P(0, 0), ...P(1, 1), { pen: 'green', dashed: true });
    d.text(...P(0.3, 0.86), 'perfect:\nsays p, p happens', { pen: 'green', size: 14 });
  });

  d.step('An overconfident model');
  d.curve(
    Array.from({ length: 21 }, (_, i) => {
      const p = 0.02 + (0.96 * i) / 20;
      return P(p, truth(p));
    }),
    { pen: 'red', thick: true },
  );
  d.group(() => {
    for (const b of BINS) d.dot(...P(b, truth(b)), 10, { pen: 'red', single: true });
  });
  d.group(() => {
    d.arrow(...P(0.86, 0.4), ...P(0.9, truth(0.9) - 0.05), { pen: 'red', thin: true, headSize: 8 });
    d.text(...P(0.8, 0.3), 'says 0.9,\nonly 75 %', { pen: 'red', size: 15 });
  });

  d.step('Score it: Brier and log-loss');
  d.group(() => {
    const cols = [334, 378, 416];
    ['p', 'y', '(p−y)²'].forEach((h, j) =>
      d.text(cols[j], 104, h, { pen: 'muted', size: 14, mono: true, anchor: 'start' }),
    );
    const rows = [
      ['0.9', '1', '0.01'],
      ['0.8', '1', '0.04'],
      ['0.7', '0', '0.49'],
      ['0.2', '0', '0.04'],
      ['0.1', '0', '0.01'],
    ];
    rows.forEach((r, i) =>
      r.forEach((v, j) =>
        d.text(cols[j], 126 + i * 20, v, {
          pen: r[2] === '0.49' ? 'red' : 'ink',
          size: 14,
          mono: true,
          anchor: 'start',
        }),
      ),
    );
  });
  d.group(() => {
    d.text(334, 236, 'Brier = 0.118', { pen: 'blue', size: 15, mono: true, anchor: 'start' });
    d.text(334, 258, 'log-loss = 0.372', { pen: 'blue', size: 15, mono: true, anchor: 'start' });
  });

  d.step('Fix it: Platt scaling or isotonic');
  // Isotonic regression learns the red curve as monotone steps (bin levels = observed shares).
  const lv = BINS.map(truth);
  d.poly(
    BINS.flatMap((b, i) => [P(b - 0.1, lv[i]), P(b + 0.1, lv[i])]),
    { pen: 'violet', thin: true },
  );
  d.group(() => {
    for (const v of lv) d.dot(...P(v, v), 10, { pen: 'green', single: true });
  });
  d.group(() => {
    d.text(328, 300, 'learn the red curve on', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(328, 320, 'held-out data, then', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(328, 340, 're-map every score', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(328, 366, 'Platt: σ(a·z + b)', { pen: 'green', size: 15, anchor: 'start' });
    d.text(328, 388, 'isotonic: monotone steps', { pen: 'violet', size: 15, anchor: 'start' });
  });
};
