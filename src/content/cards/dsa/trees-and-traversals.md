---
title: Trees and Traversals
track: dsa
tags: [trees, recursion, traversal, bfs, dfs]
difficulty: 1
minutes: 4
tldr: "A tree is nodes linked parent-to-child with no cycles. Visiting every node is O(n), and the only question is the order: node before children, between them, after them, or level by level."
analogy: "Trace round the outline of the tree with a pencil. You pass each node three times: on its left, underneath it, and on its right. Pre-, in- and post-order only choose which of those three passes counts as the visit."
diagram: trees-and-traversals
story:
  - title: Root, leaves, depth and height
    text: "This tree has 7 nodes. 4 is the root, the only node without a parent. 1, 3, 5 and 7 are leaves: no children. A node's depth is the number of edges up to the root, so 2 has depth 1. The tree's height is the depth of its deepest leaf: 2."
  - title: "Pre-order: node, left, right"
    text: "Walk round the tree anticlockwise, hugging it, starting left of the root. Record a node the first time you pass it, on its left side (red). That gives 4 2 1 3 6 5 7: every parent before its children, so it is the order to copy or serialise a tree."
  - title: "In-order: left, node, right"
    text: "Same walk, but record a node when you pass underneath it (blue): after its left subtree, before its right one. Result: 1 2 3 4 5 6 7. This tree is a binary search tree, so in-order prints its keys in sorted order."
  - title: "Post-order: left, right, node"
    text: "Now record a node on the last pass, its right side (green): 1 3 2 5 7 6 4. Every child comes before its parent, so you can delete a tree or compute subtree sizes and heights, because each node's children are finished first."
  - title: Level-order uses a queue
    text: "Level-order reads the tree row by row: 4, then 2 6, then 1 3 5 7. Put the root in a queue; repeatedly pop the front node, visit it and push its children. The queue goes [4], [2 6], [6 1 3], [1 3 5 7]. This is breadth-first search on a tree."
keyIdeas:
  - "**Depth** = edges from the root down to a node; **height** = edges on the longest path down to a leaf. A tree of n nodes has exactly **n − 1 edges**."
  - "**Pre-order** (node, left, right) copies and serialises; **in-order** (left, node, right) gives a BST in sorted order; **post-order** (left, right, node) deletes and computes bottom-up answers."
  - "The three depth-first orders are the **same walk**; only the moment you record the node differs."
  - "Every traversal is **O(n) time**. Depth-first uses **O(h) extra space** (the call stack); level-order uses **O(w)**, the widest level."
  - "Recursion is an implicit stack: any depth-first traversal can be rewritten with an **explicit stack**, which avoids recursion-depth limits on tall trees."
quiz:
  - q: "In the tree with root 4, children 2 and 6, and leaves 1, 3, 5, 7, what is the pre-order?"
    options: ["1 2 3 4 5 6 7", "4 2 1 3 6 5 7", "1 3 2 5 7 6 4", "4 2 6 1 3 5 7"]
    answer: 1
    why: "Pre-order visits the node, then all of its left subtree, then all of its right subtree: 4, then 2 1 3, then 6 5 7. The other options are in-order, post-order and level-order."
  - q: "You must free every node of a tree, and a node may only be freed after both its children. Which order works?"
    options: ["Pre-order", "In-order", "Post-order", "Any order"]
    answer: 2
    why: "Post-order finishes both subtrees before it visits the node, so every child is freed before its parent. Pre-order would free the parent first and lose the pointers to its children."
  - q: "Level-order on a perfect binary tree of 1,023 nodes (10 levels). What is the most nodes the queue holds at once?"
    options: ["10", "256", "512", "1,023"]
    answer: 2
    why: "When the second-to-last level has been processed, the queue holds the entire last level: 2⁹ = 512 leaves. A depth-first traversal would need a stack of only about 10."
  - q: "Which pair of traversals is enough to rebuild a binary tree with distinct values?"
    options: ["Pre-order and post-order", "Pre-order and in-order", "Level-order alone", "In-order alone"]
    answer: 1
    why: "Pre-order's first value is the root; finding it in the in-order splits the remaining values into the left and right subtrees, and you recurse. Pre + post is ambiguous when a node has only one child."
bigO:
  - { op: "pre / in / post / level-order", avg: "O(n)", note: "each node visited once" }
  - { op: "depth-first extra space", best: "O(log n)", avg: "O(h)", worst: "O(n)", note: "stack depth = height; a chain has h = n − 1" }
  - { op: "level-order extra space", avg: "O(w)", worst: "O(n)", note: "w = widest level, about n/2 for a perfect tree" }
  - { op: "Morris in-order", avg: "O(n)", note: "O(1) extra space, temporarily rewires right pointers" }
related: [dsa/binary-search-trees, dsa/bfs-and-dfs, dsa/stacks, dsa/heaps]
prereqs: [dsa/recursion]
flashcards:
  - kind: qa
    q: "What do pre-, in- and post-order traversal each visit first, and what is each typically used for?"
    a: "Pre-order: node, then left, then right; copying and serialising. In-order: left, node, right; sorted output of a BST. Post-order: left, right, node; deleting a tree and bottom-up computations like height."
  - kind: cloze
    text: "Depth-first traversals use {{O(h)}} extra space for the stack; level-order uses {{O(w)}} for the queue, where w is the widest level."
  - kind: qa
    q: "How do you do an in-order traversal without recursion?"
    a: "Keep an explicit stack. Push nodes while going left; when you cannot go further, pop a node, visit it, then move to its right child and repeat."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Binary trees chapter, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The vocabulary

A **tree** is a set of **nodes** joined by **edges** so that there is exactly one path between any two nodes: no cycles, nothing disconnected. One node is singled out as the **root**. Every other node has exactly one **parent** (the next node on its path to the root), and the nodes directly below a node are its **children**. Children of the same parent are **siblings**. A node with no children is a **leaf**; the rest are **internal nodes**. A node together with everything below it forms a **subtree**.

Two measurements come up constantly:

- **Depth of a node**: the number of edges from the root down to it. The root has depth 0. All nodes at the same depth form a **level**.
- **Height**: the number of edges on the longest path from a node *down* to a leaf. A leaf has height 0, and the height of the tree is the height of its root. Some books count nodes instead of edges, giving one more; say which convention you use.

A tree with n nodes always has **n − 1 edges**, because every node except the root has exactly one edge up to its parent. In a **binary tree** each node has at most two children, called left and right. A binary tree of height h holds at most 2^(h+1) − 1 nodes, so n nodes need a height of at least about log₂ n. They can also be strung out in a chain of height n − 1, and that difference drives the cost of every tree algorithm.

## How it works

A **traversal** visits every node exactly once. There are two families.

**Depth-first (DFS)** goes as deep as possible before backing up. For a binary tree, the recursive definition has three steps (handle the node, traverse left, traverse right) and the three classic orders just put "handle the node" in a different slot:

| Order | Steps | Visits a node… |
|---|---|---|
| Pre-order | node, left, right | before any of its descendants |
| In-order | left, node, right | between its left and right subtree |
| Post-order | left, right, node | after all of its descendants |

The picture on the card shows why they are one algorithm. Walk round the outside of the tree, keeping it on your left hand side. You pass every node three times: on its left as you go down, underneath it as you move from its left subtree to its right, and on its right as you climb back up. Recording at the first pass gives pre-order, the second in-order, the third post-order.

**Breadth-first (BFS)**, called **level-order** on trees, visits by depth: the root, then every node at depth 1 from left to right, then depth 2, and so on. It uses a **queue** (first in, first out): put the root in; then repeatedly take the front node out, visit it and append its children. Because children join at the back, a whole level is finished before the next one starts.

## Worked example

Take the tree from the diagram: root 4, children 2 and 6, leaves 1, 3, 5, 7.

- Pre-order: **4 2 1 3 6 5 7**
- In-order: **1 2 3 4 5 6 7**, sorted because this is a binary search tree
- Post-order: **1 3 2 5 7 6 4**, with the root always last
- Level-order: **4 2 6 1 3 5 7**

The level-order queue, step by step:

| Pop | Visit | Push | Queue afterwards |
|---|---|---|---|
| — | — | 4 | [4] |
| 4 | 4 | 2, 6 | [2, 6] |
| 2 | 2 | 1, 3 | [6, 1, 3] |
| 6 | 6 | 5, 7 | [1, 3, 5, 7] |
| 1, 3, 5, 7 | each leaf | nothing | [] |

**In-order with an explicit stack.** Recursion keeps "where to come back to" on the call stack; you can keep it yourself. Start at 4 and go left as far as possible, pushing as you go: stack [4, 2, 1]. Pop 1 and visit it; it has no right child. Pop 2, visit it, then move to its right child 3: push 3, pop 3, visit. Pop 4, visit, move right to 6 and go left again: push 6, 5. Pop 5, pop 6, then push and pop 7. Output 1 2 3 4 5 6 7, and the stack never held more than height + 1 = 3 nodes.

## Implement it in Python

The same idea works in any language; only the syntax changes. Here it is in Python.

```python
from collections import deque
class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def preorder(n, out):                 # node, left, right
    if n: out.append(n.val); preorder(n.left, out); preorder(n.right, out)
    return out
def inorder(n, out):                  # left, node, right
    if n: inorder(n.left, out); out.append(n.val); inorder(n.right, out)
    return out
def postorder(n, out):                # left, right, node
    if n: postorder(n.left, out); postorder(n.right, out); out.append(n.val)
    return out

def inorder_iterative(root):
    out, stack, n = [], [], root
    while stack or n:
        while n:                      # dive left, remembering the path
            stack.append(n); n = n.left
        n = stack.pop()               # leftmost node not yet visited
        out.append(n.val)
        n = n.right                   # then its right subtree
    return out

def level_order(root):
    levels, q = [], deque([root] if root else [])
    while q:
        level = []
        for _ in range(len(q)):       # exactly the nodes of one level
            n = q.popleft()
            level.append(n.val)
            q.extend(c for c in (n.left, n.right) if c)
        levels.append(level)
    return levels

root = Node(4, Node(2, Node(1), Node(3)), Node(6, Node(5), Node(7)))
print(preorder(root, []), inorder(root, []), postorder(root, []))
# [4, 2, 1, 3, 6, 5, 7] [1, 2, 3, 4, 5, 6, 7] [1, 3, 2, 5, 7, 6, 4]
print(inorder_iterative(root), level_order(root))
# [1, 2, 3, 4, 5, 6, 7] [[4], [2, 6], [1, 3, 5, 7]]
```

The `for _ in range(len(q))` line is the standard trick for grouping BFS output by level: when a level starts, the queue holds exactly that level's nodes.

## What each order is for

- **Pre-order**: copying a tree (create the parent before its children), serialising it to a string (write `#` for each missing child and the string rebuilds the exact tree), printing a folder before its contents.
- **In-order**: listing a BST's keys in sorted order, validating a BST (the output must be strictly increasing), finding the k-th smallest key.
- **Post-order**: deleting or freeing a tree, computing anything that needs the children's answers first (subtree size, height, total disk usage of a folder), evaluating an expression tree such as `(2 + 3) × 4`, where both operands must be ready before the operator.
- **Level-order**: anything about levels or distance from the root: minimum depth, the rightmost node of each level, printing the tree row by row.

## Edge cases and pitfalls

- **The empty tree.** Every function should accept `None` and return an empty result.
- **Recursion depth.** On a chain of 100,000 nodes, recursive code recurses 100,000 deep, which can overflow the call stack: Python stops at about 1,000 frames by default, and Java or C++ stacks are larger but still finite. Use an explicit stack for trees that may be tall.
- **Iterative pre- and post-order.** For pre-order, pop a node, visit it, then push its *right* child before its left so the left is popped first. For post-order, a neat trick is to produce node, right, left with that same method and reverse the result.
- **Space.** Depth-first needs O(h) extra space: O(log n) when balanced, O(n) for a chain. Level-order needs room for the widest level, which is about n/2 for a perfect tree.
- **Rebuilding a tree.** Pre-order plus in-order (or post-order plus in-order) identifies a binary tree with distinct values uniquely. Pre-order plus post-order does not: a node with one child could have it on either side.

## In the interview

Tree questions are usually traversals in disguise: maximum depth (post-order), validate a BST (in-order or passing down a range), level-order or zigzag printing (BFS by level), serialise and deserialise (pre-order with null markers), lowest common ancestor (post-order, returning what each subtree found). Say which order you need and why, then give O(n) time and O(h) space. A common follow-up is "now do it without recursion": show the explicit stack. A harder one is "in O(1) extra space", which is **Morris traversal**: it temporarily points each in-order predecessor's empty right pointer back at the current node, then removes those links as it goes.
