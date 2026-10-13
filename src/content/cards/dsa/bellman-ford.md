---
title: Bellman-Ford
track: dsa
tags: [graphs, shortest-path, negative-weights, dynamic-programming]
difficulty: 3
minutes: 5
tldr: "Shortest paths that tolerate negative edges: relax every edge, V − 1 times. If one more pass still improves anything, a negative cycle is reachable. O(V · E)."
analogy: "Rumours of cheaper routes spread one handshake per round. After V − 1 rounds, news has travelled along every possible simple route. If prices are still dropping after that, someone has found a loop that pays you to drive around it."
diagram: bellman-ford
story:
  - title: A graph with one negative edge
    text: "Four nodes, five directed edges, and B→A costs −2 (think of a rebate). Dijkstra's 'settle the closest node' rule is unsafe here. Bellman-Ford instead fixes an edge order and relaxes all edges again and again: if dist[u] + w < dist[v], lower dist[v]. We start from S with dist S = 0, rest ∞."
  - title: "Pass 1: relax all 5 edges in order"
    text: "Edges 1 and 2 start at A and B, which are still ∞, so they do nothing. S→B sets B = 4, S→A sets A = 5, and B→C sets C = 4 + 6 = 10. Each pass extends the known shortest paths by at least one more edge."
  - title: "Pass 2: the negative edge pays off"
    text: "Now A→C gives 5 + 3 = 8, lowering C from 10. B→A gives 4 − 2 = 2, lowering A from 5. The direct edge S→A lost to a two-edge detour, which only became visible once B's distance was known."
  - title: "Pass 3 = V − 1: all distances final"
    text: "A→C now gives 2 + 3 = 5. The shortest path S→B→A→C uses 3 edges, and a shortest path never needs more than V − 1 = 3 edges, so after 3 passes every distance is final: S 0, A 2, B 4, C 5."
  - title: "One extra pass: nothing changes"
    text: "Relax every edge once more. Nothing improves, which proves there is no negative cycle reachable from S, and the distances are trustworthy. The total work was at most V passes over E edges: O(V · E)."
  - title: "Add C→B −6: a negative cycle"
    text: "Now B→A→C→B sums to −2 + 3 − 6 = −5. Every lap around it is 5 cheaper, so 'shortest' has no answer. The check pass still lowers A, B and C, and that is exactly how Bellman-Ford detects the cycle and reports it instead of wrong numbers."
keyIdeas:
  - "**Relax every edge, V − 1 times.** After pass i, each dist is at most the best path that uses ≤ i edges."
  - "**Pass V is the test**: any improvement means a negative cycle is reachable from the source."
  - "**O(V · E)** time, slower than Dijkstra, but correct with negative weights. Stop early when a pass changes nothing."
  - "**Arbitrage**: use weights −log(rate); a profitable currency loop is a negative cycle."
  - "Limit to **k edges** by running k passes that read only the previous pass's distances (*Cheapest Flights Within K Stops*)."
quiz:
  - q: "Why are V − 1 passes always enough when there is no negative cycle?"
    options: ["Because each pass settles exactly one node", "A shortest path visits each node at most once, so it has at most V − 1 edges, and each pass extends correct paths by at least one edge", "Because the edges are sorted", "They are not; you need V² passes"]
    answer: 1
    why: "Without negative cycles, some shortest path is simple: at most V nodes, so V − 1 edges. Pass i guarantees every path of i edges has been accounted for."
  - q: "Bellman-Ford's extra pass lowers dist[X]. What can you conclude?"
    options: ["X is unreachable", "Some negative cycle is reachable from the source", "The edge order was wrong", "X has a negative edge into it but all is fine"]
    answer: 1
    why: "With no reachable negative cycle, all distances are final after V − 1 passes. A further improvement is only possible if a cycle keeps lowering the cost."
  - q: "Exchange rates USD→EUR 0.9, EUR→GBP 0.9, GBP→USD 1.3. How do you detect the arbitrage with Bellman-Ford?"
    options: ["Use the rates as weights and look for a positive cycle", "Use weights −log(rate); the loop's product 1.053 > 1 becomes a negative cycle", "Use weights 1/rate and run Dijkstra", "Sort the rates"]
    answer: 1
    why: "Multiplying rates becomes adding logs. A product above 1 means a sum of logs above 0, so the sum of −log(rate) is below 0: a negative cycle."
  - q: "When should you pick Bellman-Ford over Dijkstra?"
    options: ["Always — it is faster", "When some edge weights are negative or you must detect negative cycles", "When the graph is unweighted", "When the graph is very dense"]
    answer: 1
    why: "With non-negative weights Dijkstra's O((V + E) log V) is far faster. Bellman-Ford earns its O(V · E) only when negative edges or cycle detection matter."
bigO:
  - { op: "time", avg: "O(V · E)", note: "V − 1 passes over all edges, plus one check pass" }
  - { op: "best case (early stop)", avg: "O(E)", note: "a pass with no change ends it" }
  - { op: "space", avg: "O(V)", note: "dist and parent arrays" }
related: [dsa/dijkstra, dsa/dynamic-programming, dsa/graphs, dsa/topological-sort]
prereqs: [dsa/graphs, dsa/dijkstra]
flashcards:
  - kind: qa
    q: "How does Bellman-Ford detect a negative cycle?"
    a: "After V − 1 passes, run one more pass over all edges. If any edge can still be relaxed, a negative cycle is reachable from the source."
  - kind: cloze
    text: "Bellman-Ford relaxes every edge {{V − 1}} times and runs in {{O(V · E)}} time."
  - kind: qa
    q: "Why does an undirected graph with one negative edge always have a negative cycle?"
    a: "An undirected edge u–v of weight −w is two directed edges u→v and v→u, so going there and back costs −2w < 0."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Chapter 8, Bellman-Ford, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why another shortest-path algorithm?

Dijkstra's algorithm finalises the closest unsettled node because extending a path can never make it cheaper. **Negative edge weights** break that: a refund, a credit, a downhill energy gain, or the log of an exchange rate can make a longer path cheaper than a shorter one. **Bellman-Ford** computes single-source shortest paths with negative weights allowed, and it also tells you when the question has no answer because of a **negative cycle** — a loop whose weights sum to less than zero, which you could traverse forever to drive the cost to −∞.

## How it works

Keep `dist[v]` (0 for the source, ∞ elsewhere) and `parent[v]`. **Relaxing** an edge u → v of weight w means: if `dist[u] + w < dist[v]`, set `dist[v] = dist[u] + w` and `parent[v] = u`.

1. Repeat **V − 1 times**: relax **every** edge, in any fixed order.
2. Do one more pass. If any edge can still be relaxed, report a negative cycle.
3. Otherwise `dist` holds the shortest distances, and `parent` pointers rebuild the paths.

### Why V − 1 passes are enough

If no negative cycle is reachable, every node has a shortest path that is **simple** (no repeated node) — any cycle on it has weight ≥ 0 and could be cut out. A simple path visits at most V nodes, so it has at most **V − 1 edges**.

Claim: after pass i, `dist[v]` is at most the cost of the best path to v that uses at most i edges. True for i = 0 (only the source has a finite distance). If it holds after pass i, take the best path of ≤ i + 1 edges ending with edge u → v. The prefix to u uses ≤ i edges, so `dist[u]` is already at most its cost, and pass i + 1 relaxes u → v, bringing `dist[v]` down to at most the whole path's cost. So after V − 1 passes every distance is at most the true shortest distance — and it can never go below it, because every value of `dist` is the cost of some real path.

This is really **dynamic programming** over "number of edges allowed", done in place.

### Why the extra pass detects cycles

If all distances are final, no edge can be relaxed: `dist[v] ≤ dist[u] + w` for every edge. Suppose a negative cycle v₁ → v₂ → … → v₁ is reachable and yet no edge relaxes. Adding those inequalities around the cycle, the `dist` terms cancel and you get 0 ≤ (sum of the cycle's weights), contradicting that the sum is negative. So **some** edge on the cycle can always be relaxed.

## Worked example

Edges in relaxation order: (1) A→C 3, (2) B→A −2, (3) S→B 4, (4) S→A 5, (5) B→C 6. V = 4, so 3 passes.

| Pass | What changes | S | A | B | C |
|---|---|---|---|---|---|
| start | | 0 | ∞ | ∞ | ∞ |
| 1 | S→B: 4; S→A: 5; B→C: 10 | 0 | 5 | 4 | 10 |
| 2 | A→C: 8; B→A: 4 − 2 = 2 | 0 | 2 | 4 | 8 |
| 3 | A→C: 2 + 3 = 5 | 0 | 2 | 4 | 5 |
| check | nothing | 0 | 2 | 4 | 5 |

The shortest path to C is S → B → A → C = 4 − 2 + 3 = **5**, three edges, which is why it took all three passes with this (deliberately unlucky) edge order. Had the edges been listed S→B, B→A, A→C first, one pass would have sufficed — order affects speed, never the final answer.

Now add C→B with weight −6. The cycle B → A → C → B sums to −2 + 3 − 6 = **−5**. After three passes the values are still falling (A 0, B −1, C 5), and the check pass lowers C to 3, A to −3 and B to −3. A negative cycle is reported.

## Implement it in Python

The same idea works in any language; only the syntax changes. Here it is in Python.

```python
def bellman_ford(nodes, edges, source):
    """edges: list of (u, v, w). Returns (dist, parent), or None if a negative cycle is reachable."""
    dist = {v: float("inf") for v in nodes}
    parent = {v: None for v in nodes}
    dist[source] = 0
    for _ in range(len(nodes) - 1):              # a shortest path has at most V-1 edges
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:            # relax (inf + w stays inf)
                dist[v] = dist[u] + w
                parent[v] = u
                changed = True
        if not changed:                          # converged early
            break
    for u, v, w in edges:                        # one extra pass: any improvement = cycle
        if dist[u] + w < dist[v]:
            return None
    return dist, parent

NODES = ["S", "A", "B", "C"]
EDGES = [("A", "C", 3), ("B", "A", -2), ("S", "B", 4), ("S", "A", 5), ("B", "C", 6)]
print(bellman_ford(NODES, EDGES, "S"))
# ({'S': 0, 'A': 2, 'B': 4, 'C': 5}, {'S': None, 'A': 'B', 'B': 'S', 'C': 'A'})
print(bellman_ford(NODES, EDGES + [("C", "B", -6)], "S"))   # None
```

In Python `float("inf") + w` stays infinite, so unreachable sources never relax anything. In languages with integer "infinity" (such as `INT_MAX`), check `dist[u] != INF` first, or the addition overflows.

## When to use it

- **Negative edge weights** without negative cycles: Bellman-Ford is the standard single-source answer. (On a DAG, a topological-order DP is faster: O(V + E) even with negative weights.)
- **Negative-cycle detection.** To find a cycle *anywhere*, not just reachable from one source, start with `dist = 0` for every node (equivalent to a virtual source with 0-weight edges to all nodes).
- **Currency arbitrage.** Make each rate an edge with weight −log(rate). A loop whose rates multiply to more than 1 has −log weights summing below 0: a negative cycle. For USD→EUR 0.9, EUR→GBP 0.9, GBP→USD 1.3 the product is 1.053, a 5.3 % profit per lap.
- **Distance-vector routing** (as in RIP) is a distributed Bellman-Ford: each router repeatedly relaxes using its neighbours' advertised distances.
- **Johnson's algorithm** runs Bellman-Ford once to reweight all edges to non-negative values, then Dijkstra from every node.

## Edge cases and pitfalls

- **Unreachable negative cycles** are not reported, and they do not affect reachable distances; that is usually what you want.
- **Recovering the cycle**: take any node v relaxed in the check pass, follow `parent` V times to be sure you are on the cycle, then follow parents until you return.
- **Undirected graphs**: a negative undirected edge is a 2-edge negative cycle by itself. Bellman-Ford is for directed graphs.
- **At most k edges** (*Cheapest Flights Within K Stops*, where k stops means k + 1 edges): run k + 1 passes, and in each pass read distances from a **copy** of the previous pass. Updating in place lets one pass chain several edges and break the limit.
- **SPFA** (a queue of nodes whose distance changed) is often faster in practice but has the same O(V · E) worst case.

## In the interview

Say why Dijkstra fails (the greedy settle step assumes non-negative weights), then describe "relax all edges V − 1 times, then one check pass", justify V − 1 with the simple-path argument, and give O(V · E). Strong follow-ups to have ready: the k-edge variant with a copied array, arbitrage via −log, and how to print the actual negative cycle.
