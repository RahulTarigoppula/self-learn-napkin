---
title: Distributed Locks
track: sysdesign
tags: [locks, concurrency, consensus, distributed]
difficulty: 3
minutes: 6
tldr: "A distributed lock is a lease that expires, so a paused holder can lose it unawares. Fencing tokens make it safe: the storage rejects writes carrying an older, lower token."
analogy: "A hotel key card that expires at noon. If you nap past noon, the room is given to someone else with a newer card. A good door lock reads the card number and refuses yours, even though you still feel like the guest."
diagram: distributed-locks
story:
  - title: Two clients, one lock, one storage
    text: "Two worker machines must never write the same report at once. On one machine a mutex would do; across machines we need a lock service that both ask. Read the timeline left to right: the lock service, client 1, client 2 and the storage they write to."
  - title: Client 1 gets a 10 s lease, token 33
    text: "Client 1 asks for the lock. Because a holder might crash and never release it, the lock is a lease: it expires by itself after 10 seconds unless renewed. The service also hands out token 33, a number that grows by one with every grant."
  - title: A GC pause outlives the lease
    text: "Client 1's process freezes for 15 seconds: a stop-the-world garbage collection, a VM migration or a swapped-out page. It cannot renew. At 10 s the lease expires, but client 1 has no idea; from its point of view no time has passed."
  - title: Client 2 gets token 34 and writes
    text: "At 11 s client 2 asks, the lock is free, and it is granted with token 34. Client 2 writes the report and sends its token along. The storage accepts the write and remembers 34 as the highest token it has seen."
  - title: Client 1 wakes; its token 33 is rejected
    text: "Client 1 wakes up still believing it holds the lock and writes with token 33. Without a check, its stale write would overwrite client 2's work. With fencing, the storage sees 33 < 34 and rejects it. The lock gives efficiency; the token gives safety."
keyIdeas:
  - "Distributed locks are **leases**: they must expire, or a crashed holder blocks everyone forever. Expiry means a slow holder can lose the lock **without noticing**."
  - "Pauses (GC, VM stalls, network delays) longer than the lease are real, so **checking the lock before writing is not enough**."
  - "**Fencing tokens**: the lock service issues a monotonically increasing number with each grant, and the protected resource rejects any token lower than the highest it has seen."
  - "Use a **consensus-backed** lock service (ZooKeeper, etcd) when correctness depends on the lock. A single Redis node is fine for avoiding duplicate work, not for safety."
  - "Often you need no lock at all: **compare-and-set**, unique constraints, idempotency keys or one writer per partition."
quiz:
  - q: "Client A holds a lock with a 30 s lease. It pauses for 45 s, wakes up and writes. What prevents corrupting B's newer write?"
    options: ["A longer lease, say 60 s", "A's own clock check before writing", "A fencing token: the storage rejects A's token because B's higher token was already seen", "Releasing the lock in a finally block"]
    answer: 2
    why: "Any lease length can be exceeded by some pause, and A cannot detect a pause from the inside. Only the resource, which saw B's newer token, can reliably refuse A's stale write."
  - q: "What makes ZooKeeper or etcd better than a single Redis node for a correctness-critical lock?"
    options: ["They are faster", "They replicate the lock state through consensus, so a single node failure does not lose or duplicate the lock, and they expose ever-increasing revision numbers usable as fencing tokens", "They never use leases", "They store locks on disk only"]
    answer: 1
    why: "A lone Redis node is a single point of failure, and with asynchronous replication a failover can lose a granted lock so two clients hold it. Consensus systems commit the grant on a majority and give monotonic version numbers."
  - q: "You want each order to be charged at most once even if the 'charge' job runs on two machines. What is the simplest safe option?"
    options: ["A Redis lock around the job", "An idempotency key: the payment provider or a unique constraint on order_id rejects the second charge", "Make the lease 10 minutes long", "Run the job less often"]
    answer: 1
    why: "If the operation itself refuses duplicates (unique key, conditional write, idempotency key), you need no distributed lock at all, and there is no lease that can expire at the wrong moment."
bigO:
  - { op: "lease TTL", avg: "≈ 10–30 s", note: "shorter = faster recovery, more risk of losing it during a pause" }
  - { op: "acquire (consensus)", avg: "1 quorum write", note: "a few ms within one datacentre" }
  - { op: "Redis SET NX PX", avg: "1 round trip", note: "well under 1 ms; no consensus, no fencing" }
  - { op: "Redlock", avg: "majority of 5 nodes", note: "relies on bounded clock drift and pauses" }
bigOTitle: "Key numbers"
related: [sysdesign/raft-leader-election, sysdesign/idempotency, sysdesign/acid-and-isolation, sysdesign/replication]
prereqs: [sysdesign/acid-and-isolation]
flashcards:
  - kind: qa
    q: "Why can a lease-based lock be held by two clients at once?"
    a: "The first holder can pause (GC, VM stall) past its lease. The lease expires, a second client acquires it, and the first wakes up still believing it is the holder."
  - kind: cloze
    text: "A {{fencing token}} is a number that {{increases with every lock grant}}; the storage rejects writes carrying a token lower than the highest it has seen."
  - kind: qa
    q: "Name three ways to avoid needing a distributed lock."
    a: "A conditional write / compare-and-set on a version number, a unique constraint or idempotency key, or routing all work for a key to a single owner (one partition, one consumer)."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## What a distributed lock is for

On one machine, a **mutex** guarantees that only one thread is inside a critical section; the operating system knows exactly which thread holds it and frees it if that thread dies. Across machines nobody has that view. A **distributed lock** is an agreement, kept by some shared service, that only one process may do a certain thing at a time: run tonight's billing job, write a particular file, act as leader for a partition.

Locks are used for two quite different reasons, and the difference decides how careful you must be:

- **Efficiency:** avoid doing the same work twice. If the lock occasionally fails, something runs twice and you waste some compute. A simple lock is fine.
- **Correctness:** two holders at once would corrupt data, lose money or double-send. Here the lock must be *safe*, and as we will see a lock alone cannot be.

## How it works: leases

A process that holds a lock can crash, so a lock that lasts until it is released could be held forever. Every practical distributed lock is therefore a **lease**: the grant comes with a **TTL** (time to live) and expires unless the holder renews it, usually with a heartbeat every third of the TTL.

1. Client asks the lock service for lock `report`. If it is free, the service records "held by client 1, expires at now + 10 s" and replies.
2. The client does its work and renews while it is busy.
3. It releases the lock when done, or the lease simply expires if the client died.

The flaw: expiry is decided by the lock service's clock, but the client only *believes* it still holds the lock. A process can stop for longer than the lease without noticing. Stop-the-world garbage collection pauses of several seconds happen, as do virtual-machine live migrations, page faults on swapped memory, and network packets that arrive long after they were sent. Checking "do I still hold the lock?" right before writing does not help, because the pause can happen between the check and the write.

## Worked example: the expired lease

| Time | Lock service | Client 1 | Client 2 | Storage |
|---|---|---|---|---|
| 0 s | grants lease to C1, token **33**, TTL 10 s | holds lock | | |
| 1 s | | GC pause starts | | |
| 10 s | lease expires | (frozen) | | |
| 11 s | grants lease to C2, token **34** | (frozen) | holds lock | |
| 12 s | | (frozen) | writes with 34 | accepts; max token = 34 |
| 16 s | | wakes, believes it holds the lock | | |
| 17 s | | writes with 33 | | **rejects: 33 < 34** |

Without the last column's check, client 1's write at 17 s would silently overwrite client 2's newer report.

## Fencing tokens

The fix is to let the **resource** enforce the order, because it is the only party that sees both writes. Each time the lock service grants the lock it returns a **fencing token**: a number that only ever increases. The client sends that token with every write. The storage remembers the highest token it has accepted and rejects any write with a lower one. Writes with an equal token are fine; the same holder may write many times.

This requires two things: the lock service must produce strictly increasing tokens even across its own failures, and the resource must be able to check them atomically, for example with a conditional `UPDATE ... WHERE token <= :t` in a database. If the resource is a third-party API that cannot check tokens, you cannot make the lock fully safe; prefer idempotency there.

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation. `lock_service` stands for any lease-based lock client (ZooKeeper, etcd, …).

```python sketch
# Client: hold a lease, pass its token with every write.
lease = lock_service.acquire("report", ttl_s=10)        # e.g. lease.token == 34
try:
    storage.write("report", build_report(), token=lease.token)
finally:
    lock_service.release(lease)                          # only if still ours

# Storage: reject writes from older holders (check and set atomically).
def write(key, value, token):
    with local_mutex(key):
        if token < max_token.get(key, 0):
            raise StaleTokenError(token, max_token[key])
        max_token[key] = token
        data[key] = value
```

## Lock services

- **ZooKeeper:** each client creates an *ephemeral sequential* node under `/locks/report`; the lowest sequence number holds the lock, and each waiter watches only the node just ahead of it, so a release wakes one client rather than all of them. Ephemeral nodes vanish when the client's session times out. The node's transaction id (`zxid`) increases monotonically and can serve as a fencing token.
- **etcd:** a key is attached to a **lease** with a TTL that the client keeps alive; a lock is the key with the lowest creation **revision**, and revisions only increase, so again they work as fencing tokens.

Both replicate every grant through a consensus protocol (ZooKeeper's Zab, etcd's Raft), so the lock survives the failure of a minority of servers and is never granted twice by two sides of a partition.

### Redis

The popular single-node recipe is `SET lock:report <random-value> NX PX 10000`: set only if absent, expire after 10 000 ms. Release with a small Lua script that deletes the key only if it still holds *your* random value, so you never delete a lock someone else acquired after yours expired. Caveats:

- One node is a single point of failure. With a replica, replication is asynchronous: the primary can grant the lock, crash before replicating it, and the promoted replica grants it to someone else.
- There is no fencing token built in.
- **Redlock** acquires the lock on a majority of 5 independent Redis nodes, but its safety depends on bounded clock drift and pause lengths, and Martin Kleppmann's well-known critique shows how pauses still break it. Treat Redis locks as **efficiency locks**.

## When you do not need a lock

Many "we need a distributed lock" problems disappear with an operation that is atomic where the data lives:

- **Compare-and-set:** `UPDATE accounts SET balance = 90, version = 8 WHERE id = 1 AND version = 7`. If someone else changed the row first, zero rows update and you retry.
- **Unique constraints and idempotency keys:** insert `charge(order_id)` with a unique index, so the second attempt fails harmlessly.
- **Single writer by design:** route all work for a key to one partition and one consumer (a Kafka partition, a sharded queue), so there is never contention.
- **Database row locks** (`SELECT ... FOR UPDATE`) when everything involved lives in the same database.

## Edge cases and pitfalls

- **Releasing someone else's lock:** a plain `DEL` after your lease expired removes the next holder's lock. Always compare the owner value first.
- **Clock assumptions:** leases depend on time passing at roughly the same rate everywhere. A jump in the wall clock on the lock server can expire leases early; use monotonic clocks for durations.
- **Lease too short** causes false expiry under load; **too long** delays recovery after a real crash. 10 to 30 seconds with renewal is common.

## In the interview

Typical prompts: *"make sure only one instance runs the cron job"* or *"two workers must not process the same file"*. A strong answer first asks whether the lock is for efficiency or correctness, proposes avoiding it (idempotency, conditional writes, partitioning), and if a lock is needed uses ZooKeeper or etcd with leases plus fencing tokens checked by the resource. Expect the follow-up *"what if the holder pauses longer than the lease?"* and answer with the timeline above.
