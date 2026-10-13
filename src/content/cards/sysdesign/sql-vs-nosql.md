---
title: SQL vs NoSQL
track: sysdesign
tags: [databases, data-modelling, scaling]
difficulty: 2
minutes: 5
tldr: "SQL stores normalised tables you can join and query any way, with ACID transactions. NoSQL stores shape data around known access patterns, trading joins and flexibility for easy scale-out."
analogy: "A library catalogue (SQL) lets you search by author, title or subject because everything is cross-referenced. A coat check (key-value) hands your coat back instantly for ticket 42, but cannot tell you who owns a red scarf."
diagram: sql-vs-nosql
story:
  - title: Relational, tables joined by keys
    text: "Take one user, Ana (id 42), with two orders. A relational database stores each fact once: a users table and an orders table whose uid column points at users.id. A JOIN reassembles them at read time, so any question can be asked later, in SQL, inside ACID transactions."
  - title: Document, nest what you read together
    text: "A document store keeps Ana and her orders in one JSON document. Fetching her profile page is a single read with no join, and documents in one collection may have different fields. The cost: data shared between documents gets copied, and many-to-many relationships are awkward."
  - title: Key-value, a key and an opaque value
    text: "A key-value store is a giant distributed hash map: put('user:42', bytes) and get('user:42'). The store does not look inside the value, so lookups by key are very fast and easy to spread across machines, but you cannot ask 'which users ordered over £20?'"
  - title: Wide-column, partition then sorted rows
    text: "A wide-column store such as Cassandra groups rows into partitions by a partition key (user 42) and keeps rows inside a partition sorted by a clustering key (date). 'Ana's orders, newest first' becomes one sequential read on one node. You design one table per query."
  - title: Graph, nodes and relationships
    text: "A graph database stores nodes (Ana, Ben, a book) and edges with names (follows, bought). Queries walk edges, so 'books bought by people Ana follows' is a two-hop traversal instead of a chain of self-joins. Best when the relationships are the data."
  - title: Pick by access pattern and scale
    text: "SQL: flexible queries, joins and strong transactions; scale a big node up, add read replicas, and shard only when you must. NoSQL: list your queries first, shape the data so each is one key lookup, and partitioning across many nodes comes built in."
keyIdeas:
  - "**Relational** = normalised tables, joins, schema enforced on write, multi-row ACID transactions. The safe default."
  - "**NoSQL families**: key-value (Redis, DynamoDB), document (MongoDB), wide-column (Cassandra, Bigtable), graph (Neo4j)."
  - "**Access-pattern-first**: in NoSQL you denormalise so each query reads one partition. New queries may need new tables."
  - "**Scaling**: NoSQL partitions by key across nodes out of the box; SQL scales up and out with replicas, and sharding is harder."
  - "Not either/or: PostgreSQL has JSONB, DynamoDB has transactions, and distributed SQL (Spanner, CockroachDB) scales out."
quiz:
  - q: "A social app's key query is 'friends of friends who like jazz'. Which store fits best?"
    options: ["Key-value", "Wide-column", "Graph", "Blob storage"]
    answer: 2
    why: "Multi-hop relationship queries are what graph databases are built for: each hop follows stored edges. In SQL it becomes repeated self-joins; in key-value or wide-column stores you would assemble it yourself with many lookups."
  - q: "In Cassandra you have a table keyed by user_id. Product asks for 'all orders over £100 across all users'. What is the usual fix?"
    options: ["Add a JOIN", "Create another table partitioned for that query, or export to an analytics store", "Increase the replication factor", "Switch the table to a graph"]
    answer: 1
    why: "Wide-column stores serve queries that hit one partition. A query across all partitions means a full-cluster scan. You denormalise into a second table shaped for the new query, or answer it in a separate analytics system."
  - q: "Which is the strongest reason to start with a relational database for a new product?"
    options: ["It is always faster", "Your queries will change and you need joins and multi-row transactions", "It cannot scale beyond one machine", "It has no schema"]
    answer: 1
    why: "Early on you do not know every access pattern. A normalised schema lets you ask new questions with SQL, constraints protect data quality, and transactions keep related rows correct. One large server goes a long way before you need to shard."
bigO:
  - { op: "key-value get by key", avg: "O(1) hash lookup", note: "sub-millisecond in memory (Redis)" }
  - { op: "B-tree indexed SQL lookup", avg: "O(log n)", note: "3–4 page reads for millions of rows" }
  - { op: "DynamoDB item size limit", avg: "400 KB" }
  - { op: "MongoDB document size limit", avg: "16 MB" }
  - { op: "Cassandra partition size", avg: "keep well under ~100 MB", note: "huge partitions become hot spots" }
bigOTitle: "Key numbers"
related: [sysdesign/acid-and-isolation, sysdesign/indexes-and-b-trees, sysdesign/sharding, sysdesign/lsm-trees]
prereqs: [sysdesign/acid-and-isolation]
flashcards:
  - kind: qa
    q: "What does 'access-pattern-first' modelling mean?"
    a: "List the queries the application must serve, then shape and duplicate the data so each query reads one key or one partition. It is the opposite of relational modelling, where you normalise first and write queries later."
  - kind: cloze
    text: "A wide-column table has a {{partition key}} that picks the node and a {{clustering key}} that sorts rows inside the partition."
  - kind: qa
    q: "Why is normalisation less common in NoSQL stores?"
    a: "Without joins, reassembling normalised data takes several round trips. Duplicating data makes each read one lookup, at the cost of updating every copy when the data changes."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "SQL or NoSQL section" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The relational model

A relational database (PostgreSQL, MySQL, SQL Server, Oracle) stores data in **tables**: rows with a fixed set of typed columns. Each fact is stored once (**normalisation**); relationships are expressed by **foreign keys**, a column whose value is another table's primary key. At read time a **join** combines rows that match on those keys.

Three properties make it the default choice:

- **Schema on write.** The database checks types, `NOT NULL`, `UNIQUE`, foreign keys and `CHECK` constraints on every write, so bad data is rejected at the door.
- **Declarative queries.** SQL says *what* you want; the query planner decides *how*, using indexes. A question nobody thought of on day one is just a new query.
- **Transactions.** Multi-row, multi-table ACID transactions: move money between two accounts and either both rows change or neither does.

The weak spot is **horizontal scale**. One server can be made very large (hundreds of cores, terabytes of RAM) and read replicas spread reads, but spreading *writes* means **sharding**: splitting tables across servers. Then joins and transactions that span shards become slow or unavailable, and the application has to route queries.

## The NoSQL families

"NoSQL" is an umbrella for stores that drop part of the relational model, usually to partition data across many machines easily.

| Family | Data model | Good at | Weak at | Examples |
|---|---|---|---|---|
| **Key-value** | key → opaque bytes | get/put by key at huge scale, caching, sessions | any query not by key | Redis, DynamoDB, etcd |
| **Document** | key → JSON-like document with nested fields | self-contained aggregates (a profile with its addresses), flexible fields | many-to-many relationships, cross-document joins | MongoDB, Couchbase, Firestore |
| **Wide-column** | partition key → rows sorted by clustering key | high write throughput, time series, "latest N per entity" | queries that do not name the partition key | Cassandra, HBase, Bigtable, ScyllaDB |
| **Graph** | nodes and named edges, both with properties | multi-hop traversals: social graphs, fraud rings, recommendations | bulk scans and aggregates over everything | Neo4j, Amazon Neptune |

Most of them **partition by key** automatically (often with consistent hashing) and **replicate** each partition, so adding nodes adds capacity. Many default to weaker consistency and single-item atomicity, though several now offer tunable consistency or limited transactions.

## Access-pattern-first modelling

Relational design asks "what are the entities?" and normalises. NoSQL design asks "**what are the queries?**" and shapes the data so each query touches one key or one partition:

1. Write down every read and write the application makes, with expected rates (for example, "show a user's 20 newest orders, 5,000 per second").
2. For each read, choose a key that holds everything it needs. Duplicate data where needed (copy the user's name into each order row).
3. Accept the cost: when Ana renames herself, every copy must be updated, often asynchronously.

## Worked example: Ana's orders

The query: "show user 42's name and 20 newest orders".

- **Relational:** `users` and `orders` tables, an index on `orders(user_id, created_at)`, one join. Adding "orders over £100 this week across all users" later is just another query.
- **Document:** one document per user with an embedded `orders` array. One read. But a user with 100,000 orders would blow past MongoDB's 16 MB document limit, so unbounded lists belong in their own collection.
- **Wide-column:** a table `orders_by_user` partitioned by `user_id`, clustered by `created_at DESC`, with the user's name duplicated in each row. One sequential read on one replica set. "Orders over £100 across all users" needs a second table or an analytics pipeline.

## Sketch it

The same data in two data models, in SQL and in Cassandra's query language (CQL):

```sql
-- Relational: normalise, index, join at read time
CREATE TABLE users  (id BIGINT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE orders (id BIGINT PRIMARY KEY,
                     user_id BIGINT NOT NULL REFERENCES users(id),
                     total_pence INT NOT NULL,
                     created_at TIMESTAMPTZ NOT NULL);
CREATE INDEX orders_by_user ON orders (user_id, created_at DESC);

SELECT u.name, o.id, o.total_pence
FROM users u JOIN orders o ON o.user_id = u.id
WHERE u.id = 42 ORDER BY o.created_at DESC LIMIT 20;

-- Wide-column (Cassandra CQL): one table per query, data duplicated
CREATE TABLE orders_by_user (
  user_id bigint, created_at timestamp, order_id bigint,
  user_name text, total_pence int,
  PRIMARY KEY ((user_id), created_at, order_id)   -- (partition key), clustering keys
) WITH CLUSTERING ORDER BY (created_at DESC, order_id ASC);

SELECT user_name, order_id, total_pence FROM orders_by_user WHERE user_id = 42 LIMIT 20;
```

## Decision checklist

Lean **relational** when:

- the data is relational (many entities referencing each other) and queries will evolve;
- you need multi-row transactions and constraints: payments, inventory, bookings;
- the data fits on one large primary plus replicas for the foreseeable future (it often does: terabytes and thousands of transactions per second).

Lean **NoSQL** when:

- access patterns are few, known and key-based: sessions, carts, feeds, device telemetry;
- write volume or data size clearly exceeds one machine, or you need multi-region active-active writes;
- the shape is naturally a self-contained document, a time series per entity, or a graph.

Many real systems use both: PostgreSQL for orders and accounts, Redis for sessions and caching, a wide-column or search store for high-volume events.

## Edge cases and pitfalls

- **"NoSQL is schemaless"** is misleading. The schema moves into application code; every reader must handle every old document shape.
- **Hot partitions.** Partitioning by key only spreads load if keys are spread. A celebrity user or "today's date" as a partition key overloads one node.
- **Secondary indexes in partitioned stores** are either local (every query asks every partition) or global (updated asynchronously, so briefly stale).
- **The lines blur.** PostgreSQL's `JSONB` gives you documents with indexes; DynamoDB and MongoDB offer multi-item transactions; Spanner and CockroachDB are SQL databases that shard and replicate automatically.

## In the interview

Do not say "NoSQL because it scales". Say what the access patterns are, estimate reads and writes per second and total data size, then pick. A strong answer: "Orders and payments in PostgreSQL for transactions and ad-hoc queries; the activity feed in Cassandra, partitioned by user and clustered by time, because it is 50,000 writes per second with one query shape." Expect the follow-up "how would you shard the SQL database later?" (pick a shard key such as user_id that keeps each user's rows together) and "what consistency does your NoSQL store give?"
