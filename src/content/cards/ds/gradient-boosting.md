---
title: Gradient Boosting
track: ds
tags: [ensembles, trees, regression]
difficulty: 3
minutes: 6
tldr: "Build trees one after another, each fitted to the mistakes (negative gradients) of the model so far, and add each with a small learning rate. Stop when validation error stops improving."
analogy: "Golf putting. The first shot gets near the hole; each next shot aims at where the ball actually is, correcting what is left. A cautious golfer hits each putt a bit softer than needed — slower, but less likely to overshoot."
diagram: gradient-boosting
story:
  - title: Start with the mean
    text: "Six points: (1, 1), (2, 1), (3, 4), (4, 7), (5, 4), (6, 1). Boosting builds its model F in steps. Step 0 is the best single constant under squared error, the mean: F₀ = 3 for every x."
  - title: "Residuals: what is left to explain"
    text: "The residuals y − F₀ are −2, −2, 1, 4, 1, −2 — what the model still gets wrong. For the loss ½(y − F)² they are exactly the negative gradient of the loss with respect to the prediction. Fitting them is a gradient-descent step, hence the name."
  - title: Tree 1 fits the residuals
    text: "Fit a small tree — here a one-split stump — to the residuals, not to y. The best split is x < 2.5. Its leaves predict the mean residual on each side: −2 on the left, and (1 + 4 + 1 − 2) / 4 = +1 on the right."
  - title: "Add it, shrunk by η = 0.5"
    text: "Add the tree, scaled by the learning rate η = 0.5: F₁ = F₀ + 0.5 × tree 1, which is 2 on the left and 3.5 on the right. The squared error falls from 30 to 21. Taking half a step leaves later trees room to correct, which generalises better."
  - title: Tree 2 fits the new residuals
    text: "Recompute the residuals against F₁ (orange) and fit tree 2 to them. The biggest pattern left is the drop at the right end, so it splits at x < 5.5. F₂ = F₁ + 0.5 × tree 2 is a three-level staircase with error 15.4."
  - title: "Many small steps, stop early"
    text: "Repeat hundreds of times. Training error keeps falling — after 30 stumps it is 0.07 — but eventually the trees fit noise and validation error turns up. Early stopping keeps the number of trees where validation error is lowest."
keyIdeas:
  - "**Additive model:** F(x) = F₀ + η·h₁(x) + η·h₂(x) + …, each hₘ a small tree trained on the current **pseudo-residuals**."
  - "**Pseudo-residual = negative gradient** of the loss at the current prediction: y − F for squared error, y − p for log-loss. Any differentiable loss works."
  - "**Learning rate η** (0.01–0.3) and **number of trees** trade off: smaller η needs more trees but usually generalises better. Pick the count by **early stopping**."
  - "Trees are **shallow** (depth 3–8, or ~31 leaves): boosting mainly reduces **bias**, while bagging reduces variance."
  - "**XGBoost / LightGBM / CatBoost** add second-order steps, leaf-weight regularisation, histogram splits and row/column subsampling."
quiz:
  - q: "In gradient boosting with squared-error loss, what does tree m + 1 try to predict?"
    options: ["The original targets y", "The residuals y − Fₘ(x) of the current model", "The errors of a random previous tree", "The class probabilities"]
    answer: 1
    why: "Each new tree fits the pseudo-residuals, the negative gradient of the loss at the current predictions. For ½(y − F)² that gradient is −(y − F), so the target is the plain residual."
  - q: "You lower the learning rate from 0.1 to 0.01. What else should usually change?"
    options: ["Use about 10× as many trees", "Use deeper trees", "Nothing", "Use fewer trees"]
    answer: 0
    why: "Each tree now contributes a tenth as much, so reaching the same fit needs roughly ten times as many trees. With early stopping this happens automatically; the smaller steps often give slightly better test error."
  - q: "Which statement about bagging (random forests) vs boosting is correct?"
    options: ["Both train trees in parallel", "Boosting trains trees sequentially on the previous model's errors and can overfit if you add too many", "Bagging uses shallow trees and boosting deep ones", "Boosting cannot be used for classification"]
    answer: 1
    why: "Boosting is sequential and keeps reducing training error, so with enough trees it overfits — hence early stopping. Forests train independent deep trees in parallel and do not overfit from more trees."
  - q: "For binary log-loss with predicted probability p, what is the pseudo-residual for a positive example (y = 1) with p = 0.8?"
    options: ["0.8", "0.2", "−0.2", "ln 0.8"]
    answer: 1
    why: "With the model working on the log-odds, the negative gradient of log-loss is y − p = 1 − 0.8 = 0.2. The next tree nudges that example's score up."
bigO:
  - { op: "learning rate η", avg: "0.01–0.3", note: "smaller η → more trees" }
  - { op: "trees", avg: "100–5,000", note: "chosen by early stopping" }
  - { op: "tree size", avg: "depth 3–8 or ~31 leaves", note: "depth d allows d-way interactions" }
  - { op: "train", avg: "O(M · n · p)", note: "M trees; histogram methods make each split search cheap" }
  - { op: "predict one row", avg: "O(M · depth)" }
bigOTitle: "Key numbers"
related: [ds/random-forests, ds/decision-trees, ds/gradient-descent, ds/loss-functions]
prereqs: [ds/decision-trees, ds/gradient-descent]
flashcards:
  - kind: qa
    q: "Why is it called gradient boosting?"
    a: "Each tree is fitted to the negative gradient of the loss with respect to the current predictions, and added with a step size η — gradient descent carried out in the space of functions."
  - kind: cloze
    text: "Boosting mainly reduces {{bias}} by adding trees sequentially; bagging mainly reduces {{variance}} by averaging independent trees."
  - kind: qa
    q: "How do you choose the number of trees in gradient boosting?"
    a: "Set a small learning rate and a large maximum, monitor a validation set, and stop when the validation loss has not improved for some number of rounds (early stopping)."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine learning tips: boosting" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The idea

A random forest builds many strong trees independently and averages them. **Boosting** does the opposite: it builds many **weak** learners (small trees) **one after another**, and each new one concentrates on what the ensemble so far still gets wrong. The final model is a sum:

F(x) = F₀ + η·h₁(x) + η·h₂(x) + … + η·h_M(x)

F₀ is a constant starting guess, each hₘ is a small regression tree, and η (the **learning rate** or **shrinkage**) scales every tree's contribution.

## How it works

1. **Initialise** with the best constant: the mean of y for squared error, the log-odds of the positive rate for log-loss.
2. For m = 1 … M:
   1. **Compute pseudo-residuals** for every training row: rᵢ = −∂L(yᵢ, F)/∂F at F = F_{m−1}(xᵢ).
   2. **Fit a small regression tree** hₘ to predict rᵢ from xᵢ.
   3. **Set the leaf values** to the best constant step for each leaf (for squared error, the mean residual in the leaf; for other losses, a one-dimensional line search or Newton step).
   4. **Update** Fₘ(x) = F_{m−1}(x) + η·hₘ(x).
3. Stop after M trees — ideally chosen by early stopping on validation data.

### Why "gradient"

Gradient descent on weights does w ← w − η·∇L. Here the "parameters" are the model's predictions F(xᵢ) on the training rows. The gradient of the total loss with respect to those predictions is the vector of ∂L/∂F(xᵢ). We cannot move the predictions directly for unseen x, so we fit a tree that approximates the negative gradient and step along the tree. That makes boosting **gradient descent in function space**, and it works for any differentiable loss:

| Loss | Pseudo-residual −∂L/∂F | Leaf value |
|---|---|---|
| Squared error ½(y − F)² | y − F (the residual) | mean residual |
| Absolute error \|y − F\| | sign(y − F) | median residual |
| Log-loss, F = log-odds, p = σ(F) | y − p | Newton step Σ(y − p) / Σ p(1 − p) |
| Huber | residual, capped at ±δ | line search |

## Worked example

x = 1…6, y = [1, 1, 4, 7, 4, 1], squared error, stumps (one-split trees), η = 0.5.

| x | 1 | 2 | 3 | 4 | 5 | 6 | Σ(y − F)² |
|---|---|---|---|---|---|---|---|
| y | 1 | 1 | 4 | 7 | 4 | 1 | |
| F₀ (mean) | 3 | 3 | 3 | 3 | 3 | 3 | **30** |
| residual y − F₀ | −2 | −2 | 1 | 4 | 1 | −2 | |
| tree 1 (x < 2.5) | −2 | −2 | 1 | 1 | 1 | 1 | |
| F₁ = F₀ + 0.5·tree 1 | 2 | 2 | 3.5 | 3.5 | 3.5 | 3.5 | **21** |
| residual y − F₁ | −1 | −1 | 0.5 | 3.5 | 0.5 | −2.5 | |
| tree 2 (x < 5.5) | 0.5 | 0.5 | 0.5 | 0.5 | 0.5 | −2.5 | |
| F₂ = F₁ + 0.5·tree 2 | 2.25 | 2.25 | 3.75 | 3.75 | 3.75 | 2.25 | **15.375** |

Why x < 5.5 for tree 2? Splitting the residuals (−1, −1, 0.5, 3.5, 0.5, −2.5) there leaves a within-leaf squared error of 13.5, against 18 for x < 2.5 and 18 for x < 4.5. Continuing, the training error is 3.29 after 10 stumps, 0.47 after 20 and 0.07 after 30: boosting will drive training error towards zero, which is exactly why you need a validation set to tell it when to stop.

Stumps can only add one-feature step functions, so a boosted model of stumps is **additive** (no interactions). Depth-d trees let the model capture interactions among up to d features.

## Learning rate, number of trees, early stopping

- **η (shrinkage).** With η = 1 each tree takes the full correction and the model overfits quickly; with η = 0.05 each tree corrects 5 % of the error, so many trees share the work and their individual quirks average out. Smaller η almost always helps test error, at the cost of more trees.
- **Number of trees M.** Unlike a random forest, boosting **can overfit** as M grows, because every tree fits the remaining training error, noise included.
- **Early stopping.** Hold out validation data (or use cross-validation), track its loss after each tree, and stop when it has not improved for, say, 20–50 rounds. Practical recipe: fix η around 0.05–0.1, set M large, let early stopping choose.
- **Other regularisers:** shallow trees (depth 3–8 or about 31 leaves), a minimum number of rows per leaf, **row subsampling** (each tree sees a random 50–80 % of rows: *stochastic* gradient boosting), column subsampling, and L1/L2 penalties on leaf values.

## XGBoost, LightGBM, CatBoost in brief

- **XGBoost** uses a **second-order** (Newton) step: with gradient sum G and Hessian sum H in a leaf, the leaf weight is −G / (H + λ), and a split's gain includes a penalty γ per extra leaf. It handles missing values by learning a default direction at each split.
- **LightGBM** buckets each feature into **histograms** (≈ 255 bins) so split search is fast, and grows trees **leaf-wise** (best leaf first) rather than level by level; it adds gradient-based row sampling (GOSS) and bundling of sparse features.
- **CatBoost** handles **categorical features** natively with ordered target statistics and uses ordered boosting to reduce target leakage; its symmetric trees predict very fast.

## Bagging vs boosting

| | Bagging / random forest | Boosting |
|---|---|---|
| Trees built | independently, in parallel | sequentially, each on the last model's errors |
| Tree size | deep (low bias, high variance) | shallow (high bias, low variance) |
| Mainly reduces | variance | bias (and some variance via shrinkage) |
| More trees | never overfits, just slower | eventually overfits; use early stopping |
| Tuning effort | low | moderate (η, trees, depth, subsampling) |
| Noisy labels / outliers | robust | sensitive with squared error; use Huber |

## Implement it in Python

The hand-written loop works in any language; for real data use a boosting library (XGBoost, LightGBM and CatBoost all have R, Julia, JVM and Python bindings). Below: the worked example by hand, then scikit-learn's `HistGradientBoostingClassifier`, which follows LightGBM's histogram approach (`max_leaf_nodes`, `max_depth` and `min_samples_leaf` are its tree-size knobs).

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.ensemble import GradientBoostingRegressor, HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor

# Boosting by hand: each stump fits the residuals of the model so far
x = np.arange(1, 7).reshape(-1, 1)
y = np.array([1, 1, 4, 7, 4, 1], dtype=float)
eta, F = 0.5, np.full(6, y.mean())                 # F0 = mean = 3
for m in range(2):
    residuals = y - F                              # negative gradient of ½(y − F)²
    stump = DecisionTreeRegressor(max_depth=1).fit(x, residuals)
    F = F + eta * stump.predict(x)                 # shrunken step
    print(m + 1, F, ((y - F) ** 2).sum())          # 1: [2 2 3.5 3.5 3.5 3.5] 21.0
                                                   # 2: [2.25 2.25 3.75 3.75 3.75 2.25] 15.375
gb = GradientBoostingRegressor(n_estimators=2, learning_rate=0.5, max_depth=1).fit(x, y)
print(gb.predict(x))                               # the library agrees

# Real data: shallow trees, moderate learning rate, early stopping
X, y2 = make_classification(n_samples=20_000, n_features=20, n_informative=8, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y2, random_state=0)
clf = HistGradientBoostingClassifier(learning_rate=0.1, max_iter=1000, max_leaf_nodes=31,
                                     early_stopping=True, validation_fraction=0.1,
                                     n_iter_no_change=20, random_state=0).fit(X_tr, y_tr)
print(clf.n_iter_, round(clf.score(X_te, y_te), 3))   # 216 trees used of 1000; accuracy 0.967
```

## Edge cases and pitfalls

- **Overfitting with many trees** — always use early stopping or cross-validated M.
- **Tuning order:** fix η, find M by early stopping, then tune depth / leaves and the minimum rows per leaf, then subsampling; lower η at the end for a last gain.
- **Outliers and label noise** pull hard under squared error because their residuals stay large tree after tree; consider Huber or absolute loss.
- **Leakage** through target encoding or features computed with the label inflates validation scores — boosting is very good at exploiting leaks.
- **Extrapolation:** like all tree models, predictions are flat outside the training range of the features.
- **Sequential training** cannot be parallelised across trees (only within a tree's split search), so very large M is slow.

## In the interview

Typical prompts: "explain gradient boosting", "why is it called gradient?", "bagging vs boosting?", "how do you stop it overfitting?". A strong answer writes the additive model, says each tree fits the negative gradient (residuals for squared error), explains η and early stopping, and contrasts bias reduction (boosting) with variance reduction (bagging). Expect "what does XGBoost add?" — second-order steps, regularised leaves, histograms, missing-value handling.
