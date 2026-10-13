/** The napkin's worked example: longest substring with no repeated letter. */
export const WINDOW_DEFAULT = 'abcbad';
export const WINDOW_MAX = 16;

export interface WindowFrame {
  L: number;
  /** Right edge just added, or -1 on the start frame. */
  R: number;
  /** Where the new character was last seen before this step (-1 = never). */
  prev: number;
  /** How the step went: grow, jump L past a repeat, or an old copy left of L (ignored). */
  kind: 'start' | 'grow' | 'jump' | 'stale';
  /** last-seen index per character, in first-seen order. */
  seen: readonly [string, number][];
  best: { start: number; len: number };
  /** Total moves of L so far. */
  lMoves: number;
  caption: string;
}

const show = (c: string) => (c === ' ' ? '␣' : c);

/** Longest substring without repeating characters, one frame per right-edge step. */
export function longestUniqueFrames(text: string): WindowFrame[] {
  const s = [...text];
  const seen = new Map<string, number>();
  let L = 0;
  let best = { start: 0, len: 0 };
  let lMoves = 0;
  const out: WindowFrame[] = [
    {
      L: 0,
      R: -1,
      prev: -1,
      kind: 'start',
      seen: [],
      best,
      lMoves: 0,
      caption: s.length ? 'empty window · R adds one character per step' : 'type a string to slide over',
    },
  ];
  s.forEach((ch, R) => {
    const prev = seen.get(ch) ?? -1;
    let kind: WindowFrame['kind'] = 'grow';
    let why: string;
    if (prev >= L) {
      kind = 'jump';
      lMoves += prev + 1 - L;
      L = prev + 1;
      why = `'${show(ch)}' was at [${prev}] inside the window → L jumps to ${L}`;
    } else if (prev >= 0) {
      kind = 'stale';
      why = `'${show(ch)}' was at [${prev}], left of L = ${L}: not in the window, ignore it`;
    } else {
      why = `'${show(ch)}' is new`;
    }
    seen.set(ch, R);
    const len = R - L + 1;
    const record = len > best.len;
    if (record) best = { start: L, len };
    const win = s
      .slice(L, R + 1)
      .map(show)
      .join('');
    out.push({
      L,
      R,
      prev,
      kind,
      seen: [...seen],
      best,
      lMoves,
      caption: `${why} · "${win}" length ${len}${record ? ' · new best!' : ''}`,
    });
  });
  return out;
}

/** Clean user input: at most WINDOW_MAX characters (code points), newlines dropped. */
export const clampText = (t: string): string => [...t.replace(/[\r\n\t]/g, '')].slice(0, WINDOW_MAX).join('');

/** Windows a brute force would examine: every substring. */
export const allWindows = (n: number): number => (n * (n + 1)) / 2;
