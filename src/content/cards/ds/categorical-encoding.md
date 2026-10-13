---
title: Categorical Encoding
track: ds
tags: [preprocessing, feature-engineering, leakage, encoding]
difficulty: 2
minutes: 5
tldr: "Models need numbers, so categories must be encoded: one-hot for few values, ordinal only for real orders, target encoding computed out-of-fold, and hashing or embeddings for huge vocabularies."
analogy: "Seating guests by name card: one-hot gives each guest their own chair; ordinal seats them alphabetically and pretends neighbours are alike; target encoding seats them by how much they tipped last time, which is useful but easy to cheat with."
diagram: categorical-encoding
story:
  - title: A city column and a label
    text: "Models do arithmetic on numbers, but a city column holds names. Here are six rows with a city and a 0/1 label y (did the user buy?). Each encoding below turns the same column into numbers, and each one makes a different claim about what those numbers mean."
  - title: "One-hot: a 0/1 column per city"
    text: "One-hot encoding creates one 0/1 column per category, so London becomes (1, 0, 0). It implies no order and no distances between cities. It is the safe default for a few dozen categories, but 10,000 cities would mean 10,000 columns that are almost all zeros."
  - title: "Ordinal: one integer per city"
    text: "Ordinal encoding maps each city to a single integer: London 0, Paris 1, Tokyo 2. It is compact, but a linear model now treats Tokyo as 'twice Paris' and Paris as halfway between the other two. Use it for categories with a real order (small < medium < large), or with tree models, which can split the integers apart."
  - title: "Target encoding: the mean of y"
    text: "Target encoding replaces each city with the mean label of its rows: London 1.0, Paris 0.0, Tokyo 0.5. That is one column with real signal. But London's 1.0 was computed from those same rows' labels, so in training the feature partly copies y. The model learns to trust it and then disappoints on new data."
  - title: "Smooth it, compute it out-of-fold"
    text: "Two fixes. Smooth rare categories toward the global mean with (n·mean + m·global) / (n + m); with m = 2, London becomes (2·1 + 2·0.5) / 4 = 0.75. And compute each training row's value out-of-fold, from the other folds only, so no row sees its own label. Test rows use values fitted on the full training set."
  - title: "Many categories: hash or embed"
    text: "With millions of categories (user IDs, URLs), use the hashing trick: hash each string into a fixed number of buckets, accept occasional collisions, and store no vocabulary. Or learn an embedding: each category gets a short dense vector trained with the model, and similar categories end up close together."
keyIdeas:
  - "**One-hot** for low-cardinality nominal features. It is the default for linear models and neural nets."
  - "**Ordinal** only when the order is real, or for tree models. Otherwise it invents an order and distances that don't exist."
  - "**Target encoding** packs signal into one column but leaks the label. Smooth it and compute it **out-of-fold**, inside the training data only."
  - "**Hashing** gives a fixed-size output with no vocabulary, at the cost of collisions. **Embeddings** learn dense vectors for high-cardinality IDs."
  - "Plan for **unseen categories** at prediction time: an 'other' bucket, `handle_unknown='ignore'`, or the global mean."
quiz:
  - q: "A logistic regression uses a 'colour' feature with values red, green and blue. Which encoding fits best?"
    options: ["Ordinal: red 0, green 1, blue 2", "One-hot", "Hashing into 2 buckets", "Drop the feature"]
    answer: 1
    why: "Colours have no order. Ordinal codes would force the model to treat green as halfway between red and blue. One-hot gives each colour its own weight."
  - q: "A city seen in 2 training rows, both with y = 1. The global mean is 0.5 and the smoothing strength m = 2. What is its smoothed target encoding?"
    options: ["1.0", "0.75", "0.5", "0.25"]
    answer: 1
    why: "(n·mean + m·global) / (n + m) = (2·1 + 2·0.5) / (2 + 2) = 3 / 4 = 0.75. The two observations are pulled halfway to the global mean."
  - q: "You target-encode with means from the whole training set. Training AUC is 0.99 and validation AUC is 0.70. What is the most likely cause?"
    options: ["The model is too simple", "The encoding leaked each row's own label into its feature", "One-hot would have been worse", "The validation set is too large"]
    answer: 1
    why: "Each training row helped compute its own category mean, so rare categories almost memorise y. Out-of-fold target encoding removes this leakage."
  - q: "You have 5 million distinct user IDs. Which is NOT a practical encoding?"
    options: ["Hashing trick", "Learned embeddings", "One-hot with 5 million columns in a dense matrix", "Target or count encoding computed out-of-fold"]
    answer: 2
    why: "5 million dense columns per row is far too much memory, and most categories would have too few rows to learn a weight. Hashing, embeddings or out-of-fold statistics scale."
bigO:
  - { op: "one-hot width", avg: "k columns", note: "k = number of categories (k − 1 if one is dropped)" }
  - { op: "ordinal / target width", avg: "1 column", note: "target: one per class for multiclass" }
  - { op: "hashing width", avg: "fixed (e.g. 2²⁰)", note: "no vocabulary; collisions grow as categories approach buckets" }
bigOTitle: "Key numbers"
related: [ds/feature-scaling, ds/embeddings, ds/cross-validation, ds/decision-trees]
prereqs: []
flashcards:
  - kind: qa
    q: "Why is naive target encoding a leakage risk, and how do you fix it?"
    a: "Each row's own label helps compute the value that becomes its feature, so rare categories almost copy y. Compute it out-of-fold (K-fold) within training data, and smooth toward the global mean."
  - kind: cloze
    text: "Use {{one-hot}} encoding for a few unordered categories and {{ordinal}} encoding only when the categories have a real order."
  - kind: qa
    q: "What is the hashing trick?"
    a: "Map each category string through a hash function to one of a fixed number of columns (e.g. 2²⁰). No vocabulary is stored and unseen categories still map somewhere, but different categories can collide."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why encoding is needed

Most models compute weighted sums, distances or gradients, so every input must be a number. A **categorical** feature holds labels instead: a city, a product ID, a browser. It is **nominal** if the labels have no order (cities) and **ordinal** if they do (small < medium < large, or education level). Its **cardinality** is the number of distinct values. Encoding picks a numeric representation, and the right choice depends on the model, the cardinality and whether an order exists.

## The main encoders

- **One-hot**: one binary column per category, with a single 1 per row. It claims nothing beyond "same or different". For a linear model *with an intercept*, the k columns always sum to 1, which duplicates the intercept (the "dummy variable trap"). Drop one column (`drop="first"`) or rely on regularisation. Width grows with k, so it suits up to roughly a few hundred categories, stored sparse.
- **Ordinal**: one integer per category. It is correct when the order is real. For unordered categories it is fine for **tree-based models**, which can isolate any value with a few threshold splits, but harmful for linear models and distance-based models, which read the codes as quantities.
- **Target (mean) encoding**: replace a category by a statistic of the label for that category. For binary y that is the fraction of positives; for regression, the mean of y. It is one dense, informative column even for 100,000 categories. Its danger is leakage (below).
- **Count/frequency encoding**: replace a category by how often it appears. It is cheap, label-free and often surprisingly useful.
- **Hashing trick**: compute `hash(category) mod B` and set that column. The output width B is fixed whatever the cardinality, there is no vocabulary to store, and unseen categories still map somewhere. The price is **collisions**: unrelated categories that share a bucket share a weight. scikit-learn's `FeatureHasher` also uses a sign hash (±1), so collisions tend to cancel rather than pile up.
- **Embeddings**: give each category an ID and look up a learned dense vector of, say, 8–64 numbers, trained with the rest of a neural network. Categories that behave alike get nearby vectors. This is the standard choice for users, items and words in deep models.

## Worked example

Rows (city, y): London 1, Paris 0, Tokyo 1, London 1, Paris 0, Tokyo 0. The global mean is 3/6 = 0.5.

| # | city | y | one-hot (L, P, T) | ordinal | mean y | smoothed (m = 2) | out-of-fold (2 folds) |
|---|---|---|---|---|---|---|---|
| 1 | London | 1 | 1, 0, 0 | 0 | 1.0 | 0.75 | 1.0 |
| 2 | Paris | 0 | 0, 1, 0 | 1 | 0.0 | 0.25 | 0.0 |
| 3 | Tokyo | 1 | 0, 0, 1 | 2 | 0.5 | 0.50 | **0.0** |
| 4 | London | 1 | 1, 0, 0 | 0 | 1.0 | 0.75 | 1.0 |
| 5 | Paris | 0 | 0, 1, 0 | 1 | 0.0 | 0.25 | 0.0 |
| 6 | Tokyo | 0 | 0, 0, 1 | 2 | 0.5 | 0.50 | **1.0** |

**Smoothing**: encoding = (n·mean + m·global) / (n + m). London has n = 2 and mean 1, giving (2 + 1) / 4 = 0.75. Paris gives (0 + 1) / 4 = 0.25. Tokyo gives (1 + 1) / 4 = 0.50. A category seen 1,000 times barely moves; one seen twice is pulled halfway to the global mean.

**Out-of-fold**: split into fold A (rows 1–3) and fold B (rows 4–6). Each row is encoded with statistics from the *other* fold only (unsmoothed here, for clarity). Row 3 (Tokyo, y = 1) gets fold B's Tokyo mean, 0. Row 6 (Tokyo, y = 0) gets fold A's, 1. The feature no longer contains the row's own label, which is the point. In practice you combine both: smoothed statistics computed out-of-fold.

## Why naive target encoding leaks

Picture a category that appears exactly once in training. Its in-sample mean *is* that row's label, so for rare categories the feature is a copy of y. A flexible model (gradient-boosted trees especially) learns "trust this column", scores brilliantly on training data and much worse on validation. On new data the feature is far noisier than it looked. The same trap catches **leave-one-out** encoding with a binary target: within one category, (sum − yᵢ) / (n − 1) is *lower* for rows with yᵢ = 1, so the model can read the label off the encoding. Use K-fold, not leave-one-out.

Rules: fit encoders on training data only; produce training features out-of-fold; encode validation and test with statistics from the full training set; and run all of it inside the cross-validation loop.

## In code

```python
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, TargetEncoder
from sklearn.feature_extraction import FeatureHasher

df = pd.DataFrame({"city": ["London", "Paris", "Tokyo", "London", "Paris", "Tokyo"],
                   "y":    [1, 0, 1, 1, 0, 0]})
X, y = df[["city"]], df["y"]

ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False).fit(X)
print(ohe.transform(X))                         # London -> [1, 0, 0]; unseen city -> all zeros

ordc = OrdinalEncoder().fit(X)                  # categories sorted: London 0, Paris 1, Tokyo 2

# Smoothed target mean by hand (m = 2)
m, g = 2, y.mean()
s = df.groupby("city")["y"].agg(["sum", "count"])
print((s["sum"] + m * g) / (s["count"] + m))    # London 0.75, Paris 0.25, Tokyo 0.50

# scikit-learn does the same smoothing and cross-fits automatically
te = TargetEncoder(smooth=2.0, cv=2, random_state=0)
X_train_enc = te.fit_transform(X, y)            # out-of-fold values for the training rows
print(te.encodings_)                            # full-train values, used by te.transform(X_test)

hasher = FeatureHasher(n_features=8, input_type="string")
H = hasher.transform([[c] for c in df["city"]]) # sparse 6 x 8, one ±1 per row, no vocabulary
```

For embeddings, a layer such as `torch.nn.Embedding(num_cities, 16)` maps city IDs to 16 learned numbers. Reserve one extra ID for unknown or rare categories.

## Edge cases and pitfalls

- **Unseen categories at prediction time** crash a naive mapping. Use `handle_unknown`, an explicit "other" bucket for rare values (say, fewer than 20 rows), or the global mean for target encoding.
- **Encoding before splitting** leaks, just like scaling. Put encoders in a `Pipeline` / `ColumnTransformer`.
- **High-cardinality one-hot with trees** spreads signal across thousands of sparse columns that each split poorly. Target, count or native categorical handling (LightGBM, CatBoost) usually works better.
- **Numbers that are really categories** (postcodes, product codes, user IDs) must not be fed in as numbers. Postcode 10001 is not "bigger" than 02139.

## In the interview

Expect: "How would you encode a feature with 50,000 distinct values?" A strong answer compares one-hot (too wide), ordinal (false order), target encoding (good, but must be smoothed and computed out-of-fold, with the leakage explained), hashing (fixed width, collisions) and embeddings (best in neural nets). It also mentions unseen-category handling. A common follow-up: "Why not leave-one-out target encoding?" Because, within a category, it shifts each row's value according to that row's own label.
