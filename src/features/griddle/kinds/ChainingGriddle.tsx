import { useMemo, useState } from 'preact/hooks';
import { bucketOf, CHAINING_DEFAULTS, chainingFrames } from '../../../engine/viz/systems';
import { Icon } from '../../ui/Icon';
import { Controls, Shell, usePlayer } from '../player';

export default function ChainingGriddle() {
  const [keys, setKeys] = useState<string[]>(CHAINING_DEFAULTS.keys);
  const [draft, setDraft] = useState('');
  const fr = useMemo(() => chainingFrames({ ...CHAINING_DEFAULTS, keys }), [keys]);
  const p = usePlayer(fr.length, 800);
  const f = fr[Math.min(p.k, fr.length - 1)] ?? fr[0];
  if (!f) return null;
  const size = f.table.reduce((n, b) => n + b.length, 0);
  const load = size / f.table.length;
  const longest = Math.max(...f.table.map((b) => b.length));

  const add = (e: Event) => {
    e.preventDefault();
    const k = draft.trim().toLowerCase().slice(0, 10);
    if (!k || keys.includes(k)) return;
    const next = [...keys, k];
    setKeys(next);
    setDraft('');
    p.setPlaying(false);
    p.setK(chainingFrames({ ...CHAINING_DEFAULTS, keys: next }).length - 1);
  };

  return (
    <Shell
      title="A hash table that chains collisions"
      hint="Each key hashes to a bucket. Collisions join a chain. When the load factor passes 0.75 the table doubles and every key is rehashed."
      p={p}
    >
      <div class="gd__stage paper chain">
        <ol class="chain__table" aria-label={`${f.table.length} buckets`}>
          {f.table.map((bucket, i) => (
            <li key={`${f.table.length}-${i}`} class="chain__row">
              <span class="chain__idx mono">{i}</span>
              <span class="chain__slot" />
              {bucket.map((k) => (
                <span key={k} class={`chain__key${f.hot === k ? ' is-hot' : ''}`}>
                  {k}
                </span>
              ))}
            </li>
          ))}
        </ol>
      </div>
      <div class="gd__stats">
        <span>
          keys <b>{size}</b>
        </span>
        <span>
          buckets <b>{f.table.length}</b>
        </span>
        <span>
          load factor <b>{load.toFixed(2)}</b>
        </span>
        <span>
          longest chain <b>{longest}</b>
        </span>
      </div>
      <Controls
        p={p}
        caption={f.caption}
        extra={
          <form class="gd__row" onSubmit={add}>
            <input
              class="gd__input"
              value={draft}
              onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
              placeholder="your key"
              aria-label="Add a key"
              maxLength={10}
            />
            <button type="submit" class="btn" disabled={!draft.trim()}>
              <Icon name="plus" size={16} /> Insert
            </button>
            {draft.trim() && (
              <span class="muted mono">→ bucket {bucketOf(draft.trim().toLowerCase(), f.table.length)}</span>
            )}
          </form>
        }
      />
    </Shell>
  );
}
