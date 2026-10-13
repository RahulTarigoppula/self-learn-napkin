export const meta = {
  title:
    'Scaling up to one bigger machine versus scaling out to many stateless machines that share a session store',
  width: 520,
  height: 420,
};

const BOX_Y = 140;
const BOX_W = 52;
const BOX_H = 64;
const XS = [236, 302, 368, 434]; // app boxes A, B, C and the auto-scaled D
const LB = { x: 326, y: 50, w: 80, h: 34 };
const DB = { cx: 330, top: 300, w: 128, h: 58 }; // session store cylinder

export default (d) => {
  const app = (i, id, pen, extra = {}) =>
    d.group(() => {
      d.rect(XS[i], BOX_Y, BOX_W, BOX_H, { pen, fill: 'paper', ...extra });
      d.text(XS[i] + BOX_W / 2, BOX_Y + 16, id, { pen, size: 17, bold: true });
    });
  const lbTo = (i, o) => d.arrow(LB.x + 16 + i * 16, LB.y + LB.h + 4, XS[i] + BOX_W / 2, BOX_Y - 4, o);

  d.step('One server, and it is full');
  d.text(112, 30, 'scale up', { pen: 'muted', size: 16 });
  d.text(366, 30, 'scale out', { pen: 'muted', size: 16 });
  d.line(214, 20, 214, 404, { pen: 'muted', thin: true, dashed: true });
  d.rect(26, 318, 68, 60, { pen: 'ink', fill: 'paper', label: '4 CPU\n16 GB', size: 15 });
  d.text(60, 298, 'CPU 95 %', { pen: 'red', size: 15 });

  d.step('Scale up: buy a bigger box');
  d.rect(110, 150, 92, 228, { pen: 'blue', fill: 'blue', label: '64 CPU\n1 TB', size: 16, bold: true });
  d.arrow(64, 286, 104, 222, { pen: 'blue', bend: 12 });
  d.group(() => {
    d.line(20, 124, 206, 124, { pen: 'red', dashed: true });
    d.text(112, 98, 'biggest box\nyou can buy', { pen: 'red', size: 15 });
  });
  d.text(156, 346, 'still one\nbox to fail', { pen: 'red', size: 15 });

  d.step('Scale out: many boxes, one balancer');
  d.rect(LB.x, LB.y, LB.w, LB.h, { pen: 'violet', fill: 'violet', label: 'LB', size: 17, bold: true });
  ['A', 'B', 'C'].forEach((id, i) => app(i, id, 'ink'));
  for (const i of [0, 1, 2]) lbTo(i, { pen: 'blue' });

  d.step('State on a box gets in the way');
  d.rect(XS[0] + 6, BOX_Y + 34, BOX_W - 12, 22, { pen: 'orange', fill: 'orange', label: 'cart', size: 14 });
  d.text(416, 64, 'next request\nhits B: "who\nare you?"', { pen: 'red', size: 14, anchor: 'start' });

  d.step('Move state out: stateless app tier');
  d.line(XS[0] + 4, BOX_Y + 60, XS[0] + BOX_W - 4, BOX_Y + 30, { pen: 'green', thick: true });
  d.group(() => {
    const { cx, top, w, h } = DB;
    d.ellipse(cx, top, w, 20, { pen: 'green', fill: 'green' });
    d.line(cx - w / 2, top, cx - w / 2, top + h, { pen: 'green' });
    d.line(cx + w / 2, top, cx + w / 2, top + h, { pen: 'green' });
    d.arc(cx, top + h, w, 20, 90, 270, { pen: 'green' });
    d.text(cx, top + 34, 'session store', { pen: 'green', size: 15 });
    d.text(cx, top + 78, 'cart:42 lives here', { pen: 'green', size: 14 });
  });
  for (const i of [0, 1, 2])
    d.arrow(XS[i] + BOX_W / 2, BOX_Y + BOX_H + 4, DB.cx - 30 + i * 30, DB.top - 14, {
      pen: 'green',
      both: true,
    });

  d.step('Auto-scaling adds boxes under load');
  app(3, 'D', 'orange', { dashed: true });
  lbTo(3, { pen: 'orange', dashed: true });
  d.text(462, 234, '+1 box when\nCPU > 70 %', { pen: 'orange', size: 15 });
};
