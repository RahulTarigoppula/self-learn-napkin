export const meta = {
  title: 'Class imbalance: accuracy lies, PR curve, resampling the training split, weights and thresholds',
  width: 520,
  height: 420,
};

// PR plot (row 3, left)
const PX = 52;
const PY = 314;
const PW = 172;
const PH = 84;
const pr = (r, p) => [PX + PW * r, PY - PH * p];

// Threshold axis (row 4, right): score 0..1
const TX = 290;
const TW = 200;
const TY = 380;
const tx = (s) => TX + TW * s;

export default (d) => {
  d.step('99 to 1: accuracy lies');
  d.text(20, 22, '10,000 transactions', { pen: 'muted', size: 15, anchor: 'start' });
  d.group(() => {
    d.rect(24, 38, 452, 34, { pen: 'muted', fill: 'muted', rough: 0.6, label: '9,900 legit', size: 16 });
    d.rect(476, 38, 14, 34, { pen: 'red', fill: 'red', rough: 0.6 });
    d.text(490, 22, '100 fraud', { pen: 'red', size: 15, anchor: 'end' });
  });
  d.text(256, 94, 'always say "legit": 99 % accuracy, 0 fraud caught', { pen: 'red', size: 16, bold: true });

  d.step('A useful model scores lower');
  d.group(() => {
    d.text(208, 124, 'accuracy', { pen: 'muted', size: 14, mono: true });
    d.text(310, 124, 'recall', { pen: 'muted', size: 14, mono: true });
    d.text(414, 124, 'precision', { pen: 'muted', size: 14, mono: true });
    d.text(24, 148, 'always legit', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(208, 148, '99.0 %', { pen: 'ink', size: 15, mono: true });
    d.text(310, 148, '0.00', { pen: 'red', size: 15, mono: true });
    d.text(414, 148, '—', { pen: 'ink', size: 15, mono: true });
  });
  d.group(() => {
    d.text(24, 174, 'our model', { pen: 'green', size: 15, anchor: 'start', bold: true });
    d.text(208, 174, '97.7 %', { pen: 'green', size: 15, mono: true });
    d.text(310, 174, '0.70', { pen: 'green', size: 15, mono: true });
    d.text(414, 174, '0.26', { pen: 'green', size: 15, mono: true });
  });

  d.step('Measure the rare class: the PR curve');
  d.group(() => {
    d.line(PX, PY, PX + PW + 4, PY, { pen: 'muted', single: true });
    d.line(PX, PY, PX, PY - PH - 6, { pen: 'muted', single: true });
    d.text(PX - 4, PY - PH - 18, 'precision', { pen: 'muted', size: 14, anchor: 'start' });
    d.text(PX + PW, PY + 14, 'recall', { pen: 'muted', size: 14, anchor: 'end' });
  });
  d.curve([pr(0.02, 0.95), pr(0.3, 0.72), pr(0.5, 0.5), pr(0.7, 0.26), pr(0.88, 0.1), pr(1, 0.03)], {
    pen: 'blue',
    thick: true,
  });
  d.group(() => {
    d.line(PX, PY - PH * 0.02, PX + PW, PY - PH * 0.02, { pen: 'red', dashed: true });
    d.text(PX + 6, PY - 14, 'random: 0.01', { pen: 'red', size: 14, anchor: 'start' });
  });
  d.dot(...pr(0.7, 0.26), 10, { pen: 'green', label: 'our model', dx: 30, dy: -16, size: 14 });

  d.step('Resample the training split only');
  d.group(() => {
    d.rect(266, 208, 120, 104, { pen: 'blue', rough: 0.7 });
    d.text(326, 222, 'train', { pen: 'blue', size: 15, bold: true });
    d.rect(400, 208, 96, 104, { pen: 'muted', rough: 0.7 });
    d.text(448, 222, 'test', { pen: 'muted', size: 15, bold: true });
    d.text(448, 266, 'untouched:\nstill 99 : 1', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    d.line(286, 280, 366, 250, { pen: 'orange', dashed: true });
    d.dot(286, 280, 11, { pen: 'red', single: true });
    d.dot(366, 250, 11, { pen: 'red', single: true });
    d.dot(326, 265, 11, { pen: 'orange', single: true });
    d.text(326, 294, 'SMOTE point', { pen: 'orange', size: 14 });
  });

  d.step('Class weights: make each class count equally');
  d.text(24, 346, 'balanced class weights', { pen: 'violet', size: 15, anchor: 'start' });
  d.group(() => {
    d.text(24, 370, '9,900 legit × 0.505 = 5,000', { pen: 'ink', size: 15, anchor: 'start' });
    d.text(24, 394, '100 fraud × 50 = 5,000', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('Move the threshold to match the costs');
  d.group(() => {
    d.line(TX, TY, TX + TW, TY, { pen: 'muted', single: true });
    d.text(TX - 8, TY, '0', { pen: 'muted', size: 14, mono: true });
    d.text(TX + TW + 8, TY, '1', { pen: 'muted', size: 14, mono: true });
    d.text(TX + TW / 2, 328, 'flag if p(fraud) ≥ t', { pen: 'muted', size: 15 });
  });
  d.group(() => {
    d.line(tx(0.5), TY - 10, tx(0.5), TY + 10, { pen: 'muted', thick: true });
    d.text(tx(0.5), TY + 18, 'default 0.5', { pen: 'muted', size: 14 });
  });
  d.arrow(tx(0.47), TY - 12, tx(0.03), TY - 12, { pen: 'orange', thick: true });
  d.group(() => {
    d.line(tx(0.0099), TY - 10, tx(0.0099), TY + 10, { pen: 'orange', thick: true });
    d.text(TX - 2, 350, 't = 5 / (5 + 500) ≈ 0.01', { pen: 'orange', size: 15, anchor: 'start' });
  });
};
