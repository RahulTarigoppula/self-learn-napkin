export const meta = {
  title: 'Backpropagation on L = (x·w + b − y)²: forward values, then gradients flowing backwards',
  width: 520,
  height: 420,
};

const NY = 150; // node row
const NODES = [
  ['×', 120],
  ['+', 220],
  ['−', 320],
  ['( )²', 420],
];
const EDGES = [
  // [name, x1, x2, value, gradient]
  ['u', 142, 198, '6', '4'],
  ['v', 242, 298, '7', '4'],
  ['e', 342, 398, '2', '4'],
];
const NOTE = (i) => 292 + i * 26;

export default (d) => {
  d.step('The computation as a graph');
  d.group(() => {
    d.text(14, 24, 'L = (x·w + b − y)²', { pen: 'ink', size: 17, bold: true, anchor: 'start' });
    d.text(506, 20, 'blue: value', { pen: 'blue', size: 14, anchor: 'end' });
    d.text(506, 40, 'red: ∂L/∂(value)', { pen: 'red', size: 14, anchor: 'end' });
  });
  d.group(() => {
    for (const [op, x] of NODES) d.circle(x, NY, 44, { pen: 'violet', fill: 'violet', label: op, size: op.length > 1 ? 15 : 20, bold: true });
    for (const [id, y] of [
      ['x', 90],
      ['w', 210],
    ]) {
      d.rect(36, y - 14, 32, 28, { pen: 'ink', label: id, size: 16, rough: 0.6 });
    }
    d.arrow(70, 96, 102, 136, { pen: 'ink' });
    d.arrow(70, 204, 102, 164, { pen: 'ink' });
    for (const [id, x] of [
      ['b', 220],
      ['y', 320],
    ]) {
      d.rect(x - 16, 236, 32, 28, { pen: 'ink', label: id, size: 16, rough: 0.6 });
      d.arrow(x, 234, x, 176, { pen: 'ink' });
    }
    for (const [name, x1, x2] of EDGES) {
      d.arrow(x1, NY, x2, NY, { pen: 'ink' });
      d.text((x1 + x2) / 2 - 6, NY - 18, name, { pen: 'ink', size: 15, anchor: 'end' });
    }
    d.arrow(442, NY, 474, NY, { pen: 'ink' });
    d.text(490, NY, 'L', { pen: 'ink', size: 18, bold: true });
  });

  d.step('Forward pass: compute every value');
  d.group(() => {
    d.text(52, 64, '2', { pen: 'blue', size: 16, bold: true });
    d.text(52, 184, '3', { pen: 'blue', size: 16, bold: true });
    d.text(198, 250, '1', { pen: 'blue', size: 16, bold: true, anchor: 'end' });
    d.text(298, 250, '5', { pen: 'blue', size: 16, bold: true, anchor: 'end' });
    for (const [, x1, x2, v] of EDGES)
      d.text((x1 + x2) / 2 - 3, NY - 18, `= ${v}`, { pen: 'blue', size: 15, bold: true, anchor: 'start' });
    d.text(458, NY - 18, '4', { pen: 'blue', size: 16, bold: true });
  });

  d.step('Start at the end: ∂L/∂e = 2e = 4');
  d.group(() => {
    d.text(458, NY + 20, '1', { pen: 'red', size: 16, bold: true });
    d.text(370, NY + 20, '4', { pen: 'red', size: 16, bold: true });
  });
  d.text(14, NOTE(0), 'square node: local slope 2e = 4, times the 1 from L', { pen: 'red', size: 15, anchor: 'start' });

  d.step('+ and − pass the gradient straight through');
  d.group(() => {
    d.text(170, NY + 20, '4', { pen: 'red', size: 16, bold: true });
    d.text(270, NY + 20, '4', { pen: 'red', size: 16, bold: true });
    d.text(242, 250, '4', { pen: 'red', size: 17, bold: true, anchor: 'start' });
  });
  d.text(14, NOTE(1), '+ and − nodes: local slope 1, so v, u and b all get 4', { pen: 'red', size: 15, anchor: 'start' });

  d.step('× sends each input the other input');
  d.group(() => {
    d.text(52, 116, '12', { pen: 'red', size: 16, bold: true });
    d.text(52, 236, '8', { pen: 'red', size: 17, bold: true });
  });
  d.text(14, NOTE(2), '× node: ∂L/∂w = 4·x = 8,  ∂L/∂x = 4·w = 12', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Use the gradients: one descent step');
  d.highlight(14, 360, 492, 48);
  d.text(260, 373, 'step 0.1:  w = 3 − 0.8 = 2.2,  b = 1 − 0.4 = 0.6', { pen: 'ink', size: 15, bold: true });
  d.text(260, 396, 'new loss = (2·2.2 + 0.6 − 5)² = 0', { pen: 'green', size: 15, bold: true });
};
