---
title: LRU Cache
track: dsa
tags: [caching, hashing, linked-lists, design]
difficulty: 2
minutes: 4
tldr: "A hash map finds any entry in O(1); a doubly linked list keeps entries in recency order so the least recently used one can be moved or evicted in O(1)."
analogy: "A short stack of papers on your desk: whatever you touch goes on top, and when the stack is too tall you bin the sheet at the bottom. An index card tells you where each sheet is, so you never have to dig."
diagram: lru-cache
story:
  - title: Two structures, one cache
    text: "An LRU (least recently used) cache holds at most a fixed number of entries — here 2. A doubly linked list keeps them in order of use: most recent at the front, next to the sentinel H, least recent at the back, next to T. A hash map takes each key straight to its node in the list."
  - title: put 1, put 2
    text: "put(1, A) creates a node and links it right after H. put(2, B) does the same, so 2 is now in front and 1 has slid towards the back. Every insert is a few pointer changes at the head, plus one map write: O(1)."
  - title: get 1 moves it to the front
    text: "get(1) is a hit: the map gives us node 1 directly, we return A, and because 1 was just used we unlink it and relink it after H. Now 2 is the least recently used entry. No scanning — the node's prev and next pointers make the unlink O(1)."
  - title: put 3 evicts the tail
    text: "put(3, C) finds the cache full. The victim is whatever sits just before T: key 2, the entry untouched for longest. Unlink it, delete key 2 from the map, then insert 3 at the front. The cache now holds 3 and 1."
  - title: Why it is O(1)
    text: "The map's values are pointers to the list nodes, so every operation is one hash lookup plus a constant number of pointer updates. Neither structure could do this alone: the map has no order, and the list cannot find a key without scanning."
keyIdeas:
  - "**Hash map: key → node** gives O(1) lookup; **doubly linked list** gives O(1) move-to-front and remove."
  - "**Front = most recently used, back = least recently used**; evict the node just before the tail sentinel."
  - "**Both get and put count as a use** — a hit or an update moves the node to the front."
  - "**Store the key inside each node**, so that after evicting the tail you can delete it from the map."
  - "**Sentinel head and tail nodes** remove every empty-list and end-of-list special case."
quiz:
  - q: "Capacity 2. Operations: put(1), put(2), get(1), put(3). Which key is evicted?"
    options: ["1", "2", "3", "None — the cache grows"]
    answer: 1
    why: "get(1) made 1 the most recent, leaving 2 as the least recently used. put(3) on a full cache evicts 2."
  - q: "Why does the list need to be doubly linked?"
    options: ["To traverse it backwards when printing", "To unlink a node in O(1) you need its predecessor, and only a prev pointer gives you that", "Singly linked lists cannot hold integers", "To make the hash map faster"]
    answer: 1
    why: "Removing a node means pointing its predecessor at its successor. With a singly linked list you would have to walk from the head to find the predecessor — O(n)."
  - q: "Capacity 2: put(1), put(2), put(1, new value), put(3). Which key is evicted?"
    options: ["1", "2", "3", "Both 1 and 2"]
    answer: 1
    why: "Updating key 1 counts as a use, so 1 moves to the front and 2 becomes least recent. put(3) then evicts 2."
bigO:
  - { op: "get", avg: "O(1)", note: "map lookup + move to front" }
  - { op: "put", avg: "O(1)", note: "map write + link at front (+ evict tail)" }
  - { op: "space", avg: "O(capacity)" }
related: [dsa/hash-tables, sysdesign/caching]
prereqs: [dsa/hash-tables, dsa/linked-lists]
griddle: lru-cache
flashcards:
  - kind: qa
    q: "Which two data structures make an O(1) LRU cache, and what does each contribute?"
    a: "A hash map (key → node) for O(1) lookup, and a doubly linked list in recency order for O(1) move-to-front and eviction from the tail."
  - kind: cloze
    text: "On eviction, the LRU cache removes the node just before the {{tail}} sentinel and deletes its {{key from the map}}."
  - kind: qa
    q: "Why does each list node store its key as well as its value?"
    a: "When the tail node is evicted, you need its key to delete the matching entry from the hash map."
sources:
  - { name: "Tech Interview Handbook", url: "https://github.com/yangshun/tech-interview-handbook", licence: "MIT", note: "Hash table and linked list patterns" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

A **cache** keeps a limited number of recently computed or fetched results so that repeated requests are fast. When it is full and a new entry arrives, something must go. The **least recently used (LRU)** policy evicts the entry that has gone unused for longest, on the bet that recently used data will be used again soon (temporal locality).

The classic interview version: implement `get(key)` and `put(key, value)` for a cache of fixed capacity, **both in O(1) time**.

## Why one structure is not enough

- A **hash map** finds a key in O(1), but has no notion of order, so finding the least recently used key would mean scanning everything: O(n).
- A **list in recency order** knows which entry is oldest, but finding a given key in it is a scan: O(n).
- An array kept in order would make "move to front" O(n) because of shifting.

The trick is to use a map **and** a list together, and to make the map's values *pointers to the list nodes*.

## How it works

Keep a **doubly linked list** where each node holds `key`, `value`, `prev` and `next`. Put two dummy **sentinel** nodes at the ends, `head` and `tail`, so the real nodes always have a neighbour on both sides — this removes all the "is the list empty?" special cases. The node right after `head` is the most recently used; the node right before `tail` is the least recently used.

Keep a **hash map** from key to node.

- **get(key)**: look the key up in the map. Miss → return a sentinel value (−1). Hit → unlink the node (point its neighbours at each other) and relink it right after `head`; return its value.
- **put(key, value)**: if the key exists, update the value and move the node to the front. Otherwise, if the cache is full, take the node before `tail`, unlink it and delete its key from the map; then create a new node, link it after `head`, and add it to the map.

Each operation is one hash lookup and a handful of pointer assignments, so both are O(1).

## Worked example

Capacity 2. List shown from front (most recent) to back (least recent):

| Operation | Result | List after | Map keys |
|---|---|---|---|
| put(1, A) | — | 1 | {1} |
| put(2, B) | — | 2, 1 | {1, 2} |
| get(1) | A (hit) | 1, 2 | {1, 2} |
| put(3, C) | evicts 2 | 3, 1 | {1, 3} |
| get(2) | −1 (miss) | 3, 1 | {1, 3} |
| get(3) | C (hit) | 3, 1 | {1, 3} |

## Implement it in Python

The same design works in any language; here it is in Python, with a dict as the hash map.

```python
class Node:
    def __init__(self, key=None, val=None):
        self.key, self.val, self.prev, self.next = key, val, None, None

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}                                # key -> Node
        self.head, self.tail = Node(), Node()        # sentinels
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _push_front(self, node):                     # insert right after head
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        node = self.map.get(key)
        if node is None:
            return -1
        self._unlink(node)                           # a hit counts as a use
        self._push_front(node)
        return node.val

    def put(self, key, val):
        if self.cap <= 0:
            return
        if key in self.map:                          # update also counts as a use:
            self._unlink(self.map.pop(key))          # drop the old node, re-add below
        elif len(self.map) == self.cap:              # full: evict least recent
            lru = self.tail.prev
            self._unlink(lru)
            del self.map[lru.key]                    # why nodes store their key
        node = Node(key, val)
        self.map[key] = node
        self._push_front(node)

c = LRUCache(2)
c.put(1, "A"); c.put(2, "B"); c.get(1); c.put(3, "C")    # the worked example
print(c.get(2), c.get(3), c.get(1))                     # -1 C A
```

Many standard libraries already combine the two structures: Python's `OrderedDict` (`move_to_end`, `popitem(last=False)`) and Java's `LinkedHashMap` in access order (override `removeEldestEntry`). They are worth mentioning, but interviewers usually want the hand-built version first.

## Edge cases and pitfalls

- **Forgetting to delete from the map** on eviction: the map then points at a node that is no longer in the list, and the size check goes wrong.
- **Not moving on update**: `put` on an existing key must refresh its recency, not just its value.
- **Updating without growing**: an update must not count as a new entry, or you will evict something needlessly.
- **Capacity 0**: with the guard above, nothing is stored; without it, the code would try to evict a sentinel.
- **Concurrency**: a real cache shared by threads needs a lock (or sharded locks) around each operation, because a get also writes (it reorders the list).

## Trade-offs

LRU is a good default because recency predicts reuse for most workloads. It struggles with **scans**: reading a large file once can flush everything useful out of the cache. Alternatives:

- **LFU** (least frequently used) keeps popular items through scans, but needs frequency counts and is slow to forget items that were popular long ago.
- **Approximate LRU**: real systems often avoid exact bookkeeping. Redis evicts the oldest of a small random sample of keys; operating systems use the CLOCK algorithm, a single "recently used" bit per page.
- **TTL** (time to live) expiry bounds staleness rather than size, and is often combined with LRU.

## In the interview

Start by saying why neither structure works alone, then draw the map pointing into the list. Name the sentinels, walk through the capacity-2 example above, and state "O(1) for get and put, O(capacity) space". Expect follow-ups: make it thread-safe, add TTL expiry, or switch the policy to LFU (which needs a second ordering by frequency).
