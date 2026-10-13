---
title: Supervised vs Unsupervised
track: ds
tags: [fundamentals, classification, regression, clustering]
difficulty: 1
minutes: 4
tldr: "Supervised learning learns from labelled rows to predict a label: a category or a number. Unsupervised learning has no labels and looks for structure: groups or fewer dimensions."
analogy: "Supervised is studying with an answer key: you check every attempt against the right answer. Unsupervised is being handed a box of mixed buttons and sorting them into piles that look alike, with nobody to say what the piles should be."
diagram: supervised-vs-unsupervised
story:
  - title: Labelled data vs unlabelled data
    text: "Every dataset is rows of features, X. The first question is whether each row also carries the answer you want to predict, the label y. On the left every email is marked ham or spam: labelled data. On the right the rows look alike, but nobody has written down an answer: unlabelled data."
  - title: "Classification: predict a category"
    text: "With labels, supervised learning fits a function from X to y and is graded against labels it has not seen. When y is a category, such as spam or ham or one of ten digits, the task is classification. The model learns a boundary and outputs a class or a probability."
  - title: "Regression: predict a number"
    text: "When y is a number on a scale, such as a house price from its size, the task is regression. The model fits a line or curve and is judged by how far its predictions land from the true values, for example by mean squared error."
  - title: "Clustering: find groups"
    text: "Without labels there is nothing to grade against, so the goal changes to finding structure. Clustering groups rows that sit close together; here k-means finds 3 groups. The groups come out unnamed, and a person has to inspect them to decide what they mean."
  - title: "Dimensionality reduction: fewer columns"
    text: "Dimensionality reduction finds a few new columns that keep most of the information. These points vary mainly along one diagonal, so one new axis (PCA's first component) describes each point with one number instead of two. It is used for plots, compression and as input to other models."
  - title: "In between: other ways to get a signal"
    text: "Semi-supervised learning trains on a few labels plus many unlabelled rows. Self-supervised learning makes labels from the data itself, such as predicting a hidden word, which is how large language models are pre-trained. Reinforcement learning has no labels: an agent takes actions and learns from rewards."
keyIdeas:
  - "**Supervised** = learn X → y from labelled examples; you can measure accuracy against held-out labels."
  - "**Classification** predicts a category; **regression** predicts a number. Logistic regression is a classifier despite its name."
  - "**Unsupervised** = only X. **Clustering** finds groups; **dimensionality reduction** (PCA) finds fewer columns that keep most of the variation."
  - "Choose by the data you have and the question asked: labels plus a target → supervised; no labels → explore with unsupervised, or pay to label."
  - "**Semi-** and **self-supervised** learning stretch a few labels, or none, a long way; **reinforcement learning** learns from rewards for actions."
quiz:
  - q: "You want to forecast each store's revenue next month, in pounds, from its past sales. What kind of task is this?"
    options: ["Classification", "Regression", "Clustering", "Dimensionality reduction"]
    answer: 1
    why: "The target is a number on a continuous scale and you have historical examples with the answer, so it is supervised regression."
  - q: "k-means splits your customers into 4 clusters. Can you report the clustering's accuracy?"
    options: ["Yes, k-means outputs an accuracy", "Not directly: there are no true labels to compare against", "Yes, if k is 4", "Only on the training set"]
    answer: 1
    why: "Clusters are unnamed groups, with no answer key. You judge them by internal measures such as the silhouette score, by whether they help a later task, or by inspecting them."
  - q: "You have 2 million product photos, and only 5,000 of them are labelled with a category. What is the most sensible approach?"
    options: ["Train only on the 5,000 labelled photos", "Cluster the photos and call the clusters categories", "Pre-train on all photos without labels (self-supervised), then fine-tune on the 5,000", "Treat it as regression"]
    answer: 2
    why: "Unlabelled photos still teach useful visual features. Pre-training on them and then fine-tuning on the small labelled set usually beats using the labelled set alone."
  - q: "Which target makes a classification problem?"
    options: ["Tomorrow's temperature in °C", "Whether a loan defaults (yes/no)", "Minutes until a delivery arrives", "A house's sale price"]
    answer: 1
    why: "Default or not is a category with two values. The other three targets are numbers on a continuous scale, so they are regression."
related: [ds/ml-problem-framing, ds/k-means, ds/pca, ds/logistic-regression]
prereqs: []
flashcards:
  - kind: qa
    q: "What separates supervised from unsupervised learning?"
    a: "Whether the training rows carry the target label y. Supervised learns X → y and is scored against held-out labels; unsupervised gets only X and finds structure such as clusters or low-dimensional directions."
  - kind: cloze
    text: "Predicting a category is {{classification}}; predicting a number on a continuous scale is {{regression}}."
  - kind: qa
    q: "What is self-supervised learning?"
    a: "Supervised training on labels created automatically from the data itself, such as predicting a masked word or the next token. It needs no human labelling, and it is how large language models are pre-trained."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Supervised and unsupervised learning cheatsheets" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The one question: is there an answer column?

A dataset is a table. Each row is an **example** (an email, a house, a customer), and the columns describing it are the **features**, written X. Sometimes one more column holds the thing you want to predict: the **label** or **target**, written y. The kind of learning you can do depends mostly on whether that column exists.

- **Supervised learning**: every training row has (x, y). The algorithm learns a function f with f(x) ≈ y. You can measure its quality directly, by predicting y for rows it has not seen and comparing with the true answers.
- **Unsupervised learning**: you only have X. No answers exist, so the algorithm looks for **structure**: rows that group together, or directions along which the data mostly varies.

## Supervised: classification and regression

The type of y decides the task.

- **Classification**: y is a category from a fixed set: spam/ham, fraud/legit, one of 10 digits. The model outputs a class, or better, a probability per class. Typical loss: cross-entropy. Typical metrics: accuracy, precision, recall, ROC-AUC. Examples: logistic regression (which is a classifier despite its name), decision trees, kNN.
- **Regression**: y is a number on a continuous scale: a price, a temperature, minutes until delivery. Typical loss: squared error. Typical metrics: MAE, RMSE, R². Examples: linear regression, gradient-boosted trees.

Two things trip people up. First, *numbers are not always regression*: a postcode or a product ID is a category written in digits. Second, *ordered categories* (1 to 5 stars) can be framed either way, and each framing has a cost. Regression assumes the gap from 1★ to 2★ equals the gap from 4★ to 5★. Classification ignores that 4★ is closer to 5★ than to 1★.

## Unsupervised: clustering and dimensionality reduction

- **Clustering** puts rows into groups so that rows in the same group are similar. k-means (you choose k) and hierarchical clustering are the classics. Uses: customer segments, grouping documents by topic. The output is group *numbers*, not meanings. Someone has to look inside each group and name it.
- **Dimensionality reduction** replaces many columns with a few new ones that keep most of the information. **PCA** finds the directions of largest variance. On the four-feature iris flower data, the first two principal components keep about 98 % of the variance, so a 2-D plot loses very little. t-SNE and UMAP make good pictures of clusters but are for viewing, not modelling.
- Also unsupervised: **density estimation** and **anomaly detection** (what is unusual compared with everything else?).

Judging unsupervised results is harder because there is no answer key. You use internal scores (silhouette, explained variance), stability across reruns, and above all whether the result helps a real downstream task.

## In between, one line each

- **Semi-supervised**: a few labelled rows plus many unlabelled ones. For example, train on the labels, add pseudo-labels to unlabelled rows the model is confident about, and retrain.
- **Self-supervised**: build labels from the data itself (hide a word and predict it, predict the next token, match two crops of one photo). This is how large language and vision models are pre-trained before being fine-tuned on a few labels.
- **Reinforcement learning**: no fixed dataset of answers. An agent takes actions in an environment and learns from delayed **rewards** (games, robotics, ad bidding).

## Worked example: choose by the data you have

| Situation | Have labels? | Target | Task |
|---|---|---|---|
| 50,000 emails users marked spam or not | yes | category | supervised classification |
| 10 years of house sales with prices | yes | number | supervised regression |
| 1 million shoppers' baskets, no segments defined | no | none | clustering |
| 300 sensor columns, want a 2-D plot or a smaller input | no | none | dimensionality reduction |
| 2 million photos, 5,000 labelled | a few | category | self-/semi-supervised, then fine-tune |
| a robot learning to walk | no, only rewards | actions | reinforcement learning |

If the business needs a prediction but you have no labels, unsupervised learning will not produce one. Usually the right move is to collect labels (from logs, from outcomes that arrive later, or from paid annotation), not to call clusters "classes".

## In code

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import adjusted_rand_score

X, y = load_iris(return_X_y=True)          # 150 flowers, 4 measurements, 3 species
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, stratify=y, random_state=0)

# Supervised classification: labelled rows teach X -> species
clf = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(X_tr, y_tr)
print("accuracy:", clf.score(X_te, y_te))

# Supervised regression: predict petal width (a number) from the other three columns
reg = LinearRegression().fit(X_tr[:, :3], X_tr[:, 3])
print("R^2:", reg.score(X_te[:, :3], X_te[:, 3]))

# Unsupervised clustering: y is never shown to the model
groups = KMeans(n_clusters=3, n_init=10, random_state=0).fit_predict(StandardScaler().fit_transform(X))
print("agreement with species (ARI):", adjusted_rand_score(y, groups))   # only possible because iris happens to have labels

# Unsupervised dimensionality reduction: 4 columns -> 2
pca = PCA(n_components=2).fit(X)
print("variance kept:", pca.explained_variance_ratio_.sum())             # about 0.98
```

## Edge cases and pitfalls

- **Clusters are not classes.** k-means always returns k groups, even for data with no real groups. Check stability and usefulness before you trust them.
- **Scale matters for unsupervised methods.** Clustering and PCA use distances and variances, so a column measured in pounds will swamp one measured in years unless you scale the features.
- **Labels can be wrong or biased.** A supervised model copies its labels, mistakes included. Moderators who mislabel 10 % of posts teach the model the same mistakes.
- **Label leakage is a supervised-only failure.** A feature that encodes the answer gives a great validation score and a useless model.

## In the interview

You will often get a scenario ("we want to group our users", "we want to predict delivery time") and be asked which approach fits. Answer in three beats: *do labels exist or can we get them?* → *is the target a category or a number?* → *how will we evaluate it?* Mention that unsupervised output needs human interpretation, and that a few labels plus lots of unlabelled data points to self- or semi-supervised learning. A common follow-up: "How would you evaluate a clustering?" Good answers: silhouette score, stability across runs and samples, and impact on a downstream metric.
