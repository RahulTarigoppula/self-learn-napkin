---
title: Backtracking
track: dsa
tags: [recursion, search, pruning, combinatorics]
difficulty: 2
minutes: 5
tldr: "Build a solution one choice at a time; when a partial solution can no longer work, undo the last choice and try the next. Depth-first search over a tree of decisions, with pruning."
analogy: "Walking a maze with a ball of string. At each fork you pick a corridor and unroll string behind you. At a dead end you wind the string back to the last fork and try the next corridor, so you never get lost and never walk a corridor twice."
diagram: backtracking
story:
  - title: "Subsets: one take-or-skip decision per element"
    text: "To list every subset of [1, 2, 3], decide for each element in turn: take it or skip it. Each decision splits the path in two, so the decisions form a tree, and each of the 2³ = 8 leaves is one subset. Backtracking is a depth-first walk of this decision tree."
  - title: "Choose, explore, unchoose"
    text: "The walk keeps one shared list, path. Choose: append an element. Explore: recurse to the next decision. Unchoose: pop it again so path is exactly as before. Here path is [1], we take 3 to get [1, 3], record a copy at the leaf, then pop back to [1] to try skipping 3."
  - title: "4-queens: row 2 has no safe square"
    text: "Place 4 queens on a 4×4 board so no two share a row, column or diagonal — one queen per row. Row 0 takes column 0 and row 1 takes column 2, the first safe square. Every square in row 2 is now attacked, so this branch is pruned: nothing below it is explored."
  - title: "Backtrack: move the row-1 queen"
    text: "Undo row 1 and try its next safe column, 3. Row 2 then fits at column 1, but every square in row 3 is attacked. Row 2's other columns are attacked too and row 1 has no columns left, so we back up all the way to row 0."
  - title: "Row 0 → column 1: a solution"
    text: "Moving the row-0 queen to column 1 leads straight to columns [1, 3, 0, 2], a valid board. Only 8 queen placements were tried, against 4⁴ = 256 ways to put one queen in each row. Pruning dead branches early is what makes backtracking fast in practice."
keyIdeas:
  - "**Backtracking = DFS over a decision tree**: each level is one decision, each leaf a complete candidate."
  - "**Template**: if complete, record a copy; else for each option: **choose**, **explore**, **unchoose**."
  - "**Prune** as soon as a partial solution cannot succeed; checking early cuts whole subtrees."
  - "Record **`path[:]`**, not `path`: the list keeps changing after you record it."
  - "Worst cases are exponential: subsets O(n · 2ⁿ), permutations O(n · n!). Pruning shrinks the real tree."
quiz:
  - q: "In the subsets template, what goes wrong if you forget path.pop() after exploring?"
    options: ["Nothing; Python cleans it up", "Earlier choices leak into later branches, so subsets come out wrong", "The recursion never ends", "It only affects performance"]
    answer: 1
    why: "path is shared by every branch. Without the undo, the 'skip' branch still contains the element you just took, so the results are wrong."
  - q: "Why is `out.append(path[:])` used instead of `out.append(path)`?"
    options: ["path[:] is faster", "append(path) stores a reference to the one list that keeps changing, so every result ends up identical (and empty at the end)", "path cannot be appended directly", "To sort the result"]
    answer: 1
    why: "A slice makes a snapshot copy. Without it, every recorded entry points at the same list object, which is empty once the search finishes."
  - q: "How does N-Queens check whether square (r, c) is attacked in O(1)?"
    options: ["Scan the whole board", "Keep sets of used columns, used r − c diagonals and used r + c anti-diagonals", "Only check the row above", "Sort the queens"]
    answer: 1
    why: "Squares on one diagonal share r − c, and squares on one anti-diagonal share r + c. With one queen per row, rows never clash, so three set lookups decide it."
  - q: "How many leaves does the full permutations tree of 4 distinct items have?"
    options: ["16", "24", "256", "4"]
    answer: 1
    why: "4 choices for the first position, 3 for the second, 2, then 1: 4! = 24 leaves, one per permutation."
bigO:
  - { op: "subsets of n", avg: "O(n · 2ⁿ)", note: "2ⁿ leaves, O(n) to copy each" }
  - { op: "permutations of n", avg: "O(n · n!)" }
  - { op: "N-Queens", avg: "O(n!)", note: "upper bound; pruning visits far fewer nodes" }
  - { op: "extra space", avg: "O(n)", note: "recursion depth + path, not counting the output" }
related: [dsa/recursion, dsa/bfs-and-dfs, dsa/dynamic-programming, dsa/greedy-algorithms]
prereqs: [dsa/recursion]
flashcards:
  - kind: qa
    q: "What are the three steps inside a backtracking loop?"
    a: "Choose (apply an option to the shared state), explore (recurse), unchoose (undo the option so the state is as before)."
  - kind: cloze
    text: "Backtracking is a {{depth-first}} search of the decision tree that {{prunes}} branches which cannot lead to a solution."
  - kind: qa
    q: "How many solutions does 8-queens have, and roughly how much does pruning help?"
    a: "92 solutions. Backtracking with column and diagonal sets tries 2,056 placements, instead of 8⁸ ≈ 16.8 million ways to put one queen per row."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Chapter 2, backtracking and n queens, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What backtracking is

Many problems ask you to **generate** or **find** combinations: all subsets, all orderings, a valid Sudoku filling, a word in a grid, every way to split a string into palindromes. Each answer can be built by a sequence of small decisions — take this element or not, which value goes in this cell, which letter comes next. Those decisions form a **decision tree**: the root is "nothing decided", each level makes one more decision, and each leaf is a complete candidate.

**Backtracking** walks that tree depth-first with a single shared, mutable partial solution. It extends the partial solution with a choice, recurses, and on the way back **undoes** the choice so the next option starts from a clean state. Its power comes from **pruning**: as soon as a partial solution breaks a rule, the whole subtree below it is skipped.

## How it works: the template

```text
explore(state):
    if state is a complete solution: record a copy; return
    for option in options(state):
        if option is not allowed: continue          # prune
        choose(option)                              # mutate the shared state
        explore(state)
        unchoose(option)                            # restore it exactly
```

Three things make this correct:

1. **Every candidate corresponds to exactly one root-to-leaf path**, so nothing is generated twice and nothing is missed.
2. **The undo restores the state exactly**, so siblings never see each other's choices. Using one mutable list plus undo is much cheaper than copying the state at every call.
3. **Pruning only skips subtrees that cannot contain a solution**, so it never loses answers.

## Worked example 1: subsets and permutations

**Subsets of [1, 2, 3].** Decision i is "take `nums[i]` or skip it". The tree has 3 levels and 2³ = 8 leaves. With "take" tried first, the leaves come out in the order `[1,2,3], [1,2], [1,3], [1], [2,3], [2], [3], []`. The path list changes like this along the left part of the tree: `[1]` → `[1,2]` → `[1,2,3]` (record) → pop 3 → `[1,2]` (record) → pop 2 → `[1]` → `[1,3]` (record) → pop 3 → `[1]` (record) → pop 1 → `[]` and so on.

**Permutations of [1, 2, 3].** Each level picks which unused element goes next, so the root has 3 children, each of those has 2, and each of those has 1: 3! = 6 leaves. A `used` array tracks which elements are already in the path; choose sets `used[i] = True`, unchoose sets it back.

## Worked example 2: 4-queens

Place n queens on an n × n board so that no two attack each other. Since two queens in the same row attack, put **exactly one queen per row** and let decision r be "which column for row r". Square (r, c) is attacked if column c is used, if diagonal r − c is used, or if anti-diagonal r + c is used — three set lookups.

| Step | Action | Board (column per row) |
|---|---|---|
| 1 | row 0 → col 0 | [0] |
| 2 | row 1: cols 0, 1 attacked → col 2 | [0, 2] |
| 3 | row 2: all 4 attacked → **prune**, undo row 1 | [0] |
| 4 | row 1 → col 3 | [0, 3] |
| 5 | row 2: col 0 attacked → col 1 | [0, 3, 1] |
| 6 | row 3: all attacked → undo; row 2 cols 2, 3 attacked → undo; row 1 out of columns → undo | [] |
| 7 | row 0 → col 1; row 1 → col 3; row 2 → col 0; row 3 → col 2 | **[1, 3, 0, 2]** ✓ |

Eight queen placements reach the first solution. Continuing the search finds the only other one, [2, 0, 3, 1] (the mirror image), after 16 placements in total. For 8-queens the same code finds all 92 solutions with 2,056 placements, where trying every one-queen-per-row arrangement would be 8⁸ ≈ 16.8 million.

## In code

```python
def subsets(nums):
    out, path = [], []
    def explore(i):
        if i == len(nums):                       # every element decided: record a copy
            out.append(path[:])
            return
        path.append(nums[i])                     # choose: take nums[i]
        explore(i + 1)                           # explore
        path.pop()                               # unchoose
        explore(i + 1)                           # skip nums[i]
    explore(0)
    return out

def n_queens(n):
    cols, diag, anti = set(), set(), set()      # attacked columns and diagonals
    placed, solutions = [], []
    def explore(row):
        if row == n:
            solutions.append(placed[:])
            return
        for c in range(n):
            if c in cols or row - c in diag or row + c in anti:
                continue                         # prune: attacked square
            cols.add(c); diag.add(row - c); anti.add(row + c); placed.append(c)
            explore(row + 1)
            cols.remove(c); diag.remove(row - c); anti.remove(row + c); placed.pop()
    explore(0)
    return solutions

print(subsets([1, 2, 3]))   # [[1, 2, 3], [1, 2], [1, 3], [1], [2, 3], [2], [3], []]
print(n_queens(4))          # [[1, 3, 0, 2], [2, 0, 3, 1]]
print(len(n_queens(8)))     # 92
```

## Complexity

Backtracking is exponential by nature, because the number of answers usually is. Subsets: 2ⁿ leaves, each copied in O(n), so **O(n · 2ⁿ)**. Permutations: n! leaves, **O(n · n!)**. N-Queens: row k has at most n − k unused columns, so there are at most n · (n − 1) · … · 1 = n! full boards and **O(n!)** is an upper bound, and pruning visits far fewer nodes in practice. Space is the recursion depth plus the path, **O(n)**, not counting the output.

## Pruning ideas

- **Check constraints as early as possible**: test a queen when placing it, not when the board is full.
- **Order choices well**: in Sudoku, fill the cell with the fewest legal digits first.
- **Bound the remaining work**: in *Combination Sum* with sorted candidates, stop the loop once a candidate exceeds the remaining target — every later one is larger.
- **Skip duplicates**: with repeated values (*Subsets II*, *Permutations II*), sort first and skip a value equal to its predecessor at the same tree level.
- **Memoise** if the same sub-state recurs: then it is really dynamic programming.

## Edge cases and pitfalls

- **Record a copy** (`path[:]` or `list(path)`): appending `path` itself stores a reference to a list that keeps changing.
- **Undo exactly what you did**, in reverse order, including every set or flag you touched.
- **Do not prune too eagerly**: a check that rejects partial states which could still be completed loses answers.
- **Recursion depth** equals the number of decisions; for n in the thousands, Python's default limit (about 1,000) needs care, but backtracking inputs are usually small.

## In the interview

Name the pattern ("this is backtracking over a decision tree"), say what one level decides, then write the choose–explore–unchoose loop. State the size of the tree (2ⁿ or n!) as the complexity and point out where you prune. Common prompts: *Subsets*, *Permutations*, *Combination Sum*, *N-Queens*, *Word Search*, *Palindrome Partitioning*, *Sudoku Solver*. Expect a follow-up on duplicates in the input (sort and skip equal siblings) or on returning just the count or the first solution (return early once found).
