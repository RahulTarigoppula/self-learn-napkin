export const meta = {
  title: 'Confusion matrix, precision and recall, PR and ROC curves',
  width: 520,
  height: 420,
};

// Confusion matrix at threshold 0.5 (100 emails, 10 spam).
const MX = 96;
const MY = 44;
const CW = 88;
const CH = 54;

// Plots
const PY = 342; // baseline of both plots
const PH = 120;
const PRX = 56;
const ROCX = 300;
const PW = 180;
const pr = (r, p) => [PRX + PW * r, PY - PH * p];
const roc = (f, t) => [ROCX + PW * f, PY - PH * t];

// The three thresholds: [t, recall (= TPR), precision, FPR]
const T = [
  [0.8, 0.6, 6 / 7, 1 / 90],
  [0.5, 0.8, 8 / 12, 4 / 90],
  [0.2, 1.0, 10 / 25, 15 / 90],
];

export default (d) => {
  d.step('The confusion matrix');
  d.group(() => {
    d.text(MX + CW / 2, MY - 24, 'flagged', { pen: 'muted', size: 15 });
    d.text(MX + CW * 1.5, MY - 24, 'not flagged', { pen: 'muted', size: 15 });
    d.text(MX - 10, MY + CH / 2, 'spam', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(MX - 10, MY + CH * 1.5, 'not spam', { pen: 'muted', size: 15, anchor: 'end' });
  });
  d.group(() => {
    d.rect(MX, MY, CW, CH, { pen: 'green', fill: 'green', rough: 0.6, label: 'TP 8', size: 18, bold: true });
    d.rect(MX + CW, MY, CW, CH, {
      pen: 'orange',
      fill: 'orange',
      rough: 0.6,
      label: 'FN 2',
      size: 18,
      bold: true,
    });
    d.rect(MX, MY + CH, CW, CH, { pen: 'red', fill: 'red', rough: 0.6, label: 'FP 4', size: 18, bold: true });
    d.rect(MX + CW, MY + CH, CW, CH, {
      pen: 'muted',
      fill: 'muted',
      rough: 0.6,
      label: 'TN 86',
      size: 18,
      bold: true,
    });
  });
  d.text(MX + CW, MY + 2 * CH + 25, '100 emails · threshold 0.5', { pen: 'muted', size: 15 });

  d.step('Precision: of what we flagged…');
  d.rect(MX - 4, MY - 4, CW + 8, 2 * CH + 8, { pen: 'blue', thick: true, rough: 0.8 });
  d.text(298, 46, 'precision = TP / (TP + FP)', { pen: 'blue', size: 15, anchor: 'start' });
  d.text(298, 70, '= 8 / 12 = 0.67', { pen: 'blue', size: 18, bold: true, anchor: 'start' });

  d.step('Recall: of the real spam…');
  d.rect(MX - 8, MY - 8, 2 * CW + 16, CH + 12, { pen: 'violet', thick: true, rough: 0.8, dashed: true });
  d.text(298, 112, 'recall = TP / (TP + FN)', { pen: 'violet', size: 15, anchor: 'start' });
  d.text(298, 136, '= 8 / 10 = 0.80', { pen: 'violet', size: 18, bold: true, anchor: 'start' });

  d.step('Slide the threshold: the PR curve');
  d.group(() => {
    d.line(PRX, PY, PRX + PW + 4, PY, { pen: 'muted' });
    d.line(PRX, PY, PRX, PY - PH - 6, { pen: 'muted' });
    d.text(PRX, PY - PH - 18, 'precision', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(PRX + PW, PY + 16, 'recall', { pen: 'muted', size: 15, anchor: 'end' });
  });
  d.curve([pr(0.05, 1), pr(0.35, 0.96), pr(0.6, 6 / 7), pr(0.8, 8 / 12), pr(1, 0.4)], {
    pen: 'blue',
    thick: true,
  });
  d.group(() => {
    for (const [t, r, p] of T)
      d.dot(...pr(r, p), 10, { pen: 'blue', label: `t=${t}`, dx: 24, dy: -10, size: 14 });
  });

  d.step('The ROC curve and its area');
  d.group(() => {
    d.line(ROCX, PY, ROCX + PW + 4, PY, { pen: 'muted' });
    d.line(ROCX, PY, ROCX, PY - PH - 6, { pen: 'muted' });
    d.text(ROCX, PY - PH - 18, 'TPR (recall)', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(ROCX + PW, PY + 16, 'FPR', { pen: 'muted', size: 15, anchor: 'end' });
    d.line(ROCX, PY, ROCX + PW, PY - PH, { pen: 'muted', dashed: true });
    d.text(ROCX + PW - 4, PY - 18, 'random', { pen: 'muted', size: 14, anchor: 'end' });
  });
  d.poly([roc(0, 0), ...T.map(([, r, , f]) => roc(f, r)), roc(1, 1)], { pen: 'green', thick: true });
  d.text(ROCX + 44, PY - PH + 44, 'AUC\n= 0.97', { pen: 'green', size: 17, bold: true });

  d.step('Rare positives: trust the PR curve');
  d.curve([pr(0.05, 0.75), pr(0.3, 0.55), pr(0.6, 60 / 170), pr(0.8, 80 / 520), pr(1, 100 / 1750)], {
    pen: 'red',
    thick: true,
    dashed: true,
  });
  d.text(260, 380, 'dashed: same model, only 1 % spam', { pen: 'red', size: 15 });
  d.text(260, 400, 't = 0.5: precision = 80 / 520 = 0.15, ROC unchanged', { pen: 'red', size: 15 });
};
