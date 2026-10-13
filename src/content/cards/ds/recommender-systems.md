---
title: Recommender Systems
track: ds
tags: [recommenders, embeddings, ml-systems]
difficulty: 2
minutes: 6
tldr: "Predict what a user will like from similar users (collaborative filtering) or from item features (content-based). At scale: learn user and item vectors, retrieve fast, then rank."
analogy: "A good bookseller. They remember that customers who loved your favourite novels also loved a book you have not read (collaborative), and they know which new arrivals match the genres you buy (content-based)."
diagram: recommender-systems
story:
  - title: The user-item matrix is mostly empty
    text: "Put users in rows, items in columns and ratings in the cells. Ann rated Alien 4, Up 1 and Coco 1, but never saw Heat. Real matrices are far emptier than this one: in the Netflix Prize data only about 1 % of the cells were filled. Recommending means predicting the missing cells."
  - title: "Collaborative filtering: find similar users"
    text: "Ann's row matches Bob's on every film they both rated, so their tastes look alike — and Bob gave Heat a 4. User-based collaborative filtering predicts Ann's rating from similar users' ratings, weighted by similarity. Nothing about the films themselves is needed, only who liked what."
  - title: "Matrix factorisation: a vector per user and item"
    text: "Better: give every user and every item a short vector, learned so that their dot product reproduces the known ratings. Suppose training produced these two-number vectors. Their dimensions are hidden factors that we may read afterwards as action and family taste, though nobody labelled them."
  - title: Fill the gap with a dot product
    text: "Now any empty cell is one dot product: Ann · Heat = 2.0·2.3 + 0.3·0.3 = 4.69, so Heat is a strong recommendation for Ann. The same vectors give Ann · Coco = 2.0·0.3 + 0.3·2.3 = 1.29, which matches the 1 she gave it."
  - title: "At scale: retrieve, then rank"
    text: "You cannot score 10 million items for every visit with a heavy model. Stage one, retrieval, uses cheap signals — a nearest-neighbour search over item vectors, popular items, co-purchases — to fetch a few hundred candidates in milliseconds. Stage two, ranking, scores just those with a richer model and shows the best ten."
  - title: "Measure: offline, then an A/B test"
    text: "Offline, hide some of each user's later interactions and check how many land in your top k: precision@10 is the share of the 10 shown items the user actually engaged with. Offline wins do not always survive contact with users, so the final judge is an A/B test on the real goal."
keyIdeas:
  - "**Collaborative filtering** uses only the interaction matrix: similar users like similar items. **Content-based** uses item (and user) features."
  - "**Matrix factorisation:** learn user vectors U and item vectors V so that rating ≈ uᵤ · vᵢ (often plus biases); trained by SGD or alternating least squares."
  - "**Cold start:** new users and items have no interactions. Fall back on content features, popularity or onboarding questions."
  - "**Implicit feedback** (clicks, plays, purchases) is plentiful but has no explicit negatives; sample negatives and weight by confidence."
  - "**Two stages:** fast retrieval narrows millions to hundreds; a precise ranker orders them. Evaluate with precision@k / recall@k offline and an A/B test online."
quiz:
  - q: "Ann's taste vector is (2.0, 0.3) and the item vector is (0.3, 2.3). What rating does matrix factorisation predict?"
    options: ["4.69", "1.29", "2.30", "0.69"]
    answer: 1
    why: "Dot product: 2.0·0.3 + 0.3·2.3 = 0.6 + 0.69 = 1.29. Ann's vector points towards the first factor, this item's towards the second, so the prediction is low."
  - q: "A brand-new film has no ratings yet. Which approach can still recommend it?"
    options: ["User-based collaborative filtering", "Matrix factorisation on the ratings alone", "Content-based recommendation from its genre, cast and description", "None"]
    answer: 2
    why: "Collaborative methods need interactions to place the item; with none, it is the item cold-start problem. Content features let you score or embed the film immediately."
  - q: "Your top 10 recommendations contain 3 items the user later bought. The user bought 6 items in total. What are precision@10 and recall@10?"
    options: ["0.3 and 0.5", "0.5 and 0.3", "0.3 and 0.3", "0.6 and 0.5"]
    answer: 0
    why: "Precision@10 = hits / 10 = 3 / 10 = 0.3. Recall@10 = hits / all relevant = 3 / 6 = 0.5."
  - q: "Why do large recommenders use a retrieval stage before ranking?"
    options: ["Ranking models cannot use features", "Scoring every item with an expensive model per request is far too slow, so a cheap stage narrows millions of items to hundreds first", "Retrieval improves the A/B test", "To avoid storing embeddings"]
    answer: 1
    why: "Latency budgets are tens of milliseconds. Approximate nearest-neighbour search over embeddings and other cheap sources fetch candidates; the heavy ranker only has to score a few hundred."
bigO:
  - { op: "predict one rating (MF)", avg: "O(k)", note: "a dot product of two k-dimensional vectors" }
  - { op: "score all items for a user", avg: "O(N · k)", note: "why retrieval uses ANN indexes instead" }
  - { op: "MF parameters", avg: "(users + items) · k", note: "vs users × items cells in the matrix" }
  - { op: "Netflix Prize density", avg: "≈ 1.2 %", note: "100 M ratings / (480,189 users × 17,770 films)" }
bigOTitle: "Key numbers"
related: [ds/embeddings, ds/k-nearest-neighbours, ds/ab-testing, ds/precision-recall-roc]
prereqs: [ds/embeddings]
flashcards:
  - kind: qa
    q: "What is the cold-start problem and how do you handle it?"
    a: "New users or items have no interaction history, so collaborative methods cannot place them. Use content features (item metadata, user sign-up info), popularity or trending items, and exploration to collect first interactions quickly."
  - kind: cloze
    text: "Matrix factorisation predicts a rating as the {{dot product}} of a learned {{user vector}} and item vector."
  - kind: qa
    q: "Why is implicit feedback harder to learn from than explicit ratings?"
    a: "A click or play shows interest, but a missing interaction is ambiguous — the user may dislike the item or never have seen it. There are no true negatives, so models sample negatives and weight observations by confidence."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Unsupervised learning and machine learning tips: similarity, evaluation metrics" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

A catalogue has far more items than anyone can browse — millions of products, videos or songs. A **recommender system** predicts which items a particular user is most likely to want and shows those. The raw material is the **user–item interaction matrix**: rows are users, columns items, cells hold a rating or an interaction. It is overwhelmingly empty (the Netflix Prize data filled about 1.2 % of its 480,189 × 17,770 cells), and the task is to predict the empty cells that matter — the ones we would put in front of the user.

## Collaborative filtering

**Collaborative filtering (CF)** uses only the interaction matrix. Its assumption: users who agreed in the past will agree in the future.

- **User-based CF:** find users similar to the target user and average their ratings for the item, weighted by similarity.
- **Item-based CF:** find items similar to the ones the user liked ("people who bought this also bought…"). Item similarities change slowly and can be precomputed, which is why Amazon popularised this variant.

Similarity is usually cosine or Pearson correlation over the items both users rated. **Centre the ratings first** (subtract each user's mean): raw cosine between Ann (4, 1, 1) and Cat (1, 4, 5) is 0.47 — falsely positive, because ratings are all positive numbers — while the centred version is −0.97, correctly showing opposite tastes.

Neighbourhood CF is simple and explainable, but it struggles when users share few rated items, and comparing every pair of users is expensive.

## Matrix factorisation

**Matrix factorisation (MF)** assumes tastes are driven by a few hidden **factors**. Each user u gets a vector pᵤ and each item i a vector qᵢ, both of length k (typically 32–256), and

> predicted rating r̂ᵤᵢ = μ + bᵤ + bᵢ + pᵤ · qᵢ

where μ is the global average, bᵤ a user bias (some people rate everything high) and bᵢ an item bias (some films are just popular). Training minimises the squared error on the **observed cells only**, plus an L2 penalty to prevent overfitting:

> Σ over known (u, i) of (rᵤᵢ − r̂ᵤᵢ)² + λ(‖pᵤ‖² + ‖qᵢ‖² + bᵤ² + bᵢ²)

using SGD or **alternating least squares (ALS)** — fix the item vectors and solve every user vector by least squares, then swap. The model has (users + items)·k parameters instead of one per cell, which forces it to find shared structure. Matrix factorisation was central to the leading Netflix Prize entries (2006–2009), and the user and item vectors are **embeddings**: similar items end up with similar vectors.

## Worked example

Ratings (blank = unknown):

| | Alien | Heat | Up | Coco |
|---|---|---|---|---|
| Ann | 4 | **?** | 1 | 1 |
| Bob | 4 | 4 | 1 | 1 |
| Cat | 1 | 2 | 4 | 5 |
| Dan | 1 | 1 | 5 | **?** |

Suppose training produced k = 2 vectors: Ann (2.0, 0.3), Bob (1.9, 0.4), Cat (0.4, 2.0), Dan (0.3, 2.1); Alien (2.2, 0.2), Heat (2.3, 0.3), Up (0.2, 2.2), Coco (0.3, 2.3). Every observed rating is reproduced within 0.5 (for example Ann · Alien = 4.46 against 4, Cat · Coco = 4.72 against 5), and the gaps fill in:

- Ann · Heat = 2.0·2.3 + 0.3·0.3 = **4.69** — recommend.
- Dan · Coco = 0.3·0.3 + 2.1·2.3 = **4.92** — recommend.

## Content-based and hybrid

**Content-based** recommenders use features of the items (genre, text, image, price) and build a profile of each user from the features of what they engaged with. They handle new items immediately and explain themselves ("because you watched sci-fi"), but tend to recommend more of the same. Production systems are **hybrids**: a ranking model takes collaborative signals (embeddings, co-engagement counts) and content features together.

## Cold start and implicit feedback

- **Cold start:** a new user or item has no interactions, so CF cannot place it. Remedies: content features, a "two-tower" model whose item tower embeds the item from its features, popularity within a segment, onboarding questions, and deliberate exploration.
- **Implicit feedback:** most real data are clicks, plays, purchases and dwell time rather than star ratings. They are plentiful but one-sided: a missing interaction may mean "dislike" or "never saw it". Common practice is to treat interactions as positives, **sample negatives** from the rest, and weight positives by **confidence** (a song played 50 times says more than one play). Beware **position bias**: items shown at the top get clicked partly because they were at the top.

## Two-stage architecture

1. **Retrieval (candidate generation):** from millions of items to a few hundred in a few milliseconds. Sources: approximate nearest-neighbour search over item embeddings using the user's embedding, item-to-item co-occurrence, trending items, follows. Each source is cheap and high-recall.
2. **Ranking:** a heavier model (gradient-boosted trees or a deep network) scores each candidate with rich features — user history, item features, context such as time and device — predicting the probability of a click, watch or purchase.
3. **Re-ranking / business rules:** diversity, freshness, removing items already bought, fairness constraints.

## Evaluation

- **Offline:** split interactions **by time** (train on the past, test on the future — random splits leak the future). Measure **precision@k** (share of the top k that are relevant), **recall@k** (share of the relevant items that reach the top k), and ranking metrics such as **NDCG**, which rewards putting hits near the top. RMSE on ratings was the Netflix Prize metric, but ranking metrics better reflect what users see.
- **Online:** an **A/B test** on the business goal — watch time, purchases, retention. Offline metrics are biased by what the old system chose to show, so offline gains often shrink or vanish online.

## In code

```python
import numpy as np

R = np.array([[4, 0, 1, 1],                  # rows: Ann, Bob, Cat, Dan
              [4, 4, 1, 1],                  # cols: Alien, Heat, Up, Coco
              [1, 2, 4, 5],                  # 0 = not rated
              [1, 1, 5, 0]], dtype=float)
rated = R > 0

def centered_cosine(a, b):
    """Pearson-style similarity: subtract each user's mean before the cosine."""
    a, b = a - a.mean(), b - b.mean()
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

both = rated[0] & rated[2]                   # items Ann and Cat both rated
print(round(centered_cosine(R[0, both], R[2, both]), 2))     # -0.97: opposite tastes

# Matrix factorisation by SGD: rating ≈ user_vector · item_vector
rng = np.random.default_rng(0)
k, lr, lam = 2, 0.02, 0.1                    # factors, step size, L2 penalty
U = rng.normal(0, 0.5, (4, k))               # one taste vector per user
V = rng.normal(0, 0.5, (4, k))               # one vector per item
for epoch in range(1000):
    for u, i in rng.permutation(np.argwhere(rated)):
        err = R[u, i] - U[u] @ V[i]
        U[u], V[i] = (U[u] + lr * (err * V[i] - lam * U[u]),
                      V[i] + lr * (err * U[u] - lam * V[i]))

pred = np.clip(U @ V.T, 1, 5)                # keep predictions on the 1-5 scale
print(pred[0, 1].round(1), pred[3, 3].round(1))   # 3.7 5.0: both gaps predicted high

def precision_at_k(recommended, relevant, k):
    return len(set(recommended[:k]) & set(relevant)) / k

print(precision_at_k([7, 3, 9, 1, 4, 8, 2, 6, 5, 0], {3, 4, 0, 11, 12, 13}, 10))  # 0.3
```

The learned vectors differ from the hand-picked ones above — factorisations are not unique — but they reach the same conclusion: Ann should see Heat, Dan should see Coco.

## Edge cases and pitfalls

- **Popularity bias and feedback loops:** the system recommends popular items, users click them because they were shown, and the next model learns they are even more popular. Add exploration and correct for exposure.
- **Missing is not negative** in implicit data, and **missing is not random** in explicit data: people rate what they chose to watch.
- **Leakage:** random train/test splits let the model peek at a user's future; split by time.
- **Optimising the wrong target:** clicks reward clickbait. Optimise for longer-term value (satisfaction, retention) where possible.

## In the interview

Expect "design a recommender for X" or "explain collaborative filtering vs content-based". A strong answer frames the data (explicit or implicit, how sparse), names cold start, describes matrix factorisation or two-tower embeddings for retrieval, a feature-rich ranker, and evaluation with time-based offline metrics (precision@k, recall@k, NDCG) followed by an A/B test. Likely follow-ups: *"how do you recommend a brand-new item?"* (content features, exploration) and *"how do you serve this to 100 million users?"* (precomputed embeddings, ANN retrieval, a ranker on a few hundred candidates).
