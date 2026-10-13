export const meta = {
  title:
    'Forward proxy versus reverse proxy, then an API gateway that authenticates, rate-limits, routes and aggregates requests',
  width: 520,
  height: 420,
};

const GW = { x: 196, y: 252, w: 100, h: 104 };
const SVC = [
  { id: 'users', y: 252 },
  { id: 'orders', y: 302 },
  { id: 'payments', y: 352 },
];
const SX = 404;
const SW = 102;
const SH = 36;

export default (d) => {
  // helpers draw loose strokes; callers wrap them in one d.group (groups do not nest)
  const laptop = (x, y, pen) => {
    d.rect(x, y, 34, 22, { pen, fill: 'paper' });
    d.line(x - 5, y + 27, x + 39, y + 27, { pen });
  };
  const cloud = (cx, cy) =>
    d.ellipse(cx, cy, 96, 46, { pen: 'muted', fill: 'muted', label: 'internet', size: 15 });
  const server = (x, y) => {
    d.rect(x, y, 40, 30, { pen: 'ink', fill: 'paper' });
    for (const k of [9, 16, 23]) d.line(x + 8, y + k, x + 32, y + k, { pen: 'ink', thin: true });
  };
  const FAN = [GW.x + GW.w + 4, GW.y + 16]; // aggregation fans out from the top corner

  d.step('Forward proxy: speaks for the clients');
  d.group(() => {
    d.rect(14, 22, 146, 74, { pen: 'muted', dashed: true });
    d.text(22, 34, 'office', { pen: 'muted', size: 14, anchor: 'start' });
    laptop(34, 50, 'ink');
    laptop(98, 50, 'ink');
  });
  d.arrow(164, 62, 200, 62, { pen: 'orange' });
  d.rect(204, 42, 100, 40, { pen: 'orange', fill: 'orange', label: 'fwd proxy', size: 16, bold: true });
  d.arrow(308, 62, 386, 62, { pen: 'orange' });
  cloud(440, 62);
  d.text(254, 100, 'sites see the proxy, not you', { pen: 'orange', size: 14 });

  d.step('Reverse proxy: speaks for the servers');
  cloud(66, 166);
  d.arrow(118, 166, 200, 166, { pen: 'blue', label: 'HTTPS', size: 14 });
  d.rect(204, 146, 100, 40, { pen: 'blue', fill: 'blue', label: 'rev proxy', size: 16, bold: true });
  d.group(() => {
    d.rect(354, 124, 152, 84, { pen: 'muted', dashed: true });
    d.text(498, 136, 'your servers', { pen: 'muted', size: 14, anchor: 'end' });
    server(372, 162);
    server(440, 162);
  });
  d.arrow(308, 166, 368, 177, { pen: 'blue', label: 'HTTP', size: 14, labelDx: -16, labelDy: -18 });
  d.text(254, 206, 'ends TLS · gzip · caches', { pen: 'blue', size: 14 });

  d.step('API gateway: one door, many services');
  d.line(14, 228, 506, 228, { pen: 'muted', thin: true, dashed: true });
  d.group(() => {
    d.rect(GW.x, GW.y, GW.w, GW.h, { pen: 'violet', fill: 'violet' });
    d.text(GW.x + GW.w / 2, GW.y + 18, 'gateway', { pen: 'violet', size: 16, bold: true });
  });
  for (const s of SVC) d.rect(SX, s.y, SW, SH, { pen: 'ink', fill: 'paper', label: s.id, size: 15 });
  d.group(() => {
    d.rect(24, 330, 62, 42, { pen: 'blue', fill: 'paper' });
    d.line(24, 341, 86, 341, { pen: 'blue', thin: true });
    d.text(55, 386, 'web', { pen: 'blue', size: 14 });
  });
  d.arrow(90, 352, GW.x - 4, 340, { pen: 'blue', label: '/orders/7', size: 14 });
  d.arrow(GW.x + GW.w + 4, 340, SX - 4, 330, { pen: 'blue' });

  d.step('Every request is checked first');
  d.text(GW.x + GW.w / 2, GW.y + 58, 'auth?\nrate limit?\nroute', { pen: 'violet', size: 14 });
  d.arrow(GW.x - 4, 364, 92, 368, { pen: 'red', label: '401 / 429', size: 14, labelDy: 16 });

  d.step('Aggregation: one call, three services');
  d.group(() => {
    d.rect(40, 256, 28, 46, { pen: 'green', fill: 'paper' });
    d.line(49, 296, 59, 296, { pen: 'green', thin: true });
    d.text(54, 316, 'app', { pen: 'green', size: 14 });
  });
  d.arrow(72, 272, GW.x - 4, 272, { pen: 'green', label: 'GET /home', size: 14 });
  for (const [i, dy] of [
    [0, 0],
    [1, -8],
    [2, -8],
  ])
    d.arrow(...FAN, SX - 4, SVC[i].y + SH / 2 + dy, { pen: 'green' });

  d.step('One door is also one point of failure');
  d.rect(GW.x, 368, GW.w, 36, { pen: 'orange', fill: 'orange', dashed: true, label: 'gateway #2', size: 15 });
};
