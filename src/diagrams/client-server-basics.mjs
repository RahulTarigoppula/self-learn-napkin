export const meta = {
  title:
    'The life of an HTTPS request: DNS lookup, TCP handshake, TLS handshake, then the HTTP request and response',
  width: 520,
  height: 420,
};

const BX = 112; // browser lifeline
const DX = 252; // DNS resolver lifeline
const SX = 428; // server lifeline

export default (d) => {
  // a message between two lifelines; left-to-right if from < to
  const msg = (from, to, y, label, pen) =>
    d.arrow(from + (to > from ? 4 : -4), y, to + (to > from ? -4 : 4), y, {
      pen,
      label,
      size: 14,
      labelDy: -10,
    });
  const phase = (y, name, pen) => d.text(14, y, name, { pen, size: 16, bold: true, anchor: 'start' });
  const rtt = (y, text, pen) => d.text(442, y, text, { pen, size: 14, anchor: 'start' });

  d.step('A browser, a DNS resolver, a server');
  d.group(() => {
    // browser window: frame, title bar, three buttons
    d.rect(BX - 40, 26, 80, 54, { pen: 'blue', fill: 'paper' });
    d.line(BX - 40, 40, BX + 40, 40, { pen: 'blue', thin: true });
    for (const k of [0, 1, 2]) d.dot(BX - 32 + k * 8, 33, 4, { pen: 'blue' });
    d.text(BX, 61, 'browser', { pen: 'blue', size: 15 });
  });
  d.group(() => {
    d.rect(DX - 34, 30, 68, 46, { pen: 'violet', fill: 'violet', label: 'DNS', size: 17, bold: true });
    d.text(DX, 90, 'resolver', { pen: 'violet', size: 14 });
  });
  d.group(() => {
    // server: box with vent lines
    d.rect(SX - 34, 24, 68, 58, { pen: 'ink', fill: 'paper' });
    for (const k of [38, 50, 62]) d.line(SX - 22, k, SX + 22, k, { pen: 'ink', thin: true });
    d.text(SX, 94, 'shop.com', { pen: 'ink', size: 14 });
  });
  d.group(() => {
    d.line(BX, 98, BX, 352, { pen: 'muted', thin: true, dashed: true });
    d.line(DX, 104, DX, 156, { pen: 'muted', thin: true, dashed: true });
    d.line(SX, 104, SX, 352, { pen: 'muted', thin: true, dashed: true });
  });

  d.step('DNS: name → IP address');
  phase(130, 'DNS', 'violet');
  msg(BX, DX, 122, 'shop.com?', 'violet');
  msg(DX, BX, 148, '203.0.113.7', 'violet');
  rtt(136, '1 RTT', 'violet');

  d.step('TCP: the three-way handshake');
  phase(200, 'TCP', 'orange');
  msg(BX, SX, 180, 'SYN', 'orange');
  msg(SX, BX, 202, 'SYN-ACK', 'orange');
  msg(BX, SX, 224, 'ACK', 'orange');
  rtt(191, '1 RTT', 'orange');

  d.step('TLS: agree keys, check the certificate');
  phase(266, 'TLS', 'green');
  msg(BX, SX, 256, 'ClientHello + key', 'green');
  msg(SX, BX, 280, 'ServerHello + cert', 'green');
  rtt(268, '1 RTT', 'green');

  d.step('HTTP: request and response');
  phase(328, 'HTTP', 'blue');
  msg(BX, SX, 316, 'GET /cart', 'blue');
  d.rect(SX - 5, 318, 10, 22, { pen: 'blue', fill: 'blue' });
  msg(SX, BX, 342, '200 OK + HTML', 'blue');
  rtt(329, '1 RTT\n+ work', 'blue');

  d.step('Where the time went');
  d.highlight(14, 368, 300, 24);
  d.text(18, 380, '≈ 4 round trips × 50 ms ≈ 200 ms', { pen: 'ink', size: 16, anchor: 'start' });
  d.text(18, 404, 'keep-alive: the next request costs 1 RTT', { pen: 'green', size: 15, anchor: 'start' });
};
