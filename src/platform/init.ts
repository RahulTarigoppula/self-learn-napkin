import { onSettings } from '../db/settings';
import { PLATFORM } from '../lib/base';

/** Android-only wiring: status bar, back button chain, pausing animation when backgrounded. */
export function initPlatform(): void {
  if (PLATFORM !== 'android') return;
  void (async () => {
    try {
      const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
        import('@capacitor/app'),
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
      ]);
      const paintBars = async () => {
        const dark =
          document.documentElement.getAttribute('data-theme') === 'dark' ||
          (!document.documentElement.hasAttribute('data-theme') &&
            matchMedia('(prefers-color-scheme: dark)').matches);
        await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => undefined);
        await StatusBar.setBackgroundColor({ color: dark ? '#0D0F15' : '#F6F3EE' }).catch(() => undefined);
      };
      await paintBars();
      onSettings(() => void paintBars());
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => void paintBars());
      await SplashScreen.hide().catch(() => undefined);
      await App.addListener('backButton', ({ canGoBack }) => {
        // Close the top-most layer first (search palette, dialogs), then go back, then exit.
        const closer = document.querySelector<HTMLElement>('[data-back-closes]:not([hidden])');
        if (closer) {
          closer.dispatchEvent(new CustomEvent('napkin:close'));
          return;
        }
        if (canGoBack && location.pathname !== '/' && location.pathname !== '/index.html') history.back();
        else void App.exitApp();
      });
      await App.addListener('appStateChange', ({ isActive }) => {
        document.documentElement.classList.toggle('is-paused', !isActive);
      });
    } catch (e) {
      console.error('platform init failed', e);
    }
  })();
}
