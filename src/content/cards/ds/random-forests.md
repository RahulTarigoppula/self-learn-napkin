---
title: Random Forests
track: ds
tags: [ensembles, trees, classification]
difficulty: 2
minutes: 5
tldr: "Grow many deep trees, each on a bootstrap sample of the rows and choosing from a random subset of features at every split, then let them vote. Averaging decorrelated trees slashes variance."
analogy: "Asking a crowd instead of one expert. Each person saw a slightly different slice of the evidence and focuses on different clues, so their individual blunders point in different directions and cancel out in the vote."
diagram: random-forests
story:
  - title: "One training set: ten rows"
    text: "A single deep decision tree is accurate on average but jumpy: change a few training rows and the tree changes a lot. That is high variance. A random forest tames it by averaging many different trees. Start from a training set of 10 rows."
  - title: "Bootstrap: draw 10 rows with replacement"
    text: "Each tree gets its own bootstrap sample: 10 draws with replacement from the 10 rows. Some rows appear twice, some not at all. On average a sample holds 1 − (1 − 1/n)ⁿ of the distinct rows: 65 % for n = 10, ≈ 63.2 % for large n. The rest are that tree's out-of-bag rows."
  - title: "A tree per sample, random features per split"
    text: "Grow a deep tree on each sample. At every split the tree may only choose among a random subset of the features: √p for classification, so 3 of 9 here. One dominant feature can no longer sit at the root of every tree, so the trees make different mistakes."
  - title: Majority vote
    text: "To predict, every tree votes and the majority wins (for regression, the predictions are averaged). Two of three trees say A, so the forest says A. Mistakes that the trees do not share cancel out in the vote."
  - title: "Out-of-bag rows: a free test set"
    text: "Row 4 never went into trees 1 and 3, so those two can judge it fairly. Predict every row using only the trees that did not see it and you get the out-of-bag (OOB) error: a validation estimate without holding out any data."
  - title: "More trees: lower variance"
    text: "Averaging B trees, each with variance σ² and pairwise correlation ρ, gives variance ρσ² + (1 − ρ)σ²/B. Adding trees shrinks the second term, so test error falls and then flattens. More trees never overfit; they only cost time. Random features lower ρ, the floor."
keyIdeas:
  - "**Bagging** = bootstrap aggregating: train each model on a resample drawn with replacement, then average. Each sample has ≈ **63.2 %** of the distinct rows."
  - "**Feature subsampling** at each split (typically √p of the p features for classification) **decorrelates** the trees; that is what makes a forest better than plain bagged trees."
  - "Variance of the average = **ρσ² + (1 − ρ)σ²/B**: more trees remove the second term, lower correlation lowers the first."
  - "**OOB error** uses the ≈ 36.8 % of trees that skipped each row, which gives you near-free validation."
  - "**Impurity-based importance** is biased towards high-cardinality features and splits credit between correlated ones; prefer **permutation importance** on held-out data."
quiz:
  - q: "You bootstrap a training set of 1,000,000 rows. About how many distinct rows does one sample contain?"
    options: ["About 500,000", "About 632,000", "About 950,000", "Exactly 1,000,000"]
    answer: 1
    why: "Each row is missed with probability (1 − 1/n)ⁿ ≈ e⁻¹ ≈ 0.368, so about 63.2 % of rows appear at least once. The sample still has 1,000,000 entries; the rest are repeats."
  - q: "Why does a random forest pick a random subset of features at each split?"
    options: ["To make each tree train faster, which is the only real benefit", "To decorrelate the trees, so averaging cancels more of their errors", "To reduce the bias of each tree, so it fits the training data more closely", "To avoid needing bootstrap samples, since features already vary"]
    answer: 1
    why: "If one feature is very strong, every bagged tree splits on it first and the trees end up alike. Averaging highly correlated trees barely reduces variance (the ρσ² term stays). Restricting the choice forces diversity. The speed-up is a side benefit."
  - q: "Your forest's test error stops improving at 300 trees. What happens at 3,000 trees?"
    options: ["It overfits badly, since each new tree memorises more noise", "About the same error, at ten times the training and prediction cost", "Error drops close to zero, because more votes remove all noise", "OOB error becomes unavailable, since every row is now in-bag"]
    answer: 1
    why: "Extra trees only shrink the (1 − ρ)σ²/B term, which is already tiny. The forest does not overfit from more trees, but cost grows linearly with B."
  - q: "A customer-ID-like column with thousands of unique values tops the impurity-based importance ranking. What should you suspect?"
    options: ["It really is the most predictive feature, so keep it at the top of the list", "Bias: many split points let high-cardinality columns win by chance", "The forest needs more trees, so that the ranking settles down", "Gini should be replaced by entropy, which ranks features fairly"]
    answer: 1
    why: "Mean-decrease-in-impurity is computed on the training data and favours features with many possible thresholds. Check with permutation importance on held-out data, which measures how much accuracy actually drops when the column is shuffled."
bigO:
  - { op: "distinct rows per bootstrap", avg: "1 − (1 − 1/n)ⁿ → 63.2 %" }
  - { op: "trees that skip a given row", avg: "≈ 36.8 %", note: "≈ 184 of 500 trees vote on its OOB prediction" }
  - { op: "variance of the average", avg: "ρσ² + (1 − ρ)σ²/B" }
  - { op: "train", avg: "O(B · m · n log n · depth)", note: "m = features tried per split; trees train in parallel" }
  - { op: "predict one row", avg: "O(B · depth)" }
bigOTitle: "Key numbers"
related: [ds/decision-trees, ds/gradient-boosting, ds/bias-variance, ds/cross-validation]
prereqs: [ds/decision-trees]
flashcards:
  - kind: qa
    q: "What two sources of randomness does a random forest use, and why?"
    a: "Bootstrap samples of the rows for each tree, and a random subset of features at each split. Both make the trees differ, so their errors are less correlated and averaging removes more variance."
  - kind: cloze
    text: "A bootstrap sample of n rows contains about {{63.2 %}} of the distinct rows; the rest are {{out-of-bag}} and can be used to estimate test error."
  - kind: qa
    q: "Does adding more trees to a random forest cause overfitting?"
    a: "No. The error converges as trees are added; more trees only reduce variance further and cost more time. Overfitting comes from the individual trees and the data, not from the number of trees."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine learning tips: bagging and random forests" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem: one tree is unstable

A deep decision tree has **low bias** (it can fit almost any shape) and **high variance**: train it on a slightly different sample and the first split may change, rewriting everything below it. If you could train many trees on independent datasets and average them, the noise would cancel. You only have one dataset, so you simulate many with the bootstrap.

## How it works

For each of B trees (typically 100–1,000):

1. **Bootstrap the rows.** Draw n rows *with replacement* from the n training rows. This is the "bagging" step (**b**ootstrap **agg**regat**ing**).
2. **Grow a tree on that sample**, usually deep and unpruned (the common default is to grow until leaves are pure).
3. **At every split, consider only m randomly chosen features** out of the p available, and pick the best threshold among those. Common defaults: m = √p for classification, p/3 or all p for regression.

To predict, run the row through all B trees and take the **majority vote**. Better still, average the trees' class probabilities, as many implementations do. For regression, average the predictions.

```text
for b in 1 … B:
    S = n row indices drawn with replacement
    tree_b = grow a deep tree on rows S, where each split
             only searches m random features (m = √p for classification)
    OOB_b = rows not in S
predict(x) = majority vote (or mean probability) of tree_1(x) … tree_B(x)
OOB prediction for row i = vote of only the trees whose OOB set contains i
```

### Why the bootstrap leaves out about 36.8 %

A given row is missed by one draw with probability 1 − 1/n, and by all n independent draws with probability (1 − 1/n)ⁿ. As n grows this tends to e⁻¹ ≈ 0.368. So a bootstrap sample contains about **63.2 %** of the distinct rows (65.1 % when n = 10), with the remaining slots filled by repeats. The rows a tree never saw are its **out-of-bag (OOB)** rows.

### Why averaging works, and why random features matter

Suppose each tree's prediction has variance σ² and any two trees have correlation ρ. The average of B trees has variance

**ρσ² + (1 − ρ)σ²/B.**

- The second term shrinks to zero as B grows: that is what adding trees buys.
- The first term does not shrink with B. It only falls if the trees are less correlated.

Bagging alone leaves ρ high: if one feature is strongly predictive, every tree splits on it first and they all look alike. Restricting each split to a random feature subset forces trees to use different features, lowering ρ. Each tree gets a bit worse (slightly higher bias), but the average gets better. This decorrelation is the difference between a random forest and plain bagged trees.

Bias barely changes: the forest's bias is roughly that of one deep tree. Forests reduce **variance**, not bias, and that is why their trees are grown deep.

## Worked example

Ten rows, three trees, as in the diagram:

| Tree | Bootstrap sample | Distinct rows | Out-of-bag |
|---|---|---|---|
| 1 | 3, 7, 7, 1, 9, 2, 9, 5, 10, 3 | 7 | 4, 6, 8 |
| 2 | 6, 2, 8, 8, 4, 1, 6, 4, 4, 5 | 6 | 3, 7, 9, 10 |
| 3 | 5, 9, 2, 9, 6, 6, 1, 3, 9, 8 | 7 | 4, 7, 10 |

On average 6.7 distinct rows per sample, close to the expected 6.5. For a new point the trees vote A, B, A, so the forest predicts **A** (two thirds of the votes). For the **OOB prediction of row 4**, only trees 1 and 3 may vote, because tree 2 trained on row 4. Repeat for every row, compare with the true labels, and you have the OOB error. With 500 trees, each row gets an OOB vote from about 0.368 × 500 ≈ 184 trees, so the estimate is close to what cross-validation would give.

## Implement it in Python

Random forests ship with every ML stack (R's randomForest and ranger, Julia's DecisionTree.jl, Spark MLlib…). In scikit-learn, m is `max_features`, out-of-bag scoring is `oob_score=True`, MDI is `feature_importances_`, and the other knobs are `min_samples_leaf`, `max_depth` and `class_weight="balanced_subsample"`.

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

rng = np.random.default_rng(0)
sample = rng.integers(0, 10_000, size=10_000)       # one bootstrap sample of 10,000 rows
print(len(np.unique(sample)) / 10_000)              # 0.635 here; 0.632 on average

X, y = make_classification(n_samples=2000, n_features=9, n_informative=4,
                           n_redundant=2, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=0)

tree = DecisionTreeClassifier(random_state=0).fit(X_tr, y_tr)
forest = RandomForestClassifier(n_estimators=300, max_features="sqrt",   # 3 of 9 per split
                                oob_score=True, n_jobs=-1, random_state=0).fit(X_tr, y_tr)

print(f"{tree.score(X_te, y_te):.3f}")              # single tree, test accuracy: 0.840
print(f"{forest.score(X_te, y_te):.3f}")            # forest, test accuracy:      0.912
print(f"{forest.oob_score_:.3f}")                   # forest, OOB accuracy:       0.915

perm = permutation_importance(forest, X_te, y_te, n_repeats=10, random_state=0)
print(np.round(forest.feature_importances_, 3))     # impurity-based, from training data
print(np.round(perm.importances_mean, 3))           # accuracy drop when a column is shuffled
```

The forest beats the single tree by 7 points, and the OOB accuracy (0.915) matches the held-out test accuracy (0.912) without using the test set. The three pure-noise columns get about 0.03 impurity importance each but about 0 permutation importance.

## Feature importance caveats

- **Mean decrease in impurity (MDI)** sums each feature's impurity reductions over all splits. It is computed on training data and is **biased towards continuous and high-cardinality features**, which offer more split points to win by chance; even pure noise gets credit.
- **Correlated features share credit.** If two columns carry the same signal, the trees split on either, and each looks half as important as it is. Dropping one may cost nothing.
- **Permutation importance** shuffles one column in held-out data and measures the drop in score. It is less biased, but with correlated features it also understates each one (the model falls back on the twin).
- Importance is **association with the model's predictions**, not causation, and not the direction of an effect. For per-row explanations use SHAP values or partial-dependence plots.

## Edge cases and pitfalls

- **Extrapolation:** like single trees, forests predict a flat line outside the range of the training features; predictions never leave the range of the training targets.
- **Memory and latency:** 500 deep trees can be hundreds of megabytes and slow to predict; cap the depth or raise the minimum rows per leaf if needed.
- **Imbalanced classes:** weight the classes (re-computed per bootstrap sample) or tune the threshold on the averaged probabilities.
- **Tuning:** forests work well out of the box. The knobs that matter most are m (features per split), the minimum rows per leaf and the number of trees (more is safe, just slower).
- **Extra-Trees** (extremely randomised trees) go further: random thresholds too, usually without bootstrapping. That buys even lower correlation and faster training.

## When to use it

A random forest is a strong, low-effort baseline for tabular data: little tuning, no feature scaling, tolerant of outliers in features, built-in OOB validation, and trees train in parallel. Gradient boosting usually wins on accuracy after tuning; neural networks win on images, audio and text.

## In the interview

Expect "how does a random forest work?", "bagging vs boosting?", "why random features?", "what is OOB error?". Give the two sources of randomness, the 63.2 % figure, and the variance formula ρσ² + (1 − ρ)σ²/B to explain *why* it works. A follow-up is often about feature importance, so mention the cardinality bias and permutation importance.
