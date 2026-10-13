import { describe, expect, it } from 'vitest';
import { type StepInfo, stepText, timeToStep, timeToX, xToTime } from './map';

const steps: StepInfo[] = [
  { index: 0, caption: 'Setup', beginMs: 0, endMs: 2000, firstElement: 0, lastElement: 3 },
  {
    index: 1,
    caption: 'Hash each server onto the ring',
    beginMs: 2000,
    endMs: 4000,
    firstElement: 4,
    lastElement: 7,
  },
  { index: 2, caption: 'Hash the key', beginMs: 4000, endMs: 5500, firstElement: 8, lastElement: 10 },
  {
    index: 3,
    caption: 'Walk clockwise to the next server',
    beginMs: 5500,
    endMs: 7000,
    firstElement: 11,
    lastElement: 13,
  },
];

describe('ruler mapping', () => {
  it('maps x to time linearly inside each step', () => {
    expect(xToTime(0, 400, steps)).toBe(0);
    expect(xToTime(50, 400, steps)).toBe(1000);
    expect(xToTime(100, 400, steps)).toBe(2000);
    expect(xToTime(399.99, 400, steps)).toBeCloseTo(7000, 0);
    expect(xToTime(-20, 400, steps)).toBe(0);
    expect(xToTime(900, 400, steps)).toBe(7000);
    expect(xToTime(10, 0, steps)).toBe(0);
    expect(xToTime(10, 100, [])).toBe(0);
  });

  it('maps time back to the step and to x', () => {
    expect(timeToStep(0, steps)).toBe(0);
    expect(timeToStep(4500, steps)).toBe(2);
    expect(timeToStep(9000, steps)).toBe(3);
    expect(timeToX(2000, 400, steps)).toBe(100);
    expect(timeToX(0, 400, [])).toBe(0);
  });

  it('uses one template for caption and aria-valuetext', () => {
    expect(stepText(2, steps)).toBe('Step 3 of 4: Hash the key');
    expect(stepText(2, steps, ' ·')).toBe('Step 3 of 4 · Hash the key');
  });
});
