export const meta = { title: 'Polling, long polling, Server-Sent Events and WebSockets on a timeline, and WebSocket servers joined by a pub/sub backplane', width: 520, height: 420 };

const X0 = 124; // timeline start
const X1 = 400; // timeline end
const ROW = 66;
const Y0 = 16;

export default (d) => {
  const lanes = (k, name) => {
    const yc = Y0 + k * ROW + 10;
    const ys = yc + 36;
    d.group(() => {
      d.text(16, (yc + ys) / 2, name, { pen: 'ink', size: 16, bold: true, anchor: 'start' });
      d.text(X0 - 6, yc, 'C', { pen: 'muted', size: 14, anchor: 'end' });
      d.text(X0 - 6, ys, 'S', { pen: 'muted', size: 14, anchor: 'end' });
      d.line(X0, yc, X1, yc, { pen: 'muted', thin: true, single: true });
      d.line(X0, ys, X1, ys, { pen: 'muted', thin: true, single: true });
    });
    return [yc, ys];
  };
  const down = (x, yc, ys, pen = 'blue') => d.arrow(x, yc + 2, x + 10, ys - 3, { pen, single: true, headSize: 8, rough: 0.5 });
  const up = (x, yc, ys, pen = 'green') => d.arrow(x, ys - 2, x + 10, yc + 3, { pen, single: true, headSize: 8, rough: 0.5 });
  const note = (k, s, pen) => d.text(X1 + 12, Y0 + k * ROW + 28, s, { pen, size: 14, anchor: 'start' });

  d.step('Polling: ask again and again');
  {
    const [yc, ys] = lanes(0, 'polling');
    d.group(() => {
      [134, 188, 242, 296, 350].forEach((x, i) => {
        down(x, yc, ys);
        up(x + 16, yc, ys, i === 3 ? 'green' : 'muted');
      });
    });
    note(0, '5 requests,\n1 with news', 'muted');
  }

  d.step('Long polling: the server holds the request');
  {
    const [yc, ys] = lanes(1, 'long\npolling');
    d.group(() => {
      down(134, yc, ys);
      d.line(146, ys, 236, ys, { pen: 'orange', thick: true, single: true });
      up(238, yc, ys);
      down(258, yc, ys);
      d.line(270, ys, 360, ys, { pen: 'orange', thick: true, single: true });
      up(362, yc, ys);
      down(380, yc, ys);
    });
    note(1, 'held until\nthere is news', 'orange');
  }

  d.step('Server-Sent Events: one open stream');
  {
    const [yc, ys] = lanes(2, 'SSE');
    d.group(() => {
      down(134, yc, ys);
      d.line(146, ys, X1, ys, { pen: 'green', thick: true, single: true });
      for (const x of [190, 250, 310, 370]) up(x, yc, ys);
    });
    note(2, 'server → client\nonly', 'green');
  }

  d.step('WebSocket: upgrade, then both ways');
  {
    const [yc, ys] = lanes(3, 'Web-\nSocket');
    d.group(() => {
      down(134, yc, ys, 'orange');
      up(152, yc, ys, 'orange');
      up(212, yc, ys);
      down(254, yc, ys);
      up(300, yc, ys);
      down(336, yc, ys);
      up(370, yc, ys);
    });
    note(3, '101 upgrade,\nthen full duplex', 'violet');
  }

  d.step('Scale out with a pub/sub backplane');
  d.group(() => {
    d.circle(38, 318, 40, { pen: 'blue', fill: 'blue', label: 'Ann', size: 15, single: true });
    d.rect(84, 298, 112, 40, { pen: 'violet', fill: 'violet', label: 'WS server 1', size: 15, single: true });
    d.rect(324, 298, 112, 40, { pen: 'violet', fill: 'violet', label: 'WS server 2', size: 15, single: true });
    d.circle(482, 318, 40, { pen: 'blue', fill: 'blue', label: 'Bob', size: 15, single: true });
    d.text(260, 318, 'different\nservers', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    d.rect(150, 370, 220, 36, { pen: 'orange', fill: 'orange', label: 'pub/sub: room:42', size: 15, bold: true, single: true });
  });
  d.group(() => {
    d.arrow(60, 318, 80, 318, { pen: 'blue', single: true, headSize: 8 });
    d.arrow(150, 342, 196, 366, { pen: 'orange', single: true });
    d.text(132, 360, 'publish', { pen: 'orange', size: 14, anchor: 'end' });
    d.arrow(324, 366, 370, 342, { pen: 'orange', single: true });
    d.text(388, 360, 'deliver', { pen: 'orange', size: 14, anchor: 'start' });
    d.arrow(440, 318, 460, 318, { pen: 'green', single: true, headSize: 8 });
  });
};
