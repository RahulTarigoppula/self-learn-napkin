import Dexie, { type Table } from 'dexie';
import type { Card as FsrsCard, ReviewLog as FsrsLog } from 'ts-fsrs';

export interface ReviewCard extends FsrsCard {
  /** DeckItem.id, or 'hl-' + sha1(slug + '|' + sentence) for a learner-made cloze */
  id: string;
  slug: string;
  track: string;
  origin: 'deck' | 'highlight';
  /** 1 when the deck no longer contains this id (kept, hidden) */
  orphan: 0 | 1;
  /** dayKey when first shown as new */
  introducedOn?: string;
}

export interface ReviewLogRow extends FsrsLog {
  id?: number;
  cardId: string;
  sessionId: string;
  dayKey: string;
}

export interface Highlight {
  id: string;
  slug: string;
  sentence: string;
  blank: string;
  createdAt: number;
}

export interface SessionLine {
  cardId: string;
  title: string;
  rating: 1 | 2 | 3 | 4;
  days: number;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt?: number;
  dayKey: string;
  lines: SessionLine[];
  /** monotonic, "ORDER #0412" */
  receiptNo: number;
}

export interface DayStat {
  dayKey: string;
  reviews: number;
  newCards: number;
  napkinsRead: number;
}

export interface ReadMark {
  slug: string;
  readAt: number;
  finished: 0 | 1;
}

export interface Setting {
  key: string;
  value: unknown;
}

export class NapkinDB extends Dexie {
  cards!: Table<ReviewCard, string>;
  logs!: Table<ReviewLogRow, number>;
  highlights!: Table<Highlight, string>;
  sessions!: Table<Session, string>;
  days!: Table<DayStat, string>;
  reads!: Table<ReadMark, string>;
  settings!: Table<Setting, string>;

  constructor(name = 'napkin') {
    super(name);
    this.version(1).stores({
      cards: 'id, due, state, slug, track, orphan, introducedOn',
      logs: '++id, cardId, sessionId, dayKey, review',
      highlights: 'id, slug',
      sessions: 'id, dayKey, startedAt, receiptNo',
      days: 'dayKey',
      reads: 'slug, readAt',
      settings: 'key',
    });
  }
}

let instance: NapkinDB | null = null;
/** Lazily opened so pages that never touch progress never open IndexedDB. */
export const getDb = (): NapkinDB => {
  instance ??= new NapkinDB();
  return instance;
};
