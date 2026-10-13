import {
  type Card,
  createEmptyCard,
  type FSRS,
  type FSRSParameters,
  fsrs,
  type Grade,
  generatorParameters,
  Rating,
  type RecordLogItem,
  State,
} from 'ts-fsrs';

export type { Card, Grade };
export { createEmptyCard, Rating, State };

/** The LOCAL calendar date (YYYY-MM-DD) in the given IANA zone. No rollover hour. */
export function dayKey(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export const scheduler = (params: Partial<FSRSParameters> = {}): FSRS =>
  fsrs(generatorParameters({ request_retention: 0.9, maximum_interval: 365, enable_fuzz: true, ...params }));

export type RatingName = 'again' | 'hard' | 'good' | 'easy';
export const RATING_NAMES: readonly RatingName[] = ['again', 'hard', 'good', 'easy'];
export const GRADE: Record<RatingName, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** Compact interval label printed on a plunger barrel: 1m · 6h · 4d · 1.2mo. */
export function intervalLabel(from: Date, to: Date): string {
  const m = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60_000));
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  if (m < 43200) return `${Math.round(m / 1440)}d`;
  return `${(m / 43200).toFixed(1)}mo`;
}

const UNIT: Record<string, [string, string]> = {
  m: ['minute', 'minutes'],
  h: ['hour', 'hours'],
  d: ['day', 'days'],
  mo: ['month', 'months'],
};

/** '1d' → '1 day', '12d' → '12 days', '1.5mo' → '1.5 months' (for accessible names). */
export function spokenInterval(label: string): string {
  const m = /^([\d.]+)(mo|m|h|d)$/.exec(label);
  if (!m) return label;
  const n = m[1] as string;
  const [one, many] = UNIT[m[2] as string] as [string, string];
  return `${n} ${n === '1' ? one : many}`;
}

/** Whole days between two instants, rounded and never negative. The receipt's value column uses it. */
export const daysBetween = (from: Date, to: Date): number =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));

export type Preview = Record<RatingName, string>;

export function preview(card: Card, now: Date, f: FSRS = scheduler()): Preview {
  const r = f.repeat(card, now);
  return {
    again: intervalLabel(now, r[Rating.Again].card.due),
    hard: intervalLabel(now, r[Rating.Hard].card.due),
    good: intervalLabel(now, r[Rating.Good].card.due),
    easy: intervalLabel(now, r[Rating.Easy].card.due),
  };
}

export function applyRating(card: Card, grade: Grade, now: Date, f: FSRS = scheduler()): RecordLogItem {
  return f.next(card, now, grade);
}
