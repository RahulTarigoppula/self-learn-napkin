export const meta = {
  title: 'LRU cache: hash map plus doubly linked list, capacity 2',
  width: 520,
  height: 410,
};

const LX = 104; // list starts here
const SW = 28; // sentinel width
const NW = 46; // node width
const GAP = 30; // room for the ⇄ arrow
const H = 30; // box height
const MX = 424; // map column

/** Draw one list state: H ⇄ nodes ⇄ T. Returns the x of each node's centre. */
function list(d, y, nodes) {
  const centres = [];
  d.group(() => {
    let x = LX;
    d.rect(x, y - H / 2, SW, H, {
      pen: 'muted',
      rough: 0.6,
      single: true,
      label: 'H',
      size: 15,
      textPen: 'muted',
    });
    x += SW;
    for (const n of nodes) {
      d.arrow(x + 3, y, x + GAP - 3, y, { pen: 'muted', both: true, thin: true, headSize: 7 });
      x += GAP;
      d.rect(x, y - H / 2, NW, H, {
        pen: n.pen ?? 'blue',
        fill: n.pen ?? 'blue',
        rough: 0.6,
        single: true,
        label: n.label,
        size: 16,
        bold: true,
      });
      centres.push(x + NW / 2);
      x += NW;
    }
    d.arrow(x + 3, y, x + GAP - 3, y, { pen: 'muted', both: true, thin: true, headSize: 7 });
    x += GAP;
    d.rect(x, y - H / 2, SW, H, {
      pen: 'muted',
      rough: 0.6,
      single: true,
      label: 'T',
      size: 15,
      textPen: 'muted',
    });
  });
  return centres;
}

const op = (d, y, text, pen = 'ink') => d.text(14, y, text, { pen, size: 16, bold: true, anchor: 'start' });
const keys = (d, y, text) => d.text(MX, y, text, { pen: 'violet', size: 16, anchor: 'start' });

export default (d) => {
  d.step('A map for finding, a list for ordering');
  d.text(LX, 26, 'front: most recent … back: least recent', { pen: 'muted', size: 15, anchor: 'start' });
  d.text(MX, 26, 'map keys', { pen: 'violet', size: 15, anchor: 'start' });
  op(d, 60, 'empty', 'muted');
  d.text(14, 80, 'capacity 2', { pen: 'muted', size: 14, anchor: 'start' });
  list(d, 66, []);
  keys(d, 66, '{ }');

  d.step('put 1, then put 2 at the front');
  d.group(() => {
    op(d, 118, 'put(1,A)');
    keys(d, 118, '{1}');
  });
  list(d, 118, [{ label: '1:A' }]);
  d.group(() => {
    op(d, 166, 'put(2,B)');
    keys(d, 166, '{1, 2}');
  });
  list(d, 166, [{ label: '2:B' }, { label: '1:A' }]);

  d.step('get 1: a hit moves it to the front');
  d.group(() => {
    op(d, 228, 'get(1)');
    d.text(14, 248, '→ A', { pen: 'green', size: 15, anchor: 'start' });
    keys(d, 228, '{1, 2}');
  });
  const c = list(d, 228, [{ label: '1:A', pen: 'orange' }, { label: '2:B' }]);
  d.arrow(LX + SW + 2 * GAP + NW + NW / 2, 184, c[0] + 6, 210, { pen: 'orange', thick: true, bend: -10 });

  d.step('put 3: full, so evict the tail');
  d.group(() => {
    op(d, 300, 'put(3,C)');
    keys(d, 300, '{1, 3}');
  });
  const c2 = list(d, 300, [{ label: '3:C', pen: 'orange' }, { label: '1:A' }]);
  d.group(() => {
    const x = 364;
    d.rect(x, 285, NW, H, {
      pen: 'red',
      fill: 'red',
      rough: 0.6,
      single: true,
      label: '2:B',
      size: 16,
      bold: true,
    });
    d.line(x - 4, 281, x + NW + 4, 319, { pen: 'red', thick: true });
    d.text(x + NW / 2, 334, 'evicted', { pen: 'red', size: 15 });
  });

  d.step('Every operation is O(1)');
  d.group(() => {
    d.text(14, 362, 'map', { pen: 'violet', size: 16, bold: true, anchor: 'start' });
    for (const [k, x] of [
      ['3', c2[0]],
      ['1', c2[1]],
    ]) {
      d.rect(x - 15, 348, 30, 28, {
        pen: 'violet',
        rough: 0.6,
        single: true,
        label: k,
        size: 16,
        bold: true,
      });
      d.arrow(x, 346, x, 319, { pen: 'violet', thick: true });
    }
  });
  d.text(14, 396, 'find the node via the map, move or drop it in the list', {
    pen: 'violet',
    size: 15,
    anchor: 'start',
  });
};
