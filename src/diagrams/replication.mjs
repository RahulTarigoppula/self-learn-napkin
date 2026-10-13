export const meta = {
  title: 'Leader-follower replication: sync, async, lag, failover and split brain',
  width: 520,
  height: 420,
};

const CW = 80; // cylinder width
const CH = 44; // cylinder body height
const L = { cx: 236, top: 172 }; // leader
const F1 = { cx: 432, top: 44 };
const F2 = { cx: 432, top: 290 };

export default (d) => {
  // call inside a d.group (groups do not nest)
  const cylinder = (n, pen, label) => {
    d.line(n.cx - CW / 2, n.top, n.cx - CW / 2, n.top + CH, { pen });
    d.line(n.cx + CW / 2, n.top, n.cx + CW / 2, n.top + CH, { pen });
    d.arc(n.cx, n.top + CH, CW, 14, 90, 270, { pen });
    d.ellipse(n.cx, n.top, CW, 14, { pen, fill: pen });
    d.text(n.cx, n.top + CH / 2 + 5, label, { pen, size: 17, bold: true });
  };
  const tag = (n, v, pen, fill = pen) =>
    d.rect(n.cx - 30, n.top + CH + 14, 60, 24, { pen, fill, label: v, size: 15, bold: true, rough: 0.6 });

  d.step('One leader, two followers');
  d.group(() => {
    d.rect(46, 172, 48, 30, { pen: 'ink', fill: 'muted' });
    d.line(70, 202, 70, 208, {});
    d.line(59, 209, 81, 209, {});
    d.text(70, 228, 'client', { pen: 'ink', size: 16, bold: true });
  });
  for (const [n, pen, label] of [
    [L, 'blue', 'leader'],
    [F1, 'violet', 'F1'],
    [F2, 'violet', 'F2'],
  ]) {
    d.group(() => {
      cylinder(n, pen, label);
      tag(n, 'x = 5', 'muted', 'paper');
    });
  }

  d.step('Writes go to the leader');
  d.arrow(98, 186, L.cx - CW / 2 - 6, 186, {
    pen: 'orange',
    thick: true,
    label: 'write x = 7',
    size: 15,
    labelDy: -14,
  });
  tag(L, 'x = 7', 'orange');

  d.step('Sync follower acks; async one lags');
  d.group(() => {
    d.arrow(L.cx + 30, L.top - 8, F1.cx - CW / 2 - 6, F1.top + 26, { pen: 'green', thick: true });
    d.text(320, 104, 'sync:\nwait for ack', { pen: 'green', size: 15, anchor: 'end' });
    tag(F1, 'x = 7', 'green');
  });
  d.group(() => {
    d.arrow(L.cx + CW / 2 + 4, L.top + 40, F2.cx - CW / 2 - 6, F2.top + 20, { pen: 'orange', dashed: true });
    d.text(F2.cx, 258, 'async:\nlags behind', { pen: 'orange', size: 15 });
  });

  d.step('Reading from a lagging follower');
  d.arrow(84, 246, F2.cx - CW / 2 - 8, F2.top + 30, { pen: 'blue', thick: true, bend: 30 });
  d.text(236, 342, 'read x → 5', { pen: 'blue', size: 16, bold: true });
  d.text(14, 384, 'wrote 7, read 5:\nread-your-writes broken', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Failover: promote a follower');
  d.group(() => {
    d.line(L.cx - 44, L.top - 14, L.cx + 44, L.top + 62, { pen: 'red', thick: true });
    d.line(L.cx + 44, L.top - 14, L.cx - 44, L.top + 62, { pen: 'red', thick: true });
  });
  d.text(F1.cx, 148, 'now the leader', { pen: 'green', size: 16, bold: true });

  d.step('Split brain: the old leader comes back');
  d.text(14, 40, 'old leader returns and\nstill accepts writes:\ntwo leaders = split brain', {
    pen: 'red',
    size: 15,
    anchor: 'start',
  });
  d.group(() => {
    d.text(L.cx, 272, 'epoch 1', { pen: 'red', size: 15, bold: true });
    d.text(F1.cx - CW / 2 - 16, 40, 'epoch 2', { pen: 'green', size: 15, bold: true, anchor: 'end' });
  });
  d.text(14, 112, 'fix: fencing epochs,\nepoch 2 beats epoch 1', {
    pen: 'green',
    size: 15,
    anchor: 'start',
    bold: true,
  });
};
