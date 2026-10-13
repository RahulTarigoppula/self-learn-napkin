export interface StepInfo {
  index: number;
  caption: string;
  beginMs: number;
  endMs: number;
  firstElement: number;
  lastElement: number;
}

export interface DiagramManifest {
  name: string;
  hash: string;
  renderer: 'rough';
  width: number;
  height: number;
  elements: number;
  animated: boolean;
  finishedMs: number;
  steps: StepInfo[];
}

/** Ticks are evenly spaced per step; time inside a step is linear. */
export function xToTime(x: number, width: number, steps: readonly StepInfo[]): number {
  const n = steps.length;
  if (n === 0 || width <= 0) return 0;
  const seg = width / n;
  const i = Math.min(n - 1, Math.max(0, Math.floor(x / seg)));
  const frac = Math.min(1, Math.max(0, (x - i * seg) / seg));
  const s = steps[i] as StepInfo;
  return s.beginMs + frac * (s.endMs - s.beginMs);
}

export function timeToStep(t: number, steps: readonly StepInfo[]): number {
  let k = 0;
  steps.forEach((s, i) => {
    if (t >= s.beginMs) k = i;
  });
  return k;
}

/** Where along the strip (0..width) a time sits — for drawing the pen tip. */
export function timeToX(t: number, width: number, steps: readonly StepInfo[]): number {
  const n = steps.length;
  if (n === 0) return 0;
  const k = timeToStep(t, steps);
  const s = steps[k] as StepInfo;
  const span = Math.max(1, s.endMs - s.beginMs);
  const frac = Math.min(1, Math.max(0, (t - s.beginMs) / span));
  return ((k + frac) / n) * width;
}

/** The single template for the caption and the slider's aria-valuetext. */
export const stepText = (k: number, steps: readonly StepInfo[], sep = ':'): string =>
  `Step ${k + 1} of ${steps.length}${sep} ${steps[k]?.caption ?? ''}`;
