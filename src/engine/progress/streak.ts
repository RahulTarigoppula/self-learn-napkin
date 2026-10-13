export interface DayStat {
  dayKey: string;
  reviews: number;
  newCards: number;
  napkinsRead: number;
}

/** Shift a YYYY-MM-DD key by n calendar days. */
export function shiftDay(k: string, n: number): string {
  const t = new Date(`${k}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

export function streak(days: readonly DayStat[], today: string): { current: number; best: number } {
  const set = new Set(days.filter((d) => d.reviews > 0 || d.napkinsRead > 0).map((d) => d.dayKey));
  // A live streak survives a day with no activity yet.
  let cur = 0;
  let k = set.has(today) ? today : shiftDay(today, -1);
  while (set.has(k)) {
    cur++;
    k = shiftDay(k, -1);
  }
  let best = 0;
  for (const start of set) {
    if (set.has(shiftDay(start, -1))) continue;
    let n = 0;
    let q = start;
    while (set.has(q)) {
      n++;
      q = shiftDay(q, 1);
    }
    best = Math.max(best, n);
  }
  return { current: cur, best };
}
