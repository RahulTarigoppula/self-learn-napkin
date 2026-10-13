---
title: Caching
track: sysdesign
tags: [caching, latency, performance]
difficulty: 2
minutes: 4
tldr: "Keep the hot answers close; the hard part is not storing them but knowing when they are wrong."
analogy: "A chef keeps salt and oil on the counter instead of walking to the storeroom each time. Fast — until someone swaps the storeroom oil and the counter bottle is now the wrong one."
diagram: cache-aside
story:
  - title: An app, a cache and a database
    text: "Three actors, with time flowing down the page. The cache is an in-memory key-value store that answers in about 1 ms; the database sits on disk and takes about 10 ms or more. In the cache-aside pattern only the app talks to both — the cache never talks to the database."
  - title: Ask the cache first
    text: "A request needs user 42, so the app asks the cache for user:42. The cache has never seen it and replies miss. That cost about 1 ms and bought nothing — every miss pays the cache round trip on top of the database."
  - title: Miss, so read the database
    text: "The app runs the real query, SELECT … WHERE id = 42, and gets back the row: Ada. This is the slow path that the cache exists to avoid."
  - title: Copy the answer into the cache
    text: "Before returning Ada to the user, the app writes it into the cache: SET user:42 = Ada with a TTL of 60 seconds. The TTL is a safety net: even if we forget to invalidate, the copy can be stale for at most a minute."
  - title: The next read is a hit
    text: "The next request for user 42 asks the cache and gets Ada straight back in about 1 ms. The database is not touched at all. With a 95 % hit rate, the database sees only 1 in 20 reads."
  - title: A write invalidates the copy
    text: "Ada changes her name. The app updates the database first, then deletes user:42 from the cache. The next read misses and reloads the fresh row. Deleting is safer than overwriting: two racing writers could leave the older value in the cache."
keyIdeas:
  - "**Cache-aside**: the app reads the cache, falls back to the database on a miss, and fills the cache itself."
  - "**Hit rate** is everything: at 95 % hits the database sees 1 read in 20; at 50 % the cache barely helps."
  - "**TTL** bounds staleness; **delete on write** keeps it short. Update the database first, then delete the key."
  - "**Eviction** (usually LRU) decides what to drop when memory is full."
  - "A hot key expiring causes a **thundering herd** — fix with a single-flight lock and jittered TTLs."
quiz:
  - q: "A cache answers in 1 ms, the database in 20 ms, and the hit rate is 90 %. What is the average read latency with cache-aside?"
    options: ["About 1 ms", "About 3 ms", "About 10.5 ms", "About 21 ms"]
    answer: 1
    why: "Hits cost 1 ms; misses cost 1 ms for the cache plus 20 ms for the database. 0.9 × 1 + 0.1 × 21 = 3 ms."
  - q: "On a write, why delete the cache key rather than write the new value into it?"
    options: ["Deleting is faster than writing", "Two concurrent writers can leave the older value in the cache if both overwrite it", "Caches cannot update keys", "It stops the TTL from expiring"]
    answer: 1
    why: "If writer A sets v1 and writer B sets v2 but their cache writes land in the opposite order, the cache holds v1 forever (until the TTL). Deleting means the next reader loads whatever the database holds."
  - q: "A key read 50,000 times per second expires. What happens without protection?"
    options: ["Nothing — the next read refills it", "Thousands of requests miss at once and all query the database", "The cache evicts other keys", "Reads return an error until the TTL resets"]
    answer: 1
    why: "Every request that arrives before the first one refills the key also misses, so the database takes a burst of identical queries — a thundering herd. A single-flight lock lets one request refill while others wait."
bigO:
  - { op: "hit",  avg: "~1 ms",   note: "in-memory, same datacentre" }
  - { op: "miss", avg: "~10 ms+", note: "hit cost plus the database read" }
bigOTitle: "Key numbers"
related: [dsa/hash-tables, dsa/lru-cache, sysdesign/consistent-hashing, sysdesign/load-balancing]
prereqs: [sysdesign/load-balancing]
flashcards:
  - kind: qa
    q: "In cache-aside, who writes to the cache and when?"
    a: "The application, after a read miss (and it invalidates or updates the entry on write). The cache never talks to the database itself."
  - kind: cloze
    text: "A {{TTL}} bounds staleness without needing an explicit invalidation for every write."
  - kind: qa
    q: "A popular key expires and 10,000 requests miss at once. What is this called and how do you prevent it?"
    a: "A thundering herd (cache stampede). Let one request rebuild the entry while others wait (single-flight lock), and add random jitter to TTLs so keys do not expire together."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Cache section, redrawn" }
---

## Why cache

Reading from memory is roughly 100 times faster than a database query that touches disk and crosses the network. Most workloads are also skewed: a small fraction of keys (the home page, popular products, logged-in users) takes most of the reads. A **cache** is a small, fast store, usually an in-memory key-value server such as Redis or Memcached, that keeps copies of those hot answers. Every read it serves is one the database does not have to.

The price is that a cache holds **copies**, and copies can go stale. Everything hard about caching is about deciding when a copy is no longer true.

## How it works: cache-aside

Cache-aside (also called lazy loading) is the most common pattern:

1. **Read:** look up the key in the cache. On a **hit**, return it.
2. On a **miss**, read the database, store the result in the cache with a **TTL** (time to live, after which the cache deletes it automatically), and return it.
3. **Write:** update the database, then **delete** the cache key. The next read reloads it.

Only data that someone actually asks for gets cached, and if the cache dies, the app still works — just slower.

### Other patterns

| Pattern | Who fills the cache | Trade-off |
|---|---|---|
| Cache-aside | The app, on a miss | Simple, resilient; first read of every key is slow |
| Read-through | The cache library loads from the DB on a miss | Same behaviour, logic moved into the cache layer |
| Write-through | Every write goes to cache and DB together | Cache always fresh; slower writes, caches data nobody reads |
| Write-behind | Write to the cache, flush to the DB later | Very fast writes; data lost if the cache dies before flushing |

## Worked example

Cache 1 ms, database 20 ms, TTL 60 s, user 42 read 1,000 times a minute.

| Step | Cache | Database | Latency |
|---|---|---|---|
| First read | miss | SELECT, 20 ms | 21 ms |
| Fill | SET user:42, TTL 60 s | — | — |
| Next 999 reads in that minute | hit | untouched | 1 ms each |
| Name change | DEL user:42 | UPDATE | — |
| Next read | miss | SELECT returns new name | 21 ms |

The database served 2 reads instead of 1,000. Average read latency is `hit_rate × 1 + miss_rate × 21`, so the hit rate matters far more than the cache's raw speed.

## In code

```python
import random   # cache and db are your Redis and database clients

def get_user(uid):
    key = f"user:{uid}"
    cached = cache.get(key)
    if cached is not None:
        return cached                                  # hit
    row = db.query("SELECT * FROM users WHERE id = %s", uid)
    cache.set(key, row, ttl=60 + random.randint(0, 10))  # jitter
    return row

def rename_user(uid, name):
    db.execute("UPDATE users SET name = %s WHERE id = %s", name, uid)
    cache.delete(f"user:{uid}")                        # after the DB write
```

## Edge cases and pitfalls

- **Thundering herd (cache stampede):** a hot key expires and thousands of concurrent misses hit the database together. Fixes: a **single-flight lock** (the first miss rebuilds the key, the rest wait or serve the old value), **jittered TTLs** so keys do not expire in sync, or refreshing hot keys early.
- **Race on write:** a reader can load the old row, the writer updates the DB and deletes the key, and then the reader writes the old row back into the cache. The TTL is what eventually heals this; short TTLs keep the window small.
- **Eviction:** when memory is full the cache drops something. **LRU** (least recently used) is the usual default; **LFU** (least frequently used) suits stable popularity.
- **Caching misses:** a key that does not exist misses every time. Cache a short-lived "not found" marker so a flood of lookups for missing ids does not reach the database.
- **Cold start:** an empty cache after a restart sends all traffic to the database at once; warm it up or bring it back gradually.

## When to use it

Cache data that is **read much more often than it changes** and where a little staleness is acceptable: profiles, product pages, rendered fragments, computed feeds. Be careful with data that must be exact at every read — balances, stock counts at checkout — and read those from the source of truth.

## In the interview

Caching comes up in almost every design. A strong answer says **where** the cache sits (CDN, app-side, a shared Redis tier), **which pattern** (cache-aside), **what the TTL is and why**, **how writes invalidate**, and **what eviction policy** runs. Expect the follow-ups "what if the cache goes down?" (the database must survive the miss traffic, or you shed load) and "how do you handle a hot key expiring?" (single-flight, jitter). Numbers worth knowing: memory read ~100 ns, Redis round trip in a datacentre ~0.5–1 ms, an indexed database read a few ms to tens of ms.
