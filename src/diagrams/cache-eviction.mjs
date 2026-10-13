export const meta = {
  title: 'Cache eviction traced with capacity 3: LRU, FIFO and a scan',
  width: 520,
  height: 420,
};

const OPX = 14; // operation column
const SX = 158; // first slot
const SW = 52; // slot width
const SG = 10; // gap between slots
const SH = 34; // slot height
const NX = 360; // note column

const slotX = (i) => SX + i * (SW + SG);

/** One row of three cache slots, most recent on the left. */
function row(d, y, items) {
  d.group(() => {
    items.forEach((it, i) => {
      if (!it) {
        d.rect(slotX(i), y - SH / 2, SW, SH, { pen: 'muted', dashed: true, rough: 0.6 });
        return;
      }
      const pen = it.pen ?? 'blue';
      d.rect(slotX(i), y - SH / 2, SW, SH, { pen, fill: pen, rough: 0.6, label: it.k, size: 18, bold: true });
    });
  });
}

const op = (d, y, text, pen = 'ink') => d.text(OPX, y, text, { pen, size: 17, bold: true, anchor: 'start' });
const note = (d, y, text, pen) => d.text(NX, y, text, { pen, size: 15, anchor: 'start' });

export default (d) => {
  d.step('A full cache must pick a victim');
  d.group(() => {
    d.text(slotX(0) + SW / 2, 30, 'most\nrecent', { pen: 'muted', size: 14 });
    d.text(slotX(2) + SW / 2, 30, 'least\nrecent', { pen: 'muted', size: 14 });
    d.arrow(slotX(0) + SW + 6, 30, slotX(2) - 6, 30, { pen: 'muted', thin: true });
  });
  op(d, 76, 'empty', 'muted');
  row(d, 76, [null, null, null]);
  note(d, 76, 'capacity = 3 keys', 'muted');

  d.step('LRU: fill with A, B, C');
  op(d, 130, 'put A,B,C');
  row(d, 130, [{ k: 'C' }, { k: 'B' }, { k: 'A' }]);
  note(d, 130, 'full: newest\nat the front', 'blue');

  d.step('A hit moves the key to the front');
  op(d, 192, 'get A');
  row(d, 192, [{ k: 'A', pen: 'green' }, { k: 'C' }, { k: 'B' }]);
  d.arrow(slotX(2) + SW / 2, 148, slotX(0) + SW / 2 + 8, 174, { pen: 'green', thick: true, bend: -14 });
  note(d, 192, 'hit → A is now\nmost recent', 'green');

  d.step('A miss on a full cache evicts the tail');
  op(d, 254, 'put D');
  row(d, 254, [{ k: 'D', pen: 'orange' }, { k: 'A' }, { k: 'C' }]);
  d.group(() => {
    const x = NX - 2;
    d.rect(x, 237, 40, SH, { pen: 'red', fill: 'red', rough: 0.6, label: 'B', size: 18, bold: true });
    d.line(x - 4, 233, x + 44, 275, { pen: 'red', thick: true });
    d.text(x + 52, 254, 'LRU\nevicts B', { pen: 'red', size: 15, anchor: 'start' });
  });

  d.step('FIFO ignores the hit and evicts A');
  op(d, 316, 'FIFO: put D', 'violet');
  row(d, 316, [
    { k: 'D', pen: 'orange' },
    { k: 'C', pen: 'violet' },
    { k: 'B', pen: 'violet' },
  ]);
  note(d, 316, 'evicts A: oldest,\nthough just used', 'violet');

  d.step('A one-off scan flushes the hot keys');
  op(d, 378, 'scan X,Y,Z', 'red');
  row(d, 378, [
    { k: 'Z', pen: 'muted' },
    { k: 'Y', pen: 'muted' },
    { k: 'X', pen: 'muted' },
  ]);
  note(d, 378, 'D, A, C all gone;\nX, Y, Z never reused', 'red');
};
