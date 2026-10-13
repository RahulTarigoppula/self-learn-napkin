---
title: Backpressure
track: sysdesign
tags: [reliability, queues, flow-control, performance]
difficulty: 2
minutes: 5
tldr: "When a producer outruns its consumer, the gap has to go somewhere. Backpressure pushes it back upstream: bound every buffer, then block, drop or reject the excess instead of queueing it forever."
analogy: "A motorway on-ramp with traffic lights. When the motorway is full the lights hold cars on the ramp, a few at a time, instead of letting everyone pour in and gridlock the whole road."
diagram: backpressure
story:
  - title: Producer faster than consumer
    text: "A producer sends 1,000 items per second through a buffer to a consumer that can handle only 800 per second. Every second, 200 items more arrive than leave. Something has to give, and backpressure is about choosing what."
  - title: "Unbounded queue: memory and latency grow"
    text: "With an unbounded queue nothing seems wrong at first. But after 60 s, 12,000 items are waiting, and a new item waits 12,000 ÷ 800 = 15 s. Clients time out long before that, retry and add more load, while the queue keeps growing until the process runs out of memory."
  - title: "Bound it: block, drop or shed"
    text: "Give the buffer a fixed capacity, here 100. When it is full you must choose: block the producer until there is room, drop items (the oldest or the newest), or shed load by rejecting requests early with 429 or 503 so callers back off. Each choice is visible and bounded, unlike a silent pile-up."
  - title: "Pull: the consumer sets the pace"
    text: "Better still, let the consumer ask for work. It sends request(50) and the producer may send at most 50 items until asked again. Reactive Streams work this way, and so does TCP: the receiver advertises a window, and the sender may not have more unacknowledged bytes in flight than that."
  - title: "Little's law: L = λW"
    text: "Little's law links the three numbers: items in the system L equals arrival rate λ times time spent W. A full buffer of 100 drained at 800 per second means each item waits about 100 ÷ 800 = 125 ms. Bounding the queue is how you bound latency."
keyIdeas:
  - "**Backpressure** = a slow consumer can make its producer slow down, so overload is handled where it starts."
  - "**Unbounded queues** turn overload into ever-growing latency and memory, then a crash. Every buffer needs a limit."
  - "When full, **block** (propagate the slowdown), **drop** (lose data on purpose) or **shed** (reject fast with 429/503)."
  - "**Pull-based** flow (Reactive Streams `request(n)`, TCP receive window) means the consumer never gets more than it asked for."
  - "**Little's law L = λW**: 2,000 req/s at 50 ms means 100 requests in flight; if latency rises to 500 ms, 1,000."
quiz:
  - q: "Producers send 1,000 msg/s, consumers handle 800 msg/s, and the queue is unbounded. After 5 minutes, how long does a new message wait?"
    options: ["About 1.25 s", "About 15 s", "About 75 s", "About 300 s"]
    answer: 2
    why: "The backlog grows 200/s for 300 s, so 60,000 messages are queued. At 800/s they take 60,000 ÷ 800 = 75 s to drain before the new message is served."
  - q: "An API serves 2,000 requests/s with an average latency of 50 ms. How many requests are in progress at any moment, on average?"
    options: ["40", "100", "1,000", "2,000"]
    answer: 1
    why: "Little's law: L = λ × W = 2,000/s × 0.05 s = 100. If a dependency slows the latency to 500 ms, the same traffic needs 1,000 concurrent slots."
  - q: "A stock-price feed overwhelms a dashboard that only needs the latest value. Which overflow policy fits best?"
    options: ["Block the feed", "Drop the oldest updates and keep the newest", "Return 503 to the exchange", "Use an unbounded queue"]
    answer: 1
    why: "Old prices are worthless once a newer one exists, so dropping them loses nothing important. Blocking would make the dashboard ever more stale."
  - q: "Why is rejecting excess requests with 503 often better than queueing them?"
    options: ["503s are cached", "Queued requests may wait past the client's timeout, so the server does work nobody is waiting for", "It increases throughput above capacity", "Clients never retry after a 503"]
    answer: 1
    why: "A request that waits 15 s behind a backlog is usually abandoned and retried by its client. Failing fast keeps latency low for the work you accept and tells callers to back off."
bigO:
  - { op: "Little's law", avg: "L = λ × W", note: "long-run averages, any stable system" }
  - { op: "backlog growth", avg: "in − out per second", note: "1,000 − 800 = 200/s" }
  - { op: "wait behind a backlog", avg: "backlog ÷ drain rate", note: "12,000 ÷ 800 = 15 s" }
  - { op: "M/M/1 time in system", avg: "S ÷ (1 − ρ)", note: "90 % busy → 10 × service time" }
  - { op: "HTTP overload codes", avg: "429, 503", note: "add Retry-After" }
bigOTitle: "Key numbers"
related: [sysdesign/message-queues, sysdesign/rate-limiting, sysdesign/circuit-breakers-and-retries, sysdesign/pub-sub-and-streams]
prereqs: [sysdesign/message-queues]
flashcards:
  - kind: qa
    q: "What are the three things you can do when a bounded buffer is full?"
    a: "Block the producer until space frees up, drop items (oldest or newest), or shed load by rejecting new work quickly (429/503) so callers back off."
  - kind: cloze
    text: "Little's law says the number of items in a system equals {{arrival rate}} times {{time in the system}}: L = λW."
  - kind: qa
    q: "How is TCP flow control a form of backpressure?"
    a: "The receiver advertises a receive window, the free space in its buffer. The sender may not have more unacknowledged bytes in flight than that, and a zero window stops it entirely."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

Any pipeline has stages that run at different speeds: a web tier and a database, a producer and a queue consumer, a fast network and a slow disk. Over a long enough time, **what goes in must come out at the same rate**, or the difference accumulates somewhere. If the consumer can process 800 items per second and 1,000 arrive, 200 per second have to be stored, dropped, refused or slowed down at the source. There is no fifth option.

**Backpressure** is the mechanism that carries "I'm full" from a slow stage back to the fast one, so the system slows down or sheds work deliberately instead of falling over. The word comes from fluid in a pipe: a narrow section pushes back on the flow behind it.

## Why unbounded queues fail

An unbounded queue hides the problem instead of solving it:

1. **Latency grows without limit.** The wait for a new item is backlog ÷ drain rate. With 200 extra items/s, after one minute that is 12,000 ÷ 800 = 15 s; after ten minutes, 150 s.
2. **Wasted work.** Clients give up after their timeout (say 10 s) and retry. The server later processes the abandoned request anyway, so it spends capacity on answers nobody reads, while the retries add even more load.
3. **Memory runs out.** 12,000 queued requests of 200 KB each is 2.4 GB. The process is killed and *everything* in the queue is lost at once.

Queueing theory explains why this happens before you hit 100 % load. For a simple single-server queue (M/M/1) with service time S and utilisation ρ (fraction of time busy), the average time in the system is S ÷ (1 − ρ). At 50 % busy it is 2S; at 90 %, 10S; at 99 %, 100S. Latency explodes as you approach capacity, so headroom and limits matter.

## The three responses to a full buffer

| Strategy | What happens | Good for | Watch out |
|---|---|---|---|
| **Block** | the producer waits until there is room | internal pipelines, batch jobs, streams where nothing may be lost | the slowdown spreads upstream; a blocked thread holds memory and connections |
| **Drop** | discard items: newest (tail drop), oldest, or a sample | metrics, telemetry, live video, price ticks | data loss must be acceptable and counted |
| **Shed** | reject new work immediately with **429** (this caller is over its limit) or **503** (the service is overloaded), ideally with `Retry-After` | user-facing APIs | clients must back off, not retry instantly |

Blocking is true backpressure: the signal travels back to the original source, which may itself block, buffer or shed. Dropping and shedding stop the signal at this stage. Real systems combine them: block inside a service, shed at its front door.

## Pull instead of push

In a **push** system the producer decides the rate and the consumer must keep up. In a **pull** system the consumer asks for work when it has capacity, so overload cannot happen by construction.

- **Reactive Streams** (Java's `Flow` API, Project Reactor, RxJava's `Flowable`, Akka Streams): the subscriber calls `request(n)`, and the publisher may emit at most n items until the next request.
- **TCP flow control:** the receiver advertises a **receive window**, the free space in its buffer, in every ACK. The sender may not have more unacknowledged bytes in flight than the window. If the application stops reading, the window drops to 0 and the sender stops. (This is separate from congestion control, which protects the network rather than the receiver.)
- **Log-based streams** such as Kafka: consumers poll for records at their own pace, so a slow consumer only grows its lag; it is never flooded.

## Little's law

For any stable system, over the long run:

**L = λ × W**: average items in the system = average arrival rate × average time each item spends inside.

It needs no assumptions about distributions, which makes it the most useful formula for sizing. Worked numbers:

| Situation | λ | W | L |
|---|---|---|---|
| API, healthy | 2,000 req/s | 50 ms | **100** requests in flight |
| Same API, a dependency slows down | 2,000 req/s | 500 ms | **1,000** in flight; a pool of 200 threads is exhausted |
| Full buffer of 100, drained at 800/s | 800/s | ? | 100, so W = 100 ÷ 800 = **125 ms** |
| Consumer group 12,000 messages behind | 800/s | ? | W = 12,000 ÷ 800 = **15 s** behind |

The second row is how cascading failures start: latency rises downstream, concurrency rises upstream, and pools, sockets and memory run out. The third row is the design rule: **choose the buffer size from the latency you can tolerate**. If items may wait at most 125 ms and you drain 800/s, the buffer holds at most 100.

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation.

```python
import asyncio

queue: asyncio.Queue = asyncio.Queue(maxsize=100)   # bounded: at most 125 ms of work at 800/s

async def produce(item):
    await queue.put(item)          # blocks while full: the slowdown reaches the producer

def accept_request(req):           # front door of an API: shed instead of waiting
    try:
        queue.put_nowait(req)
    except asyncio.QueueFull:
        return 503, {"Retry-After": "1"}   # fail fast; well-behaved clients back off
    return 202, {}

async def consume():
    while True:
        item = await queue.get()   # pull: take the next item only when ready
        await process(item)
        queue.task_done()
```

## Pitfalls

- **A hidden unbounded buffer.** Thread-pool work queues, in-memory channels, log shippers and HTTP client pools often default to unbounded or very large limits. Find them and set limits.
- **Bounded but too big.** A limit of 1,000,000 items is just a slower crash. Size it from W = L ÷ λ.
- **Shedding without client cooperation.** Clients that retry a 503 immediately turn shedding into a retry storm. Use exponential backoff with jitter and honour `Retry-After`.
- **FIFO under overload.** When a queue is long, the oldest items are the most likely to be abandoned. Some systems bound queueing *time* instead of length (for example the CoDel algorithm drops items that have waited too long) or switch to LIFO under overload so fresh requests succeed.
- **Shedding the wrong work.** Prioritise: shed analytics and prefetches before checkouts and logins.

## In the interview

Backpressure comes up whenever a design has a queue, a stream or a fan-out: *"what happens when consumers fall behind?"* A strong answer says every buffer is bounded, picks block, drop or shed with a reason, mentions **pull-based consumption** and **autoscaling on queue depth or lag**, and sizes something with **Little's law**. Expect the follow-up *"what does the client do on a 503?"*: back off with jitter and retry later, or fail the user action gracefully.
