import { describe, expect, it } from 'vitest';
import { mergeGame } from './store';

describe('mergeGame', () => {
  it('keeps best quiz scores, unions days and playgrounds, and the earliest unlock', () => {
    const merged = mergeGame(
      {
        quiz: { 'dsa/heaps': [2, 4] },
        daily: { '2026-10-12': false },
        played: ['heap'],
        unlocked: { 'first-napkin': 200 },
      },
      {
        quiz: { 'dsa/heaps': [4, 4], 'ds/pca': [1, 3] },
        daily: { '2026-10-12': true, '2026-10-13': false },
        played: ['heap', 'lcs'],
        unlocked: { 'first-napkin': 100, 'quiz-ace': 300 },
      },
    );
    expect(merged.quiz).toEqual({ 'dsa/heaps': [4, 4], 'ds/pca': [1, 3] });
    expect(merged.daily).toEqual({ '2026-10-12': true, '2026-10-13': false });
    expect(merged.played).toEqual(['heap', 'lcs']);
    expect(merged.unlocked).toEqual({ 'first-napkin': 100, 'quiz-ace': 300 });
  });

  it('fills missing fields from an empty record', () => {
    expect(mergeGame({}, {})).toEqual({ quiz: {}, daily: {}, played: [], unlocked: {} });
  });
});
