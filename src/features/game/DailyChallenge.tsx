import { useEffect, useRef, useState } from 'preact/hooks';
import { dailyIndex, dailyStreak } from '../../engine/game/game';
import { shuffleOptions } from '../../engine/quiz/shuffle';
import { cardHref, withBase } from '../../lib/base';
import { inlineMd } from '../../lib/inline-md';
import { haptic } from '../../platform/haptics';
import { Icon } from '../ui/Icon';
import { celebrateFrom } from './celebrate';
import { loadGame, recordDaily, today } from './store';

interface Q {
  id: string;
  slug: string;
  title: string;
  q: string;
  options: string[];
  answer: number;
  why: string;
}

const LETTERS = ['A', 'B', 'C', 'D'];

/** One question a day for everyone, answered right on the home page. */
export default function DailyChallenge() {
  const [q, setQ] = useState<Q | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [already, setAlready] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const day = today();
    void Promise.all([
      fetch(withBase('quiz-index.json')).then((r) => r.json() as Promise<Q[]>),
      loadGame().catch(() => null),
    ])
      .then(([pool, g]) => {
        const item = pool[dailyIndex(day, pool.length)];
        if (!item) throw new Error('empty quiz pool');
        setQ(shuffleOptions(item));
        if (g && day in g.daily) {
          setAlready(g.daily[day] ?? false);
          setStreak(dailyStreak(g.daily, day));
        } else if (g) setStreak(dailyStreak(g.daily, day));
      })
      .catch((e: unknown) => {
        console.warn('daily challenge unavailable', e);
        setFailed(true);
      });
  }, []);

  if (failed) return null;
  if (!q)
    return (
      <div class="daily card daily--loading" aria-busy="true">
        <p class="daily__label hand">Daily challenge</p>
        <p class="daily__q">Picking today's question…</p>
      </div>
    );

  const done = picked !== null || already !== null;
  const right = picked !== null ? picked === q.answer : already === true;

  const choose = (i: number, el: HTMLElement) => {
    if (done) return;
    setPicked(i);
    const ok = i === q.answer;
    setStreak((s) => s + 1);
    if (ok) celebrateFrom(el, 70);
    else void haptic.medium();
    void recordDaily(ok).catch(() => undefined);
  };

  return (
    <div class="daily card" ref={box}>
      <div class="daily__head">
        <p class="daily__label hand">
          <Icon name="calendar" size={18} /> Daily challenge
        </p>
        <span class="daily__streak mono" title="Days in a row">
          <Icon name="flame" size={15} /> {streak} {streak === 1 ? 'day' : 'days'}
        </span>
      </div>
      <p class="daily__q" dangerouslySetInnerHTML={{ __html: inlineMd(q.q) }} />
      <div class="daily__opts" role="group" aria-label="Answers">
        {q.options.map((o, i) => {
          const state = !done ? undefined : i === q.answer ? 'right' : i === picked ? 'wrong' : undefined;
          return (
            <button
              key={o}
              type="button"
              class="daily__opt"
              data-state={state}
              aria-disabled={done ? 'true' : undefined}
              onClick={(e) => choose(i, e.currentTarget)}
            >
              <span class="daily__letter mono">{LETTERS[i]}</span>
              <span dangerouslySetInnerHTML={{ __html: inlineMd(o) }} />
            </button>
          );
        })}
      </div>
      {done && (
        <div class="daily__why" aria-live="polite">
          <p>
            <strong>
              {right
                ? 'Right! +10 XP. '
                : already !== null && picked === null
                  ? 'Answered today. '
                  : 'Not quite. '}
            </strong>
            <span dangerouslySetInnerHTML={{ __html: inlineMd(q.why) }} />
          </p>
          <a class="daily__link" href={cardHref(q.slug)}>
            Learn it in {q.title} <Icon name="arrowRight" size={14} />
          </a>
          <p class="daily__next muted">A new question appears tomorrow.</p>
        </div>
      )}
    </div>
  );
}
