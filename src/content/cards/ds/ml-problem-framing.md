---
title: Framing an ML Problem
track: ds
tags: [fundamentals, problem-framing, metrics, baselines]
difficulty: 1
minutes: 4
tldr: "Turn a business goal into a precise prediction: who or what you predict for, what exactly, from which data, at what moment, judged by which metric — and check a simple rule doesn't already do the job."
analogy: "A doctor does not 'treat illness'; they decide which test to run on which patient, when, and what result changes the treatment. Framing an ML problem is writing that order before anyone touches a model."
diagram: ml-problem-framing
story:
  - title: Start from the business goal
    text: "A subscription business says 'we lose too many customers'. That is a goal, not an ML task. Framing turns it into something a model can learn: for each active subscriber, the probability they cancel in the next 30 days. The score decides who gets a retention offer."
  - title: Fix the moment of prediction
    text: "Choose a prediction date. Features may only use what was known before it — here the past 90 days of activity. The label comes from after it: did the customer cancel within the next 30 days? A feature built from data after that date is leakage, and it makes offline scores look far better than live ones."
  - title: One row per customer per date
    text: "The unit of prediction is one customer on one date, so the training table has one row per (customer, date): blue feature columns and an orange label column. Labels arrive on their own 30 days later, which makes churn a supervised problem. Stack several monthly snapshots and test on a later month."
  - title: Offline metric vs business metric
    text: "Only 3 % of customers cancel, so accuracy is useless: predicting 'nobody cancels' scores 97 %. The team can contact 5 % of customers, so measure precision in the top 5 % — the model reaches 0.30. The business metric is profit: a £10 offer that saves 1 in 5 churners worth £200 each only pays when precision exceeds 0.25."
  - title: Beat a simple baseline first
    text: "Before training anything, score a one-line rule: flag the customers whose logins dropped most. Here it reaches precision 0.18, against 0.03 for random picks. If a model cannot clearly beat the rule, ship the rule — it is cheaper, explainable and has no pipeline to maintain."
keyIdeas:
  - "Name the **decision** the prediction drives. If no decision changes, the model has no value."
  - "Define the **unit of prediction**, the **target** (exact wording, time horizon) and the **prediction moment**; features may only use data from before that moment."
  - "Pick an **offline metric that mirrors the business action** (precision in the top 5 % you can contact), not accuracy by default."
  - "Always compare against a **baseline**: random, the majority class, and a simple rule. Sometimes the rule wins and you don't need ML."
  - "Test **out of time** (train on earlier months, test on a later one), because that is how the model will be used."
quiz:
  - q: "3 % of customers churn each month. A model predicts 'no churn' for everyone. What is its accuracy, and is it useful?"
    options: ["3 %, useless", "97 %, useless", "97 %, a strong model", "50 %, a coin flip"]
    answer: 1
    why: "It is right for the 97 % who stay, so accuracy is 97 %, but it never finds a single churner. With rare positives, measure precision and recall where you act instead."
  - q: "Which feature leaks the label in a 'will cancel in the next 30 days' model scored on 1 March?"
    options: ["Logins in February", "Months since sign-up", "Number of support tickets in March", "Plan price on 1 March"]
    answer: 2
    why: "March tickets happen after the prediction date — at scoring time you could not know them, and an upset customer about to leave raises many. Everything else was known on 1 March."
  - q: "A £10 offer saves 20 % of the churners who receive it, and a saved customer is worth £200. Above what precision does contacting the model's top list pay off?"
    options: ["0.05", "0.10", "0.25", "0.50"]
    answer: 2
    why: "Each contact earns precision × 0.2 × £200 = £40 × precision on average and costs £10. Break-even is 40p = 10, so p = 0.25."
  - q: "When is ML usually the wrong tool?"
    options: ["When labels are cheap and plentiful", "When a short, stable rule already meets the target", "When the data has many features", "When the problem is classification"]
    answer: 1
    why: "If a rule a person can read already does the job, a model adds cost, latency, monitoring and opacity for little gain. ML earns its place when patterns are too many or too subtle to hand-write."
related: [ds/supervised-vs-unsupervised, ds/train-val-test, ds/precision-recall-roc, ds/class-imbalance]
prereqs: []
flashcards:
  - kind: qa
    q: "What must a good ML problem framing specify?"
    a: "The decision it drives, the unit of prediction, the exact target and horizon, the prediction moment (features only from before it), how labels are obtained, the offline and business metrics, and the baseline to beat."
  - kind: cloze
    text: "Features may only use data from {{before the prediction moment}}; the label comes from {{after}} it."
  - kind: qa
    q: "Why test a churn model on a later month rather than a random split?"
    a: "In production the model always predicts the future from the past. A random split mixes months, so seasonal and drifting patterns leak across and the score is optimistic."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What framing decides

Most failed ML projects fail before any model is trained: the team predicts the wrong thing, at the wrong moment, or scores it with a metric nobody cares about. **Framing** is the step that turns a vague goal ("reduce churn", "catch fraud", "show better products") into a precise learning task. A complete framing answers eight questions:

1. **Decision** — what action will the prediction drive? (Send a retention offer to some customers.)
2. **Unit of prediction** — one prediction for *what*? (One customer on one date, not one customer forever.)
3. **Target** — the exact quantity, with a time horizon. "Cancels the subscription within 30 days of the prediction date" is a target; "is unhappy" is not.
4. **Prediction moment** — when the model runs. Features may only use information available *before* this moment.
5. **Features** — signals plausibly related to the target and available at prediction time.
6. **Labels** — where they come from and when they arrive. Churn labels appear by themselves 30 days later; fraud labels may take months (chargebacks); some targets need paid human labelling.
7. **Metrics** — an **offline metric** you can compute on historical data and a **business metric** you actually want to move, with a stated link between them.
8. **Baseline** — the simplest thing that could work, which the model must beat.

## Should this be ML at all?

ML is worth its cost (data pipelines, retraining, monitoring, explanations) only when the pattern is too complex to write down and you have data that contains it. Prefer a rule or plain analytics when:

- a short, stable rule already meets the target ("block a card after 5 failed PIN attempts");
- there are no labels and no realistic way to get them;
- errors must be impossible rather than rare, or every decision must be fully explainable by regulation;
- the prediction would not change any decision.

## Worked example: churn

A streaming service has 100,000 active subscribers. About 3 % cancel each month, so roughly 3,000 will cancel in the next 30 days. The retention team can afford to contact 5,000 people (5 %) with a £10 discount. From an earlier experiment, the offer keeps 20 % of the would-be churners who receive it, and a kept customer is worth £200 in margin.

**Framing.** Unit: (customer, prediction date), monthly. Target: 1 if the customer cancels within 30 days after the date, else 0 — binary classification. Features: logins in the last 30 days and the 30 before that, tenure, support tickets in the last 90 days, plan and price. Offline metric: **precision in the top 5 %** (of the 5,000 highest-scored customers, the fraction who really churn), because that is exactly the group the team will contact.

**Linking it to money.** Each contact costs £10 and earns, on average, precision × 0.20 × £200 = £40 × precision. The campaign breaks even at precision 10 / 40 = **0.25**.

| Who gets the 5,000 offers | Churners among them | Precision | Saved (×0.2) | Value (×£200) | Profit (− £50,000) |
|---|---|---|---|---|---|
| Random customers | 150 | 0.03 | 30 | £6,000 | −£44,000 |
| Rule: biggest login drop | 900 | 0.18 | 180 | £36,000 | −£14,000 |
| Model's top 5 % | 1,500 | 0.30 | 300 | £60,000 | **+£10,000** |

The model's top list also catches 1,500 of the 3,000 churners — a **recall** of 0.50. Only the model clears break-even, so here ML is justified; if it had scored 0.22 the right answer would be "don't run this campaign", whatever the AUC says.

## Building the training table

Every training row is a snapshot taken on a cutoff date. In pseudocode:

```text
for each cutoff date c (1 Jan, 1 Feb, 1 Mar …):
    for each customer active on c:
        features = counts of their events in windows that END before c
        label    = 1 if they cancel in [c, c + 30 days), else 0
        emit row (customer, c, features, label)
train on the early cutoffs, test on a later one (out of time)
```

Precision in the top 5 % is: sort customers by score, take the first 5 %, and compute the share of them whose label is 1.

## Implement it in Python

The same pipeline works in any language or tool (SQL, R, Julia, Spark); this version uses pandas and scikit-learn and expects two tables, `subs` and `logins`. No data to hand? This first block builds a toy pair in which customers log in less during the six weeks before they cancel:

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(7)
n = 3000
days = pd.date_range("2025-11-01", "2026-04-30")             # the login history we need
start = pd.Timestamp("2025-01-01") + pd.to_timedelta(rng.integers(0, 420, n), unit="D")
leaves = rng.random(n) < 0.35
cancel = (start + pd.to_timedelta(rng.integers(30, 500, n), unit="D")).where(leaves)
subs = pd.DataFrame({"customer": np.arange(n), "start": start, "cancelled_at": cancel})

d, s, c = days.values[None, :], start.values[:, None], cancel.values[:, None]
active = (d >= s) & ~(d >= c)                                # comparisons with NaT are False
p = np.where(d >= c - np.timedelta64(42, "D"), 0.15, 0.6) * active
who, day = np.nonzero(rng.random(p.shape) < p)
logins = pd.DataFrame({"customer": who, "ts": days[day]})
```

The pipeline itself:

```python
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

# subs: customer, start, cancelled_at (NaT while active);  logins: customer, ts
def window_count(events, cutoff, days_from, days_to):
    """Events per customer in [cutoff - days_from, cutoff - days_to)."""
    lo, hi = cutoff - pd.Timedelta(days=days_from), cutoff - pd.Timedelta(days=days_to)
    return events[(events.ts >= lo) & (events.ts < hi)].groupby("customer").size()

def snapshot(subs, logins, cutoff, horizon=30):
    cutoff = pd.Timestamp(cutoff)
    s = subs.set_index("customer")
    s = s[(s.start < cutoff) & ~(s.cancelled_at < cutoff)]       # active on the cutoff date
    X = pd.DataFrame(index=s.index)
    X["logins_30d"] = window_count(logins, cutoff, 30, 0).reindex(s.index, fill_value=0)
    X["logins_prev_30d"] = window_count(logins, cutoff, 60, 30).reindex(s.index, fill_value=0)
    X["tenure_m"] = (cutoff - s.start).dt.days / 30.4
    X["label"] = (s.cancelled_at < cutoff + pd.Timedelta(days=horizon)).astype(int)
    return X                                                     # features before, label after

def precision_at_top(y, score, frac=0.05):
    k = max(1, int(len(y) * frac))
    return y[np.argsort(-score)[:k]].mean()

cols = ["logins_30d", "logins_prev_30d", "tenure_m"]
train = pd.concat([snapshot(subs, logins, d) for d in ["2026-01-01", "2026-02-01", "2026-03-01"]])
test = snapshot(subs, logins, "2026-04-01")                      # a later month: out-of-time test
model = LogisticRegression(max_iter=1000).fit(train[cols], train.label)

y = test.label.to_numpy()
drop = (test.logins_prev_30d - test.logins_30d).to_numpy()
print(f"random: {y.mean():.2f}")                                # random picks hit the base rate
print(f"rule:   {precision_at_top(y, drop):.2f}")               # biggest login drop first
print(f"model:  {precision_at_top(y, model.predict_proba(test[cols])[:, 1]):.2f}")
```

On the toy data this prints 0.03, 0.39 and 0.50: a random 5 % finds the 3 % base rate, the "biggest login drop" rule is already 13× better, and the model beats the rule. That ordering — baseline, rule, model — is the comparison to show in an interview.

The last training snapshot (1 March) has its label window end on 31 March, before the test date — so no training label peeks into the test period.

## Edge cases and pitfalls

- **Leakage through time.** A feature such as "tickets this month" or "account status" can be updated *after* the prediction date. Rebuild every feature as it looked at the cutoff ("point-in-time" joins), or offline precision will be a fantasy.
- **A vague target.** Does pausing count as churn? Downgrading? Annual subscribers cannot cancel monthly — score them separately or exclude them. Write the label definition down and get the business to sign it off.
- **Accuracy on rare events.** With 3 % positives, "nobody churns" is 97 % accurate. Use precision/recall at the operating point, PR-AUC, or expected profit.
- **Predicting risk is not predicting persuadability.** The best people to target are those the offer *changes*, not those most likely to leave — some will leave anyway, others would have stayed without a discount. That is **uplift modelling**, and only a randomised experiment measures it.
- **Feedback loops.** Once offers go out, customers who would have churned stay, so future labels reflect the intervention. Keep a small random hold-out group that receives no offer.

## In the interview

Product-sense ML questions ("How would you build a model to reduce churn?") are mostly framing questions. A strong answer states the decision, the unit and target with its horizon, the prediction moment and how to avoid leakage, the label source, an offline metric tied to the action (precision@k with a capacity limit) plus the business metric and how it will be measured (an A/B test), and the baselines. Expect the follow-up: *"Your model has 0.85 AUC but the campaign lost money — why?"* Good answers: the precision at the contact budget was below break-even, the offer targeted people who would have stayed anyway (no uplift), or the offline score leaked future information.
