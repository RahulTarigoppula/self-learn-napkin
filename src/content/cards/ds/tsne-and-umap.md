---
title: t-SNE & UMAP
track: ds
tags: [unsupervised, visualisation, dimensionality-reduction, embeddings]
difficulty: 2
minutes: 5
tldr: "t-SNE and UMAP squash high-dimensional data into a 2-D picture that keeps each point's neighbours close. They keep neighbourhoods, not distances — cluster sizes and gaps in the plot mean little."
analogy: "A seating plan for a wedding. Everyone ends up next to the people they know best, so tables look like tidy groups — but how far apart two tables stand, or how big a table is, tells you nothing about how the families relate."
diagram: tsne-and-umap
story:
  - title: Three groups in 10-D
    text: "Take 300 points in 10 dimensions forming three groups. Along the first axis they sit at 0, 40 and 240, so the gaps are 40 and 200, and group B is five times wider than A and C. We want a 2-D picture, but no flat map can keep every 10-D distance, so something has to give."
  - title: Distances become neighbour probabilities
    text: "t-SNE first asks, for each point i, who its neighbours are. It centres a Gaussian on i: with width σ = 1, neighbours at distance 1, 2, 3 and 10 get probabilities 0.81, 0.18, 0.02 and ≈ 0. Every point gets its own σ, tuned so its perplexity — roughly the effective number of neighbours, here 30 — is the same."
  - title: Lay out in 2-D with heavy tails
    text: "Then it scatters the points in 2-D and moves them until the 2-D neighbour probabilities match the 10-D ones. In 2-D, similarity uses a Student-t curve with a much fatter tail: at distance 3 it gives 0.10 where the Gaussian gives 0.011. Moderately distant points can drift far apart cheaply, which carves clean gaps between groups."
  - title: "The map: same sizes, same gaps"
    text: "One run gives three tidy blobs of the same size, with gaps of 35 and 36. B's extra width is gone because σ adapts to local density, and the 40-to-200 ratio is gone because only neighbourhoods were matched. Read who sits next to whom; do not read blob sizes or the distances between blobs."
  - title: PCA and UMAP for comparison
    text: "PCA, a linear projection, keeps the 40 : 200 gaps and shows B as the widest group, but it can smear neighbours together when the structure is curved. UMAP builds a 15-nearest-neighbour graph and lays it out with a similar pull–push; it is usually much faster, keeps somewhat more global layout, and can place new points."
keyIdeas:
  - "t-SNE and UMAP preserve **neighbourhoods, not distances**: points close in the plot were probably close in the data; the reverse readings (far apart = very different, big blob = spread out) are unreliable."
  - "**Perplexity** (t-SNE, typically 5–50) and **n_neighbors** (UMAP, default 15) set how local the view is. Try several values and seeds before trusting a shape."
  - "A blob in a t-SNE plot is **not evidence of a cluster**. Cluster in the original (or PCA) space and validate there."
  - "**UMAP** is faster, scales to millions of points and has `transform()` for new data; scikit-learn's t-SNE has no transform."
  - "Start with **PCA**: linear, deterministic and distance-faithful; reduce to ~50 dimensions with it before running t-SNE."
quiz:
  - q: "In a t-SNE plot, cluster X covers three times the area of cluster Y. What can you conclude?"
    options: ["X is three times more spread out in the original space", "X has three times as many points", "Nothing reliable about their original spread", "X is the noisier class"]
    answer: 2
    why: "Each point's σ adapts to its local density, so dense and sparse groups are stretched to similar sizes. In the story, a group five times wider came out the same size as the others."
  - q: "What does t-SNE's perplexity parameter control?"
    options: ["The number of output dimensions", "Roughly how many neighbours each point pays attention to", "The learning rate of gradient descent", "The number of clusters to find"]
    answer: 1
    why: "Perplexity = 2^H of a point's neighbour distribution, where H is its entropy in bits. Each point's Gaussian width σ is tuned by binary search until it hits the target, so perplexity 30 means about 30 effective neighbours."
  - q: "Every night you must place thousands of new points onto an existing 2-D map without moving the old ones. Which tool fits?"
    options: ["scikit-learn TSNE, calling transform() on the new points", "Re-run t-SNE on the new points alone", "UMAP's transform(), or PCA", "Any of them; all embeddings are deterministic"]
    answer: 2
    why: "Fitted UMAP and PCA models can map unseen points into the existing layout. scikit-learn's TSNE only offers fit_transform, and a separate run on new points would produce an unrelated coordinate system."
  - q: "A colleague runs k-means on 2-D t-SNE coordinates and reports 8 customer segments. What is the main problem?"
    options: ["k-means needs at least 3 dimensions", "t-SNE can create and resize apparent clusters, so the segments may be artefacts", "t-SNE coordinates are always negative", "Nothing; t-SNE is designed for clustering"]
    answer: 1
    why: "t-SNE distorts density and between-cluster distances, and a low perplexity can split noise into clumps. Clustering should happen on the original or PCA features and be checked with stability and validation metrics."
related: [ds/pca, ds/k-means, ds/embeddings, ds/supervised-vs-unsupervised]
prereqs: [ds/pca]
flashcards:
  - kind: qa
    q: "Why does t-SNE use a Student-t distribution in 2-D but a Gaussian in the original space?"
    a: "The heavy tail fixes the crowding problem: 2-D has too little room for all moderately distant neighbours, and the fat tail lets them sit farther apart at low cost, which separates clusters."
  - kind: cloze
    text: "t-SNE and UMAP preserve {{local neighbourhoods}}, not {{global distances}}."
  - kind: qa
    q: "Name three things you should not read from a t-SNE plot."
    a: "Cluster sizes, distances between clusters, and the axes (they have no meaning and change between runs). Even the existence of clusters needs confirming in the original space."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why not just PCA?

**PCA** (principal component analysis) projects the data onto the few straight directions with the most variance. It is linear, fast, deterministic, and it keeps large distances: two groups far apart in the data stay far apart in the plot. Its weakness is curved structure. Data lying on a rolled-up sheet or a ring gets flattened by a straight projection, and points from different parts of the curve land on top of each other.

**Non-linear embeddings** such as t-SNE (t-distributed stochastic neighbour embedding) and UMAP (uniform manifold approximation and projection) give up on keeping all distances and keep only the thing that matters most for a picture: **who is next to whom**. That makes them excellent for *looking* at data — images, word or customer embeddings, single-cell gene expression — and risky for *measuring* anything.

## How t-SNE works

1. **Neighbour probabilities in the original space.** For each point i, turn distances into a probability distribution over the other points with a Gaussian of width σᵢ:
   p(j|i) = exp(−‖xᵢ − xⱼ‖² / 2σᵢ²) / Σₖ≠ᵢ exp(−‖xᵢ − xₖ‖² / 2σᵢ²).
   Near points get most of the probability; far points get essentially none.
2. **Pick each σᵢ from the perplexity.** Perplexity is 2^H, where H = −Σⱼ p(j|i) log₂ p(j|i) is the entropy of point i's distribution in bits. A binary search finds the σᵢ that makes the perplexity equal to your setting (say 30). In dense regions σᵢ comes out small, in sparse regions large — so every point "sees" about 30 neighbours whatever the local density.
3. **Symmetrise:** pᵢⱼ = (p(j|i) + p(i|j)) / 2n, so the pairs sum to 1.
4. **Similarities in 2-D with a heavy tail:** qᵢⱼ ∝ 1 / (1 + ‖yᵢ − yⱼ‖²), a Student-t with one degree of freedom, normalised over all pairs.
5. **Move the 2-D points** yᵢ by gradient descent to minimise the KL divergence KL(P‖Q) = Σ pᵢⱼ log(pᵢⱼ / qᵢⱼ).

The KL divergence is lopsided. If two points are true neighbours (large pᵢⱼ) but far apart in 2-D (small qᵢⱼ), the cost is large, so neighbours are kept together. If they are not neighbours (tiny pᵢⱼ), it hardly matters where they go. That is why local structure is preserved and global structure is not.

**The crowding problem** explains step 4. In 10 dimensions a point can have many neighbours all at roughly the same moderate distance; in 2 dimensions there is not enough room to place them all at that distance. The Student-t tail decays like 1/d² instead of exp(−d²/2), so moderately distant points can be pushed much farther out at almost no cost. This opens clean gaps between groups — and it is also why gap widths carry no reliable meaning.

## Worked example: from distances to perplexity

Point i has four neighbours at distances 1, 2, 3 and 10. Compute the Gaussian weights, normalise, then the entropy:

| σ | weights exp(−d²/2σ²) | probabilities | entropy H (bits) | perplexity 2^H |
|---|---|---|---|---|
| 1.0 | 0.607, 0.135, 0.011, 0.000 | 0.81, 0.18, 0.015, 0.00 | 0.79 | 1.72 |
| 1.5 | 0.801, 0.411, 0.135, 0.000 | 0.59, 0.31, 0.10, 0.00 | 1.30 | 2.47 |
| 2.0 | 0.883, 0.607, 0.325, 0.000 | 0.49, 0.33, 0.18, 0.00 | 1.48 | 2.79 |

Widening σ spreads the probability more evenly, so the effective number of neighbours rises towards 3 — the far point at distance 10 never counts. With real data and perplexity 30, the search runs over thousands of neighbours, but the logic is identical.

The story's numbers come from a real run: groups with 10-D spreads of 3.1, 16.1 and 3.1 and centre gaps of 40 and 200 became 2-D blobs with spreads 3.2, 3.1 and 3.1 and gaps of 35 and 36 (scikit-learn, perplexity 30, seed 0). PCA on the same data kept the gaps at 40 and 200.

## UMAP in one paragraph

UMAP builds a weighted graph linking each point to its **n_neighbors** nearest neighbours (default 15). Edge weights are exp(−(d − ρᵢ) / σᵢ), where ρᵢ is the distance to i's closest neighbour and σᵢ is tuned per point — the same density-adapting idea as t-SNE's σᵢ. It then lays the graph out in 2-D by stochastic gradient descent on a cross-entropy loss: edges pull their ends together, randomly sampled non-edges push apart. **min_dist** (default 0.1) sets how tightly points may pack. It uses approximate nearest-neighbour search and negative sampling, so it is typically several times faster than t-SNE and scales to millions of points; it starts from a spectral layout of the graph, which is a large part of why it tends to keep more of the global arrangement. Its gaps and blob sizes are still not to be trusted.

## In code

```python
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE, trustworthiness

X, y = load_digits(return_X_y=True)               # 1,797 images of 8x8 pixels = 64 features
X = StandardScaler().fit_transform(X)

X50 = PCA(n_components=50, random_state=0).fit_transform(X)   # denoise + speed up first
emb = {
    "PCA": PCA(n_components=2).fit_transform(X),
    "t-SNE": TSNE(n_components=2, perplexity=30, init="pca", random_state=0).fit_transform(X50),
}
try:
    import umap                                   # pip install umap-learn
    emb["UMAP"] = umap.UMAP(n_neighbors=15, min_dist=0.1, random_state=0).fit_transform(X)
except ImportError:
    pass

for name, Z in emb.items():
    # penalises points that look like neighbours in 2-D but were not in 64-D (1.0 = none)
    print(f"{name:6s} trustworthiness {trustworthiness(X, Z, n_neighbors=10):.3f}")
```

Output: PCA 0.816, t-SNE 0.987, UMAP 0.976. Two linear directions cannot keep the digits' neighbourhoods; both non-linear methods nearly can. Plot `emb["t-SNE"]` coloured by `y` and the ten digits appear as mostly separate islands.

## Edge cases and pitfalls

- **Sizes, gaps and density are not data.** A tight blob and a loose blob may have had the same spread, and two blobs far apart may be close in the original space.
- **Perplexity changes the picture.** Too low (2–5) and t-SNE breaks even pure random noise into little clumps; too high and real groups merge. Perplexity must be smaller than the number of points. Show several settings before drawing conclusions.
- **Runs differ.** Different seeds give rotated, reflected or rearranged maps. The axes have no units and no meaning.
- **Not clustering evidence.** Finding clusters in the 2-D picture and then "confirming" them on the same picture is circular. Cluster on the original or PCA features and validate with stability checks or held-out data.
- **Careful as model features.** scikit-learn's TSNE has no `transform`, so test data cannot be embedded consistently. UMAP can, but if you fit it on all data before splitting you leak test information; fit it inside the training pipeline only, and expect a plain PCA or the raw features to be a strong baseline.
- **Preprocess.** Scale features, choose a sensible distance (cosine for text embeddings), and reduce to ~50 dimensions with PCA first for speed and noise removal.

## When to use which

| | PCA | t-SNE | UMAP |
|---|---|---|---|
| Keeps | global variance and large distances | local neighbourhoods | local neighbourhoods, some global layout |
| Speed | very fast | slowest; Barnes–Hut O(n log n) | fast, millions of points |
| New points | `transform` | no (scikit-learn) | `transform` |
| Deterministic | yes | no | no (unless seeded) |
| Good for | first look, preprocessing, features | publication-quality cluster pictures | large datasets, interactive exploration |

## In the interview

Typical prompts: "how would you visualise 512-dimensional embeddings?" or "what can you read from this t-SNE plot?". A strong answer starts with PCA as the baseline, explains that t-SNE and UMAP match neighbour probabilities so only local structure is trustworthy, names perplexity / n_neighbors as the locality knob, and warns against reading cluster sizes, gaps or using the plot as clustering proof. Expect the follow-up "why the Student-t?" — answer with the crowding problem.
