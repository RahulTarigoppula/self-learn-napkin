export const meta = {
  title:
    'A DNS lookup walking root, TLD and authoritative servers, then a CDN edge serving a cached file or fetching it from the origin',
  width: 520,
  height: 420,
};

const NS = [
  { y: 24, label: 'root  .', note: 'ask the .com\nservers' },
  { y: 82, label: '.com TLD', note: 'ask ns1.shop.com' },
  { y: 140, label: 'shop.com NS', note: '' },
];
const HX = 240; // hierarchy column
const HW = 118;
const EDGE = { x: 168, y: 300, w: 112, h: 62 };
const ORIGIN = { x: 386, y: 300, w: 112, h: 62 };

export default (d) => {
  const nsBox = (n) => d.rect(HX, n.y, HW, 32, { pen: 'violet', fill: 'paper', label: n.label, size: 15 });
  const ask = (n, i) =>
    d.arrow(132, 44 + i * 20, HX - 4, n.y + 16, {
      pen: 'violet',
      both: true,
      label: String(i + 1),
      size: 15,
      labelDy: -10,
    });

  d.step('Who knows img.shop.com?');
  d.group(() => {
    d.rect(14, 30, 114, 70, { pen: 'violet', fill: 'violet' });
    d.text(71, 50, 'resolver', { pen: 'violet', size: 17, bold: true });
  });
  d.group(() => {
    d.rect(30, 200, 78, 50, { pen: 'blue', fill: 'paper' });
    d.line(30, 212, 108, 212, { pen: 'blue', thin: true });
    for (const k of [0, 1, 2]) d.dot(38 + k * 8, 206, 4, { pen: 'blue' });
    d.text(69, 232, 'browser', { pen: 'blue', size: 15 });
  });
  d.group(() => {
    d.arrow(69, 196, 69, 106, { pen: 'blue' });
    d.text(80, 150, 'img.shop.com?', { pen: 'blue', size: 15, anchor: 'start' });
  });

  d.step('Walk down the hierarchy');
  for (const i of [0, 1]) {
    nsBox(NS[i]);
    ask(NS[i], i);
    d.text(HX + HW + 10, NS[i].y + 16, NS[i].note, { pen: 'muted', size: 14, anchor: 'start' });
  }

  d.step('The authoritative answer, cached for its TTL');
  nsBox(NS[2]);
  ask(NS[2], 2);
  d.text(HX + HW + 10, NS[2].y + 16, '203.0.113.7\nTTL 300 s', { pen: 'green', size: 15, anchor: 'start' });
  d.text(71, 78, 'cache: 300 s', { pen: 'green', size: 14 });
  d.text(80, 172, '→ 203.0.113.7', { pen: 'green', size: 15, anchor: 'start' });

  d.step('That IP is a nearby CDN edge');
  d.group(() => {
    d.rect(EDGE.x, EDGE.y, EDGE.w, EDGE.h, { pen: 'blue', fill: 'blue' });
    d.text(EDGE.x + EDGE.w / 2, EDGE.y + 18, 'CDN edge', { pen: 'blue', size: 15, bold: true });
    for (const k of [0, 1, 2])
      d.rect(EDGE.x + 24 + k * 22, EDGE.y + 34, 16, 18, { pen: 'blue', fill: 'paper', thin: true });
  });
  d.arrow(96, 254, EDGE.x - 6, EDGE.y + 30, {
    pen: 'blue',
    label: 'GET /logo.png',
    size: 14,
    labelDx: -52,
    labelDy: 20,
  });
  d.text(EDGE.x + EDGE.w / 2, EDGE.y + EDGE.h + 18, 'hit: ~10 ms away', { pen: 'green', size: 15 });

  d.step('A miss goes to the origin once');
  d.group(() => {
    d.rect(ORIGIN.x, ORIGIN.y, ORIGIN.w, ORIGIN.h, { pen: 'ink', fill: 'muted' });
    d.text(ORIGIN.x + ORIGIN.w / 2, ORIGIN.y + 18, 'origin', { pen: 'ink', size: 15, bold: true });
    for (const k of [36, 46])
      d.line(ORIGIN.x + 26, ORIGIN.y + k, ORIGIN.x + ORIGIN.w - 26, ORIGIN.y + k, { pen: 'ink', thin: true });
  });
  d.arrow(EDGE.x + EDGE.w + 4, EDGE.y + 18, ORIGIN.x - 4, ORIGIN.y + 18, {
    pen: 'orange',
    dashed: true,
    label: 'miss',
    size: 14,
  });
  d.arrow(ORIGIN.x - 4, EDGE.y + 46, EDGE.x + EDGE.w + 4, EDGE.y + 46, {
    pen: 'orange',
    label: 'copy',
    size: 14,
    labelDy: 14,
  });
  d.text(ORIGIN.x + ORIGIN.w / 2, ORIGIN.y + ORIGIN.h + 18, '~150 ms, once', { pen: 'orange', size: 15 });
  d.text(EDGE.x + EDGE.w / 2, EDGE.y + EDGE.h + 40, 'kept for max-age', { pen: 'orange', size: 14 });

  d.step('Changing a file: purge or rename');
  d.text(360, 232, 'logo changed?\npurge the edges,\nor ship logo.v2.png', {
    pen: 'red',
    size: 15,
    anchor: 'start',
  });
  d.arrow(352, 252, 286, 296, { pen: 'red', bend: -10 });
};
