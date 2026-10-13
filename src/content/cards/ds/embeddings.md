---
title: Embeddings
track: ds
tags: [deep-learning, nlp, representation, search]
difficulty: 2
minutes: 5
tldr: "An embedding maps each word, item or user to a short learned vector of numbers, placed so that similar things end up close together. Similarity becomes geometry: compare vectors by cosine."
analogy: "A map of a city. Instead of listing every shop by name, you give each one coordinates; shops that sell similar things cluster in the same district, and 'find something like this' becomes 'look nearby'."
diagram: embeddings
story:
  - title: "One-hot: every word is equally different"
    text: "A model needs numbers, not words. The simplest encoding is one-hot: a vector as long as the vocabulary, say 50,000, with a single 1 marking the word. But any two different one-hot vectors have dot product 0, so \"cat\" is exactly as far from \"dog\" as from \"car\". No similarity, and huge vectors."
  - title: "An embedding table: one dense row per word"
    text: "Instead, keep a table with one short row of numbers per word — 2 here, typically 50 to 1,000 in practice. Encoding a word is just looking up its row (mathematically, one-hot times the table). The numbers start random and are learned during training, like any other weights."
  - title: Similar words land close together
    text: "Training adjusts the rows so that words used in similar contexts get similar vectors. Plotted, cat (3, 1) and dog (3, 2) point almost the same way, while car (−1, 3) points elsewhere. Distance in this space now means something."
  - title: Cosine similarity measures the angle
    text: "Cosine similarity is the dot product divided by both lengths: the cosine of the angle between the vectors, from −1 to 1. cos(cat, dog) = (3·3 + 1·2) / (√10 · √13) = 11 / 11.4 ≈ 0.96, very similar. cos(cat, car) = (−3 + 3) / … = 0: at right angles, unrelated."
  - title: Directions can carry meaning
    text: "In good embeddings some directions encode relations. The step from man to woman roughly matches the step from king to queen, so king − man + woman lands near queen. The famous word2vec result is real but cherry-picked: it holds only roughly and for some relations, and the search must exclude the input words."
keyIdeas:
  - "**One-hot** vectors are huge, sparse and orthogonal: they say nothing about similarity. **Embeddings** are short, dense and learned."
  - "An **embedding layer is a lookup table** of shape (vocabulary × dimension), trained by backprop like any other weights."
  - "**Cosine similarity** = a·b / (‖a‖‖b‖) compares direction and ignores length; on unit-normalised vectors it is just the dot product."
  - "**word2vec** learns word vectors by predicting a word's neighbours; the same idea embeds items, users, queries, images."
  - "**Vector databases** answer \"find the k most similar vectors\" with approximate nearest-neighbour indexes such as HNSW."
quiz:
  - q: "What is the cosine similarity of (1, 0) and (1, 1)?"
    options: ["0.5", "0.71", "1.0", "1.41"]
    answer: 1
    why: "Dot product 1·1 + 0·1 = 1; lengths 1 and √2. 1 / √2 ≈ 0.71, the cosine of the 45° angle between them."
  - q: "Why are one-hot vectors a poor representation for similarity?"
    options: ["They are too short", "Every pair of different words has dot product 0, so all words are equally dissimilar", "They contain negative numbers", "They cannot be stored"]
    answer: 1
    why: "Each one-hot vector has its single 1 in a different place, so any two are orthogonal. The encoding carries identity but no notion that cat is closer to dog than to car."
  - q: "An embedding table has a vocabulary of 50,000 words and 300 dimensions. How many learned numbers is that?"
    options: ["50,300", "300", "15,000,000", "2,500,000,000"]
    answer: 2
    why: "One row of 300 numbers per word: 50,000 × 300 = 15 million parameters, about 60 MB in 32-bit floats."
  - q: "You compute king − man + woman with real word2vec vectors and search for the nearest word. What is the honest caveat?"
    options: ["The answer is always exactly queen", "Standard evaluations exclude the three input words; without that, the nearest word is often king itself", "It only works for 2-dimensional embeddings", "Cosine cannot be used for analogies"]
    answer: 1
    why: "The result vector is usually still closest to king. The famous answer appears when the input words are excluded, and analogies hold only approximately and for some relation types."
bigO:
  - { op: "lookup", avg: "O(d)", note: "copy one row of the table" }
  - { op: "table size", avg: "V × d", note: "50,000 × 300 = 15 M numbers ≈ 60 MB in float32" }
  - { op: "exact k-NN search", avg: "O(N · d)", note: "compare the query with all N vectors" }
  - { op: "approximate k-NN (HNSW)", avg: "≈ O(log N)", note: "typical behaviour; trades a little recall for speed" }
bigOTitle: "Key numbers"
related: [ds/attention, ds/recommender-systems, ds/categorical-encoding, ds/k-nearest-neighbours]
prereqs: [ds/neural-network-basics]
flashcards:
  - kind: qa
    q: "What is an embedding layer, mechanically?"
    a: "A trainable matrix with one row per token or ID. Looking up the row for an index is equivalent to multiplying its one-hot vector by the matrix; in each step only the rows that were looked up receive a non-zero gradient."
  - kind: cloze
    text: "Cosine similarity is the {{dot product}} divided by the {{product of the vector lengths}}, so it ranges from −1 to 1."
  - kind: qa
    q: "How does a vector database find similar items fast?"
    a: "It builds an approximate nearest-neighbour index (HNSW graphs, IVF clustering, product quantisation) so a query visits a small fraction of the vectors instead of all N, trading a little recall for large speed-ups."
sources:
  - { name: "Stanford CS230 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-230-deep-learning", licence: "MIT", note: "Recurrent neural networks cheatsheet: word representation, word2vec, cosine similarity" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

Models do arithmetic on numbers, but much of the world comes as **discrete symbols** with thousands or millions of possible values: words, product IDs, user IDs, postcodes, songs. You need to turn each symbol into numbers in a way that does not invent false structure (word 17 is not "less than" word 18) and, ideally, captures real structure (cat is more like dog than like car).

## One-hot versus dense

**One-hot encoding** gives a symbol a vector as long as the vocabulary V, with a 1 in its own position and 0 everywhere else. It invents no false order, but:

- it is huge — V = 50,000 numbers per word;
- every pair of distinct symbols is orthogonal (dot product 0), so the representation knows nothing about similarity, and what a model learns about "cat" does not transfer to "kitten".

An **embedding** gives each symbol a short **dense** vector of d real numbers (d = 2 in the picture, typically 32–1,024 in practice). The vectors are **learned**, so that symbols that behave similarly in the training task get nearby vectors. Generalisation then comes for free: a model that learned something about "cat" automatically applies part of it to the nearby "kitten".

## How it works

An **embedding table** E is a matrix of shape V × d — one row per symbol. To embed symbol i, read row i. That is mathematically the one-hot vector times E (all rows but one are multiplied by 0), but a lookup is far cheaper. The table is a layer of the network: it starts random, the gradient of the loss flows back into the rows that were used, and gradient descent moves them. Nothing else is special about it.

What the vectors end up encoding depends on the **training task**:

- **word2vec** (2013) trains on raw text. In the skip-gram version a word's vector must predict which words appear within a few positions of it; with **negative sampling** the model learns to score real (word, neighbour) pairs high and random pairs low. Words that share contexts — "cat" and "dog" both appear near "pet", "fed", "vet" — end up with similar vectors.
- **Inside a bigger model** — a recommender, a Transformer, a classifier — the table is trained end to end for that model's objective. A Transformer's token embeddings are exactly this, before positional information and attention are added.
- **Two-tower / contrastive** training puts queries and documents (or users and items, or images and captions) into one shared space so that matching pairs have a high dot product.

## Measuring similarity

The usual measure is **cosine similarity**:

> cos(a, b) = a·b / (‖a‖ ‖b‖)

the cosine of the angle between the vectors: 1 for the same direction, 0 for perpendicular, −1 for opposite. It ignores length, which often reflects frequency rather than meaning. If you normalise every vector to length 1 once, cosine becomes a plain dot product — which is what fast search libraries compute. **Euclidean distance** on unit vectors gives the same ranking, since ‖a − b‖² = 2 − 2·cos(a, b).

## Worked example

Toy 2-D table: cat = (3, 1), dog = (3, 2), car = (−1, 3).

| Pair | Dot product | Lengths | Cosine |
|---|---|---|---|
| cat, dog | 3·3 + 1·2 = 11 | √10 = 3.16, √13 = 3.61 | 11 / 11.40 = **0.96** |
| cat, car | 3·(−1) + 1·3 = 0 | √10, √10 | **0** |
| dog, car | 3·(−1) + 2·3 = 3 | √13, √10 | 3 / 11.40 = 0.26 |

Analogy: with man = (−2.4, −0.6), woman = (−2.4, −2.2), king = (−1.4, −0.6), queen = (−1.5, −2.3), king − man + woman = (−1.4, −2.2), and its nearest other word is queen.

## In code

```python
import numpy as np

vocab = ["cat", "dog", "car", "man", "woman", "king", "queen"]
idx = {w: i for i, w in enumerate(vocab)}
E = np.array([[3.0, 1.0], [3.0, 2.0], [-1.0, 3.0],     # the embedding table:
              [-2.4, -0.6], [-2.4, -2.2],               # one row per word
              [-1.4, -0.6], [-1.5, -2.3]])              # (toy 2-D values)

one_hot = np.zeros(len(vocab)); one_hot[idx["cat"]] = 1
print(one_hot @ E, E[idx["cat"]])                       # identical: [3. 1.] twice

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

print(round(cosine(E[0], E[1]), 2), round(cosine(E[0], E[2]), 2))   # 0.96 0.0

def nearest(query, k=1, exclude=()):
    """Exact nearest neighbours by cosine: normalise rows, one matrix-vector product."""
    unit = E / np.linalg.norm(E, axis=1, keepdims=True)
    sims = unit @ (query / np.linalg.norm(query))
    order = [i for i in np.argsort(-sims) if vocab[i] not in exclude]
    return [(vocab[i], round(float(sims[i]), 3)) for i in order[:k]]

print(nearest(E[idx["cat"]], exclude={"cat"}))          # [('dog', 0.965)]
target = E[idx["king"]] - E[idx["man"]] + E[idx["woman"]]
print(nearest(target, exclude={"king", "man", "woman"}))  # [('queen', 1.0)]
```

## Embeddings beyond words

Any high-cardinality ID can be embedded: products, users, songs, advertisers, postcodes. A recommender learns a user vector and an item vector so that their dot product predicts interest; an e-commerce model embeds product IDs so that items bought together end up close. Compared with one-hot encoding, embeddings share statistical strength between similar IDs and keep the model small. Pretrained text and image encoders produce embeddings of whole sentences, documents or pictures for **semantic search** and retrieval-augmented generation.

## Nearest-neighbour search and vector databases

"Find the items most similar to this one" means **k-nearest-neighbour** search. Exact search compares the query with every vector — O(N·d), which for 10 million vectors of 768 dimensions is about 7.7 billion multiply-adds per query. **Approximate nearest-neighbour (ANN)** indexes trade a little recall for orders-of-magnitude speed: **HNSW** walks a layered proximity graph, **IVF** clusters the vectors and searches only the nearest clusters, **product quantisation** compresses vectors so more fit in memory. Libraries such as FAISS and vector databases wrap these indexes with storage, filtering and updates.

## Edge cases and pitfalls

- **Analogies are oversold.** king − man + woman ≈ queen holds approximately, for some relations, and usually only after excluding the input words from the search. Do not present it as an exact law.
- **Embeddings absorb bias.** Vectors trained on human text reproduce stereotypes present in it (for example, gendered associations with occupations); audit before using them in decisions about people.
- **Individual dimensions are rarely interpretable.** Meaning lives in directions and distances, and any rotation of the space works equally well.
- **Cold start and unknown tokens.** A new ID has no trained row. Reserve an "unknown" row, use subword pieces for text, or build item vectors from content features.
- **Compare like with like.** Vectors from different models, or different training runs of the same model, live in unrelated coordinate systems.

## In the interview

Expect "what is an embedding and why not one-hot?", "how is an embedding layer trained?", "cosine versus dot product versus Euclidean?", or a system-design question about similarity search. A strong answer: a learned lookup table trained by backprop for some objective; cosine compares direction; normalise to make it a dot product; serve with an ANN index such as HNSW. A common follow-up: *"how do you embed a brand-new item with no interactions?"* — compute its vector from content (text, image, category) with a model trained to map content into the same space.
