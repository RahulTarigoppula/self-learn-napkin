---
title: Precision, Recall & ROC
track: ds
tags: [evaluation, classification, metrics, imbalance]
difficulty: 2
minutes: 5
tldr: "Precision asks how many flagged items were right; recall asks how many right items were flagged. The threshold trades one for the other; ROC and PR curves show every trade at once."
analogy: "A fishing net. Recall is the share of the fish in the lake you caught; precision is the share of your catch that is fish rather than old boots. A wider net catches more fish, and more boots too."
diagram: precision-recall-roc
griddle: threshold
story:
  - title: The confusion matrix
    text: "A spam filter scores 100 emails, 10 of them really spam, and flags everything scoring 0.5 or more. Each email lands in one box: 8 true positives (spam, flagged), 2 false negatives (spam missed), 4 false positives (good mail flagged), 86 true negatives. Accuracy is 94 %, which hides the mistakes we care about."
  - title: "Precision: of what we flagged…"
    text: "Precision reads down the flagged column: of the 12 emails we flagged, how many were spam? TP / (TP + FP) = 8 / 12 = 0.67. Low precision means people find good mail in their spam folder."
  - title: "Recall: of the real spam…"
    text: "Recall reads across the spam row: of the 10 real spam emails, how many did we catch? TP / (TP + FN) = 8 / 10 = 0.80. Low recall means spam reaches the inbox. Recall is also called sensitivity or the true-positive rate (TPR)."
  - title: "Slide the threshold: the PR curve"
    text: "Move the threshold and both numbers move. At 0.8 we flag only 7 emails: precision 6 / 7 = 0.86, recall 0.60. At 0.2 we flag 25: recall 1.00, precision 10 / 25 = 0.40. Plot precision against recall for every threshold and you get the precision–recall (PR) curve."
  - title: The ROC curve and its area
    text: "The ROC curve plots recall (TPR) against the false-positive rate, FPR = FP / (FP + TN): the share of good mail wrongly flagged (1/90, 4/90 and 15/90 at our thresholds). The diagonal is random guessing. The area under it, AUC ≈ 0.97, is the chance a random spam email outscores a random good one."
  - title: "Rare positives: trust the PR curve"
    text: "Run the same model where only 1 % of mail is spam: 100 among 10,000. TPR and FPR do not change, so the ROC curve looks just as good. But at threshold 0.5 an FPR of 4.4 % now means 440 false alarms against 80 catches: precision 80 / 520 = 0.15. The PR curve shows the collapse; ROC hides it."
keyIdeas:
  - "**Precision** = TP / (TP + FP): how far you can trust a positive prediction."
  - "**Recall** (TPR) = TP / (TP + FN): how many real positives you catch."
  - "The **threshold** trades one for the other. Choose it from the cost of each kind of mistake."
  - "**ROC AUC** is the probability a random positive scores above a random negative: 0.5 is a coin flip, 1.0 a perfect ranking."
  - "With **rare positives**, prefer the PR curve or average precision; ROC ignores how many negatives a given FPR represents."
  - "**F1** = 2PR / (P + R) when you need a single number that punishes a weak precision or recall."
quiz:
  - q: "TP = 30, FP = 10, FN = 20, TN = 940. What are precision and recall?"
    options: ["Precision 0.60, recall 0.75", "Precision 0.97, recall 0.60", "Precision 0.75, recall 0.60", "Precision 0.75, recall 0.97"]
    answer: 2
    why: "Precision = 30 / (30 + 10) = 0.75. Recall = 30 / (30 + 20) = 0.60. The 940 true negatives appear in neither formula, which is why both metrics suit imbalanced data."
  - q: "0.5 % of transactions are fraud. A model labels everything 'not fraud'. What are its accuracy and recall?"
    options: ["50 % accuracy, 50 % recall", "99.5 % accuracy, 99.5 % recall", "0.5 % accuracy, 100 % recall", "99.5 % accuracy, 0 % recall"]
    answer: 3
    why: "It is right on all 99.5 % of legitimate transactions, so accuracy is 99.5 %, yet it catches no fraud: recall = 0 / (0 + all fraud) = 0. This is the accuracy paradox."
  - q: "You lower the threshold from 0.5 to 0.3. What usually happens?"
    options: ["Recall rises, while precision usually falls", "Both rise, since more true positives get flagged", "Precision rises, while recall falls", "ROC AUC rises, because more positives are caught"]
    answer: 0
    why: "More items get flagged, so you catch more positives (recall can only stay level or rise) but also flag more negatives, which usually lowers precision. AUC is computed over all thresholds, so moving the threshold cannot change it."
  - q: "A model has ROC AUC = 0.80. What does that mean?"
    options: ["80 % of its predictions are correct", "A random positive outscores a random negative 80 % of the time", "Its precision is 0.80 at the best threshold", "Its probabilities are calibrated to within 20 %"]
    answer: 1
    why: "AUC measures ranking: compare every positive with every negative and count how often the positive has the higher score. It says nothing directly about accuracy, precision at a threshold, or calibration."
related: [ds/class-imbalance, ds/calibration, ds/logistic-regression, ds/cross-validation]
prereqs: [ds/logistic-regression]
flashcards:
  - kind: qa
    q: "When would you optimise for recall over precision? Give an example."
    a: "When a missed positive is far costlier than a false alarm (cancer screening, fraud detection). You accept more false positives to catch nearly every real case."
  - kind: cloze
    text: "Precision = TP / ({{TP + FP}}); recall = TP / ({{TP + FN}})."
  - kind: qa
    q: "Why can ROC AUC look excellent on a dataset with 1 % positives while the model is unusable?"
    a: "FPR divides by the huge number of negatives, so a small FPR still means many false positives. Precision, which compares them with the few true positives, exposes it."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine-learning tips and tricks: classification metrics" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The four outcomes

A binary classifier outputs a **score** (say, a probability of spam). A **threshold** turns the score into a decision: flag if score ≥ t. Comparing decisions with the truth gives four counts, the **confusion matrix**:

| | Predicted positive (flagged) | Predicted negative |
|---|---|---|
| **Actually positive** (spam) | **TP**: true positive | **FN**: false negative (a miss) |
| **Actually negative** (good mail) | **FP**: false positive (a false alarm) | **TN**: true negative |

"True/false" says whether the prediction was right; "positive/negative" says what was predicted. Every metric below is a ratio of these four numbers.

## The metrics, and what each one asks

With the story's counts (TP 8, FN 2, FP 4, TN 86):

| Metric | Formula | Question it answers | Value |
|---|---|---|---|
| Accuracy | (TP + TN) / all | How often are we right? | 94 / 100 = 0.94 |
| **Precision** | TP / (TP + FP) | When we flag, how often is it really spam? | 8 / 12 = 0.67 |
| **Recall** (sensitivity, TPR) | TP / (TP + FN) | Of the real spam, how much did we catch? | 8 / 10 = 0.80 |
| Specificity (TNR) | TN / (TN + FP) | Of the good mail, how much did we leave alone? | 86 / 90 = 0.96 |
| **FPR** | FP / (FP + TN) = 1 − specificity | Of the good mail, how much did we flag? | 4 / 90 = 0.044 |
| **F1** | 2 · P · R / (P + R) | One number balancing P and R | 2 · 0.667 · 0.8 / 1.467 = 0.73 |

**Why accuracy misleads:** when one class dominates, a model that always predicts the majority class scores high accuracy while being useless. Precision and recall both ignore TN, the huge "boring" cell, and focus on the class you care about.

**Why F1 uses the harmonic mean:** the harmonic mean is dragged towards the smaller number. Precision 1.0 with recall 0.1 gives an arithmetic mean of 0.55 but F1 of only 0.18, which matches how useless that model is.

## The threshold trade-off

Raising t flags fewer emails: false alarms drop (precision tends to rise) but more spam slips through (recall falls). Lowering t does the opposite.

| Threshold | Flagged | TP | FP | FN | Precision | Recall | FPR |
|---|---|---|---|---|---|---|---|
| 0.8 | 7 | 6 | 1 | 4 | 0.86 | 0.60 | 0.011 |
| 0.5 | 12 | 8 | 4 | 2 | 0.67 | 0.80 | 0.044 |
| 0.2 | 25 | 10 | 15 | 0 | 0.40 | 1.00 | 0.167 |

The right threshold is a business decision. If a missed fraud costs £500 and a false alarm costs a £2 review, you want high recall and accept low precision. If false alarms annoy customers (blocking a real payment), you want high precision.

## ROC and AUC

The **ROC curve** (receiver operating characteristic, a name from radar engineering) plots TPR against FPR as the threshold sweeps from +∞ (flag nothing: point (0, 0)) to −∞ (flag everything: point (1, 1)). A useless model that scores at random hugs the diagonal; a perfect one goes straight up to (0, 1) and then across.

The **area under the ROC curve (AUC)** has a precise meaning: pick one random positive and one random negative; AUC is the probability the positive gets the higher score (ties count half). Worked example with three spam scores [0.9, 0.8, 0.4] and three good-mail scores [0.7, 0.3, 0.2]: of the 3 × 3 = 9 pairs, 0.9 beats all three, 0.8 beats all three, and 0.4 beats 0.3 and 0.2. That is 8 wins out of 9, so AUC = 0.889.

Because AUC depends only on the **order** of the scores, it is unchanged by any transformation that preserves order and says nothing about whether the probabilities are calibrated.

## Why PR beats ROC for rare positives

FPR divides by the number of negatives. With 9,900 good emails, an FPR of 4.4 % is 440 false alarms. That looks tiny on the ROC plot and is overwhelming next to 80 caught spam emails. Precision compares false alarms with true positives directly, so it collapses (0.67 → 0.15 in the story) while the ROC curve does not move at all. The baseline of a PR curve is the positive rate (0.01 here), not 0.5. **Average precision** (AP), roughly the area under the PR curve, is the usual single-number summary.

## Implement it in Python

Every metric here is a ratio of four counts, so it takes a few lines in any language; Python with scikit-learn's metric functions is shown.

```python
import numpy as np
from sklearn.metrics import (confusion_matrix, precision_score, recall_score, f1_score,
                             roc_auc_score, average_precision_score, precision_recall_curve)

y_true = np.array([1, 1, 1, 0, 0, 0])            # 3 spam, 3 good emails
scores = np.array([0.9, 0.8, 0.4, 0.7, 0.3, 0.2])  # the model's spam scores

y_pred = (scores >= 0.5).astype(int)             # a threshold turns scores into labels
tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()   # sklearn's order: TN, FP, FN, TP
print(f"TP={tp} FP={fp} FN={fn} TN={tn}")
print(f"precision {precision_score(y_true, y_pred):.3f}  recall {recall_score(y_true, y_pred):.3f}"
      f"  F1 {f1_score(y_true, y_pred):.3f}")

# Threshold-free summaries use the raw scores, not the 0/1 predictions
print(f"ROC AUC {roc_auc_score(y_true, scores):.3f}  average precision {average_precision_score(y_true, scores):.3f}")

# Pick the highest threshold that still catches at least 90 % of the spam
prec, rec, thr = precision_recall_curve(y_true, scores)    # thr is ascending; prec/rec have one extra entry
ok = rec[:-1] >= 0.9
best = np.flatnonzero(ok)[-1]                    # last qualifying index = highest threshold
print(f"threshold {thr[best]}  precision {prec[best]:.2f}  recall {rec[best]:.2f}")
```

Output: TP = 2, FP = 1, FN = 1, TN = 2; precision, recall and F1 all 0.667; ROC AUC 0.889 (the 8 / 9 from above); average precision 0.917; and to reach full recall the threshold must drop to 0.4, where precision is 0.75.

## Edge cases and pitfalls

- **Choose the threshold on validation data**, never on the test set.
- **Precision is undefined** when nothing is flagged (0 / 0); libraries return 0 with a warning.
- **Multiclass** problems need averaging: *macro* (mean of per-class scores, every class counts equally) or *micro* (pool all TP/FP/FN, dominated by big classes).
- **Prevalence shift:** precision depends on how common positives are, so a model validated at 10 % spam will show lower precision in production at 1 %. Recall, FPR and ROC AUC do not depend on prevalence.
- **AUC compares rankings, not decisions:** two models with equal AUC can behave very differently at the one threshold you deploy.

## In the interview

Expect "your fraud model is 99 % accurate; is it good?" or "precision or recall for cancer screening?". A strong answer draws the confusion matrix, defines both metrics in words, ties the threshold to the cost of each error, and switches from ROC AUC to PR curves when positives are rare. Common follow-up: *how would you pick the threshold?* Maximise expected value using the costs of FP and FN, or fix a required recall and take the highest precision that achieves it, all on validation data.
