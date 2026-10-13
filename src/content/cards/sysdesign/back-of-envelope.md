---
title: Back-of-the-Envelope Estimation
track: sysdesign
tags: [estimation, latency, capacity, interview]
difficulty: 1
minutes: 5
tldr: "Know a handful of latency numbers by order of magnitude, round a day to 10^5 seconds, and multiply your way from daily users to QPS, storage and bandwidth in under two minutes."
analogy: "Like planning a road trip by knowing 'motorway ≈ 100 km/h, city ≈ 30 km/h': you never need the exact minute, only whether it is two hours or two days — that decides whether you drive or fly."
diagram: back-of-envelope
story:
  - title: A ladder of powers of ten
    text: "Draw time on a log scale: every tick is ten times slower than the one before, from one nanosecond to one second. On this scale only the order of magnitude matters — 2× differences vanish, 1000× differences jump out. That is exactly the precision a design needs."
  - title: Inside one machine
    text: "Reading main memory takes about 100 ns. A random read from an SSD takes about 100 µs — a thousand times slower. A spinning-disk seek takes about 10 ms, a hundred times slower again. This is why caches live in RAM and why random I/O on spinning disks is avoided."
  - title: Leaving the machine
    text: "A round trip to another server in the same data centre costs about 0.5 ms — cheaper than a disk seek. Crossing an ocean costs roughly 70–150 ms (New York–London ~70, US–Asia 150 or more), because light in fibre only goes about 200,000 km/s. A user far away pays that on every round trip, so you count round trips."
  - title: Users per day → requests per second
    text: "A photo app has 10 million daily active users who each view 100 photos: 1 billion views a day. A day has 86,400 seconds; round it to 10^5. So 10^9 ÷ 10^5 = 10,000 requests per second on average. Traffic is bursty, so plan for a peak of 2–3×, about 30,000."
  - title: Uploads → storage per year
    text: "If one user in five uploads one 2 MB photo a day, that is 2 million photos and 4 TB a day. Times 365 is about 1.5 PB a year, and keeping three copies makes it about 4.4 PB. That single number tells you the photos belong in object storage, not in a database."
keyIdeas:
  - "**Memory ≈ 100 ns, SSD random read ≈ 100 µs, same-DC round trip ≈ 0.5 ms, disk seek ≈ 10 ms, across an ocean ≈ 70–150 ms.** Learn the order, not the digits."
  - "**1 day ≈ 10^5 s** (really 86,400). So 1 M requests/day ≈ 12 QPS and 1 B/day ≈ 12 k QPS. Peak ≈ 2–3× average."
  - "**Powers of two:** 2^10 ≈ a thousand (KB), 2^20 ≈ a million (MB), 2^30 ≈ a billion (GB), 2^40 ≈ a trillion (TB)."
  - "Estimate **reads, writes, storage and bandwidth separately** — they lead to different components."
  - "Round hard and say your assumptions out loud; the point is the order of magnitude, not the third digit."
quiz:
  - q: "A service gets 50 million requests a day. Roughly what is its average QPS?"
    options: ["About 50", "About 500", "About 5,000", "About 50,000"]
    answer: 1
    why: "5 × 10^7 requests ÷ 10^5 seconds ≈ 500 QPS (exactly 50,000,000 / 86,400 ≈ 579). Then multiply by 2–3 for the peak."
  - q: "Which is fastest?"
    options: ["One random SSD read", "One round trip inside the same data centre", "One spinning-disk seek", "One round trip from Europe to the US"]
    answer: 0
    why: "SSD random read ≈ 100 µs, same-DC round trip ≈ 500 µs, disk seek ≈ 10 ms, transatlantic round trip ≈ 70–150 ms depending on the cities."
  - q: "2 million photos a day at 2 MB each, kept for a year. About how much raw storage is that before replication?"
    options: ["About 1.5 TB", "About 150 TB", "About 1.5 PB", "About 15 PB"]
    answer: 2
    why: "2 × 10^6 × 2 × 10^6 bytes = 4 × 10^12 B = 4 TB per day. 4 TB × 365 ≈ 1,460 TB ≈ 1.5 PB. Three replicas make it ≈ 4.4 PB."
  - q: "Why do estimates round 86,400 seconds up to 100,000?"
    options: ["Because a day really has 100,000 seconds", "Because dividing by a power of ten is easy and the ~14 % error does not change any decision", "Because servers count time in decimal", "Because peak traffic is exactly 16 % higher"]
    answer: 1
    why: "The rounding makes the arithmetic a shift of the decimal point. It understates QPS by about 14 %, which is noise next to the 2–3× peak factor and your guesses about user behaviour."
bigO:
  - { op: "main memory read", avg: "~100 ns" }
  - { op: "SSD random read (4 KB)", avg: "~100 µs", note: "~1000× memory" }
  - { op: "round trip, same data centre", avg: "~0.5 ms" }
  - { op: "spinning-disk seek", avg: "~10 ms" }
  - { op: "round trip across an ocean", avg: "~70–150 ms", note: "NY–London ~70, US–Asia 150+; bounded by light in fibre" }
  - { op: "seconds per day", avg: "86,400 ≈ 10^5", note: "1 M/day ≈ 12 per second" }
bigOTitle: "Key numbers"
related: [sysdesign/client-server-basics, sysdesign/blob-storage, sysdesign/caching, sysdesign/design-url-shortener]
prereqs: []
flashcards:
  - kind: qa
    q: "How do you turn 'N requests per day' into QPS in your head?"
    a: "Divide by 10^5 (a day is 86,400 s). 1 M/day ≈ 10 QPS, 1 B/day ≈ 10 k QPS. Then multiply by 2–3 for the peak."
  - kind: cloze
    text: "A main-memory read takes about {{100 ns}}; a random SSD read takes about {{100 µs}}."
  - kind: qa
    q: "Why is a cross-continent round trip at least ~100 ms no matter how fast your servers are?"
    a: "Light in fibre travels about 200,000 km/s. A 10,000 km path is ~50 ms one way, ~100 ms round trip, before any routing or processing."
  - kind: cloze
    text: "2^30 bytes is about one {{gigabyte}}, and 2^40 bytes is about one {{terabyte}}."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Back-of-the-envelope calculations and latency numbers, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why estimate at all

Before you choose a database, a cache or a number of servers, you need to know **how big the problem is**. Is it 10 requests a second or 100,000? 10 GB of data or 10 PB? Those answers pick the architecture: 10 GB fits in one machine's RAM, 10 PB needs a distributed object store. A **back-of-the-envelope estimate** is a quick calculation with deliberately rounded numbers that tells you the *order of magnitude* — the power of ten — and nothing more precise. That is enough to rule designs in or out.

## The numbers to carry in your head

Latency is the time one operation takes. Learn these as rough powers of ten; real hardware varies by 2–5×, which never changes the conclusions.

| Operation | Rough time | Compared with RAM |
|---|---|---|
| CPU L1 cache reference | ~1 ns | 100× faster |
| Main memory (RAM) read | ~100 ns | 1× |
| Send 1 KB over a 1 Gbps link | ~10 µs | 100× |
| SSD random read (4 KB) | ~100 µs | 1,000× |
| Round trip inside one data centre | ~0.5 ms | 5,000× |
| Spinning-disk (HDD) seek | ~10 ms | 100,000× |
| Round trip across a continent or ocean | ~70–150 ms | ~1,000,000× |

Three lessons fall straight out of the table:

1. **Memory is king.** A RAM read is ~1000× faster than an SSD read, which is why caches such as Redis keep data in memory.
2. **The network inside a data centre is cheap**, cheaper than one disk seek. Calling another service nearby is fine; calling it 50 times in a row is not (50 × 0.5 ms = 25 ms).
3. **Distance is physics.** Light in optical fibre travels at about 200,000 km/s (two thirds of its speed in vacuum). New York to London is ~5,600 km, so the round trip can never beat ~56 ms, and real routes are 70–80 ms. You fix this only by moving data closer to users (CDNs, regional replicas), never with faster code.

### Units and powers of two

| Power | Exact | Approximation | Unit |
|---|---|---|---|
| 2^10 | 1,024 | a thousand (10^3) | KB |
| 2^20 | 1,048,576 | a million (10^6) | MB |
| 2^30 | ~1.07 × 10^9 | a billion (10^9) | GB |
| 2^40 | ~1.1 × 10^12 | a trillion (10^12) | TB |
| 2^50 | ~1.13 × 10^15 | a quadrillion (10^15) | PB |

Also useful: a day is 86,400 s ≈ **10^5 s**, a month ≈ 2.6 × 10^6 s, a year ≈ 3.15 × 10^7 s. A network link is quoted in **bits** per second: 1 Gbps = 125 MB/s.

## How it works

Every estimate follows the same chain:

1. **State assumptions**: daily active users (DAU), actions per user per day, read/write ratio, object sizes, retention.
2. **Traffic**: requests per day ÷ 10^5 = average QPS (queries per second). Multiply by 2–3 for the **peak**, since traffic follows the sun.
3. **Storage**: new objects per day × size × days kept × replication factor.
4. **Bandwidth**: QPS × bytes per response (egress) and upload rate × upload size (ingress).
5. **Sanity check**: does any number force a design choice? (One machine, many machines, a cache, a CDN?)

## Worked example: a photo-sharing app

Assumptions, said out loud: 10 M DAU; each user views 100 photos a day; one user in five uploads one photo a day; an original photo is 2 MB; a feed-sized version is 200 KB; metadata per photo is 1 KB; keep everything for a year; three replicas.

| Quantity | Calculation | Result |
|---|---|---|
| Views per day | 10^7 × 100 | 10^9 |
| Read QPS (avg) | 10^9 ÷ 10^5 | ~10,000 (exact: ~11,600) |
| Read QPS (peak) | × 3 | ~30,000 |
| Uploads per day | 10^7 × 0.2 | 2 × 10^6 |
| Write QPS (avg) | 2 × 10^6 ÷ 10^5 | ~20 |
| Photo storage per day | 2 × 10^6 × 2 MB | 4 TB |
| Photo storage per year | 4 TB × 365 | ~1.5 PB (×3 replicas ≈ 4.4 PB) |
| Metadata per year | 2 × 10^6 × 1 KB × 365 | ~730 GB |
| Egress bandwidth (avg) | 10^4 × 200 KB | 2 GB/s = 16 Gbps |
| Ingress bandwidth (avg) | 20 × 2 MB | 40 MB/s = 320 Mbps |

What the numbers say:

- Reads outnumber writes **500 to 1**. Optimise the read path: caching, a CDN, pre-resized images.
- **Photos (PB) and metadata (GB) are different worlds.** Photos go to object storage like S3; metadata fits a single, replicated relational database for years.
- **16 Gbps average, ~50 Gbps peak** of image traffic is why you serve images from a CDN, and why you never send the 2 MB original to a phone: that would be 10× the bandwidth.

## Implement it in Python

The idea is language-independent; here it is in Python.

```python
DAY = 10**5                         # 86,400 s, rounded

def estimate(dau, views_per_user, upload_ratio, photo_mb, thumb_kb, replicas=3):
    views = dau * views_per_user
    read_qps = views / DAY
    uploads = dau * upload_ratio
    tb_per_day = uploads * photo_mb / 10**6          # MB -> TB
    return {
        "read_qps_avg": read_qps,
        "read_qps_peak": 3 * read_qps,                # traffic is bursty
        "write_qps_avg": uploads / DAY,
        "storage_pb_per_year": tb_per_day * 365 * replicas / 1000,
        "egress_gbps": read_qps * thumb_kb * 8 / 10**6,  # KB/s -> Gbit/s
    }

print(estimate(10_000_000, 100, 0.2, 2, 200))
# read 10k avg / 30k peak, 20 writes/s, ~4.4 PB/yr, ~16 Gbps
```

## Edge cases and pitfalls

- **Bits versus bytes.** Bandwidth is in bits; storage is in bytes. Forgetting the factor of 8 is the most common slip.
- **Average versus peak.** Servers must survive the peak, not the average. Social apps see 2–3× swings over a day, and events (a match final, New Year) can be 10×.
- **Forgetting replication and overhead.** Three replicas triple storage; indexes, thumbnails and backups add more.
- **False precision.** Writing "11,574.07 QPS" signals that you missed the point. Say "about 10 k, call it 12 k".
- **Mixing up units of time.** 1 ms = 1000 µs = 1,000,000 ns. Slipping a factor of 1000 is easy on a whiteboard; write the unit next to every number.

## In the interview

Estimation is usually step two of a design interview, right after clarifying requirements. A strong answer: states assumptions first, splits **read and write** traffic, gives **average and peak** QPS, storage per year **with replication**, and bandwidth — then says what each number implies ("1.5 PB a year means object storage", "30 k reads a second means a cache and a CDN"). Spend two to three minutes, not ten. Expect a follow-up like *"How many servers?"*: state an assumed per-server capacity (for example, "a stateless app server handles ~1,000–5,000 simple requests a second") and divide, then add headroom for failures.
