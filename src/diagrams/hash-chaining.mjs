export const meta = { title: 'Hash table with separate chaining and a resize', width: 520, height: 420 };

const BX = 196; // bucket column
const BW = 44;
const BY = 44;
const BH = 32;
const ry = (i) => BY + i * BH + BH / 2;
const N1 = 270; // first chain node
const N2 = 372; // second chain node
const NW = 62;
const NH = 26;

/** A key on the left, hashed into bucket b; its node sits in the chain at column nx. */
function key(d, name, h, b, fromRow, pen) {
  d.group(() => {
    const y0 = ry(fromRow);
    d.text(20, y0, name, { pen, size: 17, bold: true, anchor: 'start' });
    d.arrow(64, y0, BX - 6, ry(b), {
      pen,
      label: `${h} % 8 = ${b}`,
      size: 14,
      labelDy: fromRow === b ? -11 : 20,
      labelDx: fromRow === b ? 0 : 6,
    });
  });
}

function node(d, name, b, x, pen, fromX) {
  d.group(() => {
    d.arrow(fromX, ry(b), x - 2, ry(b), { pen: 'muted' });
    d.rect(x, ry(b) - NH / 2, NW, NH, {
      pen,
      fill: pen,
      rough: 0.7,
      single: true,
      label: name,
      size: 16,
      bold: true,
    });
  });
}

export default (d) => {
  d.step('Eight buckets in a column');
  d.group(() => {
    for (let i = 0; i < 8; i++)
      d.rect(BX, BY + i * BH, BW, BH, {
        pen: 'ink',
        rough: 0.6,
        single: true,
        label: String(i),
        size: 15,
        textPen: 'muted',
      });
  });
  d.text(BX + BW / 2, 22, 'buckets[8]', { pen: 'muted', size: 15 });
  d.text(20, 22, 'key', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Hash each key to a bucket');
  key(d, 'cat', 35, 3, 3, 'blue');
  node(d, 'cat', 3, N1, 'blue', BX + BW - 6);
  key(d, 'dog', 14, 6, 6, 'blue');
  node(d, 'dog', 6, N1, 'blue', BX + BW - 6);

  d.step('Two keys collide: chain them');
  key(d, 'emu', 27, 3, 4, 'red');
  node(d, 'emu', 3, N2, 'red', N1 + NW + 2);
  d.text(N1 + 70, ry(3) - 34, 'collision → chain', { pen: 'red', size: 16 });

  d.step('Six keys in eight buckets: load factor 0.75');
  key(d, 'ant', 16, 0, 0, 'violet');
  node(d, 'ant', 0, N1, 'violet', BX + BW - 6);
  key(d, 'owl', 9, 1, 1, 'violet');
  node(d, 'owl', 1, N1, 'violet', BX + BW - 6);
  key(d, 'yak', 21, 5, 5, 'violet');
  node(d, 'yak', 5, N1, 'violet', BX + BW - 6);
  d.text(20, 318, 'load factor = 6 keys ÷ 8 buckets = 0.75', {
    pen: 'orange',
    size: 16,
    bold: true,
    anchor: 'start',
  });

  d.step('Double to 16 buckets and rehash');
  d.text(20, 344, 'next insert → 16 buckets, every key re-hashed with % 16:', {
    pen: 'orange',
    size: 15,
    anchor: 'start',
  });
  d.group(() => {
    const at = { 0: 'ant', 3: 'cat', 5: 'yak', 9: 'owl', 11: 'emu', 14: 'dog' };
    const SW = 28;
    const SX = 36;
    for (let i = 0; i < 16; i++) {
      const name = at[i];
      d.rect(SX + i * SW, 374, SW, 28, {
        pen: name ? 'orange' : 'ink',
        fill: name ? 'orange' : undefined,
        rough: 0.6,
        single: true,
        label: name ?? '',
        size: 13,
        bold: true,
      });
      d.text(SX + i * SW + SW / 2, 364, String(i), {
        pen: i === 11 || i === 3 ? 'orange' : 'muted',
        size: 13,
        bold: i === 11 || i === 3,
      });
    }
  });
};
