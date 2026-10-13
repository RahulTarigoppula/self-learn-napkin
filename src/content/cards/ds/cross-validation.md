---
title: Cross-Validation
track: ds
tags: [evaluation, model-selection, resampling]
difficulty: 2
minutes: 4
tldr: "Cut the data into k folds, let each fold take one turn as validation, and average the k scores. You get a steadier estimate than one split, at k times the training cost."
analogy: "Judging a baker on five batches instead of one. A single batch can be a fluke; the average of five rarely is, and how much the five differ tells you how consistent the baker really is."
diagram: cross-validation
story:
  - title: Cut the data into 5 folds
    text: "One train/validation split gives one score, and that score depends on which rows happened to land in validation. k-fold cross-validation fixes that. Shuffle the 1,000 training rows and cut them into k = 5 equal folds of 200."
  - title: "Round 1: fold 1 validates"
    text: "Train a fresh model on folds 2–5 (800 rows) and score it on fold 1 (200 rows): accuracy 0.82. The model never saw fold 1, so the score is honest. It is also noisy, because 200 rows is a small sample."
  - title: Every fold takes a turn
    text: "Repeat four more times, rotating which fold sits out: 0.85, 0.80, 0.84, 0.83. Five fresh models, five scores. Every row has now been used for validation exactly once and for training four times."
  - title: Average the five scores
    text: "Report the mean, (0.82 + 0.85 + 0.80 + 0.84 + 0.83) / 5 ≈ 0.83, with its spread: a standard deviation of about 0.02. Pick the model or hyperparameters with the best mean, then retrain that choice once on all the training rows."
  - title: "Stratified: keep the class mix"
    text: "With imbalanced labels a random cut can leave a fold with too few positives, and its score swings. Stratified k-fold deals out each class separately, so every fold keeps the overall ratio: here 10 % spam, which is 20 of each fold's 200 rows."
  - title: "Time series: never train on the future"
    text: "Shuffling time-ordered data lets a model train on March and validate on January. Use forward chaining instead: train on blocks 1…t, validate on block t + 1, then grow the window and repeat. The model only ever predicts the future from the past."
keyIdeas:
  - "**k = 5 or 10** is the usual trade-off between cost (k fits) and a stable estimate."
  - "Cross-validation is for **choosing** models and hyperparameters; a separate test set is still opened once at the end."
  - "Fit all preprocessing **inside** each fold (a pipeline), or the validation fold leaks into training."
  - "**Stratified** folds for imbalanced classes, **group** folds when one user has many rows, **forward chaining** for time series."
  - "Report the **mean and the spread**, because one split can be lucky."
quiz:
  - q: "5-fold cross-validation on 1,000 rows: how many models are trained, and on how many rows each?"
    options: ["1 model on 1,000 rows", "5 models on 800 rows each", "5 models on 200 rows each", "4 models on 750 rows each"]
    answer: 1
    why: "Each round holds out one fold of 200 and trains a fresh model on the other four folds, 800 rows. Five rounds, five models; every row is validated exactly once."
  - q: "Model A scores 0.82, 0.85, 0.80, 0.84, 0.83 across 5 folds. Model B scored 0.85 on one random split. What is the sound conclusion?"
    options: ["B is better, because its 0.85 beats the 0.83 that A averages", "B's 0.85 is within A's fold spread; run B on the same 5 folds first", "A is better, because five scores beat a single one", "Average B's 0.85 into A's five scores and then compare the two means"]
    answer: 1
    why: "A's own folds range from 0.80 to 0.85, so one split can easily land at 0.85 by luck. Compare models on the same folds so the noise from the split affects both equally."
  - q: "You tried 100 configurations with 5-fold CV. Is the winner's mean CV score a fair estimate of its real performance?"
    options: ["Yes: cross-validation removes all selection bias", "No: picking the best of 100 makes that score optimistic", "No: CV scores are always pessimistic, so it is too low", "Yes, as long as you use k = 10 instead of 5"]
    answer: 1
    why: "The winner was selected partly for being lucky on these folds. Confirm it on an untouched test set, or use nested CV, where an outer loop scores the whole tuning procedure."
  - q: "You predict churn and each customer contributes 50 monthly rows. Which splitter fits best?"
    options: ["Plain k-fold with shuffling", "Group k-fold, grouped by customer", "Leave-one-out", "Stratified k-fold on the churn label"]
    answer: 1
    why: "With plain folds the same customer appears in training and validation, so the model can recognise the customer instead of learning churn signals. Grouping keeps each customer on one side. (If time matters too, also split by date.)"
bigO:
  - { op: "models trained", avg: "k", note: "k = 5 or 10 is typical" }
  - { op: "training rows per model", avg: "(k − 1)/k of the data", note: "80 % when k = 5" }
  - { op: "leave-one-out", avg: "k = n", note: "n fits; expensive and high-variance" }
bigOTitle: "Key numbers"
related: [ds/train-val-test, ds/bias-variance]
prereqs: [ds/train-val-test]
flashcards:
  - kind: qa
    q: "Why use k-fold cross-validation instead of a single validation split?"
    a: "A single split's score depends on which rows landed in validation. k-fold validates on every row once and averages k scores, giving a steadier estimate plus its spread. The price is k times the cost."
  - kind: cloze
    text: "For imbalanced classes use {{stratified}} k-fold; for time-ordered data use {{forward-chaining}} (expanding-window) splits."
  - kind: qa
    q: "You standardise all features, then run 5-fold CV. What is wrong?"
    a: "The scaler saw every validation fold before it was held out, which is leakage. Put preprocessing in a pipeline so it is refit on the training folds inside each round."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine-learning tips and tricks: cross-validation" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem with one validation split

A validation score is a measurement, and measurements on small samples are noisy. With 200 validation rows and a true accuracy of 83 %, the standard error is √(0.83 × 0.17 / 200) ≈ 0.027, so one split can easily read anywhere from about 0.78 to 0.88. If you choose between two models that differ by one point, a single split is mostly telling you which rows happened to fall where.

**Cross-validation** (CV) gets more out of the same data by reusing it. Every row is used for validation once and for training k − 1 times, and you get k scores instead of one.

## How it works

1. **Shuffle** the training data (skip this for time series) and cut it into **k folds** of equal size. A **fold** is just one of the k slices.
2. **For each fold i = 1 … k:** train a *fresh* model on the other k − 1 folds, then score it on fold i.
3. **Summarise** the k scores by their **mean** (the estimate) and **standard deviation** (how much the estimate depends on the split).
4. **Use the mean to choose** between models or hyperparameter settings, evaluating every candidate on the same folds.
5. **Retrain** the winning configuration on all the training data. The k fold models were only measuring instruments; you usually throw them away.

The data you cross-validate on is everything *except* a final test set, which stays sealed exactly as in a plain train/validation/test split.

### Choosing k

- **Larger k** → each model trains on more data (90 % with k = 10), so the estimate is closer to how the final model will do, but you pay k fits.
- **Smaller k** → cheaper, but each model sees less data (only 50 % with k = 2), which makes the estimate pessimistic.
- **k = n (leave-one-out)** trains n models on n − 1 rows each. It is nearly unbiased but expensive, and its estimate can have high variance because the n models are almost identical.

k = 5 or 10 is the standard compromise.

## Worked example

1,000 rows, 100 of them spam, k = 5:

| Round | Trains on | Validates on | Accuracy |
|---|---|---|---|
| 1 | folds 2–5 (800) | fold 1 (200) | 0.82 |
| 2 | folds 1, 3–5 | fold 2 | 0.85 |
| 3 | folds 1–2, 4–5 | fold 3 | 0.80 |
| 4 | folds 1–3, 5 | fold 4 | 0.84 |
| 5 | folds 1–4 | fold 5 | 0.83 |

Mean = 4.14 / 5 = 0.828. Deviations from the mean are −0.008, +0.022, −0.028, +0.012, +0.002; their squares sum to 0.00148, so the sample standard deviation is √(0.00148 / 4) ≈ 0.019. Report **0.83 ± 0.02**.

**Why stratify?** A random fold of 200 rows from this data holds on average 20 spam emails, but with a standard deviation of about 3.8, so folds with 13 or 27 spam are unremarkable. Precision and recall measured on a fold with 13 positives are very noisy. Stratified folds hold exactly 20 each.

## Implement it in Python

The loop above is a few lines in any language (R's caret/tidymodels, Julia's MLJ, Spark's CrossValidator all ship it). In Python, scikit-learn's splitters do the bookkeeping.

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import StratifiedKFold, TimeSeriesSplit, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X, y = make_classification(n_samples=1000, n_features=10, weights=[0.9], random_state=0)

# The scaler lives INSIDE the pipeline, so each round refits it on that round's 4 training folds
model = make_pipeline(StandardScaler(), LogisticRegression())
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)    # each fold keeps ~10 % positives

scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
print(scores.round(3), f"mean {scores.mean():.3f} ± {scores.std(ddof=1):.3f}")   # sample SD, as above
# [0.96  0.975 0.98  0.99  0.985] mean 0.978 ± 0.012

# What cross_val_score does inside: k rounds, a fresh model each time
for k, (tr, va) in enumerate(cv.split(X, y), start=1):
    fitted = make_pipeline(StandardScaler(), LogisticRegression()).fit(X[tr], y[tr])
    print(f"round {k}: train {len(tr)}, validate {len(va)} "
          f"({y[va].sum()} positives), acc {fitted.score(X[va], y[va]):.3f}")

# Time-ordered rows: always train on the past, validate on the block that follows
for tr, va in TimeSeriesSplit(n_splits=3).split(X):
    print(f"train rows 0-{tr[-1]}, validate rows {va[0]}-{va[-1]}")
```

Stratification gives 20 or 21 positives per fold here because this synthetic set has 103 positives, not exactly 100. The last loop prints train 0–249 / validate 250–499, then 0–499 / 500–749, then 0–749 / 750–999: the window grows and validation always lies in the future. To tune hyperparameters, `GridSearchCV(model, param_grid, cv=cv)` runs this whole loop once per setting.

## Edge cases and pitfalls

- **Leakage through preprocessing:** scaling, imputing or selecting features on the full dataset *before* CV lets every validation fold influence training. Put every fitted step in a pipeline.
- **Groups:** if one patient or customer has many rows, use **group k-fold**: assign whole groups to folds so all their rows land in the same fold.
- **Selection bias:** the best of many CV means is optimistic. Use a held-out test set or **nested CV** (an inner CV loop tunes, an outer loop scores the tuned result).
- **Cost:** k × the training time. For deep networks that take days to train, a single validation split is often the practical choice.
- **The spread is not a confidence interval for the final model.** Folds overlap in their training data, so the k scores are not independent. Treat ± as a rough guide.

## In the interview

Typical prompts: "how would you pick the regularisation strength?" or "your dataset has only 2,000 rows; how do you evaluate?". Describe k-fold with a pipeline inside, mention stratified, group and time-series variants, and say the final test set stays untouched. Expect the follow-up *what do you deploy after CV?* One model, retrained on all the training data with the chosen settings.
