import { fnv1a } from '../viz/fnv1a';
import { rng } from '../viz/types';

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

/** Reorder options with a permutation seeded by the question text (stable across builds), keeping the
 *  answer index pointing at the same option. Authors tend to put the right answer in the same slot. */
export function shuffleOptions<T extends QuizQuestion>(item: T, seed: number = fnv1a(item.q)): T {
  const r = rng(seed);
  const order = item.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  return {
    ...item,
    options: order.map((i) => item.options[i] as string),
    answer: order.indexOf(item.answer),
  };
}
