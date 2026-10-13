---
title: Train / Validation / Test
track: ds
tags: [evaluation, data-splitting, leakage, fundamentals]
difficulty: 1
minutes: 4
tldr: "Split once, up front: train fits the weights, validation picks settings and when to stop, and test is opened once at the end to give an honest score."
analogy: "Homework, mock exam, final exam. You learn from homework (train), use mock exams to decide how to study (validation), and sit the final once. Practising on the final paper makes your grade meaningless."
diagram: train-val-test
story:
  - title: One dataset, shuffled
    text: "Start with 1,000 labelled rows — say, emails marked spam or not spam. Each square here is 50 rows. Shuffle first, so every slice looks like the whole: the same spam rate, no runs of rows sorted by date or source."
  - title: Cut it 70 / 15 / 15
    text: "Cut once, before any modelling: 700 rows to train, 150 to validate, 150 to test. Each slice answers a different question, so no row may sit in two of them. With millions of rows the held-out slices can be far smaller in percentage — 1 % of 10 million is still 100,000 rows."
  - title: "Train: fit the weights"
    text: "Only the 700 training rows ever touch the weights. Gradient descent keeps pushing training loss down epoch after epoch, so training loss alone cannot tell you when the model has started memorising noise."
  - title: "Validation: tune and stop early"
    text: "After every epoch, score the model on the 150 validation rows. Validation loss falls, bottoms out, then climbs as the model overfits — stop at the bottom (early stopping). The same slice chooses hyperparameters such as depth or learning rate. Because you pick by it, its score is optimistic."
  - title: "Test: open it once"
    text: "The test slice stays sealed until every decision is made. Open it once and report that number. If you go back and tweak after seeing it, the test set has quietly become a second validation set and the estimate is biased upward."
  - title: "No peeking: avoid leakage"
    text: "Leakage is test information sneaking into training. Classic case: fitting a scaler on all 1,000 rows lets the test rows' mean and spread shape the features. Fit it on train, then only transform val and test. For time-ordered data, split by date: train on the past, test on the future."
keyIdeas:
  - "**Train** fits parameters, **validation** chooses hyperparameters and the stopping point, **test** estimates real-world performance — once."
  - "Ratios scale with data size: 70/15/15 or 80/10/10 for thousands of rows; 98/1/1 is fine for millions."
  - "**Leakage** hides in preprocessing fitted on all rows, duplicates across splits, the same user on both sides, and features computed from the future."
  - "Use a **stratified** split for imbalanced labels so every slice keeps the same class ratio."
  - "Too little data to spare 15 % for validation? Use **k-fold cross-validation** instead."
quiz:
  - q: "You tried 40 hyperparameter settings; the best scored 91 % on the 150 validation rows. What should you expect on the test set?"
    options: ["Exactly 91 %", "Probably a little lower than 91 %", "Probably higher than 91 %", "The training accuracy"]
    answer: 1
    why: "Each validation score is noisy. Picking the maximum of 40 noisy scores favours a setting that also got lucky on those particular 150 rows. The test set played no part in the choice, so the luck does not carry over."
  - q: "Which of these is data leakage?"
    options: ["Fitting a scaler on the training rows, then applying it to the test rows", "Filling missing values with the mean of the whole dataset before splitting", "Using a stratified split", "Fixing random_state so the split is reproducible"]
    answer: 1
    why: "The mean was computed with the test rows included, so test information shaped the training features. Compute the fill value from the training rows only."
  - q: "You have 1,000 consecutive days of sales. Which split is right?"
    options: ["Shuffle, then 70/15/15", "Days 1–700 train, 701–850 validate, 851–1000 test", "A random 150 days for test, the rest for training", "Test on days 1–150, train on the rest"]
    answer: 1
    why: "In production you always predict the future from the past, so the evaluation must too. Shuffling lets the model learn from days that come after the ones it is tested on."
  - q: "True accuracy is 85 %. Roughly how much does the accuracy measured on a 150-row test set wobble (one standard error)?"
    options: ["About 0.3 points", "About 1 point", "About 3 points", "About 15 points"]
    answer: 2
    why: "Standard error of a proportion = √(p(1 − p)/n) = √(0.85 × 0.15 / 150) ≈ 0.029, about 3 percentage points. Ten times more rows would shrink it only by √10, to about 0.9 points."
related: [ds/cross-validation, ds/bias-variance]
prereqs: []
flashcards:
  - kind: qa
    q: "Why is the validation score not a fair estimate of final performance?"
    a: "You chose hyperparameters and the stopping epoch to maximise it, so it is optimistically biased. Only a test set you never tuned against gives an unbiased estimate."
  - kind: cloze
    text: "Fit preprocessing such as a scaler on the {{training set only}}, then use it to {{transform}} the validation and test sets."
  - kind: qa
    q: "You are forecasting next month's sales. How should you split the data?"
    a: "By time: train on earlier months, validate and test on later ones. A random shuffle lets the model peek at the future and inflates every score."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine-learning tips and tricks: model selection" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why one dataset needs three jobs

A model is only useful if it works on data it has never seen — **generalisation**. You cannot measure that on the rows the model learned from: a model that memorised them scores perfectly and tells you nothing. So you hold some labelled rows back and pretend they are the future.

But a model has two kinds of knobs. **Parameters** (weights, split points) are learned by the training algorithm. **Hyperparameters** (learning rate, tree depth, regularisation strength, number of epochs) are chosen by *you*, usually by trying several and keeping the best. Every choice you make by looking at a score uses that score up a little. That is why one held-out slice is not enough — you need two:

| Slice | Who looks at it | What it answers |
|---|---|---|
| **Training set** | the learning algorithm, every step | "What weights fit these examples?" |
| **Validation set** (dev set) | you, many times | "Which settings and which epoch generalise best?" |
| **Test set** | you, once | "How well will the final model do on new data?" |

## How it works

1. **Shuffle** the rows (unless they are ordered in time — see below), so each slice is a fair sample of the whole.
2. **Split once, before any exploration.** 70/15/15 is a common default for a few thousand rows. What matters is the *absolute* size of the held-out slices, not the percentage: 10,000 test rows is plenty, so with 10 million rows a 98/1/1 split is fine.
3. **Fit** every candidate model on the training set only.
4. **Score each candidate on validation** and keep the best. Neural networks also check validation loss after each epoch and stop when it stops improving — **early stopping**.
5. **Optionally retrain** the chosen configuration on train + validation, so the final model sees more data.
6. **Score the final model on the test set exactly once** and report that number.

### Why validation becomes optimistic

Suppose ten settings are all truly 85 % accurate. On 150 rows, each measured score wobbles by about ±3 points just by chance, so the best of the ten might read 89 %. Choosing the maximum selects for lucky noise. The test set was not involved in the choice, so it gives an unbiased estimate — but only the *first* time you look. Every further tweak made after reading it turns it into a second validation set.

## Worked example: a leak you would not notice

A feature `income` has mean 50 (thousand) in the 700 training rows and the 150 validation rows. The 150 test rows come from a richer region, mean 80.

- **Leaky:** fit the scaler on all 1,000 rows. The mean it subtracts is 0.70 × 50 + 0.15 × 50 + 0.15 × 80 = 54.5 instead of 50 — the test rows have pulled it upward, and the model's inputs now carry a trace of the test distribution.
- **Correct:** fit the scaler on the 700 training rows (mean 50), then *transform* validation and test with that same mean and spread. The test rows then look to the model exactly as unseen production data will: possibly shifted, which is what you need to find out.

The same rule applies to anything with a `fit` step: imputers, encoders, vocabularies, feature selection and PCA.

## Implement it in Python

The recipe is the same in any language or library (R, Julia, Spark…): split, fit preprocessing on train, tune on validation, score test once. This version uses scikit-learn.

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X, y = make_classification(n_samples=1000, n_features=10, weights=[0.9], random_state=0)

# 70 % train; the other 30 % split in half -> 15 % validation, 15 % test
X_tr, X_tmp, y_tr, y_tmp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=0)
X_val, X_te, y_val, y_te = train_test_split(X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=0)

scaler = StandardScaler().fit(X_tr)              # statistics from training rows ONLY
X_tr, X_val, X_te = (scaler.transform(a) for a in (X_tr, X_val, X_te))

best_C, best_acc = None, -1.0
for C in [0.01, 0.1, 1, 10]:                     # tune the hyperparameter on validation
    acc = LogisticRegression(C=C).fit(X_tr, y_tr).score(X_val, y_val)
    if acc > best_acc:
        best_C, best_acc = C, acc

final = LogisticRegression(C=best_C).fit(X_tr, y_tr)
print("C =", best_C, "validation:", best_acc, "test (look once):", final.score(X_te, y_te))
# C = 1 validation: 0.973... test (look once): 0.986...
```

`stratify=y` keeps the 10 % positive rate in every slice. Notice the test score is *higher* than validation here: 148 versus 146 correct out of 150 — two rows, well inside the ±3-point noise of a 150-row slice. Read small differences between slices as noise, not as signal.

## Edge cases and pitfalls

- **Time series:** never shuffle. Train on the oldest data, validate on the next period, test on the most recent.
- **Groups:** if one patient, user or device has many rows, put all of them on the same side (a group split). Otherwise the model recognises the person instead of learning the pattern.
- **Duplicates and near-duplicates** (the same image resized, the same email forwarded) across slices inflate scores. Deduplicate before splitting.
- **Features from the future:** "total purchases this year" used to predict a purchase in March leaks the answer.
- **Tiny datasets:** 15 % of 300 rows is 45 rows, far too noisy to choose by. Use k-fold cross-validation on the training portion instead.
- **A test score above validation** is usually luck or leakage, not a great model. Investigate before celebrating.

## In the interview

Expect "how would you evaluate this model?" or "your offline metric was great but production is bad — why?". A strong answer names the three slices and their jobs, says the test set is touched once, and lists leakage sources: preprocessing fitted on all rows, random splits of temporal data, the same entity on both sides, and future information in features. Follow-up to expect: *how big should the test set be?* — big enough that its standard error is smaller than the differences you care about.
