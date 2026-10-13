import { useEffect, useState } from 'preact/hooks';
import { getDb } from '../../db/dexie';
import { quickQuizRounds, tz } from '../../db/review';
import { dayKey } from '../../engine/fsrs/scheduler';
import { type Level, levelOf, xpOf } from '../../engine/game/game';
import { cardHref, href } from '../../lib/base';
import { activeProfile } from '../../lib/profiles';
import { gameInput } from '../game/store';
import { lastStats, type ShellStats } from '../shell/shell';
import { Icon } from '../ui/Icon';
import '../../styles/quiz-review.css';

interface Lite {
  id: string;
  title: string;
  track: 'dsa' | 'sysdesign' | 'ds';
  number: number;
  minutes: number;
}

const greeting = (h: number) =>
  h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
const TRACK = { dsa: 'DSA', sysdesign: 'System Design', ds: 'Data Science' } as const;
const FIRST_REVIEWS = 3;

/** What the first-run checklist needs: all-time reviews and finished quick-quiz rounds. */
interface FirstRun {
  reviews: number;
  quizzes: number;
}

export default function HomeDashboard({ cards }: { cards: Lite[]; tracks: { id: string; total: number }[] }) {
  const [stats, setStats] = useState<ShellStats | null>(lastStats());
  const [today, setToday] = useState<{ reviews: number; read: number } | null>(null);
  const [lastRead, setLastRead] = useState<string | null>(null);
  const [hello, setHello] = useState('Hello');
  const [level, setLevel] = useState<Level | null>(null);
  const [first, setFirst] = useState<FirstRun | null>(null);

  useEffect(() => {
    const me = activeProfile().name;
    setHello(`${greeting(new Date().getHours())}${me ? `, ${me}` : ''}`);
    const score = () =>
      void gameInput()
        .then((g) => setLevel(levelOf(xpOf(g))))
        .catch(() => undefined);
    const db = getDb();
    const history = () =>
      void Promise.all([db.logs.count(), quickQuizRounds(db)])
        .then(([reviews, quizzes]) => setFirst({ reviews, quizzes }))
        .catch(() => undefined);
    const on = (e: Event) => {
      setStats((e as CustomEvent<ShellStats>).detail);
      score();
      history();
    };
    document.addEventListener('napkin:stats', on);
    document.addEventListener('napkin:game', score);
    score();
    history();
    void Promise.all([db.days.get(dayKey(new Date(), tz())), db.reads.orderBy('readAt').last()])
      .then(([d, r]) => {
        setToday({ reviews: d?.reviews ?? 0, read: d?.napkinsRead ?? 0 });
        setLastRead(r?.slug ?? null);
      })
      .catch((e: unknown) => console.warn('dashboard unavailable', e));
    return () => {
      document.removeEventListener('napkin:stats', on);
      document.removeEventListener('napkin:game', score);
    };
  }, []);

  const read = stats?.read ?? new Set<string>();
  const upNext = (() => {
    if (lastRead) {
      const i = cards.findIndex((c) => c.id === lastRead);
      const sameTrack = cards.slice(i + 1).find((c) => c.track === cards[i]?.track && !read.has(c.id));
      if (sameTrack) return sameTrack;
    }
    return cards.find((c) => !read.has(c.id)) ?? cards[0];
  })();
  const due = stats?.due ?? null;
  const pct = cards.length ? Math.round((read.size / cards.length) * 100) : 0;
  // Nothing read yet: new flashcards only unlock from napkins the learner has read.
  const locked = stats !== null && read.size === 0 && due === 0;

  // First run: a tiny checklist instead of a row of zeros. It stays until all three steps are done
  // (or the learner clearly is not new any more), and the normal stats return once there is any activity.
  const steps = first && [
    { done: read.size >= 1, label: 'Read 1 napkin', to: upNext ? cardHref(upNext.id) : href('library/') },
    {
      done: first.reviews >= FIRST_REVIEWS,
      label: `Review ${FIRST_REVIEWS} cards`,
      note: first.reviews > 0 && first.reviews < FIRST_REVIEWS ? `${first.reviews} of ${FIRST_REVIEWS}` : '',
      to: href('review/'),
    },
    { done: first.quizzes >= 1, label: 'Try a quick quiz', to: href('quiz/') },
  ];
  const veteran = read.size >= 5 || (first?.reviews ?? 0) >= 30;
  const showChecklist = stats !== null && steps !== null && !veteran && steps.some((x) => !x.done);
  const active = read.size > 0 || (first?.reviews ?? 0) > 0 || (first?.quizzes ?? 0) > 0;
  const nextStep = steps?.findIndex((x) => !x.done) ?? -1;

  return (
    <aside class="dash" aria-label="Your day">
      <div class="dash__top">
        <p class="dash__hello">{hello} 👋</p>
        <span class="dash__streak" title="Day streak">
          <Icon name="flame" size={18} />
          {stats?.streak ? (
            <>
              <b class="mono">{stats.streak}</b> day{stats.streak === 1 ? '' : 's'}
            </>
          ) : (
            'start a streak'
          )}
        </span>
      </div>

      <a
        class="dash__level"
        href={href('progress/#achievements')}
        aria-label={level ? `Level ${level.level}, ${level.name}: ${level.xp} XP` : 'Your level'}
      >
        <span class="dash__lv mono">Lv {level?.level ?? 1}</span>
        <span class="dash__lvname">{level?.name ?? 'Doodler'}</span>
        <span class="dash__xpbar" aria-hidden="true">
          <span style={{ width: `${Math.round((level?.progress ?? 0) * 100)}%` }} />
        </span>
        <span class="dash__xp mono">
          {level?.xp ?? 0}
          {level?.next ? ` / ${level.next}` : ''} XP
        </span>
      </a>

      {locked && upNext ? (
        <a class="dash__review dash__review--locked" href={cardHref(upNext.id)}>
          <span class="dash__due dash__lock" aria-hidden="true">
            <Icon name="lock" size={30} stroke={2.2} />
          </span>
          <span class="dash__due-label">Read your first napkin to unlock its flashcards</span>
          <span class="dash__go">
            Read {upNext.title} <span class="dash__go-meta mono">{upNext.minutes} min</span>{' '}
            <Icon name="arrowRight" size={16} />
          </span>
        </a>
      ) : (
        <a class="dash__review" href={href('review/')}>
          <span class="dash__due mono">{due === null ? '…' : due}</span>
          <span class="dash__due-label">
            {due === null
              ? 'cards'
              : due === 0
                ? 'nothing due, all caught up'
                : stats?.everReviewed
                  ? `card${due === 1 ? '' : 's'} ready to review`
                  : `new card${due === 1 ? '' : 's'} from napkins you've read`}
          </span>
          <span class="dash__go">
            {due ? 'Start review' : 'Open review'} <Icon name="arrowRight" size={16} />
          </span>
        </a>
      )}

      {upNext && !locked && (
        <a class={`dash__next t-${upNext.track}`} href={cardHref(upNext.id)}>
          <span class="eyebrow">{lastRead ? 'Up next' : 'Start with'}</span>
          <span class="dash__next-title">{upNext.title}</span>
          <span class="dash__next-meta">
            <span class="chip chip--track">{TRACK[upNext.track]}</span>
            <span class="mono">{upNext.minutes} min</span>
          </span>
        </a>
      )}

      {showChecklist && steps && (
        <section class="dash__first" aria-labelledby="dash-first">
          <h2 id="dash-first" class="dash__first-title">
            Your first three steps
          </h2>
          <ol>
            {steps.map((x, k) => (
              <li key={x.label} class={x.done ? 'is-done' : k === nextStep ? 'is-next' : ''}>
                <span class="dash__tick" aria-hidden="true">
                  {x.done ? <Icon name="check" size={14} stroke={3} /> : k + 1}
                </span>
                {x.done ? (
                  <span class="dash__step">
                    {x.label}
                    <span class="sr-only"> (done)</span>
                  </span>
                ) : (
                  <a class="dash__step" href={x.to}>
                    {x.label}
                    {x.note && <span class="dash__step-note mono">{x.note}</span>}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {(first === null || active || !showChecklist) && (
        <div class="dash__stats">
          <div>
            <b class="mono">{today?.reviews ?? 0}</b>
            <span>reviews today</span>
          </div>
          <div>
            <b class="mono">{read.size}</b>
            <span>napkins read</span>
          </div>
          <div>
            <b class="mono">{pct}%</b>
            <span>of the library</span>
          </div>
        </div>
      )}
    </aside>
  );
}
