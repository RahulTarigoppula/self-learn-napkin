// npm run decks — turn every card's flashcards into public/decks/{dsa,sysdesign,ds,all}.json.
// Deck ids are sha1(slug + '|' + RAW question) — the contract that keeps a learner's history.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadCards } from './lint-licences.mjs';

const sha1 = (s) => createHash('sha1').update(s, 'utf8').digest('hex');
export const deckId = (slug, question) => sha1(`${slug}|${question}`);
export const maskFront = (text) => text.replace(/\{\{([^}]+)\}\}/g, '____');
export const fillAll = (text) => text.replace(/\{\{([^}]+)\}\}/g, '$1');

export function buildDecks(cards, numbers, generatedAt = new Date().toISOString()) {
  const items = [];
  const seen = new Set();
  for (const c of cards) {
    const d = c.data;
    for (const f of d.flashcards) {
      const question = f.kind === 'qa' ? f.q : f.text;
      const id = deckId(c.id, question);
      if (seen.has(id)) throw new Error(`${c.id}: duplicate flashcard id ${id} ("${question}")`);
      seen.add(id);
      const src = d.sources?.[0];
      items.push({
        id,
        slug: c.id,
        track: d.track,
        number: numbers[c.id],
        title: d.title,
        kind: f.kind,
        front: f.kind === 'qa' ? f.q : maskFront(f.text),
        back: f.kind === 'qa' ? f.a : fillAll(f.text),
        ...(f.kind === 'cloze' ? { cloze: f.text } : {}),
        ...(src ? { source: { name: src.name, licence: src.licence } } : {}),
      });
    }
  }
  const deck = (track, list) => ({
    track,
    generatedAt,
    cardCount: list.length,
    contentHash: sha1(
      list
        .map((i) => i.id)
        .sort()
        .join('\n'),
    ),
    items: list,
  });
  return {
    dsa: deck(
      'dsa',
      items.filter((i) => i.track === 'dsa'),
    ),
    sysdesign: deck(
      'sysdesign',
      items.filter((i) => i.track === 'sysdesign'),
    ),
    ds: deck(
      'ds',
      items.filter((i) => i.track === 'ds'),
    ),
    all: deck('all', items),
  };
}

const stripMd = (md) =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_>#-]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/** The documents for the in-app search (src/engine/search). */
export function buildSearchIndex(cards, numbers) {
  return cards.map((c) => ({
    id: c.id,
    number: numbers[c.id],
    title: c.data.title,
    track: c.data.track,
    tags: c.data.tags,
    tldr: c.data.tldr,
    text: stripMd(
      [...(c.data.story ?? []).map((s) => `${s.title ?? ''} ${s.text}`), c.data.analogy ?? '', c.body].join(
        ' ',
      ),
    ),
  }));
}

async function main() {
  const cards = await loadCards();
  const numbers = JSON.parse(await readFile('src/content/numbers.json', 'utf8'));
  const slugs = new Set();
  for (const c of cards) {
    if (slugs.has(c.id)) throw new Error(`duplicate slug ${c.id}`);
    slugs.add(c.id);
  }
  const decks = buildDecks(cards, numbers);
  await mkdir('public/decks', { recursive: true });
  for (const [name, deck] of Object.entries(decks))
    await writeFile(`public/decks/${name}.json`, JSON.stringify(deck));
  await writeFile('public/search-index.json', JSON.stringify(buildSearchIndex(cards, numbers)));
  console.log(`✓ decks: ${decks.all.cardCount} flashcards from ${cards.length} napkins`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
