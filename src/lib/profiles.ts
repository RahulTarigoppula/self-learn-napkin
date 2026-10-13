/** Local profiles: several people can learn on one device without accounts or logins.
 *  The registry lives in this browser's localStorage. Each profile gets its own IndexedDB database
 *  and its own settings, so progress never mixes. Ids are random; nothing here ever leaves the device. */
export interface Profile {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}
interface Registry {
  active: string;
  list: Profile[];
}

export const PROFILES_KEY = 'napkin:profiles';
export const DEFAULT_ID = 'default';
export const MAX_PROFILES = 12;
export const MAX_NAME = 24;
export const EMOJIS = ['🦊', '🐼', '🦉', '🐙', '🐢', '🦄', '🐝', '🌵', '🚀', '🍵', '🎧', '🧩'] as const;

const fresh = (): Registry => ({
  active: DEFAULT_ID,
  list: [{ id: DEFAULT_ID, name: '', emoji: '🦊', createdAt: 0 }],
});

export function readRegistry(): Registry {
  try {
    const r = JSON.parse(localStorage.getItem(PROFILES_KEY) ?? 'null') as Registry | null;
    if (!r || !Array.isArray(r.list) || r.list.length === 0) return fresh();
    if (!r.list.some((p) => p.id === r.active)) r.active = (r.list[0] as Profile).id;
    return r;
  } catch {
    return fresh();
  }
}

function write(r: Registry): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(r));
  } catch (e) {
    console.error('profiles not saved', e);
  }
}

export const activeId = (): string => readRegistry().active;
export const activeProfile = (): Profile => {
  const r = readRegistry();
  return r.list.find((p) => p.id === r.active) ?? (r.list[0] as Profile);
};
export const profiles = (): Profile[] => readRegistry().list;

/** The default profile keeps the original names, so progress from before profiles existed is kept. */
export const dbName = (id: string = activeId()): string => (id === DEFAULT_ID ? 'napkin' : `napkin-${id}`);
export const scopedKey = (base: string, id: string = activeId()): string =>
  id === DEFAULT_ID ? base : `${base}:${id}`;

const clean = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);

function newId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function addProfile(name: string, emoji: string): Profile | null {
  const r = readRegistry();
  if (r.list.length >= MAX_PROFILES) return null;
  const p: Profile = { id: newId(), name: clean(name), emoji, createdAt: Date.now() };
  r.list.push(p);
  write(r);
  return p;
}

export function updateProfile(id: string, patch: Partial<Pick<Profile, 'name' | 'emoji'>>): void {
  const r = readRegistry();
  const p = r.list.find((x) => x.id === id);
  if (!p) return;
  if (patch.name !== undefined) p.name = clean(patch.name);
  if (patch.emoji !== undefined) p.emoji = patch.emoji;
  write(r);
}

export function switchProfile(id: string): void {
  const r = readRegistry();
  if (!r.list.some((p) => p.id === id)) return;
  r.active = id;
  write(r);
}

/** Remove a profile and everything it stored. The last remaining profile cannot be removed. */
export async function deleteProfile(id: string): Promise<void> {
  const r = readRegistry();
  if (r.list.length <= 1) return;
  r.list = r.list.filter((p) => p.id !== id);
  if (r.active === id) r.active = (r.list[0] as Profile).id;
  write(r);
  try {
    for (const k of Object.keys(localStorage))
      if (id === DEFAULT_ID ? k === 'napkin:settings' || k === 'napkin:recent' : k.endsWith(`:${id}`))
        localStorage.removeItem(k);
  } catch {
    /* storage unavailable */
  }
  await new Promise<void>((done) => {
    const req = indexedDB.deleteDatabase(dbName(id));
    req.onsuccess = req.onerror = req.onblocked = () => done();
  });
}

export const displayName = (p: Profile): string => p.name || 'You';
