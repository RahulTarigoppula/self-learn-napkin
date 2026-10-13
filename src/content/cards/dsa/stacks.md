---
title: Stacks
track: dsa
tags: [stacks, lifo, parsing]
difficulty: 1
minutes: 4
tldr: "A pile you only touch at the top: push, pop and peek are all O(1). Use it whenever the most recent unfinished thing must be finished first."
analogy: "A stack of plates in a canteen: you put clean plates on top and take plates from the top. The plate at the bottom was put there first and will be taken last."
diagram: stacks
story:
  - title: Last in, first out
    text: "A stack is a pile where you only touch the top. push puts an item on top, pop removes the top item, and peek reads it without removing it. Each is O(1). In an array-backed stack the end of the array is the top: [5, 8, 2] has 2 on top, so the next pop returns 2, and only after that can 8 come out."
  - title: Opening brackets are pushed
    text: "Is {[()]} balanced? Read it left to right. Each opening bracket is a promise to close it later, and the most recent promise has to be kept first. So every opener is pushed: after three characters the stack holds { [ ( with ( on top."
  - title: Each closer must match the top
    text: "A closing bracket must match the opener on top. ) meets (, so pop it. ] meets [, so pop. } meets {, so pop. The string ends with an empty stack, so every opener was closed, in the right order: balanced. One pass over the string, O(n) time."
  - title: A mismatch fails immediately
    text: "Now ([)]. Push (, push [. Then ) arrives, but the top is [: the innermost bracket is still open, so the string is invalid and we stop at once. Counting brackets would have said it was fine, since there are two of each kind. Only a stack checks the order."
  - title: Postfix with a stack
    text: "Postfix (reverse Polish) notation puts each operator after its operands: 3 4 + 2 * means (3 + 4) × 2. Push numbers; an operator pops two, applies itself and pushes the result. 3 and 4 become 7, then 7 and 2 become 14, and the single value left is the answer. No parentheses or precedence rules needed."
keyIdeas:
  - "**LIFO:** the last item pushed is the first popped. `push`, `pop` and `peek` touch only the top, so each is **O(1)**."
  - "**Use the end of a dynamic array as the top** (Python's list, Java's ArrayList or array-backed ArrayDeque, C++'s std::vector): push and pop there are O(1). Working at the front shifts every element, O(n)."
  - "Reach for a stack when **the most recent unfinished thing must be finished first**: nested brackets, undo, function calls, depth-first search."
  - "Bracket matching: push openers, a closer must match the top, and the stack must be **empty at the end**."
  - "The **call stack** is a stack of frames; recursion that never stops overflows it. Any recursion can be rewritten with an explicit stack."
quiz:
  - q: "Starting empty: push 1, push 2, pop, push 3, push 4, pop. What is on top now?"
    options: ["1", "2", "3", "4"]
    answer: 2
    why: "[1] → [1,2] → pop 2 → [1] → [1,3] → [1,3,4] → pop 4 → [1,3]. The top is 3."
  - q: "What does the postfix expression 5 1 2 + 4 * + 3 - evaluate to?"
    options: ["14", "18", "20", "-14"]
    answer: 0
    why: "Stack: 5 · 5 1 · 5 1 2 · + → 5 3 · 4 → 5 3 4 · * → 5 12 · + → 17 · 3 → 17 3 · − → 17 − 3 = 14. The first pop is the right-hand operand."
  - q: "For which input does the bracket checker only fail AFTER the loop, because the stack is not empty?"
    options: ["\"(()\"", "\"())\"", "\"([)]\"", "\"}\""]
    answer: 0
    why: "\"(()\" never meets a wrong closer; it just ends with one ( still on the stack. \"())\" and \"}\" hit a closer with an empty stack, and \"([)]\" hits a mismatch. All three fail inside the loop."
  - q: "You build a stack on a dynamic array. Why push and pop at the end rather than at index 0?"
    options: ["Index 0 cannot be written to", "Removing or inserting at the front shifts every other element: O(n)", "Dynamic arrays are linked lists underneath", "The end is the only index you can read"]
    answer: 1
    why: "The end of a dynamic array grows and shrinks in O(1) (amortised for push). Working at index 0 moves all n − 1 other elements one slot each time."
bigO:
  - { op: "push", best: "O(1)", avg: "O(1)", worst: "O(n)", note: "amortised O(1); a rare resize copies the array" }
  - { op: "pop / peek", avg: "O(1)" }
  - { op: "search for a value", avg: "O(n)", note: "a stack is not built for this" }
  - { op: "balanced brackets", avg: "O(n) time, O(n) space", note: "one pass" }
related: [dsa/monotonic-stack, dsa/queues-and-deques, dsa/recursion, dsa/bfs-and-dfs]
prereqs: [dsa/arrays-and-pointers]
flashcards:
  - kind: qa
    q: "How do you check whether a string of (), [] and {} is balanced?"
    a: "Push every opener. On a closer, the stack must be non-empty and its popped top must be the matching opener. At the end the stack must be empty. O(n)."
  - kind: cloze
    text: "A stack is {{last in, first out}}; push, pop and peek all take {{O(1)}} time."
  - kind: qa
    q: "Evaluating postfix, an operator pops b then a. Why does the order matter?"
    a: "The first pop is the right-hand operand. For 5 3 − you must compute a − b = 5 − 3 = 2, not 3 − 5."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "ArrayStack, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **stack** is a collection with one open end, called the **top**. It supports three operations:

- **push(x)**: put `x` on top.
- **pop()**: remove the top item and return it.
- **peek()** (also called *top*): return the top item without removing it.

The order is **LIFO: last in, first out**. Whatever you pushed most recently is the only thing you can reach. That restriction is the point: a stack remembers things in exactly the order you will need to *undo* or *finish* them.

### Array-backed implementation

The usual implementation is a **dynamic array** (Python's `list`, Java's `ArrayList`, C++'s `vector`) where the **end** of the array is the top. Pushing writes one slot past the last element, popping shrinks the length by one, peeking reads `a[len - 1]`. None of these touch the other elements, so each is O(1).

When the array is full, a push allocates a bigger block (typically 1.5–2× the size) and copies everything over. That one push costs O(n), but because the capacity grows geometrically, n pushes cost O(n) in total, which is **O(1) amortised** per push.

Why the end and not the front? Inserting or removing at index 0 of an array shifts every other element by one slot: O(n) per operation. A linked list also works (push and pop at the head are O(1)), but it costs a pointer per item and is slower in practice because the nodes are scattered in memory.

### The call stack

Your program already uses a stack. Each function call **pushes a frame** holding its arguments, local variables and the place to return to; `return` **pops** it and control resumes in the frame underneath. A recursive function that never reaches its base case keeps pushing frames until the memory reserved for the stack runs out. That is a **stack overflow** (Python stops earlier with `RecursionError`, at a default depth of about 1,000). Because recursion is just a hidden stack, any recursive algorithm can be rewritten as a loop with an explicit stack, which is how iterative depth-first search works.

## Worked example: balanced brackets

The rule: push every opening bracket; on a closing bracket, the stack must be non-empty and the popped top must be the matching opener; at the end the stack must be empty.

**"{[()]}"**

| Char | Action | Stack after (top on the right) |
|---|---|---|
| `{` | push | `{` |
| `[` | push | `{ [` |
| `(` | push | `{ [ (` |
| `)` | top is `(` → match, pop | `{ [` |
| `]` | top is `[` → match, pop | `{` |
| `}` | top is `{` → match, pop | *(empty)* |

Empty at the end → **balanced**.

**"([)]"**: push `(`, push `[`, then `)` arrives while `[` is on top → **not balanced**, stop. Note that this string has one of each bracket kind opened and closed, so a counter per kind would accept it. Brackets must close in the reverse order they opened, and "reverse order" is exactly what LIFO gives you.

There are three different ways to fail, and a correct solution handles all of them:

1. A closer arrives when the stack is **empty**: `"())"` fails at the last character.
2. A closer **does not match** the top: `"([)]"`.
3. The string ends with openers **still on the stack**: `"(()"`.

## Implement it in Python

A plain Python list is the stack: `append` pushes, `pop()` pops, `stack[-1]` peeks.

```python
PAIRS = {')': '(', ']': '[', '}': '{'}

def is_balanced(s: str) -> bool:
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)                       # opener: remember it
        elif ch in PAIRS:
            if not stack or stack.pop() != PAIRS[ch]:
                return False                       # nothing open, or wrong kind
    return not stack                               # leftovers are unclosed openers

import operator
OPS = {'+': operator.add, '-': operator.sub, '*': operator.mul, '/': operator.truediv}

def eval_postfix(tokens):
    stack = []
    for t in tokens:
        if t in OPS:
            b = stack.pop()                        # right operand was pushed last
            a = stack.pop()
            stack.append(OPS[t](a, b))
        else:
            stack.append(int(t))
    return stack.pop()

print(is_balanced("{[()]}"), is_balanced("([)]"), is_balanced("(()"))   # True False False
print(eval_postfix("3 4 + 2 *".split()))                               # 14
```

## Postfix expressions

In **postfix** (reverse Polish) notation each operator comes after its two operands, so `(3 + 4) × 2` is written `3 4 + 2 *`. To evaluate it, scan left to right: push numbers; for an operator, pop the top two values, apply the operator and push the result. A well-formed expression leaves exactly one value. Trace: `3` → [3]; `4` → [3, 4]; `+` → pops 4 and 3, pushes 7; `2` → [7, 2]; `*` → pops 2 and 7, pushes 14. No parentheses and no precedence rules are needed, which is why calculators and stack-based virtual machines (the JVM, CPython's bytecode interpreter) work this way. Converting ordinary infix notation to postfix is itself done with a stack of operators (Dijkstra's *shunting-yard* algorithm).

## Undo and redo

An editor keeps an **undo stack** of actions. Each new action is pushed. *Undo* pops the most recent action, reverses it and pushes it onto a **redo stack**; *redo* pops from the redo stack and pushes it back onto undo. Making a fresh edit **clears the redo stack**, because the redo history no longer describes the current document. Browser Back/Forward work the same way.

## Edge cases and pitfalls

- **Popping an empty stack.** Most libraries throw an error (Python's `IndexError`, Java's `EmptyStackException`); check that the stack is non-empty first, as `is_balanced` does.
- **Forgetting the final emptiness check.** This is the classic bug that accepts `"(("`.
- **Operand order** in postfix: the first pop is the *right* operand. `5 3 -` is 2, not −2.
- **Stack ≠ queue.** If you need the *oldest* item first (a waiting line, breadth-first search), you want a queue.

## In the interview

Stacks rarely appear by name. Listen for *nesting* (brackets, HTML tags, directory paths like `a/./b/../c`), *the most recent unmatched thing* (next greater element → monotonic stack), or *recursion you are asked to make iterative*. Say the invariant out loud ("the stack holds the openers that are still waiting to be closed") and trace the three failure cases. A common follow-up is a **min-stack**: support `get_min()` in O(1) by pushing `(value, min so far)` pairs, so each frame remembers the minimum beneath it.
