---
title: Pub/Sub and Streams
track: sysdesign
tags: [async, streaming, messaging, kafka]
difficulty: 2
minutes: 5
tldr: "A work queue gives each message to one worker; pub/sub gives a copy to every subscriber. A log-based stream does both: an append-only, partitioned log that each consumer group reads at its own offset."
analogy: "A newspaper archive. Every department reads the same issues, each with its own bookmark. Inside one department the pile is shared out so no two people read the same issue, and anyone can turn back to last week because issues are kept, not thrown away."
diagram: pub-sub-and-streams
story:
  - title: Work queue vs pub/sub topic
    text: "On the left, a work queue: message m1 goes to exactly one worker, W1 or W2, which share the load. On the right, a pub/sub topic: one 'order placed' event is copied to email, billing and analytics, and each does its own job with it. The publisher does not know who is listening."
  - title: A stream is an append-only log
    text: "Log-based streams such as Kafka store a topic as a log. Every new event is appended at the end and gets the next offset, here 7. Reading does not delete anything; a reader just remembers how far it got. That one change makes replay, many independent readers and huge throughput possible."
  - title: "Partitions: the key picks one"
    text: "One log on one machine cannot hold every event, so the topic is split into partitions P0, P1 and P2, each its own log with its own offsets. The producer picks a partition by hashing the event's key: hash(user:7) % 3 = 1, so every event of user 7 (highlighted) lands in P1, in the order it was written. There is no order across partitions."
  - title: "Consumer group: one partition, one consumer"
    text: "Consumers that share a group id split the partitions between them: C1 reads P0 and P1, C2 reads P2. Within a classic consumer group, a partition is read by only one consumer, which is what keeps each partition in order. A different group, say analytics, gets every event again with its own separate progress."
  - title: Offsets, retention and replay
    text: "Each group commits the offset it has processed, per partition. On P2 billing is at 5 and analytics, slower, is at 1. Events are kept for a retention period, 7 days by default in Kafka, whether or not anyone read them. Rewind a group's offset and it replays history, for example after fixing a bug."
keyIdeas:
  - "**Queue:** each message to one consumer, deleted on ack. **Pub/sub:** each message to every subscriber. A stream gives pub/sub across **consumer groups** and queue-style sharing inside one."
  - "A **partition** is an append-only log; an **offset** is a position in it. Ordering is guaranteed **only within a partition**."
  - "The **partition key** decides ordering and load: key by the entity whose events must stay in order (user, order, account)."
  - "Within a group, **one partition → one consumer**, so partitions cap parallelism: 6 partitions, 8 consumers means 2 sit idle."
  - "Events stay for the **retention** period, so a group can **replay** by resetting its offset; commit after processing for at-least-once."
quiz:
  - q: "Email, billing and analytics must each see every 'order placed' event. What is the right setup on a Kafka-style stream?"
    options: ["One topic, three consumer groups", "One topic, one group with three consumers", "Three partitions, one per service", "One queue that each service polls"]
    answer: 0
    why: "Each consumer group gets every event and tracks its own offsets. Three consumers in one group would split the partitions, so each service would see only part of the events."
  - q: "A topic has 6 partitions and the billing group runs 8 consumers. What happens?"
    options: ["All 8 share the work evenly", "6 consumers get one partition each and 2 are idle", "Kafka creates 2 more partitions", "Each partition is read by two consumers"]
    answer: 1
    why: "Inside a group a partition is assigned to exactly one consumer, so at most 6 can be busy. Extra consumers are hot spares that take over during a rebalance."
  - q: "Events for one order must be processed in order: created, paid, shipped. Which choice guarantees it?"
    options: ["Use a single consumer group", "Send them with key = order id", "Send them with no key for even spread", "Increase retention"]
    answer: 1
    why: "The same key always hashes to the same partition, and a partition is an ordered log read by one consumer per group. Without a key, the events can land in different partitions and be processed in any order."
  - q: "A consumer processes a batch, then crashes before committing its offset. What happens after the rebalance?"
    options: ["The batch is lost", "The new owner starts from the last committed offset and processes the batch again", "Kafka deletes the batch", "The new owner skips to the newest event"]
    answer: 1
    why: "The committed offset is the restart point. Work done after it is repeated, which is at-least-once delivery, so handlers must be idempotent."
bigO:
  - { op: "append / read next", avg: "O(1)", note: "sequential disk writes and reads" }
  - { op: "max busy consumers per group", avg: "= partitions", note: "extra consumers sit idle" }
  - { op: "ordering", avg: "per partition", note: "none across partitions" }
  - { op: "Kafka default retention", avg: "7 days", note: "retention.ms = 604,800,000" }
  - { op: "consumer lag", avg: "end offset − committed", note: "per partition; alert when it grows" }
bigOTitle: "Key numbers"
related: [sysdesign/message-queues, sysdesign/idempotency, sysdesign/backpressure, sysdesign/write-ahead-log]
prereqs: [sysdesign/message-queues]
flashcards:
  - kind: qa
    q: "Queue vs pub/sub vs log-based stream, in one line each?"
    a: "Queue: each message to one consumer, deleted on ack. Pub/sub: each message to every subscriber. Stream: a retained, partitioned log; every group reads all of it, consumers inside a group split the partitions."
  - kind: cloze
    text: "Kafka guarantees ordering only {{within a partition}}, so events that must stay in order need the same {{partition key}}."
  - kind: qa
    q: "Why can't you add consumers forever to drain a lagging consumer group?"
    a: "Each partition is read by at most one consumer in the group, so parallelism is capped by the partition count. Beyond that, add partitions (which re-maps keys) or make handlers faster."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Asynchronism and message queues, background" }
---

## Three delivery shapes

Services talk asynchronously by sending **messages** (or **events**: facts like "order 123 was placed") through a broker. There are three shapes to know:

| Shape | Who gets a message | When it is deleted | Typical systems |
|---|---|---|---|
| **Work queue** | exactly one of the competing consumers | when that consumer acks | RabbitMQ queue, Amazon SQS |
| **Pub/sub topic** | every subscriber gets its own copy | after each subscriber has it (or immediately, if nobody listens) | Amazon SNS, Google Pub/Sub, Redis Pub/Sub |
| **Log-based stream** | every consumer *group*; inside a group, the consumers share the work | after the retention period, read or not | Apache Kafka, Amazon Kinesis, Redpanda, Apache Pulsar |

A **work queue** spreads *tasks*: resize this image, send this email. **Pub/sub** spreads *news*: when an order is placed, several independent services react, and the publisher does not need to know who they are. Adding a new subscriber needs no change to the publisher. Note that Redis Pub/Sub is fire-and-forget: a subscriber that is disconnected simply misses the message.

## How a log-based stream works

1. **Topic and partitions.** A **topic** (say `orders`) is split into **partitions**. Each partition is an **append-only log**: records are only ever added at the end, and each gets the next **offset**, a sequence number unique within that partition. Partitions live on different brokers and are replicated, so one topic can absorb far more writes than a single machine.
2. **Producing.** The producer chooses a partition for each record. With a key, the default is `hash(key) % partitions` (Kafka's Java client uses murmur2; other clients may use a different hash), so **the same key always goes to the same partition**. Without a key, records are spread for balance.
3. **Consuming.** Consumers **pull** records in offset order. Reading does not delete anything. Each consumer just remembers its position.
4. **Consumer groups.** Consumers that share a `group.id` form a **group**. The broker assigns each partition to **exactly one** consumer in the group (one consumer may own several partitions). When consumers join, leave or crash, the group **rebalances** and partitions move.
5. **Committed offsets.** Each group periodically stores, per partition, the offset of the next record it will process. After a crash or rebalance, the new owner resumes from there.
6. **Retention.** Records are deleted by age or size (Kafka's default `retention.ms` is 7 days), not by being read. **Log compaction** is the other option: keep at least the latest record for each key forever, which turns a topic into a changelog of current state.

Because reading is just "remember an offset", any number of groups can read the same data at their own pace, and a group can **replay** by moving its offset back.

## Worked example

`orders` has 3 partitions, key = user id. User 7's events `created`, `paid`, `shipped` all hash to P1 and are stored there in that order.

| | P0 | P1 | P2 |
|---|---|---|---|
| Log end offset (next to write) | 8 | 5 | 6 |
| `billing` committed offset | 8 | 5 | 5 |
| `analytics` committed offset | 3 | 2 | 1 |

- **Billing** runs 2 consumers: C1 owns P0 and P1, C2 owns P2. Its **lag** (end offset minus committed offset) is 0 + 0 + 1 = 1 record.
- **Analytics** runs 1 consumer that owns all 3 partitions. Its lag is 5 + 3 + 5 = 13 records. It is slower, but that does not slow billing at all.
- **C1 crashes.** Records 8 and 9 arrive in P0; C1 processes both but dies before committing. The group rebalances, C2 now owns all three partitions, starts P0 at the committed offset 8 and processes 8 and 9 **again**. That is **at-least-once** delivery, and the reason billing's handler must be idempotent.
- **Analytics ships a bug** that miscounted revenue for a day. They fix it, stop the group, reset its offsets to yesterday's timestamp and let it re-read. Nothing upstream is involved; the data was still in the log.

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation. It uses the confluent-kafka client, so it needs a running broker.

```python sketch
from confluent_kafka import Consumer, Producer

p = Producer({"bootstrap.servers": "broker:9092", "enable.idempotence": True})
p.produce("orders", key="user:7", value=b'{"type": "paid", "order": 123}')
p.flush()                                   # wait until the broker has it

c = Consumer({
    "bootstrap.servers": "broker:9092",
    "group.id": "billing",                  # same id = share the partitions
    "enable.auto.commit": False,            # commit only after the work is done
    "auto.offset.reset": "earliest",        # where a brand-new group starts
})
c.subscribe(["orders"])
while True:
    msg = c.poll(1.0)
    if msg is None or msg.error():
        continue
    handle(msg.key(), msg.value())          # idempotent: may see a record twice
    c.commit(message=msg, asynchronous=False)  # stores offset + 1 for this partition
```

```bash
# replay: move the (stopped) analytics group back to a point in time
kafka-consumer-groups.sh --bootstrap-server broker:9092 --group analytics \
  --topic orders --reset-offsets --to-datetime 2026-10-12T00:00:00.000 --execute
```

Committing *after* `handle` gives at-least-once. Committing *before* gives at-most-once: a crash between the two loses the record.

## Choosing a partition key

- **Key by the entity whose order matters**: order id for an order's lifecycle, account id for a ledger, user id for a user's activity. Only records with the same key are ordered relative to each other.
- **Watch for hot keys.** One celebrity user or one giant tenant sends all its traffic to one partition, which one consumer must handle alone. Options: a finer key (user + session), or salting the key (`user:7#3`) when per-key order is not needed.
- **Pick the partition count up front.** It caps a group's parallelism: if each consumer handles 1,000 records/s and the topic receives 10,000/s, you need at least 10 partitions. Adding partitions later changes `hash(key) % partitions`, so a key's new records go to a different partition than its old ones and ordering across that moment is lost.

## Edge cases and pitfalls

- **More consumers than partitions** leaves the extras idle; they only help as standbys.
- **Slow handlers trigger rebalances.** If a consumer does not poll within `max.poll.interval.ms` (5 minutes by default), it is considered dead and its partitions move, often causing duplicate processing.
- **Exactly-once is narrow.** Kafka's idempotent producer and transactions give exactly-once for read-from-Kafka, write-to-Kafka pipelines. Side effects outside Kafka (charging a card, sending an email) still need idempotent handlers.
- **Retention is a contract.** A consumer that falls further behind than the retention period loses data it never read.
- **Poison records** block their partition, because order forces the consumer to finish one before the next. Send them to a dead-letter topic after a few retries.

## When to use which

Use a **work queue** for independent tasks where order does not matter and per-message retries and delays are handy. Use **pub/sub** when several services must react to the same event. Use a **log-based stream** when you also need high throughput, per-key ordering, replay, or many independent readers: event sourcing, change data capture, metrics and click pipelines.

## In the interview

Say "one topic, one consumer group per service" when several services need the same events, and name the **partition key** and why. Expect the follow-ups: *how is ordering guaranteed?* (only per partition, so key by the entity), *what happens when a consumer dies?* (rebalance, resume from the committed offset, duplicates are possible, so handlers are idempotent) and *how do you scale reads?* (more partitions and consumers, up to one consumer per partition).
