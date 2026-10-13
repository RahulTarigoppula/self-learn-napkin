export const meta = {
  title:
    'One user and her orders modelled as relational tables, a document, key-value, wide-column and graph',
  width: 520,
  height: 420,
};

const NB = (n) => ' '.repeat(n); // SVG collapses leading spaces

export default (d) => {
  const M = { mono: true, size: 14, rough: 0.5 };

  d.step('Relational: tables joined by keys');
  d.text(138, 24, 'relational (SQL)', { pen: 'blue', size: 17, bold: true });
  // a little table: one rect per cell, header row tinted
  const table = (x, y, widths, rows) => {
    rows.forEach((row, r) => {
      let cx = x;
      row.forEach((cell, c) => {
        const head = r === 0;
        d.rect(cx, y + r * 26, widths[c], 26, {
          ...M,
          pen: 'blue',
          fill: head ? 'blue' : undefined,
          label: cell,
          textPen: head ? 'muted' : 'ink',
        });
        cx += widths[c];
      });
    });
  };
  d.group(() => {
    d.text(70, 48, 'users', { pen: 'blue', size: 15, bold: true });
    table(
      24,
      60,
      [36, 56],
      [
        ['id', 'name'],
        ['42', 'Ana'],
      ],
    );
  });
  d.group(() => {
    d.text(196, 48, 'orders', { pen: 'blue', size: 15, bold: true });
    table(
      140,
      60,
      [32, 42, 38],
      [
        ['id', 'uid', '£'],
        ['7', '42', '30'],
        ['9', '42', '12'],
      ],
    );
  });
  d.group(() => {
    d.arrow(186, 148, 44, 118, { pen: 'red', bend: -14, thick: true });
    d.text(118, 166, 'JOIN ON uid = id', { pen: 'red', mono: true, size: 14 });
  });

  d.step('Document: nest what you read together');
  d.text(394, 24, 'document', { pen: 'green', size: 17, bold: true });
  d.group(() => {
    d.rect(284, 40, 220, 106, { pen: 'green', fill: 'green', rough: 0.6 });
    d.text(
      298,
      93,
      `{ _id: 42,\n${NB(2)}name: "Ana",\n${NB(2)}orders: [\n${NB(4)}{id: 7, £: 30},\n${NB(4)}{id: 9, £: 12} ]}`,
      {
        mono: true,
        size: 14,
        anchor: 'start',
      },
    );
  });
  d.text(394, 162, 'one read, no join', { pen: 'green', size: 14 });

  d.step('Key-value: a key and an opaque value');
  d.text(90, 194, 'key-value', { pen: 'orange', size: 17, bold: true });
  d.rect(44, 210, 92, 28, { ...M, pen: 'orange', fill: 'orange', label: 'user:42' });
  d.arrow(90, 240, 90, 258, { pen: 'orange' });
  d.rect(24, 262, 132, 28, {
    pen: 'orange',
    fill: 'muted',
    rough: 0.6,
    label: '01101… blob',
    mono: true,
    size: 14,
    textPen: 'muted',
  });
  d.text(90, 306, 'get/put by key only', { pen: 'orange', size: 14 });

  d.step('Wide-column: partition, then sorted rows');
  d.text(262, 194, 'wide-column', { pen: 'violet', size: 17, bold: true });
  d.text(262, 216, 'partition: user 42', { pen: 'muted', size: 14 });
  d.rect(190, 230, 144, 26, { ...M, pen: 'violet', fill: 'violet', label: '2024-05 → 30' });
  d.rect(190, 256, 144, 26, { ...M, pen: 'violet', fill: 'violet', label: '2024-06 → 12' });
  d.text(262, 306, 'rows sorted by date', { pen: 'violet', size: 14 });

  d.step('Graph: nodes and relationships');
  d.text(434, 194, 'graph', { pen: 'red', size: 17, bold: true });
  d.group(() => {
    d.circle(386, 238, 46, { pen: 'red', fill: 'red', label: 'Ana', size: 15 });
    d.circle(484, 238, 40, { pen: 'red', fill: 'red', label: 'Ben', size: 15 });
    d.circle(436, 300, 46, { pen: 'red', fill: 'red', label: 'book', size: 15 });
  });
  d.group(() => {
    d.arrow(410, 238, 462, 238, { pen: 'ink', thin: true });
    d.text(436, 222, 'follows', { size: 14 });
    d.arrow(398, 260, 418, 282, { pen: 'ink', thin: true });
    d.text(386, 286, 'bought', { size: 14, anchor: 'end' });
  });

  d.step('Pick by access pattern and scale');
  d.rect(14, 336, 240, 66, {
    pen: 'blue',
    fill: 'blue',
    rough: 0.7,
    label: 'SQL: any query, joins,\nACID; scale up, then shard',
    size: 15,
  });
  d.rect(266, 336, 240, 66, {
    pen: 'green',
    fill: 'green',
    rough: 0.7,
    label: 'NoSQL: known queries by\nkey; scale out built in',
    size: 15,
  });
};
