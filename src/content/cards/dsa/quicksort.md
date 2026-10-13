---
title: Quicksort
track: dsa
tags: [sorting, divide-and-conquer, partition]
difficulty: 2
minutes: 5
tldr: "Pick a pivot, partition so smaller values sit left of it and larger values right, then sort each side the same way. O(n log n) on average and in place, but O(n²) if the pivot keeps landing at an end."
analogy: "Splitting a class by height around one chosen student: everyone shorter goes to the left wall, everyone taller to the right, and the chosen student stands between them, already in their final spot. Then repeat inside each group."
diagram: quicksort
story:
  - title: Pick a pivot
    text: "Take [5,3,8,1,9,2,7,4]. Lomuto partitioning, the simplest scheme, uses the last value as the pivot: here 4 (red). The goal of one partition is to put 4 in its final position, with everything ≤ 4 to its left and everything > 4 to its right."
  - title: Scan once
    text: "A boundary i starts at the left; a scanner j walks left to right. When j finds a value ≤ 4, swap it to position i and move i one step right. 3, 1 and 2 qualify: swaps 3↔5, 1↔5, 2↔8. Now [3,1,2] (green) are ≤ 4 and [5,9,8,7] (blue) are > 4."
  - title: Place the pivot
    text: "Swap the pivot with the first value past the boundary, at index i = 3. 4 now sits at index 3, where it will stay: three smaller values left, four larger right. That partition cost 7 comparisons, one per scanned value."
  - title: Recurse on each side
    text: "Partition [3,1,2] around 2 and [9,8,7,5] around 5, and keep going until each piece has at most one value. No merge step is needed, because each pivot is already home. Total for this array: 7 + 2 + 3 + 2 + 1 = 15 comparisons."
  - title: The worst case
    text: "Feed it sorted [1..8]. The last value is always the maximum, so each partition peels off just the pivot: sizes 8, 7, 6 … and 7 + 6 + … + 1 = 28 comparisons. That is n(n−1)/2, O(n²). A random or median-of-three pivot makes such lopsided splits vanishingly unlikely."
keyIdeas:
  - "**Partition** puts the pivot in its final slot in one O(n) pass: values ≤ pivot to its left, larger values to its right."
  - "**Average O(n log n)**: random pivots split reasonably evenly, about 1.39·n log₂ n comparisons. **Worst O(n²)** when the pivot is always the min or max, e.g. last-element pivot on sorted input."
  - "**Fix the pivot**: pick it at random or as the median of first, middle and last. Introsort adds a heapsort fallback for a guaranteed O(n log n)."
  - "**In place** (O(log n) stack if you recurse into the smaller side) and **not stable**."
  - "**Quickselect** partitions once and recurses into only the side holding the k-th smallest value: average O(n)."
quiz:
  - q: "After one Lomuto partition of [5,3,8,1,9,2,7,4] with pivot 4, at which index does 4 end up?"
    options: ["0", "3", "4", "7"]
    answer: 1
    why: "Exactly three values (3, 1, 2) are ≤ 4, so they fill indices 0–2 and the pivot goes to index 3. The partition gives [3,1,2,4,9,8,7,5]."
  - q: "Why is quicksort with a last-element pivot O(n²) on an already-sorted array?"
    options: ["Sorted arrays need more swaps", "The pivot is always the maximum, so each partition only removes one element", "The recursion stack overflows", "Comparisons become more expensive"]
    answer: 1
    why: "Each partition of size m does m − 1 comparisons and leaves a part of size m − 1. Summing (n−1) + (n−2) + … + 1 gives n(n−1)/2."
  - q: "What is the average running time of quickselect for the k-th smallest element?"
    options: ["O(log n)", "O(n)", "O(n log n)", "O(n²)"]
    answer: 1
    why: "It recurses into only one side. With reasonable pivots the side shrinks geometrically: n + n/2 + n/4 + … < 2n, so O(n) on average (O(n²) worst case)."
  - q: "Is Lomuto quicksort stable? Partition [2a, 2b, 1] with pivot 1."
    options: ["Yes, equal keys never move", "No: the result is [1, 2b, 2a]", "Yes, because ties go left", "Only if the array has no duplicates"]
    answer: 1
    why: "No value is ≤ 1 except the pivot, so the final swap exchanges a[0] = 2a with the pivot at a[2]. That jumps 2a past 2b and reverses the two equal keys."
bigO:
  - { op: "time", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", note: "worst: pivot always min or max" }
  - { op: "comparisons", avg: "≈ 1.39·n log₂ n", worst: "n(n−1)/2", note: "random pivot / sorted input with last pivot" }
  - { op: "extra space", avg: "O(log n)", worst: "O(n)", note: "O(log n) guaranteed if you recurse into the smaller side" }
  - { op: "quickselect", avg: "O(n)", worst: "O(n²)", note: "k-th smallest" }
related: [dsa/sorting-overview, dsa/merge-sort, dsa/heaps, dsa/recursion]
prereqs: [dsa/recursion]
flashcards:
  - kind: qa
    q: "What does one partition step guarantee?"
    a: "The pivot ends in its final sorted position, with every value to its left ≤ pivot and every value to its right > pivot."
  - kind: cloze
    text: "Quicksort is O(n log n) on {{average}} but O(n²) in the {{worst case}}, e.g. a last-element pivot on sorted input."
  - kind: qa
    q: "Give two ways to avoid quicksort's O(n²) worst case in practice."
    a: "Choose the pivot at random or as the median of three, and (as introsort does) switch to heapsort when recursion gets deeper than about 2·log₂ n."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Recursion chapter: quicksort" }
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Quicksort module, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: quicksort
---

## How it works

Quicksort is divide and conquer with the work done **before** the recursion instead of after it (merge sort does the opposite):

1. **Choose a pivot** value from the range.
2. **Partition**: rearrange the range so every value ≤ pivot comes before it and every value > pivot comes after it. The pivot is now in its **final position**.
3. **Recurse** on the left part and the right part. Ranges of size 0 or 1 are already sorted.

There is no combine step: once both sides are sorted, the whole range is sorted, because everything on the left is ≤ pivot ≤ everything on the right.

### Lomuto partition, step by step

Take the last value `a[hi]` as the pivot. Keep a boundary `i`, starting at `lo`. Everything in `a[lo..i−1]` is known to be ≤ pivot.

- Walk `j` from `lo` to `hi − 1`. If `a[j] ≤ pivot`, swap `a[i]` and `a[j]` and increase `i`. Otherwise do nothing, so the larger value stays to the right of the boundary.
- At the end, `a[lo..i−1]` holds the small values and `a[i..hi−1]` the large ones. Swap the pivot `a[hi]` into `a[i]`. Return `i`.

One partition of m values makes exactly **m − 1 comparisons**.

## Worked example

`[5, 3, 8, 1, 9, 2, 7, 4]`, first partition with pivot 4:

| j | a[j] | ≤ 4? | Action | Array afterwards | i |
|---|---|---|---|---|---|
| 0 | 5 | no | none | 5 3 8 1 9 2 7 4 | 0 |
| 1 | 3 | yes | swap a[0], a[1] | 3 5 8 1 9 2 7 4 | 1 |
| 2 | 8 | no | none | 3 5 8 1 9 2 7 4 | 1 |
| 3 | 1 | yes | swap a[1], a[3] | 3 1 8 5 9 2 7 4 | 2 |
| 4 | 9 | no | none | 3 1 8 5 9 2 7 4 | 2 |
| 5 | 2 | yes | swap a[2], a[5] | 3 1 2 5 9 8 7 4 | 3 |
| 6 | 7 | no | none | 3 1 2 5 9 8 7 4 | 3 |
| end | | | swap pivot into a[3] | 3 1 2 **4** 9 8 7 5 | |

Then the recursion:

| Range | Pivot | Result | Comparisons |
|---|---|---|---|
| [3, 1, 2] | 2 | [1, **2**, 3] | 2 |
| [9, 8, 7, 5] | 5 | [**5**, 8, 7, 9] | 3 |
| [8, 7, 9] | 9 | [8, 7, **9**] | 2 |
| [8, 7] | 7 | [**7**, 8] | 1 |

Total: 7 + 2 + 3 + 2 + 1 = **15 comparisons**, and the array is `[1, 2, 3, 4, 5, 7, 8, 9]`.

## Why average O(n log n) but worst O(n²)

Every level of recursion partitions ranges that together hold at most n values, so **each level costs O(n)**. The question is how many levels there are.

- **Good splits**: if the pivot lands near the middle, sizes halve and there are about log₂ n levels: O(n log n). Even a consistently lopsided 1 : 9 split gives only log₁₀/₉ n ≈ 6.6·log₂ n levels, still O(n log n).
- **Bad splits**: if the pivot is always the smallest or largest value, each level removes only one element. That is n levels of n, n − 1, … work: **n(n − 1)/2 comparisons**. With a last-element pivot this happens on **sorted and reverse-sorted input**, which is very common in practice. Lomuto also degrades to O(n²) when all values are equal.
- **Random pivots**: for any fixed input, the expected number of comparisons is about 2n ln n ≈ **1.39·n log₂ n**. Two values are compared only if one of them is the first pivot chosen from the range between them, and summing those probabilities gives that bound.

## Choosing the pivot

- **Random pivot**: swap a random element into `a[hi]` before partitioning. No input is reliably bad; O(n²) still exists but is astronomically unlikely.
- **Median of three**: use the median of `a[lo]`, `a[mid]`, `a[hi]`. Perfect on sorted input, cheap, and used by most libraries.
- **Introsort** (C++ `std::sort`): if recursion depth passes about 2·log₂ n, switch that range to heapsort. This guarantees O(n log n).
- **Three-way partition** (values <, =, > pivot) handles many duplicates in linear time per level.

## Implement it in Python

Lomuto partition plus the smaller-side-first loop, which keeps the recursion stack at O(log n) even on bad input.

```python
def partition(a, lo, hi):
    """Lomuto: pivot = a[hi]. Returns the pivot's final index."""
    pivot = a[hi]                        # tip: swap a random a[r] into a[hi] first
    i = lo                               # a[lo:i] holds values <= pivot
    for j in range(lo, hi):
        if a[j] <= pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]            # pivot lands right after the small values
    return i

def quicksort(a, lo=0, hi=None):
    """Sorts a[lo..hi] in place and returns a."""
    if hi is None:
        hi = len(a) - 1
    while lo < hi:
        p = partition(a, lo, hi)
        if p - lo < hi - p:              # recurse into the smaller side, loop on the larger:
            quicksort(a, lo, p - 1)      # the stack never grows past O(log n)
            lo = p + 1
        else:
            quicksort(a, p + 1, hi)
            hi = p - 1
    return a

print(quicksort([5, 3, 8, 1, 9, 2, 7, 4]))   # [1, 2, 3, 4, 5, 7, 8, 9]
```

## Quickselect

To find the k-th smallest value you do not need to sort. Partition once; the pivot lands at index p. If p = k you are done; if k < p, continue in the left part only, otherwise in the right part only. With random pivots the work is about n + n/2 + n/4 + … < 2n: **O(n) on average**, O(n²) in the worst case. The median-of-medians pivot rule makes it O(n) worst case, at a larger constant.

## Edge cases and pitfalls

- **Not stable**: partitioning `[2a, 2b, 1]` around 1 swaps 2a to the end, giving `[1, 2b, 2a]`.
- **Recursion depth**: the naive "recurse on both sides" version can recurse n deep on bad input and overflow the stack. Recurse into the smaller side and loop on the larger one.
- **Hoare's partition** (two pointers moving inward) does about three times fewer swaps than Lomuto on average, but the pivot does not necessarily end at the returned index, so the recursive calls use different bounds. Do not mix the two schemes.

## In the interview

Be ready to write the partition from memory, trace it on a small array, and explain the average versus worst case. Strong answers mention that sorted input is the classic trap for a fixed pivot, give randomisation or median-of-three as the fix, and note quicksort is usually faster than merge sort in practice because it works in place with sequential memory access. Common follow-ups are "find the k-th largest element" (quickselect, or a size-k heap in O(n log k)) and "sort an array of 0s, 1s and 2s" (a three-way partition, the Dutch national flag problem).
