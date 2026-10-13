import { prefersReducedMotion } from '../../db/settings';
import { haptic } from '../../platform/haptics';
import { sound } from '../../platform/sound';
import { celebrateFrom } from '../game/celebrate';

/** Progressive enhancement of <section data-story>: one scene at a time, the diagram's strokes for that
 *  scene draw themselves, earlier scenes stay (dimmed), later ones are hidden. Without JS every scene
 *  is listed and the diagram is fully drawn. */
class StoryPlayer {
  private k = -1;
  private readonly n: number;
  private readonly groups: SVGGElement[];
  private readonly scenes: HTMLElement[];
  private readonly segs: HTMLButtonElement[];
  private playing = false;
  private timer: number | undefined;
  private finished = false;

  constructor(private readonly root: HTMLElement) {
    this.n = Number(root.dataset.steps ?? '0');
    this.groups = [...root.querySelectorAll<SVGGElement>('svg g[data-step]')];
    this.scenes = [...root.querySelectorAll<HTMLElement>('.scene')];
    this.segs = [...root.querySelectorAll<HTMLButtonElement>('[data-go]')];
    root.classList.add('is-story');
    root.dataset.ready = '';
    this.bind();
    this.go(0, true);
  }

  private q<T extends HTMLElement>(sel: string): T | null {
    return this.root.querySelector<T>(sel);
  }

  private bind(): void {
    this.q('[data-next]')?.addEventListener('click', () => {
      this.stop();
      this.next();
    });
    this.q('[data-prev]')?.addEventListener('click', () => {
      this.stop();
      this.go(this.k - 1);
    });
    this.q('[data-play]')?.addEventListener('click', () => (this.playing ? this.stop() : this.play()));
    this.q('[data-replay]')?.addEventListener('click', () => this.redraw());
    for (const b of this.segs)
      b.addEventListener('click', () => {
        this.stop();
        this.go(Number(b.dataset.go));
      });
    this.root.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.stop();
        this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.stop();
        this.go(this.k - 1);
      }
    });
    // Horizontal swipe on the drawing; ignores the first 32 px from either screen edge (system back).
    const stage = this.q<HTMLElement>('.story__stage');
    let x0 = 0;
    let y0 = 0;
    let t0 = 0;
    let tracking = false;
    stage?.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      tracking = e.clientX > 32 && e.clientX < innerWidth - 32;
      x0 = e.clientX;
      y0 = e.clientY;
      t0 = performance.now();
    });
    stage?.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      const fast = Math.abs(dx) / Math.max(1, performance.now() - t0) > 0.6;
      if (Math.abs(dx) > Math.abs(dy) * 1.4 && (Math.abs(dx) > 60 || fast)) {
        this.stop();
        if (dx < 0) this.next();
        else this.go(this.k - 1);
      }
    });
    // Only the story in view keeps playing.
    new IntersectionObserver((entries) => {
      for (const en of entries) if (!en.isIntersecting) this.stop();
    }).observe(this.root);
  }

  next(): void {
    if (this.k >= this.n - 1) {
      if (!this.finished) this.finish();
      else this.go(0);
      return;
    }
    this.go(this.k + 1);
  }

  go(target: number, initial = false): void {
    const k = Math.max(0, Math.min(this.n - 1, target));
    if (k === this.k && !initial) return;
    const forward = k > this.k;
    const prevK = this.k;
    this.k = k;
    const animate = !prefersReducedMotion() && (forward || initial);
    for (const g of this.groups) {
      const s = Number(g.dataset.step);
      g.classList.toggle('is-future', s > k);
      g.classList.toggle('is-past', s < k && !this.finished);
      const drawNow = animate && s === k && (initial || s > prevK);
      g.classList.remove('is-drawing');
      if (drawNow) {
        void g.getBoundingClientRect();
        g.classList.add('is-drawing');
      }
    }
    this.scenes.forEach((el, i) => {
      el.toggleAttribute('data-active', i === k);
      el.setAttribute('aria-hidden', String(i !== k));
    });
    this.segs.forEach((b, i) => {
      b.dataset.state = i < k ? 'done' : i === k ? 'current' : 'todo';
      if (i === k) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    const prev = this.q<HTMLButtonElement>('[data-prev]');
    if (prev) prev.disabled = k === 0;
    const label = this.q('[data-next-label]');
    if (label) label.textContent = k === this.n - 1 ? (this.finished ? 'Start over' : 'Finish') : 'Next';
    if (!initial) {
      sound.tick();
      void haptic.selection();
    }
  }

  private redraw(): void {
    for (const g of this.groups) {
      if (Number(g.dataset.step) !== this.k) continue;
      g.classList.remove('is-drawing');
      void g.getBoundingClientRect();
      g.classList.add('is-drawing');
    }
  }

  private finish(): void {
    this.finished = true;
    this.stop();
    for (const g of this.groups) g.classList.remove('is-past', 'is-future');
    const label = this.q('[data-next-label]');
    if (label) label.textContent = 'Start over';
    this.root.dataset.finished = '';
    celebrateFrom(this.q('[data-next]'), 45);
    const slug = this.root.dataset.slug;
    if (slug) {
      void import('../../db/dexie')
        .then(async ({ getDb }) => {
          const { markRead } = await import('../../db/review');
          await markRead(getDb(), slug);
          document.dispatchEvent(new CustomEvent('napkin:progress'));
        })
        .catch((e: unknown) => console.error('could not mark read', e));
    }
    document.getElementById(this.root.dataset.after ?? 'key-ideas')?.scrollIntoView({ block: 'start' });
  }

  private play(): void {
    this.playing = true;
    this.root.dataset.playing = '';
    this.setPlayUi(true);
    if (this.k >= this.n - 1) this.go(0);
    this.schedule();
  }

  private schedule(): void {
    const text = this.scenes[this.k]?.textContent ?? '';
    const dwell = Math.max(3200, Math.min(9000, text.length * 52));
    this.timer = window.setTimeout(() => {
      if (!this.playing) return;
      if (this.k >= this.n - 1) {
        this.stop();
        return;
      }
      this.go(this.k + 1);
      this.schedule();
    }, dwell);
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    delete this.root.dataset.playing;
    window.clearTimeout(this.timer);
    this.setPlayUi(false);
  }

  private setPlayUi(on: boolean): void {
    const b = this.q<HTMLButtonElement>('[data-play]');
    b?.setAttribute('aria-label', on ? 'Pause the story' : 'Play the story');
    this.q('[data-play-icon]')?.toggleAttribute('hidden', on);
    this.q('[data-pause-icon]')?.toggleAttribute('hidden', !on);
    const l = this.q('[data-play-label]');
    if (l) l.textContent = on ? 'Pause' : 'Play';
  }
}

export function initStories(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-story]:not([data-ready])'))
    new StoryPlayer(el);
}
