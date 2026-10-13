---
title: Greedy Algorithms
track: dsa
tags: [greedy, intervals, proofs, optimisation]
difficulty: 2
minutes: 5
tldr: "Build the answer one step at a time, always taking the choice that looks best right now and never undoing it. Fast and simple, but only correct when you can prove the local choice is safe."
analogy: "Packing a day of back-to-back meetings into one room: always book the meeting that frees the room soonest. It feels short-sighted, yet it never leaves you worse off than any cleverer plan, because you always have the most time left."
diagram: greedy-algorithms
story:
  - title: One room, as many meetings as possible
    text: "Seven meeting requests, each a start and end hour, and one room. Two meetings clash if they overlap; one may start at the exact hour another ends. Which set is the largest with no clashes? Trying every subset would be 2⁷ = 128 checks, and 2ⁿ in general."
  - title: Take the meeting that ends first
    text: "Greedy rule: sort by finish time and take the meeting that ends earliest, A at hour 4. Walking on in finish order, B and C start before 4, so they clash with A and are crossed out. Taking A leaves the room free as early as possible."
  - title: Next one starting at or after 4
    text: "Repeat the same rule on what is left. D starts at 5, after A ends, and finishes at 7, the earliest finish among the compatible meetings. E and F start before 7 and are crossed out."
  - title: "Then G: 3 meetings, the maximum"
    text: "G starts at 8 and ends at 11. The answer is A, D, G: three meetings, after one sort and one pass, O(n log n). Choosing by earliest start instead would take C first and fit only 2."
  - title: "Exchange argument: swapping in A is safe"
    text: "Why is this optimal? Take any best plan, say B, D, G. Swap its first meeting for A. A ends no later than B, so A clashes with nothing that B did not clash with. The plan stays valid and just as large, so some best plan starts with A. The same argument then repeats for the rest."
  - title: "But greedy can fail: coins {1, 3, 4}, make 6"
    text: "Greedy is not always right. To pay 6 with coins 1, 3 and 4, 'largest coin first' takes 4, then 1, then 1: three coins. The best answer is 3 + 3, two coins. Here an early greedy choice blocks a better finish, so you need dynamic programming."
keyIdeas:
  - "**Greedy** = make the locally best choice, commit to it, and solve the smaller problem that remains."
  - "It is correct only with the **greedy-choice property** (some optimal solution starts with the greedy choice) plus **optimal substructure**."
  - "Prove it with an **exchange argument**: swap the greedy choice into any optimal solution and show it is no worse."
  - "**Interval scheduling**: sort by **end** time, take each meeting that starts after the last one ends. O(n log n)."
  - "When a counter-example exists (coins {1, 3, 4} for 6), switch to **dynamic programming**."
quiz:
  - q: "To fit the most non-overlapping intervals, which sort key makes the greedy correct?"
    options: ["Earliest start time", "Shortest duration", "Earliest end time", "Fewest overlaps with others"]
    answer: 2
    why: "Earliest end leaves the most room for the rest, and the exchange argument proves it. Earliest start and shortest duration both have counter-examples, e.g. [0,4], [3,5], [4,8] for shortest first."
  - q: "Coins {1, 3, 4}, amount 6. What does 'largest coin first' return, and is it optimal?"
    options: ["3 + 3, optimal", "4 + 1 + 1, not optimal", "4 + 1 + 1, optimal", "It finds no answer"]
    answer: 1
    why: "Greedy takes 4, leaving 2, which needs 1 + 1: three coins. Two 3s use only two coins, so greedy fails for this coin system."
  - q: "What does an exchange argument show?"
    options: ["That the algorithm runs in O(n log n)", "That any optimal solution can be changed to include the greedy choice without getting worse", "That greedy and DP give the same answer for every input", "That the input must be sorted"]
    answer: 1
    why: "If some optimal solution contains the greedy choice, committing to it is safe; then optimal substructure lets you repeat the argument on what remains."
  - q: "Which problem is NOT solved correctly by a simple greedy?"
    options: ["Fractional knapsack (take items by value per kg)", "0/1 knapsack (items cannot be split)", "Minimum spanning tree (Kruskal)", "Interval scheduling by earliest end"]
    answer: 1
    why: "In 0/1 knapsack the best-ratio item can waste capacity that two other items would fill better; it needs DP. The others have greedy proofs."
bigO:
  - { op: "interval scheduling", avg: "O(n log n)", note: "sort by end time + one pass" }
  - { op: "greedy coin change", avg: "O(k log k + answer)", note: "fast, but only right for canonical coin systems" }
  - { op: "DP coin change (always right)", avg: "O(amount · k)", note: "k = number of coin types" }
related: [dsa/intervals, dsa/dynamic-programming, dsa/minimum-spanning-trees, dsa/dijkstra]
prereqs: [dsa/sorting-overview]
flashcards:
  - kind: qa
    q: "Why does sorting by earliest finish time maximise the number of non-overlapping meetings?"
    a: "Exchange argument: the earliest-finishing meeting ends no later than the first meeting of any optimal plan, so swapping it in keeps the plan valid and the same size; repeat on the rest."
  - kind: cloze
    text: "A greedy algorithm is correct when the problem has the {{greedy-choice property}} and {{optimal substructure}}."
  - kind: qa
    q: "Give a coin system where 'largest coin first' fails."
    a: "Coins {1, 3, 4} for amount 6: greedy gives 4 + 1 + 1 (3 coins), the optimum is 3 + 3 (2 coins)."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Chapter 4, greedy algorithms, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What "greedy" means

An optimisation problem asks for the best solution among many: the most meetings, the fewest coins, the cheapest network. A **greedy algorithm** builds the solution in steps, and at each step makes the choice that looks best right now (the meeting that ends soonest, the biggest coin, the cheapest edge), **commits to it for good**, and then solves the smaller problem that remains. There is no backtracking and no table of sub-results, which is why greedy algorithms are short and fast (often just a sort and a loop).

The catch: a locally best choice can be globally wrong. A greedy algorithm is only correct when two properties hold:

- **Greedy-choice property**: there is an optimal solution that contains the greedy choice. So committing to it never rules out the best answer.
- **Optimal substructure**: after the choice, what remains is a smaller instance of the same problem, and an optimal solution to it plus the greedy choice is optimal overall.

You do not get these for free; you prove them, usually with an exchange argument.

## How it works: interval scheduling

**Problem.** Given meetings `[start, end)`, choose as many as possible with no two overlapping (one may start exactly when another ends).

**Greedy rule.** Sort by **end time**. Walk through the list, keeping the end time of the last meeting you took; take a meeting whenever its start is at or after that time.

**Exchange argument.** Let g be the meeting with the earliest end, and let OPT be any optimal schedule, with first meeting f. Since g ends earliest of all, `end(g) ≤ end(f)`. Every other meeting in OPT starts at or after `end(f)`, hence at or after `end(g)`. So replacing f with g gives a valid schedule of the same size: **some optimal schedule begins with g**. Once g is chosen, the remaining problem is "the meetings starting at or after `end(g)`", the same problem on a smaller input, and the same argument applies again. By induction the greedy schedule is optimal.

Other natural rules fail. **Earliest start** can pick one long meeting that blocks many short ones. **Shortest duration** fails on `[0,4], [3,5], [4,8]`: it picks `[3,5]`, which clashes with both others, giving 1 instead of 2. Having a counter-example in mind is the quickest way to reject a tempting greedy.

## Worked example

Meetings (start, end): A (1, 4), B (3, 5), C (0, 6), D (5, 7), E (3, 9), F (6, 10), G (8, 11). They are already sorted by end.

| Meeting | Start | End | Room free at | Decision |
|---|---|---|---|---|
| A | 1 | 4 | −∞ | take → free at 4 |
| B | 3 | 5 | 4 | 3 < 4, skip |
| C | 0 | 6 | 4 | skip |
| D | 5 | 7 | 4 | 5 ≥ 4, take → free at 7 |
| E | 3 | 9 | 7 | skip |
| F | 6 | 10 | 7 | skip |
| G | 8 | 11 | 7 | 8 ≥ 7, take → free at 11 |

Result **A, D, G: 3 meetings**. A brute-force check of all 128 subsets confirms 3 is the maximum. B, D, G is another optimal schedule, and swapping its B for A is exactly the exchange argument. Earliest-start greedy would take C (0–6), then F (6–10), and stop at 2.

## When greedy fails: coin change

Pay an amount with the fewest coins. "Take the largest coin that fits" works for coins like {1, 5, 10, 25} (such systems are called **canonical**), but not in general. With coins **{1, 3, 4}** and amount **6**, greedy takes 4, leaving 2, then 1 and 1: **3 coins**. The optimum is 3 + 3: **2 coins**. The greedy-choice property is false here, because no optimal solution uses the coin 4. Committing to it was a mistake that can never be undone.

The fix is **dynamic programming**: `best[a] = 1 + min(best[a − c])` over all coins c ≤ a, which considers every first coin rather than one.

## Implement it in Python

The meeting scheduler, plus both coin-change versions so you can watch greedy lose to DP on {1, 3, 4}.

```python
def max_meetings(meetings):
    """meetings: list of (name, start, end). Returns a largest set with no overlaps."""
    chosen, free_at = [], float("-inf")
    for name, start, end in sorted(meetings, key=lambda m: m[2]):  # earliest finish first
        if start >= free_at:                     # starts after the last chosen one ends
            chosen.append(name)
            free_at = end
    return chosen

def greedy_coins(coins, amount):
    """Largest coin first. Fast, but only optimal for some coin systems."""
    used = []
    for c in sorted(coins, reverse=True):
        while amount >= c:
            amount -= c
            used.append(c)
    return used if amount == 0 else None

def min_coins(coins, amount):
    """Dynamic programming: always optimal. best[a] = fewest coins summing to a."""
    best = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        best[a] = min((best[a - c] + 1 for c in coins if c <= a), default=float("inf"))
    return best[amount]

MEETINGS = [("A", 1, 4), ("B", 3, 5), ("C", 0, 6), ("D", 5, 7),
            ("E", 3, 9), ("F", 6, 10), ("G", 8, 11)]
print(max_meetings(MEETINGS))       # ['A', 'D', 'G']
print(greedy_coins([1, 3, 4], 6))   # [4, 1, 1]  -> 3 coins
print(min_coins([1, 3, 4], 6))      # 2          (3 + 3)
```

## Famous greedy algorithms

- **Dijkstra's shortest paths**: settle the closest unsettled node (needs non-negative weights).
- **Kruskal and Prim** for minimum spanning trees: the cut property is their exchange argument.
- **Huffman coding**: repeatedly merge the two least frequent symbols.
- **Fractional knapsack**: take items by value per kilogram; the last one may be split. (The 0/1 version, where items cannot be split, needs DP.)
- **Jump Game**, **Gas Station**, **Task Scheduler**, **Minimum Arrows to Burst Balloons** and **Non-overlapping Intervals** are common interview greedies; the last two are interval scheduling in disguise.

## Edge cases and pitfalls

- **Pick the right sort key.** For "remove the fewest intervals to make the rest non-overlapping", the answer is n minus the interval-scheduling result, so you still sort by end.
- **Touching endpoints.** Decide whether `[1,4)` and `[4,7)` clash, and use `>=` or `>` to match.
- **A plausible greedy is not a proof.** Test it on tiny inputs against brute force; if any case disagrees, use DP or search instead.
- **Ties** rarely matter for correctness, but make sure your comparator is deterministic so that results are reproducible.

## In the interview

Say the greedy rule in one sentence, then justify it. Interviewers care about the *why*. A crisp exchange argument ("swap the greedy choice into any optimal answer; it is no worse") is the strongest signal. If you cannot prove it, try a small counter-example out loud; finding one and pivoting to DP is also a good answer. State the cost, usually O(n log n) for the sort plus O(n) for the scan. Expect follow-ups like "now meetings have weights" (weighted interval scheduling: greedy fails, use DP with binary search) or "how many rooms do you need for all meetings?" (sort the start and end times and sweep, or use a min-heap of end times).
