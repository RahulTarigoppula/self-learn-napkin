import { z } from 'zod';

export const BACKUP_SCHEMA = 1;

const isoDate = z.union([z.string(), z.date()]).transform((v, ctx) => {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) {
    ctx.addIssue({ code: 'custom', message: `not a date: ${String(v)}` });
    return z.NEVER;
  }
  return d;
});

const Card = z
  .object({
    id: z.string(),
    slug: z.string(),
    track: z.string(),
    origin: z.enum(['deck', 'highlight']),
    orphan: z.union([z.literal(0), z.literal(1)]),
    introducedOn: z.string().optional(),
    due: isoDate,
    stability: z.number(),
    difficulty: z.number(),
    elapsed_days: z.number(),
    scheduled_days: z.number(),
    learning_steps: z.number().default(0),
    reps: z.number(),
    lapses: z.number(),
    state: z.number().int().min(0).max(3),
    last_review: isoDate.optional(),
  })
  .loose();

const Log = z
  .object({
    cardId: z.string(),
    sessionId: z.string(),
    dayKey: z.string(),
    rating: z.number().int().min(0).max(4),
    state: z.number(),
    due: isoDate,
    stability: z.number(),
    difficulty: z.number(),
    elapsed_days: z.number(),
    last_elapsed_days: z.number(),
    scheduled_days: z.number(),
    learning_steps: z.number().default(0),
    review: isoDate,
  })
  .loose();

const Highlight = z.object({
  id: z.string(),
  slug: z.string(),
  sentence: z.string(),
  blank: z.string(),
  createdAt: z.number(),
});
const Session = z.object({
  id: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  dayKey: z.string(),
  receiptNo: z.number(),
  lines: z.array(
    z.object({
      cardId: z.string(),
      title: z.string(),
      rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
      days: z.number(),
    }),
  ),
});
const Day = z.object({
  dayKey: z.string(),
  reviews: z.number(),
  newCards: z.number(),
  napkinsRead: z.number(),
});
const Read = z.object({
  slug: z.string(),
  readAt: z.number(),
  finished: z.union([z.literal(0), z.literal(1)]),
});

export const Backup = z.object({
  schema: z.literal(BACKUP_SCHEMA),
  app: z.literal('napkin'),
  appVersion: z.string(),
  exportedAt: z.string(),
  cards: z.array(Card),
  logs: z.array(Log),
  highlights: z.array(Highlight),
  sessions: z.array(Session),
  days: z.array(Day),
  reads: z.array(Read),
  settings: z.record(z.string(), z.unknown()),
});
export type Backup = z.infer<typeof Backup>;
export type BackupCard = Backup['cards'][number];
export type BackupLog = Backup['logs'][number];

export type ParseResult = { ok: true; data: Backup } | { ok: false; error: string };

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not JSON.' };
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'schema' in raw &&
    typeof raw.schema === 'number' &&
    raw.schema > BACKUP_SCHEMA
  )
    return { ok: false, error: 'This backup is from a newer Napkin' };
  const r = Backup.safeParse(raw);
  if (!r.success) {
    const i = r.error.issues[0];
    return {
      ok: false,
      error: `Not a Napkin backup: ${i?.path.join('.') || 'file'} — ${i?.message ?? 'invalid'}`,
    };
  }
  return { ok: true, data: r.data };
}

/** Merge by id; the copy with the newer last_review wins (a never-reviewed copy loses to a reviewed one). */
export function mergeCards<C extends { id: string; last_review?: Date | undefined }>(
  mine: readonly C[],
  theirs: readonly C[],
): C[] {
  const out = new Map(mine.map((c) => [c.id, c]));
  for (const t of theirs) {
    const m = out.get(t.id);
    const mt = m?.last_review?.getTime() ?? -1;
    const tt = t.last_review?.getTime() ?? -1;
    if (!m || tt > mt) out.set(t.id, t);
  }
  return [...out.values()];
}

/** Append logs, de-duplicated on (cardId, review time). */
export function mergeLogs<L extends { cardId: string; review: Date }>(
  mine: readonly L[],
  theirs: readonly L[],
): L[] {
  const seen = new Set(mine.map((l) => `${l.cardId}|${l.review.getTime()}`));
  const out = [...mine];
  for (const l of theirs) {
    const k = `${l.cardId}|${l.review.getTime()}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(l);
    }
  }
  return out;
}

/** Days merge by taking the larger count per field (both devices did real work). */
export function mergeDays<
  D extends { dayKey: string; reviews: number; newCards: number; napkinsRead: number },
>(mine: readonly D[], theirs: readonly D[]): D[] {
  const out = new Map(mine.map((d) => [d.dayKey, d]));
  for (const t of theirs) {
    const m = out.get(t.dayKey);
    out.set(
      t.dayKey,
      m
        ? {
            ...m,
            reviews: Math.max(m.reviews, t.reviews),
            newCards: Math.max(m.newCards, t.newCards),
            napkinsRead: Math.max(m.napkinsRead, t.napkinsRead),
          }
        : t,
    );
  }
  return [...out.values()];
}

export const backupFilename = (dayKey: string): string => `napkin-backup-${dayKey}.json`;
