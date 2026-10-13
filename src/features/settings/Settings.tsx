import { useEffect, useRef, useState } from 'preact/hooks';
import { exportBackup, importBackup, wipeProgress } from '../../db/backup';
import { getDb } from '../../db/dexie';
import { tz } from '../../db/review';
import { DEFAULTS, readSettings, type Settings as S, writeSettings } from '../../db/settings';
import { backupFilename } from '../../engine/backup/schema';
import { dayKey } from '../../engine/fsrs/scheduler';
import { APP_VERSION, PLATFORM } from '../../lib/base';
import { toast } from '../../lib/toast';
import { shareFile } from '../../platform/share';
import { sound } from '../../platform/sound';
import { Icon } from '../ui/Icon';

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; label: string; icon?: 'sun' | 'moon' | 'monitor' }[];
  onChange: (v: T) => void;
}) {
  return (
    <div class="st__seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
        >
          {o.icon && <Icon name={o.icon} size={16} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      class="st__switch"
      onClick={() => onChange(!checked)}
    >
      <span class="st__knob" />
    </button>
  );
}

export default function Settings({ credits }: { credits: { name: string; url: string; licence: string }[] }) {
  const [s, setS] = useState<S>(DEFAULTS);
  const [hold, setHold] = useState(0);
  const holdTimer = useRef<number | undefined>(undefined);
  const file = useRef<HTMLInputElement>(null);
  const [offline, setOffline] = useState<boolean | null>(null);

  useEffect(() => {
    setS(readSettings());
    if (PLATFORM === 'android') setOffline(true);
    else if ('serviceWorker' in navigator)
      void navigator.serviceWorker.getRegistration().then((r) => setOffline(Boolean(r?.active)));
    else setOffline(false);
  }, []);

  const set = (patch: Partial<S>) => {
    const next = writeSettings(patch);
    setS(next);
    if (patch.sound) sound.ding();
  };

  const doExport = async () => {
    try {
      const json = await exportBackup(getDb(), APP_VERSION);
      const r = await shareFile(
        backupFilename(dayKey(new Date(), tz())),
        new Blob([json], { type: 'application/json' }),
        'Napkin backup',
      );
      set({ lastBackupAt: Date.now() });
      toast(r === 'downloaded' ? 'Backup downloaded.' : 'Backup ready to share.');
    } catch (e) {
      console.error(e);
      toast("Couldn't create the backup.", { danger: true });
    }
  };

  const doImport = async (f: File) => {
    const err = await importBackup(getDb(), await f.text());
    if (err) toast(err, { danger: true, ms: 7000 });
    else {
      toast('Backup imported and merged.');
      document.dispatchEvent(new CustomEvent('napkin:progress'));
    }
  };

  const startHold = () => {
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 3000);
      setHold(p);
      if (p >= 1) {
        void wipeProgress(getDb()).then(() => {
          toast('Progress wiped. A fresh napkin awaits.');
          document.dispatchEvent(new CustomEvent('napkin:progress'));
          setHold(0);
        });
        return;
      }
      holdTimer.current = requestAnimationFrame(tick);
    };
    holdTimer.current = requestAnimationFrame(tick);
  };
  const stopHold = () => {
    if (holdTimer.current !== undefined) cancelAnimationFrame(holdTimer.current);
    setHold((h) => (h >= 1 ? h : 0));
  };

  return (
    <div class="st">
      <section class="st__group card" aria-labelledby="st-look">
        <h2 id="st-look">Look &amp; feel</h2>
        <div class="st__row">
          <div>
            <p class="st__label">Theme</p>
            <p class="st__help">Follow your device, or pin a theme.</p>
          </div>
          <Seg
            label="Theme"
            value={s.theme}
            onChange={(theme) => set({ theme })}
            options={[
              { v: 'system', label: 'Auto', icon: 'monitor' },
              { v: 'light', label: 'Light', icon: 'sun' },
              { v: 'dark', label: 'Dark', icon: 'moon' },
            ]}
          />
        </div>
        <div class="st__row">
          <div>
            <p class="st__label">Motion</p>
            <p class="st__help">Reduced swaps drawing animations for gentle fades.</p>
          </div>
          <Seg
            label="Motion"
            value={s.motion}
            onChange={(motion) => set({ motion })}
            options={[
              { v: 'system', label: 'Auto' },
              { v: 'reduced', label: 'Reduced' },
              { v: 'full', label: 'Full' },
            ]}
          />
        </div>
        <div class="st__row">
          <div>
            <p class="st__label">Sounds</p>
            <p class="st__help">Tiny pencil ticks, flips and a bell. Off by default.</p>
          </div>
          <Toggle label="Sounds" checked={s.sound} onChange={(sound) => set({ sound })} />
        </div>
        {PLATFORM === 'android' && (
          <div class="st__row">
            <div>
              <p class="st__label">Haptics</p>
              <p class="st__help">A light tap on ratings and scene changes.</p>
            </div>
            <Toggle label="Haptics" checked={s.haptics} onChange={(haptics) => set({ haptics })} />
          </div>
        )}
      </section>

      <section class="st__group card" aria-labelledby="st-study">
        <h2 id="st-study">Studying</h2>
        <div class="st__row">
          <div>
            <p class="st__label">New cards per day</p>
            <p class="st__help">
              How many never-seen flashcards join your daily review. Reviews of older cards are never capped.
            </p>
          </div>
          <div class="gd__stepper" role="group" aria-label="New cards per day">
            <button
              type="button"
              aria-label="Fewer"
              onClick={() => set({ newPerDay: s.newPerDay - 5 })}
              disabled={s.newPerDay <= 0}
            >
              <Icon name="minus" size={16} />
            </button>
            <output class="mono">{s.newPerDay}</output>
            <button
              type="button"
              aria-label="More"
              onClick={() => set({ newPerDay: s.newPerDay + 5 })}
              disabled={s.newPerDay >= 50}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      </section>

      <section id="backup" class="st__group card" aria-labelledby="st-data">
        <h2 id="st-data">Your data</h2>
        <p class="st__help">
          Progress is stored only on this device (IndexedDB). Nothing is uploaded, ever. Export a backup to
          move it to another device.
        </p>
        <div class="st__buttons">
          <button type="button" class="btn" onClick={() => void doExport()}>
            <Icon name="download" size={17} /> Export backup
          </button>
          <button type="button" class="btn" onClick={() => file.current?.click()}>
            <Icon name="upload" size={17} /> Import backup
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) void doImport(f);
              (e.target as HTMLInputElement).value = '';
            }}
          />
        </div>
        <div class="st__danger">
          <div>
            <p class="st__label">Reset progress</p>
            <p class="st__help">
              Press and hold for 3 seconds. Napkins stay; your reviews, streak and history go.
            </p>
          </div>
          <button
            type="button"
            class="btn st__hold"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) startHold();
            }}
            onKeyUp={stopHold}
            style={{ '--p': String(hold) }}
            aria-label="Hold for three seconds to reset all progress"
          >
            <Icon name="trash" size={16} /> {hold > 0 && hold < 1 ? 'Keep holding…' : 'Hold to reset'}
          </button>
        </div>
      </section>

      <section class="st__group card" aria-labelledby="st-credits">
        <h2 id="st-credits">Credits</h2>
        <p class="st__help">Every napkin is redrawn and rewritten from openly licensed sources. Thank you:</p>
        <ul class="st__credits">
          {credits.map((c) => (
            <li key={c.url}>
              <a href={c.url} target="_blank" rel="noopener">
                {c.name}
              </a>{' '}
              <span class="muted">— {c.licence}</span>
            </li>
          ))}
          <li>
            Fonts: Bricolage Grotesque, Inter, JetBrains Mono, Excalifont{' '}
            <span class="muted">— SIL OFL 1.1</span>
          </li>
          <li>
            Hand-drawn strokes: Rough.js <span class="muted">— MIT</span> · icons: Lucide{' '}
            <span class="muted">— ISC</span> · scheduling: ts-fsrs <span class="muted">— MIT</span>
          </li>
        </ul>
        <p class="st__version mono">
          Napkin {APP_VERSION} ·{' '}
          {offline === null
            ? 'checking offline mode…'
            : offline
              ? 'offline ready ✓'
              : 'offline mode activates after this visit'}
        </p>
      </section>
    </div>
  );
}
