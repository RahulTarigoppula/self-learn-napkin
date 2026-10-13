import { describe, expect, it } from 'vitest';
import { joinBase, pageUrl } from './base';

describe('base paths', () => {
  it('never produces a double slash', () => {
    for (const base of ['/', '/self-learn-napkin/'])
      for (const p of ['decks/all.json', '/decks/all.json', '//x', ''])
        expect(joinBase(base, p).replace(/^\/\//, 'X')).not.toMatch(/\/\//);
    expect(joinBase('/self-learn-napkin/', 'decks/all.json')).toBe('/self-learn-napkin/decks/all.json');
  });

  it('adds index.html to directory pages only on android', () => {
    expect(pageUrl('/r/', 'web', 'library/')).toBe('/r/library/');
    expect(pageUrl('/', 'android', 'library/')).toBe('/library/index.html');
    expect(pageUrl('/', 'android', '')).toBe('/');
    expect(pageUrl('/', 'android', 'dsa/binary-search/#griddle')).toBe(
      '/dsa/binary-search/index.html#griddle',
    );
    expect(pageUrl('/r/', 'web', 'dsa/x/#try')).toBe('/r/dsa/x/#try');
  });
});
