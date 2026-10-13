---
title: Probability Calibration
track: ds
tags: [classification, probability, evaluation, metrics]
difficulty: 2
minutes: 5
tldr: "Calibrated probabilities come true at the stated rate: of emails scored 0.8, about 80 % are spam. Check with a reliability diagram; fix with Platt scaling or isotonic regression."
analogy: "A weather forecaster who says '70 % chance of rain' should see rain on about 7 of every 10 such days. A forecaster who says 90 % and is right only 75 % of the time ranks days fine but cannot be taken at their word."
diagram: calibration
story:
  - title: "Calibrated: 0.8 means 8 in 10"
    text: "A spam model gives ten emails a score of 0.8. If eight of them really are spam, the score means what it says. Calibration asks this of every score: among all predictions near p, about a fraction p should turn out positive."
  - title: The reliability diagram
    text: "To check, group predictions into bins (0–0.2, 0.2–0.4, …) and plot each bin's average predicted probability against the share that was actually positive. A calibrated model lies on the diagonal. This plot is the reliability diagram, or calibration curve."
  - title: An overconfident model
    text: "This model is too sure of itself. Emails it scores 0.9 are spam only 75 % of the time, and those it scores 0.1 are spam 25 % of the time: the curve is flatter than the diagonal. Its ranking can still be perfect — ROC AUC only looks at the order of scores, so it cannot see this."
  - title: "Score it: Brier and log-loss"
    text: "Two scoring rules grade probabilities directly. The Brier score is the mean squared gap between p and the 0/1 outcome: these five emails give 0.59 / 5 = 0.118. Log-loss averages −ln of the probability given to what actually happened: 0.372. Both are dominated by one confident miss, 0.7 on a good email."
  - title: "Fix it: Platt scaling or isotonic"
    text: "Recalibration learns the red curve on data the model never trained on, then re-maps every score. Platt scaling fits a sigmoid σ(a·z + b) to the model's log-odds z; here it finds a = 0.5, b = 0, turning 0.9 into 0.75. Isotonic regression fits any increasing step function: more flexible, but it needs more data."
keyIdeas:
  - "**Calibrated** means of all predictions near p, about p are positive. Check with a **reliability diagram** (predicted vs observed, per bin)."
  - "Calibration is not ranking: ROC AUC is unchanged by any order-preserving re-mapping, so a high-AUC model can be badly calibrated."
  - "**Brier score** and **log-loss** are proper scoring rules: they reward probabilities that are both calibrated and sharp."
  - "**Platt scaling** (2 parameters) suits small calibration sets; **isotonic regression** fits any monotone shape but overfits with few hundred points. Always fit on held-out data."
  - "Typical drift: naive Bayes and large neural nets are **overconfident**; random forests keep away from 0 and 1; resampling and class weights inflate the rare class."
quiz:
  - q: "A forecaster is perfectly calibrated. Over 200 days on which they said '30 % chance of rain', about how many had rain?"
    options: ["30", "60", "140", "It cannot be known from calibration"]
    answer: 1
    why: "Calibration means the stated probability matches the observed frequency: 30 % of 200 days is 60 days."
  - q: "You apply Platt scaling (a > 0) to a model with ROC AUC 0.90. What happens to its AUC?"
    options: ["It stays 0.90", "It rises towards 1.0", "It falls towards 0.5", "It becomes undefined"]
    answer: 0
    why: "σ(a·z + b) with a > 0 is strictly increasing, so the order of scores — all AUC depends on — is unchanged. Only the probability values move. (Isotonic regression can merge scores into ties and nudge AUC slightly.)"
  - q: "Five emails, two of them spam. A lazy model predicts 0.4 for every email. What is its Brier score?"
    options: ["0.16", "0.24", "0.36", "0.40"]
    answer: 1
    why: "Spam emails: (0.4 − 1)² = 0.36 each; good emails: (0.4 − 0)² = 0.16 each. (2 × 0.36 + 3 × 0.16) / 5 = 1.20 / 5 = 0.24 — worse than the story model's 0.118, though this lazy model is perfectly calibrated on average."
  - q: "You have only 300 held-out examples to calibrate a gradient-boosted model. Which method is the safer choice?"
    options: ["Isotonic regression", "Platt scaling", "Retrain with class weights", "No calibration is possible"]
    answer: 1
    why: "Platt scaling estimates just two numbers, so 300 points are plenty. Isotonic regression fits a free-form step function and tends to overfit below roughly a thousand calibration points."
related: [ds/logistic-regression, ds/precision-recall-roc, ds/class-imbalance, ds/loss-functions]
prereqs: [ds/logistic-regression]
flashcards:
  - kind: qa
    q: "What is the difference between calibration and discrimination?"
    a: "Discrimination is ranking positives above negatives (measured by ROC AUC). Calibration is whether the probability values match observed frequencies (reliability diagram, Brier, log-loss). A model can have either without the other."
  - kind: cloze
    text: "Platt scaling fits a {{sigmoid}} to held-out scores; isotonic regression fits a {{monotone step function}}."
  - kind: qa
    q: "Why must a calibrator be fitted on data the model was not trained on?"
    a: "On its own training data a model looks more certain and more correct than it really is, so a calibrator fitted there learns to keep the overconfidence."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What calibration means

A classifier usually outputs a score between 0 and 1. It is **calibrated** if that score can be read as a frequency: among all cases that get score p, a fraction p is positive. Formally, P(Y = 1 | p̂ = p) = p for every p.

Calibration is a different property from **discrimination**, the ability to rank positives above negatives. ROC AUC measures discrimination and ignores calibration entirely: double every log-odds and the ranking — and the AUC — stay the same, while the probabilities become far too extreme. The opposite failure also exists: a model that predicts the base rate (say 0.4) for everyone is calibrated on average yet useless, because it is not **sharp**. Good probabilities are calibrated *and* sharp.

Calibration matters whenever the number itself is used: choosing a threshold from costs (flag if p > C_FP / (C_FP + C_FN)), computing expected revenue or risk, combining models, or showing a risk score to a doctor or customer. If you only ever rank (show the top 10 results), it matters much less.

## Reading a reliability diagram

1. Sort held-out predictions into bins, for example five of width 0.2.
2. For each bin, compute the mean predicted probability (x) and the observed share of positives (y).
3. Plot the points with the diagonal y = x as reference, ideally with a histogram of how many predictions fall in each bin.

```text
for each bin b in [0, 0.2), [0.2, 0.4), …, [0.8, 1.0]:
    rows = held-out predictions whose p falls in b
    x_b  = average p over rows                 # what the model claimed
    y_b  = share of rows whose label is 1      # what actually happened
    plot point (x_b, y_b), labelled with count(rows)
draw the diagonal y = x; calibrated points sit on it
```

| Shape | Meaning |
|---|---|
| on the diagonal | calibrated |
| below the diagonal at high p, above at low p (flatter) | **overconfident**: predictions too close to 0 and 1 |
| above at high p, below at low p (steeper) | **underconfident**: predictions huddle near the middle |
| entirely below / above | systematically over- / under-predicts positives (often a prevalence shift) |

The story's model says 0.1, 0.3, 0.5, 0.7, 0.9 where the truth is 0.25, 0.40, 0.50, 0.60, 0.75 — exactly what happens when a model's log-odds are twice as large as they should be. A one-number summary is the **expected calibration error**, ECE = Σ (n_b / N) · |observed_b − predicted_b| over bins b. With equal-sized bins here, ECE = (0.15 + 0.096 + 0 + 0.096 + 0.15) / 5 ≈ 0.098. ECE depends on the binning, so report it together with the plot.

## Worked example: Brier score and log-loss

Five emails, two of them spam:

| p (spam) | truth y | (p − y)² | −ln(prob. of truth) |
|---|---|---|---|
| 0.9 | 1 | 0.01 | −ln 0.9 = 0.105 |
| 0.8 | 1 | 0.04 | −ln 0.8 = 0.223 |
| 0.7 | 0 | 0.49 | −ln 0.3 = 1.204 |
| 0.2 | 0 | 0.04 | −ln 0.8 = 0.223 |
| 0.1 | 0 | 0.01 | −ln 0.9 = 0.105 |
| **mean** | | **Brier = 0.118** | **log-loss = 0.372** |

The confident miss (0.7 on a good email) supplies 83 % of the Brier total and 65 % of the log-loss total. A lazy model that predicts the base rate 0.4 for everyone scores Brier 0.24 and log-loss 0.673 — worse on both, even though it is calibrated on average, because it is not sharp.

Both are **proper scoring rules**: your expected score is best when you report your true belief, so neither can be gamed by shading probabilities. Brier is bounded (0 to 1) and gentle; log-loss is unbounded and punishes confident mistakes harshly (−ln 0.01 = 4.6). The Brier score splits into *reliability* (calibration error) − *resolution* (sharpness) + *uncertainty* (how hard the problem is), which is why a better Brier score can come from either fixing calibration or sharpening predictions.

## Fixing it: recalibration

Keep the trained model and learn a monotone function g that maps its score to a calibrated probability, using data the model did not train on (a separate calibration split, or cross-validation folds).

- **Platt scaling**: fit a one-feature logistic regression p′ = σ(a·z + b), where z is the model's score or log-odds. Two parameters, so it works with a few hundred points, and it fixes the common sigmoid-shaped distortion. For the story's model, a = 0.5 and b = 0 halve the log-odds and repair it exactly.
- **Temperature scaling**: Platt with b = 0 and a = 1/T, applied to a neural network's logits. A single parameter, it is the standard fix for overconfident deep nets and cannot change which class is predicted.
- **Isotonic regression**: fit the best non-decreasing step function (pool-adjacent-violators algorithm). It can fix any monotone distortion, but it needs roughly a thousand or more calibration points or it overfits, and it maps ranges of scores to the same value, creating ties.

```text
split labelled data: TRAIN (fit the model) and CALIBRATE (fit g)
z = model scores on CALIBRATE
Platt:     fit a, b to minimise log-loss of σ(a·z + b) against the CALIBRATE labels
Isotonic:  fit the non-decreasing step function g(z) closest (squared error) to the labels
at prediction time: p_calibrated = g(model score)
```

## Which models drift, and why

| Model | Typical behaviour | Why |
|---|---|---|
| Logistic regression | usually well calibrated | it directly minimises log-loss |
| Naive Bayes | overconfident (pushed to 0 and 1) | it multiplies evidence from correlated features as if independent |
| Large neural networks | often overconfident | they keep driving training log-loss down by inflating logits |
| Random forests | underconfident near 0 and 1 | averaging many trees rarely produces all-agree votes |
| SVMs | scores are not probabilities at all | they output a margin; Platt scaling was invented for them |
| Any model trained with resampling or class weights | over-predicts the rare class | the training prior was changed on purpose |

## Implement it in Python

The same recipe works in any language or ML library: fit the model, fit a monotone map on held-out scores, re-map. Here it uses scikit-learn.

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score

X, y = make_classification(n_samples=20_000, n_features=20, n_informative=3, n_redundant=10,
                           flip_y=0.05, random_state=0)   # redundant = correlated features
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, random_state=0)

models = {
    "raw NB": GaussianNB(),                    # assumes independent features -> overconfident
    "Platt": CalibratedClassifierCV(GaussianNB(), method="sigmoid", cv=5),
    "isotonic": CalibratedClassifierCV(GaussianNB(), method="isotonic", cv=5),
}
for name, model in models.items():
    p = model.fit(X_tr, y_tr).predict_proba(X_te)[:, 1]
    print(f"{name:9s} Brier {brier_score_loss(y_te, p):.3f}  log-loss {log_loss(y_te, p):.3f}"
          f"  ROC AUC {roc_auc_score(y_te, p):.3f}")

# Reliability diagram data for the raw model: mean prediction vs share positive per bin
frac_pos, mean_pred = calibration_curve(y_te, models["raw NB"].predict_proba(X_te)[:, 1], n_bins=5)
for mp, fp in zip(mean_pred, frac_pos):
    print(f"predicted {mp:.2f} -> actually positive {fp:.2f}")
```

Output: raw naive Bayes — Brier 0.165, log-loss 0.759; Platt — 0.141 and 0.447; isotonic — 0.125 and 0.396. ROC AUC stays at about 0.90 throughout: recalibration fixes the numbers, not the ranking. The raw model's top bin predicts 0.98 on average but only 79 % of those cases are positive. `CalibratedClassifierCV` fits the model and the calibrator on different folds, so the calibrator never sees predictions on the model's own training rows; `method="sigmoid"` is Platt scaling. Other useful pieces: `calibration_curve(..., strategy="quantile")` gives bins with equal counts, `CalibrationDisplay` draws the reliability diagram, and `IsotonicRegression` can be used on its own.

## Edge cases and pitfalls

- **Never calibrate on training predictions** — they are overconfident by construction. Use a held-out split or cross-validation.
- **Bins with few points are noisy.** Show counts per bin; with small data use fewer bins, or quantile bins that each hold the same number of predictions.
- **Calibration is tied to the base rate.** If spam is 10 % in validation and 2 % in production, a calibrated model becomes over-predicting. Recalibrate after prevalence shifts.
- **Accuracy and calibration move separately**: recalibration can change which side of 0.5 a score falls on, so accuracy at threshold 0.5 can shift slightly even though ranking does not.
- **Multiclass**: use temperature scaling on the logits, or one-vs-rest calibration followed by renormalising so probabilities sum to 1.

## In the interview

Expect "your model outputs 0.9 — can we tell the customer there is a 90 % chance?" A strong answer separates ranking from calibration, draws a reliability diagram, names Brier or log-loss as the metric, proposes Platt scaling (small data) or isotonic regression (lots of data) fitted on held-out data, and notes which models are usually miscalibrated. Common follow-up: "does calibration change AUC?" — not for a strictly increasing map like Platt; isotonic can create ties.
