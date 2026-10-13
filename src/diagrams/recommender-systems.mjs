export const meta = {
  title: 'Recommender systems: a user-item rating matrix, collaborative filtering, matrix factorisation and the retrieval-then-ranking funnel',
  width: 520,
  height: 420,
};

const USERS = ['Ann', 'Bob', 'Cat', 'Dan'];
const ITEMS = ['Alien', 'Heat', 'Up', 'Coco'];
const R = [
  [4, null, 1, 1],
  [4, 4, 1, 1],
  [1, 2, 4, 5],
  [1, 1, 5, null],
];
const MX = 64;
const MY = 44;
const CW = 44;
const CH = 30;
const cx = (j) => MX + j * CW + CW / 2;
const cy = (i) => MY + i * CH + CH / 2;

export default (d) => {
  d.step('The user-item matrix is mostly empty');
  d.group(() => {
    ITEMS.forEach((it, j) => d.text(cx(j), MY - 14, it, { pen: 'muted', size: 14 }));
    USERS.forEach((u, i) => d.text(MX - 8, cy(i), u, { pen: 'ink', size: 15, anchor: 'end' }));
    R.forEach((row, i) =>
      row.forEach((r, j) =>
        d.rect(MX + j * CW, MY + i * CH, CW, CH, {
          pen: r === null ? 'red' : 'muted',
          label: r === null ? '?' : String(r),
          textPen: r === null ? 'red' : 'ink',
          size: 16,
          bold: r === null,
          rough: 0.4,
        }),
      ),
    );
  });

  d.step('Collaborative filtering: find similar users');
  d.group(() => {
    d.rect(MX - 46, MY + 2, 46 + 4 * CW + 4, CH * 2 - 4, { pen: 'blue', rough: 0.8, thick: true });
    d.text(MX + 2 * CW, MY + 4 * CH + 18, 'Ann and Bob rate alike,', { pen: 'blue', size: 15 });
    d.text(MX + 2 * CW, MY + 4 * CH + 38, 'and Bob gave Heat a 4', { pen: 'blue', size: 15 });
  });

  d.step('Matrix factorisation: a vector per user and item');
  d.group(() => {
    d.text(272, 32, 'learned taste vectors', { pen: 'violet', size: 15, bold: true, anchor: 'start' });
    d.text(272, 52, '(action, family)', { pen: 'muted', size: 14, anchor: 'start' });
    d.text(272, 80, 'Ann (2.0, 0.3)', { pen: 'violet', size: 15, mono: true, anchor: 'start' });
    d.text(272, 102, 'Cat (0.4, 2.0)', { pen: 'violet', size: 15, mono: true, anchor: 'start' });
    d.text(272, 132, 'Heat (2.3, 0.3)', { pen: 'orange', size: 15, mono: true, anchor: 'start' });
    d.text(272, 154, 'Coco (0.3, 2.3)', { pen: 'orange', size: 15, mono: true, anchor: 'start' });
    d.text(272, 184, 'rating ≈ user · item', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
  });

  d.step('Fill the gap with a dot product');
  d.highlight(14, 212, 492, 30);
  d.text(260, 227, 'Ann · Heat = 2.0·2.3 + 0.3·0.3 = 4.69 → recommend', { pen: 'ink', size: 15, bold: true });

  d.step('At scale: retrieve, then rank');
  d.group(() => {
    d.rect(14, 274, 86, 44, { pen: 'muted', fill: 'muted', label: '10 M\nitems', size: 15, rough: 0.6 });
    d.arrow(104, 296, 190, 296, { pen: 'blue', label: 'retrieve', size: 14, labelDy: -14 });
    d.text(147, 312, 'fast, rough', { pen: 'muted', size: 13 });
    d.rect(194, 274, 110, 44, { pen: 'blue', fill: 'blue', label: '~500\ncandidates', size: 15, rough: 0.6 });
    d.arrow(308, 296, 400, 296, { pen: 'green', label: 'rank', size: 14, labelDy: -14 });
    d.text(354, 312, 'slow, precise', { pen: 'muted', size: 13 });
    d.rect(404, 274, 102, 44, { pen: 'green', fill: 'green', label: 'top 10\nshown', size: 15, rough: 0.6 });
  });

  d.step('Measure: offline, then an A/B test');
  d.group(() => {
    d.text(260, 358, 'offline: precision@10 = liked items in top 10 ÷ 10', { pen: 'ink', size: 15 });
    d.text(260, 386, 'online: A/B test the real goal (watch time, sales)', { pen: 'violet', size: 15, bold: true });
  });
};
