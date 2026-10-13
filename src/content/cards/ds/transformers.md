---
title: Transformers
track: ds
tags: [deep-learning, transformers, nlp, llm]
difficulty: 3
minutes: 6
tldr: "Embed the tokens, add positions, then pass them through N identical blocks of self-attention (tokens share information) and a feed-forward layer (each token thinks), with residuals and layer norm."
analogy: "A panel discussion repeated over many rounds. In each round everyone listens to everyone else (attention), then each person reflects alone on what they heard (feed-forward). Notes are added to, never thrown away (residuals)."
diagram: transformers
story:
  - title: Tokens become vectors
    text: "Text is split into tokens — words or word pieces — such as \"The\", \"cat\", \"sat\". Each token's ID selects a row of a learned embedding table, giving one vector per token (768 numbers in GPT-2 small). From here on, the model works only with these vectors."
  - title: Add position information
    text: "Attention by itself ignores order: shuffle the tokens and each one's output is unchanged, just shuffled. So a position vector p is added to each embedding — fixed sine waves in the original Transformer, learned vectors in GPT-2, rotations of the queries and keys (RoPE) in many newer models."
  - title: "Self-attention: tokens exchange information"
    text: "In each block, multi-head self-attention lets every token gather information from the others with softmax(QKᵀ/√d)·V, several heads in parallel. The result is added back to the input — a residual connection — and layer-normalised. Every token scores every token, so this step costs O(n²) in sequence length."
  - title: "Feed-forward, then repeat N times"
    text: "Next, a small two-layer network is applied to each token separately (768 → 3,072 → 768 in GPT-2), again with a residual and layer norm. Attention mixes across tokens; the feed-forward layer transforms within each token. The block is stacked N times: 12 in GPT-2 small, 96 in GPT-3."
  - title: Predict the next token
    text: "The final vector of each position goes through a linear layer and a softmax over the whole vocabulary. Position 3, having seen \"The cat sat\", gives a probability for every possible next token, and \"on\" should score high. Generation samples a token, appends it and runs again."
  - title: "Causal mask: no peeking ahead"
    text: "In a decoder (GPT-style) model, token i may attend only to tokens 1 … i: the scores above the diagonal are set to −∞ before the softmax. That lets training predict every position's next token in one parallel pass. Encoders such as BERT drop the mask and see both directions."
keyIdeas:
  - "**Pipeline:** token embeddings + positions → N × [self-attention → add & norm → feed-forward → add & norm] → linear + softmax."
  - "**Attention mixes across tokens; the feed-forward layer works on each token alone.** Residual connections and layer norm make deep stacks trainable."
  - "**Encoder-only** (BERT): bidirectional, for understanding. **Encoder-decoder** (original, T5): translation and summarisation. **Decoder-only** (GPT, Llama): causal, for generation."
  - "**Parallel training:** unlike an RNN, all positions are processed at once; any two tokens are one attention step apart."
  - "**Cost:** attention is O(n²·d) per layer in sequence length n, so long contexts are expensive."
quiz:
  - q: "Why does a Transformer need positional encodings?"
    options: ["To normalise the embeddings", "Self-attention is permutation-equivariant, so without them word order is invisible", "To reduce the vocabulary size", "To implement the causal mask"]
    answer: 1
    why: "Attention computes weighted sums over a set: shuffle the inputs and the outputs are shuffled the same way. \"Dog bites man\" and \"man bites dog\" would look identical without position information."
  - q: "What does the causal mask do in a decoder-only model?"
    options: ["Removes padding tokens", "Lets token i attend only to tokens 1 … i, so it cannot see the future", "Drops random attention heads", "Masks 15 % of the input tokens"]
    answer: 1
    why: "Scores for j > i are set to −∞, giving weight 0 after softmax. Training can then predict all positions in parallel without any position seeing its own answer. Masking 15 % of tokens is BERT's training task, a different thing."
  - q: "Why do Transformers train faster than RNNs on GPUs?"
    options: ["They have fewer parameters", "An RNN must process tokens one after another; a Transformer handles all positions at once with matrix multiplications", "They do not need backpropagation", "They use smaller vocabularies"]
    answer: 1
    why: "An RNN's state at step t depends on step t − 1, forcing n sequential steps. A Transformer's layers are a few big matrix products over the whole sequence, which GPUs parallelise well."
  - q: "The context grows from 4,000 to 16,000 tokens. Roughly how does the attention score memory per layer change?"
    options: ["4× larger", "16× larger", "Unchanged", "2× larger"]
    answer: 1
    why: "The score matrix is n × n per head: (16,000 / 4,000)² = 16. Feed-forward cost grows only linearly, 4×."
bigO:
  - { op: "self-attention per layer", avg: "O(n² · d)", note: "n × n scores per head" }
  - { op: "feed-forward per layer", avg: "O(n · d²)", note: "with the Q/K/V/O projections ≈ 12·n·d²; the 2·n²·d score terms only overtake it near n ≈ 6d" }
  - { op: "sequential steps (training)", avg: "O(1)", note: "RNN: O(n)" }
  - { op: "parameters per block", avg: "≈ 12 d²", note: "4d² attention + 8d² feed-forward" }
  - { op: "GPT-2 small", avg: "≈ 124 M", note: "12 blocks, d = 768, 12 heads, 1,024 tokens" }
bigOTitle: "Cost and key numbers"
related: [ds/attention, ds/embeddings, ds/neural-network-basics, ds/backpropagation]
prereqs: [ds/attention, ds/embeddings]
flashcards:
  - kind: qa
    q: "What are the two sub-layers of a Transformer block, and what does each do?"
    a: "Multi-head self-attention, which moves information between token positions, and a position-wise feed-forward network, which transforms each token's vector on its own. Each is wrapped with a residual connection and layer normalisation."
  - kind: cloze
    text: "GPT is a {{decoder-only}} Transformer trained to predict the {{next token}}; BERT is {{encoder-only}} and sees context on both sides."
  - kind: qa
    q: "Why are residual connections important in Transformers?"
    a: "Each sub-layer adds to its input (x + f(x)) instead of replacing it, which gives gradients a direct path through dozens of layers and lets each layer learn a small refinement."
sources:
  - { name: "Stanford CS230 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-230-deep-learning", licence: "MIT", note: "Recurrent neural networks cheatsheet: attention, comparison with RNNs" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why Transformers replaced RNNs

Before 2017, sequence models were mostly **recurrent neural networks** (RNNs, LSTMs): they read one token at a time and carried a hidden state forward. Two problems followed. Training was **sequential** — step t needs the state from step t − 1, so a 1,000-token sequence takes 1,000 dependent steps, which GPUs cannot parallelise. And information from far back had to survive many state updates, so long-range dependencies faded. The Transformer ("Attention Is All You Need", Vaswani et al., 2017) dropped recurrence entirely: every layer lets every token look directly at every other token through **attention**, and the whole sequence is processed with a few large matrix multiplications.

## How it works

1. **Tokenise.** Split text into tokens with a subword tokenizer (GPT-2 has a vocabulary of 50,257). "unbelievable" might become "un", "believ", "able".
2. **Embed.** Look up each token's row in an embedding table of shape vocabulary × d. Now the input is a matrix X of shape n × d (n tokens, d = 768 in GPT-2 small).
3. **Add positions.** Self-attention is **permutation-equivariant**: reorder the inputs and the outputs are reordered identically, so order is invisible. Add a position vector to each embedding. The original paper used fixed sinusoids, PE(pos, 2i) = sin(pos / 10000^(2i/d)) and PE(pos, 2i + 1) = cos(…), giving each position a unique pattern across many wavelengths; GPT-2 learns one vector per position; many modern models rotate queries and keys by a position-dependent angle (**RoPE**).
4. **N Transformer blocks.** Each block has two sub-layers:
   - **Multi-head self-attention.** Each token forms a query, key and value; scores QKᵀ/√d_head go through softmax and mix the values (see the attention napkin). With h heads (12 in GPT-2 small, each of size 64), the model tracks several relations at once; the heads' outputs are concatenated and projected back to d.
   - **Position-wise feed-forward network (FFN):** two linear layers with a non-linearity between them (ReLU originally, GELU in GPT and BERT), usually d → 4d → d, applied to each token independently. Most of the parameters live here.
   - Around each sub-layer: a **residual connection** (output = x + sublayer(x)) and **layer normalisation** (rescale each token's vector to mean 0 and variance 1, then apply a learned scale and shift). The original paper normalised after the addition (post-norm); GPT-2 and most modern models normalise the sub-layer's input (pre-norm, x + sublayer(LN(x))), which trains more stably in deep stacks.
5. **Output head.** After the last block (and a final layer norm in pre-norm models), a linear layer maps each token's vector to one score per vocabulary entry, and softmax turns them into next-token probabilities. GPT-2 reuses the embedding table for this projection (weight tying).

A useful mental model: the vectors flowing up the stack form a **residual stream**. Attention layers move information between positions; feed-forward layers process it within a position; each layer reads from the stream and adds a correction to it.

## Three families

| Variant | Attention | Trained to | Examples | Typical use |
|---|---|---|---|---|
| **Encoder-only** | bidirectional (no mask) | fill in masked tokens | BERT, RoBERTa | classification, embeddings, search |
| **Encoder-decoder** | encoder bidirectional; decoder causal + **cross-attention** to the encoder | map an input sequence to an output sequence | original Transformer, T5, BART | translation, summarisation |
| **Decoder-only** | causal | predict the next token | GPT, Llama | text generation, chat assistants |

**Cross-attention** takes its queries from the decoder and its keys and values from the encoder's output, so each generated word can consult the whole source sentence.

## Causal masking and parallel training

A decoder must not see the future, or predicting the next token would be trivial. The **causal mask** sets every score with key position j > query position i to −∞ before the softmax, so those weights become exactly 0. The payoff is that a whole training sequence of n tokens yields n prediction tasks — after "The", after "The cat", after "The cat sat" — computed in **one parallel forward pass** (teacher forcing). Generation is still sequential: produce one token, append it, run again. Inference engines cache each layer's keys and values for earlier tokens (the **KV cache**) so each new token costs one position's worth of computation instead of reprocessing the whole prefix.

## Worked example: GPT-2 small by the numbers

d = 768, 12 heads of 64, 12 blocks, FFN width 3,072, context 1,024, vocabulary 50,257.

| Part | Calculation | Parameters |
|---|---|---|
| attention per block | 4 matrices of d × d (Q, K, V, output) = 4·768² | 2.36 M |
| feed-forward per block | 768 × 3,072 + 3,072 × 768 = 8·768² | 4.72 M |
| 12 blocks | 12 × 12·768² | 84.9 M |
| token embeddings | 50,257 × 768 | 38.6 M |
| position embeddings | 1,024 × 768 | 0.8 M |
| **total** (ignoring biases and norms) | | **≈ 124 M** |

At full context each attention head computes a 1,024 × 1,024 score matrix — about 1.05 million scores — and there are 12 heads in each of 12 layers: about 151 million scores per forward pass. Quadruple the context to 4,096 tokens and that becomes 16 times larger.

## In code

A minimal decoder-only Transformer in numpy (random weights, pre-norm, no biases):

```python
import numpy as np
rng = np.random.default_rng(0)

def layer_norm(x, eps=1e-5):
    return (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps)

def softmax(x):
    e = np.exp(x - x.max(-1, keepdims=True))
    return e / e.sum(-1, keepdims=True)

def positional_encoding(n, d):
    angles = np.arange(n)[:, None] / 10000 ** (np.arange(0, d, 2)[None, :] / d)
    pe = np.zeros((n, d))
    pe[:, 0::2], pe[:, 1::2] = np.sin(angles), np.cos(angles)   # many wavelengths
    return pe

def block(x, p, n_heads):
    """Pre-norm decoder block: x + attention(LN(x)), then x + FFN(LN(x))."""
    n, d = x.shape
    split = lambda t: t.reshape(n, n_heads, d // n_heads).transpose(1, 0, 2)  # (heads, n, dh)
    q, k, v = (split(layer_norm(x) @ p[w]) for w in ("Wq", "Wk", "Wv"))
    scores = q @ k.transpose(0, 2, 1) / np.sqrt(d // n_heads)          # (heads, n, n)
    scores = np.where(np.tril(np.ones((n, n), bool)), scores, -np.inf)  # causal mask
    heads = (softmax(scores) @ v).transpose(1, 0, 2).reshape(n, d)      # concatenate heads
    x = x + heads @ p["Wo"]                                             # residual 1
    return x + np.maximum(0, layer_norm(x) @ p["W1"]) @ p["W2"]         # FFN d->4d->d, residual 2

vocab, d, n_heads = 50, 16, 4
shapes = {"Wq": (d, d), "Wk": (d, d), "Wv": (d, d), "Wo": (d, d), "W1": (d, 4 * d), "W2": (4 * d, d)}
layers = [{k: rng.normal(0, 0.1, s) for k, s in shapes.items()} for _ in range(2)]
E = rng.normal(0, 0.1, (vocab, d))                       # token embedding table

def gpt(tokens):
    x = E[tokens] + positional_encoding(len(tokens), d)  # (n, d)
    for p in layers:
        x = block(x, p, n_heads)
    return softmax(layer_norm(x) @ E.T)                  # (n, vocab), tied output weights

probs = gpt(np.array([3, 14, 15, 9]))
print(probs.shape)                                       # (4, 50): a prediction after every prefix
print(np.allclose(gpt(np.array([3, 14, 15, 7]))[:3], probs[:3]))  # True: the past ignores the future
```

The last line checks causality: changing the final token leaves the predictions at earlier positions untouched.

## Edge cases and pitfalls

- **Quadratic attention.** Memory and compute for scores grow with n². FlashAttention computes exact attention in tiles without storing the n × n matrix; sliding-window, sparse and linear-attention variants change the computation to reduce the cost itself.
- **Context length is fixed by training.** Learned position embeddings cannot represent positions beyond the trained maximum; relative schemes such as RoPE or ALiBi extend more gracefully, though quality can still drop.
- **Post-norm training instability.** Deep post-norm stacks typically need learning-rate warm-up; pre-norm is the common fix.
- **Attention ≠ the whole model.** Most parameters and much of the compute at moderate lengths sit in the feed-forward layers.
- **"Decoder" is overloaded.** In GPT-style models the "decoder" has no cross-attention at all; it is just a stack of causally masked blocks.

## In the interview

Expect "walk me through a Transformer", "encoder vs decoder?", "why the causal mask?", "why did Transformers beat RNNs?" and "what is the complexity?". A strong answer draws the stack from tokens to softmax, names both sub-layers with residuals and layer norm, explains positional encodings via permutation-equivariance, and states O(n²·d) attention versus O(n·d²) feed-forward. A likely follow-up: *"how is generation made fast?"* — the KV cache stores keys and values of past tokens, so each new token attends to cached keys instead of recomputing the whole prefix.
