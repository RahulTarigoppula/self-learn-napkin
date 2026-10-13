import { prefersReducedMotion } from '../../db/settings';
import type { IconName } from '../../lib/icons';
import { toast } from '../../lib/toast';
import { haptic } from '../../platform/haptics';
import { sound } from '../../platform/sound';

const COLOURS = ['--pen-blue', '--pen-orange', '--pen-green', '--pen-red', '--hl'];

/** A short burst of paper confetti from `origin` (default: top centre). Skipped with reduced motion. */
export function celebrate(origin?: { x: number; y: number }, count = 90): void {
  sound.ding();
  void haptic.success();
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.append(canvas);
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
  const bits = Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const v = 7 + Math.random() * 7;
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
    ctx.globalAlpha = Math.max(0, 1 - age / 1600);
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
    if (age < 1600) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** Celebrate from an element (e.g. the button that was just pressed). */
export function celebrateFrom(el: Element | null, count = 60): void {
  const r = el?.getBoundingClientRect();
  celebrate(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined, count);
}

/** An award-style toast: icon, bold title, small explanation. */
export function award(title: string, sub: string, icon: IconName = 'trophy'): void {
  toast(title, { sub, icon, ms: 5200 });
}
