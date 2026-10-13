---
title: SVMs and the Kernel Trick
track: ds
tags: [classification, svm, kernels, margin]
difficulty: 3
minutes: 6
tldr: "An SVM picks the separating line with the widest margin; only the points on the margin matter. Kernels swap dot products for similarities, giving curved boundaries."
analogy: "Lay the widest possible road between two villages. Only the houses that touch the kerbs decide where the road goes; every house further back could move and the road would not."
diagram: svm-and-kernels
story:
  - title: Many lines separate the classes
    text: "Ten points in two classes, blue and red. Both thin lines separate them perfectly, and so do infinitely many others. A line that barely clears a point will get a new point wrong if it lands just slightly off. An SVM picks the line that stays as far as possible from both classes."
  - title: "The widest street: maximum margin"
    text: "Draw the widest street that fits between the classes: the boundary w·x + b = 0 down the middle, kerbs where w·x + b = ±1. Its width is 2/‖w‖, so a wider street means a smaller ‖w‖. Here w = (1, 1), b = −4, and the street is √2 ≈ 1.41 wide."
  - title: Support vectors hold the street
    text: "Only the four points touching the kerbs, the support vectors, decide where the street goes. Move or delete any other point and the answer does not change. The trained model is a weighted sum over just these points."
  - title: "Soft margin: hinge loss and C"
    text: "Real data has outliers. A blue point at (2.6, 1.7) sits on the red side, with f(x) = 0.3. A soft-margin SVM charges it hinge loss max(0, 1 − y·f(x)) = 1 + 0.3 = 1.3. C is the price per unit: with C = 1 the SVM keeps the 1.41-wide street and pays; with C = 100 it squeezes the street to 0.49 to fit the outlier."
  - title: "Kernel trick: lift x to (x, x²)"
    text: "Some data has no straight boundary. On a number line, red sits at −1, 0, 1 and blue at ±2, ±3: no single cut works. Map each x to (x, x²). Reds rise to heights 0–1, blues to 4–9, and the flat line x² = 2.5 splits them. Back on the number line that is two cuts, at ±1.58."
  - title: "RBF kernel: γ sets the reach"
    text: "An SVM only ever needs dot products between points, so we can swap in a kernel k(x, z) = φ(x)·φ(z) and never build φ. The RBF kernel exp(−γ‖x − z‖²) scores closeness. Small γ gives each support vector a wide reach and a smooth boundary; large γ draws tight islands around points and overfits."
keyIdeas:
  - "**Maximum margin**: minimise ½‖w‖² subject to yᵢ(w·xᵢ + b) ≥ 1. The street is 2/‖w‖ wide."
  - "**Support vectors** are the points on or inside the margin. Only they get non-zero weight; every other point could be deleted."
  - "**Hinge loss** max(0, 1 − y·f(x)) is zero for points safely outside the street. **C** trades a wide street (small C) against fewer violations (large C)."
  - "**Kernel trick**: replace x·z with k(x, z). RBF exp(−γ‖x − z‖²): large γ = wiggly and overfit, small γ = smooth. Tune C and γ together on a log grid."
  - "**Scale features first.** Kernel SVMs shine for small-to-medium n and many features, but training is O(n²)–O(n³): for millions of rows use a linear SVM."
quiz:
  - q: "You delete a training point that is not a support vector and retrain a hard-margin SVM. What changes?"
    options: ["Nothing: the boundary is identical", "The margin gets wider", "The boundary shifts slightly towards the deleted point", "All support vectors change"]
    answer: 0
    why: "The solution w = Σ αᵢyᵢxᵢ only has non-zero αᵢ for support vectors. A point strictly outside the margin has αᵢ = 0, so removing it leaves the optimisation problem's answer unchanged."
  - q: "A trained linear SVM has w = (3, 4). How wide is its margin (kerb to kerb)?"
    options: ["0.4", "0.2", "2.5", "5"]
    answer: 0
    why: "The kerbs are w·x + b = ±1, which are 2/‖w‖ apart. ‖w‖ = √(9 + 16) = 5, so the width is 2/5 = 0.4."
  - q: "Your RBF SVM gets 100 % training accuracy and 70 % validation accuracy, with small islands around individual points. What should you try first?"
    options: ["Increase γ", "Decrease γ (and possibly C)", "Remove feature scaling", "Switch to hinge loss"]
    answer: 1
    why: "Large γ makes each support vector's influence very local, so the boundary wraps individual points. Lowering γ widens each bump and smooths the boundary; lowering C also tolerates more training errors."
  - q: "Why is a kernel SVM a poor choice for 10 million training rows?"
    options: ["It cannot handle more than two classes", "Training scales roughly O(n²) to O(n³) and the full kernel matrix has n² entries", "It needs one-hot encoded features", "Hinge loss is not differentiable"]
    answer: 1
    why: "A kernel SVM compares pairs of points. 10⁷ rows means 10¹⁴ kernel entries, far beyond memory, and solver time grows at least quadratically. Use a linear SVM, SGD with hinge loss, or kernel approximations instead."
bigO:
  - { op: "train a kernel SVM", avg: "O(n²)–O(n³)", note: "depends on C and how separable the data is; libsvm caches kernel rows" }
  - { op: "kernel matrix memory", avg: "O(n²)", note: "100,000 rows → 10¹⁰ entries ≈ 80 GB in float64" }
  - { op: "predict one point", avg: "O(n_SV · d)", note: "one kernel evaluation per support vector" }
  - { op: "train a linear SVM", avg: "O(n · d) per pass", note: "LinearSVC / SGDClassifier(loss='hinge')" }
bigOTitle: "Key numbers"
related: [ds/logistic-regression, ds/feature-scaling, ds/regularisation, ds/k-nearest-neighbours]
prereqs: [ds/logistic-regression]
flashcards:
  - kind: qa
    q: "What is a support vector, and why does the name fit?"
    a: "A training point on or inside the margin (yᵢf(xᵢ) ≤ 1). Only these points get non-zero weight, so they alone 'support' the boundary; removing any other point leaves it unchanged."
  - kind: cloze
    text: "Hinge loss is {{max(0, 1 − y·f(x))}}: zero for points beyond the margin, and growing linearly for points inside it or on the {{wrong side}}."
  - kind: qa
    q: "Explain the kernel trick in two sentences."
    a: "The SVM's training and prediction use the data only through dot products xᵢ·xⱼ. Replacing them with k(xᵢ, xⱼ) = φ(xᵢ)·φ(xⱼ) fits a linear separator in the feature space φ without ever computing φ, which may even be infinite-dimensional (RBF)."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised learning: support vector machines, kernels" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A support vector machine (SVM) is a binary classifier. Labels are **y ∈ {−1, +1}**, the model computes a linear score **f(x) = w·x + b**, and it predicts the sign of f. So far that is the same as logistic regression or a perceptron. The difference is *which* w and b it chooses.

1. **Fix the scale.** Multiplying w and b by any positive number gives the same boundary, so the SVM pins the scale: the closest points on each side must have f(x) = +1 or −1. Every training point must satisfy **yᵢ·f(xᵢ) ≥ 1**: on the correct side, at least one unit of score away from the boundary.
2. **Measure the street.** The boundary is f(x) = 0 and the two kerbs are f(x) = ±1. The perpendicular distance from a point to the boundary is |f(x)| / ‖w‖, so each kerb sits 1/‖w‖ away and the street (the **margin**) is **2/‖w‖** wide.
3. **Make it as wide as possible.** Maximising 2/‖w‖ is the same as minimising **½‖w‖²** subject to yᵢ(w·xᵢ + b) ≥ 1 for every i. That is a convex quadratic program: there is one global optimum and no local minima to get stuck in.

**Why the widest street?** A boundary that hugs a training point will misclassify a new point that lands slightly off it. A wide street tolerates that noise. Statistical learning theory backs this up: the generalisation guarantees for SVMs depend on the margin, not on the number of features, which is why SVMs cope well with very many features.

**Support vectors.** At the optimum, the weight vector is a weighted sum of training points: **w = Σ αᵢ yᵢ xᵢ**, with αᵢ ≥ 0. The weights αᵢ come from the dual form of the problem, and they are zero for every point strictly outside the street. The points with αᵢ > 0 sit on the kerbs (or, with a soft margin, inside the street or on the wrong side). These are the **support vectors**. Delete any other point and the solution does not move.

## Soft margin: hinge loss and C

Real classes overlap, and a hard margin may not exist at all. The soft-margin SVM lets points violate the street but charges for it:

**minimise ½‖w‖² + C · Σ max(0, 1 − yᵢ f(xᵢ))**

The second term is the **hinge loss**. It is 0 for a point on the correct side and outside the street (y·f ≥ 1). It is between 0 and 1 for a point inside the street but still on the correct side, and above 1 for a misclassified point. It grows linearly, so a single wild outlier costs a lot but not quadratically much.

**C** is the price per unit of violation, and it behaves like the inverse of a regularisation strength:

| C | Effect | Risk |
|---|---|---|
| small (0.01–0.1) | wide street, many points inside it, many support vectors | underfitting |
| large (100+) | narrow street, almost no violations, close to a hard margin | overfitting to noise |

Compare **logistic regression**, which minimises log-loss ln(1 + e^(−y·f)). Log-loss is never exactly zero, so every point nudges the boundary, and the output is a probability. Hinge loss is exactly zero beyond the margin, so most points drop out, but the output is just a score.

## Worked example

Blue (y = −1): (1, 2), (2, 1), (0.8, 0.9), (0.4, 2.0), (1.8, 0.4). Red (y = +1): (3, 2), (2, 3), (3.2, 3.4), (4, 2.5), (2.6, 4.0).

The hard-margin solution is **w = (1, 1), b = −4**, so f(x) = x₁ + x₂ − 4. The blue kerb is x₁ + x₂ = 3, the red kerb x₁ + x₂ = 5, and the margin is 2/√2 ≈ **1.41**.

| Point | y | f(x) | y·f(x) | hinge |
|---|---|---|---|---|
| (1, 2) | −1 | −1 | 1 | 0, on the kerb: support vector |
| (2, 1) | −1 | −1 | 1 | 0, support vector |
| (0.8, 0.9) | −1 | −2.3 | 2.3 | 0, far away: α = 0 |
| (3, 2) | +1 | +1 | 1 | 0, support vector |
| (2, 3) | +1 | +1 | 1 | 0, support vector |

Now add a blue outlier at (2.6, 1.7). Its score is f = 0.3, on the red side. Hinge = max(0, 1 − (−1)(0.3)) = **1.3**. What the SVM does depends on C:

- **C = 1.** Keeping the street and paying for the outlier costs ½‖w‖² + C·1.3 = 1 + 1.3 = 2.3. Classifying the outlier correctly instead means squeezing the street between sums 4.3 and 5, which needs w = (20/7, 20/7) ≈ (2.86, 2.86) and costs ½‖w‖² ≈ 8.16. Paying the hinge is cheaper, so the street stays 1.41 wide.
- **C = 100.** Keeping the street now costs 1 + 130 = 131, so the SVM squeezes: width 2/(2.86·√2) ≈ **0.49**, the outlier lands on the blue kerb, and all training points are classified correctly.
- **C = 0.1.** The street widens to about **2.97**, and 8 of the 11 points become support vectors.

## The kernel trick

Solving the SVM in its dual form reveals something useful: training and prediction touch the data **only through dot products**. A prediction is f(x) = Σ αᵢ yᵢ (xᵢ·x) + b, summed over support vectors. So if we want a linear separator in some transformed space φ(x), we only need the dot products φ(xᵢ)·φ(x), and a **kernel** k(x, z) = φ(x)·φ(z) can compute them directly.

**Tiny example.** One feature: red at x = −1, 0, 1, blue at x = ±2, ±3. No single threshold works. Use φ(x) = (x, x²); the kernel is k(x, z) = xz + x²z². Check one pair: k(2, 3) = 6 + 36 = 42, and φ(2)·φ(3) = (2, 4)·(3, 9) = 6 + 36 = 42. In the lifted space the SVM finds w = (0, 2/3), b = −5/3, so f(x) = (2/3)x² − 5/3. The kerbs land on x² = 1 (red at ±1) and x² = 4 (blue at ±2), the boundary on x² = 2.5. Back in 1-D, that is the two cuts |x| = √2.5 ≈ 1.58: a non-linear rule learned by a linear method.

**Why it matters.** A degree-3 polynomial map of 100 features has C(103, 3) = 176,851 coordinates, yet the kernel (x·z + 1)³ costs one 100-dimensional dot product. The **RBF (Gaussian) kernel** k(x, z) = exp(−γ‖x − z‖²) corresponds to an infinite-dimensional φ, which you could never build explicitly. A valid kernel must be positive semi-definite (Mercer's condition), so that it really is a dot product in some space.

### RBF and γ

The RBF kernel is a similarity: 1 for identical points, falling towards 0 with distance. With γ = 1, points 1 apart score e⁻¹ ≈ 0.37 and points 2 apart score e⁻⁴ ≈ 0.018. With γ = 10, points 1 apart score about 0.00005. The decision function is a sum of bumps centred on support vectors, and γ sets their width, roughly 1/√γ.

- **Large γ**: narrow bumps, so the boundary wraps individual points like islands. Training accuracy is high and validation accuracy drops.
- **Small γ**: wide bumps, so the boundary is smooth and close to linear.

C and γ interact, so tune them together on a log-spaced grid (for example 0.01 … 100 for both) with cross-validation. scikit-learn's default `gamma='scale'` is 1 / (n_features × variance of X).

## In code

```python
import numpy as np
from sklearn.svm import SVC
from sklearn.datasets import make_moons
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X = np.array([[1, 2], [2, 1], [0.8, 0.9], [0.4, 2.0], [1.8, 0.4],      # class -1 (blue)
              [3, 2], [2, 3], [3.2, 3.4], [4, 2.5], [2.6, 4.0]])       # class +1 (red)
y = np.array([-1] * 5 + [1] * 5)

hard = SVC(kernel="linear", C=1e6).fit(X, y)                  # huge C ~ hard margin
w, b = hard.coef_[0], hard.intercept_[0]
print(w, b, 2 / np.linalg.norm(w))                            # w ≈ [1, 1], b ≈ -4, width ≈ 1.414
print(hard.support_vectors_)                                  # the 4 points on the kerbs

Xo, yo = np.vstack([X, [2.6, 1.7]]), np.append(y, -1)         # add a blue outlier
for C in [0.1, 1, 100]:
    m = SVC(kernel="linear", C=C).fit(Xo, yo)
    print(C, round(2 / np.linalg.norm(m.coef_), 2))           # 2.97, 1.41, 0.49

x = np.array([[-3], [-2], [-1], [0], [1], [2], [3]], dtype=float)
t = np.array([1, 1, -1, -1, -1, 1, 1])
quad = lambda A, B: A @ B.T + (A**2) @ (B**2).T               # k(x, z) = xz + x²z²
print(SVC(kernel=quad, C=1e6).fit(x, t).predict(np.array([[1.5], [1.6]])))  # [-1  1]

# Real use: scale, then tune C and gamma together
Xm, ym = make_moons(n_samples=400, noise=0.25, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(Xm, ym, random_state=0)
pipe = make_pipeline(StandardScaler(), SVC(kernel="rbf"))
grid = {"svc__C": [0.1, 1, 10, 100], "svc__gamma": [0.01, 0.1, 1, 10]}
search = GridSearchCV(pipe, grid, cv=5).fit(Xtr, ytr)
print(search.best_params_, search.score(Xte, yte))            # C=1, gamma=1, ≈ 0.93
```

## Edge cases and pitfalls

- **Unscaled features.** The margin and the RBF distance both measure geometry, so a feature in the thousands dominates one in fractions. Always put a `StandardScaler` in front, inside a pipeline.
- **Large n.** Kernel SVM training scales roughly between O(n²) and O(n³), and the full kernel matrix has n² entries: 100,000 rows is 10¹⁰ numbers, about 80 GB as float64. Beyond a few tens of thousands of rows, use `LinearSVC` or `SGDClassifier(loss="hinge")`, which are linear in n, or approximate the kernel with `Nystroem` / `RBFSampler` and fit a linear model on top.
- **Probabilities.** An SVM outputs a score, not a probability. `SVC(probability=True)` fits Platt scaling with an internal 5-fold cross-validation: slower, and its probabilities can occasionally disagree with `predict`. If you need calibrated probabilities, logistic regression or a calibrated classifier is more natural.
- **Imbalanced classes.** The minority class can end up inside a wide street. Use `class_weight="balanced"`, which scales C per class.
- **Multi-class.** SVMs are binary. `SVC` trains one-vs-one (k(k−1)/2 models); `LinearSVC` trains one-vs-rest.
- **Noisy, overlapping classes** turn most points into support vectors, which makes prediction slow and the model no sparser than kNN.

## When to use it

SVMs shine with **small to medium datasets** (hundreds to tens of thousands of rows), **many features relative to rows** (text classification with a linear SVM is a classic strong baseline), and a reasonably clean separation. They are less attractive for millions of rows (kernel versions), heterogeneous tabular data (gradient-boosted trees usually win), or when you need probabilities and easy explanations.

## In the interview

Common prompts: "What is a support vector?", "What does C do?", "Explain the kernel trick", "SVM or logistic regression?". A strong answer draws the street, writes the objective ½‖w‖² + C·Σ hinge, says that only points on or inside the margin get weight, and explains that kernels work because the dual uses only dot products. Mention scaling and the O(n²) memory wall. Expect the follow-up "What do large γ and large C do to an RBF SVM?" Both reduce regularisation: large γ makes the boundary local and wiggly, large C refuses to tolerate training errors, and together they overfit.
