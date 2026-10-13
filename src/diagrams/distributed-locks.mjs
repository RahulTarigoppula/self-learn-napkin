export const meta = {
  title: 'Distributed lock timeline: a lease expires during a GC pause and a fencing token rejects the stale write',
  width: 520,
  height: 420,
};

const X = (t) => 110 + t * 18; // seconds → x
const LOCK = 66;
const C1 = 156;
const C2 = 246;
const ST = 330;

export default (d) => {
  const bar = (t1, t2, y, pen, label) => {
    d.rect(X(t1), y - 12, X(t2) - X(t1), 24, { pen, fill: pen, single: true, rough: 0.6 });
    if (label) d.text(X(t1) + 8, y, label, { size: 14, pen, anchor: 'start', bold: true });
  };

  d.step('Two clients, one lock, one storage');
  d.group(() => {
    for (const [y, name, pen] of [[LOCK, 'lock\nservice', 'violet'], [C1, 'client 1', 'blue'], [C2, 'client 2', 'orange'], [ST, 'storage', 'ink']]) {
      d.line(X(0) - 8, y, X(21) + 6, y, { pen: 'muted', thin: true, dashed: true, single: true });
      d.text(96, y, name, { size: 15, bold: true, pen, anchor: 'end' });
    }
  });
  d.group(() => {
    d.arrow(X(0) - 8, 380, X(21) + 8, 380, { pen: 'muted', thin: true });
    for (const t of [0, 10, 20]) d.text(X(t), 396, `${t} s`, { size: 14, pen: 'muted' });
  });

  d.step('Client 1 gets a 10 s lease, token 33');
  d.arrow(X(0), LOCK + 14, X(0), C1 - 14, { pen: 'blue', thick: true });
  d.text(X(0) + 8, 122, 'token 33', { size: 15, pen: 'blue', anchor: 'start', bold: true });
  d.group(() => bar(0, 10, LOCK, 'blue', 'lease: client 1'));

  d.step('A GC pause outlives the lease');
  d.group(() => bar(1, 16, C1, 'red', 'GC pause, 15 s'));
  d.group(() => {
    d.line(X(10), LOCK - 18, X(10), LOCK + 18, { pen: 'red', thick: true, single: true });
    d.text(X(10) - 6, 94, 'lease expired at 10 s', { size: 14, pen: 'red', anchor: 'end' });
  });

  d.step('Client 2 gets token 34 and writes');
  d.arrow(X(11), LOCK + 14, X(11), C2 - 14, { pen: 'orange', thick: true });
  d.group(() => bar(11, 21, LOCK, 'orange', 'lease: client 2'));
  d.text(X(11) + 8, 208, 'token 34', { size: 15, pen: 'orange', anchor: 'start', bold: true });
  d.arrow(X(12), C2 + 4, X(12), ST - 6, { pen: 'orange', label: 'write #34', labelDx: -40, labelDy: -2 });
  d.text(X(0) - 4, 356, 'accepts 34, remembers max = 34', { size: 14, pen: 'green', anchor: 'start' });

  d.step('Client 1 wakes; its token 33 is rejected');
  d.text(506, 116, 'wakes up, still thinks\nit holds the lock', { size: 14, pen: 'blue', anchor: 'end' });
  d.arrow(X(17), C1 + 14, X(17), ST - 6, { pen: 'red', thick: true });
  d.text(X(17) + 10, 284, 'write #33', { size: 15, pen: 'red', anchor: 'start' });
  d.group(() => {
    d.line(X(17) - 9, ST - 9, X(17) + 9, ST + 9, { pen: 'red', thick: true, single: true });
    d.line(X(17) + 9, ST - 9, X(17) - 9, ST + 9, { pen: 'red', thick: true, single: true });
    d.text(506, 356, '33 < 34: rejected', { size: 15, pen: 'red', anchor: 'end', bold: true });
  });
};
