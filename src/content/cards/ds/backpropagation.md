---
title: Backpropagation
track: ds
tags: [deep-learning, neural-networks, optimisation]
difficulty: 3
minutes: 5
tldr: "Backprop gets every weight's gradient in one backward sweep: keep each value from the forward pass, then multiply local slopes from the loss backwards (the chain rule)."
analogy: "A relay team misses its target time. Rather than rerunning the race once per runner, the coach walks back from the finish line: each runner's share of the delay is passed down to the runner before, scaled by how much they influenced the next leg."
diagram: backpropagation
story:
  - title: The computation as a graph
    text: "Take the smallest model with a loss: predict x·w + b, compare with the target y, square the error. Break it into single operations — multiply, add, subtract, square — and draw them as a graph. Every neural network, however large, is a graph like this."
  - title: "Forward pass: compute every value"
    text: "With x = 2, w = 3, b = 1 and y = 5, run left to right: u = 2·3 = 6, v = 6 + 1 = 7, e = 7 − 5 = 2, L = 2² = 4. Keep every intermediate value. The backward pass will need them."
  - title: "Start at the end: ∂L/∂e = 2e = 4"
    text: "Now go backwards. ∂L/∂L = 1 trivially. Each node only needs its own local slope: for the square node, d(e²)/de = 2e = 4. By the chain rule, the gradient arriving at a node times its local slope is the gradient leaving it, so ∂L/∂e = 1 · 4 = 4."
  - title: "+ and − pass the gradient straight through"
    text: "e = v − y, so nudging v by a small amount moves e by the same amount: local slope 1, and ∂L/∂v = 4. The add node does the same for both inputs, so ∂L/∂u = 4 and ∂L/∂b = 4. Addition copies the incoming gradient to each input."
  - title: "× sends each input the other input"
    text: "u = x·w, so ∂u/∂w = x and ∂u/∂x = w. Hence ∂L/∂w = 4 · 2 = 8 and ∂L/∂x = 4 · 3 = 12. Check directly: L = (2w − 4)², whose slope at w = 3 is 2·2·2 = 8. Every gradient came from one backward sweep."
  - title: "Use the gradients: one descent step"
    text: "Gradient descent moves each parameter against its gradient. With step size 0.1: w = 3 − 0.1·8 = 2.2 and b = 1 − 0.1·4 = 0.6. The new prediction is 2·2.2 + 0.6 = 5.0, exactly y, so the loss drops from 4 to 0. Real networks repeat this millions of times."
keyIdeas:
  - "**Chain rule:** gradient leaving a node = gradient arriving × the node's local derivative. Where a value feeds several nodes, add the gradients."
  - "**Forward pass caches values, backward pass reuses them.** All gradients cost about 2–3 forward passes, not one pass per weight."
  - "**Local rules:** + copies the gradient, × multiplies by the other input, ReLU passes it where the input was positive, else 0."
  - "**Vanishing / exploding gradients:** many layers multiply many factors; factors below 1 shrink the signal, above 1 blow it up."
  - "**Autograd** (in frameworks such as PyTorch, JAX or TensorFlow) records the graph during the forward pass and runs this backward sweep for you."
quiz:
  - q: "In u = x·w with x = 2, w = 3, the gradient arriving at u is 4. What is ∂L/∂w?"
    options: ["4", "8", "12", "6"]
    answer: 1
    why: "The local derivative ∂u/∂w is the other input, x = 2. Chain rule: 4 × 2 = 8."
  - q: "Why is backprop much faster than estimating each gradient by nudging each weight?"
    options: ["One backward sweep reuses shared intermediate results to get every gradient at once", "It uses smaller numbers", "It skips the forward pass", "It only updates the last layer"]
    answer: 0
    why: "Nudging needs a forward pass per weight — millions of passes. Backprop computes each node's gradient once and reuses it for everything upstream, so all gradients cost a small constant times one forward pass."
  - q: "A deep network uses sigmoid activations, whose derivative is at most 0.25. Through 10 such layers, the gradient can shrink by a factor of about…"
    options: ["2.5", "0.25", "1 / 1,000,000", "It cannot shrink"]
    answer: 2
    why: "0.25¹⁰ ≈ 9.5 × 10⁻⁷, about one millionth (ignoring the weights). Early layers barely learn: the vanishing gradient problem. ReLU, residual connections and normalisation help."
  - q: "A value v is used by two later nodes. During backprop, its gradient is…"
    options: ["The larger of the two incoming gradients", "Their product", "Their average", "The sum of the two incoming gradients"]
    answer: 3
    why: "The multivariable chain rule adds the contributions of every path from v to the loss. This is why autograd frameworks accumulate (+=) gradients."
bigO:
  - { op: "all gradients via backprop", avg: "≈ 2–3× forward pass", note: "independent of the number of weights" }
  - { op: "finite differences", avg: "1–2 forward passes per weight", note: "a million weights → a million passes" }
  - { op: "memory", avg: "O(activations)", note: "every layer's outputs are kept for the backward pass" }
bigOTitle: "Cost"
related: [ds/neural-network-basics, ds/gradient-descent, ds/sgd-and-mini-batch, ds/loss-functions]
prereqs: [ds/neural-network-basics, ds/gradient-descent]
flashcards:
  - kind: qa
    q: "State the rule backprop applies at every node."
    a: "Gradient flowing to an input = gradient flowing into the node's output × the node's local derivative with respect to that input; gradients from several outgoing paths are summed."
  - kind: cloze
    text: "Backprop must store the {{forward-pass activations}}, which is why training uses much more {{memory}} than inference."
  - kind: qa
    q: "What causes vanishing gradients and what are common fixes?"
    a: "The backward signal is a product of one factor per layer; if they are mostly below 1 (saturated sigmoids, small weights) it shrinks exponentially. Fixes: ReLU-family activations, careful initialisation, residual connections, batch/layer normalisation."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Deep learning cheatsheet: backpropagation" }
  - { name: "Stanford CS230 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-230-deep-learning", licence: "MIT", note: "Deep learning tips and tricks: gradient checking" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem backprop solves

Training a network means gradient descent: move every weight a little in the direction that lowers the loss. For that you need the **gradient** — the partial derivative ∂L/∂w of the loss with respect to *every* weight, often millions or billions of them. The naive way, nudging one weight and re-running the network to see how the loss changes, costs one forward pass per weight. **Backpropagation** (reverse-mode automatic differentiation) gets all of them in one backward sweep.

## How it works

1. **Write the model as a computational graph** of simple operations (multiply, add, ReLU, matrix multiply, softmax…). Each operation knows its own **local derivatives**: how its output changes when one input changes slightly.
2. **Forward pass.** Evaluate the graph from inputs to loss and **cache** every intermediate value.
3. **Backward pass.** Set ∂L/∂L = 1 and visit the nodes in reverse order. At each node apply the **chain rule**:

> ∂L/∂(input) = ∂L/∂(output) × ∂(output)/∂(input)

If a value feeds several later nodes, **sum** the gradients from each path. When the sweep reaches the parameters, you have every ∂L/∂w.

The local derivatives are tiny and reusable:

| Node | Forward | Backward (given g = ∂L/∂out) |
|---|---|---|
| add, out = a + b | a + b | ∂L/∂a = g, ∂L/∂b = g |
| multiply, out = a·b | a·b | ∂L/∂a = g·b, ∂L/∂b = g·a |
| square, out = a² | a² | ∂L/∂a = g·2a |
| ReLU, out = max(0, a) | max(0, a) | g if a > 0, else 0 |
| matrix multiply, Y = XW | XW | ∂L/∂W = Xᵀ·G, ∂L/∂X = G·Wᵀ |

## Worked example

L = (x·w + b − y)² with x = 2, w = 3, b = 1, y = 5.

| Node | Forward value | Local derivative | Gradient ∂L/∂(node) |
|---|---|---|---|
| L = e² | 4 | — | 1 |
| e = v − y | 2 | ∂L/∂e = 2e | 1 · 4 = **4** |
| v = u + b | 7 | ∂e/∂v = 1 | 4 · 1 = **4** |
| b | 1 | ∂v/∂b = 1 | 4 · 1 = **4** |
| u = x·w | 6 | ∂v/∂u = 1 | 4 · 1 = **4** |
| w | 3 | ∂u/∂w = x = 2 | 4 · 2 = **8** |
| x | 2 | ∂u/∂x = w = 3 | 4 · 3 = **12** |

Check w by hand: L(w) = (2w + 1 − 5)² = (2w − 4)², so dL/dw = 2(2w − 4)·2 = 8 at w = 3. ✓ A gradient-descent step with learning rate 0.1 gives w = 2.2, b = 0.6, and the new prediction 2·2.2 + 0.6 = 5 hits the target exactly (a coincidence of these numbers — normally the loss only decreases).

## Why it is efficient

Notice that ∂L/∂u = 4 was computed once and then reused for both w and x. In a deep network the gradient at layer k is reused by every weight below it. Each node is visited once going forward and once going backward, so all gradients together cost a small constant multiple (typically 2–3×) of one forward pass — no matter whether there are ten weights or ten billion. That is the whole reason deep learning is computationally possible.

The price is **memory**: the backward pass needs the cached forward values (here x, w and e), so training must store every layer's activations. Activation checkpointing trades this back: store a few layers' outputs and recompute the rest during the backward pass.

## Implement it in Python

A backward pass is a few lines of arithmetic per node in any language; here it is by hand in Python with NumPy, first on the scalar example and then on matrices, with a numerical gradient check.

```python
import numpy as np

def forward_backward(x, w, b, y):
    u = x * w; v = u + b; e = v - y; L = e ** 2   # forward: keep every value
    dL_de = 2 * e                                  # square node
    dL_dv = dL_de * 1                              # minus node: de/dv = 1
    dL_du = dL_dv * 1                              # plus node:  dv/du = 1
    dL_db = dL_dv * 1                              #             dv/db = 1
    dL_dw = dL_du * x                              # times node: du/dw = the OTHER input
    dL_dx = dL_du * w
    return L, dL_dw, dL_db, dL_dx

print(forward_backward(2.0, 3.0, 1.0, 5.0))        # (4.0, 8.0, 4.0, 12.0)

# The same on matrices: a 3-4-1 ReLU network, batch of 64, mean squared error
rng = np.random.default_rng(0)
X, y = rng.normal(size=(64, 3)), rng.normal(size=(64, 1))
W1, W2 = rng.normal(size=(3, 4)), rng.normal(size=(4, 1))

def loss_and_grads(W1, W2):
    Z = X @ W1                                     # forward, caching Z and H
    H = np.maximum(0, Z)
    P = H @ W2
    loss = np.mean((P - y) ** 2)
    dP = 2 * (P - y) / len(X)                      # d loss / d prediction
    dW2 = H.T @ dP                                 # reuses the cached H
    dZ = (dP @ W2.T) * (Z > 0)                     # back through W2, then ReLU's 0/1 slope
    dW1 = X.T @ dZ
    return loss, dW1, dW2

loss, dW1, dW2 = loss_and_grads(W1, W2)
eps = 1e-6                                         # gradient check on one weight
W1p = W1.copy(); W1p[0, 0] += eps
print(dW1[0, 0], (loss_and_grads(W1p, W2)[0] - loss) / eps)   # both ≈ 2.3359
```

In PyTorch the same thing is automatic: build the loss from tensors created with `requires_grad=True`, call `loss.backward()`, and read each parameter's `.grad`. Because `.grad` accumulates, training loops call `optimizer.zero_grad()` before every step. JAX's `jax.grad` and TensorFlow's `GradientTape` do the same job.

## Vanishing and exploding gradients

The gradient reaching layer 1 of a deep network is a product with one factor per layer (an activation slope times a weight matrix). Products of many numbers behave exponentially:

- Factors below 1 → **vanishing gradients**. Sigmoid's slope is at most 0.25, and 0.25¹⁰ ≈ 10⁻⁶; even 0.9⁵⁰ ≈ 0.005. Early layers stop learning.
- Factors above 1 → **exploding gradients**. 1.5⁵⁰ ≈ 6 × 10⁸; the loss jumps to NaN.

Fixes: ReLU-family activations (slope exactly 1 when active), initialisation scaled to the layer width (He, Glorot), **residual connections** (y = x + f(x) gives the gradient a path with slope 1 straight through), batch or layer normalisation, and **gradient clipping** for explosions — standard in recurrent networks, which backpropagate through every time step.

## Autograd

You rarely write backward passes by hand. **Automatic differentiation** frameworks record each operation into a graph as the forward pass runs, and a single "backward" call walks that graph in reverse, applying each operation's stored derivative rule and adding the result into a gradient buffer for every parameter. Because the buffers *accumulate* (they are summed, exactly as the multi-path chain rule requires), a training loop must reset them to zero before each step, or gradients from the previous batch leak into the next update.

## Edge cases and pitfalls

- **Backprop computes gradients; it does not update weights.** The optimiser (SGD, Adam) does that. Interviewers like this distinction.
- **Non-differentiable points** (ReLU at 0) are handled with a subgradient — frameworks simply use 0 or 1.
- **Check custom gradients** with central differences, (f(w + ε) − f(w − ε)) / 2ε, on a small input in float64.
- **Saturated outputs:** sigmoid + squared error gives tiny gradients when the prediction is confidently wrong; sigmoid + log-loss does not, because the gradient simplifies to (p − y).

## In the interview

Typical prompts: "explain backpropagation", "derive the gradient for this small graph", "why does it scale?", "what are vanishing gradients?". Draw the graph, run the forward pass with numbers, then go backwards node by node multiplying local derivatives, and verify one gradient by hand. Mention caching, the cost (about one extra pass, not one per weight), the memory trade-off, and the vanishing-gradient fixes. A common follow-up: *"why reverse mode rather than forward mode?"* — reverse mode costs one sweep per *output*; a loss is a single number with millions of inputs, so reverse mode wins. Forward mode costs one sweep per input.
