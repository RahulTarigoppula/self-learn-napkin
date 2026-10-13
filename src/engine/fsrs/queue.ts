import { State } from 'ts-fsrs';

/** The minimum a card needs for queue building (it matches the persisted ReviewCard row). */
export interface QueueCard {
  id: string;
  due: Date;
  state: State;
  orphan: 0 | 1;
  introducedOn?: string | undefined;
}

export interface Queue<C extends QueueCard> {
  due: C[];
  fresh: C[];
  /** due and fresh interleaved: one new card after every three reviews, remainder appended. */
  items: C[];
  isEmpty: boolean;
}

export function buildQueue<C extends QueueCard>(
  cards: readonly C[],
  now: Date,
  newPerDay: number,
  today: string,
): Queue<C> {
  const live = cards.filter((c) => c.orphan === 0);
  const due = live
    .filter((c) => c.state !== State.New && c.due.getTime() <= now.getTime())
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  const introduced = cards.filter((c) => c.introducedOn === today).length;
  const fresh = live.filter((c) => c.state === State.New).slice(0, Math.max(0, newPerDay - introduced));
  const items: C[] = [];
  let f = 0;
  due.forEach((c, i) => {
    items.push(c);
    if ((i + 1) % 3 === 0 && f < fresh.length) items.push(fresh[f++] as C);
  });
  while (f < fresh.length) items.push(fresh[f++] as C);
  return { due, fresh, items, isEmpty: items.length === 0 };
}

/** What the dispenser's spring plate reads. */
export function plateLabel(queueLength: number | null, everReviewed: boolean): string {
  if (queueLength === null) return '…';
  if (queueLength === 0) return 'Clean';
  if (!everReviewed) return 'Pull one';
  return `${queueLength} due`;
}
