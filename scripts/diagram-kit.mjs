// The Napkin diagram kit: a tiny drawing API over the Rough.js generator, run at BUILD time only.
// Each call adds one "element" (a <g>) in drawing order; d.step(caption) starts a new story scene.
// Colours are emitted as classes (s-blue, f-blue, t-ink …) so the page's CSS tokens colour the sketch
// in both light and dark themes. No diagram library ever reaches the browser.
import rough from 'roughjs';

/** @typedef {'ink'|'muted'|'red'|'blue'|'green'|'orange'|'violet'|'paper'|'hl'} Pen */

const PENS = new Set(['ink', 'muted', 'red', 'blue', 'green', 'orange', 'violet', 'paper', 'hl']);

const fmtWith = (/** @type {number} */ scale) => (/** @type {string} */ d) =>
  d.replace(/-?\d+\.\d+(e-?\d+)?/g, (n) => {
    const v = Math.round(Number(n) * scale) / scale;
    return Object.is(v, -0) ? '0' : String(v);
  });
let fmt = fmtWith(10);

const esc = (/** @type {string} */ s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Small deterministic string hash → rough.js seed. */
function seedOf(/** @type {string} */ s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return (h % 2147483646) + 1;
}

/**
 * @param {{ name: string, width?: number, height?: number, thumb?: boolean }} o
 */
export function createDiagram({ name, width = 520, height = 360, thumb = false }) {
  // Thumbnails (library tiles) use single strokes and whole-unit coordinates: ~half the bytes.
  fmt = fmtWith(thumb ? 1 : 10);
  const gen = rough.generator();
  /** @type {{ step: number, parts: string[], kind: string }[]} */
  const elements = [];
  /** @type {{ caption: string }[]} */
  const steps = [];
  let stepIndex = -1;
  /** @type {string[] | null} */
  let grouping = null;

  const check = (/** @type {string|undefined} */ pen, /** @type {string} */ what) => {
    if (pen !== undefined && !PENS.has(pen)) throw new Error(`${name}: unknown ${what} colour "${pen}"`);
  };

  const push = (/** @type {string} */ kind, /** @type {string[]} */ parts) => {
    if (grouping) {
      grouping.push(...parts);
      return;
    }
    if (stepIndex < 0) throw new Error(`${name}: call d.step(caption) before drawing`);
    elements.push({ step: stepIndex, parts, kind });
  };

  /** Turn a rough Drawable into <path>s with colour classes. */
  const paths = (/** @type {import('roughjs/bin/core').Drawable} */ drawable, /** @type {any} */ o) =>
    gen.toPaths(drawable).map((p) => {
      const d = fmt(p.d);
      if (p.fill && p.fill !== 'none' && (p.stroke === 'none' || !p.stroke)) {
        return `<path d="${d}" class="f-${o.fill}"/>`;
      }
      // hachure fill lines come back as strokes in the fill colour
      if (o.fill && p.stroke === `F_${o.fill}`) return `<path d="${d}" class="h-${o.fill}" pathLength="1"/>`;
      const dash = o.dashed ? ' stroke-dasharray="6 6"' : '';
      const cls = `s-${o.pen ?? 'ink'}${o.thick ? ' w-thick' : o.thin ? ' w-thin' : ''}`;
      return `<path d="${d}" class="${cls}"${dash}${o.dashed ? '' : ' pathLength="1"'}/>`;
    });

  const opts = (/** @type {any} */ o = {}, /** @type {string} */ key = '') => {
    check(o.pen, 'pen');
    check(o.fill, 'fill');
    return {
      seed: seedOf(`${name}#${elements.length}#${key}#${grouping ? grouping.length : 0}`),
      roughness: o.rough ?? 1.1,
      bowing: o.bowing ?? 1,
      stroke: `S_${o.pen ?? 'ink'}`,
      strokeWidth: o.thick ? 2.6 : o.thin ? 1.1 : 1.7,
      fill: o.fill ? `F_${o.fill}` : undefined,
      fillStyle: o.fillStyle ?? 'solid',
      hachureGap: o.gap ?? 7,
      fillWeight: 1.2,
      hachureAngle: o.angle ?? -41,
      disableMultiStroke: thumb || (o.single ?? false),
      preserveVertices: false,
    };
  };

  const textEl = (
    /** @type {number} */ x,
    /** @type {number} */ y,
    /** @type {string} */ s,
    /** @type {any} */ o = {},
  ) => {
    check(o.pen, 'pen');
    const size = o.size ?? (o.mono ? 15 : 18);
    const anchor = o.anchor ?? 'middle';
    const cls = `t t-${o.pen ?? 'ink'}${o.mono ? ' t-mono' : ''}${o.bold ? ' t-bold' : ''}`;
    const lines = String(s).split('\n');
    const lh = size * 1.15;
    const y0 = y - ((lines.length - 1) * lh) / 2;
    return lines
      .map(
        (line, i) =>
          `<text x="${fmt(x.toFixed(1))}" y="${fmt((y0 + i * lh).toFixed(1))}" font-size="${size}" text-anchor="${anchor}" dominant-baseline="central" class="${cls}">${esc(line)}</text>`,
      )
      .join('');
  };

  /** Arrowhead lines at (x2,y2) pointing along (dx,dy). */
  const head = (
    /** @type {number} */ x2,
    /** @type {number} */ y2,
    /** @type {number} */ dx,
    /** @type {number} */ dy,
    /** @type {any} */ o,
    /** @type {string} */ key,
  ) => {
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const s = o.headSize ?? 11;
    const a = 0.5;
    const p1 = [
      x2 - s * (ux * Math.cos(a) - uy * Math.sin(a)),
      y2 - s * (uy * Math.cos(a) + ux * Math.sin(a)),
    ];
    const p2 = [
      x2 - s * (ux * Math.cos(-a) - uy * Math.sin(-a)),
      y2 - s * (uy * Math.cos(-a) + ux * Math.sin(-a)),
    ];
    return paths(
      gen.linearPath([p1, [x2, y2], p2], { ...opts({ ...o, dashed: false }, key), roughness: 0.6 }),
      { ...o, dashed: false },
    );
  };

  const api = {
    width,
    height,
    /** Start a new story scene. */
    step(/** @type {string} */ caption) {
      steps.push({ caption });
      stepIndex = steps.length - 1;
      return api;
    },
    /** Merge everything drawn inside fn into ONE element (appears together). */
    group(/** @type {() => void} */ fn, kind = 'group') {
      if (grouping) {
        // Nested group: everything simply joins the enclosing element.
        fn();
        return api;
      }
      grouping = [];
      fn();
      const parts = grouping;
      grouping = null;
      push(kind, parts);
      return api;
    },
    rect(
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {number} */ w,
      /** @type {number} */ h,
      /** @type {any} */ o = {},
    ) {
      const parts = paths(gen.rectangle(x, y, w, h, opts(o, 'r')), o);
      if (o.label !== undefined)
        parts.push(
          textEl(x + w / 2, y + h / 2, o.label, {
            size: o.size,
            pen: o.textPen ?? o.pen ?? 'ink',
            mono: o.mono,
            bold: o.bold,
          }),
        );
      push('rect', parts);
      return api;
    },
    circle(
      /** @type {number} */ cx,
      /** @type {number} */ cy,
      /** @type {number} */ dia,
      /** @type {any} */ o = {},
    ) {
      const parts = paths(gen.circle(cx, cy, dia, opts(o, 'c')), o);
      if (o.label !== undefined)
        parts.push(
          textEl(cx, cy, o.label, {
            size: o.size,
            pen: o.textPen ?? o.pen ?? 'ink',
            mono: o.mono,
            bold: o.bold,
          }),
        );
      push('circle', parts);
      return api;
    },
    ellipse(
      /** @type {number} */ cx,
      /** @type {number} */ cy,
      /** @type {number} */ w,
      /** @type {number} */ h,
      /** @type {any} */ o = {},
    ) {
      const parts = paths(gen.ellipse(cx, cy, w, h, opts(o, 'e')), o);
      if (o.label !== undefined)
        parts.push(textEl(cx, cy, o.label, { size: o.size, pen: o.textPen ?? o.pen ?? 'ink' }));
      push('ellipse', parts);
      return api;
    },
    line(
      /** @type {number} */ x1,
      /** @type {number} */ y1,
      /** @type {number} */ x2,
      /** @type {number} */ y2,
      /** @type {any} */ o = {},
    ) {
      push('line', paths(gen.line(x1, y1, x2, y2, opts(o, 'l')), o));
      return api;
    },
    /** Straight or bent arrow. o.bend (px) bows it sideways; o.both adds a tail head. */
    arrow(
      /** @type {number} */ x1,
      /** @type {number} */ y1,
      /** @type {number} */ x2,
      /** @type {number} */ y2,
      /** @type {any} */ o = {},
    ) {
      const parts = [];
      let tx = x2 - x1;
      let ty = y2 - y1;
      if (o.bend) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const len = Math.hypot(tx, ty) || 1;
        const cx = mx - (ty / len) * o.bend;
        const cy = my + (tx / len) * o.bend;
        /** @type {[number, number][]} */
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          pts.push([
            (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2,
            (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2,
          ]);
        }
        parts.push(...paths(gen.curve(pts, opts(o, 'a')), o));
        tx = x2 - cx;
        ty = y2 - cy;
        if (o.both) parts.push(...head(x1, y1, x1 - cx, y1 - cy, o, 'h0'));
      } else {
        parts.push(...paths(gen.line(x1, y1, x2, y2, opts(o, 'a')), o));
        if (o.both) parts.push(...head(x1, y1, -tx, -ty, o, 'h0'));
      }
      parts.push(...head(x2, y2, tx, ty, o, 'h1'));
      if (o.label !== undefined) {
        const lx = (x1 + x2) / 2 + (o.labelDx ?? 0);
        const ly = (y1 + y2) / 2 + (o.labelDy ?? -12);
        parts.push(
          textEl(lx, ly, o.label, { size: o.size ?? 15, pen: o.textPen ?? o.pen ?? 'ink', mono: o.mono }),
        );
      }
      push('arrow', parts);
      return api;
    },
    /** A smooth hand-drawn curve through points. */
    curve(/** @type {[number, number][]} */ pts, /** @type {any} */ o = {}) {
      push('curve', paths(gen.curve(pts, opts(o, 'cv')), o));
      return api;
    },
    /** Polyline (open) or polygon (o.closed). */
    poly(/** @type {[number, number][]} */ pts, /** @type {any} */ o = {}) {
      const dr = o.closed ? gen.polygon(pts, opts(o, 'pg')) : gen.linearPath(pts, opts(o, 'pl'));
      push('poly', paths(dr, o));
      return api;
    },
    /** Arc of an ellipse; angles in degrees on a clock face: 0 = 12 o'clock, clockwise. */
    arc(
      /** @type {number} */ cx,
      /** @type {number} */ cy,
      /** @type {number} */ w,
      /** @type {number} */ h,
      /** @type {number} */ from,
      /** @type {number} */ to,
      /** @type {any} */ o = {},
    ) {
      const r = (/** @type {number} */ a) => ((a - 90) * Math.PI) / 180;
      push('arc', paths(gen.arc(cx, cy, w, h, r(from), r(to), false, opts(o, 'ac')), o));
      return api;
    },
    /** An arrow that follows a circle of radius r from one clock angle to another (clockwise if to > from). */
    arcArrow(
      /** @type {number} */ cx,
      /** @type {number} */ cy,
      /** @type {number} */ r,
      /** @type {number} */ from,
      /** @type {number} */ to,
      /** @type {any} */ o = {},
    ) {
      /** @type {[number, number][]} */
      const pts = [];
      const n = Math.max(4, Math.ceil(Math.abs(to - from) / 8));
      for (let i = 0; i <= n; i++) {
        const a = ((from + ((to - from) * i) / n - 90) * Math.PI) / 180;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      const parts = paths(gen.curve(pts, opts(o, 'aa')), o);
      const [x2, y2] = /** @type {[number, number]} */ (pts[pts.length - 1]);
      const [x1, y1] = /** @type {[number, number]} */ (pts[pts.length - 2]);
      parts.push(...head(x2, y2, x2 - x1, y2 - y1, o, 'aah'));
      push('arcArrow', parts);
      return api;
    },
    /** Point on a circle at a clock angle (helper for authors). */
    at(
      /** @type {number} */ cx,
      /** @type {number} */ cy,
      /** @type {number} */ r,
      /** @type {number} */ deg,
    ) {
      const a = ((deg - 90) * Math.PI) / 180;
      return /** @type {[number, number]} */ ([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    },
    text(
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {string} */ s,
      /** @type {any} */ o = {},
    ) {
      push('text', [textEl(x, y, s, o)]);
      return api;
    },
    /** A filled dot (solid, slightly rough). */
    dot(
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {number} */ dia,
      /** @type {any} */ o = {},
    ) {
      const pen = o.pen ?? 'ink';
      const parts = paths(
        gen.circle(x, y, dia, { ...opts({ ...o, fill: o.fill ?? pen }, 'd'), roughness: 0.4 }),
        {
          ...o,
          fill: o.fill ?? pen,
        },
      );
      if (o.label !== undefined)
        parts.push(
          textEl(x + (o.dx ?? 0), y + (o.dy ?? -16), o.label, {
            size: o.size ?? 15,
            pen: o.textPen ?? pen,
            mono: o.mono,
          }),
        );
      push('dot', parts);
      return api;
    },
    /** A highlighter swipe behind something (draws first in its element). */
    highlight(
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {number} */ w,
      /** @type {number} */ h,
    ) {
      push(
        'highlight',
        paths(
          gen.rectangle(x, y, w, h, {
            ...opts({ fill: 'hl', pen: 'hl' }, 'hl'),
            roughness: 2,
            fillStyle: 'solid',
            stroke: 'none',
          }),
          { fill: 'hl' },
        ),
      );
      return api;
    },
  };

  api.render = () => {
    if (steps.length === 0) throw new Error(`${name}: a diagram needs at least one step`);
    /** @type {{ index: number, caption: string, firstElement: number, lastElement: number }[]} */
    const manifestSteps = steps.map((s, i) => {
      const idx = elements.map((e, j) => (e.step === i ? j : -1)).filter((j) => j >= 0);
      if (idx.length === 0) throw new Error(`${name}: step ${i} ("${s.caption}") draws nothing`);
      return { index: i, caption: s.caption, firstElement: idx[0], lastElement: idx[idx.length - 1] };
    });
    const perStep = new Map();
    const body = elements
      .map((e, i) => {
        const n = perStep.get(e.step) ?? 0;
        perStep.set(e.step, n + 1);
        return `<g data-el="${i}" data-step="${e.step}" style="--i:${n}">${e.parts.join('')}</g>`;
      })
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="dg" data-diagram="${name}">${body}</svg>`;
    return {
      svg,
      manifest: { name, width, height, elements: elements.length, steps: manifestSteps },
    };
  };

  return api;
}

/** Colours for the standalone file in public/diagrams (the app inlines and uses its own tokens). */
export const STANDALONE_STYLE = `<style>
.dg path{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.7}
.dg .w-thick{stroke-width:2.6}.dg .w-thin{stroke-width:1.1}
.dg text{font-family:Excalifont,'Comic Sans MS',cursive;stroke:none}.dg .t-mono{font-family:'JetBrains Mono',monospace}
.s-ink{stroke:#16181D}.s-muted{stroke:#5B6070}.s-red{stroke:#E5484D}.s-blue{stroke:#3355FF}.s-green{stroke:#12A150}.s-orange{stroke:#F59E0B}.s-violet{stroke:#8B5CF6}.s-paper{stroke:#fff}.s-hl{stroke:#FFE45C}
.f-ink{fill:#16181D!important}.f-muted{fill:#E9E3D9!important}.f-red{fill:#FDE2E2!important}.f-blue{fill:#E3E8FF!important}.f-green{fill:#D8F5E5!important}.f-orange{fill:#FFF1D6!important}.f-violet{fill:#EDE5FF!important}.f-paper{fill:#fff!important}.f-hl{fill:#FFE45C!important}
.h-red{stroke:#E5484D}.h-blue{stroke:#3355FF}.h-green{stroke:#12A150}.h-orange{stroke:#F59E0B}.h-violet{stroke:#8B5CF6}.h-hl{stroke:#FFE45C}.h-ink{stroke:#16181D}.h-muted{stroke:#9AA0AE}
.t-ink{fill:#16181D}.t-muted{fill:#5B6070}.t-red{fill:#E5484D}.t-blue{fill:#3355FF}.t-green{fill:#12A150}.t-orange{fill:#B7791F}.t-violet{fill:#8B5CF6}.t-paper{fill:#fff}
</style>`;

/** Thumbnails are shown as <img> on always-light paper, so they carry their own light colours and a
 *  system hand/sans font (an SVG image cannot use the page's web fonts). */
export const THUMB_STYLE = STANDALONE_STYLE.replace(
  "font-family:Excalifont,'Comic Sans MS',cursive",
  "font-family:'Segoe Print','Bradley Hand','Comic Sans MS',system-ui,sans-serif",
);
