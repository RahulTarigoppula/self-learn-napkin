export const meta = {
  title:
    'LSM-tree: writes to WAL and memtable, flush to SSTables, reads with bloom filters, compaction into levels',
  width: 520,
  height: 420,
};

const SST_Y = 204;
const SST_X = [50, 202, 354]; // SST 1 (oldest) … SST 3 (newest), width 140

export default (d) => {
  const M = { mono: true, size: 14, rough: 0.6, textPen: 'ink' };

  d.step('Write: append to the WAL, insert in the memtable');
  d.group(() => {
    d.line(14, 102, 506, 102, { pen: 'muted', dashed: true, thin: true });
    d.text(506, 90, 'memory', { pen: 'muted', size: 14, anchor: 'end' });
    d.text(506, 114, 'disk', { pen: 'muted', size: 14, anchor: 'end' });
  });
  d.text(14, 36, 'put(dog, 7)', { pen: 'blue', mono: true, size: 15, bold: true, anchor: 'start' });
  d.group(() => {
    d.rect(200, 18, 180, 62, { pen: 'violet', fill: 'violet', rough: 0.6 });
    d.text(290, 34, 'memtable (sorted)', { pen: 'violet', size: 15, bold: true });
    d.text(290, 60, 'ant:1  dog:7', { mono: true, size: 14 });
  });
  d.arrow(124, 36, 194, 40, { pen: 'blue', thick: true });
  d.group(() => {
    ['…', 'yak', 'ant', 'dog'].forEach((t, i) =>
      d.rect(14 + i * 40, 124, 40, 26, {
        ...M,
        pen: i === 3 ? 'orange' : 'muted',
        fill: i === 3 ? 'orange' : 'muted',
        label: t,
      }),
    );
    d.text(94, 166, 'WAL, append-only', { pen: 'muted', size: 14 });
  });
  d.arrow(60, 50, 150, 118, { pen: 'blue', thick: true, bend: -12 });

  d.step('Flush: memtable becomes a sorted SSTable');
  d.group(() => {
    ['SST 1 · oldest', 'SST 2', 'SST 3 · newest'].forEach((t, i) =>
      d.text(SST_X[i] + 70, SST_Y - 14, t, { pen: 'muted', size: 14 }),
    );
    d.text(24, SST_Y + 16, 'L0', { pen: 'ink', size: 16, bold: true });
  });
  d.rect(SST_X[0], SST_Y, 140, 32, { ...M, pen: 'green', fill: 'green', label: 'bee:3  dog:2' });
  d.rect(SST_X[1], SST_Y, 140, 32, { ...M, pen: 'green', fill: 'green', label: 'cat:5  dog:4' });
  d.arrow(350, 84, 416, SST_Y - 26, { pen: 'violet', thick: true });
  d.rect(SST_X[2], SST_Y, 140, 32, { ...M, pen: 'orange', fill: 'orange', label: 'ant:1  dog:7' });

  d.step('Read: newest first, bloom filters skip files');
  d.text(446, 46, 'get(cat):\nnot in\nmemtable', { pen: 'red', size: 14 });
  d.text(SST_X[2] + 70, SST_Y + 48, 'bloom: no → skip', { pen: 'red', size: 14 });
  d.text(SST_X[1] + 70, SST_Y + 48, 'bloom: maybe → cat:5', { pen: 'green', size: 14, bold: true });
  d.text(SST_X[0] + 70, SST_Y + 48, 'never read', { pen: 'muted', size: 14 });

  d.step('Compaction: merge, keep the newest');
  d.group(() => {
    d.arrow(SST_X[0] + 70, 266, 200, 294, { pen: 'muted' });
    d.arrow(SST_X[1] + 70, 266, 272, 294, { pen: 'muted' });
    d.arrow(SST_X[2] + 70, 266, 344, 294, { pen: 'muted' });
  });
  d.group(() => {
    d.text(24, 314, 'L1', { pen: 'ink', size: 16, bold: true });
    d.rect(124, 298, 296, 32, { ...M, pen: 'blue', fill: 'blue', label: 'ant:1 bee:3 cat:5 dog:7' });
  });
  d.text(468, 314, 'dog:4, dog:2\ndropped', { pen: 'orange', size: 14 });

  d.step('Levels: each about 10× bigger');
  d.group(() => {
    d.text(24, 366, 'L2', { pen: 'ink', size: 16, bold: true });
    ['a–c', 'd–f', 'g–j', 'k–m', 'n–q', 'r–t', 'u–z'].forEach((t, i) =>
      d.rect(50 + i * 64, 352, 58, 28, { ...M, pen: 'blue', fill: 'blue', label: t }),
    );
  });
  d.text(264, 400, 'sorted, non-overlapping files per level', { pen: 'muted', size: 14 });
};
