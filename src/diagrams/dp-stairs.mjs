export const meta = {
  title: 'Dynamic programming: climbing stairs, recursion tree, memo and table',
  width: 520,
  height: 410,
};

// recursion tree for ways(5); ways(1) = 1 and ways(2) = 2 are base cases
const T = {
  a: { n: 5, x: 362, y: 46 },
  b: { n: 4, x: 284, y: 104, p: 'a' },
  c: { n: 3, x: 440, y: 104, p: 'a' },
  d: { n: 3, x: 240, y: 162, p: 'b' },
  e: { n: 2, x: 326, y: 162, p: 'b' },
  f: { n: 2, x: 408, y: 162, p: 'c' },
  g: { n: 1, x: 478, y: 162, p: 'c' },
  h: { n: 2, x: 208, y: 220, p: 'd' },
  i: { n: 1, x: 272, y: 220, p: 'd' },
};
const EW = 54;
const EH = 30;

function tnode(d, id, o = {}) {
  const t = T[id];
  d.ellipse(t.x, t.y, EW, EH, { pen: 'ink', rough: 0.8, single: true, label: `w(${t.n})`, size: 15, ...o });
}

export default (d) => {
  d.step('Climb 5 stairs, 1 or 2 at a time');
  const SX = 34; // tread width
  const SY = 30; // rise
  const B = 230; // ground
  const tread = (k) => [16 + SX * k + SX / 2, B - SY * k]; // centre of tread k (k = 0 is the ground)
  d.group(() => {
    const pts = [[16, B]];
    for (let k = 0; k < 5; k++) {
      const x = 16 + SX * (k + 1);
      pts.push([x, B - SY * k], [x, B - SY * (k + 1)]);
    }
    pts.push([16 + SX * 6 - 6, B - SY * 5]);
    d.poly(pts, { pen: 'ink', thick: true, rough: 0.7, single: true });
    for (let k = 1; k <= 5; k++) d.text(tread(k)[0], tread(k)[1] + 13, String(k), { pen: 'muted', size: 14 });
  });
  d.group(() => {
    // tread 3 = (135, 140), tread 4 = (169, 110), tread 5 = (203, 80)
    d.arrow(170, 98, 210, 70, { pen: 'blue', bend: -10, thick: true, headSize: 8 });
    d.text(206, 48, '+1', { pen: 'blue', size: 15, bold: true });
    d.arrow(128, 126, 194, 64, { pen: 'violet', bend: -28, thick: true, headSize: 8 });
    d.text(118, 82, '+2', { pen: 'violet', size: 15, bold: true });
  });
  d.text(16, 262, 'ways(n) =\nways(n−1) + ways(n−2)', { pen: 'ink', size: 15, anchor: 'start' });

  d.step('Recurse: the call tree');
  d.group(() => {
    for (const [id, t] of Object.entries(T))
      if (t.p) d.line(T[t.p].x, T[t.p].y + EH / 2, t.x, t.y - EH / 2, { pen: 'muted', thin: true });
  });
  d.group(() => {
    for (const id of Object.keys(T)) tnode(d, id);
  });

  d.step('The same subproblems, again and again');
  d.group(() => {
    tnode(d, 'c', { pen: 'orange', fill: 'orange', thick: true });
    tnode(d, 'd', { pen: 'orange', fill: 'orange', thick: true });
  });
  d.group(() => {
    for (const id of ['e', 'f', 'h']) tnode(d, id, { pen: 'violet', fill: 'violet', thick: true });
  });
  d.text(330, 268, 'w(3) twice, w(2) three times', { pen: 'orange', size: 15 });

  d.step('Memoise: solve each once, then look it up');
  d.group(() => {
    d.rect(372, 140, 136, 44, { pen: 'red', dashed: true, rough: 0.6, single: true });
    d.text(440, 202, 'never called', { pen: 'red', size: 15 });
  });
  d.group(() => {
    tnode(d, 'c', { pen: 'green', fill: 'green', thick: true });
    d.text(406, 104, 'memo hit', { pen: 'green', size: 15, bold: true, anchor: 'end' });
  });

  d.step('Tabulate bottom-up instead');
  d.group(() => {
    const X = 112;
    const W = 50;
    d.text(X - 10, 312, 'n', { pen: 'muted', size: 16, anchor: 'end' });
    d.text(X - 10, 342, 'ways', { pen: 'ink', size: 16, anchor: 'end' });
    [1, 2, 3, 5, 8].forEach((v, i) => {
      d.rect(X + i * W, 298, W, 28, {
        pen: 'muted',
        rough: 0.6,
        single: true,
        label: String(i + 1),
        size: 15,
        textPen: 'muted',
      });
      d.rect(X + i * W, 328, W, 30, {
        pen: 'blue',
        fill: i === 4 ? 'green' : 'blue',
        rough: 0.6,
        single: true,
        label: String(v),
        size: 17,
        bold: true,
      });
    });
  });
  d.group(() => {
    d.arrow(112 + 2.5 * 50, 360, 112 + 4.5 * 50 - 6, 362, { pen: 'green', bend: 20 });
    d.arrow(112 + 3.5 * 50, 360, 112 + 4.5 * 50 + 2, 362, { pen: 'green', bend: 12 });
    d.text(112 + 3.5 * 50, 392, '3 + 5 = 8', { pen: 'green', size: 15, bold: true });
  });
  d.text(376, 328, 'fill left → right\nO(n) time, and\nO(1) space if you\nkeep the last two', {
    pen: 'blue',
    size: 14,
    anchor: 'start',
  });
};
