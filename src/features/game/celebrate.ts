import { prefersReducedMotion } from '../../db/settings';
import type { IconName } from '../../lib/icons';
import { toast } from '../../lib/toast';
import { haptic } from '../../platform/haptics';
import { sound } from '../../platform/sound';

const COLOURS = ['--pen-blue', '--pen-orange', '--pen-green', '--pen-red', '--hl'];

type Point = { x: number; y: number };

export interface CelebrateOptions {
  /** How long the burst lasts in ms (default 1600). */
  duration?: number;
  /** Stacking order of the canvas (default: the .confetti rule, above the page). */
  zIndex?: number;
  /** Where the canvas is mounted (default: document.body). Mount it inside an isolated element to sit behind its content. */
  parent?: Element;
}

/** What a scoped screen wants instead of the default burst: its own origin, size and options. */
export type CelebrateScope = () => CelebrateOptions & { origin?: Point; count?: number };

let scope: CelebrateScope | null = null;

/**
 * Let a focused screen (a review session) shape bursts that other code fires without options, such as an
 * achievement unlocking mid-session. Pass null to restore the defaults. Calls with explicit options ignore it.
 */
export function setCelebrateScope(next: CelebrateScope | null): void {
  scope = next;
}

/** A short burst of paper confetti from `origin` (default: top centre). Skipped with reduced motion. */
export function celebrate(origin?: Point, count = 90, opts?: CelebrateOptions): void {
  sound.ding();
  void haptic.success();
  if (prefersReducedMotion()) return;
  let o: CelebrateOptions = opts ?? {};
  if (!origin && !opts && scope) {
    const s = scope();
    o = s;
    origin = s.origin;
    count = s.count ?? count;
  }
  const duration = o.duration ?? 1600;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  if (o.zIndex !== undefined) canvas.style.zIndex = String(o.zIndex);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  (o.parent ?? document.body).append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const palette = COLOURS.map((v) => css.getPropertyValue(v).trim() || '#3355ff');
  const ox = origin?.x ?? innerWidth / 2;
  const oy = origin?.y ?? innerHeight * 0.3;
  // A short burst travels less far, so it stays a pop rather than a shower.
  const speed = Math.min(1, 0.45 + duration / 2900);
  const bits = Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const v = (7 + Math.random() * 7) * speed;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      w: 6 + Math.random() * 6,
      h: 3 + Math.random() * 5,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: palette[i % palette.length] as string,
    };
  });
  const start = performance.now();
  const frame = (t: number) => {
    const age = t - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - age / duration);
    for (const b of bits) {
      b.vy += 0.28;
      b.vx *= 0.985;
      b.x += b.vx;
      b.y += b.vy;
      b.r += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.r);
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2)) + 1);
      ctx.restore();
    }
    if (age < duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** Celebrate from an element (e.g. the button that was just pressed). */
export function celebrateFrom(el: Element | null, count = 60, opts?: CelebrateOptions): void {
  const r = el?.getBoundingClientRect();
  celebrate(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined, count, opts);
}

/** An award-style toast: icon, bold title, small explanation. */
export function award(title: string, sub: string, icon: IconName = 'trophy'): void {
  toast(title, { sub, icon, ms: 5200 });
}
