export const meta = {
  title:
    'Supervised learning (classification, regression) beside unsupervised learning (clustering, dimensionality reduction)',
  width: 520,
  height: 420,
};

const L = 30; // left panel x
const R = 286; // right panel x
const PW = 206; // panel width
const TOP = 58; // top panel y
const BOT = 214; // bottom panel y
const PH = 104; // panel height

// Classification: two labelled classes, separable by the line (60,0)–(180,104) in panel coords.
const NOT_SPAM = [
  [20, 86],
  [38, 66],
  [30, 98],
  [55, 82],
  [72, 96],
  [46, 56],
  [86, 74],
  [96, 98],
];
const SPAM = [
  [130, 28],
  [150, 48],
  [170, 22],
  [186, 58],
  [142, 40],
  [200, 36],
  [166, 78],
  [118, 28],
];
// Clustering: the same kind of points, no labels, three natural groups.
const GROUPS = [
  {
    c: [44, 34],
    pts: [
      [30, 28],
      [48, 20],
      [58, 38],
      [38, 46],
      [50, 32],
    ],
    pen: 'violet',
  },
  {
    c: [166, 30],
    pts: [
      [152, 22],
      [172, 18],
      [182, 36],
      [160, 42],
      [168, 30],
    ],
    pen: 'green',
  },
  {
    c: [104, 80],
    pts: [
      [88, 74],
      [106, 66],
      [120, 82],
      [98, 92],
      [112, 90],
    ],
    pen: 'orange',
  },
];
// Regression: size → price, roughly linear.
const HOUSES = [
  [16, 90],
  [40, 78],
  [62, 80],
  [86, 62],
  [108, 56],
  [132, 46],
  [158, 34],
  [186, 20],
];
// Dimensionality reduction: a 2-D cloud stretched along one direction.
const CLOUD = [
  [24, 88],
  [48, 72],
  [60, 84],
  [88, 52],
  [108, 62],
  [132, 40],
  [156, 34],
  [180, 16],
];

export default (d) => {
  d.step('Labelled data vs unlabelled data');
  d.text(L + PW / 2, 20, 'supervised', { pen: 'blue', size: 18, bold: true });
  d.text(L + PW / 2, 40, 'rows come with an answer y', { pen: 'muted', size: 15 });
  d.text(R + PW / 2, 20, 'unsupervised', { pen: 'violet', size: 18, bold: true });
  d.text(R + PW / 2, 40, 'rows only: no answers', { pen: 'muted', size: 15 });
  d.line(260, 14, 260, 330, { pen: 'muted', dashed: true });
  d.group(() => {
    for (const [x, y] of NOT_SPAM) d.dot(L + x, TOP + y, 10, { pen: 'blue', single: true });
    for (const [x, y] of SPAM) d.dot(L + x, TOP + y, 10, { pen: 'orange', single: true });
    d.text(L + 2, TOP + 126, 'y = ham', { pen: 'blue', size: 15, anchor: 'start' });
    d.text(L + PW, TOP + 126, 'y = spam', { pen: 'orange', size: 15, anchor: 'end' });
  });
  d.group(() => {
    for (const g of GROUPS)
      for (const [x, y] of g.pts) d.dot(R + x, TOP + y, 10, { pen: 'muted', single: true });
  });

  d.step('Classification: predict a category');
  d.line(L + 66, TOP + 4, L + 180, TOP + 104, { pen: 'red', thick: true, dashed: true });
  d.text(L + 2, TOP + 18, 'learned\nboundary', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Regression: predict a number');
  d.group(() => {
    d.line(L, BOT + PH, L + PW, BOT + PH, { pen: 'muted' });
    d.line(L, BOT + PH, L, BOT - 4, { pen: 'muted' });
    d.text(L + PW, BOT + PH + 16, 'size (m²)', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(L + 8, BOT - 4, 'price', { pen: 'muted', size: 15, anchor: 'start' });
    for (const [x, y] of HOUSES) d.dot(L + x, BOT + y, 10, { pen: 'blue', single: true });
  });
  d.line(L + 6, BOT + 96, L + PW - 4, BOT + 14, { pen: 'red', thick: true });

  d.step('Clustering: find groups');
  for (const g of GROUPS) d.ellipse(R + g.c[0] + 2, TOP + g.c[1] - 1, 58, 46, { pen: g.pen, thick: true });
  d.text(R + PW / 2, TOP + 126, '3 groups found, unnamed', { pen: 'violet', size: 15 });

  d.step('Dimensionality reduction: fewer columns');
  d.group(() => {
    for (const [x, y] of CLOUD) d.dot(R + x, BOT + y, 10, { pen: 'muted', single: true });
  });
  d.arrow(R + 6, BOT + 100, R + 200, BOT + 4, { pen: 'violet', thick: true });
  d.text(R + PW / 2, BOT + PH + 16, '2 columns → 1 direction', { pen: 'violet', size: 15 });

  d.step('In between: other ways to get a signal');
  d.text(20, 352, 'semi-supervised: a few labels + many unlabelled rows', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
  d.text(20, 376, 'self-supervised: labels made from the data itself', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
  d.text(20, 400, 'reinforcement: actions earn rewards, no labels', {
    pen: 'ink',
    size: 15,
    anchor: 'start',
  });
};
