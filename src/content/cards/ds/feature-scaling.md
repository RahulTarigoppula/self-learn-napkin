---
title: Feature Scaling
track: ds
tags: [preprocessing, standardisation, knn, leakage]
difficulty: 1
minutes: 4
tldr: "Put features on comparable scales so no column dominates just because of its units. Fit the scaler on training data only. Distance and gradient models need it; trees do not."
analogy: "Comparing two flats by '3 bedrooms and £1,200 rent' as if both numbers were in the same unit makes the rent decide everything. Scaling converts each number to 'how unusual is this?' before you compare."
diagram: feature-scaling
story:
  - title: Two features in very different units
    text: "Five people described by age in years and income in pounds, plus a new person Q, aged 24 on £44,000. A k-nearest-neighbours model labels Q like the most similar people, and similarity means distance. But ages vary by tens while incomes vary by tens of thousands."
  - title: "Raw distance: income drowns age"
    text: "Euclidean distance adds squared differences. For E that is √(34² + 1,000²) ≈ 1,001, so a £1 gap counts as much as a whole year of age. Income decides everything, and the person 'nearest' to a 24-year-old is 58. Every distance-based model inherits this."
  - title: "Standardise: z = (x − mean) / std"
    text: "Standardisation rescales each column to mean 0 and standard deviation 1. Ages have μ = 40 and σ = 12; incomes have μ = £50,000 and σ = £10,000. A z-score of 1 now means 'one typical spread above average' in either column, so the units drop out."
  - title: "Scaled distance: A is nearest"
    text: "On z-scores, A (2 years and £11,000 away) is nearest at 1.11, and E drops to farthest at 2.84. Min-max scaling to [0, 1] picks A too. kNN, k-means, SVMs and PCA all need this step. Decision trees do not, because they split on one feature at a time."
  - title: Fit the scaler on train only
    text: "A scaler has parameters, μ and σ. Learn them from training rows only, then reuse them unchanged on validation, test and live data. Fitting on all rows leaks test information into training. Put the scaler in a pipeline so cross-validation refits it inside every fold."
  - title: "Gradient descent: a round bowl"
    text: "Scaling also speeds up gradient descent. With raw features the loss surface is a long, narrow valley: a learning rate small enough for the steep direction crawls along the flat one, and the path zig-zags. Scaled features give a rounder bowl, and the steps head nearly straight to the minimum."
keyIdeas:
  - "**Standardise**: z = (x − μ) / σ gives mean 0, std 1. **Min-max**: (x − min) / (max − min) maps to [0, 1]. **Robust**: (x − median) / IQR ignores outliers."
  - "**Needs scaling**: kNN, k-means, SVM, PCA, regularised linear models, neural nets and anything trained by gradient descent."
  - "**Doesn't**: decision trees, random forests, gradient-boosted trees. A threshold split is unchanged by any monotonic rescaling."
  - "**Fit on train only**, transform everything else with the same μ and σ. Use a `Pipeline` so cross-validation can't leak."
  - "One extreme outlier squashes min-max scaling. Use robust scaling or a log transform for heavy-tailed columns."
quiz:
  - q: "Which model's predictions are unaffected if you standardise the features?"
    options: ["k-nearest neighbours", "k-means", "A decision tree", "An RBF-kernel SVM"]
    answer: 2
    why: "A tree splits on thresholds of one feature at a time. Rescaling a column moves the threshold but not the order of the values, so the same rows land on each side."
  - q: "Ages in the training set have mean 40 and standard deviation 12. What is the z-score of age 58?"
    options: ["0.67", "1.5", "1.8", "18"]
    answer: 1
    why: "z = (58 − 40) / 12 = 18 / 12 = 1.5: one and a half standard deviations above the mean."
  - q: "You fit StandardScaler on the full dataset, then split into train and test. What is the problem?"
    options: ["None, scaling has no parameters", "The test rows influenced μ and σ, so test information leaked into training", "StandardScaler must be fit on the test set", "The model will not converge"]
    answer: 1
    why: "μ and σ are learned parameters. Computing them with test rows lets the test set shape the training inputs, so the test score is slightly optimistic. Fit on train, then transform test."
  - q: "Incomes are £35k–£65k plus one at £1,000,000. What does min-max scaling do to the normal incomes?"
    options: ["Spreads them across [0, 1]", "Squashes them into about [0, 0.03]", "Removes the outlier", "Makes them negative"]
    answer: 1
    why: "The range becomes £965k, so £65k maps to (65 − 35) / 965 ≈ 0.031. Every normal value lands near 0. Robust scaling with the median and IQR avoids this."
bigO:
  - { op: "fit a scaler", avg: "O(n·d)", note: "one pass for mean/std or min/max; robust scaling needs quantiles" }
  - { op: "transform", avg: "O(d) per row", note: "subtract and divide, using the stored parameters" }
bigOTitle: "Key numbers"
related: [ds/k-nearest-neighbours, ds/gradient-descent, ds/regularisation, ds/train-val-test]
prereqs: []
flashcards:
  - kind: qa
    q: "Why does kNN need feature scaling but a random forest doesn't?"
    a: "kNN compares raw distances, so the column with the largest numeric range dominates. Trees split one feature at a time on thresholds, which no monotonic rescaling changes."
  - kind: cloze
    text: "Fit the scaler on the {{training set only}}, then use the same {{μ and σ}} to transform validation, test and production data."
  - kind: qa
    q: "When would you choose RobustScaler over StandardScaler?"
    a: "When a column has strong outliers. The median and IQR barely move for a few extreme values, while the mean and especially the standard deviation get dragged and squash the normal rows together."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine-learning tips and tricks; data preprocessing" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why units should not matter, but do

A model that measures **distance** between rows (kNN, k-means, SVM with an RBF kernel) or finds directions of **variance** (PCA) treats a difference of 1 in every column the same. Whether a column is recorded in pounds, pence, metres or millimetres is an accident of how the data was stored. Without scaling, that accident decides which feature matters. Change income from pounds to thousands of pounds and kNN's nearest neighbours change completely, even though the information is identical.

## The three common scalers

| Scaler | Formula | Result | Weak spot |
|---|---|---|---|
| **Standardisation (z-score)** | z = (x − μ) / σ | mean 0, std 1, unbounded | the mean and σ are pulled by outliers |
| **Min-max** | (x − min) / (max − min) | exactly [0, 1] on training data | one outlier squashes everything else |
| **Robust** | (x − median) / IQR | median 0, IQR 1 | values are not bounded |

IQR is the interquartile range, the 75th percentile minus the 25th. scikit-learn's `StandardScaler` uses the population standard deviation (divide by n, not n − 1). Standardisation is the usual default. Min-max suits bounded quantities such as pixel intensities (0–255 → 0–1). Robust scaling suits heavy-tailed columns. For strongly skewed positive values such as incomes or counts, a **log transform** before scaling often helps more than any scaler.

## Worked example

Training rows: A (22, £55,000), B (34, £35,000), C (40, £50,000), D (46, £65,000), E (58, £45,000). New person Q = (24, £44,000).

**Fit the scaler on training rows.** Ages: μ = (22 + 34 + 40 + 46 + 58) / 5 = 40. The deviations −18, −6, 0, 6, 18 give variance (324 + 36 + 0 + 36 + 324) / 5 = 144, so σ = 12. Incomes: μ = £50,000, deviations ±5k and ±15k, variance 100 (in £k²), σ = £10,000.

| | age | income | raw distance to Q | z-age | z-income | scaled distance |
|---|---|---|---|---|---|---|
| A | 22 | 55,000 | 11,000 | −1.50 | +0.50 | **1.11** |
| B | 34 | 35,000 | 9,000 | −0.50 | −1.50 | 1.23 |
| C | 40 | 50,000 | 6,000 | 0.00 | 0.00 | 1.46 |
| D | 46 | 65,000 | 21,000 | +0.50 | +1.50 | 2.79 |
| E | 58 | 45,000 | **1,001** | +1.50 | −0.50 | 2.84 |
| Q | 24 | 44,000 | — | −1.33 | −0.60 | — |

Raw: E wins, because √(34² + 1000²) ≈ 1,000.6 and the 34-year age gap contributes almost nothing. Scaled: Q's z-scores are (24 − 40) / 12 = −1.33 and (44 − 50) / 10 = −0.60. For A, √((−1.50 + 1.33)² + (0.50 + 0.60)²) = √(0.028 + 1.21) ≈ 1.11, the smallest. Min-max scaling (age range 36, income range £30,000) agrees: distances 0.37 (A), 0.41 (B), 0.49 (C), 0.93 (D), 0.95 (E).

**The outlier case.** Add a £1,000,000 earner to the incomes 35k, 45k, 50k, 55k, 65k. Min-max maps the five normal incomes to 0.000–0.031. Standardisation maps them to −0.49 … −0.40, because σ balloons to about £354k. Robust scaling uses the median £52.5k and IQR 62.5k − 46.25k = £16.25k, so the five spread over −1.08 … +0.77 and the outlier sits far away at 58.3, where it belongs.

## Why gradient descent cares

For a linear model with mean squared error, the curvature of the loss along each weight is twice the average of that feature's squared values, μ² + σ². For age that is 40² + 12² = 1,744. For income it is 50,000² + 10,000² = 2.6 billion. The bowl is about 1.5 million times steeper in one direction than the other. Gradient descent must use a learning rate small enough not to overshoot along the steepest direction, so along the flattest one it barely moves. The path zig-zags across the valley, and the number of steps needed grows with that curvature ratio (the **condition number**). Standardised features make the bowl far rounder, and convergence takes a handful of steps instead of thousands. Neural networks use the same reasoning, and batch normalisation applies it inside the network.

## In code

```python
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_wine

X = np.array([[22, 55_000], [34, 35_000], [40, 50_000], [46, 65_000], [58, 45_000]], dtype=float)
q = np.array([[24, 44_000]], dtype=float)
nearest = lambda A, b: "ABCDE"[np.argmin(np.linalg.norm(A - b, axis=1))]

print(nearest(X, q))                                     # E: income dominates
sc = StandardScaler().fit(X)                             # learns mean_ = [40, 50000], scale_ = [12, 10000]
print(nearest(sc.transform(X), sc.transform(q)))         # A
mm = MinMaxScaler().fit(X)
print(nearest(mm.transform(X), mm.transform(q)))         # A

# Real use: scaler inside a pipeline, so it is fit on training data only
Xw, yw = load_wine(return_X_y=True)                      # 13 features, 'proline' runs into the 1000s
Xtr, Xte, ytr, yte = train_test_split(Xw, yw, stratify=yw, random_state=0)
raw = KNeighborsClassifier().fit(Xtr, ytr).score(Xte, yte)
scaled = make_pipeline(StandardScaler(), KNeighborsClassifier()).fit(Xtr, ytr).score(Xte, yte)
print(raw, scaled)                                       # scaling lifts kNN accuracy markedly
```

## Edge cases and pitfalls

- **Leakage.** `scaler.fit(X_all)` before splitting lets test rows shape μ and σ. The effect is usually small for scaling, but it is a habit that turns into serious leakage with target encoding or imputation. Use pipelines.
- **Scaling the target.** Scaling y can help neural network training. Remember to inverse-transform predictions before reporting errors.
- **One-hot columns** are already 0/1. Standardising them is harmless for most models but makes them harder to read. `ColumnTransformer` lets you scale only the numeric columns.
- **Sparse data** (text counts): centring destroys sparsity. Use `StandardScaler(with_mean=False)` or `MaxAbsScaler`.
- **Values outside the training range** are fine. Min-max scaling then produces values below 0 or above 1, and the model should cope.
- **Regularised models** need scaling for fairness: an L1/L2 penalty on unscaled features punishes small-unit columns more.

## In the interview

Typical prompts: "Do you need to scale features for a random forest? For kNN? Why?" and "Where do you fit the scaler?" A strong answer names the mechanism (distances and gradients are scale-sensitive, threshold splits are not) and says *fit on train, transform with the same parameters, wrap it in a pipeline*. It also mentions robust scaling or a log transform for outliers. A likely follow-up: "Does linear regression need scaling?" Ordinary least squares solved in closed form gives the same predictions either way (the weights just rescale), but scaling matters once you add regularisation or train with gradient descent.
