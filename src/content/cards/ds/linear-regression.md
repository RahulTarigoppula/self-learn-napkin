---
title: Linear Regression
track: ds
tags: [regression, linear-models, fundamentals]
difficulty: 1
minutes: 5
tldr: "Predict a number as a weighted sum of features, ŷ = b + w·x, and pick the weights that make the sum of squared residuals as small as possible. R² says how much of the spread the line explains."
analogy: "Stretching a stiff rod through a cloud of nails, with a rubber band from every nail to the rod. Each band pulls harder the further it is stretched, and the rod settles where the total tension is lowest. A nail far away pulls very hard."
diagram: linear-regression
griddle: linear-fit
story:
  - title: Five students, hours vs score
    text: "Five students report hours studied and a test score out of 10: (1, 2), (2, 4), (3, 5), (4, 4), (5, 5). We want a rule ŷ = b + w·x that predicts the score from the hours — a straight line through the cloud."
  - title: Residuals from a guess
    text: "Any line makes mistakes. The residual is actual minus predicted, r = y − ŷ. Start with the laziest guess, ŷ = 4 (the mean score) for everyone: residuals −2, 0, 1, 0, 1. Squared and summed, Σr² = 4 + 0 + 1 + 0 + 1 = 6."
  - title: "Least squares: the smallest Σr²"
    text: "Least squares picks the line with the smallest sum of squared residuals — the total area of the red squares. Here it is ŷ = 2.2 + 0.6x with Σr² = 2.4. No other straight line scores lower. Squaring makes every miss count as positive and big misses count a lot."
  - title: Solve it in one line
    text: "No search is needed. The best slope is Σ(x − x̄)(y − ȳ) / Σ(x − x̄)² = 6 / 10 = 0.6, and the line always passes through the point of means (3, 4), so b = 4 − 0.6 × 3 = 2.2. Read it as: each extra hour adds 0.6 points on average."
  - title: "R²: how much of the spread it explains"
    text: "The mean guess left Σr² = 6; the line leaves 2.4. So R² = 1 − 2.4 / 6 = 0.6: the line explains 60 % of the variation in scores. R² = 1 is a perfect fit; R² = 0 is no better than predicting the mean."
  - title: One outlier drags the line
    text: "Add a sixth student who studied 6 hours and scored 1. Because errors are squared, that single far point pulls hard: the slope flips from +0.6 to −0.09 and R² falls to 0.01. Always plot the data and the residuals before trusting the line."
keyIdeas:
  - "**Least squares** minimises Σ(y − ŷ)². With features in a matrix X it has a closed form, the **normal equation** `w = (XᵀX)⁻¹Xᵀy`; gradient descent reaches the same answer."
  - "A **coefficient** is the change in ŷ per unit of that feature, **holding the other features fixed** — an association, not proof of cause."
  - "**R² = 1 − SSE/SST**: the share of variance explained. It never falls when you add features, so judge models on held-out data."
  - "Assumptions: **linearity, independent errors, constant error variance, normal errors**. Breaking them mostly breaks the error bars and p-values, not the fitting."
  - "Squared error makes the fit **sensitive to outliers**, above all to points with extreme x (high leverage)."
quiz:
  - q: "A model predicts house price = 40,000 + 2,500 × area_m² + 8,000 × bedrooms. What does 2,500 mean?"
    options: ["Each m² adds 2,500 to the price, whatever the bedrooms", "With bedrooms held fixed, each extra m² goes with 2,500 more in predicted price", "Area causes 2,500 of the price", "2,500 is the average price per m² in the data"]
    answer: 1
    why: "A multiple-regression coefficient is a partial effect: the change in the prediction for one more unit of that feature while the others stay the same. It describes an association in the data, not a causal effect."
  - q: "A model leaves a sum of squared residuals of 30. Around the mean, the targets have a total sum of squares of 120. What is R²?"
    options: ["0.25", "0.75", "0.90", "4"]
    answer: 1
    why: "R² = 1 − SSE / SST = 1 − 30 / 120 = 0.75. The model explains 75 % of the variation around the mean."
  - q: "Plotting residuals against predictions shows a funnel: small spread for small predictions, large spread for large ones. Which assumption is broken?"
    options: ["Linearity", "Homoscedasticity (constant error variance)", "Independence", "No multicollinearity"]
    answer: 1
    why: "A funnel means the error variance grows with the prediction — heteroscedasticity. The coefficients stay unbiased, but standard errors and p-values are wrong. Use robust standard errors, model log(y) or use weighted least squares."
  - q: "Which single new point changes the fitted slope the most?"
    options: ["A point at the mean x, far above the line", "A point at an extreme x, far from the line", "A point exactly on the line", "A point at the mean x and mean y"]
    answer: 1
    why: "Points at extreme x have high leverage: the line pivots around (x̄, ȳ), so a far-out x has a long lever arm. In the example, (6, 1) flips the slope from 0.6 to −0.09, while (3, 10) at the mean x leaves the slope at exactly 0.6 and only lifts the line."
bigO:
  - { op: "fit by normal equation", avg: "O(n·p² + p³)", note: "n rows, p features; fine up to a few thousand features" }
  - { op: "one gradient-descent epoch", avg: "O(n·p)", note: "for huge n or p, or streaming data" }
  - { op: "predict one row", avg: "O(p)", note: "one dot product" }
related: [ds/loss-functions, ds/gradient-descent, ds/regularisation, ds/logistic-regression]
prereqs: []
flashcards:
  - kind: qa
    q: "Write the normal equation and say what it minimises."
    a: "w = (XᵀX)⁻¹Xᵀy, where X has a column of ones for the intercept. It gives the weights that minimise the sum of squared residuals Σ(y − Xw)²."
  - kind: cloze
    text: "R² = 1 − {{SSE / SST}}; a model that always predicts the mean has R² = {{0}}."
  - kind: qa
    q: "Can R² be negative?"
    a: "Yes, on data the model was not fitted to: if its predictions are worse than predicting the mean of that data, SSE > SST and R² < 0. On its own training data, least squares with an intercept gives R² between 0 and 1."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised learning: linear regression, normal equations" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The model

**Linear regression** predicts a number (the **target** y) as a weighted sum of input **features** x₁ … xₚ plus a constant:

ŷ = b + w₁x₁ + w₂x₂ + … + wₚxₚ

b is the **intercept** (the prediction when every feature is 0) and each wⱼ is a **coefficient** or weight. With one feature this is a straight line; with two, a flat plane; with more, a hyperplane. "Linear" means linear in the *weights* — you may feed in x², log x or x₁·x₂ as features, and it is still linear regression.

## How it works

1. **Residuals.** For each training row the **residual** is rᵢ = yᵢ − ŷᵢ: positive when the model under-predicts, negative when it over-predicts.
2. **The objective.** **Ordinary least squares (OLS)** picks the weights that minimise the **sum of squared errors**, SSE = Σrᵢ² (equivalently the mean squared error, MSE = SSE / n). Squaring makes all errors positive, punishes big misses more than small ones and gives a smooth bowl-shaped loss with exactly one bottom (when no feature is a copy or exact combination of the others).
3. **Closed form.** Put the features in a matrix X (one row per example, plus a column of ones for the intercept) and the targets in a vector y. Setting the gradient of SSE to zero gives the **normal equation**: XᵀX w = Xᵀy, so w = (XᵀX)⁻¹Xᵀy. With a single feature it reduces to slope = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)² and intercept = ȳ − slope · x̄, which is why the line always passes through (x̄, ȳ).
4. **Gradient view.** The gradient of the MSE is (2/n) Xᵀ(Xw − y). Gradient descent steps against it and reaches the same weights, because the loss is convex. It is the route for very large datasets or when a penalty term has no closed form.

Both routes in pseudocode:

```text
X = feature matrix with a leading column of 1s;  y = targets;  n = number of rows
closed form:   w = solve(XᵀX, Xᵀy)                      # never form the inverse explicitly
iterative:     w = zeros;  repeat:  w = w − η · (2/n) · Xᵀ(Xw − y)
```

In practice libraries do not invert XᵀX; they solve the least-squares problem with a QR or SVD decomposition, which is more numerically stable.

> **Tip:** Least squares is also maximum likelihood. If y = b + w·x + ε with ε ~ Normal(0, σ²), the weights that make the observed data most probable are exactly the ones that minimise Σr².

## Worked example

Hours x = [1, 2, 3, 4, 5], scores y = [2, 4, 5, 4, 5]. Means: x̄ = 3, ȳ = 4.

| x | y | x − x̄ | y − ȳ | (x − x̄)(y − ȳ) | (x − x̄)² | ŷ = 2.2 + 0.6x | r = y − ŷ | r² |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 | −2 | −2 | 4 | 4 | 2.8 | −0.8 | 0.64 |
| 2 | 4 | −1 | 0 | 0 | 1 | 3.4 | 0.6 | 0.36 |
| 3 | 5 | 0 | 1 | 0 | 0 | 4.0 | 1.0 | 1.00 |
| 4 | 4 | 1 | 0 | 0 | 1 | 4.6 | −0.6 | 0.36 |
| 5 | 5 | 2 | 1 | 2 | 4 | 5.2 | −0.2 | 0.04 |
| | | | **sum** | **6** | **10** | | **0** | **2.4** |

Slope = 6 / 10 = 0.6, intercept = 4 − 0.6 × 3 = 2.2. In matrix form XᵀX = [[5, 15], [15, 55]] and Xᵀy = [20, 66]; solving gives the same [2.2, 0.6]. The residuals sum to zero, which always happens when the model has an intercept.

**R².** The total sum of squares around the mean is SST = Σ(y − ȳ)² = 4 + 0 + 1 + 0 + 1 = 6. So R² = 1 − SSE / SST = 1 − 2.4 / 6 = **0.6**. With one feature, R² equals the squared correlation: r = 6 / √(10 × 6) ≈ 0.775 and 0.775² = 0.6.

## Interpreting coefficients

- **Slope 0.6:** one more hour of study goes with 0.6 more points on average. In multiple regression, wⱼ is the change in ŷ per unit of xⱼ **with every other feature held fixed**.
- **Units matter.** Measure hours in minutes and the slope becomes 0.01. Compare the importance of features only after standardising them.
- **Correlated features** (multicollinearity) split credit unpredictably between themselves: coefficients can swing wildly or flip sign between samples even while predictions stay good.
- **Association, not causation.** A coefficient tells you how ŷ moves with x in this data. A hidden variable that drives both (motivation drives hours and score) can create the whole effect.

## Assumptions, and what breaks

The fitting step works on any data. The assumptions matter for *trusting* the line and for its standard errors, confidence intervals and p-values.

| Assumption | Check | If it fails |
|---|---|---|
| **Linearity:** the mean of y is a linear function of the features | Residuals vs predictions show no curve | Predictions are biased in a systematic pattern. Add features (x², log x, interactions) or use a non-linear model. |
| **Independent errors** | Residuals vs time or group; Durbin–Watson test | Common in time series and repeated measures. Standard errors come out too small, so you are over-confident. |
| **Homoscedasticity:** constant error variance | No funnel in the residual plot | Coefficients stay unbiased but standard errors are wrong. Use robust (heteroscedasticity-consistent) errors, model log y or use weighted least squares. |
| **Normal errors** | Q–Q plot of residuals | Only needed for exact small-sample tests and prediction intervals; with many rows the central limit theorem covers the coefficient tests. |

Two more conditions: errors must not be correlated with the features (otherwise, e.g. with an omitted variable, the coefficients are biased), and no feature may be an exact linear combination of others (then XᵀX cannot be inverted). Under linearity, uncorrelated errors with mean zero and constant variance, the **Gauss–Markov theorem** says OLS has the lowest variance of all linear unbiased estimators.

## Outliers and leverage

Squaring means one residual of 5 costs as much as 25 residuals of 1, so a single far-off point can dominate. How much it moves the slope depends on its x:

- **High leverage** — an extreme x. The line pivots around (x̄, ȳ), so a far-out x has a long lever arm. Adding (6, 1) to the example turns the slope from 0.6 into −0.086 and R² from 0.6 into 0.01.
- **Low leverage** — an x near the mean. Adding (3, 10) leaves the slope at exactly 0.6 and only lifts the intercept from 2.2 to 3.2.

Find influential points with residual-vs-leverage plots or **Cook's distance**. Then fix the data error, or use a robust loss such as Huber (see loss functions) that grows linearly for big residuals.

## Implement it in Python

Linear regression is built into every numerical tool (R's `lm`, Julia's GLM.jl, Excel's LINEST, Spark MLlib…); here it is three ways with NumPy and scikit-learn.

```python
import numpy as np
from sklearn.linear_model import LinearRegression

x = np.array([1, 2, 3, 4, 5], dtype=float)       # hours studied
y = np.array([2, 4, 5, 4, 5], dtype=float)       # score

# Normal equation: solve (XᵀX) w = Xᵀy, with a column of ones for the intercept
X = np.column_stack([np.ones_like(x), x])
w = np.linalg.solve(X.T @ X, X.T @ y)            # [intercept, slope]
print(w)                                         # [2.2 0.6]

# The same fit by gradient descent on the MSE
v = np.zeros(2)
for _ in range(5000):
    v -= 0.05 * 2 / len(y) * X.T @ (X @ v - y)   # step against d(MSE)/dw
print(v.round(3))                                # [2.2 0.6]

# scikit-learn, plus R² by hand
model = LinearRegression().fit(x.reshape(-1, 1), y)
sse = np.sum((y - model.predict(x.reshape(-1, 1))) ** 2)
sst = np.sum((y - y.mean()) ** 2)
print(model.intercept_, model.coef_, 1 - sse / sst)   # 2.2 [0.6] 0.6
```

## Edge cases and pitfalls

- **R² only goes up** as you add features on the training data, even pure noise. Use adjusted R², a validation set or cross-validation.
- **Extrapolation:** the line is only supported where you have data. Our model predicts 8.2 points for 10 hours; nothing in the data says that is true.
- **More features than rows** (p > n): XᵀX is singular and infinitely many weights fit perfectly. Add regularisation (ridge or lasso).
- **Categorical features** need one-hot encoding with one level dropped (or regularisation), or the dummy columns plus the intercept are perfectly collinear.

## In the interview

Typical prompts: "derive the least-squares solution", "what are the assumptions of linear regression?", "how do you interpret a coefficient?", "what is R² and can it be negative?". A strong answer writes the loss, the normal equation and the gradient; lists the assumptions together with *what breaks* when each fails (mostly inference, not prediction); and mentions outliers, multicollinearity and regularisation. Expect the follow-up "normal equation or gradient descent?" — the closed form costs O(np² + p³), so with millions of features or streaming data, use gradient descent.
