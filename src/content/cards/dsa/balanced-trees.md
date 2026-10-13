---
title: Balanced Trees (AVL, Red-Black)
track: dsa
tags: [trees, search, ordered-data, rotations]
difficulty: 3
minutes: 5
tldr: "A BST costs O(height), and sorted inserts make the height n. Self-balancing trees run a small repair (a rotation) after each change so the height stays O(log n) no matter the input order."
analogy: "A mobile hanging from the ceiling: add weight to one side and it tilts. Instead of rebuilding it, you slide one hook along the bar, a small local fix that levels it again."
diagram: balanced-trees
story:
  - title: Sorted inserts make a chain
    text: "Insert 10, 20, 30, 40 into a plain binary search tree. Each key is bigger than everything before it, so it always goes right: the tree is a chain of height n − 1. Every BST operation costs O(height), so search is now O(n), no better than a linked list."
  - title: "AVL rule: |balance factor| ≤ 1"
    text: "An AVL tree stores each node's height. The balance factor is height(left) − height(right), and the rule is that it must be −1, 0 or +1 at every node. Here 30 has a left subtree of height 1 and a right one of height 0: +1, which is allowed."
  - title: Insert 5 and find the violation
    text: "5 goes below 10. Walking back up, the balance factors become 10: +1, 20: +1, 30: +2. 30 breaks the rule, and both +2 and its left child's +1 lean left. This is the left-left case, fixed by one right rotation at 30."
  - title: Rotate right at 30
    text: "20 moves up to be the root, 30 becomes 20's right child, and 20's old right subtree, 25, becomes 30's left child. 25 is still between 20 and 30, so the BST order is unchanged. Three pointers move, it costs O(1), and the height drops from 3 back to 2."
  - title: "Red-black: colours, not heights"
    text: "A red-black tree colours each node red or black. The root is black, a red node never has a red child, and every path down from a node passes the same number of black nodes: 2 here. Together those rules force height ≤ 2·log₂(n+1)."
  - title: "B-trees: the disk cousin"
    text: "A B-tree node holds many sorted keys and has one more child than keys: 20 | 40 splits the children into keys below 20, between 20 and 40, and above 40. With hundreds of keys per node, a billion keys fit in about 4 levels, so a lookup needs about 4 disk reads."
keyIdeas:
  - "**Every BST operation is O(h)**. Balanced: h ≈ log₂ n (about 20 for a million keys). Unbalanced worst case: h = n − 1."
  - "A **rotation** re-links three pointers in O(1) and keeps the in-order sequence, so the BST stays valid while its height changes."
  - "**AVL**: |height(left) − height(right)| ≤ 1 at every node, height ≤ about 1.44·log₂ n. Stricter, so lookups are a little faster."
  - "**Red-black**: no red node has a red child, and every path has the same number of black nodes, so height ≤ 2·log₂(n+1). Fewer rotations per update; used by Java's `TreeMap`, C++ `std::map` and the Linux scheduler."
  - "**B-trees** keep many keys per node so the tree is shallow: the standard for database and file-system indexes on disk."
quiz:
  - q: "In an AVL tree, a node has balance factor +2 and its left child has −1. What fixes it?"
    options: ["One right rotation at the node", "One left rotation at the node", "A left rotation at the left child, then a right rotation at the node", "Recolouring"]
    answer: 2
    why: "This is the left-right case: the extra height sits in the left child's right subtree. Rotating the child left turns it into the left-left case, which a right rotation at the node then fixes."
  - q: "During a right rotation at node x with left child y, where does y's old right subtree go?"
    options: ["It becomes x's left subtree", "It stays as y's right subtree", "It becomes x's right subtree", "It is re-inserted from the root"]
    answer: 0
    why: "Its keys are bigger than y and smaller than x. After the rotation x is y's right child, and x's left slot (vacated by y) is exactly where keys between y and x belong."
  - q: "Why is a red-black tree's height at most 2·log₂(n+1)?"
    options: ["Every node has exactly two children", "Reds cannot be adjacent, so at least half of any path is black, and every path has the same number of black nodes", "Rotations happen after every insert", "The root is always black"]
    answer: 1
    why: "If every path has b black nodes, the tree has at least 2^b − 1 nodes. No red node has a red child, so a path is at most 2b long. So n ≥ 2^(h/2) − 1, giving h ≤ 2·log₂(n+1)."
  - q: "Why do databases index with B-trees rather than red-black trees?"
    options: ["B-trees use less memory per key", "Red-black trees cannot store strings", "Each node is one disk page with hundreds of keys, so lookups need only a few slow disk reads", "B-trees never need rebalancing"]
    answer: 2
    why: "A disk or SSD read fetches a whole page at once. A binary tree uses one read per level, about 30 for a billion keys; a B-tree with fan-out of a few hundred needs about 4."
bigO:
  - { op: "search / insert / delete (AVL, red-black)", avg: "O(log n)", worst: "O(log n)" }
  - { op: "plain BST, sorted input", avg: "O(n)", worst: "O(n)", note: "height n − 1" }
  - { op: "one rotation", avg: "O(1)", note: "three pointer changes plus height or colour updates" }
  - { op: "AVL height", avg: "≤ 1.44·log₂ n", note: "approximately" }
  - { op: "red-black height", avg: "≤ 2·log₂(n+1)" }
related: [dsa/binary-search-trees, dsa/trees-and-traversals, sysdesign/indexes-and-b-trees, dsa/heaps]
prereqs: [dsa/binary-search-trees]
flashcards:
  - kind: qa
    q: "What are the four AVL imbalance cases and their fixes?"
    a: "Left-left: rotate right at the node. Right-right: rotate left. Left-right: rotate the left child left, then the node right. Right-left: rotate the right child right, then the node left."
  - kind: cloze
    text: "A red-black tree requires that no {{red node has a red child}} and that every root-to-leaf path has the same number of {{black nodes}}."
  - kind: qa
    q: "Why does a rotation keep the tree a valid BST?"
    a: "It only changes which node is the parent; the in-order sequence (A, y, B, x, C) is identical before and after, so every key still sits between its neighbours."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Red-black trees and B-trees chapters" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why balance matters

A **binary search tree** (BST) keeps smaller keys to the left of each node and bigger keys to the right, so search, insert and delete each follow one path from the root. Their cost is **O(h)**, where the **height h** is the number of edges on the longest root-to-leaf path. With n keys, h can be as small as ⌊log₂ n⌋ (every level full) or as large as n − 1 (a chain).

A plain BST does not choose its shape; the insertion order does. Inserting already-sorted keys, which is very common (timestamps, auto-increment IDs), sends every key the same way and builds a chain. A million keys then need up to a million comparisons per lookup instead of about 20.

A **self-balancing BST** adds a rule about shape, checks the rule after each insert or delete, and repairs any violation with **rotations**. Different rules give different trees; the two classics are AVL and red-black.

## Rotations: the repair tool

A **right rotation** at node x, whose left child is y:

```
        x                y
       / \              / \
      y   C    ──►     A   x
     / \                  / \
    A   B                B   C
```

A, B and C are whole subtrees (possibly empty). Before and after, the in-order sequence is A, y, B, x, C, so the BST order is preserved. What changes: y moves up a level, x moves down, and **B changes parent**, from y's right to x's left. That is correct because every key in B is bigger than y and smaller than x. Only three links change (x.left, y.right and the pointer from x's old parent), so a rotation is O(1). A **left rotation** is the mirror image.

## AVL trees

An **AVL tree** (Adelson-Velsky and Landis, 1962) stores each node's height and defines its **balance factor** as height(left) − height(right), counting an empty subtree as height −1. **Rule: every balance factor is −1, 0 or +1.**

After a normal BST insert, walk back up the path recomputing heights. The first node whose balance factor reaches ±2 is fixed with one of four cases, named by where the new key went:

| Case | Signs | Fix |
|---|---|---|
| Left-left | node +2, left child +1 | rotate right at the node |
| Right-right | node −2, right child −1 | rotate left at the node |
| Left-right | node +2, left child −1 | rotate left at the child, then right at the node |
| Right-left | node −2, right child +1 | rotate right at the child, then left at the node |

After an insert, one single or double rotation restores the subtree to its height before the insert, so nothing above it needs fixing. A delete may need a rotation at every level on the way up, which is still O(log n). AVL trees are the most tightly balanced common BST: height at most about 1.44·log₂ n.

## Worked example

Insert 30, 20, 40, 10, 25: every balance factor is in range (30 is +1, the rest 0). Now **insert 5**:

| Node (walking up) | Left height | Right height | Balance factor |
|---|---|---|---|
| 10 | 0 (node 5) | −1 (empty) | +1 |
| 20 | 1 | 0 (node 25) | +1 |
| 30 | 2 | 0 (node 40) | **+2**, violation |

30 is +2 and its left child 20 is +1: left-left, so **rotate right at 30**:

1. 20's right subtree (25) becomes 30's left subtree.
2. 30 becomes 20's right child.
3. Recompute heights bottom-up: 30 now has height 1, 20 has height 2.
4. 20 takes 30's place as the subtree root (here, the whole tree's root).

Result: 20 at the root, 10 (with left child 5) on its left, 30 (with children 25 and 40) on its right. The height is back to 2, the in-order sequence is still 5 10 20 25 30 40, and every balance factor is in range.

A **left-right** example: insert 30, 10, 20. Now 30 is +2 but 10 is −1, because the new key went to the *right* of the left child. A single right rotation at 30 would only make the tree lean the other way. First rotate 10 left (20 moves above 10), then rotate 30 right, and 20 ends up as the root with 10 and 30 below it.

## In code

```python
class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.h = key, None, None, 0  # h = height

def h(n):   return n.h if n else -1                    # empty subtree has height -1
def bf(n):  return h(n.left) - h(n.right)              # balance factor
def fix(n): n.h = 1 + max(h(n.left), h(n.right))

def rotate_right(x):          # left child y moves up; y's right subtree moves across
    y = x.left
    x.left, y.right = y.right, x
    fix(x); fix(y)            # x is now below y, so update x first
    return y                  # new root of this subtree

def rotate_left(x):           # mirror image
    y = x.right
    x.right, y.left = y.left, x
    fix(x); fix(y)
    return y

def insert(n, key):
    if n is None: return Node(key)
    if key < n.key: n.left = insert(n.left, key)
    else:           n.right = insert(n.right, key)
    fix(n)
    if bf(n) > 1:                         # left-heavy
        if bf(n.left) < 0:                # left-right: straighten the child first
            n.left = rotate_left(n.left)
        return rotate_right(n)
    if bf(n) < -1:                        # right-heavy: mirror image
        if bf(n.right) > 0:
            n.right = rotate_right(n.right)
        return rotate_left(n)
    return n

def shape(n): return f"{n.key}({shape(n.left)},{shape(n.right)})" if n else "-"

root = None
for k in [30, 20, 40, 10, 25, 5]: root = insert(root, k)
print(shape(root), root.h)    # 20(10(5(-,-),-),30(25(-,-),40(-,-))) 2
chain = None
for k in range(1, 1001): chain = insert(chain, k)
print(chain.h)                # 9: 1,000 sorted inserts, still as short as possible
```

## Red-black trees

A **red-black tree** stores one colour bit per node instead of a height. Its rules (treating the empty children below leaves as black "NIL" nodes):

1. Every node is red or black, and the root is black.
2. **A red node never has a red child.**
3. **Every path from a node down to a NIL below it passes the same number of black nodes** (the node's *black-height*).

**Why that bounds the height.** By rule 3, a subtree whose root has black-height b contains at least 2^b − 1 nodes: it is "full" if you count only black nodes. By rule 2, at least half the nodes on any path are black, so a tree of height h has black-height at least h/2. So n ≥ 2^(h/2) − 1, which rearranges to **h ≤ 2·log₂(n+1)**. Paths can differ in length, but never by more than a factor of two.

Inserts colour the new node red (which never breaks rule 3) and then fix any red-red pair by recolouring and at most **two rotations**; deletes need at most three rotations. The rules are looser than AVL's, so lookups may be slightly slower, but updates do less restructuring. That trade-off made red-black trees the default in libraries: Java's `TreeMap` and `TreeSet`, the usual C++ `std::map` and `std::set` implementations, and the Linux kernel, whose CFS scheduler kept runnable tasks in a red-black tree ordered by virtual run time. Its successor, EEVDF (Linux 6.6 onwards), still uses one.

## B-trees

On disk, the cost that matters is the number of **page reads**, not comparisons. A **B-tree** node fills a whole page with sorted keys and child pointers: an internal node with k keys has k + 1 children, and all leaves are at the same depth. Nodes stay at least half full, splitting when they overflow and merging when they underflow. With a fan-out of a few hundred, height is about log₂₀₀ n: roughly 4 levels for a billion keys. Most databases use the **B+ tree** variant, which keeps all records in the leaves and links the leaves together for fast range scans.

## Pitfalls

- **Updating heights in the wrong order** after a rotation: the node that moved down must be updated before the node that moved up.
- **Forgetting to reattach** the rotated subtree to its parent; returning the new subtree root, as the code above does, avoids that.
- **Mixing up the double-rotation cases**: compare the sign of the node's balance factor with its heavy child's. Same sign: single rotation. Opposite signs: double rotation.

## In the interview

You will rarely be asked to code a red-black tree. Expect "why can a BST be O(n), and how do you prevent it?", "what is a rotation and why does it preserve order?", "AVL or red-black?" (AVL: faster lookups; red-black: cheaper updates), and "which library structure is a balanced BST?" In Python, the standard library has no balanced BST; the third-party `sortedcontainers.SortedList` is the common substitute.
