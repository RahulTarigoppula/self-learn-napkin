export const meta = {
  title: 'Cache invalidation: the delete race, TTL and a stampede',
  width: 520,
  height: 420,
};

const R = 52; // reader lane
const C = 200; // cache lane
const DB = 340; // database lane
const W = 466; // writer lane
const TOP = 106;
const BOTTOM = 240;

export default (d) => {
  const monitor = (cx, cy, label, pen) =>
    d.group(() => {
      d.rect(cx - 24, cy - 17, 48, 30, { pen, fill: pen });
      d.line(cx, cy + 13, cx, cy + 19, { pen });
      d.line(cx - 11, cy + 20, cx + 11, cy + 20, { pen });
      d.text(cx, cy + 38, label, { pen, size: 16, bold: true });
    });
  // call inside a d.group (groups do not nest)
  const cylinder = (cx, top, w, h, pen, label, size = 17) => {
    d.line(cx - w / 2, top, cx - w / 2, top + h, { pen });
    d.line(cx + w / 2, top, cx + w / 2, top + h, { pen });
    d.arc(cx, top + h, w, 14, 90, 270, { pen });
    d.ellipse(cx, top, w, 14, { pen, fill: pen });
    d.text(cx, top + h / 2 + 5, label, { pen, size, bold: true });
  };

  d.step('A cache in front of the database');
  monitor(R, 40, 'reader', 'blue');
  monitor(W, 40, 'writer', 'orange');
  d.group(() => {
    d.rect(C - 44, 22, 88, 40, { pen: 'orange', fill: 'orange', label: 'cache', size: 17, bold: true });
    d.text(C, 84, 'x: not cached', { pen: 'muted', size: 16 });
  });
  d.group(() => {
    cylinder(DB, 26, 72, 36, 'violet', 'DB');
    d.text(DB, 84, 'x = v1', { pen: 'violet', size: 16 });
  });
  d.group(() => {
    for (const x of [R, C, DB, W]) d.line(x, TOP - 6, x, BOTTOM, { pen: 'muted', dashed: true, thin: true });
  });

  d.step('Write: update the DB, then delete the key');
  d.arrow(W - 4, 176, DB + 4, 176, {
    pen: 'orange',
    thick: true,
    label: 'UPDATE v2',
    size: 15,
    labelDy: -11,
  });
  d.arrow(W - 4, 202, C + 4, 202, {
    pen: 'red',
    thick: true,
    label: 'DEL x',
    size: 15,
    labelDx: -70,
    labelDy: -11,
  });

  d.step('The race: a slow reader re-fills old data');
  d.group(() => {
    d.arrow(R + 4, 120, C - 4, 120, { pen: 'blue', label: 'GET x: miss', size: 15, labelDy: -11 });
    d.arrow(R + 4, 148, DB - 4, 148, {
      pen: 'blue',
      label: 'read → v1',
      size: 15,
      labelDx: 70,
      labelDy: -11,
    });
  });
  d.arrow(R + 4, 230, C - 4, 230, { pen: 'red', thick: true, label: 'SET x = v1', size: 15, labelDy: -11 });
  d.group(() => {
    d.rect(C - 52, 252, 104, 28, { pen: 'red', fill: 'red', rough: 0.6, label: 'x = v1 stale', size: 15 });
    d.rect(DB - 44, 252, 88, 28, { pen: 'green', fill: 'green', rough: 0.6, label: 'x = v2', size: 15 });
  });

  d.step('TTL: the stale copy dies on its own');
  d.text(C, 298, 'TTL 60 s → wrong for ≤ 60 s', { pen: 'orange', size: 15, bold: true });

  d.step('Stampede: a hot key expires');
  d.text(14, 326, 'hot key expires', { pen: 'red', size: 15, anchor: 'start' });
  d.group(() => {
    for (const k of [2, 1, 0]) d.rect(20 + k * 8, 342 + k * 8, 48, 30, { pen: 'blue', fill: 'blue' });
    d.text(52, 404, '1,000 readers', { pen: 'blue', size: 15 });
  });
  d.group(() => {
    for (const [y, b] of [
      [348, -14],
      [362, 0],
      [376, 14],
    ])
      d.arrow(92, y, 262, 362, { pen: 'red', bend: b });
    d.text(176, 330, 'all miss', { pen: 'red', size: 15 });
  });
  d.group(() => {
    cylinder(296, 344, 56, 32, 'red', 'DB', 16);
    d.text(296, 404, 'overloaded', { pen: 'red', size: 15 });
  });

  d.step('Fix: one rebuild, the rest wait');
  d.text(346, 364, 'fix: one request\nrebuilds, the rest\nwait; jitter TTLs', {
    pen: 'green',
    size: 15,
    anchor: 'start',
    bold: true,
  });
};
