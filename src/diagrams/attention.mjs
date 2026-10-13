export const meta = {
  title: 'Attention: the word "it" queries every key, softmax weights, a weighted mix of values',
  width: 520,
  height: 420,
};

const WORDS = ['animal', 'street', 'it', 'tired'];
const XS = [115, 220, 325, 430];
const SCORES = [3.0, 0.0, 0.5, 1.0];
const exps = SCORES.map((s) => Math.exp(s));
const total = exps.reduce((a, b) => a + b, 0);
const WEIGHTS = exps.map((e) => e / total); // 0.79, 0.04, 0.06, 0.11

const QX = 270; // query box centre
const KEY_Y = 122;
const SCORE_Y = 178;
const BAR_BASE = 262;
const BAR_SCALE = 76;
const VAL_Y = 300;
const OUT_Y = 356;

export default (d) => {
  d.step('A sentence, and the words "it" could mean');
  d.group(() => {
    d.text(372, 22, 'The animal didn’t cross the street because', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(386, 22, 'it', { pen: 'red', size: 17, bold: true });
    d.text(400, 22, 'was tired', { pen: 'muted', size: 15, anchor: 'start' });
  });
  d.group(() => {
    for (const [i, w] of WORDS.entries())
      d.rect(XS[i] - 42, KEY_Y, 84, 30, { pen: 'blue', fill: 'blue', label: w, size: 17, rough: 0.7 });
  });

  d.step('"it" sends out a query');
  d.arrow(384, 34, 352, 54, { pen: 'red' });
  d.rect(QX - 80, 56, 160, 30, {
    pen: 'red',
    fill: 'red',
    label: 'query of "it"',
    size: 16,
    bold: true,
    rough: 0.7,
  });
  d.group(() => {
    for (const x of XS)
      d.arrow(QX + (x - QX) * 0.15, 88, x, KEY_Y - 4, { pen: 'red', thin: true, headSize: 9 });
  });
  d.text(14, KEY_Y + 15, 'keys', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Dot product with every key');
  d.group(() => {
    d.text(14, SCORE_Y, 'q·k/√d', { pen: 'ink', size: 14, anchor: 'start' });
    for (const [i, s] of SCORES.entries())
      d.text(XS[i], SCORE_Y, s.toFixed(1), { pen: 'ink', size: 19, bold: true });
  });

  d.step('Softmax turns scores into weights');
  d.group(() => {
    d.text(14, 222, 'softmax', { pen: 'orange', size: 15, anchor: 'start' });
    d.text(14, 242, '(sum = 1)', { pen: 'orange', size: 14, anchor: 'start' });
    d.line(XS[0] - 30, BAR_BASE, XS[3] + 30, BAR_BASE, { pen: 'muted', thin: true });
    for (const [i, w] of WEIGHTS.entries()) {
      const h = Math.max(3, w * BAR_SCALE);
      d.rect(XS[i] - 18, BAR_BASE - h, 36, h, { pen: 'orange', fill: 'orange', rough: 0.5 });
      d.text(XS[i], BAR_BASE + 15, w.toFixed(2), { pen: 'orange', size: 17, bold: true });
    }
  });

  d.step('Output: a weighted mix of the values');
  d.group(() => {
    d.text(14, VAL_Y + 13, 'values', { pen: 'green', size: 15, anchor: 'start' });
    for (const x of XS)
      d.rect(x - 26, VAL_Y, 52, 26, { pen: 'green', fill: 'green', label: 'v', size: 17, rough: 0.6 });
  });
  d.group(() => {
    for (const [i, x] of XS.entries()) {
      d.arrow(x, VAL_Y + 28, QX + (x - QX) * 0.3, OUT_Y - 4, {
        pen: 'green',
        thick: WEIGHTS[i] > 0.5,
        thin: WEIGHTS[i] < 0.1,
        headSize: 8,
      });
    }
  });
  d.rect(110, OUT_Y, 320, 40, {
    pen: 'violet',
    fill: 'violet',
    label: 'new "it" = 0.79·v(animal) + …',
    size: 17,
    bold: true,
    rough: 0.7,
  });
};
