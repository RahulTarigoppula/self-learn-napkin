export const meta = { title: 'Quorum reads and writes over three replicas', width: 520, height: 410 };

const RX = 260;
const RYS = [36, 146, 256];
const CW = 76;
const CH = 40;

export default (d) => {
  const mid = (i) => RYS[i] + CH / 2;
  const tag = (i, v, pen) =>
    d.rect(RX - 24, RYS[i] + CH + 12, 48, 24, {
      pen,
      fill: pen === 'muted' ? 'paper' : pen,
      label: v,
      size: 16,
      bold: true,
      rough: 0.6,
    });
  const monitor = (cx, cy, label) =>
    d.group(() => {
      d.rect(cx - 24, cy - 17, 48, 30, { fill: 'muted' });
      d.line(cx, cy + 13, cx, cy + 19, {});
      d.line(cx - 11, cy + 20, cx + 11, cy + 20, {});
      d.text(cx, cy + 40, label, { pen: 'muted', size: 15 });
    });

  d.step('N = 3 replicas of one key');
  RYS.forEach((y, i) =>
    d.group(() => {
      d.line(RX - CW / 2, y, RX - CW / 2, y + CH, { pen: 'violet' });
      d.line(RX + CW / 2, y, RX + CW / 2, y + CH, { pen: 'violet' });
      d.arc(RX, y + CH, CW, 14, 90, 270, { pen: 'violet' });
      d.ellipse(RX, y, CW, 14, { pen: 'violet', fill: 'violet' });
      d.text(RX, y + 24, `R${i + 1}`, { pen: 'violet', size: 17, bold: true });
    }),
  );
  d.group(() => [0, 1, 2].forEach((i) => tag(i, 'v1', 'muted')));
  d.text(RX, 384, 'one key, N = 3 replicas', { pen: 'muted', size: 15 });

  d.step('Write with W = 2');
  monitor(62, 150, 'writer');
  d.arrow(92, 146, RX - CW / 2 - 6, mid(0), { pen: 'orange', thick: true });
  d.arrow(92, 152, RX - CW / 2 - 6, mid(1), { pen: 'orange', thick: true });
  d.arrow(92, 158, RX - CW / 2 - 6, mid(2), {
    pen: 'orange',
    dashed: true,
    label: 'slow',
    labelDx: -2,
    labelDy: 18,
  });
  d.group(() => {
    tag(0, 'v2', 'orange');
    tag(1, 'v2', 'orange');
  });
  d.text(62, 240, '2 acks = OK\n(W = 2)', { pen: 'orange', size: 16 });

  d.step('Read with R = 2');
  monitor(458, 150, 'reader');
  d.arrow(428, 152, RX + CW / 2 + 6, mid(1), { pen: 'blue', thick: true });
  d.arrow(428, 158, RX + CW / 2 + 6, mid(2), { pen: 'blue', thick: true });
  d.text(458, 240, 'gets v2, v1\n(R = 2)', { pen: 'blue', size: 16 });

  d.step('R + W > N: the sets must overlap');
  d.ellipse(RX, RYS[1] + 38, 136, 100, { pen: 'red', thick: true });
  d.text(458, 296, 'newest wins:\nv2', { pen: 'green', size: 17, bold: true });
  d.text(62, 314, 'R + W = 4 > 3', { pen: 'red', size: 17, bold: true });

  d.step('R + W ≤ N: a stale read is possible');
  d.text(62, 362, 'R = W = 1:\n1 + 1 ≤ 3', { pen: 'red', size: 16 });
  d.text(458, 362, 'may read only\nR3 → v1', { pen: 'red', size: 16 });
};
