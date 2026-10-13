---
title: Regularisation (L1, L2)
track: ds
tags: [generalisation, overfitting, ridge, lasso]
difficulty: 2
minutes: 5
tldr: "Add a penalty for large weights to the loss. L2 (ridge) shrinks every weight smoothly; L1 (lasso) pushes weak ones to exactly zero. λ trades a little bias for a lot less variance."
analogy: "A tailor who charges for every extra seam. With no charge you get a suit stitched to every crease of the fitting-day posture; with a modest charge you get a clean cut that still fits tomorrow; charge too much and you get a sack."
diagram: regularisation
story:
  - title: "Degree 9, no penalty: it wiggles"
    text: "Fit a degree-9 polynomial to 10 noisy points from a sine wave. Ten points and ten coefficients means the curve passes exactly through every point: training error 0. To do it, coefficients swing as large as 580,000 and the curve lurches between points. Its mean squared error against the true sine (dashed) is 0.37."
  - title: "A small λ: smooth and close to the truth"
    text: "Regularisation adds a price for large weights to the loss: minimise squared error + λ·Σw². With λ = 0.001 no weight exceeds 12 and training error rises to 0.04, but error against the true curve drops to 0.007, about 50 times better. We accept a little bias to remove a lot of variance."
  - title: "Too much λ: it underfits"
    text: "λ is a dial. Turn it up to 1 and the penalty dominates: every weight is crushed below 0.5, the curve goes nearly flat, and error against the truth climbs back to 0.24. Too little λ overfits and too much underfits, so λ is tuned on validation data, usually over a log grid such as 10⁻⁴ … 10²."
  - title: "L2 (ridge): a circle, weights shrink"
    text: "An equivalent view: minimise the loss while keeping the weights inside a budget region. The loss contours are ellipses around the unpenalised best fit (the dot). For L2 the region is a circle, w₁² + w₂² ≤ t². The smallest ellipse that reaches it usually touches at a smooth point, so both weights shrink and neither becomes zero."
  - title: "L1 (lasso): a diamond, a weight hits 0"
    text: "For L1, |w₁| + |w₂| ≤ t, the region is a diamond with its corners on the axes. Growing ellipses usually reach a corner first, and at a corner one weight is exactly 0. That is why lasso selects features: it switches weak ones off, while ridge only turns them down."
keyIdeas:
  - "**Penalised loss** = data loss + λ · penalty. L2 uses Σw², L1 uses Σ|w|. λ = 0 means no regularisation."
  - "**Ridge (L2)** shrinks all weights towards 0 and handles correlated features gracefully. **Lasso (L1)** sets some weights exactly to 0, which makes it a feature selector. **Elastic net** mixes the two."
  - "Choose λ by **cross-validation** on a log scale. **Scale features first**, and leave the intercept unpenalised."
  - "**Early stopping** and **dropout** are regularisers too: they limit how far training can fit the noise."
  - "Regularisation is the bias–variance trade made explicit: a bit more training error for much lower test error."
quiz:
  - q: "You want a model that uses only a handful of 500 candidate features. Which penalty?"
    options: ["L2 (ridge)", "L1 (lasso)", "No penalty, with a bigger model", "Dropout"]
    answer: 1
    why: "The diamond-shaped L1 constraint makes exact zeros likely, so lasso drops weak features. Ridge shrinks every weight but almost never sets one to exactly 0."
  - q: "As λ grows from 0 to very large, what happens to training error?"
    options: ["It falls steadily", "It rises steadily", "It falls, then rises", "It does not change"]
    answer: 1
    why: "The penalty stops the weights from fitting the training data as closely as they could, so training error only goes up. Test error typically falls and then rises, and its minimum picks λ."
  - q: "With orthonormal features, unpenalised weights ŵ = (3.0, 0.4) and λ = 1 (loss = squared error + λ · penalty), what do ridge and lasso give?"
    options: ["Ridge (1.5, 0.2); lasso (2.5, 0)", "Ridge (2.5, 0); lasso (1.5, 0.2)", "Both (1.5, 0.2)", "Ridge (3.0, 0.4); lasso (0, 0)"]
    answer: 0
    why: "Ridge divides each weight by 1 + λ = 2. Lasso subtracts λ/2 = 0.5 from each magnitude and clips at zero: 3.0 → 2.5 and 0.4 → 0."
  - q: "Why standardise features before ridge or lasso?"
    options: ["It makes training faster but changes nothing else", "The penalty treats all weights alike, so a feature's units would decide how hard it is penalised", "Lasso cannot run on unscaled data", "To remove outliers"]
    answer: 1
    why: "A feature measured in metres needs a weight 1000× larger than the same feature in millimetres, so it would be penalised far more. Scaling makes the penalty fair."
bigO:
  - { op: "ridge fit (closed form)", avg: "O(n·d² + d³)", note: "solve (XᵀX + λI)w = Xᵀy" }
  - { op: "lasso fit", avg: "O(n·d) per coordinate-descent sweep", note: "no closed form; iterate until converged" }
  - { op: "typical λ grid", avg: "10⁻⁴ … 10²", note: "log-spaced, chosen by cross-validation" }
bigOTitle: "Key numbers"
related: [ds/bias-variance, ds/linear-regression, ds/cross-validation, ds/feature-scaling]
prereqs: [ds/bias-variance]
flashcards:
  - kind: qa
    q: "Why does L1 produce exact zeros but L2 does not?"
    a: "The L1 constraint region is a diamond with corners on the axes, and the loss contours usually first touch it at a corner, where some weights are 0. The L2 circle has no corners, so the touching point generally has every weight non-zero."
  - kind: cloze
    text: "Ridge adds {{λ·Σw²}} to the loss; lasso adds {{λ·Σ|w|}}."
  - kind: qa
    q: "Name two regularisers that are not a penalty term."
    a: "Early stopping (stop training when validation error starts rising) and dropout (randomly zero units during training). Data augmentation and smaller models also work."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Regularization, machine-learning tips and tricks" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem it solves

A flexible model with too little data **overfits**: it learns the noise in the training set as well as the pattern. The tell-tale sign in linear and polynomial models is huge weights that cancel each other out. Huge weights make a model very sensitive to tiny changes in the input, which is exactly what the wild curve between the training points shows. **Regularisation** is any technique that limits how closely a model can fit its training data, so that it fits *new* data better.

## How it works

Instead of minimising only the training loss, minimise

`loss(w) = Σᵢ (yᵢ − ŷᵢ)²  +  λ · penalty(w)`

- **L2 / ridge**: penalty = Σⱼ wⱼ². Large weights cost a lot (quadratically) and small ones almost nothing, so every weight is pulled smoothly towards 0 and none is forced to exactly 0. Ridge has a closed form, w = (XᵀX + λI)⁻¹Xᵀy. The `+ λI` also makes the matrix invertible when features are strongly correlated.
- **L1 / lasso**: penalty = Σⱼ |wⱼ|. Every weight pays the same price per unit, however small it is, so a weight whose contribution to the fit is smaller than that price is set to exactly 0. Lasso has no closed form and is fitted by coordinate descent.
- **Elastic net**: α·L1 + (1 − α)·L2. It keeps lasso's sparsity but shares weight among correlated features instead of picking one of them at random.
- **λ ≥ 0** sets the strength. λ = 0 is plain least squares, and as λ → ∞ every penalised weight goes to 0. Bigger λ means more bias and less variance.

### The constraint picture

For each λ there is a budget t such that the penalised problem is the same as "minimise the loss subject to penalty(w) ≤ t". In two dimensions the loss contours are ellipses centred on the unpenalised solution. The answer is the first point where a growing ellipse touches the budget region. For L2 the region is a circle, which has no corners, so the touching point is generally off the axes. For L1 it is a diamond whose corners lie on the axes, and corners stick out, so they are usually hit first, which leaves a coordinate at exactly 0. In many dimensions the L1 region has many corners and edges, and lasso typically zeroes many weights.

### A two-weight example you can do by hand

When the features are orthonormal (XᵀX = I), the loss splits into one term per weight, (wⱼ − ŵⱼ)² + penalty, where ŵ is the unpenalised solution. Take ŵ = (3.0, 0.4) and λ = 1:

- **Ridge**: minimise (w − ŵ)² + λw², which gives w = ŵ / (1 + λ) = **(1.5, 0.2)**. Every weight is halved, and none reaches zero.
- **Lasso**: minimise (w − ŵ)² + λ|w|, which gives w = sign(ŵ) · max(|ŵ| − λ/2, 0). That is 3.0 − 0.5 = 2.5, and 0.4 − 0.5 < 0 becomes 0, so **(2.5, 0)**. Lasso shifts every weight towards 0 by the same amount and clips the small one to exactly zero (**soft-thresholding**).

### How lasso is fitted: coordinate descent

Lasso has no closed form, but the one-weight answer above gives an algorithm: fix every weight except one, solve for that one exactly, move on, and cycle until nothing changes. With each feature column scaled to unit length:

```text
start with w = 0
repeat until no weight changes by more than a tiny tolerance:
    for each feature j:
        r = y − (current predictions without feature j)     # what is left for j to explain
        z = Σᵢ xᵢⱼ · rᵢ                                       # the best weight for j on its own
        wⱼ = sign(z) · max(|z| − λ/2, 0)                      # soft-threshold: small z → exactly 0
```

Each sweep costs O(n·d), and features whose z never clears λ/2 stay at exactly zero.

## Worked example: taming a polynomial

Ten points xᵢ = 0, 1/9, …, 1 with yᵢ = sin(2πxᵢ) + noise, using the noise values (0.15, −0.20, 0.10, 0.25, −0.15, 0.05, −0.25, 0.10, 0.20, −0.10). We fit a degree-9 polynomial with a ridge penalty on all coefficients except the intercept. "vs truth" is the mean squared gap to the noise-free sine over 201 points in [0, 1].

| λ | train MSE | MSE vs truth | largest \|w\| |
|---|---|---|---|
| 0 | 0.000 | 0.366 | 582,535.28 |
| 10⁻⁶ | 0.012 | 0.012 | 114.61 |
| 10⁻³ | 0.041 | **0.007** | 11.55 |
| 0.1 | 0.186 | 0.118 | 1.28 |
| 1 | 0.291 | 0.244 | 0.46 |

Training error only rises with λ, while the error that matters falls and then rises. The best value here, λ = 10⁻³, is 50 times closer to the truth than the unregularised fit.

## Implement it in Python

Ridge, lasso and elastic net exist in every ML library (R's glmnet, Julia's MLJ, Spark MLlib…); this version uses scikit-learn. Beware that libraries scale the loss differently, so the same λ number can mean different strengths.

```python
import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import Ridge

x = np.linspace(0, 1, 10)
noise = np.array([0.15, -0.20, 0.10, 0.25, -0.15, 0.05, -0.25, 0.10, 0.20, -0.10])
y = np.sin(2 * np.pi * x) + noise
grid = np.linspace(0, 1, 201)                      # where we compare with the true curve

for lam in [0, 1e-6, 1e-3, 1e-1, 1]:
    # solver="svd" stays exact even at lam = 0, where the 10 x 10 system is badly conditioned;
    # Ridge never penalises the intercept
    model = make_pipeline(PolynomialFeatures(9, include_bias=False), Ridge(alpha=lam, solver="svd"))
    model.fit(x[:, None], y)
    train = np.mean((model.predict(x[:, None]) - y) ** 2)
    truth = np.mean((model.predict(grid[:, None]) - np.sin(2 * np.pi * grid)) ** 2)
    print(f"lambda={lam:g}  train={train:.3f}  vs truth={truth:.3f}  max|w|={np.abs(model[-1].coef_).max():,.2f}")

# In practice: scale, then let cross-validation pick λ
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import RidgeCV, LassoCV
ridge = make_pipeline(StandardScaler(), RidgeCV(alphas=np.logspace(-4, 2, 13)))
lasso = make_pipeline(StandardScaler(), LassoCV(cv=5))            # weak features get coef_ == 0
```

scikit-learn's `Ridge` minimises ‖y − Xw‖² + α‖w‖², matching the table. `Lasso` minimises (1/2n)‖y − Xw‖² + α‖w‖₁, so an α in one library is not the same strength as the same number elsewhere.

## Other regularisers

- **Early stopping**: train by gradient descent, watch validation loss, and stop when it starts rising. Starting from small weights, fewer steps leave the weights less room to grow. For linear least squares this behaves much like an L2 penalty.
- **Dropout** (neural networks): during training, zero each hidden unit with probability p, so the network cannot rely on any single co-adapted path. At test time all units are used. Modern implementations scale activations by 1/(1 − p) during training so no rescaling is needed at test time.
- **Weight decay** is the deep-learning name for L2. With Adam, use the decoupled form (AdamW), because adding L2 to the gradient interacts badly with Adam's per-parameter step sizes.
- More data, data augmentation, smaller models, and pruning trees (max depth, min leaf size) are regularisers in the broad sense.

## Edge cases and pitfalls

- **Unscaled features** get penalised unevenly. Standardise first, inside a pipeline.
- **Don't penalise the intercept**, or the model is pulled towards predicting 0 instead of the mean. Most libraries leave it out by default.
- **Lasso with correlated features** keeps one of them more or less at random and drops the rest, and the choice can flip between resamples. Use elastic net if you need stability.
- **Selecting λ on the test set** is leakage. Use cross-validation on the training data.
- **Bayesian view**: L2 is the MAP estimate under a Gaussian prior on the weights, and L1 under a Laplace prior. Interviewers like this connection.

## In the interview

Expect "What is the difference between L1 and L2?" Draw the circle and the diamond, say "L1 gives sparse weights, so it selects features; L2 shrinks them smoothly and copes with correlated features", and give the soft-threshold vs divide-by-(1 + λ) formulas. Follow-ups: how to choose λ (cross-validation on a log grid), why scaling matters, and what you would do in a neural network (weight decay, dropout, early stopping, augmentation).
