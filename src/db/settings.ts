/** Settings live in localStorage (read by the pre-paint script before first paint) and are mirrored to
 *  Dexie so they travel with a backup. localStorage is the source of truth at runtime. */
import { scopedKey } from '../lib/profiles';

export type Theme = 'system' | 'light' | 'dark';
export type Motion = 'system' | 'reduced' | 'full';

export interface Settings {
  theme: Theme;
  motion: Motion;
  sound: boolean;
  haptics: boolean;
  newPerDay: number;
  lastBackupAt: number | null;
}

export const DEFAULTS: Settings = {
  theme: 'system',
  motion: 'system',
  sound: false,
  haptics: true,
  newPerDay: 10,
  lastBackupAt: null,
};

/** Per-profile key: settings belong to whoever is learning on this device right now. */
export const settingsKey = (): string => scopedKey('napkin:settings');

export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(settingsKey());
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch (e) {
    console.error('settings unreadable, using defaults', e);
    return { ...DEFAULTS };
  }
}

export function applySettingsToDocument(s: Settings, root: HTMLElement = document.documentElement): void {
  if (s.theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', s.theme);
  if (s.motion === 'system') root.removeAttribute('data-motion');
  else root.setAttribute('data-motion', s.motion);
}

const listeners = new Set<(s: Settings) => void>();
export const onSettings = (fn: (s: Settings) => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function writeSettings(patch: Partial<Settings>): Settings {
  const next = { ...readSettings(), ...patch };
  next.newPerDay = Math.max(0, Math.min(50, Math.round(next.newPerDay)));
  try {
    localStorage.setItem(settingsKey(), JSON.stringify(next));
  } catch (e) {
    console.error('settings not saved', e);
  }
  applySettingsToDocument(next);
  for (const fn of listeners) fn(next);
  return next;
}

export const prefersReducedMotion = (): boolean => {
  const s = readSettings();
  if (s.motion === 'reduced') return true;
  if (s.motion === 'full') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
};
