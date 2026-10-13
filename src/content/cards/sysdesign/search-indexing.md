---
title: Search Indexing
track: sysdesign
tags: [search, indexing, databases, sharding]
difficulty: 2
minutes: 5
tldr: "Full-text search flips documents into an inverted index: each word points to the sorted list of documents containing it. Queries intersect those lists and rank the hits, instead of scanning every row."
analogy: "The index at the back of a textbook. To find every page about 'photosynthesis' you do not reread the book; you look up the word and get the page numbers 12, 47 and 203."
diagram: search-indexing
story:
  - title: Three documents, and the slow way
    text: "Three tiny documents: 1 'Quick red fox', 2 'Lazy brown dog', 3 'Red dog, red ball'. To find 'dog', SQL's LIKE '%dog%' has to read every row and scan its text, because a leading wildcard cannot use a normal index. Fine for 3 rows, hopeless for 100 million."
  - title: "Tokenize: lowercase, split, strip punctuation"
    text: "First the indexer analyses each document into terms. Document 3 becomes red, dog, red, ball: lowercased, split on spaces, commas removed. Real analysers also drop stop words like 'the' and stem 'running' to 'run'. Queries go through the same analyser."
  - title: "Inverted index: term → sorted doc ids"
    text: "Now flip the data. For every term, keep a postings list: the ids of the documents that contain it, sorted. 'dog' → 2, 3 and 'red' → 1, 3. Finding all documents with a word is now one lookup, no matter how many documents exist."
  - title: "red AND dog: intersect two sorted lists"
    text: "For 'red AND dog', fetch both postings lists and walk them with two pointers. 1 < 2, so advance red's pointer; 3 > 2, advance dog's; 3 = 3, a match. Because the lists are sorted this takes O(n + m) steps. The answer is document 3."
  - title: "Rank: term frequency and rarity"
    text: "Matching is not enough; results need an order. Scoring formulas such as TF-IDF and BM25 reward a term that appears often in a document (doc 3 says red twice, so it beats doc 1) and weigh rare terms more: fox, in 1 document, counts about twice as much as red, in 2."
  - title: Shard by document; query every shard
    text: "A big index is split by document: each shard holds some of the documents and a complete index of them. A query goes to every shard, each returns its own top 10, and a coordinator merges them. New documents become searchable at the next refresh, about once a second."
keyIdeas:
  - "**Inverted index:** term → postings list of sorted document ids (often with counts and positions). Built once at write time, so reads skip the scan."
  - "**Analysis** (tokenize, lowercase, stem, drop stop words) must be the same at index time and at query time, or terms will not match."
  - "**AND = intersect sorted lists** in O(n + m); start from the shortest list. **OR = union**."
  - "**BM25** ranks by term frequency with diminishing returns, rarity (IDF), and document length. It is the default in Lucene, Elasticsearch and OpenSearch."
  - "**Shard by document** and scatter-gather queries; writes become visible after a **refresh** (about 1 s), not instantly: search is near-real-time."
quiz:
  - q: "Why does WHERE body LIKE '%dog%' get slow as a table grows, even with a B-tree index on body?"
    options: ["LIKE is not supported on text columns", "A B-tree is ordered by the start of the value, so a leading wildcard cannot use it and every row must be scanned", "The database caches too much", "LIKE only works on the primary key"]
    answer: 1
    why: "A B-tree can find values that start with a prefix, like 'dog%'. '%dog%' can match anywhere, so the database reads and pattern-matches every row: O(N) per query."
  - q: "Postings: cat → 2, 5, 9, 14 and dog → 5, 6, 14, 20. Which documents match cat AND dog?"
    options: ["2, 5, 6, 9, 14, 20", "5 and 14", "Only 14", "5, 9 and 14"]
    answer: 1
    why: "Walk both sorted lists: 2 < 5 advance cat; 5 = 5 match; 9 > 6 advance dog; 9 < 14 advance cat; 14 = 14 match; cat is exhausted. The union (OR) would be the first option."
  - q: "In a document-sharded index with 20 shards, what does a search for 'red' cost?"
    options: ["One shard, chosen by hashing 'red'", "All 20 shards are queried, each returns its top k, and the results are merged", "Only the shard that holds the newest documents", "A full table scan"]
    answer: 1
    why: "Any shard may hold matching documents, so the query fans out to all of them. Writes are cheap (one shard per document); reads pay the scatter-gather, and the slowest shard sets the latency."
bigO:
  - { op: "LIKE '%x%' search", avg: "O(N) rows read", note: "every query scans the table" }
  - { op: "term lookup", avg: "O(log T) or O(1)", note: "T distinct terms in the dictionary" }
  - { op: "AND of two terms", avg: "O(n + m)", note: "n, m = postings list lengths; skip lists make it faster" }
  - { op: "BM25 defaults", avg: "k1 = 1.2, b = 0.75", note: "term-frequency saturation and length normalisation" }
  - { op: "refresh interval", avg: "≈ 1 s", note: "Elasticsearch default; new docs searchable after it" }
bigOTitle: "Key numbers"
related: [sysdesign/indexes-and-b-trees, sysdesign/sharding, sysdesign/lsm-trees, sysdesign/caching]
prereqs: [sysdesign/indexes-and-b-trees]
flashcards:
  - kind: qa
    q: "What is an inverted index?"
    a: "A map from each term to its postings list: the sorted ids of documents that contain it, often with counts and positions. It turns 'which documents contain X?' into a lookup instead of a scan."
  - kind: cloze
    text: "An AND query is answered by {{intersecting}} the terms' sorted postings lists, which takes {{O(n + m)}} with two pointers."
  - kind: qa
    q: "Why is a newly indexed document not instantly searchable in Elasticsearch?"
    a: "New documents sit in an in-memory buffer until a refresh (default every 1 s) writes them into a new searchable segment. That makes search near-real-time, not real-time."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why `LIKE '%x%'` does not scale

A normal database index (a B-tree) is sorted by the *beginning* of each value, so it can answer `LIKE 'dog%'`: jump to where "dog" would start and read forwards. `LIKE '%dog%'` can match anywhere in the text, so the database has no choice but to read every row and pattern-match it. With 10 million posts of 2 KB that is about 20 GB of text touched per search. It also has no notion of relevance ("which result is best?"), will not find "Dogs" when you type "dog", and matches "dogma". Search engines solve all of this with an **inverted index**.

## How it works

### 1. Analysis

Each document's text goes through an **analyser** that turns it into **terms**:

1. **Tokenize**: split on whitespace and punctuation: `Red dog, red ball` → `Red`, `dog`, `red`, `ball`.
2. **Normalise**: lowercase (`Red` → `red`), fold accents (`café` → `cafe`).
3. Optionally drop **stop words** (`the`, `a`) and **stem** (`running`, `runs` → `run`) so related forms match.

The query text runs through the **same analyser**. If the index stemmed `running` to `run` but the query does not, the search for `running` finds nothing.

### 2. Build the inverted index

For every term, store its **postings list**: the ids of documents containing it, **sorted**. Production indexes also store, per document, the **term frequency** (how many times the term appears, for ranking) and the **positions** (for phrase queries like `"red dog"`, where the words must be adjacent). The set of all terms is the **dictionary**, kept in a sorted structure or a compact automaton so a term is found in O(log T) or better.

### 3. Answer queries by merging lists

- **AND**: intersect the postings lists. Two pointers walk both sorted lists; when the ids differ, advance the smaller one; when they are equal, emit a match. O(n + m), and starting from the shortest list with **skip pointers** lets the engine jump over long runs in the longer list.
- **OR**: union the lists. **NOT**: subtract one list from another.

### 4. Rank

**TF-IDF** gives each matching term a weight of *term frequency* × *inverse document frequency*. **IDF** ≈ log(N / df), where N is the number of documents and df is how many contain the term: a word in every document says nothing, a rare word says a lot. **BM25**, the modern default, refines this:

- term frequency **saturates**: the 10th "red" adds far less than the 2nd (controlled by k1 ≈ 1.2);
- long documents are **normalised** down, so they do not win just by containing more words (controlled by b = 0.75).

## Worked example

Documents: **1** "Quick red fox", **2** "Lazy brown dog", **3** "Red dog, red ball". After analysis their lengths are 3, 3 and 4 terms.

| Term | Postings (doc: count) |
|---|---|
| ball | 3:1 |
| brown | 2:1 |
| dog | 2:1, 3:1 |
| fox | 1:1 |
| lazy | 2:1 |
| quick | 1:1 |
| red | 1:1, 3:2 |

**Query `red AND dog`:** red → [1, 3], dog → [2, 3]. Compare 1 and 2: advance red. Compare 3 and 2: advance dog. Compare 3 and 3: match. Both lists end. Result: **document 3**.

**Query `red`, ranked with BM25** (N = 3, average length 3.33, k1 = 1.2, b = 0.75). IDF(red) = ln(1 + (3 − 2 + 0.5) / (2 + 0.5)) = ln 1.6 ≈ 0.47.

| Doc | tf | length | tf part | score |
|---|---|---|---|---|
| 3 | 2 | 4 | 2 × 2.2 / (2 + 1.2 × 1.15) ≈ 1.30 | ≈ 0.61 |
| 1 | 1 | 3 | 1 × 2.2 / (1 + 1.2 × 0.925) ≈ 1.04 | ≈ 0.49 |

Document 3 ranks first even though it is longer. For comparison IDF(fox) = ln(1 + 2.5 / 1.5) ≈ 0.98: a term found in one document is worth about twice one found in two.

## In code

```python
import re
from collections import defaultdict

def analyse(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())      # tokenize + lowercase

def build(docs: dict[int, str]) -> dict[str, list[int]]:
    index = defaultdict(list)
    for doc_id in sorted(docs):                         # ascending ids → sorted postings
        for term in set(analyse(docs[doc_id])):
            index[term].append(doc_id)
    return index

def intersect(a: list[int], b: list[int]) -> list[int]:
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            out.append(a[i]); i += 1; j += 1
        elif a[i] < b[j]:
            i += 1                                      # advance the smaller id
        else:
            j += 1
    return out

idx = build({1: "Quick red fox", 2: "Lazy brown dog", 3: "Red dog, red ball"})
print(intersect(idx["red"], idx["dog"]))                # [3]
```

## At scale: shards, segments and refresh

**Sharding by document** (what Elasticsearch, OpenSearch and Solr do): each shard owns a subset of documents and a complete inverted index over them. Indexing a document touches one shard. A query is **scatter-gather**: the coordinator sends it to every shard, each returns its top k ids and scores, and the coordinator merges them and fetches the winning documents. The slowest shard sets the latency, and every query costs every shard some work, so you add **replicas** to scale read throughput.

The alternative, **sharding by term** (all of `dog`'s postings on one shard), lets a query touch only the shards for its terms, but each document write updates many shards and very common terms become hot spots, so it is rare in practice.

Inside a shard, Lucene stores the index as immutable **segments**. New documents are buffered in memory; a **refresh** (Elasticsearch default: every 1 second) writes the buffer into a new segment and makes it searchable. That is why search is **near-real-time**: a document is acknowledged at once but found about a second later. Durability before that comes from a write-ahead **translog**. Small segments are **merged** in the background, and deletes are only markers until a merge drops them, much like an LSM tree.

## Edge cases and pitfalls

- **Mismatched analysers** between index and query: the most common reason a search "cannot find" a document that obviously exists.
- **Per-shard statistics:** each shard computes IDF from its own documents, so scores are slightly inconsistent on small or skewed shards. Elasticsearch's `dfs_query_then_fetch` collects global statistics first at the cost of an extra round trip.
- **Deep pagination:** page 1,000 of 10 results means every shard returns its top 10,000 to be merged. Use cursor-style `search_after` instead.
- **The index is a copy, not the source of truth.** Keep data in the database and feed the search cluster through change-data-capture or a queue, so it can be rebuilt.
- For modest needs, PostgreSQL's own full-text search (`tsvector` with a GIN index, itself an inverted index) or trigram indexes (`pg_trgm`) may be enough.

## In the interview

Usually asked as *"design search for tweets / products / documents"*. Say: analyse text into terms, build an inverted index of sorted postings lists, intersect for AND, rank with BM25 plus business signals (recency, popularity), shard by document with replicas, and feed the index asynchronously from the primary database with about a one-second refresh. Expect *"why not just use LIKE?"* (full scan, no ranking, no stemming) and *"how fresh are results?"* (near-real-time: the refresh interval plus pipeline lag).
