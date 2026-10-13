import type { IconName } from '../../lib/icons';
import { fnv1a } from '../viz/fnv1a';

/** Everything the game layer scores. Built from IndexedDB on the device; nothing leaves it. */
export interface GameInput {
  read: number;
  readByTrack: Record<string, number>;
  trackTotals: Record<string, number>;
  reviews: number;
  bestStreak: number;
  quizzesAced: number;
  quizzesTaken: number;
  dailyCorrect: number;
  dailyStreak: number;
  played: number;
}

export const XP = { read: 20, review: 2, quiz: 5, ace: 10, daily: 10, played: 5 } as const;

export function xpOf(g: GameInput): number {
  return (
    g.read * XP.read +
    g.reviews * XP.review +
    g.quizzesTaken * XP.quiz +
    g.quizzesAced * XP.ace +
    g.dailyCorrect * XP.daily +
    g.played * XP.played
  );
}

/** Levels follow a napkin from first doodle to finished design. */
export const LEVELS = [
  { name: 'Doodler', xp: 0 },
  { name: 'Sketcher', xp: 60 },
  { name: 'Drafter', xp: 180 },
  { name: 'Illustrator', xp: 400 },
  { name: 'Whiteboarder', xp: 750 },
  { name: 'Architect', xp: 1250 },
  { name: 'Professor', xp: 2000 },
  { name: 'Napkin master', xp: 3000 },
] as const;

export interface Level {
  level: number;
  name: string;
  xp: number;
  floor: number;
  next: number | null;
  /** 0..1 progress towards the next level (1 at the top level). */
  progress: number;
}

export function levelOf(xp: number): Level {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= (LEVELS[i + 1] as (typeof LEVELS)[number]).xp) i++;
  const cur = LEVELS[i] as (typeof LEVELS)[number];
  const nxt = LEVELS[i + 1];
  return {
    level: i + 1,
    name: cur.name,
    xp,
    floor: cur.xp,
    next: nxt ? nxt.xp : null,
    progress: nxt ? (xp - cur.xp) / (nxt.xp - cur.xp) : 1,
  };
}

export interface Achievement {
  id: string;
  title: string;
  how: string;
  icon: IconName;
  test: (g: GameInput) => boolean;
}

const TRACK_NAMES: Record<string, string> = {
  dsa: 'Algorithms',
  sysdesign: 'System design',
  ds: 'Machine learning',
};
const trackDone = (t: string) => (g: GameInput) =>
  (g.trackTotals[t] ?? 0) > 0 && (g.readByTrack[t] ?? 0) >= (g.trackTotals[t] ?? 0);

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first-napkin',
    title: 'First doodle',
    how: 'Read your first napkin',
    icon: 'pen',
    test: (g) => g.read >= 1,
  },
  {
    id: 'ten-napkins',
    title: 'Ten on the table',
    how: 'Read 10 napkins',
    icon: 'library',
    test: (g) => g.read >= 10,
  },
  {
    id: 'half-library',
    title: 'Halfway there',
    how: 'Read half of all napkins',
    icon: 'chart',
    test: (g) => {
      const total = Object.values(g.trackTotals).reduce((a, b) => a + b, 0);
      return total > 0 && g.read * 2 >= total;
    },
  },
  ...Object.keys(TRACK_NAMES).map(
    (t): Achievement => ({
      id: `track-${t}`,
      title: `${TRACK_NAMES[t]} graduate`,
      how: `Read every napkin in the ${TRACK_NAMES[t]?.toLowerCase()} track`,
      icon: 'award',
      test: trackDone(t),
    }),
  ),
  {
    id: 'first-review',
    title: 'Memory lane',
    how: 'Review your first flashcard',
    icon: 'layers',
    test: (g) => g.reviews >= 1,
  },
  {
    id: 'reviews-100',
    title: 'Card shark',
    how: 'Do 100 flashcard reviews',
    icon: 'cards',
    test: (g) => g.reviews >= 100,
  },
  {
    id: 'reviews-1000',
    title: 'Total recall',
    how: 'Do 1,000 flashcard reviews',
    icon: 'zap',
    test: (g) => g.reviews >= 1000,
  },
  {
    id: 'streak-3',
    title: 'Warming up',
    how: 'Keep a 3-day streak',
    icon: 'flame',
    test: (g) => g.bestStreak >= 3,
  },
  {
    id: 'streak-7',
    title: 'A whole week',
    how: 'Keep a 7-day streak',
    icon: 'flame',
    test: (g) => g.bestStreak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Habit formed',
    how: 'Keep a 30-day streak',
    icon: 'trophy',
    test: (g) => g.bestStreak >= 30,
  },
  {
    id: 'quiz-ace',
    title: 'Clean sweep',
    how: 'Get every question right in a napkin quiz',
    icon: 'target',
    test: (g) => g.quizzesAced >= 1,
  },
  {
    id: 'quiz-ace-10',
    title: 'Sharp shooter',
    how: 'Ace 10 napkin quizzes',
    icon: 'star',
    test: (g) => g.quizzesAced >= 10,
  },
  {
    id: 'daily-first',
    title: 'Question of the day',
    how: 'Get a daily challenge right',
    icon: 'calendar',
    test: (g) => g.dailyCorrect >= 1,
  },
  {
    id: 'daily-7',
    title: 'Seven sunrises',
    how: 'Answer the daily challenge 7 days in a row',
    icon: 'sparkles',
    test: (g) => g.dailyStreak >= 7,
  },
  {
    id: 'tinkerer',
    title: 'Tinkerer',
    how: 'Play with 5 different playgrounds',
    icon: 'hand',
    test: (g) => g.played >= 5,
  },
  {
    id: 'mad-scientist',
    title: 'Mad scientist',
    how: 'Play with 20 different playgrounds',
    icon: 'bulb',
    test: (g) => g.played >= 20,
  },
];

export const unlockedIds = (g: GameInput): string[] => ACHIEVEMENTS.filter((a) => a.test(g)).map((a) => a.id);

/** The same question for everyone on a given day, cycling through the whole pool. */
export function dailyIndex(day: string, poolSize: number): number {
  if (poolSize <= 0) return -1;
  return fnv1a(`daily|${day}`) % poolSize;
}

/** "2026-10-13" → "2026-10-12" (calendar arithmetic on the key itself, no time zones involved). */
export function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d) - 86_400_000);
  return t.toISOString().slice(0, 10);
}

/** Consecutive days with an answered daily challenge, ending today (or yesterday, if today is still open). */
export function dailyStreak(history: Record<string, unknown>, today: string): number {
  let day = today in history ? today : previousDay(today);
  let n = 0;
  while (day in history) {
    n++;
    day = previousDay(day);
  }
  return n;
}
