export const meta = { title: 'Bits of 12, AND/OR/XOR tables, x & (x−1), two’s complement and x & −x, XOR pairs, and bitmask subsets', width: 520, height: 420 };

// one written row of bits: label (right-aligned at lx), digits from x0 every `step`, optional value after
const bits = (d, lx, x0, y, label, s, o = {}) =>
  d.group(() => {
    d.text(lx, y, label, { pen: o.labelPen ?? 'muted', mono: true, size: 14, anchor: 'end' });
    [...s].forEach((b, i) => {
      const pen = o.pens?.[i] ?? o.pen ?? 'ink';
      d.text(x0 + i * (o.step ?? 20), y, b, { pen, mono: true, size: 16, bold: true });
    });
    if (o.value) d.text(x0 + s.length * (o.step ?? 20) - 2, y, o.value, { pen: o.valuePen ?? 'muted', mono: true, size: 14, anchor: 'start' });
  });

const rule = (d, x1, x2, y) => d.line(x1, y, x2, y, { pen: 'muted', rough: 0.4, single: true });

export default (d) => {
  d.step('Every integer is a row of bits');
  const PV = [128, 64, 32, 16, 8, 4, 2, 1];
  d.group(() => {
    PV.forEach((p, i) => {
      const on = p === 8 || p === 4;
      d.rect(120 + i * 30, 34, 30, 30, { pen: on ? 'blue' : 'ink', fill: on ? 'blue' : undefined, rough: 0.6, single: true, label: on ? '1' : '0', mono: true, size: 17, bold: true });
      d.text(135 + i * 30, 20, String(p), { pen: on ? 'blue' : 'muted', mono: true, size: 13 });
    });
    d.text(110, 49, '12 =', { pen: 'ink', size: 18, bold: true, anchor: 'end' });
    d.text(372, 49, '= 8 + 4', { pen: 'blue', size: 17, bold: true, anchor: 'start' });
  });

  d.step('AND, OR, XOR work column by column');
  bits(d, 74, 92, 102, 'a', '1100', { value: '12' });
  bits(d, 74, 92, 124, 'b', '1010', { value: '10' });
  rule(d, 30, 250, 138);
  bits(d, 74, 92, 154, 'a & b', '1000', { pen: 'green', value: '8', valuePen: 'green' });
  bits(d, 74, 92, 178, 'a | b', '1110', { pen: 'orange', value: '14', valuePen: 'orange' });
  bits(d, 74, 92, 202, 'a ^ b', '0110', { pen: 'violet', value: '6', valuePen: 'violet' });

  d.step('x & (x − 1) clears the lowest 1');
  bits(d, 360, 376, 102, 'x', '1100', { pens: [, 'red'], value: '12' });
  bits(d, 360, 376, 124, 'x − 1', '1011', { value: '11' });
  rule(d, 290, 474, 138);
  bits(d, 360, 376, 154, 'x & (x−1)', '1000', { pen: 'green', value: '8', valuePen: 'green' });
  d.text(290, 190, 'the lowest 1 is gone; repeat\nuntil 0 to count the 1s', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Two’s complement: −x = ~x + 1, and x & −x');
  bits(d, 78, 92, 252, 'x', '00001100', { step: 18, value: '12' });
  bits(d, 78, 92, 274, '~x', '11110011', { step: 18, value: 'flip' });
  bits(d, 78, 92, 296, '−x', '11110100', { step: 18, pen: 'violet', value: '+1: −12', valuePen: 'violet', labelPen: 'violet' });
  rule(d, 24, 292, 310);
  bits(d, 78, 92, 326, 'x&−x', '00000100', { step: 18, pens: [, , , , , 'green'], pen: 'muted', value: '4', valuePen: 'green' });

  d.step('XOR cancels pairs');
  d.group(() => {
    d.text(312, 248, '[4, 1, 2, 1, 2]', { pen: 'ink', mono: true, size: 15, anchor: 'start' });
    d.text(312, 272, '4^1^2^1^2', { pen: 'ink', mono: true, size: 15, anchor: 'start' });
    d.text(312, 296, '= 4^(1^1)^(2^2)', { pen: 'ink', mono: true, size: 15, anchor: 'start' });
    d.text(312, 320, '= 4^0^0 = 4', { pen: 'green', mono: true, size: 15, bold: true, anchor: 'start' });
  });
  d.text(312, 344, 'a^a = 0,  a^0 = a', { pen: 'violet', mono: true, size: 14, anchor: 'start' });

  d.step('A bitmask is a subset');
  d.group(() => {
    ['c', 'b', 'a'].forEach((ch, i) => d.text(135 + i * 30, 358, ch, { pen: 'muted', size: 16 }));
    ['1', '0', '1'].forEach((b, i) => d.rect(120 + i * 30, 370, 30, 30, { pen: b === '1' ? 'orange' : 'ink', fill: b === '1' ? 'orange' : undefined, rough: 0.6, single: true, label: b, mono: true, size: 17, bold: true }));
    d.text(110, 385, 'mask 5 =', { pen: 'ink', size: 16, bold: true, anchor: 'end' });
    d.text(222, 385, '→ {a, c}', { pen: 'orange', size: 17, bold: true, anchor: 'start' });
  });
  d.text(320, 385, 'masks 0…7 =\nall 8 subsets', { pen: 'orange', size: 15, anchor: 'start' });
};
