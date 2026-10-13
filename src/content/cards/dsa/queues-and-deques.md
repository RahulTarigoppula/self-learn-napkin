---
title: Queues and Deques
track: dsa
tags: [queues, fifo, arrays]
difficulty: 1
minutes: 5
tldr: "A queue serves items in arrival order (FIFO). A ring buffer gives O(1) enqueue and dequeue with two wrapping indices; a deque adds O(1) pushes and pops at both ends."
analogy: "A queue is the line at a coffee shop: you join at the back and are served from the front. A deque is a train where carriages can be coupled or uncoupled at either end."
diagram: queues-and-deques
story:
  - title: First in, first out
    text: "A queue is a waiting line: new items join at the back (enqueue) and leave from the front (dequeue), so they come out in the order they went in — first in, first out, FIFO. Print jobs, task schedulers and breadth-first search all need exactly this order."
  - title: An array of six used as a ring
    text: "The naive array version is slow: removing the front item shifts every other item one slot left, O(n). Instead, keep two indices into a fixed array of 6 slots: h points at the front item, t at the next free slot. After enqueueing A, B, C: h = 0, t = 3."
  - title: "Dequeue: only the head moves"
    text: "Dequeue twice: return the item at h, then advance h. A and B come out and h = 2. Nothing is shifted — the items stay where they are and the front simply moves along the array. Enqueue and dequeue are both O(1)."
  - title: Enqueue past the end wraps around
    text: "Enqueue D, E, F into slots 3, 4 and 5. t would become 6, which is off the end, so it wraps: t = (5 + 1) mod 6 = 0. G then goes into slot 0, freed earlier by A. The front is still h = 2, so the queue reads C, D, E, F, G. The array behaves like a ring."
  - title: "A deque: both ends"
    text: "A deque (double-ended queue, pronounced 'deck') allows pushes and pops at both the front and the back, each in O(1). Most languages ship one (Python's collections.deque, Java's ArrayDeque, C++'s std::deque). Use it instead of removing from the front of a plain array, which shifts every remaining element."
keyIdeas:
  - "**FIFO:** enqueue at the back, dequeue from the front; items leave in arrival order."
  - "A **ring buffer** stores a queue in a fixed array with a head and a tail index that advance with `(i + 1) mod capacity`. Nothing is ever shifted, so both operations are O(1)."
  - "When `head == tail` the buffer is either empty or full — keep a **size counter** (or leave one slot unused) to tell them apart."
  - "Use your library's **deque** (Python's collections.deque, Java's ArrayDeque, C++'s std::deque): O(1) at both ends. Removing from the front of a plain dynamic array is O(n)."
  - "A queue is the engine of **breadth-first search**; a deque also powers the **sliding-window maximum**."
quiz:
  - q: "A ring buffer of capacity 8 has head = 6 and holds 3 items. Which slots hold them, and where is tail?"
    options: ["6, 7, 8; tail = 9", "6, 7, 0; tail = 1", "4, 5, 6; tail = 7", "6, 7, 0; tail = 0"]
    answer: 1
    why: "Items sit at head, head+1, head+2, each taken mod 8: slots 6, 7 and 0. The next free slot is (6 + 3) mod 8 = 1."
  - q: "You remove all n items, one at a time, from the front of a plain dynamic array (such as a Python list or Java ArrayList). What is the total cost?"
    options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"]
    answer: 2
    why: "Each pop(0) shifts every remaining element left: (n−1) + (n−2) + … + 0 ≈ n²/2 moves. With a ring buffer or a deque the same job is O(n)."
  - q: "In a ring buffer without a size counter, head == tail. What do you know?"
    options: ["The buffer is empty", "The buffer is full", "It is either empty or full — you cannot tell", "The indices have overflowed"]
    answer: 2
    why: "Both an empty buffer and one that has just filled every slot leave tail sitting on head. Fix it with a size counter, or by never using the last free slot so that 'full' means (tail + 1) mod cap == head."
  - q: "Sliding-window maximum keeps a deque of indices. Why pop smaller values from the BACK when a new value x arrives?"
    options: ["To keep the deque sorted by index", "They are older and smaller than x, so they can never be the window maximum again", "Deques can only pop from the back", "To keep the window size equal to k"]
    answer: 1
    why: "Any smaller value before x will leave the window before x does, and while both are inside, x beats it. It is useless forever, so it is dropped. That keeps the values decreasing, and the front is the maximum."
bigO:
  - { op: "enqueue / dequeue (ring buffer)", avg: "O(1)" }
  - { op: "deque: push or pop at either end", avg: "O(1)" }
  - { op: "remove/insert at the front of a plain array", avg: "O(n)", note: "shifts every other element" }
  - { op: "index into the middle of a deque", avg: "O(1) to O(n)", note: "O(1) in C++ std::deque, O(n) in Python's deque" }
related: [dsa/stacks, dsa/bfs-and-dfs, dsa/sliding-window, dsa/monotonic-stack]
prereqs: [dsa/arrays-and-pointers]
flashcards:
  - kind: qa
    q: "How does a ring buffer make dequeue O(1) without shifting elements?"
    a: "The front is an index, not a position: dequeue reads buf[head] and sets head = (head + 1) mod capacity. The items never move."
  - kind: cloze
    text: "Dequeuing from the front of a plain array costs {{O(n)}} because every remaining element shifts; a {{ring buffer}} makes it O(1)."
  - kind: qa
    q: "What is a deque, and which operations are O(1)?"
    a: "A double-ended queue: pushing and popping at both the front and the back are O(1). It can serve as a stack, a queue or both at once."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "ArrayQueue and ArrayDeque, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **queue** is a collection with two ends: items are added at the **back** (*enqueue*) and removed from the **front** (*dequeue*). The first item in is the first item out — **FIFO**. It is the opposite of a stack (LIFO), where the newest item leaves first. Use a queue whenever work must be handled **in arrival order**: requests waiting for a server, jobs waiting for a printer, or nodes waiting to be explored in breadth-first search.

### Why a plain array is a trap

Store the queue in an array with the front at index 0, and dequeue becomes "remove index 0" — every other element shifts one slot left, O(n). Python's `list.pop(0)` and Java's `ArrayList.remove(0)` do exactly that. Removing all n items this way costs about n²/2 element moves: 5 billion for 100,000 items.

### The ring buffer

A **ring buffer** (circular buffer) keeps a fixed-size array `buf` of capacity `cap` and three numbers:

- `head` — index of the front item,
- `tail` — index of the next free slot,
- `size` — how many items are stored.

**Enqueue** writes `buf[tail] = x`, then `tail = (tail + 1) mod cap`. **Dequeue** reads `buf[head]`, then `head = (head + 1) mod cap`. The **modulo** (remainder) is what makes the array a ring: stepping past the last slot lands on slot 0. Items never move, so both operations are O(1).

The `size` counter matters. When `head == tail` the buffer is either **empty** (nothing between them) or **full** (tail has gone all the way round and caught up). The counter tells the two apart; the alternative is to declare "full" one slot early, when `(tail + 1) mod cap == head`, wasting a single slot.

A ring buffer with a fixed capacity is what you find in audio drivers, network cards and logging systems — it never allocates. If you need it to grow, allocate a bigger array when it is full and copy the items **in queue order** (from `head`, wrapping around) to the start of the new array; doubling keeps enqueue amortised O(1).

## Worked example

Capacity 6, starting empty.

| Operation | Slots 0–5 | head | tail | size |
|---|---|---|---|---|
| enqueue A, B, C | A B C · · · | 0 | 3 | 3 |
| dequeue → A | · B C · · · | 1 | 3 | 2 |
| dequeue → B | · · C · · · | 2 | 3 | 1 |
| enqueue D, E, F | · · C D E F | 2 | 0 (wrapped) | 4 |
| enqueue G | G · C D E F | 2 | 1 | 5 |

The queue in order is C, D, E, F, G — read from `head` and wrap around. One more enqueue fills slot 1 and makes `tail == head == 2` with `size == 6`: full.

## Deques

A **deque** (double-ended queue, pronounced "deck") supports adding and removing at **both** ends in O(1): push and pop at the back, push and pop at the front. It can act as a stack, a queue, or both at once. Implementations differ underneath: a growable ring buffer (Java's `ArrayDeque`), a doubly linked list of fixed-size blocks (Python's `collections.deque`, where indexing into the middle is O(n)), or an index of blocks (C++'s `std::deque`, which also offers O(1) indexing). Some libraries also offer a bounded deque (Python's `deque(maxlen=k)`, for one) that silently drops the oldest item when full, handy for "the last k events".

### Sliding-window maximum

Given `nums` and a window size `k`, report the maximum of every window. Keep a deque of **indices** whose values **decrease** from front to back:

1. Before pushing index `i` at the back, pop from the back every index whose value is `<= nums[i]`: those values are older *and* not bigger, so they can never be a window maximum again.
2. If the front index has slid out of the window (`front <= i - k`), pop it from the front.
3. The front is now the maximum of the current window.

A trace for `[1, 3, −1, −3, 5, 3, 6, 7]` with k = 3, showing the deque's values front to back:

| i | x | Deque after | Window max |
|---|---|---|---|
| 0 | 1 | 1 | — |
| 1 | 3 | 3 (1 popped) | — |
| 2 | −1 | 3, −1 | 3 |
| 3 | −3 | 3, −1, −3 | 3 |
| 4 | 5 | 5 (−3, −1, 3 popped) | 5 |
| 5 | 3 | 5, 3 | 5 |
| 6 | 6 | 6 (3, 5 popped) | 6 |
| 7 | 7 | 7 (6 popped) | 7 |


Each index enters and leaves the deque at most once, so this is O(n) — the same amortised argument as the monotonic stack, with a second exit at the front.

## Queues and BFS

Breadth-first search explores a graph in rings of increasing distance: start node, then all its neighbours, then all *their* unvisited neighbours. A FIFO queue produces exactly that order, because every node at distance d is enqueued before any node at distance d + 1. Swap the queue for a stack and you get depth-first order instead.

## Implement it in Python

The same ideas work in any language; here is the ring buffer in Python.

```python
class RingQueue:
    def __init__(self, capacity):
        self.buf = [None] * capacity
        self.head = 0        # index of the front item
        self.tail = 0        # index of the next free slot
        self.size = 0        # tells "empty" from "full" when head == tail

    def enqueue(self, x):
        if self.size == len(self.buf):
            raise OverflowError("queue is full")
        self.buf[self.tail] = x
        self.tail = (self.tail + 1) % len(self.buf)   # wrap past the end
        self.size += 1

    def dequeue(self):
        if self.size == 0:
            raise IndexError("queue is empty")
        x = self.buf[self.head]
        self.buf[self.head] = None                    # drop the reference
        self.head = (self.head + 1) % len(self.buf)
        self.size -= 1
        return x

q = RingQueue(6)
for x in "ABC": q.enqueue(x)
print(q.dequeue(), q.dequeue())          # A B
for x in "DEFG": q.enqueue(x)
print(q.buf, q.head, q.tail)             # ['G', None, 'C', 'D', 'E', 'F'] 2 1
```

In everyday Python you would not write this: `collections.deque` already gives O(1) at both ends. It is what the sliding-window maximum uses (`dq[-1]` is the back, `dq[0]` the front):

```python
from collections import deque

def window_max(nums, k):
    dq, out = deque(), []                 # indices; their values decrease front to back
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()                      # beaten by x for as long as both are in the window
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()                  # front index has left the window
        if i >= k - 1:
            out.append(nums[dq[0]])
    return out

print(window_max([1, 3, -1, -3, 5, 3, 6, 7], 3))   # [3, 3, 5, 5, 6, 7]
```

## Edge cases and pitfalls

- **Dequeuing from the front of a plain array in a BFS loop** (Python's `list.pop(0)`, for example) turns an O(V + E) search into a quadratic one on big graphs. Use a real queue or deque.
- **Empty versus full** in a ring buffer: `head == tail` alone cannot distinguish them.
- **Negative modulo**: moving an index *backwards* is `(i - 1) % cap` — fine in Python, where `-1 % 6 == 5`, but in C or Java `-1 % 6 == -1`; write `(i - 1 + cap) % cap`.
- **Thread-safe queues** are a different tool: Python's `queue.Queue` or Java's `BlockingQueue` add locking and a blocking take for producer–consumer code.

## In the interview

You may be asked to "implement a circular queue" (track size, wrap with modulo, handle empty and full), to "implement a queue using two stacks" (push onto an *in* stack; when the *out* stack is empty, pour everything across — each item moves at most twice, amortised O(1)), or to use a deque inside a bigger algorithm such as BFS or the sliding-window maximum. Mention why dequeuing from the front of a plain array is a bug waiting to happen.
