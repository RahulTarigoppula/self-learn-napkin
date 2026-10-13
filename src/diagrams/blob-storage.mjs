export const meta = {
  title: 'Blob storage: objects in a bucket, pre-signed multipart upload, 6+3 erasure coding and a CDN',
  width: 520,
  height: 420,
};

const B = { x: 252, y: 20, w: 254, h: 176 }; // bucket

export default (d) => {
  const box = (x, y, w, h, label, pen) =>
    d.rect(x, y, w, h, { pen, fill: pen, label, size: 16, bold: true, single: true });

  d.step('A bucket holds objects: key → bytes + metadata');
  d.group(() => {
    d.rect(B.x, B.y, B.w, B.h, { pen: 'ink', thick: true, single: true });
    d.text(B.x + B.w / 2, B.y + 18, 'bucket: photos', { size: 16, bold: true });
  });
  d.group(() => {
    d.text(B.x + 14, 66, 'users/42/cat.jpg', { mono: true, size: 14, anchor: 'start', pen: 'blue' });
    d.rect(B.x + 14, 80, 108, 28, { pen: 'blue', fill: 'blue', label: 'bytes 2 MB', size: 14, single: true });
    d.rect(B.x + 130, 80, 112, 28, {
      pen: 'violet',
      fill: 'violet',
      label: 'image/jpeg…',
      size: 14,
      single: true,
    });
  });
  d.group(() => {
    d.text(B.x + 14, 132, 'users/7/clip.mp4', { mono: true, size: 14, anchor: 'start', pen: 'blue' });
    d.text(B.x + B.w / 2, 168, '"/" is just a character:\nflat namespace, no folders', {
      pen: 'muted',
      size: 14,
    });
  });

  d.step('The app hands out a pre-signed URL');
  box(16, 24, 104, 40, 'app server', 'green');
  box(16, 146, 104, 40, 'client', 'muted');
  d.arrow(42, 142, 42, 70, { pen: 'ink' });
  d.arrow(92, 70, 92, 142, { pen: 'green', thick: true });
  d.text(104, 96, '1 may I upload?', { size: 14, anchor: 'start', pen: 'muted' });
  d.text(104, 118, '2 signed URL,\n   valid 15 min', { size: 14, anchor: 'start', pen: 'green' });

  d.step('Upload bytes directly, in parallel parts');
  d.group(() => {
    for (const [y1, y2] of [
      [154, 150],
      [166, 166],
      [178, 182],
    ])
      d.arrow(124, y1, B.x - 6, y2, { pen: 'blue', thick: true });
  });
  d.text(186, 216, '3 PUT parts 1, 2, 3\n4 "complete"', { pen: 'blue', size: 15 });

  d.step('Erasure coding: 6 data + 3 parity chunks');
  const DX = 20;
  const DW = 26;
  const GAP = 3;
  const CXE = DX + (9 * DW + 8 * GAP) / 2;
  d.text(CXE, 250, 'one object → 9 chunks on 9 disks', { size: 15 });
  d.group(() => {
    for (let i = 0; i < 9; i++) {
      const pen = i < 6 ? 'blue' : 'orange';
      d.rect(DX + i * (DW + GAP), 268, DW, 36, {
        pen,
        fill: pen,
        label: i < 6 ? `d${i + 1}` : `p${i - 5}`,
        size: 14,
        single: true,
        rough: 0.6,
      });
    }
  });
  d.text(CXE, 352, 'stores 9/6 = 1.5× the data\n(3 full copies = 3×)', { size: 15, pen: 'orange' });

  d.step('Lose any 3 disks: still readable');
  d.group(() => {
    for (const i of [1, 4, 7]) {
      const x = DX + i * (DW + GAP) + DW / 2;
      d.line(x - 7, 310, x + 7, 324, { pen: 'red', thick: true, single: true });
      d.line(x + 7, 310, x - 7, 324, { pen: 'red', thick: true, single: true });
    }
  });
  d.text(CXE, 394, 'lose any 3: any 6 of 9 rebuild it', { size: 16, pen: 'green', bold: true });

  d.step('A CDN serves reads near the viewer');
  d.group(() => {
    d.arrow(442, B.y + B.h + 4, 442, 266, { pen: 'violet' });
    d.text(432, 232, 'origin:\nfills on a miss', { size: 14, anchor: 'end', pen: 'violet' });
  });
  box(392, 270, 100, 40, 'CDN edge', 'violet');
  d.group(() => {
    d.arrow(442, 314, 442, 346, { pen: 'violet', both: true });
    d.text(442, 364, 'viewers', { size: 16, bold: true });
  });
  d.text(300, 330, 'copy near the\nviewer, ~20 ms', { size: 14, anchor: 'start', pen: 'violet' });
};
