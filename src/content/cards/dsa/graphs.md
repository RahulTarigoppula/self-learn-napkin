---
title: Graphs and Their Representations
track: dsa
tags: [graphs, adjacency-list, adjacency-matrix, dag]
difficulty: 1
minutes: 4
tldr: "A graph is vertices joined by edges, which may be directed or weighted. Store it as an adjacency list (O(V+E) space, the default) or an adjacency matrix (O(V²) space, O(1) edge checks)."
analogy: "A road map: towns are vertices, roads are edges. One-way streets are directed edges and road lengths are weights. A list of each town's direct roads is an adjacency list; a mileage chart with every town against every town is a matrix."
diagram: graphs
story:
  - title: Vertices and edges
    text: "A graph is a set of vertices (nodes) and edges joining pairs of them. This one has V = 5 vertices and E = 5 edges, and its edges are undirected: 0–1 can be travelled both ways. A vertex's degree is the number of edges touching it; vertex 1 has degree 3."
  - title: Adjacency list
    text: "The usual way to store a graph: for each vertex, a list of its neighbours. Vertex 1's list is [0, 2, 3]. Each undirected edge appears in both endpoints' lists, so 5 edges make 10 entries. Space is O(V + E), and visiting a vertex's neighbours costs only its degree."
  - title: Adjacency matrix
    text: "Alternatively, a V × V grid where cell [u][v] is 1 when u and v are joined. 'Is there an edge 1–3?' is a single lookup, O(1). But it stores 25 cells for 5 edges, O(V²) space, and listing a vertex's neighbours scans its whole row. For an undirected graph it is symmetric."
  - title: Paths and cycles
    text: "A path is a sequence of vertices where each consecutive pair is joined by an edge: 1–3–4 (red). A cycle is a path that returns to its start without reusing an edge: 0–1–2–0 (green). A connected graph with no cycles at all is a tree, with exactly V − 1 edges."
  - title: Directed, weighted, acyclic
    text: "Edges can be one-way (S → A) and carry weights such as cost or distance. This graph has no directed cycle, so it is a DAG (directed acyclic graph), the shape of dependencies and build steps. The cheapest route from S to T is S → B → A → T, costing 1 + 2 + 5 = 8."
  - title: Implicit graphs
    text: "Many graphs are never stored at all. In a grid maze every open cell is a vertex, and its neighbours are computed on demand: up, down, left and right, skipping walls and the border. Running BFS on this implicit graph finds shortest paths through the maze."
keyIdeas:
  - "**Graph = vertices + edges**. Edges may be **undirected** or **directed**, **unweighted** or **weighted**. V and E are the two size measures."
  - "**Adjacency list**: O(V + E) space, neighbours of u in O(deg u). The right default, because most real graphs are **sparse** (E far below V²)."
  - "**Adjacency matrix**: O(V²) space, edge check in O(1), neighbours in O(V). Good for small or **dense** graphs."
  - "**Sum of all degrees = 2E** in an undirected graph, because every edge has two ends. A tree is a connected graph with no cycles and V − 1 edges."
  - "**DAGs** model dependencies; **grids** and state spaces are **implicit graphs** whose neighbours are computed, not stored."
quiz:
  - q: "A social network has 10,000,000 users and about 200 friendships each. Which representation fits in memory?"
    options: ["Adjacency matrix", "Adjacency list", "Both equally", "Neither: graphs this size cannot be stored"]
    answer: 1
    why: "A matrix needs V² = 10¹⁴ cells. A list stores about 10⁷ × 200 = 2 × 10⁹ entries, large but manageable, because the graph is sparse."
  - q: "An undirected graph has 7 edges. What is the sum of the degrees of all its vertices?"
    options: ["7", "14", "49", "It depends on the number of vertices"]
    answer: 1
    why: "Each edge adds 1 to the degree of each of its two endpoints, so the sum of degrees is always 2E = 14."
  - q: "With an adjacency list, what does checking whether edge (u, v) exists cost?"
    options: ["O(1) always, since lists support direct lookup", "O(deg u), since you scan u's neighbour list", "O(V²), since every pair may need checking", "O(E log V), from a search over sorted edges"]
    answer: 1
    why: "You must look through u's neighbours. A matrix answers in O(1); a list of hash sets also does, on average, at extra memory cost."
  - q: "Which kind of graph always has a topological order (an ordering where every edge points forward)?"
    options: ["Any connected graph (directed or not)", "A directed graph with no cycles (a DAG)", "Any weighted graph (with positive weights)", "An undirected tree, which has no cycles"]
    answer: 1
    why: "If a directed cycle existed, some edge in it would have to point backwards in any ordering. Without directed cycles, an order always exists: repeatedly take a vertex with no incoming edges."
bigO:
  - { op: "space: adjacency list", avg: "O(V + E)" }
  - { op: "space: adjacency matrix", avg: "O(V²)" }
  - { op: "is (u, v) an edge? list / matrix", avg: "O(deg u) / O(1)" }
  - { op: "all neighbours of u: list / matrix", avg: "O(deg u) / O(V)" }
  - { op: "BFS or DFS of the whole graph: list / matrix", avg: "O(V + E) / O(V²)" }
bigOTitle: "Adjacency list vs matrix"
related: [dsa/bfs-and-dfs, dsa/topological-sort, dsa/dijkstra, dsa/union-find]
prereqs: [dsa/trees-and-traversals]
flashcards:
  - kind: qa
    q: "When would you choose an adjacency matrix over an adjacency list?"
    a: "When the graph is small or dense (E close to V²), or you need O(1) edge checks, as in Floyd–Warshall. Otherwise use a list: O(V + E) space and fast neighbour iteration."
  - kind: cloze
    text: "An adjacency list uses {{O(V + E)}} space; an adjacency matrix uses {{O(V²)}}."
  - kind: qa
    q: "What is an implicit graph? Give an example."
    a: "A graph whose edges are computed on demand rather than stored, such as a grid maze, where the neighbours of cell (r, c) are the open cells above, below, left and right of it."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Basic graph algorithms: representations" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The vocabulary

A **graph** G = (V, E) is a set of **vertices** V (also called nodes) and a set of **edges** E, each joining two vertices. We write V and E for their counts as well.

- **Undirected** edges work both ways (friendship, a two-way road). **Directed** edges, or **arcs**, go from one vertex to another (follows on social media, a one-way street, "A must happen before B").
- **Weighted** edges carry a number: distance, cost, time, capacity. Unweighted edges all count as 1.
- Two vertices joined by an edge are **adjacent**, or **neighbours**. The **degree** of a vertex is its number of edges; in a directed graph, the **in-degree** counts incoming edges and the **out-degree** outgoing ones.
- A **path** is a sequence of vertices in which each consecutive pair is joined by an edge. It is **simple** if no vertex repeats. A **cycle** is a path of at least one edge that starts and ends at the same vertex without reusing an edge.
- A graph is **connected** if every vertex can reach every other; otherwise it splits into **connected components**. For directed graphs, **strongly connected** means every vertex can reach every other following edge directions.
- A **tree** is a connected undirected graph with no cycles; it always has exactly V − 1 edges. A **DAG** is a directed graph with no directed cycles.
- A **sparse** graph has relatively few edges (E roughly proportional to V); a **dense** one is close to the maximum, V(V − 1)/2 for undirected graphs without self-loops.

Two counting facts come up constantly. In an undirected graph, the **degrees add up to 2E**, because each edge contributes to two vertices. In a directed graph, the out-degrees add up to E, and so do the in-degrees.

## How to store a graph

**Adjacency list.** An array (or dict) mapping each vertex to a list of its neighbours; for weighted graphs, a list of (neighbour, weight) pairs. Space is O(V + E): V lists holding 2E entries for an undirected graph, or E for a directed one. Iterating over a vertex's neighbours costs O(deg u), which is exactly what BFS, DFS, Dijkstra and topological sort do, so they run in O(V + E) time on a list. Checking whether a specific edge exists means scanning u's list: O(deg u). Storing each vertex's neighbours in a set makes that O(1) on average.

**Adjacency matrix.** A V × V array where `M[u][v]` is 1 (or the weight) if the edge u → v exists and 0 (or ∞) otherwise. Edge checks and updates are O(1). But it always takes O(V²) memory, whatever E is, and listing u's neighbours means scanning a full row, O(V). A BFS over a matrix therefore costs O(V²). For an undirected graph the matrix is symmetric: `M[u][v] == M[v][u]`.

**Edge list.** Just a list of (u, v, weight) tuples: O(E) space. It is useless for "who are u's neighbours?" but perfect when an algorithm processes edges in bulk, such as sorting them for Kruskal's minimum spanning tree or relaxing them all in Bellman–Ford. Input often arrives in this form, and you convert it to an adjacency list.

**Implicit graph.** No storage at all: a function computes a vertex's neighbours on demand. Grids (cells are vertices, the 4 or 8 surrounding cells are neighbours), puzzle states (each legal move is an edge), word ladders (words one letter apart). These graphs can be enormous or infinite, so you only explore the part you reach.

## Worked example

The undirected graph on the card has edges 0–1, 0–2, 1–2, 1–3, 3–4.

| Vertex | Adjacency list | Matrix row | Degree |
|---|---|---|---|
| 0 | [1, 2] | 0 1 1 0 0 | 2 |
| 1 | [0, 2, 3] | 1 0 1 1 0 | 3 |
| 2 | [0, 1] | 1 1 0 0 0 | 2 |
| 3 | [1, 4] | 0 1 0 0 1 | 2 |
| 4 | [3] | 0 0 0 1 0 | 1 |

The degrees sum to 10 = 2 × 5 edges. The list holds 10 entries; the matrix holds 25 cells, of which 15 are zeros. Scale that up: with 1,000,000 vertices and 5,000,000 edges, the list needs about 10 million entries, while the matrix needs 10¹² cells, about 125 GB even at one bit per cell.

0–1–2–0 is a cycle, so this graph is not a tree. Removing edge 1–2 would leave 4 edges on 5 connected vertices with no cycle: a tree.

In the directed, weighted graph (S → A 4, S → B 1, B → A 2, A → T 5, B → T 8) there are three routes from S to T: S → A → T costs 9, S → B → T costs 9, and S → B → A → T costs 8. The route with the most edges is the cheapest, which is why weighted shortest paths need Dijkstra's algorithm rather than plain BFS.

## Implement it in Python

The same five-vertex graph built both ways, then a weighted DAG and a grid whose neighbours are computed on the fly.

```python
n = 5
edges = [(0, 1), (0, 2), (1, 2), (1, 3), (3, 4)]

adj = [[] for _ in range(n)]              # adjacency list: O(V + E) space
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)                      # undirected: store both directions
matrix = [[0] * n for _ in range(n)]      # adjacency matrix: O(V^2) space
for u, v in edges:
    matrix[u][v] = matrix[v][u] = 1

print(adj)                                # [[1, 2], [0, 2, 3], [0, 1], [1, 4], [3]]
print(matrix[1])                          # [1, 0, 1, 1, 0]
degrees = [len(a) for a in adj]
print(degrees, sum(degrees))              # [2, 3, 2, 2, 1] 10  (= 2E)
print(3 in adj[1], matrix[1][3] == 1)     # True True: O(deg) scan vs O(1) lookup

# Directed and weighted: vertex -> list of (neighbour, weight)
dag = {"S": [("A", 4), ("B", 1)], "A": [("T", 5)], "B": [("A", 2), ("T", 8)], "T": []}
indegree = {v: 0 for v in dag}
for u in dag:
    for v, w in dag[u]:
        indegree[v] += 1
print(indegree)                           # {'S': 0, 'A': 2, 'B': 1, 'T': 2}

# Implicit graph: a grid; neighbours are computed, never stored
grid = ["...#.",
        ".....",
        ".#..."]
def neighbours(r, c):
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] != "#":
            yield nr, nc
print(list(neighbours(1, 1)))             # [(0, 1), (1, 2), (1, 0)]: the wall below is skipped
```

## Choosing a representation

| Situation | Use |
|---|---|
| Typical interview or real-world graph (sparse) | Adjacency list |
| Small V (a few thousand at most) or dense graph | Matrix is fine |
| Many "is u connected to v?" queries | Matrix, or a list of sets |
| All-pairs shortest paths (Floyd–Warshall) | Matrix |
| Algorithm that sorts or scans all edges (Kruskal, Bellman–Ford) | Edge list |
| Grid, board or puzzle states | Implicit: compute neighbours |

## Edge cases and pitfalls

- **Forgetting the reverse edge** in an undirected graph: add both `adj[u].append(v)` and `adj[v].append(u)`.
- **Disconnected graphs**: a single BFS from vertex 0 misses other components; loop over all vertices and start a new search from each unvisited one.
- **Cycle detection differs by direction**: in an undirected graph, revisiting a vertex other than your parent means a cycle. In a directed graph you need a vertex that is still on the current DFS path; reaching one from an already finished branch proves nothing.
- **Self-loops and parallel edges**: check whether the input allows them; they change degree counts and matrix contents.
- **Vertex labels** that are strings or coordinates: use a dict of lists, or map labels to indices 0..V−1 first.

## In the interview

Most graph questions start with building the adjacency list from the input, so say what you build and its cost: "adjacency list, O(V + E)". Then name the traversal (BFS for fewest edges, DFS for reachability, cycles and components, Dijkstra for non-negative weights, topological sort for DAGs). Many problems hide the graph: course prerequisites are a DAG, a word ladder is an implicit graph, an island-counting grid is an implicit graph of land cells. Spotting that it *is* a graph is half the answer. Expect the follow-up "what if the graph is huge?": an implicit graph explored lazily, or a representation sized to E rather than V².
