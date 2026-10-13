---
title: Decision Trees
track: ds
tags: [classification, regression, trees]
difficulty: 2
minutes: 5
tldr: "Ask a sequence of yes/no questions about the features. Each question is the split that leaves the children purest (lowest Gini or entropy). Stop early, or the tree memorises noise."
analogy: "The game of twenty questions. A good first question (\"is it alive?\") halves the possibilities; a bad one (\"is it a left-handed violinist?\") barely helps. A tree greedily picks the most informative question at every turn."
diagram: decision-trees
story:
  - title: Fourteen loans
    text: "Fourteen past loans, each with the borrower's debt and income (in $10k). Seven were repaid (blue), seven defaulted (red). We want simple rules — a flowchart of yes/no questions — that sort a new applicant into the right group."
  - title: "Measure the mix: Gini impurity"
    text: "First we need a score for how mixed a group is. Gini impurity is 1 − Σ p², where p is the share of each class. A pure group scores 0; a 50/50 group scores 1 − 0.5² − 0.5² = 0.5, the worst case for two classes. All 14 loans together: 0.5."
  - title: "Try every split, keep the purest"
    text: "Try every feature and every threshold between neighbouring values. Debt < 4 sends 6 loans left (5 repaid, 1 not: Gini 0.28) and 8 right (2:6, Gini 0.375). Weighted by size: 6/14 × 0.28 + 8/14 × 0.375 = 0.33. No other split beats it; income ≥ 7 only reaches 0.42."
  - title: Recurse on each side
    text: "Repeat inside each child. On the right, income ≥ 7 separates the 2 repaid loans from the 6 defaults — both leaves are pure. To classify a new loan, walk down: debt 6, income 8 → not under 4 → income at least 7 → repaid."
  - title: "Too deep: it memorises noise"
    text: "Keep splitting and the tree carves a sliver, debt 1.9 to 2.4, around the one default among the low-debt loans. Training accuracy hits 100 %, but that rule is noise. Capping the depth, the minimum rows per leaf or the number of leaves keeps the 5:1 leaf, which predicts repaid with p = 5/6."
keyIdeas:
  - "A tree splits **greedily**: at each node it tries every feature and threshold and keeps the one with the **largest drop in impurity**."
  - "**Gini** = 1 − Σ pₖ²; **entropy** = −Σ pₖ log₂ pₖ. Both are 0 for a pure node; they almost always pick the same split."
  - "**Regression trees** split to minimise squared error, and each leaf predicts the **mean** of its rows."
  - "Unlimited trees **overfit** (low bias, high variance). Regularise with a **maximum depth, a minimum number of rows per leaf, a maximum number of leaves** or cost-complexity pruning."
  - "Pluses: readable rules, no feature scaling, mixed feature types. Minuses: **unstable**, axis-aligned staircase boundaries — fixed by forests and boosting."
quiz:
  - q: "A node holds 8 cats and 2 dogs. What is its Gini impurity?"
    options: ["0.20", "0.32", "0.50", "0.72"]
    answer: 1
    why: "1 − 0.8² − 0.2² = 1 − 0.64 − 0.04 = 0.32."
  - q: "A split sends 4 rows to a pure child (Gini 0) and 6 rows to a child with Gini 0.5. What is the weighted impurity after the split?"
    options: ["0.25", "0.30", "0.50", "0.20"]
    answer: 1
    why: "Weight each child by its share of rows: 0.4 × 0 + 0.6 × 0.5 = 0.30."
  - q: "Your tree has 100 % training accuracy and 71 % test accuracy. What is the most direct fix?"
    options: ["Grow it deeper", "Limit depth or require more samples per leaf", "Standardise the features", "Switch Gini to entropy"]
    answer: 1
    why: "The gap says the tree memorised training noise (high variance). Constraining growth or pruning removes the tiny, noisy leaves. Scaling does nothing for trees, and the impurity measure rarely changes the result."
  - q: "What does a leaf of a regression tree predict?"
    options: ["The median of the whole dataset", "The mean target of the training rows in that leaf", "A straight-line fit through the leaf's rows", "The most common target value"]
    answer: 1
    why: "Squared-error splitting makes the mean the best constant per leaf, so the tree is a piecewise-constant function — a staircase."
bigO:
  - { op: "train (CART, balanced tree)", avg: "O(p · n log n · depth)", note: "sort-based search over p features and n rows" }
  - { op: "predict one row", avg: "O(depth)", note: "about log₂ n for a balanced tree" }
  - { op: "max Gini, k classes", avg: "1 − 1/k", note: "0.5 for two classes" }
  - { op: "max entropy, k classes", avg: "log₂ k bits", note: "1 bit for two classes" }
bigOTitle: "Key numbers"
related: [ds/random-forests, ds/gradient-boosting, ds/bias-variance, ds/regularisation]
prereqs: [ds/bias-variance]
flashcards:
  - kind: qa
    q: "How does a decision tree choose a split?"
    a: "For every feature and every candidate threshold it computes the size-weighted impurity of the two children, and keeps the split with the largest impurity decrease (information gain). Then it recurses on each child."
  - kind: cloze
    text: "Gini impurity is {{1 − Σ pₖ²}}; for two classes its maximum is {{0.5}}, at a 50/50 mix."
  - kind: qa
    q: "Why are single decision trees called high-variance models?"
    a: "A small change in the training data can change an early split, and everything below it changes too. Deep trees also fit noise. Averaging many trees (random forests) reduces that variance."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine learning tips: tree-based methods" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **decision tree** is a flowchart. Each internal **node** asks a yes/no question about one feature ("debt < 4?"), each branch is an answer, and each **leaf** gives a prediction. To predict, start at the **root** and follow the answers down to a leaf.

Trees are grown top-down by the **CART** algorithm (Classification And Regression Trees):

1. Start with all training rows in the root.
2. For **every feature** and **every candidate threshold** (midpoints between consecutive sorted values), split the rows into "≤ threshold" and "> threshold".
3. Score each split by the **weighted impurity** of its two children, (n_left/n)·I(left) + (n_right/n)·I(right). The **impurity decrease** (or **information gain**) is the parent's impurity minus that.
4. Keep the best split, then repeat steps 2–4 inside each child.
5. Stop when a node is pure, or a stopping rule fires (maximum depth, too few rows, too small a gain). The leaf predicts the majority class; the class shares in the leaf are its probability estimates.

This is **greedy**: each split is the best one *now*, with no look-ahead. Finding the globally optimal tree is NP-hard, and greedy works well in practice.

## Impurity measures

For a node where class k makes up a share pₖ of the rows:

- **Gini impurity:** G = 1 − Σ pₖ². It is the chance that two rows drawn at random (with replacement) from the node have different labels.
- **Entropy:** H = −Σ pₖ log₂ pₖ, in bits. The drop in entropy is the **information gain**.
- **Misclassification error**, 1 − max pₖ, is too coarse for choosing splits — many splits tie — but fine for pruning.

| Class shares | Gini | Entropy |
|---|---|---|
| 50 / 50 | 0.5 | 1.0 bit |
| 5/6 vs 1/6 | 0.278 | 0.650 |
| 2/8 vs 6/8 | 0.375 | 0.811 |
| 100 / 0 | 0 | 0 |

Gini avoids logarithms, so it is slightly faster and is the default in many libraries; the two choose the same split in the vast majority of cases.

## Worked example

Fourteen loans, 7 repaid and 7 defaulted. Root Gini 0.5, root entropy 1 bit.

| Candidate split | Left (repaid : default) | Right | Weighted Gini | Weighted entropy |
|---|---|---|---|---|
| **debt < 4** | 6 rows, 5 : 1 → 0.278 | 8 rows, 2 : 6 → 0.375 | **0.333** | **0.742** |
| debt < 1.9 | 3 rows, 3 : 0 → 0 | 11 rows, 4 : 7 → 0.463 | 0.364 | 0.743 |
| income ≥ 7 | 2 rows, 2 : 0 → 0 | 12 rows, 5 : 7 → 0.486 | 0.417 | 0.840 |

Debt < 4 wins under both measures: Gini falls from 0.5 to 0.333 (decrease 0.167) and entropy from 1 to 0.742 (information gain 0.258 bits). Notice that "debt < 1.9" has a perfectly pure child and still loses: purity in a tiny child counts for little when the big child stays mixed.

Inside the right child (2 : 6), income ≥ 7 separates the two repaid loans from the six defaults — weighted Gini 0, so it is the best split there. The left child (5 : 1) can only improve by isolating the single default; with a limit of three leaves the tree stops and that leaf predicts **repaid with probability 5/6 ≈ 0.83**. That three-leaf tree gets 13 of 14 training loans right. Grown to purity, the tree needs depth 3 and five leaves and gets 14 of 14 — by fencing off debt 1.9–2.4, a rule no one would trust.

## Regression trees

For a numeric target the same algorithm splits to minimise the **sum of squared errors** around each child's mean (equivalently, the size-weighted variance), and each leaf predicts the **mean** of its rows. Example: x = 1…6, y = [5, 6, 5, 20, 21, 22]. The root has SSE 370.8 around the mean 13.17. Splitting at x ≤ 3.5 gives leaves predicting 5.33 and 21.0, with total SSE 2.67. The fitted function is a **staircase**: piecewise constant, and flat beyond the training range, so a tree **cannot extrapolate** a trend.

## Controlling overfitting

An unconstrained tree keeps splitting until every leaf is pure — low bias, very high variance. The knobs:

- **Maximum depth** — limit the number of questions on any path.
- **Minimum rows per leaf / per split** — every leaf must hold, or every split must start from, at least this many rows.
- **Maximum number of leaves** — grow best-first and stop at this many leaves.
- **Minimum impurity decrease** — skip splits that barely help.
- **Cost-complexity pruning** — grow fully, then cut back subtrees whose impurity reduction is not worth a penalty α per extra leaf.

Pick them by cross-validation.

## The algorithm in pseudocode

```text
grow(rows, depth):
    if rows are pure, or depth = max depth, or too few rows:
        return leaf(class shares of rows)
    for each feature f:
        sort rows by f
        for each midpoint t between consecutive distinct values:
            score = weighted impurity of (rows with f < t, rows with f ≥ t)
            remember (f, t) if score is the lowest so far
    if the best split does not lower the impurity: return leaf(class shares of rows)
    return node(best (f, t), grow(left rows, depth + 1), grow(right rows, depth + 1))
```

Sorting once per feature lets the class counts of every threshold be updated in O(1) as rows move from the right side to the left, which is where the n log n in the cost comes from.

## Implement it in Python

Trees are available in every ML stack (R's rpart, Julia's DecisionTree.jl, Spark MLlib…); this version computes Gini by hand and then uses scikit-learn, whose knobs are `max_depth`, `min_samples_leaf` / `min_samples_split`, `max_leaf_nodes`, `min_impurity_decrease` and `ccp_alpha` (cost-complexity pruning).

```python
import numpy as np
from sklearn.tree import DecisionTreeClassifier, export_text

# 14 loans: [debt, income]; 1 = repaid, 0 = defaulted
X = np.array([[0.8, 2.5], [1.2, 5.5], [2.8, 1.5], [3, 4.8], [1.8, 6.2], [6, 8], [8.2, 9],
              [2, 4], [5, 2], [6.2, 5], [7, 3], [8.6, 6], [9, 1.5], [5.4, 5.6]])
y = np.array([1] * 7 + [0] * 7)

def gini(labels):
    p = np.bincount(labels, minlength=2) / len(labels)   # class proportions
    return 1 - np.sum(p ** 2)

left = X[:, 0] < 4                                        # candidate split: debt < 4
w = left.mean()                                           # share of rows going left
print(gini(y), w * gini(y[left]) + (1 - w) * gini(y[~left]))   # 0.5 -> 0.333

small = DecisionTreeClassifier(max_leaf_nodes=3, random_state=0).fit(X, y)
print(export_text(small, feature_names=["debt", "income"]))     # debt <= 4, then income <= 7
print(small.predict_proba([[1.0, 3.0]]))                  # [[0.167 0.833]]: P(repaid) = 5/6

full = DecisionTreeClassifier(random_state=0).fit(X, y)  # grown until every leaf is pure
print(full.get_depth(), full.get_n_leaves(), full.score(X, y))   # 3 5 1.0
```

## Edge cases and pitfalls

- **Instability:** move a few rows and the root split can change, rewriting the whole tree. Ensembles (random forests, gradient boosting) fix this.
- **Axis-aligned splits:** a diagonal boundary such as "income > debt" needs a staircase of many splits. Adding a feature like income − debt helps.
- **No scaling needed:** splits depend only on the order of values, so standardising or log-transforming a feature does not change the tree.
- **High-cardinality features** (IDs, zip codes) offer many thresholds and can win splits by chance; impurity-based importances are biased towards them.
- **Class imbalance:** pure-looking leaves can just be the majority class; use class weights or judge with precision/recall rather than accuracy.

## In the interview

Expect "how does a decision tree decide where to split?", "Gini vs entropy?", "how do you stop a tree from overfitting?" Compute a Gini value on the whiteboard, say "weighted by child size", and name two or three regularisation knobs. Strong answers add that trees are greedy, high-variance and scale-invariant, and that this instability is exactly why random forests (averaging) and gradient boosting (sequential correction) exist.
