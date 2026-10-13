---
title: Observability
track: sysdesign
tags: [monitoring, reliability, slo, tracing]
difficulty: 2
minutes: 6
tldr: "Metrics say something is wrong, traces show where, logs explain why. Watch p99, not the average, and run against an SLO whose error budget says how much failure is allowed."
analogy: "A hospital patient: the heart-rate monitor (metrics) beeps, the scan (trace) shows which organ is in trouble, and the doctor's notes (logs) say what exactly happened at 3 a.m."
diagram: observability
story:
  - title: "Logs: one record per event"
    text: "A log is a timestamped record of one event: a request served, an error thrown. The red line says POST /pay returned 500, and it carries trace=ab12, which links it to everything else this request did. Logs hold the most detail but are the most expensive signal to store and search."
  - title: "Metrics: cheap numbers over time"
    text: "A metric is a number sampled over time: requests per second, errors per second, latency percentiles, CPU. Metrics are cheap to keep for months and ideal for dashboards and alerts. Here the error rate spikes while traffic stays flat: something broke, but the graph cannot say where."
  - title: "Traces: one request across services"
    text: "A trace follows one request, ab12, through every service. Each bar is a span: one operation with a start time and duration. api took 340 ms in total, auth was quick, and inside orders a single database query took 260 ms. The trace shows exactly where the time went."
  - title: "Percentiles: the average hides the tail"
    text: "Most requests take about 40 ms, but 2 % take 900 ms. The average is about 60 ms and looks healthy, yet p99, the latency 99 % of requests beat, is 900 ms. Those slow requests are real users, often your busiest ones. Alert on p95 and p99, not on the mean."
  - title: "SLO: 99.9 % leaves 43 minutes"
    text: "A service level objective sets the target, for example 99.9 % of requests succeed over 30 days. The remaining 0.1 % is the error budget: 0.1 % of 43,200 minutes is 43.2 minutes of full outage. An incident that burned 30 minutes leaves 13, a signal to slow risky releases."
keyIdeas:
  - "**Metrics** detect (cheap, aggregated), **traces** locate (one request across services), **logs** explain (rich detail). Link them with a shared **trace id**."
  - "**RED** for services: Rate, Errors, Duration. **USE** for resources: Utilisation, Saturation, Errors."
  - "Report **p50, p95, p99**, not the mean. Percentiles cannot be averaged across hosts; merge histograms instead."
  - "**SLI** = what you measure (good ÷ valid requests), **SLO** = the target, **error budget** = 1 − SLO. 99.9 % per 30 days ≈ 43 minutes."
  - "Alert on **symptoms users feel** and on **budget burn rate**, not on every CPU blip."
quiz:
  - q: "980 requests take 42 ms and 20 take 900 ms. What are the average and the p99?"
    options: ["Average ≈ 59 ms, p99 = 900 ms", "Average ≈ 471 ms, p99 = 42 ms", "Average ≈ 59 ms, p99 = 42 ms", "Average = 42 ms, p99 = 59 ms"]
    answer: 0
    why: "Average = (980 × 42 + 20 × 900) ÷ 1,000 = 59.2 ms. Sorting, ranks 981–1,000 are 900 ms, and p99 is rank 990, so 900 ms."
  - q: "What does a 99.95 % monthly availability SLO allow, over 30 days?"
    options: ["About 4.3 minutes", "About 21.6 minutes", "About 43.2 minutes", "About 7.2 hours"]
    answer: 1
    why: "0.05 % of 43,200 minutes = 21.6 minutes. Each extra 9 divides the budget by ten: 99.9 % → 43.2 min, 99.99 % → 4.32 min."
  - q: "A page calls 100 backend services in parallel, each fast except 1 % of the time. How often is the page slow?"
    options: ["About 1 % of page loads", "About 10 %", "About 63 %", "Never"]
    answer: 2
    why: "The page waits for the slowest call. P(all 100 fast) = 0.99¹⁰⁰ ≈ 0.37, so about 63 % of loads hit at least one slow call. Tail latency dominates in fan-out."
  - q: "Users report slow checkouts. Metrics show p99 up, but which of 12 services is at fault?"
    options: ["Search every service's log files for errors around that time", "Open a trace of a slow checkout and find the long span", "Restart all 12 services and see whether p99 recovers", "Compare each service's average CPU and pick the busiest"]
    answer: 1
    why: "A trace shows the request's path with timings for each span, so the slow hop stands out. Then use its trace id to pull the matching logs for the reason."
bigO:
  - { op: "99 % per 30 days", avg: "7.2 h", note: "downtime budget" }
  - { op: "99.9 %", avg: "43.2 min", note: "≈ 43.8 min per average month" }
  - { op: "99.99 %", avg: "4.32 min" }
  - { op: "budget in requests", avg: "(1 − SLO) × requests", note: "10 M at 99.9 % → 10,000 failures" }
  - { op: "fan-out of 100, 1 % slow each", avg: "63 % slow pages", note: "1 − 0.99¹⁰⁰" }
bigOTitle: "Key numbers"
related: [sysdesign/circuit-breakers-and-retries, sysdesign/back-of-envelope, sysdesign/load-balancing, sysdesign/backpressure]
prereqs: []
flashcards:
  - kind: qa
    q: "Logs vs metrics vs traces in one line each?"
    a: "Metrics: cheap numeric time series for dashboards and alerts. Traces: one request's path and timing across services. Logs: detailed records of individual events."
  - kind: cloze
    text: "A 99.9 % SLO over 30 days leaves an {{error budget}} of about {{43 minutes}}."
  - kind: qa
    q: "Why is the average latency a poor alerting signal?"
    a: "A few very slow requests barely move the mean, so it looks healthy while 1–5 % of users wait seconds. Percentiles like p99 expose the tail."
  - kind: cloze
    text: "RED stands for {{Rate, Errors, Duration}}; USE stands for {{Utilisation, Saturation, Errors}}."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Monitoring vs observability

**Monitoring** answers questions you thought of in advance: is the error rate above 1 %? **Observability** is the property of a system that lets you answer questions you did *not* think of, such as "why are checkouts from one region slow only for users on the new app version?", from the data it already emits. In practice you get there with three kinds of telemetry, each good at a different job.

## Logs, metrics and traces

| | What it is | Strength | Cost and limits |
|---|---|---|---|
| **Logs** | timestamped records of individual events | full detail: messages, ids, stack traces | volume grows with traffic; costly to index and keep |
| **Metrics** | numbers aggregated over time (counters, gauges, histograms) | cheap, fast queries, months of history, alerts | no per-request detail; high-**cardinality** labels (user id) explode the series count |
| **Traces** | the path of one request: a tree of **spans** | shows where time goes across services | usually **sampled**; needs every service instrumented |

**Structured logs** (one JSON object per line) can be filtered by field: `{"level": "error", "route": "/pay", "trace_id": "ab12", "msg": "lock wait timeout"}`.

### How distributed tracing works

1. The first service creates a **trace id** (a random 128-bit number) and a **span** for its own work: name, span id, start time, duration, attributes.
2. Every outgoing call carries the context in a header. The W3C standard is `traceparent: 00-<trace id>-<parent span id>-<flags>`.
3. Each downstream service starts a **child span** with the same trace id and the caller's span id as its parent.
4. All spans are sent to a collector, which reassembles the tree into the waterfall in scene 3.

Keeping every trace is expensive, so systems **sample**: head-based (decide at the start, e.g. keep 1 %) or tail-based (decide at the end and keep all errors and slow traces). OpenTelemetry is the vendor-neutral standard for emitting all three signals.

## What to measure: RED, USE and the golden signals

- **RED**, for anything that serves requests: **Rate** (requests/s), **Errors** (failed requests/s), **Duration** (latency distribution).
- **USE**, for resources (CPU, disk, a connection pool): **Utilisation** (% busy), **Saturation** (queued work that cannot be served yet), **Errors**.
- Google's **four golden signals** combine them: latency, traffic, errors, saturation.

## Percentiles: why p99, not the average

The **p99** latency is the value 99 % of requests are faster than. A worked example with 1,000 requests:

| Requests | Latency |
|---|---|
| 980 | 42 ms |
| 20 | 900 ms |

- **Average** = (980 × 42 + 20 × 900) ÷ 1,000 = (41,160 + 18,000) ÷ 1,000 ≈ **59 ms**. Looks fine.
- **p50** (median) = 42 ms. Sort all 1,000; ranks 981–1,000 are 900 ms, so **p99** = rank 990 = **900 ms**.

Twenty users in a thousand wait almost a second, and the average barely notices. It gets worse with **fan-out**: a page that waits on 100 backend calls is slow whenever *any* of them is, which happens on 1 − 0.99¹⁰⁰ ≈ **63 %** of page loads. That is why large systems obsess over the tail.

Two practical rules: **never average percentiles** (the mean of ten hosts' p99s is not the fleet's p99; merge histogram buckets and compute the percentile from the total), and store latency as a **histogram** so any percentile can be computed later.

## SLIs, SLOs and error budgets

- **SLI** (indicator): a measured ratio, `good events ÷ valid events`, e.g. requests answered successfully within 300 ms ÷ all requests.
- **SLO** (objective): the target for that SLI over a window, e.g. 99.9 % over 30 days.
- **SLA** (agreement): a contract with customers with penalties, usually looser than the internal SLO.
- **Error budget** = 1 − SLO: the failure you may spend.

| SLO | Budget per 30 days |
|---|---|
| 99 % | 7.2 hours |
| 99.9 % | 43.2 minutes |
| 99.95 % | 21.6 minutes |
| 99.99 % | 4.32 minutes |

In request terms, 10 million requests a month at 99.9 % allows 10,000 failures. The budget turns reliability into a decision rule: while budget remains, ship features; when it is spent, prioritise reliability work and slow risky deploys. Alert on **burn rate**, how fast the budget is being used: a burn rate of 14.4 for one hour spends 2 % of a 30-day budget (14.4 × 1 h ÷ 720 h), a good threshold for paging someone.

## Worked example: a slow checkout

1. **Metric alert:** checkout p99 rose from 300 ms to 2 s and the error rate from 0.05 % to 1.5 %. Against a 0.1 % budget that is a burn rate of 15, above the 14.4 paging threshold, so someone is paged.
2. **Trace:** a slow checkout's trace shows `orders → db` taking 1.8 s of the 2 s, on a `SELECT … FOR UPDATE`.
3. **Logs:** filtering by that trace id shows `lock wait timeout` errors that started with a deploy that added a long-running batch job holding row locks.
4. **Fix and budget:** the batch job is rolled back. Two hours at burn rate 15 spent about 4 % of the month's budget (15 × 2 h ÷ 720 h), roughly 1.8 of the 43 minutes. Left unnoticed for a day, it would have spent half the budget. That is why burn-rate alerts page early.

## Implement it in Python

The idea is language-independent; Python (with the Prometheus and OpenTelemetry client libraries, which exist for most languages) is used here only as compact, readable notation. The query below it is PromQL, Prometheus's query language.

```python sketch
from prometheus_client import Counter, Histogram
from opentelemetry import trace

REQS = Counter("http_requests_total", "Requests", ["route", "code"])
LAT = Histogram("http_request_duration_seconds", "Latency", ["route"],
                buckets=(0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5))   # histogram → any percentile
tracer = trace.get_tracer("checkout")

def pay(order_id):
    with LAT.labels(route="/pay").time(), tracer.start_as_current_span("pay") as span:
        span.set_attribute("order.id", order_id)    # high-cardinality ids go on spans, not metric labels
        code = charge(order_id)                     # child spans are created inside
        REQS.labels(route="/pay", code=str(code)).inc()
        return code
```

```promql
# fleet-wide p99 over 5 minutes: sum the buckets first, then take the quantile
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```

## Pitfalls

- **Alerting on causes, not symptoms.** CPU at 90 % may be fine; users getting errors never is. Page on SLO burn; send the rest to dashboards.
- **Cardinality explosions.** A `user_id` label on a metric creates one time series per user. Put such ids on spans and logs.
- **Logs without trace ids.** Without a shared id you cannot connect an error log to the request that caused it.
- **Measuring at the server only.** Client-side latency includes DNS, TLS and the network; measure where the user is too.

## In the interview

When asked "how would you monitor this?", name RED metrics per service with p99 latency, distributed tracing with a propagated trace id, structured logs carrying that id, and an SLO with an error budget and burn-rate alerts. Quote one number: 99.9 % is about 43 minutes a month. Expect *"why p99?"* (the average hides the tail, and fan-out multiplies it) and *"how do you avoid alert fatigue?"* (alert on symptoms and budget burn only).
