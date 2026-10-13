import { act, cleanup, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { getDb } from '../../db/dexie';
import { recordQuickQuiz } from '../../db/review';
import type { ShellStats } from '../shell/shell';
import HomeDashboard from './HomeDashboard';

const cards = [
  { id: 'dsa/arrays', title: 'Arrays', track: 'dsa' as const, number: 1, minutes: 6 },
  { id: 'dsa/heaps', title: 'Heaps', track: 'dsa' as const, number: 2, minutes: 8 },
];

const stats = (s: Partial<ShellStats>): ShellStats => ({
  due: 0,
  everReviewed: false,
  streak: 0,
  best: 0,
  read: new Set(),
  ...s,
});

const show = async (s: Partial<ShellStats>) => {
  render(<HomeDashboard cards={cards} tracks={[{ id: 'dsa', total: 2 }]} />);
  await act(async () => {
    document.dispatchEvent(new CustomEvent('napkin:stats', { detail: stats(s) }));
  });
};

afterEach(async () => {
  cleanup();
  await getDb().settings.clear();
});

describe('home dashboard for a brand-new learner', () => {
  it('points at the first napkin instead of a due count, with a checklist instead of zeros', async () => {
    await show({});
    await waitFor(() => expect(screen.getByText('Your first three steps')).toBeTruthy());
    expect(screen.getByText('Read your first napkin to unlock its flashcards')).toBeTruthy();
    expect(
      screen
        .getByText(/Read Arrays/)
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('/dsa/arrays/');
    expect(screen.queryByText('reviews today')).toBeNull();
    expect(screen.queryByText(/new flashcard/)).toBeNull();
  });

  it('ticks steps off from real data and brings the stats back once there is activity', async () => {
    await recordQuickQuiz(getDb(), 3, 5);
    await show({ read: new Set(['dsa/arrays']), due: 4 });
    await waitFor(() => expect(screen.getByText('Review 3 cards').closest('a')).toBeTruthy());
    expect(screen.getByText('Read 1 napkin').closest('li')?.className).toBe('is-done');
    expect(screen.getByText('Try a quick quiz').closest('li')?.className).toBe('is-done');
    expect(screen.getByText("new cards from napkins you've read")).toBeTruthy();
    expect(screen.getByText('reviews today')).toBeTruthy();
  });
});
