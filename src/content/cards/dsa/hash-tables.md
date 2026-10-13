---
title: Hash Tables
track: dsa
tags: [hashing, collisions, arrays]
difficulty: 2
minutes: 4
tldr: "A hash table keeps key–value pairs in an array: hashing a key gives its index, so lookups are O(1) on average. Collisions happen; not letting the table get too full keeps it fast."
analogy: "A cloakroom with numbered hooks: a rule turns your name into a hook number, so the attendant walks straight to it. When two coats share a hook they hang one over the other, and when the hooks get crowded the cloakroom moves to a bigger room."
diagram: hash-chaining
story:
  - title: An array of buckets
    text: "A hash table is an ordinary array, here with 8 buckets numbered 0 to 7. Arrays give O(1) access by index, so all we need is a way to turn any key, like the string \"cat\", into an index."
  - title: Hash, then take the remainder
    text: "A hash function turns the key into a number; say hash(\"cat\") = 35 (real hashes are much bigger). 35 mod 8 = 3 (the remainder of 35 ÷ 8), so cat goes in bucket 3. dog hashes to 14, and 14 mod 8 = 6. Looking a key up repeats the same arithmetic, so we go straight to its bucket."
  - title: Collisions are normal
    text: "emu hashes to 27, and 27 mod 8 is also 3. With more possible keys than buckets, collisions are guaranteed. Separate chaining keeps a small list in each bucket: cat → emu. A lookup for emu goes to bucket 3, then walks the chain comparing keys."
  - title: Load factor
    text: "After ant, owl and yak, six keys share eight buckets. The load factor is keys ÷ buckets = 0.75, and that ratio (not n) sets the average chain length. Keep it bounded and every operation stays O(1) on average, however many keys you store."
  - title: Double and rehash
    text: "Many tables (Java's HashMap, for example) resize once the load factor would pass 0.75. The next insert doubles the array to 16 buckets and re-hashes every key with mod 16. emu moves to bucket 11 and the chain disappears. That copy is O(n), but it is rare enough to average out to O(1) per insert."
keyIdeas:
  - "**index = hash(key) mod buckets**: one arithmetic step takes you straight to the only bucket that can hold the key."
  - "**Collisions are unavoidable**, and likely even in a sparse table (23 keys in 365 buckets already collide more than half the time). Chaining keeps a list per bucket; open addressing probes for another slot."
  - "**Load factor = keys ÷ buckets** sets the average chain length; keep it bounded and lookups stay O(1) on average."
  - "**Resizing doubles the array and rehashes every key.** That costs O(n) once in a while, which is amortised O(1) per insert."
  - "**Worst case is O(n)**: a bad hash or adversarial keys can pile everything into one bucket."
quiz:
  - q: "A table has 8 buckets. hash(\"fox\") = 43. Which bucket does fox go in?"
    options: ["Bucket 3", "Bucket 5", "Bucket 4", "Bucket 43"]
    answer: 0
    why: "43 mod 8 = 3, because 43 = 5 × 8 + 3. The bucket is the remainder, not the quotient."
  - q: "A chained hash table holds 3,000 keys in 1,000 buckets with a good hash. Roughly how many keys does a lookup compare against?"
    options: ["About 1", "About 3", "About 1,000", "About 3,000"]
    answer: 1
    why: "The load factor is 3,000 ÷ 1,000 = 3, so chains hold about 3 keys on average. That is why tables resize: to pull the load factor back below a limit like 0.75."
  - q: "Why must a growing table rehash every key instead of copying each bucket to the same index?"
    options: ["To remove duplicate keys", "Because the index is hash mod capacity, and the capacity just changed", "Because hash values expire", "To sort the keys"]
    answer: 1
    why: "emu has hash 27: 27 mod 8 = 3 but 27 mod 16 = 11. With the new capacity, many keys belong in different buckets, so each one is recomputed."
bigO:
  - { op: "lookup", best: "O(1)", avg: "O(1)", worst: "O(n)", note: "worst = every key in one bucket" }
  - { op: "insert", avg: "O(1)", worst: "O(n)", note: "amortised over resizes" }
  - { op: "delete", avg: "O(1)", worst: "O(n)" }
  - { op: "space",  avg: "O(n)" }
related: [dsa/arrays-and-pointers, sysdesign/consistent-hashing, dsa/lru-cache]
prereqs: [dsa/arrays-and-pointers]
griddle: hash-chaining
flashcards:
  - kind: qa
    q: "What makes a hash table degrade to O(n) lookups?"
    a: "Collisions piling up in one bucket, because of a poor hash, adversarial keys, or a load factor left too high."
  - kind: cloze
    text: "Java's HashMap resizes when the load factor exceeds {{0.75}}, then rehashes every key."
  - kind: qa
    q: "Why must a hash table rehash every key when it grows, instead of copying buckets across?"
    a: "The bucket index is hash mod capacity, so changing the capacity changes the index. A key in bucket 3 of 8 may belong in bucket 3 or 11 of 16."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Hash tables chapter, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **hash table** (Python `dict`/`set`, Java `HashMap`, C++ `unordered_map`) stores key–value pairs so that looking a key up takes constant time on average. It is built from two ideas:

1. **An array of buckets.** Arrays give O(1) access by index.
2. **A hash function** that turns any key into an integer. The same key must always give the same number, and different keys should spread out evenly. The bucket is then `index = hash(key) mod m` (the remainder after dividing by m), where m is the number of buckets.

To **insert**, compute the index and put the pair in that bucket. To **look up**, compute the same index and look only in that bucket. No other bucket can hold the key, so the rest of the table is never touched.

### Collisions

There are far more possible keys than buckets, so two keys will sometimes land in the same bucket. That is a **collision**. (With just 23 random keys in 365 buckets, the chance of at least one collision is already over 50 %. This is the birthday paradox.) There are two classic ways to cope:

- **Separate chaining**: each bucket holds a small list. Collisions append to the list; a lookup walks it, comparing keys with `==`.
- **Open addressing**: everything lives in the array itself. On a collision, probe the next slot (`index + 1`, `+ 2`, …, called linear probing) until a free one is found. Lookups follow the same probe sequence. Python's `dict` uses a variant of this.

### Load factor and resizing

The **load factor** α = (number of keys) ÷ (number of buckets). With a good hash, the average chain length is α, so a lookup costs about 1 + α steps. If α stays below a fixed limit, that is O(1), however many keys you have.

So tables **resize**: when an insert would push α past the limit (0.75 in Java's `HashMap`), allocate an array twice as big and **rehash** every key into it. That single resize is O(n), but because the capacity doubles each time, resizes get rarer as the table grows, and the total copying for n inserts is under 2n moves: **amortised O(1)** per insert, the same argument as a dynamic array.

## Worked example

Eight buckets, made-up small hash values so the arithmetic is easy to check:

| Key | hash | mod 8 | mod 16 (after resize) |
|---|---|---|---|
| cat | 35 | 3 | 3 |
| dog | 14 | 6 | 14 |
| emu | 27 | **3** (collides with cat) | 11 |
| ant | 16 | 0 | 0 |
| owl | 9 | 1 | 9 |
| yak | 21 | 5 | 5 |

1. cat → bucket 3; dog → bucket 6.
2. emu also → bucket 3. Chaining appends it: bucket 3 holds `cat → emu`. Looking up emu: compute 27 mod 8 = 3, compare with cat (no), compare with emu (yes). Two comparisons.
3. After ant, owl and yak, 6 keys share 8 buckets: α = 0.75.
4. The seventh insert would take α above 0.75, so the table doubles to 16 buckets and recomputes every index with mod 16. emu moves to 11, cat stays at 3, and the collision is gone.

## Implement it in Python

Here is a chained table. `%` is Python's mod, and the built-in `hash()` supplies the hash.

```python
class ChainedMap:
    def __init__(self, capacity=8, max_load=0.75):
        self.buckets = [[] for _ in range(capacity)]
        self.size = 0
        self.max_load = max_load

    def _bucket(self, key):
        return self.buckets[hash(key) % len(self.buckets)]

    def get(self, key, default=None):
        for k, v in self._bucket(key):          # walk the chain
            if k == key:
                return v
        return default

    def put(self, key, value):
        bucket = self._bucket(key)
        for i, (k, _) in enumerate(bucket):
            if k == key:                        # existing key: overwrite, size unchanged
                bucket[i] = (key, value)
                return
        bucket.append((key, value))
        self.size += 1
        if self.size / len(self.buckets) > self.max_load:
            self._resize(2 * len(self.buckets))

    def _resize(self, capacity):
        old = self.buckets
        self.buckets = [[] for _ in range(capacity)]
        for bucket in old:                      # every key gets a fresh index
            for k, v in bucket:
                self._bucket(k).append((k, v))

m = ChainedMap()
for word in ["cat", "dog", "emu", "ant", "owl", "yak", "fox"]:
    m.put(word, len(word))
print(m.get("emu"), len(m.buckets))             # 3 16
```

## Edge cases and pitfalls

- **Hash and equality must agree.** If `a == b` then `hash(a)` must equal `hash(b)`, or a lookup will search the wrong bucket. When you override equality on your own class, override the hash too.
- **Never mutate a key** after inserting it. Its hash changes, so it now sits in the "wrong" bucket and can never be found. That is why Python, for example, refuses lists as dict keys.
- **Adversarial keys.** An attacker who knows your hash function can send thousands of keys that all collide, turning every request into O(n) work (hash flooding). Defences: randomised hash seeds (Python and many others do this for strings) or tree-shaped buckets (Java 8+ turns a long chain into a balanced tree).
- **Deleting with open addressing** cannot just empty a slot, because that would break other keys' probe sequences. Implementations leave a "tombstone" marker instead.
- **Iteration order** is not something to rely on in general (Python's `dict` happens to keep insertion order since 3.7, but a generic hash table does not).

## Trade-offs

| Need | Use |
|---|---|
| Exact-match lookup, insert, delete | Hash table: O(1) average |
| Sorted order, min/max, range queries | Balanced BST or sorted array: O(log n) |
| Guaranteed worst case | Balanced BST: O(log n) worst, never O(n) |

Hash tables also use extra memory for empty buckets and chain pointers, and their scattered layout is less cache-friendly than a sorted array for small sizes.

## In the interview

Hash maps are the most common tool in coding interviews: "have I seen this before?" (duplicates, two-sum on unsorted data), counting frequencies, and grouping (anagrams by sorted letters). Say "O(1) average, O(n) worst" rather than just "O(1)". If asked to design one, cover the hash function, collision strategy, load factor and resizing, and mention that resizing is amortised.
