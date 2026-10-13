---
title: Class Imbalance
track: ds
tags: [classification, imbalance, evaluation, metrics]
difficulty: 2
minutes: 5
tldr: "When one class is rare, accuracy rewards ignoring it. Measure the rare class (PR-AUC, recall at a precision), rebalance only the training data or the loss, and choose the threshold from costs."
analogy: "An airport scanner that waves every bag through is right 99.99 % of the time and useless. You judge it by the dangerous bags it finds and the false alarms it raises — and you set its sensitivity by what a miss costs."
diagram: class-imbalance
story:
  - title: "99 to 1: accuracy lies"
    text: "A bank sees 10,000 transactions; 100 are fraud. A 'model' that always answers legit is right 9,900 times: 99 % accuracy. It also catches no fraud at all. When one class is 99 % of the data, accuracy mostly measures how common that class is."
  - title: A useful model scores lower
    text: "A real model flags 270 transactions: 70 of the 100 frauds plus 200 false alarms. Its accuracy is (70 + 9,700) / 10,000 = 97.7 % — worse than doing nothing. Yet its recall is 0.70 and its precision 70 / 270 = 0.26. Imbalanced problems need metrics about the rare class."
  - title: "Measure the rare class: the PR curve"
    text: "Plot precision against recall for every threshold. Random scores give precision 0.01, the fraud rate, so the area under this curve (PR-AUC, or average precision) has an honest floor. Targets tied to operations work well too: recall at precision ≥ 0.5, or precision at 80 % recall."
  - title: Resample the training split only
    text: "To give the model more fraud to learn from, rebalance the training rows: drop legit rows (undersampling), repeat fraud rows (oversampling), or synthesise fraud with SMOTE, which adds a point on the line between two nearby fraud cases. Split first: validation and test data must keep the real 99 : 1 ratio, or every metric is fiction."
  - title: "Class weights: make each class count equally"
    text: "Or leave the data alone and reweight the loss. 'Balanced' class weights give each row n / (2 × class count): 0.505 per legit row and 50 per fraud row, so each class contributes 5,000 to the loss. Missing one fraud now costs the model 99 times as much as one false alarm."
  - title: Move the threshold to match the costs
    text: "The decision itself is the threshold, and 0.5 is rarely right. If a missed fraud costs £500 and a false alarm £5, flagging pays when p × 500 > (1 − p) × 5, so flag when p > 5 / 505 ≈ 0.01 (this needs calibrated p). The most reliable fix of all is more real fraud examples."
keyIdeas:
  - "With 99 : 1 classes, **accuracy is useless**: always predicting the majority scores 99 %."
  - "Report **PR-AUC** (average precision), recall at a fixed precision, or expected cost — metrics centred on the rare class."
  - "**Resample only the training split** (under, over, SMOTE) — inside each cross-validation fold. Validation and test keep the true ratio."
  - "**Class weights** reweight the loss instead of the data. Both tricks mostly shift scores and distort probabilities; recalibrate if you need them."
  - "The **threshold** is the real decision knob: set it from costs or a recall target on validation data. More real minority data beats every trick."
quiz:
  - q: "On 10,000 transactions (100 fraud), model A always says 'legit'; model B catches 70 frauds with 200 false alarms. Which statement is true?"
    options: ["A is better: 99 % vs 97.7 % accuracy", "B is better: recall 0.70 vs 0, and accuracy is the wrong yardstick", "They are equal because both make mistakes", "Neither can be judged without ROC AUC"]
    answer: 1
    why: "A's 99 % comes entirely from the majority class; it never catches fraud. B's accuracy (9,770 / 10,000) is lower, but it finds 70 % of the fraud with precision 0.26 — whether that is good enough depends on costs, not on accuracy."
  - q: "You apply SMOTE to the whole dataset and then split into train and test. What goes wrong?"
    options: ["Nothing; SMOTE only adds rows", "The model can no longer use class weights", "SMOTE deletes the majority class", "Synthetic points built from test rows leak into training, and the test set no longer has the real ratio, so scores are inflated"]
    answer: 3
    why: "A synthetic fraud point lies between two real ones, so a test fraud row's near-copy ends up in training. The test set is also artificially balanced, so its precision means nothing for production."
  - q: "9,900 legit rows and 100 fraud rows with balanced class weights, n / (2 × class count). What weight does each class get?"
    options: ["0.505 and 50", "1 and 99", "0.01 and 0.99", "0.5 and 0.5"]
    answer: 0
    why: "Weight = n / (n_classes × class count): 10,000 / (2 × 9,900) = 0.505 and 10,000 / (2 × 100) = 50. Each class then contributes 5,000 to the loss."
  - q: "You undersampled legit rows, keeping 1 in 10, and the model says p = 0.5 for a transaction. What is the probability on real traffic?"
    options: ["0.5", "About 0.05", "About 0.09", "About 0.91"]
    answer: 2
    why: "Keeping 10 % of negatives multiplies the odds by 10. Undo it: real odds = 1 × 0.1 = 0.1, so p = 0.1 / 1.1 ≈ 0.091. Formula: p = βp_s / (βp_s − p_s + 1) with β = 0.1."
related: [ds/precision-recall-roc, ds/calibration, ds/logistic-regression, ds/train-val-test]
prereqs: [ds/precision-recall-roc]
flashcards:
  - kind: qa
    q: "Name four ways to handle a 99 : 1 class imbalance."
    a: "Use rare-class metrics (PR-AUC, recall at precision); resample the training split (undersample, oversample, SMOTE); class weights in the loss; move the decision threshold using costs. Plus: collect more minority data."
  - kind: cloze
    text: "Resampling and SMOTE are applied to the {{training split only}}; the test set keeps the {{real class ratio}}."
  - kind: qa
    q: "A miss costs 100 times a false alarm. With calibrated probabilities, what threshold minimises expected cost?"
    a: "Flag when p > C_FP / (C_FP + C_FN) = 1 / 101 ≈ 0.0099."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine-learning tips and tricks: classification metrics" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why imbalance is hard

**Class imbalance** means one class (the *majority*, here legit transactions) vastly outnumbers the other (the *minority* or *positive* class, here fraud). Fraud, disease screening, churn, defects and ad clicks are all like this. Three separate things go wrong:

1. **Evaluation.** Accuracy is dominated by the majority class, so a useless model looks excellent (the **accuracy paradox**).
2. **Learning.** With 100 fraud rows among 10,000, the minority contributes 1 % of the training loss. Many models settle for "almost always legit", and there are simply few examples to learn the fraud pattern from.
3. **Deciding.** The default threshold of 0.5 assumes both mistakes cost the same and that classes are balanced. With rare positives, almost no transaction reaches p = 0.5 even when it is very suspicious.

Fix them in that order: measure properly, decide properly, and only then consider changing the training.

## Metrics that work

Using the story's model (TP 70, FN 30, FP 200, TN 9,700):

| Metric | Value | Comment |
|---|---|---|
| Accuracy | 9,770 / 10,000 = 0.977 | lower than "always legit" (0.99) — useless here |
| Recall | 70 / 100 = 0.70 | share of fraud caught |
| Precision | 70 / 270 = 0.26 | share of alerts that are real |
| F1 | 2 · 0.26 · 0.70 / (0.26 + 0.70) = 0.38 | one number, punishes the weaker of P and R |
| PR-AUC / average precision | threshold-free | random baseline = 0.01, the positive rate |
| ROC AUC | threshold-free | random baseline = 0.5; can look great while precision is poor |

**ROC AUC is not wrong**, but it divides false positives by the 9,900 negatives, so 200 false alarms is an FPR of only 2 %. Precision compares them with the 70 true catches, which is what an analyst reviewing alerts experiences. For a single operational number, fix what the business needs: "recall at precision ≥ 0.5" (review teams can handle one false alarm per real case) or "precision at 80 % recall".

## Fix 1: move the threshold

A probability is not a decision. With costs C_FN (a missed fraud) and C_FP (a false alarm), flagging a transaction with fraud probability p has expected cost (1 − p) · C_FP; letting it through costs p · C_FN. Flag when

p · C_FN > (1 − p) · C_FP  ⇔  p > C_FP / (C_FP + C_FN).

With £500 and £5 that is 5 / 505 ≈ 0.0099. This rule assumes **calibrated** probabilities. Without reliable costs, choose the threshold on a **validation** set to meet a recall or precision target — never on the test set:

```text
scores = model probabilities on the VALIDATION set
for t in candidate thresholds, from high to low:
    recall(t) = caught positives / all positives        when flagging score ≥ t
    if recall(t) ≥ target: return t                     # highest t that meets the target
```

## Fix 2: class weights

Multiply each row's contribution to the training loss by a weight for its class. The usual "balanced" choice is w_c = n / (k · n_c) for k classes, where n_c is the number of rows in class c: 10,000 / (2 × 9,900) = 0.505 for legit rows and 10,000 / (2 × 100) = 50 for fraud rows, so each class adds up to 5,000. Relative to each other, one fraud row now counts as much as 99 legit rows — the same as having every fraud row appear 99 times, without the extra memory. Any learner that minimises a sum of per-row losses can take weights.

## Fix 3: resampling

- **Random undersampling** keeps a fraction β of majority rows. Fast, and often fine when data is plentiful, but it throws information away.
- **Random oversampling** repeats minority rows. Nothing is lost, but exact duplicates make overfitting to those few rows easy.
- **SMOTE** (Synthetic Minority Over-sampling Technique) creates new minority points: pick a minority row xᵢ, pick one of its k = 5 nearest minority neighbours x_nn, and add x_new = xᵢ + λ · (x_nn − xᵢ) with λ drawn uniformly from [0, 1] — a point on the segment between them. It assumes the space between two fraud cases is also fraud, which fails for categorical features, for noisy minority points and in very high dimensions.

```text
split data into train / validation / test       # FIRST, stratified by class
minority = fraud rows of TRAIN only
repeat until enough synthetic rows:
    x  = random row from minority
    nn = random choice among the 5 nearest minority rows to x
    λ  = uniform random number in [0, 1]
    add x + λ · (nn − x) to TRAIN with label "fraud"
validation and test stay untouched
```

All resampling must happen **after** the split, and inside each cross-validation fold (resample the training folds only, every time). Resample before splitting and synthetic copies of test rows leak into training.

**Honest expectation:** weights and resampling rarely improve a *ranking* metric such as PR-AUC for a strong model; their main effect is to push scores up for the minority — which threshold moving does directly. They help most when a learner would otherwise ignore the minority entirely, or when undersampling makes a huge dataset tractable.

## Probabilities after rebalancing

Rebalancing changes the class prior the model sees, so its outputs are inflated. After keeping a fraction β of negatives, the odds are multiplied by 1 / β; undo it with

p = β · p_s / (β · p_s − p_s + 1).

Keep 1 in 10 legit rows (β = 0.1) and a training-world score p_s = 0.5 becomes 0.05 / 0.55 ≈ 0.091 on real traffic. For weights or SMOTE there is no exact formula; recalibrate on untouched validation data instead.

## Implement it in Python

The same comparison works in any language or ML library that supports per-class weights and probability outputs; here it uses scikit-learn.

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, average_precision_score, precision_recall_curve

X, y = make_classification(n_samples=50_000, n_features=20, n_informative=6, weights=[0.99],
                           class_sep=2.0, flip_y=0, random_state=0)       # 1 % positives
X_tmp, X_te, y_tmp, y_te = train_test_split(X, y, test_size=0.3, stratify=y, random_state=0)
X_tr, X_val, y_tr, y_val = train_test_split(X_tmp, y_tmp, test_size=0.25, stratify=y_tmp, random_state=0)

def report(name, p, t):
    pred = (p >= t).astype(int)
    print(f"{name:22s} t={t:.2f}  precision {precision_score(y_te, pred):.2f}  "
          f"recall {recall_score(y_te, pred):.2f}  PR-AUC {average_precision_score(y_te, p):.3f}")

plain = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)
weighted = LogisticRegression(class_weight="balanced", max_iter=1000).fit(X_tr, y_tr)
report("plain", plain.predict_proba(X_te)[:, 1], 0.5)
report("class_weight=balanced", weighted.predict_proba(X_te)[:, 1], 0.5)

# Threshold moving: on VALIDATION data, take the highest threshold that keeps recall >= 0.8
prec, rec, thr = precision_recall_curve(y_val, plain.predict_proba(X_val)[:, 1])
t_best = thr[np.flatnonzero(rec[:-1] >= 0.8)[-1]]
report("plain, tuned threshold", plain.predict_proba(X_te)[:, 1], t_best)
```

Output: plain at 0.5 — precision 0.86, recall 0.61, PR-AUC 0.750; balanced weights at 0.5 — precision 0.11, recall 0.91, PR-AUC 0.701; plain with the threshold tuned to ≈ 0.10 — precision 0.43, recall 0.79. The weights did not rank fraud better (PR-AUC even fell slightly); they moved the operating point, which the tuned threshold does more transparently.

Library notes: most scikit-learn classifiers accept `class_weight="balanced"` (or a dict of weights) and `fit(..., sample_weight=...)`; XGBoost and LightGBM offer `scale_pos_weight`, commonly set to negatives / positives. SMOTE and random under/over-sampling live in the `imbalanced-learn` package, whose `Pipeline` applies resampling to the training folds only during cross-validation, e.g. `Pipeline([("smote", SMOTE(k_neighbors=5)), ("clf", LogisticRegression())])`. Always pass `stratify=y` when splitting.

## Edge cases and pitfalls

- **Stratify** every split (keep the class ratio the same in each part) so 100 positives are not split 90 / 10 by chance; with very few positives, prefer repeated stratified cross-validation and report the spread.
- **Time matters** for fraud and churn: split by time, not at random, or future patterns leak backwards.
- **Prevalence shifts** in production change precision even if the model is unchanged; monitor the positive rate.
- **Extreme imbalance** (1 in 100,000) may be better framed as anomaly detection or as a ranking problem with human review of the top k.
- **More and better data** — labelling more positives, active learning, better features — usually beats every resampling trick.

## In the interview

Expect "your fraud model is 99 % accurate — is it good?" A strong answer: compare with the majority-class baseline, switch to PR-AUC and recall / precision at an operating point, set the threshold from the costs of each error on validation data, mention class weights or resampling **on the training split only**, and note that rebalancing breaks calibration. Likely follow-up: "how would you choose the threshold?" — from C_FP / (C_FP + C_FN) with calibrated probabilities, or from a recall target on validation data.
