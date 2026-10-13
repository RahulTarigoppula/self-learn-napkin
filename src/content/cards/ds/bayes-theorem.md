---
title: Bayes' Theorem
track: ds
tags: [probability, statistics, inference]
difficulty: 2
minutes: 4
tldr: "P(A|B) = P(B|A)·P(A) / P(B): turn 'how likely is the evidence if A is true' into 'how likely is A now that I see the evidence', starting from how common A was."
analogy: "A smoke alarm that beeps for burnt toast as well as for fires. When it beeps you should not assume a fire: toast is burnt far more often than houses burn, so most beeps are toast."
diagram: bayes-theorem
story:
  - title: Start with 10,000 people
    text: "A disease affects 1 % of people. A test catches 90 % of sick people but also flags 9 % of healthy ones. You test positive. Most people guess about 90 %. To check, picture 10,000 concrete people instead of percentages."
  - title: "1 % have the disease: the prior"
    text: "1 % of 10,000 is 100 sick people; the other 9,900 are healthy. This split, made before anyone is tested, is the prior: what you believe before seeing evidence. It is the number intuition forgets."
  - title: "Test the sick: 90 % sensitivity"
    text: "Of the 100 sick people, 90 % test positive: 90 true positives and 10 missed cases (false negatives). The 90 % is P(+ | sick), the chance of the evidence if the disease is present."
  - title: "Test the healthy: 9 % false positives"
    text: "Of the 9,900 healthy people, 9 % also test positive: 891 false positives. A small rate applied to a huge group produces a big number, ten times more than the 90 true positives."
  - title: Keep only the positives
    text: "You tested positive, so you are one of the 90 + 891 = 981 positives. Only 90 of them are sick: P(sick | +) = 90 / 981 ≈ 9 %, not 90 %. That is Bayes' theorem done by counting. Ignoring the 1 % is called base-rate neglect."
  - title: "A second positive: the posterior becomes the prior"
    text: "The 9 % posterior is your new prior. In odds form each positive multiplies the odds by 0.90 / 0.09 = 10: 1:99 becomes 10:99 (9 %), and a second independent positive gives 100:99, about 50 %."
keyIdeas:
  - "**P(A|B) = P(B|A) · P(A) / P(B)**, read as posterior = likelihood × prior ÷ evidence."
  - "**P(B|A) ≠ P(A|B).** A 90 % sensitive test does not mean a positive is 90 % likely to be right."
  - "**Base-rate neglect:** when A is rare, false positives from the large not-A group swamp the true positives."
  - "Compute P(B) with the **law of total probability**: P(B) = P(B|A)P(A) + P(B|not A)P(not A)."
  - "**Odds form:** posterior odds = prior odds × likelihood ratio. Each new piece of evidence multiplies again."
  - "Natural frequencies (\"of 10,000 people…\") make Bayes problems easy to reason about and explain."
quiz:
  - q: "1 % prevalence, 90 % sensitivity, 9 % false-positive rate. You test positive. Roughly how likely are you to be sick?"
    options: ["About 9 %", "About 90 %", "About 91 %", "About 50 %"]
    answer: 0
    why: "Per 10,000 people: 90 true positives and 891 false positives. 90 / 981 ≈ 9.2 %. The rare disease means false positives outnumber true ones ten to one."
  - q: "Same test, but it is used only on patients with symptoms, where 10 % have the disease. Now what is P(sick | +)?"
    options: ["About 9 %", "About 53 %", "About 90 %", "Still exactly 9 %, the test has not changed"]
    answer: 1
    why: "0.10·0.90 = 0.090 true positives versus 0.90·0.09 = 0.081 false positives, so 0.090 / 0.171 ≈ 53 %. The same test means more when the prior is higher."
  - q: "What is base-rate neglect?"
    options: ["Forgetting to normalise, so the probabilities do not sum to 1", "Drawing firm conclusions from too small a sample of cases", "Confusing correlation with causation when A and B move together", "Judging P(A|B) from P(B|A) while ignoring how rare A is"]
    answer: 3
    why: "People read the test's accuracy as the answer and ignore the prior P(A). When A is rare, the prior dominates and the posterior stays low."
  - q: "A positive result has likelihood ratio 10. Prior odds are 1:99. What are the posterior odds after two independent positive results?"
    options: ["10:99", "20:99", "100:99", "1:99"]
    answer: 2
    why: "In odds form each independent piece of evidence multiplies the odds by its likelihood ratio: 1:99 × 10 × 10 = 100:99, a probability of about 50 %."
bigO:
  - { op: "P(sick)", avg: "1 %", note: "the prior: 100 of 10,000" }
  - { op: "P(+ | sick)", avg: "90 %", note: "sensitivity: 90 of 100" }
  - { op: "P(+ | healthy)", avg: "9 %", note: "false-positive rate: 891 of 9,900" }
  - { op: "P(sick | +)", avg: "≈ 9.2 %", note: "the posterior: 90 of 981" }
  - { op: "after a 2nd positive", avg: "≈ 50 %", note: "assuming the tests are independent given the disease" }
bigOTitle: "Key numbers"
related: [ds/naive-bayes, ds/maximum-likelihood, ds/precision-recall-roc, ds/calibration]
prereqs: []
flashcards:
  - kind: qa
    q: "Write Bayes' theorem and name each term."
    a: "P(A|B) = P(B|A)·P(A) / P(B). P(A) is the prior, P(B|A) the likelihood, P(B) the evidence (normaliser) and P(A|B) the posterior."
  - kind: cloze
    text: "Ignoring how rare a condition is when interpreting a positive test is called {{base-rate neglect}}; the rare-case rate is the {{prior}}."
  - kind: qa
    q: "Why can a 90 %-sensitive test give only a 9 % chance of disease after a positive result?"
    a: "When the disease is rare (1 %), the healthy group is 99 times larger, so even a 9 % false-positive rate produces ten times more false positives (891) than true positives (90)."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Probabilities and statistics refresher: Bayes' rule" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The question Bayes answers

You often know how likely some **evidence** is if a hypothesis is true. A test detects 90 % of sick people; a spam filter sees "free money" in 40 % of spam. What you actually want is the reverse: given that I *see* the evidence, how likely is the hypothesis? These two numbers, P(evidence | hypothesis) and P(hypothesis | evidence), are different, and confusing them is one of the most common reasoning errors in medicine, law and data science. Bayes' theorem converts one into the other.

## How it works

Write A for the hypothesis ("sick") and B for the evidence ("tested positive"). Both ways of computing the probability that A and B happen together must agree:

P(A and B) = P(A|B)·P(B) = P(B|A)·P(A)

Divide by P(B) and you have **Bayes' theorem**:

> P(A|B) = P(B|A) · P(A) / P(B)

Each piece has a name:

| Term | Name | In the example |
|---|---|---|
| P(A) | **prior**: belief before the evidence | 1 % of people are sick |
| P(B\|A) | **likelihood**: how expected the evidence is if A is true | 90 % sensitivity |
| P(B) | **evidence** or marginal likelihood: how often B happens at all | 9.81 % of people test positive |
| P(A\|B) | **posterior**: belief after the evidence | ≈ 9.2 % |

P(B) is usually not given directly. You get it with the **law of total probability**, by adding up every way B can happen:

P(B) = P(B|A)·P(A) + P(B|not A)·P(not A)

The denominator is only a normaliser: it makes the posteriors of A and not-A add up to 1. That is why people often write **posterior ∝ likelihood × prior**.

## Worked example

Prevalence 1 %, **sensitivity** P(+|sick) = 90 %, **false-positive rate** P(+|healthy) = 9 % (so the **specificity** is 91 %).

1. P(+) = 0.90 × 0.01 + 0.09 × 0.99 = 0.0090 + 0.0891 = 0.0981.
2. P(sick | +) = 0.0090 / 0.0981 ≈ **0.092**.

The same in **natural frequencies**, which is what the diagram draws: of 10,000 people, 100 are sick and 90 of them test positive; 9,900 are healthy and 891 of them test positive. Of the 981 positives, 90 are sick: 9.2 %. Research on risk communication finds that people solve such problems far more often when they are posed as counts rather than percentages, so this framing is worth using when you explain results to others.

Note the flip side: of the 9,019 negatives only 10 are sick, so P(sick | −) ≈ 0.11 %. A negative result is very reassuring; a positive one mostly means "test again".

## Updating: the posterior becomes the prior

Evidence arrives in pieces, and Bayes chains naturally. After the first positive your belief is 9.2 %; use that as the prior for the second test. The **odds form** makes this easy. Odds are P/(1 − P), and

> posterior odds = prior odds × likelihood ratio, where likelihood ratio = P(B|A) / P(B|not A)

Here the likelihood ratio of a positive is 0.90 / 0.09 = 10. Prior odds 1:99 → 10:99 (9.2 %) → 100:99 (50.3 %) → 1000:99 (91 %). Three positives are needed before you are confident. This only holds if the tests are **conditionally independent** given the disease status. Repeating the same test on the same sample, which may fail the same way twice, does not count as new evidence.

## Implement it in Python

Bayes' theorem is one line of arithmetic in any language; here it is in Python, with a NumPy simulation as a check.

```python
import numpy as np

def posterior(prior, sensitivity, false_pos_rate):
    """P(disease | positive test) by Bayes' theorem."""
    p_pos = sensitivity * prior + false_pos_rate * (1 - prior)   # law of total probability
    return sensitivity * prior / p_pos

print(round(posterior(0.01, 0.90, 0.09), 4))      # 0.0917

# Sequential updating: yesterday's posterior is today's prior
p = 0.01
for test in range(1, 4):
    p = posterior(p, 0.90, 0.09)
    print(test, round(p, 4))                       # 0.0917, 0.5025, 0.9099

# Check by simulation with a million people
rng = np.random.default_rng(0)
n = 1_000_000
sick = rng.random(n) < 0.01
positive = np.where(sick, rng.random(n) < 0.90, rng.random(n) < 0.09)
print(round(sick[positive].mean(), 3))             # ≈ 0.092
```

## Where it shows up in data science

- **Classifier metrics.** Precision is P(actually positive | predicted positive), which is a Bayes posterior. A model with 99 % recall and a 1 % false-positive rate can still have poor precision on a rare class (fraud, defects), for exactly the reason above.
- **Naive Bayes** classifies by computing P(class | features) ∝ P(features | class)·P(class), assuming features are independent within each class.
- **Bayesian inference** treats a model's parameters as uncertain, puts a prior on them and updates it with data into a posterior distribution. MAP estimation (the most probable parameter under the posterior) is maximum likelihood plus a prior.
- **A/B testing** in the Bayesian style reports "the probability that B beats A", which is also a posterior.

## Edge cases and pitfalls

- **Base-rate neglect**: judging P(A|B) from P(B|A) alone. The rarer A is, the bigger the gap.
- **Prosecutor's fallacy.** "The chance of this DNA match if innocent is 1 in a million, so he is guilty with probability 999,999 in a million." That swaps P(match | innocent) for P(innocent | match). In a city of 10 million about 10 innocent people would match too.
- **Shifting priors.** The same test means different things in different populations: 9 % in a screening programme with 1 % prevalence, 53 % in a clinic where 10 % of patients have the disease.
- **Zero priors are permanent.** If P(A) = 0, no evidence can ever raise it. Keep small but non-zero priors for things you are unsure about.
- **Dependence.** Multiplying likelihood ratios assumes the pieces of evidence are independent given A; correlated evidence counted twice makes you overconfident.

## In the interview

Expect the medical-test question in some form (disease, fraud alerts, spam). A strong answer writes the formula, computes P(B) with the law of total probability, gives the number, and then explains it with natural frequencies ("out of 10,000 people…"). Mention base-rate neglect by name and how the answer changes with prevalence. A common follow-up: *"How many positive tests until you are 90 % sure?"* Work in odds with the likelihood ratio: three independent positives take 1:99 to 1000:99, about 91 %.
