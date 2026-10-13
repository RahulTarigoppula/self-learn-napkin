import { APP_VERSION, BASE, PLATFORM } from '../../lib/base';
import { toast } from '../../lib/toast';

/** Register the Workbox service worker on the web (never inside the APK, which is offline by construction).
 *  Updates apply themselves: when a new deploy has finished downloading in the background, the new worker
 *  takes over and the page reloads once onto it. Progress lives in IndexedDB and localStorage, which a service worker update never touches.
 *  The only exception is a review session in progress, where a ticket asks first so a card is not cut off. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || PLATFORM === 'android' || !('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  import('workbox-window')
    .then(({ Workbox }) => {
      const wb = new Workbox(`${BASE}sw.js`, { scope: BASE });
      // The new worker activates itself (skipWaiting); reload once it controls the page so every file matches.
      wb.addEventListener('controlling', (e) => {
        if (!e.isUpdate) return;
        if (!document.querySelector('[data-review-active]')) return location.reload();
        toast('A newer Napkin is ready.', {
          ms: 0,
          action: { label: 'Update now', run: () => location.reload() },
        });
      });
      wb.addEventListener('activated', (e) => {
        if (!e.isUpdate) document.documentElement.dataset.offlineReady = 'true';
      });
      // Look for a new deploy whenever the app comes back to the foreground, and every 30 minutes.
      const check = () => {
        void wb.update().catch(() => undefined);
        void ensureLatest();
      };
      void ensureLatest();
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
      setInterval(check, 30 * 60 * 1000);
      return wb.register();
    })
    .catch((e: unknown) => {
      // Registration can fail on unsupported or private contexts; the app still works online.
      console.warn('service worker not registered', e);
    });
}

/** "Get the latest version": drop the cached app files (not your progress) and load fresh from the network. */
export async function refreshToLatest(): Promise<void> {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.update().catch(() => undefined)));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    location.reload();
  }
}

/** Belt and braces: ask the server (bypassing every cache) which release is live. If this page is older,
 *  drop the cached app files and reload once onto the new one. Progress is untouched. */
async function ensureLatest(): Promise<void> {
  if (document.querySelector('[data-review-active]')) return;
  try {
    const r = await fetch(`${BASE}version.json`, { cache: 'no-store' });
    if (!r.ok) return;
    const { v } = (await r.json()) as { v?: string };
    if (!v || v === APP_VERSION) return;
    const key = 'napkin:reloaded-for';
    if (sessionStorage.getItem(key) === v) return; // already tried once this tab; never loop
    sessionStorage.setItem(key, v);
    await refreshToLatest();
  } catch {
    // Offline or blocked: keep using the copy we have.
  }
}
