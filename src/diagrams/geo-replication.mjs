export const meta = {
  title: 'Geo-replication: distance, active-passive, active-active and routing',
  width: 520,
  height: 420,
};

const COL = { us: 76, eu: 260, asia: 444 }; // column centres
const BW = 120; // region box width
const BT = 168; // region box top
const BH = 92; // region box height
const UY = 62; // user head centre

export default (d) => {
  const box = (cx, name, pen, dashed = false) => {
    d.rect(cx - BW / 2, BT, BW, BH, { pen, dashed, rough: 0.8, single: true });
    d.text(cx, BT + 16, name, { pen, size: 16, bold: true });
  };
  // call inside a d.group (groups do not nest)
  const db = (cx, pen) => {
    const top = BT + 56;
    d.line(cx - 22, top, cx - 22, top + 20, { pen, single: true });
    d.line(cx + 22, top, cx + 22, top + 20, { pen, single: true });
    d.arc(cx, top + 20, 44, 10, 90, 270, { pen, single: true });
    d.ellipse(cx, top, 44, 10, { pen, fill: pen });
  };
  const role = (cx, label, pen, fill) =>
    d.rect(cx - 46, BT + 27, 92, 20, { pen, fill, label, size: 14, bold: true, rough: 0.5, single: true });
  const user = (cx, name, pen) =>
    d.group(() => {
      d.text(cx, 38, name, { pen, size: 15, bold: true });
      d.circle(cx, UY, 18, { pen, fill: 'muted' });
      d.arc(cx, UY + 30, 34, 30, 270, 450, { pen });
    });

  d.step('Distance costs time');
  d.group(() => {
    box(COL.us, 'US East', 'blue');
    db(COL.us, 'blue');
  });
  d.group(() => {
    box(COL.eu, 'Europe', 'muted', true);
    box(COL.asia, 'Asia', 'muted', true);
  });
  user(COL.eu, 'Paris', 'ink');
  d.arrow(COL.eu - 22, 96, COL.us + 50, BT - 4, { pen: 'red', thick: true });
  d.text(14, 324, 'Paris → US East ≈ 6,200 km:\n≥ 62 ms every round trip', {
    pen: 'red',
    size: 15,
    anchor: 'start',
    bold: true,
  });
  d.text(14, 384, 'light in fibre ≈ 200,000 km/s\n→ about 1 ms RTT per 100 km', {
    pen: 'muted',
    size: 15,
    anchor: 'start',
  });

  d.step('Active-passive: copies near users');
  d.group(() => {
    role(COL.us, 'primary', 'blue', 'blue');
    for (const cx of [COL.eu, COL.asia]) {
      db(cx, 'violet');
      role(cx, 'replica', 'violet', 'paper');
    }
  });
  d.group(() => {
    d.arrow(COL.us + BW / 2 + 4, BT + 66, COL.eu - BW / 2 - 4, BT + 66, { pen: 'orange', dashed: true });
    d.arrow(COL.us, BT + BH + 4, COL.asia, BT + BH + 4, { pen: 'orange', dashed: true, bend: 22 });
    d.text(COL.eu, 296, 'async copies', { pen: 'orange', size: 15 });
  });
  d.group(() => {
    d.arrow(COL.eu + 18, 100, COL.eu + 18, BT - 4, { pen: 'green', thick: true });
    d.text(COL.eu + 28, 116, 'local read\n≈ 2 ms', { pen: 'green', size: 15, anchor: 'start' });
  });

  d.step('Active-active: every region takes writes');
  role(COL.eu, 'primary too', 'orange', 'orange');
  user(COL.us, 'New York', 'ink');
  d.group(() => {
    d.arrow(COL.us, 100, COL.us, BT - 4, { pen: 'orange', thick: true });
    d.text(COL.us - 8, 134, 'x = A', { pen: 'orange', size: 16, bold: true, anchor: 'end' });
  });
  d.group(() => {
    d.arrow(COL.eu - 6, 100, COL.eu - 6, BT - 4, { pen: 'orange', thick: true });
    d.text(COL.eu - 14, 134, 'x = B', { pen: 'orange', size: 16, bold: true, anchor: 'end' });
  });
  d.text(290, 324, 'same key, same moment,\ntwo regions: which wins?', {
    pen: 'red',
    size: 15,
    anchor: 'start',
    bold: true,
  });

  d.step('Resolve conflicts: LWW or CRDT');
  d.text(290, 384, 'LWW: later timestamp wins,\nthe other write is lost.\nCRDT: merge, nothing lost', {
    pen: 'green',
    size: 15,
    anchor: 'start',
  });

  d.step('Route users to the nearest region');
  user(COL.asia, 'Singapore', 'ink');
  d.arrow(COL.asia, 100, COL.asia, BT - 4, { pen: 'blue', thick: true });
  d.text(COL.asia - 10, 146, 'GeoDNS /\nanycast', { pen: 'blue', size: 15, anchor: 'end' });
};
