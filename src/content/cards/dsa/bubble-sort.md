---
title: Bubble Sort
track: dsa
tags: [sorting, comparison]
difficulty: 1
minutes: 3
tldr: "Repeatedly swap neighbours that are out of order; after pass k the largest k values have bubbled to the end."
analogy: "Lining up children by height, but each child may only swap with the one next to them. The tallest keeps winning swaps and drifts to the end of the line first, like a bubble rising."
diagram: bubble-sort
story:
  - title: Eight values in a row
    text: "Take [5,3,8,1,9,2,7,4]. Bubble sort only ever does one thing: look at two neighbours and swap them if the left one is bigger. No jumping, no extra array — everything happens in place."
  - title: Compare the first pair
    text: "Start at the left: 5 > 3, so swap them. Then step one place right and compare 5 with 8, then 8 with 1, and so on to the end. One sweep from left to right is called a pass; for 8 values it makes 7 comparisons."
  - title: The 9 rides to the end
    text: "Watch the 9. Once a pass reaches it, the 9 is bigger than every neighbour it meets, so it wins every comparison and is carried all the way right. After pass 1 the largest value is parked in its final place, after 5 swaps."
  - title: Each pass parks one more
    text: "Pass 2 carries the 8 next to the 9, pass 3 the 7, pass 4 the 5. Each pass can stop one place earlier because the green tail is already final, so the passes make 7, 6, 5, 4 … comparisons — about n²/2 in total, which is O(n²)."
  - title: A clean pass means stop
    text: "Pass 5 makes 3 comparisons and no swaps, so the array must be sorted and we stop early. Total: 25 comparisons and 14 swaps — exactly the number of out-of-order pairs. That swapped flag is why already-sorted input costs only O(n)."
keyIdeas:
  - "**Each pass parks one more maximum** at the end, so the inner loop shrinks by one every pass."
  - "**Swaps = inversions**: every swap fixes exactly one out-of-order pair — 14 for `[5,3,8,1,9,2,7,4]`."
  - "**Early exit**: a pass with no swaps proves the array is sorted, giving an O(n) best case."
  - "**Stable and in place**: equal values never swap (the test is a strict `>`), and only O(1) extra memory is used."
  - "**Never use it in production** — it is O(n²) on average; it exists to teach invariants, stability and inversions."
quiz:
  - q: "After the first pass of bubble sort over [4, 1, 3, 2], what does the array look like?"
    options: ["[1, 2, 3, 4]", "[1, 3, 2, 4]", "[1, 4, 3, 2]", "[4, 3, 2, 1]"]
    answer: 1
    why: "4 > 1 swap → [1,4,3,2]; 4 > 3 swap → [1,3,4,2]; 4 > 2 swap → [1,3,2,4]. The 4 rode to the end, but 3 and 2 are still out of order."
  - q: "How many swaps does bubble sort make on [3, 2, 1]?"
    options: ["1", "2", "3", "6"]
    answer: 2
    why: "Swaps equal inversions — out-of-order pairs. (3,2), (3,1) and (2,1) are all inverted, so exactly 3 swaps."
  - q: "Why is bubble sort stable?"
    options: ["It uses extra memory to remember positions", "It only swaps when the left value is strictly bigger, so equal values never pass each other", "It sorts from right to left", "It always makes n² comparisons"]
    answer: 1
    why: "Two equal values are never swapped, and every move is between neighbours, so one can never jump over the other. Their original order survives."
bigO:
  - { op: "compare", best: "O(n)", avg: "O(n²)", worst: "O(n²)", note: "best case needs the early-exit flag" }
  - { op: "swap",    best: "0",    avg: "O(n²)", worst: "O(n²)" }
  - { op: "space",   avg: "O(1)",  note: "in place, stable" }
related: [dsa/big-o-basics]
prereqs: [dsa/arrays-and-pointers]
griddle: bubble-sort
special: true
flashcards:
  - kind: qa
    q: "When is bubble sort O(n), and what does that require?"
    a: "On already-sorted input, but only if the implementation keeps a 'swapped' flag and exits after a clean pass."
  - kind: cloze
    text: "Bubble sort is {{stable}} and {{in place}}, which is the only reason anyone still mentions it."
  - kind: qa
    q: "How many swaps does bubble sort make on [5,3,8,1,9,2,7,4], and why that number?"
    a: "14. Each swap fixes exactly one out-of-order pair (an inversion), and the array starts with 14 of them."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Sorting chapter, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Bubble sort repeatedly walks through the array comparing **adjacent** elements, swapping any pair where the left one is bigger. One left-to-right walk is a **pass**.

Why does that sort anything? Follow the largest value. Wherever it starts, once the pass reaches it, it is bigger than its right-hand neighbour, so it swaps; then it is compared with the next neighbour, swaps again, and so on to the end. So after pass 1 the maximum is in the last slot — its final position.

That gives the **invariant**: *after pass k, the last k positions hold the k largest values in sorted order.* Pass k + 1 therefore only needs to run over the first n − k elements. After n − 1 passes everything is in place.

Two improvements are standard:

- **Shrinking boundary**: pass k compares only up to position n − k, because the tail is already final.
- **Early exit**: if a whole pass makes **no swaps**, every neighbouring pair is in order, which means the array is sorted. Stop.

## Worked example

`[5, 3, 8, 1, 9, 2, 7, 4]`, n = 8:

| Pass | Array after the pass | Comparisons | Swaps |
|---|---|---|---|
| 1 | 3 5 1 8 2 7 4 **9** | 7 | 5 |
| 2 | 3 1 5 2 7 4 **8 9** | 6 | 4 |
| 3 | 1 3 2 5 4 **7 8 9** | 5 | 3 |
| 4 | 1 2 3 4 **5 7 8 9** | 4 | 2 |
| 5 | unchanged | 3 | 0 → stop |

Total: **25 comparisons and 14 swaps**. Pass 4 actually finished the job, but the algorithm only *knows* the array is sorted after pass 5 makes no swaps.

### Swaps equal inversions

An **inversion** is a pair of positions i < j with a[i] > a[j]. Swapping two out-of-order neighbours fixes exactly that one pair and leaves every other pair's order unchanged, so each swap removes exactly one inversion. A sorted array has none, so the number of swaps is exactly the number of inversions you started with. For our array: 5 is inverted with 3, 1, 2, 4 (four pairs); 3 with 1, 2 (two); 8 with 1, 2, 7, 4 (four); 9 with 2, 7, 4 (three); 7 with 4 (one). 4 + 2 + 4 + 3 + 1 = 14.

## In code

```python
def bubble_sort(a):
    """Sorts list a in place and returns it."""
    n = len(a)
    for end in range(n - 1, 0, -1):     # a[end+1:] already holds the largest values
        swapped = False
        for i in range(end):            # compare a[i] with a[i+1] for i < end
            if a[i] > a[i + 1]:         # strict > keeps equal values in order (stable)
                a[i], a[i + 1] = a[i + 1], a[i]
                swapped = True
        if not swapped:                 # a clean pass: every neighbour pair is in order
            break
    return a

print(bubble_sort([5, 3, 8, 1, 9, 2, 7, 4]))   # [1, 2, 3, 4, 5, 7, 8, 9]
```

## Complexity

- **Worst case** — a reversed array: every pair is an inversion, so there are n(n − 1)/2 comparisons and the same number of swaps. O(n²).
- **Average case** — a random array has n(n − 1)/4 inversions on average, so still O(n²) swaps.
- **Best case** — an already-sorted array: one pass of n − 1 comparisons, no swaps, exit. O(n), but **only with the early-exit flag**.
- **Space** — O(1): it sorts in place.

## Edge cases and pitfalls

- **Forgetting the flag** makes the best case O(n²) too. Say "with early exit" when you claim O(n).
- **Off-by-one in the inner loop**: comparing `a[i]` with `a[i + 1]` means `i` must stop one short of the boundary, or you read past the end.
- **Using `>=` instead of `>`** still sorts, but swaps equal values and so breaks stability.
- **Small values move slowly.** A small value at the far right moves only one place left per pass (a "turtle"), which is why a nearly-sorted array with one misplaced small value still costs many passes.

## Trade-offs

Bubble sort is easy to reason about and stable, and that is all. **Insertion sort** is also O(n²) in the worst case and O(n) on sorted input, but it shifts elements instead of swapping them, so it does fewer writes and is usually faster; real libraries use it for very short runs. For anything non-trivial, use the language's built-in sort (Timsort in Python and Java for objects: O(n log n) worst case, stable).

## In the interview

You will rarely be asked to use bubble sort, but you may be asked to analyse it. Be ready to state the invariant (the tail is final after each pass), to explain why the best case needs the swapped flag, and to connect swaps to inversions. A good follow-up answer: "counting inversions in O(n log n) is a modified merge sort".
