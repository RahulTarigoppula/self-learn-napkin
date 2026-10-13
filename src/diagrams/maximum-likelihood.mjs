export const meta = {
  title: 'Maximum likelihood: the likelihood of 7 heads in 10 flips peaks at p = 0.7',
  width: 520,
  height: 420,
};

const FLIPS = 'HHTHHHTHHT';
const X0 = 70;
const X1 = 470;
const PY0 = 262;
const LMAX = 0.0025;
const PH = 166;
const px = (p) => X0 + p * (X1 - X0);
const L = (p) => p ** 7 * (1 - p) ** 3;
const py = (l) => PY0 - (l / LMAX) * PH;
const pt = (p) => [px(p), py(L(p))];

export default (d) => {
  d.step('The data: 7 heads in 10 flips');
  d.group(() => {
    for (const [i, f] of [...FLIPS].entries()) {
      const pen = f === 'H' ? 'blue' : 'muted';
      d.circle(98 + i * 36, 34, 28, { pen, fill: f === 'H' ? 'blue' : undefined, label: f, size: 15, bold: true });
    }
  });
  d.text(476, 34, '7 H', { pen: 'blue', size: 17, bold: true, anchor: 'start' });

  d.step('Score one guess: p = 0.5');
  d.group(() => {
    d.line(X0, PY0, X1 + 10, PY0, { pen: 'muted' });
    d.line(X0, PY0, X0, 72, { pen: 'muted' });
    for (const p of [0, 0.5, 1]) d.text(px(p), PY0 + 15, String(p), { pen: 'muted', size: 14 });
    for (const l of [0.001, 0.002]) {
      d.line(X0 - 4, py(l), X0 + 4, py(l), { pen: 'muted', thin: true });
      d.text(X0 - 8, py(l), l.toFixed(3), { pen: 'muted', size: 13, anchor: 'end' });
    }
    d.text(X0 + 8, 76, 'L(p)', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(px(0.76), PY0 + 15, 'p = P(heads)', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    d.dot(...pt(0.5), 10, { pen: 'ink' });
    d.text(X0 + 12, py(L(0.5)) - 44, 'L(0.5) = 0.5¹⁰ ≈ 0.00098', { pen: 'ink', size: 15, anchor: 'start' });
  });

  d.step('Try every p: the likelihood curve');
  d.curve(
    Array.from({ length: 41 }, (_, i) => pt(i / 40)),
    { pen: 'violet', thick: true, rough: 0.6 },
  );
  d.text(178, 128, 'L(p) = p⁷(1 − p)³', { pen: 'violet', size: 16 });

  d.step('The peak is the estimate');
  d.line(px(0.7), PY0, px(0.7), py(L(0.7)), { pen: 'red', dashed: true });
  d.group(() => {
    d.dot(...pt(0.7), 12, { pen: 'red' });
    d.text(px(0.7) + 16, 80, 'p̂ = 0.7 = 7/10', { pen: 'red', size: 17, bold: true, anchor: 'start' });
    d.text(px(0.7) + 16, 101, 'L ≈ 0.0022', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('Take logs: same peak, easy maths');
  d.group(() => {
    d.text(260, 306, 'log L = 7 ln p + 3 ln(1 − p)', { pen: 'blue', size: 16, mono: true });
    d.text(260, 332, 'slope 7/p − 3/(1 − p) = 0  →  p = 0.7', { pen: 'blue', size: 15, mono: true });
  });

  d.step('Minus log-likelihood is the training loss');
  d.highlight(70, 360, 380, 34);
  d.text(260, 377, 'maximise log L  =  minimise −log L (the loss)', { pen: 'ink', size: 16, bold: true });
};
