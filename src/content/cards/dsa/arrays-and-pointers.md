---
title: Arrays & Pointers
track: dsa
tags: [arrays, two-pointers, fundamentals]
difficulty: 1
minutes: 4
tldr: "An array is contiguous memory with O(1) indexing; two moving pointers turn many O(n²) scans into O(n)."
analogy: "Spending exactly £17 on two gifts from a price-sorted list: start with the cheapest and the dearest. Over budget? Swap the dearest for the next one down. Under? Swap the cheapest for the next one up."
diagram: two-pointers
story:
  - title: One block of memory
    text: "An array of 4-byte integers sits in one unbroken block. If it starts at address 1000, then a[i] lives at 1000 + 4 × i, so a[5] is at 1020. Finding any element is one multiply and one add, whatever the length: that is O(1) indexing."
  - title: Pointers at both ends
    text: "Now a classic question: in this sorted array, find two values that sum to 17. Put L on the smallest value and R on the largest. 1 + 15 = 16, too small. 15 is the biggest partner 1 could ever have, so 1 can never be part of the answer. Drop it: move L right."
  - title: Too big? Move R in
    text: "3 + 15 = 18, too big. Every value left of R is at least 3, so 15 would overshoot with any of them. Drop 15: move R left. Each comparison rules out one value for good, without trying it against anything else."
  - title: Too small again
    text: "3 + 13 = 16, still too small, so 3 is out too and L moves right. The window keeps shrinking from whichever side cannot be in the answer. The array must be sorted, or none of these 'can never' arguments would hold."
  - title: Found in 4 checks
    text: "4 + 13 = 17. Four checks instead of the 28 pairs a nested loop would try. Each check discards one value, so the walk takes at most n − 1 steps: O(n) time and O(1) extra space, instead of O(n²)."
keyIdeas:
  - "**Contiguity is the whole trick**: the address of `a[i]` is base + i × element size, so any index costs one multiply and one add."
  - "**Inserting or deleting in the middle is O(n)** because everything after the gap must shift; appending to a dynamic array is amortised O(1)."
  - "**Two pointers** on sorted data: each comparison discards one element for good, so the walk is O(n) instead of checking all n²/2 pairs."
  - "**Cache locality** makes arrays faster than linked lists in practice far more often than the Big-O suggests."
  - "**Two pointers, sliding window and prefix sums** are the three moves most array questions want."
quiz:
  - q: "Sorted array, looking for a pair summing to 20. Currently a[L] = 4 and a[R] = 18, so the sum is 22. What do you do?"
    options: ["Move L right", "Move R left", "Move both pointers", "Restart from the ends"]
    answer: 1
    why: "22 is too big. Every remaining partner for 18 is at least 4, so 18 can never reach exactly 20 — discard it by moving R left. Moving L right would only make the sum bigger."
  - q: "An int array starts at address 2000 and each int takes 4 bytes. Where is a[10]?"
    options: ["2010", "2040", "2044", "It depends on the other elements"]
    answer: 1
    why: "Address = base + i × size = 2000 + 10 × 4 = 2040. That one calculation is why indexing is O(1)."
  - q: "Why does inserting at the front of an array of n elements cost O(n)?"
    options: ["The array must be re-sorted", "Every existing element shifts one slot to the right", "The memory must be freed first", "Indexing becomes O(n) afterwards"]
    answer: 1
    why: "Contiguous storage has no gaps, so making room at index 0 means moving all n elements up by one place."
bigO:
  - { op: "index",  avg: "O(1)" }
  - { op: "search (unsorted)", avg: "O(n)" }
  - { op: "insert/delete at end", avg: "O(1)", note: "amortised, dynamic array" }
  - { op: "insert/delete in middle", avg: "O(n)", note: "everything after it shifts" }
  - { op: "pair sum, two pointers", avg: "O(n)", note: "on a sorted array, O(1) extra space" }
related: [dsa/big-o-basics, dsa/binary-search]
prereqs: [dsa/big-o-basics]
flashcards:
  - kind: qa
    q: "Why is inserting into the middle of an array O(n) but appending amortised O(1)?"
    a: "Insertion shifts every later element; appending writes one slot and only occasionally pays for a doubling copy, which amortises to constant."
  - kind: cloze
    text: "The two-pointer technique needs the array to be {{sorted}} before the pointers can move meaningfully."
  - kind: qa
    q: "In the sorted pair-sum walk, L + R is too big. Why is it safe to move R left?"
    a: "Every remaining value is at least a[L], so a[R] would overshoot with any partner. It can never be in the answer, so it is discarded."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Array-based lists, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How an array works

An **array** stores its elements side by side in one contiguous block of memory, all of the same size. If the block starts at address `base` and each element takes `s` bytes, element `i` lives at:

```
address(a[i]) = base + i × s
```

That is why indexing is **O(1)**: the machine does one multiply and one add, then reads memory, whether the array holds ten items or ten million. It is also why arrays count from 0 — index 0 means "zero steps from the start".

The price of contiguity is that the block has no gaps. To **insert** at index i you must shift every element from i onwards one slot to the right; to **delete** you shift them back. Both are O(n) in the worst case (inserting at the front moves everything).

### Dynamic arrays and amortised O(1) append

A fixed block cannot grow in place, so a **dynamic array** (Python `list`, Java `ArrayList`, C++ `vector`) keeps spare capacity. Appending writes into the next free slot — O(1). When the block is full it allocates a new block, typically double the size, and copies everything across — O(n), but rare. Doubling means the copies for n appends total 1 + 2 + 4 + … < 2n, so all n appends cost fewer than 3n writes: **amortised O(1)** per append. Growing by a fixed amount (say +10 slots) instead would make n appends cost O(n²).

### Why arrays are fast in practice

CPUs load memory in cache lines, typically 64 bytes, so reading one 4-byte int brings up to 15 of its neighbours into the cache for free. Scanning an array streams through memory; walking a linked list jumps to scattered addresses. Both scans are O(n), but the array is often several times faster.

## The two-pointer technique

Many array problems ask about *pairs*. Checking every pair is n(n − 1)/2 comparisons — O(n²). **Two pointers** replace that with one pass when the data has order to exploit.

For **pair sum on a sorted array**: put `L` at the smallest element and `R` at the largest, and look at `a[L] + a[R]`:

- **Equal to the target** — done.
- **Too small** — `a[R]` is the largest partner `a[L]` could ever have, and it still falls short, so `a[L]` cannot be in any answer. Move `L` right.
- **Too big** — `a[L]` is the smallest partner `a[R]` could have, and it still overshoots, so `a[R]` cannot be in any answer. Move `R` left.

Every step permanently discards one element, so after at most n − 1 steps the pointers meet. The invariant that makes this correct: *if an answer exists, both of its elements are still between L and R.*

## Worked example

Find a pair summing to 17 in `[1, 3, 4, 6, 8, 11, 13, 15]`:

| Step | L | R | a[L] + a[R] | Verdict | Move |
|---|---|---|---|---|---|
| 1 | 0 | 7 | 1 + 15 = 16 | too small | L → 1 |
| 2 | 1 | 7 | 3 + 15 = 18 | too big | R → 6 |
| 3 | 1 | 6 | 3 + 13 = 16 | too small | L → 2 |
| 4 | 2 | 6 | 4 + 13 = 17 | found | — |

Four checks instead of 28 pairs.

## In code

```python
def pair_with_sum(a, target):
    """a is sorted ascending. Return (i, j) with i < j and a[i] + a[j] == target, or None."""
    lo, hi = 0, len(a) - 1
    while lo < hi:                 # lo == hi would pair an element with itself
        s = a[lo] + a[hi]
        if s == target:
            return lo, hi
        if s < target:
            lo += 1                # a[lo] is too small even with the largest partner left
        else:
            hi -= 1                # a[hi] is too big even with the smallest partner left
    return None

print(pair_with_sum([1, 3, 4, 6, 8, 11, 13, 15], 17))   # (2, 6)
```

## Edge cases and pitfalls

- **Unsorted input.** The "can never be in the answer" argument needs sorted order. Either sort first (O(n log n), and you lose the original indices unless you carry them along) or use a hash set: one pass, O(n) time, O(n) extra space.
- **`lo < hi`, not `lo <= hi`**, unless the problem lets you use the same element twice.
- **Off-by-one at the end.** The last valid index is `len(a) - 1`.
- **Duplicates.** If the question wants *all* distinct pairs, skip over equal neighbours after a match, or you will report the same pair twice.
- **Empty or one-element arrays** must return "no pair" without indexing out of range — the `while lo < hi` guard handles both.

## Related moves

- **Sliding window**: two pointers moving the *same* direction to maintain a range (longest substring without repeats, smallest subarray with sum ≥ k).
- **Fast and slow pointers**: one pointer reads, one writes — removing duplicates from a sorted array in place in O(n).
- **Prefix sums**: precompute `p[i] = a[0] + … + a[i−1]`, then any range sum is `p[j] − p[i]` in O(1).

## In the interview

When you hear "sorted array" and "pair", "triplet" or "closest", reach for two pointers and say why it is correct: each step rules out one element. Three-sum is the usual follow-up: sort, fix one element, and run the two-pointer walk on the rest — O(n²) instead of O(n³). If the array is not sorted and you need original indices, offer the hash-set solution and state its O(n) space cost.
