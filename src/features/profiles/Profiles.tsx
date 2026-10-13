import { useEffect, useState } from 'preact/hooks';
import {
  activeId,
  addProfile,
  deleteProfile,
  displayName,
  EMOJIS,
  MAX_NAME,
  MAX_PROFILES,
  type Profile,
  profiles,
  switchProfile,
  updateProfile,
} from '../../lib/profiles';
import { Icon } from '../ui/Icon';

/** "Who's learning?": local profiles so a family, a study group or a shared laptop can each keep their own progress. */
export default function Profiles() {
  // Profiles live in this browser only, so read them after mount (the server render cannot see them).
  const [list, setList] = useState<Profile[]>([]);
  const [active, setActive] = useState('');
  useEffect(() => {
    setList(profiles());
    setActive(activeId());
  }, []);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>(EMOJIS[1]);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const refresh = () => setList(profiles());

  const go = (id: string) => {
    switchProfile(id);
    location.reload();
  };

  const add = (e: Event) => {
    e.preventDefault();
    const p = addProfile(name, emoji);
    if (!p) return;
    setName('');
    go(p.id);
  };

  return (
    <section id="profiles" class="pf card" aria-labelledby="pf-h">
      <div class="pf__head">
        <h2 id="pf-h">Who's learning?</h2>
        <span class="mono muted">
          {list.length}/{MAX_PROFILES}
        </span>
      </div>
      <p class="st__help">
        Sharing this device? Give everyone their own profile. Each one has separate progress, streaks and
        settings. No login, no email: profiles exist only in this browser.
      </p>

      <ul class="pf__list">
        {list.map((p) => (
          <li key={p.id} class="pf__item" data-active={p.id === active ? '' : undefined}>
            <span class="pf__avatar" aria-hidden="true">
              {p.emoji}
            </span>
            {editing === p.id ? (
              <form
                class="pf__edit"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (e.currentTarget.elements.namedItem('n') as HTMLInputElement).value;
                  updateProfile(p.id, { name: v });
                  setEditing(null);
                  refresh();
                }}
              >
                <input
                  name="n"
                  class="pf__input"
                  maxLength={MAX_NAME}
                  defaultValue={p.name}
                  aria-label="Name"
                />
                <button type="submit" class="btn btn--primary">
                  Save
                </button>
              </form>
            ) : (
              <span class="pf__name">
                {displayName(p)}
                {p.id === active && <span class="pf__badge">learning now</span>}
              </span>
            )}
            <span class="pf__actions">
              {p.id !== active && (
                <button type="button" class="btn" onClick={() => go(p.id)}>
                  Switch
                </button>
              )}
              {editing !== p.id && (
                <button
                  type="button"
                  class="btn btn--ghost btn--icon"
                  aria-label={`Rename ${displayName(p)}`}
                  onClick={() => setEditing(p.id)}
                >
                  <Icon name="pen" size={16} />
                </button>
              )}
              {list.length > 1 && (
                <button
                  type="button"
                  class={`btn btn--ghost${confirm === p.id ? ' pf__danger' : ' btn--icon'}`}
                  aria-label={
                    confirm === p.id
                      ? `Confirm: delete ${displayName(p)} and all their progress`
                      : `Delete ${displayName(p)}`
                  }
                  onClick={async () => {
                    if (confirm !== p.id) {
                      setConfirm(p.id);
                      setTimeout(() => setConfirm((c) => (c === p.id ? null : c)), 4000);
                      return;
                    }
                    await deleteProfile(p.id);
                    if (p.id === active) location.reload();
                    else {
                      setConfirm(null);
                      refresh();
                    }
                  }}
                >
                  <Icon name="trash" size={16} />
                  {confirm === p.id && ' Tap again to delete'}
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {list.length < MAX_PROFILES && (
        <form class="pf__add" onSubmit={add}>
          <p class="pf__label">Add someone</p>
          <div class="pf__emojis" role="radiogroup" aria-label="Pick an avatar">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={emoji === e}
                class="pf__emoji"
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
          <div class="pf__row">
            <input
              class="pf__input"
              value={name}
              maxLength={MAX_NAME}
              placeholder="Name or nickname"
              aria-label="Name or nickname"
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
            />
            <button type="submit" class="btn btn--primary" disabled={!name.trim()}>
              <Icon name="plus" size={16} /> Add and switch
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
