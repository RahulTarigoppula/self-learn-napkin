import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getDb } from '../../db/dexie';
import { recordQuickQuiz } from '../../db/review';
import { prefersReducedMotion } from '../../db/settings';
import { shuffleOptions } from '../../engine/quiz/shuffle';
import { cardHref, withBase } from '../../lib/base';
import { haptic } from '../../platform/haptics';
import { sound } from '../../platform/sound';
import { celebrate } from '../game/celebrate';
import { Icon } from '../ui/Icon';
import '../../styles/quiz-review.css';

interface QuizItem {
  id: string;
  slug: string;
  number: number;
  title: string;
  track: 'dsa' | 'sysdesign' | 'ds';
  q: string;
  options: string[];
  answer: number;
  why: string;
}

type Track = 'all' | QuizItem['track'];
const TRACKS: { v: Track; label: string }[] = [
  { v: 'all', label: 'Everything' },
  { v: 'dsa', label: 'DSA' },
  { v: 'sysdesign', label: 'System Design' },
  { v: 'ds', label: 'Data Science' },
];
const LENGTHS = [5, 10, 20];
const LETTERS = ['A', 'B', 'C', 'D'];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** The same tiny inline markdown as the napkin pages: **bold** and `code`. */
const md = (s: string) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

function Md({ text, as = 'span' }: { text: string; as?: 'span' | 'p' }) {
  const Tag = as;
  return <Tag dangerouslySetInnerHTML={{ __html: md(text) }} />;
}

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export default function QuickQuiz() {
  const [all, setAll] = useState<QuizItem[] | null>(null);
  const [error, setError] = useState(false);
  const [track, setTrack] = useState<Track>('all');
  const [length, setLength] = useState(10);
  const [round, setRound] = useState<QuizItem[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ item: QuizItem; ok: boolean }[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const playing = round !== null && i < round.length;

  useEffect(() => {
    fetch(withBase('quiz-index.json'))
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<QuizItem[]>;
      })
      .then(setAll)
      .catch(() => setError(true));
    const t = new URLSearchParams(location.search).get('track');
    if (t === 'dsa' || t === 'sysdesign' || t === 'ds') setTrack(t);
  }, []);

  const pool = useMemo(() => (all ?? []).filter((q) => track === 'all' || q.track === track), [all, track]);

  const start = () => {
    // at most one question per napkin per round, so a round covers many topics
    const seen = new Set<string>();
    const picks: QuizItem[] = [];
    for (const q of shuffle(pool)) {
      if (seen.has(q.slug)) continue;
      seen.add(q.slug);
      picks.push(shuffleOptions(q, Math.floor(Math.random() * 2 ** 31)));
      if (picks.length === length) break;
    }
    setRound(picks);
    setI(0);
    setPicked(null);
    setAnswers([]);
  };

  const choose = (k: number) => {
    if (!round || picked !== null) return;
    const item = round[i] as QuizItem;
    const ok = k === item.answer;
    setPicked(k);
    setAnswers((a) => [...a, { item, ok }]);
    if (ok) {
      sound.good();
      void haptic.light();
    } else void haptic.medium();
  };

  const next = () => {
    setPicked(null);
    setI((x) => x + 1);
  };

  // A strong round ends with confetti.
  const finished = round !== null && i >= round.length;
  useEffect(() => {
    if (!finished || !round) return;
    const score = answers.filter((a) => a.ok).length;
    if (score >= round.length * 0.8) celebrate();
    recordQuickQuiz(getDb(), score, round.length)
      .then(() => document.dispatchEvent(new CustomEvent('napkin:progress')))
      .catch((e: unknown) => console.warn('quiz round not saved', e));
  }, [finished]);

  // While a round runs the page is a focus screen: no tab bar, no intro, just the question.
  useLayoutEffect(() => {
    const el = root.current;
    const shell = el?.closest('.shell');
    const page = el?.closest('.quiz-page');
    shell?.classList.toggle('shell--focus', playing);
    page?.classList.toggle('is-playing', playing);
    return () => {
      shell?.classList.remove('shell--focus');
      page?.classList.remove('is-playing');
    };
  }, [playing]);

  // Each new question (and the results) starts at the top; the answer sheet takes focus so Enter or a tap moves on.
  useEffect(() => {
    if (round) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [i, round]);
  useEffect(() => {
    if (picked !== null) nextBtn.current?.focus({ preventScroll: true });
  }, [picked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!round || i >= round.length) return;
      if (picked === null && ['1', '2', '3', '4'].includes(e.key)) choose(Number(e.key) - 1);
      else if (picked !== null && e.key === 'ArrowRight') next();
      else if (picked !== null && e.key === 'Enter' && !(e.target as HTMLElement).closest?.('a, button'))
        next();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (error)
    return (
      <div class="qq qq--center">
        <p>The question bank isn't stocked yet. Connect once to load it.</p>
      </div>
    );
  if (!all)
    return (
      <div class="qq qq--center" aria-busy="true">
        <p class="muted">Shuffling questions…</p>
      </div>
    );

  if (!round)
    return (
      <div class="qq qq--setup card" ref={root}>
        <p class="eyebrow">Set up a round</p>
        <div class="qq__row">
          <span class="qq__label">Topics</span>
          <div class="st__seg" role="radiogroup" aria-label="Topics">
            {TRACKS.map((t) => (
              <button
                key={t.v}
                type="button"
                role="radio"
                aria-checked={track === t.v}
                onClick={() => setTrack(t.v)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div class="qq__row">
          <span class="qq__label">Questions</span>
          <div class="st__seg" role="radiogroup" aria-label="Number of questions">
            {LENGTHS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={length === n}
                onClick={() => setLength(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <p class="muted qq__pool">
          {pool.length} questions available across {new Set(pool.map((q) => q.slug)).size} napkins.
        </p>
        <button type="button" class="btn btn--primary btn--lg" onClick={start} disabled={pool.length === 0}>
          <Icon name="play" size={17} /> Start the round
        </button>
      </div>
    );

  if (i >= round.length) {
    const score = answers.filter((a) => a.ok).length;
    const misses = answers.filter((a) => !a.ok);
    return (
      <div class="qq" ref={root}>
        <div class="qq__result card">
          <p class="qq__score mono">
            {score}/{round.length}
          </p>
          <p class="qq__verdict">
            {score === round.length
              ? 'Perfect round. Interview-ready on these.'
              : score >= round.length * 0.7
                ? 'Strong. Patch the few gaps below.'
                : 'Good practice. The napkins below will close the gaps.'}
          </p>
          <div class="qq__row">
            <button type="button" class="btn btn--primary" onClick={start}>
              <Icon name="replay" size={16} /> Another round
            </button>
            <button type="button" class="btn" onClick={() => setRound(null)}>
              Change topics
            </button>
          </div>
        </div>
        {misses.length > 0 && (
          <section class="qq__misses" aria-labelledby="qq-miss">
            <h2 id="qq-miss">Worth another look</h2>
            <ul>
              {misses.map(({ item }) => (
                <li key={item.id} class={`t-${item.track}`}>
                  <a href={`${cardHref(item.slug)}#check`}>
                    <span class="chip chip--track">{item.title}</span>
                    <Md text={item.q} />
                    <span class="qq__ans">
                      Answer: <Md text={item.options[item.answer] ?? ''} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const item = round[i] as QuizItem;
  let combo = 0;
  for (let k = answers.length - 1; k >= 0 && answers[k]?.ok; k--) combo++;
  const right = picked === item.answer;
  return (
    <div class={`qq qq--play t-${item.track}`} ref={root}>
      <div class="qq__bar">
        <button
          type="button"
          class="btn btn--ghost btn--icon"
          aria-label="End this round"
          onClick={() => setRound(null)}
        >
          <Icon name="x" />
        </button>
        <span
          class="rv__progress"
          role="progressbar"
          aria-label="Round progress"
          aria-valuemin={0}
          aria-valuemax={round.length}
          aria-valuenow={i}
        >
          <span style={{ width: `${(i / round.length) * 100}%` }} />
        </span>
        <span class="mono qq__count">
          {i + 1}/{round.length}
        </span>
      </div>
      <div class="qq__status">
        {answers.length > 0 && (
          <span class="mono qq__tally">
            {answers.filter((a) => a.ok).length} of {answers.length} right
          </span>
        )}
        {combo >= 3 && (
          <span class="qq__combo mono" key={combo}>
            <Icon name="flame" size={14} /> {combo} in a row
          </span>
        )}
      </div>
      <article class="qq__card card" key={item.id}>
        <a class="chip chip--track qq__src" href={cardHref(item.slug)}>
          No. {String(item.number).padStart(3, '0')} · {item.title}
        </a>
        <p class="qq__q" id="qq-q">
          <Md text={item.q} />
        </p>
        <div class="qq__opts" role="group" aria-labelledby="qq-q">
          {item.options.map((o, k) => {
            const state = picked === null ? '' : k === item.answer ? 'right' : k === picked ? 'wrong' : 'dim';
            return (
              <button
                key={k}
                type="button"
                class={`quiz__opt qq__opt ${state ? `is-${state}` : ''}`}
                aria-disabled={picked !== null}
                onClick={() => choose(k)}
              >
                <span class="quiz__letter mono">{LETTERS[k]}</span>
                <Md text={o} />
              </button>
            );
          })}
        </div>
      </article>
      {picked === null && <p class="muted qq__hint">Keys 1 to 4 answer, Enter moves on.</p>}
      {picked !== null && (
        <div
          class={`qq__why qq__sheet ${right ? 'is-right' : 'is-wrong'}`}
          role="region"
          aria-label="Answer"
          aria-live="polite"
        >
          <p class="qq__verdict-line">
            <span class="qq__badge" aria-hidden="true">
              <Icon name={right ? 'check' : 'x'} size={18} stroke={3} />
            </span>
            <strong>{right ? 'Right.' : 'Not quite.'}</strong>
          </p>
          {!right && (
            <p class="qq__correct">
              Answer: <Md text={item.options[item.answer] ?? ''} />
            </p>
          )}
          <p class="qq__explain">
            <Md text={item.why} />
          </p>
          <div class="qq__sheet-row">
            <button type="button" class="btn btn--primary btn--lg qq__next" onClick={next} ref={nextBtn}>
              {i + 1 === round.length ? 'See results' : 'Next question'} <Icon name="arrowRight" size={16} />
            </button>
            <a class="btn btn--ghost" href={cardHref(item.slug)}>
              Open the napkin
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
