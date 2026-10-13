export const meta = { title: 'One dataset split into train, validation and test', width: 520, height: 414 };

// 20 blocks of 50 rows = 1,000 rows. 14 train, 3 validation, 3 test.
const X0 = 20;
const W = 24;
const bx = (i) => X0 + i * W;

// Learning curves for the plot (loss 0..1 mapped onto the plot box).
const PX0 = 56;
const PX1 = 296;
const PY0 = 300;
const PH = 160;
const px = (t) => PX0 + (PX1 - PX0) * t;
const py = (loss) => PY0 - PH * loss;
const trainLoss = (t) => 0.15 + 0.85 * Math.exp(-4 * t);
const valLoss = (t) => trainLoss(t) + 0.5 * t * t;
const pts = (f) => Array.from({ length: 21 }, (_, i) => [px(i / 20), py(f(i / 20))]);

export default (d) => {
  d.step('One dataset, shuffled');
  d.text(260, 22, '1,000 labelled rows, shuffled', { pen: 'muted', size: 16 });
  d.group(() => {
    for (let i = 0; i < 20; i++) d.rect(bx(i) + 1, 38, W - 2, 22, { pen: 'muted', rough: 0.6 });
  });

  d.step('Cut it 70 / 15 / 15');
  const bracket = (i0, i1, pen) =>
    d.poly(
      [
        [bx(i0) + 2, 68],
        [bx(i0) + 2, 76],
        [bx(i1) - 2, 76],
        [bx(i1) - 2, 68],
      ],
      { pen, thick: true, rough: 0.5 },
    );
  d.group(() => {
    bracket(0, 14, 'blue');
    d.text(bx(7), 94, 'train · 700 rows', { pen: 'blue', size: 17, bold: true });
  });
  d.group(() => {
    bracket(14, 17, 'orange');
    d.text(bx(15.5), 100, 'val\n150', { pen: 'orange', size: 16, bold: true });
  });
  d.group(() => {
    bracket(17, 20, 'red');
    d.text(bx(18.5), 100, 'test\n150', { pen: 'red', size: 16, bold: true });
  });

  d.step('Train: fit the weights');
  d.group(() => {
    d.line(PX0 - 6, PY0, PX1 + 4, PY0, { pen: 'muted' });
    d.line(PX0 - 6, PY0, PX0 - 6, PY0 - PH - 14, { pen: 'muted' });
    d.text(PX0 - 6, PY0 - PH - 28, 'loss', { pen: 'muted', size: 15 });
    d.text(PX1 + 4, PY0 + 16, 'epochs', { pen: 'muted', size: 15, anchor: 'end' });
  });
  d.arrow(150, 112, 128, 196, { pen: 'blue', bend: 8 });
  d.curve(pts(trainLoss), { pen: 'blue', thick: true });
  d.text(PX1 + 8, py(trainLoss(1)), 'train loss', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Validation: tune and stop early');
  d.curve(pts(valLoss), { pen: 'orange', thick: true });
  d.text(PX1 + 8, py(valLoss(1)), 'val loss', { pen: 'orange', size: 15, anchor: 'start' });
  const tBest = 0.49;
  d.arrow(380, 126, px(tBest) + 20, py(valLoss(tBest)) - 18, { pen: 'orange', bend: 14 });
  d.group(() => {
    d.line(px(tBest), py(valLoss(tBest)), px(tBest), PY0, { pen: 'orange', dashed: true });
    d.dot(px(tBest), py(valLoss(tBest)), 12, { pen: 'orange' });
    d.text(px(tBest), PY0 + 16, 'stop here', { pen: 'orange', size: 15 });
  });

  d.step('Test: open it once, at the end');
  d.arrow(464, 124, 464, 172, { pen: 'red' });
  d.group(() => {
    d.rect(414, 178, 92, 58, { pen: 'red', fill: 'red' });
    d.poly(
      [
        [414, 178],
        [460, 212],
        [506, 178],
      ],
      { pen: 'red' },
    );
  });
  d.text(460, 264, 'open once:\nthe honest\nfinal score', { pen: 'red', size: 15 });

  d.step('No peeking: avoid leakage');
  d.text(24, 344, 'leak: scaler.fit(all 1,000 rows)', { pen: 'red', size: 16, anchor: 'start' });
  d.text(24, 368, 'safe: scaler.fit(train rows only)', { pen: 'green', size: 16, anchor: 'start' });
  d.text(24, 394, 'time series: train on the past, test on the future', {
    pen: 'muted',
    size: 15,
    anchor: 'start',
  });
};
