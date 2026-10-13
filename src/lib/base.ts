/** '/' or '/self-learn-napkin/'. The ONLY way URLs are built. */
export const BASE: string = (import.meta.env.PUBLIC_BASE as string | undefined) ?? '/';
export const PLATFORM: string = (import.meta.env.PUBLIC_PLATFORM as string | undefined) ?? 'web';
export const APP_VERSION: string = (import.meta.env.PUBLIC_APP_VERSION as string | undefined) ?? 'dev';

export const joinBase = (base: string, p: string): string => base + p.replace(/^\/+/, '');

/** An asset or data URL: withBase('decks/all.json') → '/self-learn-napkin/decks/all.json'. */
export const withBase = (p: string): string => joinBase(BASE, p);

/** A page URL. Inside the APK, Capacitor's local server answers every extension-less path with the root
 *  index.html, so directory pages must be linked as '<dir>/index.html' there. */
export const pageUrl = (base: string, platform: string, p: string): string => {
  const clean = p.replace(/^\/+/, '');
  const [path = '', hash = ''] = clean.split('#');
  const withIndex = platform === 'android' && path !== '' && path.endsWith('/') ? `${path}index.html` : path;
  return joinBase(base, withIndex) + (hash ? `#${hash}` : '');
};

export const href = (p: string): string => pageUrl(BASE, PLATFORM, p);

/** Card id 'sysdesign/consistent-hashing' → its page. */
export const cardHref = (id: string): string => href(`${id}/`);
