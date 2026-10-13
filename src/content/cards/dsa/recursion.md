---
title: Recursion
track: dsa
tags: [recursion, call-stack, fundamentals]
difficulty: 1
minutes: 4
tldr: "A function that solves a problem by calling itself on a smaller version of it, until it reaches a case small enough to answer directly."
analogy: "Asking 'which row am I in?' in a dark cinema: you ask the person in front, they ask the person in front of them, and so on. Row 1 knows the answer; each person then adds one and passes it back."
diagram: recursion
story:
  - title: Two cases, always
    text: "Every recursive function has two parts. The base case answers the smallest input directly: fact(1) is 1. The recursive case shrinks the problem and trusts the function to solve the smaller one: fact(n) = n × fact(n − 1). Without a base case, nothing ever stops."
  - title: Every call pushes a frame
    text: "Call fact(4). It cannot finish yet: it needs fact(3), so it pauses and the computer pushes a new stack frame holding n = 3 and where to return to. fact(3) pauses for fact(2) the same way. Each frame is a separate copy of n, waiting with a half-done multiply."
  - title: The base case stops the descent
    text: "fact(1) hits the base case and returns 1 without calling anything. That is the deepest point: four frames on the stack, so the space used is O(n). Forget the base case and frames pile up until the stack runs out: a stack overflow. Python, for example, stops at about 1,000 frames."
  - title: Unwinding
    text: "Now the stack unwinds, newest frame first. fact(2) receives 1 and returns 2 × 1 = 2; fact(3) returns 3 × 2 = 6; fact(4) returns 4 × 6 = 24. The work happens on the way back up, because each multiply had to wait for its smaller answer."
  - title: When one call makes two
    text: "fib(n) = fib(n − 1) + fib(n − 2) calls itself twice, so its calls form a recursion tree instead of a line. fib(4) makes 9 calls and computes fib(2) twice; fib(30) makes about 2.7 million. Caching each answer (memoization) means only 31 distinct subproblems, fib(0) to fib(30), are ever computed."
keyIdeas:
  - "Every recursion needs a **base case** that returns directly and a **recursive case** that moves strictly towards it."
  - "Each call gets its own **stack frame**; extra space is O(maximum depth), even when the code allocates nothing."
  - "Draw the **recursion tree**: time ≈ number of nodes × work per node; space ≈ height of the tree."
  - "Repeated subtrees mean **overlapping subproblems**. Memoize them and you have dynamic programming."
  - "The stack is finite and most mainstream languages (Python, Java, C# among them) do **not guarantee tail-call optimisation**: convert deep recursions to a loop or an explicit stack."
quiz:
  - q: "While computing fact(4) with the code on this napkin, how many frames of fact are on the call stack at the deepest point?"
    options: ["1", "3", "4", "24"]
    answer: 2
    why: "fact(4) waits for fact(3), which waits for fact(2), which waits for fact(1). All four are alive at once when fact(1) hits the base case."
  - q: "f(n) is defined as return 1 + f(n − 1), with no base case. What happens when you call f(5)?"
    options: ["It returns 0", "It loops forever, using no extra memory", "Frames pile up until the stack overflows and the program fails", "It returns an empty value"]
    answer: 2
    why: "Every call makes another call, and each one pushes a frame that never pops. The stack is finite, so the program dies with a stack overflow: Java throws StackOverflowError, Python raises RecursionError at about 1,000 frames."
  - q: "How many calls does the naive fib(5) make (counting fib(5) itself), with fib(0) and fib(1) as base cases?"
    options: ["5", "9", "15", "32"]
    answer: 2
    why: "calls(n) = 1 + calls(n − 1) + calls(n − 2) with calls(0) = calls(1) = 1, giving 1, 1, 3, 5, 9, 15. The count grows like the Fibonacci numbers themselves: exponentially."
  - q: "You rewrite fact(n) as a tail-recursive function with an accumulator, in a language that does not optimise tail calls (such as Python or Java). What is its stack usage?"
    options: ["O(1): the frame is reused automatically", "Still O(n): every call still pushes a frame", "O(log n)", "It depends on the accumulator's size"]
    answer: 1
    why: "Being in tail position only makes frame reuse possible; the compiler or runtime must actually do it. Scheme guarantees it, Python and Java never do, so each call still pushes a frame. There, write the loop yourself."
bigO:
  - { op: "fact(n)", avg: "O(n)", note: "plus O(n) stack: one frame per level" }
  - { op: "naive fib(n)", avg: "O(φⁿ) ≈ O(1.62ⁿ)", note: "often quoted as the looser O(2ⁿ); stack O(n)" }
  - { op: "memoized fib(n)", avg: "O(n)", note: "O(n) cache + O(n) stack" }
  - { op: "extra space of any recursion", avg: "O(max depth)", note: "the frames alive at once" }
bigOTitle: "Complexity"
related: [dsa/stacks, dsa/dynamic-programming, dsa/backtracking, dsa/trees-and-traversals]
prereqs: [dsa/big-o-basics]
flashcards:
  - kind: qa
    q: "What two things must every recursive function have?"
    a: "A base case that returns without recursing, and a recursive case that calls itself on a strictly smaller input, so the calls always reach the base case."
  - kind: cloze
    text: "A recursion's extra space is proportional to its maximum {{depth}}, because each pending call keeps a {{stack frame}}."
  - kind: qa
    q: "Why is naive recursive Fibonacci exponential, and how do you fix it?"
    a: "Each call branches twice and the same subproblems (fib(2), fib(3) …) are recomputed in different subtrees. Memoize: cache each fib(k) the first time, giving O(n) calls."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Chapter 1, Recursion; ideas redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

**Recursion** means a function solves a problem by calling itself on a *smaller instance of the same problem*. To make that safe you need exactly two ingredients:

1. **Base case**: an input small enough to answer directly, with no further call. For factorial, `fact(0)` and `fact(1)` are both 1.
2. **Recursive case**: reduce the input (`n` becomes `n − 1`, a list loses its first element, a tree becomes its subtrees), call the function on the smaller input, then **combine** the result (`n * fact(n − 1)`).

The habit that makes recursion manageable is the **recursive leap of faith**: while writing `fact(n)`, assume `fact(n − 1)` already works and only ask "how do I build the answer for `n` from the answer for `n − 1`?". That is the same reasoning as a proof by induction: base case true, and "true for n − 1 implies true for n".

### What the computer actually does

Every function call creates a **stack frame** (also called an activation record): a small block of memory holding the call's parameters, its local variables, and the **return address** (where to resume in the caller). Frames live on the **call stack**, a last-in-first-out structure. A call **pushes** a frame; a `return` **pops** it and hands the value to the frame underneath.

So `fact(4)` is not one computation but four separate, paused ones, each with its own `n`. Nothing is multiplied on the way *down*; every multiply waits until the call it depends on returns. The multiplies happen while the stack **unwinds**.

## Worked example

`fact(4)` with the code below:

| Step | Event | Stack (bottom → top) | Returned value |
|---|---|---|---|
| 1 | call `fact(4)` | fact(4) | |
| 2 | needs `fact(3)` → push | fact(4), fact(3) | |
| 3 | needs `fact(2)` → push | fact(4), fact(3), fact(2) | |
| 4 | needs `fact(1)` → push | fact(4) … fact(1) | |
| 5 | base case, pop | fact(4), fact(3), fact(2) | 1 |
| 6 | 2 × 1, pop | fact(4), fact(3) | 2 |
| 7 | 3 × 2, pop | fact(4) | 6 |
| 8 | 4 × 6, pop | (empty) | **24** |

Maximum depth: 4 frames, so the extra space is O(n) even though the code never creates a list.

### Recursion trees

When a call makes **more than one** recursive call, the calls form a **recursion tree**. `fib(n) = fib(n − 1) + fib(n − 2)` (with `fib(0) = 0`, `fib(1) = 1`) gives:

```
              fib(4)
           /          \
       fib(3)        fib(2)
       /    \        /    \
   fib(2)  fib(1) fib(1) fib(0)
   /    \
fib(1) fib(0)
```

Two rules read the cost straight off the tree:

- **Time** ≈ number of nodes × work per node. The naive `fib(n)` makes `2·fib(n + 1) − 1` calls: 9 for `fib(4)`, about 2.7 million for `fib(30)`. That is exponential, roughly 1.62ⁿ.
- **Space** ≈ the tree's **height**, not its size, because only one root-to-leaf path is on the stack at a time. For `fib(n)` that is n frames.

`fib(2)` appears twice above; for larger n, the same small subproblems appear thousands of times. These are **overlapping subproblems**. Store each result the first time (**memoization**) and every distinct `fib(k)` is computed once: O(n) time. That is the top-down form of dynamic programming.

## Implement it in Python

Memoization comes free from the standard library's `lru_cache`. Note how `total` passes an index instead of slicing the list.

```python
from functools import lru_cache

def fact(n: int) -> int:
    if n <= 1:                         # base case: answer directly
        return 1
    return n * fact(n - 1)             # recursive case: smaller input, then combine

def total(xs: list[int], i: int = 0) -> int:
    if i == len(xs):                   # empty suffix sums to 0
        return 0
    return xs[i] + total(xs, i + 1)    # pass an index; xs[1:] would copy O(n) per call

@lru_cache(maxsize=None)               # memoization: each n is computed once
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

def fact_iter(n: int) -> int:          # same answer, O(1) stack
    result = 1
    for k in range(2, n + 1):
        result *= k
    return result

assert fact(4) == fact_iter(4) == 24
assert total([3, 1, 4]) == 8
assert fib(30) == 832040
```

## Tail calls and stack overflow

A **tail call** is a call that is the very last thing a function does, so nothing is left to compute after it returns:

```
fact_tail(n, acc = 1):
    if n ≤ 1: return acc
    return fact_tail(n − 1, acc × n)    // tail call: the multiply already happened
```

Because the caller has nothing left to do, a compiler *could* reuse its frame instead of pushing a new one. That is **tail-call optimisation** (TCO), which turns the recursion into a loop with O(1) stack. Scheme guarantees it, and C and C++ compilers often do it at higher optimisation levels. **Python and Java never do**, so there `fact_tail(5000)` still uses 5,000 frames.

A **stack overflow** happens when the recursion is deeper than the stack allows. The call stack is a fixed region of memory, typically a few megabytes per thread, so the limit is usually thousands to tens of thousands of frames. What you see depends on the language: Java throws `StackOverflowError`, C or C++ simply crash, and Python stops earlier, at a default limit of 1,000 frames, with `RecursionError`. Raising such a limit only moves the problem; if the real stack runs out first, the whole process crashes.

## Recursion vs iteration

Anything recursive can be written iteratively, and vice versa.

- **Linear recursion** (one call per level, like `fact` or summing a list) becomes a plain loop with an accumulator. Prefer the loop when the depth can be large and the language does not optimise tail calls.
- **Branching recursion** (trees, graphs, backtracking) becomes a loop over an **explicit stack** you manage yourself: push the start, pop, process, push the children. Same order of work, but the stack lives on the heap, so depth is limited only by memory.
- Recursion wins on **clarity** when the data is recursive: trees, nested lists, divide and conquer (merge sort, quicksort), and backtracking.

## Edge cases and pitfalls

- **Base case that can be skipped.** `if n == 0` with an input of −1 recurses forever. Use `n <= 1` or validate the input.
- **Not shrinking.** Every call must move strictly towards the base case, or it never ends.
- **Hidden copying.** Recursing on "the rest of the list" by copying it (a slice such as `xs[1:]`) costs O(n) per call, turning an O(n) sum into O(n²). Pass an index instead.
- **Shared state between calls.** A memo table or `seen` set that outlives one top-level call (a global, or a Python mutable default argument such as `seen=set()`) leaks results into the next call. Create it per top-level call and pass it down.
- **Forgetting stack space** when stating complexity: a recursive DFS on a path-shaped graph of n nodes uses O(n) space.

## In the interview

Say the base case and the recursive case out loud before writing code, then state time *and* space, with space as O(depth). Expect the follow-ups: "what is the maximum depth for this input?", "can you make it iterative?" (loop or explicit stack), and, for a branching recursion with repeated calls, "can you make it faster?" (memoize, which leads straight into dynamic programming).
