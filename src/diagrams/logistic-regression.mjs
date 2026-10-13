export const meta = {
  title: 'Logistic regression: a linear score squashed by the sigmoid',
  width: 520,
  height: 420,
};

// Sigmoid plot: z in [-6, 6] across, p in [0, 1] up.
const AX = 56;
const ZS = (330 - AX) / 12;
const zx = (z) => AX + (z + 6) * ZS;
const PY0 = 230;
const PH = 180;
const py = (p) => PY0 - PH * p;
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const sig = (z) => [zx(z), py(sigmoid(z))];

// Log-loss bars
const BX = 124;
const BS = 70; // px per nat of loss

export default (d) => {
  d.step('A linear score can be any number');
  d.group(() => {
    d.line(AX, PY0, 334, PY0, { pen: 'muted' });
    d.line(AX, PY0, AX, 40, { pen: 'muted' });
    for (const [p, t] of [
      [1, '1'],
      [0.5, '0.5'],
      [0, '0'],
    ])
      d.text(AX - 8, py(p), t, { pen: 'muted', size: 14, anchor: 'end' });
    for (const z of [-6, 0, 6]) d.text(zx(z), PY0 + 14, z < 0 ? '−6' : String(z), { pen: 'muted', size: 14 });
    d.text(AX + 4, 30, 'p', { pen: 'muted', size: 15, anchor: 'start' });
  });
  d.text(zx(0), 266, 'score z = w·x + b  (any number)', { pen: 'blue', size: 16 });

  d.step('The sigmoid squashes it into 0…1');
  d.curve(
    Array.from({ length: 25 }, (_, i) => sig(-6 + i / 2)),
    { pen: 'violet', thick: true, rough: 0.7 },
  );
  d.text(122, 68, 'σ(z) =\n1 / (1 + e^(−z))', { pen: 'violet', size: 16 });

  d.step('Read off probabilities');
  d.dot(...sig(2), 10, { pen: 'red', label: 'σ(2) = 0.88', dx: 54, dy: 6, size: 15 });
  d.dot(...sig(0), 10, { pen: 'ink', label: 'σ(0) = 0.5', dx: -50, dy: -16, size: 15 });
  d.dot(...sig(-1), 10, { pen: 'blue', label: 'σ(−1) = 0.27', dx: 54, dy: 14, size: 15 });

  d.step('Threshold at 0.5');
  d.line(AX, py(0.5), 330, py(0.5), { pen: 'orange', dashed: true });
  d.text(276, 118, 'predict spam', { pen: 'red', size: 16, bold: true });
  d.text(100, 170, 'predict\nnot spam', { pen: 'blue', size: 16, bold: true });

  d.step('In feature space: a straight line');
  d.group(() => {
    d.line(370, 230, 504, 230, { pen: 'muted' });
    d.line(370, 230, 370, 48, { pen: 'muted' });
    d.text(504, 246, 'links', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(376, 40, 'CAPS %', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.group(() => {
    for (const [x, y] of [
      [388, 208],
      [402, 190],
      [416, 214],
      [392, 172],
      [428, 196],
      [410, 160],
    ])
      d.dot(x, y, 10, { pen: 'blue', single: true });
    for (const [x, y] of [
      [466, 92],
      [482, 120],
      [452, 70],
      [492, 82],
      [470, 150],
      [440, 108],
    ])
      d.dot(x, y, 10, { pen: 'red', single: true });
  });
  d.line(382, 100, 500, 212, { pen: 'orange', dashed: true, thick: true });
  d.text(436, 266, 'z = 0 is the boundary', { pen: 'orange', size: 15 });

  d.step('Log-loss: punish confident mistakes');
  d.text(260, 298, 'true label: spam   →   loss = −ln p', { pen: 'ink', size: 16, bold: true });
  for (const [i, p] of [0.88, 0.27, 0.01].entries()) {
    const loss = -Math.log(p);
    const y = 326 + i * 28;
    const pen = p > 0.5 ? 'green' : 'red';
    d.group(() => {
      d.text(BX - 14, y, `p = ${p}`, { pen: 'muted', size: 15, anchor: 'end' });
      d.rect(BX, y - 9, Math.max(4, loss * BS), 18, { pen, fill: pen, rough: 0.6 });
      d.text(BX + Math.max(4, loss * BS) + 8, y, loss.toFixed(2), { pen, size: 16, anchor: 'start' });
    });
  }
};
