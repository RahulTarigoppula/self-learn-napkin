export const meta = { title: 'A trie holding car, cart, cat and dog: shared prefixes, search, prefix search and a compressed trie', width: 520, height: 410 };

const D = 34; // node diameter
const P = {
  root: [200, 40],
  c: [130, 100],
  d: [280, 100],
  ca: [130, 160],
  do: [280, 160],
  car: [80, 220],
  cat: [180, 220],
  dog: [280, 220],
  cart: [80, 280],
};
const END = new Set(['car', 'cat', 'dog', 'cart']);

function edge(d, a, b, o = {}) {
  const [x1, y1] = P[a];
  const [x2, y2] = P[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const r = D / 2 + 2;
  d.line(x1 + ux * r, y1 + uy * r, x2 - ux * r, y2 - uy * r, { pen: 'muted', single: true, ...o });
}

/** Child node `k` (its letter is the last character) hanging from its parent. */
function nd(d, k, parent) {
  const end = END.has(k);
  d.group(() => {
    edge(d, parent, k);
    d.circle(...P[k], D, { pen: end ? 'green' : 'ink', fill: end ? 'green' : undefined, thick: end, rough: 0.7, single: true, label: k.at(-1), size: 18, bold: true });
  });
}

export default (d) => {
  d.step('Insert "car": one node per letter');
  d.group(() => {
    d.circle(...P.root, 26, { pen: 'muted', rough: 0.7, single: true });
    d.text(222, 40, 'root', { pen: 'muted', size: 15, anchor: 'start' });
  });
  nd(d, 'c', 'root');
  nd(d, 'ca', 'c');
  nd(d, 'car', 'ca');
  d.group(() => {
    d.circle(356, 40, 22, { pen: 'green', fill: 'green', thick: true, rough: 0.7, single: true });
    d.text(374, 40, '= end of a word', { pen: 'green', size: 15, anchor: 'start' });
  });

  d.step('"cart" and "cat" reuse the prefix');
  nd(d, 'cart', 'car');
  nd(d, 'cat', 'ca');
  d.text(36, 160, 'shared\nc-a', { pen: 'orange', size: 15 });

  d.step('"dog" starts a new branch');
  nd(d, 'd', 'root');
  nd(d, 'do', 'd');
  nd(d, 'dog', 'do');

  d.step('search vs startsWith for "ca"');
  d.group(() => {
    edge(d, 'root', 'c', { pen: 'blue', thick: true });
    edge(d, 'c', 'ca', { pen: 'blue', thick: true });
    d.circle(...P.ca, D + 12, { pen: 'blue', rough: 0.8, single: true });
  });
  d.text(14, 322, 'search("ca") → False: "a" is not a word end', { pen: 'red', size: 15, anchor: 'start' });
  d.text(14, 348, 'startsWith("ca") → True: the path exists', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Autocomplete: collect the words below');
  d.group(() => {
    d.poly([[52, 196], [214, 196], [214, 246], [114, 246], [114, 306], [46, 306], [46, 196]], { pen: 'green', dashed: true, closed: true, rough: 0.6, single: true });
  });
  d.text(14, 378, 'complete("ca") → car, cart, cat', { pen: 'green', size: 15, anchor: 'start' });

  d.step('A compressed trie merges one-child chains');
  d.line(330, 76, 330, 296, { pen: 'muted', dashed: true, thin: true, single: true });
  d.group(() => {
    const box = (x, y, w, s, pen = 'violet', fill) =>
      d.rect(x - w / 2, y - 15, w, 30, { pen, fill, rough: 0.6, single: true, label: s, size: 16, mono: true });
    d.circle(430, 92, 22, { pen: 'muted', rough: 0.7, single: true });
    d.line(420, 102, 396, 130, { pen: 'muted', single: true });
    d.line(440, 102, 466, 130, { pen: 'muted', single: true });
    box(392, 146, 44, 'ca');
    box(470, 146, 56, 'dog', 'green', 'green');
    d.line(382, 162, 368, 190, { pen: 'muted', single: true });
    d.line(402, 162, 416, 190, { pen: 'muted', single: true });
    box(364, 206, 32, 'r', 'green', 'green');
    box(420, 206, 32, 't', 'green', 'green');
    d.line(364, 222, 364, 248, { pen: 'muted', single: true });
    box(364, 264, 32, 't', 'green', 'green');
  });
  d.text(430, 300, '9 nodes → 6', { pen: 'violet', size: 15 });
};
