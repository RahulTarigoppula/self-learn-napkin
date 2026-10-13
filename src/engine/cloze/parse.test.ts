import { describe, expect, it } from 'vitest';
import { blankCount, ClozeSyntaxError, fillAll, maskFront, parseCloze, revealUpTo } from './parse';
import { nudgeBlank, pickBlank, toClozeText } from './pick-blank';

const GOLDEN = 'Virtual nodes fix {{uneven load}} by giving each server {{many ring positions}}.';

describe('parseCloze', () => {
  it('splits the golden sentence into segments', () => {
    expect(parseCloze(GOLDEN)).toEqual([
      { t: 'text', v: 'Virtual nodes fix ' },
      { t: 'blank', v: 'uneven load', i: 0 },
      { t: 'text', v: ' by giving each server ' },
      { t: 'blank', v: 'many ring positions', i: 1 },
      { t: 'text', v: '.' },
    ]);
  });

  it('counts blanks and masks with exactly four underscores', () => {
    const s = parseCloze(GOLDEN);
    expect(blankCount(s)).toBe(2);
    expect(maskFront(s)).toBe('Virtual nodes fix ____ by giving each server ____.');
    expect(fillAll(s)).toBe('Virtual nodes fix uneven load by giving each server many ring positions.');
  });

  it('revealUpTo keeps later blanks masked', () => {
    const s = parseCloze('{{a}} {{b}} {{c}}');
    expect(blankCount(s)).toBe(3);
    expect(revealUpTo(s, 1)).toBe('a b ____');
  });

  it('throws on unbalanced braces with the column of the {{', () => {
    expect(() => parseCloze('unbalanced {{x')).toThrow(ClozeSyntaxError);
    try {
      parseCloze('unbalanced {{x');
    } catch (e) {
      expect((e as ClozeSyntaxError).column).toBe(11);
    }
    expect(() => parseCloze('a {{b {{c}}')).toThrow(ClozeSyntaxError);
  });

  it('plain text is one segment', () => {
    expect(parseCloze('no blanks')).toEqual([{ t: 'text', v: 'no blanks' }]);
  });
});

describe('pickBlank', () => {
  const S = 'Virtual nodes fix uneven load by giving each server many ring positions.';
  it('chooses "many ring positions" for the worked example', () => {
    const b = pickBlank(S, ['consistent', 'hashing', 'caching', 'sharding']);
    expect(b.blank).toBe('many ring positions');
    expect(toClozeText(S, b)).toBe(
      'Virtual nodes fix uneven load by giving each server {{many ring positions}}.',
    );
  });

  it('prefers hint words', () => {
    expect(pickBlank('A queue gives BFS its order.', ['queue']).blank).toContain('queue');
  });

  it('nudges one token at a time and never inverts', () => {
    const b = pickBlank(S, []);
    const left = nudgeBlank(S, b, 'start', -1);
    expect(left.blank).toBe('server many ring positions');
    const shrink = nudgeBlank(S, b, 'end', -1);
    expect(shrink.blank).toBe('many ring');
    const single = nudgeBlank(
      S,
      { blank: 'many', start: S.indexOf('many'), end: S.indexOf('many') + 4 },
      'end',
      -1,
    );
    expect(single.blank).toBe('many');
  });

  it('handles empty input', () => {
    expect(pickBlank('', [])).toEqual({ blank: '', start: 0, end: 0 });
    expect(nudgeBlank('abc', { blank: 'x', start: 9, end: 10 }, 'start', 1).blank).toBe('x');
  });
});
