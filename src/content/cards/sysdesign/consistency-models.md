---
title: Consistency Models
track: sysdesign
tags: [consistency, replication, distributed]
difficulty: 3
minutes: 5
tldr: "A consistency model says which values a read may return. Linearisable acts like one copy in real time; sequential, causal and eventual allow more staleness for speed and availability."
analogy: "A live football score. Linearisable: everyone sees the goal the moment it is scored. Sequential: everyone sees the same goals in the same order, some a bit late. Eventual: your friend's app may still show 0–0, but it will catch up."
diagram: consistency-models
story:
  - title: One value, three clients, real time
    text: "One replicated value x starts at 0. Three clients, A, B and C, use it, and time runs left to right. Each operation takes some time, so we draw it as a bar from when it starts to when it returns. The question is which values reads are allowed to return."
  - title: A writes x = 1
    text: "Client A writes x = 1. The write is acknowledged at the dashed line; after that moment A has been told 'done'. Anything that starts later happens, in real time, after the write."
  - title: C reads after that, and gets 0
    text: "C starts a read after the write completed and gets 0, the old value. This is what a lagging replica produces. It is not wrong under every model, only under those that respect real time."
  - title: B reads 1, then 0
    text: "B reads 1, then reads again and gets 0, as if time went backwards. This happens when consecutive reads hit different replicas, one up to date and one lagging. It violates monotonic reads, a guarantee users notice straight away."
  - title: Linearisable forbids both
    text: "Linearisability, also called strong consistency, makes the system behave like a single copy where every operation takes effect at one instant between its start and its end. Once the write completed, every later read must see 1. Both C's 0 and B's 1-then-0 are forbidden."
  - title: Weaker models allow more
    text: "Sequential consistency needs one order that every client agrees on, but not real time: C's 0 is fine, B going backwards is not. Causal only orders cause and effect, and forbids B too. Eventual only promises that replicas converge if writes stop, so both are allowed."
keyIdeas:
  - "**Linearisable** (strong): behaves like one copy; once a write completes, every later read sees it. Needs coordination on every operation."
  - "**Sequential:** one global order consistent with each client's own order, but it may lag behind real time."
  - "**Causal:** if A could have influenced B, everyone sees A before B; unrelated writes may appear in different orders. About the strongest model that stays available during a network partition."
  - "**Eventual:** if writes stop, replicas converge. No promise about any particular read."
  - "**Session guarantees** patch eventual consistency per user: read-your-writes, monotonic reads, monotonic writes, writes-follow-reads."
  - "**The cost of strong:** a round trip to a leader or majority per operation, and unavailability on the minority side of a partition (CAP)."
quiz:
  - q: "A write of x = 1 has been acknowledged. Later, a different client reads x and gets 0. Which models allow this?"
    options: ["Only linearisable", "Sequential, causal and eventual, but not linearisable", "None of them", "Only eventual"]
    answer: 1
    why: "Linearisability respects real time, so a read that starts after a completed write must see it. Sequential and causal do not tie order to the wall clock, and eventual promises nothing about individual reads."
  - q: "A user refreshes a page and sees a comment, refreshes again and it is gone, then it reappears. Which guarantee is violated?"
    options: ["Read-your-writes", "Monotonic reads", "Monotonic writes", "Durability"]
    answer: 1
    why: "Monotonic reads says that once you have seen a value, later reads never show an older state. Pinning a user's session to one replica is the usual fix."
  - q: "Alice posts 'Lunch?' and Bob, having read it, replies 'Yes'. Carol sees 'Yes' but not 'Lunch?'. Which is the weakest model that forbids this?"
    options: ["Eventual", "Causal", "Linearisable", "Read-your-writes"]
    answer: 1
    why: "Bob's reply causally depends on Alice's post because he read it first. Causal consistency requires everyone to see a cause before its effect. Eventual consistency allows the reply to show up first."
  - q: "Why do many systems default to eventual consistency for reads?"
    options: ["It is always correct", "Strong reads need a round trip to a leader or a quorum, costing latency and availability", "Eventual reads are more durable", "Strong consistency is impossible"]
    answer: 1
    why: "A linearisable read must confirm it has the latest value, which means talking to a leader or majority. A local replica read is faster and keeps working during partitions, at the price of possible staleness."
bigO:
  - { op: "Linearisable", avg: "single-copy, real time", note: "consensus or quorum per op; e.g. etcd, Spanner" }
  - { op: "Sequential", avg: "one agreed order", note: "e.g. ZooKeeper reads (stale but in order)" }
  - { op: "Causal", avg: "cause before effect", note: "can stay available during a partition" }
  - { op: "Eventual", avg: "converges if writes stop", note: "e.g. DNS, default DynamoDB reads" }
bigOTitle: "Strongest to weakest"
related: [sysdesign/cap-theorem, sysdesign/replication, sysdesign/quorum-n-r-w, sysdesign/geo-replication]
prereqs: [sysdesign/replication]
flashcards:
  - kind: qa
    q: "Define linearisability in one sentence."
    a: "Every operation appears to take effect atomically at a single instant between its start and its end, so the system behaves like one up-to-date copy that respects real-time order."
  - kind: cloze
    text: "Sequential consistency requires a single order consistent with {{each client's program order}}, but unlike linearisability it ignores {{real time}}."
  - kind: qa
    q: "Name the four session guarantees."
    a: "Read-your-writes, monotonic reads, monotonic writes, and writes-follow-reads."
  - kind: qa
    q: "Is linearisability the same as serializability?"
    a: "No. Linearisability is a recency guarantee about single operations on single objects; serializability is about transactions over many objects appearing in some serial order. Both together is strict serializability."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Consistency patterns, background" }
---

## What a consistency model is

When data is replicated, the replicas are never all updated at the same instant. A **consistency model** is the contract between the storage system and its users that says *which values a read is allowed to return*, given the writes that happened. Stronger models allow fewer surprising results and are easier to program against; weaker models allow more anomalies but are faster and stay available when the network misbehaves.

Note the two different meanings of "consistency": the C in ACID (application invariants hold) is not this. Here it means agreement between replicas.

## The models, strongest first

**Linearisability** (strong consistency, atomic consistency). Every operation appears to happen atomically at some single point between its invocation and its response. Consequences: once a write has completed, every read that *starts* afterwards returns that value or a newer one; and once any read has returned the new value, no later read may return the old one. The system looks like one copy. It is a property of single objects (one key, one register).

**Sequential consistency.** The result is as if all operations ran in *some* single total order, and each client's operations appear in that order in the order the client issued them. Everyone agrees on the same order, but the order need not match real time: a read may return a value that, by the wall clock, has already been overwritten, as long as the client never sees time run backwards and all clients see the same history.

**Causal consistency.** Only operations that are **causally related** must be seen in the same order by everyone. B depends on A if the same client did A before B, or B read a value written by A, or a chain of these. Concurrent, unrelated writes may be seen in different orders by different clients. Causal consistency can be provided while staying available during a network partition, which makes it about the strongest model that can.

**Eventual consistency.** If no new writes arrive, all replicas eventually return the same value. It says nothing about what you read in the meantime: stale values, values going backwards, effects before causes are all allowed.

### Session guarantees

These are per-client promises layered on weak models, cheap to provide with sticky routing or version tracking:

| Guarantee | Promise | Typical fix |
|---|---|---|
| **Read-your-writes** | you see your own writes | read from the leader, or from a replica past your last write |
| **Monotonic reads** | you never see older data after newer | pin the session to one replica |
| **Monotonic writes** | your writes apply in the order you issued them | route a session's writes through one place |
| **Writes-follow-reads** | a write you make after reading X is ordered after X | carry the read's version with the write |

## Worked example

`x = 0`. A writes `x = 1` during [t1, t4]. Then:

| Observation | Linearisable | Sequential | Causal | Eventual |
|---|---|---|---|---|
| C reads 0 during [t5, t6], after the write completed | no | yes | yes | yes |
| B reads 1 during [t5, t6], then 0 during [t7, t9] | no | no | no | yes |
| C reads 0 during [t2, t3], *while* the write is in flight | yes | yes | yes | yes |

The last row matters: an operation concurrent with the write may return either value even under linearisability; real-time order constrains only operations that do not overlap.

Why is B's 1-then-0 forbidden under sequential and causal? Under sequential, B's two reads must keep their order, so B's first read comes after the write, and so does its second, which therefore must return 1. Under causal, reading 1 puts the write into B's causal past, and a read may not return a value that something in its causal past has overwritten.

## Implement it in Python

The idea is language-independent; here it is in Python.

A brute-force checker for a single register: is there an order of the operations that explains every read?

```python
from itertools import permutations

# one register x, initially 0. Each op: (client, kind, value, start, end)
W  = ("A", "w", 1, 1, 4)      # A writes x = 1, finishing at t = 4
B1 = ("B", "r", 1, 5, 6)      # B reads 1
B2 = ("B", "r", 0, 7, 9)      # B then reads 0
C1 = ("C", "r", 0, 5, 6)      # C reads 0 after the write finished

def legal(order):
    x = 0
    for _, kind, v, _, _ in order:
        if kind == "w":
            x = v
        elif v != x:
            return False                     # a read must return the latest write
    return True

def respects(order, real_time):
    pos = {op: i for i, op in enumerate(order)}
    for a in order:
        for b in order:
            if pos[a] > pos[b] and a[0] == b[0] and a[3] < b[3]:
                return False                 # broke one client's program order
            if pos[a] > pos[b] and real_time and a[4] < b[3]:
                return False                 # a finished before b started
    return True

def allowed(history, real_time):
    return any(legal(p) and respects(p, real_time) for p in permutations(history))

for name, h in [("C reads 0", [W, C1]), ("B reads 1 then 0", [W, B1, B2])]:
    print(f"{name:17} linearisable={allowed(h, True)}  sequential={allowed(h, False)}")
# C reads 0         linearisable=False  sequential=True
# B reads 1 then 0  linearisable=False  sequential=False
```

Real checkers such as Jepsen's Knossos do the same search, far more cleverly, over histories recorded from a live cluster.

## The cost of strong consistency

- **Latency.** A linearisable operation must make sure no newer value exists anywhere, which takes a round trip to a leader that holds a valid lease or to a majority of replicas. Within one datacentre that is about a millisecond; across continents it is 100 ms or more, for every write and every strong read.
- **Availability.** By the CAP theorem, during a network partition the replicas on the minority side must refuse requests rather than return possibly stale data.
- **Throughput.** Everything funnels through a leader or consensus group.

Real systems therefore mix models: ZooKeeper makes writes linearisable but serves reads from any server (sequentially consistent, possibly stale) unless the client calls `sync`. DynamoDB reads are eventually consistent by default; a strongly consistent read costs twice the read capacity. Google Spanner offers linearisable transactions worldwide by waiting out clock uncertainty (commit wait, a few milliseconds) on every commit.

## Edge cases and pitfalls

- **Linearisable is not serializable.** Serializability is about multi-object transactions appearing in some serial order; it says nothing about real time. Strict serializability is both.
- **"Strongly consistent" is used loosely.** In interviews and docs it sometimes means linearisable and sometimes just "read-your-writes". Ask or define it.
- **Quorums are not automatically linearisable.** R + W > N alone can still let one reader see a new value and a later reader the old one while a write is in flight. Closing that gap needs readers to write back what they return before returning (synchronous read repair), and last-write-wins clocks can still break it.

## In the interview

Expect *"what consistency does this feature need?"* Answer per feature: a bank balance check or a unique-username claim needs linearisability; a social feed needs causal at most (replies after posts); like-counts can be eventual; and almost every user-facing flow needs read-your-writes. Showing that you choose per use case, and know the latency price of strong consistency, is the strong answer.
