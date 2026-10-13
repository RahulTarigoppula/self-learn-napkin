export const meta = {
  title: 'One users table split into shards by range and by hash',
  width: 520,
  height: 390,
};

const XS = [212, 292, 372];
const CW = 62;
const RANGE_Y = 62;
const HASH_Y = 228;

export default (d) => {
  // a database cylinder; top ellipse at y, body h tall
  const cyl = (cx, y, label, pen, o = {}) =>
    d.group(() => {
      const h = 46;
      const ln = { pen, dashed: o.dashed, single: true };
      d.line(cx - CW / 2, y, cx - CW / 2, y + h, ln);
      d.line(cx + CW / 2, y, cx + CW / 2, y + h, ln);
      d.arc(cx, y + h, CW, 14, 90, 270, ln);
      d.ellipse(cx, y, CW, 14, { pen, fill: pen, dashed: o.dashed });
      d.text(cx, y + h / 2 + 4, label, { pen, size: 16, bold: true });
    });

  d.step('One table outgrows one machine');
  d.group(() => {
    d.rect(20, 52, 112, 248, { pen: 'ink', fill: 'paper' });
    d.text(76, 70, 'users', { size: 17, bold: true });
    d.line(20, 86, 132, 86, {});
    const rows = ['1   Ada', '2   Bo', '3   Cy', '4   Dev', '5   Eli', '…', '3M  Zed'];
    rows.forEach((r, i) => {
      const y = 104 + i * 28;
      d.text(32, y, r, { size: 14, mono: true, anchor: 'start', pen: r === '…' ? 'muted' : 'ink' });
      if (i < rows.length - 1) d.line(24, y + 14, 128, y + 14, { pen: 'muted', thin: true, single: true });
    });
  });
  d.text(76, 330, '3 M rows on\none machine', { pen: 'red', size: 15 });

  d.step('Split by key range');
  d.text(176, 30, 'by id range', { pen: 'blue', size: 17, anchor: 'start', bold: true });
  d.arrow(138, 90, 168, 90, { pen: 'blue', thick: true });
  XS.forEach((x, i) => cyl(x, RANGE_Y, `S${i + 1}`, 'blue'));
  d.group(() => {
    ['1–1M', '1M–2M', '2M–3M'].forEach((t, i) => d.text(XS[i], RANGE_Y + 66, t, { pen: 'blue', size: 15 }));
  });

  d.step('The hot shard');
  d.group(() => {
    d.rect(XS[2] - CW / 2 + 3, RANGE_Y + 10, CW - 6, 40, {
      pen: 'red',
      fill: 'red',
      fillStyle: 'hachure',
      rough: 0.8,
    });
  });
  d.group(() => {
    d.text(468, 60, 'every new\nsignup', { pen: 'red', size: 15 });
    d.arrow(452, 92, 410, 92, { pen: 'red', thick: true });
  });
  d.text(466, 134, 'hot!', { pen: 'red', size: 17, bold: true });

  d.step('Split by hash instead');
  d.text(176, 196, 'by hash(id) % 3', { pen: 'green', size: 17, anchor: 'start', bold: true });
  d.arrow(138, 256, 168, 256, { pen: 'green', thick: true });
  XS.forEach((x, i) => cyl(x, HASH_Y, `S${i + 1}`, 'green'));
  d.group(() => {
    ['1, 5, 9', '2, 4, 7', '3, 6, 8'].forEach((t, i) =>
      d.text(XS[i], HASH_Y + 66, t, { pen: 'green', size: 16 }),
    );
  });
  d.text(292, 324, 'even, but a range scan\nmust ask every shard', { pen: 'muted', size: 15 });

  d.step('Add a shard: most rows move');
  cyl(456, HASH_Y, 'S4', 'orange', { dashed: true });
  d.text(456, HASH_Y + 72, '% 4 moves\n~75 %', { pen: 'orange', size: 15 });
  d.text(292, 368, 'consistent hashing: only ~25 % move', { pen: 'orange', size: 16, bold: true });
};
