export const meta = {
  title: 'An array in memory: address arithmetic, cache lines, shifting, doubling and a row-major 2-D grid',
  width: 520,
  height: 420,
};

const X0 = 24;

// Row 1: a = [7, 2, 9, 4, 1] in a block of 6 slots starting at address 1000.
const CW = 50;
const R1 = 40; // top of row-1 cells
const CH = 40;
const cx = (i) => X0 + i * CW + CW / 2;

// Row 2: after insert(1, 5).
const R2 = 162;

// Row 3: the new block of 12 slots.
const W3 = 36;
const R3 = 250;
const H3 = 32;

// Row 4: 2 x 3 grid and its flat layout.
const G = 30;
const R4 = 326;

const cell = (d, x, y, w, h, label, o = {}) =>
  d.rect(x, y, w, h, { pen: 'ink', rough: 0.6, single: true, label, size: 18, bold: true, ...o });

const empty = (d, x, y, w, h) =>
  d.rect(x + 3, y + 3, w - 6, h - 6, { pen: 'muted', dashed: true, thin: true, rough: 0.5, single: true });

export default (d) => {
  d.step('One block, one formula');
  d.group(() => {
    [7, 2, 9, 4, 1].forEach((v, i) =>
      cell(d, X0 + i * CW, R1, CW, CH, String(v), i === 3 ? { pen: 'red', fill: 'red' } : {}),
    );
    empty(d, X0 + 5 * CW, R1, CW, CH);
    [0, 1, 2, 3, 4, 5].forEach((i) => d.text(cx(i), R1 - 12, String(i), { pen: 'muted', size: 14 }));
  });
  d.group(() => {
    [0, 1, 2, 3, 4, 5].forEach((i) =>
      d.text(cx(i), R1 + CH + 15, String(1000 + 4 * i), {
        pen: i === 3 ? 'red' : 'muted',
        size: 14,
        mono: true,
      }),
    );
  });
  d.text(338, R1 - 8, 'a[i] is at', { size: 16, anchor: 'start' });
  d.text(338, R1 + 16, '1000 + 4 × i', { size: 17, anchor: 'start', mono: true, bold: true });
  d.text(338, R1 + 44, 'a[3] → 1012', { pen: 'red', size: 17, anchor: 'start', mono: true });

  d.step('Neighbours arrive in one cache line');
  d.group(() => {
    d.line(X0 + 2, R1 + CH + 28, 496, R1 + CH + 28, { pen: 'blue', thick: true, rough: 0.6, dashed: true });
    d.line(X0 + 2, R1 + CH + 22, X0 + 2, R1 + CH + 34, { pen: 'blue', thick: true, rough: 0.4 });
    d.text(X0, R1 + CH + 46, 'one 64-byte cache line holds 16 ints, fetched together', {
      pen: 'blue',
      size: 15,
      anchor: 'start',
    });
  });

  d.step('Insert in the middle: shift the tail');
  d.group(() => {
    [7, 5, 2, 9, 4, 1].forEach((v, i) => {
      const o = i === 1 ? { pen: 'green', fill: 'green' } : i > 1 ? { pen: 'orange' } : {};
      cell(d, X0 + i * CW, R2, CW, CH, String(v), o);
    });
  });
  d.group(() => {
    for (let i = 4; i >= 1; i--)
      d.arrow(cx(i) + 4, R2 - 4, cx(i + 1) - 4, R2 - 4, { pen: 'orange', bend: -10, thin: true, rough: 0.4 });
  });
  d.text(338, R2 + 10, 'insert 5 at index 1:', { pen: 'green', size: 16, anchor: 'start' });
  d.text(338, R2 + 32, '4 values shift → O(n)', { pen: 'orange', size: 16, anchor: 'start' });

  d.step('Full? Allocate double and copy');
  d.text(X0, R3 - 14, 'append 8: no room → new block of 12, copy 6, write 8', {
    pen: 'muted',
    size: 15,
    anchor: 'start',
  });
  d.group(() => {
    [7, 5, 2, 9, 4, 1].forEach((v, i) =>
      cell(d, X0 + i * W3, R3, W3, H3, String(v), { pen: 'blue', fill: 'blue', size: 16 }),
    );
    cell(d, X0 + 6 * W3, R3, W3, H3, '8', { pen: 'orange', fill: 'orange', size: 16 });
    for (let i = 7; i < 12; i++) empty(d, X0 + i * W3, R3, W3, H3);
  });
  d.text(X0, R3 + H3 + 18, 'doubling: n appends copy < 2n values → O(1) amortised', {
    pen: 'orange',
    size: 15,
    anchor: 'start',
  });

  d.step('A 2-D grid is rows laid end to end');
  d.group(() => {
    [
      [1, 2, 3],
      [4, 5, 6],
    ].forEach((row, r) =>
      row.forEach((v, c) =>
        cell(d, X0 + c * G, R4 + r * G, G, G, String(v), {
          pen: r ? 'green' : 'violet',
          fill: r === 1 && c === 2 ? 'red' : undefined,
          size: 16,
        }),
      ),
    );
    d.text(X0 + 3 * G + 8, R4 + G / 2, 'row 0', { pen: 'violet', size: 14, anchor: 'start' });
    d.text(X0 + 3 * G + 8, R4 + G * 1.5, 'row 1', { pen: 'green', size: 14, anchor: 'start' });
  });
  d.arrow(170, R4 + 40, 200, R4 + 40, { pen: 'muted', thick: true });
  d.text(212, R4 + 4, 'g[r][c] → slot r × 3 + c', { size: 16, anchor: 'start', mono: true });
  d.group(() => {
    [1, 2, 3, 4, 5, 6].forEach((v, i) =>
      cell(d, 212 + i * G, R4 + 24, G, G, String(v), {
        pen: i < 3 ? 'violet' : 'green',
        fill: i === 5 ? 'red' : undefined,
        size: 16,
      }),
    );
    d.text(212 + 6 * G + 10, R4 + 40, 'one block', { pen: 'muted', size: 14, anchor: 'start' });
  });
  d.text(212 + 6 * G - 4, R4 + 72, 'g[1][2] → slot 1 × 3 + 2 = 5', { pen: 'red', size: 15, anchor: 'end' });
};
