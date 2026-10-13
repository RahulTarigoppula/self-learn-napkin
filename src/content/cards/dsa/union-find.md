---
title: Union-Find (Disjoint Sets)
track: dsa
tags: [graphs, sets, connectivity, mst]
difficulty: 2
minutes: 4
tldr: "Union-find tracks which items are in the same group. Each item points to a parent and each group is named by its root. With union by size and path compression, find and union cost almost O(1)."
analogy: "Clubs where every member knows one more senior member, and the most senior is the club president. To check whether two people are in the same club, each follows the chain up to their president. To merge two clubs, one president starts reporting to the other."
diagram: union-find
story:
  - title: Six singletons
    text: "Start with elements 0 to 5, each in a group of its own. The whole structure is one array, parent, and parent[i] = i means i is a root: the name of its group. Two elements are in the same group exactly when following parent pointers leads them to the same root."
  - title: Union three pairs
    text: "union(0,1) finds the roots of 0 and 1, which are themselves, and makes one point at the other: parent[1] = 0. union(2,3) and union(4,5) do the same. Now there are three groups, {0,1}, {2,3} and {4,5}, each a tiny tree."
  - title: "union(1,3) links roots, not the elements"
    text: "find(1) climbs to root 0 and find(3) climbs to root 2. Union always links one root under the other, here parent[2] = 0, so all four elements now reach root 0. Linking 3 itself under 1 would leave 2 behind in a separate group."
  - title: Union by size
    text: "union(4,1): root 4's tree has 2 elements and root 0's tree has 4. The smaller tree goes under the bigger root, parent[4] = 0. That way an element's depth increases only when its group at least doubles, so no tree is ever deeper than log₂ n."
  - title: Path compression
    text: "find(3) walks 3 → 2 → 0. On the way back it repoints 3 straight at the root, so the next find(3) takes one step. Together with union by size, any sequence of operations costs O(α(n)) each on average, and α(n) ≤ 4 for any realistic n."
  - title: Same root, same set
    text: "Now find(1) and find(3) both return 0, so 1 and 3 are already connected. If 1–3 were a new edge in an undirected graph, adding it would close a cycle. That one check is the core of Kruskal's minimum spanning tree algorithm."
keyIdeas:
  - "**parent[] array**: each element points to a parent; a **root** points to itself and names the set."
  - "**find(x)** climbs to the root. **union(a, b)** links root to root, and does nothing if the roots are already equal."
  - "**Union by size (or rank)**: hang the smaller tree under the bigger one, which keeps the height ≤ log₂ n."
  - "**Path compression**: during find, point every visited node straight at the root. Both tricks together give **O(α(n))** amortised per operation: effectively constant."
  - "**Uses**: connected components, **Kruskal's MST**, **cycle detection in undirected graphs**, merging accounts or equivalence classes. It cannot split sets."
quiz:
  - q: "parent = [0, 0, 1, 3, 3]. What does find(2) return, and which sets exist?"
    options: ["1; sets {0,1,2} and {3,4}", "0; sets {0,1,2} and {3,4}", "0; one set {0,1,2,3,4}", "2; five singletons"]
    answer: 1
    why: "2 → 1 → 0, and parent[0] = 0, so the root is 0. Element 3 is its own root and 4 points to it, so {3, 4} is a second set."
  - q: "Why must union(a, b) link the ROOTS of a and b instead of setting parent[a] = b?"
    options: ["It is faster to write", "Setting parent[a] = b would cut a off from the rest of its old set", "Roots have smaller indices", "It doesn't matter"]
    answer: 1
    why: "Other members of a's set reach their root through their own chains, which may not pass through a. Repointing a alone would split a's old set; linking root to root moves the whole set at once."
  - q: "Kruskal's algorithm considers edge (u, v) and finds that find(u) == find(v). What does it do?"
    options: ["Adds the edge", "Skips it, because u and v are already connected and the edge would create a cycle", "Restarts the algorithm", "Swaps u and v"]
    answer: 1
    why: "Equal roots mean a path between u and v already exists among the chosen edges. Adding another edge between them would form a cycle, so it cannot belong to a spanning tree."
  - q: "What does union-find NOT support efficiently?"
    options: ["Merging two sets", "Checking whether two elements share a set", "Splitting a set or deleting an edge", "Counting the number of sets"]
    answer: 2
    why: "Pointers only ever get merged; there is no record of which union created which link, so a set cannot be split. Problems with deletions need other tools, such as processing the operations in reverse."
bigO:
  - { op: "find / union, size + compression", avg: "O(α(n))", note: "amortised; α(n) ≤ 4 in practice" }
  - { op: "find / union, union by size only", avg: "O(log n)", worst: "O(log n)" }
  - { op: "find, no balancing, no compression", worst: "O(n)", avg: "O(n)", note: "trees can become chains" }
  - { op: "space", avg: "O(n)", note: "parent and size arrays" }
related: [dsa/graphs, dsa/minimum-spanning-trees, dsa/bfs-and-dfs, dsa/amortised-analysis]
prereqs: [dsa/trees-and-traversals]
flashcards:
  - kind: qa
    q: "What are the two optimisations of union-find, and what do they give together?"
    a: "Union by size or rank (hang the smaller tree under the bigger) and path compression (point visited nodes straight at the root). Together: O(α(n)) amortised per operation, effectively constant."
  - kind: cloze
    text: "In union-find, two elements are in the same set exactly when {{find}} returns the same {{root}} for both."
  - kind: qa
    q: "How do you detect a cycle in an undirected graph with union-find?"
    a: "Process the edges one at a time: if both ends already have the same root, that edge closes a cycle; otherwise union them."
sources:
  - { name: "Algorithms (Jeff Erickson)", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Disjoint sets and Kruskal's algorithm" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

You have n items and a stream of statements like "a and b belong together" (two computers get cabled, two accounts share an email, two pixels have the same colour). At any moment you want to ask "are x and y in the same group?" Groups only ever merge.

Running BFS over the whole graph for every question costs O(n + m) each time. A **disjoint-set union** (DSU), usually called **union-find**, answers each question in effectively constant time and needs only an array.

## How it works

Each group (**set**) is stored as a tree, drawn with arrows from child to parent. The whole forest is one array: `parent[i]` is i's parent, and a **root** is an element whose parent is itself. The root is the set's **representative**, its name.

- **find(x)**: follow parent pointers from x until you reach a root, and return it. Two elements are in the same set exactly when their finds return the same root.
- **union(a, b)**: compute `ra = find(a)` and `rb = find(b)`. If they are equal, the elements are already together. Otherwise set `parent[rb] = ra`: one whole tree hangs under the other root.

Union must link **roots**. Setting `parent[a] = b` directly would detach a from its old root and split its old set.

This basic version is correct but can be slow: unlucky unions build a chain, and then find is O(n). Two small changes fix that.

**1. Union by size (or by rank).** Keep `size[r]`, the number of elements under each root, and always hang the **smaller** tree under the **bigger** root. An element only gets one level deeper when its tree is merged into a tree at least as big, which at least doubles the size of its set. A set can double at most log₂ n times, so **no tree is deeper than log₂ n**. *Union by rank* is the same idea using an upper bound on height instead of the size.

**2. Path compression.** find(x) visits every node on the path from x to the root, so once the root is known, it repoints all of them straight at it. The work is paid once; afterwards those nodes are one step from the root.

With both, a sequence of m operations on n elements takes **O(m · α(n))** time (Tarjan, 1975). **α** is the inverse Ackermann function, which grows so slowly that α(n) ≤ 4 for any n that could fit in this universe. In practice, each operation is amortised constant time. With union by size alone you get O(log n) per operation; with compression alone, O(log n) amortised.

## Worked example

Six elements, 0 to 5. The `parent` array after each step:

| Operation | What happens | parent |
|---|---|---|
| start | everyone is a root | [0, 1, 2, 3, 4, 5] |
| union(0,1), union(2,3), union(4,5) | equal sizes; the second root goes under the first | [0, 0, 2, 2, 4, 4] |
| union(1,3) | roots 0 and 2, both size 2: parent[2] = 0 | [0, 0, 0, 2, 4, 4] |
| union(4,1) | roots 4 (size 2) and 0 (size 4): smaller under bigger, parent[4] = 0 | [0, 0, 0, 2, 0, 4] |
| find(3) | path 3 → 2 → 0, then compress: parent[3] = 0 | [0, 0, 0, 0, 0, 4] |
| union(1,3) | find(1) = 0 = find(3): already together, return False | unchanged |

In the union(4,1) step, attaching 0 under 4 instead would have pushed four elements one level deeper rather than two. Union by size always makes the cheaper choice.

## Implement it in Python

The same idea works in any language; only the syntax changes. Here it is in Python.

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))       # every element starts as its own root
        self.size = [1] * n                # only meaningful at roots
        self.count = n                     # number of separate sets

    def find(self, x):
        root = x
        while self.parent[root] != root:   # climb to the root
            root = self.parent[root]
        while self.parent[x] != root:      # path compression: repoint the path
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):                 # False if already in the same set
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:  # union by size: small under big
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.count -= 1
        return True

d = DSU(6)
for a, b in [(0, 1), (2, 3), (4, 5)]: d.union(a, b)
print(d.parent)                  # [0, 0, 2, 2, 4, 4]
d.union(1, 3); print(d.parent)   # [0, 0, 0, 2, 4, 4]
d.union(4, 1); print(d.parent)   # [0, 0, 0, 2, 0, 4]
d.find(3);     print(d.parent)   # [0, 0, 0, 0, 0, 4]
print(d.union(1, 3), d.count)    # False 1: edge 1-3 would close a cycle
```

The iterative `find` avoids Python's recursion limit. The recursive version, `if parent[x] != x: parent[x] = find(parent[x])`, is shorter and equally correct.

## Where it is used

- **Connected components** of an undirected graph: union every edge, and `count` is the number of components. This also works when edges arrive over time, which BFS handles poorly.
- **Kruskal's minimum spanning tree**: sort edges by weight and take each edge whose ends have different roots. Union-find is what makes the "would this create a cycle?" check cheap.

```python
def kruskal(n, edges):           # uses the DSU class above; edges: (w, u, v)
    dsu, total = DSU(n), 0
    for w, u, v in sorted(edges):
        if dsu.union(u, v):      # skip edges whose ends are already connected
            total += w
    return total
print(kruskal(4, [(1, 0, 1), (4, 0, 2), (3, 1, 2), (2, 2, 3), (5, 1, 3)]))  # 6
```

- **Cycle detection in an undirected graph**: the first edge whose two ends already share a root closes a cycle. This does not work for directed graphs, where direction matters; use DFS colouring or topological sort there.
- **Equivalence grouping**: merging accounts that share an email, grouping synonyms, "number of islands" when land cells arrive one at a time, percolation simulations.

## Edge cases and pitfalls

- **Linking elements instead of roots**: the most common bug.
- **Reading `parent[x]` as the set's name**: only `find(x)` gives the representative; `parent[x]` may be any ancestor.
- **Labels that are not 0..n−1** (strings, coordinates): map them to indices first, or store `parent` in a dict.
- **No undo or split**: if the problem deletes edges, process the operations offline in reverse (turning deletions into unions), or use a different structure.
- **Listing a set's members** is not cheap; group by `find(x)` over all x in O(n α(n)).

## In the interview

Reach for union-find when the problem says "groups", "connected", "merge" or "redundant edge" and the connections only accumulate. Code the 20-line class from memory, mention both optimisations, and state the bound precisely: "amortised O(α(n)), effectively constant". Typical problems: number of provinces, redundant connection, accounts merge, number of islands II, and Kruskal's MST. A common follow-up: "can BFS or DFS do this?" Yes, for a fixed graph in O(V + E) total; union-find wins when edges arrive one by one and you must answer queries in between.
