const STOP = new Set([
  'the',
  'a',
  'an',
  'of',
  'to',
  'in',
  'on',
  'by',
  'for',
  'is',
  'are',
  'and',
  'or',
  'with',
  'each',
  'its',
  'this',
  'that',
  'as',
  'at',
  'from',
  'it',
  'be',
]);

export interface Token {
  w: string;
  s: number;
  e: number;
}

export const tokenize = (sentence: string): Token[] =>
  [...sentence.matchAll(/[A-Za-z0-9()\-/²ⁿ]+/g)].map((m) => ({
    w: m[0],
    s: m.index ?? 0,
    e: (m.index ?? 0) + m[0].length,
  }));

export interface Blank {
  blank: string;
  start: number;
  end: number;
}

/** Choose the 1–3 token span that makes the best cloze blank: long, on-topic, a proper noun,
 *  acronym or Big-O, and not the subject of the sentence. */
export function pickBlank(sentence: string, hints: readonly string[]): Blank {
  const tokens = tokenize(sentence);
  if (tokens.length === 0) return { blank: '', start: 0, end: 0 };
  let best = { score: -1, i: 0, j: 0 };
  for (let i = 0; i < tokens.length; i++) {
    for (let len = 1; len <= 3 && i + len <= tokens.length; len++) {
      const span = tokens.slice(i, i + len);
      if (span.some((t) => STOP.has(t.w.toLowerCase()))) continue;
      const text = span
        .map((t) => t.w)
        .join(' ')
        .toLowerCase();
      let score = text.length;
      if (hints.some((h) => text.includes(h.toLowerCase()))) score += 6;
      if (/[A-Z0-9]/.test(span.map((t) => t.w).join(''))) score += 3;
      if (i === 0) score -= 2;
      if (score > best.score) best = { score, i, j: i + len - 1 };
    }
  }
  const first = tokens[best.i] as Token;
  const last = tokens[best.j] as Token;
  return { blank: sentence.slice(first.s, last.e), start: first.s, end: last.e };
}

/** Move one edge of the blank by one token (the learner's nudge before saving). */
export function nudgeBlank(sentence: string, b: Blank, edge: 'start' | 'end', dir: -1 | 1): Blank {
  const tokens = tokenize(sentence);
  let i = tokens.findIndex((t) => t.s === b.start);
  let j = tokens.findIndex((t) => t.e === b.end);
  if (i === -1 || j === -1) return b;
  if (edge === 'start') i = Math.min(j, Math.max(0, i + dir));
  else j = Math.max(i, Math.min(tokens.length - 1, j + dir));
  const first = tokens[i] as Token;
  const last = tokens[j] as Token;
  return { blank: sentence.slice(first.s, last.e), start: first.s, end: last.e };
}

/** The cloze text stored for a highlight: the sentence with the blank wrapped in {{…}}. */
export const toClozeText = (sentence: string, b: Blank): string =>
  `${sentence.slice(0, b.start)}{{${b.blank}}}${sentence.slice(b.end)}`;
