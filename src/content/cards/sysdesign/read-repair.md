---
title: Read Repair and Anti-Entropy
track: sysdesign
tags: [replication, consistency, distributed]
difficulty: 3
minutes: 5
tldr: "Leaderless replicas drift apart. Read repair fixes a key when a read notices stale copies; hinted handoff replays missed writes; Merkle-tree anti-entropy finds and syncs everything else."
analogy: "Three people keep the same address book. When you ask two of them for a number and their answers differ, you take the newer one and correct the other on the spot. Once a month they compare page checksums and only copy pages that differ."
diagram: read-repair
story:
  - title: Replicas drift apart
    text: "In a leaderless store each key lives on N = 3 replicas and a write succeeds once W = 2 of them acknowledge. A write of v2 reached R1 and R2, but R3 was down and still holds v1. Nothing was lost, but the copies now disagree, and nothing so far will fix R3."
  - title: A quorum read sees two versions
    text: "A client reads key k with R = 2. The coordinator, the node handling the request, asks R2 and R3. R2 answers v2 and R3 answers v1. Because R + W > N, at least one reply is guaranteed to be the newest; the version numbers or timestamps say which."
  - title: Return the newest, write it back
    text: "The coordinator returns v2 to the client, and also sends v2 to R3, which was caught holding an old copy. That is read repair: every read that sees disagreement fixes it. The catch is that it only repairs keys that somebody reads."
  - title: "Anti-entropy: compare Merkle roots"
    text: "For keys nobody reads, replicas compare data in the background. Each builds a Merkle tree: leaves hash a range of keys, parents hash their children. If the two root hashes match, the replicas are identical. Here the roots differ, 9f versus 3c, so something inside differs."
  - title: Descend only where hashes differ
    text: "Compare the two children. The left ones match, a1 = a1, so keys 0–49 are skipped without sending a single key. The right ones differ, so descend: only the leaf for keys 50–74 differs. Just that range is streamed and fixed, instead of the whole dataset."
keyIdeas:
  - "**Divergence is normal** in leaderless stores: a node misses writes while down, a message drops, or a write lands on fewer than N replicas."
  - "**Read repair:** compare the versions returned by a read, return the newest and write it back to stale replicas. Cheap, but it only fixes keys that are read."
  - "**Hinted handoff:** a node that cannot reach a replica keeps the write as a hint and replays it when the replica returns, for a limited window (3 hours by default in Cassandra)."
  - "**Merkle-tree anti-entropy:** compare root hashes, descend only into differing branches, and transfer only the differing key ranges."
  - "Run full repair more often than tombstones are purged (Cassandra's `gc_grace_seconds`, 10 days by default), or deleted data can come back."
quiz:
  - q: "Why is read repair alone not enough to keep replicas in sync?"
    options: ["It is too slow", "It only repairs keys that are read; cold keys can stay stale forever", "It needs a leader", "It deletes data"]
    answer: 1
    why: "Read repair piggybacks on reads. A key that nobody reads never gets compared, so a background process (Merkle-tree anti-entropy) is still needed."
  - q: "Two replicas each hold 1,000,000 keys in a Merkle tree with 1,024 leaves. Exactly one key differs. Roughly what gets compared and sent?"
    options: ["All 1,000,000 keys", "About 20 hashes along one root-to-leaf path, then one leaf's range of about 1,000 keys", "Only the root hash", "1,024 leaf hashes and nothing else"]
    answer: 1
    why: "The tree has log₂ 1024 = 10 levels. At each level you compare two children and descend into the one that differs: about 2 × 10 hashes. Then only the differing leaf's key range, ~1,000 keys, is exchanged."
  - q: "A replica was down for 5 hours. Cassandra's hint window is 3 hours. What brings it fully up to date?"
    options: ["Hinted handoff replays everything", "Read repair on every key", "A full anti-entropy repair (Merkle trees)", "Nothing is needed"]
    answer: 2
    why: "Hints stop being stored after the window, so writes from the last 2 hours are missing. Read repair will fix only keys that get read. A full repair compares Merkle trees and fixes the rest."
  - q: "During read repair, how does the coordinator decide which copy is newest?"
    options: ["The copy from the fastest replica", "By comparing version metadata such as timestamps or version vectors", "By majority vote of values", "The copy with the longest value"]
    answer: 1
    why: "Values carry versions. With last-write-wins timestamps the highest one wins; with version vectors, concurrent versions are detected and kept as siblings for the application to merge."
bigO:
  - { op: "read repair", avg: "per read", note: "fixes only the key being read" }
  - { op: "hinted handoff", avg: "minutes–hours", note: "covers short outages; 3 h default window in Cassandra" }
  - { op: "Merkle compare", avg: "O(d · log L)", note: "d differing leaves, L leaves in the tree" }
  - { op: "data sent", avg: "only differing ranges", note: "not the whole dataset" }
bigOTitle: "Repair mechanisms"
related: [sysdesign/quorum-n-r-w, sysdesign/replication, sysdesign/consistency-models, sysdesign/consistent-hashing]
prereqs: [sysdesign/quorum-n-r-w, sysdesign/replication]
flashcards:
  - kind: qa
    q: "What is read repair?"
    a: "When a read gets different versions from different replicas, the coordinator returns the newest and writes it back to the replicas that returned stale data."
  - kind: cloze
    text: "Anti-entropy compares {{Merkle tree}} root hashes and descends only into {{branches whose hashes differ}}."
  - kind: qa
    q: "What is hinted handoff?"
    a: "When a target replica is unreachable, another node stores the write with a hint naming the intended replica, and delivers it when that replica comes back."
  - kind: qa
    q: "Why can skipping repairs resurrect deleted data in Cassandra?"
    a: "Deletes are tombstones, purged after gc_grace_seconds. If a replica that missed the delete is not repaired before the purge, its old value has nothing to shadow it and spreads back."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why replicas diverge

In a **leaderless** (Dynamo-style) store such as Cassandra or Riak, each key is stored on **N** replicas. A client, or a **coordinator** node acting for it, sends every write to all N and reports success after **W** acknowledgements; reads ask **R** replicas. There is no leader that defines the one true order, so copies can disagree:

- a replica was **down or partitioned** while writes happened;
- a write reached only W of the N replicas and the rest **timed out or were dropped**;
- a **sloppy quorum** wrote to stand-in nodes because some home replicas were unreachable.

None of this loses acknowledged data, since W replicas have it, but stale copies are a risk: with fewer up-to-date copies, one more failure might leave only stale ones. Leaderless systems therefore run three complementary repair mechanisms.

## How it works

### 1. Hinted handoff (at write time)

If the coordinator cannot reach replica R3, it stores the write locally as a **hint**: "this belongs to R3". When gossip (nodes periodically swapping cluster status with random peers) reports R3 is back, the coordinator replays the hints to it. This covers short outages cheaply. Hints are kept only for a bounded window (Cassandra's `max_hint_window` is 3 hours by default), because a long-dead node would otherwise make hints pile up without limit. In Dynamo's original design the hint lives on a stand-in node that also counts towards W, which is what makes the quorum *sloppy*.

### 2. Read repair (at read time)

1. The coordinator sends the read to R replicas. Cassandra asks one replica for the full data and the others for only a **digest**, a hash of their copy, to save bandwidth.
2. If all digests match, the answer goes straight back.
3. If they differ, the coordinator fetches the full values, picks the newest by its **version** (a write timestamp under last-write-wins, or a version vector that can also detect truly concurrent writes), returns it and **writes it back** to every replica that answered with an older version.

Read repair is free in the sense that it piggybacks on traffic you already have, and it fixes the hottest keys first. Its blind spot is keys that are rarely or never read.

### 3. Anti-entropy with Merkle trees (in the background)

To find differences without shipping every key, each replica builds a **Merkle tree** (hash tree) over a key range:

- Split the key range into L leaf ranges (e.g. 1,024). A **leaf** is the hash of all keys and values in its range.
- Each **parent** is the hash of its two children's hashes, up to a single **root**.

Two replicas exchange root hashes. If they match, the data is identical (up to a vanishingly unlikely hash collision) and they stop. If not, they compare the two children and recurse **only into the children that differ**. Matching subtrees are skipped wholesale. At the bottom they stream just the differing ranges. Cassandra runs this as `nodetool repair`.

## Worked example

N = 3, W = 2, R = 2. Key `k` holds v1 everywhere.

| Step | What happens | R1 | R2 | R3 |
|---|---|---|---|---|
| 1 | R3 goes down; client writes v2; R1, R2 ack (W = 2 met) | v2 | v2 | v1 |
| 2 | Coordinator keeps a hint for R3, but R3 stays down past the hint window; the hint is dropped | v2 | v2 | v1 |
| 3 | R3 rejoins | v2 | v2 | v1 |
| 4 | Client reads k from R2 and R3: digests differ | v2 | v2 | v1 |
| 5 | Timestamps say v2 is newer: return v2, write v2 to R3 | v2 | v2 | **v2** |

Meanwhile R3 also missed a write to key 60, which no one reads. Nightly repair builds trees over keys 0–99 with four leaves (0–24, 25–49, 50–74, 75–99). Roots differ, left children match (keys 0–49 skipped), right children differ, and of their two leaves only 50–74 differs. Only that range is exchanged.

Scale it up: 1,000,000 keys in 1,024 leaves (~1,000 keys each). One stale key costs about 2 × log₂ 1024 = 20 hash comparisons plus one ~1,000-key range, instead of comparing a million keys.

## Implement it in Python

The idea is language-independent; here it is in Python.

```python
import hashlib

def h(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()

def leaf_hashes(store: dict, ranges):
    # one leaf per key range: the hash of that range's sorted (key, value) pairs
    return [h(repr(sorted((k, v) for k, v in store.items() if lo <= k < hi)).encode())
            for lo, hi in ranges]

def build(leaves):                          # len(leaves) must be a power of two
    levels = [leaves]                       # levels[0] = leaves, levels[-1] = [root]
    while len(levels[-1]) > 1:
        lvl = levels[-1]
        levels.append([h(lvl[i] + lvl[i + 1]) for i in range(0, len(lvl), 2)])
    return levels

def diff(a, b, level=None, i=0):
    """Leaf indices whose hashes differ, descending only into mismatches."""
    if level is None:
        level = len(a) - 1                  # start at the root
    if a[level][i] == b[level][i]:
        return []                           # identical subtree: skip it entirely
    if level == 0:
        return [i]
    return diff(a, b, level - 1, 2 * i) + diff(a, b, level - 1, 2 * i + 1)

ranges = [(0, 25), (25, 50), (50, 75), (75, 100)]
r1 = {k: "v2" for k in range(100)}
r3 = {**r1, 60: "v1"}                       # key 60 is stale on R3
t1, t3 = build(leaf_hashes(r1, ranges)), build(leaf_hashes(r3, ranges))
print(diff(t1, t3))                         # [2] -> only range 50-74 needs syncing
```

## Edge cases and pitfalls

- **Deleted data coming back.** A delete is written as a **tombstone** marker, and tombstones are purged after `gc_grace_seconds` (10 days by default in Cassandra). If a replica missed the delete and is not repaired within that window, it still has the old value after the others purged their tombstone, and repair copies the old value back everywhere. Run full repairs more often than the grace period.
- **Last-write-wins loses data.** If two clients write concurrently, timestamp-based repair keeps one and silently drops the other; clock skew can even let an older write win. Version vectors detect concurrency and keep both siblings for the application to merge.
- **Merkle trees go stale.** Building a tree means reading the whole range, which is expensive, so trees are built at repair time; data written during the repair may be reported as a difference and re-sent, which is harmless.
- **Repair is I/O-heavy.** Schedule it, throttle it, and repair one key range at a time.

## In the interview

Usually a follow-up to quorums: *"R3 missed a write. How does it ever catch up?"* Name all three layers: hinted handoff for short outages, read repair for keys that are read, and Merkle-tree anti-entropy for everything else. Explain the tree descent in one sentence (compare roots, recurse only into mismatching children) and give the cost: about log of the number of leaves in hash comparisons per difference. Bonus points for the tombstone and `gc_grace_seconds` pitfall.
