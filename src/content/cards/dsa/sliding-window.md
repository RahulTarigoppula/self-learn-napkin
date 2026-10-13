---
title: Sliding Window
track: dsa
tags: [arrays, strings, two-pointers, patterns]
difficulty: 2
minutes: 4
tldr: "Keep a contiguous window [L, R] and update its summary as the edges move, instead of recomputing every subarray. Both edges only move right, so it is O(n)."
analogy: "Reading a long receipt through a cardboard slot that shows three lines at a time. Slide it down one line and you just add the new line and forget the old one; you never re-add the two lines still showing."
diagram: sliding-window
story:
  - title: Fixed window, add one and drop one
    text: "Largest sum of 3 consecutive numbers in [2, 1, 5, 1, 3, 2]. Summing every window from scratch costs k additions each. Instead, slide: the new sum is the old sum minus the element that falls out plus the one that comes in. 7 − 1 + 3 = 9. One addition and one subtraction per step."
  - title: Variable window, grow while valid
    text: "Now the window size is the answer: the longest substring of \"abcbad\" with no repeated letter. Move the right edge R one letter at a time and remember where each letter was last seen. \"a\", \"ab\", \"abc\" are all valid, so the best so far is 3."
  - title: A repeat, so shrink
    text: "R reaches the second b at index 3. The window \"abcb\" is invalid, and any window that still contains both b's is invalid too. So the left edge L jumps to just past the old b, index 2. The window is \"cb\" and valid again."
  - title: Grow again
    text: "R adds a: there is an older a at index 0, but it is left of L, so it is not in the window and nothing shrinks. R adds d: \"cbad\", length 4, the answer. Checking that the previous position is at least L is the subtle line in this algorithm."
  - title: Why it is O(n)
    text: "R visits each index once. L also only moves right and never passes R. So the edges make at most 2n moves in total, even though one step may move L several places. Of the n(n + 1)/2 possible windows, only one per right edge is ever looked at."
keyIdeas:
  - "A window is a **contiguous** range [L, R]. Keep a running summary (sum, counts, last-seen map) and update it in O(1) as an edge moves."
  - "**Fixed size k:** add a[R], drop a[R − k]. **Variable size:** grow R; shrink L while the window is invalid (longest) or while it is still valid (shortest)."
  - "It needs **monotone** validity. Longest: shrinking a valid window keeps it valid (\"no repeats\"). Shortest: growing a valid window keeps it valid (sum ≥ target, if no value is negative)."
  - "**O(n)** because L and R each move right at most n times in total, an amortised argument, not a per-step one."
quiz:
  - q: "What is the length of the longest substring without repeating characters in \"pwwkew\"?"
    options: ["2", "3", "4", "6"]
    answer: 1
    why: "\"wke\" (indices 2 to 4) has length 3. \"pwke\" is not a substring, because the letters are not contiguous in the original string."
  - q: "Why does the variable sliding window fail for \"shortest subarray with sum ≥ k\" when the array has negative numbers?"
    options: ["Negative numbers overflow", "Validity is no longer monotone: dropping a negative element from the left can raise the sum", "The window must be fixed size", "Hash maps cannot store negatives"]
    answer: 1
    why: "The loop stops shrinking as soon as the sum drops below the target, assuming removing more can only lower it further. With negatives, dropping one raises the sum, so a shorter valid window is missed. Use prefix sums with a monotonic deque."
  - q: "In the longest-unique-substring loop, why test last[ch] >= left before moving left?"
    options: ["To skip letters that appear only once", "An older copy left of the window is not a repeat, and left must never move backwards", "It makes the algorithm O(n log n)", "To handle uppercase letters"]
    answer: 1
    why: "In \"abba\", when the final a arrives its last index is 0 but left is already 2. Without the check, left would jump back to 1 and the window \"bba\" would wrongly be counted."
  - q: "Fixed window of size k over n elements. How many windows are there, and what is the total time with the add-one/drop-one update?"
    options: ["n windows, O(nk)", "n − k + 1 windows, O(n)", "k windows, O(k)", "n − k windows, O(n log k)"]
    answer: 1
    why: "Windows start at indices 0 to n − k, which is n − k + 1 of them. The first costs k additions and each slide costs O(1), so O(n) overall."
bigO:
  - { op: "fixed window (sum, average)", avg: "O(n)", note: "O(1) extra space" }
  - { op: "longest substring, no repeats", avg: "O(n)", note: "O(min(n, alphabet)) for the last-seen map" }
  - { op: "brute force over all windows", avg: "O(n²)", note: "n(n+1)/2 windows; O(n³) if each is re-summed" }
  - { op: "sliding-window maximum", avg: "O(n)", note: "needs a monotonic deque" }
related: [dsa/two-pointers, dsa/prefix-sums, dsa/hash-tables, dsa/monotonic-stack]
prereqs: [dsa/two-pointers]
flashcards:
  - kind: qa
    q: "When must a variable sliding window shrink?"
    a: "For a longest-valid question: while the window is invalid. For a shortest-valid question: while it is still valid, recording the answer before each shrink."
  - kind: cloze
    text: "A sliding window is O(n) because {{both edges only move right}}, so there are at most {{2n}} pointer moves in total."
  - kind: qa
    q: "What property must the window condition have for the sliding window to be correct?"
    a: "Monotonicity. For a longest-valid question, every window inside a valid window must be valid too; for a shortest-valid question, every window containing a valid one must be valid. Then discarding a left element never loses an answer."
sources:
  - { name: "Tech Interview Handbook", url: "https://github.com/yangshun/tech-interview-handbook", licence: "MIT", note: "Sliding window technique, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: sliding-window
---

## How it works

A **window** is a contiguous slice of an array or string, written `[L, R]` (both ends inclusive). Many questions ask for the best window: the largest sum of k consecutive values, the longest substring with some property, the shortest subarray that reaches a total. There are n(n + 1)/2 windows, so checking them all is at least O(n²).

The sliding window avoids that by keeping a **running summary** of the current window — a sum, a count of each character, or a map of where each letter was last seen — and updating it in O(1) when one edge moves. Nothing inside the window is ever recomputed.

### Fixed-size windows

When the window size k is given, both edges move together. Moving one step right means element `a[R]` comes in and `a[R − k]` falls out:

```
window_sum = window_sum + a[R] − a[R − k]
```

That replaces k additions per window with two operations.

### Variable-size windows

When the size is part of the answer, the edges move independently:

1. **Expand:** move R right one step and add `a[R]` to the summary.
2. **Repair or shrink:** move L right while the window needs it, removing `a[L]` from the summary.
3. **Record** the answer for this R.

Which way step 2 goes depends on the question:

- **Longest valid window** (longest substring with no repeats, at most k distinct characters): shrink **while the window is invalid**, then record.
- **Shortest valid window** (smallest subarray with sum ≥ target, minimum window substring): **while the window is valid**, record it and shrink to try for something shorter.

### Why discarding L is safe

The method needs the condition to be **monotone**, in the direction that matches the question:

- **Longest valid:** every window *inside* a valid window is valid. Then, once `[L, R]` is invalid, every longer `[L, R']` with R' > R is invalid too, so `a[L]` can never start a later answer and may be dropped for good. "No repeated letters", "at most k distinct" and "sum ≤ target with non-negative values" all behave this way.
- **Shortest valid:** every window *containing* a valid window is valid. Then, once `[L, R]` is valid and recorded, any `[L, R']` with R' > R is valid but longer, so `a[L]` is no longer useful and may be dropped. "Sum ≥ target" behaves this way **only for non-negative numbers**: with negatives, removing an element can make the sum go *up*, and the method breaks.

### Why it is O(n)

R moves n times. L only moves right and never passes R, so across the *whole run* it moves at most n times — even if one iteration moves it several places. Total edge moves ≤ 2n, each O(1): **O(n)**. This is an amortised argument: a single step can be expensive, the total cannot.

## Worked example

Longest substring without repeating characters in `"abcbad"`, using `last` = the index where each letter was last seen.

| R | char | last[char] before | ≥ L? | L after | Window | Length | Best |
|---|---|---|---|---|---|---|---|
| 0 | a | — | — | 0 | a | 1 | 1 |
| 1 | b | — | — | 0 | ab | 2 | 2 |
| 2 | c | — | — | 0 | abc | 3 | 3 |
| 3 | b | 1 | yes | 2 | cb | 2 | 3 |
| 4 | a | 0 | no (0 < 2) | 2 | cba | 3 | 3 |
| 5 | d | — | — | 2 | cbad | 4 | **4** |

Row 4 is the trap: the map still remembers the a at index 0, but that a has already left the window. Moving L to 1 would move it *backwards* and re-admit the duplicate b.

## Implement it in Python

The same idea works in any language; here are the three standard windows in Python.

```python
def max_sum_k(a: list[int], k: int) -> int:
    window = sum(a[:k])
    best = window
    for r in range(k, len(a)):
        window += a[r] - a[r - k]          # add the newcomer, drop the one that fell out
        best = max(best, window)
    return best

def longest_unique(s: str) -> int:
    last: dict[str, int] = {}              # char -> index where it was last seen
    left = best = 0
    for right, ch in enumerate(s):
        if last.get(ch, -1) >= left:       # ch is already inside the window
            left = last[ch] + 1            # jump just past its previous copy
        last[ch] = right
        best = max(best, right - left + 1)
    return best

def shortest_with_sum(a: list[int], target: int) -> int:   # a must be non-negative
    left = total = 0
    best = len(a) + 1
    for right, x in enumerate(a):
        total += x
        while total >= target:             # valid: record it, then try shorter
            best = min(best, right - left + 1)
            total -= a[left]
            left += 1
    return best if best <= len(a) else 0

assert max_sum_k([2, 1, 5, 1, 3, 2], 3) == 9
assert longest_unique("abcbad") == 4 and longest_unique("pwwkew") == 3
assert shortest_with_sum([2, 3, 1, 2, 4, 3], 7) == 2
```

## Edge cases and pitfalls

- **Moving L backwards.** The `last[ch] >= left` check (or `left = max(left, last[ch] + 1)`) is essential. Test with `"abba"`: the answer is 2.
- **Off-by-one in the length.** With inclusive ends the length is `R − L + 1`.
- **Recording at the wrong moment.** For longest-valid, record *after* shrinking; for shortest-valid, record *before* each shrink step.
- **Negative numbers.** Sum-based variable windows assume non-negative values. For arbitrary integers, use prefix sums with a hash map (exact sum k) or with a monotonic deque (shortest sum ≥ k).
- **Window larger than the input.** `max_sum_k` with k > n has no windows at all; decide whether to raise or return a sentinel.
- **Counts that reach zero.** When tracking "at most k distinct" with a hash map of counts, delete keys whose count drops to 0, or the map's size overstates the distinct count.

## When to use it

Signals in the question: **contiguous** subarray or substring, **longest / shortest / maximum / minimum**, and a condition you can update incrementally (a sum, character counts, number of distinct values). If the elements need not be contiguous, it is not a window problem — think sorting, two pointers, or DP. If you need the max or min *inside* each window, pair the window with a **monotonic deque**.

## In the interview

State the window, the summary you maintain, and the shrink rule before coding: "R expands; while the window has a repeat, L moves past the previous copy; record R − L + 1". Then give the 2n-moves argument for O(n). Common follow-ups: "at most k distinct characters" (a hash map of counts; shrink while it has more than k keys), "minimum window substring" (counts of needed characters plus a `missing` counter), and "what if numbers can be negative?" (prefix sums).
