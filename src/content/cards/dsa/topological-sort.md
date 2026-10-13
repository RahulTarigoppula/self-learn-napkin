---
title: Topological Sort
track: dsa
tags: [graphs, dag, ordering, queues]
difficulty: 2
minutes: 4
tldr: "Line up the nodes of a directed graph so every arrow points forward. Repeatedly output a node with no remaining prerequisites; if you get stuck early, there is a cycle."
analogy: "Getting dressed: socks before shoes, shirt before jacket. At any moment you put on something whose prerequisites are already on. Several orders work, but none works if shoes require socks and socks require shoes."
diagram: topological-sort
story:
  - title: Courses and their prerequisites
    text: "Six courses, and an arrow A → B means you must take A before B. We want an order to take all six so that no course comes before one of its prerequisites. A graph with arrows and no loops is a DAG (directed acyclic graph), and only a DAG has such an order."
  - title: Count the incoming arrows
    text: "For each course, count how many arrows point into it: its in-degree, the number of unfinished prerequisites. Intro and Math have in-degree 0, so they can be taken right now. Kahn's algorithm puts every in-degree-0 node into a queue."
  - title: Output Intro and Math, cut their arrows
    text: "Take Intro from the queue and add it to the order. Its arrow into DS is now satisfied, so DS drops from 2 to 1. Take Math: DS drops to 0 and Algo to 1. DS just ran out of prerequisites, so it joins the queue."
  - title: DS frees Algo and DB
    text: "Output DS. Its arrows lower Algo from 1 to 0 and DB from 1 to 0, so both join the queue. A node enters the queue at the exact moment its last prerequisite is output, which is why every arrow ends up pointing forward."
  - title: Algo, DB, then ML
    text: "Output Algo (ML drops to 1), then DB (ML drops to 0), then ML. All 6 nodes came out: Intro, Math, DS, Algo, DB, ML. Other orders are equally valid, such as Math, Intro, DS, DB, Algo, ML. Every node and arrow is handled once: O(V + E)."
  - title: A cycle never reaches zero
    text: "X → Y → Z → X: each node waits for another, so every in-degree stays at 1 and the queue starts empty. Kahn outputs 0 of 3 nodes. That is the cycle test: if fewer than V nodes come out, the leftovers contain a cycle and no valid order exists."
keyIdeas:
  - "A **topological order** puts u before v for every arrow u → v. It exists **if and only if** the graph has no directed cycle."
  - "**Kahn's algorithm**: queue every node with in-degree 0; pop one, output it, decrement its successors, enqueue any that hit 0."
  - "**Cycle check for free**: if the output has fewer than V nodes, the remaining nodes contain a cycle."
  - "**DFS alternative**: reverse post-order. A node is appended only after everything it points to is finished."
  - "The order is usually **not unique**; use a min-heap instead of a queue if you need the lexicographically smallest one."
  - "Runs in **O(V + E)** time and O(V) extra space."
quiz:
  - q: "Arrows: A → B, A → C, B → D, C → D. Which is NOT a valid topological order?"
    options: ["A, B, C, D", "A, C, B, D", "A, B, D, C", "All three are valid"]
    answer: 2
    why: "In A, B, D, C the node D comes before C, but the arrow C → D requires C first. The other two orders respect all four arrows."
  - q: "Kahn's algorithm finishes with 7 of 10 nodes in the output. What does that tell you?"
    options: ["The graph is disconnected", "The 3 remaining nodes include at least one directed cycle", "The queue was implemented incorrectly", "The order is still valid, just partial"]
    answer: 1
    why: "Every node outside a cycle eventually reaches in-degree 0. The nodes that never do are on a cycle or downstream of one, so no topological order exists."
  - q: "In the DFS method, why is the post-order reversed?"
    options: ["To make the algorithm stable", "A node is appended only after all nodes it points to, so post-order lists every arrow backwards", "Reversal removes cycles", "It is not needed; the post-order is already correct"]
    answer: 1
    why: "For an arrow u → v in a DAG, v finishes before u, so v appears earlier in post-order. Reversing puts u before v for every arrow."
  - q: "Which problem is a topological sort in disguise?"
    options: ["Shortest path in a weighted graph", "Ordering build steps when some targets depend on others", "Finding the median of a stream", "Matching brackets"]
    answer: 1
    why: "Build systems, package managers, spreadsheet recalculation and course schedules all need an order in which every dependency comes first."
bigO:
  - { op: "Kahn's algorithm", avg: "O(V + E)", note: "each node enqueued once, each arrow decremented once" }
  - { op: "DFS reverse post-order", avg: "O(V + E)" }
  - { op: "lexicographically smallest order", avg: "O((V + E) log V)", note: "min-heap instead of a queue" }
  - { op: "extra space", avg: "O(V)", note: "in-degrees + queue (or recursion stack)" }
related: [dsa/bfs-and-dfs, dsa/graphs, dsa/dynamic-programming, dsa/queues-and-deques]
prereqs: [dsa/graphs, dsa/bfs-and-dfs]
flashcards:
  - kind: qa
    q: "How does Kahn's algorithm detect a cycle?"
    a: "It outputs fewer than V nodes: nodes on a cycle never reach in-degree 0, so they never enter the queue."
  - kind: cloze
    text: "A topological order exists if and only if the directed graph is {{acyclic}}; the DFS method outputs the {{reverse post-order}}."
  - kind: qa
    q: "LeetCode 'Course Schedule' asks whether all courses can be finished. What do you run, and what is the answer condition?"
    a: "Kahn's algorithm (or DFS with three colours) on the prerequisite graph; all courses can be finished exactly when every course is output, i.e. there is no cycle."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Chapter 6, depth-first search and topological sort, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
griddle: topological-sort
---

## The problem

You have tasks and "must happen before" rules between them: courses and prerequisites, build targets and their dependencies, spreadsheet cells and the cells their formulas read. Draw each task as a node and each rule "A before B" as an arrow **A → B**. A **topological order** (or topological sort) is a list of all nodes in which every arrow points forward: for every arrow u → v, u comes before v.

Such an order exists **if and only if the graph has no directed cycle**. If X → Y → Z → X, then X must come before Y, which comes before Z, which comes before X. Impossible. Conversely, every **DAG** (directed acyclic graph) has at least one node with no incoming arrows (otherwise, walking arrows backwards forever would revisit a node and reveal a cycle), so you can always start somewhere.

## How Kahn's algorithm works

The **in-degree** of a node is the number of arrows pointing into it, which is how many prerequisites it still waits for.

1. Compute every node's in-degree by scanning all arrows once.
2. Put every node with in-degree 0 into a queue. These have no prerequisites.
3. While the queue is not empty: pop a node `v`, append it to the output, and for each arrow `v → w`, decrement `w`'s in-degree. If it becomes 0, push `w`.
4. If the output contains all V nodes, it is a valid order. Otherwise the graph has a cycle.

**Why the output is valid.** A node is pushed only when its in-degree reaches 0, which happens only after *every* node pointing into it has been output. So for every arrow u → v, u is output before v.

**Why a short output means a cycle.** If the graph is a DAG, the not-yet-output nodes always form a smaller DAG, which has a node with no incoming arrows from unprocessed nodes. That node has in-degree 0 and is in the queue. So the algorithm cannot stall until everything is out. If it does stall, the leftover nodes each still have an incoming arrow from another leftover node; following those arrows backwards must eventually repeat a node, which is a cycle.

**Cost.** Counting in-degrees touches every arrow once; each node is pushed and popped once; each arrow is decremented once. Total **O(V + E)** time, O(V) extra space.

## Worked example

Arrows: Intro → DS, Math → DS, Math → Algo, DS → Algo, DS → DB, Algo → ML, DB → ML. Starting in-degrees: Intro 0, Math 0, DS 2, Algo 2, DB 1, ML 2.

| Step | Pop | In-degree changes | Queue after | Output so far |
|---|---|---|---|---|
| start | (none) | (none) | Intro, Math | (empty) |
| 1 | Intro | DS 2→1 | Math | Intro |
| 2 | Math | DS 1→0, Algo 2→1 | DS | Intro, Math |
| 3 | DS | Algo 1→0, DB 1→0 | Algo, DB | …, DS |
| 4 | Algo | ML 2→1 | DB | …, Algo |
| 5 | DB | ML 1→0 | ML | …, DB |
| 6 | ML | (none) | empty | …, ML |

All 6 nodes are output: **Intro, Math, DS, Algo, DB, ML**. Had we put Math in the queue first, or popped DB before Algo, we would get a different order that is just as valid. A graph has a *unique* topological order only when the order is a single chain, with each consecutive pair joined by an arrow.

## The DFS alternative

Run a depth-first search and record each node in **post-order**: at the moment its recursive call *finishes*, after all nodes reachable from it are finished. For an arrow u → v in a DAG, v always finishes before u: either the search reaches v from u (so v's call ends inside u's), or v was already finished. So post-order lists every arrow backwards, and **reversing it** gives a topological order.

To detect cycles with DFS, colour nodes **white** (unvisited), **grey** (on the current recursion path) and **black** (finished). Meeting a grey node means you followed an arrow back into your own path, which means a cycle. Meeting a black node is fine; it is just a shared dependency.

On the example, starting from Intro, DFS finishes ML, Algo, DB, DS, Intro, then Math; reversed, that is **Math, Intro, DS, DB, Algo, ML**. That differs from Kahn's result and is equally valid.

## Implement it in Python

Kahn first, then the DFS version with three colours. The last line shows Kahn returning `None` on a cycle.

```python
from collections import deque

def kahn(graph):
    """Topological order of a DAG {node: [next, ...]}, or None if there is a cycle."""
    indeg = {v: 0 for v in graph}
    for v in graph:
        for w in graph[v]:
            indeg[w] += 1                      # count incoming arrows
    queue = deque(v for v in graph if indeg[v] == 0)
    order = []
    while queue:
        v = queue.popleft()
        order.append(v)
        for w in graph[v]:                     # "remove" v's outgoing arrows
            indeg[w] -= 1
            if indeg[w] == 0:                  # last prerequisite just finished
                queue.append(w)
    return order if len(order) == len(graph) else None   # leftovers = cycle

def dfs_topo(graph):
    """Reverse DFS post-order; raises on a cycle."""
    WHITE, GREY, BLACK = 0, 1, 2               # unvisited, on the current path, finished
    colour = {v: WHITE for v in graph}
    post = []
    def visit(v):
        colour[v] = GREY
        for w in graph[v]:
            if colour[w] == GREY:
                raise ValueError(f"cycle through {w}")   # back edge
            if colour[w] == WHITE:
                visit(w)
        colour[v] = BLACK
        post.append(v)                         # v finishes after everything it points to
    for v in graph:
        if colour[v] == WHITE:
            visit(v)
    return post[::-1]

COURSES = {"Intro": ["DS"], "Math": ["DS", "Algo"], "DS": ["Algo", "DB"],
           "Algo": ["ML"], "DB": ["ML"], "ML": []}
print(kahn(COURSES))      # ['Intro', 'Math', 'DS', 'Algo', 'DB', 'ML']
print(dfs_topo(COURSES))  # ['Math', 'Intro', 'DS', 'DB', 'Algo', 'ML']
print(kahn({"X": ["Y"], "Y": ["Z"], "Z": ["X"]}))   # None
```

## Edge cases and pitfalls

- **Arrow direction.** "Course 1 requires course 0" is the arrow **0 → 1** (prerequisite first). Reversing every arrow gives you the order backwards, a classic interview bug.
- **Nodes with no arrows** still belong in the order. Build the in-degree map from the full node list; the edge list alone misses them.
- **Two-colour DFS is wrong for directed graphs.** A plain "visited" set cannot tell a cycle from two paths that meet at a shared node (A → C and B → C). You need the grey "on the current path" state.
- **Deep recursion.** Recursive DFS on a long dependency chain can overflow the call stack (Python's default limit is about 1,000 frames); use Kahn or an explicit stack.
- **Self-loops** (A → A) are cycles: A's in-degree never reaches 0.
- **Undirected graphs** have no topological order; the idea only applies to directed graphs.

## When to use it

Any time items depend on other items: build systems (make, Bazel), package installers, task schedulers, spreadsheet recalculation, and the order in which to evaluate a dynamic programme on a DAG. **Longest path in a DAG** (for example, the minimum number of semesters, or the critical path of a project) is a DP over the topological order: process nodes in order and relax each outgoing arrow. Kahn processed level by level also counts semesters directly.

## In the interview

The usual prompts are *Course Schedule* (can every course be finished? return an order), *Alien Dictionary* (derive letter order from sorted words, then topo-sort the letters) and *build order*. A strong answer names the graph and the arrow direction out loud, picks Kahn for its built-in cycle check, states O(V + E), and mentions that many orders may be valid. Expect follow-ups: return the lexicographically smallest order (min-heap instead of the queue, O((V + E) log V)), or the minimum number of rounds when independent tasks can run in parallel (count the BFS levels of Kahn's algorithm).
