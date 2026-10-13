import { useState } from 'preact/hooks';
import { LRU_GOLDEN_OPS, type LruOp } from '../../../engine/viz/systems';
import { Icon } from '../../ui/Icon';
import { Shell, Stepper } from '../player';

interface Entry {
  k: number;
  v: number;
}
interface LastOp {
  text: string;
  kind: 'hit' | 'miss' | 'put' | 'evict';
}

/** Interactive LRU: the list is most-recent first; the tail is the next victim. */
export default function LruGriddle() {
  const [cap, setCap] = useState(2);
  const [list, setList] = useState<Entry[]>([]);
  const [last, setLast] = useState<LastOp | null>(null);
  const [replay, setReplay] = useState(0);

  const apply = (op: LruOp, cur: Entry[], capacity: number): { next: Entry[]; last: LastOp } => {
    if (op.op === 'get') {
      const hit = cur.find((e) => e.k === op.key);
      if (!hit) return { next: cur, last: { text: `get(${op.key}) → -1 (miss)`, kind: 'miss' } };
      return {
        next: [hit, ...cur.filter((e) => e.k !== op.key)],
        last: { text: `get(${op.key}) → ${hit.v} (hit, moved to front)`, kind: 'hit' },
      };
    }
    const without = cur.filter((e) => e.k !== op.key);
    let evicted: Entry | undefined;
    if (without.length === cur.length && cur.length >= capacity) evicted = without.pop();
    return {
      next: [{ k: op.key, v: op.value }, ...without],
      last: evicted
        ? { text: `put(${op.key}, ${op.value}) → evict ${evicted.k} (least recently used)`, kind: 'evict' }
        : { text: `put(${op.key}, ${op.value})`, kind: 'put' },
    };
  };

  const run = (op: LruOp) => {
    const r = apply(op, list, cap);
    setList(r.next);
    setLast(r.last);
  };

  const playClassic = () => {
    setCap(2);
    let cur: Entry[] = [];
    setList([]);
    LRU_GOLDEN_OPS.forEach((op, i) => {
      setTimeout(
        () => {
          const r = apply(op, cur, 2);
          cur = r.next;
          setList(r.next);
          setLast(r.last);
          setReplay(i + 1);
        },
        700 * (i + 1),
      );
    });
  };

  return (
    <Shell
      title="Drive an LRU cache"
      hint="get() moves a key to the front; put() inserts at the front and, when full, evicts from the back. Both are O(1) with a hash map pointing into a doubly linked list."
    >
      <div class="gd__stage paper lru">
        <div class="lru__ends">
          <span>most recent</span>
          <span>least recent → evicted next</span>
        </div>
        <ol class="lru__list" aria-label="Cache contents, most recent first">
          {list.length === 0 && <li class="lru__empty">empty</li>}
          {list.map((e, i) => (
            <li
              key={e.k}
              class={`lru__node${i === 0 && last && last.kind !== 'miss' ? ' is-new' : ''}${i === list.length - 1 && list.length >= cap ? ' is-tail' : ''}`}
            >
              <span class="lru__k mono">key {e.k}</span>
              <span class="lru__v mono">= {e.v}</span>
            </li>
          ))}
          {Array.from({ length: Math.max(0, cap - list.length) }, (_, i) => (
            <li key={`free${i}`} class="lru__free" aria-hidden="true" />
          ))}
        </ol>
      </div>
      <p class={`gd__caption mono lru__last lru__last--${last?.kind ?? 'none'}`} aria-live="polite">
        {last ? last.text : 'Press a get or put button.'}
      </p>
      <div class="gd__row">
        <span class="eyebrow">get</span>
        {[1, 2, 3, 4].map((k) => (
          <button key={`g${k}`} type="button" class="btn" onClick={() => run({ op: 'get', key: k })}>
            get({k})
          </button>
        ))}
      </div>
      <div class="gd__row">
        <span class="eyebrow">put</span>
        {[1, 2, 3, 4].map((k) => (
          <button
            key={`p${k}`}
            type="button"
            class="btn"
            onClick={() => run({ op: 'put', key: k, value: k * 10 })}
          >
            put({k}, {k * 10})
          </button>
        ))}
      </div>
      <div class="gd__row">
        <Stepper
          label="capacity"
          value={cap}
          min={1}
          max={4}
          onChange={(v) => {
            setCap(v);
            setList((l) => l.slice(0, v));
          }}
        />
        <button type="button" class="btn btn--ghost" onClick={playClassic}>
          <Icon name="play" size={15} /> Play the classic sequence{' '}
          {replay > 0 && replay < LRU_GOLDEN_OPS.length ? `(${replay}/9)` : ''}
        </button>
        <button
          type="button"
          class="btn btn--ghost"
          onClick={() => {
            setList([]);
            setLast(null);
          }}
        >
          Clear
        </button>
      </div>
    </Shell>
  );
}
