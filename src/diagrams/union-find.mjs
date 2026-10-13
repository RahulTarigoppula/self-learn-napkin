export const meta = { title: 'Union-find on six elements: parent pointers, union by size, path compression and a cycle check', width: 520, height: 400 };

const D = 34; // node diameter
const P = {
  0: [150, 62],
  1: [60, 150],
  2: [150, 150],
  4: [240, 150],
  3: [150, 238],
  5: [240, 238],
};
const CX = 334; // array left edge
const CW = 28; // array cell width

/** Arrow from child a up to its parent b, stopping at both circles. */
function up(d, a, b, o = {}) {
  const [x1, y1] = P[a];
  const [x2, y2] = P[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const r = D / 2 + 3;
  d.arrow(x1 + ux * r, y1 + uy * r, x2 - ux * r, y2 - uy * r, { pen: 'blue', single: true, rough: 0.6, headSize: 9, ...o });
}

/** One row of the parent array: a caption, then six cells; `changed` cells are washed orange. */
function row(d, k, caption, vals, changed = []) {
  const y = 66 + k * 52;
  d.group(() => {
    d.text(CX, y - 11, caption, { pen: k === 0 ? 'muted' : 'ink', size: 14, anchor: 'start' });
    vals.forEach((v, i) =>
      d.rect(CX + i * CW, y, CW, 24, {
        pen: changed.includes(i) ? 'orange' : 'ink',
        fill: changed.includes(i) ? 'orange' : undefined,
        rough: 0.5,
        single: true,
        label: String(v),
        size: 15,
        mono: true,
      }),
    );
  });
}

export default (d) => {
  d.step('Six singletons: everyone is their own parent');
  d.group(() => {
    for (const k of Object.keys(P)) d.circle(...P[k], D, { pen: 'ink', rough: 0.7, single: true, label: k, size: 18, bold: true });
  });
  d.group(() => {
    d.text(CX, 16, 'parent[i]', { pen: 'muted', size: 14, anchor: 'start' });
    for (let i = 0; i < 6; i++) d.text(CX + i * CW + CW / 2, 36, String(i), { pen: 'muted', size: 14, mono: true });
  });
  row(d, 0, 'start', [0, 1, 2, 3, 4, 5]);

  d.step('union(0,1), union(2,3), union(4,5)');
  d.group(() => {
    up(d, 1, 0);
    up(d, 3, 2);
    up(d, 5, 4);
  });
  row(d, 1, 'union 0-1, 2-3, 4-5', [0, 0, 2, 2, 4, 4], [1, 3, 5]);

  d.step('union(1,3): link the two roots');
  up(d, 2, 0, { pen: 'violet', thick: true });
  row(d, 2, 'union(1,3)', [0, 0, 0, 2, 4, 4], [2]);

  d.step('union(4,1): smaller tree under the bigger');
  up(d, 4, 0, { pen: 'violet', thick: true });
  d.group(() => {
    d.text(114, 62, 'size 4', { pen: 'violet', size: 15, anchor: 'end' });
    d.text(266, 196, 'size 2', { pen: 'violet', size: 15, anchor: 'start' });
  });
  row(d, 3, 'union(4,1)', [0, 0, 0, 2, 0, 4], [4]);

  d.step('find(3) compresses its path');
  d.arrow(132, 228, 130, 76, { pen: 'orange', thick: true, single: true, rough: 0.6, bend: -46, headSize: 9 });
  d.group(() => {
    d.line(140, 186, 160, 204, { pen: 'red', thick: true, single: true });
    d.line(160, 186, 140, 204, { pen: 'red', thick: true, single: true });
  });
  d.text(52, 300, '3 now points straight at the root', { pen: 'orange', size: 15, anchor: 'start' });
  row(d, 4, 'after find(3)', [0, 0, 0, 0, 0, 4], [3]);

  d.step('Same root, same set');
  d.circle(...P[0], D + 14, { pen: 'green', thick: true, rough: 0.8, single: true });
  d.text(14, 340, 'find(1) = 0 and find(3) = 0: already connected,', { pen: 'green', size: 15, anchor: 'start' });
  d.text(14, 366, 'so adding edge 1–3 would close a cycle', { pen: 'green', size: 15, anchor: 'start' });
};
