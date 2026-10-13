import { describe, expect, it } from 'vitest';
import { excerptFor, normalize, prepare, type SearchDoc, search, terms } from './index';

const docs: SearchDoc[] = [
  {
    id: 'sysdesign/consistent-hashing',
    number: 37,
    title: 'Consistent Hashing',
    track: 'sysdesign',
    tags: ['caching', 'sharding'],
    tldr: 'Hash servers and keys onto a ring.',
    text: 'A key belongs to the next server clockwise. Virtual nodes even the load.',
  },
  {
    id: 'dsa/hash-tables',
    number: 4,
    title: 'Hash Tables',
    track: 'dsa',
    tags: ['hashing', 'collisions'],
    tldr: 'A hash turns a key into a bucket index.',
    text: 'Chaining keeps collisions in a list; the load factor decides speed.',
  },
  {
    id: 'ds/attention',
    number: 66,
    title: 'Attention',
    track: 'ds',
    tags: ['transformers'],
    tldr: 'Queries compare with keys; softmax weights mix the values.',
    text: 'Each token asks a question of every other token.',
  },
];
const index = prepare(docs);

describe('search', () => {
  it('normalises and splits queries', () => {
    expect(normalize('  Résumé — LRU! ')).toBe('resume lru');
    expect(terms('hash  HASH ring')).toEqual(['hash', 'ring']);
  });

  it('ranks the title match first for "hashing"', () => {
    const r = search(index, 'hashing');
    expect(r[0]?.doc.id).toBe('sysdesign/consistent-hashing');
    expect(r.map((h) => h.doc.id)).toContain('dsa/hash-tables');
  });

  it('requires every term to match', () => {
    expect(search(index, 'hash softmax')).toEqual([]);
    expect(search(index, 'softmax values')[0]?.doc.id).toBe('ds/attention');
  });

  it('finds by napkin number', () => {
    expect(search(index, '37')[0]?.doc.id).toBe('sysdesign/consistent-hashing');
  });

  it('prefix matches while typing', () => {
    expect(search(index, 'collis')[0]?.doc.id).toBe('dsa/hash-tables');
    expect(search(index, '   ')).toEqual([]);
  });

  it('builds excerpts with merged highlight ranges', () => {
    const { excerpt, marks } = excerptFor(`${'a'.repeat(100)} load factor ${'b'.repeat(100)}`, [
      'load',
      'load factor',
    ]);
    expect(excerpt.startsWith('…')).toBe(true);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(marks).toHaveLength(1);
    const [s, e] = marks[0] as [number, number];
    expect(excerpt.slice(s, e)).toBe('load factor');
    expect(excerptFor('short text', ['zzz']).excerpt).toBe('short text');
  });
});
