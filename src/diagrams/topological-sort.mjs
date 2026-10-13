export const meta = {
  title: "Kahn's algorithm ordering six courses by their prerequisites",
  width: 520,
  height: 410,
};

const R = 27; // node radius
const N = {
  Intro: [60, 80],
  Math: [60, 205],
  DS: [190, 80],
  Algo: [190, 205],
  DB: [320, 80],
  ML: [320, 205],
};
const EDGES = [
  ['Intro', 'DS'],
  ['Math', 'DS'],
  ['Math', 'Algo'],
  ['DS', 'Algo'],
  ['DS', 'DB'],
  ['Algo', 'ML'],
  ['DB', 'ML'],
];
const ORDER = ['Intro', 'Math', 'DS', 'Algo', 'DB', 'ML'];

// shorten an edge so it starts and ends on the circles
function edge(d, a, b, o = {}) {
  const [x1, y1] = N[a];
  const [x2, y2] = N[b];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  d.arrow(x1 + ux * (R + 3), y1 + uy * (R + 3), x2 - ux * (R + 4), y2 - uy * (R + 4), {
    pen: 'muted',
    single: true,
    ...o,
  });
}

function node(d, id, o = {}) {
  const [x, y] = N[id];
  d.circle(x, y, R * 2, { pen: 'ink', size: 16, bold: true, label: id, single: true, ...o });
}

// in-degree badge, above-right of the node
function badge(d, id, n, pen = 'blue') {
  const [x, y] = N[id];
  d.rect(x + 14, y - 46, 26, 22, {
    pen,
    fill: pen,
    rough: 0.5,
    single: true,
    label: String(n),
    mono: true,
    size: 15,
    bold: true,
  });
}

const SLOT_X = 30;
const SLOT_W = 54;
const SLOT_Y = 312;
function slot(d, i) {
  d.rect(SLOT_X + i * SLOT_W, SLOT_Y, SLOT_W - 4, 32, {
    pen: 'green',
    fill: 'green',
    rough: 0.5,
    single: true,
    label: ORDER[i],
    size: 15,
    bold: true,
  });
}

const CYC = { X: [445, 120], Y: [490, 200], Z: [400, 200] };

export default (d) => {
  d.step('Courses and their prerequisites');
  for (const id of Object.keys(N)) node(d, id);
  d.group(() => {
    for (const [a, b] of EDGES) edge(d, a, b);
  });
  d.text(30, 262, 'arrow A → B: take A before B', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Count incoming arrows (in-degree)');
  d.group(() => {
    badge(d, 'Intro', 0, 'green');
    badge(d, 'Math', 0, 'green');
    badge(d, 'DS', 2);
    badge(d, 'Algo', 2);
    badge(d, 'DB', 1);
    badge(d, 'ML', 2);
  });
  d.group(() => {
    d.text(30, 292, 'order:', { pen: 'ink', size: 15, anchor: 'start' });
    d.rect(SLOT_X - 4, SLOT_Y - 4, 6 * SLOT_W + 4, 40, {
      pen: 'muted',
      rough: 0.5,
      single: true,
      dashed: true,
    });
  });
  d.text(90, 292, 'queue starts with the 0s', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Output Intro and Math, cut their arrows');
  d.group(() => {
    node(d, 'Intro', { pen: 'green', fill: 'green' });
    node(d, 'Math', { pen: 'green', fill: 'green' });
  });
  d.group(() => {
    badge(d, 'DS', 0, 'orange');
    badge(d, 'Algo', 1, 'orange');
  });
  d.group(() => {
    slot(d, 0);
    slot(d, 1);
  });

  d.step('DS hits zero: it frees Algo and DB');
  node(d, 'DS', { pen: 'green', fill: 'green' });
  d.group(() => {
    badge(d, 'Algo', 0, 'orange');
    badge(d, 'DB', 0, 'orange');
  });
  slot(d, 2);

  d.step('Algo, DB, then ML: all 6 are out');
  d.group(() => {
    node(d, 'Algo', { pen: 'green', fill: 'green' });
    node(d, 'DB', { pen: 'green', fill: 'green' });
  });
  badge(d, 'ML', 0, 'orange');
  node(d, 'ML', { pen: 'green', fill: 'green' });
  d.group(() => {
    for (let i = 3; i < 6; i++) slot(d, i);
  });
  d.text(30, 372, '6 of 6 output → a valid order ✓', { pen: 'green', size: 16, bold: true, anchor: 'start' });

  d.step('A cycle never reaches zero');
  d.group(() => {
    for (const [id, [x, y]] of Object.entries(CYC))
      d.circle(x, y, 40, { pen: 'red', label: id, size: 16, bold: true, single: true });
    const arr = (a, b) => {
      const [x1, y1] = CYC[a];
      const [x2, y2] = CYC[b];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / len;
      const uy = (y2 - y1) / len;
      d.arrow(x1 + ux * 23, y1 + uy * 23, x2 - ux * 24, y2 - uy * 24, {
        pen: 'red',
        single: true,
        headSize: 9,
      });
    };
    arr('X', 'Y');
    arr('Y', 'Z');
    arr('Z', 'X');
  });
  d.text(445, 252, 'each in-degree 1\nqueue empty\n0 of 3 output\n→ cycle!', { pen: 'red', size: 15 });
};
