import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { allWindows, clampText, longestUniqueFrames, WINDOW_DEFAULT, WINDOW_MAX } from './sliding-window';

const answer = (s: string) => {
  const end = longestUniqueFrames(s).at(-1);
  const start = end?.best.start ?? 0;
  return [...s].slice(start, start + (end?.best.len ?? 0)).join('');
};

describe('longest substring without repeats', () => {
  it('napkin walk on "abcbad": abc, jump to cb, stale a, cbad = 4', () => {
    const fr = longestUniqueFrames(WINDOW_DEFAULT);
    expect(fr).toHaveLength(7);
    expect(fr.map((f) => f.kind)).toEqual(['start', 'grow', 'grow', 'grow', 'jump', 'stale', 'grow']);
    expect(fr.map((f) => f.L)).toEqual([0, 0, 0, 0, 2, 2, 2]);
    expect(fr.map((f) => f.best.len)).toEqual([0, 1, 2, 3, 3, 3, 4]);
    expect(fr[4]?.prev).toBe(1);
    expect(fr[4]?.caption).toBe(`'b' was at [1] inside the window → L jumps to 2 · "cb" length 2`);
    expect(fr[5]?.caption).toBe(
      `'a' was at [0], left of L = 2: not in the window, ignore it · "cba" length 3`,
    );
    expect(fr[3]?.caption).toBe(`'c' is new · "abc" length 3 · new best!`);
    expect(fr.at(-1)?.seen).toEqual([
      ['a', 4],
      ['b', 3],
      ['c', 2],
      ['d', 5],
    ]);
    expect(fr.at(-1)?.lMoves).toBe(2);
    expect(answer(WINDOW_DEFAULT)).toBe('cbad');
  });

  it('classic answers', () => {
    expect(answer('abba')).toBe('ab');
    expect(answer('pwwkew')).toBe('wke');
    expect(answer('bbbbb')).toBe('b');
    expect(answer('abcabcbb')).toBe('abc');
    expect(answer('dvdf')).toBe('vdf');
  });

  it('"abba": the final a is stale, so L never moves back', () => {
    expect(longestUniqueFrames('abba').at(-1)).toMatchObject({ kind: 'stale', L: 2, prev: 0 });
  });

  it('empty string and spaces', () => {
    const fr = longestUniqueFrames('');
    expect(fr).toHaveLength(1);
    expect(fr[0]?.caption).toBe('type a string to slide over');
    expect(longestUniqueFrames('a  b')[3]?.caption).toBe(
      `'␣' was at [1] inside the window → L jumps to 2 · "␣" length 1`,
    );
    expect(longestUniqueFrames('x')[0]?.caption).toBe('empty window · R adds one character per step');
  });

  it('property: matches brute force; L only moves right, never past R', () => {
    fc.assert(
      fc.property(fc.string({ unit: fc.constantFrom('a', 'b', 'c', 'd', 'e'), maxLength: 16 }), (s) => {
        let brute = 0;
        for (let i = 0; i < s.length; i++)
          for (let j = i; j < s.length; j++)
            if (new Set(s.slice(i, j + 1)).size === j - i + 1) brute = Math.max(brute, j - i + 1);
        const fr = longestUniqueFrames(s);
        expect(fr.at(-1)?.best.len).toBe(brute);
        const ans = answer(s);
        expect(new Set(ans).size).toBe(ans.length);
        for (let k = 1; k < fr.length; k++) {
          expect(fr[k]?.L).toBeGreaterThanOrEqual(fr[k - 1]?.L ?? 0);
          expect(fr[k]?.L).toBeLessThanOrEqual(fr[k]?.R ?? 0);
        }
        expect(fr.at(-1)?.lMoves).toBe(fr.at(-1)?.L);
      }),
      { numRuns: 300 },
    );
  });

  it('helpers', () => {
    expect(clampText('ab\ncd\te')).toBe('abcde');
    expect([...clampText('x'.repeat(40))]).toHaveLength(WINDOW_MAX);
    expect(allWindows(6)).toBe(21);
  });
});
