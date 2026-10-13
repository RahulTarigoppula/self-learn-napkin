---
title: CAP Theorem
track: sysdesign
tags: [distributed, consistency, availability, replication]
difficulty: 2
minutes: 4
tldr: "When the network splits replicas apart, each one must either refuse requests (consistent) or answer with possibly stale data (available). You cannot have both during a partition."
analogy: "Two bank branches lose their phone line. A customer asks the second branch for a balance. It can say 'come back later' (correct but unhelpful) or read out yesterday's figure (helpful but maybe wrong)."
diagram: cap-theorem
story:
  - title: Two replicas, one value
    text: "A key x is stored on two replicas, A and B, possibly in different datacentres. Every write to one is copied to the other, so both say x = 1. While the network works, every reader sees the same value."
  - title: A write, then the network splits
    text: "A client writes x = 2 to A. Before A can copy it to B, the link between them breaks: a network partition. A now holds x = 2, B still holds x = 1, and neither can tell whether the other is down or only unreachable."
  - title: A reader asks B
    text: "Another client reads x from B. B has no way to check with A. It must decide now, and only two answers are possible. This forced choice is the whole theorem."
  - title: "Choose consistency: refuse"
    text: "A CP system has B return an error or time out rather than risk a stale answer. Every successful read is up to date, but the system is unavailable to clients that can only reach B until the partition heals. Coordination stores such as etcd and ZooKeeper choose this."
  - title: "Choose availability: answer stale"
    text: "An AP system has B answer x = 1. The client gets a reply, but an old one. When the link heals, the replicas reconcile, for example last-write-wins or merging versions. Shopping carts and social feeds often prefer this."
  - title: "PACELC: the rest of the time"
    text: "Partitions are rare, so CAP alone says little about normal days. PACELC adds: Else, with no partition, you still trade Latency against Consistency, because waiting for a remote replica to confirm every write makes each request slower."
keyIdeas:
  - "**C** = every read sees the latest write, as if there were one copy. **A** = every request to a live node gets a non-error answer."
  - "**P is not optional**, because networks drop packets. The real choice is CP or AP *during* a partition."
  - "**PACELC**: if Partitioned, A or C; Else, Latency or Consistency."
  - "**AP needs conflict resolution**: last-write-wins (simple, loses updates), version vectors, or CRDTs."
  - "Choose **per feature**, not per company: a like count can be stale, a payment cannot."
quiz:
  - q: "During a partition, a replica that cannot reach the others returns an error for every read. Which property did it give up?"
    options: ["Consistency", "Availability", "Partition tolerance", "Durability"]
    answer: 1
    why: "Refusing to answer keeps every successful read correct (consistency) but means a live node is not giving non-error responses, which is exactly what availability promises."
  - q: "Why is 'we picked CA' not a sensible design for a system spread across datacentres?"
    options: ["CA systems are too slow, since every write needs all replicas", "Network partitions will happen, so you must decide what to do then", "CA only works with exactly three replicas, which costs too much", "Consistency and availability cannot coexist even without partitions"]
    answer: 1
    why: "A CA system assumes the network never partitions. Across machines and datacentres that is false, so the design must still choose between refusing and serving stale data when it happens."
  - q: "No partition is happening, but writes still wait for a replica in another region before returning. Which part of PACELC describes this cost?"
    options: ["P → A: staying available during a partition", "P → C: staying consistent during a partition", "E → L vs C: paying latency for consistency", "Not a trade-off: it is just network overhead"]
    answer: 2
    why: "Else (no partition) you trade latency against consistency. Waiting for the remote replica keeps reads consistent but adds a cross-region round trip, often tens of milliseconds or more, to every write."
related: [sysdesign/consistency-models, sysdesign/quorum-n-r-w, sysdesign/raft-leader-election, sysdesign/geo-replication]
prereqs: [sysdesign/replication]
flashcards:
  - kind: qa
    q: "Why is 'pick two of C, A and P' a misleading summary of CAP?"
    a: "Partitions are not optional in a real network. The real choice is what to do during a partition: stay consistent (refuse some requests) or stay available (serve possibly stale data)."
  - kind: cloze
    text: "PACELC: if Partitioned, choose {{Availability or Consistency}}; Else, choose {{Latency or Consistency}}."
  - kind: qa
    q: "Is the C in CAP the same as the C in ACID?"
    a: "No. CAP's C is linearisability: every read sees the latest write. ACID's C means a transaction keeps the database's invariants and constraints valid."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "CAP theorem section, redrawn" }
---

## The three letters, precisely

The CAP theorem (conjectured by Eric Brewer in 2000, proved by Gilbert and Lynch in 2002) is about a data store **replicated** across machines that talk over a network.

- **Consistency (C)** here means **linearisability**: the system behaves as if there were a single copy of the data. Once a write completes, every later read, from any client and any replica, returns that value or a newer one.
- **Availability (A)** means every request received by a replica that has not crashed gets a **non-error response** eventually, and is not told to go and try another replica.
- **Partition tolerance (P)** means the system keeps operating even when the network drops or delays messages between replicas, splitting them into groups that cannot talk to each other (a **partition**).

The theorem: when a partition happens, a system cannot provide both C and A.

## Why it is true

Take two replicas, A and B, with the link between them cut. A client writes `x = 2` to A. Another client then reads `x` from B.

- If B **answers**, it can only answer what it has: `x = 1`. The read misses a completed write, so consistency is broken.
- If B **waits** for A or **refuses**, the reader gets no answer, so availability is broken.

There is no third option: B cannot learn about the write without the network. That is the entire proof.

## Worked example: a shopping site

| Data | During a partition | Choice |
|---|---|---|
| Shopping cart | Let users keep adding items; merge both sides' carts later | AP |
| Product reviews, like counts | Show slightly old numbers | AP |
| Inventory at checkout, payments | Refuse rather than sell the last item twice | CP |
| Usernames (must be unique) | Refuse new registrations on the minority side | CP |

One application usually contains both kinds of data. So don't ask "is our company CP or AP?" Ask "which operations can tolerate stale answers?"

## How real systems behave

- **CP:** leader-based stores that need a majority to make progress (etcd, ZooKeeper, Consul), and databases configured for synchronous replication. Replicas cut off from the majority refuse writes (and often reads).
- **AP:** Dynamo-style stores such as Cassandra and Riak with low consistency levels keep accepting reads and writes on both sides and reconcile later.
- Many systems are **tunable**: in a quorum store, requiring R + W > N acknowledgements leans towards C; requiring only one replica leans towards A.

## PACELC

CAP only describes behaviour during a partition, which is rare. Daniel Abadi's **PACELC** fills in the rest: if there is a **P**artition, choose **A** or **C**; **E**lse, choose **L**atency or **C**onsistency. Even on a healthy network, a strongly consistent write must wait for other replicas, possibly in another region 50–150 ms away. Systems that answer from the nearest replica are fast but may return stale data. So most systems are described as PA/EL (available and fast, e.g. default Cassandra) or PC/EC (consistent always, e.g. a synchronous leader-based store).

## Sketch it

What a CP replica does on a read, as pseudocode:

```text
on read(key):
    if not in_contact_with_majority():
        return Error("unavailable: partitioned")   # CP: refuse
    return read_latest_committed(key)

# The AP version skips the check:
on read(key):
    return local_value(key)                         # maybe stale
```

## Edge cases and pitfalls

- **CAP's C is not ACID's C.** ACID consistency means a transaction keeps constraints valid; CAP consistency means reads see the latest write.
- **Availability in CAP is strict:** a system that answers on the majority side but refuses on the minority side is CP, even if most users see no outage.
- **Latency is a partial partition.** A replica that responds in 30 s is, in practice, unreachable; timeouts force the same C-or-A decision.
- **AP must merge.** Last-write-wins needs clocks and silently drops one of two concurrent updates; version vectors detect conflicts; CRDTs (data types designed to merge automatically) resolve them for counters, sets and similar structures.

## In the interview

Do not recite "pick two". Say: partitions will happen, so for each piece of data decide whether you would rather **refuse** or **serve stale**, and justify it with the business cost of each failure. Then mention PACELC to show you know the everyday trade-off is latency vs consistency. Expect the follow-ups "how does the AP side reconcile?" (last-write-wins, version vectors or CRDTs) and "how does a CP system decide who may write?" (a majority quorum or an elected leader).
