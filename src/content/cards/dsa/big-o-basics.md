---
title: Big-O Basics
track: dsa
tags: [complexity, fundamentals]
difficulty: 1
minutes: 4
tldr: "Big-O names how fast work grows as n grows — constants and small terms are dropped on purpose."
analogy: "Handing one invitation to each guest is O(n); every guest shaking hands with every other guest is O(n²). Double the guest list and the first job doubles, the second roughly quadruples."
diagram: big-o-curves
story:
  - title: Ask how the work grows
    text: "Big-O does not measure seconds. It asks one question: if the input gets bigger, how much more work does the algorithm do? So we plot input size n across and steps of work up, and watch the shape of each curve as n heads off to the right."
  - title: O(1) and O(log n) stay flat
    text: "O(1) is a fixed amount of work whatever n is — reading a[7], or a hash lookup on average. O(log n) grows but barely: each step halves the problem, so binary search needs about 20 probes for a million items and only 30 for a billion."
  - title: O(n) and O(n log n) climb
    text: "O(n) touches every item once, like summing an array: double n, double the work. O(n log n) is a touch steeper. It is the sorting floor: any sort that only compares items needs on the order of n log n comparisons in the worst case, and merge sort and heap sort achieve it."
  - title: O(n²) and O(2ⁿ) leave the napkin
    text: "Nested loops over the same data give O(n²): n = 1,000,000 means a trillion steps. Trying every subset gives O(2ⁿ): already about 10¹⁸ steps at n = 60. These curves leave the page while the flat ones have hardly moved, so for large n the shape decides, not the hardware."
  - title: Drop the constants and small terms
    text: "Say an algorithm does 3n² + 200n + 5000 steps. At n = 10 the 5000 dominates, but by n = 10,000 the n² term is over 99 % of the work. The 3 depends on the machine and the compiler, not the idea. So we keep only the fastest-growing term: O(n²)."
keyIdeas:
  - "**Big-O is an upper bound on growth**, not a stopwatch: it says how work scales, not how long one run takes."
  - "**Keep the fastest-growing term, drop its constant**: 3n² + 200n + 5000 is O(n²)."
  - "**Loops in sequence add, nested loops multiply**; halving the problem each step gives a log."
  - "**Best, average and worst case** are three different questions — say which one you mean."
  - "**Space complexity** uses the same notation for memory: an extra array of size n is O(n) space."
quiz:
  - q: "A function runs an outer loop over n items, and for each item an inner loop of exactly 10 iterations. What is its complexity?"
    options: ["O(n)", "O(n²)", "O(10n²)", "O(n log n)"]
    answer: 0
    why: "The inner loop does a fixed 10 steps no matter how big n is, so the total is 10n. Constants are dropped, leaving O(n). Nested loops only multiply into n² when both depend on n."
  - q: "Algorithm A takes 100n steps and algorithm B takes n² steps. When is A faster?"
    options: ["Always — it is O(n)", "Only when n > 100", "Only when n < 100", "Never — 100 is a big constant"]
    answer: 1
    why: "100n < n² exactly when n > 100. For small inputs the 'worse' O(n²) algorithm wins; Big-O only promises which one wins eventually."
  - q: "A loop starts with n and halves it every iteration until it reaches 1. How many iterations does it run?"
    options: ["About n", "About n / 2", "About log₂ n", "About √n"]
    answer: 2
    why: "After k halvings n has become n / 2ᵏ, which reaches 1 when k = log₂ n. A million needs only about 20 iterations."
  - q: "You scan an array of n items, then separately scan a list of m items. What is the complexity?"
    options: ["O(n · m)", "O(n + m)", "O(n²)", "O(1)"]
    answer: 1
    why: "The loops run one after the other, so their costs add. Multiplying (n · m) would only be right if one loop sat inside the other."
bigO:
  - { op: "O(1)",        avg: "constant",  note: "array index, hash lookup" }
  - { op: "O(log n)",    avg: "log",       note: "binary search, balanced BST" }
  - { op: "O(n)",        avg: "linear",    note: "one scan" }
  - { op: "O(n log n)",  avg: "linearithmic", note: "merge/heap sort — the sorting floor" }
  - { op: "O(n²)",       avg: "quadratic", note: "nested loops over the same data" }
  - { op: "O(2ⁿ)",       avg: "exponential", note: "every subset" }
bigOTitle: "The growth ladder"
related: [dsa/binary-search, dsa/bubble-sort]
prereqs: []
flashcards:
  - kind: qa
    q: "Why does Big-O drop constant factors and lower-order terms?"
    a: "It describes growth as n → ∞; for large n the dominant term decides, and constants depend on the machine, not the algorithm."
  - kind: cloze
    text: "Comparison sorts need {{Ω(n log n)}} comparisons in the worst case."
  - kind: qa
    q: "An algorithm does 3n² + 200n + 5000 operations. What is its Big-O, and when would the 5000 still matter?"
    a: "O(n²). The constant dominates for small n, so for tiny inputs a 'worse' algorithm can be faster in practice."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Analysis of Algorithms chapter, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What Big-O actually says

Write the number of basic steps an algorithm takes on an input of size n as a function, f(n). Saying **f(n) is O(g(n))** means: there is some constant c and some starting size n₀ such that f(n) ≤ c · g(n) for every n ≥ n₀. In words, *past some point, f never grows faster than a constant multiple of g*.

Three consequences follow straight from that definition:

- **Constants vanish.** 3n² ≤ 3 · n², so 3n² is O(n²) — the 3 is absorbed into c.
- **Smaller terms vanish.** For n ≥ 1, 3n² + 200n + 5000 ≤ 3n² + 200n² + 5000n² = 5203n², so it is O(n²) too.
- **It is an upper bound.** n is technically also O(n²), because n ≤ n². In practice people quote the tightest bound they can. The formal names for the other directions are **Ω (Omega)**, a lower bound, and **Θ (Theta)**, both at once; in interviews "Big-O" is normally used to mean the tight bound.

A "basic step" is anything that takes constant time: an arithmetic operation, a comparison, reading `a[i]`. We count steps rather than seconds because seconds depend on the machine, the language and the compiler, while the *shape* of growth depends only on the algorithm.

## How to work it out

1. **Straight-line code** with no loops is O(1).
2. **A loop** costs (number of iterations) × (cost of the body).
3. **Code in sequence adds**: an O(n) scan followed by an O(n log n) sort is O(n + n log n) = O(n log n). Keep the biggest term.
4. **Nested loops multiply**, but only by what actually depends on n: a loop over n containing a loop of 10 is 10n = O(n).
5. **Halving gives a logarithm**: if each step cuts the remaining work in half, the number of steps is about log₂ n. The base of the log does not matter in Big-O, because log₂ n and log₁₀ n differ only by a constant factor.
6. **Recursion**: count calls × work per call. A function that calls itself twice on n − 1 makes about 2ⁿ calls.

## Worked example

How the classes compare as n grows (rounded):

| n | log₂ n | n log₂ n | n² | 2ⁿ |
|---|---|---|---|---|
| 10 | 3.3 | 33 | 100 | 1,024 |
| 1,000 | 10 | 10,000 | 1,000,000 | ≈ 10³⁰¹ |
| 1,000,000 | 20 | 20,000,000 | 10¹² | far beyond astronomical |

At a billion simple steps per second, the n² column at n = 1,000,000 is about 17 minutes; the n log n column is 0.02 seconds. That gap is why choosing the right algorithm matters more than tuning the code.

Now the claim that constants stop mattering, for f(n) = 3n² + 200n + 5000:

| n | 3n² | 200n | 5000 | share of 3n² |
|---|---|---|---|---|
| 10 | 300 | 2,000 | 5,000 | 4 % |
| 100 | 30,000 | 20,000 | 5,000 | 55 % |
| 10,000 | 300,000,000 | 2,000,000 | 5,000 | 99.3 % |

For small n the "unimportant" terms dominate. That is exactly why a simple O(n²) insertion sort beats merge sort on tiny arrays, and why real sort routines switch to insertion sort for short runs.

## Implement it in Python

The same counting works in any language; here are the common shapes in Python.

```python
def first(items):              # O(1): one step, whatever len(items) is
    return items[0]

def total(items):              # O(n): touches each item once
    s = 0
    for x in items:
        s += x
    return s

def has_duplicate(items):      # O(n²): compares every pair, n(n-1)/2 of them
    n = len(items)
    for i in range(n):
        for j in range(i + 1, n):
            if items[i] == items[j]:
                return True
    return False

def has_duplicate_fast(items): # O(n) on average: one pass with a hash set,
    seen = set()               # paid for with O(n) extra space
    for x in items:
        if x in seen:
            return True
        seen.add(x)
    return False

def halvings(n):               # O(log n): n halves every iteration
    steps = 0
    while n > 1:
        n //= 2
        steps += 1
    return steps
```

The two duplicate checkers show the most common trade in interviews: spend memory (a set) to drop a factor of n from the time.

## Edge cases and pitfalls

- **Hidden loops.** Library calls hide work: checking whether a value is in an unsorted list is O(n), inserting at the front of an array is O(n), and building a string by repeated concatenation in a loop can be O(n²) in many languages. One innocent line inside a loop can change the whole answer.
- **Two inputs, two letters.** Comparing every item of a list of size n with every item of a list of size m is O(n · m), not O(n²). Do not merge different sizes into one n.
- **Average is not worst.** A hash lookup is O(1) on average but O(n) in the worst case; quicksort is O(n log n) on average but O(n²) in the worst case.
- **Amortised cost** is an average over a sequence of operations: appending to a dynamic array is occasionally O(n) (when it grows) but O(1) amortised.
- **Recursion uses space.** A recursive function with depth n uses O(n) stack memory even if it allocates nothing else.

## In the interview

State the time and space complexity of your solution before you are asked, and name the term that dominates: "the sort is O(n log n), the scan after it is O(n), so O(n log n) overall, with O(1) extra space." If your first idea is O(n²), say so, then ask yourself which repeated work a hash set, a sort or two pointers could remove. Expect the follow-up "can you do better?" — and know the floors: you cannot beat O(n) if you must read every input, and comparison sorting cannot beat O(n log n).
