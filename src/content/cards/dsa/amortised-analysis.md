---
title: Amortised Analysis
track: dsa
tags: [complexity, dynamic-array, analysis]
difficulty: 2
minutes: 5
tldr: "Amortised cost is the total cost of any sequence of operations divided by their number. A doubling array's rare O(n) copy is paid for by many cheap appends, so append is O(1) amortised."
analogy: "A monthly train pass versus single tickets: one day you pay a big sum, but spread over every ride of the month each journey is cheap. Amortised analysis spreads the rare expensive operation over all the cheap ones."
diagram: amortised-analysis
story:
  - title: An array that doubles
    text: "A dynamic array (Python list, Java ArrayList, C++ vector) keeps its values in one fixed-size block of memory. When an append finds the block full, it allocates a block twice as big, copies every value across, and then writes the new one. Here capacity 4 is full, so appending e copies 4 values first."
  - title: Most appends cost 1
    text: "Count one unit of work for each value written or copied. Start at capacity 1 and append 17 values. Most appends find a free slot and cost exactly 1: write the value, done."
  - title: A full array copies everything
    text: "Appends 2, 3, 5, 9 and 17 find the array full, at sizes 1, 2, 4, 8 and 16. Append 17 costs 1 + 16 copies = 17 units. So the worst single append is O(n). Does that make appending n values O(n²)?"
  - title: Add it all up
    text: "No. The copies form 1 + 2 + 4 + 8 + 16 = 31, a doubling series that is always less than 2n. So 17 appends cost 17 writes + 31 copies = 48 units, below 3 × 17 = 51. Total O(n) for n appends means O(1) per append, amortised. This is the aggregate method."
  - title: "The banker's view"
    text: "Or charge every append a flat 3 units. 1 pays for the write; the other 2 go into a bank. When an array of capacity m fills, the m/2 values added since the last resize have banked m units, exactly enough to copy all m values. The bank never goes negative, so 3 per append is a valid bound."
keyIdeas:
  - "**Amortised cost** = worst-case total for any sequence of n operations ÷ n. It is a guarantee, not an average over random inputs."
  - "**Doubling makes append O(1) amortised**: copies 1 + 2 + 4 + … < 2n, so n appends cost < 3n in total."
  - "**Aggregate method**: bound the total, divide by n. **Banker's (accounting) method**: overcharge cheap operations and save the surplus to pay for expensive ones."
  - "**Grow by a factor, never by a constant**: adding 10 slots each time makes n appends cost O(n²), i.e. O(n) per append."
  - "**Worst case** = one operation's maximum (append: O(n)). **Average case** = expectation over random inputs. **Amortised** = guaranteed average over a sequence."
quiz:
  - q: "A doubling array holds 8 values and has capacity 8. How many units does the next append cost (1 per write or copy)?"
    options: ["1", "8", "9", "16"]
    answer: 2
    why: "The array is full, so it allocates capacity 16, copies the 8 existing values (8 units) and writes the new value (1 unit): 9 in total."
  - q: "A dynamic array grows by a constant 100 slots instead of doubling. What is the amortised cost of append?"
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"]
    answer: 2
    why: "A resize happens every 100 appends and copies everything: 100 + 200 + … + n ≈ n²/200 copies in total. Divided by n appends that is O(n) each."
  - q: "What does 'append is O(1) amortised' promise?"
    options: ["Every single append takes O(1) time", "Any sequence of n appends takes O(n) time in total", "Appends are O(1) on random inputs", "Appends are O(1) except with probability 1/n"]
    answer: 1
    why: "Amortised bounds cover the total cost of any sequence, with no probability involved. Individual appends can still take O(n), which matters for hard real-time systems."
  - q: "To keep both push and pop O(1) amortised, when should a doubling array shrink to half its capacity?"
    options: ["When it is half full", "When it is a quarter full", "Never", "After every pop"]
    answer: 1
    why: "If it shrank at half full, alternating push and pop at that boundary would grow and shrink on every operation, costing O(n) each time. Shrinking at a quarter full leaves a buffer of cheap operations between resizes."
bigO:
  - { op: "append (one call)", best: "O(1)", avg: "O(1) amortised", worst: "O(n)", note: "worst case: the call that triggers a resize" }
  - { op: "n appends in total", avg: "< 3n units", note: "n writes + fewer than 2n copies" }
  - { op: "17 appends from capacity 1", avg: "48 units", note: "17 writes + 31 copies ≤ 3 × 17" }
  - { op: "grow by a constant c", avg: "O(n) amortised", note: "≈ n²/(2c) copies in total" }
related: [dsa/arrays-and-pointers, dsa/big-o-basics, dsa/hash-tables, dsa/queues-and-deques]
prereqs: [dsa/big-o-basics, dsa/arrays-and-pointers]
flashcards:
  - kind: qa
    q: "Why is appending to a doubling dynamic array O(1) amortised?"
    a: "Resizes copy 1 + 2 + 4 + … values, a geometric series below 2n. So n appends cost under 3n in total, which is O(1) per append."
  - kind: cloze
    text: "In the {{banker's (accounting)}} method, cheap operations are overcharged and the surplus {{credit}} pays for the expensive ones later."
  - kind: qa
    q: "How is amortised cost different from average-case cost?"
    a: "Average case is an expectation over a distribution of inputs. Amortised cost is a worst-case guarantee on the total of any sequence of operations, divided by the number of operations; no randomness is involved."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "ArrayStack resize analysis" }
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Amortized analysis notes" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The question amortised analysis answers

Some data structures are fast almost always and slow occasionally. A dynamic array appends in O(1) until it fills up, then one append takes O(n) to copy everything into a bigger block. If you only quote the worst case, n appends look like n × O(n) = O(n²). That is a correct upper bound but a terrible one, because the expensive appends are rare and get rarer as the array grows.

**Amortised analysis** bounds the **total** cost of any sequence of n operations, then divides by n. If n operations always cost at most T(n) in total, each one costs T(n)/n **amortised**. It is still a worst-case guarantee. It holds for every possible sequence, including the nastiest one you can construct.

## How a dynamic array grows

A dynamic array keeps a block of `capacity` slots, of which the first `size` are used.

- **Append with room** (`size < capacity`): write the value into slot `size`, increase `size`. Cost 1.
- **Append when full** (`size == capacity`): allocate a new block of `2 × capacity` slots, copy all `size` values, free the old block, then write. Cost `size + 1`.

Starting from capacity 1, the array is full when size is 1, 2, 4, 8, 16, …, so appends number 2, 3, 5, 9, 17, … are the expensive ones.

## Worked example: 17 appends

| Append # | Size before | Capacity before | Copies | Cost | Capacity after |
|---|---|---|---|---|---|
| 1 | 0 | 1 | 0 | 1 | 1 |
| 2 | 1 | 1 | 1 | 2 | 2 |
| 3 | 2 | 2 | 2 | 3 | 4 |
| 4 | 3 | 4 | 0 | 1 | 4 |
| 5 | 4 | 4 | 4 | 5 | 8 |
| 6–8 | 5–7 | 8 | 0 | 1 each | 8 |
| 9 | 8 | 8 | 8 | 9 | 16 |
| 10–16 | 9–15 | 16 | 0 | 1 each | 16 |
| 17 | 16 | 16 | 16 | 17 | 32 |

Total: 17 writes + (1 + 2 + 4 + 8 + 16) = 31 copies = **48 units**, and 48 ≤ 3 × 17 = 51.

## Method 1: aggregate

Add up the whole sequence. n appends do n writes. The copies are 1 + 2 + 4 + … + 2^j, where 2^j is the largest power of two below n. A doubling series sums to one less than its next term: 2^(j+1) − 1 < 2n. So

> total cost < n + 2n = **3n**, and the amortised cost per append is **< 3 = O(1)**.

Each resize costs about as much as all the earlier resizes put together. The last one dominates, and it copies at most n values.

## Method 2: banker's (accounting)

Pretend every append pays a flat fee of **3 units**. 1 unit pays for writing the new value; the other 2 are stored as credit on that value (think of coins taped to it). Copies during a resize are paid only from stored credit.

Why is the credit always enough? When an array of capacity m is full, the values in slots m/2 + 1 to m all arrived after the previous resize (which grew the array from m/2 to m), so each still carries its 2 coins. That is m/2 × 2 = **m coins**, exactly enough to copy all m values, including the older half that spent its own coins at the previous resize. Running the numbers for the table above, the bank balance after appends 1–9 is 2, 3, 3, 5, 3, 5, 7, 9, 3, rises to 17 by append 16, and drops back to 3 after append 17. It never goes negative, so a charge of 3 per append covers every real cost, and the total real cost is at most 3n.

A third method, the **potential method**, does the same with a formula: define Φ = 2·size − capacity. A cheap append raises Φ by 2; a resize from capacity m drops Φ from m to 2. Real cost plus change in Φ is exactly 3 for every append.

## Implement it in Python

Here is the doubling array with a counter for copies, so you can check the 48 from the table yourself.

```python
class DynamicArray:
    def __init__(self):
        self.cap, self.size = 1, 0
        self.data = [None]
        self.copies = 0                        # values moved by all resizes so far

    def append(self, x):
        if self.size == self.cap:              # full: double and copy everything
            new = [None] * (2 * self.cap)
            for i in range(self.size):
                new[i] = self.data[i]
            self.copies += self.size
            self.data, self.cap = new, 2 * self.cap
        self.data[self.size] = x               # the cheap part: one write
        self.size += 1

arr = DynamicArray()
for v in range(17):
    arr.append(v)
print(arr.size, arr.cap, arr.copies)           # 17 32 31 -> 17 + 31 = 48 units
```

## Amortised vs average vs worst case

| Term | Means | Append to a doubling array |
|---|---|---|
| **Worst case** | the most one operation can cost | O(n), during a resize |
| **Average case** | expected cost when inputs are random | not the point here; no randomness |
| **Amortised** | worst-case total over any sequence ÷ its length | O(1) |

The difference is real. Quicksort's O(n log n) is an *average* over random orders: an unlucky input really is slower. Append's O(1) is *amortised*: no sequence of appends can ever exceed 3n units. Some structures combine both, for example a hash table with resizing is O(1) **expected amortised** per insert.

## Edge cases and pitfalls

- **Growing by a constant** (say +100 slots) is a classic bug: resizes happen every 100 appends, copies total about n²/200, so append becomes O(n) amortised. Any constant **factor** g > 1 works; copies then total about n·g/(g − 1). Real libraries use different factors: CPython lists over-allocate by about 1/8, Java's ArrayList grows by 1.5×, GCC's `std::vector` by 2×.
- **Shrinking**: halve the capacity when the array is a **quarter** full, not half full. Shrinking at half full lets alternating push/pop at the boundary trigger a resize on every operation.
- **Latency**: amortised O(1) still allows one slow O(n) call. In real-time code (games, audio), pre-size the array (C++ `reserve`, Java `ensureCapacity`) or use a structure with worst-case O(1) operations.
- **Other classic examples**: a queue built from two stacks (each element is moved at most once, so O(1) amortised), incrementing a binary counter (fewer than 2n bit flips for n increments), and union-find.

## In the interview

You will hear "what's the complexity of appending to a dynamic array?" (Python's `list.append`, Java's `ArrayList.add`, C++'s `vector::push_back`) or "implement a dynamic array / ArrayList". Answer "O(1) amortised, O(n) worst case for the call that resizes", then justify it with the doubling series 1 + 2 + 4 + … < 2n. Interviewers often follow up with "why double instead of adding a fixed amount?", "when should it shrink?", or "explain the two-stack queue's amortised O(1) dequeue".
