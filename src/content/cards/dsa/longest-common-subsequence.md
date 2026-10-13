---
title: Longest Common Subsequence
track: dsa
tags: [dynamic-programming, strings]
difficulty: 3
minutes: 5
tldr: "dp[i][j] = LCS length of the first i letters of X and the first j of Y. Equal last letters: diagonal + 1. Otherwise: the larger of up and left. O(mn)."
analogy: "Two friends list the films they watched this year, in order. The longest common subsequence is the longest list of films both watched in the same order — gaps allowed, no reshuffling."
diagram: longest-common-subsequence
story:
  - title: Two strings, letters matched in order
    text: "A subsequence keeps letters in their original order but may skip any of them; a substring may not skip. BCB is a subsequence of both ABCBD and BDCAB. Draw a line between each pair of matched letters: a valid match never has crossing lines. A string of length m has 2ᵐ subsequences, so trying them all is hopeless."
  - title: A table of prefixes
    text: "Let dp[i][j] = the LCS length of the first i letters of X and the first j letters of Y. Row ∅ and column ∅ stand for an empty prefix, which has nothing in common with anything, so they are all 0. The answer will sit in the bottom-right corner, dp[5][5]."
  - title: Letters match — diagonal + 1
    text: "Compare the last letters of the two prefixes. If they are equal, pair them up: the best is the LCS of both shorter prefixes plus one, dp[i−1][j−1] + 1. For AB against BDCAB both end in B; the diagonal cell says A and BDCA share 1 letter, so this cell is 2 (AB)."
  - title: No match — the larger of up and left
    text: "If the last letters differ, at least one of them is not in the LCS, so drop it: take the larger of dp[i−1][j] (cell above) and dp[i][j−1] (cell to the left). In the corner D ≠ B, up gives 3 and left gives 2, so the LCS length is 3. That is (m+1)(n+1) cells of O(1) work: O(mn)."
  - title: Walk back to read the LCS
    text: "The table holds lengths, not letters. Start at the corner. On a match, keep the letter and step diagonally; otherwise step to the larger of up and left (up on a tie). The kept letters appear last-first — B, C, B — so reverse them to get BCB."
keyIdeas:
  - "**Subsequence** = order kept, gaps allowed. **Substring** = contiguous. They need different recurrences."
  - "**State:** `dp[i][j]` = LCS length of `x[:i]` and `y[:j]`; row 0 and column 0 are all 0."
  - "**Recurrence:** if `x[i−1] == y[j−1]` then `dp[i−1][j−1] + 1`, else `max(dp[i−1][j], dp[i][j−1])`."
  - "**O(mn) time and space.** Two rows give O(min(m, n)) space when you only need the length."
  - "**Diff tools are LCS in disguise:** lines outside the LCS of two files are exactly the deletions and insertions."
quiz:
  - q: "Which of these is a subsequence of ABCBD but not a substring of it?"
    options: ["ABC", "ACD", "BCB", "DBA"]
    answer: 1
    why: "ACD keeps the order A → C → D but skips letters, so it is a subsequence only. ABC and BCB appear contiguously (substrings are also subsequences), and DBA breaks the order."
  - q: "What is the LCS length of ABCBDAB and BDCABA?"
    options: ["3", "4", "5", "6"]
    answer: 1
    why: "Several strings of length 4 work — BCBA, BCAB and BDAB — and no string of length 5 is common to both. An LCS is often not unique."
  - q: "When x[i−1] ≠ y[j−1], why is max(dp[i−1][j], dp[i][j−1]) correct?"
    options: ["Because the two letters must both be in the LCS", "Because at least one of the two last letters is unused, so the answer equals the LCS after dropping it", "Because the diagonal is always smaller", "It is a heuristic that is usually right"]
    answer: 1
    why: "If a common subsequence used both last letters, both would be its final character and so paired together — impossible, as they differ. So one of them is unused, and dropping it loses nothing; we take the better of the two choices."
  - q: "You may only delete characters. How many deletions make \"sea\" and \"eat\" equal?"
    options: ["1", "2", "3", "4"]
    answer: 1
    why: "Keep the LCS, \"ea\", and delete everything else: m + n − 2·LCS = 3 + 3 − 4 = 2 (delete s from sea and t from eat)."
bigO:
  - { op: "brute force", avg: "O(2ᵐ · n)", note: "test every subsequence of x against y" }
  - { op: "dp table", avg: "O(mn) time", note: "O(mn) space; recovers an LCS" }
  - { op: "length only, two rows", avg: "O(mn) time", note: "O(min(m, n)) space" }
  - { op: "Hirschberg", avg: "O(mn) time", note: "O(min(m, n)) space and still recovers an LCS" }
related: [dsa/dynamic-programming, dsa/edit-distance, dsa/knapsack, dsa/two-pointers]
prereqs: [dsa/dynamic-programming]
flashcards:
  - kind: qa
    q: "Write the LCS recurrence."
    a: "dp[i][j] = dp[i−1][j−1] + 1 if x[i−1] == y[j−1], otherwise max(dp[i−1][j], dp[i][j−1]); dp[0][j] = dp[i][0] = 0."
  - kind: cloze
    text: "A {{subsequence}} keeps order but may skip characters; a {{substring}} must be contiguous."
  - kind: qa
    q: "How do you get the longest palindromic subsequence of s from LCS?"
    a: "Compute LCS(s, reversed s). A palindrome read forwards equals itself read backwards, so it is common to both."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Dynamic programming chapter, ideas redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Subsequence vs substring

A **subsequence** of a string is what remains after deleting zero or more characters *without changing the order* of the rest. ACD is a subsequence of ABCBD. A **substring** is a contiguous block: BCB is a substring of ABCBD, ACD is not. Every substring is a subsequence, not the other way round.

The **longest common subsequence (LCS)** of strings x (length m) and y (length n) is a longest string that is a subsequence of both. For ABCBD and BDCAB it is BCB, length 3. (The longest common *substring* is only 2 — AB or BD.)

Brute force would list all 2ᵐ subsequences of x and test each against y in O(n) with two pointers: O(2ᵐ · n). With m = 50 that is about 10¹⁵ subsequences. Dynamic programming gets it in m × n steps.

## How it works

1. **State.** `dp[i][j]` = length of an LCS of the prefixes `x[:i]` and `y[:j]` (the first i and first j characters).
2. **Base cases.** `dp[0][j] = dp[i][0] = 0`: an empty string has only the empty subsequence.
3. **Recurrence.** Look at the last characters of the two prefixes, `a = x[i−1]` and `b = y[j−1]`.
   - **a == b:** some LCS ends by pairing these two characters. (If an LCS ended differently, you could swap its last pair for this one without making it shorter.) So `dp[i][j] = dp[i−1][j−1] + 1`.
   - **a ≠ b:** if a common subsequence used both, each would have to supply its *last* character, so a and b would be paired together — impossible, since they differ. So at least one of a and b is unused. Dropping it changes nothing: `dp[i][j] = max(dp[i−1][j], dp[i][j−1])`.
4. **Order.** Each cell needs the cells above, to the left and diagonally up-left, so fill row by row, left to right.
5. **Answer.** `dp[m][n]`.

There are (m + 1)(n + 1) cells and each takes O(1): **O(mn) time and space**.

## Worked example

x = ABCBD (rows), y = BDCAB (columns).

| | ∅ | B | D | C | A | B |
|---|---|---|---|---|---|---|
| ∅ | 0 | 0 | 0 | 0 | 0 | 0 |
| A | 0 | 0 | 0 | 0 | 1 | 1 |
| B | 0 | 1 | 1 | 1 | 1 | 2 |
| C | 0 | 1 | 1 | 2 | 2 | 2 |
| B | 0 | 1 | 1 | 2 | 2 | 3 |
| D | 0 | 1 | 2 | 2 | 2 | **3** |

Some cells explained:

- **dp[1][4]** (A vs BDCA): A = A, match → dp[0][3] + 1 = 1.
- **dp[2][5]** (AB vs BDCAB): B = B, match → dp[1][4] + 1 = 2. The LCS so far is AB.
- **dp[3][4]** (ABC vs BDCA): C ≠ A → max(up 1, left 2) = 2.
- **dp[5][5]** (ABCBD vs BDCAB): D ≠ B → max(up 3, left 2) = **3**.

## Recovering one LCS

Start at `(m, n)` and repeat until a row or column index reaches 0:

- If `x[i−1] == y[j−1]`, that character is in the LCS: record it and move diagonally to `(i−1, j−1)`.
- Otherwise move to whichever neighbour, up or left, holds the larger value (pick up on a tie).

On the example: (5,5) D ≠ B, up is larger → (4,5) B = B, keep **B** → (3,4) C ≠ A, left is larger → (3,3) C = C, keep **C** → (2,2) B ≠ D, left is larger → (2,1) B = B, keep **B** → (1,0) stop. The letters come out last-first; reversed, the LCS is **BCB**.

An LCS is often **not unique**. ABCBDAB and BDCABA have three LCSs of length 4 — BCBA, BCAB and BDAB. The tie rule (prefer up or prefer left) decides which one you recover. Listing *all* of them can take exponential time, because there can be exponentially many.

## In code

```python
def lcs(x, y):
    m, n = len(x), len(y)
    dp = [[0] * (n + 1) for _ in range(m + 1)]       # row 0 and column 0 stay 0
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if x[i - 1] == y[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1      # match: extend the diagonal
            else:                                    # drop the last letter of x or of y
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    out, i, j = [], m, n                             # walk back from the corner
    while i > 0 and j > 0:
        if x[i - 1] == y[j - 1]:
            out.append(x[i - 1])
            i, j = i - 1, j - 1
        elif dp[i - 1][j] >= dp[i][j - 1]:           # ties go up
            i -= 1
        else:
            j -= 1
    return dp[m][n], "".join(reversed(out))

def lcs_length(x, y):                                # O(min(m, n)) extra space
    if len(y) > len(x):
        x, y = y, x                                  # keep the rows short
    prev = [0] * (len(y) + 1)
    for a in x:
        cur = [0]
        for j, b in enumerate(y, 1):
            cur.append(prev[j - 1] + 1 if a == b else max(prev[j], cur[j - 1]))
        prev = cur
    return prev[-1]

print(lcs("ABCBD", "BDCAB"))                         # (3, 'BCB')
print(lcs("ABCBDAB", "BDCABA"), lcs_length("ABCBDAB", "BDCABA"))  # (4, 'BCBA') 4
```

## Saving space

Row i reads only row i − 1 and itself, so two rows of length min(m, n) + 1 are enough for the **length**. Recovering the actual subsequence needs the whole table — or **Hirschberg's algorithm**, a divide-and-conquer trick that finds the midpoint of the optimal path with two linear-space passes and recurses, keeping O(mn) time with O(min(m, n)) space.

## Where it is used

- **diff.** Comparing two versions of a file line by line, the lines in an LCS are "unchanged"; every other line in the old file is a deletion and every other line in the new file is an insertion. Unix `diff` and `git diff` are built on Myers' algorithm, which finds a shortest insert/delete script in O((m + n)·D) time, where D is the number of edits — fast when two versions are similar.
- **Bioinformatics.** Comparing DNA or protein sequences is the same alignment idea, usually with scores for matches, mismatches and gaps.
- **Plagiarism and merge tools** use it to line up similar documents.

## Related problems

| Problem | How it uses LCS |
|---|---|
| Minimum deletions to make two strings equal | m + n − 2·LCS |
| Edit distance with insert and delete only | m + n − 2·LCS |
| Shortest common supersequence | length m + n − LCS |
| Longest palindromic subsequence | LCS(s, reversed s) |
| Longest common **substring** | on a match `dp[i−1][j−1] + 1`, otherwise **0**; answer = largest cell |

## Edge cases and pitfalls

- **Off-by-one.** `dp` is (m + 1) × (n + 1); cell (i, j) compares `x[i−1]` and `y[j−1]`. The extra row and column are the empty prefixes.
- **Substring vs subsequence.** Using `max(up, left)` for the substring problem is wrong: a mismatch must reset to 0, because a contiguous run is broken.
- **Empty strings** give 0; the loops above handle them without special cases.
- **Memory.** Two 100,000-character strings make a 10¹⁰-cell table. If you only need the length, use two rows; if you need the alignment, use Hirschberg.
- **Recursion.** A memoised recursive version is natural but recurses m + n deep; prefer the loop for long strings in Python.

## In the interview

Usually asked directly ("LeetCode 1143") or hidden inside one of the related problems above. A strong answer defines the state on prefixes, justifies both branches of the recurrence in one sentence each, fills a 3×3 or 4×4 table on the whiteboard, and states O(mn) time and space. Expect follow-ups: *print the subsequence* (walk back), *reduce memory* (two rows), and *what changes for substring* (reset to 0 on a mismatch and track the maximum).
