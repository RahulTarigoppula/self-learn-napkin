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
  /** How far along a multi-step goal is, for the progress text under a locked badge. */
  measure?: (g: GameInput) => { n: number; of: number };
  /** What `measure` counts, in the plural: "napkins", "reviews", "days". */
  unit?: string;
}

const TRACK_NAMES: Record<string, string> = {
  dsa: 'Algorithms',
  sysdesign: 'System design',
  ds: 'Machine learning',
};
const trackDone = (t: string) => (g: GameInput) =>
  (g.trackTotals[t] ?? 0) > 0 && (g.readByTrack[t] ?? 0) >= (g.trackTotals[t] ?? 0);
const totalOf = (g: GameInput) => Object.values(g.trackTotals).reduce((a, b) => a + b, 0);

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
    measure: (g) => ({ n: g.read, of: 10 }),
    unit: 'napkins',
  },
  {
    id: 'half-library',
    title: 'Halfway there',
    how: 'Read half of all napkins',
    icon: 'chart',
    test: (g) => {
      const total = totalOf(g);
      return total > 0 && g.read * 2 >= total;
    },
    measure: (g) => ({ n: g.read, of: Math.ceil(totalOf(g) / 2) }),
    unit: 'napkins',
  },
  ...Object.keys(TRACK_NAMES).map(
    (t): Achievement => ({
      id: `track-${t}`,
      title: `${TRACK_NAMES[t]} graduate`,
      how: `Read every napkin in the ${TRACK_NAMES[t]?.toLowerCase()} track`,
      icon: 'award',
      test: trackDone(t),
      measure: (g) => ({ n: g.readByTrack[t] ?? 0, of: g.trackTotals[t] ?? 0 }),
      unit: 'napkins',
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
    measure: (g) => ({ n: g.reviews, of: 100 }),
    unit: 'reviews',
  },
  {
    id: 'reviews-1000',
    title: 'Total recall',
    how: 'Do 1,000 flashcard reviews',
    icon: 'zap',
    test: (g) => g.reviews >= 1000,
    measure: (g) => ({ n: g.reviews, of: 1000 }),
    unit: 'reviews',
  },
  {
    id: 'streak-3',
    title: 'Warming up',
    how: 'Keep a 3-day streak',
    icon: 'flame',
    test: (g) => g.bestStreak >= 3,
    measure: (g) => ({ n: g.bestStreak, of: 3 }),
    unit: 'days',
  },
  {
    id: 'streak-7',
    title: 'A whole week',
    how: 'Keep a 7-day streak',
    icon: 'flame',
    test: (g) => g.bestStreak >= 7,
    measure: (g) => ({ n: g.bestStreak, of: 7 }),
    unit: 'days',
  },
  {
    id: 'streak-30',
    title: 'Habit formed',
    how: 'Keep a 30-day streak',
    icon: 'trophy',
    test: (g) => g.bestStreak >= 30,
    measure: (g) => ({ n: g.bestStreak, of: 30 }),
    unit: 'days',
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
    measure: (g) => ({ n: g.quizzesAced, of: 10 }),
    unit: 'quizzes',
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
    measure: (g) => ({ n: g.dailyStreak, of: 7 }),
    unit: 'days',
  },
  {
    id: 'tinkerer',
    title: 'Tinkerer',
    how: 'Play with 5 different playgrounds',
    icon: 'hand',
    test: (g) => g.played >= 5,
    measure: (g) => ({ n: g.played, of: 5 }),
    unit: 'playgrounds',
  },
  {
    id: 'mad-scientist',
    title: 'Mad scientist',
    how: 'Play with 20 different playgrounds',
    icon: 'bulb',
    test: (g) => g.played >= 20,
    measure: (g) => ({ n: g.played, of: 20 }),
    unit: 'playgrounds',
  },
];

export const unlockedIds = (g: GameInput): string[] => ACHIEVEMENTS.filter((a) => a.test(g)).map((a) => a.id);

/**
 * Progress towards a badge as "n of a goal", capped at the goal. Null when the badge is a single step
 * (read one napkin, ace one quiz) or the goal is empty, because "0/1" says nothing a reader needs.
 */
export function progressOf(a: Achievement, g: GameInput): { n: number; of: number } | null {
  if (!a.measure) return null;
  const { n, of } = a.measure(g);
  if (of <= 1) return null;
  return { n: Math.max(0, Math.min(n, of)), of };
}

/**
 * The one locked badge closest to done, to point at as "Next up". Closeness is the fraction of the
 * goal reached; single-step badges count as zero, and ties go to the earlier badge in the list.
 */
export function nextUp(g: GameInput, unlocked: ReadonlySet<string>): string | null {
  let best: string | null = null;
  let score = -1;
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id) || a.test(g)) continue;
    const p = progressOf(a, g);
    const s = p ? p.n / p.of : 0;
    if (s > score) {
      best = a.id;
      score = s;
    }
  }
  return best;
}

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
