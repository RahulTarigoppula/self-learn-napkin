---
title: Sorting Algorithms Overview
track: dsa
tags: [sorting, lower-bound, stability]
difficulty: 2
minutes: 5
tldr: "Sorts that only compare pairs can never beat n log n comparisons in the worst case; sorts that read the keys directly can. Pick by stability, memory and input shape."
analogy: "Ordering a deck of exam papers: you can compare two papers at a time (comparison sort), or drop each paper into the pigeonhole for its grade and collect the holes in order (counting sort) without ever comparing two papers."
diagram: sorting-overview
story:
  - title: Two families
    text: "Every sorting algorithm belongs to one of two families. Comparison sorts (bubble, insertion, merge, quick, heap) learn about the data only by asking 'is a < b?'. Non-comparison sorts (counting, radix, bucket) look inside the key itself, for example at its digits, so they only work for keys like small integers or fixed-length strings."
  - title: A comparison sort is a tree of questions
    text: "Trace any comparison sort on three items a, b, c and write down the questions it asks. Each answer picks a branch, and the next question can depend on it. The result is a decision tree: one root-to-leaf path for every possible input order."
  - title: n! orders force about n log n questions
    text: "Three items have 3! = 6 possible orders, and each needs its own leaf. A binary tree with height h has at most 2^h leaves, so 2^h ≥ 6 and h ≥ log₂ 6 ≈ 2.6: some input costs 3 comparisons. For n items, h ≥ log₂ n! ≈ n log₂ n − 1.44n. That is the Ω(n log n) lower bound."
  - title: Stability
    text: "A sort is stable if equal keys come out in the order they went in: the blue 2 was before the orange 2, so it stays before it. That lets you sort by one field, then by another, and keep the first order inside each group of ties. Merge, insertion, counting and radix are stable; quicksort and heapsort are not."
  - title: What libraries actually use
    text: "Real libraries use hybrids. Python, Java (for objects) and V8's JavaScript use Timsort: merge sort over naturally sorted runs, with insertion sort for short ones. C++ std::sort uses introsort: quicksort that switches to heapsort if recursion gets too deep, plus insertion sort for tiny ranges."
keyIdeas:
  - "**Ω(n log n) is a floor for comparison sorts** in the worst and average case: a decision tree needs n! leaves, so its height is at least log₂ n! ≈ n log₂ n."
  - "**Counting and radix sort escape the bound** because they never compare two keys; they cost O(n + k) and O(d·(n + b)) but need small integer-like keys."
  - "**Stable** = ties keep their input order. **In place** = only O(1) (or O(log n)) extra memory beyond the input."
  - "**Merge sort** guarantees O(n log n) and stability but needs O(n) extra space; **quicksort** is in place and fastest on average but O(n²) worst; **heapsort** is in place and O(n log n) worst but not stable."
  - "**Libraries ship hybrids**: Timsort (stable, O(n) on sorted input) and introsort (quicksort speed with a heapsort safety net)."
quiz:
  - q: "Why can no comparison-based sort guarantee fewer than about n log₂ n comparisons in the worst case?"
    options: ["Swaps are expensive, so each one must be counted as log n", "A decision tree needs n! leaves, so its height is at least log₂ n!", "Recursion is log n levels deep, and each level costs n comparisons", "Every element must be moved at least log n times, so n log n"]
    answer: 1
    why: "Each input order must reach a different leaf, so the tree has at least n! leaves. A binary tree of height h has at most 2^h leaves, so h ≥ log₂ n!, which is about n log₂ n − 1.44n."
  - q: "You sort employees by name, then sort the result by department with a stable sort. How are people ordered inside each department?"
    options: ["Alphabetically by name", "In random order", "By their original input order", "Reverse alphabetically"]
    answer: 0
    why: "Within one department all keys tie, and a stable sort keeps tied items in the order they arrived in, which was alphabetical after the first sort."
  - q: "C++ std::sort is quicksort-based, yet guarantees O(n log n) comparisons. How?"
    options: ["It always picks the true median as pivot, found by sorting", "It checks if the input is sorted first and skips those cases", "It switches to heapsort once recursion depth passes about 2·log₂ n", "It uses counting sort for integer keys, so most inputs are linear time"]
    answer: 2
    why: "Introsort tracks recursion depth. Bad pivots make the recursion deep, so when it passes a limit of about 2·log₂ n the current range is finished with heapsort, which is O(n log n) in the worst case."
  - q: "Timsort is the built-in sort in Python, in Java (for objects) and in V8. How many comparisons does it make on an already-sorted list of 1,000 numbers?"
    options: ["999, one comparison per neighbouring pair", "About 8,530, the log₂(1000!) lower bound", "About 10,000, as for any n log n sort", "499,500, one for every pair of values"]
    answer: 0
    why: "Timsort first scans for runs of already-ordered values. The whole list is one run, found with 999 neighbour comparisons, and there is nothing left to merge."
bigO:
  - { op: "bubble sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", note: "O(1) space, stable (best case needs early exit)" }
  - { op: "insertion sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", note: "O(1) space, stable, adaptive" }
  - { op: "merge sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", note: "O(n) space, stable" }
  - { op: "quicksort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", note: "O(log n) stack, not stable" }
  - { op: "heapsort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", note: "O(1) space, not stable" }
  - { op: "counting sort", best: "O(n + k)", avg: "O(n + k)", worst: "O(n + k)", note: "O(n + k) space, stable; keys in 0..k−1" }
  - { op: "radix sort (LSD)", best: "O(d·(n + b))", avg: "O(d·(n + b))", worst: "O(d·(n + b))", note: "O(n + b) space, stable; d digits in base b" }
bigOTitle: "The sorting cheat sheet"
related: [dsa/insertion-sort, dsa/merge-sort, dsa/quicksort, dsa/counting-and-radix-sort]
prereqs: [dsa/big-o-basics]
flashcards:
  - kind: qa
    q: "State the comparison-sort lower bound and the one-line reason for it."
    a: "Ω(n log n) comparisons. The decision tree must have a leaf for each of the n! input orders, so its height is at least log₂ n! ≈ n log₂ n."
  - kind: cloze
    text: "A sort is {{stable}} if records with equal keys keep their {{original relative order}}."
  - kind: qa
    q: "Which sorts are stable: merge, quick, heap, insertion, counting?"
    a: "Merge, insertion and counting sort. Standard quicksort and heapsort move elements over long distances and can reorder equal keys."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Sorting lower bound and recursion chapters" }
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Sorting chapter" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Two families of sorts

A **comparison sort** treats keys as black boxes. The only thing it may do with two keys is ask which one is smaller. Bubble, insertion, selection, merge, quick and heap sort are all comparison sorts. Because they only need a "less than" test, they work on anything you can order: numbers, strings, dates, tuples, custom objects.

A **non-comparison sort** (also called a distribution sort) looks *inside* each key. Counting sort uses the key as an array index; radix sort processes the key one digit at a time; bucket sort maps keys to buckets by value range. They can be faster than any comparison sort, but only for keys with that structure, such as integers in a known range or fixed-length strings.

## Why comparison sorts cannot beat n log n

Fix n and any comparison sort. Run it on every possible order of n distinct items and record the sequence of yes/no answers it gets. Draw this as a binary **decision tree**: each internal node is a comparison, each edge an answer, each leaf a finished output order.

1. Different input orders need different rearrangements to become sorted, so **every one of the n! orders must end at its own leaf**. If two orders reached the same leaf, the algorithm would apply the same rearrangement to both, and at least one would come out wrong.
2. A binary tree of height h has **at most 2^h leaves**.
3. So 2^h ≥ n!, which means **h ≥ log₂ n!**. The height is the number of comparisons on the worst input.

How big is log₂ n!? The largest n/2 factors of n! are each at least n/2, so n! ≥ (n/2)^(n/2) and log₂ n! ≥ (n/2)·log₂(n/2), which is Ω(n log n). Stirling's formula gives the precise value: log₂ n! ≈ n log₂ n − 1.44n.

| n | n! orders | log₂ n! (minimum worst-case comparisons) |
|---|---|---|
| 3 | 6 | 2.58 → 3 |
| 8 | 40,320 | 15.3 → 16 |
| 1,000 | ≈ 4 × 10^2567 | ≈ 8,530 |

The same argument bounds the **average** case, because the average depth of a leaf in a binary tree with L leaves is at least log₂ L. Merge sort and heapsort reach the bound up to a constant factor, so they are **asymptotically optimal** comparison sorts.

Counting and radix sort do not contradict this: they never compare two keys, so the decision-tree model does not describe them. They pay for it by assuming something about the keys.

## Stability and in-place

- **Stable**: items with equal keys come out in the same relative order they went in. This matters when records carry more than the key. Sort orders by date, then *stably* by customer, and each customer's orders stay in date order. Python's `sort` and Java's object sort are guaranteed stable for exactly this reason.
- **In place**: the sort uses only O(1) extra memory beyond the input (quicksort's O(log n) recursion stack is usually accepted as "in place" too). Merge sort on arrays needs an O(n) buffer, so it is not in place.
- **Adaptive**: runs faster when the input is already partly sorted. Insertion sort and Timsort are adaptive; heapsort is not.

Any sort can be made stable by sorting (key, original index) pairs instead of bare keys, at the cost of extra memory.

## Choosing a sort

| Situation | Good choice | Why |
|---|---|---|
| General purpose, in a real program | the library sort | tuned hybrid, well tested |
| Need stability and a guaranteed O(n log n) | merge sort / Timsort | stable, no bad inputs |
| Tight memory, need a worst-case guarantee | heapsort (or introsort) | O(1) extra space, O(n log n) worst |
| Fastest in practice on random arrays | quicksort with a random or median-of-3 pivot | cache-friendly, small constants |
| Tiny or nearly sorted input | insertion sort | O(n + inversions) |
| Integer keys in a small range 0..k−1 | counting sort | O(n + k), no comparisons |
| Fixed-width integers or strings, many of them | radix sort | O(d·(n + b)) |
| Linked list | merge sort | needs no random access or extra array |

## What libraries actually use

- **Timsort** (Python's `list.sort`, Java's `Arrays.sort` for objects and `Collections.sort`, V8's `Array.prototype.sort`). It scans the input for **runs** that are already ascending (or strictly descending, which it reverses), extends short runs to a minimum length of about 32–64 with **binary insertion sort**, and merges runs with a stack of rules that keeps merges balanced. It is stable, O(n log n) in the worst case, and **O(n) on sorted input**. Real data is often partly sorted, which is why it wins. Since Python 3.11, CPython chooses merges with the closely related Powersort policy.
- **Introsort** (typical C++ `std::sort`). Quicksort with median-of-3 pivots, but it counts recursion depth: past about 2·log₂ n it finishes that range with **heapsort**, which caps the worst case at O(n log n). Ranges below about 16 elements are left for a final **insertion sort** pass. Not stable; `std::stable_sort` is a merge sort.
- **Dual-pivot quicksort** for Java's primitive arrays (stability is meaningless for identical ints) and **pdqsort**, an introsort descendant, in Go since 1.19.

## Implement it in Python

Two small experiments with the built-in sort. The first shows stability making a two-key sort work; the second counts Timsort's comparisons and puts them next to the theoretical floor.

```python
import math, random
from functools import cmp_to_key

people = [("Ana", "ops"), ("Raj", "dev"), ("Bo", "dev"), ("Cy", "ops")]
by_dept = sorted(sorted(people), key=lambda p: p[1])  # stable: names stay A-Z within a dept
print(by_dept)  # [('Bo', 'dev'), ('Raj', 'dev'), ('Ana', 'ops'), ('Cy', 'ops')]

def count_compares(xs):
    n = 0
    def cmp(a, b):
        nonlocal n
        n += 1
        return (a > b) - (a < b)
    sorted(xs, key=cmp_to_key(cmp))
    return n

xs = list(range(1000))
print(count_compares(xs))                        # 999: one ascending run
random.shuffle(xs)
print(count_compares(xs))                        # about 8,650 on a random order
print(math.ceil(math.log2(math.factorial(1000))))  # 8530: no comparison sort can do better
```

## Edge cases and pitfalls

- **"Non-comparison sorts break the n log n barrier"** is true only for restricted keys. For arbitrary comparable objects the lower bound stands.
- **Quicksort is not stable**, so never rely on tie order from a hand-written quicksort.
- **The O(log n) stack of quicksort** is only guaranteed if you recurse into the smaller part first and loop on the larger part; otherwise a bad pivot sequence can recurse n deep.
- **Big-O hides constants**: insertion sort beats merge sort below a few dozen elements, which is why every hybrid uses it for small ranges.

## In the interview

You will rarely be asked to "implement a sort" without a twist. Expect "which sort would you use here and why" or "can you sort this faster than n log n?". A strong answer names the trade-off (stability, memory, worst case, input shape), cites the Ω(n log n) decision-tree bound, and then points out when the keys allow counting or radix sort. A common follow-up: *what does your language's built-in sort do?* Answer: Timsort or introsort, with one sentence on why.
