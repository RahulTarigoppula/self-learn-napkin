import { describe, expect, it } from 'vitest';
import { bandAt, clockText, hourBand, localTime, msToNextBoundary } from '../theme/hour';
import { monthGrid, monthName, RING_OPACITY, ringLabel, ringRotation, ringTier } from './rings';
import { type DayStat, shiftDay, streak } from './streak';

const day = (k: string, reviews = 1): DayStat => ({ dayKey: k, reviews, newCards: 0, napkinsRead: 0 });

describe('streak', () => {
  it('golden: 1,2,4,5,6 Sept → current 3, best 3', () => {
    const days = ['2026-09-01', '2026-09-02', '2026-09-04', '2026-09-05', '2026-09-06'].map((k) => day(k));
    expect(streak(days, '2026-09-06')).toEqual({ current: 3, best: 3 });
  });

  it('a live streak survives a day with no activity yet', () => {
    expect(streak([day('2026-09-05'), day('2026-09-04')], '2026-09-06').current).toBe(2);
  });

  it('skipping a day resets it', () => {
    expect(streak([day('2026-09-04')], '2026-09-06').current).toBe(0);
  });

  it('reading a napkin counts as activity; zero rows do not', () => {
    expect(streak([{ ...day('2026-09-06', 0), napkinsRead: 1 }, day('2026-09-05', 0)], '2026-09-06')).toEqual(
      {
        current: 1,
        best: 1,
      },
    );
  });

  it('shifts across month and year boundaries', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('rings', () => {
  it('tiers at 0/1/4/5/19/20', () => {
    expect([0, 1, 4, 5, 19, 20].map(ringTier)).toEqual([0, 1, 1, 2, 2, 3]);
    expect(RING_OPACITY[ringTier(5)]).toBe(0.48);
  });

  it('rotation is stable per day and within 0–359', () => {
    expect(ringRotation('2026-09-06')).toBe(ringRotation('2026-09-06'));
    expect(ringRotation('2026-09-06')).toBeGreaterThanOrEqual(0);
    expect(ringRotation('2026-09-06')).toBeLessThan(360);
  });

  it('labels rings for screen readers', () => {
    expect(ringLabel('2026-09-03', 5)).toBe('5 reviews on 3 September');
    expect(ringLabel('2026-09-03', 1)).toBe('1 review on 3 September');
    expect(monthName(12)).toBe('');
  });

  it('builds a Monday-first month grid of whole weeks', () => {
    const g = monthGrid(2026, 8); // September 2026 starts on a Tuesday
    expect(g.length % 7).toBe(0);
    expect(g[0]?.dayKey).toBe('2026-08-31');
    expect(g[1]).toEqual({ dayKey: '2026-09-01', day: 1, inMonth: true });
    expect(g.filter((c) => c.inMonth)).toHaveLength(30);
  });
});

describe('hour bands', () => {
  it('asserts all eight vectors (00:00 and 05:59 are late)', () => {
    const v: [number, string][] = [
      [0, 'late'],
      [5, 'late'],
      [6, 'morning'],
      [11, 'morning'],
      [12, 'afternoon'],
      [19, 'afternoon'],
      [20, 'late'],
      [23, 'late'],
    ];
    for (const [h, b] of v) expect(hourBand(h)).toBe(b);
  });

  it('reads the clock in the given zone', () => {
    const t = new Date('2026-09-06T09:41:00Z');
    expect(bandAt(t, 'Asia/Kolkata')).toBe('afternoon');
    expect(bandAt(t, 'UTC')).toBe('morning');
    expect(bandAt(t, 'UTC', 'late')).toBe('late');
    expect(localTime(t, 'Asia/Kolkata')).toEqual({ h: 15, m: 11 });
    expect(clockText(t, 'UTC')).toBe('09:41');
  });

  it('schedules the next boundary', () => {
    expect(msToNextBoundary(new Date('2026-09-06T09:41:00Z'), 'UTC')).toBe((2 * 60 + 19) * 60_000);
    expect(msToNextBoundary(new Date('2026-09-06T21:00:00Z'), 'UTC')).toBe(9 * 3_600_000);
    expect(msToNextBoundary(new Date('2026-09-06T03:00:00Z'), 'UTC')).toBe(3 * 3_600_000);
  });
});
