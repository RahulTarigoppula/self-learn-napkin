export const meta = { title: 'BFS ripple versus DFS dive on a 5×5 grid with walls', width: 520, height: 400 };

const GRID = ['..#..', '.##..', '.....', '#.##.', '.....'];
const C = 36; // cell size
const GY = 50;
const LX = 44; // BFS grid
const RX = 296; // DFS grid
const ctr = (gx, r, c) => [gx + c * C + C / 2, GY + r * C + C / 2];

// BFS distances from (0,0) (computed by hand, neighbour order does not matter for distances)
const DIST = [
  [0, 1, -1, 7, 8],
  [1, -1, -1, 6, 7],
  [2, 3, 4, 5, 6],
  [-1, 4, -1, -1, 7],
  [6, 5, 6, 7, 8],
];
// DFS (recursive, trying up, right, down, left): dead end at (0,1), then this dive
const DIVE = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2],
  [2, 3],
  [1, 3],
  [0, 3],
  [0, 4],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
];
const SHORT = [
  [0, 0],
  [1, 0],
  [2, 0],
  [2, 1],
  [3, 1],
  [4, 1],
  [4, 2],
  [4, 3],
  [4, 4],
];

function grid(d, gx, title, pen) {
  d.group(() => {
    for (let k = 0; k <= 5; k++) {
      d.line(gx, GY + k * C, gx + 5 * C, GY + k * C, { pen: 'muted', thin: true, rough: 0.5, single: true });
      d.line(gx + k * C, GY, gx + k * C, GY + 5 * C, { pen: 'muted', thin: true, rough: 0.5, single: true });
    }
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        if (GRID[r][c] === '#')
          d.rect(gx + c * C + 2, GY + r * C + 2, C - 4, C - 4, {
            pen: 'muted',
            fill: 'muted',
            rough: 0.6,
            single: true,
          });
    d.text(gx + 2.5 * C, 24, title, { pen, size: 17, bold: true });
    d.text(gx - 10, GY + C / 2, 'S', { pen: 'ink', size: 16, bold: true, anchor: 'end' });
    d.text(gx + 5 * C + 10, GY + 4.5 * C, 'G', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
  });
}

function boxes(d, x, y, labels, w, pen) {
  labels.forEach((t, i) =>
    d.rect(x + i * w, y, w, 28, { pen, rough: 0.6, single: true, label: t, size: 15, bold: true }),
  );
}

export default (d) => {
  d.step('A 5×5 grid with walls');
  grid(d, LX, 'BFS · queue', 'blue');
  grid(d, RX, 'DFS · stack', 'red');

  d.step('BFS ripples out one ring at a time');
  for (let k = 0; k <= 8; k++) {
    d.group(() => {
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 5; c++)
          if (DIST[r][c] === k) d.text(...ctr(LX, r, c), String(k), { pen: 'blue', size: 16, bold: k === 0 });
    });
  }
  d.group(() => {
    d.text(LX, 286, 'queue: take from the front', { pen: 'blue', size: 15, anchor: 'start' });
    d.arrow(LX + 22, 314, LX - 6, 314, { pen: 'blue' });
    boxes(d, LX + 26, 300, ['5', '6', '6'], 34, 'blue');
    d.arrow(LX + 160, 314, LX + 132, 314, { pen: 'blue' });
    d.text(LX + 26, 344, 'distances stay in order', { pen: 'muted', size: 14, anchor: 'start' });
  });

  d.step('DFS dives down one branch');
  d.group(() => {
    const [x0, y0] = ctr(RX, 0, 0);
    const [x1, y1] = ctr(RX, 0, 1);
    d.arrow(x0 + 6, y0 - 4, x1 - 4, y1 - 4, { pen: 'muted', thin: true, headSize: 7 });
    d.text(x1 + 4, y1 + 8, '✗', { pen: 'muted', size: 15 });
  });
  d.poly(
    DIVE.slice(0, 7).map(([r, c]) => ctr(RX, r, c)),
    { pen: 'red', thick: true, rough: 0.7, single: true },
  );
  d.group(() => {
    const pts = DIVE.slice(6).map(([r, c]) => ctr(RX, r, c));
    d.poly(pts, { pen: 'red', thick: true, rough: 0.7, single: true });
    const [x, y] = pts[pts.length - 1];
    d.arrow(x, y - 14, x, y - 2, { pen: 'red', thick: true });
  });
  d.group(() => {
    d.text(RX, 286, 'stack: newest cell on top', { pen: 'red', size: 15, anchor: 'start' });
    boxes(d, RX, 300, ['…', '2,3', '1,3', '0,3'], 40, 'red');
    d.arrow(RX + 184, 314, RX + 164, 314, { pen: 'red' });
    d.text(RX + 188, 314, 'top', { pen: 'red', size: 14, anchor: 'start' });
  });

  d.step('BFS reaches G in the fewest edges');
  d.group(() => {
    for (const [r, c] of SHORT)
      d.rect(LX + c * C + 3, GY + r * C + 3, C - 6, C - 6, {
        pen: 'green',
        thick: true,
        rough: 0.5,
        single: true,
      });
  });
  d.text(LX + 2.5 * C, 246, 'shortest: 8 edges ✓', { pen: 'green', size: 16, bold: true });
  d.text(RX + 2.5 * C, 246, 'first found: 12 edges', { pen: 'red', size: 16, bold: true });
  d.text(260, 382, 'both visit each cell at most once: O(V + E)', { pen: 'ink', size: 15 });
};
