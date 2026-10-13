export const meta = {
  title:
    'Nearest neighbour before and after standardising age and income, fitting the scaler on train only, and gradient descent on raw vs scaled features',
  width: 520,
  height: 420,
};

// Five training people (age mean 40, std 12; income mean 50k, std 10k) and a new person Q.
const COLS = [
  { key: 'who', w: 40, head: 'who' },
  { key: 'age', w: 48, head: 'age' },
  { key: 'inc', w: 80, head: 'income £' },
  { key: 'raw', w: 76, head: 'raw\ndistance' },
  { key: 'za', w: 62, head: 'z age' },
  { key: 'zi', w: 62, head: 'z inc' },
  { key: 'zd', w: 74, head: 'scaled\ndistance' },
];
const ROWS = [
  { who: 'A', age: '22', inc: '55,000', raw: '11,000', za: '−1.50', zi: '+0.50', zd: '1.11' },
  { who: 'B', age: '34', inc: '35,000', raw: '9,000', za: '−0.50', zi: '−1.50', zd: '1.23' },
  { who: 'C', age: '40', inc: '50,000', raw: '6,000', za: '0.00', zi: '0.00', zd: '1.46' },
  { who: 'D', age: '46', inc: '65,000', raw: '21,000', za: '+0.50', zi: '+1.50', zd: '2.79' },
  { who: 'E', age: '58', inc: '45,000', raw: '1,001', za: '+1.50', zi: '−0.50', zd: '2.84' },
  { who: 'Q', age: '24', inc: '44,000', raw: '', za: '−1.33', zi: '−0.60', zd: '' },
];
const TX = 28;
const HY = 34;
const HH = 34;
const RH = 23;
const colX = (key) => {
  let x = TX;
  for (const c of COLS) {
    if (c.key === key) return x;
    x += c.w;
  }
  throw new Error(key);
};
const colW = (key) => COLS.find((c) => c.key === key).w;
const rowY = (r) => HY + HH + r * RH;

/** Header + body cells for the given columns. */
function columns(d, keys, pen, fill) {
  d.group(() => {
    for (const k of keys) {
      const c = COLS.find((cc) => cc.key === k);
      d.rect(colX(k), HY, c.w, HH, {
        pen,
        fill,
        rough: 0.4,
        single: true,
        label: c.head,
        size: 14,
        textPen: 'ink',
      });
    }
  });
  d.group(() => {
    ROWS.forEach((row, r) => {
      for (const k of keys) {
        const isQ = row.who === 'Q';
        d.rect(colX(k), rowY(r), colW(k), RH, {
          pen: 'muted',
          rough: 0.3,
          single: true,
          label: row[k],
          size: 15,
          mono: k !== 'who',
          textPen: isQ ? 'orange' : 'ink',
        });
      }
    });
  });
}

export default (d) => {
  d.step('Two features in very different units');
  columns(d, ['who', 'age', 'inc'], 'ink', undefined);
  d.text(colX('who') - 6, rowY(5) + RH / 2, 'new', { pen: 'orange', size: 14, anchor: 'end' });

  d.step('Raw distance: income drowns age');
  columns(d, ['raw'], 'red', 'red');
  d.group(() => {
    d.rect(colX('raw') + 3, rowY(4) + 2, colW('raw') - 6, RH - 4, { pen: 'red', thick: true, rough: 0.6 });
    d.text(TX, rowY(6) + 14, 'raw: nearest is E, 34 years older', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('Standardise: z = (x − mean) / std');
  d.text(colX('za') + 62, 18, 'z = (x − μ) / σ', { pen: 'blue', size: 16, mono: true });
  columns(d, ['za', 'zi'], 'blue', 'blue');

  d.step('Scaled distance: A is nearest');
  columns(d, ['zd'], 'green', 'green');
  d.group(() => {
    d.rect(colX('zd') + 3, rowY(0) + 2, colW('zd') - 6, RH - 4, { pen: 'green', thick: true, rough: 0.6 });
    d.text(colX('zd') + colW('zd'), rowY(6) + 36, 'scaled: nearest is A, E is farthest', {
      pen: 'green',
      size: 15,
      anchor: 'end',
    });
  });

  d.step('Fit the scaler on train only');
  d.rect(16, 290, 70, 34, { pen: 'blue', label: 'train', size: 16 });
  d.arrow(90, 307, 122, 307, { pen: 'green', label: 'fit', size: 14 });
  d.rect(126, 284, 124, 46, {
    pen: 'green',
    fill: 'green',
    label: 'μ, σ from\ntrain only',
    size: 15,
    textPen: 'ink',
  });
  d.group(() => {
    d.arrow(160, 334, 104, 362, { pen: 'blue' });
    d.arrow(218, 334, 230, 362, { pen: 'blue' });
    d.rect(52, 364, 92, 30, { pen: 'blue', label: 'train → z', size: 15 });
    d.rect(186, 364, 84, 30, { pen: 'orange', label: 'test → z', size: 15 });
  });

  d.step('Gradient descent: a round bowl');
  d.text(392, 286, 'gradient descent', { pen: 'muted', size: 15 });
  d.group(() => {
    const [cx, cy, ax, by] = [346, 334, 64, 20];
    d.ellipse(cx, cy, 2 * ax, 2 * by, { pen: 'muted', thin: true });
    d.ellipse(cx, cy, ax, by, { pen: 'muted', thin: true });
    const zig = [];
    for (let i = 0; i <= 6; i++) {
      const x = cx - 54 + i * 9;
      const ext = by * Math.sqrt(Math.max(0, 1 - ((x - cx) / ax) ** 2)) * 0.8;
      zig.push([x, i === 6 ? cy : cy + (i % 2 ? -ext : ext)]);
    }
    d.poly(zig, { pen: 'red', thick: true, rough: 0.4 });
    d.text(cx, 378, 'raw units:\nzig-zag', { pen: 'red', size: 15 });
  });
  d.group(() => {
    d.circle(462, 334, 76, { pen: 'muted', thin: true });
    d.circle(462, 334, 38, { pen: 'muted', thin: true });
    d.arrow(434, 312, 458, 331, { pen: 'green', thick: true });
    d.text(462, 378, 'scaled:\nstraight in', { pen: 'green', size: 15 });
  });
};
