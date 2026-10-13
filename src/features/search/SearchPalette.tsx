import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { prepare, type SearchDoc, type SearchHit, search } from '../../engine/search';
import { cardHref, href, withBase } from '../../lib/base';
import { Icon } from '../ui/Icon';

const TRACK_LABEL = { dsa: 'DSA', sysdesign: 'System Design', ds: 'Data Science' } as const;
const RECENT_KEY = 'napkin:recent';
const HINTS = ['LRU', 'quorum', 'softmax', 'binary search', 'load factor', 'token bucket'];

let indexPromise: Promise<ReturnType<typeof prepare>> | null = null;
const loadIndex = () => {
  indexPromise ??= fetch(withBase('search-index.json'))
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<SearchDoc[]>;
    })
    .then(prepare);
  indexPromise.catch(() => {
    indexPromise = null;
  });
  return indexPromise;
};

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function Highlighted({ text, marks }: { text: string; marks: [number, number][] }) {
  const out: (string | preact.JSX.Element)[] = [];
  let at = 0;
  marks.forEach(([s, e], i) => {
    out.push(text.slice(at, s));
    out.push(<mark key={i}>{text.slice(s, e)}</mark>);
    at = e;
  });
  out.push(text.slice(at));
  return <>{out}</>;
}

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<ReturnType<typeof prepare> | null>(null);
  const [error, setError] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const show = (from?: HTMLElement | null) => {
      opener.current = from ?? (document.activeElement as HTMLElement | null);
      setOpen(true);
      loadIndex()
        .then(setIndex)
        .catch(() => setError(true));
    };
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-open-search]');
      if (t) {
        e.preventDefault();
        show(t);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable]');
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        show();
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setQ('');
    setSel(0);
    opener.current?.focus?.();
  };

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => input.current?.focus());
    const el = dialog.current;
    const onClose = () => close();
    el?.addEventListener('napkin:close', onClose);
    return () => el?.removeEventListener('napkin:close', onClose);
  }, [open]);

  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 90);
    return () => clearTimeout(t);
  }, [q]);

  const hits: SearchHit[] = useMemo(() => (index ? search(index, debounced) : []), [index, debounced]);
  const recent = useMemo(() => {
    if (!index || debounced) return [];
    const ids = readRecent();
    return ids
      .map((id) => index.find((p) => p.doc.id === id)?.doc)
      .filter((d): d is SearchDoc => Boolean(d))
      .slice(0, 5);
  }, [index, debounced, open]);
  const list: SearchDoc[] = debounced ? hits.map((h) => h.doc) : recent;

  useEffect(() => setSel(0), [debounced]);

  if (!open) return null;

  const go = (d: SearchDoc) => {
    location.href = cardHref(d.id);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(list.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter' && list[sel]) {
      e.preventDefault();
      go(list[sel] as SearchDoc);
    } else if (e.key === 'Tab') {
      // keep focus inside the dialog
      const f = dialog.current?.querySelectorAll<HTMLElement>('input, button, a[href]');
      if (!f || f.length === 0) return;
      const first = f[0] as HTMLElement;
      const lastEl = f[f.length - 1] as HTMLElement;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div class="sp" data-back-closes ref={dialog}>
      <button class="sp__scrim" type="button" aria-label="Close search" tabIndex={-1} onClick={close} />
      <div
        class="sp__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search napkins"
        onKeyDown={onKeyDown}
      >
        <div class="sp__bar">
          <Icon name="search" size={20} />
          <input
            ref={input}
            class="sp__input"
            type="search"
            placeholder="Search napkins, e.g. “LRU” or “softmax”"
            value={q}
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
            aria-label="Search napkins"
            autocomplete="off"
            spellcheck={false}
            enterKeyHint="go"
          />
          <button class="sp__close" type="button" onClick={close} aria-label="Close search">
            <kbd>Esc</kbd>
          </button>
        </div>
        <div class="sp__body">
          {error && <p class="sp__empty">The search index isn't stocked yet. Connect once to load it.</p>}
          {!error && !index && <p class="sp__empty">Opening the index…</p>}
          {index && !debounced && (
            <div class="sp__hints">
              <span class="eyebrow">Try</span>
              {HINTS.map((h) => (
                <button key={h} type="button" class="chip" onClick={() => setQ(h)}>
                  {h}
                </button>
              ))}
            </div>
          )}
          {index && !debounced && recent.length > 0 && <p class="eyebrow sp__label">Recently read</p>}
          {index && debounced && hits.length === 0 && (
            <p class="sp__empty">
              No napkin matches “{debounced}”. Try a broader word, or browse the{' '}
              <a href={href('library/')}>library</a>.
            </p>
          )}
          <ul id="sp-results" class="sp__list" aria-label="Results">
            {list.map((d, i) => {
              const hit = debounced ? hits[i] : undefined;
              return (
                <li key={d.id} id={`sp-${i}`}>
                  <a
                    class={`sp__item t-${d.track}`}
                    href={cardHref(d.id)}
                    onMouseEnter={() => setSel(i)}
                    data-selected={i === sel}
                  >
                    <span class="sp__num mono">{String(d.number).padStart(3, '0')}</span>
                    <span class="sp__main">
                      <span class="sp__title">{d.title}</span>
                      <span class="sp__excerpt">
                        {hit ? <Highlighted text={hit.excerpt} marks={hit.marks} /> : d.tldr}
                      </span>
                    </span>
                    <span class="chip chip--track">{TRACK_LABEL[d.track]}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <div class="sp__foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>Enter</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}
