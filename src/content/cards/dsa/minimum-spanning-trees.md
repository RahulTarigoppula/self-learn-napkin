---
title: Minimum Spanning Trees
track: dsa
tags: [graphs, greedy, union-find, heaps]
difficulty: 2
minutes: 5
tldr: "Connect every node of a weighted graph using the cheapest set of edges with no cycles. Kruskal adds edges cheapest-first and skips any that would close a cycle."
analogy: "Wiring a set of villages to the power grid. You do not care how far power travels, only that every village is connected and you lay as little cable as possible. Any loop in the cable would be wasted money."
diagram: minimum-spanning-trees
story:
  - title: Connect all six nodes as cheaply as possible
    text: "Six towns and nine possible cables with their costs. A spanning tree uses exactly V − 1 = 5 edges to connect all six towns with no cycle. Among all spanning trees we want the one with the smallest total weight: the minimum spanning tree (MST)."
  - title: "Kruskal: sort the edges by weight"
    text: "Kruskal's algorithm is greedy: consider edges from cheapest to most expensive, and keep an edge whenever it connects two pieces that are not yet connected. Sorting gives C–F 1, A–D 2, B–E 3, A–B 4, A–E 5, B–C 6 and so on."
  - title: "Take 1, 2, 3, 4: each joins two pieces"
    text: "C–F, A–D, B–E and A–B each connect towns that were in different pieces, so all four are kept. A union-find structure tracks the pieces: now {A, B, D, E} and {C, F}. Checking an edge costs almost O(1)."
  - title: "Skip A–E 5: it would close a cycle"
    text: "A and E are already connected through A–B–E, so find(A) equals find(E). Adding A–E would create a loop and pay 5 for no new connection. Kruskal skips it."
  - title: "B–C 6 joins the last piece"
    text: "B–C links {A, B, D, E} with {C, F}. We now have 5 edges for 6 nodes, so the tree is complete and the remaining edges are never needed. Total weight: 1 + 2 + 3 + 4 + 6 = 16."
  - title: "Why it works: the cut property"
    text: "Split the nodes into any two groups, here {C, F} and the rest. Some tree edge must cross the split, and the cheapest crossing edge (B–C, 6) can always be used: swapping it in never costs more. Every edge Kruskal keeps is the cheapest across some cut."
keyIdeas:
  - "An MST connects all V nodes with **V − 1 edges, no cycles, minimum total weight**."
  - "**Kruskal**: sort edges, add each one whose endpoints are in different union-find sets. O(E log E)."
  - "**Prim**: grow one tree from a start node, always adding the cheapest edge that leaves it (min-heap). O(E log V)."
  - "**Cut property**: the lightest edge crossing any cut is in some MST. Both algorithms are just ways of applying it."
  - "With all weights distinct the MST is **unique**. An MST is not a shortest-path tree."
quiz:
  - q: "Kruskal reaches edge X–Y and find(X) == find(Y). What does it do, and why?"
    options: ["Adds it, because it is the cheapest left", "Skips it, because X and Y are already connected so it would form a cycle", "Stops the algorithm", "Swaps it with the heaviest edge so far"]
    answer: 1
    why: "Same set means a path between X and Y already exists. The new edge would close a cycle and add weight without connecting anything new."
  - q: "A connected graph has 8 nodes. How many edges does any spanning tree have?"
    options: ["8", "7", "It depends on the weights", "Up to 28"]
    answer: 1
    why: "A tree on V nodes always has exactly V − 1 edges: fewer would leave it disconnected, more would create a cycle."
  - q: "Is the path between two nodes in an MST always their shortest path in the graph?"
    options: ["Yes, always", "No — the MST minimises total cable, not the distance between any particular pair", "Only for Prim's tree", "Only if weights are distinct"]
    answer: 1
    why: "Example: a triangle with edges 2, 2 and 3. The MST keeps the two 2s, so the endpoints of the 3-edge are 4 apart in the tree but only 3 apart in the graph."
  - q: "Which property justifies keeping the cheapest edge crossing a cut?"
    options: ["The cut property: some MST contains it, because swapping it in for any other crossing edge does not increase the weight", "Optimal substructure of shortest paths", "The handshake lemma", "Edges are sorted"]
    answer: 0
    why: "Any spanning tree must cross the cut. Exchanging its crossing edge for the lightest one keeps a spanning tree and never increases the total."
bigO:
  - { op: "Kruskal", avg: "O(E log E)", note: "dominated by sorting; union-find is nearly O(1) per edge" }
  - { op: "Prim, binary heap", avg: "O(E log V)" }
  - { op: "Prim, array", avg: "O(V²)", note: "best for dense graphs" }
  - { op: "edges in the tree", avg: "V − 1" }
related: [dsa/union-find, dsa/greedy-algorithms, dsa/dijkstra, dsa/heaps]
prereqs: [dsa/graphs, dsa/union-find]
flashcards:
  - kind: qa
    q: "State the cut property."
    a: "For any split of the nodes into two non-empty groups, a minimum-weight edge crossing the split belongs to some minimum spanning tree."
  - kind: cloze
    text: "Kruskal uses {{union-find}} to reject edges that would form a {{cycle}}."
  - kind: qa
    q: "How does an MST give you k clusters?"
    a: "Run Kruskal but stop when k pieces remain (equivalently, delete the k − 1 heaviest MST edges). This is single-linkage clustering and maximises the gap between clusters."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Chapter 7, minimum spanning trees, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: mst
---

## The problem

You have an **undirected, connected, weighted graph**: towns and the cost of a cable between pairs of them, computers and the cost of a link, points and their distances. You want to pick some edges so that every node can reach every other node, paying the least possible total.

The cheapest such set never contains a cycle: on a cycle you could delete any edge and everything would stay connected for less (or the same, with a zero-weight edge). A connected set of edges with no cycle is a **tree**, and one that touches every node is a **spanning tree**. A tree on V nodes always has exactly **V − 1 edges**. The **minimum spanning tree (MST)** is a spanning tree with the smallest total weight.

## The cut property — why greed works

A **cut** splits the nodes into two non-empty groups. An edge **crosses** the cut if its endpoints are in different groups.

> **Cut property:** for any cut, a lightest edge crossing it belongs to some MST.

Why: take any MST T that does not use the lightest crossing edge e = (u, v). Adding e to T creates exactly one cycle. That cycle goes from u to v and back, so it must cross the cut a second time, through some other edge f. Remove f: the result is still a spanning tree, and since w(e) ≤ w(f), it costs no more than T. So an MST containing e exists.

The mirror image, the **cycle property**, says a strictly heaviest edge on any cycle is in no MST. Kruskal's "skip edges that close a cycle" is that rule in action: when an edge closes a cycle, every other edge on that cycle was considered earlier, so it is the heaviest.

## Kruskal's algorithm

1. Sort all edges by weight, cheapest first.
2. Start with every node in its own piece (a **union-find** / disjoint-set structure).
3. For each edge (u, v): if `find(u) != find(v)`, keep the edge and `union` the two pieces. Otherwise skip it — u and v are already connected.
4. Stop after V − 1 edges.

Each kept edge is the lightest edge crossing the cut between u's piece and everything else (any lighter crossing edge would already have been kept), so the cut property makes every choice safe.

**Cost:** sorting is O(E log E), which equals O(E log V) since E ≤ V². With path compression and union by rank, the union-find operations are effectively constant (inverse Ackermann), so sorting dominates.

## Prim's algorithm

Grow a single tree instead of merging pieces. Start from any node. Repeatedly add the cheapest edge that connects a tree node to a non-tree node, using a min-heap of candidate edges and skipping edges whose far end is already in the tree. The cut here is "tree versus everything else", so again every choice is safe.

**Cost:** O(E log V) with a binary heap. For dense graphs, an array of "cheapest edge to the tree" per node gives O(V²), which wins when E is close to V². Prim looks like Dijkstra, but the heap key is **one edge's weight**, not the total distance from the start.

## Worked example

Edges: A–B 4, A–D 2, A–E 5, B–E 3, B–C 6, C–E 7, C–F 1, E–F 8, D–E 9.

**Kruskal**, edges in sorted order:

| Edge | Weight | find equal? | Action | Pieces afterwards |
|---|---|---|---|---|
| C–F | 1 | no | keep | {C,F} |
| A–D | 2 | no | keep | {A,D} {C,F} |
| B–E | 3 | no | keep | {A,D} {B,E} {C,F} |
| A–B | 4 | no | keep | {A,B,D,E} {C,F} |
| A–E | 5 | yes | **skip** (cycle A–B–E) | unchanged |
| B–C | 6 | no | keep — 5 edges, stop | {A,B,C,D,E,F} |

Total weight **1 + 2 + 3 + 4 + 6 = 16**.

**Prim from A:** candidates A–D 2, A–B 4, A–E 5. Take D (2). Take B (4), adding candidates B–E 3 and B–C 6. Take E (3). A–E 5 is now stale (E is in the tree), so take C (6), then F via C–F (1). Same tree, same **16**. Because all weights here are distinct, the MST is unique, so both algorithms must agree.

## Implement it in Python

The same idea works in any language; only the syntax changes. Here it is in Python.

```python
import heapq

def kruskal(nodes, edges):
    """edges: list of (w, u, v). Returns (total, chosen edges) of a minimum spanning tree."""
    parent = {v: v for v in nodes}
    def find(x):                                 # root of x's set, with path halving
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    total, tree = 0, []
    for w, u, v in sorted(edges):                # cheapest edge first
        ru, rv = find(u), find(v)
        if ru == rv:                             # already connected: edge would close a cycle
            continue
        parent[ru] = rv                          # union the two pieces
        total += w
        tree.append((u, v, w))
        if len(tree) == len(nodes) - 1:          # spanning tree complete
            break
    return total, tree

def prim(graph, start):
    """graph: {u: [(w, v), ...]} undirected. Returns the MST's total weight."""
    seen, total = {start}, 0
    heap = list(graph[start])
    heapq.heapify(heap)
    while heap and len(seen) < len(graph):
        w, v = heapq.heappop(heap)               # cheapest edge leaving the tree
        if v in seen:
            continue
        seen.add(v)
        total += w
        for edge in graph[v]:
            if edge[1] not in seen:
                heapq.heappush(heap, edge)
    return total

EDGES = [(4, "A", "B"), (2, "A", "D"), (5, "A", "E"), (3, "B", "E"), (6, "B", "C"),
         (7, "C", "E"), (1, "C", "F"), (8, "E", "F"), (9, "D", "E")]
print(kruskal("ABCDEF", EDGES))
# (16, [('C', 'F', 1), ('A', 'D', 2), ('B', 'E', 3), ('A', 'B', 4), ('B', 'C', 6)])
graph = {v: [] for v in "ABCDEF"}
for w, u, v in EDGES:
    graph[u].append((w, v))
    graph[v].append((w, u))
print(prim(graph, "A"))   # 16
```

## Edge cases and pitfalls

- **Disconnected graph**: no spanning tree exists. Kruskal then returns a **minimum spanning forest** with fewer than V − 1 edges — check the count.
- **Negative weights are fine.** Unlike shortest paths, MST algorithms only compare edge weights, so negatives cause no trouble.
- **Ties**: with equal weights there may be several MSTs with the same total; any of them is correct.
- **MST ≠ shortest paths.** The tree minimises the total, not the distance between any pair (see the quiz's triangle).
- **Directed graphs** need a different algorithm (minimum arborescence, Chu–Liu/Edmonds); Kruskal and Prim assume undirected edges.
- **Maximum spanning tree**: sort descending (or negate the weights).

## When to use it

- **Network design**: laying cable, pipes or roads so that everything is connected at minimum cost.
- **Clustering**: run Kruskal until k pieces remain. Those pieces are the single-linkage clusters, and the gap between clusters is as large as possible.
- **Approximation**: the MST gives a 2-approximation for metric travelling-salesman tours (walk the tree, skip repeats).
- **Interview problems**: *Min Cost to Connect All Points* (complete graph, so the O(V²) Prim is ideal), *Connecting Cities With Minimum Cost*, and finding critical edges in an MST.

## In the interview

Define the MST, state V − 1 edges, then pick an algorithm: Kruskal when you are given an edge list (sort + union-find), Prim when the graph is dense or given as a matrix or as points. Justify correctness with the cut property in one sentence, give the complexities, and expect the follow-up "how would you check whether a given edge must be in every MST?" (it is, if it is the strictly lightest edge across some cut — equivalently, if removing it and rerunning the MST increases the total).
