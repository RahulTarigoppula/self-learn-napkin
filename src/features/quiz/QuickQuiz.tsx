import { useEffect, useMemo, useState } from 'preact/hooks';
import { cardHref, withBase } from '../../lib/base';
import { haptic } from '../../platform/haptics';
import { sound } from '../../platform/sound';
import { Icon } from '../ui/Icon';

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
  // biome-ignore lint/security/noDangerouslySetInnerHtml: our own build-time content, HTML-escaped first
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
      picks.push(q);
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!round || i >= round.length) return;
      if (picked === null && ['1', '2', '3', '4'].includes(e.key)) choose(Number(e.key) - 1);
      else if (picked !== null && (e.key === 'Enter' || e.key === 'ArrowRight')) next();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (error)
    return (
      <div class="qq qq--center">
        <p>The question bank isn't stocked yet — connect once to load it.</p>
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
      <div class="qq qq--setup card">
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
      <div class="qq">
        <div class="qq__result card">
          <p class="qq__score mono">
            {score}/{round.length}
          </p>
          <p class="qq__verdict">
            {score === round.length
              ? 'Perfect round. Interview-ready on these.'
              : score >= round.length * 0.7
                ? 'Strong. Patch the few gaps below.'
                : 'Good practice — the napkins below will close the gaps.'}
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
  return (
    <div class={`qq t-${item.track}`}>
      <div class="qq__bar">
        <span class="mono">
          {i + 1}/{round.length}
        </span>
        <span class="rv__progress" aria-hidden="true">
          <span style={{ width: `${(i / round.length) * 100}%` }} />
        </span>
        <span class="mono qq__tally">{answers.filter((a) => a.ok).length} ✓</span>
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
        {picked !== null && (
          <div class="qq__why" aria-live="polite">
            <strong>{picked === item.answer ? 'Right. ' : 'Not quite. '}</strong>
            <Md text={item.why} />
            <div class="qq__row">
              <button type="button" class="btn btn--primary" onClick={next}>
                {i + 1 === round.length ? 'See results' : 'Next question'}{' '}
                <Icon name="arrowRight" size={16} />
              </button>
              <a class="btn btn--ghost" href={cardHref(item.slug)}>
                Open the napkin
              </a>
            </div>
          </div>
        )}
      </article>
      <p class="muted qq__hint">Keys 1–4 answer, Enter moves on.</p>
    </div>
  );
}
