---
title: Naive Bayes
track: ds
tags: [classification, probability, text, bayes]
difficulty: 2
minutes: 5
tldr: "Score each class by its prior times the product of per-feature probabilities, pretending features are independent given the class. Count, smooth, add logs, pick the biggest."
analogy: "A doctor who sees fever and a cough asks, for each illness, 'how common is it, how often does it cause fever, how often a cough?' and multiplies, ignoring that fever and cough tend to come together. Crude, fast and usually right about the top suspect."
diagram: naive-bayes
story:
  - title: Count words in each class
    text: "Ten training emails: 4 spam, 6 ham (not spam). Count how often each word appears in each class. Spam used 'free' 6 times out of 10 words; ham used 'meeting' 8 times out of 10. These counts, plus the class shares 0.4 and 0.6, are the whole model."
  - title: "Bayes' rule"
    text: "We want P(spam | email). Bayes' rule turns it around: P(spam) × P(email | spam), divided by P(email). The divisor is the same for every class, so compare the numerators and normalise at the end."
  - title: "Naive: words are independent"
    text: "P(email | spam) for a whole email cannot be counted directly, because almost no email repeats exactly. The naive step assumes words are independent once you know the class, so the email's probability is the product of per-word probabilities. That is false for real text, and it still works."
  - title: "Zero counts: Laplace smoothing"
    text: "Ham never used 'win', so P(win | ham) = 0/10 = 0, and any email containing 'win' could never be ham. Laplace smoothing adds 1 to every count: (count + 1) / (10 + 3), where 3 is the vocabulary size. 'win' in ham becomes 1/13: rare, not impossible."
  - title: "Score the email \"free win\""
    text: "Spam: 0.4 × 7/13 × 4/13 = 0.066. Ham: 0.6 × 3/13 × 1/13 = 0.011. Divide by their total to get P(spam | email) = 86 %. Without smoothing the ham score would be exactly 0, and the filter would be 100 % sure."
  - title: "Add logs instead of multiplying"
    text: "Real emails have hundreds of words, and multiplying hundreds of small probabilities underflows to 0.0 in floating point. Add logarithms instead: log-scores of −2.71 and −4.54 pick the same winner, and a softmax over them recovers 86 %."
keyIdeas:
  - "**Bayes' rule**: P(class | x) ∝ P(class) × P(x | class). The evidence P(x) is shared by all classes, so you can ignore it until you normalise."
  - "**Naive assumption**: features are independent given the class, so P(x | class) = Π P(xᵢ | class). Training is just counting."
  - "**Laplace smoothing**: (count + α) / (total + α·V). Without it, one unseen word zeroes a whole class."
  - "**Work in log space**: sum log-probabilities to avoid underflow. The prediction is a linear function of the word counts."
  - "Fast, tiny and data-efficient: a strong baseline for text. Its probabilities are overconfident, so calibrate them if you need real probabilities."
quiz:
  - q: "Why is the method called 'naive'?"
    options: ["It assumes features are independent of each other given the class", "It ignores the class priors", "It uses only one feature", "It cannot handle more than two classes"]
    answer: 0
    why: "It factorises P(x | class) as a product over features, which is exact only if features are conditionally independent given the class. Words in real text are not, but the ranking of classes often survives."
  - q: "Without smoothing, a word that never appeared in any ham training email shows up in a new email. What is P(ham | email)?"
    options: ["Exactly 0, whatever the other words say", "0.5", "The ham prior", "It is undefined"]
    answer: 0
    why: "P(word | ham) = 0, and a product with one zero factor is zero. A single word overrides every other piece of evidence, which is why smoothing is standard."
  - q: "Priors are 0.5 and 0.5. P('prize' | spam) = 0.2 and P('prize' | ham) = 0.05. An email contains only 'prize'. What is P(spam | email)?"
    options: ["0.8", "0.2", "0.5", "0.95"]
    answer: 0
    why: "Spam: 0.5 × 0.2 = 0.1. Ham: 0.5 × 0.05 = 0.025. Normalise: 0.1 / (0.1 + 0.025) = 0.8."
  - q: "You accidentally include the same feature twice. How does naive Bayes react?"
    options: ["It counts that evidence twice and becomes more overconfident", "Nothing changes", "It ignores the copy automatically", "Training fails"]
    answer: 0
    why: "Independence is assumed, so the duplicated feature's likelihood ratio is multiplied in twice. Correlated features have the same effect in milder form, which is why naive Bayes probabilities are pushed towards 0 and 1."
bigO:
  - { op: "train", avg: "O(n · d)", note: "one pass of counting over the training data" }
  - { op: "predict one example", avg: "O(k · d)", note: "k classes; for text only the words present matter" }
  - { op: "parameters", avg: "k · d + k", note: "one probability per class per feature, plus the priors" }
bigOTitle: "Key numbers"
related: [ds/bayes-theorem, ds/logistic-regression, ds/calibration, ds/precision-recall-roc]
prereqs: [ds/bayes-theorem]
flashcards:
  - kind: qa
    q: "Write the naive Bayes decision rule."
    a: "Predict argmax over classes c of log P(c) + Σᵢ log P(xᵢ | c). The evidence P(x) is dropped because it is the same for every class."
  - kind: cloze
    text: "Laplace smoothing estimates P(word | class) as {{(count + 1) / (total words + vocabulary size)}}, so unseen words get a {{small non-zero}} probability."
  - kind: qa
    q: "Why does naive Bayes classify well even though its independence assumption is wrong?"
    a: "Classification only needs the highest-scoring class to be right, not the probabilities. Correlated evidence distorts the scores, mostly by making them overconfident, but often leaves the ranking intact. Few parameters also mean low variance with little data."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised learning: generative models, naive Bayes" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Naive Bayes is a **generative** classifier: it models how each class produces data, then uses Bayes' rule to ask which class most plausibly produced the example in front of it.

**Bayes' rule** for a class c and features x = (x₁, …, x_d):

P(c | x) = P(c) · P(x | c) / P(x)

- **P(c)**, the **prior**: how common the class is. Estimate it as the fraction of training examples in that class.
- **P(x | c)**, the **likelihood**: how probable these features are if the class is c.
- **P(x)**, the **evidence**: the same for every class, so it does not change which class wins. Compute it only to turn scores into probabilities, by dividing each class's score by the sum over classes.

The hard part is P(x | c). With thousands of words, the exact combination in a new email has almost certainly never been seen, so it cannot be counted. The **naive assumption** says that, once you know the class, the features are **conditionally independent**:

P(x₁, …, x_d | c) = P(x₁ | c) × P(x₂ | c) × … × P(x_d | c)

Now each factor is a one-word statistic you can count. Training is a single pass over the data, and the model is a table of per-class, per-feature probabilities.

### Which naive Bayes?

| Variant | Features | P(xᵢ \| c) is | Typical use |
|---|---|---|---|
| **Multinomial** | counts (words) | share of class-c word occurrences that are word i | text classification |
| **Bernoulli** | present / absent | fraction of class-c documents containing word i; absent words count too | short texts, binary features |
| **Gaussian** | continuous | a normal density with a per-class mean and variance | numeric sensor or tabular data |
| **Complement** | counts | estimated from all *other* classes | imbalanced text classes |

In the multinomial model a word that appears twice contributes its probability twice: P(free | spam)².

## Worked example

Training: 4 spam emails and 6 ham emails. Word totals:

| Word | Spam count | Ham count | P(w \| spam), smoothed | P(w \| ham), smoothed |
|---|---|---|---|---|
| free | 6 | 2 | (6+1)/13 = 0.538 | (2+1)/13 = 0.231 |
| win | 3 | 0 | (3+1)/13 = 0.308 | (0+1)/13 = 0.077 |
| meeting | 1 | 8 | (1+1)/13 = 0.154 | (8+1)/13 = 0.692 |
| total | 10 | 10 | | |

Priors: P(spam) = 4/10 = 0.4, P(ham) = 6/10 = 0.6. Smoothing uses α = 1 and vocabulary size V = 3, so each denominator is 10 + 1·3 = 13.

**New email: "free win".**

1. Spam score: 0.4 × 7/13 × 4/13 = 0.4 × 28/169 ≈ **0.0663**.
2. Ham score: 0.6 × 3/13 × 1/13 = 0.6 × 3/169 ≈ **0.0107**.
3. Normalise: P(spam | email) = 0.0663 / (0.0663 + 0.0107) ≈ **0.862**.

**Without smoothing**, P(win | ham) = 0/10, the ham score is exactly 0, and P(spam | email) = 1.0. A filter that is ever 100 % certain from one word is broken.

**Another email: "free meeting".** Spam: 0.4 × 7/13 × 2/13 ≈ 0.0331. Ham: 0.6 × 3/13 × 9/13 ≈ 0.0959. P(ham | email) ≈ 0.743. The single word "meeting" outweighs "free".

**In log space** (natural logs): spam = ln 0.4 + ln(7/13) + ln(4/13) = −0.92 − 0.62 − 1.18 = **−2.71**. Ham = ln 0.6 + ln(3/13) + ln(1/13) = −0.51 − 1.47 − 2.56 = **−4.54**. The difference is 1.83, so the odds are e^1.83 ≈ 6.2 to 1 for spam, which is 6.2 / 7.2 ≈ 0.86. Same answer, no tiny numbers.

## Why logs

A 1,000-word email multiplies about 1,000 probabilities, each around 0.001. The product is 10⁻³⁰⁰⁰, far below the smallest positive float64 (about 5 × 10⁻³²⁴), so it rounds to exactly 0.0 for *every* class and the comparison is meaningless. The log of that product is a perfectly ordinary −6,908. Because log is increasing, the class with the largest log-score is the class with the largest score. To get probabilities back, subtract the maximum log-score and apply a softmax (the **log-sum-exp** trick).

A side effect: the log-score is log P(c) + Σᵢ countᵢ · log P(wordᵢ | c), a **linear function of the word counts**. Multinomial naive Bayes is a linear classifier, like logistic regression, with weights set by counting instead of by optimisation.

## Why it works surprisingly well

- **Classification only needs the winner.** The independence assumption distorts the probabilities, but the class with the highest score is often still the right one. Domingos and Pazzani (1997) showed naive Bayes can be optimal under zero–one loss far more widely than independence actually holds.
- **Low variance.** It has only k·d + k parameters, each estimated from simple counts. With little data it often beats more flexible models, which overfit. Ng and Jordan (2001) showed it approaches its best error with fewer examples than logistic regression, which usually wins once data is plentiful.
- **Many weak clues add up.** Spam has hundreds of mildly informative words, which is exactly the setting where summing log-evidence works.

## In code

```python
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB, GaussianNB
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score

spam = ["free free win", "free win win", "free free meeting", "free"]
ham = ["meeting meeting", "meeting free", "meeting meeting", "free meeting", "meeting", "meeting"]
vec = CountVectorizer()
X = vec.fit_transform(spam + ham)                    # word-count matrix, columns: free, meeting, win
y = np.array(["spam"] * 4 + ["ham"] * 6)

nb = MultinomialNB(alpha=1.0).fit(X, y)              # alpha=1 is Laplace smoothing
email = vec.transform(["free win"])
print(nb.classes_, nb.predict_proba(email).round(3))  # ['ham' 'spam'] [[0.138 0.862]]

# The same thing by hand, in log space
counts = np.array([[2, 8, 0], [6, 1, 3]])            # rows: ham, spam; columns: free, meeting, win
log_prior = np.log([0.6, 0.4])
log_lik = np.log((counts + 1) / (counts.sum(axis=1, keepdims=True) + 3))
x = email.toarray()[0]                               # [1, 0, 1]: one 'free', one 'win'
scores = log_prior + log_lik @ x                     # sum of logs = log of the product
print(scores.round(2))                               # [-4.54 -2.71]
p = np.exp(scores - scores.max())                    # log-sum-exp: subtract the max first
print((p / p.sum()).round(3))                        # [0.138 0.862]

# Continuous features: a per-class mean and variance for each feature
Xi, yi = load_iris(return_X_y=True)
print(cross_val_score(GaussianNB(), Xi, yi, cv=5).mean())   # ≈ 0.953
```

## Edge cases and pitfalls

- **Overconfident probabilities.** Correlated features ("free", "FREE", "free!!!") are counted as independent evidence, so scores pile up and probabilities crowd towards 0 and 1. Rank by them freely, but calibrate (`CalibratedClassifierCV`) before using them as real probabilities or thresholds.
- **Duplicated or derived features** double-count evidence. Remove near-duplicates.
- **Smoothing strength α** is a hyperparameter. α = 1 is Laplace; smaller values (Lidstone, e.g. 0.1) often work better with large vocabularies. Tune it by cross-validation.
- **Words never seen in training** are simply dropped by the vectoriser at prediction time; they carry no evidence either way.
- **Gaussian NB on skewed features** fits a bell curve to something that is not one. Log-transform heavy-tailed features first.
- **Multinomial NB needs non-negative features**: counts or tf-idf weights, not standardised values.
- **Priors matter under imbalance.** With 1 % spam the prior pushes towards ham. That is correct for accuracy, but adjust the threshold if recall on spam matters more.

## When to use it

Use it as a **first baseline for text** (spam, sentiment, topic, language detection), when you have **little labelled data**, when you need **training and prediction in microseconds** or incremental updates (`partial_fit` just adds counts), and when features really are close to independent. Prefer logistic regression, gradient-boosted trees or neural models when you have plenty of data and correlated features, or need well-calibrated probabilities.

## In the interview

Typical prompts: "Derive naive Bayes from Bayes' rule", "What is naive about it?", "What happens with a word you have never seen?", "Why logs?". A strong answer writes P(c | x) ∝ P(c) Πᵢ P(xᵢ | c), names conditional independence, explains Laplace smoothing with the zero-product problem, and mentions log-space and calibration. A common follow-up is "Naive Bayes or logistic regression?" Both are linear for text. Naive Bayes is generative, trains by counting and wins with small data; logistic regression is discriminative, handles correlated features better and usually wins with more data.
