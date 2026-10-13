---
title: Logistic Regression
track: ds
tags: [classification, linear-models, probability]
difficulty: 2
minutes: 4
tldr: "Score the input with a weighted sum z = w·x + b, squash it with the sigmoid into a probability, and cut at a threshold. The boundary z = 0 is a straight line."
analogy: "A dimmer switch instead of an on/off switch. Evidence for and against spam pushes the dial up or down (the score); the sigmoid turns the dial into a brightness between 0 and 1, and you call it 'on' past half-way."
diagram: logistic-regression
story:
  - title: A linear score can be any number
    text: "Is this email spam? A linear model scores it: z = w·x + b, a weighted sum of features such as the number of links and the share of CAPITALS, plus a bias b. Larger z means more spam-like, but z is not a probability — it can be −7 or 12."
  - title: The sigmoid squashes it into 0…1
    text: "Pass the score through the sigmoid, σ(z) = 1 / (1 + e^(−z)). Large positive z makes e^(−z) almost 0, so σ ≈ 1; large negative z makes e^(−z) huge, so σ ≈ 0. The output always lies strictly between 0 and 1, and we read it as P(spam | email)."
  - title: Read off probabilities
    text: "σ(0) = 1 / (1 + 1) = 0.5 exactly. σ(2) = 1 / (1 + 0.135) ≈ 0.88 and σ(−1) = 1 / (1 + 2.718) ≈ 0.27. The curve is steepest at z = 0, where a small change in the score moves the probability the most."
  - title: Threshold at 0.5
    text: "For a yes/no answer, compare p with a threshold, usually 0.5. Because σ only ever increases and σ(0) = 0.5, the rule p ≥ 0.5 is exactly the rule z ≥ 0. Raise or lower the threshold to trade precision against recall."
  - title: "In feature space: a straight line"
    text: "So the decision boundary is every point where w·x + b = 0 — a straight line with two features, a flat plane with more. Logistic regression is a linear classifier: classes that need a curved boundary are out of reach unless you add features such as x₁² or x₁·x₂."
  - title: "Log-loss: punish confident mistakes"
    text: "Training picks w and b to minimise log-loss: −ln of the probability given to the true class. For a spam email, p = 0.88 costs 0.13, p = 0.27 costs 1.31, and a confident wrong p = 0.01 costs 4.61. Confident mistakes cost the most."
keyIdeas:
  - "**Linear score, sigmoid squash:** p = σ(w·x + b), where σ(z) = 1 / (1 + e^(−z))."
  - "The boundary w·x + b = 0 is a **line or hyperplane** — logistic regression is a linear classifier."
  - "The score is the **log-odds**: ln(p / (1 − p)) = z, so one unit of feature j multiplies the odds by e^(wⱼ)."
  - "Trained by minimising **log-loss** (cross-entropy). It is convex, so gradient descent reaches the global minimum."
  - "The gradient is just (p − y)·x per example: error times input."
quiz:
  - q: "For one email the model computes w·x + b = 3. Roughly what probability of spam does it output?"
    options: ["0.75", "0.95", "0.99", "3"]
    answer: 1
    why: "σ(3) = 1 / (1 + e^(−3)) = 1 / (1 + 0.0498) ≈ 0.953. A score of 3 is strong evidence, but not certainty."
  - q: "Which decision boundary can plain logistic regression on two raw features (x₁, x₂) draw?"
    options: ["A circle around the positive class", "A straight line", "Any smooth curve", "Two parallel lines"]
    answer: 1
    why: "The boundary is where w₁x₁ + w₂x₂ + b = 0 — the equation of a line. A circle needs extra features such as x₁² and x₂²."
  - q: "The weight on 'number of links' is 0.7. What does one extra link do, other features fixed?"
    options: ["Adds 0.7 to the probability", "Multiplies the odds of spam by e^0.7 ≈ 2.0", "Adds 70 % to the probability", "Nothing unless p is already above 0.5"]
    answer: 1
    why: "The score is the log-odds, so +0.7 in z multiplies p / (1 − p) by e^0.7 ≈ 2.01. The change in probability itself depends on where you start on the S-curve."
  - q: "A spam email gets p = 0.01. What is its log-loss, and why does that matter?"
    options: ["0.01 — tiny, so ignore it", "About 4.6 — confident mistakes dominate the loss", "0.99 — one minus p", "Infinite — the model is broken"]
    answer: 1
    why: "−ln(0.01) ≈ 4.61, versus 0.13 for a correct p = 0.88. Log-loss grows without limit as the probability of the true class goes to 0, so training works hardest to fix confident errors."
related: [ds/linear-regression, ds/loss-functions, ds/precision-recall-roc, ds/calibration]
prereqs: [ds/gradient-descent]
flashcards:
  - kind: qa
    q: "Why is logistic regression called a linear classifier when the sigmoid is non-linear?"
    a: "The sigmoid only rescales the score. The decision p ≥ 0.5 is equivalent to w·x + b ≥ 0, so the boundary is a hyperplane."
  - kind: cloze
    text: "σ(0) = {{0.5}}, and the logistic-regression score z equals the {{log-odds}} ln(p / (1 − p))."
  - kind: qa
    q: "What loss does logistic regression minimise, and what is its gradient for one example?"
    a: "Log-loss, −[y ln p + (1 − y) ln(1 − p)]. Its gradient with respect to w is (p − y)·x, and with respect to b it is p − y."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised learning: logistic regression" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why not plain linear regression?

Suppose you label spam as 1 and not-spam as 0 and fit an ordinary straight line. Its outputs run off past 1 and below 0, so they cannot be probabilities, and a few extreme emails (one with 300 links) drag the whole line around. We want something that stays linear in the features — fast, interpretable — but outputs a number between 0 and 1. Logistic regression gets there in two moves: a **linear score**, then a **squashing function**.

## How it works

1. **Score.** For an input with features x = (x₁, …, xₙ), compute z = w₁x₁ + … + wₙxₙ + b = w·x + b. Each **weight** wⱼ says how much feature j pushes towards the positive class; the **bias** b is the score when every feature is 0.
2. **Squash.** p = σ(z) = 1 / (1 + e^(−z)). The **sigmoid** (also called the logistic function) maps −∞…+∞ smoothly onto 0…1, is symmetric around σ(0) = 0.5, and satisfies σ(−z) = 1 − σ(z).
3. **Decide.** Predict positive when p ≥ threshold. With threshold 0.5 this is the same as z ≥ 0.

### What the score means: log-odds

The **odds** of an event are p / (1 − p): p = 0.8 means odds of 4 to 1. Solve p = 1 / (1 + e^(−z)) for z and you get

> z = ln(p / (1 − p))

So the linear score *is* the log of the odds. That gives the weights a precise meaning: increasing feature j by one unit adds wⱼ to the log-odds, which **multiplies the odds by e^(wⱼ)**. This interpretability is why logistic regression is still everywhere in medicine, credit scoring and A/B-test analysis.

## Training: log-loss

For one example with true label y ∈ {0, 1} and predicted p:

> log-loss = −[y·ln p + (1 − y)·ln(1 − p)]

Only one term is active: if y = 1 the loss is −ln p, if y = 0 it is −ln(1 − p). It is 0 for a perfect confident answer and grows without limit as the model becomes confidently wrong. It is also exactly the negative log-likelihood of the labels, so minimising it is **maximum-likelihood** estimation.

Two facts make training pleasant:

- The average log-loss is **convex** in w and b — one bowl, no bad local minima.
- Its gradient is tiny to write: **∂loss/∂w = (p − y)·x** and **∂loss/∂b = p − y**. The error (p − y) times the input, the same shape as linear regression's gradient.

There is no closed-form solution, so you iterate. Batch gradient descent in pseudocode:

```text
w = zeros;  b = 0
repeat until the loss stops falling:
    p = σ(X·w + b)                 # predicted P(y = 1) for every row
    w = w − η · Xᵀ(p − y) / n      # mean of (p − y)·x
    b = b − η · mean(p − y)
```

Libraries usually use faster quasi-Newton methods such as L-BFGS, but they minimise the same convex loss and land on the same answer.

## Worked example

Weights w = (0.8 per link, 3.0 per unit of CAPS share), bias b = −4.

| Email | links | CAPS share | z = 0.8·links + 3·caps − 4 | p = σ(z) | Prediction |
|---|---|---|---|---|---|
| A | 5 | 0.5 | 4 + 1.5 − 4 = 1.5 | 0.82 | spam |
| B | 1 | 0.1 | 0.8 + 0.3 − 4 = −2.9 | 0.05 | not spam |

Each extra link multiplies the odds of spam by e^0.8 ≈ 2.23.

Now one gradient step on email A, whose true label is spam (y = 1): the error is p − y = 0.818 − 1 = −0.182. The gradients are −0.182 × 5 = −0.91 for the links weight, −0.182 × 0.5 = −0.091 for the CAPS weight and −0.182 for b. With learning rate 0.1, each parameter moves *against* its gradient: the links weight rises to 0.891, the CAPS weight to 3.009 and b to −3.982. The model now scores A slightly higher — exactly the nudge an under-confident correct answer should get.

## Implement it in Python

The loop above is a dozen lines in any language, and every stats package ships a fitted version (R's `glm(family = binomial)`, Julia's GLM.jl, Spark MLlib…). Here it is from scratch with NumPy, checked against scikit-learn:

```python
import numpy as np
from sklearn.linear_model import LogisticRegression

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def log_loss(y, p):
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

def fit(X, y, eta=0.5, steps=5000):
    w, b = np.zeros(X.shape[1]), 0.0
    for _ in range(steps):
        p = sigmoid(X @ w + b)                   # predicted P(y = 1) for every row
        w -= eta * X.T @ (p - y) / len(y)        # gradient of the mean log-loss: mean of (p − y)·x
        b -= eta * np.mean(p - y)
    return w, b

rng = np.random.default_rng(0)
X = rng.normal(size=(500, 2))                    # two features
y = (X[:, 0] + 2 * X[:, 1] + rng.normal(0, 1, 500) > 0).astype(float)

w, b = fit(X, y)
p = sigmoid(X @ w + b)
print("from scratch:", w.round(2), round(b, 2), "log-loss", round(log_loss(y, p), 3),
      "accuracy", np.mean((p >= 0.5) == y))

sk = LogisticRegression(C=np.inf).fit(X, y)    # C=inf: no regularisation
print("scikit-learn:", sk.coef_[0].round(2), sk.intercept_.round(2))
```

Both print weights [2.0, 3.4] and bias 0.27 (log-loss 0.305, accuracy 0.872): the same convex problem has one answer, whichever optimiser finds it. Note that scikit-learn's `LogisticRegression` applies an L2 penalty with `C = 1.0` by default (smaller C = stronger penalty); `C=np.inf` switches it off to match the plain loss.

## More than two classes

**Softmax regression** (multinomial logistic regression) gives each class k its own score zₖ = wₖ·x + bₖ and turns the scores into probabilities with softmax: pₖ = e^(zₖ) / Σⱼ e^(zⱼ). With two classes it reduces exactly to the sigmoid.

## Edge cases and pitfalls

- **Many libraries regularise by default**, usually with an L2 penalty. Know which penalty and strength you are getting, and scale your features so the penalty treats them fairly.
- **Perfectly separable data** makes unregularised weights grow without bound: pushing p ever closer to 0 and 1 keeps shrinking the loss. Regularisation keeps them finite.
- **Linear boundary only.** Add interaction or polynomial features, or use trees or neural networks, when the classes curl around each other.
- **Imbalanced classes:** 0.5 is rarely the right threshold. Choose it from the precision–recall trade-off, or use class weights.
- **Correlated features** make individual weights unstable and hard to interpret, even when predictions are fine.

## In the interview

Expect "derive the logistic regression loss", "why is it a linear classifier?", or "interpret this coefficient". Strong answers write p = σ(w·x + b), show that z is the log-odds, write log-loss and its gradient (p − y)·x, and mention convexity and regularisation. Likely follow-up: *how is this related to a neural network?* — it is a single neuron with a sigmoid activation trained with cross-entropy.
