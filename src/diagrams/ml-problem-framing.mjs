export const meta = {
  title: 'Framing churn as an ML task: goal, timeline, training table, metrics and baseline',
  width: 520,
  height: 420,
};

// Training table geometry
const TX = 22;
const COLS = [
  { w: 86, head: 'customer', pen: 'ink' },
  { w: 90, head: 'logins\nlast 30 d', pen: 'blue' },
  { w: 82, head: 'tenure\n(months)', pen: 'blue' },
  { w: 90, head: 'tickets\nlast 90 d', pen: 'blue' },
  { w: 112, head: 'cancelled in\nnext 30 d?', pen: 'orange' },
];
const ROWS = [
  ['A17', '22', '14', '0', '0'],
  ['B42', '3', '2', '4', '1'],
  ['C08', '9', '31', '1', '0'],
];
const HY = 166; // header top
const HH = 40;
const RH = 25;
const colX = (c) => TX + COLS.slice(0, c).reduce((s, k) => s + k.w, 0);

export default (d) => {
  d.step('Start from the business goal');
  d.rect(16, 18, 196, 56, { pen: 'ink', label: 'goal: keep more\nsubscribers', size: 16 });
  d.arrow(220, 46, 290, 46, { pen: 'muted', label: 'frame', size: 15 });
  d.rect(298, 18, 206, 56, {
    pen: 'blue',
    fill: 'blue',
    label: 'predict: P(cancel in\nthe next 30 days)',
    size: 16,
    textPen: 'ink',
  });

  d.step('Fix the moment of prediction');
  d.arrow(24, 122, 498, 122, { pen: 'muted' });
  d.group(() => {
    d.line(96, 114, 96, 130, { pen: 'blue', thick: true });
    d.line(96, 122, 316, 122, { pen: 'blue', thick: true });
    d.text(206, 104, 'features: past 90 days', { pen: 'blue', size: 15 });
  });
  d.group(() => {
    d.line(320, 108, 320, 138, { pen: 'red', thick: true });
    d.text(320, 150, 'prediction date', { pen: 'red', size: 15 });
  });
  d.group(() => {
    d.line(324, 122, 448, 122, { pen: 'orange', thick: true });
    d.line(448, 114, 448, 130, { pen: 'orange', thick: true });
    d.text(386, 104, 'label: 30 days', { pen: 'orange', size: 15 });
  });

  d.step('One row per customer per date');
  d.group(() => {
    COLS.forEach((c, i) => {
      d.rect(colX(i), HY, c.w, HH, {
        pen: c.pen,
        fill: c.pen === 'ink' ? undefined : c.pen,
        rough: 0.5,
        label: c.head,
        size: 14,
        textPen: 'ink',
      });
    });
  });
  d.group(() => {
    ROWS.forEach((row, r) => {
      row.forEach((v, i) => {
        const last = i === COLS.length - 1;
        d.rect(colX(i), HY + HH + r * RH, COLS[i].w, RH, {
          pen: 'muted',
          rough: 0.4,
          label: v,
          size: 16,
          mono: true,
          textPen: last ? 'orange' : 'ink',
        });
      });
    });
  });

  d.step('Offline metric vs business metric');
  d.rect(16, 296, 226, 58, { pen: 'blue', label: 'offline: precision in\ntop 5 % = 0.30', size: 15 });
  d.arrow(250, 325, 290, 325, { pen: 'muted' });
  d.rect(298, 296, 206, 58, {
    pen: 'green',
    fill: 'green',
    label: 'business: profit only\nif precision > 0.25',
    size: 15,
    textPen: 'ink',
  });

  d.step('Beat a simple baseline first');
  d.text(22, 378, 'baseline rule: biggest drop in logins → flag', {
    pen: 'violet',
    size: 16,
    anchor: 'start',
  });
  d.text(22, 402, 'precision 0.18: the model must beat this', { pen: 'red', size: 15, anchor: 'start' });
};
