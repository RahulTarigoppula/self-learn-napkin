export const meta = {
  title: 'A FIFO queue, a circular buffer of six slots traced with head and tail, and a deque',
  width: 520,
  height: 420,
};

const X0 = 136; // ring-buffer rows: left edge of slot 0
const CW = 42;
const CH = 32;
const cx = (i) => X0 + i * CW + CW / 2;
const RY = [152, 214, 276, 338]; // top of each snapshot row
const TX = 400; // h/t readout column

// one snapshot row: slots (null = free), h/t markers above, label left, readout right
const row = (d, r, cells, h, t, label, readout) =>
  d.group(() => {
    const y = RY[r];
    cells.forEach((c, i) => {
      if (c)
        d.rect(X0 + i * CW, y, CW, CH, {
          pen: c[1],
          fill: c[1],
          rough: 0.6,
          single: true,
          label: c[0],
          mono: true,
          size: 17,
          bold: true,
        });
      else d.rect(X0 + i * CW, y, CW, CH, { pen: 'muted', rough: 0.6, single: true });
    });
    d.text(cx(h), y - 11, 'h', { pen: 'violet', size: 16, bold: true });
    d.text(cx(t), y - 11, 't', { pen: 'orange', size: 16, bold: true });
    d.text(20, y + CH / 2, label, { pen: 'ink', size: 15, anchor: 'start' });
    d.text(TX, y + CH / 2, readout, { pen: 'ink', mono: true, size: 15, anchor: 'start' });
  });

const B = 'blue';
const O = 'orange';

export default (d) => {
  d.step('First in, first out');
  d.text(20, 22, 'queue: first in, first out', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
  d.group(() =>
    ['A', 'B', 'C'].forEach((v, i) =>
      d.rect(78 + i * 42, 44, 42, 34, {
        pen: B,
        fill: B,
        rough: 0.6,
        single: true,
        label: v,
        mono: true,
        size: 17,
        bold: true,
      }),
    ),
  );
  d.group(() => {
    d.arrow(74, 61, 26, 61, { pen: 'violet', thick: true });
    d.text(52, 92, 'out', { pen: 'violet', size: 15 });
    d.text(99, 92, 'front', { pen: 'muted', size: 14 });
  });
  d.group(() => {
    d.arrow(250, 61, 210, 61, { pen: O, thick: true });
    d.text(232, 92, 'in', { pen: O, size: 15 });
    d.text(183, 92, 'back', { pen: 'muted', size: 14 });
  });

  d.step('An array of 6 used as a ring');
  d.group(() => [0, 1, 2, 3, 4, 5].forEach((i) => d.text(cx(i), 124, String(i), { pen: 'muted', size: 14 })));
  row(d, 0, [['A', B], ['B', B], ['C', B], null, null, null], 0, 3, 'start', 'h=0 t=3');

  d.step('Dequeue: the head index moves');
  row(d, 1, [null, null, ['C', B], null, null, null], 2, 3, '2 × dequeue', 'h=2 t=3\nout: A, B');

  d.step('Enqueue past the end wraps to slot 0');
  row(d, 2, [null, null, ['C', B], ['D', O], ['E', O], ['F', O]], 2, 0, 'enqueue\nD, E, F', 'h=2 t=0');
  row(d, 3, [['G', O], null, ['C', B], ['D', O], ['E', O], ['F', O]], 2, 1, 'enqueue G', 'h=2 t=1');
  d.group(() => {
    d.arrow(cx(5), RY[3] + CH + 4, cx(0) + 4, RY[3] + CH + 4, { pen: 'red', bend: -36, thick: true });
    d.text(TX, 396, 't = (t+1) % 6', { pen: 'red', mono: true, size: 15, anchor: 'start' });
  });

  d.step('A deque: push and pop at both ends');
  d.text(292, 22, 'deque: both ends O(1)', { pen: 'ink', size: 16, bold: true, anchor: 'start' });
  d.group(() =>
    ['C', 'D', 'E'].forEach((v, i) =>
      d.rect(350 + i * 40, 44, 40, 34, {
        pen: 'green',
        fill: 'green',
        rough: 0.6,
        single: true,
        label: v,
        mono: true,
        size: 17,
        bold: true,
      }),
    ),
  );
  d.group(() => {
    d.arrow(300, 61, 344, 61, { pen: 'green', both: true, thick: true });
    d.text(318, 92, 'appendleft\npopleft', { pen: 'green', size: 14 });
  });
  d.group(() => {
    d.arrow(472, 61, 508, 61, { pen: 'green', both: true, thick: true });
    d.text(478, 92, 'append\npop', { pen: 'green', size: 14 });
  });
};
