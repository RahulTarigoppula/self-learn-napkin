---
title: Hierarchical Clustering
track: ds
tags: [clustering, unsupervised, dendrogram, linkage]
difficulty: 2
minutes: 5
tldr: "Start with every point as its own cluster and keep merging the two closest clusters. The merge history is a tree (dendrogram); cut it at any height to get clusters."
analogy: "A family tree built backwards: siblings join first, then cousins, then whole branches, until everyone is one family. Decide afterwards whether you want 'households' or 'clans' by choosing how far up the tree to cut."
diagram: hierarchical-clustering
story:
  - title: Every point starts as its own cluster
    text: "Five points, A to E, and no labels. Agglomerative (bottom-up) clustering begins with five clusters of one point each. On the right, the empty dendrogram: the points along the bottom, and merge height, meaning how far apart two clusters were when they joined, going up."
  - title: "Merge the closest pair: A + B at 1"
    text: "Compute every pairwise distance and merge the closest pair. A (1, 1) and B (2, 1) are 1 apart, the smallest distance of all, so they become one cluster. The dendrogram records the merge with a link at height 1."
  - title: "Next closest: D + E at 1.41"
    text: "Now there are four clusters. The closest pair is D (6, 4) and E (7, 5), √2 ≈ 1.41 apart, so they merge at height 1.41. Each merge reduces the number of clusters by one, so five points need exactly four merges."
  - title: "Linkage: how far apart are two clusters?"
    text: "C must now be compared with the cluster {A, B}, which has two points. The linkage rule decides: single linkage uses the closest pair (C–A = 2.00), complete the farthest (C–B = 2.24), average the mean (2.12). With single linkage C joins {A, B} at height 2."
  - title: "Last merge: everything at 5"
    text: "Two clusters remain. Their closest pair is B and D, 5.0 apart, so the final single-linkage merge happens at height 5. Building the tree needs all pairwise distances: n(n − 1)/2 distances, about 40 GB for 100,000 points, which is the method's main limit."
  - title: Cut the tree to get clusters
    text: "Draw a horizontal line across the dendrogram. Every vertical branch it crosses is one cluster. Cutting at height 3 crosses two branches: {A, B, C} and {D, E}. A long stretch of height with no merges, here from 2 to 5, signals natural clusters: any cut in that gap gives the same answer."
keyIdeas:
  - "**Agglomerative**: start with n singletons, repeatedly merge the two closest clusters, n − 1 merges in total. The merge history is the **dendrogram**."
  - "**Linkage** defines cluster distance: **single** (closest pair, follows chains), **complete** (farthest pair, compact), **average** (mean of all pairs), **Ward** (smallest increase in within-cluster variance)."
  - "**Read heights, not left-to-right order**: the height of the link joining two leaves is their dissimilarity in the tree. Branches can be flipped freely."
  - "**Cut** at a height, or ask for k clusters. One tree gives every k at once, and you do not need to choose k up front."
  - "Needs the **O(n²) distance matrix** and O(n²)–O(n³) time: great for thousands of points, impractical for millions."
quiz:
  - q: "Cluster {A, B} has points at distances 2 and 6 from point C. What is the cluster-to-C distance under single, complete and average linkage?"
    options: ["6, 2, 4", "2, 6, 4", "4, 4, 4", "2, 4, 6"]
    answer: 1
    why: "Single uses the closest pair (2), complete the farthest pair (6), and average the mean over all pairs, (2 + 6) / 2 = 4."
  - q: "Which linkage is most likely to merge two separate blobs joined by a thin line of noise points?"
    options: ["Single linkage", "Complete linkage", "Ward linkage", "They all behave the same"]
    answer: 0
    why: "Single linkage only needs one close pair to merge two clusters, so a chain of points acts as a bridge. This chaining is also what lets it trace long, curved clusters."
  - q: "Seven points produce merges at heights 0.5, 0.7, 0.9, 1.1, 6.0 and 6.4. How many clusters does the data most naturally have?"
    options: ["2", "6", "1", "3"]
    answer: 3
    why: "The first four merges happen at small heights (≤ 1.1), then the next one jumps to 6.0. A cut anywhere in that gap undoes the last two merges and leaves 7 − 4 = 3 clusters."
  - q: "Two leaves sit right next to each other at the bottom of a dendrogram, but the link joining them is at the very top. What does that tell you?"
    options: ["They are near-duplicates, since adjacent leaves are the most similar", "They are very dissimilar; leaf order along the axis means little", "The dendrogram is drawn wrongly, because neighbours must join low", "They must be outliers, since they sit far from every cluster"]
    answer: 1
    why: "Only the height of the joining link measures dissimilarity. Any branch can be flipped left-to-right without changing the tree, so neighbouring leaves can belong to the two biggest, most different clusters."
bigO:
  - { op: "distance matrix memory", avg: "O(n²)", note: "n(n − 1)/2 pairs: 5 × 10⁹ for 100,000 points ≈ 40 GB in float64" }
  - { op: "naive algorithm time", avg: "O(n³)", note: "n − 1 merges, each scanning the matrix" }
  - { op: "with a priority queue", avg: "O(n² log n)" }
  - { op: "single linkage (SLINK / MST)", avg: "O(n²)", note: "equivalent to a minimum spanning tree" }
bigOTitle: "Key numbers"
related: [ds/k-means, ds/supervised-vs-unsupervised, ds/feature-scaling, ds/pca]
prereqs: []
flashcards:
  - kind: qa
    q: "How do you get flat clusters from a dendrogram?"
    a: "Cut it with a horizontal line at some height (or choose the number of clusters k). Each branch the line crosses becomes one cluster. Cut in a large gap between merge heights for the most natural split."
  - kind: cloze
    text: "Single linkage measures cluster distance by the {{closest pair}} of points and tends to {{chain}}; complete linkage uses the {{farthest pair}} and gives compact clusters."
  - kind: qa
    q: "Why is hierarchical clustering rarely used on millions of points?"
    a: "Standard agglomerative clustering needs all pairwise distances, O(n²) memory (about 40 GB for 100,000 points in float64), and O(n²) to O(n³) time."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Unsupervised learning: hierarchical clustering" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Hierarchical clustering builds a whole **tree of clusterings** instead of a single partition. The common, **agglomerative** (bottom-up) version works like this:

1. **Start** with n clusters, one point each.
2. **Compute the distance matrix**: the distance between every pair of clusters (at first, every pair of points). Euclidean distance on scaled features is the default, but any dissimilarity works, such as cosine distance for text or 1 − correlation for gene profiles.
3. **Merge** the two clusters with the smallest distance. Record the pair and the distance, called the **merge height**.
4. **Update** the distances from the new cluster to every other cluster using the **linkage** rule.
5. **Repeat** until one cluster remains. That takes exactly n − 1 merges.

The record of merges is drawn as a **dendrogram**: leaves at the bottom, and each merge drawn as a link at its height. The less common **divisive** (top-down) version starts with one cluster and keeps splitting; it is more expensive and mostly used when only the top few splits matter.

Unlike k-means, nothing is random and you do not choose k before running it. You get every k from n down to 1 in one run, and pick afterwards.

## Linkage: the distance between clusters

Once a cluster holds several points, "distance to another cluster" needs a definition. That choice, the **linkage**, changes the shapes the method can find.

| Linkage | Cluster distance | Tends to produce | Weak spot |
|---|---|---|---|
| **Single** | closest pair of points | long, chained, arbitrary-shaped clusters | noise points bridge separate clusters ("chaining") |
| **Complete** | farthest pair of points | compact clusters of similar diameter | sensitive to outliers; breaks up large elongated clusters |
| **Average** (UPGMA) | mean of all cross-cluster pairs | a compromise between single and complete | still assumes roughly blob-like clusters |
| **Ward** | merge that adds the least within-cluster sum of squares | round, similar-sized clusters, much like k-means | needs Euclidean distances |

Ward's linkage uses the same objective as k-means, the within-cluster sum of squares, applied greedily one merge at a time. That is why its clusters look like k-means clusters, and why many libraries make it the default.

On two interleaved half-moons (300 points), only single linkage follows the curved shapes. Adjusted Rand index against the true moons: single **1.00**, average 0.43, complete 0.30, Ward 0.24. On noisy blobs connected by stray points, the ranking flips and single linkage chains everything together.

## Worked example

Points: A (1, 1), B (2, 1), C (1, 3), D (6, 4), E (7, 5). Pairwise Euclidean distances:

| | A | B | C | D | E |
|---|---|---|---|---|---|
| **A** | 0 | 1.00 | 2.00 | 5.83 | 7.21 |
| **B** | | 0 | 2.24 | 5.00 | 6.40 |
| **C** | | | 0 | 5.10 | 6.32 |
| **D** | | | | 0 | 1.41 |

**Single-linkage trace:**

1. Smallest entry: A–B = 1.00. Merge {A, B} at height **1**.
2. New distances use the minimum: {A, B}–C = min(2.00, 2.24) = 2.00; {A, B}–D = min(5.83, 5.00) = 5.00; {A, B}–E = 6.40. The smallest remaining entry is D–E = 1.41. Merge {D, E} at height **1.41**.
3. Remaining: {A, B}–C = 2.00, {A, B}–{D, E} = 5.00, C–{D, E} = min(5.10, 6.32) = 5.10. Merge {A, B, C} at height **2**.
4. Last: {A, B, C}–{D, E} = min over all six cross pairs = B–D = 5.00. Merge everything at height **5**.

Other linkages build the same tree here (the two groups are well separated), but at different heights:

| Linkage | Merge heights |
|---|---|
| single | 1, 1.41, 2.00, 5.00 |
| average | 1, 1.41, 2.12, 5.98 |
| complete | 1, 1.41, 2.24, 7.21 |
| Ward (height = √(2 × added sum of squares), SciPy's convention) | 1, 1.41, 2.38, 9.13 |

Cutting the single-linkage tree anywhere between heights 2 and 5 gives {A, B, C} and {D, E}.

## Reading and cutting a dendrogram

- **Height is everything.** The height of the link that first joins two leaves is their distance as the tree sees it, called the **cophenetic distance**. Here it is 5 for A and E, although their true distance is 7.21: single linkage records the bridge B–D, not the far corners. The cophenetic correlation, the correlation between true and tree distances, measures how faithful the tree is (0.96 for this example).
- **Left-to-right order is mostly arbitrary.** Every link can be flipped like a mobile. Two leaves drawn side by side may be very different.
- **Cut by height**: choose a dissimilarity threshold t; clusters are the branches crossing the line at t. **Cut by count**: choose k and cut between the (k − 1)-th and k-th highest merges, undoing the top k − 1 merges.
- **Look for big gaps.** A long vertical stretch without merges means the clusters below it are well separated. Here nothing happens between 2 and 5, so 2 clusters is the natural answer.

## Implement it in Python

Any language with a linear-algebra or statistics library offers this; here it is in Python with SciPy (which builds and cuts the tree) and scikit-learn.

```python
import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster, cophenet
from scipy.spatial.distance import pdist
from sklearn.cluster import AgglomerativeClustering
from sklearn.datasets import make_moons
from sklearn.metrics import adjusted_rand_score

X = np.array([[1, 1], [2, 1], [1, 3], [6, 4], [7, 5]], dtype=float)   # A, B, C, D, E
D = pdist(X)                                  # the n(n-1)/2 = 10 pairwise distances

for method in ["single", "complete", "average", "ward"]:
    Z = linkage(X, method=method)             # each row: [cluster i, cluster j, height, size]
    print(method, Z[:, 2].round(2))           # single: [1. 1.41 2. 5.]
Z = linkage(X, method="single")
print(fcluster(Z, t=3, criterion="distance"))  # cut at height 3 → [2 2 2 1 1]
print(fcluster(Z, t=2, criterion="maxclust"))  # or ask for 2 clusters directly
print(round(cophenet(Z, D)[0], 3))            # 0.963: how faithfully the tree keeps distances

# Linkage changes the shapes it can find: two interleaved half-moons
Xm, ym = make_moons(n_samples=300, noise=0.05, random_state=0)
for link in ["single", "complete", "average", "ward"]:
    pred = AgglomerativeClustering(n_clusters=2, linkage=link).fit_predict(Xm)
    print(link, round(adjusted_rand_score(ym, pred), 2))   # 1.0, 0.3, 0.43, 0.24
```

`scipy.cluster.hierarchy.dendrogram(Z)` draws the tree with matplotlib. In scikit-learn, `AgglomerativeClustering` defaults to Ward linkage and accepts a `connectivity=` graph to restrict merges to nearest neighbours on large data.

## Edge cases and pitfalls

- **Memory.** The condensed distance matrix holds n(n − 1)/2 numbers: 5 × 10⁹ for 100,000 points, about 40 GB as float64. Beyond tens of thousands of points, cluster a sample, use k-means or mini-batch k-means first and build the tree on the centroids, or supply a connectivity graph that only allows merges between nearest neighbours.
- **Time.** The naive algorithm is O(n³). Priority-queue implementations reach O(n² log n), and single linkage runs in O(n²) because it is equivalent to building a minimum spanning tree and cutting its longest edges (SLINK).
- **Merges are final.** A greedy early merge is never undone, even if it looks wrong later. k-means can move points between clusters; hierarchical clustering cannot.
- **Scale features first**, exactly as for k-means or kNN. Distances drive every merge.
- **Ties** in the distance matrix make the tree depend on processing order; the flat clusters usually do not change much.
- **Ward and centroid linkage assume Euclidean distance.** Centroid and median linkage can also produce inversions, where a merge sits lower than an earlier one, which makes the dendrogram hard to read.

## When to use it

Use it when the **hierarchy itself is interesting** (taxonomies, gene-expression heatmaps, document or product families), when you **do not know k** and want to see all options at once, when you need a **custom distance** (any dissimilarity matrix works), or when you need **deterministic** results. Use single linkage for elongated or curved clusters and Ward for compact ones. For very large n, prefer k-means, mini-batch k-means or DBSCAN.

## In the interview

Typical prompts: "Explain agglomerative clustering", "What is linkage and how does it change results?", "How do you choose the number of clusters from a dendrogram?", "Hierarchical clustering or k-means?". A strong answer walks through the merge loop, contrasts single (chaining) with complete and Ward (compact), says to cut at a large gap in merge heights, and mentions the O(n²) memory wall. A common follow-up: "Why is single linkage related to minimum spanning trees?" Each single-linkage merge adds the shortest edge between two components, which is exactly Kruskal's algorithm, so cutting the k − 1 longest MST edges gives the single-linkage k clusters.
