import { readSettings } from '../db/settings';
import { PLATFORM } from '../lib/base';

/** Haptics only inside the APK (the web never calls navigator.vibrate). */
const native = PLATFORM === 'android';
const on = () => native && readSettings().haptics;

async function plugin() {
  return import('@capacitor/haptics');
}

export const haptic = {
  async light() {
    if (!on()) return;
    const { Haptics, ImpactStyle } = await plugin();
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
  },
  async medium() {
    if (!on()) return;
    const { Haptics, ImpactStyle } = await plugin();
    await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => undefined);
  },
  async selection() {
    if (!on()) return;
    const { Haptics } = await plugin();
    await Haptics.selectionChanged().catch(() => undefined);
  },
  async success() {
    if (!on()) return;
    const { Haptics, NotificationType } = await plugin();
    await Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
  },
};
