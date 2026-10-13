---
title: BFS & DFS
track: dsa
tags: [graphs, traversal, queues]
difficulty: 2
minutes: 4
tldr: "Same walk, different container: a queue explores level by level (BFS, which finds fewest-edge paths); a stack dives deep first (DFS). Both are O(V + E)."
analogy: "Dropping a stone in a pond versus exploring a cave. The ripple (BFS) reaches every point at distance 1, then 2, then 3. The caver (DFS) follows one tunnel to its end before backing up to try the next."
diagram: bfs-vs-dfs
story:
  - title: A grid is a graph
    text: "Each open cell is a node, and you can step up, down, left or right into another open cell. Those steps are the edges. Grey filled cells are walls. We want to get from S in the top-left corner to G in the bottom-right, and we will explore the same grid twice."
  - title: BFS ripples outwards
    text: "Breadth-first search keeps a queue: take a cell from the front, add its unvisited neighbours to the back. So every cell at distance 1 is reached before any cell at distance 2, and so on. The numbers are each cell's distance from S. At any moment the queue holds at most two neighbouring distances, such as 5, 6, 6."
  - title: DFS dives down one branch
    text: "Depth-first search uses a stack (often the call stack of a recursive function): always continue from the newest cell. Trying up, right, down, left, it first hits a dead end at the cell right of S, backs up, then follows one long route over the top of the grid until it happens to reach G."
  - title: Only BFS guarantees the shortest path
    text: "BFS reached G at distance 8, and because it explores in distance order, no shorter route exists. DFS's route is 12 steps: it reports the first path it stumbles on, not the best. Both touch each cell and edge at most once, so both are O(V + E)."
keyIdeas:
  - "**Same skeleton, different container**: take a node from the frontier, visit its unvisited neighbours. Queue → BFS, stack → DFS."
  - "**BFS finds shortest paths on unweighted graphs**, because it reaches nodes in order of distance."
  - "**In BFS, mark a node visited when you add it to the queue**, not when you take it out, or it will be queued many times."
  - "**Both run in O(V + E) time.** BFS memory is the widest level; DFS memory is the deepest path."
  - "**DFS suits structure questions**: connected components, cycle detection, topological order, backtracking."
quiz:
  - q: "You need the fewest moves for a knight to reach a square on an empty chessboard. Which traversal?"
    options: ["DFS, because it goes deep quickly", "BFS, because every move costs the same and it explores in order of distance", "Either; both always find the shortest path", "Neither; you need Dijkstra"]
    answer: 1
    why: "All moves cost 1, so the graph is unweighted. BFS reaches each square first by a shortest route. Dijkstra also works but is unnecessary when every edge weighs the same."
  - q: "A BFS marks nodes visited only when they are dequeued. What goes wrong?"
    options: ["It finds longer paths", "The same node can be enqueued many times by different neighbours, wasting time and memory", "It turns into DFS", "Nothing, that is the standard way"]
    answer: 1
    why: "Between being enqueued and dequeued, other neighbours see the node as unvisited and enqueue it again. Marking on enqueue guarantees each node enters the queue once."
  - q: "Roads have different lengths. Does BFS (counting roads) give the shortest driving distance?"
    options: ["Yes, always", "Only if the graph is a tree", "No. It minimises the number of edges, not their total length; use Dijkstra", "Only if you run it twice"]
    answer: 2
    why: "Two short roads can be shorter than one long one. BFS's guarantee is about edge count, so weighted graphs need Dijkstra's algorithm (non-negative weights)."
  - q: "During a DFS of a directed graph, which event proves the graph has a cycle?"
    options: ["Reaching a vertex that some earlier, finished branch already visited", "Reaching a vertex that is still on the current recursion path", "The stack becoming empty", "Finding a vertex with no outgoing edges"]
    answer: 1
    why: "An edge back to a vertex still on the current path (a back edge) closes a loop. An edge into a finished branch proves nothing: if that vertex could reach back to you, DFS would already have followed that route while exploring it."
bigO:
  - { op: "BFS / DFS", avg: "O(V + E)" }
  - { op: "grid of R × C cells", avg: "O(R · C)", note: "each cell has at most 4 edges" }
  - { op: "space", avg: "O(V)", note: "the frontier, plus the visited set" }
related: [dsa/graphs, dsa/dijkstra, dsa/topological-sort, dsa/backtracking]
prereqs: [dsa/graphs, dsa/queues-and-deques, dsa/stacks]
griddle: bfs-grid
flashcards:
  - kind: qa
    q: "Why does BFS find the shortest path on an unweighted graph but DFS does not?"
    a: "BFS expands nodes in non-decreasing distance from the source, so the first time it reaches a node it has used the fewest edges; DFS commits to a branch and may reach it by a longer route first."
  - kind: cloze
    text: "BFS uses a {{queue}}; DFS uses a {{stack}} (or the call stack)."
  - kind: qa
    q: "What is the time complexity of BFS or DFS on a graph with V vertices and E edges, and why?"
    a: "O(V + E): each vertex enters the frontier at most once, and each edge is examined a constant number of times (once per endpoint)."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Graph traversal modules, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Graphs in one paragraph

A **graph** is a set of **vertices** (nodes) joined by **edges**. V is the number of vertices and E the number of edges. Road maps, friendships, web links, dependencies between tasks and grids are all graphs. A grid is a graph in disguise: each open cell is a vertex, with an edge to each open cell directly up, down, left or right. We usually store a graph as an **adjacency list**: for each vertex, a list of its neighbours.

## How it works

Both traversals answer "which vertices can I reach from S?" with the same loop:

1. Put S in a container called the **frontier** and mark it **visited**.
2. While the frontier is not empty: take a vertex out, and for each neighbour not yet visited, mark it visited and put it in the frontier.

The only difference is **which vertex comes out next**.

- **Breadth-first search (BFS)** uses a **queue** (first in, first out). Vertices come out in the order they went in, so all vertices at distance 1 from S are processed before any at distance 2, and so on. The exploration spreads like a ripple.
- **Depth-first search (DFS)** uses a **stack** (last in, first out). More often you write it with recursion and let the language's call stack play that role. The newest vertex is explored next, so the search runs down one path as far as it can, then **backtracks** to the most recent vertex with an unexplored neighbour.

### Why BFS gives shortest paths

Claim: BFS takes vertices out of the queue in non-decreasing order of distance from S. It starts with only S (distance 0). When a vertex at distance d is processed, the new vertices it adds are at distance d + 1, and they go to the *back*, behind everything at distance d. So the queue always holds at most two consecutive distances, d then d + 1, in that order. The first time BFS reaches a vertex is therefore along a path with the fewest possible edges. Record `dist[v] = dist[u] + 1` when you discover v, and those are shortest-path distances. DFS has no such ordering: it reaches a vertex by whichever route it happened to try first.

### Why O(V + E)

Each vertex is marked visited once and enters the frontier once: O(V). When a vertex is processed, we scan its neighbour list; across the whole run every adjacency list is scanned once, which is O(E) in total (each undirected edge appears in two lists). Hence **O(V + E)** time. Memory is the visited set plus the frontier, O(V) in the worst case.

## Worked example

The grid in the diagram (`#` = wall), from S = (0, 0) to G = (4, 4), with cells written as (row, column):

```
S . # . .
. # # . .
. . . . .
# . # # .
. . . . G
```

BFS discovers cells in distance layers:

| Distance | Cells |
|---|---|
| 0 | (0,0) |
| 1 | (0,1), (1,0) |
| 2 | (2,0) |
| 3 | (2,1) |
| 4 | (2,2), (3,1) |
| 5 | (2,3), (4,1) |
| 6 | (1,3), (2,4), (4,0), (4,2) |
| 7 | (0,3), (1,4), (3,4), (4,3) |
| 8 | (0,4), (4,4) = G |

So the shortest path is **8 steps**, for example down the left side and along the bottom row.

A recursive DFS that tries up, right, down, left goes from (0,0) right into (0,1), finds a dead end, backs up, goes down to (2,0), right along row 2 to (2,3), up to (0,3), right to (0,4), then down column 4 to G. That path is **12 steps**. Change the neighbour order and DFS finds a different path; BFS's distances never change.

## Implement it in Python

Both walk the grid from the worked example, so you can check the 8 and the 12.

```python
from collections import deque

STEPS = ((-1, 0), (0, 1), (1, 0), (0, -1))          # up, right, down, left

def neighbours(grid, r, c):
    for dr, dc in STEPS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] != "#":
            yield nr, nc

def bfs(grid, start, goal):
    """Fewest steps from start to goal, or -1 if unreachable."""
    dist = {start: 0}                                # doubles as the visited set
    queue = deque([start])
    while queue:
        cell = queue.popleft()                       # FIFO: nearest cell first
        if cell == goal:
            return dist[cell]
        for nxt in neighbours(grid, *cell):
            if nxt not in dist:                      # mark when enqueued
                dist[nxt] = dist[cell] + 1
                queue.append(nxt)
    return -1

def dfs(grid, cell, goal, seen):
    """First path found by recursive DFS (not necessarily the shortest)."""
    seen.add(cell)
    if cell == goal:
        return [cell]
    for nxt in neighbours(grid, *cell):
        if nxt not in seen:
            rest = dfs(grid, nxt, goal, seen)
            if rest:
                return [cell] + rest
    return None

GRID = ["..#..", ".##..", ".....", "#.##.", "....."]
print(bfs(GRID, (0, 0), (4, 4)), len(dfs(GRID, (0, 0), (4, 4), set())) - 1)   # 8 12
```

## Edge cases and pitfalls

- **Mark visited on enqueue.** Marking on dequeue lets the same vertex be queued by several neighbours.
- **Use a real queue.** Removing the first item of an array-backed list shifts everything (Python's `list.pop(0)`, Java's `ArrayList.remove(0)`): O(n). A deque or linked queue (`collections.deque`, Java's `ArrayDeque`, C++'s `std::queue`) does it in O(1).
- **Weighted edges** break BFS's guarantee: it minimises the *number* of edges, not their total weight. Use Dijkstra's algorithm for non-negative weights.
- **Deep recursion.** Recursive DFS on a long path can overflow the call stack (Python's default limit is about 1,000 frames). Use an explicit stack for big inputs.
- **Iterative DFS order.** Pushing all neighbours onto a stack visits them in reverse order compared with the recursive version, so traces differ. And if you mark vertices visited when they are *pushed*, you get a valid reachability search but not a true depth-first order; for anything that relies on DFS order (cycle detection, topological sort) mark a vertex when it is *popped* and skip pops of already-visited vertices.
- **Disconnected graphs.** One traversal only reaches S's component; to cover everything, start a new traversal from every unvisited vertex (this also counts the components).

## When to use which

| Question | Use |
|---|---|
| Shortest path, fewest moves, minimum steps (unweighted) | BFS |
| Process level by level (tree levels, "spread" simulations like rotting oranges) | BFS (multi-source: start with several cells in the queue) |
| Is there a path? Count islands or components | Either; DFS is shorter to write |
| Detect a cycle, topological order, strongly connected components | DFS |
| Generate all solutions: permutations, subsets, mazes, sudoku | DFS with backtracking |

Memory differs too: BFS holds a whole level, which can be huge on wide graphs; DFS holds one path, which can be long on deep ones.

## In the interview

Grid questions are graph questions. Say so, then define the neighbours. Name the container out loud ("queue, so BFS, because we need the fewest steps"), mark visited on enqueue, and state O(V + E), which for an R × C grid is O(R · C). Expect follow-ups: return the path itself (store each cell's parent and walk back from G), handle weights (Dijkstra), or start from many sources at once (put them all in the queue at distance 0).
