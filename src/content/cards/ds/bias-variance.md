---
title: Bias–Variance
track: ds
tags: [generalisation, model-selection, fundamentals]
difficulty: 2
minutes: 4
tldr: "Test error = bias² + variance + noise; the model that fits the training data best is rarely the one that generalises best."
analogy: "Train the same model on many different samples and throw each one like a dart. Bias is how far the average dart lands from the bullseye; variance is how widely the darts scatter. You want them centred and tight."
diagram: bias-variance
story:
  - title: Model complexity against error
    text: "Picture fitting a curve to 20 noisy points. Across: how flexible the model is, from a straight line on the left to a degree-9 polynomial on the right. Up: error. We will draw two curves, one measured on the training points and one on fresh test points."
  - title: Training error falls forever
    text: "Every extra degree of freedom lets the model bend closer to the training points, so training error only goes down. A flexible enough model can drive it to zero by memorising every point, noise and all. Training error alone cannot tell you when to stop."
  - title: Test error falls, then rises
    text: "On fresh data the story changes. Error falls at first as the model captures the real pattern, bottoms out at the sweet spot, then climbs as the model starts fitting noise. That minimum is the model you want, not the one with the lowest training error."
  - title: The gap signals variance
    text: "The widening gap between the curves is the signature of variance: the fitted model changes a lot depending on which sample it saw. The dashed line is irreducible noise. For squared error, expected test error = bias² + variance + noise, so no model's test error gets below the noise."
  - title: "Left: underfit, high bias"
    text: "Left of the sweet spot the model is too simple, like a straight line through a curve. It makes the same mistake whatever sample it trains on: darts tightly grouped but off-centre. Symptom: training and test error both high and close together. Fix: a richer model or better features."
  - title: "Right: overfit, high variance"
    text: "Right of the sweet spot the model is too flexible. Retrain it on a new sample and it lands somewhere else: darts centred on average but scattered. Symptom: tiny training error, much larger test error. Fix: more data, regularisation, a simpler model or early stopping."
keyIdeas:
  - "**Bias** is error from wrong assumptions; **variance** is sensitivity to the particular training sample."
  - "**Irreducible noise** sets the floor. No model beats it."
  - "More data reduces variance, not bias."
  - "**Regularisation** deliberately buys bias to sell variance."
  - "Diagnose from two gaps: training error vs the target (bias), validation error vs training error (variance)."
quiz:
  - q: "Training error 15 %, validation error 16 %, and a human expert manages 2 %. What is the main problem?"
    options: ["High bias (underfitting)", "High variance (overfitting)", "Data leakage", "The validation set is too small"]
    answer: 0
    why: "Training and validation errors are close, so the model generalises what it learned. It just learned too little. The 13-point gap to the expert is bias. Fix it with a richer model or better features, not more data."
  - q: "Which change usually lowers variance but raises bias?"
    options: ["Adding more input features to the model", "Increasing the L2 penalty on large weights", "Training for more epochs on the same data", "Letting each decision tree grow deeper"]
    answer: 1
    why: "A stronger penalty shrinks the weights, so the fitted function can bend less: it reacts less to the particular sample (lower variance) but can no longer follow every real wiggle (higher bias). The other three all add flexibility."
  - q: "Over many training sets, a model's predictions at x average 2.9 with variance 0.02. The truth at x is 3.0 and the noise variance is 0.25. What is the expected squared error at x?"
    options: ["0.27", "0.28", "0.37", "1.27"]
    answer: 1
    why: "Bias = 2.9 − 3.0 = −0.1, so bias² = 0.01. Total = 0.01 + 0.02 + 0.25 = 0.28. Notice the noise dominates: this model is already near the floor."
  - q: "A 1-nearest-neighbour classifier is best described as…"
    options: ["High bias, low variance", "Low bias, high variance", "High bias, high variance", "Zero error on any data"]
    answer: 1
    why: "Averaged over many training sets, its prediction at x tracks the true local label closely (low bias), but each prediction hangs on a single neighbour, so swapping a few training points flips answers (high variance). Raising k averages more neighbours: more bias, less variance."
related: [ds/train-val-test, ds/cross-validation, ds/regularisation]
prereqs: []
flashcards:
  - kind: qa
    q: "You see 2 % training error and 18 % validation error. Bias or variance, and what do you do?"
    a: "Variance (overfitting). Get more data, regularise harder, simplify the model, or add augmentation (extra training variants, such as flipped images). A bigger model is the wrong move."
  - kind: cloze
    text: "Underfitting shows as {{high bias}}: training and validation error are both high and close together."
  - kind: qa
    q: "Will doubling the training data fix a high-bias model?"
    a: "Barely. A model too simple for the pattern stays wrong on average however much data it sees. More data shrinks variance; bias needs a more expressive model or better features."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine-learning tips and tricks, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The thought experiment behind the words

Bias and variance are not properties of one trained model. They describe what happens **across many possible training sets**. Imagine drawing 20 points from the same source again and again, training the same kind of model each time, and asking each trained model for a prediction at one fixed input x.

- The **true value** at x is f(x). Real labels are y = f(x) + noise, where the noise has variance σ² and nothing can predict it.
- The predictions f̂(x) differ from one training set to the next. Their **average** is written E[f̂(x)].
- **Bias** = E[f̂(x)] − f(x): how far the *average* prediction is from the truth. It comes from the model's built-in assumptions: a straight line cannot follow a sine wave however much data it gets.
- **Variance** = the average of (f̂(x) − E[f̂(x)])²: how much the predictions *swing* between training sets. It comes from flexibility. A model that can bend anywhere bends towards whatever noise its sample happened to have.

For squared-error loss these add up exactly:

> expected test error at x = bias² + variance + σ²

Why it adds up: write the error y − f̂(x) as three pieces: the noise, the fixed offset of the average prediction from the truth (bias), and the model's random wobble around its own average. Square and average. The cross terms vanish: the noise is independent of the training set, and the wobble averages to zero around its own mean. Only the three squares survive. For other losses (like 0–1 classification error) the decomposition is messier, but the trade-off behaves the same way.

## How the trade-off arises

Making a model more flexible (more features, higher polynomial degree, deeper trees, more layers, weaker regularisation) lets it represent more patterns, so bias falls. But it also gives it room to fit accidents of the sample, so variance rises. Test error, their sum plus noise, therefore falls and then rises: the U-shape in the diagram. Training error does not have a variance penalty (the model is scored on the very points it bent towards), so it only falls.

## Worked example

Three models predict at one point where the truth is 3.0, each trained on four different samples. Noise variance σ² = 0.25.

| Model | Predictions on 4 samples | Mean | bias² | variance | Expected error |
|---|---|---|---|---|---|
| A: too simple | 2.0, 2.2, 1.8, 2.0 | 2.0 | 1.00 | 0.02 | 1.27 |
| B: too flexible | 4.0, 1.6, 3.8, 2.6 | 3.0 | 0.00 | 0.94 | 1.19 |
| C: about right | 2.7, 3.1, 2.9, 2.9 | 2.9 | 0.01 | 0.02 | 0.28 |

Model A is consistently wrong (darts tight, off-centre). Model B is right *on average* but any single trained copy may be far off (darts centred, scattered). Model C pays a sliver of bias for a large cut in variance and wins by a factor of four.

## Measuring it by simulation

On synthetic data you know the true f, so you can run the thought experiment for real:

```text
repeat 300 times:
    draw a fresh training set of 20 noisy points
    fit the model; record its training error, its error on a big test set,
    and its prediction p at a probe point x0
bias²    = (mean of the 300 p values − f(x0))²
variance = mean of (p − mean p)²  over the 300 fits
```

## Implement it in Python

The simulation is plain loops and averages, so it ports to any language (R, Julia, MATLAB…). This version uses NumPy and scikit-learn's polynomial regression.

```python
import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

rng = np.random.default_rng(0)
f = lambda x: np.sin(2 * np.pi * x)             # the true pattern
NOISE_SD = 0.3                                   # irreducible noise: variance 0.09

def sample(n):
    x = rng.uniform(0, 1, n)
    return x[:, None], f(x) + rng.normal(0, NOISE_SD, n)

X_te, y_te = sample(2_000)                       # one big fresh test set
x0 = np.array([[0.25]])                          # a probe point where f(x0) = 1

for degree in [1, 3, 9]:
    train_mse, test_mse, at_x0 = [], [], []
    for _ in range(300):                         # 300 different training sets of 20 points
        X, y = sample(20)
        m = make_pipeline(PolynomialFeatures(degree), LinearRegression()).fit(X, y)
        train_mse.append(np.mean((m.predict(X) - y) ** 2))
        test_mse.append(np.mean((m.predict(X_te) - y_te) ** 2))
        at_x0.append(m.predict(x0)[0])
    at_x0 = np.array(at_x0)
    bias2 = (at_x0.mean() - 1.0) ** 2            # how far the AVERAGE prediction is off
    var = at_x0.var()                            # how much predictions swing between samples
    print(f"degree {degree}: train {np.mean(train_mse):.2f}  test {np.median(test_mse):.2f}  "
          f"| at x0: bias^2 {bias2:.3f}  variance {var:.3f}")
```

Output:

| Degree | Train MSE | Test MSE (median) | bias² at x0 | variance at x0 |
|---|---|---|---|---|
| 1 (line) | 0.25 | 0.32 | 0.260 | 0.034 |
| 3 | 0.07 | 0.11 | 0.000 | 0.016 |
| 9 | 0.05 | 0.33 | 0.000 | 0.119 |

The cubic sits just above the noise floor of 0.09. Degree 9 has the lowest training error and the worst test error. The test column uses the median because a few degree-9 fits swing so wildly near the edges of the data that their mean error is enormous. That is variance in its rawest form.

## Diagnosing and fixing

| Symptom | Diagnosis | Fixes that help |
|---|---|---|
| Train error high, validation close to it | High bias | Bigger or more flexible model, better features, less regularisation, train longer |
| Train error low, validation much higher | High variance | More data, augmentation, stronger regularisation, dropout, early stopping, simpler model, ensembling (bagging) |
| Both low and close | Good fit | Ship it, then watch for drift |

Note what is *not* in the bias row: more data. If a straight line cannot represent the pattern, a million points produce a very confident straight line.

## Edge cases and pitfalls

- **"Bias" here is not fairness bias** and not the `b` term of a linear model. Same word, different meanings.
- **Very large neural networks** can show "double descent": test error rises near the point where the model can just interpolate the data, then falls again as it grows further. The classic U is still the right mental model for most tabular problems and for regularisation decisions.
- **You never see the decomposition directly** on real data. You see training and validation error, and you use the gaps between them as proxies.
- **Noise is not always irreducible in practice:** label errors can be cleaned and missing features added. The floor is fixed only for a given set of inputs.

## In the interview

Expect "explain the bias–variance trade-off" or a diagnosis question with two numbers. Strong answers define both terms as properties *across training sets*, write the decomposition, and map each symptom to its fixes. A good follow-up to anticipate: *where does regularisation sit?* It deliberately adds bias to cut variance, and its strength is a hyperparameter you tune on validation data.
