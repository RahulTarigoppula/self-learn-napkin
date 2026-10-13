import { createHash } from 'node:crypto';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { contentHash, deckId, highlightId } from './ids';
import { sha1 } from './sha1';

describe('deck ids', () => {
  it('locks the consistent-hashing golden', () => {
    expect(
      deckId(
        'sysdesign/consistent-hashing',
        'Why does consistent hashing minimise re-mapping when a node joins?',
      ),
    ).toBe('f40204a70330cb3e7c3eb3b8c6bca3cefd2f8b13');
  });

  it('locks the binary-search golden', () => {
    expect(deckId('dsa/binary-search', 'What is the worst-case time complexity of binary search?')).toBe(
      '244084cb5175b111732acee58320bea08bd7a2d8',
    );
  });

  it('hashes the raw cloze text including braces', () => {
    const t = 'Virtual nodes fix {{uneven load}} by giving each server {{many ring positions}}.';
    expect(deckId('s/x', t)).toBe(createHash('sha1').update(`s/x|${t}`).digest('hex'));
    expect(deckId('s/x', t)).not.toBe(deckId('s/x', t.replace(/[{}]/g, '')));
  });

  it('prefixes highlight ids', () => {
    expect(highlightId('a/b', 'x')).toMatch(/^hl-[0-9a-f]{40}$/);
  });

  it('content hash is order independent', () => {
    expect(contentHash(['b', 'a'])).toBe(contentHash(['a', 'b']));
  });

  it('pure sha1 agrees with node:crypto on arbitrary unicode', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 300 }), (s) => {
        expect(sha1(s)).toBe(createHash('sha1').update(s, 'utf8').digest('hex'));
      }),
      { numRuns: 300 },
    );
  });
});
