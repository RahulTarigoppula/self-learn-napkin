---
title: Neural Network Basics
track: ds
tags: [deep-learning, neural-networks]
difficulty: 2
minutes: 5
tldr: "A neuron computes a weighted sum of its inputs plus a bias, then bends it with a non-linear activation. Stack layers of neurons and the network can learn very complicated functions."
analogy: "An assembly line of committees. Each member scores what the last committee passed on, weighs some opinions more than others, and speaks up only if convinced. Later committees build on earlier verdicts."
diagram: neural-network-basics
story:
  - title: "One neuron: a weighted sum plus a bias"
    text: "Two inputs, x₁ = 1 and x₂ = 2, feed a neuron h₁. Each connection has a weight saying how much that input matters, and the neuron adds a bias: z₁ = 1·1 + 0.5·2 + 0 = 2. On its own, this is exactly a linear model."
  - title: An activation bends the sum
    text: "The neuron passes z through an activation function. ReLU, the most common one, is max(0, z): negative sums become 0, positive ones pass through. h₁ = ReLU(2) = 2. The bend is what lets networks model curves and interactions as well as straight lines."
  - title: "A layer: many neurons side by side"
    text: "A second neuron h₂ reads the same inputs with its own weights and bias: z₂ = −1·1 + 0.5·2 − 1 = −1, so ReLU gives 0. This neuron stays silent for this input. A layer is just a group of neurons; in matrix form it is h = ReLU(W·x + b)."
  - title: "The output layer: ŷ = σ(1) = 0.73"
    text: "The output neuron combines the hidden values: 1·2 − 2·0 − 1 = 1. A sigmoid, 1 / (1 + e^(−z)), squashes it into a probability: ŷ = 0.73. That full left-to-right computation is a forward pass. This small network has 9 parameters: 6 weights and 3 biases."
  - title: "Without activations, layers collapse"
    text: "The bends are not decoration. Without them, layer 2 of layer 1 is W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂), which is one linear layer again. However many layers you stack, the model could only ever draw straight lines. The non-linearity is what makes depth useful."
keyIdeas:
  - "**Neuron:** output = activation(w·x + b). A **layer** applies many at once: h = f(Wx + b)."
  - "**Non-linear activations are essential:** without them any stack of layers equals a single linear layer."
  - "**ReLU** max(0, z) for hidden layers; **sigmoid** for a yes/no probability; **softmax** for one-of-K classes."
  - "**Parameters** per dense layer = inputs × outputs + outputs (biases). A 784-128-10 network has 101,770."
  - "**Universal approximation:** one wide enough hidden layer can approximate any continuous function on a bounded region. It says nothing about how to learn it, though."
quiz:
  - q: "A neuron has weights (2, −1), bias 1 and ReLU activation. What does it output for input (1, 4)?"
    options: ["0", "−1", "1", "3"]
    answer: 0
    why: "z = 2·1 + (−1)·4 + 1 = −1, and ReLU(−1) = max(0, −1) = 0."
  - q: "You stack five dense layers with no activation functions. What can the network represent?"
    options: ["Any continuous function, given enough units per layer", "Only affine functions, the same as a single layer", "Only XOR-like functions, since depth adds bends", "Anything a five-layer ReLU network can represent"]
    answer: 1
    why: "Composing affine maps gives another affine map: W₅…W₁x plus a constant. Depth adds nothing without a non-linearity between layers."
  - q: "How many parameters does a dense layer from 100 inputs to 50 outputs have?"
    options: ["150", "5,000", "5,050", "5,100"]
    answer: 2
    why: "100 × 50 = 5,000 weights plus one bias per output neuron, 50: 5,050."
  - q: "Which output activation fits classifying an image as exactly one of 10 digits?"
    options: ["ReLU", "Sigmoid on each output independently", "No activation", "Softmax"]
    answer: 3
    why: "Softmax turns 10 scores into 10 positive probabilities that sum to 1, one per mutually exclusive class. Independent sigmoids suit multi-label problems where several classes can be true."
bigO:
  - { op: "parameters, dense layer n → m", avg: "n·m + m", note: "weights plus biases" }
  - { op: "the 2-2-1 example", avg: "9", note: "2·2 + 2 + 2·1 + 1" }
  - { op: "784-128-10 (MNIST MLP)", avg: "101,770", note: "100,480 + 1,290" }
  - { op: "forward pass cost", avg: "O(parameters)", note: "about one multiply-add per weight per example" }
bigOTitle: "Key numbers"
related: [ds/backpropagation, ds/logistic-regression, ds/gradient-descent, ds/embeddings]
prereqs: [ds/linear-regression, ds/logistic-regression]
flashcards:
  - kind: qa
    q: "Why do neural networks need non-linear activation functions?"
    a: "A composition of linear layers is itself linear: W₂(W₁x + b₁) + b₂ = Wx + b. Only non-linearities between layers let depth represent curved decision boundaries and interactions."
  - kind: cloze
    text: "A neuron computes {{a weighted sum of its inputs plus a bias}} and passes it through an {{activation function}}."
  - kind: qa
    q: "Why is ReLU the default hidden activation instead of sigmoid?"
    a: "ReLU is cheap and its gradient is exactly 1 for positive inputs, so gradients do not shrink layer after layer. Sigmoid's gradient is at most 0.25 and near 0 when saturated, which causes vanishing gradients in deep nets."
sources:
  - { name: "Stanford CS230 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-230-deep-learning", licence: "MIT", note: "Deep learning tips and tricks; convolutional networks: activation functions" }
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Deep learning cheatsheet: neural networks" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## From linear models to networks

Linear and logistic regression compute one weighted sum of the features, w·x + b, and possibly squash it with a sigmoid. They draw straight decision boundaries and cannot discover feature interactions you did not hand-craft. A **neural network** keeps the same building block but chains many of them, with a non-linear bend after each, so the network can build its own features layer by layer.

## How it works

**A neuron** (also called a unit) has a weight wᵢ for each input and one bias b:

> z = w₁x₁ + w₂x₂ + … + wₙxₙ + b,   output a = f(z)

The **weights** say how much each input matters (and in which direction), the **bias** shifts the threshold, and the **activation function** f bends the result.

**A layer** is many neurons reading the same inputs, each with its own weights. Stack each neuron's weights as a row of a matrix W and the whole layer is one matrix multiplication: h = f(W·x + b). A **dense** (fully connected) layer connects every input to every neuron.

**A network** feeds one layer's outputs into the next: input layer → one or more **hidden layers** → **output layer**. Computing from input to output is the **forward pass**. Training (with backpropagation and gradient descent) adjusts all weights and biases to reduce a loss.

## Worked example: a 2-2-1 network

Input x = (1, 2). Hidden layer with ReLU, output with sigmoid:

| Neuron | Weights | Bias | z | Activation | Output |
|---|---|---|---|---|---|
| h₁ | (1, 0.5) | 0 | 1·1 + 0.5·2 + 0 = 2 | ReLU | **2** |
| h₂ | (−1, 0.5) | −1 | −1·1 + 0.5·2 − 1 = −1 | ReLU | **0** |
| ŷ | (1, −2) on (h₁, h₂) | −1 | 1·2 − 2·0 − 1 = 1 | sigmoid | 1/(1 + e⁻¹) = **0.731** |

Parameters: hidden layer 2×2 weights + 2 biases = 6; output 2 weights + 1 bias = 3; **9 in total**. Note h₂ outputs 0 for this input: ReLU units switch off for some inputs and on for others, and that switching is exactly what makes the overall function piecewise linear instead of linear.

## Why the activation matters

Remove the activation and compute two layers: W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂). That is a single linear layer with weights W₂W₁. A hundred linear layers still collapse into one. The non-linearity breaks this. The classic demonstration is **XOR** (output 1 when exactly one input is 1). No straight line can separate it, but two ReLU neurons do it: h₁ = ReLU(x₁ + x₂), h₂ = ReLU(x₁ + x₂ − 1), y = h₁ − 2h₂ gives 0, 1, 1, 0 for the inputs (0,0), (0,1), (1,0), (1,1).

## Common activations

| Activation | Formula | Range | Typical use |
|---|---|---|---|
| **ReLU** | max(0, z) | [0, ∞) | default for hidden layers: cheap, gradient 1 when active |
| **Sigmoid** | 1 / (1 + e^(−z)) | (0, 1) | output for a yes/no probability |
| **Tanh** | (e^z − e^(−z)) / (e^z + e^(−z)) | (−1, 1) | zero-centred hidden units, recurrent networks |
| **Softmax** | e^(zᵢ) / Σⱼ e^(zⱼ) | each (0, 1), sum 1 | output for one-of-K classes |
| **GELU** | z · Φ(z) | ≈ (−0.17, ∞) | smooth ReLU used in Transformers |

Softmax example: scores (2, 1, 0) become (0.665, 0.245, 0.090). Sigmoid's gradient is at most 0.25 (at z = 0) and almost 0 for large |z|, which is why deep stacks of sigmoids train poorly (vanishing gradients) and ReLU took over for hidden layers.

## What one hidden layer can do

The **universal approximation theorem** says a network with one hidden layer, enough neurons and a non-polynomial activation (such as ReLU or sigmoid) can approximate any continuous function on a bounded input region as closely as you like. It is an existence result: it does not say how many neurons you need, or that gradient descent will find the weights. In practice deeper networks represent many functions with far fewer parameters than one very wide layer.

## Implement it in Python

A forward pass is matrix multiplications plus element-wise activations, so it looks the same in any language or deep-learning framework; here it is in plain Python with NumPy.

```python
import numpy as np

def relu(z):
    return np.maximum(0, z)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# The 2-2-1 network. Row i of W1 holds the weights INTO hidden neuron i.
W1 = np.array([[1.0, 0.5],
               [-1.0, 0.5]])
b1 = np.array([0.0, -1.0])
W2 = np.array([[1.0, -2.0]])
b2 = np.array([-1.0])

x = np.array([1.0, 2.0])
z1 = W1 @ x + b1                 # [ 2, -1]  weighted sums
h = relu(z1)                     # [ 2,  0]  ReLU clips the negative one
y_hat = sigmoid(W2 @ h + b2)     # [0.731]
print(h, y_hat.round(3))
print(W1.size + b1.size + W2.size + b2.size)          # 9 parameters

# Without the activation, two layers are one linear layer in disguise
W, b = W2 @ W1, W2 @ b1 + b2
print(W2 @ (W1 @ x + b1) + b2, W @ x + b)             # identical: [3.] [3.]

# XOR with two ReLU neurons
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
H = relu(X @ np.ones((2, 2)) + np.array([0.0, -1.0]))  # h1 = x1+x2, h2 = x1+x2-1
print(H @ np.array([1.0, -2.0]))                       # [0. 1. 1. 0.]
```

## Edge cases and pitfalls

- **Initialisation matters.** If every weight starts equal, every neuron in a layer computes the same thing and receives the same update forever (symmetry). Use small random weights (He initialisation for ReLU, Glorot/Xavier for tanh).
- **Dead ReLUs.** A neuron whose z is negative for every input outputs 0 and gets zero gradient, so it never recovers. Too-high learning rates cause this; Leaky ReLU (a small slope for z < 0) avoids it.
- **Scale your inputs.** Features on wildly different scales make some weights need tiny steps and others huge ones; standardise inputs first.
- **Match the output to the task:** linear output + MSE for regression, sigmoid + log-loss for binary, softmax + cross-entropy for multi-class.
- **More parameters, more overfitting risk.** Use validation data, weight decay, dropout or early stopping.

## In the interview

Expect "what is a neuron?", "why do we need activation functions?", "ReLU vs sigmoid?", or "count the parameters of this network". A strong answer writes a = f(Wx + b), shows the linear-collapse argument in one line, names ReLU for hidden layers and sigmoid/softmax for outputs with the reason (gradient behaviour, probabilities), and counts parameters as inputs × outputs + biases per layer. A likely follow-up: *"why go deep instead of wide if one layer is universal?"* Depth reuses features hierarchically (edges → shapes → objects), which typically needs far fewer parameters for the same accuracy.
