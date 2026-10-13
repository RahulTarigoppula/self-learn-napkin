---
title: Monotonic Stack
track: dsa
tags: [stacks, arrays, amortised]
difficulty: 2
minutes: 5
tldr: "Keep a stack whose values only go down (or only up). Each new value pops everything it beats, and each popped item has just found its next greater element. O(n) total."
analogy: "People join a row one at a time from the right, each wanting to know the first taller person to arrive after them. When a tall person arrives, every shorter person still waiting gets their answer at once and stops waiting."
diagram: monotonic-stack
story:
  - title: The next greater element
    text: "For every value in [2, 1, 2, 4, 3], find the first bigger value to its right, or −1 if there is none. Checking to the right of each position separately is O(n²) on a descending array. Picture the values as bars: each bar wants the first taller bar to its right."
  - title: Values going down just wait
    text: "Scan left to right, keeping a stack of values still waiting for an answer. 2 waits. 1 is not bigger than 2, so it waits on top. Values in the stack only go down from bottom to top. That is the 'monotonic' part. Real code stores indices, so it knows where to write each answer."
  - title: A bigger value pops the waiters it beats
    text: "The second 2 arrives. It beats the top, 1, so pop 1 and record its answer: 2. It does not beat the next waiter, because 2 is not greater than 2, so popping stops and the new 2 is pushed. Everything under the top is at least as big as the top, so the first survivor protects all of them."
  - title: One big value can pop several
    text: "4 arrives. It beats the top 2 (pop, answer 4) and then the bottom 2 (pop, answer 4). A single arrival can settle many waiters at once. Then 4 itself goes on the stack to wait for something bigger."
  - title: Leftovers get −1; the pass is O(n)
    text: "3 does not beat 4, so it waits. The input ends with 4 and 3 still on the stack: nothing bigger ever came, so their answers stay −1. Result: [4, 2, 4, −1, −1]. Each index is pushed once and popped at most once, so the whole scan is O(n), even though one step may pop many."
keyIdeas:
  - "A **monotonic stack** keeps its values sorted from bottom to top; before pushing x, pop everything that would break the order."
  - "**Next greater** → keep values decreasing, pop while `top < x`. **Next smaller** → keep them increasing, pop while `top > x`."
  - "The moment an item is popped is the moment its answer is known: **the value that popped it is its next greater element**."
  - "**O(n) amortised:** n pushes and at most n pops in total, however the pops are bunched up."
  - "Store **indices**, not values: you need them to write answers and to measure distances (daily temperatures) or widths (largest rectangle)."
quiz:
  - q: "What is the next-greater-element array for [5, 3, 1, 4]?"
    options: ["[-1, 4, 4, -1]", "[-1, 4, 3, -1]", "[4, 4, 4, -1]", "[-1, -1, 4, -1]"]
    answer: 0
    why: "Nothing to the right of 5 is bigger → −1. For 3 and for 1 the first bigger value to the right is 4. 4 is last → −1. In the scan, 4 pops 1 and then 3, and stops at 5."
  - q: "The inner while-loop can pop many items in one step. Why is the algorithm still O(n)?"
    options: ["The stack never holds more than two items, so each loop is short", "Each index is pushed once and popped at most once, so pops total ≤ n", "Popping costs nothing, since it only moves a pointer", "It is actually O(n log n), since pops are bounded by log n"]
    answer: 1
    why: "Count work per element, not per step: every index enters the stack once and can leave it at most once. Total pushes + pops ≤ 2n, which is amortised O(1) per element."
  - q: "Daily temperatures [30, 40, 35, 50]: how many days until a warmer day, for each day?"
    options: ["[1, 2, 1, 0]", "[1, 1, 1, 0]", "[1, 2, 2, 0]", "[3, 2, 1, 0]"]
    answer: 0
    why: "30 → 40 the next day (1). 40 waits through 35 until 50, two days later (2). 35 → 50 the next day (1). Nothing is warmer than 50 → 0."
  - q: "You need the next SMALLER element to the right. How should the stack be kept?"
    options: ["Decreasing from bottom to top; pop while top < x", "Increasing from bottom to top; pop while top > x", "Sorted by index only; never pop, just scan back", "As a queue instead; pop from the front while front > x"]
    answer: 1
    why: "Mirror the rule: a waiter is answered by the first value smaller than it, so pop while the top is bigger than x. The survivors then increase from bottom to top."
bigO:
  - { op: "next greater element", avg: "O(n) time", note: "each index pushed once, popped ≤ once" }
  - { op: "extra space", avg: "O(n)", worst: "O(n)", note: "a strictly decreasing input never pops" }
  - { op: "brute force", avg: "O(n²)", note: "scan right from every index" }
related: [dsa/stacks, dsa/amortised-analysis, dsa/queues-and-deques, dsa/sliding-window]
prereqs: [dsa/stacks]
flashcards:
  - kind: qa
    q: "In the next-greater-element scan, when exactly does an index get its answer?"
    a: "When it is popped: the value that pops it is the first bigger value to its right. Indices never popped get −1."
  - kind: cloze
    text: "A monotonic stack is O(n) because each index is {{pushed once and popped at most once}}."
  - kind: qa
    q: "Largest rectangle in a histogram: what do you learn when a bar is popped from the increasing stack?"
    a: "Both its boundaries: the bar that popped it is the first lower bar on the right, and the new top of the stack is the first lower bar on the left. Width = right − left − 1."
sources:
  - { name: "Tech Interview Handbook", url: "https://github.com/yangshun/tech-interview-handbook", licence: "MIT", note: "Stack patterns, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: monotonic-stack
---

## How it works

A **monotonic stack** is an ordinary stack with one extra rule: the values in it are always sorted from bottom to top, either *decreasing* or *increasing*. Before pushing a new value `x`, you pop every item that would break that order. The pops are not wasted work: each one answers a question.

Take the **next greater element** problem: for every position, find the first value to its right that is strictly bigger, or −1 if none exists.

Scan the array left to right, and keep on the stack the indices that are **still waiting** for their answer. Two facts make this work:

1. **The waiting values are decreasing from bottom to top.** If a smaller value were sitting *below* a bigger one, the bigger one would have answered it when it arrived. So whenever something is still waiting, everything above it is no bigger than it.
2. **A new value x answers waiters from the top down.** If `x` beats the top, then `x` is the first bigger value to the right of the top (everything between them was smaller, otherwise the top would already be answered). Pop it and record `x`. Repeat. The first waiter `x` does *not* beat stops the loop, and since everything below it is at least as big, nothing deeper can be beaten either.

After processing `x`, push its own index: it now waits for something bigger. When the input ends, whatever is still on the stack never met a bigger value, so its answer is −1.

### Why it is O(n)

The inner `while` loop can pop many items in one step, which looks like O(n²). It is not. Every index is pushed **exactly once** and popped **at most once**, so over the whole run there are at most n pops in total, however unevenly they are spread. That is n pushes + ≤ n pops = O(n) time, or **amortised O(1)** per element. The stack can hold up to n indices (a strictly decreasing input never pops), so the extra space is O(n).

## Worked example

`nums = [2, 1, 2, 4, 3]`; the stack shows values (the code stores their indices).

| i | x | Pops (and the answer recorded) | Stack after | ans |
|---|---|---|---|---|
| 0 | 2 | none | 2 | [−1, −1, −1, −1, −1] |
| 1 | 1 | none (1 < 2 does not beat it) | 2 1 | unchanged |
| 2 | 2 | pop 1 → ans[1] = 2; stop at 2 (not strictly bigger) | 2 2 | [−1, 2, −1, −1, −1] |
| 3 | 4 | pop 2 → ans[2] = 4; pop 2 → ans[0] = 4 | 4 | [4, 2, 4, −1, −1] |
| 4 | 3 | none | 4 3 | unchanged |

Indices 3 and 4 are left on the stack, so their answers stay −1. Final answer: `[4, 2, 4, -1, -1]`. Five pushes and three pops: the work is proportional to n.

## Implement it in Python

The three classic uses, one function each. In Python, `stack[-1]` is the top.

```python
def next_greater(nums):
    ans = [-1] * len(nums)
    stack = []                                # indices; their values decrease upward
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:  # x beats the top waiter
            ans[stack.pop()] = x              # ...so x is its next greater element
        stack.append(i)                       # x now waits for something bigger
    return ans

def daily_temperatures(temps):
    wait = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            wait[j] = i - j                   # days until warmer: a distance, so store indices
        stack.append(i)
    return wait

def largest_rectangle(heights):
    best, stack = 0, []                       # indices; their heights increase upward
    for i, h in enumerate(heights + [0]):     # a final 0 forces every bar to be popped
        while stack and heights[stack[-1]] >= h:
            top = heights[stack.pop()]
            left = stack[-1] if stack else -1 # first lower bar on the left
            best = max(best, top * (i - left - 1))
        stack.append(i)
    return best

print(next_greater([2, 1, 2, 4, 3]))                         # [4, 2, 4, -1, -1]
print(daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))  # [1, 1, 4, 2, 1, 1, 0, 0]
print(largest_rectangle([2, 1, 5, 6, 2, 3]))                 # 10
```

## Daily temperatures

"Given daily temperatures, how many days until a warmer one?" is next-greater-element in disguise: the answer is a **distance**, `i − j`, which is why the stack holds indices. For `[73, 74, 75, 71, 69, 72, 76, 73]`, the 75 on day 2 waits while 71 and 69 pile on top of it; 72 on day 5 pops 69 and 71 but not 75; 76 on day 6 finally pops 72 and then 75, giving 75 an answer of 6 − 2 = 4.

## Largest rectangle in a histogram

Bars of width 1 have heights `[2, 1, 5, 6, 2, 3]`; find the largest rectangle that fits under them. Notice that the best rectangle has the height of its **shortest** bar, and it stretches left and right until it hits a lower bar. So for each bar we need the first lower bar on each side: *next smaller* on the right and *previous smaller* on the left.

An **increasing** stack gives both at once. When bar `i` is lower than the top, the top cannot extend past `i` (its right boundary), and the item under it in the stack is the first lower bar to its left (its left boundary). Width = `i − left − 1`. In the example, the bar of height 2 at index 4 pops 6 (width 1, area 6) and then 5 (left boundary is the 1 at index 1, width 2, area **10**). Appending a sentinel 0 at the end flushes every remaining bar. One pass, O(n).

## Edge cases and pitfalls

- **Strict or not?** "Next greater" means strictly greater, so pop on `<`, not `<=`. With `<=`, an equal value would wrongly answer its twin. On `[2, 1, 2, 4, 3]`, index 0 would get 2 instead of 4.
- **Values instead of indices** works only when you never need positions; most variants do need them.
- **Circular arrays** (the last element's "right" wraps to the start): loop i from 0 to 2n − 1, read `nums[i mod n]`, and only push during the first n steps.
- **Which direction?** Next greater/smaller to the *right*: scan left to right and answer on pop. Previous greater/smaller to the *left*: the answer is whatever is on top right after you finish popping.

## In the interview

The trigger phrases are "next greater", "next warmer", "how many days until", "span", "visible people", and anything about the nearest larger or smaller neighbour. Start by naming the O(n²) brute force, then say: "each element waits on a stack until something beats it; the stack stays decreasing, and each index is pushed and popped at most once, so it is O(n)." Expect the follow-up to be the histogram problem or its 2-D cousin, the maximal rectangle of 1s in a binary matrix (run the histogram on each row).
