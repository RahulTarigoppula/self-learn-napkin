export const meta = {
  title: 'Bayes theorem as a natural-frequency tree: 10,000 people, a 1 % disease and an imperfect test',
  width: 520,
  height: 420,
};

const ROOT_Y = 20;
const L1_Y = 108;
const L2_Y = 206;
const BOX = { rough: 0.7, size: 16 };

export default (d) => {
  d.step('Start with 10,000 people');
  d.rect(185, ROOT_Y, 150, 36, { ...BOX, pen: 'ink', label: '10,000 people', size: 17, bold: true });

  d.step('1 % have the disease: the prior');
  d.group(() => {
    d.arrow(232, ROOT_Y + 38, 140, L1_Y - 4, { pen: 'red' });
    d.text(166, 74, '1 %', { pen: 'red', size: 16, anchor: 'end' });
    d.rect(70, L1_Y, 140, 34, { ...BOX, pen: 'red', fill: 'red', label: '100 sick', bold: true });
  });
  d.group(() => {
    d.arrow(288, ROOT_Y + 38, 380, L1_Y - 4, { pen: 'green' });
    d.text(354, 74, '99 %', { pen: 'green', size: 16, anchor: 'start' });
    d.rect(310, L1_Y, 140, 34, { ...BOX, pen: 'green', fill: 'green', label: '9,900 healthy', bold: true });
  });

  d.step('Test the sick: 90 % sensitivity');
  d.group(() => {
    d.arrow(118, L1_Y + 36, 72, L2_Y - 4, { pen: 'red' });
    d.text(84, 172, '90 %', { pen: 'red', size: 15, anchor: 'end' });
    d.rect(22, L2_Y, 100, 34, { ...BOX, pen: 'red', fill: 'red', label: '90 test +', bold: true });
  });
  d.group(() => {
    d.arrow(162, L1_Y + 36, 190, L2_Y - 4, { pen: 'muted' });
    d.text(186, 172, '10 %', { pen: 'muted', size: 15, anchor: 'start' });
    d.rect(140, L2_Y, 100, 34, { ...BOX, pen: 'muted', label: '10 test −' });
  });

  d.step('Test the healthy: 9 % false positives');
  d.group(() => {
    d.arrow(356, L1_Y + 36, 326, L2_Y - 4, { pen: 'orange' });
    d.text(332, 172, '9 %', { pen: 'orange', size: 15, anchor: 'end' });
    d.rect(268, L2_Y, 112, 34, { ...BOX, pen: 'orange', fill: 'orange', label: '891 test +', bold: true });
  });
  d.group(() => {
    d.arrow(404, L1_Y + 36, 446, L2_Y - 4, { pen: 'muted' });
    d.text(436, 172, '91 %', { pen: 'muted', size: 15, anchor: 'start' });
    d.rect(388, L2_Y, 120, 34, { ...BOX, pen: 'muted', label: '9,009 test −' });
  });

  d.step('Keep only the positives');
  d.group(() => {
    d.line(72, L2_Y + 36, 200, 268, { pen: 'red', dashed: true });
    d.line(324, L2_Y + 36, 248, 268, { pen: 'orange', dashed: true });
  });
  d.highlight(84, 272, 352, 34);
  d.text(260, 289, '981 positives, only 90 are sick', { pen: 'ink', size: 17, bold: true });
  d.text(260, 324, 'P(sick | +) = 90 / 981 ≈ 9 %', { pen: 'red', size: 18, bold: true, mono: true });

  d.step('A second positive: the posterior becomes the prior');
  d.group(() => {
    d.text(260, 362, 'test positive again: odds × 10 each time', { pen: 'violet', size: 16 });
    d.text(260, 390, '1:99 → 10:99 (9 %) → 100:99 (50 %)', { pen: 'violet', size: 16, mono: true, bold: true });
  });
};
