---
title: Dynamic Programming
track: dsa
tags: [dynamic-programming, recursion, memoisation]
difficulty: 3
minutes: 5
tldr: "When a recursive solution keeps solving the same subproblems, solve each one once and reuse the answer: top-down with a memo, or bottom-up by filling a table."
analogy: "Working out 47 × 23 for a homework sheet that asks it six times. You do the multiplication once, write the answer in the margin, and copy it for the other five. The margin is the memo."
diagram: dp-stairs
story:
  - title: Climb 5 stairs
    text: "You can climb 1 or 2 steps at a time. How many different ways reach step 5? Your last move landed on step 5 from either step 4 (+1) or step 3 (+2), so ways(5) = ways(4) + ways(3). In general ways(n) = ways(n−1) + ways(n−2), with ways(1) = 1 and ways(2) = 2."
  - title: The naive call tree
    text: "Coding that recurrence directly gives a tree of calls: w(5) calls w(4) and w(3), w(4) calls w(3) and w(2), and so on down to the base cases. For n = 5 that is 9 calls, and the count grows by about 1.6× with every extra step."
  - title: The same subproblems, again and again
    text: "Look at the colours: w(3) is solved twice and w(2) three times. These are overlapping subproblems. At n = 40 the naive recursion makes about 205 million calls, yet there are only 40 different questions being asked."
  - title: Memoise
    text: "Store each answer the first time you compute it, in a lookup table (a hash map or an array) keyed by n. When w(3) is needed again, it is a memo hit: return the stored 3, and its whole subtree is never called. Every distinct n is now solved once, so the work drops to O(n): 77 calls at n = 40."
  - title: Tabulate bottom-up
    text: "Or skip recursion entirely: fill a table from the smallest n upwards, each cell the sum of the two before it: 1, 2, 3, 5, 8. That is O(n) time, and since each cell needs only the previous two, you can keep just two variables for O(1) space."
keyIdeas:
  - "**DP fits when a problem has optimal substructure** (the answer is built from answers to smaller subproblems) **and overlapping subproblems** (the same ones recur)."
  - "**Define the state and the recurrence first**: what does `dp[i]` mean, and how does it follow from smaller states?"
  - "**Memoisation (top-down)** caches a recursive function; **tabulation (bottom-up)** fills a table in dependency order."
  - "**Cost = number of states × work per state**: n states × O(1) work gives O(n) for climbing stairs."
  - "**Often only the last few rows are needed**, so the table can shrink to O(1) or O(row) space."
quiz:
  - q: "Which pair of properties makes a problem a good fit for dynamic programming?"
    options: ["Sorted input and unique keys", "Optimal substructure and overlapping subproblems", "A graph with no cycles and positive weights", "Small inputs and integer answers"]
    answer: 1
    why: "Optimal substructure lets you build the answer from subproblem answers; overlapping subproblems mean caching those answers saves repeated work. Without overlap, plain divide and conquer (like merge sort) is enough."
  - q: "Climbing stairs with steps of 1 or 2: how many ways reach step 6?"
    options: ["8", "12", "13", "21"]
    answer: 2
    why: "ways(6) = ways(5) + ways(4) = 8 + 5 = 13. The table runs 1, 2, 3, 5, 8, 13."
  - q: "Coins {1, 3, 4}, amount 6. A greedy approach takes the biggest coin first. What happens?"
    options: ["Greedy finds the optimum of 2 coins, matching DP exactly", "Greedy uses 3 coins (4 + 1 + 1), but DP finds 2 (3 + 3)", "Both need 3 coins (4 + 1 + 1), since no pair sums to 6", "No combination makes exactly 6, so both return −1"]
    answer: 1
    why: "Greedy grabs 4 and is left with 2, which needs 1 + 1. DP checks every last coin: best[6] = best[3] + 1 = 2. Greedy is not safe for arbitrary coin systems."
  - q: "How many distinct subproblems does memoised ways(n) solve?"
    options: ["About n", "About 2ⁿ", "About n²", "About log n"]
    answer: 0
    why: "The only subproblems are ways(1) … ways(n), and the memo ensures each is computed once. That is why memoisation turns exponential time into O(n)."
bigO:
  - { op: "naive recursion, ways(n)", avg: "O(φⁿ) ≈ O(1.62ⁿ)", note: "about 205 million calls at n = 40" }
  - { op: "memoised", avg: "O(n)", note: "O(n) memo + O(n) call stack" }
  - { op: "tabulated", avg: "O(n)", note: "O(1) space keeping two variables" }
  - { op: "coin change (min coins)", avg: "O(amount · coins)" }
related: [dsa/recursion, dsa/knapsack, dsa/longest-common-subsequence, dsa/greedy-algorithms]
prereqs: [dsa/recursion, dsa/big-o-basics]
flashcards:
  - kind: qa
    q: "What is the difference between memoisation and tabulation?"
    a: "Memoisation is top-down: a recursive function caches each result the first time it computes it. Tabulation is bottom-up: fill a table from the base cases upwards in an order where every dependency is already filled."
  - kind: cloze
    text: "Dynamic programming needs {{optimal substructure}} and {{overlapping subproblems}}."
  - kind: qa
    q: "For coin change (fewest coins to make an amount), what is the recurrence?"
    a: "best[a] = 1 + min(best[a − c]) over every coin c ≤ a, with best[0] = 0; unreachable amounts stay infinite."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Dynamic programming chapter, ideas redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What dynamic programming is

**Dynamic programming (DP)** is a way to solve problems whose answer can be built from answers to smaller versions of the same problem, *when those smaller versions repeat*. Two properties have to hold:

- **Optimal substructure**: the best answer for the whole problem can be assembled from the best answers to subproblems. (The number of ways to reach step n is the sum of the ways to reach steps n − 1 and n − 2.)
- **Overlapping subproblems**: a direct recursive solution asks the same subproblem many times. (Computing ways(5) asks for ways(3) twice.)

If subproblems do not overlap (merge sort's two halves never share work), ordinary divide and conquer is enough. DP is what you add when they do: **solve each distinct subproblem once and store the answer.**

## How to build a DP solution

1. **Define the state.** Say precisely what one subproblem is: "`ways[i]` = number of distinct ways to reach step i". Most DP bugs are a vague state.
2. **Write the recurrence.** Express a state in terms of smaller states by asking "what was the last decision?" The last move onto step i was +1 (from i − 1) or +2 (from i − 2), and those cases never overlap, so `ways[i] = ways[i-1] + ways[i-2]`.
3. **Base cases.** The smallest states you can answer directly: `ways[1] = 1`, `ways[2] = 2`.
4. **Order.** Top-down (memoisation) lets recursion find the order for you. Bottom-up (tabulation) needs an order in which every state's dependencies are already computed, which here means increasing i.
5. **Answer and cost.** Read the answer from the right state. Time = number of states × work per state; space = the table, or less if you only keep what later states need.

## Worked example 1: climbing stairs

**Naive recursion** follows the recurrence blindly. Let C(n) be the number of calls it makes: C(1) = C(2) = 1 and C(n) = 1 + C(n − 1) + C(n − 2). That works out to C(n) = 2·F(n) − 1, where F is the Fibonacci sequence, so C(5) = 9 and C(40) = 204,668,309. The growth rate is φⁿ, with φ ≈ 1.618. Exponential.

**Memoised**, the first call for each n computes it and every later call is a lookup. ways(n) makes one fresh call to ways(n − 1), which does all the work below it, and then ways(n − 2) is a memo hit. That is 2n − 3 calls in total: 7 for n = 5, 77 for n = 40.

**Tabulated**:

| n | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| ways(n) | 1 | 2 | 3 | 5 | 8 | 13 |

Each cell is the sum of the two to its left. Because only the last two cells are ever read, two variables are enough: O(n) time, O(1) space.

## Worked example 2: coin change

Coins {1, 3, 4}; make 6 with as few coins as possible. A **greedy** approach (always take the biggest coin that fits) takes 4, then 1, then 1: three coins. The best is 3 + 3: two coins. Greedy fails because taking the 4 makes the rest worse.

DP state: `best[a]` = fewest coins that sum to exactly a. Last decision: which coin was added last? If it was coin c, the rest is an optimal way to make a − c. So `best[a] = 1 + min(best[a − c])` over coins c ≤ a, with `best[0] = 0`.

| a | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| best[a] | 0 | 1 | 2 | 1 | 1 | 2 | 2 |

For a = 6: via coin 1, best[5] + 1 = 3; via coin 3, best[3] + 1 = 2; via coin 4, best[2] + 1 = 3. Minimum: 2.

## Implement it in Python

Three versions of climbing stairs, so you can feel the difference, then coin change as a table.

```python
from functools import lru_cache

def ways_naive(n):              # exponential: recomputes the same subproblems
    if n <= 2:
        return n                # ways(1) = 1, ways(2) = 2
    return ways_naive(n - 1) + ways_naive(n - 2)

@lru_cache(maxsize=None)        # the memo: n -> answer
def ways_memo(n):               # top-down, each n solved once: O(n)
    if n <= 2:
        return n
    return ways_memo(n - 1) + ways_memo(n - 2)

def ways_table(n):              # bottom-up, O(n) time and O(1) space
    if n <= 2:
        return n
    prev, cur = 1, 2            # ways(1), ways(2)
    for _ in range(3, n + 1):
        prev, cur = cur, prev + cur
    return cur

def min_coins(coins, amount):   # O(amount * len(coins)) time
    INF = float("inf")
    best = [0] + [INF] * amount # best[a] = fewest coins summing to a
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                best[a] = min(best[a], best[a - c] + 1)
    return best[amount] if best[amount] != INF else -1

print(ways_naive(5), ways_memo(40), ways_table(40))   # 8 165580141 165580141
print(min_coins([1, 3, 4], 6), min_coins([5], 3))     # 2 -1
```

## Edge cases and pitfalls

- **A fuzzy state.** If `dp[i]` could mean two things, the recurrence will be wrong. Write the definition as a sentence before any code.
- **Missing information in the state.** If the next decision depends on something the state does not record (for example, "was the previous step a 2?"), add it as another dimension: `dp[i][last]`.
- **Base cases.** ways(0) is 1 if "standing still" counts as a way, which some versions of the problem expect; the code above only defines n ≥ 1. Decide and say so.
- **Unreachable states** in min/max problems must start at infinity (or −1 handled carefully), not 0, or impossible amounts look free.
- **Recursion depth.** Memoised recursion on n = 100,000 recurses 100,000 deep and overflows the call stack in most languages (Python's default limit is about 1,000 frames); switch to tabulation.
- **Greedy is not DP.** Greedy happens to work for some coin systems (like 1, 5, 10, 25) but not in general. Prove it or use DP.

## Memoisation vs tabulation

| | Memoisation (top-down) | Tabulation (bottom-up) |
|---|---|---|
| How | Recursive function + cache | Loop filling a table |
| Solves | Only the states actually reached | Every state in the table |
| Order | Found automatically by recursion | You must choose it |
| Overhead | Function calls, stack depth | None; easy to shrink to O(1) or one row |

Start with memoisation when the recurrence is clear but the order is not; convert to tabulation for speed, memory savings or very deep inputs.

## In the interview

Say the five steps out loud: state, recurrence, base cases, order, answer. Write the naive recursion first if it helps, point at the repeated subproblem, then add a memo. Interviewers like watching that progression happen. State complexity as states × work per state, and offer the space optimisation at the end. Classic follow-ups: climbing stairs with steps of 1, 2 or 3; coin change counting the *number* of ways instead of the minimum; longest common subsequence (a 2-D table); 0/1 knapsack.
