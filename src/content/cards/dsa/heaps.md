---
title: Heaps and Priority Queues
track: dsa
tags: [heaps, priority-queue, trees, top-k]
difficulty: 2
minutes: 4
tldr: "A heap is a complete binary tree packed into an array, where every parent is ≤ its children. The minimum is always at index 0, and push and pop each fix the order along one path in O(log n)."
analogy: "A hospital emergency room: patients are not seen in arrival order, and nobody sorts the whole waiting room. Staff only need to know who is most urgent right now, and a new arrival just has to be compared along a short chain."
diagram: heaps
story:
  - title: A tree with no pointers
    text: "Fill a binary tree level by level, left to right, with no gaps: a complete tree. Then it fits in an array with no pointers. The children of index i are at 2i+1 and 2i+2, and its parent is at (i−1)//2. Node 4 at index 1 has children 9 and 7 at indices 3 and 4."
  - title: "The heap property"
    text: "In a min-heap, every parent is ≤ its children. So the smallest item, 2, must be at the root, index 0, and peeking at it is O(1). The array is not sorted: 9 sits at index 3, before 7, 8 and 5. A heap keeps just enough order to find the minimum fast."
  - title: "Push 1: append at the end"
    text: "A new item goes in the next free slot, index 7. The tree stays complete, but 1 now sits under 9, which breaks the heap property. Only the path from the new slot up to the root can be wrong."
  - title: "Sift up"
    text: "While the new item is smaller than its parent, swap them: 1 swaps with 9, then 4, then 2, and reaches the root. That is 3 swaps for 3 levels. The array becomes [1, 2, 3, 4, 7, 8, 5, 9]. A push costs at most the height: O(log n)."
  - title: "Pop: last to the root, sift down"
    text: "Starting again from the original heap, pop removes the root 2. The last item, 5, moves into the root slot, then sinks: it swaps with its smaller child 3, and stops because its new child 8 is bigger. Result: [3, 4, 5, 9, 7, 8]. Also O(log n)."
keyIdeas:
  - "**Complete tree in an array**: children of i at **2i+1, 2i+2**, parent at **(i−1)//2**. No pointers, cache-friendly."
  - "**Heap property**: parent ≤ children (min-heap) or ≥ (max-heap). The root is the min (or max); the rest is only partly ordered."
  - "**push = append + sift up**, **pop = move last to root + sift down**: both O(log n). Peek is O(1)."
  - "**Heapify** builds a heap from n items in **O(n)**, not O(n log n), by sifting down from the last parent backwards."
  - "**Top k largest**: keep a **min-heap of size k**; its root is the k-th largest so far. O(n log k) time, O(k) space."
quiz:
  - q: "In a heap stored in an array (0-based), where are the children of index 5?"
    options: ["Indices 10 and 11", "Indices 11 and 12", "Indices 6 and 7", "Index 2"]
    answer: 1
    why: "Children are at 2i+1 and 2i+2: 2·5+1 = 11 and 2·5+2 = 12. Index 2 is its parent, (5−1)//2."
  - q: "You need the 100 largest values from a stream of 10 million numbers. Which is best?"
    options: ["Sort everything: O(n log n)", "A max-heap of all n items, pop 100 times", "A min-heap of size 100, replacing its root when a bigger value arrives", "A hash set"]
    answer: 2
    why: "The size-100 min-heap holds the best 100 so far, and its root is the weakest of them, so each new value needs one comparison and, if it wins, one O(log 100) replacement. Memory stays at 100 items."
  - q: "Why does building a heap with heapify take O(n) and not O(n log n)?"
    options: ["It skips the leaves and most nodes are near the bottom, where sifting down is short", "It uses a hash table", "Because the input must already be sorted", "It doesn't; heapify is O(n log n)"]
    answer: 0
    why: "Half the nodes are leaves and need no work, a quarter sift down at most 1 level, an eighth at most 2, and so on. The sum n/4·1 + n/8·2 + n/16·3 + … stays below n."
  - q: "What is the value at index 0 of a min-heap?"
    options: ["The most recently pushed item", "The smallest item", "The median", "The first item that was pushed"]
    answer: 1
    why: "Every parent is ≤ its children, so following parents up from any node never increases the value. The root is therefore ≤ every item."
bigO:
  - { op: "peek (min or max)", avg: "O(1)" }
  - { op: "push / pop", avg: "O(log n)", note: "one root-to-leaf path" }
  - { op: "heapify n items", avg: "O(n)" }
  - { op: "search for an arbitrary value", avg: "O(n)", note: "a heap is not a search tree" }
  - { op: "top k of n", avg: "O(n log k)", note: "size-k min-heap" }
  - { op: "heapsort", avg: "O(n log n)", note: "in place, not stable" }
related: [dsa/trees-and-traversals, dsa/dijkstra, dsa/sorting-overview, dsa/greedy-algorithms]
prereqs: [dsa/trees-and-traversals]
flashcards:
  - kind: qa
    q: "How do push and pop work on a binary heap?"
    a: "Push: append at the end, then swap with the parent while smaller (sift up). Pop: take the root, move the last item into the root, then swap with the smaller child while bigger (sift down). Both O(log n)."
  - kind: cloze
    text: "To find the k largest of n items, keep a {{min-heap}} of size k: total time {{O(n log k)}}."
  - kind: qa
    q: "Python's heapq is a min-heap. How do you get a max-heap?"
    a: "Push negated values (-x) and negate again when popping, or push tuples whose first field is the negated priority."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Binary heaps (BinaryHeap), redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What problem it solves

Many programs repeatedly need "the most important item right now": the next task by priority, the closest unvisited city in a shortest-path search, the earliest timer to fire. That is a **priority queue**: insert items with priorities and repeatedly remove the one with the smallest (or largest) priority.

Two obvious designs are each half fast. An unsorted list inserts in O(1) but needs an O(n) scan to find the minimum. A sorted list finds the minimum in O(1) but inserts in O(n). A **binary heap** does both in O(log n), and it fits in a plain array.

## How it works

**Shape: a complete binary tree.** Every level is full except possibly the last, which is filled from the left. Number the nodes level by level, left to right, starting at 0, and the tree packs into an array with no gaps and no pointers. The node at index i has its **left child at 2i+1**, its **right child at 2i+2**, and its **parent at (i−1)//2** (integer division). A complete tree with n nodes has height ⌊log₂ n⌋, so every root-to-leaf path is short.

**Order: the heap property.** In a **min-heap**, every node's value is ≤ its children's values. Following parents upward, values never increase, so the root holds the minimum. A **max-heap** flips the comparison. Nothing is promised about siblings or cousins: the array is only partly sorted, which is exactly why it is cheap to maintain.

**Push (sift up).** Append the new item at index n, the only place that keeps the tree complete. The heap property can now fail only between the new item and its ancestors. Compare it with its parent; if it is smaller, swap and repeat from the parent's index. It stops at the root or when its parent is smaller or equal. At most one swap per level: O(log n).

**Pop (sift down).** The minimum is at index 0. Remove the *last* item (keeping the tree complete) and put it in the root slot. It is probably too big for the root, so compare it with its children and swap with the **smaller** child, which is the only one that can legally become the parent of the other. Repeat until both children are bigger, or it reaches a leaf. Again O(log n).

**Heapify (build a heap in O(n)).** Given n items in any order, call sift-down on every non-leaf, from index n//2 − 1 back to 0. Leaves (half the array) are already one-element heaps. A node h levels above the bottom sifts down at most h steps, and there are only about n/2^(h+1) such nodes. The total, n·(1/4 + 2/8 + 3/16 + …), is less than n. Pushing the items one by one would cost O(n log n).

## Worked example

Start from the min-heap `[2, 4, 3, 9, 7, 8, 5]`.

**Push 1.** Append at index 7: `[2, 4, 3, 9, 7, 8, 5, 1]`. The parent of 7 is index 3 (value 9): 1 < 9, swap. The parent of 3 is index 1 (value 4): swap. The parent of 1 is index 0 (value 2): swap. Result: `[1, 2, 3, 4, 7, 8, 5, 9]`, three swaps for three levels.

**Pop from the original heap.** Return 2. Move the last item, 5, to index 0: `[5, 4, 3, 9, 7, 8]`. Its children are 4 and 3; the smaller is 3 at index 2, and 5 > 3, so swap: `[3, 4, 5, 9, 7, 8]`. Index 2's children would be at 5 and 6; only index 5 exists, holding 8, and 5 < 8, so stop.

**Heapify `[9, 7, 8, 5, 2, 4, 3]`.** The last parent is index 7//2 − 1 = 2.

| Sift down at | Swaps | Array afterwards |
|---|---|---|
| index 2 (8) | 8 ↔ 3 | [9, 7, 3, 5, 2, 4, 8] |
| index 1 (7) | 7 ↔ 2 | [9, 2, 3, 5, 7, 4, 8] |
| index 0 (9) | 9 ↔ 2, then 9 ↔ 5 | [2, 5, 3, 9, 7, 4, 8] |

**Top 3 of `[5, 1, 9, 3, 7, 6, 8]`.** Fill a min-heap with the first three: {1, 5, 9}. 3 beats the root 1, so replace: {3, 5, 9}. 7 beats 3: {5, 7, 9}. 6 beats 5: {6, 7, 9}. 8 beats 6: {7, 8, 9}. The answer is 9, 8, 7, and the root, 7, is the 3rd largest.

## In code

```python
import heapq

def push(h, x):                      # O(log n)
    h.append(x)                      # next free slot keeps the tree complete
    i = len(h) - 1
    while i > 0 and h[(i - 1) // 2] > h[i]:    # smaller than parent: swap up
        p = (i - 1) // 2
        h[i], h[p] = h[p], h[i]
        i = p

def sift_down(h, i, n):
    while True:
        small, l, r = i, 2 * i + 1, 2 * i + 2
        if l < n and h[l] < h[small]: small = l
        if r < n and h[r] < h[small]: small = r
        if small == i: return        # both children are bigger (or absent)
        h[i], h[small] = h[small], h[i]
        i = small

def pop(h):                          # O(log n); assumes h is not empty
    top, last = h[0], h.pop()        # take the last item off the end
    if h:
        h[0] = last                  # move it to the root, then let it sink
        sift_down(h, 0, len(h))
    return top

def heapify(h):                      # O(n): sift down every non-leaf, bottom up
    for i in range(len(h) // 2 - 1, -1, -1):
        sift_down(h, i, len(h))

def top_k(nums, k):                  # k largest in O(n log k)
    heap = []                        # min-heap of the best k seen so far
    for x in nums:
        if len(heap) < k: heapq.heappush(heap, x)
        elif x > heap[0]: heapq.heapreplace(heap, x)   # evict the smallest
    return sorted(heap, reverse=True)

h = [2, 4, 3, 9, 7, 8, 5]; push(h, 1); print(h)        # [1, 2, 3, 4, 7, 8, 5, 9]
h = [2, 4, 3, 9, 7, 8, 5]; print(pop(h), h)            # 2 [3, 4, 5, 9, 7, 8]
a = [9, 7, 8, 5, 2, 4, 3]; heapify(a); print(a)        # [2, 5, 3, 9, 7, 4, 8]
print(top_k([5, 1, 9, 3, 7, 6, 8], 3))                 # [9, 8, 7]
```

In practice use Python's **`heapq`** module, which works on a plain list: `heappush`, `heappop`, `heapify`, `heapreplace` (pop then push, in one sift), and `nsmallest` / `nlargest`. It is a min-heap only.

```python
tasks = []
heapq.heappush(tasks, (2, "write docs"))
heapq.heappush(tasks, (1, "fix bug"))       # tuples compare by priority first
print(heapq.heappop(tasks))                 # (1, 'fix bug')
max_heap = [-x for x in [5, 1, 9]]; heapq.heapify(max_heap)
print(-max_heap[0])                         # 9: negate for a max-heap
```

## Heapsort

Build a **max-heap** in place (O(n)). Swap the root, the maximum, with the last item, shrink the heap by one so that item is now "sorted", and sift the new root down. Repeat n − 1 times. That is **O(n log n)** in the worst case with O(1) extra space. It is **not stable**, and its jumps around the array are cache-unfriendly, so in practice quicksort and merge-sort variants usually win; heapsort is the fallback inside introsort that guarantees O(n log n).

## Edge cases and pitfalls

- **Pop or peek on an empty heap** raises `IndexError` in Python; check first.
- **Ties in tuples**: `(priority, item)` falls back to comparing `item` when priorities tie, which crashes if items are not comparable (dicts, custom objects). Add a counter: `(priority, count, item)`.
- **No decrease-key in `heapq`**: to change a priority (as in Dijkstra), push a new entry and skip outdated ones when they are popped. This is called *lazy deletion*.
- **A heap is not sorted.** Iterating over the list does not give sorted order, and finding an arbitrary value is O(n).
- **Top-k direction** is the classic slip: for the k *largest*, use a *min*-heap (so the weakest of the winners is on top and easy to evict), and vice versa.

## In the interview

Heaps appear as "k-th largest element", "top k frequent words", "merge k sorted lists" (a heap of the k list heads, O(n log k)), "median of a data stream" (a max-heap for the lower half and a min-heap for the upper half, kept within one item of each other in size), task scheduling, and inside Dijkstra's and Prim's algorithms. State the costs precisely: O(1) peek, O(log n) push and pop, O(n) heapify. If asked "why not just sort?", answer that sorting costs O(n log n) once, but a heap stays cheap while items keep arriving.
