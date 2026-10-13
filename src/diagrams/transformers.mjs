export const meta = {
  title: 'A decoder-only Transformer: tokens, embeddings plus positions, N blocks of attention and feed-forward, next-token softmax, causal mask',
  width: 520,
  height: 420,
};

const COLS = [95, 180, 265];
const TOKENS = ['The', 'cat', 'sat'];
const EMB_Y = 340;
const BOX = { rough: 0.6, size: 15 };

export default (d) => {
  d.step('Tokens become vectors');
  d.group(() => {
    COLS.forEach((x, i) => {
      d.rect(x - 28, 382, 56, 26, { ...BOX, pen: 'ink', label: TOKENS[i] });
      d.arrow(x, 380, x, EMB_Y + 14, { pen: 'blue', headSize: 7 });
      d.rect(x - 22, EMB_Y - 12, 44, 24, { ...BOX, pen: 'blue', fill: 'blue', label: `x${'₁₂₃'[i]}` });
    });
    d.text(362, 395, 'embedding lookup', { pen: 'blue', size: 15, anchor: 'start' });
  });

  d.step('Add position information');
  d.group(() => {
    COLS.forEach((x, i) => d.text(x + 26, EMB_Y, `+p${'₁₂₃'[i]}`, { pen: 'orange', size: 15, bold: true, anchor: 'start' }));
    d.text(362, EMB_Y, '+ positional', { pen: 'orange', size: 15, anchor: 'start' });
    d.text(362, EMB_Y + 20, '   encoding', { pen: 'orange', size: 15, anchor: 'start' });
  });

  d.step('Self-attention: tokens exchange information');
  d.rect(36, 118, 300, 196, { pen: 'violet', dashed: true, rough: 0.5 });
  d.group(() => {
    COLS.forEach((x) => d.arrow(x, EMB_Y - 14, x, 300, { pen: 'ink', headSize: 7 }));
    d.rect(64, 264, 260, 34, { ...BOX, pen: 'red', fill: 'red', label: 'multi-head self-attention', bold: true });
    d.rect(64, 228, 260, 24, { ...BOX, pen: 'muted', label: 'add & layer norm', size: 14 });
    d.poly(
      [
        [50, 318],
        [50, 240],
        [62, 240],
      ],
      { pen: 'muted', rough: 0.5 },
    );
  });
  d.text(348, 272, 'every token looks', { pen: 'red', size: 15, anchor: 'start' });
  d.text(348, 292, 'at every token: n²', { pen: 'red', size: 15, anchor: 'start' });

  d.step('Feed-forward, then repeat N times');
  d.group(() => {
    d.rect(64, 172, 260, 34, { ...BOX, pen: 'green', fill: 'green', label: 'feed-forward (each token)', bold: true });
    d.rect(64, 136, 260, 24, { ...BOX, pen: 'muted', label: 'add & layer norm', size: 14 });
    d.poly(
      [
        [50, 222],
        [50, 148],
        [62, 148],
      ],
      { pen: 'muted', rough: 0.5 },
    );
  });
  d.text(348, 196, '× N blocks', { pen: 'violet', size: 18, bold: true, anchor: 'start' });
  d.text(348, 218, '(12 in GPT-2 small)', { pen: 'muted', size: 14, anchor: 'start' });

  d.step('Predict the next token');
  d.group(() => {
    d.arrow(265, 116, 265, 92, { pen: 'ink', headSize: 7 });
    d.rect(150, 62, 180, 28, { ...BOX, pen: 'blue', fill: 'blue', label: 'linear + softmax' });
    d.text(240, 30, 'next token after "sat" → "on"', { pen: 'blue', size: 15, bold: true });
  });

  d.step('Causal mask: no peeking ahead');
  d.group(() => {
    const GX = 410;
    const GY = 50;
    const C = 24;
    for (let r = 0; r < 3; r++) {
      d.text(GX - 6, GY + r * C + C / 2, TOKENS[r], { pen: 'ink', size: 13, anchor: 'end' });
      for (let c = 0; c < 3; c++) {
        const ok = c <= r;
        d.rect(GX + c * C, GY + r * C, C, C, {
          pen: ok ? 'green' : 'red',
          fill: ok ? 'green' : undefined,
          label: ok ? '✓' : '×',
          size: 14,
          rough: 0.4,
        });
      }
    }
    d.text(GX + 36, GY + 3 * C + 16, 'row i sees 1 … i', { pen: 'ink', size: 14 });
  });
};
