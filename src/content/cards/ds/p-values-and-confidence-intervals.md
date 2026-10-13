---
title: P-values & Confidence Intervals
track: ds
tags: [statistics, hypothesis-testing, inference, experiments]
difficulty: 2
minutes: 6
tldr: "A p-value says how surprising your data would be if nothing were going on; a confidence interval gives the effect sizes the data fit. Neither is the chance your hypothesis is true."
analogy: "A smoke alarm assumes 'no fire' and goes off when the air would be very unusual for a fire-free kitchen. A beep tells you the air is surprising, not the exact chance there is a fire. Burnt toast can set it off too."
diagram: p-values-and-confidence-intervals
story:
  - title: "Assume the null: a fair coin"
    text: "Is a coin biased? Start from the null hypothesis H₀: it is fair. Then the number of heads in 100 flips varies around 50 with standard deviation √(100 × 0.5 × 0.5) = 5. The bell curve shows how often each count would happen by luck alone."
  - title: "Our data: 62 heads"
    text: "We flip 100 times and get 62 heads. How surprising is that if H₀ is true? Measure the distance in standard deviations: z = (62 − 50) / 5 = 2.4, far out in the tail of the bell."
  - title: "p-value: as extreme or more, if H₀ is true"
    text: "The p-value is the probability, assuming H₀, of a result at least as extreme as ours: 62 or more heads, or 38 or fewer (a two-sided test). The exact binomial calculation gives p = 0.021; the bell-curve approximation gives 0.016. Only about 1 fair coin in 48 looks this lopsided."
  - title: Compare with α = 0.05
    text: "Before flipping we chose a significance level α = 0.05, the false-alarm rate we accept. Since 0.021 < 0.05, we reject H₀. This does not mean a 2 % chance that the coin is fair: p was computed by assuming H₀ is true, so it cannot be the probability that H₀ is true."
  - title: 95 % confidence interval for P(heads)
    text: "An interval shows how big the bias might be. The estimate is 0.62 with standard error √(0.62 × 0.38 / 100) = 0.049, so 0.62 ± 1.96 × 0.049 = [0.525, 0.715]. The 95 % describes the method: over many repeats, 95 % of intervals built this way contain the true value. 0.5 lies outside, agreeing with the test."
  - title: "Twenty tests: Bonferroni"
    text: "Run 20 tests on fair coins, each with a 5 % false-positive rate, and the chance that at least one looks significant is 1 − 0.95²⁰ = 64 %. The Bonferroni correction tests each at α / 20 = 0.0025, keeping the chance of any false positive at or below 5 %."
keyIdeas:
  - "**p-value** = P(data at least this extreme | H₀ true). It is not P(H₀ true), not the chance the result is a fluke, and not an effect size."
  - "Reject H₀ when p < α. α is the false-positive rate you accept, fixed **before** seeing the data."
  - "A **95 % confidence interval** comes from a method that captures the true value 95 % of the time. It excludes the null value exactly when the matching two-sided test gives p < 0.05."
  - "**Statistical ≠ practical significance**: a million flips with 50.2 % heads gives p ≈ 0.00006 for a negligible bias."
  - "**Multiple comparisons** inflate false positives; use Bonferroni (α / m), Holm, or false-discovery-rate control."
quiz:
  - q: "A test gives p = 0.03. Which statement is correct?"
    options: ["There is a 3 % chance that H₀ is true, given the data observed", "If H₀ were true, data this extreme would occur about 3 % of the time", "There is a 97 % chance the effect is real, so it is likely genuine", "The effect is 3 % in size, measured against the control group"]
    answer: 1
    why: "The p-value is computed assuming H₀ holds; it measures how surprising the data are under that assumption. Turning it into the probability that H₀ is true needs prior information (Bayes' theorem)."
  - q: "100 flips give 60 heads; the exact two-sided p-value is 0.057. At α = 0.05, what do you conclude?"
    options: ["The coin is proven fair, because p is above 0.05", "The coin is biased with 94.3 % probability, since 1 − p = 0.943", "Reject H₀, because 60 heads is far from the expected 50", "Fail to reject H₀: the data do not give strong evidence of bias"]
    answer: 3
    why: "p > α, so we do not reject H₀. That is absence of evidence, not evidence of fairness: with only 100 flips a modest bias (say 0.55) would often go undetected."
  - q: "You test 10 independent hypotheses, all truly null, each at α = 0.05. What is the chance of at least one false positive?"
    options: ["5 %", "About 10 %", "About 40 %", "50 %"]
    answer: 2
    why: "1 − 0.95¹⁰ = 0.40. Bonferroni would test each at 0.05 / 10 = 0.005 to bring the family-wise error rate back to at most 5 %."
  - q: "A test on 10 million users finds a statistically significant lift of 0.01 percentage points (p < 0.001). What follows?"
    options: ["The effect is likely real but tiny; judge it by its interval and cost", "Ship it, because p < 0.001 proves the effect is large", "The test must be broken, since tiny lifts cannot be significant", "Re-run it with fewer users to get a cleaner, more honest p-value"]
    answer: 0
    why: "With huge samples the standard error is tiny, so trivial effects become significant. Significance answers 'is it zero?'; the interval answers 'how big?', which is what the decision needs."
related: [ds/ab-testing, ds/central-limit-theorem, ds/bayes-theorem]
prereqs: [ds/central-limit-theorem]
flashcards:
  - kind: qa
    q: "Define a p-value in one sentence."
    a: "The probability, computed assuming the null hypothesis is true, of getting a result at least as extreme as the one observed."
  - kind: cloze
    text: "A 95 % confidence interval is built by a procedure that {{contains the true value in 95 % of repeated samples}}; any one interval either contains it or {{does not}}."
  - kind: qa
    q: "What does the Bonferroni correction do, and what is its drawback?"
    a: "It tests each of m hypotheses at α / m so the chance of any false positive stays ≤ α. It is conservative: with many tests it loses power and misses real effects."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The logic of a hypothesis test

A hypothesis test is an argument by surprise. You assume the boring explanation and ask whether the data would be unusual under it.

1. **State the hypotheses.** The **null hypothesis** H₀ is the "nothing is going on" claim: the coin is fair, the new page converts the same. The **alternative** H₁ is what you suspect: the coin is biased (two-sided) or biased towards heads (one-sided).
2. **Choose a significance level** α, usually 0.05, *before* collecting data. It is the false-positive rate you are willing to accept.
3. **Compute a test statistic** that measures how far the data are from what H₀ predicts: here the number of heads, or its z-score.
4. **Find its distribution under H₀** (the *null distribution*) and compute the **p-value**: the probability under H₀ of a statistic at least as extreme as the one observed.
5. **Decide.** If p < α, reject H₀ ("statistically significant"). Otherwise, fail to reject. That is not the same as accepting H₀.

```text
choose α                                     # before seeing data, e.g. 0.05
T_obs = statistic(data)                      # e.g. number of heads
p = P(|T − expected under H₀| ≥ |T_obs − expected under H₀|, assuming H₀)   # two-sided
if p < α: reject H₀ else: fail to reject H₀
report the estimate and its confidence interval either way
```

Two kinds of error are possible:

| | H₀ actually true | H₀ actually false |
|---|---|---|
| Reject H₀ | **Type I error** (false positive), probability α | correct; probability = **power** |
| Do not reject | correct | **Type II error** (false negative), probability β = 1 − power |

## Worked example: the coin

Under H₀ the number of heads X in 100 flips is Binomial(100, 0.5): mean 100 × 0.5 = 50, standard deviation √(100 × 0.5 × 0.5) = 5. We observed 62.

- **Exact:** P(X ≥ 62) = 0.0105, and by symmetry P(X ≤ 38) = 0.0105, so the two-sided p = **0.021**.
- **Normal approximation:** z = (62 − 50) / 5 = 2.4, and P(|Z| ≥ 2.4) = 0.016. The approximation treats a discrete count as continuous; the **continuity correction** z = (61.5 − 50) / 5 = 2.3 gives 0.021, matching the exact answer.

Since 0.021 < 0.05, reject H₀ at the 5 % level. With 60 heads instead, the exact p is 0.057 and we would not reject. It is a useful reminder that 0.05 is a convention, not a cliff between truth and falsehood.

## What a p-value is not

- **Not P(H₀ is true).** p is P(data | H₀); the probability of H₀ given the data needs a prior and Bayes' theorem. If most coins you test are fair, a small p can still leave H₀ quite likely.
- **Not the probability the result is due to chance.** That is the same mistake in different words.
- **Not an effect size.** p mixes the size of the effect with the sample size. A tiny effect with a huge n gives a tiny p.
- **Not evidence for H₀ when large.** p = 0.4 means the data are compatible with H₀, and possibly with many other values too.
- Under H₀ (with a continuous test statistic) p is **uniformly distributed** between 0 and 1, so p < 0.05 happens 5 % of the time purely by chance. That is what α controls.

## Confidence intervals

A test answers "is it exactly 0.5?"; an interval answers "how big is it?". Most intervals have the form

**estimate ± critical value × standard error.**

For the coin, p̂ = 0.62, SE = √(p̂(1 − p̂) / n) = √(0.62 × 0.38 / 100) = 0.0485, and the critical value for 95 % is 1.96 (the central 95 % of a standard normal lies within ±1.96). So the interval is 0.62 ± 0.095 = **[0.525, 0.715]**.

**Correct interpretation:** if we repeated the 100-flip experiment many times and built an interval each time, about 95 % of those intervals would contain the true P(heads). The 95 % belongs to the procedure. Once computed, this particular interval either contains the true value or it does not; saying "there is a 95 % probability the true value is in [0.525, 0.715]" is the common misreading (it is a Bayesian credible-interval statement).

**Useful facts:**

- **Duality with tests:** a 95 % interval excludes a value exactly when the matching two-sided test rejects that value at α = 0.05. Here 0.5 is outside, and p = 0.021 < 0.05.
- **Width shrinks like 1/√n:** four times the flips roughly halves the interval.
- **Better intervals exist** for proportions near 0 or 1 or small n: the Wilson interval here is [0.522, 0.709].

## Statistical vs practical significance

Flip a coin 1,000,000 times and get 50.2 % heads. SE = √(0.25 / 1,000,000) = 0.0005, z = 0.002 / 0.0005 = 4.0, p ≈ 0.00006: overwhelmingly significant. The 95 % interval [0.501, 0.503] shows the bias is real but tiny, and irrelevant for most purposes. Always report the effect size and its interval, and decide with a threshold that matters to the business or the science, not only p < 0.05.

## Multiple comparisons

Each test at α = 0.05 has a 5 % false-positive rate when its null is true. Run m independent tests of true nulls and the **family-wise error rate** (chance of at least one false positive) is 1 − 0.95^m: 40 % for 10 tests, 64 % for 20. Slicing an A/B test by 20 countries, or trying 20 metrics, is exactly this.

- **Bonferroni:** test each at α / m. Simple, valid under any dependence, but conservative.
- **Holm:** sort p-values and compare the smallest with α / m, the next with α / (m − 1), and so on, stopping at the first that fails. Same guarantee, more power.

```text
Bonferroni:  reject H_i  if  p_i < α / m
Holm:        sort p ascending: p(1) ≤ p(2) ≤ … ≤ p(m)
             for k = 1 … m: if p(k) < α / (m − k + 1): reject H(k) else: stop
```
- **Benjamini–Hochberg:** controls the **false discovery rate** instead: the expected share of false positives among the discoveries. It is standard for screening many hypotheses such as genes or features.

## Implement it in Python

The same tests work in any language with binomial and normal distribution functions; here they use SciPy.

```python
import numpy as np
from scipy import stats

heads, n = 62, 100
test = stats.binomtest(heads, n, p=0.5)                  # exact two-sided test of H0: P(heads) = 0.5
print(f"exact p = {test.pvalue:.4f}")

z = (heads - n * 0.5) / np.sqrt(n * 0.5 * 0.5)            # normal approximation: (62 - 50) / 5
print(f"z = {z:.2f}, approx p = {2 * stats.norm.sf(abs(z)):.4f}")

p_hat = heads / n
se = np.sqrt(p_hat * (1 - p_hat) / n)                     # standard error of the estimate
lo, hi = p_hat - 1.96 * se, p_hat + 1.96 * se
print(f"95% Wald CI [{lo:.3f}, {hi:.3f}]")
ci = test.proportion_ci(confidence_level=0.95, method="wilson")   # better behaved near 0 and 1
print(f"95% Wilson CI [{ci.low:.3f}, {ci.high:.3f}]")

# 20 tests on fair coins: how many look "significant"?
rng = np.random.default_rng(4)
pvals = np.array([stats.binomtest(rng.binomial(n, 0.5), n).pvalue for _ in range(20)])
print("raw p < 0.05:", (pvals < 0.05).sum(), "| Bonferroni p < 0.0025:", (pvals < 0.05 / 20).sum())
print("BH-adjusted p < 0.05:", (stats.false_discovery_control(pvals) < 0.05).sum())
```

Output: exact p = 0.0210; z = 2.40, approx p = 0.0164; Wald CI [0.525, 0.715]; Wilson CI [0.522, 0.709]; and among 20 fair coins, 2 raw "discoveries", none after Bonferroni or Benjamini–Hochberg. Library notes: `binomtest` (SciPy ≥ 1.7) does the exact test and `proportion_ci` its intervals; `false_discovery_control` (SciPy ≥ 1.11) returns Benjamini–Hochberg-adjusted p-values; statsmodels' `multipletests` offers Bonferroni, Holm and more.

## Edge cases and pitfalls

- **p-hacking:** trying analyses, subgroups or stopping points until p < 0.05 makes the nominal α meaningless. Pre-register the analysis.
- **One-sided tests** halve the p-value but are only legitimate if the direction was fixed before seeing the data.
- **Assumptions matter:** the usual tests assume independent observations. Correlated data (repeated measures, users with many sessions) make p-values far too small.
- **Peeking** at a running experiment and stopping when p < 0.05 is multiple testing in disguise.
- **"Not significant" with a small sample** usually means "we could not tell"; look at the interval's width.

## In the interview

Expect "explain a p-value to a product manager" and "what does a 95 % confidence interval mean?". A strong answer defines p as a conditional probability under H₀, explicitly says what it is not, interprets the interval as a statement about the method, separates statistical from practical significance, and raises multiple comparisons when many metrics or segments are involved. A frequent follow-up: "the test came back p = 0.06; what do you tell the team?" Report the effect and its interval, note the result is inconclusive rather than negative, and discuss whether the test had enough power.
