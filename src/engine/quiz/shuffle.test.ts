import { describe, expect, it } from 'vitest';
import { shuffleOptions } from './shuffle';

const item = {
  q: 'Which is right?',
  options: ['wrong 1', 'right', 'wrong 2', 'wrong 3'],
  answer: 1,
  why: 'because',
};

describe('shuffleOptions', () => {
  it('keeps the answer pointing at the same option', () => {
    for (let seed = 0; seed < 200; seed++) {
      const s = shuffleOptions(item, seed);
      expect(s.options[s.answer]).toBe('right');
      expect([...s.options].sort()).toEqual([...item.options].sort());
    }
  });
  it('is stable for the same question and spreads answers across slots', () => {
    expect(shuffleOptions(item)).toEqual(shuffleOptions(item));
    const slots = new Set(Array.from({ length: 40 }, (_, s) => shuffleOptions(item, s).answer));
    expect(slots.size).toBe(4);
  });
});
