export const meta = { title: 'Consistent hashing ring', width: 520, height: 360 };

const CX = 200;
const CY = 182;
const R = 122;

export default (d) => {
  const at = (deg, r = R) => d.at(CX, CY, r, deg);

  d.step('A ring of hash values');
  d.circle(CX, CY, R * 2, { pen: 'ink', thick: true });
  d.text(CX, CY - 12, '0 … 2^32−1', { pen: 'muted', size: 16, mono: true });
  d.text(CX, CY + 14, 'the end wraps\nback to 0', { pen: 'muted', size: 15 });

  d.step('Hash each server onto the ring');
  for (const [id, deg, pen] of [
    ['A', 40, 'blue'],
    ['B', 160, 'green'],
    ['C', 280, 'violet'],
  ]) {
    const [x, y] = at(deg);
    d.group(() => {
      d.rect(x - 15, y - 15, 30, 30, { pen, fill: pen, label: id, bold: true, size: 17 });
      d.text(...at(deg, R + (id === 'C' ? 42 : 36)), `hash(${id})`, { pen, size: 14 });
    });
  }

  d.step('Hash the key onto the same ring');
  d.group(() => {
    const [kx, ky] = at(108);
    d.dot(kx, ky, 14, { pen: 'red' });
    d.text(kx + 14, ky - 2, 'hash("cart:42")', { pen: 'red', size: 14, anchor: 'start' });
  });

  d.step('Walk clockwise to the next server');
  d.arcArrow(CX, CY, R - 20, 110, 153, { pen: 'red', thick: true });
  d.text(420, 92, 'first server\nclockwise owns\nthe key → B', { pen: 'red', size: 17 });

  d.step('Add a server: only one arc moves');
  d.group(() => {
    const [x, y] = at(220);
    d.rect(x - 15, y - 15, 30, 30, { pen: 'orange', fill: 'orange', label: 'D', bold: true, size: 17 });
    d.text(...at(220, R + 34), 'new', { pen: 'orange', size: 15 });
  });
  d.arc(CX, CY, R * 2 + 18, R * 2 + 18, 162, 218, { pen: 'orange', thick: true });
  d.text(420, 262, 'only keys between\nB and D move:\n≈ K/N, not all K', { pen: 'orange', size: 16 });
};
