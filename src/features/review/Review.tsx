import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { getDb, type ReviewCard, type SessionLine } from '../../db/dexie';
import {
  currentQueue,
  type DeckItem,
  ensureSeeded,
  lineFor,
  newSessionId,
  rate,
  saveSession,
  streakNow,
  tz,
  unlockedNewCount,
} from '../../db/review';
import { readSettings } from '../../db/settings';
import { parseCloze } from '../../engine/cloze/parse';
import {
  dayKey,
  GRADE,
  type Preview,
  preview,
  RATING_NAMES,
  type RatingName,
  spokenInterval,
} from '../../engine/fsrs/scheduler';
import { formatReceipt } from '../../engine/receipt/format';
import { APP_VERSION, cardHref, href } from '../../lib/base';
import { inlineMd } from '../../lib/inline-md';
import { toast } from '../../lib/toast';
import { haptic } from '../../platform/haptics';
import { shareFile } from '../../platform/share';
import { sound } from '../../platform/sound';
import { celebrate, setCelebrateScope } from '../game/celebrate';
import { Icon } from '../ui/Icon';
import '../../styles/quiz-review.css';

const TRACK = { dsa: 'DSA', sysdesign: 'System Design', ds: 'Data Science' } as const;
const LABEL: Record<RatingName, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };
const HINT: Record<RatingName, string> = {
  again: 'forgot',
  hard: 'struggled',
  good: 'got it',
  easy: 'too easy',
};

type Phase = 'loading' | 'empty' | 'session' | 'done' | 'error';

function Cloze({ text, reveal }: { text: string; reveal: boolean }) {
  const segs = useMemo(() => parseCloze(text), [text]);
  return (
    <>
      {segs.map((s, i) =>
        s.t === 'text' ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: inlineMd(s.v) }} />
        ) : reveal ? (
          <mark key={i} class="rv__fill">
            {s.v}
          </mark>
        ) : (
          <span key={i} class="rv__blank">
            <span aria-hidden="true">?</span>
            <span class="sr-only">blank</span>
          </span>
        ),
      )}
    </>
  );
}

export default function Review() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [deck, setDeck] = useState<Map<string, DeckItem>>(new Map());
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<SessionLine[]>([]);
  const [receipt, setReceipt] = useState<{ text: string[]; no: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const [scope, setScope] = useState<{ topic: string | null; track: string | null }>({
    topic: null,
    track: null,
  });
  const sessionId = useRef(newSessionId());
  const startedAt = useRef(Date.now());
  const total = useRef(0);
  const pointer = useRef<{ x: number; y: number; t: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const lastBtn = useRef<Element | null>(null);
  /** For the empty screen: how many napkins are read, and how many new cards they still hold. */
  const [unlock, setUnlock] = useState<{ read: number; waiting: number } | null>(null);

  const load = useCallback(async (extraNew = 0) => {
    try {
      const params = new URLSearchParams(location.search);
      const topic = params.get('topic');
      const track = params.get('track');
      setScope({ topic, track });
      const db = getDb();
      const d = await ensureSeeded(db);
      const map = new Map(d.items.map((i) => [i.id, i]));
      setDeck(map);
      let q = await currentQueue(db, new Date(), readSettings().newPerDay + extraNew, topic);
      if (track) q = q.filter((c) => c.track === track);
      q = q.filter((c) => map.has(c.id));
      setQueue(q);
      total.current = q.length;
      setIdx(0);
      setRevealed(false);
      if (!q.length && !topic) {
        const [read, waiting] = await Promise.all([db.reads.count(), unlockedNewCount(db)]);
        setUnlock({ read, waiting });
      }
      setPhase(q.length ? 'session' : 'empty');
      setStreak((await streakNow(db)).current);
    } catch (e) {
      console.error(e);
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // During a session, any burst (an achievement unlocking after a rating) pops briefly from the button that
  // was pressed and sits behind the card, so it never covers the next question.
  useEffect(() => {
    if (phase !== 'session') return;
    setCelebrateScope(() => {
      const r = lastBtn.current?.getBoundingClientRect();
      return {
        origin: r ? { x: r.left + r.width / 2, y: r.top } : undefined,
        count: 40,
        duration: 600,
        zIndex: 0,
        parent: root.current ?? undefined,
      };
    });
    return () => setCelebrateScope(null);
  }, [phase]);

  const card = queue[idx];
  const item = card ? deck.get(card.id) : undefined;
  const pv: Preview | null = useMemo(() => (card ? preview(card, new Date()) : null), [card]);

  const finish = useCallback(async (finalLines: SessionLine[]) => {
    const db = getDb();
    const now = new Date();
    const s = await saveSession(db, {
      id: sessionId.current,
      startedAt: startedAt.current,
      endedAt: now.getTime(),
      dayKey: dayKey(now, tz()),
      lines: finalLines,
    });
    const st = await streakNow(db, now);
    setStreak(st.current);
    setReceipt({
      no: s.receiptNo,
      text: formatReceipt({ lines: finalLines, order: s.receiptNo, streak: st.current, now, tz: tz() }),
    });
    setPhase('done');
    celebrate(undefined, 90, {});
    document.dispatchEvent(new CustomEvent('napkin:progress'));
  }, []);

  const doRate = useCallback(
    async (name: RatingName) => {
      if (!card || !item || !revealed || busy) return;
      setBusy(true);
      lastBtn.current = root.current?.querySelector(`.rv__btn--${name}`) ?? null;
      const now = new Date();
      try {
        const next = await rate(getDb(), card, GRADE[name], sessionId.current, now);
        const line = lineFor(item.title, GRADE[name], now, next);
        const newLines = [...lines, line];
        setLines(newLines);
        sound.click();
        void haptic.selection();
        setLeaving(name === 'again' ? 'left' : 'right');
        // A card that comes back within ten minutes is shown again later in this session.
        const requeue = next.due.getTime() - now.getTime() < 10 * 60_000 && name !== 'easy';
        const nextQueue = requeue ? [...queue, next] : queue;
        window.setTimeout(() => {
          setLeaving(null);
          setRevealed(false);
          setQueue(nextQueue);
          if (idx + 1 >= nextQueue.length) void finish(newLines);
          else setIdx(idx + 1);
          setBusy(false);
        }, 220);
        document.dispatchEvent(new CustomEvent('napkin:progress'));
      } catch (e) {
        console.error(e);
        toast("Couldn't save that rating. Tap again to retry.", { danger: true });
        setBusy(false);
      }
    },
    [card, item, revealed, busy, lines, queue, idx, finish],
  );

  const flip = useCallback(() => {
    if (phase !== 'session' || revealed) return;
    setRevealed(true);
    sound.flip();
    void haptic.light();
  }, [phase, revealed]);

  // One stable listener that always sees the latest state (no gap while effects re-run after a render).
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined);
  keyRef.current = (e: KeyboardEvent) => {
    if (phase !== 'session' || (e.target as HTMLElement).closest('input, textarea')) return;
    if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
      e.preventDefault();
      flip();
    } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      void doRate(RATING_NAMES[Number(e.key) - 1] as RatingName);
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const onPointerDown = (e: PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onPointerUp = (e: PointerEvent) => {
    const p = pointer.current;
    pointer.current = null;
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      flip();
      return;
    }
    if (!revealed || p.x < 32 || p.x > innerWidth - 32) return;
    if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) void doRate(dx > 0 ? 'good' : 'again');
  };

  const shareReceipt = async () => {
    if (!receipt) return;
    try {
      const blob = await receiptPng(receipt.text);
      const r = await shareFile(
        `napkin-receipt-${String(receipt.no).padStart(4, '0')}.png`,
        blob,
        'My Napkin study receipt',
      );
      sound.rip();
      void haptic.medium();
      if (r === 'downloaded') toast('Receipt saved as an image.');
    } catch (e) {
      console.error(e);
      toast("Couldn't create the image on this device.", { danger: true });
    }
  };

  if (phase === 'loading')
    return (
      <div class="rv rv--center" aria-busy="true">
        <p class="muted">Shuffling the deck…</p>
      </div>
    );

  if (phase === 'error')
    return (
      <div class="rv rv--center">
        <h2>The deck didn't load</h2>
        <p class="muted">Connect once so the cards can be stocked for offline use, then try again.</p>
        <button type="button" class="btn btn--primary" onClick={() => void load()}>
          <Icon name="replay" size={16} /> Try again
        </button>
      </div>
    );

  const locked = !scope.topic && unlock?.read === 0;
  if (phase === 'empty')
    return (
      <div class="rv rv--center">
        <div class="rv__done-art" aria-hidden="true">
          <Icon name="check" size={40} stroke={2.5} />
        </div>
        <h2>{locked ? 'Your deck fills as you read' : 'All caught up.'}</h2>
        <p class="muted">
          {scope.topic
            ? 'No cards left for this napkin right now.'
            : locked
              ? "Flashcards unlock once you've read their napkin, so you only ever recall things you've seen. Read one and mark it read, and its cards show up here."
              : unlock && unlock.waiting === 0
                ? "Nothing is due, and you've started every card from the napkins you've read. Read another napkin to unlock more."
                : 'Nothing is due. Spaced repetition works best a little every day, so come back tomorrow or learn a few new cards now.'}
        </p>
        <div class="rv__row">
          {locked && (
            <a class="btn btn--primary" href={href('library/')}>
              <Icon name="library" size={16} /> Pick a napkin to read
            </a>
          )}
          {!scope.topic && !locked && (unlock?.waiting ?? 1) > 0 && (
            <button type="button" class="btn btn--primary" onClick={() => void load(5)}>
              <Icon name="plus" size={16} /> Learn 5 new cards
            </button>
          )}
          <a class="btn" href={href('quiz/')}>
            Take a quick quiz
          </a>
          {!locked && (
            <a class="btn btn--ghost" href={href('library/')}>
              Browse napkins
            </a>
          )}
        </div>
      </div>
    );

  if (phase === 'done' && receipt) {
    const good = lines.filter((l) => l.rating >= 3).length;
    return (
      <div class="rv rv--center rv--done">
        <h2>Session done! 🎉</h2>
        <p class="muted">
          {lines.length} card{lines.length === 1 ? '' : 's'} ·{' '}
          {Math.round((good / Math.max(1, lines.length)) * 100)}% recalled · {streak}-day streak
        </p>
        <figure class="receipt" aria-label="Session receipt">
          <pre role="log">{receipt.text.join('\n')}</pre>
          <figcaption class="mono">NAPKIN {APP_VERSION}</figcaption>
        </figure>
        <div class="rv__row">
          <button type="button" class="btn" onClick={() => void shareReceipt()}>
            <Icon name="share" size={16} /> Share receipt
          </button>
          <a class="btn btn--primary" href={scope.topic ? cardHref(scope.topic) : href('')}>
            Done
          </a>
        </div>
      </div>
    );
  }

  if (!card || !item || !pv) return null;
  const left = queue.length - idx;
  const pct = Math.round((idx / Math.max(1, queue.length)) * 100);

  return (
    <div class={`rv rv--session t-${item.track}`} ref={root} data-review-active>
      <div class="rv__bar">
        <a
          class="btn btn--ghost btn--icon"
          href={scope.topic ? cardHref(scope.topic) : href('')}
          aria-label="Leave review (progress is saved)"
        >
          <Icon name="x" />
        </a>
        <div
          class="rv__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={idx}
          aria-label="Session progress"
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <span class="rv__count mono">{left} left</span>
      </div>

      <div
        class={`rv__card${revealed ? ' is-revealed' : ''}${leaving ? ` is-leaving-${leaving}` : ''}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        key={`${card.id}-${idx}`}
      >
        <div class="rv__inner">
          <div class="rv__face rv__front" aria-hidden={revealed} inert={revealed}>
            <div class="rv__meta">
              <span class="chip chip--track">{TRACK[item.track]}</span>
              <span class="mono">
                No. {String(item.number).padStart(3, '0')} · {item.title}
              </span>
            </div>
            <p class="rv__q">
              <span>
                {item.kind === 'cloze' && item.cloze ? (
                  <Cloze text={item.cloze} reveal={false} />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: inlineMd(item.front) }} />
                )}
              </span>
            </p>
            <button type="button" class="btn btn--primary btn--lg rv__show" onClick={flip}>
              Show answer <kbd>Space</kbd>
            </button>
          </div>
          <div class="rv__face rv__back" aria-hidden={!revealed} inert={!revealed}>
            <div class="rv__meta">
              <span class="chip chip--track">{TRACK[item.track]}</span>
              <a class="mono rv__src" href={cardHref(item.slug)}>
                No. {String(item.number).padStart(3, '0')} · {item.title} ↗
              </a>
            </div>
            <div class="rv__qa">
              {item.kind === 'qa' && (
                <p class="rv__asked" dangerouslySetInnerHTML={{ __html: inlineMd(item.front) }} />
              )}
              <p class="rv__a">
                {item.kind === 'cloze' && item.cloze ? (
                  <Cloze text={item.cloze} reveal />
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: inlineMd(item.back) }} />
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        class={`rv__rate${revealed ? ' is-armed' : ''}`}
        role="group"
        aria-label="How well did you recall it?"
      >
        {RATING_NAMES.map((n, i) => (
          <button
            key={n}
            type="button"
            class={`rv__btn rv__btn--${n}`}
            disabled={!revealed || busy}
            aria-disabled={!revealed || busy}
            aria-label={`${LABEL[n]}, ${spokenInterval(pv[n])}`}
            onClick={() => void doRate(n)}
          >
            <span class="rv__btn-label">{LABEL[n]}</span>
            <span class="rv__btn-int mono">{pv[n]}</span>
            <span class="rv__btn-hint">
              <kbd>{i + 1}</kbd> {HINT[n]}
            </span>
          </button>
        ))}
      </div>
      <p class="rv__tip muted">
        {revealed
          ? 'Be honest. The schedule adapts to you. Swipe right for Good, left for Again.'
          : 'Recall the answer in your head first, then reveal.'}
      </p>
    </div>
  );
}

/** Render the receipt lines to a 2× PNG with the page's own mono font. */
async function receiptPng(lines: string[]): Promise<Blob> {
  await document.fonts.load('16px "JetBrains Mono"');
  const scale = 2;
  const fs = 16;
  const lh = 24;
  const pad = 28;
  const ctx0 = document.createElement('canvas').getContext('2d');
  if (!ctx0) throw new Error('no canvas');
  ctx0.font = `${fs}px "JetBrains Mono", monospace`;
  const w = Math.ceil(ctx0.measureText('M'.repeat(32)).width) + pad * 2;
  const h = pad * 2 + lh * (lines.length + 2);
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#16181d';
  ctx.font = `${fs}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => {
    ctx.fillText(l, pad, pad + i * lh);
  });
  ctx.fillStyle = '#9aa0ae';
  ctx.font = `12px "JetBrains Mono", monospace`;
  ctx.fillText(`NAPKIN ${APP_VERSION}`, pad, pad + (lines.length + 1) * lh);
  // jagged tear along the bottom edge
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  for (let x = 0; x <= w; x += 12) {
    ctx.moveTo(x, h);
    ctx.lineTo(x + 6, h - 7);
    ctx.lineTo(x + 12, h);
  }
  ctx.fill();
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}
