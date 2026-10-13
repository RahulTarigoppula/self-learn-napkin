---
title: Prefix Sums
track: dsa
tags: [arrays, prefix-sums, hashing, patterns]
difficulty: 2
minutes: 4
tldr: "Precompute running totals P once in O(n). Then the sum of any range a[l..r] is P[r+1] − P[l]: one subtraction, O(1), however long the range."
analogy: "A car's odometer. To know how far you drove between two towns you don't re-drive the road; you subtract the two odometer readings."
diagram: prefix-sums
story:
  - title: An array of numbers
    text: "Take a = [3, 1, 4, 1, 5, 2]. Suppose you will be asked many questions like \"what is the sum from index 1 to 4?\". Adding the values each time costs O(length of the range) per question, up to O(n)."
  - title: Build P, the running totals
    text: "Make an array P one longer than a. P[0] = 0, and each next entry adds one more value: P = [0, 3, 4, 8, 9, 14, 16]. P[i] is the sum of the first i values, a[0] to a[i − 1]. Building it is a single O(n) pass."
  - title: A range sum is one subtraction
    text: "P[5] = 3 + 1 + 4 + 1 + 5 covers indices 0 to 4. P[1] = 3 covers index 0 only. Subtract and only indices 1 to 4 remain: 14 − 3 = 11. So sum(a[l..r]) = P[r+1] − P[l], in O(1), for any l and r."
  - title: Subarray sum equals k
    text: "Which subarrays sum to 5? Any whose two prefix totals are exactly 5 apart: 8 − 3, 9 − 4 and 14 − 9 give [1, 4], [4, 1] and [5]. Walk left to right keeping a hash map of how often each prefix total has appeared, and for each new total add the count of total − 5. One pass, O(n)."
  - title: The same idea in 2D
    text: "For a grid, let S[r][c] be the sum of the rectangle above and to the left. A box's sum is the whole prefix minus the strip above and the strip to the left; the corner A was subtracted twice, so add it back once. Four lookups, O(1) per query."
keyIdeas:
  - "**P[i] = a[0] + … + a[i − 1]**, with P[0] = 0 and length n + 1. The extra 0 removes every special case for ranges starting at 0."
  - "**Range sum:** sum(a[l..r]) = **P[r+1] − P[l]**. O(n) to build, O(1) per query."
  - "**Subarray sum = k:** count earlier prefixes equal to P − k with a hash map seeded with {0: 1}. Works with negative numbers, unlike a sliding window."
  - "**2D:** box = S[r2+1][c2+1] − S[r1][c2+1] − S[r2+1][c1] + S[r1][c1], inclusion–exclusion."
  - "Prefix sums need the array to be **static**; with updates between queries use a Fenwick or segment tree."
quiz:
  - q: "a = [3, 1, 4, 1, 5, 2] and P = [0, 3, 4, 8, 9, 14, 16]. What is the sum of a[2..5]?"
    options: ["10", "12", "13", "16"]
    answer: 1
    why: "sum(a[2..5]) = P[6] − P[2] = 16 − 4 = 12, which matches 4 + 1 + 5 + 2."
  - q: "In the subarray-sum-equals-k algorithm, why is the hash map started with {0: 1}?"
    options: ["To avoid a KeyError", "So that subarrays starting at index 0 are counted", "To skip the empty array", "It is only needed when k is 0"]
    answer: 1
    why: "A subarray a[0..j] has sum P[j+1] − P[0], and P[0] = 0. Seeding the map with one zero prefix represents P[0], so such subarrays are found when total − k = 0."
  - q: "The array contains negative numbers. Which technique still counts subarrays with sum exactly k in O(n)?"
    options: ["Variable sliding window", "Prefix sums with a hash map of prefix counts", "Sorting then two pointers", "Binary search on the prefix array"]
    answer: 1
    why: "The prefix-difference argument holds for any integers. A sliding window needs sums to grow monotonically, and P is no longer sorted, so binary search on it fails too."
  - q: "How many lookups into a 2D prefix table does one rectangle-sum query need?"
    options: ["1", "2", "4", "One per row of the rectangle"]
    answer: 2
    why: "Bottom-right prefix, minus the prefix above, minus the prefix to the left, plus the top-left corner that was subtracted twice: four lookups, O(1)."
bigO:
  - { op: "build P", avg: "O(n)", note: "O(n) extra space" }
  - { op: "range-sum query", avg: "O(1)", note: "P[r+1] − P[l]" }
  - { op: "count subarrays with sum k", avg: "O(n)", note: "hash map of prefix counts" }
  - { op: "2D build / box query", avg: "O(R·C) / O(1)" }
  - { op: "point update", avg: "O(n)", note: "every later P changes; use a Fenwick tree" }
related: [dsa/sliding-window, dsa/hash-tables, dsa/arrays-and-pointers, dsa/dynamic-programming]
prereqs: [dsa/arrays-and-pointers, dsa/hash-tables]
flashcards:
  - kind: qa
    q: "Give the formula for the sum of a[l..r] (inclusive) using a prefix array P with P[0] = 0."
    a: "P[r+1] − P[l]. P[r+1] covers a[0..r] and P[l] covers a[0..l−1]; the difference is exactly a[l..r]."
  - kind: cloze
    text: "To count subarrays summing to k, for each running total add the number of earlier prefixes equal to {{total − k}}, seeding the map with {{a count of 1 for the total 0}}."
  - kind: qa
    q: "When should you not use a plain prefix-sum array?"
    a: "When values change between queries: one update forces O(n) rebuilding of P. A Fenwick (binary indexed) tree or segment tree gives O(log n) updates and queries."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Background on precomputation; redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **prefix sum** array (also called a cumulative sum or running total) stores, for each position, the total of everything before it:

- `P[0] = 0` — the sum of no elements.
- `P[i + 1] = P[i] + a[i]` — each entry adds one more value.

So `P` has **n + 1** entries and `P[i]` is the sum of the first `i` values, `a[0]` to `a[i − 1]`. Building it is one pass: O(n) time and O(n) space.

### Range sums in O(1)

`P[r + 1]` is the sum of `a[0..r]`. `P[l]` is the sum of `a[0..l − 1]`. Subtracting removes the shared beginning and leaves exactly `a[l..r]`:

```
sum(a[l..r]) = P[r + 1] − P[l]
```

The leading 0 is what makes this formula work for `l = 0` without an `if`. Many off-by-one bugs come from building `P` with length n instead.

This turns *q* range queries from O(n·q) into O(n + q). It works for anything with an **inverse**: sums (subtract), XOR (XOR again), counts. It does **not** work directly for max or min, because you cannot "un-max" a prefix — use a sparse table or segment tree for those.

### Subarray sum equals k

A subarray `a[i..j]` sums to k exactly when `P[j + 1] − P[i] = k`, that is when an **earlier** prefix equals `P[j + 1] − k`. So walk through the array keeping the running total, and a hash map from each prefix total seen so far to how many times it has been seen. At each position, the number of subarrays that **end here** with sum k is `seen[total − k]`.

Seed the map with `{0: 1}`: that is `P[0]`, and without it subarrays starting at index 0 are missed. Look up *before* inserting the current total, or k = 0 would count an empty subarray.

This works with **negative numbers**, where a sliding window fails, because it never assumes sums grow as the window grows.

### 2D prefix sums

For an R × C grid, let `S[r][c]` be the sum of the rectangle of rows `0..r−1` and columns `0..c−1` (again with a zero row and column in front). Build it with

```
S[r+1][c+1] = g[r][c] + S[r][c+1] + S[r+1][c] − S[r][c]
```

and answer the sum of the box from `(r1, c1)` to `(r2, c2)` with **inclusion–exclusion**:

```
box = S[r2+1][c2+1] − S[r1][c2+1] − S[r2+1][c1] + S[r1][c1]
```

The big prefix includes the strip above the box and the strip to its left; subtracting both removes the top-left corner twice, so it is added back once.

## Worked example

`a = [3, 1, 4, 1, 5, 2]`, `P = [0, 3, 4, 8, 9, 14, 16]`.

- `sum(a[1..4]) = P[5] − P[1] = 14 − 3 = 11` (check: 1 + 4 + 1 + 5).
- `sum(a[0..2]) = P[3] − P[0] = 8 − 0 = 8`.

**Count subarrays with sum k = 5:**

| x | total | need = total − 5 | seen[need] | count | seen after |
|---|---|---|---|---|---|
| — | 0 | | | 0 | {0:1} |
| 3 | 3 | −2 | 0 | 0 | {0:1, 3:1} |
| 1 | 4 | −1 | 0 | 0 | + {4:1} |
| 4 | 8 | 3 | 1 | 1 | + {8:1} |
| 1 | 9 | 4 | 1 | 2 | + {9:1} |
| 5 | 14 | 9 | 1 | 3 | + {14:1} |
| 2 | 16 | 11 | 0 | **3** | + {16:1} |

The three hits are `[1, 4]` (8 − 3), `[4, 1]` (9 − 4) and `[5]` (14 − 9).

## In code

```python
from collections import Counter
from itertools import accumulate

def prefix(a: list[int]) -> list[int]:
    return list(accumulate(a, initial=0))        # [0, a0, a0+a1, ...], length n + 1

def range_sum(p: list[int], l: int, r: int) -> int:
    return p[r + 1] - p[l]                         # inclusive l..r

def count_sum_k(a: list[int], k: int) -> int:
    seen = Counter({0: 1})                         # P[0] = 0 has been "seen" once
    total = count = 0
    for x in a:
        total += x
        count += seen[total - k]                   # earlier prefixes exactly k smaller
        seen[total] += 1                           # insert after the lookup
    return count

def prefix_2d(g: list[list[int]]) -> list[list[int]]:
    rows, cols = len(g), len(g[0])
    s = [[0] * (cols + 1) for _ in range(rows + 1)]
    for r in range(rows):
        for c in range(cols):
            s[r + 1][c + 1] = g[r][c] + s[r][c + 1] + s[r + 1][c] - s[r][c]
    return s

def box_sum(s, r1: int, c1: int, r2: int, c2: int) -> int:
    return s[r2 + 1][c2 + 1] - s[r1][c2 + 1] - s[r2 + 1][c1] + s[r1][c1]

p = prefix([3, 1, 4, 1, 5, 2])
assert p == [0, 3, 4, 8, 9, 14, 16] and range_sum(p, 1, 4) == 11
assert count_sum_k([3, 1, 4, 1, 5, 2], 5) == 3
assert box_sum(prefix_2d([[1, 2], [3, 4]]), 1, 1, 1, 1) == 4
```

## Edge cases and pitfalls

- **Length n instead of n + 1.** Then ranges starting at 0 need a special case. Always prepend the 0.
- **Lookup order in the hash-map version.** Query `seen[total − k]` before adding `total`, or k = 0 counts empty subarrays.
- **Forgetting the seed.** Without `{0: 1}`, `count_sum_k([5], 5)` returns 0 instead of 1.
- **Overflow** in fixed-width languages: totals can exceed 32 bits even when every element fits. Python integers do not overflow.
- **Mutable data.** One update changes every later prefix, O(n). For many updates use a **Fenwick tree** (binary indexed tree) or **segment tree**: O(log n) each.

## Related tricks

- **Difference arrays** are the inverse: to add v to every element of `a[l..r]` for many ranges, do `D[l] += v; D[r + 1] −= v`, then take one prefix sum at the end.
- **Prefix XOR** answers range-XOR queries the same way (`X[r+1] ^ X[l]`).
- **Prefix counts** (e.g. number of vowels up to i) answer "how many in this range" queries.
- "Longest subarray with sum k" uses the same hash map but stores the **first index** where each total appeared.

## In the interview

When you see "sum of a subarray" or "many range queries on a fixed array", say "prefix sums" and write `P[r+1] − P[l]` with the leading zero. For "count subarrays with sum k", explain the `P[j] − P[i] = k` rewrite, the `{0: 1}` seed and why it handles negatives. Expected follow-ups: the 2D version (inclusion–exclusion), "what if the array changes?" (Fenwick tree), and "subarray sum divisible by k" (count prefixes with the same remainder `total % k`).
