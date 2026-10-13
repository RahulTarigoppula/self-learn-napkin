export const meta = { title: 'Raft leader election among five servers', width: 520, height: 400 };

const DIA = 58;
const PX = 446; // centre of the notes column

export default (d) => {
  const S1 = [180, 205];
  const S2 = [300, 96];
  const S3 = [300, 314];
  const S4 = [70, 314];
  const S5 = [70, 96];
  const others = [S2, S3, S4, S5];
  // a chord from a to b, trimmed to the circles and shifted sideways by `side`
  const chord = (a, b, side, fn) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    const ux = dx / l;
    const uy = dy / l;
    const nx = -uy * side;
    const ny = ux * side;
    const s = DIA / 2 + 5;
    const e = DIA / 2 + 7;
    fn(a[0] + ux * s + nx, a[1] + uy * s + ny, b[0] - ux * e + nx, b[1] - uy * e + ny);
  };
  const node = (p, name, pen, fill, thick = false) =>
    d.circle(p[0], p[1], DIA, { pen, fill, label: name, size: 18, bold: true, thick });

  d.step('Five followers, each with a timer');
  d.group(() => [S1, S2, S3, S4, S5].forEach((p, i) => node(p, `S${i + 1}`, 'ink', 'paper')));
  d.group(() => {
    const t = { pen: 'muted', size: 15 };
    d.text(S1[0], S1[1] + 58, '162 ms', t);
    d.text(S2[0], S2[1] - 46, '275 ms', t);
    d.text(S3[0], S3[1] + 46, '210 ms', t);
    d.text(S4[0], S4[1] + 46, '298 ms', t);
    d.text(S5[0], S5[1] - 46, '245 ms', t);
  });
  d.text(PX, 36, 'term 0', { pen: 'muted', size: 18, bold: true });

  d.step('A timer fires: S1 becomes a candidate');
  node(S1, 'S1', 'orange', 'orange', true);
  d.group(() => {
    d.text(PX, 72, 'term 1', { pen: 'orange', size: 20, bold: true });
    d.text(PX, 100, 'votes for itself', { pen: 'orange', size: 15 });
  });

  d.step('S1 asks everyone for a vote');
  for (const p of others) chord(S1, p, 7, (x1, y1, x2, y2) => d.arrow(x1, y1, x2, y2, { pen: 'orange' }));
  d.text(PX, 136, 'RequestVote', { pen: 'orange', size: 16 });

  d.step('A majority makes a leader');
  d.group(() => {
    d.text(S2[0] + 4, S2[1] + 50, '✓ yes', { pen: 'green', size: 16, anchor: 'start' });
    d.text(S5[0] - 4, S5[1] + 50, 'yes ✓', { pen: 'green', size: 16, anchor: 'end' });
  });
  node(S1, 'S1', 'green', 'green', true);
  d.text(PX, 182, '3 of 5 votes\n= leader', { pen: 'green', size: 17, bold: true });

  d.step('Heartbeats keep followers quiet');
  for (const p of others)
    chord(S1, p, -7, (x1, y1, x2, y2) => d.arrow(x1, y1, x2, y2, { pen: 'blue', dashed: true }));
  d.text(PX, 232, 'heartbeat\nevery 50 ms', { pen: 'blue', size: 16 });

  d.step('Split vote: nobody wins, retry');
  d.group(() => {
    d.rect(376, 278, 132, 106, { pen: 'red', dashed: true });
    d.circle(406, 310, 40, { pen: 'orange', fill: 'orange', label: 'S2', size: 15, bold: true });
    d.circle(478, 310, 40, { pen: 'orange', fill: 'orange', label: 'S4', size: 15, bold: true });
    d.text(442, 310, '2:2', { pen: 'red', size: 16, bold: true });
    d.text(442, 356, 'new random\ntimeouts', { pen: 'red', size: 15 });
  });
};
