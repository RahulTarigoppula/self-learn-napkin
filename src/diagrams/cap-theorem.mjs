export const meta = {
  title: 'A network partition forces a choice between consistency and availability',
  width: 520,
  height: 392,
};

const AX = 100;
const BX = 420;
const TOPY = 134;
const H = 48;

export default (d) => {
  const cyl = (cx, label) =>
    d.group(() => {
      d.line(cx - 40, TOPY, cx - 40, TOPY + H, { pen: 'violet' });
      d.line(cx + 40, TOPY, cx + 40, TOPY + H, { pen: 'violet' });
      d.arc(cx, TOPY + H, 80, 16, 90, 270, { pen: 'violet' });
      d.ellipse(cx, TOPY, 80, 16, { pen: 'violet', fill: 'violet' });
      d.text(cx, TOPY + 28, label, { pen: 'violet', size: 18, bold: true });
    });
  const monitor = (cx, cy, label) =>
    d.group(() => {
      d.rect(cx - 22, cy - 16, 44, 28, { fill: 'muted' });
      d.line(cx, cy + 12, cx, cy + 18, {});
      d.line(cx - 10, cy + 19, cx + 10, cy + 19, {});
      d.text(cx + 34, cy, label, { pen: 'muted', size: 15, anchor: 'start' });
    });

  d.step('Two replicas, one value');
  cyl(AX, 'A');
  cyl(BX, 'B');
  d.text(AX, 210, 'x = 1', { size: 18 });
  d.text(BX, 210, 'x = 1', { size: 18 });
  d.arrow(AX + 48, 158, BX - 48, 158, {
    pen: 'green',
    both: true,
    label: 'replicate',
    size: 15,
    labelDx: -66,
  });

  d.step('A write, then the network splits');
  monitor(AX, 50, 'writer');
  d.arrow(AX, 76, AX, TOPY - 14, { pen: 'blue', thick: true, label: 'x = 2', labelDx: -34, labelDy: 0 });
  d.rect(AX - 36, 197, 72, 26, { pen: 'orange', fill: 'orange', label: 'x = 2', size: 18, rough: 0.6 });
  d.group(() => {
    d.poly(
      [
        [262, 118],
        [252, 136],
        [270, 150],
        [252, 166],
        [270, 180],
        [258, 198],
      ],
      { pen: 'red', thick: true },
    );
    d.text(262, 222, 'partition', { pen: 'red', size: 16, bold: true });
  });

  d.step('A reader asks B');
  monitor(BX, 50, 'reader');
  d.arrow(BX, 76, BX, TOPY - 14, { pen: 'blue', thick: true, label: 'x?', labelDx: -22, labelDy: 0 });

  d.step('Choose consistency: refuse');
  d.arrow(BX - 46, 222, 238, 284, { pen: 'blue', bend: -18 });
  d.rect(36, 268, 196, 62, {
    pen: 'blue',
    fill: 'blue',
    label: 'CP: error, retry later\n(no stale answer)',
    size: 16,
  });

  d.step('Choose availability: answer stale');
  d.arrow(BX, 226, BX, 262, { pen: 'orange' });
  d.rect(312, 268, 180, 62, {
    pen: 'orange',
    fill: 'orange',
    label: 'AP: "x = 1"\n(stale, fix later)',
    size: 16,
  });

  d.step('PACELC: no partition, still a trade');
  d.text(260, 362, 'no partition? latency vs consistency', { pen: 'violet', size: 17, bold: true });
};
