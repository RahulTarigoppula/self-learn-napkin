---
title: Binary Search
track: dsa
tags: [search, divide-and-conquer, arrays]
difficulty: 2
minutes: 4
tldr: "In a sorted array, compare with the middle element and throw away the half that cannot hold the target. Each probe halves the range, so 20 probes cover a million items."
analogy: "Finding a word in a paper dictionary: open it in the middle, see whether your word comes before or after, and throw away the wrong half without reading a single page of it."
diagram: binary-search
story:
  - title: A sorted range, lo to hi
    text: "We want 11 in the sorted array [1,3,5,7,9,11,13,15]. Two indices mark the part that could still hold it: lo = 0 and hi = 7, both inclusive. At the start that is the whole array, eight candidates."
  - title: Probe the middle
    text: "Look at the middle of the range: mid = (0 + 7) / 2 = 3, rounding down. a[3] is 7, which is less than 11. One comparison, but because the array is sorted it tells us about far more than one element."
  - title: Discard the left half
    text: "Everything at or left of index 3 is at most 7, so 11 cannot be there. Four candidates vanish without being looked at: set lo = mid + 1 = 4. Sortedness is what makes this legal. On an unsorted array, the comparison would tell us nothing about the neighbours."
  - title: Probe what is left
    text: "The range is now indices 4 to 7. The new middle is (4 + 7) / 2 = 5, and a[5] is 11. Had it been bigger than 11, we would have set hi = mid − 1 and kept going on the left."
  - title: Found it
    text: "Found at index 5 after two probes. Each probe halves the range (8, 4, 2, 1), so eight items never need more than 4 probes, and a million need at most 20. If lo passes hi, the value is absent and lo is where it would be inserted."
keyIdeas:
  - "**The array must be sorted.** That precondition *is* the algorithm, because it lets one comparison rule out a whole half."
  - "**Invariant:** if the target exists, it is inside [lo, hi]. Every update must keep that true."
  - "**At most ⌊log₂ n⌋ + 1 probes**: 4 for 8 items, 20 for a million, 30 for a billion."
  - "**Compute mid as `lo + (hi − lo) / 2`** (integer division) in languages with fixed-size integers: `lo + hi` can overflow."
  - "**Binary search on the answer** applies the same halving to any yes/no question that flips once, whether or not there is an array."
quiz:
  - q: "lo = 4, hi = 7, and a[mid] is bigger than the target. What is the next range?"
    options: ["lo = 4, hi = 5", "lo = 4, hi = 4", "lo = 6, hi = 7", "lo = 5, hi = 7"]
    answer: 1
    why: "mid = ⌊(4 + 7) / 2⌋ = 5. a[5] is too big, and so is everything to its right, so the target can only be left of mid: hi = mid − 1 = 4. One candidate remains, index 4."
  - q: "Roughly how many probes does binary search need, at most, for 1,000,000 sorted items?"
    options: ["About 1,000", "About 500,000", "About 20", "About 6"]
    answer: 2
    why: "Each probe halves the range, and 2²⁰ ≈ 1,048,576, so after 20 halvings a million candidates are down to one."
  - q: "Why can't you binary search an unsorted array?"
    options: ["mid could fall out of range, since the indices are not in order", "Comparing with a[mid] says nothing about which half holds the target", "It would degrade to O(n²) comparisons in the worst case", "Most languages forbid it, so the library call throws an error instead"]
    answer: 1
    why: "Discarding a half is only safe because every element on that side is known to be smaller (or larger). Without order, the target could be anywhere."
bigO:
  - { op: "search", best: "O(1)", avg: "O(log n)", worst: "O(log n)" }
  - { op: "space",  avg: "O(1)", note: "iterative; O(log n) if recursive" }
related: [dsa/binary-search-on-answer, dsa/big-o-basics, dsa/hash-tables]
prereqs: [dsa/arrays-and-pointers]
griddle: binary-search
flashcards:
  - kind: qa
    q: "What is the worst-case time complexity of binary search?"
    a: "O(log n), because each probe halves the remaining range."
  - kind: cloze
    text: "Writing `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2` avoids {{integer overflow}}."
  - kind: qa
    q: "Binary search on [1,3,5,7,9,11,13,15] for 4: which indices are probed, and what is returned?"
    a: "Indices 3, 1 and 2 (values 7, 3, 5). Then lo = 2 > hi = 1, so it returns −1 (not found), and lo = 2 is the insertion point."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Binary search module, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Binary search finds a value in a **sorted** array by repeatedly halving the part of the array that could still contain it.

Keep two indices, `lo` and `hi`, for the first and last candidate positions (both **inclusive** in this version). The rule you must never break, the **loop invariant**, is: *if the target is in the array at all, it is somewhere in `a[lo..hi]`.* At the start, `lo = 0` and `hi = n − 1`, so the invariant holds trivially.

Each round:

1. Pick the middle, `mid = ⌊(lo + hi) / 2⌋` (integer division, rounding down).
2. If `a[mid]` equals the target, return `mid`.
3. If `a[mid]` is **less** than the target, then because the array is sorted every element at or left of `mid` is also too small. Set `lo = mid + 1`, and the invariant still holds.
4. If `a[mid]` is **greater**, every element at or right of `mid` is too big. Set `hi = mid − 1`.
5. Stop when `lo > hi`: the range is empty, so by the invariant the target is not in the array.

Steps 3 and 4 always move a bound *past* `mid`, so the range shrinks every round and the loop must end.

### Why it is O(log n)

After one probe at most n/2 candidates remain, after two n/4, after k probes n/2ᵏ. The search must stop once fewer than one candidate is left, so it makes at most **⌊log₂ n⌋ + 1** probes: 4 for n = 8, 20 for n = 1,000,000, 30 for a billion. Compare that with a linear scan, which may look at all n.

## Worked example

Search for **11** in `[1, 3, 5, 7, 9, 11, 13, 15]`:

| Probe | lo | hi | mid | a[mid] | Decision |
|---|---|---|---|---|---|
| 1 | 0 | 7 | 3 | 7 | 7 < 11 → lo = 4 |
| 2 | 4 | 7 | 5 | 11 | found at index 5 |

Search for **4**, which is missing:

| Probe | lo | hi | mid | a[mid] | Decision |
|---|---|---|---|---|---|
| 1 | 0 | 7 | 3 | 7 | 7 > 4 → hi = 2 |
| 2 | 0 | 2 | 1 | 3 | 3 < 4 → lo = 2 |
| 3 | 2 | 2 | 2 | 5 | 5 > 4 → hi = 1 |
| end | 2 | 1 | | | lo > hi: not found, return −1 |

Notice where `lo` stopped: index 2, exactly where 4 would have to be inserted to keep the array sorted. That "insertion point" is often the real answer interviewers want.

## Variant: the lower bound

Often "is x here?" is the wrong question. What you want is "where is the **first element ≥ x**?" That position, the **lower bound**, gives the first occurrence among duplicates, the insertion point, and the number of elements smaller than x, all at once.

Use a half-open range `[lo, hi)` with `lo = 0` and `hi = n`, where `hi = n` stands for "every element is smaller". While `lo < hi`, probe `mid`. If `a[mid] < x`, the answer is to the right: `lo = mid + 1`. Otherwise `a[mid]` might itself be the answer, so keep it in range: `hi = mid`. When `lo == hi` the range has shrunk to a single position, and that is the answer. For x = 4 in the array above: `[0, 8)` probes index 4 (9 ≥ 4) → `hi = 4`; `[0, 4)` probes index 2 (5 ≥ 4) → `hi = 2`; `[0, 2)` probes index 1 (3 < 4) → `lo = 2`; now `lo == hi`, so the answer is 2.

The **upper bound** (first element > x) is the same loop with `a[mid] ≤ x` as the test, and *upper − lower* counts the copies of x.

## Implement it in Python

Here are the exact-match search and the lower-bound variant side by side. Watch how the two differ in `hi` and in the loop condition.

```python
def binary_search(a, target):
    """Index of target in sorted list a, or -1. hi is inclusive."""
    lo, hi = 0, len(a) - 1
    while lo <= hi:                    # range [lo, hi] is non-empty
        mid = lo + (hi - lo) // 2      # same as (lo + hi) // 2 in Python
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1               # target can only be right of mid
        else:
            hi = mid - 1               # target can only be left of mid
    return -1

def lower_bound(a, target):
    """First index i with a[i] >= target (len(a) if none). hi is exclusive."""
    lo, hi = 0, len(a)
    while lo < hi:                     # range [lo, hi) is non-empty
        mid = (lo + hi) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid                   # mid itself may be the answer: keep it
    return lo

a = [1, 3, 5, 7, 9, 11, 13, 15]
print(binary_search(a, 11), binary_search(a, 4), lower_bound(a, 4))   # 5 -1 2
```

Standard libraries ship these: C++'s `std::lower_bound` and Python's `bisect.bisect_left` are exactly `lower_bound`, and Java's `Arrays.binarySearch` returns `−(insertion point) − 1` when the value is missing.

## Edge cases and pitfalls

- **Overflow.** In Java, C or C++, `lo + hi` can exceed the largest `int` for huge arrays; `lo + (hi - lo) / 2` cannot. Python integers never overflow, but say this in interviews anyway.
- **Mixing conventions.** Pick inclusive `hi` (`while lo <= hi`, `hi = mid - 1`) or exclusive `hi` (`while lo < hi`, `hi = mid`) and stay with it. Mixing them gives infinite loops or skipped elements.
- **Infinite loops.** With `lo = mid` instead of `lo = mid + 1`, a two-element range can pick the same `mid` forever.
- **Duplicates.** Plain binary search returns *some* matching index, not necessarily the first. Use `lower_bound` for the first occurrence and an upper-bound search for the last.
- **Empty arrays** work naturally: `hi = -1`, the loop never runs, and the result is −1.

## Binary search on the answer

The same halving works on any yes/no question whose answer flips exactly once as a number grows (a **monotone predicate**). "Can we ship all parcels within 5 days using a truck of capacity c?" is false for small c and true for every c above some threshold. Binary search over c finds the smallest capacity that works, checking each guess in O(n). This pattern hides behind many "minimise the maximum" questions.

## In the interview

Say the invariant out loud ("if the target exists, it is inside [lo, hi]") and check that both updates keep it. Trace a two-element array by hand before you finish; that is where off-by-one bugs live. Expect follow-ups: first and last occurrence, searching a rotated sorted array, finding the square root of a number, or the smallest capacity that satisfies a constraint.
