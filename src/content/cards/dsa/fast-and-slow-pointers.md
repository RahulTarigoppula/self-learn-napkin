---
title: Fast and Slow Pointers
track: dsa
tags: [linked-lists, two-pointers, cycles]
difficulty: 2
minutes: 5
tldr: "Walk two pointers through a sequence, one step and two steps at a time. If there is a loop, the fast one must land on the slow one; if not, it falls off the end. O(n) time, O(1) memory."
analogy: "Two runners on a track that may or may not be a closed loop. If it loops, the faster runner eventually comes up behind the slower one and taps her shoulder. If it is a straight road, the fast runner simply reaches the end first."
diagram: fast-and-slow-pointers
story:
  - title: A list whose tail loops back
    text: "Here node 6 points back to node 3, so the list 1→2→3→4→5→6 never ends: a loop that follows next would run forever. We want to detect this without a set of visited nodes, using O(1) extra memory. A tail leading into a loop is often called a rho, after the Greek letter ρ, which has that shape."
  - title: Tortoise 1 step, hare 2 steps
    text: "Start two pointers at head. Each step, slow moves one node and fast moves two. The table traces them: after two steps slow is at 3 and fast is already at 5, inside the loop. If the list had an end, fast would reach null (the end) first, proving there is no loop."
  - title: The gap shrinks by one each step
    text: "Once both are in the loop, think of fast as chasing slow. Each step fast moves 2 and slow 1, so the gap between them shrinks by exactly 1: 2, then 1, then 0. A gap that shrinks by one cannot jump over zero, so they must land on the same node: here node 5, at step 4."
  - title: Find the loop's start
    text: "Now move one pointer back to head and leave the other at the meeting point. Advance both one step at a time. The head pointer goes 1→2→3; the other goes 5→6→3. They meet exactly at 3, the first node of the loop. The same thing happens on any list with a loop."
  - title: "No loop: slow stops in the middle"
    text: "The same pair finds the middle of an ordinary list. On 1→2→3→4→5, fast stops at 5 because nothing follows it, and slow, having gone half as far, is at 3. For an even length this loop returns the second of the two middle nodes."
keyIdeas:
  - "**slow moves 1, fast moves 2.** No loop: fast reaches the end (null). Loop: they meet inside it."
  - "They **must** meet because the gap closes by **exactly one** node per step, so it cannot skip past zero."
  - "**Loop start:** after they meet, restart one pointer at head; step both by 1; they meet at the start of the loop."
  - "**O(n) time, O(1) space.** That is the whole point of the trick; a visited set would need O(n) memory."
  - "Works on any **'next' function**, linked list or not: happy numbers, finding a duplicate in an array of 1..n, pseudo-random sequences."
quiz:
  - q: "Why can't fast jump over slow inside the loop?"
    options: ["Because fast checks every node it passes", "Because the gap between them shrinks by exactly 1 per step, so it hits 0 before it could go negative", "Because the loop length is always even", "It can, which is why we check twice"]
    answer: 1
    why: "Per step fast moves 2 and slow moves 1, so relative to slow, fast moves 1. Measured as 'steps fast is behind slow', the gap goes g, g−1, …, 0. It never skips 0."
  - q: "A list has 3 nodes before the loop and a loop of 5 nodes. After slow and fast meet, one pointer goes back to head and both move 1 step at a time. After how many steps do they meet again?"
    options: ["3", "5", "8", "It depends on where they first met"]
    answer: 0
    why: "They meet at the loop's start, which is μ = 3 steps from head. The pointer at the meeting point also needs 3 steps (plus whole laps) to reach the start, so both arrive after exactly 3 steps."
  - q: "middle() keeps going while fast and fast.next both exist. What does it return for 1→2→3→4?"
    options: ["2", "3", "4", "null"]
    answer: 1
    why: "slow=1,fast=1 → slow=2,fast=3 → slow=3,fast=null (3's next is 4, whose next is null). The loop stops and returns 3, the second of the two middles."
  - q: "What is the extra memory used by Floyd's cycle detection?"
    options: ["O(1)", "O(log n)", "O(n)", "O(λ), the loop length"]
    answer: 0
    why: "Just two pointers, whatever the list's length. A hash set of visited nodes also works in O(n) time, but uses O(n) memory."
bigO:
  - { op: "detect a cycle", avg: "O(n) time", note: "at most μ + λ steps until they meet" }
  - { op: "find the cycle start", avg: "O(n) time" }
  - { op: "middle of a list", avg: "O(n) time" }
  - { op: "extra space", avg: "O(1)", note: "a visited set would be O(n)" }
related: [dsa/linked-lists, dsa/two-pointers, dsa/hash-tables]
prereqs: [dsa/linked-lists]
flashcards:
  - kind: qa
    q: "After slow and fast meet in a cycle, how do you find where the cycle begins?"
    a: "Put one pointer back at head, keep the other at the meeting point, and advance both one step at a time. They meet at the first node of the cycle."
  - kind: cloze
    text: "In Floyd's algorithm the slow pointer moves {{1 step}} and the fast pointer {{2 steps}} per iteration."
  - kind: qa
    q: "Why does resetting one pointer to head find the cycle start?"
    a: "At the meeting point slow has walked k steps where k is a multiple of the loop length λ. Walking μ more steps from there lands on position μ + k, which is the loop start. That is exactly where the head pointer is after μ steps."
sources:
  - { name: "TheAlgorithms", url: "https://github.com/TheAlgorithms", licence: "MIT", note: "Floyd cycle detection, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A singly linked list can contain a **cycle**: some node's `next` points back to an earlier node, so following `next` never reaches the end (null). The easy way to detect one is to remember every node in a hash set and stop when you see a node twice. That is O(n) time, but also O(n) memory. **Floyd's algorithm** (the *tortoise and hare*) does it with two pointers and O(1) memory.

Start `slow` and `fast` at the head. Repeatedly move `slow` one node and `fast` two nodes.

- **No cycle:** `fast` reaches the end (`fast` or `fast.next` is null) and you stop. There is no loop.
- **Cycle:** `fast` enters the loop first and keeps circling. Eventually `slow` enters too, and from then on `fast` is *chasing* `slow` around the same loop.

### Why they must meet

Name two numbers: **μ** (mu), the number of nodes before the loop starts, and **λ** (lambda), the number of nodes in the loop. Once both pointers are in the loop, let the **gap** be how many steps `fast` is behind `slow` along the loop (0 ≤ gap < λ). In one iteration `fast` moves 2 and `slow` moves 1, so the gap shrinks by **exactly 1**. A number that drops by one each time cannot skip zero, so within at most λ − 1 iterations the gap is 0 and they are on the same node. `slow` entered the loop after μ steps, so they meet within μ + λ steps, which is **O(n)**. The speeds 1 and 2 are what make the "exactly 1" argument work: a hare that moved 3 per step would close the gap by 2 and could jump over the tortoise on a loop of even length.

### Finding the start of the loop

When they meet, `slow` has taken k steps and `fast` 2k. Both stand on the same node, so the extra k steps `fast` took must be whole laps of the loop: **k is a multiple of λ**.

Now put a pointer `p` back at head and leave `slow` at the meeting point; move both one step at a time. After μ steps, `p` is at the loop start by definition. In the same μ steps, `slow` reaches position k + μ along the sequence. That is the loop start (position μ) plus k, and k is a whole number of laps. So `slow` is at the loop start too. They cannot meet earlier, because `p` is still on the tail and `slow` never leaves the loop. **The first node where they meet is the start of the loop.**

## Worked example

The list `1→2→3→4→5→6`, with 6 pointing back to 3. So μ = 2 (nodes 1 and 2) and λ = 4 (nodes 3, 4, 5, 6).

| Step | slow | fast | Note |
|---|---|---|---|
| 0 | 1 | 1 | both at head |
| 1 | 2 | 3 | fast is in the loop |
| 2 | 3 | 5 | slow enters the loop; fast is 2 behind it (5→6→3) |
| 3 | 4 | 3 | gap 1 |
| 4 | 5 | 5 | **meet** at 5; k = 4, a multiple of λ = 4 ✓ |

Phase two: `p` starts at 1, `slow` stays at 5. Step 1: `p` = 2, `slow` = 6. Step 2: `p` = 3, `slow` = 3, and **they meet at 3**, the start of the loop, after μ = 2 steps.

## Implement it in Python

In Python, `is` compares node identity and `None` plays the part of null. The last function shows the trick working on numbers instead of nodes.

```python
class Node:
    def __init__(self, val, next=None):
        self.val, self.next = val, next

def has_cycle(head):
    slow = fast = head
    while fast and fast.next:            # fast needs two nodes ahead to jump
        slow = slow.next
        fast = fast.next.next
        if slow is fast:                 # compare identity, not values
            return True
    return False

def cycle_start(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:                 # phase 1: met inside the loop
            p = head
            while p is not slow:         # phase 2: both move 1 step
                p, slow = p.next, slow.next
            return p                     # first node of the loop
    return None                          # fast fell off the end: no loop

def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow                          # second middle for even lengths

def is_happy(n):                         # the same idea on numbers
    def step(x):
        return sum(int(c) ** 2 for c in str(x))
    slow, fast = n, step(n)
    while fast != 1 and slow != fast:
        slow, fast = step(slow), step(step(fast))
    return fast == 1

nodes = [Node(v) for v in range(1, 7)]   # 1→2→3→4→5→6, then 6 → 3
for a, b in zip(nodes, nodes[1:]):
    a.next = b
nodes[-1].next = nodes[2]
print(has_cycle(nodes[0]), cycle_start(nodes[0]).val)   # True 3
print(middle(Node(1, Node(2, Node(3, Node(4))))).val)   # 3
print(is_happy(19), is_happy(2))                       # True False
```

## Beyond linked lists

Floyd's algorithm only needs a function `next(x)` that is applied over and over. If the set of possible values is finite, the sequence *must* eventually repeat. It has the same rho shape, and the same two pointers find the loop.

- **Happy numbers.** Replace a number by the sum of the squares of its digits: 19 → 82 → 68 → 100 → 1, so 19 is happy. 2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 loops forever without reaching 1. `is_happy` above runs slow and fast over this sequence and stops when fast reaches 1 or catches slow.
- **Find the duplicate number.** An array of n + 1 integers, each between 1 and n, must contain a repeated value. Treat `i → nums[i]` as a `next` pointer: the duplicate is a value two indices point to, so it is exactly the start of the cycle. Floyd finds it in O(n) time and O(1) space without modifying the array.
- **Pollard's rho** factoring and checking pseudo-random generators for short periods use the same trick.

## Edge cases and pitfalls

- **Check both `fast` and `fast.next`** before jumping two nodes; checking only `fast.next` crashes on an empty list.
- **Compare node identity, not values** (Python's `is`, reference `==` in Java): two different nodes may hold the same value.
- **A one-node list pointing to itself** is a loop with λ = 1: after one step both pointers are on that node, and phase two returns it immediately. Trace it to be sure your code agrees.
- **Middle of an even-length list.** Looping while `fast` and `fast.next` exist returns the second middle; to get the first, loop while `fast.next` and `fast.next.next` exist.

## In the interview

Typical asks: "Does this list have a cycle?", "Return the node where the cycle begins", "Find the middle of the list" (often a step in *reorder list* or *is palindrome*: split at the middle, reverse the second half, compare), and "find the duplicate without extra space". First mention the hash-set solution and its O(n) memory, then offer Floyd. Interviewers almost always follow up with *why* the pointers meet and *why* resetting to head finds the start, so have the gap argument and the "k is a multiple of λ" argument ready.
