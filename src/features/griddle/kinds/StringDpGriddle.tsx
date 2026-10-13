import { useMemo, useState } from 'preact/hooks';
import { dpFrameCount, dpView, editRun, formatEdit, lcsRun } from '../../../engine/viz/dp-table';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, usePlayer } from '../player';
import { DpTable, type Head } from './DpTable';

const MAX = 9;

const CFG = {
  lcs: {
    title: 'Fill the LCS table, then walk back',
    hint: 'Type two words. Equal letters take ↖ + 1; otherwise the larger of ↑ and ←. Then walk back from the corner to read the LCS. Try two words with nothing in common.',
    presets: [
      ['ABCBD', 'BDCAB'],
      ['ABCBDAB', 'BDCABA'],
      ['AAAA', 'BBB'],
    ],
  },
  'edit-distance': {
    title: 'Edit distance, one cell at a time',
    hint: 'Each cell is the cheapest of ↖ replace (free on a match), ↑ delete and ← insert. Walk back from the corner for the edit script. Try words of very different lengths.',
    presets: [
      ['kitten', 'sitting'],
      ['horse', 'ros'],
      ['ab', 'ba'],
    ],
  },
} as const;

const TAG_COLOR: Record<string, string> = {
  '=': 'var(--success-ink)',
  '↖': 'var(--success-ink)',
  R: 'var(--text-orange)',
  D: 'var(--danger-ink)',
  I: 'var(--pen-blue)',
};

const clean = (s: string) => s.replace(/\s+/g, '').slice(0, MAX);
const heads = (s: string): Head[] => [{ main: '∅' }, ...[...s].map((ch) => ({ main: ch }))];

export default function StringDpGriddle({ kind }: { kind: string }) {
  const isLcs = kind !== 'edit-distance';
  const cfg = isLcs ? CFG.lcs : CFG['edit-distance'];
  const [[a, b], setWords] = useState<readonly [string, string]>(cfg.presets[0]);
  const lcs = useMemo(() => (isLcs ? lcsRun(a, b) : null), [isLcs, a, b]);
  const ed = useMemo(() => (isLcs ? null : editRun(a, b)), [isLcs, a, b]);
  const run = (lcs ?? ed)!;
  const p = usePlayer(dpFrameCount(run), 420);
  const view = dpView(run, p.k);
  const m = [...a].length;
  const n = [...b].length;

  const reset = (next: readonly [string, string]) => {
    setWords(next);
    p.setPlaying(false);
    p.setK(0);
  };
  const notes = view.steps.flatMap((s) => (s.mark && s.note ? [s.note] : [])).reverse();
  const matches = run.fills.slice(0, view.filled).filter((f) => f.tag === '↖' || f.tag === '=').length;

  return (
    <Shell title={cfg.title} hint={cfg.hint} p={p}>
      <div class="dp__words">
        <input
          class="gd__input"
          type="text"
          value={a}
          maxLength={MAX}
          spellcheck={false}
          autocomplete="off"
          aria-label="First word (rows)"
          onInput={(e) => reset([clean((e.target as HTMLInputElement).value), b])}
        />
        <input
          class="gd__input"
          type="text"
          value={b}
          maxLength={MAX}
          spellcheck={false}
          autocomplete="off"
          aria-label="Second word (columns)"
          onInput={(e) => reset([a, clean((e.target as HTMLInputElement).value)])}
        />
      </div>
      <DpTable
        run={run}
        view={view}
        rows={heads(a)}
        cols={heads(b)}
        label={`${isLcs ? 'LCS' : 'Edit distance'} table for ${a || 'empty'} and ${b || 'empty'}`}
        tagColor={(t) => TAG_COLOR[t] ?? 'var(--ink-muted)'}
        onPick={(k) => {
          p.setPlaying(false);
          p.setK(k);
        }}
      />
      <div class="gd__legend">
        <span>
          <i style={{ background: 'var(--hl)' }} />
          this cell
        </span>
        <span>
          <i style={{ background: 'var(--wash-green)' }} />
          {isLcs ? 'came from / kept letter' : 'came from / an edit'}
        </span>
        <span>
          <i style={{ background: 'var(--wash-blue)' }} />
          also compared
        </span>
        {!isLcs && <span>= keep · R replace · D delete · I insert</span>}
      </div>
      <div class="gd__stats">
        <span>
          cells{' '}
          <b>
            {view.filled}/{run.fills.length}
          </b>
        </span>
        <span>
          {isLcs ? 'matches' : 'free keeps'} <b>{matches}</b>
        </span>
        {ed && (
          <span>
            bounds <b>{Math.abs(m - n)}</b> ≤ d ≤ <b>{Math.max(m, n)}</b>
          </span>
        )}
      </div>
      <div class="dp__chips" aria-live="polite">
        <span>{isLcs ? 'LCS:' : 'script:'}</span>
        {notes.length === 0 && <span>{view.step ? '…' : 'walk back to read it'}</span>}
        {notes.map((t, i) => (
          <span key={`${i}${t}`} class="dp__chip">
            {t}
          </span>
        ))}
      </div>
      {view.done && lcs && (
        <p class="gd__verdict gd__verdict--ok" role="status">
          {lcs.lcs
            ? `LCS = ${lcs.lcs} (length ${[...lcs.lcs].length} of ${Math.min(m, n)} possible)`
            : 'Nothing in common, so the LCS is empty'}
        </p>
      )}
      {view.done && ed && (
        <p class="gd__verdict gd__verdict--ok" role="status">
          {ed.distance === 0
            ? 'Already equal: 0 edits'
            : `${a || '∅'} → ${b || '∅'}: ${ed.distance} edit${ed.distance === 1 ? '' : 's'} (${ed.script.map(formatEdit).join(', ')})`}
        </p>
      )}
      <Controls
        p={p}
        caption={view.caption}
        extra={
          <>
            <div class="gd__seg dp__presets" role="group" aria-label="Examples">
              {cfg.presets.map(([x, y]) => (
                <button
                  key={x + y}
                  type="button"
                  aria-pressed={a === x && b === y}
                  onClick={() => reset([x, y])}
                >
                  {x}/{y}
                </button>
              ))}
            </div>
            <button
              type="button"
              class="btn btn--ghost"
              onClick={() => {
                p.setPlaying(false);
                p.setK(p.last);
              }}
            >
              <Icon name="skipForward" size={15} /> Answer
            </button>
          </>
        }
      />
    </Shell>
  );
}
