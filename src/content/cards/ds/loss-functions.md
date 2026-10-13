---
title: Loss Functions
track: ds
tags: [optimisation, training, fundamentals]
difficulty: 2
minutes: 5
tldr: "A loss turns each mistake into a cost to minimise. Its shape is a choice: squared error chases the mean, absolute error the median, log-loss punishes confident mistakes."
analogy: "A loss is the fine schedule for a delivery service. Fine every late minute the same and drivers aim for the typical day; fine the square of the lateness and one disastrous delivery dominates every plan they make."
diagram: loss-functions
story:
  - title: Loss as a function of the error
    text: "Training needs one number that says how wrong the model is. Per example, a loss takes the error r = y − ŷ (actual minus predicted) and returns a cost. The training loss is the average cost over all examples, and the optimiser pushes it down."
  - title: "Squared error: big misses explode"
    text: "Squared error charges r². A miss of 1 costs 1, a miss of 10 costs 100. Its slope 2r grows with the error, so training works hardest on the biggest misses. Averaged, it is the mean squared error (MSE) behind least squares."
  - title: "Absolute error: every unit costs the same"
    text: "Absolute error charges |r|: a miss of 10 costs 10, ten times a miss of 1, no more. Its slope is always ±1, so one huge error pulls no harder than a small one. Averaged, it is the mean absolute error (MAE)."
  - title: "Huber: squared near 0, straight beyond δ"
    text: "Huber loss is ½r² while |r| ≤ δ and grows in a straight line beyond δ. Small errors get the smooth squared treatment; large ones are charged like MAE, so outliers cannot dominate. You choose δ in the units of the target."
  - title: "Mean vs median: one late delivery"
    text: "Predict one number for delivery times 10, 12, 14, 16 and 48 minutes. MSE is minimised by the mean, 20; MAE by the median, 14. The single late order drags the MSE answer 6 minutes away from every typical delivery."
  - title: "Classification: log-loss and hinge"
    text: "For classes, the margin m = y·score (y = ±1) is positive when the model is right. Log-loss, ln(1 + e^(−m)) = −ln p(true class), keeps rewarding more confidence and explodes on confident mistakes. Hinge, max(0, 1 − m), is zero once m ≥ 1 — the SVM loss."
keyIdeas:
  - "**The loss defines the target:** squared error estimates the conditional **mean**, absolute error the **median**, pinball loss any chosen quantile."
  - "**MSE** squares errors: smooth, but one outlier can dominate. **MAE** is robust but has a kink at 0. **Huber** gets both."
  - "**Log-loss (cross-entropy)** is −ln of the probability given to the true class: 0.11 at p = 0.9, 4.6 at p = 0.01."
  - "**Hinge** stops caring once a point is correct by a margin of 1, which is why SVMs depend only on support vectors."
  - "Train on a smooth **surrogate** (log-loss, hinge) because accuracy has no useful gradient; report the metric the business cares about."
quiz:
  - q: "Daily sales were 10, 11, 12, 13 and 200. Which single number minimises the mean absolute error?"
    options: ["49.2 (the mean)", "12 (the median)", "200", "Any number between 10 and 13"]
    answer: 1
    why: "MAE is minimised by the median, 12: moving away from it adds distance to more points than it removes. MSE would pick the mean, 49.2, pulled far up by the 200."
  - q: "Huber loss with δ = 1. What is the loss for an error of 3?"
    options: ["4.5", "3", "2.5", "9"]
    answer: 2
    why: "Beyond δ Huber is linear: δ(|r| − ½δ) = 1 × (3 − 0.5) = 2.5. Squared error would charge 9 (or 4.5 for ½r²)."
  - q: "A classifier gives a true spam email p(spam) = 0.01. What is its log-loss (natural log)?"
    options: ["0.01", "0.99", "About 4.6", "Infinite"]
    answer: 2
    why: "−ln 0.01 ≈ 4.61, compared with 0.105 for p = 0.9. Confident mistakes cost far more than hesitant ones; the loss only becomes infinite at p = 0."
  - q: "Why do SVMs ignore points that are correctly classified with margin ≥ 1?"
    options: ["They are deleted from the data", "Hinge loss is exactly zero there, so they add no gradient", "Log-loss is zero there", "Because of regularisation"]
    answer: 1
    why: "max(0, 1 − m) = 0 once m ≥ 1, so those points do not affect the solution. Only points on or inside the margin — the support vectors — shape the boundary. Log-loss is never exactly zero, so every point still pulls a little."
bigO:
  - { op: "squared r²", avg: "gradient 2r", note: "estimates the mean; outlier-sensitive" }
  - { op: "absolute |r|", avg: "gradient ±1", note: "estimates the median; kink at 0" }
  - { op: "Huber (δ)", avg: "gradient r, capped at ±δ", note: "robust and smooth" }
  - { op: "log-loss", avg: "gradient p − y", note: "with respect to the logit" }
  - { op: "hinge", avg: "gradient −y if m < 1, else 0", note: "SVM; no probabilities" }
bigOTitle: "Key numbers"
related: [ds/linear-regression, ds/logistic-regression, ds/svm-and-kernels, ds/maximum-likelihood]
prereqs: [ds/linear-regression]
flashcards:
  - kind: qa
    q: "Which constant prediction minimises MSE, and which minimises MAE?"
    a: "MSE: the mean of the targets. MAE: the median. That is why MSE is pulled by outliers and MAE is not."
  - kind: cloze
    text: "Binary log-loss is {{−[y ln p + (1 − y) ln(1 − p)]}}, and minimising it is the same as {{maximum likelihood}} for a Bernoulli model."
  - kind: qa
    q: "When would you choose Huber loss over MSE?"
    a: "When the target has occasional large errors or outliers you do not want to dominate the fit, but you still want a smooth loss near zero. δ sets where squared turns into linear."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised learning: loss functions" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What a loss is

A **loss function** L(y, ŷ) takes the true value y and the prediction ŷ for one example and returns a non-negative cost. Training minimises the **average loss** over the training set (often plus a regularisation penalty). The optimiser only ever sees this number and its gradient, so the loss is how you tell the model *what kind of wrong matters*.

Two related words: a **cost** or **objective** is the averaged (and possibly regularised) loss; a **metric** is what you report, such as accuracy or revenue. They need not be the same — accuracy has a zero gradient almost everywhere, so you train on a smooth **surrogate** like log-loss and report accuracy.

## Regression losses

Write the error as r = y − ŷ.

| Loss | Per example | Gradient with respect to ŷ | Best constant prediction |
|---|---|---|---|
| Squared (MSE when averaged) | r² | −2r | the mean |
| Absolute (MAE) | \|r\| | −sign(r) | the median |
| Huber with threshold δ | ½r² if \|r\| ≤ δ, else δ(\|r\| − ½δ) | −r, capped at ±δ | between the two |
| Pinball / quantile τ | τr if r ≥ 0, else (τ − 1)r | −τ or 1 − τ | the τ-quantile |

**Why the mean for squared error.** Predict one constant c for every row. The loss Σ(yᵢ − c)² has derivative −2Σ(yᵢ − c), which is zero when c = Σyᵢ / n — the mean.

**Why the median for absolute error.** The derivative of Σ|yᵢ − c| is (number of points below c) − (number above c). Moving c up helps while more points lie above it than below, so the minimum sits where the counts balance — the median.

The same logic holds for full models: a model trained with squared error estimates the **conditional mean** of y given x; with absolute error, the **conditional median**. Pick the one that matches the question. Delivery-time promises ("90 % of orders arrive within…") call for the 0.9 quantile, not the mean.

**Huber** keeps the smooth bowl near zero, which makes optimisation easy and stable, and switches to a straight line for large errors, so a single bad label pulls with force at most δ instead of a force proportional to its size. **RMSE**, the square root of MSE, has the same minimiser as MSE and is just reported in the target's units.

## Worked example

Delivery times y = [10, 12, 14, 16, 48] minutes. Compare predicting the median (14) and the mean (20) for every order:

| Prediction c | Errors y − c | MSE | MAE | Huber, δ = 5 |
|---|---|---|---|---|
| 14 (median) | −4, −2, 0, 2, 34 | (16 + 4 + 0 + 4 + 1156) / 5 = **236** | 42 / 5 = **8.4** | 33.9 |
| 20 (mean) | −10, −8, −6, −4, 28 | (100 + 64 + 36 + 16 + 784) / 5 = **200** | 56 / 5 = **11.2** | 43.6 |

Each loss prefers its own answer: MSE likes 20, MAE likes 14. Huber with δ = 5 is minimised at 14.25 — at that point the four normal errors (−4.25, −2.25, −0.25, 1.75) sum to −5, exactly balanced by the outlier's capped pull of +5. The 48-minute order moves the MSE answer by 6 minutes but Huber's by a quarter of a minute.

## Classification losses

For a binary label y ∈ {0, 1} and predicted probability p = P(y = 1):

**Log-loss** (binary **cross-entropy**): L = −[y ln p + (1 − y) ln(1 − p)], which is just −ln(probability given to the true class).

| p(true class) | 0.9 | 0.6 | 0.2 | 0.01 |
|---|---|---|---|---|
| log-loss | 0.105 | 0.511 | 1.609 | 4.605 |

It is the negative log-likelihood of a Bernoulli model, so minimising it is **maximum likelihood**; it rewards well-calibrated probabilities, and for logistic regression its gradient with respect to the score is simply p − y. With K classes, **categorical cross-entropy** is −ln p(true class) over a softmax.

**Margin view.** Recode labels as y ∈ {−1, +1}, let the model output a score z and define the **margin** m = y·z: positive when the sign is right, larger when more confident. Then log-loss is ln(1 + e^(−m)) (with p = σ(z)), and the **hinge loss** of support vector machines is max(0, 1 − m). The **0–1 loss** (1 if m < 0, else 0) is what accuracy counts, but it is flat almost everywhere, so both are used as smooth or convex stand-ins.

| | Log-loss | Hinge |
|---|---|---|
| Correct with big margin | small but never 0 | exactly 0 once m ≥ 1 |
| Badly wrong (m = −4.6) | ≈ 4.61, grows about linearly | 5.6, grows linearly |
| Outputs probabilities | yes | no, only a score |
| Model | logistic regression, neural nets | SVM |

## Choosing a loss = choosing what wrong costs

- **Are big errors disproportionately bad?** (a bridge load estimate) — squared error. **Is a 20-minute miss just twice as bad as 10?** — absolute error.
- **Dirty labels or heavy tails?** — Huber, or MAE.
- **Under- and over-prediction cost differently?** (stocking shelves: an empty shelf loses more than leftover stock) — pinball loss at the right quantile, or a custom asymmetric loss.
- **Need probabilities to rank, threshold or price risk?** — log-loss. **Only need the boundary?** — hinge works.
- **Imbalanced classes?** — weight the loss per class, or use focal loss, rather than letting the majority class dominate the average.

## In code

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, log_loss, hinge_loss

def huber(r, delta):
    a = np.abs(r)                                   # quadratic inside delta, linear outside
    return np.where(a <= delta, 0.5 * r**2, delta * (a - 0.5 * delta))

y = np.array([10, 12, 14, 16, 48], dtype=float)     # delivery times in minutes
for c in (14, 20):                                  # one constant prediction for every order
    pred = np.full_like(y, c)
    print(c, mean_squared_error(y, pred), mean_absolute_error(y, pred),
          huber(y - pred, 5).mean())                # 14: 236 8.4 33.9 | 20: 200 11.2 43.6

labels = np.array([1, 1, 0, 0])                     # true classes
z = np.array([2.2, 0.4, -1.4, 4.6])                 # model scores (log-odds)
p = 1 / (1 + np.exp(-z))                            # sigmoid: P(class 1) ≈ [0.9, 0.6, 0.2, 0.99]
print(log_loss(labels, p))                          # ≈ 1.36, mostly the confident mistake (4.61)

m = np.where(labels == 1, 1, -1) * z                # margins: [2.2, 0.4, 1.4, -4.6]
print(np.maximum(0, 1 - m), hinge_loss(labels, z))  # [0, 0.6, 0, 5.6], mean 1.55
```

## Edge cases and pitfalls

- **MAE's kink at zero** makes plain gradient descent jitter around the optimum; Huber or a decaying learning rate fixes it.
- **Log-loss and p = 0 or 1:** −ln 0 is infinite. Libraries clip p to [ε, 1 − ε]; compute from logits (`BCEWithLogits`-style) to stay numerically stable.
- **Scale matters.** MSE is in squared target units, so it is not comparable across datasets; compare RMSE, MAE or R².
- **Outliers vs signal:** a robust loss is right when the extremes are errors, wrong when they are exactly the cases you must predict (fraud, peak load).
- **Squared error on probabilities** (Brier score) is a fine metric, but as a training loss for logistic models its gradients vanish on confident mistakes; cross-entropy does not.

## In the interview

Common prompts: "MSE vs MAE?", "why cross-entropy for classification?", "what does hinge loss do?". A strong answer ties each loss to what it estimates (mean, median, quantile, probability), shows the outlier effect with a tiny example, and mentions gradients (2r grows; ±1 is constant; p − y for log-loss). Expect a follow-up like "your target has a few huge values — what do you do?": Huber or MAE, a log transform of y, or check whether those values are errors.
