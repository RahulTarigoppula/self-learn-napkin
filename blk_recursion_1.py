def fact_tail(n: int, acc: int = 1) -> int:
    if n <= 1:
        return acc
    return fact_tail(n - 1, acc * n)   # tail call: the multiply already happened
