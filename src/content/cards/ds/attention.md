---
title: Attention
track: ds
tags: [deep-learning, transformers, nlp]
difficulty: 3
minutes: 5
tldr: "Each token asks a question (query), compares it with every token's label (key) by a dot product, turns the scores into weights with softmax, and takes the weighted mix of their contents (values)."
analogy: "A library search. Your query is what you type, every book has a key (its catalogue entry) and a value (its content). Instead of fetching only the best match, attention reads every book a little, in proportion to how well it matches."
diagram: attention
story:
  - title: A sentence, and the words "it" could mean
    text: "\"The animal didn't cross the street because it was tired.\" To understand \"it\", a model must work out which word it refers to. Attention lets every word look at every other word and pull in what it needs. To keep the numbers small, imagine the sentence were just these four words."
  - title: "\"it\" sends out a query"
    text: "Each word's vector is multiplied by three learned matrices to make three new vectors: a query (what am I looking for?), a key (what do I contain?) and a value (what do I hand over if chosen?). \"it\" sends its query to the key of every word, itself included."
  - title: Dot product with every key
    text: "Compare the query with each key by a dot product: multiply matching entries and add. Vectors pointing the same way give a large number. Divided by √d, the square root of the vector length, the scores are 3.0 for animal, 0.0 for street, 0.5 for it and 1.0 for tired: training has taught the model that \"it\" and \"animal\" match."
  - title: Softmax turns scores into weights
    text: "Softmax makes the scores positive and sum to 1: exponentiate each, then divide by the total. e³ = 20.1, e⁰ = 1, e^0.5 = 1.65, e¹ = 2.72; the total is 25.5, so the weights are 0.79, 0.04, 0.06 and 0.11. Exponentiating stretches gaps: a lead of 3 points becomes a 20 times bigger weight."
  - title: "Output: a weighted mix of the values"
    text: "The new vector for \"it\" is the weighted average of the values: 0.79·v(animal) + 0.04·v(street) + 0.06·v(it) + 0.11·v(tired). It now carries mostly the meaning of \"animal\". Every word does this at the same time, which is just matrix multiplication: softmax(QKᵀ / √d) · V."
keyIdeas:
  - "Each token makes a **query** (what it wants), a **key** (what it offers) and a **value** (what it hands over), using learned matrices W_Q, W_K and W_V."
  - "**Score** = q·k / √d, **softmax** turns scores into weights that sum to 1, **output** = weighted sum of the values."
  - "For all tokens at once: `softmax(QKᵀ / √d) · V` — that one line is self-attention."
  - "**Multi-head** attention runs several attentions in parallel with different matrices, so each head can track a different relation."
  - "Every token scores every other token, so cost grows with the **square of the sequence length**."
quiz:
  - q: "Two keys get scores 2.0 and 0.0. What weights does softmax give them?"
    options: ["1.0 and 0.0", "0.67 and 0.33", "0.88 and 0.12", "0.5 and 0.5"]
    answer: 2
    why: "e² = 7.39 and e⁰ = 1, total 8.39, so 7.39 / 8.39 ≈ 0.88 and 1 / 8.39 ≈ 0.12. Softmax keeps every option alive but strongly favours the higher score."
  - q: "Why are the scores divided by √d before the softmax?"
    options: ["So the weights sum to 1", "Dot products grow with the vector length d; unscaled, softmax saturates and its gradients vanish", "To save memory", "To stop tokens attending to future tokens"]
    answer: 1
    why: "With independent entries of variance 1, a dot product of length-d vectors has variance d. Large scores push softmax to almost one-hot, where gradients are nearly zero. Dividing by √d brings the variance back to 1."
  - q: "The input grows from 2,000 to 4,000 tokens. How does the attention score matrix grow?"
    options: ["It doubles", "It quadruples", "It stays the same", "It grows eight times"]
    answer: 1
    why: "The score matrix is n × n: 4,000² / 2,000² = 4. This quadratic cost is the main obstacle to very long contexts."
  - q: "A text generator must not look at tokens it has not produced yet. How does attention enforce that?"
    options: ["It deletes future tokens from the input", "It uses a smaller √d", "It averages the values instead", "A causal mask sets scores for later positions to −∞ before the softmax"]
    answer: 3
    why: "e^(−∞) = 0, so masked positions get weight exactly 0 and the rest still sum to 1. Token i then mixes only tokens 1 … i."
related: [ds/transformers, ds/embeddings, ds/neural-network-basics, ds/backpropagation]
prereqs: [ds/embeddings]
flashcards:
  - kind: qa
    q: "Write scaled dot-product attention and name each part."
    a: "softmax(QKᵀ / √d_k) · V. Q holds the queries, K the keys, V the values; QKᵀ scores every query against every key; √d_k keeps the scores in a sensible range; softmax turns each row into weights that mix the values."
  - kind: cloze
    text: "Attention weights come from a {{softmax}} over the scaled dot products, so each row of weights sums to {{1}}."
  - kind: qa
    q: "Why does a Transformer need positional encodings?"
    a: "Attention treats its inputs as an unordered set — shuffle the tokens and each output is the same, just shuffled. Position information must be injected (position vectors added to the embeddings, or rotations of the queries and keys) for word order to matter."
sources:
  - { name: "Stanford CS230 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-230-deep-learning", licence: "MIT", note: "Recurrent neural networks cheatsheet: attention" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem attention solves

The meaning of a word depends on the other words around it. "Bank" means one thing next to "river" and another next to "loan"; "it" means whatever it refers to. A model needs a way for each word to gather information from the relevant other words — wherever they are, however far away.

Older recurrent networks read one word at a time and squeezed everything seen so far into one fixed-size vector, so information from far back faded. **Attention** lets every position look directly at every other position and decide, from the content itself, how much to take from each. The Transformer architecture behind modern language models is built from stacked attention layers.

## How it works

Start with one vector per token, its **embedding** x (say 512 numbers). Attention has three learned weight matrices, W_Q, W_K and W_V.

1. **Project.** For every token compute a **query** q = x·W_Q, a **key** k = x·W_K and a **value** v = x·W_V. Same input, three roles: the query describes what this token is looking for, the key advertises what it contains, the value is what it passes on. Keeping key and value separate lets "what makes me relevant" differ from "what I contribute".
2. **Score.** For the token being updated, take the **dot product** of its query with every key: q·k = q₁k₁ + q₂k₂ + … + q_d·k_d. The dot product is large when two vectors point the same way, near zero when unrelated, negative when opposed. Divide by √d, where d is the key length.
3. **Normalise.** Apply **softmax** to the scores: wᵢ = e^(sᵢ) / Σⱼ e^(sⱼ). The weights are positive and sum to 1, and exponentiation amplifies differences, so the best match gets most of the weight while weaker matches still contribute a little.
4. **Mix.** Output = Σᵢ wᵢ·vᵢ, a weighted average of the values. It has the size of one value vector, and it replaces (or, in Transformers, is added to) the token's representation.

### All tokens at once

Stack the queries into a matrix Q (one row per token), likewise K and V. Then QKᵀ is an n × n table holding every query–key score, the softmax runs along each row, and multiplying by V mixes the values:

> Attention(Q, K, V) = softmax(QKᵀ / √d) · V

Because this is a handful of matrix multiplications, GPUs process all positions in parallel — a big reason Transformers replaced recurrent networks.

### Why divide by √d?

If the entries of q and k are roughly independent with variance 1, their dot product has variance d. With d = 64 the scores are typically around ±8, and softmax of such spread-out scores is almost one-hot: one weight near 1, the rest near 0. There the gradients are tiny and learning stalls. Dividing by √d brings the scores back to unit variance.

## Worked example

Use d = 4, so the scale is √4 = 2. The query of "it" is q = (1, 1, 1, 1). The keys:

| Word | key k | q·k | ÷ 2 = score | e^score | weight |
|---|---|---|---|---|---|
| animal | (2, 2, 1, 1) | 6 | 3.0 | 20.09 | **0.789** |
| street | (1, −1, 1, −1) | 0 | 0.0 | 1.00 | 0.039 |
| it | (1, 0, 0, 0) | 1 | 0.5 | 1.65 | 0.065 |
| tired | (1, 1, 0, 0) | 2 | 1.0 | 2.72 | 0.107 |
| | | | | total 25.45 | 1.000 |

Give each word a 2-number value: v(animal) = (1, 0), v(street) = (0, 1), v(it) = (0.5, 0.5), v(tired) = (0, 0.5). The output is

0.789·(1, 0) + 0.039·(0, 1) + 0.065·(0.5, 0.5) + 0.107·(0, 0.5) = (0.822, 0.125)

— very close to the value of "animal". In a trained model these vectors are learned, so that queries from pronouns line up with keys of plausible referents.

## Implement it in Python

Attention is three matrix multiplications and a softmax, so it carries over directly to any language or framework; here it is in Python with NumPy.

```python
import numpy as np

def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)         # subtract the max: same result, no overflow
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V, mask=None):
    """Scaled dot-product attention. Q: (n, d), K: (m, d), V: (m, dv)."""
    scores = Q @ K.T / np.sqrt(K.shape[-1])         # (n, m): every query against every key
    if mask is not None:
        scores = np.where(mask, scores, -np.inf)    # blocked pairs get weight exactly 0
    weights = softmax(scores)                       # each row sums to 1
    return weights @ V, weights                     # (n, dv): a weighted mix of the values

# The worked example: the query of "it" against four keys (d = 4, so we divide by 2)
q = np.array([[1.0, 1.0, 1.0, 1.0]])
K = np.array([[2, 2, 1, 1],                         # animal
              [1, -1, 1, -1],                       # street
              [1, 0, 0, 0],                         # it
              [1, 1, 0, 0]], dtype=float)           # tired
V = np.array([[1.0, 0.0], [0.0, 1.0], [0.5, 0.5], [0.0, 0.5]])
out, w = attention(q, K, V)
print(w.round(3), out.round(3))

# Self-attention over a whole sequence: learned projections plus a causal mask
rng = np.random.default_rng(0)
n, d_model, d_k = 5, 8, 4
X = rng.normal(size=(n, d_model))                   # 5 token embeddings
W_q, W_k, W_v = (rng.normal(size=(d_model, d_k)) for _ in range(3))
causal = np.tril(np.ones((n, n), dtype=bool))       # token i may look at tokens 0..i only
out, w = attention(X @ W_q, X @ W_k, X @ W_v, mask=causal)
print(out.shape, w[0].round(2), w[2].round(2))
```

The first print gives weights [0.789, 0.039, 0.065, 0.107] and output [0.822, 0.125], matching the table. In the masked run the first token can only attend to itself (weights [1, 0, 0, 0, 0]) and every row has zeros after its own position.

## Variations you will hear about

- **Self-attention:** queries, keys and values all come from the same sequence. **Cross-attention:** queries from one sequence (a translation being written), keys and values from another (the source sentence).
- **Causal (masked) attention:** in text generation each token may only attend to earlier ones; future scores are set to −∞ before the softmax.
- **Multi-head attention:** run h attentions in parallel, each with its own smaller W_Q, W_K, W_V (for example 8 heads of size 64 instead of one of size 512), then concatenate the outputs and project them. Different heads learn different relations — one may link pronouns to nouns, another track the previous word.
- **Positional information:** attention itself ignores order — permute the input tokens and the outputs are permuted the same way. Transformers inject position information — position vectors added to the embeddings, or position-dependent rotations of the queries and keys (RoPE) — so that order matters. See the Transformers napkin for how the full block is built around attention.

## Edge cases and pitfalls

- **Quadratic cost:** the n × n score matrix means doubling the context quadruples compute and memory for the scores. FlashAttention computes exact attention in tiles to save memory; sparse and linear-attention variants approximate it to cut the cost itself.
- **Numerical stability:** always subtract the row maximum before exponentiating, and make sure no row is fully masked (all −∞ gives 0 / 0).
- **Attention weights are not explanations.** A high weight shows where information flowed in one layer and head, not why the model decided something.
- **Forgetting the scale** trains noticeably worse once d is large, for the saturation reason above.

## In the interview

Expect "explain self-attention", "why the √d?", "what is multi-head attention for?" or "what is the complexity in sequence length?". A strong answer walks through query/key/value with a concrete sentence, writes softmax(QKᵀ/√d)·V, explains the scaling via variance, and mentions masking, multiple heads, positional encodings and the O(n²) cost. A likely follow-up: *how does attention differ from a fully connected layer?* — a dense layer's mixing weights are fixed after training, while attention computes new mixing weights for every input from the content itself.
