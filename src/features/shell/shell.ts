import { getDb } from '../../db/dexie';
import { currentQueue, ensureSeeded, everReviewed, streakNow } from '../../db/review';
import { readSettings } from '../../db/settings';

export interface ShellStats {
  due: number;
  everReviewed: boolean;
  streak: number;
  best: number;
  read: Set<string>;
}

let last: ShellStats | null = null;
export const lastStats = (): ShellStats | null => last;

/** Fill the nav due badge, the streak chip and the "read" ticks on any napkin tiles on the page. */
export async function refreshShell(): Promise<ShellStats | null> {
  try {
    const db = getDb();
    await ensureSeeded(db);
    const now = new Date();
    const [queue, ever, st, reads] = await Promise.all([
      currentQueue(db, now, readSettings().newPerDay),
      everReviewed(db),
      streakNow(db, now),
      db.reads.toArray(),
    ]);
    last = {
      due: queue.length,
      everReviewed: ever,
      streak: st.current,
      best: st.best,
      read: new Set(reads.map((r) => r.slug)),
    };
    for (const b of document.querySelectorAll<HTMLElement>('[data-due-badge]')) {
      b.textContent = last.due > 99 ? '99+' : String(last.due);
      b.hidden = last.due === 0;
      b.title = `${last.due} due`;
    }
    for (const c of document.querySelectorAll<HTMLElement>('[data-streak-chip]')) {
      const span = c.querySelector('span');
      if (span) span.textContent = String(last.streak);
      c.hidden = last.streak === 0;
      c.title = `${last.streak}-day streak`;
    }
    for (const t of document.querySelectorAll<HTMLElement>('[data-slug]')) {
      t.dataset.read = String(last.read.has(t.dataset.slug ?? ''));
    }
    document.dispatchEvent(new CustomEvent('napkin:stats', { detail: last }));
    return last;
  } catch (e) {
    console.warn('progress unavailable', e);
    return null;
  }
}

export function initShell(): void {
  const run = () => void refreshShell();
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 800 });
  else setTimeout(run, 200);
  document.addEventListener('napkin:progress', run);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) run();
  });
}
