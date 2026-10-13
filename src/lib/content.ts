import { type CollectionEntry, getCollection } from 'astro:content';
import numbers from '../content/numbers.json';

export type Card = CollectionEntry<'cards'>;
export type TrackId = 'dsa' | 'sysdesign' | 'ds';
export const TRACK_IDS: TrackId[] = ['dsa', 'sysdesign', 'ds'];

export const TRACK_SHORT: Record<TrackId, string> = {
  dsa: 'DSA',
  sysdesign: 'System Design',
  ds: 'Data Science',
};

const NUMBERS = numbers as Record<string, number>;

export function numberOf(id: string): number {
  const n = NUMBERS[id];
  if (n === undefined) throw new Error(`${id} has no napkin number in src/content/numbers.json`);
  return n;
}
export const pad3 = (n: number): string => String(n).padStart(3, '0');

export interface Track {
  id: TrackId;
  name: string;
  subtitle: string;
  blurb: string;
  cards: Card[];
}

let cache: { cards: Card[]; tracks: Track[] } | null = null;

/** All cards (track syllabus order) and tracks, validated once per build. */
export async function library(): Promise<{ cards: Card[]; tracks: Track[] }> {
  if (cache) return cache;
  const cards = await getCollection('cards');
  const byId = new Map(cards.map((c) => [c.id, c]));
  const trackEntries = await getCollection('tracks');
  const tracks: Track[] = TRACK_IDS.map((id) => {
    const t = trackEntries.find((e) => e.id === id);
    if (!t) throw new Error(`missing src/content/tracks/${id}.yaml`);
    // The syllabus may list topics that are not written yet; they are simply not shown.
    const ordered = t.data.order.map((cid) => byId.get(cid)).filter((c): c is Card => Boolean(c));
    const rest = cards
      .filter((c) => c.data.track === id && !t.data.order.includes(c.id))
      .sort((a, b) => numberOf(a.id) - numberOf(b.id));
    return {
      id,
      name: t.data.name,
      subtitle: t.data.subtitle,
      blurb: t.data.blurb,
      cards: [...ordered, ...rest],
    };
  });
  // Numbers are identity: a card without one fails the build. (Related links to topics that are not
  // written yet are dropped here; scripts/lint-licences.mjs is the strict gate for those.)
  for (const c of cards) numberOf(c.id);
  cache = { cards: tracks.flatMap((t) => t.cards), tracks };
  return cache;
}

export async function cardById(id: string): Promise<Card> {
  const { cards } = await library();
  const c = cards.find((x) => x.id === id);
  if (!c) throw new Error(`no card ${id}`);
  return c;
}

export async function existing(ids: readonly string[]): Promise<Card[]> {
  const { cards } = await library();
  return ids.map((i) => cards.find((c) => c.id === i)).filter((c): c is Card => Boolean(c));
}

export const slugOf = (c: Card): string => c.id.split('/')[1] ?? c.id;
