export const meta = { title: "Floyd's tortoise and hare on a list 1→2→3→4→5→6 that loops back to 3", width: 520, height: 420 };

const CX = 290;
const CY = 130;
const R = 74;
const ND = 38;
const P = {
  1: [80, CY],
  2: [148, CY],
  3: [CX - R, CY],
  4: [CX, CY - R],
  5: [CX + R, CY],
  6: [CX, CY + R],
};

// trace table (right)
const TX = { t: 414, s: 450, f: 490 };
const ty = (t) => 68 + t * 26;
const TRACE = [[1, 1], [2, 3], [3, 5], [4, 3], [5, 5]];

const traceRow = (d, t, pen) =>
  d.group(() => {
    const [s, f] = TRACE[t];
    d.text(TX.t, ty(t), String(t), { pen: 'muted', mono: true, size: 15 });
    d.text(TX.s, ty(t), String(s), { pen: pen ?? 'blue', mono: true, size: 17, bold: true });
    d.text(TX.f, ty(t), String(f), { pen: pen ?? 'orange', mono: true, size: 17, bold: true });
  });

const note = (d, y, s, pen) => d.text(24, y, s, { pen, size: 15, anchor: 'start' });

export default (d) => {
  d.step('A list whose tail loops back');
  d.group(() => {
    for (const [k, [x, y]] of Object.entries(P)) d.circle(x, y, ND, { pen: 'ink', fill: 'muted', rough: 0.6, single: true, label: k, mono: true, size: 17, bold: true });
  });
  d.group(() => {
    d.text(30, CY, 'head', { pen: 'red', size: 15, bold: true });
    d.arrow(48, CY, P[1][0] - ND / 2 - 3, CY, { pen: 'red', rough: 0.5, single: true });
    d.arrow(P[1][0] + 20, CY, P[2][0] - 22, CY, { pen: 'ink', rough: 0.5, single: true });
    d.arrow(P[2][0] + 20, CY, P[3][0] - 22, CY, { pen: 'ink', rough: 0.5, single: true });
    for (const [a, b] of [[285, 345], [15, 75], [105, 165], [195, 255]]) d.arcArrow(CX, CY, R, a, b, { pen: 'ink', rough: 0.5, single: true });
  });
  note(d, 256, 'a plain while-loop over next would never end', 'red');

  d.step('slow moves 1 node per step, fast moves 2');
  d.group(() => {
    d.text(TX.t, 40, 't', { pen: 'muted', size: 15, bold: true });
    d.text(TX.s, 40, 'slow', { pen: 'blue', size: 15, bold: true });
    d.text(TX.f, 40, 'fast', { pen: 'orange', size: 15, bold: true });
  });
  traceRow(d, 0);
  traceRow(d, 1);
  traceRow(d, 2);
  note(d, 280, 'both start at head; fast enters the loop first', 'blue');

  d.step('Inside the loop the gap shrinks by 1 per step');
  traceRow(d, 3);
  traceRow(d, 4, 'green');
  d.group(() => {
    d.circle(P[5][0], P[5][1], ND + 14, { pen: 'green', thick: true, rough: 0.6, single: true });
    d.text(CX + 28, CY, 'meet', { pen: 'green', size: 15, bold: true });
  });
  note(d, 304, 'fast gains 1 node per step: gap 2 → 1 → 0, meet at 5', 'green');

  d.step('Reset one pointer to head to find the loop start');
  d.group(() => {
    d.arrow(P[1][0] + 4, CY - 22, P[2][0] - 4, CY - 22, { pen: 'violet', bend: -12, thick: true, rough: 0.6 });
    d.arrow(P[2][0] + 4, CY - 22, P[3][0] - 6, CY - 22, { pen: 'violet', bend: -12, thick: true, rough: 0.6 });
  });
  d.arcArrow(CX, CY, R + 30, 98, 262, { pen: 'violet', thick: true, rough: 0.6 });
  d.text(CX - 26, CY, 'start', { pen: 'violet', size: 15, bold: true });
  note(d, 338, 'one from head, one from the meeting point, 1 step\neach: both reach 3, the start of the loop, together', 'violet');

  d.step('No loop: fast reaches the end with slow in the middle');
  d.group(() => {
    [1, 2, 3, 4, 5].forEach((v, i) => {
      const x = 52 + i * 62;
      d.rect(x, 370, 36, 26, { pen: i === 2 ? 'blue' : 'ink', fill: i === 2 ? 'blue' : undefined, rough: 0.6, single: true, label: String(v), mono: true, size: 15, bold: true });
      if (i < 4) d.arrow(x + 39, 383, x + 58, 383, { pen: 'muted', rough: 0.4, single: true, headSize: 8 });
    });
    d.text(52 + 4 * 62 + 46, 383, 'None', { pen: 'muted', mono: true, size: 14, anchor: 'start' });
    d.text(52 + 2 * 62 + 18, 404, 'slow', { pen: 'blue', size: 14, bold: true });
    d.text(52 + 4 * 62 + 18, 404, 'fast', { pen: 'orange', size: 14, bold: true });
    d.text(400, 383, '→ middle = 3', { pen: 'blue', size: 15, bold: true, anchor: 'start' });
  });
};
