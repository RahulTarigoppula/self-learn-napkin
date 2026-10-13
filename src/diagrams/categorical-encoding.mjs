export const meta = {
  title:
    'A city column encoded as one-hot, ordinal, target mean and smoothed target mean, plus hashing and embeddings',
  width: 520,
  height: 420,
};

// Six rows: London 1,1 · Paris 0,0 · Tokyo 1,0. Global mean 0.5; smoothing m = 2.
const CITY = ['London', 'Paris', 'Tokyo', 'London', 'Paris', 'Tokyo'];
const Y = [1, 0, 1, 1, 0, 0];
const IDX = { London: 0, Paris: 1, Tokyo: 2 };
const MEAN = { London: '1.0', Paris: '0.0', Tokyo: '0.5' };
const SMOOTH = { London: '0.75', Paris: '0.25', Tokyo: '0.50' };

const TX = 16;
const HY = 30;
const HH = 30;
const RH = 24;
const W = { city: 66, y: 32, oh: 30, ord: 40, mean: 56, sm: 60 };
const X = {
  city: TX,
  y: TX + W.city,
  oh: TX + W.city + W.y + 6,
};
X.ord = X.oh + 3 * W.oh + 6;
X.mean = X.ord + W.ord + 6;
X.sm = X.mean + W.mean + 6;
const rowY = (r) => HY + HH + r * RH;
const NOTE_X = X.sm + W.sm + 10;

const cell = (d, x, w, r, label, pen = 'ink') =>
  d.rect(x, rowY(r), w, RH, {
    pen: 'muted',
    rough: 0.3,
    single: true,
    label,
    size: 15,
    mono: true,
    textPen: pen,
  });
const head = (d, x, w, label, pen) =>
  d.rect(x, HY, w, HH, {
    pen,
    fill: pen === 'ink' ? undefined : pen,
    rough: 0.4,
    single: true,
    label,
    size: 14,
    textPen: 'ink',
  });

export default (d) => {
  d.step('A city column and a label');
  d.group(() => {
    head(d, X.city, W.city, 'city', 'ink');
    head(d, X.y, W.y, 'y', 'ink');
    CITY.forEach((c, r) => {
      d.rect(X.city, rowY(r), W.city, RH, {
        pen: 'muted',
        rough: 0.3,
        single: true,
        label: c,
        size: 15,
        textPen: 'ink',
      });
      cell(d, X.y, W.y, r, String(Y[r]));
    });
  });

  d.step('One-hot: a 0/1 column per city');
  d.group(() => {
    ['L', 'P', 'T'].forEach((h, i) => head(d, X.oh + i * W.oh, W.oh, h, 'blue'));
    CITY.forEach((c, r) => {
      for (let i = 0; i < 3; i++)
        cell(d, X.oh + i * W.oh, W.oh, r, IDX[c] === i ? '1' : '0', IDX[c] === i ? 'blue' : 'muted');
    });
  });
  d.text(NOTE_X, 70, 'one column\nper city', { pen: 'blue', size: 14, anchor: 'start' });

  d.step('Ordinal: one integer per city');
  d.group(() => {
    head(d, X.ord, W.ord, 'ord', 'red');
    CITY.forEach((c, r) => cell(d, X.ord, W.ord, r, String(IDX[c]), 'red'));
  });
  d.text(NOTE_X, 116, 'fake order:\nL < P < T', { pen: 'red', size: 14, anchor: 'start' });

  d.step('Target encoding: the mean of y');
  d.group(() => {
    head(d, X.mean, W.mean, 'mean y', 'orange');
    CITY.forEach((c, r) => cell(d, X.mean, W.mean, r, MEAN[c], 'orange'));
  });
  d.group(() => {
    d.rect(X.mean + 3, rowY(0) + 2, W.mean - 6, RH - 4, { pen: 'red', thick: true, rough: 0.6 });
    d.rect(X.mean + 3, rowY(3) + 2, W.mean - 6, RH - 4, { pen: 'red', thick: true, rough: 0.6 });
    d.text(NOTE_X, 162, 'London = 1.0\ncopies its y', { pen: 'red', size: 14, anchor: 'start' });
  });

  d.step('Smooth it, compute it out-of-fold');
  d.group(() => {
    head(d, X.sm, W.sm, 'smooth', 'green');
    CITY.forEach((c, r) => cell(d, X.sm, W.sm, r, SMOOTH[c], 'green'));
  });
  d.text(NOTE_X, 208, 'pulled toward\nglobal 0.5', { pen: 'green', size: 14, anchor: 'start' });
  d.text(X.sm + W.sm, 228, '(n·mean + 2·0.5) / (n + 2)', {
    pen: 'green',
    size: 14,
    mono: true,
    anchor: 'end',
  });

  d.step('Many categories: hash or embed');
  d.group(() => {
    d.text(20, 274, 'hashing trick', { pen: 'violet', size: 16, bold: true, anchor: 'start' });
    d.text(20, 300, "'Zürich' → hash mod 8 → 5", { pen: 'ink', size: 15, anchor: 'start' });
    for (let b = 0; b < 8; b++) {
      d.rect(22 + b * 27, 316, 25, 26, {
        pen: 'violet',
        fill: b === 5 ? 'violet' : undefined,
        rough: 0.4,
        single: true,
        label: String(b),
        size: 14,
        mono: true,
        textPen: b === 5 ? 'ink' : 'muted',
      });
    }
    d.text(20, 364, "'Lyon' may land in 5 too:\na collision, accepted", {
      pen: 'muted',
      size: 14,
      anchor: 'start',
    });
  });
  d.group(() => {
    d.text(290, 274, 'embedding', { pen: 'blue', size: 16, bold: true, anchor: 'start' });
    d.text(290, 300, 'Tokyo → id 2 → vector', { pen: 'ink', size: 15, anchor: 'start' });
    ['0.21', '−0.70', '0.05'].forEach((v, i) =>
      d.rect(292 + i * 62, 316, 60, 26, {
        pen: 'blue',
        fill: 'blue',
        rough: 0.4,
        single: true,
        label: v,
        size: 15,
        mono: true,
        textPen: 'ink',
      }),
    );
    d.text(290, 364, 'learned with the model:\nsimilar cities end up close', {
      pen: 'muted',
      size: 14,
      anchor: 'start',
    });
  });
};
