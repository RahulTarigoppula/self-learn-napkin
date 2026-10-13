---
title: A/B Testing
track: ds
tags: [statistics, experiments, hypothesis-testing, product]
difficulty: 2
minutes: 6
tldr: "Randomly split users between old and new, fix the sample size up front from the baseline rate and the smallest lift that matters, then check the split, the metric and guardrails. No peeking."
analogy: "A clinical trial for a web page. Patients are assigned by coin flip so the groups differ only by the treatment, the trial size is set before it starts, and nobody gets to stop the trial the first day the numbers look good."
diagram: ab-testing
story:
  - title: Hypothesis and random split
    text: "Does a new checkout page sell more? Write the hypothesis first: H₀, the null hypothesis, says the conversion rate (share of users who place at least one order) is the same in both versions. Randomise per user by hashing the user id, so each person always sees one version and the groups differ only by chance and by the page."
  - title: Sample size from baseline and MDE
    text: "Today 10 % of users convert. The smallest lift worth detecting is called the minimum detectable effect (MDE); here it is 1 percentage point (pp), up to 11 %. Accept a 5 % false-positive rate (α) and aim for an 80 % chance of catching a real 1 pp lift (power). Then n = (1.96 + 0.8416)² × (0.09 + 0.0979) / 0.01² ≈ 14,750 users per arm, where 1.96 is the z-value for a two-sided 5 % test and 0.84 the one for 80 % power."
  - title: "Run time: whole weeks"
    text: "With 3,000 eligible users a day, the 29,500 users take about 10 days. Round up to 14: whole weeks cover weekday and weekend behaviour, and the extra days let the novelty effect fade (people clicking a change only because it is new)."
  - title: Do not peek and stop early
    text: "Checking the p-value daily and stopping at the first 'significant' day breaks the 5 % guarantee. When there is no real effect, 14 daily looks produce a false win about 22 % of the time. Fix the sample size in advance, or use a sequential test built for repeated looks."
  - title: "Check the split first: SRM"
    text: "Before reading any metric, check the split. We planned 50 / 50 but got 15,100 and 14,400 users. A chi-squared test gives χ² = 16.6, p < 0.0001: this sample ratio mismatch (SRM) means assignment or logging is broken, and every result is suspect until it is fixed."
  - title: Read the result and the guardrails
    text: "In a healthy run, A converts 1,475 of 14,750 users (10.0 %) and B 1,600 of 14,750 (10.85 %). The lift is +0.85 pp, z = 2.38, p = 0.017, with a 95 % confidence interval of +0.15 to +1.54 pp. Ship only if guardrail metrics such as latency and refunds have not got worse."
keyIdeas:
  - "Fix the **hypothesis, primary metric, randomisation unit, MDE, α and power before** launch."
  - "n per arm ≈ (z₁₋α/₂ + z_power)² × [p₁(1 − p₁) + p₂(1 − p₂)] / MDE². **Halving the MDE quadruples** the sample."
  - "Run **whole weeks** until the planned n; watch for novelty effects in the first days."
  - "**No peeking**: repeated significance checks inflate false positives. Use a fixed horizon or a proper sequential test."
  - "Read in order: **SRM check**, primary metric with its **confidence interval**, then **guardrails**."
quiz:
  - q: "Baseline 10 %, MDE 1 pp needs about 14,750 users per arm. Roughly how many for an MDE of 0.5 pp?"
    options: ["About 7,400", "About 29,500", "About 57,800", "About 14,750"]
    answer: 2
    why: "n scales with 1 / MDE², so halving the MDE multiplies n by about 4. Exactly: (1.96 + 0.8416)² × (0.09 + 0.105 × 0.895) / 0.005² ≈ 57,760."
  - q: "You randomise each page view rather than each user. What goes wrong?"
    options: ["Nothing; more units means more power, so the test finishes sooner", "One user lands in both arms, so units are correlated and variance is understated", "The test becomes one-sided, so it can only detect positive lifts", "SRM becomes impossible to check, since page views cannot be counted per arm at all"]
    answer: 1
    why: "The same person contributes to both arms, behaviour carries over between versions, and page views from one user are correlated. The usual standard errors come out too small and the p-values too optimistic. Randomise at the level you analyse, usually the user."
  - q: "A 50 / 50 test shows 50,000 users in A and 48,800 in B. What should you do first?"
    options: ["Ship B if its metric is better, since the split barely affects it", "Re-weight B by 50,000 / 48,800 so both arms count equally", "Check assignment and logging: χ² ≈ 14.6, p ≈ 0.0001 is a sample ratio mismatch", "Nothing; a gap of about 1 % between arms is normal noise at this scale"]
    answer: 2
    why: "With ~99,000 users, chance alone almost never produces a gap this size. SRM usually means bots, redirects, crashes or logging that hit one arm more, and those users are not random, so re-weighting does not fix it."
  - q: "The test ends with lift +0.85 pp, 95 % CI +0.15 to +1.54 pp. Which reading is right?"
    options: ["There is a 95 % chance the true lift is exactly 0.85 pp, the point estimate", "Lifts from about 0.15 to 1.54 pp fit the data, so the real gain may be small", "The lift is at least 1 pp, because the test was powered for a 1 pp MDE", "The result is not significant, because the interval is wider than 1 pp"]
    answer: 1
    why: "The interval lists the effect sizes compatible with the data at the 95 % level. It excludes 0, so the result is significant, but its lower end (0.15 pp) may be too small to justify the change: that is a business decision."
related: [ds/p-values-and-confidence-intervals, ds/central-limit-theorem, ds/ml-problem-framing]
prereqs: [ds/p-values-and-confidence-intervals]
flashcards:
  - kind: qa
    q: "What is a sample ratio mismatch and why check it first?"
    a: "The observed split differs from the planned one by more than chance (chi-squared test). It means assignment or logging is broken, so the arms are no longer comparable and every metric is untrustworthy."
  - kind: cloze
    text: "Sample size grows with {{1 / MDE²}}: halving the minimum detectable effect needs about {{4×}} the users."
  - kind: qa
    q: "Why is stopping an A/B test as soon as p < 0.05 a problem?"
    a: "Each look is another chance for noise to cross the line, so the real false-positive rate climbs far above 5 % (about 22 % with 14 daily looks). Fix n in advance or use sequential testing."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The pieces of an A/B test

An **A/B test** (online controlled experiment) compares a **control** (A, the current version) with a **treatment** (B, the change) by randomly assigning units to each. Randomisation is the whole point: it balances every other cause (device, country, mood, time of day) between the groups on average, so a difference beyond chance can be attributed to the change.

Decide these *before* launch and write them down:

| Piece | Example | Why it matters |
|---|---|---|
| Hypothesis | "the new checkout raises conversion" | H₀: no difference; H₁: some difference |
| Primary metric | conversion rate (share of users with ≥ 1 order) | one metric decides; others are secondary |
| Randomisation unit | user (hash of user id) | analysis must use the same unit |
| Baseline | 10 % | drives the variance p(1 − p) |
| MDE | +1 pp (10 % → 11 %) | the smallest effect worth shipping |
| α (significance level) | 0.05, two-sided | the false-positive rate you accept |
| Power | 0.80 | chance of detecting an effect of size MDE if it exists |
| Guardrails | latency, refunds, unsubscribes, errors | things that must not get worse |

**Hashing** the user id (with a per-experiment salt) gives a stable, random-looking assignment: the same user sees the same version on every visit without storing anything.

## Sample size

The test compares the two conversion rates. The difference of two rates has standard error SE = √(p₁(1 − p₁)/n + p₂(1 − p₂)/n). To have probability *power* of reaching significance when the true difference is the MDE δ, the expected difference must sit (z₁₋α/₂ + z_power) standard errors from zero:

δ = (z₁₋α/₂ + z_power) · SE  ⇒  **n = (z₁₋α/₂ + z_power)² · [p₁(1 − p₁) + p₂(1 − p₂)] / δ²** per arm.

Worked example with p₁ = 0.10, p₂ = 0.11, α = 0.05 (z = 1.960), power 0.80 (z = 0.8416):

- (1.960 + 0.8416)² = 7.849
- p₁(1 − p₁) + p₂(1 − p₂) = 0.0900 + 0.0979 = 0.1879
- n = 7.849 × 0.1879 / 0.0001 ≈ **14,750 per arm**, 29,500 in total.

| Change | n per arm |
|---|---|
| MDE 2 pp (10 % → 12 %) | 3,838 |
| **MDE 1 pp (10 % → 11 %)** | **14,749** |
| MDE 0.5 pp (10 % → 10.5 %) | 57,760 |
| MDE 1 pp, power 0.9 | 19,744 |

A quick mental check is n ≈ 16 · p(1 − p) / δ² = 16 × 0.09 / 0.0001 = 14,400. Two things get expensive. Small effects cost you because n ∝ 1/δ². Rare baselines cost you too, since rare events need far more users relative to their size.

## Run time

Run time = total users needed / eligible users per day = 29,500 / 3,000 ≈ 10 days. Round **up to whole weeks** (here 14 days), because behaviour differs by weekday. Watch for **novelty effects** (users click a new button because it is new; the lift fades) and **primacy effects** (users resist change at first; the lift grows). Plotting the daily lift shows both; when in doubt, run longer or analyse returning users separately.

## Why you must not peek

A p-value threshold of 0.05 promises a 5 % false-positive rate for **one** look at the end. Looking every day and stopping at the first p < 0.05 gives noise many chances to cross the line. Simulating tests with no true effect:

| Equally spaced looks | Chance of a false "win" |
|---|---|
| 1 (fixed horizon) | 5 % |
| 2 | 8 % |
| 5 | 14 % |
| 10 | 19 % |
| 14 (daily for two weeks) | 22 % |

You have two ways out. Commit to the sample size and look once, or use a method built for repeated looks: **group sequential designs** (for example O'Brien–Fleming boundaries, which demand very small p-values at early looks) or **always-valid p-values** (mSPRT), which many experimentation platforms provide.

## Reading the result

1. **SRM check.** Compare the observed split with the plan using a chi-squared test. For 15,100 vs 14,400 against 14,750 each: χ² = (350² + 350²) / 14,750 = 16.6, p ≈ 0.00005. Platforms usually alarm at p < 0.001, because with this many users chance alone barely moves the split. Common causes: bots filtered in one arm only, redirects that lose users, a crash in the new version, or caching. Do not interpret the metrics until it is explained.
2. **Primary metric.** Two-proportion z-test: pooled rate 3,075 / 29,500 = 0.1042, SE under H₀ = √(0.1042 × 0.8958 × 2 / 14,750) = 0.00356, z = 0.0085 / 0.00356 = 2.38, two-sided p = 0.017. The confidence interval does not assume H₀, so it uses the unpooled SE, √(0.100 × 0.900 / 14,750 + 0.1085 × 0.8915 / 14,750), which also comes to 0.00356 here. The 95 % interval for the lift is 0.0085 ± 1.96 × 0.00356 = **+0.15 to +1.54 pp**.
3. **Practical significance.** The interval excludes 0, but its lower end is only 0.15 pp. Whether that justifies the change is a product decision, not a statistical one.
4. **Guardrails.** Check that latency, refunds, error rates and so on have not moved in the wrong direction.

The whole plan and analysis in language-neutral pseudocode:

```text
BEFORE: n = (z(1 − α/2) + z(power))² × (p₁(1 − p₁) + p₂(1 − p₂)) / MDE²     # per arm
        days = ceil_to_whole_weeks(2n / eligible users per day)
DURING: arm(user) = hash(salt + user_id) mod 2                            # stable 50/50 split
AFTER (once, at the planned n):
    if chi-squared test of (n_A, n_B) vs 50/50 gives p < 0.001: stop, debug the split
    pooled = (x_A + x_B) / (n_A + n_B)
    z  = (rate_B − rate_A) / sqrt(pooled (1 − pooled) (1/n_A + 1/n_B))
    p  = 2 × P(standard normal > |z|)
    CI = (rate_B − rate_A) ± 1.96 × sqrt(rate_A(1 − rate_A)/n_A + rate_B(1 − rate_B)/n_B)
    ship if CI is above 0, the lift is worth it, and guardrails are fine
```

## Implement it in Python

The same calculations work in any language with a normal and chi-squared distribution function; here they use SciPy.

```python
import numpy as np
from scipy import stats

def n_per_arm(p1, mde, alpha=0.05, power=0.8):
    """Users per arm for a two-sided test of p1 vs p1 + mde (normal approximation)."""
    p2 = p1 + mde
    z_a, z_b = stats.norm.ppf(1 - alpha / 2), stats.norm.ppf(power)
    return int(np.ceil((z_a + z_b) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2)) / mde ** 2))

def srm_pvalue(n_a, n_b):
    """Chi-squared test that the observed split matches the planned 50/50."""
    return stats.chisquare([n_a, n_b]).pvalue

def two_proportion_test(x_a, n_a, x_b, n_b, alpha=0.05):
    p_a, p_b = x_a / n_a, x_b / n_b
    pooled = (x_a + x_b) / (n_a + n_b)                       # under H0 both rates are equal
    z = (p_b - p_a) / np.sqrt(pooled * (1 - pooled) * (1 / n_a + 1 / n_b))
    p_value = 2 * stats.norm.sf(abs(z))
    se = np.sqrt(p_a * (1 - p_a) / n_a + p_b * (1 - p_b) / n_b)   # unpooled SE for the CI
    half = stats.norm.ppf(1 - alpha / 2) * se
    return p_b - p_a, z, p_value, (p_b - p_a - half, p_b - p_a + half)

print(n_per_arm(0.10, 0.01))                                 # 14749
print(f"SRM p = {srm_pvalue(15_100, 14_400):.6f}")         # 0.000046 -> investigate first
diff, z, p, ci = two_proportion_test(1_475, 14_750, 1_600, 14_750)
print(f"lift {diff:+.4f}  z {z:.2f}  p {p:.3f}  95% CI [{ci[0]:+.4f}, {ci[1]:+.4f}]")
```

Output: 14749; SRM p = 0.000046; lift +0.0085, z 2.38, p 0.017, 95 % CI [+0.0015, +0.0154]. Library notes: `stats.norm.ppf` gives z-values from probabilities and `stats.norm.sf` the upper-tail probability; `stats.chisquare` assumes equal expected counts unless you pass `f_exp`. The statsmodels package has ready-made equivalents (`NormalIndPower`, `proportions_ztest`).

## Edge cases and pitfalls

- **Unit mismatch.** Randomise by user but compute a per-session or per-click rate, and observations from one user are correlated: standard errors come out too small. Analyse per user, or use the delta method or bootstrap for ratio metrics.
- **Interference.** In marketplaces and social networks, treated users affect control users (shared drivers, shared inventory). Randomise by city, cluster or time slot instead (switchback tests).
- **Many metrics, many variants, many segments.** Each extra comparison is another chance for a false positive. Pre-register one primary metric and correct for multiple comparisons when slicing.
- **Variance reduction.** CUPED adjusts each user's metric using their pre-experiment behaviour; it can cut the needed sample substantially when past and current behaviour correlate.
- **Underpowered "no difference".** A non-significant result with a wide interval means "we could not tell", not "there is no effect".

## In the interview

A typical prompt: "design an experiment for a new checkout button". Walk through hypothesis and primary metric, randomisation unit, sample size from baseline, MDE, α and power (show the formula), run time in whole weeks, SRM check, the test with a confidence interval, guardrails, and the decision rule. Expect follow-ups on peeking ("can we stop early if it looks great?"), novelty effects, and what to do when users interact with each other.
