export const meta = {
  title: 'Bloom filter: a 16-bit array, adding cat and dog with three hashes, a definite miss and a false positive',
  width: 520,
  height: 420,
};

const X0 = 20; // first cell x
const W = 30; // cell width
const Y = 166; // cell top
const H = 32;
const cx = (i) => X0 + W * i + W / 2;

export default (d) => {
  const setBit = (i, pen) => d.rect(X0 + W * i, Y, W, H, { pen, fill: pen, rough: 0.5, label: '1', mono: true, size: 16, bold: true });

  d.step('A bit array, all zeros');
  d.text(260, 20, 'm = 16 bits, k = 3 hash functions', { pen: 'muted', size: 15 });
  d.group(() => {
    for (let i = 0; i < 16; i++) {
      d.rect(X0 + W * i, Y, W, H, { pen: 'ink', rough: 0.5, label: '0', mono: true, size: 15, textPen: 'muted' });
    }
  });
  d.group(() => {
    for (let i = 0; i < 16; i++) d.text(cx(i), Y + H + 14, String(i), { pen: 'muted', size: 14 });
  });

  d.step('Add "cat": set its 3 bits');
  d.group(() => {
    d.text(120, 44, 'add "cat"', { pen: 'blue', size: 17, bold: true });
    d.text(120, 64, 'h → 1, 4, 8', { pen: 'blue', mono: true, size: 14 });
  });
  d.group(() => {
    for (const i of [1, 4, 8]) d.arrow(120, 76, cx(i), Y - 6, { pen: 'blue' });
  });
  d.group(() => {
    for (const i of [1, 4, 8]) setBit(i, 'blue');
  });

  d.step('Add "dog": bits can be shared');
  d.group(() => {
    d.text(400, 44, 'add "dog"', { pen: 'green', size: 17, bold: true });
    d.text(400, 64, 'h → 8, 11, 14', { pen: 'green', mono: true, size: 14 });
  });
  d.group(() => {
    for (const i of [8, 11, 14]) d.arrow(400, 76, cx(i), Y - 6, { pen: 'green' });
  });
  d.group(() => {
    for (const i of [11, 14]) setBit(i, 'green');
  });

  d.step('Query "emu": a 0 means definitely not');
  d.group(() => {
    for (const i of [1, 4, 6]) d.arrow(120, 282, cx(i), Y + H + 26, { pen: i === 6 ? 'red' : 'muted', thick: i === 6 });
  });
  d.group(() => {
    d.text(120, 296, 'query "emu"', { pen: 'red', size: 17, bold: true });
    d.text(120, 316, 'h → 1, 4, 6', { pen: 'red', mono: true, size: 14 });
  });
  d.text(120, 342, 'bit 6 is 0: definitely not', { pen: 'red', size: 15, bold: true });

  d.step('Query "fox": all 1s, but never added');
  d.group(() => {
    for (const i of [8, 11, 14]) d.arrow(400, 282, cx(i), Y + H + 26, { pen: 'orange' });
  });
  d.group(() => {
    d.text(400, 296, 'query "fox"', { pen: 'orange', size: 17, bold: true });
    d.text(400, 316, 'h → 8, 11, 14', { pen: 'orange', mono: true, size: 14 });
  });
  d.text(400, 342, 'all 1: "maybe" (false +)', { pen: 'orange', size: 15, bold: true });

  d.step('How often it lies');
  d.highlight(70, 362, 380, 22);
  d.text(260, 373, 'false positives ≈ (1 − e^(−kn/m))^k', { mono: true, size: 15, bold: true });
  d.text(260, 398, 'here ≈ 3 %; 10 bits per key → ≈ 1 %', { pen: 'violet', size: 15 });
};
