export const meta = {
  title: 'Write-ahead log: log first, group commit, crash, replay from the checkpoint, and the log feeding replicas',
  width: 520,
  height: 380,
};

const MEM_Y = 40;
const LOG_Y = 148;
const DATA_Y = 262;
const PX = [96, 222]; // page A, page B x (width 110)
const REC = (i) => 14 + i * 82; // log record x (width 78)

export default (d) => {
  const page = (x, y, name, value, pen) =>
    d.group(() => {
      d.rect(x, y, 110, 34, { pen, fill: pen, rough: 0.6 });
      d.text(x + 18, y + 17, name, { pen, size: 16, bold: true });
      d.text(x + 54, y + 17, value, { mono: true, size: 15 });
    });
  const change = (x, y, value, pen) =>
    d.group(() => {
      d.line(x + 40, y + 18, x + 68, y + 16, { pen: 'red', thick: true });
      d.text(x + 90, y + 17, value, { pen, mono: true, size: 15, bold: true });
    });
  const rec = (i, top, bottom, pen) =>
    d.rect(REC(i), LOG_Y, 78, 46, { pen, fill: pen, rough: 0.6, label: `${top}\n${bottom}`, mono: true, size: 14, textPen: 'ink' });

  d.step('Pages live in memory and on disk');
  d.text(14, 18, 'T7: move 50 from A to B', { pen: 'blue', size: 16, bold: true, anchor: 'start' });
  d.group(() => {
    d.text(14, 58, 'memory', { pen: 'muted', size: 14, anchor: 'start' });
    d.line(14, 104, 506, 104, { pen: 'muted', dashed: true, thin: true });
    d.text(14, 120, 'disk', { pen: 'muted', size: 14, anchor: 'start' });
  });
  page(PX[0], MEM_Y, 'A', '100', 'muted');
  page(PX[1], MEM_Y, 'B', '0', 'muted');
  d.group(() => {
    d.text(14, DATA_Y + 17, 'data\nfile', { pen: 'muted', size: 14, anchor: 'start' });
    page(PX[0], DATA_Y, 'A', '100', 'muted');
    page(PX[1], DATA_Y, 'B', '0', 'muted');
  });

  d.step('Log the change, fsync, then ack');
  d.group(() => {
    d.text(96, 134, 'write-ahead log →', { pen: 'muted', size: 14, anchor: 'start' });
    rec(0, '…', 'older', 'muted');
  });
  rec(1, '101 T7', 'A 100→50', 'blue');
  rec(2, '102 T7', 'B 0→50', 'blue');
  rec(3, '103 T7', 'COMMIT', 'green');
  d.text(342, 134, 'fsync, then ack', { pen: 'green', size: 14, bold: true });
  change(PX[0], MEM_Y, '50', 'orange');
  change(PX[1], MEM_Y, '50', 'orange');

  d.step('Group commit: one fsync, many commits');
  rec(4, '104 T8', 'COMMIT', 'green');
  rec(5, '105 T10', 'C 5→9', 'orange');
  d.group(() => {
    d.poly([[REC(3) + 4, 202], [REC(3) + 4, 210], [REC(4) + 74, 210], [REC(4) + 74, 202]], { pen: 'green' });
    d.text(REC(4), 226, 'one fsync, 2 commits', { pen: 'green', size: 14 });
  });

  d.step('Crash: memory is gone');
  d.group(() => {
    d.line(86, 36, 340, 82, { pen: 'red', thick: true });
    d.line(86, 82, 340, 36, { pen: 'red', thick: true });
  });
  d.text(428, 58, 'crash:\nmemory lost', { pen: 'red', size: 16, bold: true });

  d.step('Recovery: redo committed, undo the rest');
  d.group(() => {
    d.arrow(REC(1) + 39, 198, PX[0] + 55, DATA_Y - 4, { pen: 'green', thick: true });
    d.arrow(REC(2) + 39, 198, PX[1] + 55, DATA_Y - 4, { pen: 'green', thick: true });
    d.text(PX[0] + 30, 230, 'redo', { pen: 'green', size: 15, bold: true, anchor: 'end' });
  });
  change(PX[0], DATA_Y, '50', 'green');
  change(PX[1], DATA_Y, '50', 'green');
  d.text(REC(5) + 39, 126, 'no commit:\nundo', { pen: 'red', size: 14, bold: true });

  d.step('Checkpoints bound replay; the log feeds replicas');
  d.group(() => {
    d.line(94, 142, 94, 202, { pen: 'violet', thick: true, dashed: true });
    d.text(53, 216, 'checkpoint', { pen: 'violet', size: 14, bold: true });
  });
  d.group(() => {
    d.arrow(REC(5) + 39, 198, 436, DATA_Y - 4, { pen: 'violet', thick: true });
    d.rect(370, DATA_Y, 134, 34, { pen: 'violet', fill: 'violet', rough: 0.6, label: 'replica / CDC', size: 15, textPen: 'violet' });
  });
  d.text(260, 340, 'replay starts at the checkpoint, not at the\nbeginning of time; replicas apply the same log', {
    pen: 'violet',
    size: 14,
  });
};
