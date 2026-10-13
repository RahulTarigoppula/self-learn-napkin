export const meta = {
  title:
    'URL shortener: load balancer, app servers, key service, cache, sharded database and an analytics queue',
  width: 520,
  height: 400,
};

const CL = { x: 18, cy: 176 }; // client monitor
const LB = { x: 104, y: 152, w: 54, h: 50 };
const APP = { x: 198, y: 146, w: 86, h: 62 };
const KGS = { x: 198, y: 58, w: 86, h: 48 };
const CACHE = { x: 336, y: 104, w: 92, h: 42 };
const DBY = 196; // top of the database cylinders
const DBX = [358, 420, 482]; // cylinder centres
const CW = 50;

export default (d) => {
  const client = () =>
    d.group(() => {
      d.rect(CL.x, CL.cy - 20, 50, 34, { pen: 'ink', fill: 'muted' });
      d.line(CL.x + 25, CL.cy + 14, CL.x + 25, CL.cy + 22, { pen: 'ink', single: true });
      d.line(CL.x + 13, CL.cy + 23, CL.x + 37, CL.cy + 23, { pen: 'ink', single: true });
    });

  const cyl = (cx, y, label, pen, fill = pen) =>
    d.group(() => {
      const h = 50;
      const ln = { pen, single: true };
      d.line(cx - CW / 2, y, cx - CW / 2, y + h, ln);
      d.line(cx + CW / 2, y, cx + CW / 2, y + h, ln);
      d.arc(cx, y + h, CW, 14, 90, 270, ln);
      d.ellipse(cx, y, CW, 14, { pen, fill });
      d.text(cx, y + h / 2 + 4, label, { pen, size: 16, bold: true });
    });

  d.step('Write path: shorten a URL');
  d.text(260, 22, 'sho.rt/aZ3kQ9x  →  https://example.com/…/long', { pen: 'muted', size: 14, mono: true });
  client();
  d.text(CL.x + 25, CL.cy - 38, 'client', { pen: 'muted', size: 15 });
  d.rect(LB.x, LB.y, LB.w, LB.h, { pen: 'violet', fill: 'violet', label: 'LB', size: 18, bold: true });
  d.group(() => {
    d.rect(APP.x + 6, APP.y - 6, APP.w, APP.h, { pen: 'ink', fill: 'paper' });
    d.rect(APP.x, APP.y, APP.w, APP.h, {
      pen: 'ink',
      fill: 'paper',
      label: 'app\nservers',
      size: 16,
      bold: true,
    });
  });
  cyl(DBX[0], DBY, 'DB', 'ink', 'muted');
  d.group(() => {
    d.arrow(74, CL.cy - 10, LB.x - 4, CL.cy - 10, { pen: 'blue', thick: true });
    d.arrow(LB.x + LB.w + 4, CL.cy - 4, APP.x - 4, CL.cy - 4, { pen: 'blue', thick: true });
    d.text(CL.x, 110, 'POST /urls', { pen: 'blue', size: 14, mono: true, anchor: 'start' });
  });
  d.arrow(APP.x + APP.w + 4, APP.y + 44, DBX[0] - CW / 2 - 4, DBY + 26, {
    pen: 'blue',
    label: 'INSERT',
    labelDx: -16,
    labelDy: 22,
    size: 14,
  });

  d.step('A key service hands out unique keys');
  d.rect(KGS.x, KGS.y, KGS.w, KGS.h, {
    pen: 'orange',
    fill: 'orange',
    label: 'key\nservice',
    size: 15,
    bold: true,
  });
  d.arrow(APP.x + APP.w / 2, KGS.y + KGS.h + 4, APP.x + APP.w / 2, APP.y - 10, {
    pen: 'orange',
    thick: true,
  });
  d.text(APP.x - 10, 82, 'batch of\n1,000 keys', { pen: 'orange', size: 14, anchor: 'end' });
  d.text(300, 64, '7 base62 chars:\n62^7 ≈ 3.5 trillion', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('Read path: a 302 redirect');
  d.group(() => {
    d.arrow(74, CL.cy + 6, LB.x - 4, CL.cy + 6, { pen: 'blue' });
    d.text(CL.x, 232, 'GET /aZ3kQ9x', { pen: 'blue', size: 14, mono: true, anchor: 'start' });
  });
  d.arrow(APP.x + 10, APP.y + APP.h + 6, CL.x + 30, 262, { pen: 'green', thick: true, bend: -26 });
  d.text(CL.x, 296, '302 Found\nLocation: long URL', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Cache the hot links');
  d.rect(CACHE.x, CACHE.y, CACHE.w, CACHE.h, {
    pen: 'green',
    fill: 'green',
    label: 'cache',
    size: 17,
    bold: true,
  });
  d.arrow(APP.x + APP.w + 4, APP.y + 10, CACHE.x - 4, CACHE.y + CACHE.h / 2 + 6, {
    pen: 'green',
    both: true,
  });
  d.text(CACHE.x + CACHE.w + 8, CACHE.y + CACHE.h / 2, 'hit\n~1 ms', {
    pen: 'green',
    size: 15,
    anchor: 'start',
  });

  d.step('Clicks go to a queue, not the DB');
  d.group(() => {
    const qx = 196;
    const qy = 346;
    d.rect(qx, qy, 120, 34, { pen: 'violet', thick: true });
    for (let i = 1; i < 4; i++)
      d.line(qx + 30 * i, qy + 4, qx + 30 * i, qy + 30, { pen: 'violet', thin: true, single: true });
    d.text(qx + 60, qy - 14, 'click events', { pen: 'violet', size: 14 });
  });
  d.arrow(APP.x + 46, APP.y + APP.h + 6, 252, 316, { pen: 'violet' });
  d.arrow(322, 363, 380, 363, { pen: 'violet' });
  d.rect(384, 340, 116, 46, { pen: 'violet', fill: 'violet', label: 'analytics', size: 16, bold: true });

  d.step('Shard the DB by key');
  cyl(DBX[1], DBY, '2', 'orange');
  cyl(DBX[2], DBY, '3', 'orange');
  d.text(DBX[1], DBY + 82, 'shard by hash(key)', { pen: 'orange', size: 15 });
};
