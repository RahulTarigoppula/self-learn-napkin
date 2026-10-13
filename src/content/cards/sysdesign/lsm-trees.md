---
title: LSM-Trees
track: sysdesign
tags: [databases, storage, write-heavy]
difficulty: 3
minutes: 5
tldr: "Buffer writes in a sorted in-memory table, flush it to disk as an immutable sorted file, and merge those files in the background. Writes become sequential and fast; reads may check several files."
analogy: "An office inbox: new papers go on a tray on your desk (memtable). When the tray is full you file the whole stack as one sorted folder. Every so often you merge folders and bin the out-of-date copies (compaction)."
diagram: lsm-trees
story:
  - title: Write, append to the WAL and insert in the memtable
    text: "put(dog, 7) does two cheap things. It appends the record to the write-ahead log on disk, so a crash cannot lose it, and inserts it into the memtable, a sorted structure in memory. Nothing on disk is modified in place, so no random disk writes happen."
  - title: Flush, the memtable becomes a sorted SSTable
    text: "When the memtable reaches a size limit (64 MB by default in RocksDB), it is written out in one sequential pass as an SSTable: an immutable file of key-value pairs sorted by key. A fresh memtable takes over and the old WAL segment can be deleted. Over time level L0 collects several SSTables."
  - title: Read, newest first, bloom filters skip files
    text: "get(cat) checks the memtable, then SSTables from newest to oldest, because the newest value wins. Each SSTable has a bloom filter: SST 3's says 'definitely not here', so it is skipped without a disk read. SST 2's says 'maybe', and its sorted index finds cat:5. SST 1 is never touched."
  - title: Compaction, merge and keep the newest
    text: "Overlapping files make reads slower and waste space: dog appears three times. Compaction merge-sorts SSTables into a new one, keeping only the newest version of each key and dropping deleted ones. Like merge sort, it reads and writes sequentially. The three dogs become dog:7."
  - title: Levels, each about 10× bigger
    text: "Leveled compaction keeps each level about 10× the size of the one above, split into non-overlapping files, so a read needs at most one file per level. Size-tiered compaction instead merges several similar-sized files at once: fewer rewrites, but more overlap and more space."
keyIdeas:
  - "**Write path**: WAL append + memtable insert. All disk writes are sequential: log appends, flushes and compaction."
  - "**SSTables are immutable** and sorted; updates and deletes (tombstones) are just newer entries."
  - "**Read path**: memtable, then newest to oldest SSTable; **bloom filters** skip files that cannot contain the key."
  - "**Compaction** merges files: **leveled** favours reads and space, **size-tiered** favours write throughput."
  - "Tune the three amplifications: **write** (bytes rewritten), **read** (files checked), **space** (stale copies kept)."
  - "Used by RocksDB, LevelDB, Cassandra, ScyllaDB, HBase and Bigtable. **B-trees** favour reads; **LSM-trees** favour writes."
quiz:
  - q: "Why are LSM-tree writes fast compared with a B-tree's?"
    options: ["They skip durability", "They turn random in-place page updates into sequential appends and flushes", "They never write to disk", "They use bigger pages"]
    answer: 1
    why: "A B-tree updates the page that holds the key, a random write of a whole page. An LSM-tree appends to the WAL and buffers in memory, then writes large sorted files sequentially, which disks and SSDs handle far better."
  - q: "A key was deleted yesterday, but an old SSTable still holds its value. Why does get() correctly return 'not found'?"
    options: ["Deletes rewrite every SSTable immediately", "The delete wrote a newer tombstone, and reads stop at the newest entry", "Bloom filters remove deleted keys", "The WAL is checked last"]
    answer: 1
    why: "A delete is a write of a special marker, a tombstone. Reads scan newest to oldest and stop at the first entry, which is the tombstone. Compaction later drops both the tombstone and the old value."
  - q: "Which compaction strategy usually gives lower write amplification but higher space amplification?"
    options: ["Leveled", "Size-tiered", "Neither, they are identical", "No compaction at all has the lowest of both"]
    answer: 1
    why: "Size-tiered merges groups of similar-sized files, so each byte is rewritten fewer times. But several overlapping copies of a key can coexist, and a big merge needs free space for its output, so disk usage can temporarily double."
  - q: "Bloom filters on SSTables speed up which kind of read the most?"
    options: ["Range scans", "Lookups of keys that do not exist", "Full table scans", "Reads from the memtable"]
    answer: 1
    why: "For a missing key, every SSTable would otherwise need an index probe. The filter answers 'definitely not here' from memory for almost all of them. Range scans cannot use a per-key filter."
bigO:
  - { op: "write", avg: "O(log m) in memory + WAL append", note: "m = memtable entries" }
  - { op: "point read (leveled)", avg: "≤ 1 SSTable per level", note: "plus each L0 file; bloom filters skip most" }
  - { op: "memtable size", avg: "64 MB", note: "RocksDB default write buffer" }
  - { op: "bloom filter", avg: "10 bits/key ≈ 1 % false positives" }
  - { op: "level size ratio", avg: "≈ 10×", note: "leveled: ~90 % of data in the last level, space amp ≈ 1.1" }
bigOTitle: "Complexity and key numbers"
related: [sysdesign/indexes-and-b-trees, sysdesign/bloom-filters, sysdesign/write-ahead-log, sysdesign/sql-vs-nosql]
prereqs: [sysdesign/indexes-and-b-trees]
flashcards:
  - kind: qa
    q: "What are the three amplifications an LSM-tree trades off?"
    a: "Write amplification (bytes written to disk per byte the app wrote, from compaction rewrites), read amplification (files or pages checked per read) and space amplification (disk used per byte of live data, from stale copies)."
  - kind: cloze
    text: "An LSM write goes to the {{write-ahead log}} for durability and the {{memtable}} for sorting, then is flushed to an immutable {{SSTable}}."
  - kind: qa
    q: "When would you choose an LSM-tree store over a B-tree store?"
    a: "For write-heavy workloads (logs, metrics, messages, event streams) where sequential writes and good compression matter more than the lowest read latency. Choose a B-tree for read-heavy, range-heavy or latency-sensitive transactional workloads."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem LSM-trees solve

A B-tree index updates data **in place**: to change one 100-byte row it reads the page that holds it, modifies it and later writes the whole page (8–16 KB) back, plus a log record. Under a heavy stream of inserts to random keys, that is a stream of random page writes. Disks are much better at large **sequential** writes, and SSDs also wear less and run faster when writes are sequential and batched.

A **log-structured merge-tree (LSM-tree)** never modifies anything in place. It buffers writes in memory, writes them out as large sorted files, and merges files in the background. The name says it: log-structured (append-only), merge (files are combined like merge sort).

## How it works

### The write path

1. **Append to the write-ahead log (WAL).** The record goes to the end of a log file. Once it is flushed to disk, the write survives a crash.
2. **Insert into the memtable**, an in-memory sorted structure (RocksDB and LevelDB use a skip list). The write is now acknowledged.
3. **Flush.** When the memtable fills up, it is frozen, a new empty memtable takes its place, and the frozen one is written to disk in key order as an **SSTable** (sorted string table). Its WAL segment is no longer needed.

Updates are just newer entries for the same key. **Deletes** write a **tombstone**, a marker meaning "this key is gone", because the old value sits in an immutable file that cannot be edited.

### What is in an SSTable

An SSTable is immutable and sorted. It is made of **data blocks** (about 4 KB each), an **index block** with the first key of each data block (so one binary search finds the right block), and a **bloom filter** over all its keys. The index and filter are small enough to keep in memory, so checking an SSTable costs at most one block read, and often zero.

### The read path

A point lookup checks, in order: the active memtable, any frozen memtables, then the SSTables from **newest to oldest**. The first entry found wins; if it is a tombstone, the answer is "not found". Before probing an SSTable, the reader asks its **bloom filter**: "definitely not here" skips the file; "maybe" means probe the index and read one block. With 10 bits per key, the filter wrongly says "maybe" about 1 % of the time.

Range scans open an iterator on the memtable and every relevant SSTable and **merge** them in key order, again letting newer entries hide older ones. Bloom filters do not help here.

### Compaction

Without cleanup, files pile up: reads get slower (more files to check) and space is wasted (stale versions and tombstones). **Compaction** picks some SSTables, merge-sorts them, keeps only the newest version of each key, drops tombstones once nothing older could be hiding beneath them, and writes new SSTables. Two main strategies:

| | Size-tiered | Leveled |
|---|---|---|
| How | when several SSTables of similar size exist (often 4), merge them into one bigger file | level L*n*+1 is ~10× L*n*; each level is non-overlapping files; push files down by merging with the overlapping ones below |
| Write amplification | lower (each byte rewritten about once per tier) | higher (often 10–30×: each level rewrite touches ~10× its size) |
| Read amplification | higher: a key may be in one file per tier | lower: at most one file per level (plus L0) |
| Space amplification | high: overlapping copies; a big merge needs as much free space as its inputs | low: ~90 % of data sits in the last level, so about 1.1× |
| Typical default | Cassandra and ScyllaDB (long-standing defaults) | RocksDB, LevelDB |

## Worked example

Start empty, memtable limit 2 keys.

1. `put(bee, 3)`, `put(dog, 2)` → memtable full → flush **SST 1** = `bee:3 dog:2`.
2. `put(cat, 5)`, `put(dog, 4)` → flush **SST 2** = `cat:5 dog:4`.
3. `put(ant, 1)`, `put(dog, 7)` → flush **SST 3** = `ant:1 dog:7`.
4. `get(dog)`: memtable empty → SST 3 filter "maybe" → found `dog:7`. Stops; never looks at older dogs.
5. `get(cat)`: SST 3 filter "no" → skip; SST 2 "maybe" → `cat:5`. One block read.
6. `get(fox)`: all three filters probably say "no" → zero disk reads.
7. Compact SST 1–3 → `ant:1 bee:3 cat:5 dog:7`. Two stale dogs gone; the next `get` checks one file.

## Implement it in Python

The idea is language-independent; here it is in Python, as a toy in-memory model of the moving parts.

```python
import bisect

TOMBSTONE = object()

class SSTable:                                   # immutable, sorted
    def __init__(self, items):                   # items: sorted list of (key, value)
        self.keys = [k for k, _ in items]
        self.vals = [v for _, v in items]
        self.filter = set(self.keys)             # stand-in for a bloom filter
    def get(self, key):
        if key not in self.filter:               # "definitely not here"
            return None
        i = bisect.bisect_left(self.keys, key)
        return self.vals[i] if i < len(self.keys) and self.keys[i] == key else None

class LSM:
    def __init__(self, limit=2):
        self.wal, self.mem, self.tables, self.limit = [], {}, [], limit  # tables: newest first
    def put(self, key, value):
        self.wal.append((key, value))            # 1. log first (fsync in a real system)
        self.mem[key] = value                    # 2. then the memtable
        if len(self.mem) >= self.limit:          # 3. flush as a sorted, immutable file
            self.tables.insert(0, SSTable(sorted(self.mem.items(), key=lambda kv: kv[0])))
            self.wal, self.mem = [], {}
    def delete(self, key):
        self.put(key, TOMBSTONE)
    def get(self, key):
        for v in [self.mem.get(key)] + [t.get(key) for t in self.tables]:  # newest first
            if v is not None:
                return None if v is TOMBSTONE else v
        return None
    def compact(self):                           # full merge: safe to drop tombstones
        merged = {}
        for t in reversed(self.tables):          # oldest first, newer overwrite
            merged.update(zip(t.keys, t.vals))
        self.tables = [SSTable(sorted((k, v) for k, v in merged.items() if v is not TOMBSTONE))]
```

(The `get` here probes every table eagerly for brevity; a real one stops at the first hit.)

## Trade-offs: LSM-tree vs B-tree

| | B-tree | LSM-tree |
|---|---|---|
| Write pattern | random, in place, page-sized | sequential, batched |
| Write throughput | good | higher, especially for random keys |
| Point read | one root-to-leaf path, predictable | memtable + possibly several files; bloom filters help |
| Range scan | walk linked leaves | merge iterators over several files |
| Space | pages often 50–70 % full after splits | compact files, compress well; stale copies until compaction |
| Latency | steady | background compaction can cause spikes and stalls |

Rule of thumb: write-heavy, append-mostly data (metrics, logs, messages, time series, event stores) suits LSM-trees; read-heavy transactional workloads with many range queries suit B-trees. Many systems use both (MyRocks puts MySQL on RocksDB).

## Edge cases and pitfalls

- **Write stalls.** If compaction cannot keep up with incoming writes, L0 files pile up and the engine throttles or stops writes. Provision disk bandwidth for compaction, not just for the application.
- **Tombstone build-up.** Deleting many keys (or using a store as a queue) leaves tombstones that every scan must skip until compaction removes them. In Cassandra they are also kept for a grace period (`gc_grace_seconds`, 10 days by default) so deletes reach every replica.
- **Read amplification on misses** without bloom filters: a lookup for a missing key would probe every level.

## In the interview

When a design has a firehose of writes (chat messages, clickstreams, IoT readings), say "I would use an LSM-based store such as Cassandra or RocksDB because writes become sequential appends", then show you know the cost: reads may touch several SSTables (mitigated by bloom filters and leveled compaction) and compaction consumes background I/O. Expect "what happens on a crash?" (replay the WAL into a new memtable), "how is a delete done?" (a tombstone, removed by compaction) and "leveled or size-tiered?" (read- and space-sensitive → leveled; write-heavy → size-tiered).
