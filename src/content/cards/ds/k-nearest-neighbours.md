---
title: k-Nearest Neighbours
track: ds
tags: [classification, knn, distance, lazy-learning]
difficulty: 1
minutes: 5
tldr: "To label a new point, find the k training points closest to it and take a majority vote (or average, for regression). No training; all the work happens at prediction time."
analogy: "Moving to a new town and wondering whether your street is quiet? Ask your three nearest neighbours. Ask only one and you might hit the one night owl; ask the whole town and you learn nothing about your street."
diagram: k-nearest-neighbours
story:
  - title: "A new point: red or blue?"
    text: "Thirteen labelled points, blue and red, and a new point Q at (5, 5). k-nearest neighbours (kNN) does no training: it simply stores the data. To label Q it asks which stored points are most similar to Q, and similar means close."
  - title: "k = 3: the nearest three vote"
    text: "Measure the distance from Q to every point and keep the k closest. With k = 3 they are a blue at distance 0.85 and two reds at 1.17 and 1.42. Majority vote: 2 red to 1 blue, so Q is red. For regression you would average the neighbours' values instead."
  - title: "k decides: 1 overfits, 13 underfits"
    text: "k is the main knob. With k = 1 the single nearest point decides; here that is a blue that might be noise, and the boundary wraps every point. With k = 13 all points vote and every query gets the overall majority, blue 7 to 6. Pick k by cross-validation."
  - title: "Distance: metric and scale"
    text: "'Nearest' depends on how you measure. Euclidean distance is the straight line: 5 from A to B. Manhattan distance walks the grid: 3 + 4 = 7. A distance adds raw differences, so a feature measured in thousands drowns one measured in fractions. Standardise features first."
  - title: "High dimensions: all points are far"
    text: "With many features, distances stop meaning much. Among 1,000 random points, the farthest is about 73 times as far as the nearest in 2-D, but only 1.1 times as far in 1,000-D. When every point is about equally far away, the 'nearest' ones are barely nearer. Select features or reduce dimensions first."
  - title: "Faster search: KD-trees and ANN"
    text: "kNN is free to train and costly to ask: brute force compares Q with all n points, O(n·d) per query. A KD-tree cuts space into boxes, so a query only checks nearby boxes, roughly O(log n) in low dimensions. In high dimensions, approximate methods such as HNSW trade a little accuracy for large speed-ups."
keyIdeas:
  - "**Algorithm**: compute distances to all training points, take the k smallest, vote (classification) or average (regression). Optionally weight votes by 1/distance."
  - "**Choosing k**: k = 1 is low bias, high variance (training accuracy 100 %); large k smooths towards the majority class. Tune k by cross-validation; use odd k for two classes."
  - "**Scale features** and choose a sensible metric (Euclidean, Manhattan, cosine for text and embeddings). kNN has no idea which features matter."
  - "**Curse of dimensionality**: in high dimensions nearest and farthest distances converge, so neighbours stop being meaningful."
  - "**Cost**: O(1) to train, O(n·d) per brute-force query, O(n·d) memory. KD-trees and ball trees help in low dimensions; approximate nearest neighbour indexes (HNSW, FAISS) in high."
quiz:
  - q: "What is the training accuracy of a 1-nearest-neighbour classifier (no duplicate points with conflicting labels)?"
    options: ["100 %, since each point is its own nearest neighbour", "About 50 %, since one neighbour is a coin flip", "The same as on the test set, as with any classifier", "It depends on the distance metric you choose"]
    answer: 0
    why: "Each training point is its own nearest neighbour at distance 0, so it always gets its own label. That perfect training score says nothing about generalisation: 1-NN has the highest variance of any k."
  - q: "The 5 nearest neighbours of Q, nearest first, are blue, red, red, blue, blue. What do k = 3 and k = 5 predict?"
    options: ["k = 3: red, k = 5: blue", "Both red", "Both blue", "k = 3: blue, k = 5: red"]
    answer: 0
    why: "k = 3 sees blue, red, red: red wins 2 to 1. k = 5 adds two blues: blue wins 3 to 2. This is the example in the worked table, and why k must be tuned."
  - q: "Features are age (20–70) and annual income (£20k–£200k), unscaled. What happens to kNN?"
    options: ["Income almost entirely decides who is 'near'", "Age dominates because it is listed first", "Nothing, kNN is scale-invariant", "The model refuses to train"]
    answer: 0
    why: "Euclidean distance adds squared differences. Income differences are thousands of times larger than age differences, so age barely affects the distance. Standardise both first."
  - q: "Why does kNN degrade with 1,000 features even with plenty of data?"
    options: ["Distances concentrate: nearest and farthest points are almost equally far", "Majority voting fails once there are more than two classes in the data", "Sorting distances becomes impossible beyond 1,000 features", "Manhattan distance is undefined in high dimensions, so it breaks"]
    answer: 0
    why: "For random data the ratio of farthest to nearest distance tends to 1 as dimension grows (about 1.1 at d = 1,000 for 1,000 points). The 'nearest' neighbours are then barely more similar than anyone else."
bigO:
  - { op: "train", avg: "O(1)", note: "just store the data; building a KD-tree is O(n log n)" }
  - { op: "predict, brute force", avg: "O(n · d)", note: "per query; plus selecting the k smallest" }
  - { op: "predict, KD-tree", best: "O(log n)", avg: "≈ O(log n) for small d", worst: "O(n · d)", note: "degrades as d grows beyond ~20" }
  - { op: "memory", avg: "O(n · d)", note: "the whole training set is the model" }
bigOTitle: "Key numbers"
related: [ds/feature-scaling, ds/bias-variance, ds/cross-validation, ds/k-means]
prereqs: [ds/feature-scaling]
flashcards:
  - kind: qa
    q: "Why is kNN called a lazy learner?"
    a: "It does no work at training time; it stores the data. All computation (distances, sorting, voting) is deferred to prediction, so training is O(1) and each prediction is O(n·d) by brute force."
  - kind: cloze
    text: "Small k gives {{high variance}} (jagged boundary); large k gives {{high bias}} (everything drifts to the majority class)."
  - kind: qa
    q: "What is the curse of dimensionality, in one sentence about kNN?"
    a: "As the number of features grows, the distances from a point to its nearest and farthest neighbours become almost equal, so 'nearest' carries little information and kNN accuracy collapses."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised learning: k-nearest neighbours" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

k-nearest neighbours (kNN) is the simplest useful learning algorithm: **similar inputs should get similar outputs**, and "similar" is measured by distance.

1. **Training:** store the labelled training set. That is all. kNN is a **lazy** (instance-based) learner: there are no weights to fit.
2. **Prediction for a new point q:** compute the distance from q to every training point.
3. **Select** the k points with the smallest distances: q's k nearest neighbours.
4. **Combine their labels.** Classification: majority vote, and the vote shares double as rough probabilities (2 of 3 red → P(red) ≈ 0.67). Regression: the mean (or median) of the neighbours' target values.

```text
predict(q):
    for each training row i:  dist[i] = distance(q, xᵢ)
    N = indices of the k smallest dist            # a partial sort is enough
    classification: most common label among N     (or weight each vote by 1 / dist)
    regression:     mean target among N
```

A common refinement is **distance weighting**: each neighbour votes with weight 1/distance, so a very close neighbour counts more than one at the edge of the circle. It also breaks most ties.

The decision boundary is never written down; it is implied by the data. For k = 1 it follows the edges of the **Voronoi cells** around each training point, the regions closer to that point than to any other. Larger k smooths it.

## Worked example

Blue: (5.6, 4.4), (3.6, 3.9), (6.6, 3.8), (2, 2), (3.2, 1.5), (7.6, 2.2), (8.2, 4.0). Red: (4.0, 5.6), (6.1, 5.9), (5.0, 7.2), (3, 8.2), (6.6, 8.4), (8.2, 7.0). New point Q = (5, 5).

Euclidean distances from Q, sorted:

| Rank | Point | Class | Distance |
|---|---|---|---|
| 1 | (5.6, 4.4) | blue | √(0.36 + 0.36) = 0.85 |
| 2 | (4.0, 5.6) | red | √(1 + 0.36) = 1.17 |
| 3 | (6.1, 5.9) | red | √(1.21 + 0.81) = 1.42 |
| 4 | (3.6, 3.9) | blue | √(1.96 + 1.21) = 1.78 |
| 5 | (6.6, 3.8) | blue | √(2.56 + 1.44) = 2.00 |
| 6 | (5.0, 7.2) | red | 2.20 |

Votes by k:

| k | Red | Blue | Prediction |
|---|---|---|---|
| 1 | 0 | 1 | blue |
| 3 | 2 | 1 | **red** |
| 5 | 2 | 3 | blue |
| 13 (all) | 6 | 7 | blue, for *every* query |

**Distance-weighted, k = 5:** blue gets 1/0.85 + 1/1.78 + 1/2.00 ≈ 2.24, red gets 1/1.17 + 1/1.42 ≈ 1.56, so P(blue) ≈ 2.24 / 3.80 ≈ 0.59. The answer flips with k, which is exactly why k has to be chosen with data rather than by taste.

## Distance metrics and scaling

- **Euclidean** (L2): √Σ(aᵢ − bᵢ)². The default; the straight-line distance.
- **Manhattan** (L1): Σ|aᵢ − bᵢ|. Walks along the axes; less dominated by one large difference.
- **Minkowski**: (Σ|aᵢ − bᵢ|ᵖ)^(1/p). p = 1 is Manhattan, p = 2 is Euclidean.
- **Cosine distance**: 1 − cos(angle between vectors). Ignores length, so it suits text vectors and embeddings, where direction carries the meaning.
- **Hamming**: the number of positions that differ, for binary or categorical codes.

Every metric adds up per-feature differences, so **the feature with the largest numeric range dominates**. Standardise (z-scores) or min-max scale first, and fit the scaler on training data only. kNN also cannot tell useful features from noise: ten irrelevant features add ten sources of random distance. Feature selection helps kNN more than most models.

## Choosing k

k controls the **bias–variance trade-off**. k = 1 has zero training error and the most variance: one mislabelled point carves out its own island. As k grows, predictions average over more points: smoother, more stable, but eventually blind to local structure. At k = n every query gets the majority class. Choose k by cross-validation over a range such as 1, 3, 5, … 31. For two classes an odd k avoids tied votes. √n is a common starting guess, nothing more.

## The curse of dimensionality

Two effects make kNN fail in high dimensions:

1. **Distances concentrate.** With 1,000 uniformly random points in a unit cube and a random query, the farthest point is typically about 73 times as far away as the nearest in 2 dimensions, 3.8 times in 10, 1.4 times in 100, and 1.1 times in 1,000 (medians over 200 queries). If everyone is about equally far away, the "nearest" neighbours are hardly more similar than random points.
2. **Neighbourhoods stop being local.** To capture 1 % of uniformly spread data you need a sub-cube whose side is 0.01^(1/d) of the full range: 0.63 in 10 dimensions and 0.955 in 100. A "neighbourhood" then spans almost the whole range of every feature.

Real data often lies near a lower-dimensional surface, which is why kNN on good embeddings still works. Reduce dimensions (PCA, learned embeddings) or select features before using kNN on wide data.

## Making prediction fast

Brute force costs O(n·d) per query: a million 100-dimensional points is 10⁸ multiply-adds for every prediction.

- **KD-tree:** recursively split the data along one coordinate at a time (often at the median), giving nested boxes. A query descends to its own box, then checks neighbouring boxes only if they could contain something closer than the best found so far. Build O(n log n); query roughly O(log n) when d is small (a rule of thumb is n ≫ 2ᵈ), degrading towards brute force beyond about 20 dimensions.
- **Ball tree:** nests hyperspheres instead of boxes; copes somewhat better with moderate dimensions and non-Euclidean metrics.
- **Approximate nearest neighbours (ANN):** HNSW graphs, inverted-file indexes with quantisation (FAISS), random-projection forests (Annoy). They return *almost* the true neighbours, with recall around 0.95–0.99 at a fraction of the cost. This is how vector databases search millions of embeddings in milliseconds.

## Implement it in Python

The pseudocode above is a few lines in any language; libraries add the fast indexes (R's FNN and class, Julia's NearestNeighbors.jl, FAISS for C++ and Python). In scikit-learn the default metric is Minkowski with p = 2 (Euclidean), `weights="distance"` turns on 1/distance votes, and ties go to the class that sorts first.

```python
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

blue = [[5.6, 4.4], [3.6, 3.9], [6.6, 3.8], [2, 2], [3.2, 1.5], [7.6, 2.2], [8.2, 4.0]]
red = [[4.0, 5.6], [6.1, 5.9], [5.0, 7.2], [3, 8.2], [6.6, 8.4], [8.2, 7.0]]
X, y = np.array(blue + red), np.array(["blue"] * 7 + ["red"] * 6)
q = np.array([[5.0, 5.0]])

for k in [1, 3, 5, 13]:
    knn = KNeighborsClassifier(n_neighbors=k).fit(X, y)
    print(k, knn.predict(q)[0])                         # blue, red, blue, blue
dist, idx = knn.kneighbors(q, n_neighbors=3)
print(dist.round(2), y[idx])                            # [[0.85 1.17 1.42]] blue red red
w = KNeighborsClassifier(n_neighbors=5, weights="distance").fit(X, y)
print(w.predict_proba(q).round(2))                      # [[0.59 0.41]]: blue

# Real use: scale inside a pipeline and choose k by cross-validation
Xb, yb = load_breast_cancer(return_X_y=True)            # 569 rows, 30 features
Xtr, Xte, ytr, yte = train_test_split(Xb, yb, stratify=yb, random_state=0)
print(KNeighborsClassifier().fit(Xtr, ytr).score(Xte, yte))    # ≈ 0.916 unscaled
pipe = make_pipeline(StandardScaler(), KNeighborsClassifier())
grid = {"kneighborsclassifier__n_neighbors": [1, 3, 5, 7, 11, 15, 21, 31]}
search = GridSearchCV(pipe, grid, cv=5).fit(Xtr, ytr)
print(search.best_params_, search.score(Xte, yte))      # k = 3, ≈ 0.951
```

## Edge cases and pitfalls

- **Forgetting to scale.** The single most common kNN bug. In the breast-cancer data, feature standard deviations range from 0.003 to 569; scaling lifts test accuracy from 0.916 to 0.951 with the same k = 5.
- **Imbalanced classes.** With 95 % negatives, most neighbourhoods are dominated by negatives. Use distance weighting, a smaller k, resampling, or tune the decision threshold on the vote share.
- **Ties.** Even k with two classes can tie, and libraries then break the tie by an arbitrary rule such as label order. Use odd k or distance weights.
- **Categorical features.** Euclidean distance on label-encoded categories invents an order (red = 1, green = 2, blue = 3). One-hot encode, or use a mixed metric such as Gower distance.
- **Memory and latency.** The model *is* the training set. Large n means large memory and slow predictions, the opposite of most models.
- **Duplicates across splits.** If near-identical rows appear in both train and test, 1-NN looks spectacular for the wrong reason.

## When to use it

Good for: small to medium datasets with few, meaningful, scaled features; a quick, assumption-free baseline; problems where "similar items behave similarly" is natural (recommendations, retrieval, anomaly detection by distance to neighbours); and searching embeddings with an ANN index. Poor for: wide raw data (thousands of features), very large n with strict latency limits and no index, and when you need an interpretable global model.

## In the interview

Typical prompts: "How does kNN work and how do you choose k?", "Why do you need to scale?", "What is its complexity?", "What is the curse of dimensionality?". A strong answer explains the bias–variance role of k, says kNN is lazy (O(1) training, O(n·d) prediction), names KD-trees for low dimensions and ANN (HNSW, FAISS) for high, and connects the curse of dimensionality to distance concentration. Expect a follow-up like "How would you serve kNN over 100 million embeddings at 10 ms?" The answer: an approximate index (HNSW or IVF with product quantisation), sharded across machines, accepting slightly imperfect recall.
