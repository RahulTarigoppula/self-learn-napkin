import type { ComponentChildren } from 'preact';

/** Small SVG primitives shared by the graph griddles (Dijkstra, topological sort, MST). */

export interface Pt {
  x: number;
  y: number;
}

interface EdgeProps {
  a: Pt;
  b: Pt;
  /** Node radius: the line stops at the circle's rim. */
  r?: number;
  arrow?: boolean;
  /** Perpendicular bend in px (0 = straight). */
  bend?: number;
  stroke: string;
  width?: number;
  dash?: string;
  opacity?: number;
  under?: string;
  label?: ComponentChildren;
  labelFill?: string;
  labelSize?: number;
  onClick?: () => void;
}

/** A straight or bent edge, optionally with an arrowhead, an underlay glow and a weight label. */
export function GEdge({
  a,
  b,
  r = 22,
  arrow,
  bend = 0,
  stroke,
  width = 2.2,
  dash,
  opacity = 1,
  under,
  label,
  labelFill = 'var(--pen-blue)',
  labelSize = 19,
  onClick,
}: EdgeProps) {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const c = { x: (a.x + b.x) / 2 + nx * bend, y: (a.y + b.y) / 2 + ny * bend };
  const toward = (from: Pt, to: Pt, d: number): Pt => {
    const l = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    return { x: from.x + ((to.x - from.x) / l) * d, y: from.y + ((to.y - from.y) / l) * d };
  };
  const s = toward(a, c, r);
  const tip = toward(b, c, r);
  const e = arrow ? toward(tip, c, 9) : tip;
  const d = bend ? `M${s.x},${s.y} Q${c.x},${c.y} ${e.x},${e.y}` : `M${s.x},${s.y} L${e.x},${e.y}`;
  const mid = bend ? { x: (s.x + 2 * c.x + e.x) / 4, y: (s.y + 2 * c.y + e.y) / 4 } : c;
  const back = toward(tip, c, 12);
  const ux = (back.x - tip.x) / 12;
  const uy = (back.y - tip.y) / 12;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined, opacity }} class="anim">
      {onClick && <path d={d} style={{ stroke: 'transparent', strokeWidth: 22, fill: 'none' }} />}
      {under && (
        <path d={d} style={{ stroke: under, strokeWidth: width + 9, fill: 'none', strokeLinecap: 'round' }} />
      )}
      <path
        d={d}
        style={{ stroke, strokeWidth: width, fill: 'none', strokeDasharray: dash, strokeLinecap: 'round' }}
      />
      {arrow && (
        <polygon
          points={`${tip.x},${tip.y} ${back.x - uy * 6},${back.y + ux * 6} ${back.x + uy * 6},${back.y - ux * 6}`}
          style={{ fill: stroke }}
        />
      )}
      {label !== undefined && (
        <text
          x={mid.x}
          y={mid.y + labelSize * 0.35}
          text-anchor="middle"
          font-size={labelSize}
          class="gg-halo"
          style={{ fill: labelFill, fontWeight: 700 }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

interface NodeProps {
  p: Pt;
  r?: number;
  label: string;
  fill: string;
  stroke: string;
  ink?: string;
  width?: number;
  ring?: string;
  ringDash?: string;
  fontSize?: number;
  onClick?: () => void;
}

/** A labelled circle; `ring` draws an outer marker ring (source / target). */
export function GNode({
  p,
  r = 22,
  label,
  fill,
  stroke,
  ink = 'var(--pen-ink)',
  width = 2.2,
  ring,
  ringDash,
  fontSize = 19,
  onClick,
}: NodeProps) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      {ring && (
        <circle
          cx={p.x}
          cy={p.y}
          r={r + 6}
          style={{ fill: 'none', stroke: ring, strokeWidth: 2.5, strokeDasharray: ringDash }}
        />
      )}
      <circle class="anim" cx={p.x} cy={p.y} r={r} style={{ fill, stroke, strokeWidth: width }} />
      <text
        x={p.x}
        y={p.y + fontSize * 0.33}
        text-anchor="middle"
        font-size={fontSize}
        style={{ fill: ink, fontWeight: 700 }}
      >
        {label}
      </text>
    </g>
  );
}

/** A value with the one it replaced struck through to its left (e.g. a distance that just dropped). */
export function StrikeLabel({ x, y, cur, old }: { x: number; y: number; cur: string; old: string }) {
  return (
    <g class="gg-halo" font-size={21}>
      {old && (
        <>
          <text x={x - 4} y={y} text-anchor="end" style={{ fill: 'var(--pen-muted)' }}>
            {old}
          </text>
          <line
            x1={x - 6 - old.length * 12.5}
            y1={y - 7}
            x2={x - 2}
            y2={y - 7}
            style={{ stroke: 'var(--pen-red)', strokeWidth: 2 }}
          />
        </>
      )}
      <text
        x={old ? x + 4 : x}
        y={y}
        text-anchor={old ? 'start' : 'middle'}
        style={{ fill: 'var(--pen-ink)', fontWeight: 700 }}
      >
        {cur}
      </text>
    </g>
  );
}
