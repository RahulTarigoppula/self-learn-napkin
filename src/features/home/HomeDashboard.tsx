import { useEffect, useState } from 'preact/hooks';
import { getDb } from '../../db/dexie';
import { tz } from '../../db/review';
import { dayKey } from '../../engine/fsrs/scheduler';
import { cardHref, href } from '../../lib/base';
import { lastStats, type ShellStats } from '../shell/shell';
import { Icon } from '../ui/Icon';

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

export default function HomeDashboard({ cards }: { cards: Lite[]; tracks: { id: string; total: number }[] }) {
  const [stats, setStats] = useState<ShellStats | null>(lastStats());
  const [today, setToday] = useState<{ reviews: number; read: number } | null>(null);
  const [lastRead, setLastRead] = useState<string | null>(null);
  const [hello, setHello] = useState('Hello');

  useEffect(() => {
    setHello(greeting(new Date().getHours()));
    const on = (e: Event) => setStats((e as CustomEvent<ShellStats>).detail);
    document.addEventListener('napkin:stats', on);
    const db = getDb();
    void Promise.all([db.days.get(dayKey(new Date(), tz())), db.reads.orderBy('readAt').last()])
      .then(([d, r]) => {
        setToday({ reviews: d?.reviews ?? 0, read: d?.napkinsRead ?? 0 });
        setLastRead(r?.slug ?? null);
      })
      .catch((e: unknown) => console.warn('dashboard unavailable', e));
    return () => document.removeEventListener('napkin:stats', on);
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

      <a class="dash__review" href={href('review/')}>
        <span class="dash__due mono">{due === null ? '—' : due}</span>
        <span class="dash__due-label">
          {due === null
            ? 'cards'
            : due === 0
              ? 'nothing due — all caught up'
              : stats?.everReviewed
                ? `card${due === 1 ? '' : 's'} ready to review`
                : `new flashcard${due === 1 ? '' : 's'} to start with`}
        </span>
        <span class="dash__go">
          {due ? 'Start review' : 'Open review'} <Icon name="arrowRight" size={16} />
        </span>
      </a>

      {upNext && (
        <a class={`dash__next t-${upNext.track}`} href={cardHref(upNext.id)}>
          <span class="eyebrow">{lastRead ? 'Up next' : 'Start with'}</span>
          <span class="dash__next-title">{upNext.title}</span>
          <span class="dash__next-meta">
            <span class="chip chip--track">{TRACK[upNext.track]}</span>
            <span class="mono">{upNext.minutes} min</span>
          </span>
        </a>
      )}

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
    </aside>
  );
}
