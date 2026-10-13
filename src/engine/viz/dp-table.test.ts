import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  applyEdits,
  dpFrameCount,
  dpView,
  editRun,
  formatEdit,
  greedyByRatio,
  KNAPSACK_CAPACITY,
  KNAPSACK_ITEMS,
  type KnapItem,
  knapsackRun,
  lcsRun,
  shown,
} from './dp-table';

const isSubseq = (s: string, of: string) => {
  let k = 0;
  for (const ch of of) if (ch === s[k]) k++;
  return k === s.length;
};

const lev = (a: string, b: string): number => {
  // independent recursive reference with memo
  const memo = new Map<string, number>();
  const go = (i: number, j: number): number => {
    if (i === 0) return j;
    if (j === 0) return i;
    const key = `${i},${j}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    const v = Math.min(
      go(i - 1, j - 1) + (a[i - 1] === b[j - 1] ? 0 : 1),
      go(i - 1, j) + 1,
      go(i, j - 1) + 1,
    );
    memo.set(key, v);
    return v;
  };
  return go(a.length, b.length);
};

describe('LCS table', () => {
  const run = lcsRun('ABCBD', 'BDCAB');

  it('matches the napkin worked table and reads BCB', () => {
    expect(run.table).toEqual([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 2],
      [0, 1, 1, 2, 2, 2],
      [0, 1, 1, 2, 2, 3],
      [0, 1, 2, 2, 2, 3],
    ]);
    expect(run.lcs).toBe('BCB');
    expect(run.fills).toHaveLength(25);
  });

  it('explains match and mismatch cells', () => {
    const d14 = run.fills.find((f) => f.r === 1 && f.c === 4);
    expect(d14).toMatchObject({ v: 1, tag: '↖', win: [0, 3], from: [[0, 3]] });
    expect(d14?.caption).toBe('dp[1][4] A = A → ↖ 0 + 1 = 1');
    const d34 = run.fills.find((f) => f.r === 3 && f.c === 4);
    expect(d34).toMatchObject({ v: 2, tag: '←', win: [3, 3] });
    expect(d34?.caption).toBe('dp[3][4] C ≠ A → max(↑ 1, ← 2) = 2');
    const d55 = run.fills.at(-1);
    expect(d55).toMatchObject({ r: 5, c: 5, v: 3, tag: '↑', win: [4, 5] });
  });

  it('walks back exactly as the napkin does', () => {
    expect(run.trace.map((s) => [s.r, s.c])).toEqual([
      [5, 5],
      [4, 5],
      [3, 4],
      [3, 3],
      [2, 2],
      [2, 1],
      [1, 0],
    ]);
    expect(run.trace.filter((s) => s.mark).map((s) => s.note)).toEqual(['B', 'C', 'B']);
    expect(run.trace[2]?.caption).toBe('C ≠ A → go ← (2 > 1)');
    expect(run.trace[0]?.caption).toBe('D ≠ B → go ↑ (3 ≥ 2)');
    expect(run.trace.at(-1)?.caption).toBe('stop — LCS = BCB (length 3)');
  });

  it('handles nothing in common and empty strings', () => {
    const none = lcsRun('AAA', 'BB');
    expect(none.lcs).toBe('');
    expect(none.trace.at(-1)?.caption).toBe('stop — nothing in common');
    const empty = lcsRun('', 'ABC');
    expect(empty.fills).toHaveLength(0);
    expect(empty.trace).toEqual([{ r: 0, c: 3, caption: 'stop — nothing in common', mark: false }]);
    expect(dpFrameCount(empty)).toBe(2);
  });

  it('ABCBDAB vs BDCABA has length 4', () => {
    expect([...lcsRun('ABCBDAB', 'BDCABA').lcs]).toHaveLength(4);
  });

  it('property: result is a common subsequence of the table length', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[abc]{0,8}$/), fc.stringMatching(/^[abc]{0,8}$/), (x, y) => {
        const r = lcsRun(x, y);
        expect(isSubseq(r.lcs, x) && isSubseq(r.lcs, y)).toBe(true);
        expect(r.lcs.length).toBe(r.table[x.length]?.[y.length]);
        expect(r.fills).toHaveLength(x.length * y.length);
      }),
    );
  });
});

describe('edit distance table', () => {
  const run = editRun('kitten', 'sitting');

  it('matches the napkin worked table: distance 3', () => {
    expect(run.table).toEqual([
      [0, 1, 2, 3, 4, 5, 6, 7],
      [1, 1, 2, 3, 4, 5, 6, 7],
      [2, 2, 1, 2, 3, 4, 5, 6],
      [3, 3, 2, 1, 2, 3, 4, 5],
      [4, 4, 3, 2, 1, 2, 3, 4],
      [5, 5, 4, 3, 2, 2, 3, 4],
      [6, 6, 5, 4, 3, 3, 2, 3],
    ]);
    expect(run.distance).toBe(3);
    expect(run.order[0]?.[3]).toBe(-1);
  });

  it('tags which op won each cell', () => {
    const at = (r: number, c: number) => run.fills.find((f) => f.r === r && f.c === c);
    expect(at(1, 1)?.tag).toBe('R');
    expect(at(1, 1)?.caption).toBe('dp[1][1] k≠s: replace 1 · delete 2 · insert 2 → replace 1');
    expect(at(2, 2)?.tag).toBe('=');
    expect(at(6, 7)).toMatchObject({ tag: 'I', v: 3, win: [6, 6] });
    expect(at(1, 2)?.tag).toBe('R'); // tie: diagonal preferred
    expect(at(2, 3)?.tag).toBe('I');
    expect(editRun('ab', 'a').fills.at(-1)).toMatchObject({ tag: 'D', win: [1, 1] });
  });

  it('walks back to replace k→s, replace e→i, insert g', () => {
    expect(run.script.map(formatEdit)).toEqual(['replace k→s', 'replace e→i', 'insert g']);
    expect(run.trace.filter((s) => s.mark).map((s) => s.note)).toEqual([
      'insert g',
      'replace e→i',
      'replace k→s',
    ]);
    expect(run.trace[0]?.caption).toBe('insert g, go ←');
    expect(run.trace[1]?.caption).toBe('n = n → keep, go ↖');
    expect(run.trace.at(-1)).toMatchObject({ r: 0, c: 0, caption: 'done — 3 edits' });
    expect(applyEdits('kitten', run.ops)).toBe('sitting');
  });

  it('horse → ros is 3; base-row inserts and base-column deletes', () => {
    expect(editRun('horse', 'ros').distance).toBe(3);
    const ins = editRun('', 'ab');
    expect(ins.script.map(formatEdit)).toEqual(['insert a', 'insert b']);
    const del = editRun('ab', '');
    expect(del.script.map(formatEdit)).toEqual(['delete a', 'delete b']);
    expect(del.trace[0]?.caption).toBe('delete b, go ↑');
    expect(editRun('a', 'ab').trace.at(-1)?.caption).toBe('done — 1 edit');
    const same = editRun('abc', 'abc');
    expect(same.script).toEqual([]);
    expect(same.trace.at(-1)?.caption).toBe('done — already equal, 0 edits');
  });

  it('formats and applies every op kind', () => {
    expect(formatEdit({ op: 'keep', a: 'x' })).toBe('keep x');
    expect(formatEdit({ op: 'delete', a: 'x' })).toBe('delete x');
    expect(applyEdits('abc', [{ op: 'keep', a: 'a' }])).toBe('abc');
    expect(applyEdits('', [{ op: 'keep', a: 'a' }])).toBe('');
  });

  it('property: distance equals a reference and the script turns a into b', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[abc]{0,7}$/), fc.stringMatching(/^[abc]{0,7}$/), (a, b) => {
        const r = editRun(a, b);
        expect(r.distance).toBe(lev(a, b));
        expect(r.script).toHaveLength(r.distance);
        expect(applyEdits(a, r.ops)).toBe(b);
      }),
    );
  });
});

describe('0/1 knapsack table', () => {
  const run = knapsackRun(KNAPSACK_ITEMS, KNAPSACK_CAPACITY);

  it('matches the napkin worked table: $7 with {B, D}', () => {
    expect(run.table).toEqual([
      [0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1],
      [0, 1, 1, 4, 5, 5],
      [0, 1, 1, 4, 5, 6],
      [0, 1, 3, 4, 5, 7],
    ]);
    expect(run.value).toBe(7);
    expect(run.chosen).toEqual([1, 3]);
    expect(run.weight).toBe(5);
    expect(run.fills).toHaveLength(24);
  });

  it('explains take and skip cells', () => {
    const at = (r: number, c: number) => run.fills.find((f) => f.r === r && f.c === c);
    expect(at(2, 4)?.caption).toBe('dp[2][4] B, c=4: skip 1 · take 1 + 4 = 5 → take 5');
    expect(at(2, 4)).toMatchObject({
      tag: '+',
      win: [1, 1],
      from: [
        [1, 4],
        [1, 1],
      ],
    });
    expect(at(2, 2)?.caption).toBe("dp[2][2] B, c=2: 3 kg doesn't fit → skip 1");
    expect(at(4, 5)).toMatchObject({ v: 7, tag: '+' });
    expect(at(3, 4)).toMatchObject({ v: 5, tag: '', win: [2, 4] }); // tie → skip
  });

  it('walks back like the napkin', () => {
    expect(run.trace.map((s) => s.caption)).toEqual([
      '7 ≠ 6 → take D, c = 5 − 2 = 3',
      '4 = 4 → skip C',
      '4 ≠ 1 → take B, c = 3 − 3 = 0',
      '0 = 0 → skip A',
      'bag = {B, D}: 5 kg, $7',
    ]);
  });

  it('empty item list and zero capacity', () => {
    const none = knapsackRun([], 5);
    expect(none.value).toBe(0);
    expect(none.trace.at(-1)?.caption).toBe('bag is empty — nothing fits');
    expect(knapsackRun(KNAPSACK_ITEMS, 0).value).toBe(0);
    expect(knapsackRun(KNAPSACK_ITEMS, -2).cols).toBe(1);
  });

  it('greedy by $/kg: same at 5, worse at 4 and 7', () => {
    expect(greedyByRatio(KNAPSACK_ITEMS, 5)).toEqual({ chosen: [3, 1], value: 7, weight: 5 });
    expect(greedyByRatio(KNAPSACK_ITEMS, 4).value).toBe(4);
    expect(knapsackRun(KNAPSACK_ITEMS, 4).value).toBe(5);
    expect(greedyByRatio(KNAPSACK_ITEMS, 7).value).toBe(8);
    expect(knapsackRun(KNAPSACK_ITEMS, 7).value).toBe(9);
    const tie: KnapItem[] = [
      { name: 'x', w: 2, v: 2 },
      { name: 'y', w: 1, v: 1 },
    ];
    expect(greedyByRatio(tie, 2).chosen).toEqual([0]);
  });

  it('property: DP equals brute force, chosen fits, greedy never beats DP', () => {
    const item = fc.record({
      name: fc.constant('i'),
      w: fc.integer({ min: 1, max: 6 }),
      v: fc.integer({ min: 0, max: 9 }),
    });
    fc.assert(
      fc.property(fc.array(item, { maxLength: 6 }), fc.integer({ min: 0, max: 10 }), (items, cap) => {
        let best = 0;
        for (let mask = 0; mask < 1 << items.length; mask++) {
          let w = 0;
          let v = 0;
          items.forEach((it, k) => {
            if (mask & (1 << k)) {
              w += it.w;
              v += it.v;
            }
          });
          if (w <= cap) best = Math.max(best, v);
        }
        const r = knapsackRun(items, cap);
        expect(r.value).toBe(best);
        expect(r.weight).toBeLessThanOrEqual(cap);
        expect(r.chosen.reduce((s, k) => s + (items[k]?.v ?? 0), 0)).toBe(best);
        const g = greedyByRatio(items, cap);
        expect(g.value).toBeLessThanOrEqual(best);
        expect(g.weight).toBeLessThanOrEqual(cap);
      }),
    );
  });
});

describe('dpView frames', () => {
  const run = lcsRun('AB', 'B');

  it('frame 0, fills, traceback, clamping', () => {
    expect(dpFrameCount(run)).toBe(1 + 2 + run.trace.length);
    const v0 = dpView(run, 0);
    expect(v0).toMatchObject({ filled: 0, fill: null, step: null, caption: 'ready', done: false });
    expect(shown(run, v0, 0, 1)).toBe(true);
    expect(shown(run, v0, 1, 1)).toBe(false);
    const v1 = dpView(run, 1);
    expect(v1.fill?.r).toBe(1);
    expect(shown(run, v1, 1, 1)).toBe(true);
    expect(shown(run, v1, 2, 1)).toBe(false);
    const v3 = dpView(run, 3);
    expect(v3.step).toEqual(run.trace[0]);
    expect(v3.path).toEqual([[2, 1]]);
    expect(v3.done).toBe(false);
    const end = dpView(run, 99);
    expect(end.done).toBe(true);
    expect(end.steps).toHaveLength(run.trace.length);
    expect(dpView(run, -5).filled).toBe(0);
    expect(shown(run, end, 9, 9)).toBe(true);
  });
});
