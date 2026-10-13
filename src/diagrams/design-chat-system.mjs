export const meta = {
  title: 'Chat system: phones on WebSockets to gateways, a chat service, session registry, message store, push notifier and presence',
  width: 520,
  height: 420,
};

const PH = { x: 18, w: 34, h: 54 }; // phone
const ALICE_Y = 66;
const BOB_Y = 268;
const LB = { x: 74, y: 60, w: 30, h: 268 };
const GW = { x: 128, w: 72, h: 46 };
const GW1_Y = 72;
const GW2_Y = 274;
const CHAT = { x: 232, y: 162, w: 88, h: 58 };
const STORE = { cx: 440, y: 168, w: 104, h: 50 };
const REG = { x: 360, y: 72, w: 140, h: 40 };

export default (d) => {
  const phone = (y, pen = 'ink', o = {}) =>
    d.group(() => {
      d.rect(PH.x, y, PH.w, PH.h, { pen, fill: 'muted', ...o });
      d.line(PH.x + 12, y + PH.h - 8, PH.x + PH.w - 12, y + PH.h - 8, { pen, single: true });
    });

  d.step('Every phone keeps a WebSocket open');
  phone(ALICE_Y);
  d.text(PH.x + PH.w / 2, ALICE_Y - 18, 'Alice', { pen: 'muted', size: 15 });
  phone(BOB_Y);
  d.text(PH.x + PH.w / 2, BOB_Y - 18, 'Bob', { pen: 'muted', size: 15 });
  d.rect(LB.x, LB.y, LB.w, LB.h, { pen: 'violet', fill: 'violet', label: 'LB', size: 15, bold: true });
  d.group(() => {
    d.rect(GW.x, GW1_Y, GW.w, GW.h, { pen: 'blue', fill: 'blue', label: 'GW 1', size: 16, bold: true });
    d.rect(GW.x, GW2_Y, GW.w, GW.h, { pen: 'blue', fill: 'blue', label: 'GW 2', size: 16, bold: true });
  });
  d.group(() => {
    for (const [py, gy] of [[ALICE_Y, GW1_Y], [BOB_Y, GW2_Y]]) {
      d.arrow(PH.x + PH.w + 3, py + 26, LB.x - 3, gy + 23, { pen: 'blue', both: true, headSize: 8 });
      d.arrow(LB.x + LB.w + 3, gy + 23, GW.x - 3, gy + 23, { pen: 'blue', both: true, headSize: 8 });
    }
  });
  d.text(GW.x + GW.w / 2, 232, 'WebSocket\ngateways', { pen: 'blue', size: 14 });

  d.step('Send: number it, store it, ack it');
  d.rect(CHAT.x, CHAT.y, CHAT.w, CHAT.h, { pen: 'ink', fill: 'paper', label: 'chat\nservice', size: 16, bold: true });
  d.arrow(GW.x + GW.w + 4, GW1_Y + GW.h - 4, CHAT.x + 8, CHAT.y - 4, { pen: 'blue', thick: true, label: '“hi”', labelDx: 14, labelDy: -8 });
  d.group(() => {
    const { cx, y, w, h } = STORE;
    const ln = { pen: 'ink', single: true };
    d.line(cx - w / 2, y, cx - w / 2, y + h, ln);
    d.line(cx + w / 2, y, cx + w / 2, y + h, ln);
    d.arc(cx, y + h, w, 14, 90, 270, ln);
    d.ellipse(cx, y, w, 14, { pen: 'ink', fill: 'muted' });
    d.text(cx, y + h / 2 + 4, 'messages', { size: 16, bold: true });
    d.text(cx, y + h + 30, 'key: (conv, seq)', { pen: 'muted', size: 14, mono: true });
  });
  d.arrow(CHAT.x + CHAT.w + 4, CHAT.y + CHAT.h / 2 + 6, STORE.cx - STORE.w / 2 - 6, CHAT.y + CHAT.h / 2 + 6, { pen: 'blue', label: 'seq 42', size: 14, mono: true });
  d.text(14, 22, '✓ sent', { pen: 'green', size: 15, anchor: 'start', bold: true });

  d.step('Deliver: find Bob’s gateway');
  d.group(() => {
    d.rect(REG.x, REG.y, REG.w, REG.h, { pen: 'orange', fill: 'orange', label: 'Bob → GW 2', size: 14, mono: true });
    d.text(REG.x + REG.w / 2, REG.y - 14, 'session registry', { pen: 'orange', size: 14 });
  });
  d.arrow(CHAT.x + CHAT.w - 10, CHAT.y - 4, REG.x - 4, REG.y + REG.h - 6, { pen: 'orange', both: true });
  d.arrow(CHAT.x + 8, CHAT.y + CHAT.h + 4, GW.x + GW.w + 4, GW2_Y + 6, { pen: 'blue', thick: true });
  d.text(PH.x + PH.w + 8, 344, '“hi” arrives', { pen: 'blue', size: 14, anchor: 'start' });
  d.text(78, 22, '✓✓ delivered', { pen: 'green', size: 15, anchor: 'start', bold: true });

  d.step('Groups: one copy per member');
  d.group(() => {
    d.rect(356, 278, 150, 44, { pen: 'violet', fill: 'violet', label: 'group 7:\nBob, Cy, Di', size: 14 });
  });
  d.arrow(CHAT.x + CHAT.w + 4, CHAT.y + CHAT.h - 4, 352, 290, { pen: 'violet' });

  d.step('Offline? Send a push notification');
  d.group(() => {
    d.rect(CHAT.x, 362, CHAT.w + 20, 40, { pen: 'red', fill: 'red', label: 'push notifier', size: 14, bold: true });
  });
  d.arrow(CHAT.x + 56, CHAT.y + CHAT.h + 4, CHAT.x + 56, 358, { pen: 'red' });
  d.arrow(CHAT.x - 4, 382, 122, 382, { pen: 'red', thick: true, label: 'Di is offline', labelDy: -14, size: 14 });
  d.group(() => {
    d.rect(80, 362, 26, 40, { pen: 'muted', fill: 'muted', fillStyle: 'hachure' });
    d.text(70, 382, 'Di', { pen: 'muted', size: 15, anchor: 'end' });
  });
  d.text(440, 360, 'on reconnect:\nfetch seq > last', { pen: 'red', size: 14 });

  d.step('Presence: heartbeats say who is online');
  d.rect(232, 16, 96, 42, { pen: 'green', fill: 'green', label: 'presence', size: 15, bold: true });
  d.arrow(GW.x + GW.w + 4, GW1_Y + 8, 228, 44, { pen: 'green', dashed: true });
  d.text(336, 30, 'heartbeat\nevery 30 s', { pen: 'green', size: 14, anchor: 'start' });
};
