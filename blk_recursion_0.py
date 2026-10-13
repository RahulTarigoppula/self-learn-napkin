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
