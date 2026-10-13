/** The thermal receipt: 32 columns, uppercase, dot leaders. This is the only definition of the format. */
export const W = 32;
export const RATING_WORD = { 1: 'AGAIN', 2: 'HARD', 3: 'GOOD', 4: 'EASY' } as const;
export type RatingNumber = keyof typeof RATING_WORD;

/** Titles are truncated to 20 columns with '…' so the value column never shifts. */
const trunc = (s: string): string => {
  const cps = [...s];
  return cps.length <= 20 ? s : `${cps.slice(0, 19).join('')}…`;
};
const width = (s: string): number => [...s].length;
const padEnd = (s: string, n: number, ch = ' '): string => s + ch.repeat(Math.max(0, n - width(s)));
const padStart = (s: string, n: number): string => ' '.repeat(Math.max(0, n - width(s))) + s;

/** Item row: TITLE, a space, dot leaders, a space, then the right-hand value. Exactly 32 columns. */
export const row = (l: string, r: string): string => `${padEnd(`${trunc(l)} `, W - width(r) - 1, '.')} ${r}`;
/** Total row: an 18-column label field and a 14-column right-aligned value field. Exactly 32 columns. */
export const total = (l: string, r: string): string => padEnd(l, 18) + padStart(r, 14);

export const itemValue = (rating: RatingNumber, days: number): string =>
  `${RATING_WORD[rating].padEnd(5)} ${padStart(`${days}d`, 3)}`;

export interface ReceiptLine {
  title: string;
  rating: RatingNumber;
  days: number;
}

export interface ReceiptInput {
  lines: readonly ReceiptLine[];
  order: number;
  streak: number;
  now: Date;
  tz: string;
}

const RULE = '-'.repeat(W);

function stamp(now: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}  ${get('hour')}:${get('minute')}`;
}

export function formatReceipt({ lines, order, streak, now, tz }: ReceiptInput): string[] {
  const n = lines.length;
  return [
    `NAPKIN · ORDER #${String(order).padStart(4, '0')}`,
    stamp(now, tz),
    RULE,
    ...lines.map((l) => row(l.title.toUpperCase(), itemValue(l.rating, l.days))),
    RULE,
    total('SUBTOTAL', `${n} ${n === 1 ? 'review' : 'reviews'}`),
    total('TIP', `${streak}-day streak`),
    'THANK YOU · COME AGAIN',
  ];
}
