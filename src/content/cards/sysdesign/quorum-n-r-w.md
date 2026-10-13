---
title: Quorum (N, R, W)
track: sysdesign
tags: [replication, consistency, distributed]
difficulty: 2
minutes: 4
tldr: "Keep N copies; a write succeeds after W acks and a read asks R replicas. If R + W > N, every read set overlaps the latest write set, so the newest version is always among the replies."
analogy: "Three notebooks hold the same shopping list. Update any two, and later check any two: at least one you check is one you updated, so you always spot the newest list by its date."
diagram: quorum-nrw
story:
  - title: N = 3 replicas of one key
    text: "The key cart:42 is stored on N = 3 replicas, R1 to R3, all holding version v1. Copies survive a dead machine, but now a write must reach several places, and some may be slow or down."
  - title: Write with W = 2
    text: "A writer sends v2 to all three replicas but waits only for W = 2 acknowledgements. R1 and R2 ack and the write is reported as successful. R3 is slow and still holds v1. Waiting for 2 of 3 instead of all 3 keeps writes working with one replica down."
  - title: Read with R = 2
    text: "A reader asks R = 2 replicas. In the worst case it picks the two we least want: R2 and R3. It receives two different answers, v2 and v1. Which one is true?"
  - title: R + W > N, so the sets overlap
    text: "Here R + W = 4 > 3. Any 2 replicas you read and any 2 that took the write must share at least one replica, here R2. So the newest value is always in the replies; the reader keeps the highest version, v2, and can repair R3 in the background."
  - title: R + W ≤ N, so stale reads are possible
    text: "Drop to R = 1 and W = 1. Now 1 + 1 ≤ 3, so the single replica that took the write and the single replica you read can be different ones. A reader that asks only R3 gets v1 and has no way to know it is stale."
keyIdeas:
  - "**The overlap rule**: if R + W > N, a read set and a write set cannot be disjoint (pigeonhole), so the newest version is in every read."
  - "**Majority quorum** = ⌊N/2⌋ + 1 (2 of 3, 3 of 5); with it on both sides you tolerate ⌊(N − 1)/2⌋ dead replicas."
  - "Replies can disagree, so values carry **versions**; the reader keeps the newest and can **read-repair** the stale replicas."
  - "Tune the dial: big W + small R for fast reads, small W + big R for fast writes, R = W = 1 for speed with only eventual consistency."
  - "When home replicas are down, some stores accept writes on stand-in nodes (a **sloppy quorum**); until those writes are handed back, R + W > N no longer guarantees overlap."
quiz:
  - q: "N = 5. Which setting guarantees that every read sees the latest successful write?"
    options: ["R = 2, W = 2", "R = 2, W = 3", "R = 3, W = 3", "R = 1, W = 4"]
    answer: 2
    why: "Only R = 3, W = 3 gives R + W = 6 > 5. The others sum to 4 or 5, which is not greater than N, so a read set can miss every replica that took the write."
  - q: "N = 3, W = 3, R = 1. One replica crashes. What happens?"
    options: ["Reads and writes both keep working", "Reads work, writes fail", "Writes work, reads fail", "Both fail"]
    answer: 1
    why: "Writes need acknowledgements from all 3 replicas, so they cannot succeed with one down. Reads need only 1 replica, and 2 are still alive."
  - q: "With R + W > N, a reader gets back v7 from one replica and v6 from another. Why can it trust v7?"
    options: ["The first reply is always newest", "The overlap guarantees the latest version is among the replies, and versions tell it which reply is newest", "Majority vote: more replicas said v7", "Replicas never disagree when R + W > N"]
    answer: 1
    why: "The overlap only promises that at least one reply holds the latest write. It says nothing about most of them. The version number (or timestamp) identifies which reply that is."
bigO:
  - { op: "N=3, W=2, R=2", avg: "balanced", note: "reads and writes both survive 1 dead replica" }
  - { op: "N=3, W=3, R=1", avg: "fast reads", note: "any dead replica blocks writes" }
  - { op: "N=3, W=1, R=3", avg: "fast writes", note: "any dead replica blocks reads" }
  - { op: "N=3, W=1, R=1", avg: "fastest", note: "R + W ≤ N: eventual consistency only" }
bigOTitle: "Common settings"
related: [sysdesign/read-repair, sysdesign/consistency-models, sysdesign/cap-theorem, sysdesign/consistent-hashing]
prereqs: [sysdesign/replication]
griddle: quorum
flashcards:
  - kind: qa
    q: "With N = 5 replicas, give R and W that guarantee a read sees the latest write while tolerating 2 failures."
    a: "R = 3 and W = 3: 3 + 3 = 6 > 5 so the sets overlap, and 3 of 5 are still reachable with 2 nodes down."
  - kind: cloze
    text: "Strong reads need {{R + W > N}}; making any two write sets overlap, so conflicting writes meet on some replica, needs {{W > N/2}}."
  - kind: qa
    q: "Why does a quorum reader need version numbers, not just the values?"
    a: "The overlap only guarantees that the newest value is among the replies, not which reply it is. Versions or timestamps tell the reader which one to keep."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

To survive machine failures, a data store keeps **N copies** (replicas) of every key on different machines. Now every write has to update several machines, and some of them will be slow or down at any moment. Waiting for all N makes every write as slow as the slowest replica and blocks writes entirely when one is dead. Waiting for just one is fast, but then a later read may land on a replica that never got the update.

**Quorums** are the dial between these extremes, used by Dynamo-style stores such as Cassandra and Riak.

## How it works

- **N** is the replication factor: how many replicas store each key.
- **W** is the write quorum: a write is reported successful once **W** replicas acknowledge it. It is still sent to all N; the rest catch up later.
- **R** is the read quorum: a read asks replicas and waits for **R** replies, then returns the one with the **highest version**.

Every stored value carries a **version** (a counter, a timestamp, or a version vector) so the reader can tell which of several replies is newest. A **version vector** keeps one counter per replica; if neither of two vectors is ≥ the other in every slot, the writes were concurrent and must be merged rather than one simply winning.

### Why R + W > N works

The W replicas that acknowledged the latest write and the R replicas that answer a read are both subsets of the same N. If R + W > N, the two subsets together are bigger than the whole set, so they **must share at least one replica**. That's the pigeonhole principle. That shared replica holds the latest write, so the newest version is always among the R replies. If R + W ≤ N, the two subsets can be completely disjoint, and the reader can see only old copies without any way to know.

## Worked example

N = 3, W = 2, R = 2, key `cart:42` at version v1 everywhere.

| Step | R1 | R2 | R3 | Result |
|---|---|---|---|---|
| Start | v1 | v1 | v1 | all in sync |
| Write v2, W = 2 | v2 ✓ | v2 ✓ | (slow) v1 | 2 acks → success |
| Read, R = 2, asks R2 + R3 | (not asked) | v2 | v1 | newest = **v2** |
| Read repair | (no change) | (no change) | v2 | R3 fixed |

Try every pair the reader could pick: {R1, R2}, {R1, R3}, {R2, R3}. Each contains R1 or R2, so each contains v2. Now set R = W = 1: the write lands only on R1, the read asks only R3, and the reader returns v1 with no error. That's a **stale read**.

## Sketch it

The idea is language-independent; here is the coordinator's logic as a Python-flavoured sketch (`replicas_for` and `next_version` stand in for your cluster's placement and versioning).

```python
def write(key, value, W):
    version = next_version(key)                   # e.g. a timestamp
    acks = 0
    for r in replicas_for(key):                   # send to all N
        if r.put(key, value, version, timeout=0.1):
            acks += 1
    if acks < W:
        raise Unavailable(f"only {acks} of {W} acks")
    # replicas that missed it are fixed later by hand-off or repair

def read(key, R):
    replies = [r.get(key, timeout=0.1) for r in replicas_for(key)]
    replies = [x for x in replies if x is not None]
    if len(replies) < R:
        raise Unavailable(f"only {len(replies)} of {R} replies")
    newest = max(replies[:R], key=lambda x: x.version)
    for stale in (x for x in replies[:R] if x.version < newest.version):
        stale.replica.put(key, newest.value, newest.version)  # read repair
    return newest.value
```

## Edge cases and pitfalls

- **R + W > N is not full linearisability.** A write that failed (fewer than W acks) may still sit on one replica and be returned by a later read; concurrent writes need a tie-break such as last-write-wins or version vectors.
- **Sloppy quorums and hinted hand-off:** when home replicas are down, some stores accept writes on stand-in nodes and hand them back later. Writes stay available, but the overlap guarantee does not hold until the hand-off completes.
- **Clocks:** timestamp versions depend on synchronised clocks; skew can make an older write look newer.
- **Failure maths:** reads survive N − R dead replicas, writes survive N − W. With N = 3, R = W = 2 you tolerate one failure on both paths.

## Trade-offs

| Setting (N = 3) | Read cost | Write cost | Consistency |
|---|---|---|---|
| R = 2, W = 2 | 2 replies | 2 acks | Overlap holds |
| R = 1, W = 3 | 1 reply | all 3 acks | Overlap holds; writes block on any failure |
| R = 3, W = 1 | all 3 replies | 1 ack | Overlap holds; reads block on any failure |
| R = 1, W = 1 | 1 reply | 1 ack | Eventual only |

## In the interview

Usually: "how do you make reads see the latest write in a leaderless store?" State **R + W > N** and explain the overlap in one sentence, then say why versions are needed to pick the newest reply, and mention read repair. Expect the follow-ups "N = 5, how many failures can you survive?" (2, with R = W = 3) and "is that linearisable?" (not strictly: sloppy quorums, failed writes and concurrent writes are the gaps).
