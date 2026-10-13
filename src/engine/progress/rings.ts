import { fnv1a } from '../viz/fnv1a';
import { shiftDay } from './streak';

export type RingTier = 0 | 1 | 2 | 3;

/** 1 / 5 / 20+ reviews → a coffee ring at 35 / 48 / 60 % opacity. */
export const ringTier = (reviews: number): RingTier =>
  reviews >= 20 ? 3 : reviews >= 5 ? 2 : reviews >= 1 ? 1 : 0;
export const RING_OPACITY: Record<RingTier, number> = { 0: 0, 1: 0.35, 2: 0.48, 3: 0.6 };
export const ringRotation = (dayKey: string): number => fnv1a(dayKey) % 360;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const monthName = (month0: number): string => MONTHS[month0] ?? '';

/** The accessible name of a coffee ring, e.g. '5 reviews on 3 September'. */
export function ringLabel(dayKey: string, reviews: number): string {
  const [, m, d] = dayKey.split('-').map(Number) as [number, number, number];
  return `${reviews} ${reviews === 1 ? 'review' : 'reviews'} on ${d} ${monthName(m - 1)}`;
}

export interface CalendarCell {
  dayKey: string;
  day: number;
  inMonth: boolean;
}

/** A Monday-first month grid (always whole weeks) for the placemat calendar. */
export function monthGrid(year: number, month0: number): CalendarCell[] {
  const first = `${year}-${String(month0 + 1).padStart(2, '0')}-01`;
  const dow = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  let k = shiftDay(first, -dow);
  const cells: CalendarCell[] = [];
  do {
    for (let i = 0; i < 7; i++) {
      const [y, m, d] = k.split('-').map(Number) as [number, number, number];
      cells.push({ dayKey: k, day: d, inMonth: y === year && m === month0 + 1 });
      k = shiftDay(k, 1);
    }
  } while (Number(k.slice(5, 7)) === month0 + 1);
  return cells;
}
