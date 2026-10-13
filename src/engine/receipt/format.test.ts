import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatReceipt, type RatingNumber, row, total, W } from './format';

const NOW = new Date('2026-09-06T09:41:00Z');
const cols = (s: string) => [...s].length;

describe('formatReceipt', () => {
  it('prints the golden ten lines exactly', () => {
    const lines = formatReceipt({
      lines: [
        { title: 'Binary Search', rating: 3, days: 4 },
        { title: 'Consistent Hashing', rating: 1, days: 1 },
        { title: 'LRU Cache', rating: 4, days: 31 },
      ],
      order: 412,
      streak: 12,
      now: NOW,
      tz: 'UTC',
    });
    expect(lines.join('\n')).toBe(
      [
        'NAPKIN · ORDER #0412',
        '2026-09-06  09:41',
        '--------------------------------',
        'BINARY SEARCH ........ GOOD   4d',
        'CONSISTENT HASHING ... AGAIN  1d',
        'LRU CACHE ............ EASY  31d',
        '--------------------------------',
        'SUBTOTAL               3 reviews',
        'TIP                12-day streak',
        'THANK YOU · COME AGAIN',
      ].join('\n'),
    );
    expect(lines.map(cols)).toEqual([20, 17, 32, 32, 32, 32, 32, 32, 32, 22]);
  });

  it('a zero-review session keeps the block', () => {
    const lines = formatReceipt({ lines: [], order: 1, streak: 0, now: NOW, tz: 'UTC' });
    expect(lines).toContain('SUBTOTAL               0 reviews');
    expect(lines[0]).toBe('NAPKIN · ORDER #0001');
  });

  it('singular review', () => {
    const lines = formatReceipt({
      lines: [{ title: 'x', rating: 2, days: 3 }],
      order: 9,
      streak: 1,
      now: NOW,
      tz: 'UTC',
    });
    expect(lines).toContain('SUBTOTAL                1 review');
  });

  it('every line is ≤ 32 columns; item and total rows are exactly 32', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 60 }),
            rating: fc.constantFrom<RatingNumber>(1, 2, 3, 4),
            days: fc.integer({ min: 0, max: 365 }),
          }),
          { maxLength: 12 },
        ),
        fc.integer({ min: 0, max: 9999 }),
        (items, order) => {
          const lines = formatReceipt({ lines: items, order, streak: 3, now: NOW, tz: 'UTC' });
          for (const l of lines) expect(cols(l)).toBeLessThanOrEqual(W);
          for (const l of lines.slice(3, 3 + items.length)) expect(cols(l)).toBe(W);
          expect(lines[0]).toMatch(/#\d{4}$/);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('row and total helpers are 32 wide', () => {
    expect(cols(row('A VERY LONG NAPKIN TITLE INDEED', 'GOOD   4d'))).toBe(32);
    expect(cols(total('TIP', '1-day streak'))).toBe(32);
  });
});
