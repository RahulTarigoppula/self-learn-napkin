export type ClozeSegment = { t: 'text'; v: string } | { t: 'blank'; v: string; i: number };

export class ClozeSyntaxError extends Error {
  constructor(public column: number) {
    super(`Unbalanced {{ at column ${column}`);
    this.name = 'ClozeSyntaxError';
  }
}

/** Split `a {{b}} c` into text and blank segments. Unbalanced braces throw with the column of the `{{`. */
export function parseCloze(text: string): ClozeSegment[] {
  const out: ClozeSegment[] = [];
  let pos = 0;
  let blank = 0;
  while (pos < text.length) {
    const open = text.indexOf('{{', pos);
    if (open === -1) {
      out.push({ t: 'text', v: text.slice(pos) });
      break;
    }
    const close = text.indexOf('}}', open + 2);
    const nextOpen = text.indexOf('{{', open + 2);
    if (close === -1 || (nextOpen !== -1 && nextOpen < close)) throw new ClozeSyntaxError(open);
    if (open > pos) out.push({ t: 'text', v: text.slice(pos, open) });
    out.push({ t: 'blank', v: text.slice(open + 2, close), i: blank++ });
    pos = close + 2;
  }
  return out;
}

export const blankCount = (segs: readonly ClozeSegment[]): number =>
  segs.filter((s) => s.t === 'blank').length;

/** Every blank becomes exactly four underscores. */
export const maskFront = (segs: readonly ClozeSegment[]): string =>
  segs.map((s) => (s.t === 'text' ? s.v : '____')).join('');

/** Blanks with an index greater than `i` stay masked. */
export const revealUpTo = (segs: readonly ClozeSegment[], i: number): string =>
  segs.map((s) => (s.t === 'text' || s.i <= i ? s.v : '____')).join('');

export const fillAll = (segs: readonly ClozeSegment[]): string => segs.map((s) => s.v).join('');
