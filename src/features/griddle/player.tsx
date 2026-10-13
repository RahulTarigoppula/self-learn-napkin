import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { prefersReducedMotion } from '../../db/settings';
import { haptic } from '../../platform/haptics';
import { sound } from '../../platform/sound';
import { Icon } from '../ui/Icon';

export const SPEEDS = [0.5, 1, 2] as const;

/** Frame player: step, scrub, run at ½× / 1× / 2×, pause when scrolled away. */
export function usePlayer(count: number, baseMs = 700) {
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const root = useRef<HTMLDivElement>(null);
  const last = count - 1;

  useEffect(() => {
    if (k > last) setK(Math.max(0, last));
  }, [last, k]);

  useEffect(() => {
    if (!playing) return;
    if (k >= last) {
      setPlaying(false);
      sound.ding();
      void haptic.success();
      return;
    }
    const t = setTimeout(
      () => setK((x) => Math.min(last, x + 1)),
      prefersReducedMotion() ? baseMs : baseMs / speed,
    );
    return () => clearTimeout(t);
  }, [playing, k, last, speed, baseMs]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e && !e.isIntersecting) setPlaying(false);
      el.dataset.state = e?.isIntersecting ? 'visible' : 'paused';
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const step = useCallback(
    (d: number) => {
      setPlaying(false);
      setK((x) => Math.max(0, Math.min(last, x + d)));
      sound.tick();
      void haptic.selection();
    },
    [last],
  );

  const toggle = useCallback(() => {
    if (k >= last) setK(0);
    setPlaying((p) => !p);
  }, [k, last]);

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input[type=number], input[type=text]')) return;
    if (e.key === ' ' && !(e.target as HTMLElement).closest('button, input')) {
      e.preventDefault();
      toggle();
    } else if (e.key === 'ArrowRight' && !(e.target as HTMLElement).closest('input[type=range]')) {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft' && !(e.target as HTMLElement).closest('input[type=range]')) {
      e.preventDefault();
      step(-1);
    } else if (e.key === '1' || e.key === '2' || e.key === '3') {
      setSpeed(SPEEDS[Number(e.key) - 1] as (typeof SPEEDS)[number]);
    }
  };

  return { k, setK, playing, setPlaying, speed, setSpeed, step, toggle, root, onKeyDown, last };
}

export function Controls({
  p,
  caption,
  extra,
}: {
  p: ReturnType<typeof usePlayer>;
  caption: string;
  extra?: ComponentChildren;
}) {
  return (
    <div class="gd__controls">
      <p class="gd__caption mono" aria-live="polite">
        <span class="gd__frame">
          {p.k}/{p.last}
        </span>{' '}
        {caption}
      </p>
      <input
        class="gd__ruler"
        type="range"
        min={0}
        max={Math.max(0, p.last)}
        value={p.k}
        aria-label="Frame"
        aria-valuetext={`Frame ${p.k} of ${p.last}: ${caption}`}
        onInput={(e) => {
          p.setPlaying(false);
          p.setK(Number((e.target as HTMLInputElement).value));
        }}
      />
      <div class="gd__buttons">
        <button
          type="button"
          class="btn btn--icon"
          onClick={() => p.step(-1)}
          aria-label="Step back"
          disabled={p.k === 0}
        >
          <Icon name="skipBack" size={18} />
        </button>
        <button
          type="button"
          class="btn btn--primary gd__run"
          onClick={p.toggle}
          aria-label={p.playing ? 'Pause' : 'Run'}
        >
          <Icon name={p.playing ? 'pause' : p.k >= p.last ? 'replay' : 'play'} size={17} />
          {p.playing ? 'Pause' : p.k >= p.last ? 'Replay' : 'Run'}
        </button>
        <button
          type="button"
          class="btn btn--icon"
          onClick={() => p.step(1)}
          aria-label="Step forward"
          disabled={p.k >= p.last}
        >
          <Icon name="skipForward" size={18} />
        </button>
        <div class="gd__speed" role="group" aria-label="Speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={p.speed === s}
              onClick={() => p.setSpeed(s)}
              aria-label={`${s === 0.5 ? 'half' : s} speed`}
            >
              {s === 0.5 ? '½' : s}×
            </button>
          ))}
        </div>
        {extra}
      </div>
    </div>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div class="gd__stepper" role="group" aria-label={label}>
      <span class="gd__stepper-label">{label}</span>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Icon name="minus" size={16} />
      </button>
      <output class="mono" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

export function Shell({
  title,
  hint,
  children,
  p,
}: {
  title: string;
  hint: string;
  children: ComponentChildren;
  p?: ReturnType<typeof usePlayer>;
}) {
  return (
    <div class="gd" ref={p?.root} onKeyDown={p?.onKeyDown} tabIndex={-1}>
      <div class="gd__head">
        <h3 class="gd__title">{title}</h3>
        <p class="gd__hint">{hint}</p>
      </div>
      {children}
    </div>
  );
}
