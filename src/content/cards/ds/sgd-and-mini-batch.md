---
title: SGD and Mini-Batches
track: ds
tags: [optimisation, training, deep-learning]
difficulty: 2
minutes: 5
tldr: "Estimate the gradient from a small random batch instead of all the data: each step is noisier but far cheaper. Add a warmup-then-decay learning rate, and momentum or Adam to smooth the path."
analogy: "Polling a city. Asking every resident before each decision (batch) is exact but takes a week; asking one passer-by (SGD) is instant but erratic; asking 100 random people gives a good-enough answer in an hour, and you can ask again and again."
diagram: sgd-and-mini-batch
story:
  - title: "Batch: exact gradient, smooth path"
    text: "Say we have 10,000 training rows. The loss is their average, and so is its gradient. Batch gradient descent computes it exactly from all 10,000 rows, then takes one step. The path is smooth, but each step costs a full pass over the data."
  - title: "SGD: one row per step"
    text: "Stochastic gradient descent (SGD) uses one random row per step. Its gradient is right on average but very noisy, so the path wanders. In exchange you get 10,000 cheap steps for the cost of one batch step."
  - title: "Mini-batch: the middle ground"
    text: "Mini-batch SGD averages B random rows per step, here B = 100. The noise in the estimate shrinks like 1/√B, so 100 rows are about 10× steadier than 1, and a GPU processes the 100 in parallel. B = 32 to 512 is the usual range."
  - title: Epochs, batches and steps
    text: "An epoch is one full pass over the training set; an iteration (step) is one weight update. Steps per epoch = ceil(N / B) = 10,000 / 100 = 100, so 10 epochs are 1,000 steps. With B = 32 it is 313 steps: 312 full batches plus one of 16 rows."
  - title: "Learning-rate schedule: warm up, then decay"
    text: "Early on, the weights are random and gradients large and erratic, so start with a tiny learning rate η and raise it linearly over the first few percent of steps (warmup). Later, shrink η (cosine or step decay) so the mini-batch noise dies down and the weights settle."
  - title: "Momentum and Adam: smooth the zig-zag"
    text: "In a narrow valley the gradient points mostly across it, so plain SGD zig-zags (orange). Momentum steps along a running average of gradients: the side-to-side parts cancel, the downhill parts add up (green). Adam adds a per-weight step size on top."
keyIdeas:
  - "**Batch** = all N rows per step (exact, slow); **SGD** = 1 row (cheap, very noisy); **mini-batch** = B rows, the practical default."
  - "**Steps per epoch = ceil(N / B)**; total steps = epochs × steps per epoch."
  - "Gradient noise falls like **1/√B**: 4× the batch only halves the noise. Larger batches usually need a larger η (roughly proportional) and warmup."
  - "**Warmup then decay** (linear ramp, then cosine or step decay) is the standard schedule; decay is what lets SGD settle."
  - "**Momentum** averages gradients (β ≈ 0.9); **Adam** adds per-weight scaling by the root of the running mean of squared gradients."
quiz:
  - q: "You train on 50,000 images with batch size 250 for 20 epochs. How many weight updates happen?"
    options: ["200", "4,000", "1,000,000", "12,500"]
    answer: 1
    why: "50,000 / 250 = 200 steps per epoch, times 20 epochs = 4,000 updates."
  - q: "You raise the batch size from 64 to 256 and keep everything else fixed. Roughly what happens to the noise (standard deviation) of each gradient estimate?"
    options: ["It falls to a quarter", "It halves", "It stays the same", "It doubles"]
    answer: 1
    why: "The standard deviation of an average of B independent samples scales like 1/√B. 4× the batch gives 1/√4 = 1/2 the noise — at 4× the compute per step."
  - q: "Why use learning-rate warmup?"
    options: ["To make the final model smaller", "Early gradients from random weights are large and unreliable, and a full-size step can blow training up", "Warmup replaces the need for decay", "It makes the batch size larger"]
    answer: 1
    why: "At the start the weights are random, gradients are big and erratic, and Adam's running averages have seen few samples. Ramping η up over the first few hundred or thousand steps avoids an early divergence, especially with large batches and transformers."
  - q: "Plain SGD zig-zags across a narrow valley. What does momentum do?"
    options: ["It uses a bigger batch", "It averages recent gradients so the cross-valley components cancel and the along-valley components accumulate", "It resets the learning rate every epoch", "It computes second derivatives"]
    answer: 1
    why: "v ← βv + g sums gradients with decaying weights. Components that flip sign every step cancel; components that keep pointing downhill add up, to about 1/(1 − β) = 10× for β = 0.9."
bigO:
  - { op: "steps per epoch", avg: "ceil(N / B)", note: "10,000 rows, B = 100 → 100" }
  - { op: "cost per step", avg: "O(B · p)", note: "p parameters; batch GD: O(N · p)" }
  - { op: "gradient noise (std)", avg: "∝ 1/√B" }
  - { op: "momentum speed-up", avg: "≈ 1/(1 − β)", note: "β = 0.9 → up to 10× on a steady slope" }
  - { op: "Adam defaults", avg: "η = 1e-3, β₁ = 0.9, β₂ = 0.999" }
bigOTitle: "Key numbers"
related: [ds/gradient-descent, ds/backpropagation, ds/neural-network-basics, ds/loss-functions]
prereqs: [ds/gradient-descent]
flashcards:
  - kind: qa
    q: "Define epoch, iteration and batch size, and relate them."
    a: "Batch size B = rows per gradient step; iteration = one weight update; epoch = one pass over all N rows. Iterations per epoch = ceil(N / B)."
  - kind: cloze
    text: "Doubling the batch size cuts the gradient noise by a factor of {{√2}}, and the {{linear scaling}} rule says to raise the learning rate in proportion to the batch size."
  - kind: qa
    q: "Write the Adam update in words."
    a: "Keep a running mean of gradients (m, β₁ = 0.9) and of squared gradients (v, β₂ = 0.999), correct both for their zero start, then step w ← w − η · m̂ / (√v̂ + ε)."
sources:
  - { name: "Stanford CS230 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-230-deep-learning", licence: "MIT", note: "Deep learning tips: mini-batch, momentum, Adam" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why not use all the data every step?

Training minimises an **average loss** over N examples, L(w) = (1/N) Σᵢ ℓᵢ(w), so its gradient is also an average: ∇L = (1/N) Σᵢ ∇ℓᵢ. Computing it exactly (**batch gradient descent**) touches every example for a single update. With 10 million images that is one step per hour — and the first steps, taken from random weights, do not need that precision.

The fix is statistical. Pick a random subset of B rows, a **mini-batch**, and average just their gradients. That estimate is **unbiased** (right on average) and its standard deviation shrinks like σ/√B, where σ measures how much individual-example gradients disagree. So:

| Variant | Rows per step | Steps per epoch (N = 10,000) | Gradient quality | Hardware use |
|---|---|---|---|---|
| Batch GD | all N | 1 | exact | one huge computation |
| Stochastic GD | 1 | 10,000 | very noisy | poor: no parallelism |
| Mini-batch SGD | B (32–512) | ceil(N / B), e.g. 100 for B = 100 | noise ∝ 1/√B | good: B rows in parallel on a GPU |

In practice "SGD" in a deep-learning library means mini-batch SGD.

## How it works

1. **Shuffle** the training rows at the start of each epoch, so batches are random and differ between epochs.
2. **Slice** the shuffled order into consecutive batches of B rows (the last may be smaller).
3. For each batch: compute the loss and its gradient on just those rows, then **update** w ← w − η · g, where η is the learning rate.
4. One pass over all batches is an **epoch**. Repeat for several epochs, watching validation loss to decide when to stop.

```text
for epoch in 1 … E:
    shuffle the N row indices
    for each consecutive block b of B indices:      # ceil(N / B) blocks
        g = mean gradient of the loss over rows b
        v = β·v + g                                 # optional momentum (β = 0 turns it off)
        w = w − η(step) · v                         # η from the schedule
        step = step + 1
```

### Terms and arithmetic

- **Batch size B:** rows per gradient estimate.
- **Iteration / step:** one weight update.
- **Epoch:** one pass over all N training rows.

Steps per epoch = ceil(N / B). With N = 10,000: B = 100 gives 100 steps; B = 32 gives 313 (312 full batches and one of 16); B = 1 gives 10,000. Ten epochs at B = 100 is 1,000 steps. When papers quote "steps", convert with this formula before comparing schedules.

## Why noise can help

Noise costs precision near the end, but it brings benefits:

- **Cheap progress early.** Far from the minimum, even a rough direction is good enough; 100 noisy steps beat one exact step.
- **Escaping saddle points and plateaus.** In high dimensions most flat spots are saddles; random kicks move you off them.
- **Implicit regularisation.** Small-batch training is often observed to land in wider, flatter minima that generalise better. This is an empirical tendency, not a guarantee.

The price: with a constant η the weights keep jittering in a "noise ball" around the minimum. Shrinking η over time removes it; formally, SGD converges when the step sizes satisfy Σηₜ = ∞ and Σηₜ² < ∞ (for example ηₜ ∝ 1/t).

## Learning-rate schedules

- **Step decay:** multiply η by 0.1 at fixed epochs (e.g. 30, 60, 90).
- **Cosine decay:** ηₜ = η_min + ½(η_max − η_min)(1 + cos(π t / T)) — smooth from η_max at step 0 to η_min at step T.
- **Warmup:** ramp η linearly from near 0 to η_max over the first few hundred to few thousand steps (often 1–10 % of training). Random initial weights give large, unreliable gradients, and Adam's running averages are poorly estimated after a handful of steps; a full-size η then can blow training up. Warmup matters most with large batches and transformers.
- **Batch size and η go together.** The **linear scaling rule** — multiply η by k when you multiply B by k — works well up to a point, usually combined with warmup. Beyond some batch size, extra rows stop buying faster training.

## Momentum and Adam

**Momentum.** Keep a velocity v ← βv + g and step w ← w − ηv, with β ≈ 0.9. If the gradient is constant, v grows 1, 1.9, 2.71, 3.44, … towards g / (1 − β) = 10g: a 10× speed-up on a steady slope. If a component flips sign every step (zig-zagging across a valley), it largely cancels. Momentum also averages away part of the mini-batch noise.

**Adam** keeps two running averages per weight: m of the gradient (β₁ = 0.9) and v of the squared gradient (β₂ = 0.999). Because both start at 0, it divides them by (1 − βᵗ) — **bias correction** — and steps w ← w − η · m̂ / (√v̂ + ε). Dividing by √v̂ gives each weight its own step size: a weight whose gradients are consistently large and one whose gradients are consistently tiny both move by roughly η per step, while a weight whose gradients keep flipping sign (small m̂ relative to √v̂) moves less. On the very first step m̂ = g and v̂ = g², so every weight moves by about η regardless of the gradient's scale. **AdamW** applies weight decay directly to the weights instead of through the gradient, and is the default for transformers.

## Implement it in Python

The loop is the same in any language; frameworks such as PyTorch, JAX, Flux.jl or Keras package it as an optimiser plus a learning-rate scheduler. Here it is written out in NumPy: mini-batch SGD with momentum and a warmup-then-cosine schedule, on a linear regression with 10,000 rows.

```python
import math
import numpy as np

rng = np.random.default_rng(0)
n, p = 10_000, 5
X = rng.normal(size=(n, p))
y = X @ np.array([3.0, -2.0, 1.0, 0.5, 0.0]) + 0.5 * rng.normal(size=n)

def lr_at(step, total, peak=0.01):
    warmup = max(1, total // 10)                      # first 10 % of steps
    if step < warmup:                                  # linear warmup from ~0 to peak
        return peak * (step + 1) / warmup
    t = (step - warmup) / max(1, total - warmup)       # cosine decay from peak to 0
    return 0.5 * peak * (1 + math.cos(math.pi * t))

def train(batch, epochs=5, beta=0.9):
    w, v = np.zeros(p), np.zeros(p)
    steps_per_epoch = math.ceil(n / batch)             # 10,000 / 100 = 100
    total, step = epochs * steps_per_epoch, 0
    for _ in range(epochs):
        order = rng.permutation(n)                     # reshuffle every epoch
        for start in range(0, n, batch):
            b = order[start:start + batch]
            g = 2 / len(b) * X[b].T @ (X[b] @ w - y[b])  # mini-batch gradient of the MSE
            v = beta * v + g                           # momentum: decaying sum of gradients
            w -= lr_at(step, total) * v
            step += 1
    return step, np.mean((X @ w - y) ** 2)

for batch in (10_000, 100, 1):
    steps, mse = train(batch)
    print(f"batch {batch:>6}: {steps:>6} steps in 5 epochs, final MSE {mse:.4f}")
```

Output: full batch gets only 5 steps and stalls at MSE 10.63; B = 100 takes 500 steps and reaches 0.2473; B = 1 takes 50,000 steps and reaches 0.2475. The noise added to y has variance 0.25, so both mini-batch runs are at the floor — with B = 100 doing 100× fewer, well-vectorised updates than B = 1.

## Edge cases and pitfalls

- **Not shuffling** (e.g. data sorted by label or date) makes consecutive batches biased and training oscillates.
- **Changing B without changing η**: a bigger batch with the same η often trains slower per epoch; a smaller one may become unstable.
- **Batch-norm and tiny batches:** batch statistics from 2–4 rows are too noisy; use group or layer norm instead.
- **Divergence after a while** with a constant η: add decay, lower η, or clip gradient norms.
- **Very large batches** can generalise slightly worse at the same number of epochs; warmup, more epochs or tuned η usually close the gap.
- **Adam is not always best:** well-tuned SGD with momentum still often wins on image classification; Adam/AdamW dominates for transformers.

## In the interview

Typical prompts: "batch vs stochastic vs mini-batch?", "how many iterations per epoch?", "what does momentum do?", "why warmup?", "Adam vs SGD?". Lead with the cost/noise trade-off and the 1/√B rule, do the epoch arithmetic out loud, then sketch the zig-zag picture for momentum. A strong answer also says that batch size, η and the schedule must be tuned together, and that Adam's advantage is per-parameter step sizes.
