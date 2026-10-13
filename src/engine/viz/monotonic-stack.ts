import { rng } from './types';

/** One beat of the next-greater-element scan. */
export interface MonoFrame {
  /** index of the value being processed; -1 before the scan, n after it */
  i: number;
  /** indices still waiting for an answer, bottom → top */
  stack: number[];
  /** answers so far (−1 = none yet / none) */
  ans: number[];
  /** the index whose value answered each position, −1 if none */
  by: number[];
  /** the index popped in this beat, if any */
  popped: number | null;
  pushes: number;
  pops: number;
  phase: 'start' | 'pop' | 'push' | 'done';
  caption: string;
}

/** Plain O(n) next greater element (strictly greater, −1 when none). */
export function nextGreater(nums: readonly number[]): number[] {
  const ans = nums.map(() => -1);
  const stack: number[] = [];
  nums.forEach((x, i) => {
    while (stack.length > 0 && (nums[stack.at(-1) as number] as number) < x) ans[stack.pop() as number] = x;
    stack.push(i);
  });
  return ans;
}

/** Frames for the griddle: one per push, one per pop, plus a start and an end beat. */
export function monoStackFrames(nums: readonly number[]): MonoFrame[] {
  const n = nums.length;
  const ans = nums.map(() => -1);
  const by = nums.map(() => -1);
  const stack: number[] = [];
  let pushes = 0;
  let pops = 0;
  const snap = (
    i: number,
    phase: MonoFrame['phase'],
    caption: string,
    popped: number | null = null,
  ): MonoFrame => ({
    i,
    stack: [...stack],
    ans: [...ans],
    by: [...by],
    popped,
    pushes,
    pops,
    phase,
    caption,
  });
  const out: MonoFrame[] = [snap(-1, 'start', `scan [${nums.join(', ')}] left to right`)];
  nums.forEach((x, i) => {
    let popsHere = 0;
    while (stack.length > 0) {
      const j = stack.at(-1) as number;
      const top = nums[j] as number;
      if (top >= x) break;
      stack.pop();
      ans[j] = x;
      by[j] = i;
      pops++;
      popsHere++;
      out.push(snap(i, 'pop', `${x} > ${top} → pop [${j}], its answer is ${x}`, j));
    }
    const top = stack.at(-1);
    const why =
      top === undefined
        ? popsHere > 0
          ? 'stack emptied'
          : 'stack empty'
        : `${x} is not > ${nums[top]}, stop`;
    stack.push(i);
    pushes++;
    out.push(snap(i, 'push', `${why} → push ${x}, it waits`));
  });
  const left = stack.length;
  out.push(
    snap(
      n,
      'done',
      left === 0
        ? 'end: every value found a bigger one'
        : `end: ${left} left on the stack keep −1 → [${ans.join(', ')}]`,
    ),
  );
  return out;
}

/** Parse "2 1 2 4 3" or "2,1,2,4,3": 1–10 integers in 0..99, else null. */
export function parseNums(text: string, maxLen = 10): number[] | null {
  const parts = text.split(/[\s,]+/).filter((s) => s.length > 0);
  if (parts.length === 0 || parts.length > maxLen) return null;
  const nums = parts.map(Number);
  return nums.every((v) => Number.isInteger(v) && v >= 0 && v <= 99) ? nums : null;
}

/** n deterministic values in 1..9 (small range so ties and runs show up). */
export function randomNums(n: number, seed: number): number[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => 1 + Math.floor(r() * 9));
}
