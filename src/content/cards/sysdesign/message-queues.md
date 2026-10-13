---
title: Message Queues
track: sysdesign
tags: [async, queues, decoupling, reliability]
difficulty: 2
minutes: 4
tldr: "A producer drops work into a queue and moves on; consumers pull at their own pace. You gain buffering and decoupling, and pay with at-least-once delivery, so handlers must be idempotent."
analogy: "A restaurant ticket rail: waiters clip orders on and go back to the tables; cooks take tickets when they are free. A dinner rush lengthens the rail instead of crushing the kitchen, and a ticket nobody can cook goes to the manager."
diagram: message-queue
story:
  - title: Producer, queue, consumers
    text: "The shop service (the producer) no longer calls the order processor directly. It appends a message to the orders queue and returns to the user at once. Two consumers, C1 and C2, pull messages from the head of the queue whenever they are free. Neither side needs to know the other exists."
  - title: A burst piles up in the queue
    text: "A flash sale sends 1,000 orders per second, but C1 and C2 can process only 200 per second each. Instead of timing out, the extra 600 per second wait in the queue (m1 to m5 here). After the spike the consumers drain the backlog, and you can add consumers to drain it faster."
  - title: Consume, then ack
    text: "C1 receives m1. While C1 works on it, the queue hides m1 from other consumers but does not delete it. Only when C1 finishes and sends an ack (acknowledgement) does the queue remove m1 for good."
  - title: Crash before ack, delivered again
    text: "C1 takes m2, charges the card, then crashes before acking. After the visibility timeout, say 30 s, m2 reappears and C2 receives it. This is at-least-once delivery: nothing is lost, but m2 may run twice. So the handler must be idempotent: C2 sees order m2 was already handled and skips the second charge."
  - title: Poison message to the dead-letter queue
    text: "m3 has a malformed address and fails on every attempt. Retrying forever would waste consumers and block progress. After 3 failed attempts the queue moves m3 to a dead-letter queue, where an engineer can inspect it, fix the bug and replay it."
keyIdeas:
  - "**Decoupling**: producers and consumers scale, deploy and fail independently."
  - "**Buffering**: a queue absorbs bursts; consumers work at a steady rate and **queue depth** tells you when to add more."
  - "**At-least-once** is the normal guarantee: a message is deleted only after an **ack**, so a crash means redelivery."
  - "Make handlers **idempotent** (dedupe on a message or business id, or use upserts) so a duplicate is harmless."
  - "A **dead-letter queue** catches poison messages after N failed attempts so they cannot block the rest."
quiz:
  - q: "A consumer charges a card, then crashes before acking. What does a standard at-least-once queue do?"
    options: ["Deletes the message because it was delivered", "Redelivers it after the visibility timeout, so the charge may run twice", "Moves it straight to the dead-letter queue", "Rolls back the charge"]
    answer: 1
    why: "Without an ack the queue cannot tell 'processed' from 'lost', so it makes the message visible again. The handler must be idempotent, for example by recording processed order ids, or the customer is charged twice."
  - q: "Producers send 1,000 msg/s for 60 s. Two consumers each handle 200 msg/s. How big is the backlog when the burst ends?"
    options: ["0", "12,000 messages", "36,000 messages", "60,000 messages"]
    answer: 2
    why: "Inflow 1,000/s minus outflow 400/s leaves 600/s queuing. 600 × 60 s = 36,000 messages wait to be drained."
  - q: "Why move a message to a dead-letter queue after a few failures instead of retrying forever?"
    options: ["To save disk space", "A message that always fails would burn consumer time and can block messages behind it", "Dead-letter queues are faster", "To guarantee exactly-once delivery"]
    answer: 1
    why: "A poison message fails the same way each time. Parking it after a retry limit keeps the main queue flowing and preserves it for debugging and replay."
bigO:
  - { op: "enqueue / dequeue", avg: "O(1)" }
  - { op: "backlog growth", avg: "in − out", note: "1,000 − 400 = 600 msg/s in the example" }
  - { op: "typical visibility timeout", avg: "30 s", note: "longer than the slowest handler" }
  - { op: "typical retries before DLQ", avg: "3–5" }
bigOTitle: "Key numbers"
related: [sysdesign/pub-sub-and-streams, sysdesign/idempotency, sysdesign/backpressure, sysdesign/rate-limiting]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "Why is 'exactly-once delivery' usually implemented as at-least-once plus idempotency?"
    a: "The broker cannot know whether a consumer that crashed before acking had already done the work, so it must redeliver; making the handler idempotent turns duplicates into no-ops, giving exactly-once effects."
  - kind: cloze
    text: "A message is deleted only after the consumer sends an {{ack}}; if none arrives before the {{visibility timeout}}, it is delivered again."
  - kind: qa
    q: "What does a growing queue depth tell you, and what do you do about it?"
    a: "Consumers are slower than producers. Add consumers (autoscale on depth), speed up handlers, or apply backpressure or rate limits upstream."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Asynchronism section, redrawn" }
---

## Why put a queue in the middle

When one service calls another directly (a **synchronous** call), the caller waits for the answer, fails if the callee is down, and passes every traffic spike straight through. A **message queue** is a durable buffer between them. The **producer** writes a **message** (a small record describing work, such as "order 123 placed") to the queue and moves on. **Consumers** read messages and do the work later — **asynchronously**.

That gives three things:

- **Decoupling:** the producer does not know who consumes, how many consumers there are, or whether they are up right now.
- **Buffering:** a burst becomes a longer queue rather than timeouts and dropped requests.
- **Scaling:** add consumers to drain faster. Several consumers on one queue (**competing consumers**) share the work, each message going to one of them.

## How it works

1. **Send:** the producer appends a message; the broker stores it durably (usually replicated to disk) and confirms.
2. **Receive:** a consumer pulls a message. The broker does not delete it; it hides it from other consumers for a **visibility timeout** (or tracks it as unacknowledged).
3. **Ack:** after finishing the work, the consumer **acknowledges**. Only now is the message deleted.
4. **No ack:** if the consumer crashes or the timeout passes, the message becomes visible again and is redelivered — possibly to another consumer.
5. **Dead letter:** after a configured number of failed receives (say 3–5), the broker moves the message to a **dead-letter queue (DLQ)** for inspection.

### Delivery guarantees

| Guarantee | How | Risk |
|---|---|---|
| At-most-once | Ack (delete) *before* processing | A crash loses the message |
| At-least-once | Ack *after* processing | A crash causes a duplicate |
| Exactly-once effect | At-least-once + idempotent handler | Needs a dedupe key or naturally idempotent writes |

Brokers cannot give true exactly-once delivery to an arbitrary consumer: if the consumer crashes after doing the work but before the ack, the broker cannot tell that apart from a crash before the work. So the industry standard is **at-least-once + idempotency**.

## Worked example

Flash sale: producers send 1,000 orders/s for 60 s, then 100/s. Two consumers handle 200/s each.

| Phase | In | Out | Queue depth |
|---|---|---|---|
| Before the sale | 100/s | up to 400/s | ~0 |
| Sale, 60 s | 1,000/s | 400/s | grows 600/s → 36,000 |
| After, 2 consumers | 100/s | 400/s | shrinks 300/s → empty in 120 s |
| After, autoscaled to 6 | 100/s | 1,200/s | shrinks 1,100/s → empty in ~33 s |

No order was lost or rejected; customers just got their confirmation emails a little later. Then a consumer crashes after committing order 123 but before acking: the message is redelivered after 30 s, and the next handler finds 123 in its `processed` table and skips it. Had the crash come *before* the commit, the claim would roll back and the retry would charge again with the same payment idempotency key, which the payment provider recognises — the card is still charged once.

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation. `queue` and `db` stand for any queue client (SQS, RabbitMQ, …) and database driver.

```python sketch
def handle(msg):
    order_id = msg.body["order_id"]
    with db.transaction():
        # claim the order first: the primary key on processed.order_id rejects a second claim
        claimed = db.execute("INSERT INTO processed(order_id) VALUES (%s) "
                             "ON CONFLICT DO NOTHING", order_id).rowcount
        if not claimed:
            return                                    # duplicate: already done
        charge_card(order_id, idempotency_key=order_id)  # provider dedupes a retried charge
    # a crash before commit rolls the claim back, so redelivery retries safely

while True:
    for msg in queue.receive(max_messages=10, visibility_timeout=30):
        try:
            handle(msg)
            queue.ack(msg)                            # delete only after success
        except Exception:
            pass       # no ack: redelivered later; DLQ after max_receives = 3
```

## Edge cases and pitfalls

- **Visibility timeout too short:** a slow but healthy consumer is still working when the message reappears, so two consumers process it at once. Set it well above the slowest handler, or extend it while working.
- **Ordering:** a plain queue with competing consumers does not preserve order. If order matters per entity, use a FIFO queue with message groups, or a partitioned log (such as Kafka) keyed by the entity id.
- **External side effects** (charging a card, sending email) are not covered by your database transaction; pass an idempotency key to the external service too.
- **Unbounded backlog** hides problems. Alert on queue depth and on the age of the oldest message, and apply backpressure upstream if needed.
- **Queue vs pub/sub:** a queue delivers each message to one consumer; a pub/sub topic delivers a copy to every subscriber group. Use pub/sub when several services must react to the same event.

## In the interview

Queues appear whenever work can happen later: sending email, processing uploads, fan-out of notifications, order pipelines. A strong answer says why async is acceptable here, names the guarantee (**at-least-once**), shows how handlers stay **idempotent**, mentions the **DLQ** and retry limit, and says how you scale consumers (autoscale on queue depth). Expect the follow-ups "how do you avoid charging twice?" and "what if order matters?"
