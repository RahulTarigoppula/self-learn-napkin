---
title: Cache Invalidation
track: sysdesign
tags: [caching, consistency, databases]
difficulty: 3
minutes: 5
tldr: "A cache holds a copy, and copies go stale. Update the database, then delete (not update) the cached key, keep a TTL as a safety net, and stop a hot key's expiry from stampeding the database."
analogy: "A noticeboard copies the canteen menu. When the chef changes the menu, the safe move is to tear the old notice down so the next person checks the kitchen, not to scribble a correction that might be the wrong one."
diagram: cache-invalidation
story:
  - title: A cache in front of the database
    text: "A reader, a writer, a cache and a database, with time flowing down the page. The database holds x = v1 and the cache has no copy of x yet, perhaps it just expired. The cache is a copy, so every write raises the question of how the copy finds out."
  - title: Update the DB, then delete the key
    text: "The writer follows the standard cache-aside rule: first UPDATE the database to v2, then DEL x from the cache. It deletes rather than writes v2 into the cache, so the next reader misses and loads the fresh row itself. Most of the time, this is all you need."
  - title: "The race: a slow reader re-fills old data"
    text: "But a reader started just before the write. It missed the cache and read v1 from the database. Then the writer updated to v2 and deleted x, which was not even there. Finally the slow reader stores its v1. The cache now says v1 while the database says v2, and nobody will delete it again."
  - title: "TTL: the stale copy dies on its own"
    text: "This is why every cached key gets a TTL (time to live) even when you invalidate explicitly. With a TTL of 60 seconds, the stale v1 can survive for at most a minute. The TTL bounds how wrong the cache can be when invalidation is lost, races or has a bug."
  - title: "Stampede: a hot key expires"
    text: "TTLs bring their own problem. A key read 1,000 times per second expires. Within the few milliseconds it takes to reload it, every request misses and runs the same database query: a thundering herd, or cache stampede, that can take the database down."
  - title: "Fix: one rebuild, the rest wait"
    text: "Coalesce the misses: the first request takes a short lock or lease and rebuilds the key; the others wait briefly or are served the old value. Add random jitter to TTLs so keys loaded together do not expire together, and refresh very hot keys a little before they expire."
keyIdeas:
  - "**Cache-aside writes:** update the database first, then **delete** the key. The next read reloads the truth."
  - "**Delete, don't update:** two writers that each set the cache can land in the opposite order to their database writes; deletes cannot disagree."
  - "**The fill race** (a slow reader stores a value read before the write) still leaves stale data, so every key needs a **TTL** as a safety net."
  - "**Write-through** keeps the cache fresh at the cost of slower writes; **write-behind** is fast but can lose acknowledged writes; **write-around** skips the cache for writes."
  - "**Stampede protection:** request coalescing (single-flight or a lock), jittered TTLs, and early probabilistic refresh."
quiz:
  - q: "Why do most teams delete the cached key after a database write instead of writing the new value into the cache?"
    options: ["Deleting is faster than writing", "Two concurrent writers' cache updates can arrive in the opposite order to their database writes, leaving an old value cached", "Caches cannot overwrite keys", "It saves memory"]
    answer: 1
    why: "W1 writes A, W2 writes B to the database, but W2's cache SET lands before W1's: the cache says A, the database B, indefinitely. Two deletes in any order leave the same result: no entry."
  - q: "A writer deletes the cache key FIRST and then updates the database. What can go wrong?"
    options: ["Nothing; the order does not matter", "A reader between the two steps misses, reads the old row and caches it, so the cache stays stale after the update", "The database rejects the update", "The cache deletes the wrong key"]
    answer: 1
    why: "In the gap between delete and update, a read misses, loads the old row and writes it back. The update then completes but nobody deletes the key again, so the old value lives until its TTL."
  - q: "Which write strategy can lose writes that were already acknowledged to the client?"
    options: ["Write-through", "Write-around", "Write-behind (write-back)", "Cache-aside"]
    answer: 2
    why: "Write-behind acknowledges once the cache has the value and flushes to the database later. If the cache node dies before the flush, those writes are gone."
  - q: "10,000 product keys are bulk-loaded at 09:00 with TTL = 1 hour. What should you change?"
    options: ["Nothing", "Add random jitter, e.g. 1 hour ± 10 %, so they do not all expire at 10:00", "Use a shorter TTL for all of them", "Disable the TTL"]
    answer: 1
    why: "Identical TTLs make all keys expire in the same instant and the database takes every miss at once. Jitter spreads the expiries over minutes."
bigO:
  - { op: "Cache-aside", avg: "app reads cache, fills on miss", note: "write: DB then delete key" }
  - { op: "Read-through", avg: "cache loads on miss", note: "app talks only to the cache" }
  - { op: "Write-through", avg: "cache + DB synchronously", note: "fresh cache, slower writes" }
  - { op: "Write-behind", avg: "cache now, DB later", note: "fast writes, risk of loss" }
  - { op: "Write-around", avg: "DB only on write", note: "cache filled by later reads" }
bigOTitle: "Read and write strategies"
related: [sysdesign/caching, sysdesign/cache-eviction, sysdesign/consistency-models, sysdesign/replication]
prereqs: [sysdesign/caching]
flashcards:
  - kind: qa
    q: "In cache-aside, what is the safe order of operations for a write?"
    a: "Update the database, then delete the cached key. Keep a TTL on every key as a backstop for races and lost deletes."
  - kind: cloze
    text: "When a hot key expires and thousands of requests miss at once, it is called a {{cache stampede}}; the main fix is {{request coalescing}}, so only one request rebuilds the value."
  - kind: qa
    q: "Describe the fill race that defeats 'update DB, then delete'."
    a: "A reader misses and reads the old row; the writer then updates the row and deletes the key; finally the reader stores the old row it read. The cache stays stale until the TTL."
  - kind: qa
    q: "Write-through vs write-behind in one line each?"
    a: "Write-through: write cache and database together before acknowledging (fresh, slower). Write-behind: acknowledge after the cache write and flush to the database later (fast, can lose data)."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Cache update strategies, background" }
---

## The problem

A cache stores a **copy** of data whose source of truth is somewhere else, usually a database. The moment the source changes, the copy is wrong, or **stale**. Cache invalidation is the set of rules that decide how and when stale copies get removed or replaced. It is hard because the cache and the database are two separate systems with no transaction spanning both, so any sequence of "write here, then there" has a window in which another request can see or create an inconsistent state.

## Read and write strategies

| Strategy | Read path | Write path | Strength | Weakness |
|---|---|---|---|---|
| **Cache-aside** (lazy loading) | app checks cache; on a miss reads DB and fills cache | app writes DB, then deletes the key | simple; cache holds only what is read | first read after a change is slow; fill race |
| **Read-through** | the cache library loads from DB on a miss | usually paired with write-through | app code sees one store | needs a cache that knows the DB |
| **Write-through** | as read-through | write goes to cache *and* DB before the ack | cache is fresh after writes | every write pays both latencies; caches data nobody reads |
| **Write-behind** (write-back) | as read-through | write to cache, ack, flush to DB later in batches | very fast writes, absorbs bursts | acknowledged writes lost if the cache dies first |
| **Write-around** | as cache-aside | write to DB only | no cache churn for write-once data | next read always misses |

Cache-aside with delete-on-write is the default for most web systems because it fails safe: when anything goes wrong, the worst case is a miss, which reloads the truth.

## Why delete, not update

Two writers change the same row at about the same time:

1. W1 writes `name = Ada` to the database.
2. W2 writes `name = Bo` to the database. The database now says Bo.
3. W2 sets the cache to Bo.
4. W1, delayed by a GC pause, sets the cache to Ada.

The cache says Ada, the database says Bo, and nothing will fix it until the TTL. Deleting avoids this: two deletes in any order leave the key absent, and the next read loads Bo. Deleting also avoids computing and storing values nobody may read.

The *order* matters too. **Delete first, then update** is worse: a reader that arrives between the two steps misses, loads the old row and caches it, and the update that follows never deletes it again.

## Worked example: the fill race

Even "update the DB, then delete" has a gap. Key `x` is not cached; the database holds v1.

| Time | Reader | Writer | Cache | DB |
|---|---|---|---|---|
| t1 | `GET x` → miss | | — | v1 |
| t2 | reads DB → v1 | | — | v1 |
| t3 | (paused) | `UPDATE x = v2` | — | v2 |
| t4 | (paused) | `DEL x` (nothing to delete) | — | v2 |
| t5 | `SET x = v1` | | **v1, stale** | v2 |

It needs a slow reader and a write landing inside its few milliseconds, so it is rare, but at millions of requests per day rare events happen daily. Defences, from simplest to strongest:

- **TTL on every key.** Caps the damage: with TTL 60 s, stale for at most 60 s.
- **Delayed double delete.** Delete after the write, then again a few hundred milliseconds later, after any in-flight fill has landed.
- **Versioned or conditional sets.** Store a version with the value and only overwrite when the new version is higher.
- **Leases.** Facebook's memcache design hands a lease token to the first reader that misses; a delete invalidates the token, and the cache rejects a fill whose token is no longer valid. The same leases also limit stampedes.
- **Invalidate from the database's change log.** A process tails the replication log (change data capture) and deletes keys after each commit, so no code path can forget to invalidate.

> **Pitfall:** filling the cache from a lagging read replica recreates the race on a larger scale: you delete the key, a reader reloads it from a replica that has not applied the write yet, and the old value is cached again.

## Stampedes (thundering herd)

When a popular key expires, every request that arrives before it is rebuilt misses. If the rebuild query takes 200 ms and the key gets 5,000 requests per second, about 1,000 identical queries hit the database at once. Fixes:

- **Request coalescing** (single-flight): only the first miss rebuilds; concurrent misses wait for its result. Across many servers, use a short lock or lease in the cache itself (`SET lock:x NX PX 5000`).
- **Serve stale while revalidating:** keep the old value slightly past its soft expiry and return it while one request refreshes in the background.
- **Jittered TTLs:** `ttl = 3600 * random.uniform(0.9, 1.1)` so keys loaded together expire across a window instead of in one instant.
- **Probabilistic early refresh:** each reader refreshes early with a probability that rises as expiry approaches. The XFetch rule recomputes when `now − delta · beta · ln(rand()) ≥ expiry`, where `delta` is how long a rebuild takes and `beta` is usually 1.

## In code

```python
import random, threading

TTL = 60
locks: dict[str, threading.Lock] = {}

def read_user(uid):
    key = f"user:{uid}"
    val = cache.get(key)
    if val is not None:
        return val                                   # hit
    lock = locks.setdefault(key, threading.Lock())   # single-flight per key
    with lock:
        val = cache.get(key)                         # someone may have filled it
        if val is None:
            val = db.query("SELECT * FROM users WHERE id = %s", uid)
            ttl = int(TTL * random.uniform(0.9, 1.1))   # jitter
            cache.set(key, val, ex=ttl)
    return val

def update_user(uid, fields):
    db.execute("UPDATE users SET ... WHERE id = %s", uid)  # 1. source of truth
    cache.delete(f"user:{uid}")                            # 2. delete, don't set
```

The lock dictionary coalesces misses within one process; across a fleet you would use a lock or lease in the cache instead.

## In the interview

Typical prompt: *"You added a cache and users sometimes see old profile data. Why, and how do you fix it?"* A strong answer names cache-aside, gives the write order (database, then delete), explains why delete beats update, describes the fill race, and states that TTLs bound staleness. Then raise stampedes before being asked. Expect the follow-up *"what if the delete fails?"*: retry it from a queue or from the change log, and rely on the TTL as the final backstop.
