export const meta = {
  title: 't-SNE: neighbour probabilities, a heavy-tailed 2-D map, equal-looking clusters',
  width: 520,
  height: 420,
};

// Band 1: the 10-D data seen along its first axis. Clusters at 0, 40, 240; B is 5x wider.
const LY = 76;
const lx = (p) => 52 + p * 1.72;
const XA = lx(0);
const XB = lx(40);
const XC = lx(240);
const SMALL = [
  [-6, -4],
  [5, -6],
  [6, 5],
  [-5, 6],
];
const WIDE = [
  [-22, -3],
  [-11, 7],
  [-2, -7],
  [9, 4],
  [21, -4],
];

// Band 2: one point's neighbour probabilities (distances 1, 2, 3, 10; sigma = 1).
const NY = 222;
const nx = (dist) => 56 + dist * 46;

// Band 3 left: kernel plot on a log scale (1 down to 1e-4). Right: the t-SNE map.
const KX = 44;
const KTOP = 288;
const kx = (dist) => KX + dist * 38;
const ky = (v) => KTOP + -Math.log10(v) * 25;

const cluster = (d, cx, cy, offs, pen, k = 1) => {
  d.group(() => {
    for (const [dx, dy] of offs) d.circle(cx + dx * k, cy + dy * k, 8, { pen, thick: true, single: true });
  });
};

export default (d) => {
  d.step('Three groups in 10-D');
  d.text(20, 22, '10-D data, seen along one axis', { pen: 'muted', size: 15, anchor: 'start' });
  d.line(30, LY + 16, 494, LY + 16, { pen: 'muted', single: true });
  cluster(d, XA, LY, SMALL, 'blue');
  cluster(d, XB, LY, WIDE, 'green');
  cluster(d, XC, LY, SMALL, 'violet');
  d.group(() => {
    d.text(XA, LY - 22, 'A', { pen: 'blue', size: 17, bold: true });
    d.text(XB, LY - 26, 'B: 5× wider', { pen: 'green', size: 16, bold: true });
    d.text(XC, LY - 22, 'C', { pen: 'violet', size: 17, bold: true });
  });
  d.group(() => {
    d.arrow(XA + 2, LY + 30, XB - 2, LY + 30, { pen: 'ink', both: true, thin: true, headSize: 7 });
    d.text((XA + XB) / 2, LY + 46, 'gap 40', { pen: 'ink', size: 15 });
    d.arrow(XB + 2, LY + 30, XC - 2, LY + 30, { pen: 'ink', both: true, thin: true, headSize: 7 });
    d.text((XB + XC) / 2, LY + 46, 'gap 200', { pen: 'ink', size: 15 });
  });

  d.step('Distances become neighbour probabilities');
  d.line(30, NY, 494, NY, { pen: 'muted', single: true });
  d.curve(
    Array.from({ length: 13 }, (_, i) => {
      const t = (i / 12) * 3.6;
      return [nx(t), NY - 66 * Math.exp((-t * t) / 2)];
    }),
    { pen: 'orange', thick: true },
  );
  d.group(() => {
    d.dot(nx(0), NY, 12, { pen: 'red', single: true });
    d.text(nx(0), NY + 18, 'i', { pen: 'red', size: 16, bold: true });
    const P = [
      [1, '.81'],
      [2, '.18'],
      [3, '.015'],
    ];
    for (const [dist, p] of P) {
      d.dot(nx(dist), NY, 9, { pen: 'ink', single: true });
      d.text(nx(dist), NY + 18, p, { pen: 'ink', size: 15, mono: true });
    }
    d.dot(440, NY, 9, { pen: 'ink', single: true });
    d.text(440, NY + 18, '≈ 0', { pen: 'ink', size: 15, mono: true });
    d.text(392, NY + 1, '≈', { pen: 'muted', size: 18 });
  });
  d.text(268, NY - 58, 'Gaussian around i: width σ set\nso perplexity ≈ #neighbours', {
    pen: 'orange',
    size: 15,
    anchor: 'start',
  });
  d.text(440, NY - 18, 'd = 10', { pen: 'muted', size: 14 });

  d.step('Lay out in 2-D with heavy tails');
  d.group(() => {
    d.line(KX, ky(1e-4) + 4, KX + 200, ky(1e-4) + 4, { pen: 'muted', single: true });
    d.line(KX, ky(1e-4) + 4, KX, KTOP - 8, { pen: 'muted', single: true });
    d.text(KX + 200, ky(1e-4) + 18, 'distance', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(KX - 10, 266, 'similarity (log scale)', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.curve(
    Array.from({ length: 15 }, (_, i) => {
      const t = (i / 14) * 4.3;
      return [kx(t), ky(Math.exp((-t * t) / 2))];
    }),
    { pen: 'orange', dashed: true, thick: true },
  );
  d.curve(
    Array.from({ length: 15 }, (_, i) => {
      const t = (i / 14) * 5;
      return [kx(t), ky(1 / (1 + t * t))];
    }),
    { pen: 'red', thick: true },
  );
  d.group(() => {
    d.text(kx(2.9), ky(0.003), 'Gaussian', { pen: 'orange', size: 15, anchor: 'end' });
    d.text(kx(3.6) + 14, 344, 'Student-t:\nfat tail', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('The map: same sizes, same gaps');
  d.text(388, 266, 't-SNE map, perplexity 30', { pen: 'muted', size: 15 });
  cluster(d, 312, 310, SMALL, 'blue', 1.6);
  cluster(d, 388, 310, SMALL, 'green', 1.6);
  cluster(d, 464, 310, SMALL, 'violet', 1.6);
  d.group(() => {
    d.text(312, 286, 'A', { pen: 'blue', size: 16, bold: true });
    d.text(388, 286, 'B', { pen: 'green', size: 16, bold: true });
    d.text(464, 286, 'C', { pen: 'violet', size: 16, bold: true });
    d.text(350, 334, 'gap 35', { pen: 'ink', size: 14 });
    d.text(426, 334, 'gap 36', { pen: 'ink', size: 14 });
  });
  d.text(388, 360, 'sizes and gaps are not data', { pen: 'red', size: 16, bold: true });

  d.step('PCA and UMAP for comparison');
  d.text(388, 392, 'PCA would keep 40 : 200\nUMAP: similar map, faster', { pen: 'violet', size: 15 });
};
