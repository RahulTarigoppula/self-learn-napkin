---
title: k-Means Clustering
track: ds
tags: [clustering, unsupervised, kmeans, centroids]
difficulty: 2
minutes: 5
tldr: "Pick k centres, assign every point to its nearest centre, move each centre to the mean of its points, repeat. Each step lowers the within-cluster squared distance until nothing moves."
analogy: "Place k ice-cream vans on a beach. Everyone walks to the nearest van; each van then drives to the middle of its customers. Repeat until no one switches van and no van moves."
diagram: k-means
griddle: k-means
story:
  - title: Six points, two random starts
    text: "Six unlabelled points and the instruction 'find k = 2 groups'. k-means starts by placing k centres, called centroids. The classic start picks k random data points; here (1, 1) and (3, 1), both in the lower-left group: a deliberately bad start."
  - title: "Assign: each point to its nearest ×"
    text: "Step one: every point joins its nearest centroid. (1, 1) and (1, 3) join blue. (3, 1) sits on the red ×, and all three upper-right points are nearer to it too. The quality score, inertia, is the sum of squared distances from points to their centroids: 131."
  - title: "Update: move each × to its mean"
    text: "Step two: move each centroid to the mean of the points assigned to it. Blue goes to (1, 2), the mean of (1, 1) and (1, 3). Red goes to (6, 4.75), the mean of its four points. The mean is the spot that minimises squared distance, so inertia drops to 36.75."
  - title: Repeat until nothing changes
    text: "Assign again: (3, 1) is now nearer to blue (squared distance 5 versus 23), so it switches. Inertia falls to 18.69. Update: blue moves to (1.67, 1.67), red to (7, 6), inertia 9.33. Another round changes nothing, so the algorithm stops. Inertia never goes up."
  - title: "Choosing k: elbow and silhouette"
    text: "k is your choice, and inertia always falls as k grows: 80.2, 9.33, 6.0, 3.0, 1.0 for k = 1 to 5. Look for the elbow where extra clusters stop paying off: k = 2. The silhouette score (higher is better, max 1) agrees: 0.69 at k = 2, 0.39 at k = 3."
  - title: Failure modes and k-means++
    text: "k-means draws straight borders halfway between centroids, so it finds round, similar-sized blobs and cuts rings in half. It also depends on the start: k-means++ picks each new starting centroid far from those already chosen, with probability proportional to squared distance. Run several starts and keep the lowest inertia."
keyIdeas:
  - "**Lloyd's algorithm**: assign each point to its nearest centroid, move each centroid to its cluster mean, repeat until assignments stop changing."
  - "**Inertia** = Σ squared distance to the assigned centroid. Each step can only lower it, so the algorithm always stops, but often at a **local** minimum."
  - "**k-means++** seeding (probability ∝ D²) plus several restarts (keep the lowest inertia) avoids most bad local minima."
  - "**Choose k** with the elbow of inertia vs k, the silhouette score, or the downstream use. Inertia alone always prefers more clusters."
  - "Assumes **round, similar-sized clusters in scaled features**. Scale first; use DBSCAN, Gaussian mixtures or spectral clustering for other shapes."
quiz:
  - q: "In the update step, why does k-means move each centroid to the mean of its points?"
    options: ["The mean minimises the sum of squared distances to those points", "The mean is always one of the data points, so it stays on the data", "It makes the clusters equal in size, which keeps inertia balanced", "It guarantees the global optimum after a single update step"]
    answer: 0
    why: "For a fixed set of points, Σ‖x − c‖² is minimised exactly at c = mean. That is why the update step can only lower inertia."
  - q: "Points (0, 0), (2, 0) and (10, 0) are in one cluster. Where does the centroid move?"
    options: ["(2, 0)", "(5, 0)", "(4, 0)", "(10, 0)"]
    answer: 2
    why: "The mean is ((0 + 2 + 10) / 3, 0) = (4, 0). Note how the single far point drags it: k-means is sensitive to outliers."
  - q: "Inertia for k = 1…6 is 900, 400, 160, 140, 125, 115. Which k does the elbow method suggest?"
    options: ["2", "3", "6", "1"]
    answer: 1
    why: "The drops are 500, 240, then only 20, 15, 10. The big gains stop after k = 3, so that is the elbow. Picking the minimum inertia would always choose the largest k."
  - q: "Two features: age (20–70) and income (£20k–£200k), unscaled. What will k-means do?"
    options: ["Cluster almost entirely by age", "Weight both equally", "Cluster almost entirely by income", "Refuse to run"]
    answer: 2
    why: "Squared Euclidean distance is dominated by the feature with the largest numeric spread. Standardise first so each feature contributes on a comparable scale."
bigO:
  - { op: "one iteration (assign + update)", avg: "O(n · k · d)", note: "n points, k centroids, d features" }
  - { op: "full run", avg: "O(n · k · d · i)", note: "i iterations, often a few dozen" }
  - { op: "memory", avg: "O(n · d + k · d)", note: "the data plus the centroids" }
  - { op: "global optimum", avg: "NP-hard", note: "so Lloyd's settles for a local minimum" }
bigOTitle: "Key numbers"
related: [ds/hierarchical-clustering, ds/supervised-vs-unsupervised, ds/feature-scaling, ds/pca]
prereqs: [ds/feature-scaling]
flashcards:
  - kind: qa
    q: "Why is k-means guaranteed to stop?"
    a: "Both the assign and update steps never increase inertia, and there are only finitely many ways to partition n points into k groups. So it must reach an assignment that no longer changes, though possibly only a local minimum."
  - kind: cloze
    text: "k-means++ chooses each new initial centroid with probability proportional to {{the squared distance D²}} to the {{nearest centroid already chosen}}."
  - kind: qa
    q: "Name three situations where k-means gives poor clusters."
    a: "Non-convex shapes such as rings or moons; clusters of very different sizes or densities; and unscaled features or strong outliers, which distort squared distances and drag the means."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Unsupervised learning: k-means clustering" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

k-means is **unsupervised**: there are no labels, only points, and the goal is to split them into k groups of nearby points. It represents each group by one point, its **centroid**, and scores a clustering by its **inertia** (also called within-cluster sum of squares, WCSS):

inertia = Σ over points of ‖x − c(x)‖², where c(x) is the centroid of x's cluster.

Finding the partition with the lowest possible inertia is NP-hard, so everyone uses **Lloyd's algorithm**, a fast local search:

1. **Initialise** k centroids (random data points, or better, k-means++).
2. **Assign:** put each point in the cluster of its nearest centroid. With the centroids fixed, this is the best possible assignment, so inertia cannot go up.
3. **Update:** move each centroid to the mean of its assigned points. With the assignment fixed, the mean is the single point minimising the sum of squared distances, so inertia cannot go up here either.
4. **Repeat** 2–3 until no assignment changes (or the centroids move less than a tolerance).

Because inertia never rises and there are finitely many partitions, the loop always terminates. But it ends at a **local** minimum that depends on the start, which is why initialisation matters.

The boundaries between clusters are straight: every point on one side of the perpendicular bisector between two centroids is closer to one of them. Together they form a **Voronoi diagram**, so k-means can only carve space into convex cells.

## Worked example

Points: (1, 1), (3, 1), (1, 3), (6, 5), (8, 6), (7, 7). k = 2. Start: blue × at (1, 1), red × at (3, 1).

**Round 1, assign** (squared distances):

| Point | to blue (1, 1) | to red (3, 1) | Cluster |
|---|---|---|---|
| (1, 1) | 0 | 4 | blue |
| (3, 1) | 4 | 0 | red |
| (1, 3) | 4 | 8 | blue |
| (6, 5) | 41 | 25 | red |
| (8, 6) | 74 | 50 | red |
| (7, 7) | 72 | 52 | red |

Inertia = 0 + 0 + 4 + 25 + 50 + 52 = **131**.

**Round 1, update:** blue = mean of (1, 1), (1, 3) = **(1, 2)**. Red = mean of (3, 1), (6, 5), (8, 6), (7, 7) = (24/4, 19/4) = **(6, 4.75)**. Inertia = **36.75**.

**Round 2, assign:** (3, 1) is now 2² + 1² = 5 from blue and 3² + 3.75² ≈ 23.06 from red, so it switches to blue. Inertia = **18.69**.

**Round 2, update:** blue = mean of (1, 1), (3, 1), (1, 3) = **(1.67, 1.67)**; red = mean of the upper three = **(7, 6)**. Inertia = **9.33**.

**Round 3:** no point changes cluster, so stop. Inertia went 131 → 36.75 → 18.69 → 9.33, falling at every half-step.

## Choosing k

Inertia always decreases as k grows (k = n gives inertia 0), so it cannot choose k by itself.

- **Elbow method:** plot the best inertia against k and look for the bend. Here: 80.2, 9.33, 6.0, 3.0, 1.0 for k = 1…5. The drop from 1 to 2 is huge, after that small: k = 2. Real elbows are often blurry.
- **Silhouette score:** for each point, a = mean distance to its own cluster, b = mean distance to the nearest other cluster, s = (b − a) / max(a, b). It ranges from −1 (probably in the wrong cluster) to +1 (well inside its own). Average over points and pick the k with the highest value: 0.69 at k = 2 versus 0.39 at k = 3 here.
- **The use case.** Often k is fixed by the business: 5 T-shirt sizes, 20 delivery depots, 256 colours in a palette. Stability across random seeds and subsamples is another useful check.

## k-means++ initialisation

Random starts can put two centroids in one true cluster, as in the example, and Lloyd's algorithm cannot always escape. **k-means++** spreads the starts out:

1. Pick the first centroid uniformly at random from the data.
2. For every point, compute D(x), the distance to the nearest centroid chosen so far.
3. Pick the next centroid at random with probability proportional to **D(x)²**. Repeat until you have k.

In the example, if the first pick is (1, 1), the squared distances are 4, 4, 41, 74 and 72, a total of 195. The next centroid comes from the upper-right group with probability (41 + 74 + 72) / 195 ≈ **0.96**. Arthur and Vassilvitskii (2007) proved the expected inertia after k-means++ seeding is within a factor O(log k) of the optimum. It is still random, so in practice you run the whole algorithm several times (say 10) from different seeds and keep the run with the lowest inertia.

## Implement it in Python

Lloyd's algorithm is a dozen lines of array arithmetic in any language; here it is in Python with NumPy, then the same thing through scikit-learn.

```python
import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_circles
from sklearn.metrics import silhouette_score, adjusted_rand_score

X = np.array([[1, 1], [3, 1], [1, 3], [6, 5], [8, 6], [7, 7]], dtype=float)

def lloyd(X, C, max_iter=100):
    for _ in range(max_iter):
        d2 = ((X[:, None, :] - C[None, :, :]) ** 2).sum(axis=2)            # n × k squared distances
        labels = d2.argmin(axis=1)                                         # assign step
        newC = np.array([X[labels == j].mean(axis=0) for j in range(len(C))])  # update step
        print(labels, ((X - newC[labels]) ** 2).sum())                     # inertia after update
        if np.allclose(newC, C):
            return newC, labels
        C = newC

C, labels = lloyd(X, X[[0, 1]].copy())        # start on (1,1) and (3,1): 36.75, 9.33, 9.33
print(C.round(2))                             # [[1.67 1.67] [7. 6.]]

for k in range(1, 6):                         # elbow: 80.17, 9.33, 6.0, 3.0, 1.0
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    sil = silhouette_score(X, km.labels_) if 1 < k < len(X) else float("nan")
    print(k, round(km.inertia_, 2), round(sil, 2))

Xc, yc = make_circles(n_samples=400, factor=0.4, noise=0.05, random_state=0)
pred = KMeans(n_clusters=2, n_init=10, random_state=0).fit_predict(Xc)
print(adjusted_rand_score(yc, pred))          # ≈ 0: k-means cuts the rings in half
```

The empty-cluster case (a centroid that wins no points) is ignored in this sketch; libraries re-seed such a centroid, typically at a far-away point. In scikit-learn, k-means++ is the default `init`; since version 1.4 `n_init="auto"` runs it only once, so pass `n_init=10` to keep the best of ten runs. `MiniBatchKMeans` is the mini-batch variant for millions of rows.

## Edge cases and pitfalls

- **Scale features first.** Squared Euclidean distance lets the widest-ranging feature decide everything.
- **Non-spherical clusters.** Rings, moons and long thin clusters get sliced by straight borders; the concentric-circles example scores an adjusted Rand index of about 0, no better than chance. Use DBSCAN or spectral clustering.
- **Unequal sizes and densities.** k-means prefers clusters of similar spatial extent, so a large sparse cluster may be split while two small dense ones are merged. Gaussian mixture models allow different shapes and sizes.
- **Outliers** drag the mean. k-medoids (centres must be data points, any distance metric) or trimming helps.
- **Categorical data** has no mean. Use k-modes or one-hot encoding with care.
- **High dimensions** make distances less informative. Reduce with PCA first.
- **Labels are arbitrary.** Cluster 0 in one run can be cluster 1 in the next. Compare clusterings with the adjusted Rand index, not raw label equality.

## When to use it

Use k-means when you want a fast, simple partition of numeric data into a known or guessable number of compact groups: customer segmentation, colour quantisation, vector quantisation and codebooks, initialising Gaussian mixtures, or a quick look at structure. Mini-batch k-means handles millions of rows by updating centroids from small random batches. Prefer hierarchical clustering when you want a tree of nested groups, DBSCAN when clusters have arbitrary shapes or you need noise detection, and Gaussian mixtures when you want soft (probabilistic) membership.

## In the interview

Typical prompts: "Explain k-means step by step", "How do you choose k?", "Does it always converge? To what?", "What are its assumptions?". A strong answer names both steps and why each lowers inertia, says it converges to a local minimum, recommends k-means++ with several restarts, gives the elbow and silhouette methods, and lists the failure modes (shape, scale, outliers). A common follow-up is the complexity, O(n·k·d) per iteration, and how to scale it: mini-batches, or approximate nearest-centroid search for very large k.
