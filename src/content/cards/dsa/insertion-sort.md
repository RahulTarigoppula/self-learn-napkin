---
title: Insertion Sort
track: dsa
tags: [sorting, comparison, adaptive]
difficulty: 1
minutes: 4
tldr: "Grow a sorted prefix one value at a time: lift the next value out, shift every bigger value in the prefix one slot right, and drop it into the gap."
analogy: "Sorting a hand of playing cards: you pick up one card at a time and slide it left past the higher cards already in your hand until it sits in the right spot."
diagram: insertion-sort
story:
  - title: One value is already sorted
    text: "Take [5,3,8,1,9,2,7,4]. A single value is trivially sorted, so the prefix [5] (green) is our starting point. Insertion sort keeps one promise: everything left of the current position is sorted. Each step grows that prefix by one value."
  - title: Insert 3
    text: "Lift out the next value, the key 3 (orange). Compare it with the prefix from right to left: 5 > 3, so shift the 5 one slot right (blue). Nothing is left to compare, so drop 3 into the gap. Prefix [3,5], 1 shift."
  - title: 8 stays, 1 slides all the way
    text: "Key 8: one comparison, 5 < 8, so it is already in place with 0 shifts. Key 1 is smaller than everything in the prefix, so 8, 5 and 3 each shift right and 1 lands at the front: 3 shifts."
  - title: 9, then 2, then 7
    text: "Key 9 stays put (0 shifts). Key 2 pushes 9, 8, 5 and 3 right and stops at 1 (4 shifts). Key 7 pushes 9 and 8 and stops at 5 (2 shifts). Each key stops at the first value that is not bigger than it."
  - title: Insert 4, done
    text: "Key 4 shifts 9, 8, 7 and 5 and stops at 3. Total: 14 shifts and 19 comparisons. Each shift fixes exactly one out-of-order pair (an inversion), and this array starts with exactly 14 of them."
  - title: Nearly sorted is nearly free
    text: "On [1,2,3,5,4,6,7,8] only one pair is out of order, so the whole sort takes 1 shift and 8 comparisons. The cost is O(n + inversions): linear on nearly sorted data, O(n²) on reversed data."
keyIdeas:
  - "**Invariant**: before step i, `a[0..i−1]` is sorted. Insert `a[i]` by shifting the larger values in it one slot right."
  - "**Shifts = inversions**: total time is Θ(n + I), where I is the number of out-of-order pairs. Sorted input is O(n); reversed input is n(n−1)/2 shifts."
  - "**Stable, in place, online**: equal keys never pass each other (strict `>`), O(1) extra memory, and it can sort values as they arrive."
  - "**Fastest choice for tiny arrays**: low overhead and cache-friendly, which is why Timsort and introsort use it below roughly 16–64 elements."
quiz:
  - q: "How many shifts does insertion sort make on [4, 3, 2, 1]?"
    options: ["3", "4", "6", "16"]
    answer: 2
    why: "Every pair is out of order: there are 4·3/2 = 6 inversions, and each shift removes exactly one. Key 3 shifts 1, key 2 shifts 2, key 1 shifts 3: 1 + 2 + 3 = 6."
  - q: "Which input makes insertion sort run in linear time?"
    options: ["Random order, since shifts average out", "Reverse sorted, since each key goes to the front", "Already sorted or nearly sorted, with few inversions", "All values distinct, so no ties need shifting"]
    answer: 2
    why: "Each key costs one comparison plus one per shift. With few inversions there are few shifts, so the total is about n − 1 comparisons: O(n)."
  - q: "You replace the inner scan with a binary search for the insert position. What is the new worst case?"
    options: ["O(n log n), since each insert now costs O(log n)", "O(n²), because shifting elements is still O(n²)", "O(n), since binary search skips most comparisons", "O(log n), as only one search per array is needed"]
    answer: 1
    why: "Binary search finds the spot in O(log i) comparisons, but making room still moves up to i values. Moves dominate, so the worst case stays O(n²). It helps only when comparisons are expensive."
  - q: "Why does Timsort sort short runs with insertion sort rather than merge sort?"
    options: ["Insertion sort is O(n log n) on short runs, like merge sort", "For a few dozen items its low overhead wins, and it is stable", "Merge sort cannot sort arrays shorter than its block size", "Insertion sort uses less recursion stack than heapsort does"]
    answer: 1
    why: "Below about 32–64 items, n² is small and insertion sort's simple loop wins in practice. It is also stable, which Timsort must preserve."
bigO:
  - { op: "comparisons", best: "n − 1", avg: "≈ n²/4", worst: "n(n−1)/2", note: "best case: already sorted" }
  - { op: "shifts (= inversions)", best: "0", avg: "n(n−1)/4", worst: "n(n−1)/2", note: "worst case: reverse sorted" }
  - { op: "time", best: "O(n)", avg: "O(n²)", worst: "O(n²)", note: "Θ(n + inversions)" }
  - { op: "extra space", avg: "O(1)", note: "in place, stable, online" }
related: [dsa/sorting-overview, dsa/bubble-sort, dsa/merge-sort, dsa/binary-search]
prereqs: [dsa/arrays-and-pointers]
griddle: insertion-sort
flashcards:
  - kind: qa
    q: "What is the running time of insertion sort in terms of inversions?"
    a: "Θ(n + I), where I is the number of out-of-order pairs: each shift removes exactly one inversion, plus about one comparison per key."
  - kind: cloze
    text: "Insertion sort is {{stable}}, {{in place}} and O(n) on already-sorted input."
  - kind: qa
    q: "Why do production hybrids (Timsort, introsort) switch to insertion sort for small ranges?"
    a: "For a few dozen elements its simple loop has far lower overhead than recursion or merging, its memory access is sequential, and it is stable and adaptive."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Insertion sort module, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Insertion sort splits the array into a **sorted prefix** on the left and an unsorted rest on the right. At the start the prefix is just `a[0]`, because one value is always sorted.

For each position `i` from 1 to n − 1:

1. **Lift out the key**: copy `key = a[i]`. Its slot is now free to overwrite.
2. **Scan the prefix right to left**: while the value at `j` is *greater* than the key, **shift** it one slot right (`a[j+1] = a[j]`) and move `j` left.
3. **Drop the key in** at `j + 1`, the first slot whose left neighbour is not bigger than the key (or the very front).

The **invariant** is the reason it works: before step i, `a[0..i−1]` holds the original first i values in sorted order. Step i inserts one more value in its correct place, so after it `a[0..i]` is sorted. When i reaches n − 1 the whole array is sorted.

Shifting instead of swapping matters: a swap writes two slots each time, while a shift writes one, and the key is written only once at the end.

## Worked example

`[5, 3, 8, 1, 9, 2, 7, 4]`, n = 8:

| i | key | Compared against | Shifts | Array after the step |
|---|---|---|---|---|
| 1 | 3 | 5 | 1 | 3 5 \| 8 1 9 2 7 4 |
| 2 | 8 | 5 | 0 | 3 5 8 \| 1 9 2 7 4 |
| 3 | 1 | 8, 5, 3 | 3 | 1 3 5 8 \| 9 2 7 4 |
| 4 | 9 | 8 | 0 | 1 3 5 8 9 \| 2 7 4 |
| 5 | 2 | 9, 8, 5, 3, 1 | 4 | 1 2 3 5 8 9 \| 7 4 |
| 6 | 7 | 9, 8, 5 | 2 | 1 2 3 5 7 8 9 \| 4 |
| 7 | 4 | 9, 8, 7, 5, 3 | 4 | 1 2 3 4 5 7 8 9 |

Totals: **14 shifts and 19 comparisons**. The comparisons are one per shift plus one "stop" comparison per key, except for keys 3 and 1, which reached the front and stopped without a final comparison: 14 + 7 − 2 = 19.

### Why shifts equal inversions

An **inversion** is a pair of positions i < j with a[i] > a[j]. When the key moves left past a bigger value, exactly that one pair gets fixed and no other pair changes order. A sorted array has no inversions, so the total number of shifts equals the number of inversions in the input. Here: 5 is bigger than four later values (3, 1, 2, 4), 3 than two, 8 than four, 9 than three, 7 than one: 4 + 2 + 4 + 3 + 1 = 14.

## Implement it in Python

Eight lines. The strict `>` in the inner loop is what keeps it stable.

```python
def insertion_sort(a):
    """Sorts list a in place and returns it."""
    for i in range(1, len(a)):
        key = a[i]                     # a[:i] is already sorted
        j = i - 1
        while j >= 0 and a[j] > key:   # strict > keeps equal keys in order (stable)
            a[j + 1] = a[j]            # shift the bigger value one slot right
            j -= 1
        a[j + 1] = key                 # drop the key into the gap
    return a

print(insertion_sort([5, 3, 8, 1, 9, 2, 7, 4]))   # [1, 2, 3, 4, 5, 7, 8, 9]
```

## Complexity

- **Best case**, already sorted: each key needs one comparison and no shifts, so n − 1 comparisons: **O(n)**.
- **Worst case**, reverse sorted: key i shifts past all i values before it, so 1 + 2 + … + (n − 1) = **n(n − 1)/2** shifts: O(n²).
- **Average case**, random order: each of the n(n − 1)/2 pairs is inverted with probability 1/2, so about **n²/4** shifts: still O(n²).
- **In general** the cost is **Θ(n + I)** for I inversions. If every value is at most k places from its final spot, each value is inverted with fewer than 2k others, so there are O(n·k) inversions and the sort takes O(n·k).
- **Space**: O(1) extra.

## Why it survives inside fast sorts

Insertion sort is O(n²), yet every major library still uses it:

- **Tiny inputs**: for n around 10–50, n² is small, and the inner loop is just a compare and a copy over contiguous memory. Merge sort's recursion, buffers and function calls cost more than they save.
- **Timsort** extends every natural run shorter than a minimum length (about 32–64) with **binary insertion sort**, then merges runs. Binary search cuts comparisons to O(log i) per key, which matters when comparing two keys is expensive (strings, or objects with custom comparison), but the shifts are still O(i).
- **Introsort** leaves ranges below about 16 elements unsorted during quicksort, then runs one insertion sort pass over the nearly sorted array, where it is close to linear.

It is also **online**: it can sort values as they arrive, keeping the prefix sorted at every moment.

## Edge cases and pitfalls

- **`>=` instead of `>`** still sorts, but moves equal keys past each other and loses stability.
- **Check `j ≥ 0` first** in the loop condition. Otherwise you read `a[−1]`: most languages crash, and Python silently reads the last element instead.
- **Linked lists**: insertion sort works, but you must scan from the head to find the spot, because you cannot walk backwards in a singly linked list.

## In the interview

Typical prompts: "sort a nearly sorted array", "sort an array where each element is at most k positions away", or "why does Timsort use insertion sort?". Say the invariant, state the Θ(n + inversions) cost, and note it is stable and in place. For the k-sorted variant, mention that insertion sort gives O(n·k), and a min-heap of size k + 1 gives O(n log k), which is better when k is large.
