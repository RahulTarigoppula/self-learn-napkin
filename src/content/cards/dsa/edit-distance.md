---
title: Edit Distance
track: dsa
tags: [dynamic-programming, strings]
difficulty: 3
minutes: 5
tldr: "The fewest single-letter inserts, deletes and replacements that turn one string into another. dp[i][j] = min(diagonal + 0 or 1, up + 1, left + 1); kitten → sitting = 3."
analogy: "Fixing a typo with the fewest keystrokes. At the end of each word you have three moves — overwrite a letter, delete one, or type a missing one — and you always pick whichever leaves the least work for the rest."
diagram: edit-distance
story:
  - title: kitten → sitting, three kinds of edit
    text: "How many single-letter edits turn kitten into sitting? Three operations are allowed, each costing 1: insert a letter, delete a letter, or replace one letter with another. The minimum count is the edit distance (Levenshtein distance). Spell checkers use it to find the dictionary words closest to a typo."
  - title: Base row and column
    text: "Let dp[i][j] = the fewest edits that turn the first i letters of kitten into the first j letters of sitting. Turning the empty string into \"sit\" takes 3 inserts, and turning \"kit\" into the empty string takes 3 deletes. So row 0 reads 0, 1, 2, … 7 and column 0 reads 0, 1, … 6."
  - title: Each cell is the cheapest of three neighbours
    text: "Look at the last letters. Replace one with the other (free if they already match): diagonal + 1, or + 0. Delete kitten's last letter: the cell above + 1. Insert sitting's last letter: the cell to the left + 1. For k against s: diagonal 0 + 1 = 1 beats 1 + 1 from above or from the left."
  - title: Fill the table — distance 3
    text: "Fill row by row; each cell needs only its left, upper and upper-left neighbours. The matching letters i, t, t ride the diagonal for free, so the cost stays at 1 along it. The bottom-right corner says kitten → sitting needs 3 edits. That is (m+1)(n+1) cells of O(1) work: O(mn) time."
  - title: Walk back to get the edit script
    text: "From the corner, ask which neighbour produced each value and step there. The path runs down the diagonal and ends with one step left. Diagonal steps that cost 1 are replacements (k → s, e → i), free diagonal steps keep a letter, and the step left inserts g."
  - title: Only two rows are needed
    text: "Each row reads only itself and the row above, so two rows are enough when you only need the number: O(mn) time, O(min(m, n)) space. Printing the edit script needs the full table, or Hirschberg's divide-and-conquer trick."
keyIdeas:
  - "**State:** `dp[i][j]` = fewest edits turning the first i letters of a into the first j letters of b. Base cases `dp[i][0] = i` (delete all) and `dp[0][j] = j` (insert all)."
  - "**Recurrence:** `min(dp[i−1][j−1] + (a[i−1] ≠ b[j−1]), dp[i−1][j] + 1, dp[i][j−1] + 1)` — replace/keep, delete, insert."
  - "**O(mn) time.** Two rows give O(min(m, n)) space when you only need the distance."
  - "**Bounds:** |m − n| ≤ distance ≤ max(m, n) — handy sanity checks and early exits."
  - "**Used for** spell checking, fuzzy search, DNA alignment (with weighted costs) and record matching."
quiz:
  - q: "What is the edit distance from \"horse\" to \"ros\"?"
    options: ["2", "3", "4", "5"]
    answer: 1
    why: "Replace h → r (rorse), delete r (rose), delete e (ros). Two edits cannot work: the lengths differ by 2, so two edits would have to be both deletions, and no two deletions of horse give ros."
  - q: "In the table, stepping from dp[i−1][j] down to dp[i][j] corresponds to which edit?"
    options: ["Inserting b[j−1]", "Deleting a[i−1]", "Replacing a[i−1] with b[j−1]", "Keeping a matching letter"]
    answer: 1
    why: "dp[i−1][j] already turns the first i − 1 letters of a into the first j letters of b. With one more letter of a, the only extra work is to delete it: a[i−1]."
  - q: "What is the Levenshtein distance between \"ab\" and \"ba\"?"
    options: ["0", "1", "2", "3"]
    answer: 2
    why: "Levenshtein has no swap operation, so it needs two edits (two replacements). Damerau–Levenshtein, which adds the transposition of adjacent letters, gives 1."
  - q: "You only need the distance between two strings of lengths 10,000 and 50. How much memory does the two-row version need?"
    options: ["About 500,000 cells", "About 10,000 cells", "About 100 cells", "1 cell"]
    answer: 2
    why: "Make the shorter string the columns: two rows of 51 cells each. The time is still about 10,000 × 50 cell updates."
bigO:
  - { op: "full table", avg: "O(mn) time", note: "O(mn) space; recovers the edit script" }
  - { op: "two rows", avg: "O(mn) time", note: "O(min(m, n)) space; distance only" }
  - { op: "is the distance ≤ k?", avg: "O(k · min(m, n))", note: "only a diagonal band of width 2k + 1 matters" }
related: [dsa/dynamic-programming, dsa/longest-common-subsequence, dsa/tries, dsa/knapsack]
prereqs: [dsa/dynamic-programming]
flashcards:
  - kind: qa
    q: "Write the edit distance recurrence and base cases."
    a: "dp[i][j] = min(dp[i−1][j−1] + (a[i−1] ≠ b[j−1]), dp[i−1][j] + 1, dp[i][j−1] + 1), with dp[i][0] = i and dp[0][j] = j."
  - kind: cloze
    text: "In the edit distance table, the cell above means {{delete}}, the cell to the left means {{insert}}."
  - kind: qa
    q: "Why is the edit distance at least |m − n|?"
    a: "Replacements keep the length the same, so the length difference must be made up by that many inserts or deletes, each costing 1."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Dynamic programming chapter (edit distance), ideas redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: edit-distance
---

## The problem

The **edit distance** (or **Levenshtein distance**) between strings a (length m) and b (length n) is the minimum number of single-character edits that turn a into b, where an edit is one of:

- **insert** a character (cat → cart),
- **delete** a character (cart → cat),
- **replace** one character with another (cat → cut).

Each costs 1. kitten → sitting has distance 3: replace k → s, replace e → i, insert g. You cannot do it in 2, and the table below proves it.

The distance is symmetric (an insert one way is a delete the other way) and obeys the triangle inequality, so it is a true **metric** on strings. Two quick bounds: it is at least |m − n|, because replacements never change the length, and at most max(m, n), because you can replace min(m, n) characters and insert or delete the rest.

## How it works

1. **State.** `dp[i][j]` = the fewest edits that turn the first i characters of a into the first j characters of b.
2. **Base cases.** `dp[i][0] = i` — turning i characters into nothing takes i deletes. `dp[0][j] = j` — building j characters from nothing takes j inserts.
3. **Recurrence.** Think about the *last* character of each prefix. In an optimal edit sequence, one of three things happens to them:
   - **Keep or replace.** a[i−1] ends up as b[j−1]: free if they are already equal, one replacement otherwise. The rest is turning the first i − 1 characters of a into the first j − 1 of b: `dp[i−1][j−1] + (0 or 1)`.
   - **Delete** a[i−1]. Then the first i − 1 characters of a must become the first j of b: `dp[i−1][j] + 1`.
   - **Insert** b[j−1] at the end. Then the first i characters of a must become the first j − 1 of b: `dp[i][j−1] + 1`.
   - `dp[i][j]` is the minimum of the three.
4. **Order.** Every cell needs its left, upper and upper-left neighbours, so fill row by row, left to right.
5. **Answer.** `dp[m][n]`. There are (m + 1)(n + 1) cells of O(1) work: **O(mn) time and space**.

Optimal substructure holds because whatever an optimal script does with the last characters, the edits on the remaining prefixes must themselves be optimal — otherwise you could swap in a cheaper set and beat the optimum.

## Worked example

a = kitten (rows), b = sitting (columns).

| | ∅ | s | i | t | t | i | n | g |
|---|---|---|---|---|---|---|---|---|
| ∅ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| k | 1 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| i | 2 | 2 | 1 | 2 | 3 | 4 | 5 | 6 |
| t | 3 | 3 | 2 | 1 | 2 | 3 | 4 | 5 |
| t | 4 | 4 | 3 | 2 | 1 | 2 | 3 | 4 |
| e | 5 | 5 | 4 | 3 | 2 | 2 | 3 | 4 |
| n | 6 | 6 | 5 | 4 | 3 | 3 | 2 | **3** |

Some cells explained:

- **dp[1][1]** (k → s): replace → dp[0][0] + 1 = 1; delete → dp[0][1] + 1 = 2; insert → dp[1][0] + 1 = 2. Minimum **1**.
- **dp[2][2]** (ki → si): i = i, keep → dp[1][1] + 0 = **1**.
- **dp[5][5]** (kitte → sitti): e ≠ i, replace → dp[4][4] + 1 = 2; delete → dp[4][5] + 1 = 3; insert → dp[5][4] + 1 = 3. Minimum **2**.
- **dp[6][7]** (kitten → sitting): n ≠ g; replace → dp[5][6] + 1 = 4; delete → dp[5][7] + 1 = 5; insert → dp[6][6] + 1 = **3**.

## Recovering the edit script

Start at (m, n) and, at each cell, find a neighbour that produced its value:

- **Diagonal** with equal letters and the same value → keep the letter.
- **Diagonal** with value one less → replace a[i−1] with b[j−1].
- **Up** with value one less → delete a[i−1].
- **Left** with value one less → insert b[j−1].

On the example: (6,7) came from the left → **insert g**; (6,6) n = n, keep; (5,5) came from the diagonal at cost 1 → **replace e → i**; (4,4), (3,3), (2,2) keep t, t, i; (1,1) → **replace k → s**. Read in reverse, the script is: replace k → s, replace e → i, insert g. When several neighbours tie, any choice gives an optimal script, so the script is not always unique.

## Implement it in Python

The same idea works in any language; only the syntax changes. Here it is in Python.

```python
def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i                                   # delete all of a[:i]
    for j in range(n + 1):
        dp[0][j] = j                                   # insert all of b[:j]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j - 1] + cost,    # keep or replace
                           dp[i - 1][j] + 1,           # delete a[i-1]
                           dp[i][j - 1] + 1)           # insert b[j-1]
    ops, i, j = [], m, n                               # walk back to list the edits
    while i > 0 or j > 0:
        if i and j and dp[i][j] == dp[i - 1][j - 1] + (a[i - 1] != b[j - 1]):
            if a[i - 1] != b[j - 1]:
                ops.append(f"replace {a[i - 1]} -> {b[j - 1]}")
            i, j = i - 1, j - 1
        elif i and dp[i][j] == dp[i - 1][j] + 1:
            ops.append(f"delete {a[i - 1]}")
            i -= 1
        else:
            ops.append(f"insert {b[j - 1]}")
            j -= 1
    return dp[m][n], ops[::-1]

def distance_two_rows(a, b):                           # O(len(b)) space
    prev = list(range(len(b) + 1))                     # row 0: 0, 1, 2, ...
    for i in range(1, len(a) + 1):
        cur = [i] + [0] * len(b)                       # column 0 of row i
        for j in range(1, len(b) + 1):
            cur[j] = min(prev[j - 1] + (a[i - 1] != b[j - 1]), prev[j] + 1, cur[j - 1] + 1)
        prev = cur
    return prev[-1]

print(edit_distance("kitten", "sitting"))
# (3, ['replace k -> s', 'replace e -> i', 'insert g'])
print(distance_two_rows("kitten", "sitting"), distance_two_rows("horse", "ros"))  # 3 3
```

## Saving space

Row i reads only row i − 1 and the cells already filled in row i, so keep two rows (`prev` and `cur`) and pass the shorter string as `b`: O(min(m, n)) space. You lose the ability to walk back. If you need both the script and low memory, **Hirschberg's algorithm** splits the problem at the middle row, finds where the optimal path crosses it with two linear-space passes, and recurses on the two halves — still O(mn) time.

If you only need to know whether the distance is **at most k**, note that every step off the main diagonal costs at least 1, so only cells with |i − j| ≤ k can lie on a path of cost ≤ k. Computing that band takes O(k · min(m, n)) time — the basis of fast fuzzy matching.

## Where it is used

- **Spell checking and "did you mean".** Suggest dictionary words within distance 1 or 2 of the typed word. Walking a trie of the dictionary and computing one DP row per trie node shares work between words with a common prefix and prunes a branch as soon as its whole row exceeds the limit.
- **Fuzzy search.** Search engines such as Lucene and Elasticsearch support fuzzy queries that match terms within a small edit distance (at most 2).
- **Bioinformatics.** DNA and protein alignment (Needleman–Wunsch) is the same table with a scoring matrix and gap penalties instead of unit costs.
- **Record linkage and data cleaning.** Matching "Jon Smith" to "John Smith" across databases.

## Variants worth knowing

| Variant | Allowed edits | Note |
|---|---|---|
| Hamming distance | replace only | equal lengths; just count mismatches, O(n) |
| LCS distance | insert, delete | equals m + n − 2·LCS; kitten → sitting is 5 |
| Levenshtein | insert, delete, replace | this card; kitten → sitting is 3 |
| Damerau–Levenshtein | plus swap of adjacent letters | "ab" → "ba" is 1 instead of 2 |
| Weighted | any, with custom costs | e.g. cheaper replacements for neighbouring keys |

## Edge cases and pitfalls

- **Forgetting the base row and column.** Starting them at 0 instead of i and j makes every prefix of the empty string look free.
- **Mixing up insert and delete.** "Up" deletes from the source; "left" inserts from the target. Swapping them still gives the right number (the costs are equal) but prints a wrong script.
- **Empty strings.** The distance from "" to b is len(b); the code handles it with no special case.
- **Unicode.** What counts as one "character" depends on the language: Python indexes code points, Java and JavaScript index UTF-16 units, and an accented letter written with a combining mark is two code points either way. Normalise the text (and decide what a character is) first if that matters.
- **Huge inputs.** Two 100,000-character strings mean 10¹⁰ cells. Use the band (if a small limit is acceptable) or a specialised library.

## In the interview

Usually asked as "LeetCode 72: Edit Distance" or as "one edit away" (is the distance ≤ 1? — solvable in O(n) with two pointers, no table needed). A strong answer defines the state on prefixes, names the three neighbours as replace, delete and insert, sets the base row and column, fills a small table such as horse → ros (3), and states O(mn) time with an O(min(m, n)) space follow-up. Expect "print the actual edits" (walk back), "what if replace costs 2?" (change the diagonal cost; with replace = 2 the answer becomes the LCS distance), and "how would you suggest corrections from a dictionary of a million words?" (trie plus a DP row per node, or a BK-tree, which works because the distance is a metric).
