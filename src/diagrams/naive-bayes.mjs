export const meta = {
  title:
    'Naive Bayes spam filter: word counts per class, Bayes rule, the naive independence product, Laplace smoothing, scoring the email "free win" and adding log-probabilities',
  width: 520,
  height: 420,
};

// Training data: 4 spam emails (free 6, win 3, meeting 1) and 6 ham emails (free 2, win 0, meeting 8).
const WORDS = ['free', 'win', 'meeting'];
const TABLES = [
  { x: 16, title: 'spam: 4 emails', prior: 'P = 0.4', pen: 'red', counts: [6, 3, 1] },
  { x: 270, title: 'ham: 6 emails', prior: 'P = 0.6', pen: 'blue', counts: [2, 0, 8] },
];
const CW = [84, 56, 94]; // word | count | smoothed P
const TY = 20;
const HH = 26;
const RH = 24;
const rowY = (r) => TY + HH + r * RH;
const colX = (t, c) => t.x + CW.slice(0, c).reduce((a, b) => a + b, 0);
const neat = { rough: 0.4, single: true };

export default (d) => {
  d.step('Count words in each class');
  for (const t of TABLES) {
    d.group(() => {
      d.rect(t.x, TY, CW[0] + CW[1], HH, { pen: t.pen, fill: t.pen, ...neat });
      d.text(t.x + 8, TY + HH / 2, t.title, { pen: 'ink', size: 14, anchor: 'start' });
      WORDS.forEach((w, r) => {
        d.rect(t.x, rowY(r), CW[0], RH, { pen: 'muted', label: w, size: 15, textPen: 'ink', ...neat });
        d.rect(colX(t, 1), rowY(r), CW[1], RH, {
          pen: 'muted',
          label: String(t.counts[r]),
          size: 15,
          mono: true,
          textPen: 'ink',
          ...neat,
        });
      });
      d.text(t.x + 4, rowY(3) + 12, `10 words · prior ${t.prior}`, { pen: 'muted', size: 14, anchor: 'start' });
    });
  }

  d.step("Bayes' rule");
  d.text(260, 150, 'P(spam | email) ∝ P(spam) × P(email | spam)', { pen: 'ink', size: 15, mono: true });

  d.step('Naive: words are independent');
  d.text(260, 178, 'P("free win" | spam) ≈ P(free|spam) × P(win|spam)', {
    pen: 'violet',
    size: 14,
    mono: true,
  });

  d.step('Zero counts: Laplace smoothing');
  d.circle(colX(TABLES[1], 1) + CW[1] / 2, rowY(1) + RH / 2, 34, { pen: 'red', thick: true, rough: 0.6, single: true });
  for (const t of TABLES) {
    d.group(() => {
      d.rect(colX(t, 2), TY, CW[2], HH, { pen: 'green', fill: 'green', label: '(c+1)/13', size: 14, mono: true, textPen: 'ink', ...neat });
      t.counts.forEach((c, r) => {
        d.rect(colX(t, 2), rowY(r), CW[2], RH, {
          pen: 'green',
          label: `${c + 1}/13`,
          size: 15,
          mono: true,
          textPen: 'green',
          ...neat,
        });
      });
    });
  }
  d.text(260, 214, 'P(win | ham) = 0/10 would zero the product:\nadd 1 to every count (Laplace smoothing)', {
    pen: 'red',
    size: 14,
  });

  d.step('Score the email "free win"');
  d.text(16, 252, 'new email: "free win"', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
  const BX = 64;
  const BW = 2400; // px per unit of score
  for (const [i, [lab, expr, v, pen]] of [
    ['spam', '0.4 × 7/13 × 4/13 = 0.066', 0.0663, 'red'],
    ['ham', '0.6 × 3/13 × 1/13 = 0.011', 0.0107, 'blue'],
  ].entries()) {
    const y = 282 + i * 28;
    d.group(() => {
      d.text(BX - 8, y, lab, { pen, size: 15, anchor: 'end' });
      d.rect(BX, y - 9, v * BW, 18, { pen, fill: pen, ...neat });
      d.text(BX + v * BW + 10, y, expr, { pen, size: 14, mono: true, anchor: 'start' });
    });
  }
  d.text(500, 334, 'P(spam | email) = 0.066 / 0.077 = 86 %', { pen: 'red', size: 15, bold: true, anchor: 'end' });

  d.step('Add logs instead of multiplying');
  d.group(() => {
    d.text(16, 358, 'ln spam = −0.92 − 0.62 − 1.18 = −2.71', { pen: 'red', size: 14, mono: true, anchor: 'start' });
    d.text(16, 378, 'ln ham  = −0.51 − 1.47 − 2.56 = −4.54', { pen: 'blue', size: 14, mono: true, anchor: 'start' });
  });
  d.text(16, 399, '1,000 words: 0.001¹⁰⁰⁰ underflows to 0, but its log is just −6,908', {
    pen: 'muted',
    size: 14,
    anchor: 'start',
  });
};
