export const meta = { title: 'Batch, stochastic and mini-batch gradient descent paths, epoch arithmetic, a warmup-then-decay schedule and momentum', width: 520, height: 420 };

// Loss contours (top-left) centred on the minimum.
const CX = 175;
const CY = 124;
const ell = (t, k = 1) => [CX + 150 * k * Math.cos((t * Math.PI) / 180), CY + 84 * k * Math.sin((t * Math.PI) / 180)];

// Learning-rate schedule (bottom-left): steps 0..1 across, η 0..1 up.
const sx = (s) => 40 + 196 * s;
const sy = (e) => 396 - 74 * e;
const lr = (s) => (s < 0.1 ? s / 0.1 : 0.5 * (1 + Math.cos((Math.PI * (s - 0.1)) / 0.9)));

// Narrow valley (bottom-right).
const VX = 392;
const VY = 370;

export default (d) => {
  d.step('Batch: exact gradient, smooth path');
  d.group(() => {
    for (const [w, h] of [[300, 168], [206, 116], [120, 66], [44, 22]]) d.ellipse(CX, CY, w, h, { pen: 'muted', single: true, rough: 0.8 });
  });
  d.curve([ell(-150), [75, 105], [105, 117], [135, 122], [CX, CY]], { pen: 'blue', thick: true, rough: 0.5 });
  d.text(340, 44, 'batch: all rows\n1 exact step / epoch', { pen: 'blue', size: 15, anchor: 'start' });

  d.step('SGD: one row per step');
  d.poly([ell(140), [80, 162], [86, 182], [104, 158], [102, 146], [124, 164], [132, 138], [146, 152], [150, 128], [166, 142], [170, 120], [186, 136], [178, 124], [190, 128]], { pen: 'red', rough: 0.5 });
  d.text(340, 104, 'SGD: 1 row per step\n10,000 steps / epoch', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Mini-batch: the middle ground');
  d.poly([ell(-30), [286, 104], [272, 98], [254, 114], [238, 110], [221, 122], [206, 119], [192, 127], [CX + 4, CY]], { pen: 'violet', thick: true, rough: 0.5 });
  d.text(340, 164, 'mini-batch: 100 rows\n100 steps / epoch', { pen: 'violet', size: 15, anchor: 'start', bold: true });

  d.step('Epochs, batches and steps');
  // The epoch bar: 100 cells of 4.6 px, one per batch, drawn as a single square-wave path.
  d.group(() => {
    d.rect(30, 228, 460, 20, { pen: 'muted', rough: 0.5, single: true });
    const comb = [];
    for (let i = 1; i < 100; i++) {
      const x = 30 + 4.6 * i;
      comb.push(i % 2 ? [x, 230] : [x, 246], i % 2 ? [x, 246] : [x, 230]);
    }
    d.poly(comb, { pen: 'muted', thin: true, rough: 0.2, single: true });
  });
  d.group(() => {
    d.rect(30, 228, 4.6, 20, { pen: 'violet', fill: 'violet', thick: true, rough: 0.2, single: true });
    d.text(30, 216, '1 batch = 100 rows', { pen: 'violet', size: 14, anchor: 'start' });
  });
  d.text(260, 266, '10,000 rows ÷ 100 per batch = 100 steps = 1 epoch', { pen: 'violet', size: 15 });

  d.step('Learning-rate schedule: warm up, then decay');
  d.group(() => {
    d.line(sx(0), sy(0), sx(1.04), sy(0), { pen: 'muted', single: true });
    d.line(sx(0), sy(0), sx(0), sy(1.12), { pen: 'muted', single: true });
    d.text(sx(0) - 8, sy(1), 'η', { pen: 'muted', size: 15, anchor: 'end' });
    d.text(sx(1.04), sy(0) + 13, 'step', { pen: 'muted', size: 14, anchor: 'end' });
  });
  d.curve(Array.from({ length: 31 }, (_, i) => [sx(i / 30), sy(lr(i / 30))]), { pen: 'orange', thick: true, rough: 0.5 });
  d.group(() => {
    d.text(sx(0.12), sy(1.24), 'warmup', { pen: 'orange', size: 14, anchor: 'start' });
    d.text(sx(0.56), sy(0.68), 'cosine decay', { pen: 'orange', size: 14, anchor: 'start' });
  });

  d.step('Momentum and Adam: smooth the zig-zag');
  d.group(() => {
    for (const [w, h] of [[220, 64], [146, 42], [74, 22]]) d.ellipse(VX, VY, w, h, { pen: 'muted', single: true, rough: 0.8 });
  });
  d.poly([[292, 356], [304, 386], [318, 352], [332, 384], [346, 356], [360, 380], [374, 360], [388, 374], [VX, VY]], { pen: 'orange', rough: 0.5 });
  d.curve([[292, 356], [318, 372], [352, 372], [VX, VY]], { pen: 'green', thick: true, rough: 0.5 });
  d.group(() => {
    d.text(286, 300, 'plain SGD: zig-zags', { pen: 'orange', size: 14, anchor: 'start' });
    d.text(286, 318, 'momentum / Adam: smooth', { pen: 'green', size: 14, anchor: 'start', bold: true });
  });
};
