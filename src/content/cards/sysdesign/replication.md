---
title: Replication
track: sysdesign
tags: [replication, databases, availability, distributed]
difficulty: 2
minutes: 5
tldr: "Keep copies of the same data on several machines. One leader takes writes and streams them to followers; you choose sync (safe, slow) or async (fast, can lag or lose writes) and plan for failover."
analogy: "A head chef writes each new recipe in the master book and assistants copy it into their own. Copy as you go and the kitchen slows down; copy later and an assistant may cook yesterday's version."
diagram: replication
story:
  - title: One leader, two followers
    text: "Replication keeps the same data on several machines so it survives a crash and so reads can be spread out. In leader-follower replication one node, the leader, accepts all writes. Two followers, F1 and F2, hold copies. Right now every copy says x = 5."
  - title: Writes go to the leader
    text: "A client writes x = 7. Only the leader may accept it. The leader appends the change to its replication log, an ordered list of every change, and applies it locally. Followers will replay the same log in the same order, so they end up with the same data."
  - title: Sync follower acks; async one lags
    text: "F1 is synchronous: the leader waits for F1 to confirm before telling the client 'OK', so the write exists on two machines. F2 is asynchronous: the leader sends the change but does not wait. F2 is usually milliseconds behind, but under load it can lag by seconds or more."
  - title: Reading from a lagging follower
    text: "Reads are often sent to followers to share the load. The same client now reads x from F2, which has not applied the write yet, and gets 5. The user just saved 7 and sees 5: a violation of read-your-writes, caused purely by replication lag."
  - title: "Failover: promote a follower"
    text: "The leader crashes. After a heartbeat timeout, the system promotes a follower to be the new leader and points clients at it. Promoting F1 is safe because, as the synchronous follower, it has every acknowledged write. Promoting F2 would silently lose x = 7."
  - title: "Split brain: the old leader comes back"
    text: "The old leader was only cut off, not dead. It returns still believing it leads and accepts writes, so two leaders diverge: split brain. The fix is a fencing epoch, a number that rises with every election. Nodes and storage reject anything stamped with the old epoch 1."
keyIdeas:
  - "**Leader-follower:** one node takes writes and ships an ordered log; followers replay it and can serve reads."
  - "**Synchronous** replication means no acknowledged write is lost if the leader dies, but every write waits for a follower. **Asynchronous** is fast and keeps writing when followers are down, but lags and can lose recent writes."
  - "**Replication lag** breaks read-your-writes and monotonic reads; fix it by routing such reads to the leader or to a follower that has caught up."
  - "**Failover** is promoting a follower. Pick the most up-to-date one, and fence the old leader with an **epoch** so it cannot cause split brain."
  - "**Multi-leader** (a leader per region) and **leaderless** (quorum reads and writes) trade simpler failover for write conflicts you must resolve."
quiz:
  - q: "A user updates their profile and immediately reloads, and the page shows the old data. Most likely cause?"
    options: ["The write failed", "The read went to an asynchronous follower that has not applied the write yet", "The leader lost the write", "The cache is too large"]
    answer: 1
    why: "The write succeeded on the leader, but reads are served by followers that lag behind. Route a user's reads to the leader for a short time after they write, or to a follower that has replayed past their write's log position."
  - q: "Why is a fully synchronous setup, where the leader waits for ALL followers, rarely used?"
    options: ["It loses data", "Any single slow or dead follower blocks every write", "It does not support reads", "Followers cannot apply logs synchronously"]
    answer: 1
    why: "If the leader must hear from every follower, one stuck machine halts all writes. Semi-synchronous setups wait for one follower (or a quorum) and replicate to the rest asynchronously."
  - q: "During failover the old leader was only partitioned, not dead. What prevents it from accepting writes when it reconnects?"
    options: ["A longer heartbeat timeout", "A fencing epoch (term) number that the new leader increments; requests with an older epoch are rejected", "Restarting the client", "Asynchronous replication"]
    answer: 1
    why: "Each election increments the epoch. Followers and storage remember the highest epoch seen and refuse requests stamped with an older one, so a stale leader is fenced off."
  - q: "With asynchronous replication, the leader crashes 200 ms after acknowledging a write that no follower had received. What happens to the write after failover?"
    options: ["It is recovered from the client", "It is lost", "The new leader fetches it from the old leader's log", "It is applied twice"]
    answer: 1
    why: "Asynchronous replication acknowledges before the change reaches any follower. If the leader dies first, the promoted follower never saw it. That is the price of not waiting."
bigO:
  - { op: "sync write", avg: "+1 round trip", note: "≈ 0.5 ms in one datacentre, 60–200 ms between continents" }
  - { op: "async lag", avg: "ms, usually", note: "seconds to minutes under heavy load" }
  - { op: "failure detection", avg: "≈ 10–30 s", note: "heartbeat timeout; too short causes false failovers" }
  - { op: "data lost on failover", avg: "sync: none · async: unreplicated tail" }
bigOTitle: "Key numbers"
related: [sysdesign/consistency-models, sysdesign/quorum-n-r-w, sysdesign/raft-leader-election, sysdesign/geo-replication]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "Synchronous vs asynchronous replication: what does each trade?"
    a: "Sync waits for a follower before acknowledging: no acknowledged write lost, but slower and blocked if that follower is down. Async acknowledges immediately: fast and available, but followers lag and a leader crash loses the unreplicated tail."
  - kind: cloze
    text: "When two nodes both believe they are leader it is called {{split brain}}; it is prevented by {{fencing}} with a monotonically increasing epoch number."
  - kind: qa
    q: "Give two ways to provide read-your-writes on top of async followers."
    a: "Read from the leader for a short window (e.g. 1 minute) after a user writes, or record the log position of their write and only read from a follower that has replayed past it."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Master-slave and master-master replication, background" }
---

## Why replicate

**Replication** means keeping a copy of the same data on several machines, called **replicas**. It buys three things:

1. **Durability and availability:** if one machine dies, another has the data and can take over.
2. **Read scaling:** many replicas can serve reads in parallel.
3. **Latency:** a replica near the user, in another region, answers faster.

The hard part is not copying the data once; it is keeping copies in step while the data keeps changing.

## How leader-follower replication works

One replica is the **leader** (also called primary). The others are **followers** (replicas, secondaries, standbys).

1. Clients send every **write** to the leader.
2. The leader applies the write and appends it to its **replication log**, an ordered record of changes. In PostgreSQL this is the write-ahead log; in MySQL it is the binlog.
3. Each follower streams the log and applies the changes **in the same order**. Same starting state plus same ordered changes gives the same end state.
4. **Reads** can go to the leader (always current) or to followers (spread the load, but possibly behind).

The log can carry the SQL statements themselves (fragile: `NOW()` or `RAND()` differ per replica), physical disk-block changes (exact but tied to one storage engine version), or **logical row changes** ("row 42: name changed from Ada to Bo"), which is the common choice and also what change-data-capture tools read.

### Synchronous vs asynchronous

| | Synchronous | Asynchronous |
|---|---|---|
| Leader acknowledges the client… | after the follower confirms | immediately |
| Write latency | + one round trip to the follower | unchanged |
| Follower down | writes block (or must fail over the sync role) | writes continue |
| Leader dies | no acknowledged write lost | the unreplicated tail is lost |
| Follower freshness | up to date | lags: usually ms, sometimes minutes |

Waiting for *every* follower makes one slow machine stall everything, so real systems are **semi-synchronous**: one follower (or a quorum) is synchronous and the rest are asynchronous. If the synchronous follower fails, another is made synchronous.

## Worked example: lag in action

The leader has `x = 5`. F1 is synchronous, F2 asynchronous and currently 2 seconds behind.

| Time | Event | Leader | F1 | F2 |
|---|---|---|---|---|
| 0.000 s | client writes `x = 7` | 7 | 5 | 5 |
| 0.001 s | F1 applies, acks; client gets OK | 7 | 7 | 5 |
| 0.300 s | client reads `x` from F2 | 7 | 7 | **5 (stale)** |
| 2.000 s | F2 catches up | 7 | 7 | 7 |

Lag creates three classic anomalies:

- **Read-your-writes** violated: you do not see your own update (the 0.300 s row).
- **Monotonic reads** violated: one refresh hits F1 and shows 7, the next hits F2 and shows 5; time appears to go backwards. Fix: pin each user to one follower.
- **Consistent prefix** violated: you see an answer before the question it replies to, because two related writes reached different replicas in different orders.

Fixes for read-your-writes: read from the leader for data the user may have just changed (their own profile), or for a short window after they write; or remember the log position of the user's last write and read only from a follower that has applied at least that position.

## Failover

When the leader dies, a follower must be promoted:

1. **Detect** the failure, usually with a heartbeat timeout of 10 to 30 seconds. Too short and a brief GC pause or network blip triggers an unnecessary failover; too long and writes are down for longer.
2. **Choose** a new leader: the follower with the most recent data, ideally a synchronous one. Robust systems use a consensus protocol (Raft, or a coordinator such as ZooKeeper or etcd) so that a majority agrees.
3. **Reconfigure**: clients and the remaining followers switch to the new leader.

What goes wrong:

- **Lost writes.** With async replication the promoted follower may miss the last writes. If the old leader rejoins, those writes conflict and are usually discarded. Worse, a promoted follower that was behind can reuse auto-increment IDs the old leader already handed out, and any other system that stored those IDs now points at the wrong rows.
- **Split brain.** A leader that was only cut off keeps accepting writes while a new leader is elected. **Fencing** stops it: every election increments an **epoch** (Raft calls it a *term*); replicas and storage remember the highest epoch they have seen and reject requests from an older one. Requiring a **majority** to elect a leader also guarantees at most one leader per epoch.

## Multi-leader and leaderless

- **Multi-leader:** each region (or each offline device) has its own leader that accepts writes locally and replicates asynchronously to the others. Writes are fast everywhere and a region can keep working when cut off, but two leaders can change the same row concurrently, so you need **conflict resolution**: last-writer-wins, merging, or CRDTs.
- **Leaderless** (Amazon's Dynamo paper, Cassandra, Riak): the client writes to N replicas and waits for W acknowledgements; reads ask R replicas and keep the newest. No failover step is needed, but replicas diverge and are repaired by read repair and anti-entropy.

## Sketch it

A PostgreSQL primary that waits for one of two named standbys (semi-synchronous), and a router that gives read-your-writes:

```ini
# postgresql.conf on the leader
synchronous_standby_names = 'FIRST 1 (f1, f2)'   # wait for 1 standby, f1 preferred
synchronous_commit = on                           # commit waits for that standby
```

```text
route_read(user, followers, leader):
    need = user.last_write_position or 0      # log position of their last write
    for each follower f:
        if f.replayed_position() >= need:     # has this follower applied it?
            return f
    return leader                             # nobody caught up: use the leader
```

## In the interview

Usually part of a bigger design: *"how do you make the database highly available?"* Say: leader-follower, one synchronous follower plus async ones, reads from followers with read-your-writes routing, automatic failover through consensus, and fencing epochs against split brain. Quote the trade-off in one line: synchronous costs a round trip per write, asynchronous costs possible data loss on failover. Expect the follow-up *"what if the leader's region goes down?"*, which leads to geo-replication.
