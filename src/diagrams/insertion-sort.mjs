export const meta = {
  title: 'Insertion sort on [5,3,8,1,9,2,7,4], one insertion per row',
  width: 520,
  height: 420,
};

const START = [5, 3, 8, 1, 9, 2, 7, 4];
const CW = 38;
const CH = 32;
const X0 = 24;
const Y0 = 16;
const DY = 42;
const NX = 342; // note column

/** Run insertion sort and record, for every insertion, the array plus where the key landed. */
function trace() {
  const a = [...START];
  const rows = [{ a: [...a], i: 0, pos: 0, shifts: 0 }];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    rows.push({ a: [...a], i, pos: j + 1, shifts: i - (j + 1) });
  }
  return rows;
}

/** Draw one row: green sorted prefix, orange key, blue cells that just shifted right, plain unsorted tail. */
function row(d, k, r, label, note, notePen = 'muted') {
  const y = Y0 + k * DY;
  const pens = r.a.map((_, idx) => {
    if (k > 0 && idx === r.pos) return 'orange';
    if (k > 0 && idx > r.pos && idx <= r.i) return 'blue';
    return idx <= r.i ? 'green' : 'ink';
  });
  d.group(() => {
    // One outline per run of same-coloured cells plus thin dividers: same look, half the bytes.
    for (let s = 0; s < pens.length; ) {
      let e = s;
      while (e + 1 < pens.length && pens[e + 1] === pens[s]) e++;
      const pen = pens[s];
      d.rect(X0 + s * CW, y, (e - s + 1) * CW, CH, {
        pen,
        fill: pen === 'ink' ? undefined : pen,
        rough: 0.6,
        single: true,
      });
      for (let c = s + 1; c <= e; c++)
        d.line(X0 + c * CW, y, X0 + c * CW, y + CH, { pen, rough: 0.4, single: true });
      s = e + 1;
    }
    r.a.forEach((v, idx) =>
      d.text(X0 + idx * CW + CW / 2, y + CH / 2, String(v), { pen: pens[idx], size: 18, bold: true }),
    );
    d.text(NX, y + CH / 2, label ? `${label}: ${note}` : note, { pen: notePen, size: 16, anchor: 'start' });
  });
}

export default (d) => {
  const rows = trace();
  const shiftNote = (r) => (r.shifts === 1 ? '1 shift' : `${r.shifts} shifts`);

  d.step('One value is already a sorted prefix');
  row(d, 0, rows[0], '', 'sorted prefix [5]', 'green');

  d.step('Insert 3: shift the 5 right, drop 3 in');
  row(d, 1, rows[1], 'key 3', shiftNote(rows[1]), 'blue');

  d.step('8 stays put; 1 slides past three values');
  row(d, 2, rows[2], 'key 8', '0 shifts', 'muted');
  row(d, 3, rows[3], 'key 1', shiftNote(rows[3]), 'blue');

  d.step('9, then 2, then 7');
  row(d, 4, rows[4], 'key 9', '0 shifts', 'muted');
  row(d, 5, rows[5], 'key 2', shiftNote(rows[5]), 'blue');
  row(d, 6, rows[6], 'key 7', shiftNote(rows[6]), 'blue');

  d.step('Insert 4: sorted after 14 shifts');
  row(d, 7, rows[7], 'key 4', shiftNote(rows[7]), 'blue');
  d.text(X0, 368, 'total: 14 shifts = 14 inversions, 19 compares', {
    pen: 'red',
    size: 16,
    bold: true,
    anchor: 'start',
  });

  d.step('Nearly sorted input costs about n');
  d.text(X0, 398, '[1 2 3 5 4 6 7 8]: 1 shift, 8 compares → O(n)', {
    pen: 'green',
    size: 16,
    anchor: 'start',
  });
};
