/** A tiny full-text search over the napkins. ~25–120 documents fit in one small JSON file, so a
 *  hand-rolled ranker is faster, smaller and more predictable than a WASM search engine. */
export interface SearchDoc {
  id: string;
  number: number;
  title: string;
  track: 'dsa' | 'sysdesign' | 'ds';
  tags: string[];
  tldr: string;
  text: string;
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  excerpt: string;
  /** [start, end) ranges inside `excerpt` to highlight */
  marks: [number, number][];
}

export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9²ⁿ+#]+/g, ' ')
    .trim();

export const terms = (q: string): string[] => [
  ...new Set(
    normalize(q)
      .split(' ')
      .filter((t) => t.length > 0),
  ),
];

const words = (s: string): string[] => normalize(s).split(' ').filter(Boolean);

/** Score one field: exact word 3, prefix 2, substring 1 — per query term, best match only. */
function fieldScore(fieldWords: readonly string[], t: string): number {
  let best = 0;
  for (const w of fieldWords) {
    if (w === t) return 3;
    if (w.startsWith(t)) best = Math.max(best, 2);
    else if (t.length >= 3 && w.includes(t)) best = Math.max(best, 1);
  }
  return best;
}

interface Prepared {
  doc: SearchDoc;
  title: string[];
  tags: string[];
  tldr: string[];
  text: string[];
  num: string;
}

export function prepare(docs: readonly SearchDoc[]): Prepared[] {
  return docs.map((doc) => ({
    doc,
    title: words(doc.title),
    tags: doc.tags.flatMap(words),
    tldr: words(doc.tldr),
    text: words(doc.text),
    num: String(doc.number).padStart(3, '0'),
  }));
}

export function excerptFor(
  text: string,
  qs: readonly string[],
  radius = 70,
): { excerpt: string; marks: [number, number][] } {
  const lower = text.toLowerCase();
  let at = -1;
  for (const q of qs) {
    const i = lower.indexOf(q);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  const start = at === -1 ? 0 : Math.max(0, at - radius);
  const end = Math.min(text.length, start + radius * 2);
  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = `…${excerpt}`;
  if (end < text.length) excerpt = `${excerpt}…`;
  const marks: [number, number][] = [];
  const el = excerpt.toLowerCase();
  for (const q of qs) {
    if (q.length < 2) continue;
    let i = el.indexOf(q);
    while (i !== -1) {
      marks.push([i, i + q.length]);
      i = el.indexOf(q, i + q.length);
    }
  }
  marks.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const m of marks) {
    const lastM = merged[merged.length - 1];
    if (lastM && m[0] <= lastM[1]) lastM[1] = Math.max(lastM[1], m[1]);
    else merged.push([m[0], m[1]]);
  }
  return { excerpt, marks: merged };
}

/** Every query term must match somewhere; title and tags weigh most. */
export function search(index: readonly Prepared[], query: string, limit = 8): SearchHit[] {
  const qs = terms(query);
  if (qs.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const p of index) {
    let score = 0;
    let all = true;
    for (const t of qs) {
      const s =
        (/^\d+$/.test(t) && p.num.includes(t.padStart(3, '0')) ? 12 : 0) +
        fieldScore(p.title, t) * 6 +
        fieldScore(p.tags, t) * 4 +
        fieldScore(p.tldr, t) * 2 +
        fieldScore(p.text, t);
      if (s === 0) all = false;
      score += s;
    }
    if (!all || score === 0) continue;
    const source = qs.some((q) => p.doc.tldr.toLowerCase().includes(q)) ? p.doc.tldr : p.doc.text;
    hits.push({ doc: p.doc, score, ...excerptFor(source, qs) });
  }
  return hits.sort((a, b) => b.score - a.score || a.doc.number - b.doc.number).slice(0, limit);
}
