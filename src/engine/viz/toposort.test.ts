import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  arrowKey,
  COURSES,
  type Dag,
  EXTRA_ARROWS,
  findCycle,
  inDegrees,
  isTopoOrder,
  kahnFrames,
} from './toposort';

const plus = (...extra: (readonly [string, string])[]): Dag => ({
  nodes: COURSES.nodes,
  arrows: [...COURSES.arrows, ...extra],
});

describe('Kahn on the napkin courses', () => {
  const fr = kahnFrames(COURSES);
  const last = fr.at(-1);

  it('starting in-degrees and queue match the worked example', () => {
    expect(inDegrees(COURSES)).toEqual({ Intro: 0, Math: 0, DS: 2, Algo: 2, DB: 1, ML: 2 });
    expect(fr[0]?.state.queue).toEqual(['Intro', 'Math']);
    expect(fr[0]?.caption).toBe('in-degree 0: Intro, Math → queue');
  });

  it('outputs Intro, Math, DS, Algo, DB, ML — a valid order', () => {
    expect(last?.step).toBe('done');
    expect(last?.state.order).toEqual(['Intro', 'Math', 'DS', 'Algo', 'DB', 'ML']);
    expect(last?.caption).toBe('6 of 6 output — a valid order');
    expect(isTopoOrder(COURSES, last?.state.order ?? [])).toBe(true);
    expect(last?.state.cut).toHaveLength(7);
  });

  it('step captions follow the table: Math drops DS 1→0 and it joins the queue', () => {
    const caps = fr.map((f) => f.caption);
    expect(caps[1]).toBe('pop Intro → output #1');
    expect(caps[2]).toBe('Intro→DS: DS 2→1');
    expect(caps).toContain('Math→DS: DS 1→0 → DS joins the queue');
    expect(caps).toContain('Math→Algo: Algo 2→1');
    const dsFrame = fr.find((f) => f.caption === 'Math→DS: DS 1→0 → DS joins the queue');
    expect(dsFrame?.state.queue).toEqual(['DS']);
    expect(dsFrame?.state.arrow).toEqual(['Math', 'DS']);
    expect(dsFrame?.state.current).toBe('Math');
    // 1 start + 6 pops + 7 cuts + done
    expect(fr).toHaveLength(15);
  });
});

describe('extra arrows', () => {
  it('Intro → Math keeps a DAG and changes the start queue', () => {
    const fr = kahnFrames(plus(['Intro', 'Math']));
    expect(fr[0]?.state.queue).toEqual(['Intro']);
    expect(fr.at(-1)?.step).toBe('done');
  });

  it('ML → DS closes DS → Algo → ML → DS: stuck with 4 left', () => {
    const g = plus(['ML', 'DS']);
    const last = kahnFrames(g).at(-1);
    expect(last?.step).toBe('stuck');
    expect(last?.state.order).toEqual(['Intro', 'Math']);
    expect(last?.caption).toBe('queue empty with 4 left: DS, Algo, DB, ML — cycle!');
    const left = g.nodes.filter((n) => !last?.state.order.includes(n));
    expect(findCycle(g, left).map(arrowKey)).toEqual(['DS→Algo', 'Algo→ML', 'ML→DS']);
  });

  it('DB → Algo alone is fine; with Algo → Math it makes a cycle', () => {
    expect(kahnFrames(plus(['DB', 'Algo'])).at(-1)?.step).toBe('done');
    const g = plus(['DB', 'Algo'], ['Algo', 'Math']);
    const last = kahnFrames(g).at(-1);
    expect(last?.step).toBe('stuck');
    const left = g.nodes.filter((n) => !last?.state.order.includes(n));
    const cyc = findCycle(g, left);
    expect(cyc.length).toBeGreaterThanOrEqual(2);
    // it is a real closed loop made of real arrows
    for (let i = 0; i < cyc.length; i++) expect(cyc[i]?.[1]).toBe(cyc[(i + 1) % cyc.length]?.[0]);
    for (const a of cyc) expect(g.arrows.map(arrowKey)).toContain(arrowKey(a));
  });

  it('all extras listed exist between course nodes', () => {
    for (const [u, v] of EXTRA_ARROWS) {
      expect(COURSES.nodes).toContain(u);
      expect(COURSES.nodes).toContain(v);
    }
  });

  it('a pure cycle starts with an empty queue (napkin X → Y → Z → X)', () => {
    const g: Dag = {
      nodes: ['X', 'Y', 'Z'],
      arrows: [
        ['X', 'Y'],
        ['Y', 'Z'],
        ['Z', 'X'],
      ],
    };
    const fr = kahnFrames(g);
    expect(fr[0]?.caption).toBe('no node has in-degree 0 — the queue starts empty');
    expect(fr).toHaveLength(2);
    expect(fr[1]?.caption).toBe('queue empty with 3 left: X, Y, Z — cycle!');
    expect(findCycle(g, ['X', 'Y', 'Z'])).toHaveLength(3);
  });

  it('a self-loop is a cycle of one', () => {
    const g: Dag = { nodes: ['A'], arrows: [['A', 'A']] };
    expect(kahnFrames(g).at(-1)?.step).toBe('stuck');
    expect(findCycle(g, ['A'])).toEqual([['A', 'A']]);
  });
});

describe('helpers', () => {
  it('isTopoOrder rejects wrong length, repeats and backward arrows', () => {
    expect(isTopoOrder(COURSES, ['Intro'])).toBe(false);
    expect(isTopoOrder(COURSES, ['Intro', 'Intro', 'DS', 'Algo', 'DB', 'ML'])).toBe(false);
    expect(isTopoOrder(COURSES, ['Math', 'Intro', 'DS', 'DB', 'Algo', 'ML'])).toBe(true);
    expect(isTopoOrder(COURSES, ['Intro', 'Math', 'DS', 'ML', 'DB', 'Algo'])).toBe(false);
    expect(isTopoOrder(COURSES, ['Intro', 'Math', 'DS', 'Algo', 'DB', 'Nope'])).toBe(false);
    expect(isTopoOrder(COURSES, ['Nope', 'Math', 'DS', 'Algo', 'DB', 'ML'])).toBe(false);
  });

  it('findCycle: empty leftovers, or no cycle among them', () => {
    expect(findCycle(COURSES, [])).toEqual([]);
    expect(findCycle(COURSES, ['Intro'])).toEqual([]);
  });

  it('inDegrees counts arrows into unknown nodes too', () => {
    expect(inDegrees({ nodes: ['A'], arrows: [['A', 'B']] })).toEqual({ A: 0, B: 1 });
  });

  it('property: Kahn outputs a valid order exactly when it finishes; stuck ⇒ a real cycle', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F'];
    const arrow = fc.tuple(fc.constantFrom(...names), fc.constantFrom(...names));
    fc.assert(
      fc.property(fc.uniqueArray(arrow, { maxLength: 10, selector: (a) => a.join() }), (arrows) => {
        const g: Dag = { nodes: names, arrows };
        const last = kahnFrames(g).at(-1);
        if (last?.step === 'done') expect(isTopoOrder(g, last.state.order)).toBe(true);
        else {
          const left = names.filter((n) => !last?.state.order.includes(n));
          const cyc = findCycle(g, left);
          expect(cyc.length).toBeGreaterThan(0);
          for (let i = 0; i < cyc.length; i++) expect(cyc[i]?.[1]).toBe(cyc[(i + 1) % cyc.length]?.[0]);
        }
      }),
      { numRuns: 300 },
    );
  });
});
