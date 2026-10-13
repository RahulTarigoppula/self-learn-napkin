export const meta = {
  title: 'Five-fold cross-validation, stratified and time-series variants',
  width: 520,
  height: 416,
};

const BX = 96; // first block x
const BW = 56; // block width
const ROW0 = 92;
const RH = 24;
const GAP = 6;
const SCORES = ['0.82', '0.85', '0.80', '0.84', '0.83'];
const SX = BX + 5 * BW + 24; // score column
const rowY = (r) => ROW0 + r * (RH + GAP);

/** One round: fold r validates, the other four train. */
function round(d, r) {
  d.group(() => {
    d.text(BX - 12, rowY(r) + RH / 2, `round ${r + 1}`, { pen: 'muted', size: 15, anchor: 'end' });
    for (let i = 0; i < 5; i++) {
      const isVal = i === r;
      d.rect(BX + i * BW + 2, rowY(r), BW - 4, RH, {
        pen: isVal ? 'orange' : 'blue',
        fill: isVal ? 'orange' : 'blue',
        rough: 0.6,
        single: true,
        label: isVal ? 'val' : undefined,
        size: 15,
        bold: true,
      });
    }
    d.text(SX, rowY(r) + RH / 2, SCORES[r], { pen: 'orange', size: 18, anchor: 'start' });
  });
}

export default (d) => {
  d.step('Cut the data into 5 folds');
  d.text(BX + 2.5 * BW, 18, '1,000 rows → 5 folds of 200', { pen: 'muted', size: 16 });
  d.group(() => {
    for (let i = 0; i < 5; i++)
      d.rect(BX + i * BW + 2, 32, BW - 4, 28, { pen: 'ink', rough: 0.6, label: `F${i + 1}`, size: 16 });
  });

  d.step('Round 1: fold 1 validates');
  d.text(SX, 74, 'score', { pen: 'muted', size: 15, anchor: 'start' });
  round(d, 0);

  d.step('Every fold takes a turn');
  for (let r = 1; r < 5; r++) round(d, r);

  d.step('Average the five scores');
  d.group(() => {
    d.line(SX - 6, rowY(5) + 2, SX + 70, rowY(5) + 2, { pen: 'ink', thick: true });
    d.text(SX, rowY(5) + 20, 'mean 0.83', { pen: 'ink', size: 18, bold: true, anchor: 'start' });
    d.text(SX, rowY(5) + 42, '± 0.02', { pen: 'muted', size: 16, anchor: 'start' });
  });
  d.text(BX + 2.5 * BW, rowY(5) + 20, 'every row is validated exactly once', { pen: 'muted', size: 15 });

  d.step('Stratified: keep the class mix');
  d.group(() => {
    d.text(22, 312, 'stratified', { pen: 'violet', size: 17, bold: true, anchor: 'start' });
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 44;
      d.rect(x, 328, 38, 28, { pen: 'violet', rough: 0.6, single: true });
      d.rect(x + 3, 331, 6, 22, { pen: 'red', fill: 'red', rough: 0.3, single: true });
    }
    d.text(22, 378, '10 % spam in every fold', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('Time series: never train on the future');
  d.group(() => {
    d.text(286, 312, 'time series', { pen: 'green', size: 17, bold: true, anchor: 'start' });
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 5; i++) {
        const kind = i <= r ? 'train' : i === r + 1 ? 'val' : 'unused';
        const o =
          kind === 'train'
            ? { pen: 'blue', fill: 'blue' }
            : kind === 'val'
              ? { pen: 'orange', fill: 'orange' }
              : { pen: 'muted', dashed: true };
        d.rect(288 + i * 42, 324 + r * 21, 38, 16, { ...o, rough: 0.5, single: true });
      }
    }
    d.text(286, 400, 'time', { pen: 'muted', size: 15, anchor: 'start' });
    d.arrow(334, 400, 494, 400, { pen: 'muted' });
  });
};
