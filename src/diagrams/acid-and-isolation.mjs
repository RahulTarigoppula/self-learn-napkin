export const meta = {
  title: 'ACID, a lost update on a two-transaction timeline, isolation levels and MVCC snapshots',
  width: 520,
  height: 420,
};

const L1 = 116; // T1 lane y
const L2 = 168; // T2 lane y
const X0 = 46; // lanes start
const X1 = 414; // lanes end

export default (d) => {
  d.step('ACID in four words');
  const tiles = [
    ['Atomicity', 'all or nothing', 'blue'],
    ['Consistency', 'rules still hold', 'green'],
    ['Isolation', 'as if alone', 'red'],
    ['Durability', 'survives crashes', 'violet'],
  ];
  tiles.forEach(([name, says, pen], i) => {
    const x = 14 + i * 125;
    d.group(() => {
      d.rect(x, 14, 117, 52, { pen, fill: pen, rough: 0.7 });
      d.text(x + 58, 31, name, { pen, size: 16, bold: true });
      d.text(x + 58, 52, says, { pen: 'ink', size: 14 });
    });
  });

  d.step('Two transactions read the same row');
  d.group(() => {
    d.text(24, L1, 'T1', { pen: 'blue', size: 17, bold: true });
    d.arrow(X0, L1, X1, L1, { pen: 'muted', thin: true });
    d.text(24, L2, 'T2', { pen: 'violet', size: 17, bold: true });
    d.arrow(X0, L2, X1, L2, { pen: 'muted', thin: true });
    d.text(X1 - 20, 90, 'time →', { pen: 'muted', size: 14 });
  });
  d.dot(76, L1, 10, { pen: 'blue', label: 'read 100', dy: -18 });
  d.dot(136, L2, 10, { pen: 'violet', label: 'read 100', dy: 19 });

  d.step('Both write: the deposit vanishes');
  d.dot(190, L1, 10, { pen: 'blue', label: 'write 150', dy: -18 });
  d.dot(280, L1, 10, { pen: 'blue', label: 'commit', dy: -18 });
  d.dot(306, L2, 10, { pen: 'violet', label: 'write 80', dy: 19 });
  d.dot(390, L2, 10, { pen: 'violet', label: 'commit', dy: 19 });
  d.group(() => {
    d.text(464, 128, 'x = 80', { pen: 'red', size: 18, bold: true, mono: true });
    d.text(464, 150, '+50 lost', { pen: 'red', size: 15, bold: true });
  });

  d.step('The fix: lock, or abort and retry');
  d.group(() => {
    d.line(297, L2 - 9, 315, L2 + 9, { pen: 'red', thick: true });
    d.line(315, L2 - 9, 297, L2 + 9, { pen: 'red', thick: true });
  });
  d.text(464, 196, 'retry:\n150 → 130', { pen: 'green', size: 15, bold: true });

  d.step('Isolation levels: what each one blocks');
  const C = [176, 248, 326];
  d.group(() => {
    d.text(14, 240, 'possible?', { pen: 'muted', size: 14, anchor: 'start' });
    d.text(C[0], 240, 'dirty', { pen: 'ink', size: 14 });
    d.text(C[1], 240, 'non-rep.', { pen: 'ink', size: 14 });
    d.text(C[2], 240, 'phantom', { pen: 'ink', size: 14 });
    d.line(14, 254, 362, 254, { pen: 'muted', thin: true, rough: 0.5 });
  });
  const rows = [
    ['read uncommitted', [1, 1, 1]],
    ['read committed', [0, 1, 1]],
    ['repeatable read', [0, 0, 1]],
    ['serializable', [0, 0, 0]],
  ];
  rows.forEach(([name, cells], r) => {
    const y = 274 + r * 29;
    d.group(() => {
      d.text(14, y, name, { pen: 'ink', size: 14, anchor: 'start', bold: r === 3 });
      cells.forEach((c, i) => {
        d.text(C[i], y, c ? '✗' : '✓', { pen: c ? 'red' : 'green', size: 17, bold: true });
      });
    });
  });
  d.text(14, 396, 'stronger = fewer anomalies, more waiting', { pen: 'muted', size: 14, anchor: 'start' });

  d.step('MVCC: readers see a snapshot');
  d.text(444, 240, 'versions of x', { pen: 'muted', size: 14 });
  d.rect(384, 254, 120, 30, {
    pen: 'orange',
    fill: 'orange',
    label: '150 · ts 12',
    mono: true,
    size: 14,
    rough: 0.6,
  });
  d.rect(384, 294, 120, 30, {
    pen: 'green',
    fill: 'green',
    label: '100 · ts 5',
    mono: true,
    size: 14,
    rough: 0.6,
  });
  d.group(() => {
    d.arrow(444, 350, 444, 330, { pen: 'green', thick: true });
    d.text(444, 362, 'reader at ts 10', { pen: 'blue', size: 15, bold: true });
  });
  d.text(444, 390, 'sees 100, not 150', { pen: 'blue', size: 14 });
};
