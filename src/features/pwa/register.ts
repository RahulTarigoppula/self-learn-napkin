import { BASE, PLATFORM } from '../../lib/base';
import { toast } from '../../lib/toast';

/** Register the Workbox service worker on the web (never inside the APK, which is offline by construction).
 *  skipWaiting is off: a new deploy only shows a "New napkins" ticket; the learner decides when to refresh. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || PLATFORM === 'android' || !('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  import('workbox-window')
    .then(({ Workbox }) => {
      const wb = new Workbox(`${BASE}sw.js`, { scope: BASE });
      wb.addEventListener('waiting', () => {
        toast('New napkins are ready.', {
          ms: 0,
          action: {
            label: 'Refresh',
            run: () => {
              wb.addEventListener('controlling', () => location.reload());
              wb.messageSkipWaiting();
            },
          },
        });
      });
      wb.addEventListener('activated', (e) => {
        if (!e.isUpdate) document.documentElement.dataset.offlineReady = 'true';
      });
      return wb.register();
    })
    .catch((e: unknown) => {
      // Registration can fail on unsupported or private contexts; the app still works online.
      console.warn('service worker not registered', e);
    });
}
