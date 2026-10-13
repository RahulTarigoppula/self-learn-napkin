---
title: Design a URL Shortener
track: sysdesign
tags: [case-study, interview, caching, sharding, estimation]
difficulty: 3
minutes: 6
tldr: "Map a 7-character base62 key to a long URL. Writes are rare, reads are 10× more: hand out unique keys from a key service, redirect with a 302, cache hot links, count clicks off a queue."
analogy: "A cloakroom: you hand over a bulky coat and get a small numbered ticket. The desk never gives the same ticket twice, and showing the ticket gets you straight back to the coat. The desk also keeps a tally of how often each coat was collected."
diagram: design-url-shortener
story:
  - title: "Write path: shorten a URL"
    text: "A client sends POST /urls with a long URL. A load balancer passes it to one of many identical, stateless app servers. The server picks a short key such as aZ3kQ9x and inserts one row, key → long URL, into the database. At 100 million new links a day that is about 1,160 writes a second."
  - title: A key service hands out unique keys
    text: "Two servers must never choose the same key. Each server grabs a batch of 1,000 unused keys from a key service and spends them from memory, so a write needs no collision check. Seven base62 characters give 62^7 ≈ 3.5 trillion keys, which is plenty for the ~183 billion links of five years."
  - title: "Read path: a 302 redirect"
    text: "Someone opens sho.rt/aZ3kQ9x. The app looks up the key and replies 302 Found with a Location header holding the long URL, and the browser follows it. A 302 is not cached by browsers by default, so every click comes back to us and can be counted; a 301 would be cached and the clicks would vanish."
  - title: Cache the hot links
    text: "Reads are 10× the writes, about 11,600 a second, and a small share of links gets most of the clicks. An in-memory cache in front of the database answers those in about 1 ms. A mapping never changes once written, so the cache almost never goes stale."
  - title: Clicks go to a queue, not the DB
    text: "Updating a click counter in the database on every redirect would turn each read into a write. Instead the app drops a small click event into a queue and returns the redirect at once. Analytics workers read the queue and aggregate counts later; if they fall behind, redirects stay fast."
  - title: Shard the DB by key
    text: "Five years of links is about 183 billion rows, roughly 90 TB. That's too much for one machine. Split the table across shards by hash(key). Every redirect knows its key, so each lookup touches exactly one shard, and adding shards with consistent hashing moves only a slice of the data."
keyIdeas:
  - "**Estimate first:** 100 M writes/day ≈ 1,160/s; 10:1 reads ≈ 11,600/s; 183 B links and ~90 TB over 5 years."
  - "**Key length:** 62^6 ≈ 57 billion is too few, 62^7 ≈ 3.5 trillion is enough. Pre-allocated keys or counter ranges avoid collision checks."
  - "**302 vs 301:** 302 sends every click through you (analytics, editable links); 301 is cached by browsers and saves load."
  - "**Read-heavy and immutable:** cache-aside with LRU absorbs hot links; shard by hash(key) so each lookup hits one shard."
  - "**Keep the redirect path lean:** analytics go through a queue, never a synchronous database write."
quiz:
  - q: "A service creates 100 million short links a day. Roughly what is its average write rate?"
    options: ["About 120 writes/s", "About 1,200 writes/s", "About 12,000 writes/s", "About 100,000 writes/s"]
    answer: 1
    why: "100,000,000 ÷ 86,400 s ≈ 1,157 writes per second (or 10^8 ÷ 10^5 = 1,000 with the rounded day). Plan for a peak of 2–3×."
  - q: "You must store about 183 billion links. Why is a 6-character base62 key not enough?"
    options: ["Base62 cannot encode numbers that large, so keys would overflow", "62^6 ≈ 57 billion keys, fewer than the links you need", "Six-character keys cannot be split across shards", "Browsers reject paths shorter than 7 characters, so links break"]
    answer: 1
    why: "62^6 = 56.8 billion < 183 billion. 62^7 ≈ 3.5 trillion gives about 19× headroom, so the key space stays only ~5 % used after five years."
  - q: "The product team wants a click count for every link. Which redirect should you return?"
    options: ["301 Moved Permanently, the standard permanent redirect", "302 Found, the standard temporary redirect status", "200 OK with the long URL in the body for the app to follow", "404 Not Found, then a client-side lookup of the long URL"]
    answer: 1
    why: "Browsers cache a 301 and go straight to the destination next time, so repeat clicks never reach you. A 302 is not cached by default, so every click passes through and can be counted."
  - q: "You build the key from the first 7 characters of an MD5 of the long URL. What must the write path do?"
    options: ["Nothing, because a 7-character MD5 prefix is unique for each URL", "Check if another URL already holds the key and retry with a salt if so", "Encrypt the key so two URLs cannot map to the same one", "Store the full 128-bit hash next to the key and skip any check"]
    answer: 1
    why: "Truncating to ~42 bits makes collisions likely at scale: with 183 billion keys in a 3.5 trillion space, a new key collides about 5 % of the time. Every write needs an atomic insert-if-absent and a retry."
bigO:
  - { op: "new links (writes)", avg: "~1,160/s", note: "100 M/day ÷ 86,400 s; peak ~3.5 k/s" }
  - { op: "redirects (reads)", avg: "~11,600/s", note: "10:1 read:write; peak ~35 k/s" }
  - { op: "links after 5 years", avg: "~183 billion", note: "100 M × 365 × 5" }
  - { op: "storage after 5 years", avg: "~90 TB", note: "~500 B per row, before replication" }
  - { op: "key space, 7 base62 chars", avg: "62^7 ≈ 3.5 trillion", note: "62^6 ≈ 57 billion is too small" }
  - { op: "cache for hot links", avg: "~100 GB", note: "20 % of a day's 1 B reads × 500 B" }
bigOTitle: "Key numbers"
related: [sysdesign/consistent-hashing, sysdesign/rate-limiting, sysdesign/cache-eviction, sysdesign/design-news-feed]
prereqs: [sysdesign/back-of-envelope, sysdesign/api-design, sysdesign/load-balancing, sysdesign/unique-id-generation, sysdesign/caching, sysdesign/sharding, sysdesign/message-queues]
flashcards:
  - kind: qa
    q: "Why does a URL shortener usually answer with 302 rather than 301?"
    a: "Browsers cache a 301, so repeat clicks skip your servers and you lose analytics and the ability to change or expire the link. A 302 sends every click through you, at the cost of more traffic."
  - kind: cloze
    text: "Seven base62 characters give {{62^7 ≈ 3.5 trillion}} keys, while six give only {{about 57 billion}}."
  - kind: qa
    q: "Why do app servers take keys from a key service in batches?"
    a: "Each batch is handed out once, atomically, so no two servers can issue the same key and the write path needs no collision check. Batching means one round trip per 1,000 links; a crash only wastes the unused keys."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Pastebin / bit.ly exercise, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## 1. Clarify requirements

A URL shortener turns `https://example.com/2026/some/very/long/path?utm=…` into `sho.rt/aZ3kQ9x` and sends anyone who opens the short link to the original. Before drawing anything, pin down what is in scope.

**Functional requirements** (what it does):

- Create a short link for a long URL, optionally with a custom alias (`sho.rt/summer-sale`).
- Redirect a short link to its long URL.
- Optional expiry date; the owner can delete a link.
- Click analytics: counts per link, by day, country and referrer.

**Non-functional requirements** (how well it does it):

- **Very low redirect latency.** The redirect sits between a user and the page they wanted, so aim for tens of milliseconds.
- **High availability.** A dead shortener breaks every link ever printed on a poster.
- **Unpredictable keys**, so nobody can walk through `aaaaaa1`, `aaaaaa2`, … and scrape every link.
- **Read-heavy.** Say 10 redirects per link created. Analytics may lag by minutes; redirects may not.

## 2. Estimate

Use the habits from **Back-of-the-Envelope Estimation**: state assumptions, split reads from writes, give average and peak.

| Quantity | Calculation | Result |
|---|---|---|
| Writes | 10^8 per day ÷ 86,400 s | ~1,160/s (peak ~3,500) |
| Reads | 10 × writes | ~11,600/s (peak ~35,000) |
| Links in 5 years | 10^8 × 365 × 5 | ~1.83 × 10^11 (183 billion) |
| Storage in 5 years | 1.83 × 10^11 × 500 B | ~91 TB, ~270 TB with 3 replicas |
| Hot-link cache | 20 % × 10^9 daily reads × 500 B | ~100 GB |
| Read bandwidth | 11,600/s × 500 B | ~6 MB/s (negligible) |

500 bytes per row covers a long URL of a few hundred characters plus the key, owner id and timestamps. The cache estimate is an upper bound: the same hot link is read many times a day, so the distinct set is smaller. What the numbers say: writes are modest, reads need a cache, and 90+ TB means the data must be spread over several machines.

## 3. API

Following **API Design**, two endpoints carry the product:

```text
POST /urls        { "long_url": "...", "alias": "summer-sale"?, "expires_at": "..."? }
                  → 201 Created  { "short_url": "https://sho.rt/aZ3kQ9x" }
GET  /{key}       → 302 Found    Location: https://example.com/...
                  → 404 Not Found if the key is unknown or expired
DELETE /urls/{key}                (owner only)
GET  /urls/{key}/stats            → clicks by day, country, referrer
```

Require an API key or login on `POST` and put **Rate Limiting** on it; a shortener is a favourite tool of spammers.

## 4. High-level design

Walk the diagram from left to right. Clients reach a **load balancer** (see **Load Balancing**), which spreads requests over stateless app servers. On a write, the app server takes a key, inserts `(key, long_url, owner, created_at, expires_at)` into the database and returns the short URL. On a read, it looks the key up (cache first, database on a miss) and answers with a redirect. Each click also becomes an event on a queue that analytics workers consume.

The data model is one main table:

| Column | Type | Note |
|---|---|---|
| `key` | char(7) | primary key, the shard key |
| `long_url` | text | up to ~2 KB |
| `owner_id` | bigint | for "my links" pages |
| `created_at`, `expires_at` | timestamp | expiry is optional |

The only hot query is "get the row for this key", which is a pure key-value lookup. Per **SQL vs NoSQL**, either a key-value store such as DynamoDB or Cassandra, or a sharded relational database, fits. A "list my links" page needs a secondary index on `owner_id`.

## 5. Deep dive: generating the key

**How long must it be?** Base62 uses `a–z`, `A–Z` and `0–9`, all safe in a URL. You need 183 billion keys: 62^6 ≈ 56.8 billion is too few, 62^7 ≈ 3.52 trillion is about 19× more than enough. So 7 characters.

Three ways to produce them:

1. **Counter + base62 encoding.** Keep a global counter and encode its value in base62 (with the alphabet `0–9a–zA–Z`, `125` → `21`, because 2 × 62 + 1 = 125). Keys are unique by construction. A single counter is a bottleneck and a single point of failure, so give each app server a **range** (one server gets 1,000,000–1,999,999, the next 2,000,000–2,999,999) from a coordinator; see **Unique ID Generation**. Sequential keys are guessable, so pass the number through a reversible scramble, a fixed one-to-one shuffle of the 62^7 values, before encoding.
2. **Hash and truncate.** Take MD5 or SHA-256 of the long URL and keep 7 base62 characters (~42 bits). No coordination, but collisions are real: with 183 billion keys already in a 3.5 trillion space, a new key hits an existing one about 5 % of the time. Every write must be an atomic **insert-if-absent**, retried with a salt on conflict. The same URL also always gives the same key, which is wrong if two users want separate analytics.
3. **Pre-generated key service.** A small service creates random unused keys in advance and hands them out in **batches of 1,000**, marking each batch as used in one atomic step, so no two app servers ever get the same key. Writes need no check and keys are random. If an app server crashes, its unspent keys are simply lost, which is harmless in a space of 3.5 trillion. The key service itself must be replicated, and it only needs a buffer of ready keys, not all 3.5 trillion.

Options 1 (with ranges) and 3 are the strong answers; mention the trade-offs of 2. **Custom aliases** always use insert-if-absent, since a human picked them.

## 6. Deep dive: the redirect, caching and analytics

**301 or 302?** A `301 Moved Permanently` may be cached by the browser indefinitely: the next click on the same device goes straight to the destination without touching you. That saves load but you lose the click, cannot change the target and cannot enforce expiry. A `302 Found` is not cached by default, so every click passes through. When analytics are part of the product, 302 is the usual choice; a 301 with a short `Cache-Control: max-age` is a middle ground that saves some traffic.

**Caching.** Reads are 10× writes and heavily skewed toward a few viral links. Put a cache-aside in-memory tier in front of the database, as in **Caching**, with LRU eviction (see **Cache Eviction Policies**). Mappings never change, so invalidation only happens on delete or expiry; a TTL of a day bounds any leftover staleness. A miss for a key that does not exist should also be cached briefly, otherwise a bot requesting random keys reaches the database every time.

**Analytics.** Writing `clicks = clicks + 1` on every redirect would turn 11,600 reads a second into 11,600 writes, with hot rows for viral links. Instead the app publishes a small event `(key, time, country, referrer)` to a queue (see **Message Queues**) and returns the redirect immediately. Workers aggregate events into per-key, per-hour counters. If the queue is briefly unavailable, buffer locally or drop the event: an analytics gap is acceptable, a slow redirect is not.

## 7. Bottlenecks and trade-offs

- **Scaling the database:** shard by `hash(key)` (see **Sharding**, **Consistent Hashing**) so each redirect touches one shard. Range sharding on keys works too because random keys spread evenly. Add replicas (**Replication**) for failover and extra read capacity.
- **Hot keys:** one viral link can produce more reads than a cache node handles. Replicate hot entries to several cache nodes or keep a small in-process cache on each app server.
- **Availability vs consistency:** a link must be readable right after creation. Return the short URL only after the write is durable on the primary, and write it into the cache at creation time.
- **Expiry and cleanup:** check `expires_at` on read (lazy) and run a background job that deletes expired rows.
- **Abuse:** rate-limit creation, scan target URLs against malware and phishing lists, and let owners report links.

## 8. What I'd say in the last 5 minutes

"Writes are about 1,160 a second, reads about 11,600, and storage grows to about 90 TB over five years. I chose 7-character base62 keys from a key service that hands out batches, so writes never collide. Redirects are 302 so we can count clicks; the hot ones come from a cache in about a millisecond; clicks flow through a queue so the redirect never waits on analytics. The database is sharded by key. With more time I'd add geo-distributed read replicas and an edge cache so redirects are served close to users, and abuse detection on the write path."
