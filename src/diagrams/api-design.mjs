export const meta = {
  title: 'REST verbs and pagination, a gRPC call over HTTP/2, and a GraphQL query with the N+1 problem',
  width: 520,
  height: 420,
};

const ROW = { x: 288, y: 42, w: 58, h: 16 }; // pagination list
const IDS = [106, 105, 104, 103, 102, 101];

// SVG collapses runs of spaces; no-break spaces keep code columns and indents
const nbsp = (s) => s.replace(/ /g, String.fromCharCode(0xa0));

export default (d) => {
  d.step('REST: nouns in the URL, verbs in the method');
  d.text(14, 26, 'REST', { pen: 'blue', size: 17, bold: true, anchor: 'start' });
  d.group(() => {
    const lines = [
      ['GET    /orders/7 → 200', 'green'],
      ['POST   /orders   → 201', 'orange'],
      ['PUT    /orders/7 → 200', 'green'],
      ['DELETE /orders/7 → 204', 'green'],
    ];
    lines.forEach(([t, pen], i) =>
      d.text(14, 52 + i * 22, nbsp(t), { pen, size: 15, mono: true, anchor: 'start' }),
    );
  });
  d.text(14, 142, 'green = idempotent, safe to retry', { pen: 'muted', size: 14, anchor: 'start' });

  d.step('Pagination: offset vs cursor');
  d.text(ROW.x - 12, 26, 'newest first', { pen: 'muted', size: 14, anchor: 'start' });
  d.group(() => {
    IDS.forEach((id, i) =>
      d.rect(ROW.x, ROW.y + i * ROW.h, ROW.w, ROW.h, {
        pen: 'ink',
        fill: i < 3 ? 'blue' : 'paper',
        label: String(id),
        size: 14,
        mono: true,
        rough: 0.6,
      }),
    );
    d.line(ROW.x - 8, ROW.y + 2, ROW.x - 8, ROW.y + 3 * ROW.h - 2, { pen: 'blue' });
    d.text(ROW.x - 14, ROW.y + 1.5 * ROW.h, 'page 1', { pen: 'blue', size: 14, anchor: 'end' });
  });
  d.rect(ROW.x - 3, ROW.y + 2 * ROW.h - 2, ROW.w + 6, ROW.h + 4, { pen: 'red', rough: 0.6 });
  d.text(360, 56, '?offset=3 after 107\narrives → 104 twice', { pen: 'red', size: 14, anchor: 'start' });
  d.text(360, 112, '?after=104 → 103,\nstable', { pen: 'green', size: 14, anchor: 'start' });

  d.step('gRPC: typed calls over HTTP/2');
  d.line(14, 158, 506, 158, { pen: 'muted', thin: true, dashed: true });
  d.text(14, 176, 'gRPC', { pen: 'orange', size: 17, bold: true, anchor: 'start' });
  d.rect(30, 192, 104, 46, { pen: 'ink', fill: 'paper', label: 'checkout', size: 15 });
  d.rect(390, 192, 104, 46, { pen: 'ink', fill: 'paper', label: 'payments', size: 15 });
  d.arrow(138, 206, 386, 206, { pen: 'orange', label: 'Charge(ChargeRequest)', mono: true, size: 15 });
  d.arrow(386, 224, 138, 224, { pen: 'orange' });
  d.text(262, 252, 'protobuf binary · one HTTP/2 connection', { pen: 'muted', size: 14 });

  d.step('GraphQL: the client shapes the response');
  d.line(14, 272, 506, 272, { pen: 'muted', thin: true, dashed: true });
  d.text(14, 290, 'GraphQL', { pen: 'violet', size: 17, bold: true, anchor: 'start' });
  d.text(100, 290, 'POST /graphql', { pen: 'violet', size: 14, mono: true, anchor: 'start' });
  d.group(() => {
    d.rect(14, 306, 182, 96, { pen: 'violet', fill: 'violet' });
    d.text(24, 354, nbsp('{ posts(first: 50) {\n    title\n    author { name }\n} }'), {
      pen: 'violet',
      size: 15,
      mono: true,
      anchor: 'start',
    });
  });
  d.arrow(200, 354, 236, 354, { pen: 'violet' });
  d.rect(240, 306, 112, 96, {
    pen: 'ink',
    fill: 'paper',
    label: 'JSON in the\nsame shape,\nno extra\nfields',
    size: 14,
  });

  d.step('The N+1 trap and its fix');
  d.text(432, 318, 'naive: 1 + 50\nDB queries', { pen: 'red', size: 15 });
  d.arrow(432, 344, 432, 368, { pen: 'green' });
  d.text(432, 386, 'batched: 2', { pen: 'green', size: 15 });
};
