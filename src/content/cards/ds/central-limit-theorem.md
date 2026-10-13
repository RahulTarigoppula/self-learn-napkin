---
title: Central Limit Theorem
track: ds
tags: [statistics, probability, inference, sampling]
difficulty: 2
minutes: 5
tldr: "Average enough independent draws and the average follows a bell curve, whatever the shape of the data, with spread σ / √n. That is why confidence intervals and A/B tests work on messy data."
analogy: "One person's guess of a jar's sweet count can be wildly off in either direction. Average the guesses of 25 people and the quirks cancel: the average lands near the truth, and its errors trace out a neat bell."
diagram: central-limit-theorem
story:
  - title: "A skewed population: waiting times"
    text: "The time between customers at a coffee shop follows an exponential distribution: mean 2 minutes, standard deviation σ = 2 minutes, and very skewed — 63 % of waits are shorter than the mean, a few are very long. A single wait looks nothing like a bell curve."
  - title: Average 4 waits at a time
    text: "Now take 4 random waits, average them, and repeat many times. The averages crowd towards 2 and the long right tail shrinks: skewness falls from 2 to 2 / √4 = 1. The distribution of these averages is called the sampling distribution of the mean."
  - title: "Average 25: a bell appears"
    text: "Average 25 waits at a time and the sampling distribution is almost a normal bell centred on 2, with skewness only 0.4. That is the central limit theorem: for independent draws with finite variance, the mean of n draws is approximately normal once n is large enough."
  - title: "Spread shrinks: SE = σ / √n"
    text: "The spread of the sample means is the standard error, SE = σ / √n: 2 for single waits, 1 for averages of 4, 0.4 for averages of 25. Quadrupling the sample only halves the error — the diminishing return behind the cost of every survey and experiment."
  - title: "95 % of means: 2 ± 1.96 × 0.4"
    text: "Because the means are close to normal, about 95 % of them land within 1.96 standard errors of the true mean: between 1.22 and 2.78 minutes (exactly 95.2 % do). Turned around, one sample's mean ± 1.96 SE is a confidence interval — the engine of A/B tests."
  - title: When it fails
    text: "The theorem needs finite variance, independent observations and enough data. Averages of Cauchy data never settle down; skewed or heavy-tailed data need far more than the folk rule of 30; and correlated data, such as one user's many sessions, have a larger SE than σ / √n."
keyIdeas:
  - "The **sampling distribution of the mean** becomes approximately normal as n grows, whatever the population's shape — given independence and finite variance."
  - "It is centred on the population mean μ, with spread the **standard error σ / √n**."
  - "**4× the data → ½ the error.** Precision grows only with √n."
  - "It is why **confidence intervals** (mean ± 1.96 SE) and **z-tests** work on non-normal data such as conversions or revenue."
  - "**n ≥ 30 is folklore**: skewed data need more; heavy tails (infinite variance) or dependent data break the result."
quiz:
  - q: "A population has standard deviation 12. What is the standard error of the mean of a random sample of 36?"
    options: ["12", "6", "2", "0.33"]
    answer: 2
    why: "SE = σ / √n = 12 / √36 = 12 / 6 = 2. The sample mean varies far less than individual values."
  - q: "What exactly does the central limit theorem say becomes approximately normal?"
    options: ["The data themselves, once you collect enough", "The distribution of the sample mean (or sum) over repeated samples", "The population, as it grows", "Any statistic, such as the maximum"]
    answer: 1
    why: "The raw data keep their shape — exponential waits stay skewed however many you collect. It is the mean of n draws, viewed across many repeated samples, that becomes bell-shaped."
  - q: "You want a confidence interval half as wide. How must the sample size change?"
    options: ["Multiply it by 4", "Double it", "Multiply it by √2", "Halve it"]
    answer: 0
    why: "Width ∝ SE = σ / √n. Halving it needs √n to double, so n must grow 4-fold."
  - q: "You average 1,000 draws from a Cauchy distribution, many times over. What do the averages look like?"
    options: ["A narrow bell around 0, SD ≈ 1 / √1000", "All exactly 0", "A uniform distribution", "Exactly as spread out as single draws"]
    answer: 3
    why: "The Cauchy distribution has no finite mean or variance, so the CLT does not apply. The mean of n Cauchy draws has the same Cauchy distribution as one draw: extreme values keep dominating the average."
related: [ds/p-values-and-confidence-intervals, ds/ab-testing, ds/maximum-likelihood]
prereqs: []
flashcards:
  - kind: qa
    q: "State the central limit theorem in one sentence."
    a: "For independent, identically distributed draws with mean μ and finite variance σ², the sample mean is approximately normal with mean μ and standard deviation σ / √n when n is large."
  - kind: cloze
    text: "The standard error of the mean is {{σ / √n}}, so four times the data gives {{half}} the error."
  - kind: qa
    q: "Name three situations in which the CLT approximation breaks down."
    a: "Heavy tails with infinite variance (Cauchy, some Pareto), dependent observations (time series, clustered users), and small samples from strongly skewed data."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What the theorem says

Take independent draws X₁, …, Xₙ from any distribution with mean μ and finite variance σ². Their average X̄ = (X₁ + … + Xₙ) / n is itself a random quantity: a different sample gives a different average. The **central limit theorem (CLT)** says that, as n grows,

(X̄ − μ) / (σ / √n)  approaches a standard normal distribution N(0, 1).

In plain words: **X̄ is approximately normal, centred on μ, with standard deviation σ / √n.** The same holds for the sum, which is approximately normal with mean nμ and standard deviation σ√n.

Three ideas are easy to confuse:

| Distribution | What varies | Shape |
|---|---|---|
| **Population** | single values (one wait) | whatever it is — here exponential, skewed |
| **Sample** | the n values you collected | looks like the population, just noisier |
| **Sampling distribution of the mean** | the average, across many hypothetical samples | approximately normal — this is what the CLT is about |

The CLT is a different statement from the **law of large numbers**. The law of large numbers says X̄ gets close to μ as n grows; the CLT describes the *shape and size* of the leftover error: normal, with width σ / √n.

## Why it happens

An average mixes many independent pieces. An unusually long wait is likely to be paired with ordinary ones, so extremes get diluted, while the many middling combinations pile up in the middle. Dice show this clearly: one die is flat (each face 1/6); the sum of two dice is a triangle peaking at 7 (6 of the 36 outcomes); the sum of ten dice is already a convincing bell.

The leftover asymmetry fades at a known rate: the skewness of X̄ is the population's skewness divided by √n. For the exponential (skewness 2), that is 1 at n = 4, 0.4 at n = 25 and 0.2 at n = 100. The excess kurtosis (tail weight) falls even faster, like 1 / n.

## Worked example: waiting times

Waits are exponential with μ = σ = 2 minutes. The mean of n waits has an exactly known distribution (a gamma distribution), so we can check how well "normal with SE σ / √n" works:

| n | SE = 2 / √n | skewness of X̄ | μ ± 1.96 SE | exact share inside | below / above |
|---|---|---|---|---|---|
| 1 | 2.0 | 2.0 | −1.92 to 5.92 | 94.8 % | 0 % / 5.2 % |
| 4 | 1.0 | 1.0 | 0.04 to 3.96 | 95.5 % | 0.0 % / 4.5 % |
| 25 | 0.4 | 0.4 | 1.22 to 2.78 | 95.2 % | 1.3 % / 3.5 % |
| 100 | 0.2 | 0.2 | 1.61 to 2.39 | 95.1 % | 1.9 % / 3.0 % |

At n = 1 the "interval" includes impossible negative waits and all the misses are on one side. By n = 100 the two tails (1.9 % and 3.0 %) are approaching the 2.5 % / 2.5 % a true normal would give. The total inside is near 95 % throughout, but the balance between the tails is what tells you the normal approximation has arrived.

## Why it underpins confidence intervals and A/B tests

Because X̄ ≈ N(μ, σ² / n), the interval X̄ ± 1.96 · σ / √n contains μ in about 95 % of samples — a **confidence interval** — and the distance (X̄ − μ₀) / (σ / √n) can be compared with the normal distribution to get a **p-value**.

In practice σ is unknown and is replaced by the sample standard deviation s. That adds uncertainty, which the **t-distribution** (with n − 1 degrees of freedom) accounts for; with large n, t and normal agree. For a conversion rate, each user is a 0/1 draw with σ = √(p(1 − p)), so the CLT makes the observed rate approximately normal — exactly what the two-proportion z-test in an A/B test relies on. The difference of two independent means is also approximately normal, with SE = √(SE₁² + SE₂²).

How good is "approximately" for skewed data? Simulating the usual 95 % t-interval on exponential waits:

| n | actual coverage of the nominal 95 % interval |
|---|---|
| 5 | 88 % |
| 25 | 92 % |
| 100 | 94 % |

Skewed data — and revenue per user is far more skewed than this — need samples in the hundreds or thousands, not 30.

The simulation idea, in language-neutral pseudocode:

```text
repeat many times:
    sample = draw n values from the population
    record mean(sample)
standard error   ≈ standard deviation of the recorded means      (theory: σ / √n)
95 % of means lie within 1.96 × standard error of the true mean (if the CLT has kicked in)
```

## When it fails

- **Infinite variance (heavy tails).** The Cauchy distribution has no mean or variance; the average of n Cauchy draws has *exactly the same* distribution as a single draw, so averaging never helps. Pareto-type data with tail index ≤ 2 (some incomes, file sizes, insurance losses) have infinite variance: averages converge, if at all, to a non-normal, heavy-tailed limit.
- **Dependence.** If observations are positively correlated — consecutive days of a time series, many sessions from the same user, pupils in the same class — they carry less information than n independent draws, and the true SE is larger than σ / √n. Confidence intervals come out too narrow and p-values too small. Analyse at the independent unit (the user) or use methods for clustered data.
- **Small n with strong skew.** See the coverage table above. Use more data, transform the data (for example, a logarithm), or use the **bootstrap**.
- **Not every statistic.** The CLT covers means and sums (and, with extra conditions, smooth functions of them). The maximum of a sample, for example, has entirely different limiting behaviour.

## Implement it in Python

The same simulation works in any language or library with a random-number generator; here it is with NumPy and SciPy.

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(0)
mu = sigma = 2.0                                      # exponential waits: mean 2, SD 2 minutes

for n in [1, 4, 25, 100]:
    waits = rng.exponential(scale=mu, size=(100_000, n))   # 100,000 samples of size n
    means = waits.mean(axis=1)                             # one sample mean per row
    print(f"n={n:3d}  SD of means {means.std():.3f} (theory {sigma / np.sqrt(n):.3f})"
          f"  skewness {stats.skew(means):.2f} (theory {2 / np.sqrt(n):.2f})")

# How often does the usual 95 % t-interval (mean +/- t * s / sqrt(n)) contain the true mean 2?
for n in [5, 25, 100]:
    x = rng.exponential(scale=mu, size=(100_000, n))
    half = stats.t.ppf(0.975, df=n - 1) * x.std(axis=1, ddof=1) / np.sqrt(n)
    covered = np.abs(x.mean(axis=1) - mu) <= half
    print(f"n={n:3d}  t-interval coverage {covered.mean():.3f}")

# Cauchy data: the mean of 1,000 draws is as spread out as a single draw
cauchy_means = rng.standard_cauchy(size=(10_000, 1_000)).mean(axis=1)
print("Cauchy means, middle 50 %:", np.percentile(cauchy_means, [25, 75]).round(2))
```

Output: the simulated SDs of the means are 2.004, 1.006, 0.399 and 0.200 (theory 2, 1, 0.4, 0.2) and the skewness 2.01, 1.02, 0.40, 0.20; t-interval coverage 0.883, 0.925, 0.942; and the middle half of the Cauchy averages runs from −0.97 to 1.01 — the same as for a single Cauchy draw (−1 to 1). Note `std(ddof=1)` for the sample standard deviation s, which divides by n − 1.

## In the interview

Expect "explain the CLT to a non-statistician" or "why can we use a z-test on revenue, which is not normal?". A strong answer distinguishes the population, the sample and the sampling distribution; states σ / √n and its √n consequence; ties the result to confidence intervals and A/B tests; and lists the conditions — independence, finite variance, enough data for the skew. A common follow-up: "is n = 30 enough?" — it depends on skewness and tails; check by simulation or use the bootstrap.
