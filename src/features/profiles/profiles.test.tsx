import { beforeEach, describe, expect, it } from 'vitest';
import {
  activeId,
  addProfile,
  DEFAULT_ID,
  dbName,
  deleteProfile,
  MAX_PROFILES,
  profiles,
  scopedKey,
  switchProfile,
  updateProfile,
} from '../../lib/profiles';

describe('local profiles', () => {
  beforeEach(() => localStorage.clear());

  it('starts with one default profile that keeps the original storage names', () => {
    expect(activeId()).toBe(DEFAULT_ID);
    expect(profiles()).toHaveLength(1);
    expect(dbName()).toBe('napkin');
    expect(scopedKey('napkin:settings')).toBe('napkin:settings');
  });

  it('adds, renames and switches profiles with their own storage', () => {
    const p = addProfile('  Asha   K ', '🐼');
    expect(p?.name).toBe('Asha K');
    expect(p?.id).toMatch(/^[0-9a-f]{12}$/);
    switchProfile(p?.id ?? '');
    expect(activeId()).toBe(p?.id);
    expect(dbName()).toBe(`napkin-${p?.id}`);
    expect(scopedKey('napkin:settings')).toBe(`napkin:settings:${p?.id}`);
    updateProfile(p?.id ?? '', { name: 'x'.repeat(40), emoji: '🚀' });
    expect(profiles()[1]).toMatchObject({ name: 'x'.repeat(24), emoji: '🚀' });
    switchProfile('nope');
    expect(activeId()).toBe(p?.id);
  });

  it('caps the number of profiles', () => {
    for (let i = 1; i < MAX_PROFILES; i++) expect(addProfile(`p${i}`, '🦊')).not.toBeNull();
    expect(addProfile('one too many', '🦊')).toBeNull();
  });

  it('deleting a profile removes its settings and falls back to another profile', async () => {
    const p = addProfile('Ben', '🦉');
    switchProfile(p?.id ?? '');
    localStorage.setItem(scopedKey('napkin:settings'), '{"theme":"dark"}');
    await deleteProfile(p?.id ?? '');
    expect(activeId()).toBe(DEFAULT_ID);
    expect(localStorage.getItem(`napkin:settings:${p?.id}`)).toBeNull();
    await deleteProfile(DEFAULT_ID);
    expect(profiles()).toHaveLength(1);
  });

  it('survives a corrupt registry', () => {
    localStorage.setItem('napkin:profiles', '{oops');
    expect(activeId()).toBe(DEFAULT_ID);
  });
});
