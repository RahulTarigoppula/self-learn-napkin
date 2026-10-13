export const meta = {
  title: 'Counting sort with prefix sums, then LSD radix sort digit by digit',
  width: 520,
  height: 420,
};

const CW = 36;
const CH = 30;
const X0 = 96;
const NX = 400; // note column
const cx = (i) => X0 + i * CW + CW / 2;

const INPUT = [3, 1, 4, 1, 0, 3, 1, 2];
const COUNT = [1, 3, 1, 2, 1]; // how many of each key 0..4
const START = [0, 1, 4, 5, 7]; // exclusive prefix sums = first output slot of each key
const OUTPUT = [0, 1, 1, 1, 2, 3, 3, 4];

function cells(d, y, values, pen, label) {
  d.text(14, y + CH / 2, label, { pen: 'muted', size: 15, anchor: 'start' });
  values.forEach((v, i) =>
    d.rect(X0 + i * CW, y, CW, CH, {
      pen,
      fill: pen === 'ink' ? undefined : pen,
      rough: 0.6,
      single: true,
      label: String(v),
      size: 17,
      bold: true,
      textPen: pen,
    }),
  );
}

/** Tags a, b, c under the three 1s so their order can be followed. */
function tags(d, y, positions) {
  positions.forEach((p, k) => d.text(cx(p), y, 'abc'[k], { pen: 'violet', size: 14, bold: true }));
}

// Radix rows: each number drawn digit by digit so the active digit can be coloured.
const RX = 100;
const RSTEP = 60;
const DIG = 13;
function numbers(d, y, nums, active, label) {
  d.group(() => {
    d.text(14, y, label, { pen: 'muted', size: 15, anchor: 'start' });
    nums.forEach((n, k) => {
      const s = String(n).padStart(3, '0');
      [...s].forEach((ch, j) => {
        const hot = j === active;
        d.text(RX + k * RSTEP + j * DIG, y, ch, { pen: hot ? 'red' : 'ink', size: 19, bold: hot });
      });
    });
  });
}

export default (d) => {
  d.step('Small integer keys, 0 to 4');
  d.group(() => {
    cells(d, 18, INPUT, 'ink', 'input');
    tags(d, 58, [1, 3, 6]);
  });
  d.text(NX, 33, 'n = 8, k = 5', { pen: 'muted', size: 15, anchor: 'start' });

  d.step('Count how many of each key');
  d.group(() => {
    COUNT.forEach((_, i) => d.text(cx(i), 82, String(i), { pen: 'muted', size: 14 }));
    cells(d, 94, COUNT, 'blue', 'count');
  });
  d.text(296, 109, 'one pass: O(n)', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('Prefix sums: where each key starts');
  d.group(() => cells(d, 138, START, 'orange', 'start'));
  d.text(296, 153, 'sum of counts of\nall smaller keys', { pen: 'orange', size: 15, anchor: 'start' });

  d.step('Place left to right: equal keys keep order');
  d.group(() => {
    cells(d, 182, OUTPUT, 'green', 'output');
    tags(d, 222, [1, 2, 3]);
  });
  d.text(NX, 197, 'stable:\n1a, 1b, 1c', { pen: 'green', size: 15, anchor: 'start' });

  d.step('Radix: stable sort by the last digit first');
  d.line(14, 244, 506, 244, { pen: 'muted', dashed: true, thin: true });
  numbers(d, 266, [523, 151, 342, 315, 241, 512], -1, 'input');
  numbers(d, 294, [151, 241, 342, 512, 523, 315], 2, 'by 1s');

  d.step('Then tens, then hundreds: sorted');
  numbers(d, 322, [512, 315, 523, 241, 342, 151], 1, 'by 10s');
  numbers(d, 350, [151, 241, 315, 342, 512, 523], 0, 'by 100s');
  d.text(14, 390, 'd = 3 passes × O(n + b), base b = 10 → O(d·(n + b))', {
    pen: 'red',
    size: 15,
    bold: true,
    anchor: 'start',
  });
};
