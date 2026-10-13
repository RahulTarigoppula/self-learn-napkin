---
title: Sharding
track: sysdesign
tags: [sharding, databases, scaling, partitioning]
difficulty: 2
minutes: 4
tldr: "Split one huge table across machines by a shard key. Range keys keep neighbours together but create hot spots; hash keys spread load but scatter range queries."
analogy: "A library too big for one room: shelve by surname (A–H, I–P, Q–Z) and new popular authors pile into one room; assign rooms by a scrambled code and every room fills evenly, but finding every author from A to C means visiting all rooms."
diagram: sharding
story:
  - title: One table outgrows one machine
    text: "A users table has 3 million rows and keeps growing. One database server eventually runs out of disk, memory for indexes, or write throughput. Read replicas help reads, not writes. Sharding (horizontal partitioning) splits the rows themselves across several machines."
  - title: Split by key range
    text: "Pick a shard key, here the user id, and give each shard a contiguous range: S1 holds ids 1–1M, S2 1M–2M, S3 2M–3M. A small routing table maps ranges to shards. Range queries are cheap: ids 1,000 to 2,000 live on one shard."
  - title: The hot shard
    text: "Ids grow with every signup, so every new user lands on S3. New users are also the most active, so S3 takes nearly all the writes while S1 and S2 sit idle. Adding machines does not help; the load follows the key, not the hardware."
  - title: Split by hash instead
    text: "Now route by hash(id) % 3. Consecutive ids scatter, so S1 might hold 1, 5, 9 and S2 2, 4, 7, and writes spread evenly. The price: a query for ids 1,000 to 2,000 must ask every shard and merge the answers (scatter-gather)."
  - title: Add a shard, and most rows move
    text: "When three shards fill up, add S4 and switch to hash % 4. A row stays put only if hash % 3 equals hash % 4, which is true for 1 hash in 4, so about 75 % of rows must move between machines. Consistent hashing, or many small virtual shards mapped to machines, cuts this to about a quarter."
keyIdeas:
  - "The **shard key** is the decision: high cardinality, even access, and present in your main queries."
  - "**Range** sharding keeps order (cheap range scans) but invites hot spots; **hash** sharding spreads load but loses order."
  - "**Cross-shard** joins, transactions and unique constraints are expensive — design so the common queries hit one shard."
  - "**Resharding** with `hash % N` moves most rows; plan for it with consistent hashing or many logical shards."
  - "Hashing balances **keys**, not **traffic**: one celebrity key still lands on one shard."
quiz:
  - q: "An orders table is range-sharded on created_at. What goes wrong?"
    options: ["Range queries by date become slow", "All new inserts go to the newest shard, which runs hot", "Rows are spread too evenly", "Lookups by order id become impossible"]
    answer: 1
    why: "Every new order has the latest timestamp, so it lands in the last range. One shard takes the full write load while the others are idle."
  - q: "You hash-shard users on user_id across 8 shards. Which query is now the most expensive?"
    options: ["Get user 42", "Update user 42's email", "Find all users who signed up last week", "Delete user 42"]
    answer: 2
    why: "Lookups by user_id hash to exactly one shard. 'Signed up last week' does not include the shard key, so it must be sent to all 8 shards and the results merged."
  - q: "Going from 3 to 4 shards with hash(key) % N, roughly what fraction of rows move?"
    options: ["About 25 %", "About 33 %", "About 75 %", "100 %"]
    answer: 2
    why: "A row stays only if hash % 3 equals hash % 4, which happens for 3 out of every 12 hash values (0, 1, 2), so 1/4 stay and 3/4 move."
bigO:
  - { op: "rows moved, hash % N, 3 → 4 shards", avg: "~75 %" }
  - { op: "rows moved, consistent hashing", avg: "~1/N", note: "only the new shard's slice" }
  - { op: "range query, range sharding", avg: "1 shard", note: "or a few neighbours" }
  - { op: "range query, hash sharding", avg: "all shards", note: "scatter-gather" }
bigOTitle: "Key numbers"
related: [sysdesign/consistent-hashing, sysdesign/replication, sysdesign/horizontal-vs-vertical-scaling, sysdesign/two-phase-commit-vs-sagas]
prereqs: [dsa/hash-tables, sysdesign/consistent-hashing]
flashcards:
  - kind: qa
    q: "Why does range sharding on an auto-increment id or timestamp create a hot shard?"
    a: "New keys are always the largest, so every insert lands in the last range; one shard takes all the writes while the others idle."
  - kind: cloze
    text: "Hash sharding spreads writes evenly but turns a range query into a {{scatter-gather}} across {{every shard}}."
  - kind: qa
    q: "Hash sharding still has one hot shard: a celebrity account gets 1,000× normal traffic. Why, and what helps?"
    a: "Hashing spreads keys, not load per key; one key always lives on one shard. Cache that key aggressively, replicate it for reads, or split it into sub-keys (key#1…key#n)."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Sharding section, redrawn" }
---

## Why shard

A single database server has fixed limits: disk size, the RAM that keeps indexes fast, and how many writes per second it can commit. **Vertical scaling** (a bigger machine) postpones the problem. **Read replicas** (copies that serve reads) help read-heavy loads, but every write still goes to one primary. When data or write volume outgrows one machine, you **shard**: split the rows of a table across several independent databases, each called a **shard** (or partition). Each shard holds a subset of rows and handles reads and writes for only those rows.

## How it works

1. Choose a **shard key**: the column that decides where a row lives, such as `user_id`.
2. Choose a **partitioning function** from key to shard: by range or by hash.
3. Route every query through a **router** (a library in the app, a proxy, or the database itself) that applies the function and sends the query to the right shard.
4. Keep the mapping (ranges or hash ring) somewhere every router can read, often a small configuration service.

### Range vs hash

| | Range sharding | Hash sharding |
|---|---|---|
| Rule | `1–1M → S1, 1M–2M → S2, …` | `shard = hash(key) % N` (or a hash ring) |
| Range scans | One or few shards | Every shard |
| Load balance | Depends on key distribution; sequential keys create hot spots | Even, if the hash is good |
| Splitting a full shard | Easy: split one range in two | Hard with `% N`; easy with consistent hashing |

A common middle ground is a **compound key**: hash on `user_id` to pick the shard, then keep that user's rows sorted by time inside the shard. "All of user 42's orders this month" then hits one shard and reads them in order.

## Worked example

Users table, 3 M rows, 3 shards, key `user_id`.

- **Range:** S1 = 1–1M, S2 = 1M–2M, S3 = 2M–3M. `GET user 1,500,000` → S2. `users 1,000–2,000` → S1 only. But user 3,000,001 signs up → S3, and so does every later user: S3 becomes the **hot shard**.
- **Hash:** `shard = hash(user_id) % 3`. Ids 1, 2, 3 might land on S1, S2, S3; new signups spread evenly. `users 1,000–2,000` must query all three shards and merge.
- **Resharding:** add S4 and change to `% 4`. For a hash value `h`, the row stays only if `h % 3 == h % 4`, true for `h % 12` in {0, 1, 2}: 3 values in 12. So **75 % of rows move**. With consistent hashing only about 1/4 move — just those that now belong to S4.

## In code

```python
import hashlib

def stable_hash(s: str) -> int:          # same answer on every machine, every run
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)

SHARDS = ["db-0", "db-1", "db-2", "db-3"]
LOGICAL = 1024                          # many logical shards, fixed forever
placement = {i: SHARDS[i % len(SHARDS)] for i in range(LOGICAL)}

def logical_shard(user_id: int) -> int:
    return stable_hash(str(user_id)) % LOGICAL   # never changes

def db_for(user_id: int) -> str:
    return placement[logical_shard(user_id)]     # change this map to rebalance

# Adding a machine = move some logical shards and update `placement`.
# No row is ever rehashed; whole logical shards are copied.
```

## Edge cases and pitfalls

- **Hot keys:** one celebrity user or viral product gets most of the traffic. Hashing does not help, because a single key always maps to one shard. Cache it, replicate it for reads, or split it into sub-keys.
- **Cross-shard queries:** a join between users on S1 and orders on S3 must happen in the application. Choose shard keys so related rows live together (shard orders by `user_id` too).
- **Transactions across shards** need two-phase commit or sagas; both are slower and more complex than a local transaction.
- **Global unique constraints** (unique email) cannot be checked on one shard; use a separate lookup table or a globally unique id scheme.
- **Rebalancing is live surgery:** you copy data while it is being written. Typical approach: copy, then catch up from the change log, then switch routing for that range.

## When to use it

Shard only when you must. Indexes, caching, read replicas and a bigger machine are all simpler. When you do shard, pick the key from your access patterns: the key should appear in nearly every hot query and spread writes evenly.

## In the interview

You will be asked to "scale the database". A strong answer names the **shard key** and checks it against the top queries and the write pattern, chooses **range or hash** with a reason, mentions the **hot shard** risk and **resharding** plan (consistent hashing or logical shards), and says what becomes hard (cross-shard joins and transactions). Expect the follow-up "one user is 1,000× hotter than others — now what?"
