export const meta = {
  title: 'A singly linked list: walking, inserting after a node, and reversing 1→2→3 in place',
  width: 520,
  height: 420,
};

// ---- top: the list head → 1 → 2 → 3 → 4 → None
const NX = (i) => 76 + i * 100; // left edge of node i
const NY = 58;
const NH = 34;
const YC = NY + NH / 2;

const node = (d, x, y, v, pen) =>
  d.group(() => {
    d.rect(x, y, 64, NH, { pen, fill: pen, rough: 0.6, single: true });
    d.line(x + 42, y + 2, x + 42, y + NH - 2, { pen, rough: 0.4, single: true });
    d.text(x + 21, y + NH / 2, v, { pen, mono: true, size: 18, bold: true });
    d.dot(x + 53, y + NH / 2, 7, { pen, single: true });
  });

// ---- bottom: reversal snapshots
const RX = [160, 250, 340]; // node centres
const RW = 48;
const RYC = [216, 272, 328, 384];
const NONE_L = 72;
const NONE_R = 432;

const flip = (d, r, from, to, pen) => {
  const y = RYC[r];
  if (to === 'L') d.arrow(RX[from] - RW / 2 - 2, y, NONE_L + 22, y, { pen, rough: 0.6, single: true });
  else if (to === 'R') d.arrow(RX[from] + RW / 2 + 2, y, NONE_R - 24, y, { pen, rough: 0.6, single: true });
  else if (to > from) d.arrow(RX[from] + RW / 2 + 2, y, RX[to] - RW / 2 - 4, y, { pen, rough: 0.6, single: true });
  else d.arrow(RX[from] - RW / 2 - 2, y, RX[to] + RW / 2 + 4, y, { pen, rough: 0.6, single: true });
};

// links: [from, to, pen]; marks: [[xCentre, label, pen], …]
const snap = (d, r, links, marks, tag) =>
  d.group(() => {
    const y = RYC[r];
    d.text(NONE_L, y, 'None', { pen: 'muted', mono: true, size: 14 });
    d.text(NONE_R, y, 'None', { pen: 'muted', mono: true, size: 14 });
    RX.forEach((x, i) =>
      d.rect(x - RW / 2, y - 15, RW, 30, {
        pen: 'blue',
        fill: 'blue',
        rough: 0.6,
        single: true,
        label: String(i + 1),
        mono: true,
        size: 17,
        bold: true,
      }),
    );
    links.forEach(([a, b, pen]) => flip(d, r, a, b, pen));
    marks.forEach(([x, label, pen]) => d.text(x, y + 26, label, { pen, size: 14, bold: true }));
    d.text(506, y, tag, { pen: 'muted', size: 14, anchor: 'end' });
  });

export default (d) => {
  d.step('Nodes joined by next pointers');
  d.group(() => {
    d.text(36, YC, 'head', { pen: 'red', size: 15, bold: true });
    d.arrow(54, YC, NX(0) - 3, YC, { pen: 'red', rough: 0.6, single: true });
  });
  ['1', '2', '3', '4'].forEach((v, i) => node(d, NX(i), NY, v, 'blue'));
  d.group(() => {
    for (let i = 0; i < 3; i++) d.arrow(NX(i) + 53, YC, NX(i + 1) - 3, YC, { pen: 'ink', rough: 0.6, single: true });
    d.arrow(NX(3) + 53, YC, 458, YC, { pen: 'ink', rough: 0.6, single: true });
    d.text(482, YC, 'None', { pen: 'muted', mono: true, size: 15 });
  });

  d.step('Finding a node means walking from head');
  d.arrow(NX(0) + 30, NY - 6, NX(1) + 26, NY - 6, { pen: 'violet', bend: -16, thick: true });
  d.text(NX(1) + 76, 32, 'find 2: walk from head, O(n)', {
    pen: 'violet',
    size: 15,
    anchor: 'start',
  });

  d.step('Insert after a known node: two pointer writes');
  d.text(258, YC - 1, '✕', { pen: 'red', size: 20, bold: true });
  node(d, 226, 120, '9', 'orange');
  d.group(() => {
    d.arrow(NX(1) + 53, YC + 8, 232, 118, { pen: 'orange', thick: true, rough: 0.6 });
    d.arrow(226 + 58, 137, NX(2) + 20, NY + NH + 3, { pen: 'orange', thick: true, rough: 0.6, bend: 10 });
  });
  d.text(332, 140, '9.next = 2.next\n2.next = 9   → O(1)', {
    pen: 'orange',
    mono: true,
    size: 14,
    anchor: 'start',
  });

  d.step('Reverse: flip one pointer, then move on');
  d.text(20, 180, 'reverse 1→2→3: save next, flip, advance', {
    pen: 'ink',
    size: 16,
    bold: true,
    anchor: 'start',
  });
  snap(
    d,
    0,
    [
      [0, 1, 'ink'],
      [1, 2, 'ink'],
      [2, 'R', 'ink'],
    ],
    [
      [NONE_L, 'prev', 'violet'],
      [RX[0], 'curr', 'red'],
    ],
    'start',
  );
  snap(
    d,
    1,
    [
      [0, 'L', 'orange'],
      [1, 2, 'ink'],
      [2, 'R', 'ink'],
    ],
    [
      [RX[0], 'prev', 'violet'],
      [RX[1], 'curr', 'red'],
    ],
    'step 1',
  );

  d.step('Repeat until curr is None; prev is the new head');
  snap(
    d,
    2,
    [
      [0, 'L', 'orange'],
      [1, 0, 'orange'],
      [2, 'R', 'ink'],
    ],
    [
      [RX[1], 'prev', 'violet'],
      [RX[2], 'curr', 'red'],
    ],
    'step 2',
  );
  snap(
    d,
    3,
    [
      [0, 'L', 'orange'],
      [1, 0, 'orange'],
      [2, 1, 'orange'],
    ],
    [
      [RX[2], 'prev = new head', 'green'],
      [NONE_R, 'curr', 'red'],
    ],
    'step 3',
  );
};
