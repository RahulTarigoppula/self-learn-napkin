export const meta = { title: 'Cache-aside read and write, as a sequence diagram', width: 520, height: 410 };

const APP = 74;
const CACHE = 262;
const DB = 438;
const TOP = 104;
const BOTTOM = 396;
const YS = [126, 154, 190, 218, 254, 290, 318, 354, 382];
const ROW = (i) => YS[i];

export default (d) => {
  const msg = (from, to, i, label, pen, o = {}) =>
    d.arrow(from, ROW(i), to, ROW(i), { pen, label, size: 15, ...o });

  d.step('An app, a cache and a database');
  d.group(() => {
    d.rect(APP - 42, 30, 84, 46, { pen: 'ink', fill: 'paper' });
    d.text(APP - 14, 53, 'app', { size: 18, bold: true });
    for (const k of [43, 53, 63]) d.line(APP + 8, k, APP + 30, k, { thin: true });
    d.text(APP, 92, 'your code', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    d.rect(CACHE - 52, 30, 104, 46, { pen: 'orange', fill: 'orange', label: 'cache', size: 18, bold: true });
    d.text(CACHE, 92, 'RAM · ~1 ms', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    d.line(DB - 40, 32, DB - 40, 68, { pen: 'violet' });
    d.line(DB + 40, 32, DB + 40, 68, { pen: 'violet' });
    d.arc(DB, 68, 80, 18, 90, 270, { pen: 'violet' });
    d.ellipse(DB, 32, 80, 18, { pen: 'violet', fill: 'violet' });
    d.text(DB, 54, 'DB', { pen: 'violet', size: 18, bold: true });
    d.text(DB, 92, 'disk · ~10 ms', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    for (const x of [APP, CACHE, DB]) d.line(x, TOP, x, BOTTOM, { pen: 'muted', dashed: true, thin: true });
  });

  d.step('Ask the cache first');
  msg(APP + 4, CACHE - 4, 0, 'GET user:42', 'blue');
  msg(CACHE - 4, APP + 4, 1, 'miss', 'red', { dashed: true });

  d.step('Miss: read the database');
  msg(APP + 4, DB - 4, 2, 'SELECT … id=42', 'blue', { labelDx: 90 });
  msg(DB - 4, APP + 4, 3, 'row: Ada', 'violet', { dashed: true, labelDx: 90 });

  d.step('Copy the answer into the cache');
  msg(APP + 4, CACHE - 4, 4, 'SET user:42 = Ada', 'orange', { thick: true });
  d.rect(CACHE + 14, ROW(4) - 15, 128, 30, { pen: 'orange', fill: 'orange', label: 'TTL 60 s', size: 15 });

  d.step('The next read is a hit');
  msg(APP + 4, CACHE - 4, 5, 'GET user:42', 'blue');
  msg(CACHE - 4, APP + 4, 6, 'hit: Ada', 'green', { thick: true, dashed: true });
  d.text(DB - 10, (ROW(5) + ROW(6)) / 2, 'DB not touched', { pen: 'muted', size: 15, anchor: 'end' });

  d.step('A write invalidates the copy');
  msg(APP + 4, DB - 4, 7, 'UPDATE name', 'blue', { labelDx: 90 });
  msg(APP + 4, CACHE - 4, 8, 'DEL user:42', 'red', { thick: true });
};
