---
title: Rate Limiting
track: sysdesign
tags: [rate-limiting, api, reliability, algorithms]
difficulty: 2
minutes: 4
tldr: "Cap how fast each client may call you. A token bucket allows short bursts up to its capacity while holding the long-run rate to its refill rate; excess requests get 429."
analogy: "An arcade gives you 5 tokens and drops one more into your cup every second, up to 5. You can play 5 games back to back, but after that you play at one game per second, however fast you feed the machine."
diagram: token-bucket
story:
  - title: A bucket of 5 tokens, refilled 1 per second
    text: "Each client gets a bucket that holds at most 5 tokens and gains 1 token per second. A full bucket stays full; extra tokens are thrown away. Capacity sets the largest burst allowed, and the refill rate sets the long-run average."
  - title: A burst of 7 requests at once
    text: "At t = 0 a client fires 7 requests, r1 to r7, in the same instant, perhaps a page loading several widgets. Its bucket is full, with 5 tokens. Every request must take one token to get through."
  - title: r1–r5 each take a token
    text: "r1 to r5 each remove a token and are forwarded to the API. The bucket is now empty. A burst of 5 was served instantly, with no queuing and no added latency."
  - title: r6 and r7 find it empty, so 429
    text: "r6 and r7 find no token. The limiter rejects them immediately with HTTP 429 Too Many Requests and a Retry-After header saying when to try again. The API servers never see them."
  - title: Three seconds later, 3 tokens back
    text: "At t = 3 s three tokens have dripped back in, so three more requests could pass right now. In steady state this client gets at most 1 request per second. Over any T seconds it can send at most 5 + T requests."
  - title: Other limiters
    text: "A leaky bucket queues requests and lets them out at a fixed rate, smoothing bursts instead of allowing them. A fixed window counts requests per clock minute; it is simple, but a client can send a full quota at 0:59 and another at 1:00, twice the limit in two seconds."
keyIdeas:
  - "**Token bucket**: capacity = maximum burst, refill rate = sustained rate. Over any T seconds a client gets at most capacity + rate × T requests."
  - "Refill **lazily**: on each request add `elapsed × rate` tokens (capped at capacity); no timers needed."
  - "**Leaky bucket** smooths traffic to a constant outflow; **fixed window** is simplest but allows 2× the limit across a window boundary."
  - "Reject with **429 Too Many Requests** plus a `Retry-After` header; clients should back off with jitter."
  - "In a cluster, keep counters in a **shared store** (e.g. Redis) and update them **atomically**."
quiz:
  - q: "A token bucket has capacity 10 and refills 2 tokens per second. It starts full. What is the most a client can send in the first 5 seconds?"
    options: ["10", "15", "20", "25"]
    answer: 2
    why: "It can spend the 10 tokens it starts with, plus the 2 × 5 = 10 that drip in during those 5 seconds: 20 in total."
  - q: "A fixed-window limiter allows 100 requests per minute. What is the worst case in a 2-second span?"
    options: ["100 requests", "About 103 requests", "200 requests", "6,000 requests"]
    answer: 2
    why: "100 requests at 0:59 fill the first window; the counter resets at 1:00, allowing 100 more. That is 200 requests in about two seconds — the boundary burst that sliding windows and token buckets avoid."
  - q: "Your API runs on 10 servers, and each keeps its own in-memory limiter set to 100 requests/min per user. What limit does a user actually get?"
    options: ["100 per minute", "Up to about 1,000 per minute", "10 per minute", "Exactly 100 per server, so 100 total"]
    answer: 1
    why: "The load balancer spreads the user's requests across servers, each counting separately, so the user can get up to 100 per server. Use a shared counter, or divide the limit by the number of servers as an approximation."
bigO:
  - { op: "check a request (token bucket)", avg: "O(1)", note: "two numbers per client: tokens, last refill time" }
  - { op: "max requests in T seconds", avg: "capacity + rate × T" }
  - { op: "fixed window, worst 2 s span", avg: "2 × limit" }
  - { op: "sliding window log, memory", avg: "O(limit)", note: "one timestamp per request in the window" }
bigOTitle: "Key numbers"
related: [sysdesign/api-design, sysdesign/backpressure, sysdesign/reverse-proxies-and-gateways, sysdesign/circuit-breakers-and-retries]
prereqs: [sysdesign/client-server-basics]
griddle: token-bucket
flashcards:
  - kind: qa
    q: "In a token bucket, what do the capacity and the refill rate each control?"
    a: "Capacity is the largest burst a client can send at once; the refill rate is the long-run average rate it can sustain."
  - kind: cloze
    text: "A rejected request should get HTTP {{429 Too Many Requests}} with a {{Retry-After}} header."
  - kind: qa
    q: "Why can a fixed-window limiter let through twice its limit?"
    a: "The counter resets at each window boundary, so a full quota just before the boundary and another just after it both pass, in a span of seconds."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why limit

Without a limit, one client — a buggy retry loop, a scraper, an attacker, or simply your biggest customer — can use up all your capacity and slow everyone else down. A **rate limiter** decides, for each request, whether the client has exceeded its allowance, and rejects the excess cheaply before it reaches the expensive parts of the system. Limits are usually keyed by **API key, user id or IP address**, and often per endpoint (login attempts get a much tighter limit than reads).

## How the token bucket works

Each client has a bucket with two parameters:

- **Capacity b** — the most tokens the bucket can hold, which is the largest burst allowed.
- **Refill rate r** — tokens added per second, which is the long-run allowed rate.

A request takes one token if there is one; otherwise it is rejected. You do not need a timer to add tokens: store `tokens` and `last` (the time of the last update), and on each request compute `tokens = min(b, tokens + (now − last) × r)`. That makes each check **O(1)** time and memory per client.

The guarantee: over any interval of T seconds, at most **b + r·T** requests pass. Short bursts are fine; sustained overload is not.

## Worked example

Capacity 5, refill 1 token/s, bucket full at t = 0.

| Time | Requests | Tokens before | Allowed | Rejected (429) | Tokens after |
|---|---|---|---|---|---|
| 0 s | r1–r7 | 5 | r1–r5 | r6, r7 | 0 |
| 1 s | 1 | 1 | 1 | 0 | 0 |
| 3 s | 0 | 2 | — | — | 2 |
| 4 s | 4 | 3 | 3 | 1 | 0 |
| 20 s | 0 | 5 (capped) | — | — | 5 |

Note the cap: after 16 idle seconds the bucket holds 5, not 16. That cap is what limits bursts.

## Other algorithms

| Algorithm | Idea | Pros | Cons |
|---|---|---|---|
| Token bucket | Tokens drip in; a request spends one | Allows bursts, O(1), two numbers per client | Bursts may still hurt a fragile backend |
| Leaky bucket | Requests enter a queue that drains at a fixed rate | Perfectly smooth output | Adds queuing delay; a full queue drops requests |
| Fixed window | Count per clock window (e.g. per minute), reset at the boundary | Simplest; one counter | Up to 2× the limit across a boundary |
| Sliding window log | Store a timestamp per request; count those in the last 60 s | Exact | Memory grows with the limit |
| Sliding window counter | Weighted mix of this and the previous window's counts | Close to exact, two counters | An approximation |

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation.

```python
import time

class TokenBucket:
    def __init__(self, capacity: float, rate: float):
        self.capacity, self.rate = capacity, rate
        self.tokens = capacity                 # start full
        self.last = time.monotonic()

    def allow(self) -> bool:
        now = time.monotonic()
        # lazy refill: add what dripped in since last time, never above capacity
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False                           # caller returns 429 + Retry-After

buckets = {}                                   # one bucket per API key
def check(api_key):
    b = buckets.setdefault(api_key, TokenBucket(capacity=5, rate=1))
    return b.allow()
```

## Edge cases and pitfalls

- **Many servers:** in-memory buckets on each of 10 servers let a client through up to 10 times. Keep the state in a shared store such as Redis and update it **atomically** (a Lua script or a single atomic command), otherwise two servers can both read "1 token left" and both allow.
- **Where to limit:** at the edge (API gateway or load balancer) to protect everything behind it, and again in front of especially expensive operations.
- **Tell the client:** return **429** with `Retry-After`, and ideally headers showing the limit and remaining quota. Well-behaved clients then back off with **exponential backoff and jitter**.
- **Fail open or closed?** If the limiter's store is down, failing open (allow) keeps the service up but unprotected; failing closed (reject) protects it but causes an outage. Decide deliberately.
- **Clock use:** use a monotonic clock for elapsed time on one machine; with a shared store, use the store's time so servers with skewed clocks agree.

## In the interview

"Design a rate limiter" is a classic. A strong answer asks **who** is limited (user, key, IP) and **what** the limits are, picks the **token bucket** and explains capacity versus rate, shows the **lazy refill** formula, and moves the state into **Redis with atomic updates** for a multi-server deployment. Mention the **429 + Retry-After** response and the **fixed-window boundary** problem. Expect follow-ups on distributed accuracy, very hot keys, and what happens when the limiter's store fails.
