export const meta = {
  title: 'Consistency models on one timeline: which reads each model allows',
  width: 520,
  height: 420,
};

const tx = (t) => 84 + t * 42; // time 0..10 → x
const LANE = { A: 66, B: 124, C: 182 };
const BH = 28; // bar height
const AXIS = 220;
const C1 = 314; // table column 1 centre
const C2 = 446; // table column 2 centre
const ROWS = [300, 330, 362, 392];

export default (d) => {
  const bar = (lane, t0, t1, label, pen) =>
    d.rect(tx(t0), LANE[lane] - BH / 2, tx(t1) - tx(t0), BH, {
      pen,
      fill: pen,
      label,
      size: 15,
      bold: true,
      rough: 0.7,
    });
  const row = (i, name, a, b) =>
    d.group(() => {
      d.text(14, ROWS[i], name, { pen: 'ink', size: 16, bold: true, anchor: 'start' });
      d.text(C1, ROWS[i], a, { pen: a === 'no' ? 'red' : 'green', size: 16, bold: true });
      d.text(C2, ROWS[i], b, { pen: b === 'no' ? 'red' : 'green', size: 16, bold: true });
    });

  d.step('One value, three clients, real time');
  d.group(() => {
    for (const [k, y] of Object.entries(LANE)) {
      d.text(14, y, k, { pen: 'ink', size: 18, bold: true, anchor: 'start' });
      d.line(40, y, 500, y, { pen: 'muted', thin: true, dashed: true });
    }
  });
  d.group(() => {
    d.arrow(40, AXIS, 500, AXIS, { pen: 'muted' });
    d.text(500, AXIS - 14, 'real time →', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(40, AXIS + 16, 'x = 0 at start', { pen: 'muted', size: 15, anchor: 'start' });
  });

  d.step('A writes x = 1');
  bar('A', 0.8, 3.6, 'write x = 1', 'orange');
  d.group(() => {
    d.line(tx(3.6), 24, tx(3.6), AXIS - 4, { pen: 'orange', dashed: true });
    d.text(tx(3.6) + 6, 24, 'write completes', { pen: 'orange', size: 15, anchor: 'start' });
  });

  d.step('C reads after that, and gets 0');
  bar('C', 4.4, 6.6, 'read → 0', 'red');

  d.step('B reads 1, then 0');
  bar('B', 4.4, 6.6, 'read → 1', 'green');
  bar('B', 7.4, 9.6, 'read → 0', 'red');

  d.step('Linearizable forbids both');
  d.group(() => {
    d.text(C1, 262, 'C sees 0\nafter write', { pen: 'muted', size: 15 });
    d.text(C2, 262, 'B sees 1,\nthen 0', { pen: 'muted', size: 15 });
    d.line(14, 282, 506, 282, { pen: 'muted', thin: true });
  });
  row(0, 'linearizable', 'no', 'no');

  d.step('Weaker models allow more');
  row(1, 'sequential', 'yes', 'no');
  row(2, 'causal', 'yes', 'no');
  row(3, 'eventual', 'yes', 'yes');
};
