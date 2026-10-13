export const meta = { title: 'Gradient descent: a ball rolling down a loss bowl', width: 520, height: 420 };

// Main bowl: L(w) = w², w in [-3, 3].
const MX = 270;
const MS = 70; // px per unit of w
const MY = 228; // y of L = 0
const ML = 22; // px per unit of L
const mx = (w) => MX + MS * w;
const my = (w) => MY - ML * w * w;
const bowl = (cx, sx, by, sl) =>
  Array.from({ length: 13 }, (_, i) => {
    const w = -3 + (6 * i) / 12;
    return [cx + sx * w, by - sl * w * w];
  });

// Mini bowls along the bottom.
const BY = 366;
const BS = 20; // px per unit of w
const BL = 8; // px per unit of L
const bx = (cx, w) => cx + BS * w;
const by = (w) => BY - BL * w * w;

const descend = (w0, eta, n) => {
  const ws = [w0];
  for (let i = 0; i < n; i++) ws.push(ws[ws.length - 1] - eta * 2 * ws[ws.length - 1]);
  return ws;
};

export default (d) => {
  d.step('The loss bowl');
  d.group(() => {
    d.line(50, 238, 496, 238, { pen: 'muted', single: true });
    d.line(50, 238, 50, 28, { pen: 'muted', single: true });
    d.text(50, 18, 'loss L(w)', { pen: 'muted', size: 15, anchor: 'start' });
    d.text(496, 254, 'weight w', { pen: 'muted', size: 15, anchor: 'end' });
  });
  d.curve(bowl(MX, MS, MY, ML), { pen: 'ink', thick: true });
  d.group(() => {
    d.dot(mx(0), my(0), 10, { pen: 'green' });
    d.text(mx(0), 254, 'minimum', { pen: 'green', size: 15 });
  });

  d.step('The slope says which way is downhill');
  d.circle(mx(2) - 8, my(2) - 6, 20, { pen: 'ink', fill: 'orange' });
  d.line(mx(2) - 46, my(2) + 58, mx(2) + 40, my(2) - 50, { pen: 'red', dashed: true });
  d.text(506, 176, 'slope = +4\nso step left', { pen: 'red', size: 16, anchor: 'end' });

  d.step('Step: w ← w − η · slope');
  d.text(250, 50, 'w ← w − η · dL/dw', { pen: 'ink', size: 18, bold: true });
  d.text(250, 80, 'η = 0.3:  2 → 0.8 → 0.32 → 0.13', { pen: 'green', size: 16 });
  const good = descend(2, 0.3, 3);
  for (let i = 0; i < 2; i++) {
    d.arrow(mx(good[i]) - 4, my(good[i]) - 10, mx(good[i + 1]) + 2, my(good[i + 1]) - 8, {
      pen: 'green',
      bend: i === 0 ? 30 : 16,
      thick: i === 0,
    });
  }
  d.group(() => {
    for (const w of good.slice(1)) d.dot(mx(w), my(w), 9, { pen: 'green', single: true });
  });

  d.step('η too small: it crawls');
  d.group(() => {
    d.text(95, 280, 'η too small', { pen: 'orange', size: 16, bold: true });
    d.curve(bowl(95, BS, BY, BL), { pen: 'muted', single: true });
    for (const w of descend(2, 0.02, 5)) d.dot(bx(95, w), by(w), 7, { pen: 'orange', single: true });
    d.text(95, 392, 'η = 0.02:\n~130 steps', { pen: 'orange', size: 15 });
  });

  d.step('η too big: it overshoots');
  const big = descend(2, 1.05, 3);
  d.group(() => {
    d.text(260, 280, 'η too big', { pen: 'red', size: 16, bold: true });
    d.curve(bowl(260, BS, BY, BL), { pen: 'muted', single: true });
    d.dot(bx(260, big[0]), by(big[0]), 7, { pen: 'red' });
  });
  d.group(() => {
    for (let i = 0; i < 3; i++)
      d.arrow(bx(260, big[i]), by(big[i]), bx(260, big[i + 1]), by(big[i + 1]), { pen: 'red', headSize: 8 });
    d.text(260, 392, 'η = 1.05:\ndiverges', { pen: 'red', size: 15 });
  });

  d.step('Mini-batches: noisy but cheap');
  d.group(() => {
    d.text(425, 280, 'mini-batch SGD', { pen: 'violet', size: 16, bold: true });
    d.ellipse(425, 330, 150, 64, { pen: 'muted', single: true });
    d.ellipse(425, 330, 96, 40, { pen: 'muted', single: true });
    d.ellipse(425, 330, 40, 18, { pen: 'muted', single: true });
  });
  d.curve(
    [
      [362, 312],
      [385, 316],
      [405, 323],
      [425, 330],
    ],
    { pen: 'blue', thick: true },
  );
  d.poly(
    [
      [366, 342],
      [378, 330],
      [384, 347],
      [398, 333],
      [402, 346],
      [412, 326],
      [418, 339],
      [425, 330],
    ],
    { pen: 'violet', thick: true },
  );
  d.text(425, 392, 'full batch: smooth\nmini-batch: noisy', { pen: 'violet', size: 15 });
};
