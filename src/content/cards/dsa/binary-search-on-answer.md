---
title: Binary Search on the Answer
track: dsa
tags: [binary-search, search, patterns, optimisation]
difficulty: 3
minutes: 5
tldr: "When you can cheaply check \"does value x work?\" and the answer flips from no to yes only once, binary search over the possible answers instead of over an array."
analogy: "Finding the lowest oven temperature that bakes a cake in an hour. You don't try every degree: 200 works, so try 150; that fails, so try 175. Each test halves the range, because hotter never bakes slower."
diagram: binary-search-on-answer
story:
  - title: The problem
    text: "Ship packages weighing [3, 2, 2, 4, 1, 4], in this order, within D = 3 days. Each day the ship carries packages until the next one would exceed its capacity. What is the smallest capacity that gets everything shipped in time?"
  - title: Checking one capacity is easy
    text: "We can't compute the answer directly, but we can test a guess. With capacity 6, load greedily: [3, 2] = 5, then [2, 4] = 6, then [1, 4] = 5. Three days, so 6 works. With capacity 5 it takes four days, so 5 fails. Each check is one O(n) pass."
  - title: Fails, then works, forever after
    text: "The answer lies between 4 (the heaviest package, or it never fits) and 16 (the total, everything in one day). And if a capacity works, every bigger one also works. Checked one by one, the capacities would read ✗ ✗ ✓ ✓ ✓ … with a single switch, though we don't yet know where. That monotone check is all binary search needs."
  - title: Binary search for the first ✓
    text: "Keep lo = 4, hi = 16. Test mid = 10: works, so the answer is 10 or less, hi = 10. mid = 7 works, hi = 7. mid = 5 fails, so the answer is above 5, lo = 6. mid = 6 works, hi = 6. We never test 8, 9 or 11 to 16."
  - title: lo meets hi
    text: "When lo equals hi, only one candidate is left: 6, the first capacity that works. That took 4 checks instead of up to 13. In general it is O(log(range)) checks of O(n) each, so O(n log(sum of weights))."
keyIdeas:
  - "Look for **\"minimum x such that …\"** or **\"maximum x such that …\"** with a feasibility check that is easier than finding x directly."
  - "The check must be **monotone**: once true, it stays true as x grows (or the mirror image). Say why out loud."
  - "Set **lo and hi** so the answer is guaranteed to be in [lo, hi]: e.g. lo = max weight, hi = total weight."
  - "**First-true template:** while lo < hi: mid = ⌊(lo + hi) / 2⌋; if ok(mid) then hi = mid, else lo = mid + 1. Return lo."
  - "Cost: **O(log(hi − lo)) checks × cost of one check**."
quiz:
  - q: "In the ship-capacity problem, why is lo = max(weights) rather than 1?"
    options: ["It only shortens the loop; the answer could still be smaller", "Below the heaviest package, that package can never ship at all", "Binary search needs lo > 0, and max(weights) is a safe positive", "max(weights) is the average weight, so it splits the range evenly"]
    answer: 1
    why: "Packages can't be split. Any capacity smaller than the heaviest package fails for every D, so the answer is at least max(weights). Starting there also keeps the greedy check from looping on an unshippable package."
  - q: "With the first-true template, ok(mid) is True. What should you do?"
    options: ["lo = mid + 1, to look for a larger working value", "hi = mid, keeping mid as a possible answer", "hi = mid − 1, since mid has already been tested", "Return mid at once, since it already works"]
    answer: 1
    why: "mid works, so the first working value is mid or something smaller. hi = mid keeps mid as a candidate; hi = mid − 1 could throw away the answer, and returning early misses smaller working values."
  - q: "You want the LARGEST x with ok(x) True (pattern ✓ ✓ ✓ ✗ ✗) and update lo = mid on success. Which midpoint avoids an infinite loop?"
    options: ["⌊(lo + hi) / 2⌋, rounding down", "⌈(lo + hi) / 2⌉, rounding up", "lo + 1", "Either works"]
    answer: 1
    why: "With lo = 5, hi = 6, rounding down gives mid = 5; if ok(5) is true, lo stays 5 forever. Rounding up gives mid = 6, so every iteration shrinks the range."
  - q: "Koko eats piles [3, 6, 7, 11] at k bananas per hour, finishing at most one pile per hour. How many hours does k = 4 take?"
    options: ["6", "7", "8", "9"]
    answer: 2
    why: "ceil(3/4) + ceil(6/4) + ceil(7/4) + ceil(11/4) = 1 + 2 + 2 + 3 = 8 hours. With h = 8 it works; k = 3 takes 1 + 2 + 3 + 4 = 10 hours, so 4 is the minimum speed."
bigO:
  - { op: "ship within D days", avg: "O(n log S)", note: "S = sum of weights; one O(n) check per probe" }
  - { op: "Koko eating bananas", avg: "O(n log M)", note: "M = largest pile" }
  - { op: "linear scan of every candidate", avg: "O(n · S)", note: "what binary search avoids" }
  - { op: "extra space", avg: "O(1)" }
related: [dsa/binary-search, dsa/greedy-algorithms, dsa/two-pointers, dsa/big-o-basics]
prereqs: [dsa/binary-search]
flashcards:
  - kind: qa
    q: "What property must a problem have for binary search on the answer to work?"
    a: "A monotone feasibility predicate over the answer space: if x works, every larger x works (or every smaller x, for maximisation). Then the answers form one ✗…✗✓…✓ switch."
  - kind: cloze
    text: "First-true template: if ok(mid) set {{hi = mid}}, otherwise set {{lo = mid + 1}}; stop when lo == hi."
  - kind: qa
    q: "What are lo and hi for 'minimum ship capacity to ship weights within D days'?"
    a: "lo = max(weights), the heaviest package must fit; hi = sum(weights), which ships everything in one day. The answer is always within that range."
sources:
  - { name: "Tech Interview Handbook", url: "https://github.com/yangshun/tech-interview-handbook", licence: "MIT", note: "Binary search techniques, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Ordinary binary search looks for a value inside a sorted array. **Binary search on the answer** (also called *parametric search*) searches the **range of possible answers** instead. It applies when:

1. The question asks for the **minimum** (or maximum) value x that satisfies some condition.
2. You can write a **feasibility check** `ok(x)` ("is x good enough?") that is much easier than finding x directly.
3. The check is **monotone**: if `ok(x)` is true then `ok(x + 1)` is true too. Laid out over all candidates, the answers look like `✗ ✗ ✗ ✓ ✓ ✓ ✓`, with exactly one switch.

What you are really hunting for is **the position of the switch**: the first ✓. Binary search finds it in O(log(range)) checks because every check tells you which side of the switch you are on.

### Setting lo and hi

Pick bounds that **guarantee** the answer is inside `[lo, hi]`:

- **Ship capacity:** `lo = max(weights)` (a smaller ship cannot carry the heaviest package at all) and `hi = sum(weights)` (everything in one day, always feasible).
- **Koko eating bananas:** `lo = 1`, `hi = max(piles)` (at that speed every pile takes one hour, the fastest possible).

### The first-true template

```
while lo < hi:
    mid = floor((lo + hi) / 2)
    if ok(mid): hi = mid        # mid works: answer is mid or to its left
    else:       lo = mid + 1    # mid fails: answer is strictly to its right
return lo
```

Three **invariants** make it correct:

- Everything **below lo** is known to fail.
- **hi** is known to work (true at the start because we chose `hi` to be feasible).
- So the first ✓ is always in `[lo, hi]`.

Each iteration keeps these true. Because the midpoint rounds down, `mid < hi`, so both branches strictly shrink the range and the loop ends with `lo == hi`, the first ✓.

For the mirror problem (the **largest** x with `ok(x)` true, pattern `✓ ✓ ✓ ✗ ✗`), use `lo = mid` on success and `hi = mid − 1` on failure, and round the midpoint **up**: `mid = ceil((lo + hi) / 2)`. Otherwise, with `hi = lo + 1`, `mid` equals `lo` and the loop never ends.

## Worked example

Weights `[3, 2, 2, 4, 1, 4]`, `D = 3`. The check loads greedily: keep adding packages to today's load, and start a new day when the next one would exceed the capacity.

| Capacity | Daily loads | Days | ok? |
|---|---|---|---|
| 4 | [3] [2, 2] [4] [1] [4] | 5 | ✗ |
| 5 | [3, 2] [2] [4, 1] [4] | 4 | ✗ |
| 6 | [3, 2] [2, 4] [1, 4] | 3 | ✓ |
| 7 | [3, 2, 2] [4, 1] [4] | 3 | ✓ |

The search, starting at `lo = 4`, `hi = 16`:

| lo | hi | mid | ok(mid) | Update |
|---|---|---|---|---|
| 4 | 16 | 10 | ✓ | hi = 10 |
| 4 | 10 | 7 | ✓ | hi = 7 |
| 4 | 7 | 5 | ✗ | lo = 6 |
| 6 | 7 | 6 | ✓ | hi = 6 |
| 6 | 6 | n/a | n/a | **return 6** |

Four O(n) checks instead of trying all 13 capacities.

**Why greedy is the right check:** for a fixed capacity, putting each package on the earliest day it fits never uses more days than any other valid loading, so "greedy needs ≤ D days" is exactly "some loading fits in D days".

## Implement it in Python

One generic `first_true` helper, then both classic problems written as one-line checks on top of it.

```python
from collections.abc import Callable

def first_true(lo: int, hi: int, ok: Callable[[int], bool]) -> int:
    """Smallest x in [lo, hi] with ok(x); ok must be monotone and ok(hi) True."""
    while lo < hi:
        mid = (lo + hi) // 2           # rounds down, so mid < hi and the range shrinks
        if ok(mid):
            hi = mid                   # mid works: answer is mid or smaller
        else:
            lo = mid + 1               # mid fails: answer is bigger
    return lo

def days_needed(weights: list[int], cap: int) -> int:
    days, load = 1, 0
    for w in weights:
        if load + w > cap:             # this package starts a new day
            days += 1
            load = 0
        load += w
    return days

def ship_within_days(weights: list[int], d: int) -> int:
    return first_true(max(weights), sum(weights),
                      lambda cap: days_needed(weights, cap) <= d)

def min_eating_speed(piles: list[int], h: int) -> int:
    hours = lambda k: sum((p + k - 1) // k for p in piles)   # ceil(p / k) per pile
    return first_true(1, max(piles), lambda k: hours(k) <= h)

assert ship_within_days([3, 2, 2, 4, 1, 4], 3) == 6
assert min_eating_speed([3, 6, 7, 11], 8) == 4
```

## Edge cases and pitfalls

- **Non-monotone checks.** If a bigger x can fail after a smaller one worked, binary search silently returns a wrong answer. Prove monotonicity first.
- **hi not feasible.** The template assumes `ok(hi)` is true. If the answer might not exist, check `ok(hi)` once before searching and handle "impossible".
- **lo too small.** In the shipping problem, `lo = 1` with this greedy check would wrongly count a too-heavy package as fitting on a fresh day. Start at `max(weights)`.
- **Off-by-one and infinite loops.** Pair `hi = mid` with `lo = mid + 1` and round down; pair `lo = mid` with `hi = mid − 1` and round up. Mixing them loops forever or skips the answer.
- **Integer division.** Hours per pile is ⌈p / k⌉; computing it as the integer division (p + k − 1) / k avoids floating point.
- **Real-valued answers.** For continuous ranges, loop a fixed number of times (say 100) or until `hi − lo < ε`, and use `mid = (lo + hi) / 2`.

## Where it shows up

- Minimum capacity / speed / time: ship within D days, Koko eating bananas, minimum days to make m bouquets.
- **Minimise the maximum:** split an array into k parts with the smallest largest sum (same check as shipping).
- **Maximise the minimum:** place cows in stalls as far apart as possible (largest-true version).
- Integer square root: the largest x with `x * x <= n`.
- k-th smallest value in a sorted matrix or of pairwise distances: the smallest x with "at least k values ≤ x".

## In the interview

Recognise the shape ("minimum X such that we can still …"), then say three things before coding: the **check** and its cost, **why it is monotone**, and the **bounds** lo and hi. Write the first-true template and finish with complexity: O(n log(range)). A common follow-up is to flip the objective (maximum instead of minimum), which tests whether you know to round the midpoint up.
