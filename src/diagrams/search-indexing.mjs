export const meta = {
  title: 'Search indexing: tokenize three documents, build an inverted index, intersect postings, rank, shard',
  width: 520,
  height: 420,
};

const DOCS = ['Quick red fox', 'Lazy brown dog', 'Red dog, red ball'];
const INDEX = [
  ['ball', '3'],
  ['brown', '2'],
  ['dog', '2, 3'],
  ['fox', '1'],
  ['lazy', '2'],
  ['quick', '1'],
  ['red', '1, 3'],
];
const TX = 272; // index table left
const TY = 150; // first row centre

export default (d) => {
  d.step('Three documents, and the slow way');
  DOCS.forEach((t, i) =>
    d.group(() => {
      d.rect(16, 18 + i * 38, 212, 30, { pen: 'ink', fill: 'paper', single: true, rough: 0.6 });
      d.text(28, 33 + i * 38, `${i + 1}`, { size: 15, bold: true, pen: 'blue', anchor: 'start' });
      d.text(48, 33 + i * 38, t, { size: 15, anchor: 'start' });
    }),
  );
  d.text(122, 146, "LIKE '%dog%' reads every row", { size: 15, pen: 'red' });

  d.step('Tokenize: lowercase, split, strip punctuation');
  d.arrow(232, 94, 262, 74, { pen: 'orange' });
  d.text(388, 28, 'doc 3 → tokens', { size: 15, pen: 'orange' });
  d.group(() => {
    ['red', 'dog', 'red', 'ball'].forEach((t, i) =>
      d.rect(268 + i * 60, 50, 52, 28, { pen: 'orange', fill: 'orange', label: t, size: 15, mono: true, single: true }),
    );
  });

  d.step('Inverted index: term → sorted doc ids');
  d.group(() => {
    d.rect(TX - 4, TY - 32, 238, 196, { pen: 'blue', single: true, rough: 0.6 });
    d.text(TX + 115, TY - 18, 'term   →   postings list', { size: 15, pen: 'blue', bold: true });
    d.line(TX + 4, TY - 6, TX + 226, TY - 6, { pen: 'muted', thin: true, single: true });
  });
  d.group(() => {
    INDEX.forEach(([term, ids], i) => {
      d.text(TX + 14, TY + 12 + i * 22, term, { mono: true, anchor: 'start' });
      d.text(TX + 110, TY + 12 + i * 22, `→ ${ids}`, { mono: true, anchor: 'start', pen: 'blue' });
    });
  });

  d.step('red AND dog: intersect two sorted lists');
  d.group(() => {
    d.rect(TX + 4, TY + 1 + 2 * 22, 222, 22, { pen: 'red', single: true, rough: 0.5 });
    d.rect(TX + 4, TY + 1 + 6 * 22, 222, 22, { pen: 'red', single: true, rough: 0.5 });
  });
  d.text(122, 188, 'query: red AND dog', { size: 16, bold: true, pen: 'red' });
  d.group(() => {
    d.text(40, 218, 'red', { mono: true, anchor: 'start' });
    d.text(40, 244, 'dog', { mono: true, anchor: 'start' });
    d.text(96, 218, '1', { mono: true, pen: 'muted' });
    d.text(96, 244, '2', { mono: true, pen: 'muted' });
    d.circle(140, 218, 24, { pen: 'green', label: '3', mono: true, single: true });
    d.circle(140, 244, 24, { pen: 'green', label: '3', mono: true, single: true });
  });
  d.text(160, 231, '→ doc 3', { size: 16, bold: true, pen: 'green', anchor: 'start' });
  d.text(122, 272, 'two pointers, O(n + m)', { size: 14, pen: 'muted' });

  d.step('Rank: term frequency and rarity');
  d.text(122, 308, 'search "red", best first:', { size: 15, bold: true, pen: 'violet' });
  d.group(() => {
    d.text(24, 334, '#1 doc 3: red ×2', { size: 15, anchor: 'start', pen: 'violet' });
    d.text(24, 356, '#2 doc 1: red ×1', { size: 15, anchor: 'start', pen: 'violet' });
  });
  d.text(122, 390, 'rare words weigh more (IDF):\nfox (1 doc) > red (2 docs)', { size: 14, pen: 'muted' });

  d.step('Shard by document; query every shard');
  d.text(388, 334, 'ask all shards, merge top 10s', { size: 14, pen: 'violet' });
  d.group(() => {
    for (let i = 0; i < 3; i++)
      d.rect(276 + i * 78, 350, 70, 40, { pen: 'violet', fill: 'violet', label: `shard ${i + 1}`, size: 15, single: true });
  });
};
