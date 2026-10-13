export const meta = {
  title: 'Read repair during a quorum read, and Merkle-tree anti-entropy',
  width: 520,
  height: 420,
};

const RX = 420; // replica column
const RT = [24, 86, 148]; // replica tops
const CW = 62;
const CH = 34;
const CO = { x: 74, y: 92, w: 112, h: 40 }; // coordinator box

const TL = 130; // left tree centre (R1)
const TR = 390; // right tree centre (R3)
const Y0 = 256; // root row
const Y1 = 310; // children row
const Y2 = 364; // leaves row
const RANGES = ['0–24', '25–49', '50–74', '75–99'];

export default (d) => {
  const mid = (i) => RT[i] + CH / 2;
  const tag = (i, v, pen, fill = pen) =>
    d.rect(RX + CW / 2 + 10, mid(i) - 12, 38, 24, {
      pen,
      fill,
      label: v,
      size: 15,
      bold: true,
      rough: 0.6,
      single: true,
    });
  const node = (x, y, w, label, pen, fill, size = 15) =>
    d.rect(x - w / 2, y - 13, w, 26, { pen, fill, label, size, rough: 0.6, mono: true, single: true });

  /** One Merkle tree: root, two children, four leaves (key ranges). */
  const tree = (cx, name, hashes, side) =>
    d.group(() => {
      d.text(cx + side * 40, Y0, name, {
        pen: 'violet',
        size: 16,
        bold: true,
        anchor: side < 0 ? 'end' : 'start',
      });
      for (const s of [-1, 1]) {
        d.line(cx + s * 12, Y0 + 13, cx + s * 54, Y1 - 13, { pen: 'muted', thin: true, single: true });
        for (const t of [-1, 1])
          d.line(cx + s * 54 + t * 8, Y1 + 13, cx + s * 54 + t * 27, Y2 - 13, {
            pen: 'muted',
            thin: true,
            single: true,
          });
      }
      node(cx, Y0, 50, hashes[0], 'ink', 'paper');
      node(cx - 54, Y1, 44, hashes[1], 'ink', 'paper');
      node(cx + 54, Y1, 44, hashes[2], 'ink', 'paper');
      [-81, -27, 27, 81].forEach((dx, i) => node(cx + dx, Y2, 48, RANGES[i], 'muted', 'paper', 14));
    });

  d.step('Replicas drift apart');
  RT.forEach((top, i) =>
    d.group(() => {
      d.line(RX - CW / 2, top, RX - CW / 2, top + CH, { pen: 'violet', single: true });
      d.line(RX + CW / 2, top, RX + CW / 2, top + CH, { pen: 'violet', single: true });
      d.arc(RX, top + CH, CW, 12, 90, 270, { pen: 'violet', single: true });
      d.ellipse(RX, top, CW, 12, { pen: 'violet', fill: 'violet', single: true });
      d.text(RX, top + CH / 2 + 4, `R${i + 1}`, { pen: 'violet', size: 16, bold: true });
    }),
  );
  d.group(() => {
    tag(0, 'v2', 'green');
    tag(1, 'v2', 'green');
    tag(2, 'v1', 'red');
  });
  d.text(14, 38, 'a write of v2 reached R1, R2;\nR3 was down and kept v1', {
    pen: 'red',
    size: 15,
    anchor: 'start',
  });

  d.step('A quorum read sees two versions');
  d.rect(CO.x, CO.y, CO.w, CO.h, { pen: 'blue', fill: 'blue', label: 'coordinator', size: 16, bold: true });
  d.arrow(CO.x + CO.w + 4, CO.y + 12, RX - CW / 2 - 6, mid(1), {
    pen: 'blue',
    label: 'read k → v2',
    size: 15,
    labelDy: -14,
  });
  d.arrow(CO.x + CO.w + 4, CO.y + 24, RX - CW / 2 - 6, mid(2), {
    pen: 'blue',
    label: 'read k → v1',
    size: 15,
    labelDx: 40,
    labelDy: -18,
  });

  d.step('Return the newest, write it back');
  d.text(CO.x + CO.w / 2, 158, 'v2 > v1:\nclient gets v2', { pen: 'green', size: 15, bold: true });
  d.arrow(CO.x + CO.w - 10, CO.y + CO.h + 4, RX - CW / 2 - 6, mid(2) + 10, {
    pen: 'orange',
    thick: true,
    bend: 40,
  });
  d.text(276, 206, 'repair: put v2', { pen: 'orange', size: 15, bold: true });
  tag(2, 'v2', 'orange');

  d.step('Anti-entropy: compare Merkle roots');
  tree(TL, 'R1 tree', ['9f', 'a1', 'c4'], -1);
  tree(TR, 'R3 tree', ['3c', 'a1', 'e2'], 1);
  d.group(() => {
    node(TL, Y0, 50, '9f', 'red', 'red');
    node(TR, Y0, 50, '3c', 'red', 'red');
    d.text((TL + TR) / 2, Y0, 'roots ≠', { pen: 'red', size: 16, bold: true });
  });

  d.step('Descend only where hashes differ');
  d.group(() => {
    node(TL - 54, Y1, 44, 'a1', 'green', 'green');
    node(TR - 54, Y1, 44, 'a1', 'green', 'green');
    node(TL + 54, Y1, 44, 'c4', 'red', 'red');
    node(TR + 54, Y1, 44, 'e2', 'red', 'red');
  });
  d.group(() => {
    node(TL + 27, Y2, 48, '50–74', 'red', 'red', 14);
    node(TR + 27, Y2, 48, '50–74', 'red', 'red', 14);
  });
  d.text(260, 402, 'left halves match: skipped · sync only keys 50–74', { pen: 'ink', size: 15 });
};
