export const meta = {
  title: 'News feed: post service, fan-out queue and workers, per-user feed cache, feed service, celebrity pull and a CDN',
  width: 520,
  height: 420,
};

const AUTHOR = { x: 16, cy: 92 };
const READER = { x: 16, cy: 288 };
const LB = { x: 92, y: 166, w: 48, h: 50 };
const POST = { x: 170, y: 70, w: 88, h: 46 };
const FEED = { x: 170, y: 266, w: 88, h: 46 };
const Q = { x: 296, y: 76, slot: 30 };
const WORK = { x: 398, y: 68, w: 108, h: 48 };
const CACHE = { x: 398, y: 160, w: 108, h: 136 };
const DB = { cx: 340, y: 166, w: 64, h: 46 };

export default (d) => {
  const monitor = (x, cy) =>
    d.group(() => {
      d.rect(x, cy - 18, 50, 32, { pen: 'ink', fill: 'muted' });
      d.line(x + 25, cy + 14, x + 25, cy + 21, { pen: 'ink', single: true });
      d.line(x + 13, cy + 22, x + 37, cy + 22, { pen: 'ink', single: true });
    });

  d.step('Post path: save the post once');
  monitor(AUTHOR.x, AUTHOR.cy);
  d.text(AUTHOR.x + 25, AUTHOR.cy - 36, 'Ana posts', { pen: 'muted', size: 15 });
  d.rect(LB.x, LB.y, LB.w, LB.h, { pen: 'violet', fill: 'violet', label: 'LB', size: 17, bold: true });
  d.rect(POST.x, POST.y, POST.w, POST.h, { pen: 'ink', fill: 'paper', label: 'post\nservice', size: 15, bold: true });
  d.group(() => {
    const ln = { pen: 'ink', single: true };
    d.line(DB.cx - DB.w / 2, DB.y, DB.cx - DB.w / 2, DB.y + DB.h, ln);
    d.line(DB.cx + DB.w / 2, DB.y, DB.cx + DB.w / 2, DB.y + DB.h, ln);
    d.arc(DB.cx, DB.y + DB.h, DB.w, 14, 90, 270, ln);
    d.ellipse(DB.cx, DB.y, DB.w, 14, { pen: 'ink', fill: 'muted' });
    d.text(DB.cx, DB.y + DB.h / 2 + 4, 'posts', { size: 16, bold: true });
  });
  d.group(() => {
    d.arrow(AUTHOR.x + 54, AUTHOR.cy + 8, LB.x + 10, LB.y - 4, { pen: 'blue', thick: true });
    d.arrow(LB.x + LB.w - 6, LB.y - 4, POST.x - 4, POST.y + POST.h - 8, { pen: 'blue', thick: true });
  });
  d.arrow(POST.x + POST.w + 2, POST.y + POST.h + 2, DB.cx - 22, DB.y - 10, { pen: 'blue', label: 'post 91', labelDx: -46, labelDy: 10, size: 14 });

  d.step('Fan-out on write: push to followers');
  d.group(() => {
    d.rect(Q.x, Q.y, Q.slot * 3, 32, { pen: 'violet', thick: true });
    for (let i = 1; i < 3; i++) d.line(Q.x + Q.slot * i, Q.y + 4, Q.x + Q.slot * i, Q.y + 28, { pen: 'violet', thin: true, single: true });
    d.text(Q.x + 45, Q.y - 16, 'queue', { pen: 'violet', size: 14 });
  });
  d.arrow(POST.x + POST.w + 4, POST.y + 20, Q.x - 4, Q.y + 16, { pen: 'violet' });
  d.arrow(Q.x + Q.slot * 3 + 4, Q.y + 16, WORK.x - 4, Q.y + 16, { pen: 'violet' });
  d.rect(WORK.x, WORK.y, WORK.w, WORK.h, { pen: 'orange', fill: 'orange', label: 'fan-out\nworkers', size: 15, bold: true });
  d.group(() => {
    d.rect(CACHE.x, CACHE.y, CACHE.w, CACHE.h, { pen: 'green', fill: 'green' });
    d.text(CACHE.x + CACHE.w / 2, CACHE.y + 18, 'feed cache', { pen: 'green', size: 15, bold: true });
    ['Ben: 91 77 52', 'Cy:  91 40 38', 'Di:  91 63 12'].forEach((t, i) =>
      d.text(CACHE.x + 8, CACHE.y + 48 + i * 26, t, { size: 13, mono: true, anchor: 'start' }),
    );
    d.text(CACHE.x + CACHE.w / 2, CACHE.y + 122, 'newest ids', { pen: 'muted', size: 13 });
  });
  d.arrow(WORK.x + WORK.w / 2, WORK.y + WORK.h + 4, WORK.x + WORK.w / 2, CACHE.y - 4, { pen: 'orange', thick: true });
  d.text(436, 134, '1 write per\nfollower', { pen: 'orange', size: 14, anchor: 'end' });

  d.step('Read path: fetch the ready-made list');
  monitor(READER.x, READER.cy);
  d.text(READER.x + 25, READER.cy - 36, 'Ben reads', { pen: 'muted', size: 15 });
  d.group(() => {
    d.arrow(READER.x + 54, READER.cy - 8, LB.x + 10, LB.y + LB.h + 4, { pen: 'blue', thick: true });
    d.arrow(LB.x + LB.w - 6, LB.y + LB.h + 4, FEED.x - 4, FEED.y + 10, { pen: 'blue', thick: true });
  });
  d.rect(FEED.x, FEED.y, FEED.w, FEED.h, { pen: 'ink', fill: 'paper', label: 'feed\nservice', size: 15, bold: true });
  d.arrow(FEED.x + FEED.w + 4, FEED.y + 30, CACHE.x - 4, CACHE.y + 112, { pen: 'green', thick: true, label: 'GET feed:Ben', labelDx: 4, labelDy: 18, size: 14 });

  d.step('Celebrities: pull at read time');
  d.text(510, 26, 'a star with 50 M followers: no fan-out', { pen: 'red', size: 14, anchor: 'end' });
  d.arrow(FEED.x + FEED.w - 20, FEED.y - 4, DB.cx - 18, DB.y + DB.h + 12, { pen: 'red', dashed: true, thick: true });
  d.text(244, 196, 'merge stars’\nposts on read', { pen: 'red', size: 14 });

  d.step('Rank, then page with a cursor');
  d.group(() => {
    d.rect(170, 340, 150, 64, { pen: 'blue', fill: 'blue', rough: 0.8 });
    d.text(180, 356, '1. post 91', { size: 14, mono: true, anchor: 'start' });
    d.text(180, 376, '2. post 77', { size: 14, mono: true, anchor: 'start' });
    d.text(180, 394, '… 20 per page', { pen: 'muted', size: 13, anchor: 'start' });
  });
  d.arrow(FEED.x + 40, FEED.y + FEED.h + 4, FEED.x + 40, 336, { pen: 'blue' });
  d.text(332, 362, 'next page:\n?cursor=52', { pen: 'blue', size: 14, mono: true, anchor: 'start' });

  d.step('Photos come from a CDN');
  d.rect(16, 360, 76, 40, { pen: 'violet', fill: 'violet', label: 'CDN', size: 17, bold: true });
  d.arrow(54, 356, 54, 318, { pen: 'violet', thick: true });
  d.text(100, 380, 'media', { pen: 'violet', size: 14, anchor: 'start' });
};
