export type HourBand = 'late' | 'morning' | 'afternoon';
export type HourPin = 'clock' | HourBand;

/** The `late` band wraps midnight, so it MUST be tested first.
 *  20:00–05:59 late · 06:00–11:59 morning · 12:00–19:59 afternoon. */
export const hourBand = (h: number): HourBand =>
  h >= 20 || h < 6 ? 'late' : h < 12 ? 'morning' : 'afternoon';

/** Local hour and minute of an instant in an IANA zone. */
export function localTime(d: Date, tz: string): { h: number; m: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return { h, m };
}

export const bandAt = (d: Date, tz: string, pin: HourPin = 'clock'): HourBand =>
  pin === 'clock' ? hourBand(localTime(d, tz).h) : pin;

const BOUNDARIES = [6, 12, 20];

/** Milliseconds until the next 06:00 / 12:00 / 20:00 local boundary (schedules the 6 s crossfade). */
export function msToNextBoundary(d: Date, tz: string): number {
  const { h, m } = localTime(d, tz);
  const nowMin = h * 60 + m;
  const next = BOUNDARIES.map((b) => b * 60).find((b) => b > nowMin) ?? 24 * 60 + 6 * 60;
  const secs = d.getUTCSeconds() * 1000 + d.getUTCMilliseconds();
  return (next - nowMin) * 60_000 - secs;
}

/** The clock in the folio bar: '09:41'. */
export const clockText = (d: Date, tz: string): string => {
  const { h, m } = localTime(d, tz);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
