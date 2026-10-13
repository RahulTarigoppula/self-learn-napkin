import '../../styles/progress.css';
import { useEffect, useState } from 'preact/hooks';
import { type DayStat, getDb, type Session } from '../../db/dexie';
import { streakNow, tz } from '../../db/review';
import { readSettings } from '../../db/settings';
import { dayKey, State } from '../../engine/fsrs/scheduler';
import { ringLabel } from '../../engine/progress/rings';
import { shiftDay } from '../../engine/progress/streak';
import { formatReceipt } from '../../engine/receipt/format';
import { href } from '../../lib/base';
import { Icon } from '../ui/Icon';

interface TrackTotal {
  id: 'dsa' | 'sysdesign' | 'ds';
  name: string;
  total: number;
}

interface Data {
  streak: { current: number; best: number };
  days: Map<string, DayStat>;
  reviews: number;
  learned: number;
  mature: number;
  retention: number | null;
  read: Map<string, number>;
  forecast: number[];
  /** never-seen cards that will be introduced each day, at the daily new-card limit */
  forecastNew: number[];
  last: Session | undefined;
  lastBackupAt: number | null;
}

/** Weeks of heatmap on a wide card. Under 600px the card shows only the last WEEKS_NARROW (see progress.css). */
const WEEKS = 18;
const WEEKS_NARROW = 8;

export default function Progress({ tracks, startHref }: { tracks: TrackTotal[]; startHref: string }) {
  const [d, setD] = useState<Data | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const db = getDb();
    const now = new Date();
    void (async () => {
      const [days, cards, logs, reads, last, st] = await Promise.all([
        db.days.toArray(),
        db.cards.toArray(),
        db.logs
          .where('dayKey')
          .aboveOrEqual(shiftDay(dayKey(now, tz()), -30))
          .toArray(),
        db.reads.toArray(),
        db.sessions.orderBy('receiptNo').last(),
        streakNow(db, now),
      ]);
      const read = new Map<string, number>();
      for (const r of reads) {
        const t = r.slug.split('/')[0] ?? '';
        read.set(t, (read.get(t) ?? 0) + 1);
      }
      const forecast = Array.from({ length: 7 }, (_, i) => {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        end.setDate(end.getDate() + i);
        const start = new Date(end);
        start.setDate(start.getDate() - 1);
        return cards.filter(
          (c) => c.orphan === 0 && c.state !== State.New && c.due <= end && (i === 0 || c.due > start),
        ).length;
      });
      const todayKey = dayKey(now, tz());
      const perDay = readSettings().newPerDay;
      let unseen = cards.filter((c) => c.orphan === 0 && c.state === State.New).length;
      const introducedToday = cards.filter(
        (c) => c.introducedOn === todayKey && c.state !== State.New,
      ).length;
      const forecastNew = Array.from({ length: 7 }, (_, i) => {
        const n = Math.min(unseen, Math.max(0, perDay - (i === 0 ? introducedToday : 0)));
        unseen -= n;
        return n;
      });
      const graded = logs.filter((l) => l.rating >= 1);
      setD({
        streak: st,
        days: new Map(days.map((x) => [x.dayKey, x])),
        reviews: days.reduce((s, x) => s + x.reviews, 0),
        learned: cards.filter((c) => c.state !== State.New).length,
        mature: cards.filter((c) => c.scheduled_days >= 21).length,
        retention: graded.length ? graded.filter((l) => l.rating >= 3).length / graded.length : null,
        read,
        forecast,
        forecastNew,
        last,
        lastBackupAt: readSettings().lastBackupAt,
      });
    })().catch((e: unknown) => console.error('progress failed', e));
  }, []);

  if (!d)
    return (
      <div class="pg pg--loading" aria-busy="true">
        <p class="muted">Counting coffee rings…</p>
      </div>
    );

  const today = dayKey(new Date(), tz());
  const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = shiftDay(today, -(WEEKS - 1) * 7 - dow);
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => shiftDay(start, i));
  const activity = (k: string) => {
    const x = d.days.get(k);
    return x ? x.reviews + x.napkinsRead * 3 : 0;
  };
  const tier = (n: number) => (n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 30 ? 3 : 4);
  const totals = d.forecast.map((n, i) => n + (d.forecastNew[i] ?? 0));
  const maxF = Math.max(1, ...totals);
  const weekCards = totals.reduce((a, b) => a + b, 0);
  // About 8 seconds per card is a typical pace for short recall prompts.
  const weekMinutes = Math.max(1, Math.round((weekCards * 8) / 60));
  const backupDays = d.lastBackupAt ? Math.floor((Date.now() - d.lastBackupAt) / 86_400_000) : null;
  const hovered = hover ? d.days.get(hover) : undefined;
  const totalRead = [...d.read.values()].reduce((a, b) => a + b, 0);

  if (d.days.size === 0 && d.reviews === 0 && d.learned === 0 && totalRead === 0 && !d.last)
    return (
      <div class="pg">
        <section class="pg-empty paper" aria-labelledby="pg-empty-h">
          <svg class="pg-empty__doodle" viewBox="0 0 132 96" width="132" height="96" aria-hidden="true">
            <g transform="rotate(-5 58 46)">
              <rect class="d-napkin" x="14" y="12" width="88" height="68" rx="6" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect
                  key={i}
                  class={i === 5 ? 'd-lit' : 'd-cell'}
                  x={24 + i * 12}
                  y="30"
                  width="8"
                  height="8"
                  rx="2"
                />
              ))}
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} class="d-cell" x={24 + i * 12} y="42" width="8" height="8" rx="2" />
              ))}
              <path class="d-line" d="M24 64c8-4 14 3 22-1s14-3 22 0" />
            </g>
            <g transform="rotate(38 104 58)">
              <rect class="d-pencil" x="96" y="30" width="12" height="44" rx="2" />
              <path class="d-tip" d="M96 74h12l-6 12z" />
            </g>
          </svg>
          <h2 id="pg-empty-h">A clean napkin</h2>
          <p>
            This page fills in as you go: a square for each day you study, a ring for each track and a look at
            the cards coming up. It all starts with one napkin, about five minutes of reading.
          </p>
          <a class="btn btn--primary btn--lg" href={startHref}>
            <Icon name="play" size={17} /> Read your first napkin
          </a>
        </section>
      </div>
    );

  return (
    <div class="pg">
      <div class="pg__stats">
        <div class="pg__stat pg__stat--hot">
          <Icon name="flame" size={22} />
          <b class="mono">{d.streak.current}</b>
          <span>day streak</span>
          <small>best {d.streak.best}</small>
        </div>
        <div class="pg__stat">
          <b class="mono">{d.reviews}</b>
          <span>reviews</span>
        </div>
        <div class="pg__stat">
          <b class="mono">{d.learned}</b>
          <span>cards learned</span>
          <small>{d.mature} long-term</small>
        </div>
        <div class="pg__stat">
          <b class="mono">{d.retention === null ? '–' : `${Math.round(d.retention * 100)}%`}</b>
          <span>recall, 30 days</span>
          {d.retention === null && <small>no reviews this month</small>}
        </div>
      </div>

      <section class="pg__card pg__card--heat card" aria-labelledby="pg-heat">
        <div class="pg__head">
          <h2 id="pg-heat">
            Your last <span class="pg__wide">{WEEKS}</span>
            <span class="pg__narrow">{WEEKS_NARROW}</span> weeks
          </h2>
          <p class="muted pg__hover" aria-live="polite">
            {hover
              ? `${ringLabel(hover, hovered?.reviews ?? 0)}${hovered?.napkinsRead ? `, ${hovered.napkinsRead} napkin${hovered.napkinsRead === 1 ? '' : 's'} read` : ''}`
              : d.days.size === 0
                ? 'Each review or napkin you read lights up a square'
                : 'Hover or tap a day'}
          </p>
        </div>
        <div class="heat" role="group" aria-label="Daily activity calendar">
          {cells.map((k) => {
            const n = activity(k);
            const future = k > today;
            return (
              <button
                key={k}
                type="button"
                class={`heat__cell heat__cell--${tier(n)}${k === today ? ' is-today' : ''}`}
                disabled={future}
                aria-label={ringLabel(k, d.days.get(k)?.reviews ?? 0)}
                onMouseEnter={() => setHover(k)}
                onFocus={() => setHover(k)}
                onClick={() => setHover(k)}
              />
            );
          })}
        </div>
        <div class="heat__legend">
          less <i class="heat__cell heat__cell--0" /> <i class="heat__cell heat__cell--1" />{' '}
          <i class="heat__cell heat__cell--2" />
          <i class="heat__cell heat__cell--3" /> <i class="heat__cell heat__cell--4" /> more
        </div>
      </section>

      <div class="pg__two">
        <section class="pg__card card" aria-labelledby="pg-tracks">
          <h2 id="pg-tracks">Napkins read</h2>
          <div class="rings">
            {tracks.map((t) => {
              const n = d.read.get(t.id) ?? 0;
              const p = n / Math.max(1, t.total);
              const C = 2 * Math.PI * 34;
              return (
                <a key={t.id} class={`ringc t-${t.id}`} href={href(`${t.id}/`)}>
                  <svg viewBox="0 0 84 84" aria-hidden="true">
                    <circle
                      cx={42}
                      cy={42}
                      r={34}
                      style={{ fill: 'none', stroke: 'var(--surface-3)', strokeWidth: 9 }}
                    />
                    <circle
                      cx={42}
                      cy={42}
                      r={34}
                      style={{
                        fill: 'none',
                        stroke: 'var(--track)',
                        strokeWidth: 9,
                        strokeLinecap: 'round',
                        strokeDasharray: `${C * p} ${C}`,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '42px 42px',
                        transition: 'stroke-dasharray var(--dur-slow) var(--ease-out)',
                      }}
                    />
                  </svg>
                  <b class="mono">{Math.round(p * 100)}%</b>
                  <span>{t.name}</span>
                  <small class="mono">
                    {n}/{t.total}
                  </small>
                </a>
              );
            })}
          </div>
        </section>

        <section class="pg__card card" aria-labelledby="pg-fc">
          <h2 id="pg-fc">Coming up</h2>
          <p class="muted pg__sub">
            {weekCards === 0
              ? 'Nothing scheduled. Read a napkin and its flashcards will start showing up here.'
              : `${weekCards} cards over the next 7 days, roughly ${weekMinutes} minute${weekMinutes === 1 ? '' : 's'} in total.`}
          </p>
          <ol class="fc7">
            {d.forecast.map((n, i) => {
              const fresh = d.forecastNew[i] ?? 0;
              const total = n + fresh;
              const date = new Date();
              date.setDate(date.getDate() + i);
              const day = i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' });
              return (
                <li
                  key={i}
                  class={i === 0 ? 'is-today' : undefined}
                  aria-label={`${day}: ${n} reviews, ${fresh} new`}
                >
                  <span class="fc7__bar" aria-hidden="true">
                    {fresh > 0 && <span class="fc7__new" style={{ height: `${(fresh / maxF) * 100}%` }} />}
                    {n > 0 && <span class="fc7__due" style={{ height: `${(n / maxF) * 100}%` }} />}
                  </span>
                  <b class="mono">{total}</b>
                  <small>{day}</small>
                </li>
              );
            })}
          </ol>
          <p class="fc7__legend" aria-hidden="true">
            <i class="fc7__due" /> due again <i class="fc7__new" /> new cards
          </p>
        </section>
      </div>

      {d.last && (
        <section class="pg__card card" aria-labelledby="pg-last">
          <h2 id="pg-last">Last receipt</h2>
          <figure class="receipt receipt--small">
            <pre role="log">
              {formatReceipt({
                lines: d.last.lines,
                order: d.last.receiptNo,
                streak: d.streak.current,
                now: new Date(d.last.endedAt ?? d.last.startedAt),
                tz: tz(),
              }).join('\n')}
            </pre>
          </figure>
        </section>
      )}

      <p class={`pg__backup${backupDays !== null && backupDays < 14 ? '' : ' is-due'}`}>
        <Icon name="download" size={16} />
        {backupDays === null
          ? 'Your progress lives only on this device. '
          : `Last backup: ${backupDays} day${backupDays === 1 ? '' : 's'} ago. `}
        <a href={href('settings/#backup')}>Back it up</a>
      </p>
    </div>
  );
}
