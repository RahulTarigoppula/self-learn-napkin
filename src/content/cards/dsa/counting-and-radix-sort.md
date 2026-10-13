---
title: Counting Sort and Radix Sort
track: dsa
tags: [sorting, non-comparison, prefix-sums]
difficulty: 2
minutes: 5
tldr: "Counting sort tallies each key, turns the tallies into start positions with prefix sums, and places items in O(n + k). Radix sort runs a stable counting sort once per digit, last digit first."
analogy: "Handing back exams in grade order: count how many A's, B's and C's there are, so the C pile starts after all A's and B's. Then walk through the stack once, dropping each exam at the next free spot in its pile."
diagram: counting-and-radix-sort
story:
  - title: Small integer keys
    text: "Take [3,1,4,1,0,3,1,2]: n = 8 values, all keys between 0 and 4, so k = 5 possible keys. Instead of comparing values we will use each key as an array index. The three 1s are tagged a, b, c so we can watch their order."
  - title: Count each key
    text: "One pass over the input fills a count array with one slot per key: one 0, three 1s, one 2, two 3s, one 4. That pass is O(n), and it never compares two values with each other."
  - title: Prefix sums give start positions
    text: "Turn the counts into a running total of everything before each key (an exclusive prefix sum): start = [0,1,4,5,7]. Key 0 starts at slot 0; the three 1s get slots 1–3, so key 2 starts at slot 4; the two 3s take slots 5–6, so key 4 starts at slot 7."
  - title: Place left to right
    text: "Walk the input from left to right. Put each value at start[key] and then add 1 to start[key]. The 1s arrive as a, b, c, so they land in slots 1, 2, 3 in that same order. That makes the sort stable, which radix sort relies on."
  - title: Radix sort, last digit first
    text: "For bigger numbers, sort by one digit at a time with a stable counting sort (k = 10). Least-significant digit (LSD) radix sort starts with the ones digit: [523,151,342,315,241,512] becomes [151,241,342,512,523,315]."
  - title: Then tens, then hundreds
    text: "Sort by tens, then by hundreds. Because each pass is stable, ties on the current digit keep the order the earlier passes set: 512 stays ahead of 523. After d = 3 passes the list is sorted: O(d·(n + b)) for base b."
keyIdeas:
  - "**Counting sort**: count keys, take prefix sums to get start positions, place items left to right. **O(n + k)** time and space for keys in 0..k−1."
  - "**Prefix sums are what make it stable**: each key gets a contiguous block, filled in input order."
  - "**LSD radix sort**: d stable counting-sort passes on digits in base b, from least significant up, in **O(d·(n + b))**."
  - "**They beat the Ω(n log n) bound** because they never compare keys. That only works for integer-like keys with a small range k or a small number of digits d."
  - "**Bad fit** when k is far larger than n (counting sort over keys up to 10⁹), for arbitrary objects, or when memory is tight."
quiz:
  - q: "The counts for keys 0, 1, 2, 3 are [2, 0, 3, 1]. What are the start positions?"
    options: ["[0, 2, 2, 5]", "[2, 2, 5, 6]", "[0, 2, 5, 6]", "[1, 0, 2, 5]"]
    answer: 0
    why: "Each start is the sum of the counts of all smaller keys: 0, then 0 + 2 = 2, then 2 + 0 = 2, then 2 + 3 = 5. Key 1 has no items, so its empty block starts where key 2's does."
  - q: "Why must each digit pass in LSD radix sort be stable?"
    options: ["To keep each pass O(n), which unstable sorts cannot reach", "So ties on the current digit keep the order the lower digits set", "It need not be; radix sort is correct with any per-digit sort", "To save memory, since a stable pass can reuse the input array"]
    answer: 1
    why: "After sorting by tens, 512 and 523 tie on the hundreds digit. Only a stable pass keeps 512 first, which is the order the earlier passes worked out."
  - q: "How many passes does LSD radix sort need for 32-bit unsigned integers with base 256 (one byte per digit)?"
    options: ["2", "4", "8", "32"]
    answer: 1
    why: "32 bits ÷ 8 bits per digit = 4 digits, so 4 counting-sort passes, each O(n + 256)."
  - q: "You must sort 1,000 integers whose values range up to 1,000,000,000. Is counting sort a good idea?"
    options: ["Yes, because counting sort is always O(n) for integers", "No: the count array needs 10⁹ slots, so k dominates O(n + k)", "Yes, if the integers are distinct, since each count is then 0 or 1", "No, because counting sort only works on single-digit keys"]
    answer: 1
    why: "O(n + k) with k = 10⁹ is a billion steps and gigabytes of memory, versus about 10,000 comparisons for an n log n sort. Radix sort with base 256 would need just 4 passes of O(n + 256)."
bigO:
  - { op: "counting sort", best: "O(n + k)", avg: "O(n + k)", worst: "O(n + k)", note: "O(n + k) extra space, stable" }
  - { op: "LSD radix sort", best: "O(d·(n + b))", avg: "O(d·(n + b))", worst: "O(d·(n + b))", note: "O(n + b) extra space, stable" }
  - { op: "32-bit ints, b = 256", avg: "4 passes", note: "each pass O(n + 256)" }
related: [dsa/sorting-overview, dsa/prefix-sums, dsa/merge-sort, dsa/quicksort]
prereqs: [dsa/sorting-overview]
flashcards:
  - kind: qa
    q: "How does counting sort place items stably?"
    a: "Prefix sums of the counts give each key's first output slot; walk the input left to right, put each item at its key's next slot, and advance that slot."
  - kind: cloze
    text: "LSD radix sort processes digits from the {{least significant}} to the most significant, using a {{stable}} sort for each digit."
  - kind: qa
    q: "Why doesn't counting sort contradict the Ω(n log n) sorting lower bound?"
    a: "The bound applies only to comparison sorts. Counting sort never compares two keys; it uses each key as an array index, which needs integer keys in a known, small range."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Binsort and radix sort modules, redrawn" }
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Counting sort and radix sort" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Sorting without comparing

Every comparison sort needs Ω(n log n) comparisons in the worst case (see the sorting overview). But if keys are **small non-negative integers**, there is a shortcut: use the key itself as an **array index**. An index lookup tells you where a value belongs without comparing it to anything else.

## Counting sort, step by step

Input: n items whose keys are integers in `0..k−1`.

1. **Count**: make an array `count` of k zeros. For each item, `count[key] += 1`. Time O(n).
2. **Prefix sums**: compute `start[v]` = the number of items with a key smaller than v, which is `count[0] + … + count[v−1]`. This is where key v's block begins in the output. Time O(k).
3. **Place**: walk the input **from left to right**. Write each item to `out[start[key]]`, then increase `start[key]` by 1. Time O(n).

Total: **O(n + k)** time and O(n + k) extra space.

### Why it is stable

Each key owns one contiguous block of the output, and the block is filled from left to right in the order items appear in the input. So two items with the same key come out in the same order they went in. This is why we bother with prefix sums. If you only have bare integers you could just write "0 once, 1 three times, …" from the counts, but that throws away any data attached to the keys and cannot be used inside radix sort.

The textbook (CLRS) version computes **inclusive** sums, the number of keys ≤ v, and fills from the **end** of each block while walking the input **right to left**. It is equally stable; it is just the mirror image.

## Worked example: counting sort

Input `[3, 1a, 4, 1b, 0, 3, 1c, 2]`, k = 5:

| key | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| count | 1 | 3 | 1 | 2 | 1 |
| start | 0 | 1 | 4 | 5 | 7 |

Placing left to right: 3 → slot 5, 1a → 1, 4 → 7, 1b → 2, 0 → 0, 3 → 6, 1c → 3, 2 → 4. Output: `[0, 1a, 1b, 1c, 2, 3, 3, 4]`. The three 1s kept their order.

## Radix sort

Counting sort is useless when keys are large: sorting 32-bit integers would need a count array with four billion slots. **Radix sort** fixes this by splitting each key into d digits in base b and running a **stable** counting sort (with k = b) once per digit.

**LSD (least significant digit first)**: sort by the last digit, then the second-to-last, and so on up to the first.

**Why this works**: after the pass on digit t, the list is sorted by the last t digits. The pass on digit t + 1 sorts by that digit; where two numbers tie on it, stability keeps them in the order the previous passes set, which is their order by the lower digits. So after d passes the list is sorted by all d digits.

### Worked example: radix sort

| Pass | Order after the pass |
|---|---|
| input | 523, 151, 342, 315, 241, 512 |
| by ones | 151, 241, 342, 512, 523, 315 |
| by tens | 512, 315, 523, 241, 342, 151 |
| by hundreds | 151, 241, 315, 342, 512, 523 |

In the last pass 512 and 523 tie on the hundreds digit 5; they stay in the order the tens pass gave them (1 before 2), which is correct.

**Cost**: d passes of O(n + b), so **O(d·(n + b))**. For n 32-bit integers with b = 256: 4 passes over the data plus tiny count arrays. Real implementations pick b as a power of two so digits come from shifts and masks.

## Implement it in Python

Radix sort below is just a loop that calls counting sort once per digit, with a `key` function that pulls out that digit.

```python
def counting_sort(a, k, key=lambda x: x):
    """Stable sort of a by key(x); every key must be an int in range(k)."""
    count = [0] * k
    for x in a:
        count[key(x)] += 1
    start, total = [0] * k, 0
    for v in range(k):                   # exclusive prefix sums: first slot of key v
        start[v], total = total, total + count[v]
    out = [None] * len(a)
    for x in a:                          # left to right keeps ties in input order
        out[start[key(x)]] = x
        start[key(x)] += 1
    return out

def radix_sort(a, base=10):
    """LSD radix sort for non-negative integers."""
    if not a:
        return a
    biggest, place = max(a), 1
    while place <= biggest:              # one stable pass per digit
        a = counting_sort(a, base, key=lambda x: x // place % base)
        place *= base
    return a

print(counting_sort([3, 1, 4, 1, 0, 3, 1, 2], 5))    # [0, 1, 1, 1, 2, 3, 3, 4]
print(radix_sort([523, 151, 342, 315, 241, 512]))    # [151, 241, 315, 342, 512, 523]
```

## When they beat comparison sorts

- **Counting sort** wins when k = O(n): exam scores 0–100, ages, ratings, bytes. Then O(n + k) = O(n).
- **Radix sort** wins for many fixed-width keys: integers, IP addresses, fixed-length strings. With d fixed it is linear in n.
- For general data the comparison sorts usually still win in practice: they work in place, need no knowledge of the keys, and a tuned quicksort on a few thousand values is very fast.

## Edge cases and pitfalls

- **Negative numbers**: shift every key by `−min` first, or handle the sign separately in radix sort.
- **Huge range, few items**: k dominates. Counting sort on 1,000 values up to 10⁹ is a terrible idea.
- **Using an unstable inner sort** breaks LSD radix sort completely.
- **Variable-length strings** suit **MSD** (most significant digit first) radix sort, which partitions by the first character and recurses into each bucket.
- **Memory**: both sorts need an O(n) output array; they are not in place.

## In the interview

Typical triggers: "sort values in a known small range", "sort colours 0/1/2", "top-k frequent elements" (bucket by frequency), or "can you do better than n log n?". Say that the lower bound only covers comparison sorts, give O(n + k) and O(d·(n + b)), and state the price: integer-like keys and extra memory. Expect the follow-up "why must each radix pass be stable?"
