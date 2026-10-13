import {
  BACKUP_SCHEMA,
  type Backup,
  mergeCards,
  mergeDays,
  mergeLogs,
  parseBackup,
} from '../engine/backup/schema';
import type { NapkinDB, ReviewCard, ReviewLogRow } from './dexie';

/** Rows in insertion (primary-key) order so identical databases export byte-identical files. */
export async function exportBackup(db: NapkinDB, appVersion: string, now = new Date()): Promise<string> {
  const settings = Object.fromEntries((await db.settings.toArray()).map((s) => [s.key, s.value]));
  const logs = (await db.logs.toArray()).map(({ id: _id, ...l }) => l);
  const data = {
    schema: BACKUP_SCHEMA,
    app: 'napkin',
    appVersion,
    exportedAt: now.toISOString(),
    cards: await db.cards.toArray(),
    logs,
    highlights: await db.highlights.toArray(),
    sessions: await db.sessions.toArray(),
    days: await db.days.toArray(),
    reads: await db.reads.toArray(),
    settings,
  };
  return JSON.stringify(data, null, 1);
}

/** Validate first; write nothing unless the whole file is valid. Returns an error message or null. */
export async function importBackup(db: NapkinDB, text: string): Promise<string | null> {
  const r = parseBackup(text);
  if (!r.ok) return r.error;
  const b: Backup = r.data;
  await db.transaction('rw', [db.cards, db.logs, db.highlights, db.sessions, db.days, db.reads], async () => {
    const cards = mergeCards(await db.cards.toArray(), b.cards as unknown as ReviewCard[]);
    await db.cards.bulkPut(cards);
    const mine = await db.logs.toArray();
    const merged = mergeLogs(mine, b.logs as unknown as ReviewLogRow[]);
    await db.logs.bulkAdd(merged.slice(mine.length).map(({ id: _id, ...l }) => l as ReviewLogRow));
    await db.highlights.bulkPut(b.highlights);
    await db.sessions.bulkPut(b.sessions);
    await db.days.bulkPut(mergeDays(await db.days.toArray(), b.days));
    const reads = new Map((await db.reads.toArray()).map((x) => [x.slug, x]));
    for (const x of b.reads)
      if (!reads.has(x.slug) || (reads.get(x.slug)?.readAt ?? 0) < x.readAt) reads.set(x.slug, x);
    await db.reads.bulkPut([...reads.values()]);
  });
  return null;
}

export async function wipeProgress(db: NapkinDB): Promise<void> {
  await db.transaction(
    'rw',
    [db.cards, db.logs, db.highlights, db.sessions, db.days, db.reads, db.settings],
    async () => {
      await Promise.all([
        db.cards.clear(),
        db.logs.clear(),
        db.highlights.clear(),
        db.sessions.clear(),
        db.days.clear(),
        db.reads.clear(),
      ]);
      await db.settings.delete('deckHash');
    },
  );
}
