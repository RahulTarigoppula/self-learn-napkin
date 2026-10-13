---
title: Unique ID Generation
track: sysdesign
tags: [ids, sharding, distributed, databases]
difficulty: 2
minutes: 5
tldr: "Many machines must mint unique IDs without talking. Random UUIDs work but do not sort; Snowflake packs time, machine and a counter into 64 bits: unique and roughly time-ordered."
analogy: "A ticket stamped with the date, the booth number and the booth's own running count. Two booths never print the same ticket, nobody phones a central office, and sorting tickets by number sorts them by time."
diagram: unique-id-generation
story:
  - title: Auto-increment per shard collides
    text: "One database hands out 1, 2, 3… easily. Split orders across two shards and each keeps its own counter: both issue order 101, and the two orders now clash wherever they meet. One central counter avoids that, but every insert then waits on one machine."
  - title: "UUIDv4: 122 random bits"
    text: "A version 4 UUID is 128 bits, 122 of them random. Any machine can make one with no coordination, and duplicates are absurdly unlikely: you would need about 2.7 × 10^18 of them for a 50 % chance of one clash. But they are 16 bytes and in random order."
  - title: "Snowflake: time | machine | sequence"
    text: "Twitter's Snowflake fits an ID in a 64-bit integer: a sign bit kept at 0, 41 bits of milliseconds since a chosen epoch, 10 bits of machine id, and a 12-bit counter for IDs made in the same millisecond. Each machine works alone."
  - title: What the bit budget buys
    text: "2^41 milliseconds is about 69.7 years before the timestamp runs out. 2^10 gives 1,024 machines. 2^12 gives 4,096 IDs per millisecond per machine, about 4 million per second; if the counter runs out, the generator waits for the next millisecond."
  - title: "UUIDv7 / ULID: time first, so IDs sort"
    text: "Putting the timestamp in the high bits makes IDs sort by creation time. UUIDv7 and ULID do it in 128 bits: a 48-bit millisecond timestamp followed by random bits. New rows land at the end of a B-tree index instead of on random pages."
  - title: "Clock goes backwards: wait, do not reuse"
    text: "Time-based IDs trust the clock. If NTP steps it back from 105 ms to 100 ms, the generator could reuse timestamps it has already used and mint duplicates. A safe generator remembers the last timestamp and refuses to issue IDs until the clock catches up again."
keyIdeas:
  - "**Auto-increment** needs one counter: a bottleneck and single point of failure, and per-shard counters collide unless given offsets."
  - "**UUIDv4**: 122 random bits, no coordination, ~2.7 × 10^18 IDs for a 50 % chance of a collision. Downsides: 16 bytes and random order, which hurts B-tree inserts."
  - "**Snowflake**: 1 + 41 + 10 + 12 = 64 bits. **4,096 IDs/ms/machine**, **1,024 machines**, **~69.7 years**. Fits a BIGINT and sorts by time."
  - "**UUIDv7 / ULID**: 48-bit ms timestamp + randomness. Sortable, standard 128-bit, no machine ids to assign."
  - "Time-based schemes must handle **clock steps backwards** and need **unique machine ids**; otherwise they silently duplicate."
quiz:
  - q: "A Snowflake generator has 12 sequence bits. How many IDs can one machine issue per second at most?"
    options: ["4,096 in total, one per sequence value", "About 4.1 million, 4,096 per millisecond", "About 1 million, about 1,000 per millisecond", "2^64, one for every value of the full ID"]
    answer: 1
    why: "2^12 = 4,096 IDs per millisecond × 1,000 ms ≈ 4.1 million per second. When the counter wraps within one millisecond, the generator waits for the next one."
  - q: "Why are random UUIDv4 primary keys slow to insert into a large B-tree index?"
    options: ["They are too long to hash, so each insert spends time hashing keys", "Each new key lands on a random leaf page, causing cache misses and splits", "B-trees cannot store 128-bit values, so each key is split in two", "They need a central counter, so every insert waits on one lock"]
    answer: 1
    why: "Ordered keys always append near the right edge, which stays in memory. Random keys touch pages everywhere, so with an index bigger than RAM almost every insert reads a page from disk and splits pages that stay half empty."
  - q: "An NTP correction moves a Snowflake server's clock back by 20 ms. What should the generator do?"
    options: ["Keep going; the sequence number alone keeps the IDs unique", "Wait or refuse until the clock passes the last timestamp it used", "Switch permanently to a new machine id, then carry on as before", "Subtract 20 ms from every future ID so they stay in order"]
    answer: 1
    why: "The same (timestamp, machine) pairs would come round again with sequence numbers restarting from 0, producing duplicates. Remembering the last timestamp and waiting is the standard fix."
bigO:
  - { op: "Snowflake layout", avg: "1 + 41 + 10 + 12 bits", note: "sign, ms timestamp, machine, sequence" }
  - { op: "ids per machine", avg: "4,096 per ms", note: "≈ 4.1 million per second" }
  - { op: "timestamp lifetime", avg: "2^41 ms ≈ 69.7 years", note: "from the custom epoch" }
  - { op: "UUIDv4 50 % collision", avg: "≈ 2.7 × 10^18 ids", note: "birthday bound on 122 random bits" }
  - { op: "UUIDv7 / ULID", avg: "48-bit ms time + 74 / 80 random bits", note: "128 bits, time-sortable" }
bigOTitle: "Key numbers"
related: [sysdesign/sharding, sysdesign/indexes-and-b-trees, sysdesign/design-url-shortener, sysdesign/idempotency]
prereqs: [sysdesign/sharding]
flashcards:
  - kind: qa
    q: "Lay out a Snowflake ID."
    a: "64 bits: 1 unused sign bit, 41 bits of milliseconds since a custom epoch (~69.7 years), 10 bits of machine id (1,024 machines), 12 bits of sequence (4,096 IDs per ms per machine)."
  - kind: cloze
    text: "UUIDv4 has {{122}} random bits; UUIDv7 puts a {{48-bit millisecond timestamp}} first so IDs sort by time."
  - kind: qa
    q: "What can make a time-based ID generator produce duplicates?"
    a: "The clock moving backwards (NTP step, VM restore) or two generators configured with the same machine id."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "ID generation in the design exercises, background" }
---

## Why IDs get hard

Every row, message, order and upload needs an identifier that is **unique** forever. In a single database, `AUTO_INCREMENT` (or a `SERIAL` / identity column) solves it: one counter, protected by one lock. Distributed systems break that:

- **Sharding:** each shard has its own counter, so shard A and shard B both issue `101`. The moment rows from both meet (a merged report, a cache, a URL) they clash.
- **One central counter** avoids collisions but every insert in the company waits on one machine: a throughput ceiling and a single point of failure.
- **Leaks:** sequential IDs reveal business volume (order 10,452 today, 10,980 tomorrow) and are trivially guessable in URLs.

What we usually want from an ID scheme: unique without coordination, compact (64 bits fits a `BIGINT` and a CPU register), **roughly sortable by time** (so the newest rows are easy to find and indexes stay efficient), and fast to make.

## UUIDv4: random

A UUID is 128 bits, written as 32 hex digits such as `3f6c1a9e-04d2-4b7e-9c51-d8a2e07f6b13`. Version 4 fixes 6 bits (the `4` marks the version, and the first digit of the fourth group is 8, 9, a or b for the variant) and fills the other **122 bits at random**.

**How unlikely is a collision?** By the birthday bound, with n IDs the chance of any clash is about n² / (2 × 2¹²²). It reaches 50 % at n ≈ 2.7 × 10¹⁸. Generating a billion per second, that takes about 86 years. For a trillion (10¹²) IDs the probability is about 10⁻¹³. In practice the risk comes from a broken random number generator (for example a cloned VM reusing its seed), not from the maths.

The costs: 16 bytes per key instead of 8, ugly in URLs, and **no order**. That last point matters for databases: in a B-tree index, random keys land on random leaf pages. Once the index is bigger than memory, inserts cause constant page reads and page splits. Time-ordered keys append to the right-most page, which stays hot in cache.

## Snowflake: time, machine, sequence

Twitter's Snowflake (2010) packs an ID into a signed 64-bit integer:

| Bits | Field | Range |
|---|---|---|
| 1 | sign, always 0 | keeps the ID positive |
| 41 | milliseconds since a custom epoch | 2⁴¹ ms ≈ 69.7 years |
| 10 | machine id (Twitter split it 5 datacentre + 5 worker) | 1,024 generators |
| 12 | sequence within the millisecond | 4,096 IDs per ms per machine |

### How it works

1. Read the current time in milliseconds and subtract the custom epoch (a recent date, so the 69.7 years start when you launch, not in 1970).
2. If it is the same millisecond as the previous ID, increment the sequence; if the sequence wraps past 4,095, **spin until the next millisecond**. If it is a new millisecond, reset the sequence to 0.
3. If the clock is *earlier* than the last timestamp used, **refuse** (or wait) rather than risk reusing a (time, machine, sequence) triple.
4. Combine: `(ms << 22) | (machine << 12) | sequence`. The shift is 22 because 10 + 12 bits sit below the timestamp.

Because the timestamp occupies the high bits, sorting IDs numerically sorts them by creation time. Across machines the order is only as good as clock synchronisation (usually within a few milliseconds), so they are called **k-sortable**: roughly, not strictly, ordered.

### Worked example

Machine 7 issues its fourth ID (sequence 3) at exactly 1,000,000,000 ms (about 11.6 days) after the epoch:

- timestamp part: 1,000,000,000 × 2²² = 4,194,304,000,000,000
- machine part: 7 × 2¹² = 28,672
- sequence part: 3

ID = **4,194,304,000,028,675**. Decoding reverses it: `id >> 22` = 1,000,000,000 ms, `(id >> 12) & 1023` = 7, `id & 4095` = 3. You can read a Snowflake ID's creation time without any lookup.

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation.

```python
import threading, time

EPOCH_MS = 1_288_834_974_657                 # Twitter's custom epoch, 4 Nov 2010

class Snowflake:
    def __init__(self, machine_id: int):
        assert 0 <= machine_id < 1024          # must fit in 10 bits, unique per generator
        self.machine_id, self.last_ms, self.seq = machine_id, -1, 0
        self.lock = threading.Lock()

    def next_id(self) -> int:
        with self.lock:
            now = int(time.time() * 1000)
            if now < self.last_ms:               # clock stepped backwards: never reuse time
                raise RuntimeError(f"clock moved back {self.last_ms - now} ms")
            if now == self.last_ms:
                self.seq = (self.seq + 1) & 0xFFF    # 12-bit counter, 0..4095
                if self.seq == 0:                    # 4,096 used this ms: wait for the next
                    while now <= self.last_ms:
                        now = int(time.time() * 1000)
            else:
                self.seq = 0
            self.last_ms = now
            return ((now - EPOCH_MS) << 22) | (self.machine_id << 12) | self.seq
```

## UUIDv7 and ULID: sortable 128-bit IDs

**UUIDv7** (standardised in RFC 9562, 2024) keeps the UUID format but puts a **48-bit Unix timestamp in milliseconds** first, then the version and variant bits, then 74 random bits. **ULID** is the same idea: 48 bits of time plus 80 random bits, written as 26 base-32 characters. Both sort by time, need no machine ids (randomness replaces the machine and sequence fields), and work anywhere a UUID column is expected. The cost is 16 bytes instead of 8. Within one millisecond, the order of IDs from different machines is random.

## Ticket servers and block allocation

Another approach keeps a central counter but makes it cheap. Flickr ran two MySQL **ticket servers**, one handing out odd numbers and one even (`auto_increment_increment = 2` with offsets 1 and 2), so either could fail without stopping ID generation. Going further, each app server can **reserve a block** (say 1,000 IDs) in one round trip and hand them out from memory; a crash just wastes the rest of its block. IDs stay compact and nearly sequential, at the price of running and replicating that counter service.

## Edge cases and pitfalls

- **Clock skew:** NTP corrections, VM pauses and restores can move the clock backwards. Snowflake refuses to issue IDs until time catches up; configure NTP to slew (adjust gradually) rather than step.
- **Duplicate machine ids** are the other way to duplicate IDs. Assign them from a coordinator (ZooKeeper, etcd) or the deployment system, never by hand.
- **JavaScript numbers** are exact only up to 2⁵³; recent Snowflake IDs are around 2⁶⁰. Send 64-bit IDs to browsers as strings.
- **Do not expose sequential IDs** where guessing matters (invoice URLs); time-based IDs also reveal creation time.
- **Running out:** the 41-bit timestamp ends 69.7 years after your epoch; pick the epoch as your launch date.

## Trade-offs

| Scheme | Size | Sortable | Coordination | Main risk |
|---|---|---|---|---|
| Auto-increment | 8 B | strictly | one database | bottleneck, single point of failure |
| Ticket server + blocks | 8 B | nearly | small central service | the service itself |
| UUIDv4 | 16 B | no | none | random index inserts |
| Snowflake | 8 B | roughly | machine ids only | clock steps, duplicate machine ids |
| UUIDv7 / ULID | 16 B | roughly | none | 16 bytes; order within a ms |

## In the interview

Comes up in URL shorteners, chat messages, tweets and order systems: *"how do you generate IDs across many servers?"* Present the options in the table, pick Snowflake (or UUIDv7 if 128 bits is fine), state the bit arithmetic (4,096 per ms per machine, 1,024 machines, ~69 years), and pre-empt the follow-ups: clock going backwards, assigning machine ids, and sequence overflow within a millisecond.
