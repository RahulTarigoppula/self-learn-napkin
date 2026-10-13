export const meta = {
  title: 'A load balancer spreading requests over three app servers',
  width: 520,
  height: 390,
};

const CLIENT_Y = [92, 177, 262];
const LB = { x: 180, y: 148, w: 84, h: 56 };
const SRV = [
  { id: 'A', y: 48 },
  { id: 'B', y: 140 },
  { id: 'C', y: 232 },
];
const SX = 334;
const SW = 70;
const SH = 54;

export default (d) => {
  // a little monitor: screen, neck, foot
  const client = (cy) =>
    d.group(() => {
      d.rect(30, cy - 20, 52, 34, { pen: 'ink', fill: 'muted' });
      d.line(56, cy + 14, 56, cy + 22, { pen: 'ink' });
      d.line(44, cy + 23, 68, cy + 23, { pen: 'ink' });
    });

  // a server box: name on the left, vent lines on the right
  const server = (s, pen = 'ink', fill = 'paper') =>
    d.group(() => {
      d.rect(SX, s.y, SW, SH, { pen, fill });
      d.text(SX + 20, s.y + SH / 2, s.id, { pen, size: 20, bold: true });
      for (const k of [15, 27, 39]) d.line(SX + 38, s.y + k, SX + 60, s.y + k, { pen, thin: true });
    });

  const lbRight = LB.x + LB.w;
  const lbMid = LB.y + LB.h / 2;

  d.step('Many clients, one address');
  d.text(56, 44, 'clients', { pen: 'muted', size: 16 });
  for (const cy of CLIENT_Y) client(cy);
  d.group(() => {
    d.rect(LB.x, LB.y, LB.w, LB.h, { pen: 'violet', fill: 'violet', label: 'LB', size: 20, bold: true });
    d.text(LB.x + LB.w / 2, LB.y - 30, 'shop.com\none public IP', { pen: 'violet', size: 15 });
  });
  for (const cy of CLIENT_Y) d.arrow(88, cy - 3, LB.x - 4, lbMid + (cy - 177) / 6, { pen: 'blue' });

  d.step('Spread requests over app servers');
  for (const s of SRV) server(s);
  for (const s of SRV) d.arrow(lbRight + 4, lbMid + (s.y - 140) / 6, SX - 6, s.y + SH / 2, { pen: 'blue' });
  d.text(420, 312, 'round robin:\nA → B → C → A …', { pen: 'blue', size: 15 });

  d.step('Health checks catch a dead server');
  d.text(414, 75, '✓ 200', { pen: 'green', size: 16, anchor: 'start' });
  d.group(() => {
    d.rect(SX, SRV[1].y, SW, SH, { pen: 'red', fill: 'red', fillStyle: 'hachure' });
    d.text(414, 158, '✗ timeout', { pen: 'red', size: 16, anchor: 'start' });
    d.text(414, 180, '3 in a row', { pen: 'red', size: 14, anchor: 'start' });
  });
  d.text(414, 259, '✓ 200', { pen: 'green', size: 16, anchor: 'start' });

  d.step('Traffic reroutes to the healthy two');
  d.group(() => {
    const mx = (lbRight + SX) / 2;
    d.line(mx - 9, 167 - 9, mx + 9, 167 + 9, { pen: 'red', thick: true });
    d.line(mx - 9, 167 + 9, mx + 9, 167 - 9, { pen: 'red', thick: true });
  });
  d.arrow(lbRight + 4, lbMid - 4, SX - 6, 96, { pen: 'green', thick: true, bend: 14 });
  d.arrow(lbRight + 4, lbMid + 18, SX - 6, 240, { pen: 'green', thick: true, bend: -14 });
  d.text(420, 362, 'B skipped until healthy', { pen: 'green', size: 15 });

  d.step('The balancer needs a partner');
  d.group(() => {
    d.rect(LB.x, 288, LB.w, 48, {
      pen: 'orange',
      fill: 'orange',
      dashed: true,
      label: 'LB 2',
      size: 17,
      bold: true,
    });
    d.text(LB.x + LB.w / 2, 350, 'standby', { pen: 'orange', size: 15 });
  });
  d.group(() => {
    d.line(LB.x + LB.w / 2, LB.y + LB.h + 4, LB.x + LB.w / 2, 284, { pen: 'orange', dashed: true });
    d.text(LB.x + LB.w / 2 + 8, 246, 'heartbeat', { pen: 'orange', size: 14, anchor: 'start' });
  });
  d.text(150, 322, 'takes the IP\nif LB dies', { pen: 'orange', size: 15, anchor: 'end' });
};
