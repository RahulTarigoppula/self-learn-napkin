---
title: Cache Eviction Policies
track: sysdesign
tags: [caching, memory, performance]
difficulty: 2
minutes: 4
tldr: "When a cache is full, a new key must push an old one out. The eviction policy (LRU, LFU, FIFO, TTL, random) decides who goes, and that choice sets your hit rate."
analogy: "A desk with room for three books. When a fourth arrives, one goes back to the shelf. LRU returns the one you touched longest ago; FIFO returns the one that arrived first, even if you were reading it a minute ago."
diagram: cache-eviction
story:
  - title: A full cache must pick a victim
    text: "A cache holds a fixed number of keys; here, capacity 3. We draw it as three slots ordered by recency: most recently used on the left, least recently used on the right. As long as there is a free slot, nothing interesting happens."
  - title: "LRU: fill with A, B, C"
    text: "Requests for A, B and C miss and get cached. Each new key goes to the front, so the order is C, B, A. The cache is now full, and A, the key touched longest ago, sits at the tail."
  - title: A hit moves the key to the front
    text: "get A is a hit. Under LRU (least recently used) every access counts as a use, so A jumps to the front: A, C, B. Now B is the least recently used key. This bookkeeping is O(1) with a hash map plus a doubly linked list."
  - title: A miss on a full cache evicts the tail
    text: "put D arrives and there is no room. LRU removes the tail, B, and puts D at the front: D, A, C. The bet is that the past predicts the future: a key nobody touched for a while is the one least likely to be needed next."
  - title: FIFO ignores the hit and evicts A
    text: "Replay the same requests under FIFO (first in, first out). FIFO only remembers arrival order, so the get A changes nothing and A, the first one in, is evicted, even though it was just used. FIFO is simpler and cheaper but evicts hot keys."
  - title: A one-off scan flushes the hot keys
    text: "Now a batch job reads X, Y and Z once each. Under plain LRU each one is 'most recent', so they push out D, A and C, the keys real users keep asking for, and are never read again. Scan-resistant policies such as segmented LRU and W-TinyLFU exist to stop this."
keyIdeas:
  - "**LRU** evicts the key unused for the longest time: a hash map finds the node, a doubly linked list keeps recency order, so get and put are both O(1)."
  - "**LFU** evicts the key with the fewest hits; it protects long-term favourites but needs aging, or yesterday's hot keys never leave."
  - "**FIFO** and **random** keep no per-access state: cheap and lock-friendly, but blind to what is hot."
  - "**TTL** expiry is about freshness, not space: a key dies after a set time even if memory is free."
  - "**Scan pollution**: one-time reads flush LRU. SLRU, LRU-K and W-TinyLFU make a key prove it is popular before it can push out hot ones."
  - "**Redis** does not keep an exact LRU list: it samples a few keys (5 by default) and evicts the one that has been idle longest."
quiz:
  - q: "LRU cache, capacity 3. Requests: A, B, C, A, D. Which key is evicted when D arrives?"
    options: ["A", "B", "C", "Nothing, D is rejected"]
    answer: 1
    why: "After A, B, C the recency order is C, B, A. get A moves A to the front: A, C, B. B is now least recently used, so D evicts B."
  - q: "Same requests (A, B, C, A, D) under FIFO. Which key is evicted?"
    options: ["A", "B", "C", "D"]
    answer: 0
    why: "FIFO evicts by insertion order and ignores hits. A was inserted first, so it goes, even though it was just read."
  - q: "A nightly report reads 10 million rows once each through an LRU cache of 1 million keys. What happens?"
    options: ["Nothing; LRU ignores one-time reads", "The hot working set is flushed and the hit rate collapses until it rewarms", "The cache grows to 10 million keys", "Only the report's keys miss"]
    answer: 1
    why: "Each scanned row becomes most recent and pushes out a hot key. After the scan the cache is full of rows nobody will read again. Scan-resistant policies (SLRU, LRU-K, TinyLFU) admit new keys on probation."
  - q: "Why does Redis approximate LRU by sampling instead of keeping an exact LRU list?"
    options: ["Exact LRU is not correct for caches", "To avoid two extra pointers per key and list updates on every read", "Because Redis keys have no access time", "Sampling gives a higher hit rate than exact LRU"]
    answer: 1
    why: "A linked list costs memory per key and a pointer shuffle on every access. Redis stores a small access clock per object and, on eviction, compares a handful of sampled keys. With 10 samples it is very close to true LRU."
bigO:
  - { op: "LRU get / put", avg: "O(1)", note: "hash map + doubly linked list" }
  - { op: "LFU get / put", avg: "O(1)", note: "frequency buckets; O(log n) with a heap" }
  - { op: "FIFO / random", avg: "O(1)", note: "no work on a hit" }
  - { op: "Redis sampled LRU", avg: "O(k)", note: "k = maxmemory-samples, default 5" }
bigOTitle: "Cost per operation"
related: [sysdesign/caching, dsa/lru-cache, sysdesign/cache-invalidation, dsa/linked-lists]
prereqs: [sysdesign/caching, dsa/hash-tables]
flashcards:
  - kind: qa
    q: "Which two data structures give LRU O(1) get and put, and what does each do?"
    a: "A hash map from key to list node (find in O(1)) and a doubly linked list in recency order (move to front or drop the tail in O(1))."
  - kind: cloze
    text: "A one-time scan that flushes an LRU cache is called {{scan pollution}}; W-TinyLFU prevents it with a {{frequency-based admission filter}}."
  - kind: qa
    q: "What is the difference between eviction and expiry?"
    a: "Eviction removes a key because memory is full (chosen by the policy). Expiry removes a key because its TTL ran out, regardless of free memory; it bounds staleness."
  - kind: qa
    q: "Why does a pure LFU cache need aging?"
    a: "Counts only grow, so a key that was hugely popular last week keeps a high count and is never evicted even after nobody reads it. Halving or decaying counts lets it fall out."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Cache section, background" }
---

## Why eviction matters

A cache is useful because it is small and fast: RAM instead of disk, one hop instead of many. Small means it fills up. Once it is full, every miss that we want to cache must **evict** (remove) an existing entry. The rule that picks the victim is the **eviction policy**, also called the replacement policy.

The policy is a prediction: *which key is least likely to be requested again soon?* Get it right and the **hit rate** (fraction of requests served from the cache) stays high. Get it wrong and you pay the slow path. Going from a 90 % to a 95 % hit rate halves the traffic that reaches the database, from 10 % of requests to 5 %.

The theoretical best is **Belady's MIN**: evict the key whose next use is furthest in the future. It needs to know the future, so no real cache can run it, but it is the yardstick that policies are measured against.

## How the main policies work

| Policy | Evicts | Bookkeeping on a hit | Good at | Bad at |
|---|---|---|---|---|
| **LRU** (least recently used) | the key untouched for longest | move to front | recency-heavy workloads | one-off scans |
| **LFU** (least frequently used) | the key with the fewest hits | increment a counter | stable favourites | new keys, shifting trends |
| **FIFO** (first in, first out) | the oldest inserted key | none | simplicity, concurrency | evicts hot keys |
| **Random** | any key | none | no state at all | unpredictable |
| **TTL expiry** | keys past their time-to-live | none | bounding staleness | not a space policy on its own |

**LRU** keeps two structures. A **hash map** maps key → node so a lookup is O(1). A **doubly linked list** keeps nodes in recency order; because each node knows its previous and next neighbour, you can unlink it and splice it at the head in O(1). On a hit: unlink, move to head. On a miss with a full cache: drop the tail node and delete its key from the map.

**LFU** stores a hit count per key and evicts the smallest. An O(1) version keeps one linked list per frequency and remembers the minimum frequency; ties are usually broken by recency. Its weakness is history: a key with 10,000 hits from yesterday outlives every new key unless counts **decay** over time.

**TTL** (time to live) attaches an expiry time to each key. It answers a different question, *how stale may this be?*, not *what to drop when full?*, so real caches combine it with a space policy. Redis expires keys two ways: **lazily** (a read finds the key expired and deletes it) and **actively** (a background task, by default about 10 times per second, samples keys that have a TTL, deletes the expired ones, and keeps going while a large share of the sample turns out to be expired).

## Worked example

Capacity 3, requests `A B C A D`, list shown most recent first:

| Step | LRU contents | FIFO contents (insertion order, newest first) |
|---|---|---|
| put A, B, C | C B A | C B A |
| get A (hit) | **A** C B | C B A (unchanged) |
| put D (miss, full) | D A C, evicts **B** | D C B, evicts **A** |

Now a batch job reads `X Y Z` once each. Under LRU each is a miss that evicts the tail: C, then A, then D. The cache ends as `Z Y X`, three keys nobody will read again. That is **scan pollution**.

## Scan-resistant policies

- **LRU-K** (usually LRU-2) ranks keys by the time of their K-th most recent access. A key seen only once has no second access and is evicted first, so a scan cannot displace keys that have been read twice.
- **Segmented LRU (SLRU)** splits the cache into a *probationary* segment and a *protected* segment. New keys enter probation; only a second hit promotes them to protected. A scan churns through probation and never touches the protected hot set. MySQL's InnoDB buffer pool uses a similar idea: new pages enter at a midpoint, by default 3/8 of the way from the tail, and must be touched again before moving to the young end.
- **W-TinyLFU** (used by Java's Caffeine) puts a small LRU *window* (about 1 % of capacity) in front of a main SLRU. When a key falls out of the window, it is admitted to the main area only if its estimated frequency beats that of the main area's victim. Frequencies come from a **Count-Min Sketch**, a few bytes per counter, and are halved periodically so old popularity fades.
- **ARC** (adaptive replacement cache, used in ZFS) balances a recency list and a frequency list and tunes the split automatically from ghost entries of recently evicted keys.

## How Redis approximates LRU

Redis is configured with `maxmemory` and a `maxmemory-policy`: `noeviction` (the default: writes fail when full), `allkeys-lru`, `volatile-lru` (only keys with a TTL), `allkeys-lfu`, `volatile-lfu`, `allkeys-random`, `volatile-random` and `volatile-ttl` (evict the keys closest to expiry).

It does **not** keep a linked list. Each object carries a 24-bit clock of its last access. When memory is over the limit, Redis samples `maxmemory-samples` keys (default 5), adds them to a small pool of good candidates, and evicts the one idle the longest. With 5 samples it behaves close to true LRU on real workloads; at 10 it is nearly indistinguishable, at a little more CPU. Its LFU mode uses an 8-bit logarithmic counter per key that decays over time (`lfu-decay-time`).

## In code

```python
from collections import OrderedDict

class LRUCache:
    """OrderedDict = hash map + doubly linked list in one structure."""
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.data = OrderedDict()          # oldest first, newest last

    def get(self, key):
        if key not in self.data:
            return None                    # miss
        self.data.move_to_end(key)         # hit: mark as most recent, O(1)
        return self.data[key]

    def put(self, key, value):
        if key in self.data:
            self.data.move_to_end(key)
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)  # evict least recently used

cache = LRUCache(3)
for k in "ABC":
    cache.put(k, k.lower())
cache.get("A")
cache.put("D", "d")
print(list(cache.data))                    # ['C', 'A', 'D'] -> B was evicted
```

## Edge cases and pitfalls

- **Eviction is not invalidation.** Eviction frees space; it does nothing about a cached value that is wrong because the database changed.
- **`noeviction` surprises people.** A Redis cache left on the default policy starts rejecting writes when full instead of evicting.
- **Exact LRU under concurrency** needs a lock (or careful lock-free code) on every *read*, because a hit mutates the list. High-throughput caches use sampling, buffered updates or CLOCK, an approximation that sets a reference bit on access and sweeps a hand over a circular buffer.
- **Size-aware eviction.** If values vary from 100 bytes to 1 MB, counting keys is misleading; evict by bytes.

## In the interview

Often asked as "design an LRU cache" (hash map + doubly linked list, O(1) both ways) or as part of a caching design: "the cache is full, what do you evict?". A strong answer names LRU as the default, explains why LFU or W-TinyLFU win when popularity is stable, raises scan pollution unprompted, and separates **eviction** (space) from **TTL expiry** (freshness). Expect the follow-up: *how would you make it thread-safe at a million operations per second?* Mention sharding the cache into independently locked segments and approximations such as sampling or CLOCK.
