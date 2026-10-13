export const meta = { title: 'One graph as a picture, an adjacency list and an adjacency matrix; paths, cycles, a weighted DAG and a grid', width: 520, height: 420 };

const D = 32; // node diameter
const G = { 0: [36, 82], 1: [112, 46], 2: [92, 160], 3: [176, 112], 4: [162, 204] };
const EDGES = [[0, 1], [0, 2], [1, 2], [1, 3], [3, 4]];
const ADJ = { 0: [1, 2], 1: [0, 2, 3], 2: [0, 1], 3: [1, 4], 4: [3] };

function seg(d, [x1, y1], [x2, y2], o = {}, r1 = D / 2 + 2, r2 = D / 2 + 2) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  return [x1 + ux * r1, y1 + uy * r1, x2 - ux * r2, y2 - uy * r2];
}

function edge(d, a, b, o = {}) {
  d.line(...seg(d, G[a], G[b]), { pen: 'muted', single: true, rough: 0.4, ...o });
}

const MX = 380; // matrix: first cell's left edge
const MY = 50; // matrix: first cell's top edge
const MC = 24; // matrix cell size

export default (d) => {
  d.step('Vertices joined by edges');
  d.group(() => {
    for (const [a, b] of EDGES) edge(d, a, b);
    for (const k of Object.keys(G)) d.circle(...G[k], D, { pen: 'ink', rough: 0.7, single: true, label: k, size: 17, bold: true });
  });
  d.text(140, 20, 'degree 3', { pen: 'violet', size: 14, anchor: 'start' });
  d.text(14, 236, 'V = 5 vertices, E = 5 edges', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Adjacency list: each vertex lists its neighbours');
  d.group(() => {
    for (let v = 0; v < 5; v++) d.text(216, 50 + v * 30, `${v}: [${ADJ[v].join(', ')}]`, { pen: 'blue', size: 15, mono: true, anchor: 'start' });
  });
  d.text(268, 208, 'O(V + E) space', { pen: 'blue', size: 14 });

  d.step('Adjacency matrix: a V × V grid of 0s and 1s');
  d.group(() => {
    for (let i = 0; i <= 5; i++) {
      d.line(MX, MY + i * MC, MX + 5 * MC, MY + i * MC, { pen: 'muted', thin: true, single: true, rough: 0.4 });
      d.line(MX + i * MC, MY, MX + i * MC, MY + 5 * MC, { pen: 'muted', thin: true, single: true, rough: 0.4 });
    }
    for (let i = 0; i < 5; i++) {
      d.text(MX + i * MC + MC / 2, MY - 12, String(i), { pen: 'muted', size: 14, mono: true });
      d.text(MX - 10, MY + i * MC + MC / 2, String(i), { pen: 'muted', size: 14, mono: true });
      for (let j = 0; j < 5; j++) {
        const on = ADJ[i].includes(j);
        d.text(MX + j * MC + MC / 2, MY + i * MC + MC / 2, on ? '1' : '0', { pen: on ? 'orange' : 'muted', size: 14, mono: true, bold: on });
      }
    }
  });
  d.text(440, 200, 'O(V²) space\nO(1) edge check', { pen: 'orange', size: 14 });

  d.step('Paths and cycles');
  d.group(() => {
    edge(d, 0, 1, { pen: 'green', thick: true });
    edge(d, 1, 2, { pen: 'green', thick: true });
    edge(d, 0, 2, { pen: 'green', thick: true });
  });
  d.group(() => {
    edge(d, 1, 3, { pen: 'red', thick: true });
    edge(d, 3, 4, { pen: 'red', thick: true });
  });
  d.text(14, 262, 'cycle 0–1–2–0', { pen: 'green', size: 15, anchor: 'start' });
  d.text(166, 262, 'path 0–1–3–4', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Directed and weighted: a DAG');
  d.line(14, 280, 506, 280, { pen: 'muted', dashed: true, thin: true, single: true });
  const W = { S: [36, 350], A: [120, 306], B: [120, 392], T: [204, 350] };
  d.group(() => {
    const arc = (a, b, w, dx, dy) => d.arrow(...seg(d, W[a], W[b], {}, 17, 19), { pen: 'blue', single: true, rough: 0.6, headSize: 9, label: String(w), size: 15, labelDx: dx, labelDy: dy });
    arc('S', 'A', 4, -8, -10);
    arc('S', 'B', 1, -8, 10);
    arc('B', 'A', 2, 12, 0);
    arc('A', 'T', 5, 8, -10);
    arc('B', 'T', 8, 8, 10);
    for (const k of Object.keys(W)) d.circle(...W[k], D, { pen: 'blue', fill: 'blue', rough: 0.7, single: true, label: k, size: 17, bold: true });
  });

  d.step('Implicit graph: a grid');
  const GX = 304;
  const GY = 322;
  const GC = 36;
  const GR = 28;
  d.group(() => {
    for (let r = 0; r <= 3; r++) d.line(GX, GY + r * GR, GX + 5 * GC, GY + r * GR, { pen: 'muted', thin: true, single: true, rough: 0.4 });
    for (let c = 0; c <= 5; c++) d.line(GX + c * GC, GY, GX + c * GC, GY + 3 * GR, { pen: 'muted', thin: true, single: true, rough: 0.4 });
    for (const [r, c] of [[0, 3], [2, 1]]) d.rect(GX + c * GC + 3, GY + r * GR + 3, GC - 6, GR - 6, { pen: 'muted', fill: 'muted', fillStyle: 'hachure', thin: true, single: true, rough: 0.4 });
  });
  d.group(() => {
    const cx = GX + 2 * GC + GC / 2;
    const cy = GY + GR + GR / 2;
    d.dot(cx, cy, 10, { pen: 'violet' });
    d.arrow(cx + 4, cy, cx + 32, cy, { pen: 'violet', single: true, headSize: 7 });
    d.arrow(cx - 4, cy, cx - 32, cy, { pen: 'violet', single: true, headSize: 7 });
    d.arrow(cx, cy + 4, cx, cy + 24, { pen: 'violet', single: true, headSize: 7 });
    d.arrow(cx, cy - 4, cx, cy - 24, { pen: 'violet', single: true, headSize: 7 });
  });
  d.text(394, 302, 'cell (r, c) → (r±1, c), (r, c±1)', { pen: 'violet', size: 14 });
};
