---
title: Intervals
track: dsa
tags: [intervals, sorting, sweep-line, heaps]
difficulty: 2
minutes: 5
tldr: "Sort intervals by start, then sweep left to right. Overlap means a.start < b.end and b.start < a.end. Merging, inserting and counting meeting rooms all fall out of that one pass."
analogy: "A diary of meetings. Laid out in start-time order, you only ever need to compare each meeting with the one block you are currently in, never with the whole week."
diagram: intervals
story:
  - title: Intervals sorted by start
    text: "Four meetings: [1,3], [2,6], [8,10], [15,18], drawn as bars on a timeline and sorted by start time. Sorting first costs O(n log n) and does most of the work: after it, anything that overlaps the current bar must come right after it in the list."
  - title: The overlap test
    text: "Two intervals overlap exactly when each one starts before the other ends: a.start < b.end and b.start < a.end. For [1,3] and [2,6]: 1 < 6 and 2 < 3, so they share the stretch from 2 to 3. If either test fails, one interval is completely before the other."
  - title: Merge while they overlap
    text: "Walk the sorted list keeping the last merged block. [2,6] starts at 2, which is not after the block's end 3 (touching intervals merge too, so the test here is start ≤ end), so the block grows to [1, max(3, 6)] = [1,6]. [8,10] starts after 6: start a new block. Same for [15,18]. Result: [1,6], [8,10], [15,18] in one pass."
  - title: Meeting rooms, by sweeping
    text: "How many rooms do these meetings need? Turn each meeting into two events: +1 at its start, −1 at its end. Sort all events by time and sweep, keeping a running count. The violet line is the number of rooms in use at each moment."
  - title: The peak is the answer
    text: "The count peaks at 2, between times 2 and 3, so 2 rooms suffice and are necessary. Equivalent method: sort by start and keep a min-heap of end times; if the earliest-ending room is free by the next start, reuse it, otherwise open a new one."
keyIdeas:
  - "**Sort by start** first. Then an interval can only overlap the block just before it, so one linear pass is enough. Total O(n log n)."
  - "**Overlap test:** `a.start < b.end and b.start < a.end`. Its negation is \"one ends before the other starts\"."
  - "**Merge:** extend the last block with `max(last.end, cur.end)`, since a later interval may be entirely inside it."
  - "**Meeting rooms:** the answer is the maximum number of intervals alive at once, found by a sweep of ±1 events or a min-heap of end times."
  - "Decide if intervals are **closed or half-open**: do [1,3] and [3,5] overlap? Ask the interviewer and be consistent."
quiz:
  - q: "What does merging [[1,4], [2,3], [6,8]] produce?"
    options: ["[[1,3], [6,8]]", "[[1,4], [6,8]]", "[[1,8]]", "[[1,4], [2,3], [6,8]]"]
    answer: 1
    why: "[2,3] lies inside [1,4]. The block becomes [1, max(4, 3)] = [1,4]; using the new end 3 instead of the max would wrongly shrink it. [6,8] starts after 4, so it stays separate."
  - q: "Meetings [0,30], [5,10], [15,20]. What is the minimum number of rooms?"
    options: ["1", "2", "3", "4"]
    answer: 1
    why: "[5,10] and [15,20] each overlap [0,30] but not each other, so at most two meetings run at once. The second room is reused at 15 because [5,10] has ended."
  - q: "With half-open intervals [start, end), do a = [5, 8) and b = [8, 10) overlap?"
    options: ["Yes, they share the point 8, so they overlap", "No: b.start < a.end is 8 < 8, which is false", "Only if the list is sorted by start first", "It depends on their lengths, since b is shorter"]
    answer: 1
    why: "a ends at 8 and b starts at 8, so a meeting can end and the next begin in the same room. The strict < makes back-to-back intervals non-overlapping."
  - q: "Why is the list sorted by start before merging?"
    options: ["Without sorting, the merged result would not be unique", "Each interval can then only overlap the last merged block", "It lets merging run in O(log n) by binary searching blocks", "Sorting by end would make the overlap test itself wrong"]
    answer: 1
    why: "Every earlier interval starts no later than the current one. If the current one does not reach the block's end, nothing before the block can reach it either, so comparing with the last block is enough."
bigO:
  - { op: "merge intervals", avg: "O(n log n)", note: "sort + one O(n) pass" }
  - { op: "insert into sorted, disjoint list", avg: "O(n)", note: "no sort needed" }
  - { op: "meeting rooms (heap or sweep)", avg: "O(n log n)", note: "O(n) extra space" }
  - { op: "do any two overlap?", avg: "O(n log n)", note: "sort, compare neighbours" }
related: [dsa/heaps, dsa/sorting-overview, dsa/greedy-algorithms, dsa/prefix-sums]
prereqs: [dsa/sorting-overview, dsa/heaps]
flashcards:
  - kind: qa
    q: "Write the condition for two intervals a and b to overlap."
    a: "a.start < b.end and b.start < a.end (use ≤ instead if touching endpoints count as overlapping, as with closed intervals)."
  - kind: cloze
    text: "The minimum number of meeting rooms equals the {{maximum number of meetings in progress at the same time}}."
  - kind: qa
    q: "In the min-heap solution to meeting rooms, what does the heap hold and when do you pop?"
    a: "The end times of rooms in use. Before placing a meeting, if the smallest end time is ≤ its start, that room is free: replace its end time. The heap's final size is the answer."
sources:
  - { name: "Tech Interview Handbook", url: "https://github.com/yangshun/tech-interview-handbook", licence: "MIT", note: "Interval techniques, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

An **interval** is a pair `[start, end]` describing a stretch of time, positions on a line, or any other one-dimensional range. Interval questions (merge overlapping ranges, insert a new one, find the rooms a set of meetings needs) look different but share one recipe: **sort by start, then sweep left to right**.

### The overlap test

Two intervals `a` and `b` are **disjoint** exactly when one finishes before the other begins: `a.end <= b.start` or `b.end <= a.start`. Negate that and you get the overlap test:

```
overlap(a, b)  ⇔  a.start < b.end  and  b.start < a.end
```

Partial overlap on either side, one inside the other, identical intervals: every case passes this test, and no disjoint pair does. No case analysis needed.

**Closed or half-open?** With **half-open** intervals `[start, end)`, the usual model for meetings, `[1,3)` and `[3,5)` do *not* overlap: one meeting ends as the next begins. With **closed** intervals `[1,3]` and `[3,5]` share the point 3, so use `<=`. Problems like "merge intervals" usually merge touching intervals; meeting-room problems usually do not count them as a clash. Ask, then be consistent.

### Why sort by start

After sorting by start, every interval begins no earlier than all the ones before it. So when you hold a merged **block** `[s, e]` and look at the next interval `[s2, e2]`:

- If `s2 <= e`, it overlaps (or touches) the block: extend `e = max(e, e2)`.
- If `s2 > e`, it starts after the block ends. Every later interval starts at `s2` or later, so it cannot reach this block either: the block is final.

That makes merging one comparison per interval. The `max` matters: `[2,3]` inside `[1,4]` must not shrink the block to `[1,3]`.

### Insert interval

If the list is already **sorted and disjoint**, inserting `[s, e]` needs no sort, just three phases in one O(n) pass: copy intervals that end before `s`; absorb every interval that starts at or before `e` into the new one (taking min of starts, max of ends); copy the rest.

### Meeting rooms: maximum overlap

The fewest rooms that can host all meetings equals the **maximum number of meetings in progress at any instant**. Fewer rooms cannot work at that instant, and that many is always enough because a free room can be reused. Two ways to compute it:

- **Sweep line:** make events `(start, +1)` and `(end, −1)`, sort them, and keep a running total. The peak is the answer (this is a prefix sum over the ±1 events). On ties, process ends before starts so back-to-back meetings share a room. Sorting tuples does this for free because `−1 < +1`.
- **Min-heap of end times:** sort meetings by start. Keep a min-heap holding the end time of every room in use. For each meeting, if the earliest end `≤` its start, that room is free: replace its end time. Otherwise push a new room. The heap's size at the end is the answer.

## Worked example

Input (unsorted): `[[8,10], [1,3], [15,18], [2,6]]`. Sorted by start: `[1,3], [2,6], [8,10], [15,18]`.

**Merge:**

| Interval | Last block | Overlaps? | Blocks after |
|---|---|---|---|
| [1,3] | (none) | n/a | [1,3] |
| [2,6] | [1,3] | 2 ≤ 3 yes | [1,6] |
| [8,10] | [1,6] | 8 > 6 no | [1,6], [8,10] |
| [15,18] | [8,10] | 15 > 10 no | [1,6], [8,10], [15,18] |

**Insert** `[4,9]` into the result: `[1,6]` ends at 6 ≥ 4, so it is absorbed (start 1); `[8,10]` starts at 8 ≤ 9, absorbed (end 10); `[15,18]` starts after 10, copied. Result `[[1,10], [15,18]]`.

**Meeting rooms** for the same four intervals. Events sorted: 1 (+1), 2 (+1), 3 (−1), 6 (−1), 8 (+1), 10 (−1), 15 (+1), 18 (−1). Running count: 1, 2, 1, 0, 1, 0, 1, 0. **Peak 2 → 2 rooms.**

## Implement it in Python

All three operations, with asserts that replay the worked example.

```python
import heapq

def overlaps(a: tuple[int, int], b: tuple[int, int]) -> bool:
    return a[0] < b[1] and b[0] < a[1]        # half-open: touching is not overlapping

def merge(intervals: list[list[int]]) -> list[list[int]]:
    merged: list[list[int]] = []
    for start, end in sorted(intervals):      # sort by start
        if merged and start <= merged[-1][1]: # overlaps or touches the last block
            merged[-1][1] = max(merged[-1][1], end)   # max: it may lie inside
        else:
            merged.append([start, end])
    return merged

def insert(intervals: list[list[int]], new: list[int]) -> list[list[int]]:
    s, e = new                                 # intervals: sorted and disjoint
    out, i, n = [], 0, len(intervals)
    while i < n and intervals[i][1] < s:       # ends before new starts
        out.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= e:      # overlaps new: absorb it
        s, e = min(s, intervals[i][0]), max(e, intervals[i][1]); i += 1
    return out + [[s, e]] + intervals[i:]

def min_rooms(meetings: list[list[int]]) -> int:
    ends: list[int] = []                       # min-heap: end time of each busy room
    for start, end in sorted(meetings):
        if ends and ends[0] <= start:          # earliest-ending room is free again
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)

assert overlaps((1, 3), (2, 6)) and not overlaps((5, 8), (8, 10))
assert merge([[8, 10], [1, 3], [15, 18], [2, 6]]) == [[1, 6], [8, 10], [15, 18]]
assert insert([[1, 6], [8, 10], [15, 18]], [4, 9]) == [[1, 10], [15, 18]]
assert min_rooms([[1, 3], [2, 6], [8, 10], [15, 18]]) == 2
assert min_rooms([[0, 30], [5, 10], [15, 20]]) == 2
```

## Edge cases and pitfalls

- **Forgetting `max` when merging.** `[[1,4], [2,3]]` must stay `[1,4]`.
- **Comparing with the wrong interval.** Compare with the last *merged block*, not the previous input interval: in `[[1,10], [2,3], [4,5]]`, `[4,5]` does not overlap `[2,3]` but does overlap the block `[1,10]`.
- **Touching endpoints.** Decide `<` versus `<=` from the problem statement, and use the same convention in the overlap test, the merge, and the tie-breaking of sweep events.
- **Sorting by end instead of start** breaks merging. (Sorting by **end** *is* right for a different problem: the maximum number of non-overlapping intervals, a greedy activity-selection problem.)
- **Empty input.** `merge([])` should return `[]`; `min_rooms([])` returns 0.
- **Mutating the input.** The merge above builds new lists; if you sort in place with `intervals.sort()`, the caller's list changes.

## In the interview

Start by asking whether endpoints that touch count as overlapping, then say "sort by start, then one pass" and state O(n log n) time. For meeting rooms, explain *why* the peak overlap is the answer (a lower bound at the peak moment, and achievable by reusing rooms) before choosing the heap or the sweep. Likely follow-ups: insert into an already-sorted list in O(n), "can one person attend all meetings?" (sort and check neighbours), and "minimum intervals to remove so the rest do not overlap" (greedy by earliest end).
