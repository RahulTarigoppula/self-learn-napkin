export const meta = { title: 'A lost response, a retry that charges twice, and an idempotency key that makes the retry safe', width: 520, height: 420 };

const CL = 58; // client lane
const API = 262; // API lane
const DB = 458; // database lane

export default (d) => {
  const req = (y, x1, x2, label, pen, o = {}) => d.arrow(x1, y, x2, y, { pen, label, size: 15, labelDy: -12, ...o });
  const lost = (y, label) =>
    d.group(() => {
      d.arrow(API - 4, y, CL + 4, y, { pen: 'red', dashed: true });
      d.line(152, y - 8, 168, y + 8, { pen: 'red', thick: true });
      d.line(152, y + 8, 168, y - 8, { pen: 'red', thick: true });
      d.text(184, y - 12, label, { pen: 'red', size: 15, anchor: 'start' });
    });

  d.step('A payment request');
  d.group(() => {
    d.rect(16, 18, 84, 34, { pen: 'blue', fill: 'blue', label: 'client', size: 16, bold: true });
    d.rect(204, 18, 116, 34, { pen: 'violet', fill: 'violet', label: 'payment API', size: 16, bold: true });
    d.line(DB - 34, 22, DB - 34, 50, { pen: 'green' });
    d.line(DB + 34, 22, DB + 34, 50, { pen: 'green' });
    d.arc(DB, 50, 68, 12, 90, 270, { pen: 'green' });
    d.ellipse(DB, 22, 68, 12, { pen: 'green', fill: 'green' });
    d.text(DB, 39, 'DB', { pen: 'green', size: 16, bold: true });
  });
  d.group(() => {
    for (const x of [CL, API, DB]) {
      d.line(x, 62, x, 238, { pen: 'muted', dashed: true, thin: true });
      d.line(x, 272, x, 408, { pen: 'muted', dashed: true, thin: true });
    }
  });
  d.group(() => {
    req(100, CL + 4, API - 4, 'POST /charges $50', 'blue');
    req(124, API + 4, DB - 4, 'insert charge #1', 'green');
  });

  d.step('The response is lost');
  lost(148, 'timeout');

  d.step('Blind retry: charged twice');
  d.group(() => {
    req(184, CL + 4, API - 4, 'retry same POST', 'blue');
    req(208, API + 4, DB - 4, 'insert charge #2', 'red', { thick: true });
  });
  d.text(360, 230, 'charged $100, not $50', { pen: 'red', size: 15, bold: true });

  d.step('Send an idempotency key');
  d.group(() => {
    d.line(16, 244, 504, 244, { pen: 'muted', thin: true });
    d.text(260, 260, 'with a client-made key k1 (a UUID)', { pen: 'muted', size: 15 });
  });
  d.group(() => {
    req(290, CL + 4, API - 4, 'POST, key = k1', 'blue');
    req(312, API + 4, DB - 4, 'charge #1 + save k1', 'green');
  });
  lost(336, 'lost again');

  d.step('Same key: replay the stored reply');
  d.group(() => {
    req(362, CL + 4, API - 4, 'retry, key = k1', 'blue');
    d.arrow(API + 4, 362, DB - 4, 362, { pen: 'orange', both: true, label: 'k1 found', size: 15, labelDy: -12 });
  });
  d.group(() => {
    req(400, API - 4, CL + 4, 'same 201, charge #1', 'green', { thick: true });
    d.text(360, 400, 'charged once', { pen: 'green', size: 16, bold: true });
  });
};
