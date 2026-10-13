---
title: Bloom Filters
track: sysdesign
tags: [probabilistic, hashing, caching, storage]
difficulty: 2
minutes: 4
tldr: "A bit array plus k hash functions that answers 'is x in the set?' with 'definitely not' or 'maybe'. About 10 bits per item gives 1 % false positives, and there are never false negatives."
analogy: "A nightclub bouncer with a list of initials, not names. If your initials are missing, you are definitely not on the guest list. If they are there, you might be, so he checks the full list."
diagram: bloom-filters
griddle: bloom-filter
story:
  - title: A bit array, all zeros
    text: "A Bloom filter is an array of m bits, all starting at 0, plus k independent hash functions that each map an item to a position in the array. Here m = 16 and k = 3. It stores no items, only bits, which is why it is so small."
  - title: "Add cat: set its three bits"
    text: "To add 'cat', hash it with all three functions: positions 1, 4 and 8. Set those bits to 1. That is the whole insert: k hash computations and k bit writes, O(k) no matter how many items are already in the set."
  - title: "Add dog: bits can be shared"
    text: "Adding 'dog' hashes to 8, 11 and 14. Bit 8 is already 1 from cat, so it stays 1. Items share bits, which keeps the filter compact but means you can never tell which item set a bit. That is why plain Bloom filters cannot delete."
  - title: "Query emu: a zero means definitely not"
    text: "Is 'emu' in the set? Its hashes are 1, 2 and 4. Bits 1 and 4 are set, but bit 2 is 0. Had emu been added, bit 2 would be 1, so emu is definitely not in the set. No false negatives, ever. This is the answer that saves work."
  - title: "Query fox: all ones, never added"
    text: "'fox' hashes to 4, 11 and 14. Bit 4 was set by cat, bits 11 and 14 by dog. The filter must say 'maybe', yet fox was never added: a false positive. The caller then checks the real data store. Errors only go one way, so the filter can save work but never gives a wrong 'no'."
  - title: How often it lies
    text: "After n inserts, a bit is still 0 with probability about e^(−kn/m), so a false positive happens with probability (1 − e^(−kn/m))^k. Here, with 2 items in 16 bits, that is about 3 %. The best k is (m/n)·ln 2; with 10 bits per item that is k = 7 and about 1 % false positives."
keyIdeas:
  - "**Answers**: 'definitely not' (some bit is 0) or 'maybe' (all k bits are 1). **No false negatives.**"
  - "**False-positive rate** ≈ (1 − e^(−kn/m))^k; optimal **k = (m/n)·ln 2**, which leaves about half the bits set."
  - "**Sizing**: m/n ≈ 1.44·log₂(1/p) bits per item: ~9.6 bits for 1 %, ~14.4 bits for 0.1 %, whatever the item size."
  - "**No deletes**: clearing a bit could erase other items. Counting Bloom filters use small counters instead of bits."
  - "**Uses**: skip SSTables in LSM-trees, avoid caching one-hit wonders in CDNs, avoid disk or network lookups for missing keys."
quiz:
  - q: "A Bloom filter says 'not present' for key x. What do you know?"
    options: ["x is definitely not in the set", "x is probably not in the set", "x was deleted", "Nothing; the filter can be wrong both ways"]
    answer: 0
    why: "Adding x would have set all k of its bits to 1, and bits are never cleared. If any of them is 0, x was never added. Only 'present' answers can be wrong."
  - q: "You expect 1 million keys and want a 1 % false-positive rate. About how much memory does the filter need?"
    options: ["About 12 KB", "About 1.2 MB", "About 120 MB", "It depends on the key length"]
    answer: 1
    why: "Bits per key ≈ 1.44 · log₂(100) ≈ 9.6, so 1,000,000 × 9.6 ≈ 9.6 million bits ≈ 1.2 MB, with k ≈ 7 hash functions. The size does not depend on how long the keys are."
  - q: "Why can't you remove an item from a standard Bloom filter by clearing its k bits?"
    options: ["Clearing bits is too slow", "Other items may share those bits, so you would create false negatives", "Hash functions cannot be reversed", "Bits can only be cleared in pairs"]
    answer: 1
    why: "In the example, cat and dog both set bit 8. Removing cat by clearing bit 8 would make the filter answer 'definitely not' for dog, breaking the one guarantee it has. Counting Bloom filters keep a counter per position so deletes are safe."
  - q: "A filter has m = 16 bits and k = 3. After adding more and more items, what happens to its false-positive rate?"
    options: ["It stays at 3 %", "It rises towards 100 % as the bits fill with 1s", "It falls, because more bits are set", "It depends only on k, not on how many items were added"]
    answer: 1
    why: "Each insert sets more bits. As the fraction of 1s grows, a random query is more likely to find all k of its bits set. When every bit is 1 the filter says 'maybe' to everything. Size the filter for the expected n."
bigO:
  - { op: "add", avg: "O(k)", note: "k hashes, k bit writes" }
  - { op: "query", avg: "O(k)", note: "stops at the first 0 bit" }
  - { op: "space for 1 % false positives", avg: "≈ 9.6 bits/item", note: "k = 7" }
  - { op: "space for 0.1 % false positives", avg: "≈ 14.4 bits/item", note: "k = 10" }
  - { op: "1 M items at 1 %", avg: "≈ 1.2 MB" }
bigOTitle: "Complexity and key numbers"
related: [sysdesign/lsm-trees, dsa/hash-tables, sysdesign/caching, sysdesign/dns-and-cdns]
prereqs: [dsa/hash-tables]
flashcards:
  - kind: qa
    q: "What are the two possible answers from a Bloom filter, and which one can be wrong?"
    a: "'Definitely not in the set' (some bit is 0), which is always correct, and 'maybe in the set' (all k bits are 1), which can be a false positive."
  - kind: cloze
    text: "False-positive rate ≈ {{(1 − e^(−kn/m))^k}}, minimised when k = {{(m/n)·ln 2}}."
  - kind: qa
    q: "Why does an LSM-tree keep a Bloom filter per SSTable?"
    a: "A point lookup would otherwise probe every SSTable's index on disk. The in-memory filter rules out almost every file that does not hold the key, so a read usually touches only the one file that does."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

Many systems spend most of their time confirming that something is **not** there. A database checks several files for a key that exists in only one. A CDN wonders whether a URL has been requested before. A crawler wants to know whether it has visited a page. An exact set (a hash table of every key) answers perfectly but can cost gigabytes. A **Bloom filter** (Burton Bloom, 1970) answers in a few bits per item by allowing one kind of mistake: it may say "maybe" for an item that was never added.

## How it works

- **State:** an array of **m** bits, all 0, and **k** hash functions h₁ … hₖ, each mapping an item to a position 0 … m−1.
- **Add(x):** set bits h₁(x), …, hₖ(x) to 1.
- **Query(x):** look at the same k bits. If **any** is 0, x was never added: "**definitely not**". If **all** are 1, answer "**maybe**": either x was added, or other items happened to set all of x's bits.

Both operations are O(k), independent of how many items are stored. In practice the k positions come from two hashes using **double hashing**, gᵢ(x) = h₁(x) + i·h₂(x) mod m, which is as good as k independent hashes for this purpose.

## Why the formula looks like that

After inserting **n** items with **k** hashes each, the filter has done kn bit-sets at (roughly) random positions. The chance that one particular bit was never hit is

(1 − 1/m)^(kn) ≈ e^(−kn/m).

A query for an item that was never added is a false positive when all k of its bits happen to be 1:

**p ≈ (1 − e^(−kn/m))^k**

Two forces pull on k. More hash functions mean more bits must all be 1 for a false positive (good), but also fill the array faster (bad). The minimum is at

**k = (m/n) · ln 2**,

which leaves about half the bits set. Plugging it back in gives p ≈ 0.6185^(m/n), or, solved for size, **m/n ≈ 1.44 · log₂(1/p)** bits per item.

| Target false-positive rate | Bits per item | Best k |
|---|---|---|
| 10 % | 4.8 | 3 |
| 1 % | 9.6 | 7 |
| 0.1 % | 14.4 | 10 |
| 0.01 % | 19.2 | 13 |

Each extra ~4.8 bits per item cuts the error rate by 10×, and the item's own size does not matter: a filter over 1 million 200-byte URLs at 1 % takes about 1.2 MB instead of 200 MB.

## Worked example

m = 16, k = 3 (the drawing). Add `cat` → bits 1, 4, 8. Add `dog` → bits 8, 11, 14 (8 was already set). Now 5 of 16 bits are 1.

| Query | Bits checked | Values | Answer | Truth |
|---|---|---|---|---|
| `cat` | 1, 4, 8 | 1, 1, 1 | maybe | present |
| `emu` | 1, 2, 4 | 1, **0**, 1 | definitely not | absent |
| `fox` | 4, 11, 14 | 1, 1, 1 | maybe | **absent: false positive** |

No single item set all of fox's bits: cat set bit 4, dog set 11 and 14. That is how false positives arise: the bits of *several* items, between them, happen to cover a new key.

The formula predicts p ≈ (1 − e^(−3·2/16))³ = (1 − 0.687)³ ≈ 3 % for a random query. (Direct check: 5 of 16 bits are set, and (5/16)³ ≈ 3 %.)

## Implement it in Python

The idea is language-independent; Python is used here only as compact, readable notation.

```python
import hashlib, math

class BloomFilter:
    def __init__(self, n: int, p: float):
        self.m = math.ceil(-n * math.log(p) / math.log(2) ** 2)   # bits needed
        self.k = max(1, round(self.m / n * math.log(2)))          # optimal hash count
        self.bits = bytearray((self.m + 7) // 8)

    def _positions(self, item: str):
        d = hashlib.sha256(item.encode()).digest()
        h1 = int.from_bytes(d[:8], "big")
        h2 = int.from_bytes(d[8:16], "big") | 1
        return [(h1 + i * h2) % self.m for i in range(self.k)]    # double hashing

    def add(self, item: str) -> None:
        for pos in self._positions(item):
            self.bits[pos // 8] |= 1 << (pos % 8)

    def might_contain(self, item: str) -> bool:                   # False = definitely not
        return all(self.bits[pos // 8] >> (pos % 8) & 1 for pos in self._positions(item))

bf = BloomFilter(n=1_000_000, p=0.01)     # m ≈ 9.6 M bits (1.2 MB), k = 7
```

## Where it is used

- **LSM-tree storage engines** (RocksDB, LevelDB, Cassandra, HBase) keep a filter per SSTable in memory. A point lookup skips every file whose filter says "definitely not", so reading a missing key costs almost no disk I/O. Cassandra exposes this as `bloom_filter_fp_chance` per table.
- **CDNs and caches**: Akamai found that about three-quarters of objects were requested only once ("one-hit wonders"). Caching an object only on its second request, detected with a Bloom filter of recently seen URLs, keeps those out of the cache and frees space for objects that will be reused.
- **Avoiding expensive lookups**: check a username or email against a filter before querying the database; skip a remote shard that certainly lacks a key; avoid recrawling URLs.
- **Joins in distributed databases**: send a small filter of join keys to the other side so it ships only rows that might match.

## Variants

- **Counting Bloom filter**: each position is a small counter (typically 4 bits) instead of a bit; add increments, delete decrements. Supports deletes at about 4× the space, and a counter that overflows makes deletes unsafe.
- **Scalable Bloom filter**: when one fills up, add a new, larger filter with a tighter error rate and query all of them.
- **Cuckoo filters** and **quotient filters** support deletion and can be smaller than Bloom filters at low error rates.

## Edge cases and pitfalls

- **Size for the real n.** Inserting more items than planned silently raises the error rate; at 2× the planned n, a filter sized for 1 % gives roughly 16 %.
- **Hash quality matters.** Correlated or weak hashes cluster bits and raise the false-positive rate. Use a good non-cryptographic hash (MurmurHash, xxHash) with double hashing.
- **Not for "is it present?" decisions.** A Bloom filter can only safely skip work. Anything it says "maybe" to must be checked against the real data.
- **Cannot list or count items.** It stores no keys, only bits.

## In the interview

Reach for a Bloom filter when the design does lots of lookups for keys that are usually absent and each lookup is expensive (disk, network). State the guarantee precisely ("no false negatives, tunable false positives"), size it on the spot (10 bits per item for 1 %), and say what happens on "maybe" (fall through to the real lookup). Expect follow-ups: "how do you delete?" (counting Bloom filter, or rebuild periodically) and "what if the set keeps growing?" (rebuild with a larger m, or a scalable Bloom filter).
