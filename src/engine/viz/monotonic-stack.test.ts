import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { monoStackFrames, nextGreater, parseNums, randomNums } from './monotonic-stack';

const brute = (a: number[]) =>
  a.map((x, i) => {
    for (let j = i + 1; j < a.length; j++) if ((a[j] as number) > x) return a[j] as number;
    return -1;
  });

describe('next greater element', () => {
  it('matches the lesson: [2,1,2,4,3] → [4,2,4,-1,-1]', () => {
    expect(nextGreater([2, 1, 2, 4, 3])).toEqual([4, 2, 4, -1, -1]);
  });
  it('matches the quiz: [5,3,1,4] → [-1,4,4,-1]', () => {
    expect(nextGreater([5, 3, 1, 4])).toEqual([-1, 4, 4, -1]);
  });
  it('handles empty and single inputs', () => {
    expect(nextGreater([])).toEqual([]);
    expect(nextGreater([7])).toEqual([-1]);
  });
  it('agrees with brute force on random arrays', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 9 }), { maxLength: 12 }), (a) => {
        expect(nextGreater(a)).toEqual(brute(a));
        const fr = monoStackFrames(a);
        expect(fr.at(-1)?.ans).toEqual(brute(a));
      }),
    );
  });
});

describe('monoStackFrames', () => {
  const fr = monoStackFrames([2, 1, 2, 4, 3]);
  it('has start, 5 pushes, 3 pops and an end beat', () => {
    expect(fr).toHaveLength(1 + 5 + 3 + 1);
    expect(fr[0]?.phase).toBe('start');
    expect(fr[0]?.i).toBe(-1);
    expect(fr.filter((f) => f.phase === 'push')).toHaveLength(5);
    expect(fr.filter((f) => f.phase === 'pop').map((f) => f.popped)).toEqual([1, 2, 0]);
    const end = fr.at(-1);
    expect(end?.phase).toBe('done');
    expect(end?.i).toBe(5);
    expect(end?.pushes).toBe(5);
    expect(end?.pops).toBe(3);
    expect(end?.stack).toEqual([3, 4]);
    expect(end?.by).toEqual([3, 2, 3, -1, -1]);
    expect(end?.caption).toBe('end: 2 left on the stack keep −1 → [4, 2, 4, -1, -1]');
  });
  it('captions explain each beat', () => {
    expect(fr[1]?.caption).toBe('stack empty → push 2, it waits');
    expect(fr[2]?.caption).toBe('1 is not > 2, stop → push 1, it waits');
    expect(fr[3]?.caption).toBe('2 > 1 → pop [1], its answer is 2');
    expect(fr[4]?.caption).toBe('2 is not > 2, stop → push 2, it waits');
    expect(fr[7]?.caption).toBe('stack emptied → push 4, it waits');
  });
  it('the stack stays non-increasing bottom → top', () => {
    const a = [3, 1, 4, 1, 5, 9, 2, 6];
    for (const f of monoStackFrames(a))
      for (let k = 1; k < f.stack.length; k++)
        expect(a[f.stack[k] as number]).toBeLessThanOrEqual(a[f.stack[k - 1] as number] as number);
  });
  it('pushes + pops ≤ 2n always', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 99 }), { maxLength: 10 }), (a) => {
        const end = monoStackFrames(a).at(-1);
        expect(end?.pushes).toBe(a.length);
        expect((end?.pushes ?? 0) + (end?.pops ?? 0)).toBeLessThanOrEqual(2 * a.length);
      }),
    );
  });
  it('ascending input empties the stack every time', () => {
    const end = monoStackFrames([1, 2, 3]).at(-1);
    expect(end?.pops).toBe(2);
    expect(end?.caption).toBe('end: 1 left on the stack keep −1 → [2, 3, -1]');
    expect(monoStackFrames([]).at(-1)?.caption).toBe('end: every value found a bigger one');
  });
});

describe('parseNums / randomNums', () => {
  it('parses spaces and commas', () => {
    expect(parseNums('2 1, 2,4  3')).toEqual([2, 1, 2, 4, 3]);
    expect(parseNums('  7 ')).toEqual([7]);
  });
  it('rejects bad input', () => {
    expect(parseNums('')).toBeNull();
    expect(parseNums('1 x 3')).toBeNull();
    expect(parseNums('1.5')).toBeNull();
    expect(parseNums('100')).toBeNull();
    expect(parseNums('-1')).toBeNull();
    expect(parseNums('1 2 3 4 5 6 7 8 9 10 11')).toBeNull();
    expect(parseNums('1 2 3', 2)).toBeNull();
  });
  it('random values are deterministic and in 1..9', () => {
    const a = randomNums(8, 5);
    expect(a).toEqual(randomNums(8, 5));
    expect(a).toHaveLength(8);
    expect(a.every((v) => v >= 1 && v <= 9)).toBe(true);
    expect(randomNums(8, 6)).not.toEqual(a);
  });
});
