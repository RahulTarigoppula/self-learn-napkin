---
title: Merge Sort
track: dsa
tags: [sorting, divide-and-conquer, recursion]
difficulty: 2
minutes: 4
tldr: "Split the array in half, sort each half recursively, then merge the two sorted halves with two pointers. log₂ n levels × O(n) work per level = O(n log n), always."
analogy: "Two sorted piles of exam papers face up on a desk: you repeatedly take whichever top paper has the lower mark and put it on a new pile. You never look deeper than the two top papers."
diagram: merge-sort
story:
  - title: Eight unsorted values
    text: "Take [5,3,8,1,9,2,7,4]. Merge sort uses divide and conquer: break the problem into halves, solve each half the same way, and combine the answers. All the real work happens in the combine step, the merge."
  - title: Halve until pieces have one value
    text: "Cut the array in the middle, then cut each half in the middle, until every piece holds one value. A single value is already sorted. With 8 values that takes log₂ 8 = 3 rounds of halving, and no comparisons at all."
  - title: Merge neighbours
    text: "Now walk back up. Merge neighbouring pieces into sorted pairs: [5]+[3] → [3,5], [8]+[1] → [1,8], [9]+[2] → [2,9], [7]+[4] → [4,7]. Each merge of two single values costs one comparison: 4 so far."
  - title: Merge with two pointers
    text: "To merge [3,5] and [1,8], point at the front of each and take the smaller: 3 vs 1 → 1, 3 vs 8 → 3, 5 vs 8 → 5. The left side is empty, so copy the 8. Three comparisons; [2,9] + [4,7] → [2,4,7,9] takes three more."
  - title: Final merge
    text: "Merging [1,3,5,8] with [2,4,7,9] takes 7 comparisons. Total: 4 + 6 + 7 = 17. Every level of merging touches each of the n values once, so it costs at most n comparisons, and there are log₂ n levels: O(n log n) on every input."
keyIdeas:
  - "**Merge two sorted lists in O(p + q)** with two pointers: compare the fronts, take the smaller, advance that pointer, and copy the leftovers."
  - "**Recursion tree**: log₂ n levels, each costing O(n), so T(n) = 2T(n/2) + O(n) = **O(n log n) in the best, average and worst case**."
  - "**Stable**: on a tie, take from the left half (`<=`), so equal keys keep their order."
  - "**Not in place**: merging arrays needs an O(n) buffer. On linked lists it needs no buffer, which makes it the standard way to sort a linked list."
  - "Basis of **Timsort** and of **external sorting** (k-way merging of sorted chunks that do not fit in memory)."
quiz:
  - q: "How many comparisons does it take to merge [1, 2, 3] with [4, 5, 6]?"
    options: ["2", "3", "5", "6"]
    answer: 1
    why: "1 vs 4, 2 vs 4, 3 vs 4: three comparisons empty the left list, then 4, 5, 6 are copied without comparing. A merge costs between min(p, q) and p + q − 1 comparisons."
  - q: "Sorting 1,024 values, how many levels of merging are there?"
    options: ["10", "32", "512", "1,024"]
    answer: 0
    why: "Each level doubles the size of the sorted pieces: 1 → 2 → 4 → … → 1024 is 10 doublings, because log₂ 1024 = 10."
  - q: "Why does the merge use `left[i] <= right[j]` rather than `<`?"
    options: ["It is faster", "To take the left value on ties, which keeps the sort stable", "To avoid an index error", "It makes no difference at all"]
    answer: 1
    why: "Equal keys from the left half came first in the input. Taking them first on a tie preserves that order. With `<`, the right one would jump ahead and the sort would not be stable."
  - q: "What is the worst-case extra memory for top-down merge sort on an array?"
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"]
    answer: 2
    why: "Each merge writes into a buffer as large as the two halves; the largest merge needs n slots. The recursion stack adds only O(log n)."
bigO:
  - { op: "time", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", note: "same on every input" }
  - { op: "comparisons, n = 8", best: "12", avg: "≈ 15.7", worst: "17", note: "averaged over all 8! orders; [5,3,8,1,9,2,7,4] hits the worst case" }
  - { op: "extra space (array)", avg: "O(n)", note: "merge buffer + O(log n) stack" }
  - { op: "extra space (linked list)", avg: "O(log n)", note: "relink nodes; only the recursion stack" }
related: [dsa/sorting-overview, dsa/quicksort, dsa/insertion-sort, dsa/recursion]
prereqs: [dsa/recursion]
griddle: merge-sort
flashcards:
  - kind: qa
    q: "Write the recurrence for merge sort and solve it."
    a: "T(n) = 2T(n/2) + O(n). The recursion tree has log₂ n levels, each costing O(n), so T(n) = O(n log n)."
  - kind: cloze
    text: "Merging two sorted lists of sizes p and q takes {{O(p + q)}} time and uses {{two pointers}}, one per list."
  - kind: qa
    q: "When is merge sort a better pick than quicksort?"
    a: "When you need stability or a guaranteed O(n log n), when sorting a linked list, or when data is too big for memory (external sort by merging sorted chunks)."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Recursion chapter: mergesort" }
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Mergesort module, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Merge sort is the textbook example of **divide and conquer**:

1. **Divide**: split the array at the middle into a left half and a right half.
2. **Conquer**: sort each half by calling merge sort on it. The recursion stops at pieces of size 0 or 1, which are already sorted.
3. **Combine**: **merge** the two sorted halves into one sorted array.

The split is trivial (just compute the middle index). All the work is in the merge.

### Merging two sorted lists

Keep one pointer at the front of each list. Repeatedly compare the two front values, append the smaller one to the output and advance that pointer. When one list runs out, copy the rest of the other list, which is already sorted and bigger than everything output so far.

Why is this correct? The smallest remaining value overall must be at the front of one of the two lists, because each list is sorted. So taking the smaller front is always right. Each comparison outputs one value, so merging lists of sizes p and q takes **at most p + q − 1 comparisons** and O(p + q) time.

## Worked example

`[5, 3, 8, 1, 9, 2, 7, 4]`:

| Level | Merges | Comparisons |
|---|---|---|
| pairs | [5]+[3] → [3,5] · [8]+[1] → [1,8] · [9]+[2] → [2,9] · [7]+[4] → [4,7] | 1 + 1 + 1 + 1 = 4 |
| fours | [3,5]+[1,8] → [1,3,5,8] · [2,9]+[4,7] → [2,4,7,9] | 3 + 3 = 6 |
| eight | [1,3,5,8]+[2,4,7,9] → [1,2,3,4,5,7,8,9] | 7 |

The final merge in detail: 1 vs 2 → **1**, 3 vs 2 → **2**, 3 vs 4 → **3**, 5 vs 4 → **4**, 5 vs 7 → **5**, 8 vs 7 → **7**, 8 vs 9 → **8**, then the left list is empty and **9** is copied. Seven comparisons for eight outputs.

Total: **17 comparisons**. That is the worst case for n = 8 (the formula is n⌈log₂ n⌉ − 2^⌈log₂ n⌉ + 1 = 24 − 8 + 1 = 17), because every merge here alternated between the two lists until the last value. If the input were already sorted, each merge would empty its left list first: 4 + 4 + 4 = 12 comparisons.

## Why O(n log n)

Draw the recursion as a tree. The root is the whole array; its two children are the halves; and so on down to single values. There are **log₂ n levels** of merging. On any one level the pieces together contain all n values, and merging costs at most one comparison per value output, so **each level costs O(n)**. Total: O(n) × log₂ n = **O(n log n)**.

As a recurrence: T(n) = 2T(n/2) + cn, T(1) = c. Unrolling gives T(n) = cn·log₂ n + cn. Unlike quicksort, the split is always exactly in half, so **no input is slower**: best, average and worst cases are all Θ(n log n).

## Implement it in Python

The same idea works in any language; here it is in Python, written for clarity rather than speed.

```python
def merge_sort(a):
    """Returns a new sorted list."""
    if len(a) <= 1:
        return a                          # 0 or 1 values: already sorted
    mid = len(a) // 2
    return merge(merge_sort(a[:mid]), merge_sort(a[mid:]))

def merge(left, right):
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:           # <= takes the left value on ties: stable
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    out.extend(left[i:])                  # at most one of these two is non-empty
    out.extend(right[j:])
    return out

print(merge_sort([5, 3, 8, 1, 9, 2, 7, 4]))   # [1, 2, 3, 4, 5, 7, 8, 9]
```

The slices `a[:mid]` and `a[mid:]` copy data, which keeps the code short. A production version allocates one buffer of size n up front and merges index ranges back and forth, so peak extra memory is exactly O(n).

## Variants

- **Bottom-up merge sort**: no recursion. Merge runs of width 1, then 2, then 4, … until the width reaches n.
- **Linked lists**: split with the fast/slow pointer trick and merge by relinking nodes. No buffer is needed, and merge sort never needs random access, so it is the standard way to sort a linked list in O(n log n).
- **External sorting**: when data is larger than RAM, sort chunks that fit in memory, write them to disk, then do a **k-way merge** of the chunks with a min-heap. Databases do exactly this for big `ORDER BY` queries.
- **Timsort** is a merge sort over natural runs that already exist in the data, which makes it O(n) on sorted input.

## Edge cases and pitfalls

- **Using `<` in the merge** breaks stability.
- **Off-by-one in the split**: with mid = ⌊n / 2⌋, both halves are non-empty for any length ≥ 2, so the recursion always shrinks. A split that can produce an empty half and a full half recurses forever.
- **Small subarrays**: recursing down to size 1 has overhead. Real implementations switch to insertion sort below about 16–32 elements.
- **Memory**: the O(n) buffer is the main reason libraries use quicksort or heapsort variants when stability is not required.

## In the interview

Merge sort shows up directly ("sort a linked list in O(n log n)", "merge k sorted lists") and as a tool. The classic tool question is **counting inversions**: during each merge, whenever you take a value from the right half, every value still waiting in the left half is bigger and earlier, so add the number of values still waiting in the left half to the count. That counts all inversions in O(n log n). Be ready to explain the recursion tree argument, why the merge is stable, and why the space is O(n).
