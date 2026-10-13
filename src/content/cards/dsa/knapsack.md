---
title: 0/1 Knapsack
track: dsa
tags: [dynamic-programming, optimisation, arrays]
difficulty: 3
minutes: 5
tldr: "Pick items with weights and values to maximise value under a weight limit. dp[i][c] = best value from the first i items with capacity c; each cell is max(skip item i, take it)."
analogy: "Packing a carry-on with a 5 kg limit. For each thing on the bed you ask one question: am I better off leaving it, or packing it and making do with the space that is left? Answer that for every size of bag, smallest first."
diagram: knapsack
story:
  - title: Four items, a 5 kg bag
    text: "A bag holds 5 kg. The items are A (1 kg, $1), B (3 kg, $4), C (4 kg, $5) and D (2 kg, $3). Each item is either taken whole or left behind — that is the \"0/1\". Trying every subset costs 2ⁿ checks: about a trillion for 40 items."
  - title: The table, one row per item
    text: "Define dp[i][c] = the best value you can get using only the first i items with capacity c. The \"none\" row is all 0: no items, no value. With only A (1 kg, $1) available, every capacity of at least 1 kg is worth $1."
  - title: Each cell is take or skip
    text: "For item i at capacity c there are two choices. Skip it and you get dp[i−1][c], the cell straight above. Take it (only if it fits) and you get its value plus the best the earlier items can do in the space left: dp[i−1][c−w] + v. For B at c = 4: skip gives 1, take gives dp[1][1] + 4 = 5."
  - title: Fill the rest — the answer is 7
    text: "Each row only reads the row above, so fill top to bottom. In D's row at c = 5: skip gives 6 (A + C), take gives dp[3][3] + 3 = 4 + 3 = 7. The bottom-right cell holds the answer, $7, after n × (W+1) cells of O(1) work each."
  - title: Walk back to find the items
    text: "The table stores values, not choices, but the choices can be recovered. Start at the answer. If a cell differs from the one above it, item i was taken: subtract its weight and move up. 7 ≠ 6, so D was taken (c becomes 3); 4 = 4, so C was skipped; 4 ≠ 1, so B was taken. The bag is {B, D}: 5 kg, $7."
  - title: One row, updated right to left
    text: "Since each row reads only the previous one, a single array works: dp[c] = max(dp[c], dp[c−w] + v). Loop c from high to low so dp[c−w] still holds the previous row when you read it. Left to right, D would be counted twice at c = 4 — which is exactly the unbounded knapsack."
keyIdeas:
  - "**State:** `dp[i][c]` = best value using the first i items within capacity c. The answer is `dp[n][W]`."
  - "**Recurrence:** `dp[i][c] = max(dp[i−1][c], dp[i−1][c−w] + v)`, where the second option exists only if `w ≤ c`."
  - "**O(nW) time is pseudo-polynomial:** it grows with the *value* of W, which is exponential in the number of bits needed to write W. The general problem is NP-hard (no known algorithm is fast in both n and the number of digits of W)."
  - "**One row:** iterate capacity **downwards** for 0/1 (each item once), **upwards** for unbounded (items reusable)."
  - "**Greedy by value per kg fails** for 0/1 knapsack; it is only correct for the fractional version, where items can be cut."
quiz:
  - q: "In the one-array version of 0/1 knapsack, why must the capacity loop run from W down to w?"
    options: ["It is faster", "So dp[c − w] still holds the previous item's row, and each item is used at most once", "So the answer ends up in dp[0]", "It avoids negative indices"]
    answer: 1
    why: "Going upwards, dp[c − w] may already include the current item, so the item could be added again and again. That is the unbounded knapsack. Downwards, every read sees the previous row."
  - q: "Capacity 50; items (10 kg, $60), (20 kg, $100), (30 kg, $120). What is the best 0/1 value?"
    options: ["$160", "$180", "$220", "$280"]
    answer: 2
    why: "Greedy by $/kg (6, 5, 4) takes the first two for $160 and then the 30 kg item no longer fits. The optimum is 20 kg + 30 kg = 50 kg for $220."
  - q: "Why is the O(nW) knapsack algorithm called pseudo-polynomial?"
    options: ["It uses recursion", "Its running time depends on the numeric value of W, which can be exponential in the input's size in bits", "It only works for small n", "It is polynomial only on average"]
    answer: 1
    why: "Writing W takes about log₂ W bits. A W of 2⁶⁴ is a 64-bit number but would need 2⁶⁴ table columns, so the running time is exponential in the input length."
  - q: "In the worked table, dp[3][5] = 6. Which items make that $6?"
    options: ["B and D", "A and C", "A and B", "C alone"]
    answer: 1
    why: "Row 3 may use only A, B and C. A + C weighs 5 kg and is worth $6; B + A is 4 kg and $5. D only arrives in row 4."
bigO:
  - { op: "brute force (all subsets)", avg: "O(2ⁿ · n)" }
  - { op: "2-D table", avg: "O(nW) time", note: "O(nW) space; lets you recover the chosen items" }
  - { op: "one row", avg: "O(nW) time", note: "O(W) space; value only" }
  - { op: "unbounded knapsack", avg: "O(nW) time", note: "O(W) space, capacity loop upwards" }
related: [dsa/dynamic-programming, dsa/greedy-algorithms, dsa/backtracking, dsa/longest-common-subsequence]
prereqs: [dsa/dynamic-programming]
flashcards:
  - kind: qa
    q: "What is the 0/1 knapsack recurrence?"
    a: "dp[i][c] = max(dp[i−1][c], dp[i−1][c−w_i] + v_i), the second term only when w_i ≤ c; dp[0][c] = 0. The answer is dp[n][W]."
  - kind: cloze
    text: "With one array, loop capacity {{downwards}} for 0/1 knapsack and {{upwards}} for unbounded knapsack."
  - kind: qa
    q: "How do you recover which items were chosen from the 2-D table?"
    a: "Start at dp[n][W]. If dp[i][c] ≠ dp[i−1][c], item i was taken, so subtract its weight from c. Move up one row either way until row 0."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Dynamic programming chapter, ideas redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

You have **n items**, each with a **weight** wᵢ and a **value** vᵢ, and a bag with **capacity W**. Choose a subset whose total weight is at most W and whose total value is as large as possible. In the **0/1** version each item is either taken once or not at all.

Two relatives are worth naming at the start, because interviewers mix them up on purpose:

- **Fractional knapsack** — you may take part of an item (flour, not laptops). Greedy works: sort by value per kg and fill the bag, cutting the last item. O(n log n).
- **Unbounded knapsack** — each item has unlimited copies (coin change is a special case). Still DP, with one small change, shown below.

Brute force tries all 2ⁿ subsets. That is fine for 20 items (about a million) and hopeless for 60. Greedy by value per kg fails for 0/1: with capacity 50 and items (10 kg, $60), (20 kg, $100), (30 kg, $120), greedy takes the first two for $160 and then the third does not fit. The best is the last two, $220.

## How it works

Follow the five usual dynamic-programming steps: state, recurrence, base cases, order, answer.

1. **State.** `dp[i][c]` = the best value achievable using only the first i items, with total weight at most c.
2. **Recurrence.** Look at the last decision: what happened to item i?
   - **Skip it:** the best is whatever the first i − 1 items can do in the same capacity, `dp[i−1][c]`.
   - **Take it** (only if wᵢ ≤ c): you get vᵢ, and the first i − 1 items share the remaining capacity c − wᵢ, so `dp[i−1][c−wᵢ] + vᵢ`.
   - `dp[i][c]` is the larger of the two. The two cases cover every possible subset, so nothing is missed.
3. **Base cases.** `dp[0][c] = 0` for every c: no items, no value. (Column c = 0 is also all 0, because nothing fits.)
4. **Order.** Row i reads only row i − 1, so fill rows top to bottom; within a row any column order works.
5. **Answer.** `dp[n][W]`.

Optimal substructure is what makes this valid: if the best bag for (i, c) contains item i, then the rest of that bag must be the best bag for (i − 1, c − wᵢ) — otherwise you could swap in a better one and beat the "best".

## Worked example

Capacity 5. Items A (1 kg, $1), B (3 kg, $4), C (4 kg, $5), D (2 kg, $3).

| items allowed \ capacity | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| none | 0 | 0 | 0 | 0 | 0 | 0 |
| + A (1, $1) | 0 | 1 | 1 | 1 | 1 | 1 |
| + B (3, $4) | 0 | 1 | 1 | 4 | 5 | 5 |
| + C (4, $5) | 0 | 1 | 1 | 4 | 5 | 6 |
| + D (2, $3) | 0 | 1 | 3 | 4 | 5 | **7** |

A few cells worked out:

- **dp[2][4]** (B, c = 4): skip → dp[1][4] = 1; take → dp[1][1] + 4 = 5. Result **5** (A + B).
- **dp[3][5]** (C, c = 5): skip → dp[2][5] = 5; take → dp[2][1] + 5 = 6. Result **6** (A + C).
- **dp[4][2]** (D, c = 2): skip → dp[3][2] = 1; take → dp[3][0] + 3 = 3. Result **3** (D alone).
- **dp[4][5]** (D, c = 5): skip → dp[3][5] = 6; take → dp[3][3] + 3 = 7. Result **7**.

## Recovering the chosen items

The table stores only values, but every cell remembers its choice implicitly: if `dp[i][c]` equals `dp[i−1][c]`, skipping item i was (at least as) good; otherwise item i must have been taken. Walk back from `dp[n][W]`:

1. dp[4][5] = 7 ≠ dp[3][5] = 6 → **take D**, c = 5 − 2 = 3.
2. dp[3][3] = 4 = dp[2][3] = 4 → skip C.
3. dp[2][3] = 4 ≠ dp[1][3] = 1 → **take B**, c = 3 − 3 = 0.
4. dp[1][0] = 0 = dp[0][0] → skip A.

The bag is {B, D}: 5 kg, $7. When the values are equal, both choices lead to an optimal answer; preferring "skip" just picks one of them.

## Saving space: one row

Row i reads only row i − 1, so one array of size W + 1 suffices: `dp[c] = max(dp[c], dp[c − w] + v)`. The catch is the **direction**. When you update `dp[c]`, you need the *previous* row's `dp[c − w]`. Looping c from W **down** to w guarantees that, because smaller indices have not been overwritten yet.

Loop **upwards** and it breaks: processing D after row C ([0, 1, 1, 4, 5, 6]), c = 2 becomes 3 (D once), then c = 4 reads that new 3 and becomes 3 + 3 = 6 — D twice. The one-row version keeps O(nW) time but needs only O(W) space; the price is that you can no longer walk back to find the items.

## Unbounded knapsack

If every item can be used any number of times, that "bug" becomes the algorithm. With the capacity loop running **upwards**, `dp[c − w]` may already contain the current item, which is exactly what reuse means. With the same four items and capacity 6, the unbounded best is $9 (D three times), while the 0/1 best is $8 (A + B + D).

## Implement it in Python

The same idea works in any language; only the syntax changes. Here it is in Python.

```python
def knapsack(items, W):
    """items: list of (weight, value). Returns (best value, indices taken)."""
    n = len(items)
    dp = [[0] * (W + 1) for _ in range(n + 1)]   # dp[i][c]; row 0 = no items
    for i in range(1, n + 1):
        w, v = items[i - 1]
        for c in range(W + 1):
            dp[i][c] = dp[i - 1][c]                          # skip item i
            if w <= c:                                       # take it, if it fits
                dp[i][c] = max(dp[i][c], dp[i - 1][c - w] + v)
    taken, c = [], W
    for i in range(n, 0, -1):                    # walk back from the answer
        if dp[i][c] != dp[i - 1][c]:             # the value changed: item i was taken
            taken.append(i - 1)
            c -= items[i - 1][0]
    return dp[n][W], taken[::-1]

def knapsack_1d(items, W):                       # O(W) space
    dp = [0] * (W + 1)
    for w, v in items:
        for c in range(W, w - 1, -1):            # high to low: dp[c - w] is still last row's
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[W]

def unbounded(items, W):                         # every item may be reused
    dp = [0] * (W + 1)
    for w, v in items:
        for c in range(w, W + 1):                # low to high: dp[c - w] may already use it
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[W]

items = [(1, 1), (3, 4), (4, 5), (2, 3)]         # A, B, C, D
print(knapsack(items, 5))                        # (7, [1, 3])  -> B and D
print(knapsack_1d(items, 5), unbounded(items, 6))  # 7 9
```

## Why O(nW) is "pseudo-polynomial"

The table has (n + 1) × (W + 1) cells and each takes O(1), so the time is **O(nW)**. That looks polynomial, but the size of an input is measured in bits, and W takes only about log₂ W bits to write down. Doubling the number of bits in W squares W, and the table with it. An algorithm that is polynomial in the numeric value but exponential in the bit length is called **pseudo-polynomial**. This is consistent with knapsack being **NP-hard**: no known algorithm is polynomial in n and log W together. In practice, the DP is excellent when W is small (thousands to a few million), and other tools — branch and bound, meet-in-the-middle in about 2^(n/2) steps, or a DP over *values* instead of weights — take over when it is not.

## Edge cases and pitfalls

- **Wrong loop direction** in the one-row version silently turns 0/1 into unbounded. Say which one you need before coding.
- **"At most W" vs "exactly W".** For "at most", start every `dp[c]` at 0. For "exactly W" (as in subset sum), start `dp[0] = 0` and every other entry at −∞, so unreachable totals stay impossible.
- **Off-by-one indexing.** Row i of the table describes item `items[i − 1]`; row 0 is "no items". Mixing the two is the most common bug in a live coding round.
- **Huge W** (say 10⁹) makes the table impossible. Look for a different dimension: if values are small, use `minWeight[value]` instead.
- **Item order does not matter** to the answer, only to which optimal set the walk-back reports when there are ties.

## In the interview

Knapsack rarely appears by name. Look for "choose a subset, each element at most once, subject to a budget": **subset sum**, **partition into two equal-sum halves** (capacity = total / 2, boolean dp), **target sum** with + and − signs, **ones and zeroes** (two capacities, so a 2-D state per item). A strong answer states the state and recurrence in one sentence each, fills a tiny table by hand, gives O(nW) time, then offers the one-row version and explains the downward loop. Expect the follow-up "what if each item can be used unlimited times?" — flip the loop direction — and "why is this not polynomial?" — because W is a number, not a length.
