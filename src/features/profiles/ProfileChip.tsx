import { useEffect, useRef, useState } from 'preact/hooks';
import { href } from '../../lib/base';
import { activeId, displayName, type Profile, profiles, switchProfile } from '../../lib/profiles';
import { Icon } from '../ui/Icon';

/** The avatar in the sidebar / top bar: who is learning right now, and a one-tap switch to someone else. */
export default function ProfileChip({ compact = false }: { compact?: boolean }) {
  const [list, setList] = useState<Profile[]>([]);
  const [active, setActive] = useState('default');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setList(profiles());
    setActive(activeId());
    const close = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const me = list.find((p) => p.id === active);
  if (!me) return <div class={`pchip${compact ? ' pchip--compact' : ''}`} aria-hidden="true" />;

  return (
    <div class={`pchip${compact ? ' pchip--compact' : ''}`} ref={root}>
      <button
        type="button"
        class="pchip__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Learning as ${displayName(me)}. Switch profile`}
        onClick={() => setOpen((o) => !o)}
      >
        <span class="pchip__avatar" aria-hidden="true">
          {me.emoji}
        </span>
        {!compact && <span class="pchip__name">{me.name || 'Add your name'}</span>}
        {!compact && <Icon name="chevronDown" size={16} />}
      </button>
      {open && (
        <div class="pchip__menu" role="menu">
          <p class="pchip__title">Who's learning?</p>
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={p.id === active}
              class="pchip__item"
              onClick={() => {
                if (p.id === active) return setOpen(false);
                switchProfile(p.id);
                location.reload();
              }}
            >
              <span aria-hidden="true">{p.emoji}</span> {displayName(p)}
              {p.id === active && <Icon name="check" size={16} />}
            </button>
          ))}
          <a class="pchip__item pchip__manage" role="menuitem" href={`${href('settings/')}#profiles`}>
            <Icon name="plus" size={16} /> Add or manage profiles
          </a>
        </div>
      )}
    </div>
  );
}
