---
title: Bit Manipulation
track: dsa
tags: [bits, math, tricks]
difficulty: 2
minutes: 6
tldr: "Treat an integer as a row of bits and change them all in one instruction. A few identities — x & (x−1), x & −x, a ^ a = 0, masks as subsets — solve a whole family of problems in O(1) memory."
analogy: "A row of light switches on a wall. AND, OR and XOR compare two rows switch by switch; a shift slides the whole row along by one place, doubling or halving the number it spells."
diagram: bit-manipulation
story:
  - title: Every integer is a row of bits
    text: "Computers store integers in binary: each bit is worth twice the one to its right — 1, 2, 4, 8 and so on. 12 is 00001100 in 8 bits because 8 + 4 = 12. Bit tricks act on every bit of a number at once, in a single CPU instruction."
  - title: AND, OR, XOR column by column
    text: "Bitwise operators combine two numbers one column at a time. AND gives 1 only where both bits are 1; OR where at least one is; XOR where they differ. So 12 & 10 = 8, 12 | 10 = 14 and 12 ^ 10 = 6. NOT (~) flips every bit, and << and >> slide the row, multiplying or dividing by 2."
  - title: x & (x − 1) clears the lowest 1
    text: "Subtracting 1 turns the lowest 1 bit into 0 and every 0 below it into 1: 1100 − 1 = 1011. ANDing with the original keeps the bits above that point and wipes the rest: 1000. Repeat until x is 0 to count the 1 bits, one loop per 1. A power of two has a single 1, so (x & (x − 1)) == 0 tests for it."
  - title: Two's complement and x & −x
    text: "Negative numbers use two's complement: −x is ~x + 1. Flipping 00001100 gives 11110011; adding 1 gives 11110100, which is −12 in 8 bits. −x agrees with x at the lowest 1 and the zeros below it, and is the opposite everywhere above, so x & −x keeps only the lowest 1: 00000100 = 4."
  - title: XOR cancels pairs
    text: "XOR has two key properties: a ^ a = 0 and a ^ 0 = a, and the order of operands does not matter. XOR all of [4, 1, 2, 1, 2] together and each pair cancels, leaving the one number without a partner: 4. One pass and O(1) memory, with no hash set."
  - title: A bitmask is a subset
    text: "Let bit i mean 'item i is in the set'. With items a, b, c and a as bit 0, mask 5 = 101 means {a, c}. Counting mask from 0 to 7 = 2³ − 1 visits each of the 8 subsets exactly once, and adding item i is just mask | (1 << i)."
keyIdeas:
  - "**AND** keeps bits set in both, **OR** in either, **XOR** in exactly one; `~` flips all; `x << k` is x·2ᵏ and `x >> k` is ⌊x / 2ᵏ⌋."
  - "**`x & (x − 1)`** clears the lowest set bit: count bits in O(number of 1s); `x > 0` and `(x & (x − 1)) == 0` means **power of two**."
  - "**`x & −x`** isolates the lowest set bit, because **−x = ~x + 1** in two's complement."
  - "**XOR cancels pairs** (`a ^ a = 0`, `a ^ 0 = a`): the unpaired value survives."
  - "A **bitmask** of n bits is a subset of n items: test item i with `(mask >> i) & 1`, add it with `mask | (1 << i)`, and count mask from 0 to 2ⁿ − 1 to visit all 2ⁿ subsets."
quiz:
  - q: "What is 6 ^ 3?"
    options: ["5", "2", "7", "9"]
    answer: 0
    why: "6 = 110 and 3 = 011. XOR gives 1 where the bits differ: 101 = 5."
  - q: "What is 40 & −40?"
    options: ["8", "40", "2", "−40"]
    answer: 0
    why: "40 = 101000. x & −x isolates the lowest set bit, which is the 8s place: 001000 = 8."
  - q: "For x > 0, what does (x & (x − 1)) == 0 tell you?"
    options: ["x is even", "x is a power of two", "x is odd", "x has all bits set"]
    answer: 1
    why: "x & (x − 1) clears the lowest 1 bit. The result is 0 only if that was the only 1 bit — exactly the powers of two: 1, 2, 4, 8, …"
  - q: "In 8-bit two's complement, which value does 11111111 stand for?"
    options: ["255", "−1", "−127", "−128"]
    answer: 1
    why: "The top bit is worth −128 and the rest add 127: −128 + 127 = −1. Check: ~1 + 1 = 11111110 + 1 = 11111111."
  - q: "A loop runs mask from 0 up to (1 << n) − 1. How many masks does it visit for n = 10 items?"
    options: ["10", "100", "1,024", "3,628,800"]
    answer: 2
    why: "1 << 10 = 2¹⁰ = 1,024: one mask per subset, from the empty set (0) to all ten items (1,023). 3,628,800 is 10!, the number of orderings."
bigO:
  - { op: "one bitwise op (&, |, ^, ~, <<, >>)", avg: "O(1)", note: "on machine-word integers" }
  - { op: "count bits with x & (x−1)", avg: "O(k)", worst: "O(w)", note: "k = number of 1 bits, w = word size" }
  - { op: "single non-duplicated number", avg: "O(n) time", note: "O(1) memory" }
  - { op: "enumerate all subsets", avg: "O(2ⁿ · n)" }
related: [dsa/backtracking, dsa/dynamic-programming, dsa/hash-tables]
prereqs: []
flashcards:
  - kind: qa
    q: "Why does x & (x − 1) clear the lowest set bit?"
    a: "x − 1 flips the lowest 1 to 0 and every 0 below it to 1, leaving the higher bits alone. ANDing with x keeps the higher bits and zeroes the flipped ones."
  - kind: cloze
    text: "In two's complement, −x equals {{~x + 1}}, so x & −x isolates the {{lowest set bit}}."
  - kind: qa
    q: "Every number appears twice except one. How do you find it in O(n) time and O(1) space?"
    a: "XOR all the numbers. Pairs cancel because a ^ a = 0, XOR is order-independent, and a ^ 0 = a, so only the single number remains."
sources:
  - { name: "Algorithms by Jeff Erickson", url: "https://jeffe.cs.illinois.edu/teaching/algorithms/", licence: "CC BY 4.0", note: "Binary representation, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

An integer is stored as a row of **bits** (binary digits). The rightmost bit is worth 1, the next 2, then 4, 8, 16 — each place is worth twice the one to its right. So `12 = 8 + 4 = 0b1100`. Most languages can show and parse this form: Python's `bin(12)` gives `'0b1100'`, Java's `Integer.toBinaryString(12)` gives `"1100"`, and `0b1100` is a valid literal in Python, Java, C++14 and JavaScript.

**Bitwise operators** treat the two numbers as columns of bits and combine each column on its own, all at once:

| a | b | a & b (AND) | a \| b (OR) | a ^ b (XOR) |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 |

- **AND** is 1 only when both bits are 1 — use it to *test* or *keep* bits.
- **OR** is 1 when either bit is 1 — use it to *set* bits.
- **XOR** is 1 when the bits differ — use it to *toggle* bits.
- **NOT** (`~x`) flips every bit.
- **Shifts:** `x << k` moves every bit k places left, multiplying by 2ᵏ; `x >> k` moves them right, dividing by 2ᵏ and rounding down (`13 >> 1 == 6`, and `-13 >> 1 == -7` in Python).

The four single-bit moves follow directly: test bit i with `(x >> i) & 1`, set it with `x | (1 << i)`, clear it with `x & ~(1 << i)`, toggle it with `x ^ (1 << i)`.

### Two's complement in one picture

Hardware stores negative integers in **two's complement**: in an 8-bit number the top bit is worth **−128** instead of +128, and every other bit keeps its usual positive weight.

| Weight | −128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 | Value |
|---|---|---|---|---|---|---|---|---|---|
| 12 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 8 + 4 = 12 |
| ~12 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | −13 |
| −12 = ~12 + 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | −128 + 64 + 32 + 16 + 4 = −12 |

Flipping all bits gives `~x = −x − 1` (for 12, −13), so **−x = ~x + 1**. 8 bits hold −128 to 127; 11111111 is −1. The beauty is that ordinary binary addition works unchanged for negative numbers. Python integers have no fixed width — they behave as if they had infinitely many copies of the sign bit — so `~12 == -13` and `-12 & 0xFF == 0b11110100` (244) when you want to see 8 bits.

## The classic tricks

**Clear the lowest set bit: `x & (x - 1)`.** Subtracting 1 borrows from the lowest 1: that bit becomes 0 and every 0 below it becomes 1, while the higher bits are untouched (`1100 − 1 = 1011`). ANDing with the original keeps the higher bits and zeroes the rest (`1100 & 1011 = 1000`).
- *Counting 1 bits* (Brian Kernighan's method): apply it until x is 0; the loop runs once per 1 bit.
- *Power of two:* a positive power of two has exactly one 1 bit, so `x > 0 and x & (x - 1) == 0`.

**Isolate the lowest set bit: `x & -x`.** Since −x = ~x + 1, adding 1 to ~x carries through the trailing 1s (which were x's trailing 0s) and stops at the position of x's lowest 1. Below that point both x and −x are 0, at that point both are 1, above it they are opposite. AND keeps exactly that one bit: `12 & -12 == 4`. Fenwick trees use this to jump between nodes.

**XOR cancels pairs.** XOR is commutative and associative, `a ^ a = 0` and `a ^ 0 = a`. XOR-ing a list where every value appears twice except one leaves the single value. The same trick swaps two variables without a temporary and finds the missing number in 0..n (XOR all indices and all values).

**Bitmasks as subsets.** With n items, an n-bit integer can say which ones are "in": bit i set means item i is included. Counting from 0 to 2ⁿ − 1 enumerates every subset exactly once. Bitmasks also make compact, hashable *state* for dynamic programming, as in the travelling-salesman DP over `(mask, last city)`.

## Worked example

Count the 1 bits of 12 with Kernighan's loop:

| Iteration | x (binary) | x − 1 | x & (x − 1) | count |
|---|---|---|---|---|
| 1 | 1100 | 1011 | 1000 | 1 |
| 2 | 1000 | 0111 | 0000 | 2 |

Two iterations for two 1 bits, not four for four bit positions. And `12 & -12`: `00001100 & 11110100 = 00000100 = 4`, the lowest 1.

Subsets of `[a, b, c]` (a = bit 0): masks 0 to 7 give `[], [a], [b], [a,b], [c], [a,c], [b,c], [a,b,c]` — mask 5 = `101` is `[a, c]`.

## Implement it in Python

The same idea works in any language; only the syntax changes. Here it is in Python.

```python
def popcount(x):                      # Kernighan: one iteration per 1 bit (x >= 0)
    count = 0
    while x:
        x &= x - 1                    # clear the lowest set bit
        count += 1
    return count

def lowest_bit(x):
    return x & -x                     # -x == ~x + 1

def is_power_of_two(x):
    return x > 0 and (x & (x - 1)) == 0

def single_number(nums):
    acc = 0
    for v in nums:
        acc ^= v                      # pairs cancel: a ^ a == 0
    return acc

def subsets(items):
    n = len(items)
    return [[items[i] for i in range(n) if mask >> i & 1]   # is bit i set?
            for mask in range(1 << n)]                       # 0 .. 2**n - 1

print(popcount(12), lowest_bit(12), is_power_of_two(64), is_power_of_two(12))  # 2 4 True False
print(single_number([4, 1, 2, 1, 2]))                                         # 4
print(subsets(['a', 'b', 'c'])[5])                                            # ['a', 'c']
```

Libraries usually have a built-in, hardware-backed popcount: Python 3.10+ `x.bit_count()`, Java `Integer.bitCount(x)`, C++20 `std::popcount(x)`. Python's `x.bit_length()` gives the number of bits needed (`(12).bit_length() == 4`).

## Edge cases and pitfalls

- **Operator precedence.** In Python, `&`, `|` and `^` bind tighter than `==`, so `x & (x - 1) == 0` works. In C, C++ and Java, `==` binds tighter, and the same expression means `x & ((x - 1) == 0)`. Parenthesise every bit expression.
- **Zero is not a power of two.** `0 & -1 == 0`, so the `x > 0` check is essential.
- **Negative numbers in Python.** `popcount(-1)` would never stop: `-1 & -2` is `-2`, and the loop keeps chasing an infinite row of 1s. Mask to a width first (`x & 0xFFFFFFFF`).
- **Overflow in fixed-width languages.** `1 << 31` in a 32-bit signed int is negative, and shifting by the word size or more is undefined in C.
- **Right shift of negatives** is arithmetic (copies the sign bit) in Python and Java's `>>`; Java's and JavaScript's `>>>` shift in zeros instead. In C and C++ before C++20 it is implementation-defined, so shift unsigned values.

## In the interview

Expect: count the 1 bits, power of two (or of four: also check that the single 1 sits in an even position, `x & 0x55555555`), single number, missing number, reverse the bits of a 32-bit integer, generate all subsets, and add two integers without `+` (XOR gives the sum without carries, `(a & b) << 1` gives the carries; repeat until no carry). Name the identity you are using out loud — "x & (x − 1) drops the lowest set bit" — and trace it on a 4-bit example before writing code.
