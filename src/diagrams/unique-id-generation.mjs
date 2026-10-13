export const meta = {
  title: 'Unique IDs: auto-increment collides across shards, UUIDv4, the 64-bit Snowflake layout, UUIDv7 and clock skew',
  width: 520,
  height: 420,
};

const BX = 20; // bit-bar left
const BY = 196; // Snowflake bar top
const BH = 34;

export default (d) => {
  d.step('Auto-increment per shard collides');
  d.group(() => {
    d.rect(16, 18, 126, 46, { pen: 'blue', fill: 'blue', label: 'shard A\nnext id 101', size: 15, single: true });
    d.rect(156, 18, 126, 46, { pen: 'blue', fill: 'blue', label: 'shard B\nnext id 101', size: 15, single: true });
  });
  d.text(296, 41, 'two orders get\nid 101: collision', { size: 15, pen: 'red', anchor: 'start', bold: true });

  d.step('UUIDv4: 122 random bits, no coordination');
  d.group(() => {
    d.text(16, 98, 'v4', { size: 16, bold: true, pen: 'violet', anchor: 'start' });
    d.text(48, 98, '3f6c1a9e-04d2-4b7e-9c51-d8a2e07f6b13', { mono: true, size: 14, anchor: 'start', pen: 'violet' });
  });
  d.text(16, 126, 'random: unique without talking, but not time-ordered', { size: 14, anchor: 'start', pen: 'muted' });

  d.step('Snowflake: 64 bits = time | machine | sequence');
  d.text(BX, 174, 'Snowflake id, 64 bits:', { size: 15, bold: true, anchor: 'start' });
  d.group(() => {
    d.rect(BX, BY, 14, BH, { pen: 'muted', fill: 'muted', single: true, rough: 0.5 });
    d.rect(BX + 14, BY, 300, BH, { pen: 'blue', fill: 'blue', label: '41 bits: ms since epoch', size: 15, single: true, rough: 0.5 });
    d.rect(BX + 314, BY, 76, BH, { pen: 'violet', fill: 'violet', label: '10 bits', size: 14, single: true, rough: 0.5 });
    d.rect(BX + 390, BY, 90, BH, { pen: 'orange', fill: 'orange', label: '12 bits', size: 14, single: true, rough: 0.5 });
  });
  d.text(BX, BY + BH + 14, 'sign 0', { size: 14, pen: 'muted', anchor: 'start' });
  d.group(() => {
    d.text(BX + 352, 180, 'machine', { size: 14, pen: 'violet' });
    d.text(BX + 435, 180, 'sequence', { size: 14, pen: 'orange' });
  });

  d.step('What the bit budget buys');
  d.group(() => {
    d.text(BX + 164, 262, '2^41 ms ≈ 69.7 years', { size: 15, pen: 'blue', bold: true });
    d.text(BX + 352, 262, '1,024\nmachines', { size: 14, pen: 'violet' });
    d.text(BX + 435, 262, '4,096 ids\nper ms', { size: 14, pen: 'orange', bold: true });
  });

  d.step('UUIDv7 / ULID: time first, so ids sort');
  d.text(BX, 304, 'UUIDv7 / ULID, 128 bits:', { size: 15, bold: true, anchor: 'start' });
  d.group(() => {
    d.rect(BX, 322, 180, BH, { pen: 'blue', fill: 'blue', label: '48-bit ms time', size: 15, single: true, rough: 0.5 });
    d.rect(BX + 180, 322, 300, BH, { pen: 'green', fill: 'green', label: 'random (74 bits v7, 80 ULID)', size: 15, single: true, rough: 0.5 });
  });

  d.step('Clock goes backwards: wait, do not reuse');
  d.group(() => {
    d.text(BX, 386, 'clock: 105 ms', { size: 15, anchor: 'start', mono: true });
    d.arrow(BX + 132, 386, BX + 196, 386, { pen: 'red', thick: true, label: 'NTP step', size: 14, labelDy: -16 });
    d.text(BX + 206, 386, '100 ms', { size: 15, anchor: 'start', mono: true, pen: 'red' });
  });
  d.text(500, 386, 'refuse ids until 105', { size: 15, anchor: 'end', pen: 'green', bold: true });
};
