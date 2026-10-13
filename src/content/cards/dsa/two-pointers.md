---
title: Two Pointers
track: dsa
tags: [arrays, two-pointers, patterns]
difficulty: 1
minutes: 4
tldr: "Walk two indices through an array so that every step rules something out for good. One pass, O(n) time, O(1) extra space, instead of trying all O(n²) pairs."
analogy: "Two people checking a word is a palindrome: one reads from the front, one from the back, and they walk towards each other comparing letters. Neither ever goes back, so the whole check is one pass."
diagram: two-pointers
story:
  - title: One pointer at each end
    text: "Find two numbers that sum to 13 in the sorted array [1, 3, 4, 6, 9, 11, 14]. Trying every pair is 21 checks. Instead put L on the smallest value and R on the largest, and look only at a[L] + a[R]."
  - title: Too big, move R. Too small, move L
    text: "1 + 14 = 15 is too big. Every other value is at least 1, so 14 overshoots with any partner: drop it, R moves left. Then 1 + 11 = 12 is too small, and 11 is now the largest partner left, so 1 can never reach 13: drop it, L moves right."
  - title: Each check rules out a value
    text: "3 + 11 = 14, too big: R moves left. 3 + 9 = 12, too small: L moves right. 4 + 9 = 13, found. Every check eliminated one value for good, so the pointers meet after at most n − 1 moves: O(n). This only works because the array is sorted."
  - title: Same direction, read and write
    text: "The second flavour runs both pointers left to right. Remove duplicates from the sorted [1, 1, 2, 2, 2, 3, 5] in place: a read pointer, rd, visits every cell once (a new name, so it is not confused with R above). A value is worth keeping only if it differs from the last value kept, so the shaded duplicates are skipped."
  - title: W writes to the front
    text: "W marks the next free slot of the answer. Each kept value is copied to a[W] and W moves on: 2 goes to index 1, 3 to index 2, 5 to index 3. W ends at 4, the new length, and a[0..3] = [1, 2, 3, 5]. One pass, no second array."
keyIdeas:
  - "**Opposite ends** (L from the left, R from the right) need a reason to discard an end each step, and that reason is usually a **sorted** array."
  - "**Same direction** (read/write, or slow/fast): rd reads everything once, W marks where the next kept element goes."
  - "**Why O(n):** every step moves a pointer and no pointer ever moves back, so there are at most n moves in total."
  - "Correctness is an invariant: **the answer is never in the part you discarded**. Say it out loud in interviews."
  - "Unsorted pair sum? A **hash set** gives O(n) time; sorting first costs O(n log n) and loses the original indices."
quiz:
  - q: "Sorted array [2, 5, 7, 10, 14], target 17. L is at 2 and R is at 14. What should happen next?"
    options: ["Move R left, the sum is too big", "Move L right, the sum is too small", "Move both pointers inwards", "Stop, no pair exists"]
    answer: 1
    why: "2 + 14 = 16 < 17. Since 14 is the largest value left, 2 cannot reach 17 with any partner, so 2 is discarded: L moves right. Next, 5 + 14 = 19 is too big, R moves left, and 5 + 10 = 15 is too small, L moves right, then 7 + 10 = 17."
  - q: "Why does the opposite-ends pair search run in O(n) rather than O(n²)?"
    options: ["It uses a hash map", "Each comparison moves one pointer inwards and they never move back", "It only checks every other element", "Sorting makes comparisons faster"]
    answer: 1
    why: "The gap between L and R shrinks by one on every step and starts at n − 1, so there can be at most n − 1 comparisons."
  - q: "remove_duplicates([0, 0, 1, 1, 1, 2]) with the read/write pointers returns what?"
    options: ["2", "3", "4", "6"]
    answer: 1
    why: "The distinct values are 0, 1 and 2. They are packed into a[0..2] and the function returns W = 3, the length of the deduplicated prefix."
  - q: "The array is NOT sorted and you must return the indices of two values summing to k. Best approach?"
    options: ["Opposite-end two pointers directly", "One pass with a hash map from value to index", "Nested loops, it is the only correct option", "Binary search for each element"]
    answer: 1
    why: "Two pointers need sorted order. A hash map checks for k − x in O(1) per element, so O(n) time with O(n) space, and it keeps the original indices."
bigO:
  - { op: "pair sum, sorted array", avg: "O(n)", note: "O(1) extra space" }
  - { op: "pair sum, brute force", avg: "O(n²)", note: "n(n−1)/2 pairs" }
  - { op: "reverse / palindrome check", avg: "O(n)", note: "n/2 swaps or comparisons" }
  - { op: "remove duplicates in place", avg: "O(n)", note: "O(1) extra space" }
  - { op: "3Sum (sort + two pointers)", avg: "O(n²)", note: "instead of O(n³)" }
related: [dsa/arrays-and-pointers, dsa/sliding-window, dsa/fast-and-slow-pointers, dsa/binary-search]
prereqs: [dsa/arrays-and-pointers]
flashcards:
  - kind: qa
    q: "In the sorted pair-sum walk, a[L] + a[R] is less than the target. Why is it safe to move L right?"
    a: "a[R] is the largest value still in range, so a[L] falls short with every possible partner. a[L] can never be in the answer, so it is discarded."
  - kind: cloze
    text: "In the read/write pattern, the {{read}} pointer visits every element once and the {{write}} pointer marks where the next kept element goes."
  - kind: qa
    q: "How do you extend two pointers to 3Sum, and what is the complexity?"
    a: "Sort, then for each index i run the opposite-ends pair search on a[i+1..n−1] for target − a[i], skipping duplicate values. O(n²) time instead of O(n³)."
sources:
  - { name: "Tech Interview Handbook", url: "https://github.com/yangshun/tech-interview-handbook", licence: "MIT", note: "Array techniques, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: two-pointers
---

## How it works

**Two pointers** is a family of techniques where two indices walk through a sequence, and the position of each tells you something about what is left to check. The payoff is always the same: instead of examining all n(n − 1)/2 pairs with nested loops, each step **permanently rules out** at least one element, so the whole walk is O(n).

There are two flavours.

### 1. Opposite ends (converging pointers)

Start `L = 0` and `R = n − 1` and move them towards each other until they meet. You need a rule that, after looking at `a[L]` and `a[R]`, proves one of them is useless from now on.

**Pair with a given sum in a sorted array.** Let `s = a[L] + a[R]`.

- `s == target`: done.
- `s < target`: `a[R]` is the **largest** value still in range, so `a[L]` plus anything left is at most `s`, which is still too small. `a[L]` can never be part of an answer: `L += 1`.
- `s > target`: `a[L]` is the **smallest** value in range, so `a[R]` plus anything left is at least `s`, which is too big. Discard it: `R -= 1`.

The **invariant** is: *if a valid pair exists, it lies inside `a[L..R]`*. It is true at the start and each move preserves it, so when the loop ends without a match, no pair exists. Sortedness is what makes the two "can never" arguments true.

The same shape solves **reversing an array** (swap `a[L]` and `a[R]`, move both in), **palindrome checks** (compare and move both in), **container with most water** (always move the shorter wall: any narrower container that keeps it is no taller than it, so it can never beat the current area) and the inner loop of **3Sum**.

### 2. Same direction (read / write, slow / fast)

Both pointers start at the left and only move right, at different speeds. A **read** pointer `rd` visits every element exactly once; a **write** pointer `W` marks the end of the result being built *inside the same array*. Everything in `a[0..W−1]` is finished output; `a[W..n−1]` is scratch space.

This solves "remove duplicates in place", "move all zeroes to the end", "remove every occurrence of x", and partitioning. Because `W ≤ rd` at all times, a write never destroys a value that has not been read yet.

## Worked example

**Opposite ends:** sorted `[1, 3, 4, 6, 9, 11, 14]`, target 13.

| Check | L, R | a[L] + a[R] | Decision |
|---|---|---|---|
| 1 | 0, 6 | 1 + 14 = 15 | too big → R = 5 |
| 2 | 0, 5 | 1 + 11 = 12 | too small → L = 1 |
| 3 | 1, 5 | 3 + 11 = 14 | too big → R = 4 |
| 4 | 1, 4 | 3 + 9 = 12 | too small → L = 2 |
| 5 | 2, 4 | 4 + 9 = 13 | **found (2, 4)** |

Five checks instead of 21 pairs.

**Same direction:** `[1, 1, 2, 2, 2, 3, 5]`, start `W = 1` (the first element is always kept).

| rd | a[rd] | last kept a[W−1] | Action | W after | Prefix a[0..W−1] |
|---|---|---|---|---|---|
| 1 | 1 | 1 | skip | 1 | [1] |
| 2 | 2 | 1 | a[1] = 2 | 2 | [1, 2] |
| 3 | 2 | 2 | skip | 2 | [1, 2] |
| 4 | 2 | 2 | skip | 2 | [1, 2] |
| 5 | 3 | 2 | a[2] = 3 | 3 | [1, 2, 3] |
| 6 | 5 | 3 | a[3] = 5 | 4 | [1, 2, 3, 5] |

Return 4. The tail `a[4..6]` still holds old values (`[2, 3, 5]`); by convention the caller only looks at the first W elements.

## Implement it in Python

Three short walks: the pair search, a palindrome check and the in-place dedupe.

```python
def pair_with_sum(a: list[int], target: int) -> tuple[int, int] | None:
    lo, hi = 0, len(a) - 1
    while lo < hi:                     # lo == hi would pair an element with itself
        s = a[lo] + a[hi]
        if s == target:
            return lo, hi
        if s < target:
            lo += 1                    # a[lo] is too small even with the largest partner
        else:
            hi -= 1                    # a[hi] is too big even with the smallest partner
    return None

def is_palindrome(s: str) -> bool:
    i, j = 0, len(s) - 1
    while i < j:
        if s[i] != s[j]:
            return False
        i, j = i + 1, j - 1
    return True

def remove_duplicates(a: list[int]) -> int:
    if not a:
        return 0
    w = 1                              # a[:w] holds the distinct values kept so far
    for rd in range(1, len(a)):
        if a[rd] != a[w - 1]:          # a new value: differs from the last one kept
            a[w] = a[rd]
            w += 1
    return w

assert pair_with_sum([1, 3, 4, 6, 9, 11, 14], 13) == (2, 4)
assert is_palindrome("racecar") and not is_palindrome("ab")
nums = [1, 1, 2, 2, 2, 3, 5]
assert remove_duplicates(nums) == 4 and nums[:4] == [1, 2, 3, 5]
```

## Why it is O(n)

For opposite ends, the gap `R − L` starts at n − 1 and shrinks by exactly one per iteration, so there are at most n − 1 iterations. For same direction, `rd` moves once per iteration and `W` never passes it, so both make at most n moves. Each iteration does O(1) work, and no extra arrays are allocated: **O(n) time, O(1) extra space**.

## Edge cases and pitfalls

- **Unsorted input.** The discard arguments rely on order. On unsorted data either sort first (O(n log n), and keep `(value, index)` pairs if you must return original indices) or use a hash set/map instead (O(n) time, O(n) space).
- **`while lo < hi`, not `<=`.** With `<=` an element can be paired with itself.
- **Duplicates in 3Sum.** After sorting, skip equal neighbours for the outer index and after each match, or you report the same triple more than once.
- **Empty and single-element arrays.** `remove_duplicates([])` must return 0; the pair search loop simply never runs.
- **Comparing with the wrong neighbour.** In the dedupe, compare `a[r]` with the last *kept* value `a[w − 1]`, not with `a[r − 1]` (which is the same thing here, but breaks in variants like "keep at most two copies", where the check is `a[r] != a[w − 2]`).

## When to use it

Reach for two pointers when the input is a **sorted array or string** and the question is about **pairs, triples, or a partition**, or when you must transform an array **in place**. If the question is about a **contiguous range** whose size changes (longest substring, smallest subarray with a sum), that is the closely related **sliding window**. If it is about a **linked list cycle or middle**, that is **fast and slow pointers**.

## In the interview

Name the pattern, then state the invariant before coding: "the answer, if any, is always between L and R" or "a[0..W−1] is the finished output". Mention O(n) time and O(1) space and why. Expect follow-ups: "what if the array is not sorted?" (hash map), "return all pairs" (on a match, move both pointers and skip duplicates), and "now do three numbers" (sort plus a two-pointer pass for each element, O(n²)).
