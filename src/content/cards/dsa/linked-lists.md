---
title: Linked Lists
track: dsa
tags: [linked-lists, pointers]
difficulty: 1
minutes: 5
tldr: "Values live in separate nodes chained by pointers. Inserting or deleting next to a node you already hold is O(1); finding a node is an O(n) walk from the head."
analogy: "A treasure hunt: each clue tells you where the next clue is hidden. Adding a clue in the middle only means rewriting one clue, but to reach the tenth clue you must visit the first nine."
diagram: linked-lists
story:
  - title: Nodes joined by next pointers
    text: "A linked list stores each value in its own node, together with a pointer — a reference — to the next node. The list itself is just a pointer to the first node, called head; the last node points to null (nothing). Nodes can live anywhere in memory: only the pointers keep them in order."
  - title: Finding a node means walking
    text: "There is no index arithmetic. To reach the node holding 2 you start at head and follow next pointers one hop at a time. Finding a value, or the k-th node, is O(n) — an array gets a[k] in O(1)."
  - title: Insert after a known node
    text: "Once you hold a reference to node 2, inserting 9 after it takes two pointer writes: 9.next = 2.next, then 2.next = 9. Nothing shifts, so it is O(1) however long the list is. The order matters: overwrite 2.next first and you lose the rest of the list."
  - title: "Reverse: flip one pointer at a time"
    text: "To reverse 1→2→3 in place, walk with two pointers: prev starts at null, curr at head. Each step saves nxt = curr.next, points curr.next back at prev, then moves prev and curr one node forward. After step 1, node 1 points to null and the walk continues at 2."
  - title: prev ends up as the new head
    text: "Step 2 points 2 back at 1; step 3 points 3 back at 2. Now curr is null, the loop stops, and prev — node 3 — is the new head: 3→2→1. Each node was visited once: O(n) time and O(1) extra space, because no node was copied."
keyIdeas:
  - "A node holds a **value and a pointer** to the next node; the list is just a pointer to the **head**."
  - "**Insert or delete next to a node you hold: O(1).** Reaching that node, or searching: **O(n)**."
  - "**Doubly linked** nodes also point back (`prev`), so a node can delete *itself* in O(1) and you can walk both ways."
  - "**Reverse in place** with `prev`, `curr` and a saved `nxt`: flip one pointer per step; `prev` is the new head."
  - "A **dummy (sentinel) head** gives the real first node a predecessor, removing the special case for changing `head`."
quiz:
  - q: "You hold node p and a new node n. Which order inserts n right after p?"
    options: ["p.next = n, then n.next = p.next", "n.next = p.next, then p.next = n", "n.next = p, then p.next = n", "Either order works"]
    answer: 1
    why: "n must grab p's old successor before p.next is overwritten. Doing p.next = n first makes n.next = p.next point n at itself, and the rest of the list is lost."
  - q: "In a singly linked list you have a pointer to node X only. Why is deleting X normally O(n)?"
    options: ["Freeing memory is slow", "You must find X's predecessor to change its next pointer, which means walking from head", "All later nodes must shift left", "It is O(1)"]
    answer: 1
    why: "Deleting X means setting pred.next = X.next, and a singly linked node does not know its predecessor. A doubly linked list stores prev, making it O(1)."
  - q: "What does reverse(head) return for an empty list (head is null)?"
    options: ["It raises an error", "null", "A node holding the value null", "head.next"]
    answer: 1
    why: "curr starts as null, so the loop body never runs and prev, still null, is returned. The empty list reversed is the empty list."
  - q: "Summing an array and summing a linked list are both O(n). Why is the array usually several times faster?"
    options: ["Arrays use fewer comparisons", "Array elements are contiguous, so each cache line fetched brings many next elements; list nodes are scattered and each hop can miss the cache", "Linked lists are O(n log n)", "Compilers only optimise array loops"]
    answer: 1
    why: "Big-O counts steps, not memory stalls. The CPU loads 64-byte cache lines and prefetches sequential data; a pointer chase to a random address can cost ~100 ns from RAM versus ~1 ns from cache."
bigO:
  - { op: "access k-th / search", avg: "O(n)", note: "walk from head" }
  - { op: "insert / delete after a known node", avg: "O(1)" }
  - { op: "insert at head", avg: "O(1)" }
  - { op: "delete a known node", avg: "O(1)", worst: "O(n)", note: "O(1) if doubly linked; singly linked must find the predecessor" }
  - { op: "reverse in place", avg: "O(n) time", note: "O(1) extra space" }
related: [dsa/fast-and-slow-pointers, dsa/lru-cache, dsa/arrays-and-pointers, dsa/stacks]
prereqs: [dsa/arrays-and-pointers]
flashcards:
  - kind: qa
    q: "Reverse a singly linked list in place — what are the three moves in each iteration?"
    a: "nxt = curr.next (save the rest); curr.next = prev (flip); prev = curr, curr = nxt (advance). When curr is null, prev is the new head."
  - kind: cloze
    text: "A {{dummy (sentinel) head}} node gives the first real node a predecessor, so deleting or inserting at the front needs {{no special case}}."
  - kind: qa
    q: "When is a linked list better than an array?"
    a: "When you insert and delete a lot at positions you already hold (front, or next to a known node) and rarely need index access — e.g. LRU caches, free lists, queues."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "SLList and DLList, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **linked list** is a chain of **nodes**. Each node holds a value and a **pointer** to the next node (languages such as Python and Java call it a *reference*). The list as a whole is just a pointer to the first node, the **head**; the last node's `next` is **null** (Python spells it `None`), which marks the end.

Because each node knows only its successor, nodes do not need to sit next to each other in memory. That one fact explains every trade-off:

- **No random access.** An array finds `a[k]` by arithmetic (`base + k × size`). A linked list must start at `head` and follow `k` pointers: O(n) to reach a position or to search for a value.
- **Cheap surgery.** Inserting or deleting next to a node you already hold only rewrites a pointer or two. Nothing shifts, so it is O(1) however long the list is. (An array insert in the middle shifts every later element: O(n).)

The catch hides in "a node you already hold". If you first have to *find* the spot, that search is O(n), and the overall operation is O(n) too. Linked lists shine when the position comes for free: the front of the list, or a node you saved a reference to earlier — which is exactly how an LRU cache uses one.

### Singly and doubly linked

In a **singly linked** list each node has only `next`. To delete node X you must set `pred.next = X.next`, but X does not know its predecessor, so you walk from head to find it — O(n).

A **doubly linked** list gives every node a `prev` pointer as well. Now X can unlink itself in O(1): `X.prev.next = X.next` and `X.next.prev = X.prev`. You can also walk backwards and keep a `tail` pointer for O(1) appends and removals at both ends. The cost is one extra pointer per node and more pointers to keep consistent on every change.

### The dummy (sentinel) head

Many list operations need the node *before* the one you are changing. The first real node has no predecessor, so code fills up with `if node is head:` special cases. A **dummy** node placed in front of the real head fixes this: every real node now has a predecessor, and at the end you return `dummy.next`. Doubly linked lists often use one sentinel at each end (or a single circular sentinel), so no pointer is ever null in the middle of an operation.

## Worked example: reversing 1 → 2 → 3

Keep `prev` (the already-reversed part) and `curr` (the next node to flip). Each step: save `nxt = curr.next`, set `curr.next = prev`, then advance `prev = curr`, `curr = nxt`.

| Step | nxt saved | Pointer flipped | prev | curr | Lists at this moment |
|---|---|---|---|---|---|
| start | — | — | null | 1 | 1→2→3 |
| 1 | 2 | 1.next = null | 1 | 2 | 1→null · 2→3 |
| 2 | 3 | 2.next = 1 | 2 | 3 | 2→1→null · 3 |
| 3 | null | 3.next = 2 | 3 | null | 3→2→1→null |

`curr` is null, so the loop ends and `prev` (node 3) is the new head. Three nodes, three iterations, and only three extra variables however long the list is: O(n) time, O(1) space. The step people forget is saving `nxt` — once `curr.next` is overwritten, the rest of the list is unreachable.

## Implement it in Python

The same idea works in any language; here it is in Python, where null is spelled `None`.

```python
class Node:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next          # 1. save the rest of the list
        curr.next = prev         # 2. flip this node's pointer
        prev, curr = curr, nxt   # 3. advance both pointers
    return prev                  # the old tail is the new head

def remove_all(head, target):
    dummy = Node(None, head)     # sentinel: the real head now has a predecessor
    p = dummy
    while p.next:
        if p.next.val == target:
            p.next = p.next.next # unlink; p stays put to check the new p.next
        else:
            p = p.next
    return dummy.next            # may differ from head if head was removed

def build(values):               # helpers for trying it out
    dummy = tail = Node(None)
    for v in values:
        tail.next = Node(v)
        tail = tail.next
    return dummy.next

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out

print(to_list(reverse(build([1, 2, 3]))))               # [3, 2, 1]
print(to_list(remove_all(build([7, 7, 1, 7, 2]), 7)))   # [1, 2]
```

Without the dummy, `remove_all` would need a separate loop to strip leading 7s and would have to return a possibly different head anyway.

## Why arrays usually win in practice

Big-O treats every step as equal, but the hardware does not. A CPU reads memory in **cache lines** of 64 bytes and prefetches sequential addresses, so scanning an array brings the next several elements in almost for free. Linked-list nodes are scattered across the heap, so each hop can be a **cache miss**: roughly 100 ns to fetch from main memory versus about 1 ns from the L1 cache. Each node also carries one or two pointers of overhead (and in languages like Python or Java, a whole object header). That is why a dynamic array is the default sequence in Python, Java and C++, and linked lists are reserved for jobs that need O(1) splicing at known positions: LRU caches (a hash map pointing into a doubly linked list), free lists in memory allocators, and queues where nodes are handed around rather than searched.

## Edge cases and pitfalls

- **Empty list and single node.** Check every function with an empty list (head is null) and with one node; `reverse` handles both because the loop just runs zero or one time.
- **Losing the rest of the list.** Always save `curr.next` before overwriting it.
- **Forgetting to update `head`.** Deleting or inserting at the front changes the head; return the new head (or use a dummy).
- **Cycles.** A bug or a malicious input can make `next` point backwards, and a "walk until null" loop will never end. Floyd's fast and slow pointers detect that in O(1) space.

## In the interview

Linked-list questions test pointer discipline, not knowledge. Draw boxes and arrows, name your pointers (`prev`, `curr`, `nxt`), and write the pointer updates in the order you drew them. Common asks: reverse a list (iteratively, then recursively), merge two sorted lists (use a dummy head), remove the n-th node from the end (two pointers n apart), find the middle or detect a cycle (fast and slow pointers). Mention the dummy-head trick early — it removes most edge cases.
