---
title: Dijkstra's Algorithm
track: dsa
tags: [graphs, shortest-path, heaps, greedy]
difficulty: 2
minutes: 5
tldr: "Shortest paths from one source when no edge weight is negative: always settle the closest unsettled node (a min-heap finds it), then relax its edges. O((V + E) log V)."
analogy: "Water poured at the source spreads along pipes at constant speed. It reaches each junction for the first time along the shortest route, and once a junction is wet it can never be reached any earlier."
diagram: dijkstra
story:
  - title: A weighted graph; start at A
    text: "Six towns joined by roads with lengths (weights). We want the shortest distance from A to every town. The table holds the best distance found so far: 0 for A, ∞ (not reached yet) for everyone else. A min-heap of (distance, node) pairs starts with (0, A)."
  - title: Pop A and relax its edges
    text: "Pop the smallest entry, A at 0. Relaxing an edge u–v means: if dist[u] + weight < dist[v], lower dist[v], record u as v's parent and push v. So B becomes 0 + 4 = 4 and C becomes 0 + 1 = 1. A is now settled: its distance is final."
  - title: "Pop C (1): a cheaper way to B"
    text: "The closest unsettled node is C at 1. Through C, B costs 1 + 2 = 3, beating 4, so B drops to 3 even though A had a direct road. D gets 1 + 8 = 9 and E gets 1 + 10 = 11. This is why we never finalise a node early."
  - title: Pop B (3), then D (8)
    text: "B at 3 is next: D improves from 9 to 3 + 5 = 8. Then D at 8 is the closest: E improves from 11 to 10 and F gets 8 + 6 = 14. Each pop settles one node; the old heap entries (4, B) and (9, D) are now stale and are skipped when popped."
  - title: Pop E, F; walk the parents back
    text: "E at 10 lowers F to 10 + 3 = 13, and F is popped last at 13. Final distances: A 0, B 3, C 1, D 8, E 10, F 13. Following parents back from F gives F ← E ← D ← B ← C ← A, so the shortest route is A, C, B, D, E, F."
  - title: A negative edge breaks the guarantee
    text: "With weights S→X 2, S→Y 3 and Y→X −2, Dijkstra settles X at 2 because nothing seemed cheaper. Only later does S→Y→X reveal a cost of 1. Settling assumes paths never get shorter as they grow, which a negative edge violates. Use Bellman-Ford instead."
keyIdeas:
  - "**Greedy rule**: the unsettled node with the smallest tentative distance is final. That is safe only because **no weight is negative**."
  - "**Relax** edge u→v: if `dist[u] + w < dist[v]`, set `dist[v]` and `parent[v] = u`, and push v onto the heap."
  - "**Lazy deletion**: push a new entry when a distance drops and skip popped entries larger than `dist[u]`."
  - "Binary heap: **O((V + E) log V)**. Rebuild any path by following `parent` back from the target."
  - "Unweighted graph → BFS is enough; negative edges → Bellman-Ford."
quiz:
  - q: "After popping A (dist 0) you have B = 4 via a direct edge. Why can't you declare B final yet?"
    options: ["Because B has more than one neighbour", "Because a cheaper route through another node, like C at 1, may still exist", "Because the heap is not sorted", "You can; Dijkstra finalises neighbours immediately"]
    answer: 1
    why: "Only the smallest entry in the heap is safe to finalise. C at 1 is smaller than B at 4, and indeed A→C→B costs 3."
  - q: "Why does Dijkstra fail with negative edge weights?"
    options: ["The heap cannot store negative numbers", "A settled node might later be reached more cheaply through a negative edge", "It loops forever on every graph", "It only fails on undirected graphs"]
    answer: 1
    why: "Settling relies on extending a path never making it cheaper. A negative edge can make a longer path cheaper after the node was already finalised."
  - q: "Using a binary heap with lazy deletion, what is the running time?"
    options: ["O(V²)", "O(V + E)", "O((V + E) log V)", "O(V · E)"]
    answer: 2
    why: "Every successful relaxation pushes once (at most E pushes) and every pop costs O(log E) = O(log V). Plus O(V + E) to scan nodes and edges."
  - q: "Your heap pops (9, D) but dist[D] is already 8. What should the code do?"
    options: ["Relax D's edges again with 9", "Skip it: it is a stale entry", "Update dist[D] to 9", "Stop the algorithm"]
    answer: 1
    why: "D was already settled at 8 via a better entry. Processing the stale entry wastes work and could never improve anything."
bigO:
  - { op: "binary heap (typical)", avg: "O((V + E) log V)", note: "lazy deletion; heap holds up to E entries" }
  - { op: "array, no heap", avg: "O(V²)", note: "better for very dense graphs" }
  - { op: "Fibonacci heap", avg: "O(E + V log V)", note: "theoretical; rarely used in practice" }
  - { op: "space", avg: "O(V + E)" }
related: [dsa/bellman-ford, dsa/heaps, dsa/bfs-and-dfs, dsa/greedy-algorithms]
prereqs: [dsa/graphs, dsa/heaps, dsa/bfs-and-dfs]
flashcards:
  - kind: qa
    q: "What does it mean to relax an edge u→v of weight w?"
    a: "If dist[u] + w < dist[v], set dist[v] = dist[u] + w and parent[v] = u (and push v onto the heap)."
  - kind: cloze
    text: "Dijkstra needs all edge weights to be {{non-negative}}; with a binary heap it runs in {{O((V + E) log V)}}."
  - kind: qa
    q: "How do you return the actual shortest path, not just its length?"
    a: "Store parent[v] whenever you lower dist[v]; at the end walk parents from the target back to the source and reverse the list."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Chapter 8, shortest paths, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: dijkstra
---

## The problem

You have a graph whose edges carry **weights** (road lengths, latencies, costs) and a **source** node. You want the cheapest total weight from the source to every other node: the **single-source shortest paths**. BFS solves this only when every edge costs the same, because it counts edges. With weights, two short roads can beat one long one, so we need something smarter. **Dijkstra's algorithm** solves it whenever every weight is **≥ 0**.

## How it works

Keep two pieces of state:

- `dist[v]`: the cheapest distance to v found so far (start: 0 for the source, ∞ for everyone else).
- A **min-heap** (priority queue) of `(dist, node)` pairs, so you can always pull out the closest candidate in O(log n).

Then loop:

1. **Pop** the pair with the smallest distance, `(d, u)`. If `d > dist[u]`, it is a stale leftover, so skip it.
2. Otherwise u is **settled**: `d` is its true shortest distance.
3. **Relax** every edge u → v with weight w: if `d + w < dist[v]`, set `dist[v] = d + w`, set `parent[v] = u`, and push `(dist[v], v)`.

Stop when the heap is empty (or, if you only need one target, as soon as you pop it).

### Why popping the minimum is safe

Suppose u is popped with distance d, the smallest in the heap. Could some other path to u be cheaper? Any such path leaves the settled region at some edge into an unsettled node x. The path's cost up to x is at least `dist[x]`, which is ≥ d because d was the minimum. The rest of the path, from x to u, adds weights that are **all ≥ 0**, so the whole path costs at least d. Hence d is optimal. This is the greedy-choice argument, and the step "the rest adds ≥ 0" is precisely where negative edges break it.

## Worked example

Undirected edges: A–B 4, A–C 1, B–C 2, B–D 5, C–D 8, C–E 10, D–E 2, D–F 6, E–F 3. Source A.

| Pop | Relaxations | dist (A B C D E F) | Heap afterwards |
|---|---|---|---|
| (none) | start | 0 ∞ ∞ ∞ ∞ ∞ | (0,A) |
| A, 0 | B = 4, C = 1 | 0 4 1 ∞ ∞ ∞ | (1,C) (4,B) |
| C, 1 | B 4→3, D = 9, E = 11 | 0 3 1 9 11 ∞ | (3,B) (4,B) (9,D) (11,E) |
| B, 3 | D 9→8 | 0 3 1 8 11 ∞ | (4,B) (8,D) (9,D) (11,E) |
| (4,B) | stale, skipped | | (8,D) (9,D) (11,E) |
| D, 8 | E 11→10, F = 14 | 0 3 1 8 10 14 | (9,D) (10,E) (11,E) (14,F) |
| (9,D) | stale, skipped | | (10,E) (11,E) (14,F) |
| E, 10 | F 14→13 | 0 3 1 8 10 13 | (11,E) (13,F) (14,F) |
| (11,E) | stale, skipped | | (13,F) (14,F) |
| F, 13 | nothing better | final | (14,F) → skipped |

Parents: C ← A, B ← C, D ← B, E ← D, F ← E. Walking back from F: **A → C → B → D → E → F**, total 1 + 2 + 5 + 2 + 3 = **13**. Notice the direct roads A–B (4) and D–F (6) both lost to detours.

## Implement it in Python

This runs on the six-town graph from the worked example and prints the same distances and route.

```python
import heapq

def dijkstra(graph, source):
    """graph: {u: [(v, weight), ...]} with weights >= 0. Returns (dist, parent)."""
    dist = {v: float("inf") for v in graph}
    parent = {v: None for v in graph}
    dist[source] = 0
    heap = [(0, source)]                         # (distance so far, node)
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:                          # stale entry: u already settled cheaper
            continue
        for v, w in graph[u]:
            if d + w < dist[v]:                  # relax edge u -> v
                dist[v] = d + w
                parent[v] = u
                heapq.heappush(heap, (dist[v], v))
    return dist, parent

def path_to(parent, target):
    path = []
    while target is not None:                    # walk parents back to the source
        path.append(target)
        target = parent[target]
    return path[::-1]

EDGES = [("A", "B", 4), ("A", "C", 1), ("B", "C", 2), ("B", "D", 5), ("C", "D", 8),
         ("C", "E", 10), ("D", "E", 2), ("D", "F", 6), ("E", "F", 3)]
graph = {v: [] for v in "ABCDEF"}
for u, v, w in EDGES:                            # undirected: add both directions
    graph[u].append((v, w))
    graph[v].append((u, w))

dist, parent = dijkstra(graph, "A")
print(dist)                  # {'A': 0, 'B': 3, 'C': 1, 'D': 8, 'E': 10, 'F': 13}
print(path_to(parent, "F"))  # ['A', 'C', 'B', 'D', 'E', 'F']
```

Most library heaps (Python's `heapq`, Java's `PriorityQueue`, C++'s `std::priority_queue`) have no efficient "decrease key" operation, so instead of updating an entry we push a new one and skip the old one when it surfaces (**lazy deletion**). The heap can hold up to E entries, and log E ≤ 2 log V, so the bound stays **O((V + E) log V)**.

## Why negative edges break it

Directed edges S→X 2, S→Y 3, Y→X −2. The textbook algorithm pops S, sets X = 2 and Y = 3, then pops X at 2 and declares it final. Popping Y reveals S→Y→X = 3 − 2 = 1, but X was already settled, so the answer 2 is wrong. The proof above relied on "the rest of the path adds ≥ 0", which is false here.

Adding a constant to every weight does **not** fix this: it penalises paths with more edges, so it changes which path is shortest. The lazy-deletion code above happens to re-process X when its distance drops, and on this tiny graph it recovers 1, but in general that turns it into a label-correcting search with exponential worst-case time and no guarantee. With negative weights, use **Bellman-Ford** (O(VE), also detects negative cycles), or for all-pairs on sparse graphs, Johnson's algorithm, which reweights edges using Bellman-Ford potentials so Dijkstra can run safely.

## Edge cases and pitfalls

- **Skip stale entries.** Without the `d > dist[u]` check you re-relax edges with outdated distances. The answer is still correct for non-negative weights, just slower.
- **Unreachable nodes** keep `dist = ∞`; check before printing a path.
- **Early exit** for a single target is valid when you *pop* it, not when you first *push* it.
- **Ties** in the heap are fine; if nodes are not comparable objects, push `(dist, counter, node)` to avoid comparing them.
- **Dense graphs** (E close to V²): the simple O(V²) array version, which scans for the minimum each round, beats the heap.
- **Grid with 0/1 weights**: a deque-based **0-1 BFS** is O(V + E).

## In the interview

Typical prompts: *Network Delay Time* (max of all dist values), *Cheapest Flights* (often with a stop limit, which changes the state to (node, stops)), *Path With Minimum Effort* (a path costs its largest step instead of a sum, and Dijkstra still works because extending a path never lowers that maximum). State the non-negative requirement, the heap, lazy deletion and O((V + E) log V), and reconstruct the path with parents. Expect the follow-up "what if weights can be negative?". Answer Bellman-Ford and explain why the greedy proof fails.
