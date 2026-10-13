// Runs FIRST in `npm run build`: validates every card's frontmatter and provenance in ~1 s, so bad
// content fails fast and readably. Also writes src/generated/credits.json (de-duplicated sources).
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { ALLOWED_LICENCES, BANNED_HOSTS, cardSchema } from '../src/content/schema.mjs';

const MAX_STORY_WORDS = 700; // tldr + analogy + story + key ideas: the 3-minute layer
const MIN_DEEP_WORDS = 250; // the deep dive (markdown body)
const MAX_DEEP_WORDS = 1800;

/** Split a markdown file into { data, body }. */
export function splitFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error('missing frontmatter');
  return { data: parseYaml(m[1]) ?? {}, body: m[2] ?? '' };
}

const words = (s) => (s.match(/[A-Za-z0-9][\w'’-]*/g) ?? []).length;

/**
 * Lint a set of cards. `cards` is [{ id, file, data, body }].
 * Returns a list of human-readable problems (empty = green).
 */
export function lintCards(cards, { numbers, diagramExists, griddles, warnings = [] }) {
  const problems = [];
  const ids = new Set(cards.map((c) => c.id));
  const seenNumbers = new Map();
  for (const c of cards) {
    const p = (msg) => problems.push(`${c.file}: ${msg}`);
    for (const s of c.data.sources ?? []) {
      const lic = String(s?.licence ?? '');
      if (/NC|ND|SA/i.test(lic) || !ALLOWED_LICENCES.includes(lic)) p(`licence "${lic}" is not allowed`);
      const url = String(s?.url ?? '');
      if (BANNED_HOSTS.some((h) => url.replace(/^https?:\/\/(www\.)?/, '').startsWith(h)))
        p(`banned source host in ${url}`);
    }
    const parsed = cardSchema.safeParse(c.data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) p(`${issue.path.join('.') || '(card)'}: ${issue.message}`);
      continue;
    }
    const d = parsed.data;
    if (d.track !== c.id.split('/')[0]) p(`track "${d.track}" does not match its folder`);
    const n = numbers[c.id];
    if (n === undefined)
      p('no entry in src/content/numbers.json (add it to its track yaml, then npm run number)');
    else if (seenNumbers.has(n)) p(`number ${n} is already used by ${seenNumbers.get(n)}`);
    else seenNumbers.set(n, c.id);
    const dg = diagramExists(d.diagram);
    if (!dg) p(`diagram "${d.diagram}" has no public/diagrams/${d.diagram}.json (run npm run diagrams)`);
    else if (dg.steps.length !== d.story.length)
      p(`story has ${d.story.length} scenes but diagram "${d.diagram}" has ${dg.steps.length} steps`);
    for (const r of [...d.related, ...d.prereqs]) {
      if (ids.has(r)) continue;
      // A planned syllabus topic (it has a number) that is not written yet is only a warning.
      if (numbers[r] !== undefined)
        warnings.push(`${c.file}: related/prereq "${r}" is planned but not written yet`);
      else p(`related/prereq "${r}" does not exist`);
    }
    for (const r of d.prereqs)
      if (numbers[r] !== undefined && n !== undefined && numbers[r] > n)
        p(`prereq "${r}" comes later in the syllabus (No. ${numbers[r]} > ${n}); reorder the track yaml`);
    if (d.griddle && !griddles.includes(d.griddle)) p(`griddle "${d.griddle}" is not a known visualiser`);
    const quick = words([d.tldr, d.analogy ?? '', ...d.story.map((s) => s.text), ...d.keyIdeas].join(' '));
    if (quick > MAX_STORY_WORDS) p(`${quick} words in the story layer (max ${MAX_STORY_WORDS})`);
    const deep = words(c.body.replace(/```[\s\S]*?```/g, ' '));
    if (deep < MIN_DEEP_WORDS) p(`deep dive has ${deep} words (min ${MIN_DEEP_WORDS})`);
    if (deep > MAX_DEEP_WORDS) p(`deep dive has ${deep} words (max ${MAX_DEEP_WORDS})`);
    if (!/^##\s/m.test(c.body)) p('deep dive needs ## section headings');
  }
  return problems;
}

export const GRIDDLES = [
  'bubble-sort',
  'insertion-sort',
  'merge-sort',
  'binary-search',
  'bfs-grid',
  'hash-chaining',
  'hash-ring',
  'quorum',
  'token-bucket',
  'lru-cache',
  'gradient-descent',
  'threshold',
  'bst',
  'k-means',
  'bloom-filter',
  'linear-fit',
  'quicksort',
  'two-pointers',
  'sliding-window',
  'monotonic-stack',
  'heap',
  'union-find',
  'lcs',
  'edit-distance',
  'knapsack',
  'dijkstra',
  'topological-sort',
  'mst',
  'load-balancer',
  'circuit-breaker',
  'attention',
];

export async function loadCards(root = 'src/content/cards') {
  const out = [];
  for (const track of await readdir(root)) {
    const dir = path.join(root, track);
    for (const f of await readdir(dir)) {
      if (!f.endsWith('.md')) continue;
      const file = path.join(dir, f).replaceAll('\\', '/');
      const { data, body } = splitFrontmatter(await readFile(file, 'utf8'));
      out.push({ id: `${track}/${f.replace(/\.md$/, '')}`, file, data, body });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export function credits(cards) {
  const byUrl = new Map();
  for (const c of cards)
    for (const s of c.data.sources ?? [])
      if (s.licence !== 'Own work' && !byUrl.has(s.url))
        byUrl.set(s.url, { name: s.name, url: s.url, licence: s.licence });
  return [...byUrl.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const t0 = performance.now();
  const cards = await loadCards();
  const numbers = JSON.parse(await readFile('src/content/numbers.json', 'utf8'));
  const manifests = new Map();
  for (const c of cards) {
    const f = `public/diagrams/${c.data.diagram}.json`;
    if (existsSync(f)) manifests.set(c.data.diagram, JSON.parse(await readFile(f, 'utf8')));
  }
  const diagramExists = (name) => manifests.get(name) ?? null;
  const warnings = [];
  const problems = lintCards(cards, { numbers, diagramExists, griddles: GRIDDLES, warnings });
  if (warnings.length) console.warn(`! ${warnings.length} link(s) to planned topics (hidden until written)`);
  await mkdir('src/generated', { recursive: true });
  await writeFile('src/generated/credits.json', `${JSON.stringify(credits(cards), null, 2)}\n`);
  if (problems.length) {
    console.error(`\n✗ content lint: ${problems.length} problem(s)\n`);
    for (const p of problems) console.error(`  • ${p}`);
    process.exit(1);
  }
  const by = (t) => cards.filter((c) => c.id.startsWith(`${t}/`)).length;
  console.log(
    `✓ content lint: ${cards.length} napkins (dsa ${by('dsa')} · sysdesign ${by('sysdesign')} · ds ${by('ds')}) in ${Math.round(performance.now() - t0)} ms`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
