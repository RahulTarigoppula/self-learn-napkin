---
title: Binary Search Trees
track: dsa
tags: [trees, search, ordered-data]
difficulty: 2
minutes: 4
tldr: "Every node keeps smaller keys on its left and bigger keys on its right, so search, insert and delete follow one root-to-leaf path: O(log n) if the tree is balanced, O(n) if it is not."
analogy: "A game of 'higher or lower' where each answer sends you down one fork of a road. A well-planned road map gets you anywhere in a few forks; a badly built one is a single long street."
diagram: bst
story:
  - title: Smaller left, bigger right
    text: "Start with 8 as the root. 3 is smaller, so it goes to the left; 10 is bigger, so it goes to the right. The rule holds for whole subtrees: every key anywhere below-left of a node is smaller than it, every key below-right is bigger."
  - title: Each insert walks down
    text: "Inserting 1: smaller than 8, go left; smaller than 3, go left; the spot is empty, so 1 lives there. 6 goes left of 8 then right of 3, and 14 goes right of 10. An insert is a search that ends at an empty spot."
  - title: Insert 4, 7 and 13
    text: "4 and 7 settle under 6. 13 walks right of 8, right of 10, then left of 14 (the orange path). Nine keys now sit in four levels, and reading the tree left to right gives them in sorted order: 1, 3, 4, 6, 7, 8, 10, 13, 14."
  - title: Search follows one path
    text: "Searching for 6: 6 < 8, so go left; 6 > 3, so go right; found. Three comparisons, one per level. Each comparison discards an entire subtree, which is binary search done with pointers instead of indices."
  - title: Balance is everything
    text: "Insert 1, 2, 3, 4, 5 in sorted order and every key goes right of the last one: the tree becomes a chain of 5 levels. That is a linked list in disguise, with O(n) search. Self-balancing trees such as AVL and red-black trees rotate nodes to keep the height near log₂ n."
keyIdeas:
  - "**BST property**: everything in a node's left subtree is smaller, everything in its right subtree is bigger. This holds for whole subtrees, not only for direct children."
  - "**Search, insert and delete cost O(h)**, where h is the height: one comparison per level."
  - "**Balanced: h ≈ log₂ n** (about 20 levels for a million keys). **Sorted inserts: h = n**, a linked list."
  - "**In-order traversal** (left, node, right) visits the keys in sorted order."
  - "**Use a BST over a hash table** when you need order: min/max, range queries, next-bigger key. Real libraries use self-balancing trees."
quiz:
  - q: "In the tree built from 8, 3, 10, 1, 6, 14, 4, 7, 13, where does a new key 5 go?"
    options: ["Right child of 4", "Left child of 6", "Left child of 7", "Right child of 3"]
    answer: 0
    why: "5 < 8 go left; 5 > 3 go right; 5 < 6 go left; 5 > 4 go right. That spot is empty, so 5 becomes 4's right child."
  - q: "A tree has root 8 with left child 3, and 3 has a right child 9. Is it a valid BST?"
    options: ["Yes, 9 is bigger than its parent 3", "No, 9 is in 8's left subtree but bigger than 8", "Yes, no node has more than two children", "Only if duplicates are allowed"]
    answer: 1
    why: "The property applies to whole subtrees. 9 sits below-left of 8, so it must be smaller than 8. Checking only parent–child pairs misses this."
  - q: "10,000 keys arrive already sorted and are inserted into a plain (unbalanced) BST. What does a search cost?"
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"]
    answer: 2
    why: "Each key is bigger than all before it, so it always goes right. The tree is one long chain of 10,000 levels, and a search may walk all of them."
  - q: "Which traversal of a BST lists its keys in sorted order?"
    options: ["Pre-order (node, left, right)", "In-order (left, node, right)", "Post-order (left, right, node)", "Level-order (breadth-first)"]
    answer: 1
    why: "In-order visits all smaller keys (the left subtree) before the node and all bigger keys (the right subtree) after it, at every level."
bigO:
  - { op: "search", best: "O(1)", avg: "O(log n)", worst: "O(n)", note: "worst = degenerate chain" }
  - { op: "insert / delete", avg: "O(log n)", worst: "O(n)" }
  - { op: "balanced tree (AVL, red-black)", avg: "O(log n)", worst: "O(log n)" }
  - { op: "in-order traversal", avg: "O(n)" }
related: [dsa/balanced-trees, dsa/trees-and-traversals, dsa/hash-tables, dsa/binary-search]
prereqs: [dsa/trees-and-traversals, dsa/binary-search]
flashcards:
  - kind: qa
    q: "Why can a BST degrade to O(n) search, and how is that prevented?"
    a: "Inserting keys in sorted order makes every node a right child, so the tree becomes a chain. Self-balancing trees (AVL, red-black) rotate to keep the height O(log n)."
  - kind: cloze
    text: "An {{in-order}} traversal of a BST visits its keys in {{sorted}} order."
  - kind: qa
    q: "How do you delete a node with two children from a BST?"
    a: "Replace its key with its in-order successor (the smallest key in its right subtree), then delete that successor, which has at most one child."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Binary search trees chapter, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **binary tree** is a set of nodes where each node has at most two children, called left and right; the top node is the **root**, and nodes without children are **leaves**. A **binary search tree (BST)** adds one rule, the **BST property**:

> For every node, all keys in its left subtree are smaller than its key, and all keys in its right subtree are bigger.

That rule makes every operation a walk down a single path:

- **Search(k)**: start at the root. If k equals the node's key, done. If k is smaller, the node and its entire right subtree are all too big, so rule them out and go left; otherwise go right. If you fall off the tree, k is absent.
- **Insert(k)**: search for k. When the search falls off the tree, that empty spot is exactly where k must go to keep the property, so attach a new node there.
- **Delete(k)**: three cases. A **leaf** is just removed. A node with **one child** is replaced by that child. A node with **two children** takes the key of its **in-order successor**, which is the smallest key in its right subtree (go right once, then left as far as possible). That successor, which has no left child, is then deleted by one of the simpler cases.

Each step goes down one level, so all three operations cost **O(h)**, where **h is the height**: the number of edges on the longest root-to-leaf path.

### Why height decides everything

A tree with n nodes has height somewhere between ⌊log₂ n⌋ (perfectly bushy) and n − 1 (a single chain). A million keys in a balanced tree need about 20 levels; in a chain, a million. A plain BST has no say in its own shape. The insertion order decides it. Random insertion orders give an expected height of O(log n), but sorted or nearly sorted input, which is common in practice, produces the chain.

**Self-balancing BSTs** fix this by restructuring with **rotations** (local re-linkings that preserve the BST property) after inserts and deletes. **AVL trees** keep the two subtrees of every node within one level of each other; **red-black trees** use a colouring rule that keeps the longest path at most twice the shortest. Both guarantee O(log n) height. Java's `TreeMap` and C++'s `std::map` are red-black trees.

## Worked example

Insert 8, 3, 10, 1, 6, 14, 4, 7, 13 into an empty tree:

| Insert | Path taken | Ends up as |
|---|---|---|
| 8 | (empty tree) | root |
| 3 | 3 < 8 | left child of 8 |
| 10 | 10 > 8 | right child of 8 |
| 1 | < 8, < 3 | left child of 3 |
| 6 | < 8, > 3 | right child of 3 |
| 14 | > 8, > 10 | right child of 10 |
| 4 | < 8, > 3, < 6 | left child of 6 |
| 7 | < 8, > 3, > 6 | right child of 6 |
| 13 | > 8, > 10, < 14 | left child of 14 |

Nine nodes, height 3, which is as short as nine nodes can be. **Search 6** visits 8, 3, 6: three comparisons. **Search 5** visits 8, 3, 6, 4, then tries 4's right child, finds nothing, and reports "absent" after four comparisons. **In-order traversal** gives 1, 3, 4, 6, 7, 8, 10, 13, 14.

Now **delete 3**, which has two children. Its in-order successor is the smallest key in its right subtree: go right to 6, then left to 4, which has no left child. Copy 4 into 3's place and remove the old 4 (a leaf). The tree is still a valid BST.

## Implement it in Python

Insert is recursive and returns the subtree root; search is a plain loop, which is safer on a tree that turned into a chain.

```python
class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(root, key):
    """Insert key; return the root of the updated subtree. Duplicates are ignored."""
    if root is None:
        return Node(key)                    # the empty spot the search ended at
    if key < root.key:
        root.left = insert(root.left, key)
    elif key > root.key:
        root.right = insert(root.right, key)
    return root

def search(root, key):
    node = root
    while node is not None and node.key != key:
        node = node.left if key < node.key else node.right   # one level per step
    return node                             # None if absent

def inorder(node, out):
    if node:
        inorder(node.left, out)
        out.append(node.key)
        inorder(node.right, out)
    return out

def height(node):                           # edges on the longest path; empty = -1
    return -1 if node is None else 1 + max(height(node.left), height(node.right))

root = None
for k in [8, 3, 10, 1, 6, 14, 4, 7, 13]:
    root = insert(root, k)
print(inorder(root, []), height(root))      # [1, 3, 4, 6, 7, 8, 10, 13, 14] 3
chain = None
for k in [1, 2, 3, 4, 5]:
    chain = insert(chain, k)
print(height(chain))                        # 4: a chain, one node per level
```

## Edge cases and pitfalls

- **Validating a BST** by checking only that each left child is smaller and each right child bigger is wrong: a key deep in the left subtree can still be bigger than the root. Pass down an allowed `(low, high)` range instead, or check that the in-order traversal is strictly increasing.
- **Duplicates** need a policy: ignore them, keep a count in the node, or consistently send equal keys to one side.
- **Recursion depth**: on a degenerate chain, recursive code recurses n deep and can overflow the call stack (Python's default limit is only about 1,000 frames), so iterative search is safer.
- **Deleting with two children**: forgetting to remove the successor from its old position leaves a duplicate key.

## When to use it

Use a **hash table** for plain lookup by exact key, at O(1) on average. Use a **balanced BST** when you need **order**: the minimum or maximum, all keys between 10 and 20, the next key bigger than x, or keys in sorted order. A hash table can do none of those without sorting everything first. A BST also gives a guaranteed O(log n) worst case (when balanced), while a hash table's worst case is O(n).

## In the interview

Common questions: validate a BST, find the k-th smallest key (in-order traversal, stop at k), lowest common ancestor (walk down until the two keys split left and right), and convert a sorted array to a balanced BST (take the middle as root, recurse on each half). Always state complexity as O(h), then say what h is: "O(log n) if balanced, O(n) in the worst case".
