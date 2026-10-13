export const meta = {
  title: 'A 2-2-1 neural network computed by hand: weighted sums, ReLU, sigmoid',
  width: 520,
  height: 420,
};

const R = 30;
const X1 = [60, 100];
const X2 = [60, 220];
const H1 = [240, 100];
const H2 = [240, 220];
const Y = [404, 160];
const LINE = (i) => 286 + i * 28;
const MONO = { size: 15, mono: true, anchor: 'start' };

export default (d) => {
  d.step('One neuron: a weighted sum plus a bias');
  d.group(() => {
    d.circle(...X1, R * 2, { pen: 'blue', fill: 'blue', label: 'x₁ = 1', size: 15 });
    d.circle(...X2, R * 2, { pen: 'blue', fill: 'blue', label: 'x₂ = 2', size: 15 });
  });
  d.circle(...H1, R * 2, { pen: 'violet', fill: 'violet', label: 'h₁', size: 17, bold: true });
  d.group(() => {
    d.arrow(92, 100, 206, 100, { pen: 'ink', label: 'w = 1', size: 14, labelDy: -12 });
    d.arrow(86, 204, 212, 118, { pen: 'ink' });
    d.text(172, 126, '0.5', { pen: 'ink', size: 14, anchor: 'end' });
    d.text(240, 56, 'b = 0', { pen: 'muted', size: 14 });
  });
  d.text(18, LINE(0), 'z₁ = 1·1 + 0.5·2 + 0 = 2', { ...MONO, pen: 'violet' });

  d.step('An activation bends the sum');
  d.group(() => {
    d.line(424, 92, 504, 92, { pen: 'muted', thin: true });
    d.line(464, 96, 464, 40, { pen: 'muted', thin: true });
    d.poly(
      [
        [424, 92],
        [464, 92],
        [500, 52],
      ],
      { pen: 'red', thick: true, rough: 0.5 },
    );
    d.text(464, 26, 'ReLU = max(0, z)', { pen: 'red', size: 14 });
  });
  d.text(234, LINE(0), '→ h₁ = ReLU(2) = 2', { ...MONO, pen: 'red' });
  d.text(280, 68, '= 2', { pen: 'red', size: 16, bold: true, anchor: 'start' });

  d.step('A layer: many neurons side by side');
  d.circle(...H2, R * 2, { pen: 'violet', fill: 'violet', label: 'h₂', size: 17, bold: true });
  d.group(() => {
    d.arrow(92, 220, 206, 220, { pen: 'ink', label: 'w = 0.5', size: 14, labelDy: 14 });
    d.arrow(86, 116, 212, 202, { pen: 'ink' });
    d.text(172, 198, '−1', { pen: 'ink', size: 14, anchor: 'end' });
    d.text(240, 264, 'b = −1', { pen: 'muted', size: 14 });
  });
  d.text(18, LINE(1), 'z₂ = −1·1 + 0.5·2 − 1 = −1 → h₂ = 0', { ...MONO, pen: 'violet' });
  d.text(280, 252, '= 0', { pen: 'red', size: 16, bold: true, anchor: 'start' });

  d.step('The output layer: ŷ = σ(1) = 0.73');
  d.group(() => {
    d.arrow(270, 106, 374, 150, { pen: 'ink', label: '1', size: 14, labelDy: -14 });
    d.arrow(270, 214, 374, 172, { pen: 'ink', label: '−2', size: 14, labelDy: 16 });
  });
  d.circle(...Y, R * 2, { pen: 'green', fill: 'green', label: 'ŷ', size: 18, bold: true });
  d.text(404, 206, 'b = −1', { pen: 'muted', size: 14 });
  d.text(18, LINE(2), 'z = 1·2 − 2·0 − 1 = 1 → ŷ = σ(1) = 0.73', { ...MONO, pen: 'green' });

  d.step('Without activations, layers collapse');
  d.highlight(14, 360, 492, 46);
  d.text(260, 373, 'no activation: W₂(W₁x) = (W₂W₁)x', { pen: 'ink', size: 16, bold: true });
  d.text(260, 395, 'ten linear layers = one linear layer', { pen: 'ink', size: 15 });
};
