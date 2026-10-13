---
title: Circuit Breakers and Retries
track: sysdesign
tags: [reliability, resilience, retries, microservices]
difficulty: 3
minutes: 6
tldr: "Retry brief failures with capped, jittered backoff inside a deadline; stop calling a failing dependency with a circuit breaker; use bulkheads so one slow service cannot sink the rest."
analogy: "The fuse box in a house: when one circuit shorts, its breaker trips so the rest of the house keeps power. You flip it back carefully, once, to test, rather than holding it on while it sparks."
diagram: circuit-breakers-and-retries
story:
  - title: A slow dependency spreads
    text: "Checkout calls payments, which calls the bank. The bank starts taking 30 s per call. At 100 requests per second, payments would need 3,000 threads to wait it out, but it has 200, so within 2 s every thread is stuck. Then checkout's threads stick waiting on payments. One slow service has taken down two healthy ones."
  - title: Timeouts and a shared deadline
    text: "First defence: never wait forever. Checkout gives the whole request a 1 s deadline and passes the remaining time down with each call. After its own work, payments has 0.7 s left, so its call to the bank gives up at 0.7 s instead of 30 s and the thread is freed."
  - title: Retry with backoff and full jitter
    text: "Many failures are brief, so retrying helps, but only after a wait that doubles each time, with a random point chosen in the window: 0–100 ms, then 0–200, then 0–400. The red dots are those random picks. Randomness spreads out thousands of clients that failed at the same instant. Cap the attempts at about 3."
  - title: "Breaker trips: closed → open"
    text: "A circuit breaker wraps calls to the bank and watches the outcomes. While it is closed, calls pass through. When 50 % or more of the last 20 calls fail, it opens: further calls fail immediately, in microseconds, without touching the bank. Callers use a fallback, and the bank gets room to recover."
  - title: "Half-open: trial calls decide"
    text: "After a cool-down, here 30 s, the breaker goes half-open and lets a few trial calls through. If they succeed, it closes and traffic flows again. If they fail, it opens for another 30 s. The dependency is probed gently instead of being hit by the full load the moment it comes back."
keyIdeas:
  - "**Every remote call needs a timeout**, and a request-wide **deadline** should travel downstream so no one works on an answer the user stopped waiting for."
  - "**Retry only transient, idempotent failures**, with exponential backoff and **full jitter**: `sleep = random(0, min(cap, base × 2^attempt))`."
  - "Retries multiply: 3 layers × 4 attempts each = **64 calls** at the bottom. Cap attempts and use a **retry budget** (e.g. retries ≤ 10 % of requests)."
  - "A **circuit breaker** (closed → open → half-open) fails fast while a dependency is broken and probes it with a few trial calls."
  - "**Bulkheads** give each dependency its own limited pool, so one slow dependency exhausts only its own slots."
quiz:
  - q: "Full jitter, base 100 ms (retry n draws from a window of 100 ms × 2^(n−1)), cap 1 s. What is the wait before retry 5?"
    options: ["Exactly 1,600 ms", "Random between 0 and 1,000 ms", "Random between 0 and 1,600 ms", "Exactly 1,000 ms"]
    answer: 1
    why: "The window would be 100 × 2⁴ = 1,600 ms, but the cap limits it to 1,000 ms, and full jitter picks a uniform random point in [0, 1,000 ms]. Never a fixed wait: that would re-synchronise clients."
  - q: "Services A → B → C form a chain, and each retries a failed downstream call up to 3 times. The database under C is down. How many calls can it receive for one user request?"
    options: ["4", "9", "12", "64"]
    answer: 3
    why: "Each of the 3 layers makes up to 4 attempts (1 + 3 retries), and each of those attempts triggers up to 4 at the next layer: 4 × 4 × 4 = 64. Retry at one layer only, or use budgets."
  - q: "A breaker is open. What happens to a call made 5 s later, with a 30 s cool-down?"
    options: ["It is sent to the dependency", "It fails immediately, so the caller can use a fallback", "It waits until the breaker closes", "It is queued for 25 s"]
    answer: 1
    why: "While open, the breaker rejects calls without any network I/O. That frees the caller's threads at once and stops adding load to the struggling dependency."
  - q: "Payments has 200 worker threads. Bank calls are slow but card-validation calls are fine. What stops bank slowness from blocking card validation?"
    options: ["A larger thread pool", "A bulkhead: cap bank calls at, say, 40 concurrent in their own pool", "Longer timeouts", "More retries"]
    answer: 1
    why: "With a separate, bounded pool for the bank, at most 40 threads can be stuck there; the other 160 keep serving everything else."
bigO:
  - { op: "full jitter", avg: "random(0, min(cap, base·2^n))", note: "AWS: least total work" }
  - { op: "retry amplification", avg: "(1 + retries)^layers", note: "4³ = 64" }
  - { op: "retry budget", avg: "≤ 10 % of requests", note: "Google SRE book" }
  - { op: "Hystrix defaults", avg: "≥ 20 calls / 10 s, 50 %", note: "then a 5 s sleep window" }
  - { op: "threads stuck", avg: "λ × wait", note: "100/s × 30 s = 3,000" }
bigOTitle: "Key numbers"
related: [sysdesign/backpressure, sysdesign/rate-limiting, sysdesign/load-balancing, sysdesign/observability]
prereqs: [sysdesign/idempotency]
flashcards:
  - kind: qa
    q: "Why add jitter to exponential backoff?"
    a: "Clients that failed together would otherwise retry together at 100, 200, 400 ms and hit the recovering service in synchronised spikes. Random waits spread the retries out."
  - kind: cloze
    text: "A circuit breaker moves from {{closed}} to {{open}} when the failure rate crosses a threshold, and to {{half-open}} after a cool-down to send a few trial calls."
  - kind: qa
    q: "What is deadline propagation?"
    a: "The first service sets an absolute deadline for the whole request and passes the remaining time to every downstream call, so each hop's timeout shrinks and nobody works past the point where the caller gave up."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How one slow service takes down many

The dangerous failure in a microservice system is usually not a crash but a **slowdown**. A crashed service refuses connections instantly; a slow one holds every caller's thread, connection and memory while they wait.

Little's law (concurrency = arrival rate × time spent) makes it concrete. Payments receives 100 requests/s and normally calls the bank in 100 ms, so about 10 calls are in flight. When the bank slows to 30 s, payments needs 100 × 30 = **3,000** concurrent calls, but its pool has 200 threads. After 2 seconds the pool is full, and every new request to payments, even ones that never touch the bank, queues behind them. Checkout calls payments, so its threads fill up next. This is a **cascading failure**, and the tools below each cut one link of the chain.

## Timeouts and deadlines

- **Set a timeout on every remote call.** Many client libraries default to no timeout or to minutes. Pick a value from the dependency's latency distribution, for example a little above its p99.
- **Propagate a deadline.** The edge service decides how long the whole request may take (say 1 s) and passes the absolute deadline, or the remaining budget, downstream. gRPC does this natively; over HTTP, use a header. Each hop subtracts its own work, so payments, having used 300 ms, gives the bank at most 700 ms. When the deadline passes, every layer stops working on that request.

With a 0.7 s timeout, the payments example needs 100 × 0.7 = 70 threads, which fits inside 200. Users see quick errors instead of hangs, and the service survives.

## Retries done right

Retries turn transient failures (a dropped packet, a restarting pod, a brief 503) into successes. Done carelessly, they turn a small outage into a big one.

1. **Retry only what is retryable:** timeouts, connection errors, 503, and 429 (honouring `Retry-After`). Never retry 400, 401 or 404; they will fail the same way.
2. **Retry only idempotent operations**, or ones protected by an idempotency key. Otherwise a retry after a lost reply duplicates the effect.
3. **Back off exponentially:** the wait window doubles each attempt so a struggling service gets more breathing room.
4. **Add full jitter:** wait a uniformly random time in the window, `random(0, min(cap, base × 2^attempt))`. AWS's analysis of backoff strategies found full jitter does the least total work among the variants it compared.
5. **Cap attempts** (2 to 3 retries) and stay **inside the deadline**: do not start a retry you cannot finish.
6. **Use a retry budget.** The Google SRE book recommends allowing retries only while they are under about **10 %** of a client's requests. During a real outage, retries then add at most 10 % load instead of multiplying it.

### Worked numbers

1,000 clients see an error at the same moment, base 100 ms, 3 retries:

| | No jitter | Full jitter |
|---|---|---|
| Retry 1 | all 1,000 at t = 100 ms | spread over 0–100 ms, about 10 per ms |
| Retry 2 | all 1,000 at t = 300 ms | spread over a 0–200 ms window |
| Retry 3 | all 1,000 at t = 700 ms | spread over a 0–400 ms window |
| Expected total wait | 700 ms | 50 + 100 + 200 = 350 ms |

**Amplification:** if each of 3 layers makes up to 4 attempts, a dead bottom service receives up to 4 × 4 × 4 = 64 calls per user request. Retry at one layer (usually the one closest to the failure or the edge), not all of them.

## The circuit breaker

A **circuit breaker** sits in the caller, around calls to one dependency, and tracks recent outcomes.

| State | Behaviour | Leaves when |
|---|---|---|
| **Closed** | calls pass through; outcomes are counted in a sliding window | the failure rate (errors and timeouts) crosses the threshold, e.g. ≥ 50 % of the last 20 calls → **open** |
| **Open** | calls fail immediately with no network I/O; the caller uses a fallback | the cool-down (e.g. 30 s) expires → **half-open** |
| **Half-open** | a small number of trial calls go through; others still fail fast | trials succeed → **closed**; any fails → **open** again |

A trace with those settings: the bank starts failing at 12:00:00. By 12:00:02, 11 of the last 20 calls have failed, so the breaker opens. For 30 s, payments returns "card payment temporarily unavailable" in microseconds and its threads stay free. At 12:00:32 it goes half-open and sends 3 trials; one times out, so it reopens until 12:01:02. This time all 3 trials succeed, it closes, and traffic ramps back to normal.

Good **fallbacks** depend on the call: cached data, a default ("recommendations unavailable"), queueing the work for later, or a clear error. Libraries: Resilience4j (Java), Polly (.NET), and service meshes such as Envoy (outlier detection) and Istio. Netflix's Hystrix popularised the pattern (defaults: at least 20 requests in a 10 s window, 50 % errors, 5 s sleep window) but is now in maintenance mode.

## Bulkheads

Named after the watertight compartments in a ship's hull. Give each dependency its **own bounded pool** of threads, connections or concurrent calls: bank calls at most 40, card validation 40, the rest for everything else. A slow bank can then exhaust only its 40 slots. Bulkheads and breakers work together: the bulkhead limits the damage while the breaker is still counting failures.

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation.

```python
import random, time

class CircuitOpen(Exception): pass

class Breaker:
    def __init__(self, window=20, threshold=0.5, cooldown=30.0):
        self.window, self.threshold, self.cooldown = window, threshold, cooldown
        self.results, self.state, self.opened_at = [], "closed", 0.0

    def call(self, fn, **kw):
        if self.state == "open":
            if time.monotonic() - self.opened_at < self.cooldown:
                raise CircuitOpen()                # fail fast: no network call
            self.state = "half_open"               # cool-down over: allow a trial
        try:
            out = fn(**kw)
        except Exception:
            self._record(False)
            raise
        self._record(True)
        return out

    def _record(self, ok):
        if self.state == "half_open":              # the trial decides
            self.state = "closed" if ok else "open"
            self.results, self.opened_at = [], time.monotonic()
            return
        self.results = (self.results + [ok])[-self.window:]
        if len(self.results) == self.window and self.results.count(False) / self.window >= self.threshold:
            self.state, self.opened_at = "open", time.monotonic()

def call_with_retries(breaker, fn, deadline, base=0.1, cap=2.0, retries=3):
    for attempt in range(retries + 1):
        left = deadline - time.monotonic()
        if left <= 0:
            raise TimeoutError("deadline exceeded")
        try:
            return breaker.call(fn, timeout=left)  # pass the remaining budget down
        except (TimeoutError, ConnectionError):    # CircuitOpen is NOT retried
            sleep = random.uniform(0, min(cap, base * 2 ** attempt))   # full jitter
            if attempt == retries or time.monotonic() + sleep >= deadline:
                raise
            time.sleep(sleep)
```

This half-open state lets every caller through at once; production breakers admit only a fixed number of trial calls.

## Pitfalls

- **Timeouts longer than the caller's.** If checkout gives up after 1 s but payments waits 5 s for the bank, payments does 4 s of useless work per request.
- **Retrying at every layer**, the 64× problem above.
- **Counting the wrong failures.** A 404 or a validation error says nothing about the dependency's health; only timeouts, 5xx and connection errors should trip the breaker.
- **One breaker for many hosts.** If one of ten replicas is bad, a shared breaker either never trips or blocks all ten. Breakers per host, plus load-balancer outlier ejection, handle that.

## In the interview

When a design calls another service, say "timeout, bounded retries with jittered backoff, a circuit breaker with a fallback, and bulkheads". Explain the cascading-failure mechanism with Little's law. Expect: *what if the retried call isn't idempotent?* (idempotency key), *where do you retry in a deep call chain?* (one layer, within a deadline and budget), and *what happens when the dependency comes back?* (half-open trials, gradual ramp-up, jitter to avoid a thundering herd).
