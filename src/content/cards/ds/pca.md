---
title: Principal Component Analysis
track: ds
tags: [dimensionality-reduction, unsupervised, linear-algebra, pca]
difficulty: 3
minutes: 6
tldr: "Centre the data, then rotate the axes so the first one points along the direction of greatest variance, the second along the next, and so on. Keep the first few to compress with little loss."
analogy: "Photographing a long loaf of bread: from the end you see a small circle, from the side you see its whole length. PCA finds the camera angle whose photo shows the most spread, then the next-best angle at right angles to it."
diagram: pca
story:
  - title: Five points in two features
    text: "Five points, A to E, measured on two features x₁ and x₂. The cloud is stretched along a diagonal: when x₁ is large, x₂ tends to be large too. The two features partly repeat each other, so two numbers per point say less than they seem to."
  - title: "Centre: subtract the mean"
    text: "PCA first subtracts each feature's mean, here (3, 3), so the cloud is centred on the origin. Directions are then measured from the middle of the data, and the variance along a direction is just the sum of squared projections divided by n − 1."
  - title: Find the direction of maximum spread
    text: "Project every point onto a line through the centre and measure how spread out the projections are. Along the horizontal axis the variance is 2.5; along the diagonal it is 4.5, the most of any direction. That direction, (0.71, 0.71), is the first principal component, PC1."
  - title: "Project onto PC1: 2-D → 1-D"
    text: "Drop each point perpendicularly onto PC1 and keep only its position along the line: its PC1 score. A and B land at −2.12, C and D at 0.71, E at 2.83. Five 2-D points become five numbers. A and B now coincide: the difference between them was lost."
  - title: "PC2 and explained variance"
    text: "PC2 is at right angles to PC1 and captures what is left: variance 0.5. Total variance is 4.5 + 0.5 = 5, so PC1 explains 90 % and PC2 10 %. Keeping only PC1 halves the data and loses 10 % of the variance."
  - title: "Under the hood: eigenvectors"
    text: "The principal components are the eigenvectors of the covariance matrix, and each eigenvalue is the variance along its component: here 4.5 and 0.5. In practice libraries compute them with the SVD of the centred data. Standardise first if features have different units, or the largest unit wins."
keyIdeas:
  - "**Steps**: centre (and usually standardise) → covariance matrix → eigenvectors sorted by eigenvalue → project onto the top k."
  - "**PC1** is the unit direction maximising the variance of the projections; each later PC maximises it at right angles to all earlier ones."
  - "**Explained variance ratio** = λᵢ / Σλ. Choose k from the cumulative curve (e.g. 95 %) or a scree-plot elbow."
  - "**SVD**: X_c = U S Vᵀ. Rows of Vᵀ are the components and λᵢ = sᵢ² / (n − 1). Numerically better than forming the covariance matrix."
  - "**Limits**: linear only, unsupervised (high variance ≠ predictive), sensitive to scale and outliers, and components are mixtures of features that are hard to interpret."
quiz:
  - q: "A covariance matrix has eigenvalues 6, 3 and 1. What fraction of the variance do the first two components explain?"
    options: ["60 %", "67 %", "90 %", "30 %"]
    answer: 2
    why: "Total variance is 6 + 3 + 1 = 10. The first two components explain (6 + 3) / 10 = 0.9, i.e. 90 %."
  - q: "One feature is income in pounds (std ≈ 20,000) and another is age in years (std ≈ 12). You run PCA without scaling. What will PC1 be?"
    options: ["A 50/50 mix of both", "Almost exactly the income axis", "Almost exactly the age axis", "Undefined"]
    answer: 1
    why: "PCA maximises raw variance, and income's variance is millions of times larger. PC1 just points along income. Standardise first (PCA on the correlation matrix) when units differ."
  - q: "Why might the first few principal components be useless for a classification task?"
    options: ["PCA ignores the labels: the direction separating the classes may have low variance", "Principal components are always correlated", "PCA only works on images", "PCA removes the mean, which carries the class information"]
    answer: 0
    why: "PCA is unsupervised; it keeps high-variance directions whatever their link to the target. A low-variance direction can be exactly what separates the classes. Compare with a supervised method or validate the downstream model."
  - q: "Your data lies on a circle (a ring) in 2-D. What does PCA do?"
    options: ["It recovers the angle around the ring as PC1", "It puts about 90 % of the variance in PC1", "It finds two components of roughly equal variance and cannot unroll the ring", "It fails to run"]
    answer: 2
    why: "PCA can only rotate the axes. A ring has about the same spread in every direction, so the eigenvalues are nearly equal and no straight line captures the angle. Non-linear methods (kernel PCA, UMAP) are needed."
bigO:
  - { op: "covariance matrix", avg: "O(n · d²)", note: "n rows, d features" }
  - { op: "eigen-decomposition", avg: "O(d³)" }
  - { op: "full SVD of X", avg: "O(n · d · min(n, d))", note: "randomised SVD for the top k is much cheaper" }
  - { op: "project one row", avg: "O(d · k)", note: "a matrix multiply with the top-k components" }
bigOTitle: "Key numbers"
related: [ds/feature-scaling, ds/tsne-and-umap, ds/k-means, ds/regularisation]
prereqs: [ds/feature-scaling]
flashcards:
  - kind: qa
    q: "What is the first principal component, in one sentence?"
    a: "The unit vector w that maximises the variance of the projected data Xw. It is the eigenvector of the covariance matrix with the largest eigenvalue, and that eigenvalue is the variance along it."
  - kind: cloze
    text: "Before PCA, always {{centre}} the data, and {{standardise}} it when features are measured in different units."
  - kind: qa
    q: "How does PCA relate to the SVD?"
    a: "Write the centred data as X_c = U S Vᵀ. The rows of Vᵀ are the principal directions, the scores are U S, and the variance along component i is sᵢ² / (n − 1). Libraries use the SVD because it avoids forming XᵀX."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Unsupervised learning: principal component analysis" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Principal component analysis (PCA) finds a new set of axes for your data. The axes are at right angles to each other (**orthogonal**) and sorted so that the first captures as much of the data's spread as possible, the second as much of the rest, and so on. Keeping only the first few axes compresses the data while losing as little variance as possible.

1. **Centre.** Subtract each feature's mean, so the data cloud sits on the origin. Without this, the "direction of most spread" would mostly point from the origin towards the cloud.
2. **Standardise (usually).** If features have different units, divide each by its standard deviation. Otherwise the feature with the biggest numbers dominates (see the pitfalls).
3. **Covariance matrix.** C = X_cᵀ X_c / (n − 1), a d × d matrix. The diagonal holds each feature's variance; the off-diagonal entries hold how pairs of features move together.
4. **Find the best direction.** For a unit vector w, the projections X_c·w have variance wᵀCw. Maximising that subject to ‖w‖ = 1 (with a Lagrange multiplier) gives **Cw = λw**: w is an **eigenvector** of C, and the variance along it is the **eigenvalue** λ. The largest eigenvalue's eigenvector is **PC1**.
5. **The rest.** The next component maximises variance subject to being orthogonal to PC1: the eigenvector with the second-largest eigenvalue, and so on. Because C is symmetric, its eigenvectors are automatically orthogonal.
6. **Project.** Stack the top k eigenvectors as the columns of W (d × k). The **scores** are Z = X_c W: each row now has k numbers instead of d.
7. **Reconstruct (optional).** X̂ = Z Wᵀ + mean. The squared reconstruction error equals (n − 1) times the sum of the discarded eigenvalues, so maximising kept variance and minimising reconstruction error are the same goal.

### The SVD route

In practice nobody forms C. Take the **singular value decomposition** of the centred data, X_c = U S Vᵀ. The rows of Vᵀ are the principal directions, the scores are U S, and the variance along component i is sᵢ² / (n − 1). This is more accurate numerically (forming XᵀX squares the condition number) and, with randomised SVD, much faster when you only need the top k components. Library PCA routines use the SVD for exactly these reasons.

## Worked example

Points A (1, 2), B (2, 1), C (3, 4), D (4, 3), E (5, 5).

**1. Centre.** The mean is (3, 3). Centred: A (−2, −1), B (−1, −2), C (0, 1), D (1, 0), E (2, 2).

**2. Covariance** (dividing by n − 1 = 4):

- var(x₁) = (4 + 1 + 0 + 1 + 4) / 4 = **2.5**
- var(x₂) = (1 + 4 + 1 + 0 + 4) / 4 = **2.5**
- cov(x₁, x₂) = (2 + 2 + 0 + 0 + 4) / 4 = **2.0**

So C = [[2.5, 2.0], [2.0, 2.5]].

**3. Eigen-decomposition.** Solve det(C − λI) = (2.5 − λ)² − 2² = 0, so λ = 2.5 ± 2: **λ₁ = 4.5, λ₂ = 0.5**. For λ₁, (2.5 − 4.5)a + 2b = 0 gives a = b, so PC1 = (1, 1)/√2 ≈ **(0.71, 0.71)**. PC2 is at right angles: (−0.71, 0.71). The variance along a direction at angle θ to the x₁ axis works out to 2.5 + 2·sin 2θ: 2.5 at 0°, 4.23 at 30°, the maximum 4.5 at 45°, and the minimum 0.5 at 135°.

**4. Project onto PC1.** Score = (centred point) · (0.71, 0.71):

| Point | Centred | PC1 score | PC2 score |
|---|---|---|---|
| A | (−2, −1) | −3/√2 = −2.12 | +0.71 |
| B | (−1, −2) | −2.12 | −0.71 |
| C | (0, 1) | 1/√2 = 0.71 | +0.71 |
| D | (1, 0) | 0.71 | −0.71 |
| E | (2, 2) | 4/√2 = 2.83 | 0 |

Check: the PC1 scores have variance (4.5 + 4.5 + 0.5 + 0.5 + 8) / 4 = **4.5** = λ₁.

**5. Explained variance.** Total = 4.5 + 0.5 = 5 (the same as var(x₁) + var(x₂): rotating the axes never changes the total). PC1 explains 4.5 / 5 = **90 %**.

**6. What 1-D loses.** Reconstructing from PC1 alone maps A and B both to (1.5, 1.5), C and D both to (3.5, 3.5), and E to itself. The total squared error is 4 × 0.5 = **2.0** = (n − 1)·λ₂. The only thing that told A from B was their PC2 score, and it is gone.

## Choosing the number of components

- **Cumulative explained variance:** keep the smallest k reaching a target such as 90 % or 95 %. On the classic 8×8 handwritten-digit images (1,797 images, 64 pixels each), 29 of 64 components keep 95 % of the pixel variance.
- **Scree plot:** plot eigenvalues in order and look for the elbow where they flatten.
- **Downstream validation:** if PCA feeds a model, treat k as a hyperparameter and pick it by cross-validation.
- **Visualisation:** k = 2 or 3, accepting whatever fraction that keeps.

## Implement it in Python

PCA is a few lines of linear algebra (centre, then an eigen-decomposition or SVD), available in any language with a matrix library; here it is in Python with NumPy, then with scikit-learn.

```python
import numpy as np
from sklearn.decomposition import PCA
from sklearn.datasets import load_digits

X = np.array([[1, 2], [2, 1], [3, 4], [4, 3], [5, 5]], dtype=float)   # A..E
Xc = X - X.mean(axis=0)                       # 1. centre: mean (3, 3) becomes the origin

C = Xc.T @ Xc / (len(X) - 1)                  # 2. covariance matrix [[2.5, 2], [2, 2.5]]
eigvals, eigvecs = np.linalg.eigh(C)          # eigh: for symmetric matrices, ascending order
order = eigvals.argsort()[::-1]
eigvals, eigvecs = eigvals[order], eigvecs[:, order]
print(eigvals, eigvals / eigvals.sum())       # [4.5 0.5] [0.9 0.1]
print(Xc @ eigvecs[:, 0])                     # 3. PC1 scores: ±[-2.12 -2.12 0.71 0.71 2.83]

U, S, Vt = np.linalg.svd(Xc, full_matrices=False)  # same answer via SVD (no covariance needed)
print(S**2 / (len(X) - 1), Vt[0])             # [4.5 0.5], PC1 direction ±[0.707 0.707]

pca = PCA(n_components=1).fit(X)              # scikit-learn centres for you
Z = pca.transform(X)                          # 2-D → 1-D
X_back = pca.inverse_transform(Z)             # A and B both map back to (1.5, 1.5)
print(pca.explained_variance_ratio_, ((X - X_back) ** 2).sum())   # [0.9] 2.0

# Real use: keep enough components for 95 % of the variance
Xd, _ = load_digits(return_X_y=True)          # 1,797 images × 64 pixels, all in one unit (0–16)
p95 = PCA(n_components=0.95).fit(Xd)
print(p95.n_components_)                      # 29
```

The ± in the comments is real: an eigenvector and its negative are equally valid, so different libraries (or versions) may flip a component's sign. scikit-learn's `PCA` centres the data itself and uses the SVD; put it inside a `Pipeline` after the scaler so cross-validation refits both on each training fold.

## Edge cases and pitfalls

- **Scale.** PCA maximises raw variance, so units decide the answer. In the example, recording x₂ in centimetres instead of metres (×100) makes PC1 point almost exactly along x₂ and claim 99.996 % of the variance. Standardise when units differ; this is the same as PCA on the correlation matrix. Leave features unscaled when they share a unit and their spread is meaningful, as with pixel intensities.
- **Leakage.** The mean, scale and components are learned parameters. Fit PCA on the training set only (refit inside each cross-validation fold), then apply it unchanged to validation and test data.
- **Variance is not relevance.** PCA never sees the target. A low-variance direction can be the one that separates the classes, and dropping it hurts. Validate the downstream model, or use a supervised method such as linear discriminant analysis or partial least squares.
- **Linear only.** PCA can only rotate and drop axes. Curved structure (rings, spirals, a rolled-up sheet) needs kernel PCA, autoencoders, or t-SNE / UMAP for visualisation.
- **Outliers** inflate variance in their direction and can hijack PC1. Use robust scaling or robust PCA.
- **Interpretation.** Each component is a weighted mix of all features (the **loadings**). They can be hard to name; sparse PCA forces many weights to zero.
- **Sign and order.** Signs are arbitrary, and components with nearly equal eigenvalues can swap order between runs or datasets.

## When to use it

Use PCA to **compress** many correlated numeric features before a distance-based or slow model, to **visualise** high-dimensional data in 2-D or 3-D, to **denoise** (small components are often noise), to **decorrelate** inputs (the scores are uncorrelated; dividing by √λ "whitens" them), and to fight **multicollinearity** in regression (principal component regression). Skip it when interpretability of the original features matters most, when the structure is strongly non-linear, or when tree-based models already handle the raw features well.

## In the interview

Typical prompts: "Explain PCA step by step", "Why centre? Why scale?", "How do you choose the number of components?", "What is the link to eigenvectors and the SVD?". A strong answer gives the variance-maximisation view (Cw = λw), the explained-variance ratio, the SVD shortcut, and the limits: linear, unsupervised, scale- and outlier-sensitive. A common follow-up is "Is PCA feature selection?" No: each component mixes all original features, so you still need every feature to compute the scores. It is feature *extraction*. Another: "What is the reconstruction error of keeping k components?" (n − 1) times the sum of the discarded eigenvalues.
