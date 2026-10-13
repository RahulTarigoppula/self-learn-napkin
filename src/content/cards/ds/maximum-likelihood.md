---
title: Maximum Likelihood Estimation
track: ds
tags: [statistics, probability, estimation]
difficulty: 2
minutes: 5
tldr: "Pick the parameter values under which the data you actually saw would have been most probable. 7 heads in 10 flips → p̂ = 0.7. Minimising most ML losses is doing exactly this."
analogy: "A detective with several suspects asks, for each one, how likely the clues would be if that suspect did it — and names the suspect who makes the clues least surprising."
diagram: maximum-likelihood
story:
  - title: "The data: 7 heads in 10 flips"
    text: "You flip a coin 10 times and get 7 heads. The coin's true chance of heads, p, is unknown. Which value of p best explains what you saw? Maximum likelihood answers this with one rule: choose the p that makes the observed data most probable."
  - title: "Score one guess: p = 0.5"
    text: "If the coin were fair, the chance of this exact sequence is 0.5 multiplied ten times, about 0.00098. That number, the probability of the observed data under a guessed parameter, is the likelihood L(p). It scores the guess, not the data."
  - title: "Try every p: the likelihood curve"
    text: "Do the same for every p from 0 to 1: L(p) = p⁷(1 − p)³, seven heads and three tails. The curve is the likelihood function. It is not a probability distribution over p — its area need not be 1. Near p = 0 or 1 it is almost zero: such coins would rarely give 7 heads."
  - title: The peak is the estimate
    text: "The curve peaks at p = 0.7, where L ≈ 0.0022, about 2.3 times the value for a fair coin. That peak is the maximum likelihood estimate, p̂ = 0.7 = 7/10: exactly the fraction of heads, which is what intuition suggests."
  - title: "Take logs: same peak, easy maths"
    text: "Logs turn the product into a sum: log L = 7 ln p + 3 ln(1 − p). Because log only ever increases, the peak stays at the same p. Set the slope 7/p − 3/(1 − p) to zero and solve: p = 0.7. Sums are also safe on a computer, where long products underflow to 0."
  - title: Minus log-likelihood is the training loss
    text: "Maximising log L is the same as minimising −log L. With a Bernoulli model that is log-loss (cross-entropy); with Gaussian noise it is the mean squared error. Training most models is maximum likelihood in disguise."
keyIdeas:
  - "**Likelihood** L(θ) = P(data | θ), viewed as a function of the parameter θ with the data held fixed."
  - "**MLE:** θ̂ = argmax L(θ) = argmax Σ log P(xᵢ | θ). Logs keep the argmax and turn products into sums."
  - "Coin: p̂ = heads / flips. Gaussian: μ̂ = sample mean, σ̂² = average squared deviation (divides by n, biased)."
  - "**−log-likelihood is the loss:** Gaussian noise → MSE, Bernoulli → log-loss, categorical → cross-entropy."
  - "**MAP = MLE + a prior:** maximise log P(data | θ) + log P(θ). A Gaussian prior on weights gives L2 regularisation."
quiz:
  - q: "You see 3 heads in 3 flips. What is the maximum likelihood estimate of p?"
    options: ["0.5", "0.75", "1.0", "It cannot be estimated"]
    answer: 2
    why: "L(p) = p³ increases all the way to p = 1, so p̂ = 3/3 = 1.0. MLE trusts small samples completely, which is why priors (MAP) or more data are needed."
  - q: "Why do we maximise the log-likelihood instead of the likelihood?"
    options: ["It gives a different, better estimate", "Log is increasing, so the argmax is the same, and sums are easier to differentiate and do not underflow", "Because probabilities can be negative", "It is required for discrete data only"]
    answer: 1
    why: "The log of a product is a sum of logs; derivatives of sums are simple, and a product of thousands of small probabilities underflows to 0 in floating point. The maximising θ does not change."
  - q: "Assume y = f(x) + noise, where the noise is Gaussian with constant variance. Maximum likelihood for f is equivalent to minimising…"
    options: ["Absolute error", "Log-loss", "Hinge loss", "Mean squared error"]
    answer: 3
    why: "−log of a Gaussian density is (y − f(x))² / (2σ²) plus a constant, so maximising the likelihood minimises the sum of squared errors. Laplace noise would give absolute error instead."
  - q: "What is the MLE of a Gaussian's variance for the data 2, 4, 6, 8?"
    options: ["5.0", "6.67", "2.24", "20"]
    answer: 0
    why: "The mean is 5; the squared deviations are 9, 1, 1, 9, and the MLE divides their sum 20 by n = 4, giving 5.0. Dividing by n − 1 gives the unbiased 6.67."
bigO:
  - { op: "L(0.5) for 7 H in 10", avg: "0.00098", note: "0.5¹⁰" }
  - { op: "L(0.7) for 7 H in 10", avg: "0.0022", note: "the maximum: 0.7⁷ · 0.3³" }
  - { op: "log L(0.7)", avg: "−6.11", note: "7 ln 0.7 + 3 ln 0.3" }
  - { op: "MAP with Beta(2, 2) prior", avg: "0.667", note: "(7 + 1) / (10 + 2), pulled towards 0.5" }
bigOTitle: "Key numbers"
related: [ds/loss-functions, ds/bayes-theorem, ds/logistic-regression, ds/regularisation]
prereqs: []
flashcards:
  - kind: qa
    q: "What is the difference between probability and likelihood?"
    a: "Probability fixes the parameters and asks how likely different data are. Likelihood fixes the observed data and asks how well different parameter values explain it; as a function of θ it need not integrate to 1."
  - kind: cloze
    text: "Minimising mean squared error is maximum likelihood under {{Gaussian}} noise; minimising log-loss is maximum likelihood for a {{Bernoulli}} model."
  - kind: qa
    q: "How does MAP estimation differ from MLE?"
    a: "MAP maximises the posterior, log P(data | θ) + log P(θ): the likelihood plus a log-prior. With a Gaussian prior on weights the extra term is an L2 penalty; with a flat prior MAP equals MLE."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Probabilities and statistics refresher; supervised learning: likelihood" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Probability versus likelihood

A statistical model is a family of probability distributions indexed by **parameters** θ — a coin with chance of heads p, a Gaussian with mean μ and standard deviation σ, a neural network with millions of weights. Two different questions can be asked of it:

- **Probability:** the parameters are known, what data should I expect? "A fair coin gives 7 heads in 10 flips with probability 0.117."
- **Likelihood:** the data are known, how well does each parameter value explain them? "This particular sequence of 7 heads and 3 tails is 2.3 times more probable under p = 0.7 than under p = 0.5."

Both use the same formula, P(data | θ). The difference is which part is held fixed. The **likelihood function** L(θ) = P(data | θ) treats the observed data as fixed and θ as the variable. It is not a probability distribution over θ: integrated over θ it does not have to give 1, and it does not tell you "the probability that p = 0.7" (that needs a prior — see Bayes' theorem).

## How it works

**Maximum likelihood estimation (MLE)** picks θ̂ = argmax L(θ). With independent observations x₁ … xₙ the likelihood is a product, so take logs:

> log L(θ) = Σᵢ log P(xᵢ | θ)

The log is strictly increasing, so it has its maximum at the same θ. Sums are easier to differentiate than products, and they are numerically safe: a product of 1,100 factors of 0.5 underflows to exactly 0.0 in 64-bit floating point, while the sum of logs is a harmless −762.

The recipe: write the log-likelihood, differentiate with respect to each parameter, set to zero and solve. When there is no closed form (logistic regression, neural networks), minimise the **negative log-likelihood** numerically with gradient descent.

## Worked example: the coin

Ten flips, H H T H H H T H H T: h = 7 heads, t = 3 tails. Each flip has probability p (heads) or 1 − p (tails), and flips are independent:

1. L(p) = p⁷ (1 − p)³.
2. log L(p) = 7 ln p + 3 ln(1 − p).
3. d/dp log L = 7/p − 3/(1 − p) = 0 ⇒ 7(1 − p) = 3p ⇒ **p̂ = 7/10 = 0.7**.

| p | L(p) | log L(p) |
|---|---|---|
| 0.5 | 0.00098 | −6.93 |
| 0.7 | **0.00222** | **−6.11** |
| 0.9 | 0.00048 | −7.65 |

In general p̂ = h / n: the observed fraction. The same calculation for a Bernoulli model with features — p = sigmoid(w·x) — is exactly logistic regression.

## Worked example: the Gaussian mean

Data x = 2, 4, 6, 8, modelled as draws from a Gaussian N(μ, σ²). The log-density of one point is −½ log(2πσ²) − (x − μ)² / (2σ²), so

> −log L(μ, σ) = (n/2) log(2πσ²) + Σ (xᵢ − μ)² / (2σ²)

For μ only the second term matters: **minimise the sum of squared deviations**, giving μ̂ = mean = 5. Solving for σ² gives σ̂² = (1/n) Σ (xᵢ − μ̂)² = 20 / 4 = 5.0. That estimate is **biased** — on average it is too small, because μ̂ was fitted to the same data — which is why the sample variance usually divides by n − 1 (giving 6.67).

## Losses are negative log-likelihoods

This is the most useful fact in this napkin: many standard losses are −log L for some noise model.

| Assume the target is… | −log-likelihood per example | Loss you know |
|---|---|---|
| f(x) + Gaussian noise | (y − f(x))² / 2σ² + const | **mean squared error** |
| f(x) + Laplace noise | \|y − f(x)\| / b + const | mean absolute error |
| Bernoulli with P(y = 1) = p | −[y log p + (1 − y) log(1 − p)] | **log-loss / binary cross-entropy** |
| Categorical over K classes | −log p_(true class) | **cross-entropy** (softmax) |

So choosing a loss is choosing an assumption about the noise. MSE assumes symmetric, light-tailed noise of constant variance; if outliers are common, a heavier-tailed model (Laplace, Huber) fits better.

## MAP: MLE plus a prior

MLE trusts the data completely. With 3 heads in 3 flips it says p̂ = 1 — the coin can never land tails. **Maximum a posteriori (MAP)** estimation adds a prior belief P(θ) and maximises the posterior instead:

> θ̂_MAP = argmax [ log P(data | θ) + log P(θ) ]

With a Beta(2, 2) prior on p (roughly "pretend you saw one extra head and one extra tail"), θ̂_MAP = (h + 1)/(n + 2): 8/12 ≈ 0.667 for 7 of 10 and 4/5 = 0.8 for 3 of 3. For model weights, a Gaussian prior adds −λ‖w‖² — **L2 regularisation (ridge)** — and a Laplace prior adds −λ‖w‖₁ — **L1 (lasso)**. As data grow, the likelihood term dominates and MAP approaches MLE.

## Implement it in Python

Writing a log-likelihood and maximising it (by formula or by search) works the same in any language; here it is in Python with NumPy.

```python
import numpy as np

flips = np.array([1, 1, 0, 1, 1, 1, 0, 1, 1, 0])        # 1 = heads: 7 of 10

def log_likelihood(p, x):
    """Bernoulli log-likelihood: the sum of log P(x_i | p)."""
    return np.sum(x * np.log(p) + (1 - x) * np.log(1 - p))

grid = np.linspace(0.01, 0.99, 99)                       # try many values of p
ll = np.array([log_likelihood(p, flips) for p in grid])
print(round(grid[ll.argmax()], 2), flips.mean())         # 0.7 0.7: search agrees with the formula

# Gaussian: MLE of the mean is the sample mean, of the variance the 1/n average
x = np.array([2.0, 4.0, 6.0, 8.0])
mu_hat = x.mean()                                        # 5.0
var_mle = np.mean((x - mu_hat) ** 2)                     # 5.0  (divides by n)
var_unbiased = x.var(ddof=1)                             # 6.67 (divides by n - 1)

def gaussian_nll(mu, x, sigma=1.0):
    """A constant plus the sum of squared errors / (2 sigma^2)."""
    return 0.5 * len(x) * np.log(2 * np.pi * sigma**2) + np.sum((x - mu) ** 2) / (2 * sigma**2)

mus = np.linspace(0, 10, 101)
print(mus[np.argmin([gaussian_nll(m, x) for m in mus])])  # 5.0: same as least squares

h, n = 7, 10
print((h + 1) / (n + 2))                                 # MAP with a Beta(2, 2) prior: 0.667
```

## Edge cases and pitfalls

- **Small samples overfit.** 3 of 3 heads gives p̂ = 1; a word never seen in training gets probability 0. Use a prior (MAP, Laplace smoothing) or more data.
- **MLE can be biased** — the Gaussian variance is the classic example. Unbiasedness and maximum likelihood are different goals.
- **Wrong model, confident answer.** MLE finds the best parameters *within* the model you chose. If the noise is not Gaussian, minimising MSE is still possible but no longer "maximum likelihood" for the true process.
- **Unbounded likelihoods.** In a Gaussian mixture, a component collapsing onto one point (σ → 0) drives the likelihood to infinity. Constrain σ or use a prior.
- **Likelihood is not a posterior.** L(0.7) = 0.0022 does not mean "p = 0.7 with probability 0.0022".

## In the interview

Typical prompts: "derive the MLE for a coin / a Gaussian", "why log?", "why does linear regression use squared error?", "how is MAP related to regularisation?". A strong answer writes the likelihood as a product over independent examples, takes logs, differentiates, and then connects it to practice: −log-likelihood is the loss, MSE ↔ Gaussian noise, log-loss ↔ Bernoulli, and an L2 penalty is a Gaussian prior. Expect the follow-up *"is the MLE of the variance unbiased?"* — no, it divides by n; the n − 1 version is unbiased.
