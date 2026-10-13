export const meta = {
  title: 'Two-phase commit blocks when the coordinator crashes; a saga books flight and hotel, then compensates',
  width: 520,
  height: 420,
};

const PX = 268; // participant boxes (2PC)
const PW = 112;
const PY = [44, 92, 140];
const SY = 300; // saga row
const SX = [24, 196, 368];
const SW = 128;

export default (d) => {
  d.step('One trip, three databases');
  d.text(16, 30, 'one trip = 3 services,\neach with its own DB', { size: 15, anchor: 'start', pen: 'muted' });
  d.group(() => {
    ['flight DB', 'hotel DB', 'car DB'].forEach((t, i) =>
      d.rect(PX, PY[i], PW, 34, { pen: 'blue', fill: 'blue', label: t, size: 15, bold: true, single: true }),
    );
  });

  d.step('2PC phase 1: prepare, everyone votes yes');
  d.rect(20, 86, 112, 40, { pen: 'violet', fill: 'violet', label: 'coordinator', size: 15, bold: true, single: true });
  d.group(() => {
    PY.forEach((y) => d.arrow(136, 106, PX - 6, y + 17, { pen: 'violet' }));
    d.text(196, 62, 'prepare?', { size: 15, pen: 'violet' });
  });
  d.group(() => {
    PY.forEach((y) => d.text(PX + PW + 8, y + 17, 'yes, locked', { size: 14, pen: 'green', anchor: 'start' }));
  });

  d.step('Coordinator dies: participants are stuck');
  d.group(() => {
    d.line(122, 74, 142, 94, { pen: 'red', thick: true, single: true });
    d.line(142, 74, 122, 94, { pen: 'red', thick: true, single: true });
  });
  d.text(76, 156, 'crashed before\nsending commit', { size: 15, pen: 'red' });
  d.text(506, 196, 'in doubt: rows stay locked until it returns', { size: 14, pen: 'orange', anchor: 'end', bold: true });

  d.step('Saga: local transactions, one after another');
  d.line(16, 220, 504, 220, { pen: 'muted', thin: true, dashed: true, single: true });
  d.text(16, 246, 'saga: each step commits on its own', { size: 15, anchor: 'start', pen: 'muted' });
  d.group(() => {
    d.rect(SX[0], SY, SW, 36, { pen: 'green', fill: 'green', label: 'book flight', size: 15, bold: true, single: true });
    d.text(SX[0] + SW / 2, SY - 16, 'T1 committed', { size: 14, pen: 'green' });
  });
  d.arrow(SX[0] + SW + 4, SY + 18, SX[1] - 6, SY + 18, { pen: 'ink' });
  d.group(() => {
    d.rect(SX[1], SY, SW, 36, { pen: 'red', fill: 'red', label: 'book hotel', size: 15, bold: true, single: true });
    d.text(SX[1] + SW / 2, SY - 16, 'T2 fails: no rooms', { size: 14, pen: 'red' });
  });
  d.group(() => {
    d.arrow(SX[1] + SW + 4, SY + 18, SX[2] - 6, SY + 18, { pen: 'muted', dashed: true });
    d.rect(SX[2], SY, SW, 36, { pen: 'muted', dashed: true, label: 'book car', size: 15, single: true });
    d.text(SX[2] + SW / 2, SY - 16, 'never runs', { size: 14, pen: 'muted' });
  });

  d.step('Compensate: cancel the flight');
  d.arrow(SX[1] + 30, SY + 42, SX[0] + SW / 2, SY + 42, { pen: 'orange', thick: true, bend: -28 });
  d.text(SX[0] + 150, 384, 'C1: cancel flight, refund', { size: 15, pen: 'orange', bold: true });
};
