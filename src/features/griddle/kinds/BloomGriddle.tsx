import { useState } from 'preact/hooks';
import { bloomFpr, bloomPositions } from '../../../engine/viz/ml';
import { Icon } from '../../ui/Icon';
import { Shell, Stepper } from '../player';

const M = 24;

export default function BloomGriddle() {
  const [k, setK] = useState(3);
  const [bits, setBits] = useState<number[]>(() => Array(M).fill(0));
  const [words, setWords] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [probe, setProbe] = useState<{
    word: string;
    pos: number[];
    verdict: 'maybe' | 'no';
    real: boolean;
  } | null>(null);

  const word = draft.trim().toLowerCase();
  const add = () => {
    if (!word) return;
    const pos = bloomPositions(word, M, k);
    const next = [...bits];
    for (const p of pos) next[p] = 1;
    setBits(next);
    if (!words.includes(word)) setWords([...words, word]);
    setProbe({ word, pos, verdict: 'maybe', real: true });
    setDraft('');
  };
  const check = () => {
    if (!word) return;
    const pos = bloomPositions(word, M, k);
    const all = pos.every((p) => bits[p] === 1);
    setProbe({ word, pos, verdict: all ? 'maybe' : 'no', real: words.includes(word) });
  };
  const reset = (nk: number) => {
    setK(nk);
    setBits(Array(M).fill(0));
    setWords([]);
    setProbe(null);
  };
  const set = bits.filter(Boolean).length;
  const verdictText = !probe
    ? 'Add a few words, then check words you did and did not add.'
    : probe.verdict === 'no'
      ? `"${probe.word}": at least one of its bits is 0 → definitely NOT in the set.`
      : probe.real
        ? `"${probe.word}": all ${k} bits are 1 → probably in the set (and it really is).`
        : `"${probe.word}": all ${k} bits are 1, but it was never added → a FALSE POSITIVE.`;

  return (
    <Shell
      title="Set bits, ask questions"
      hint={`A ${M}-bit array and ${k} hash functions. Adding a word sets its ${k} bits; checking a word reads them. Any 0 means "definitely not". All 1s means "maybe".`}
    >
      <div class="gd__stage paper">
        <ol class="bloom" aria-label={`${set} of ${M} bits set`}>
          {bits.map((b, i) => (
            <li
              key={i}
              class={`bloom__bit${b ? ' is-set' : ''}${probe?.pos.includes(i) ? ` is-probe is-${probe.verdict}` : ''}`}
            >
              <span class="mono">{b}</span>
              <small class="mono">{i}</small>
            </li>
          ))}
        </ol>
      </div>
      <p
        class={`gd__verdict ${probe?.verdict === 'maybe' && !probe.real ? 'gd__verdict--bad' : 'gd__verdict--ok'}`}
        aria-live="polite"
      >
        {verdictText}
      </p>
      <form
        class="gd__row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          class="gd__input"
          value={draft}
          maxLength={16}
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          placeholder="a word"
          aria-label="Word"
        />
        <button type="submit" class="btn btn--primary" disabled={!word}>
          <Icon name="plus" size={16} /> Add
        </button>
        <button type="button" class="btn" disabled={!word} onClick={check}>
          <Icon name="search" size={16} /> Check
        </button>
        {word && <span class="muted mono">bits {bloomPositions(word, M, k).join(', ')}</span>}
      </form>
      <div class="gd__stats">
        <span>
          added <b>{words.length}</b>
        </span>
        <span>
          bits set{' '}
          <b>
            {set}/{M}
          </b>
        </span>
        <span>
          expected false-positive rate <b>{(bloomFpr(M, k, words.length) * 100).toFixed(1)}%</b>
        </span>
      </div>
      <div class="gd__row">
        <Stepper label="hash functions k" value={k} min={1} max={6} onChange={reset} />
        <button type="button" class="btn btn--ghost" onClick={() => reset(k)}>
          Clear
        </button>
        {words.length > 0 && <span class="muted">set: {words.join(', ')}</span>}
      </div>
    </Shell>
  );
}
