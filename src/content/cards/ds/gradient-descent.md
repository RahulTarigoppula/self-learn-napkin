---
title: Gradient Descent
track: ds
tags: [optimisation, training, fundamentals]
difficulty: 2
minutes: 4
tldr: "Feel the slope of the loss where you stand and step downhill: w ← w − η · gradient. The learning rate η decides whether you crawl, converge or blow up."
analogy: "Walking down a hill in thick fog. You cannot see the valley, only how the ground tilts under your feet, so you take a step in the steepest downhill direction and check again. Stride length is the learning rate."
diagram: gradient-descent
griddle: gradient-descent
story:
  - title: The loss bowl
    text: "Training means finding weights that make the loss small. Take the simplest case: one weight w and loss L(w) = w², a bowl whose lowest point is at w = 0. Real models have millions of weights, but the bowl picture carries over."
  - title: The slope says which way is downhill
    text: "Drop a ball at w = 2. You cannot see the whole bowl, only the ground under you. The slope there is dL/dw = 2w = 4: positive, so the loss rises to the right and downhill is to the left. That slope is the gradient."
  - title: "Step: w ← w − η · slope"
    text: "Step against the gradient: w ← w − η · dL/dw, where η (eta) is the learning rate. With η = 0.3: 2 − 0.3 × 4 = 0.8, then 0.32, then 0.13. The steps shrink on their own because the slope flattens near the bottom."
  - title: "η too small: it crawls"
    text: "With η = 0.02 each step only multiplies w by 0.96. It always moves the right way, but getting below 0.01 takes about 130 steps instead of 6. That hurts when every step costs a pass over a large dataset."
  - title: "η too big: it overshoots"
    text: "With η = 1.05 each step multiplies w by −1.1. The ball jumps over the minimum and lands higher on the far side: 2, −2.2, 2.42, −2.66. The loss grows every step. That is divergence. On this bowl any η above 1 diverges, and between 0.5 and 1 it zig-zags in."
  - title: "Mini-batches: noisy but cheap"
    text: "A real loss averages over every training example, so the exact gradient costs a full pass over the data. Stochastic gradient descent estimates it from a small random mini-batch, say 32 rows. Each step wobbles (violet), but costs a tiny fraction, so you get many more steps for the same compute."
keyIdeas:
  - "The **gradient** points uphill; step the other way: `w ← w − η · ∇L`."
  - "The **learning rate η** is the most important knob: too small crawls, too big overshoots or diverges."
  - "Steps shrink near a minimum by themselves, because the gradient shrinks."
  - "**Mini-batch SGD** swaps exact gradients for cheap, noisy ones, so you get far more steps per second of compute."
  - "**Momentum** and **Adam** keep the same idea but smooth and rescale the steps."
quiz:
  - q: "L(w) = w², you are at w = 3 and η = 0.1. Where are you after one step?"
    options: ["2.4", "2.9", "0.6", "−3"]
    answer: 0
    why: "The gradient is 2w = 6. The step is η × 6 = 0.6 against the gradient: 3 − 0.6 = 2.4."
  - q: "For L(w) = 2.5(w − 2)², which learning rate makes gradient descent diverge?"
    options: ["0.05", "0.2", "0.3", "0.5"]
    answer: 3
    why: "dL/dw = 5(w − 2), so each step multiplies the distance to 2 by (1 − 5η): 0.75, 0, −0.5 and −1.5. Only η = 0.5 grows the distance. (η = 0.2 lands on the minimum in one step; 0.3 zig-zags in.)"
  - q: "Training loss becomes NaN within the first few hundred steps. What do you try first?"
    options: ["Lower the learning rate", "Raise the learning rate", "Add more layers", "Train for more epochs"]
    answer: 0
    why: "Exploding loss is the classic sign of steps that overshoot and land ever higher until the numbers overflow. Cutting η (often by 3–10×) is the first fix; gradient clipping and checking the input scaling come next."
  - q: "Why do most deep-learning runs use mini-batches rather than the full dataset per step?"
    options: ["Mini-batches give the exact gradient, so each step is more accurate", "Each step is far cheaper, so the same compute buys many more steps", "They remove the need for a learning rate, since noise sets the step", "They guarantee the global minimum, because the noise escapes every trap"]
    answer: 1
    why: "A 32-row batch gives a noisy but unbiased estimate of the full gradient at a tiny fraction of the cost. Many cheap noisy steps beat a few exact ones, and batches fit the parallel hardware well."
related: [ds/sgd-and-mini-batch, ds/linear-regression, ds/logistic-regression, ds/feature-scaling]
prereqs: []
flashcards:
  - kind: qa
    q: "Write the gradient descent update and say what each symbol means."
    a: "w ← w − η · ∇L(w): w are the weights, ∇L(w) the gradient of the loss (the uphill direction), η the learning rate (step size)."
  - kind: cloze
    text: "If the learning rate is too {{large}}, gradient descent overshoots the minimum and can {{diverge}}."
  - kind: qa
    q: "What is the difference between batch, stochastic and mini-batch gradient descent?"
    a: "Batch uses every example per step (exact, slow); stochastic uses one (very noisy, cheap); mini-batch uses a small random subset, typically 32–512, and it is the practical default."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised learning: gradient descent" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What the gradient is

A model's **loss** L(w) is one number that measures how wrong it is on the training data, as a function of its weights w. Training means finding weights that make L small.

With one weight, the **derivative** dL/dw is the slope of the loss curve: how much L changes per unit change in w. Positive slope means L increases if w increases. With many weights, take one derivative per weight. That is the **partial derivative** ∂L/∂wᵢ: "how L changes if I nudge only wᵢ". Stacked into a vector, they form the **gradient** ∇L. It points in the direction in which L rises fastest, and its length says how steep that rise is.

So the downhill direction is −∇L. That is the whole idea.

## How it works

1. **Start** with some weights (random small values, or zeros for simple models).
2. **Compute the gradient** of the loss at the current weights. In neural networks backpropagation does this efficiently.
3. **Step** a small distance downhill: **w ← w − η · ∇L(w)**. The **learning rate** η scales the step.
4. **Repeat** until the loss stops improving, the gradient is close to zero, or you run out of budget (often decided by early stopping on validation loss).

```text
w = initial guess
repeat until the loss stops improving:
    g = gradient of L at w        # one number per weight
    w = w − η · g
```

Why the steps shrink by themselves: the step is η times the gradient, and the gradient gets smaller as the slope flattens near the bottom. You do not need to tell the algorithm it is close.

### How big can η be?

On a bowl L(w) = (c/2)(w − w*)², the gradient is c(w − w*), so one step multiplies the distance to the minimum by (1 − ηc). The **curvature** c says how sharply the bowl bends.

| ηc | What happens |
|---|---|
| between 0 and 1 | smooth approach from one side |
| exactly 1 | lands on the minimum in one step |
| between 1 and 2 | overshoots, zig-zags inwards |
| above 2 | each overshoot lands higher: **diverges** |

Real losses curve differently in different directions. η must suit the steepest direction, which makes progress slow along the flattest ones. Momentum and Adam exist to fix that.

## Worked example

Fit y = w·x to two points, (1, 2) and (2, 4). The best weight is obviously w = 2. Use the mean squared error:

L(w) = ½[(w·1 − 2)² + (w·2 − 4)²] = 2.5(w − 2)², so dL/dw = 5(w − 2).

Start at w = 0 with η = 0.1. Each step multiplies the distance to 2 by 1 − 0.1 × 5 = 0.5:

| Step | w | gradient 5(w − 2) | loss |
|---|---|---|---|
| 0 | 0 | −10 | 10 |
| 1 | 1 | −5 | 2.5 |
| 2 | 1.5 | −2.5 | 0.625 |
| 3 | 1.75 | −1.25 | 0.156 |
| 4 | 1.875 | −0.625 | 0.039 |

The distance halves every step and the loss quarters. Here c = 5, so any η above 2/5 = 0.4 would diverge.

## Batch, stochastic and mini-batch

The loss is an average over N examples, and so is its gradient. **Batch** gradient descent computes it exactly every step, which costs N example-gradients per step. **Stochastic** gradient descent (SGD) uses one random example per step; **mini-batch** uses a small random subset, typically 32–512. The mini-batch gradient is an **unbiased estimate** (right on average) but noisy. Because each step costs a tiny fraction of a full pass, you take thousands of steps in the time batch descent takes a handful. The noise also means that with a fixed η the weights keep jittering near the minimum, which is why learning rates are usually decayed over training.

## Momentum and Adam, in one paragraph each

**Momentum** keeps a running average of recent gradients, v ← βv + ∇L, and steps along it: w ← w − ηv (β ≈ 0.9). Zig-zags across a narrow valley cancel out, while steady progress along the valley floor builds up speed.

**Adam** combines momentum with a per-weight scale: it divides each weight's step by a running estimate of that weight's typical gradient size. Weights with consistently tiny gradients get relatively larger steps. It is the default optimiser for most deep learning because it is forgiving about η (3 × 10⁻⁴ is a common start; the library default is 10⁻³).

## Implement it in Python

The update is one line in any language (R, Julia, C++, JavaScript…); deep-learning frameworks wrap it as an "optimiser". Here is mini-batch SGD for linear regression in plain NumPy:

```python
import numpy as np

rng = np.random.default_rng(0)
X = rng.normal(size=(1000, 3))                   # 1,000 rows, 3 features
true_w = np.array([2.0, -1.0, 0.5])
y = X @ true_w + 0.1 * rng.normal(size=1000)     # targets with a little noise

def loss(w, X, y):
    return np.mean((X @ w - y) ** 2)             # mean squared error

def grad(w, X, y):
    return 2 / len(y) * X.T @ (X @ w - y)        # dL/dw, one entry per weight

w = np.zeros(3)
eta, batch = 0.1, 32                             # learning rate, mini-batch size
for epoch in range(5):
    order = rng.permutation(len(y))              # reshuffle each epoch
    for start in range(0, len(y), batch):
        b = order[start:start + batch]           # indices of one mini-batch
        w -= eta * grad(w, X[b], y[b])           # the whole algorithm: step downhill
    print(f"epoch {epoch + 1}: loss {loss(w, X, y):.4f}  w = {w.round(3)}")
```

After the first epoch w is already about [2.00, −0.99, 0.49] with loss ≈ 0.010. That is the noise floor, since the added noise has variance 0.01. Later epochs wobble between 0.0103 and 0.0108: that is mini-batch noise with a constant η.

## Edge cases and pitfalls

- **Unscaled features** make the bowl a long thin valley (one direction very steep, another very flat). Standardise inputs so one η suits all directions.
- **Non-convex losses** (neural networks) have many minima, saddle points and plateaus. Gradient descent finds *a* low point, not provably the lowest. In practice that is good enough.
- **A zero gradient is not proof of a minimum**: it can be a saddle point or a plateau.
- **Exploding gradients** (NaN loss): lower η, clip gradient norms, check for unscaled inputs.
- **Convex problems** like linear and logistic regression have a single minimum, so gradient descent with a sensible η reaches the global optimum.

## In the interview

Expect "explain gradient descent", "what does the learning rate do?" or "SGD vs batch vs mini-batch?". Write the update rule, describe too-small and too-big η with the bowl picture, and explain why mini-batches win on cost. Likely follow-ups: *how do you choose η?* (a learning-rate sweep on a log scale, or a warm-up then decay schedule) and *why Adam?* (momentum plus per-weight step sizes).
