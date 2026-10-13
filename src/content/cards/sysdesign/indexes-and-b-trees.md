---
title: Indexes and B-Trees
track: sysdesign
tags: [databases, indexing, storage]
difficulty: 2
minutes: 5
tldr: "An index is a sorted copy of some columns that points back to the rows. Databases store it as a B+tree: wide pages, so 3–4 page reads find one row among millions instead of scanning them all."
analogy: "A thick book's index: to find 'quorum' you jump to Q, then the right column, then the page number. You never read the whole book, but every new edition means updating the index too."
diagram: indexes-and-b-trees
story:
  - title: "No index: scan every page"
    text: "A table's rows sit in pages on disk in no useful order. To answer WHERE id = 142 without an index, the database must read every page and check every row. With 10 million rows that is gigabytes of reading for one row: O(n)."
  - title: "A B+tree: sorted pages, many keys each"
    text: "An index keeps the key column sorted in a tree of fixed-size pages (8 or 16 KB). Inner pages hold only separator keys and child pointers. Leaves, in green, hold every key with a pointer to its row, and each leaf links to its neighbour. The drawing shows 2 keys per page; real pages hold hundreds."
  - title: "Lookup: root, inner page, leaf"
    text: "Find 142: at the root, 142 < 300, so take the first child. There, 100 ≤ 142 < 200, so take the middle child. That leaf holds 100–199 and contains 142 with a pointer to its row. Three page reads plus one for the row, and the top levels are usually already cached in memory."
  - title: "Fan-out: why 3–4 levels are enough"
    text: "Each page has around 100 or more children, its fan-out. One root points at 100 pages, those at 10,000 leaves, and 10,000 leaves × 100 keys is a million keys in three levels. A fourth level gives 100 million. Height grows as log base 100 of n, so it barely grows at all."
  - title: "Range scan: walk the linked leaves"
    text: "For id BETWEEN 150 AND 250, descend once to the leaf holding 150, then read sideways along the leaf links until a key passes 250. Because leaves are sorted and linked, ranges, ORDER BY and prefix matches are cheap. A hash index could not do this."
  - title: "Writes: pages split, every index pays"
    text: "Inserting 143 into a full leaf splits it into 100–149 and 150–199, and the parent gains separator key 150. Every insert, delete or update of an indexed column must update each index on the table, so five indexes can mean several extra page writes per row."
keyIdeas:
  - "**B+tree**: inner pages hold separator keys; leaves hold all entries and are **linked** for range scans."
  - "**High fan-out** (hundreds of keys per page) keeps height at 3–4, so a lookup is a handful of page reads, mostly cached."
  - "**Composite index (a, b, c)** follows the **leftmost-prefix rule**: it helps queries on a, a+b or a+b+c, not on b alone."
  - "**Covering index**: if the index holds every column the query needs, the database never touches the table."
  - "Indexes **speed reads and slow writes**: each one is another tree to update, and costs disk and memory."
quiz:
  - q: "A table has an index on (country, city, signup_date). Which query can use it to seek directly?"
    options: ["WHERE city = 'Leeds'", "WHERE signup_date > '2024-01-01'", "WHERE country = 'UK' AND city = 'Leeds'", "WHERE city = 'Leeds' AND signup_date > '2024-01-01'"]
    answer: 2
    why: "Entries are sorted by country first, then city within a country. A query must constrain a leftmost prefix (country, then city) to jump to one contiguous range. Without country, matching cities are scattered across the whole index."
  - q: "A B+tree has a fan-out of 200 and 3 levels of inner pages above the leaves. Roughly how many leaf pages can it address?"
    options: ["600", "40,000", "8,000,000", "200 billion"]
    answer: 2
    why: "Each level multiplies by the fan-out: 200 × 200 × 200 = 8,000,000 leaves. With ~200 entries per leaf that is over a billion keys, found with 4 page reads."
  - q: "Why are leaves in a B+tree linked to each other?"
    options: ["So inserts can split pages without locking the parent node", "So range scans can walk to the next keys without climbing the tree", "So each row is stored twice, once per leaf, for crash safety", "So lookups of a single key can skip the root and start at a leaf"]
    answer: 1
    why: "After one descent to the start of a range, the scan follows sibling pointers leaf to leaf in key order. That makes BETWEEN, ORDER BY and LIMIT queries cheap."
  - q: "SELECT email FROM users WHERE id = 7 runs on an index on (id) INCLUDE (email). What is special about this plan?"
    options: ["It needs a full table scan, since email is not a key column", "It is an index-only scan: the index alone covers the query", "It must sort the results, because INCLUDE columns are unordered", "It cannot use the index, because INCLUDE columns block lookups"]
    answer: 1
    why: "The index leaf already stores email next to id, so the database answers from the index without fetching the row. That saves one random read per row."
bigO:
  - { op: "lookup by key", avg: "O(log n)", note: "3–4 page reads for millions to billions of rows" }
  - { op: "range scan of k rows", avg: "O(log n + k)", note: "one descent, then walk leaves" }
  - { op: "insert / delete", avg: "O(log n) per index", note: "plus occasional page split or merge" }
  - { op: "full table scan", avg: "O(n)", note: "10 M rows × 200 B ≈ 2 GB to read" }
  - { op: "page size", avg: "8 KB (PostgreSQL), 16 KB (InnoDB)", note: "fan-out in the hundreds" }
bigOTitle: "Complexity and key numbers"
related: [sysdesign/lsm-trees, sysdesign/sql-vs-nosql, dsa/balanced-trees, sysdesign/search-indexing]
prereqs: [dsa/binary-search-trees]
flashcards:
  - kind: qa
    q: "Why does a database use a B+tree rather than a binary search tree on disk?"
    a: "Disk and SSD read whole pages. A B+tree packs hundreds of keys into each page, so the tree is only 3–4 levels deep and a lookup costs a few page reads; a binary tree would need about 20 levels, each a separate read, for a million keys."
  - kind: cloze
    text: "A composite index on (a, b) helps WHERE a = ? and WHERE a = ? AND b = ?, but not WHERE b = ?: the {{leftmost-prefix}} rule."
  - kind: qa
    q: "What does every extra index cost?"
    a: "Each insert, delete or update of an indexed column must also update that index's tree (extra writes, possible page splits), and the index takes disk space and buffer-cache memory."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "B-trees chapter" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Database indexes, RDBMS section" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why a full scan is slow

A table is stored as **pages**: fixed-size blocks (8 KB in PostgreSQL, 16 KB in MySQL's InnoDB) that the database reads and writes as a unit. Rows land in pages roughly in insertion order, so nothing about the layout helps you find `id = 142`. Without an index the only option is a **sequential scan**: read every page, test every row.

For 10 million rows of 200 bytes that is about 2 GB. Even at 1–2 GB/s from a fast SSD, that is around a second per query, and it evicts useful pages from memory. With an index the same lookup is 3–4 page reads, most of them already cached: well under a millisecond.

## How a B+tree is built

An **index** is a separate structure that keeps the values of one or more columns **sorted**, each paired with a pointer to its row. Almost every relational database stores it as a **B+tree**:

- **Pages are nodes.** Each node is one page and holds many keys, often hundreds. The number of children per node is the **fan-out**.
- **Inner nodes** hold only separator keys and child pointers. A node with keys `[100 | 200]` has three children: keys below 100, keys from 100 to 199, keys from 200 up.
- **Leaves** hold every key with its row pointer (or the row itself, see below), sorted, and each leaf points to the next one.
- **Balanced.** Every leaf is at the same depth. Inserts that overflow a page **split** it in half and push a separator key up; if the root splits, the tree grows one level taller.

A plain **B-tree** (no "+") also stores entries in inner nodes. The B+tree's choice to keep inner nodes key-only means more keys fit per page (higher fan-out, shorter tree), and all data sits in a linked, sorted bottom row that is perfect for range scans.

### The fan-out arithmetic

Height is about log base *fan-out* of *n*. With fan-out 100:

| Levels | Leaves | Keys (100 per leaf) |
|---|---|---|
| 2 | 100 | 10,000 |
| 3 | 10,000 | 1,000,000 |
| 4 | 1,000,000 | 100,000,000 |

Real fan-outs for small keys are in the hundreds, so four levels cover billions of rows. The root and inner levels are small and hot, so they stay in the buffer cache; a cold lookup usually costs one or two actual disk reads.

## Worked example: lookups, ranges and composite keys

**Point lookup** `WHERE id = 142`: root `[300 | 600]` → 142 < 300 → first child `[100 | 200]` → 100 ≤ 142 < 200 → middle child, the leaf holding 100–199 → binary search inside the page finds 142 → follow the pointer to the row.

**Range** `WHERE id BETWEEN 150 AND 250 ORDER BY id`: descend once to the leaf containing 150, then follow leaf links, emitting rows in order, and stop at the first key above 250. Cost O(log n + k) for k results, and no sort needed.

**Composite index** on `(last_name, first_name)`: entries are sorted by last name, and by first name only *within* each last name, like a phone book.

| Query | Uses the index? |
|---|---|
| `WHERE last_name = 'Shah'` | yes, one contiguous range |
| `WHERE last_name = 'Shah' AND first_name = 'Ana'` | yes, a narrower range |
| `WHERE last_name LIKE 'Sh%'` | yes, a prefix is a range |
| `WHERE first_name = 'Ana'` | no seek: Anas are scattered across every last name (a *skip scan* can help when last names are few) |

This is the **leftmost-prefix rule**. Put equality columns first and the range column last: for `WHERE status = 'paid' AND created_at > ?`, index `(status, created_at)`, not `(created_at, status)`.

**Covering index**: if the query only needs columns stored in the index, the database answers from the index alone (an **index-only scan**) and skips the row fetch. PostgreSQL lets you add payload columns with `CREATE INDEX … (id) INCLUDE (email)`.

## Clustered vs secondary indexes

- In **InnoDB**, the table *is* a B+tree on the primary key: leaves hold whole rows (a **clustered index**). Secondary index leaves hold the primary key, so a secondary lookup is two tree descents. A short, increasing primary key keeps every secondary index small and inserts appending at the right edge.
- In **PostgreSQL**, rows live in an unordered heap and every index, including the primary key's, points at a row's physical location.

## Implement it in Python

The idea is language-independent; here it is in Python, with each page modelled as a node holding sorted keys.

```python
from bisect import bisect_left, bisect_right

class Inner:
    def __init__(self, keys, children):
        self.keys, self.children = keys, children     # len(children) == len(keys) + 1

class Leaf:
    def __init__(self, keys, rows, next_leaf=None):
        self.keys, self.rows, self.next = keys, rows, next_leaf

def find_leaf(node, key):
    while isinstance(node, Inner):                    # one page read per level
        node = node.children[bisect_right(node.keys, key)]   # keys[i-1] <= key < keys[i]
    return node

def lookup(root, key):
    leaf = find_leaf(root, key)
    i = bisect_left(leaf.keys, key)
    return leaf.rows[i] if i < len(leaf.keys) and leaf.keys[i] == key else None

def range_scan(root, lo, hi):
    leaf = find_leaf(root, lo)
    i = bisect_left(leaf.keys, lo)
    while leaf:                                       # walk sideways via sibling links
        while i < len(leaf.keys):
            if leaf.keys[i] > hi:
                return
            yield leaf.keys[i], leaf.rows[i]
            i += 1
        leaf, i = leaf.next, 0
```

## The write cost

Every index is a second (third, fourth …) copy of some data that must stay in sync. An `INSERT` into a table with five indexes updates six trees. Each update dirties a page, may split it, and is logged in the write-ahead log. Random keys such as UUIDv4 make it worse: every insert lands on a random leaf, so many different pages are dirtied and pages end up half-full after splits. Time-ordered keys (auto-increment, UUIDv7) append at the right edge instead.

## Edge cases and pitfalls

- **Functions hide the column.** `WHERE LOWER(email) = ?` cannot use an index on `email`; create an expression index on `LOWER(email)`. The same goes for implicit type casts.
- **Leading wildcards** (`LIKE '%son'`) cannot seek; there is no prefix to start from.
- **Low selectivity.** If a query matches a large fraction of the table (say `WHERE active = true` for 90 % of rows), random row fetches cost more than one sequential scan, and the planner rightly ignores the index.
- **Too many indexes** slow writes and crowd the cache. Drop unused ones; check with the database's index-usage statistics.
- **Check, do not guess.** `EXPLAIN ANALYZE` shows whether a query used an index seek, an index-only scan or a sequential scan.

## In the interview

When you define a table in a design, name its indexes and the queries they serve: "messages indexed on `(conversation_id, created_at)` so 'latest 50 in a conversation' is one descent plus a short leaf walk". Expect "why B+tree and not a hash index?" (ranges and ordering; hash indexes only do equality), "what does an index cost?" (write amplification, space), and "B-tree vs LSM-tree?" (B-trees update pages in place and favour reads; LSM-trees batch writes sequentially and favour write-heavy loads).
