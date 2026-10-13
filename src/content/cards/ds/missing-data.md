---
title: Missing Data
track: ds
tags: [preprocessing, imputation, leakage, data-quality]
difficulty: 2
minutes: 5
tldr: "First ask why values are missing (MCAR, MAR or MNAR). Mean imputation is quick but biased; model-based imputation uses other columns. Add missing flags; fit on train only."
analogy: "Gaps in a class register. A lost page is MCAR. Pupils who skip on Fridays are MAR, because the weekday explains it. Pupils who skip because they are failing are MNAR: the very thing you want to know is why it's missing."
diagram: missing-data
story:
  - title: "MCAR: missing completely at random"
    text: "Twelve people with an age and an income; hollow rings are incomes that were never recorded. In MCAR (missing completely at random) the gaps are pure chance, such as a form page lost in the post. The missing rows look like everyone else, so dropping them costs data but adds no bias."
  - title: "MAR: depends on what you can see"
    text: "In MAR (missing at random) whether a value is missing depends on something you did observe. Here the three youngest people skipped the income question. Once you know someone's age, the gaps are random. Dropping those rows pushes the average income up, but a model that uses age can fill them in well."
  - title: "MNAR: depends on the missing value"
    text: "In MNAR (missing not at random) whether a value is missing depends on that value itself: the highest earners decline to say. Nothing you observed reveals what is gone, so no imputation fully fixes it. You need domain knowledge, a sensitivity analysis, or better data collection."
  - title: "Mean imputation: flat and biased"
    text: "Mean imputation fills every gap with the observed mean, £53.7k. Under MAR that is badly wrong: the true values are £30–36k, so the mean stays inflated (the true mean is £48.5k) and the spread shrinks, with the standard deviation falling from 11.7 to 7.4. Every filled row sits on one flat line."
  - title: "Model-based imputation follows the pattern"
    text: "Model-based imputation predicts the missing value from the other columns. A regression on age fills in 31.8, 34.9 and 37.3 (the truth is 30, 36 and 33) and brings the mean back to 48.9. kNN imputation averages similar rows. Iterative imputation (MICE-style) models each column from the others, in turns."
  - title: "Add a missing flag; fit on train only"
    text: "Add a 0/1 'was missing' column so the model can learn whether missingness itself carries signal; under MNAR that is often the only handle you have. Treat the imputer like a model: learn its means or regressions from training rows only, then apply them unchanged to validation, test and live data."
keyIdeas:
  - "**MCAR**: unrelated to anything. **MAR**: explained by observed columns. **MNAR**: depends on the missing value itself. The mechanism decides what is safe."
  - "**Dropping rows** is unbiased only under MCAR, and it always costs data. Dropping a column is reasonable when most of it is empty."
  - "**Mean/median imputation** keeps every row but shrinks variance and weakens correlations. **kNN / iterative imputation** use the other features."
  - "**Missing indicators** let the model use 'was missing' as a signal. Gradient-boosted trees can also handle NaN natively."
  - "**Fit imputers on training data only**, inside a pipeline. Never use test rows to compute fill values."
quiz:
  - q: "In a depression study, patients who feel worse are more likely to skip the follow-up questionnaire. Which mechanism is this?"
    options: ["MCAR", "MAR", "MNAR", "Not missing data at all"]
    answer: 2
    why: "Whether the score is missing depends on the unobserved score itself (how bad the patient feels). That is missing not at random, and analysing only the people who replied would make the treatment look better than it is."
  - q: "A sensor loses about 1 % of readings to random radio interference. What happens if you drop those rows?"
    options: ["Estimates become biased", "Estimates stay unbiased, with slightly less data", "It turns into MNAR", "The variance of the data doubles"]
    answer: 1
    why: "Random loss unrelated to any value is MCAR. The remaining rows are a random sample of all rows, so averages and models stay unbiased. You only lose 1 % of the data."
  - q: "What does replacing missing values with the column mean do to that column?"
    options: ["Increases its variance", "Leaves its variance unchanged", "Shrinks its variance and weakens its correlations", "Removes outliers"]
    answer: 2
    why: "Every imputed row sits exactly at the mean, which adds zero spread and ignores the other columns. The variance shrinks and the column's correlations with other features are pulled toward 0."
  - q: "You run SimpleImputer(strategy='median').fit(X_all) before splitting into train and test. What is wrong?"
    options: ["Nothing; medians are robust", "Test rows influenced the fill values, which is leakage", "The median cannot be used for imputation", "You must use the mean instead"]
    answer: 1
    why: "The fill value is a learned parameter. Computing it with test rows lets the test set shape training. Fit on the training rows, or better, put the imputer in a pipeline."
related: [ds/feature-scaling, ds/categorical-encoding, ds/train-val-test, ds/k-nearest-neighbours]
prereqs: []
flashcards:
  - kind: qa
    q: "Define MCAR, MAR and MNAR."
    a: "MCAR: missingness is unrelated to any data. MAR: missingness depends only on observed variables. MNAR: missingness depends on the unobserved value itself."
  - kind: cloze
    text: "Mean imputation {{shrinks the variance}} of a column; adding a {{missing-indicator}} column lets the model learn from missingness itself."
  - kind: qa
    q: "Can you tell MAR from MNAR using the data alone?"
    a: "No. The evidence would be in the values you don't have. You can check whether missingness relates to observed columns (which rules out MCAR), but MNAR needs domain knowledge or a sensitivity analysis."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why the reason matters

Almost every real dataset has holes: skipped survey questions, sensors that dropped out, fields added to a form halfway through the year. Most scikit-learn models refuse NaN outright, so you must do *something*. The right thing depends on **why** the values are missing. Statisticians (Rubin) name three mechanisms.

- **MCAR, missing completely at random.** The chance a value is missing has nothing to do with any data, observed or not. Examples: a lab tube breaks, a network packet is lost. The complete rows are a random sample of all rows.
- **MAR, missing at random** (a misleading name). Missingness depends only on *observed* variables. Example: younger respondents skip the income question more often, but among people of the same age, who skips is random. The complete rows are biased, but the bias can be corrected using the observed variables.
- **MNAR, missing not at random.** Missingness depends on the *missing value itself*, even after accounting for everything observed. Examples: high earners hide their income; patients drop out of a trial because the drug isn't working. The observed data alone cannot reveal what is missing.

You can test whether missingness relates to observed columns: compare rows with and without the value, or predict "is missing" from the other features. If it does, the data is not MCAR. You can never prove MAR rather than MNAR from the data, because the evidence is in the values you don't have.

## The toolbox

| Strategy | What it does | Good when | Cost |
|---|---|---|---|
| **Drop rows** (listwise deletion) | keep only complete rows | MCAR and few missing | loses data; biased under MAR/MNAR |
| **Drop the column** | discard the feature | most values missing, little signal | loses the feature |
| **Mean / median / mode / constant** | one fill value per column | quick baseline; MCAR; tree models | shrinks variance, weakens correlations |
| **kNN imputation** | average of the k most similar rows | MAR with informative neighbours | O(n²) distances; needs scaled features |
| **Iterative (MICE-style)** | regress each column on the others, cycling until stable | MAR, correlated features | slower; still underestimates uncertainty |
| **Missing indicator** | extra 0/1 column per gappy feature | missingness carries signal (often MNAR) | more columns |
| **Native NaN handling** | trees learn which branch NaNs take | gradient boosting (XGBoost, LightGBM, HistGB) | model-specific |

The median beats the mean for skewed columns such as income. For categorical columns, use the mode or, often better, an explicit `"missing"` category.

## Worked example (the MAR case from the diagram)

Ages 21, 25, 28, 33, 37, 41, 45, 49, 53, 57, 61, 64 with incomes (£k) 30, 36, 33, 44, 41, 50, 47, 56, 54, 63, 60, 68. The three youngest incomes go missing (MAR: driven by age).

| Approach | Values filled for ages 21 / 25 / 28 | Mean income | SD income |
|---|---|---|---|
| Truth (all 12 known) | 30 / 36 / 33 | 48.5 | 11.7 |
| Drop rows (9 left) | — | 53.7 | 8.5 |
| Mean imputation | 53.7 / 53.7 / 53.7 | 53.7 | 7.4 |
| Regression on age | 31.8 / 34.9 / 37.3 | 48.9 | 11.1 |

The regression fitted on the 9 complete rows is income ≈ 15.26 + 0.786 × age, so at age 21 it predicts 15.26 + 16.50 = 31.8. Deletion and mean imputation both overstate the average by £5.2k, and mean imputation also squeezes the spread. Regression imputation recovers both, because under MAR the observed variable (age) explains the missingness. If the gaps had been MNAR (the top earners hiding), every method would underestimate high incomes. A missing-indicator column would at least let a downstream model learn "missing income ⇒ probably rich".

Single regression imputation still puts every filled value exactly on the line, so the SD (11.1) is a little too small. For statistical **inference** (confidence intervals, p-values), use **multiple imputation**: impute several times with random noise, analyse each copy, and pool the results. For **prediction**, single imputation plus indicators is usually enough.

## In code

```python
import numpy as np
from sklearn.experimental import enable_iterative_imputer  # noqa: F401  (unlocks IterativeImputer)
from sklearn.impute import SimpleImputer, KNNImputer, IterativeImputer
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline

age = np.array([21, 25, 28, 33, 37, 41, 45, 49, 53, 57, 61, 64], dtype=float)
income = np.array([30, 36, 33, 44, 41, 50, 47, 56, 54, 63, 60, 68], dtype=float)
X = np.column_stack([age, income])
X[:3, 1] = np.nan                                 # MAR: the three youngest skipped the question

mean_imp = SimpleImputer(strategy="mean", add_indicator=True).fit(X)
print(mean_imp.transform(X)[:3])                  # [21, 53.67, 1], ... : fill value plus a 0/1 flag column

reg_imp = IterativeImputer(estimator=LinearRegression()).fit(X)
print(reg_imp.transform(X)[:3, 1])                # ≈ [31.76, 34.90, 37.26]

knn_imp = KNNImputer(n_neighbors=2).fit(X)
print(knn_imp.transform(X)[:3, 1])                # [42.5, 42.5, 42.5]: nearest donors are ages 33 and 37

# In a real model: impute inside the pipeline so fill values come from training folds only
model = make_pipeline(SimpleImputer(strategy="median", add_indicator=True), LinearRegression())
# sklearn.ensemble.HistGradientBoostingRegressor accepts NaN directly, no imputer needed
```

The kNN result shows a real limitation: it can only average existing rows. With no young donors, it fills £42.5k, better than the mean but worse than the regression, which can extrapolate the trend.

## Edge cases and pitfalls

- **Leakage.** Fill values are learned parameters. Fitting on all rows before splitting lets test data shape training. Always fit on train, inside a `Pipeline`, so cross-validation refits per fold.
- **Missing in production but not in training** (or the reverse) breaks models silently. Check missingness rates in live data, not just in training.
- **Placeholder codes** such as −1, 0, 999 or "N/A" disguise missing values as real ones. Convert them to NaN first; an age of 999 will wreck a mean.
- **Imputing the target**: rows with a missing label can't be used for supervised training. Drop them, don't invent labels.
- **Structural missingness** isn't really missing. "Number of pregnancies" for men, or "spouse's income" for single people, should get 0 or "not applicable", not an imputed guess.
- **Scale before kNN imputation**, because it uses distances.

## In the interview

Expect: "How do you handle missing values?" Lead with *why is it missing?*: name MCAR/MAR/MNAR with a one-line example each. Then give a strategy: drop if MCAR and rare; median plus a missing indicator as a strong baseline; kNN or iterative imputation when other features predict the gap; models that accept NaN; and *fit on training data only*. A common follow-up: "What does mean imputation do to correlations?" It weakens them, because the filled rows ignore the other features. Another: "Does a missing indicator help even if you impute?" Yes, because it preserves the information that a value was missing, which is often predictive.
