---
title: Arrays & Pointers
track: dsa
tags: [arrays, memory, fundamentals]
difficulty: 1
minutes: 5
tldr: "An array is one contiguous block of same-size slots, so a[i] is one multiply and one add away: O(1). The price: inserting or deleting in the middle shifts everything after it."
analogy: "A row of numbered lockers: knowing where the first one is and how wide each is, you can walk straight to locker 300. But to squeeze a new locker in at number 3, every locker after it has to move along one."
diagram: arrays-and-pointers
story:
  - title: One block, one formula
    text: "Take a = [7, 2, 9, 4, 1] in a block of six 4-byte slots starting at address 1000. Slot i is at 1000 + 4 × i, so a[3] is at 1012. Finding any element is one multiply and one add, however long the array is: O(1) indexing. It is also why indices start at 0: a[0] is zero slots from the start."
  - title: Neighbours arrive in one cache line
    text: "The CPU fetches memory in 64-byte cache lines, so one read brings in 16 neighbouring ints at once. A loop over an array mostly hits that fast cache; a linked list's nodes are scattered and each hop can miss. Both scans are O(n), but the array is often several times faster."
  - title: Insert in the middle shifts the tail
    text: "Having no gaps is also the price. To insert 5 at index 1, the four values after it each move one slot right (starting from the end, so nothing is overwritten), and only then does 5 go in. Deleting shifts them back left. Inserting near the front of n items is O(n); at the end it is cheap."
  - title: Full? Allocate double and copy
    text: "A static array's size is fixed. A dynamic array (Python list, Java ArrayList, C++ vector) keeps spare slots. Now all 6 are used, so appending 8 allocates a new block of 12, copies the 6 values, then writes 8. Growing by a constant factor keeps the total copying under 2n for n appends: O(1) amortised per append."
  - title: A 2-D grid is rows laid end to end
    text: "A 2 × 3 grid is still one block, stored row by row (row-major, as in C and NumPy). g[r][c] sits in slot r × 3 + c, so g[1][2] is slot 5. Loop over rows outside and columns inside and you walk memory in order; the other way round jumps a whole row on every step."
keyIdeas:
  - "**Contiguous, same-size slots**: `a[i]` is at base + i × size, so any index is O(1). An array variable is really a **pointer** to that base address."
  - "**Cache locality**: neighbours share a 64-byte cache line, so array scans beat linked-list scans by a large constant factor."
  - "**Insert/delete at index i shifts the n − i items after it**: O(n) near the front, O(1) at the end."
  - "**Dynamic arrays grow geometrically** (×1.5 or ×2, say), so append is **O(1) amortised** even though one resize is O(n)."
  - "**Row-major 2-D**: g[r][c] is at base + (r × cols + c) × size. Iterate rows outside, columns inside."
quiz:
  - q: "A 3 × 4 grid (3 rows, 4 columns) of 4-byte ints is stored row-major starting at address 0. At which address is g[2][1]?"
    options: ["36", "9", "28", "20"]
    answer: 0
    why: "Slot = r × cols + c = 2 × 4 + 1 = 9, and each slot is 4 bytes, so the address is 9 × 4 = 36. 9 forgets the slot size, 28 multiplies by the row count instead of the column count, and 20 is the column-major position."
  - q: "Why does inserting at the front of an array of n elements cost O(n)?"
    options: ["The array must be re-sorted", "Every existing element shifts one slot to the right", "The memory must be freed first", "Indexing becomes O(n) afterwards"]
    answer: 1
    why: "Contiguous storage has no gaps, so making room at index 0 means moving all n elements up by one slot. Indexing stays O(1) afterwards; it is the shifting that costs."
  - q: "A dynamic array grows by adding 10 slots whenever it is full, instead of doubling. What do n appends cost in total?"
    options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"]
    answer: 2
    why: "A resize happens every 10 appends and copies 10, 20, 30, … values: about n²/20 copies in all, which is O(n²). Growing by a constant factor makes the copies a geometric series under 2n instead."
  - q: "A 1000 × 1000 row-major matrix of 8-byte floats is summed column by column instead of row by row. What changes?"
    options: ["It becomes O(n³)", "Same work, but much slower: each read jumps 8,000 bytes and misses the cache", "The sum comes out different", "It gets faster, because columns are contiguous"]
    answer: 1
    why: "Both orders read every element once. Row by row walks memory in order and uses all 8 values in each 64-byte cache line; column by column jumps a whole row (8,000 bytes) per read, so almost every read fetches a new line."
bigO:
  - { op: "read/write a[i]", avg: "O(1)", note: "base + i × size" }
  - { op: "search (unsorted)", avg: "O(n)", note: "O(log n) if sorted, by binary search" }
  - { op: "append (dynamic array)", avg: "O(1) amortised", worst: "O(n)", note: "the worst case is the resize copy" }
  - { op: "pop from the end", avg: "O(1)" }
  - { op: "insert/delete at index i", avg: "O(n − i)", worst: "O(n)", note: "the tail shifts" }
  - { op: "g[r][c] in a 2-D array", avg: "O(1)", note: "base + (r × cols + c) × size" }
related: [dsa/two-pointers, dsa/linked-lists, dsa/amortised-analysis, dsa/prefix-sums]
prereqs: [dsa/big-o-basics]
flashcards:
  - kind: qa
    q: "Why is appending to a dynamic array O(1) amortised, when a resize copies everything?"
    a: "It grows by a constant factor, so resizes get rarer as it grows: the copies for n appends form a geometric series 1 + 2 + 4 + … < 2n, which is O(1) extra work per append on average."
  - kind: cloze
    text: "In a {{row-major}} 2-D array with C columns, g[r][c] is stored in slot {{r × C + c}}."
  - kind: qa
    q: "Arrays and linked lists both scan in O(n). Why is the array usually much faster?"
    a: "Cache locality: array elements are adjacent, so each 64-byte cache line fetched serves many reads; linked-list nodes are scattered, so each hop can be a cache miss."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Array-based lists, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How an array works

An **array** stores its elements side by side in one **contiguous** (unbroken) block of memory, every slot the same size. If the block starts at address `base` and each slot takes `s` bytes, slot `i` is at:

```
address(a[i]) = base + i × s
```

That is why indexing is **O(1)**: one multiply, one add, one memory read, whether the array holds ten items or ten million. It is also why most languages count from 0: the index is an *offset* from the start, and the first element is zero slots in.

This is where **pointers** come in. A pointer is a variable that holds a memory address. In C an array name behaves as a pointer to `base`, and `a[i]` is literally shorthand for `*(a + i)`: "go `i` slots past the start and read". Languages such as Python, Java and JavaScript hide addresses, but the same arithmetic runs underneath. In those languages an array of *objects* is really an array of pointers (often called **references**): each fixed-size slot holds the address of an object stored elsewhere. That is how one Python list can mix numbers and strings, and why arrays of raw numbers (a C `int[]`, a Java `int[]`, a NumPy array) are more compact and faster to scan than arrays of references.

## Worked example

`a = [7, 2, 9, 4, 1]` in a block of 6 four-byte slots at address 1000:

| index | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| address | 1000 | 1004 | 1008 | 1012 | 1016 | 1020 |
| value | 7 | 2 | 9 | 4 | 1 | *(spare)* |

1. **Read `a[3]`**: 1000 + 3 × 4 = 1012, which holds 4. No other slot is touched.
2. **`insert(1, 5)`** uses the spare slot. Move `a[4]→a[5]`, `a[3]→a[4]`, `a[2]→a[3]`, `a[1]→a[2]` (right to left, so nothing is overwritten before it is copied), then write 5 into `a[1]`. Result `[7, 5, 2, 9, 4, 1]`: 4 moves, which is n − i.
3. **`append(8)`**: all 6 slots are full. Allocate a new block of 12, copy the 6 values, write 8 into slot 6, free the old block. The next 5 appends are one write each.

## Static vs dynamic arrays

A **static array** (a C array, Java `int[]`) has its size fixed when it is created. A **dynamic array** (Python `list`, Java `ArrayList`, C++ `vector`) wraps one and tracks two numbers: **size** (slots in use) and **capacity** (slots allocated). Appending writes into the next spare slot, O(1). When size reaches capacity it must **resize**: allocate a bigger block, copy everything, free the old one, which is O(n).

**Why growth must be geometric.** Start at capacity 1 and double. The resizes copy 1, 2, 4, … values, each at most n, a geometric series that sums to less than 2n. So n appends cost n writes plus fewer than 2n copies, under 3n in total: **O(1) amortised** per append. (*Amortised* means averaged over a whole sequence of operations, guaranteed, not just on average over random inputs.) Any constant factor above 1 works: CPython grows lists by about 1.125×, Java's `ArrayList` by 1.5×, and many C++ vectors by 2×. Smaller factors waste less memory but copy more often. Growing by a **fixed amount** instead (say +10 slots) breaks this: the copies are 10 + 20 + 30 + … ≈ n²/20, which is O(n²).

## Insert and delete: the shifting cost

Inserting at index `i` moves the n − i elements after it one slot right; deleting at `i` moves them one slot left. So:

- at the **end**: 0 moves, O(1) (`append`, `pop()`);
- at the **front**: n moves, O(n) (`insert(0, x)`, `pop(0)`);
- in general: O(n − i).

Two standard escapes: if order does not matter, delete by **swapping with the last element and popping** (O(1)); if you need cheap operations at *both* ends, use a **deque** (Python's `collections.deque`, Java's `ArrayDeque`, C++'s `std::deque`) instead.

## Cache locality

Main memory is slow compared with the CPU, so the CPU keeps small, fast **caches** and fetches memory in **cache lines**, typically 64 bytes. Reading one 4-byte int therefore brings in up to 15 ints next to it, and the hardware **prefetcher** spots a sequential scan and fetches the next lines before you ask. A linked list's nodes can be anywhere in memory, so each `node.next` may be a **cache miss**, costing on the order of 100 ns. Both scans are O(n), yet the array is routinely several times faster. Big-O counts steps, not how expensive each step is.

## 2-D arrays

A grid with R rows and C columns is still stored as one block. **Row-major** order (C, C++, NumPy's default) lays out row 0 first, then row 1, and so on:

```
address(g[r][c]) = base + (r × C + c) × s
```

**Column-major** order (Fortran, MATLAB, R, Julia) stores whole columns first instead. The layout decides which loop order is fast: in row-major memory, `for r … for c …` reads consecutive addresses, while `for c … for r …` jumps C slots on every read and wastes most of every cache line.

A true 2-D array (C's `int g[2][3]`, a NumPy array) is one block. An **array of arrays** (a Python list of lists, Java's `int[][]`, a JavaScript array of arrays) is different: an array of pointers to separate row arrays. Indexing is still O(1), two lookups instead of one, but the rows can sit anywhere in memory, and two slots can accidentally point to the *same* row (see the pitfalls).

## Implement it in Python

The same idea works in any language; here is a dynamic array built on a fixed-size block, in Python.

```python
class DynamicArray:
    """A list built on a fixed-size block that doubles when it is full."""
    def __init__(self, capacity=1):
        self.block = [None] * capacity      # stands in for one raw block of memory
        self.n = 0                          # slots in use
        self.copies = 0                     # values moved by resizes, for counting

    def append(self, x):
        if self.n == len(self.block):       # full: allocate double and copy across
            bigger = [None] * (2 * len(self.block))
            for i in range(self.n):
                bigger[i] = self.block[i]
            self.copies += self.n
            self.block = bigger
        self.block[self.n] = x
        self.n += 1

    def insert(self, i, x):                 # O(n - i): shift the tail right first
        self.append(None)                   # grow by one slot (may resize)
        for j in range(self.n - 1, i, -1):
            self.block[j] = self.block[j - 1]
        self.block[i] = x

a = DynamicArray(capacity=6)
for v in [7, 2, 9, 4, 1]:
    a.append(v)
a.insert(1, 5)                              # fills the spare slot
a.append(8)                                 # full: 6 → 12, copies 6
print(a.block[:a.n], len(a.block), a.copies)   # [7, 5, 2, 9, 4, 1, 8] 12 6

b = DynamicArray()
for v in range(1000):
    b.append(v)
print(len(b.block), b.copies)               # 1024 1023  (< 2n copies)

def offset(r, c, cols):                     # row-major slot of g[r][c]
    return r * cols + c

print(offset(1, 2, cols=3))                 # 5
```

## Edge cases and pitfalls

- **Off by one.** The last valid index is n − 1. Some languages (Python, for one) also accept `a[-1]` as "the last element", which can hide a bug where an index wrongly reached −1.
- **Shared rows.** In an array of arrays, copying the *pointer* to a row instead of the row gives two names for one row. In Python, `[[0] * 3] * 2` does exactly this: setting `grid[0][0] = 1` changes `grid[1][0]` too. Build each row separately: `[[0] * 3 for _ in range(2)]`.
- **Hidden O(n) calls.** Library calls that insert or remove at the front (Python's `list.insert(0, x)`, Java's `ArrayList.add(0, x)`), membership tests on an unsorted array, and slicing or copying a sub-array all cost time proportional to the items they touch.
- **Deleting while iterating** forwards skips elements, because everything after the deleted slot shifts left. Iterate backwards or build a new list.
- **Amortised is not worst case.** A single append can still take O(n) when it triggers a resize; latency-critical code reserves the capacity up front when it knows n.

## From indices to pointers

An index is a position you can *move*. Many array problems are solved by walking two indices through the array at once: from both ends towards the middle on sorted data (pair sums, palindromes), or one reading and one writing (in-place de-duplication). That family, **two pointers**, has its own napkin, and so does **sliding window**, where two indices bound a moving range.

## In the interview

Be ready to state the costs above without hesitating, and to say *why*: O(1) indexing from address arithmetic, O(n − i) insert/delete from shifting, O(1) amortised append from geometric growth. Strong answers bring up cache locality when comparing arrays with linked lists ("same Big-O, very different constants"). Common follow-ups: "implement a dynamic array" (track size and capacity, double when full), "why doubling and not +10?" (geometric series vs n²), and "rotate or transpose a matrix in place" (index arithmetic on a 2-D array).
