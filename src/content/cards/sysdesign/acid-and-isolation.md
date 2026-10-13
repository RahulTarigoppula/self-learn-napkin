---
title: ACID and Isolation Levels
track: sysdesign
tags: [databases, transactions, consistency]
difficulty: 3
minutes: 5
tldr: "A transaction is all-or-nothing, keeps the rules, survives crashes and runs as if alone. That last promise, isolation, comes in levels: weaker levels are faster but let anomalies through."
analogy: "Two people edit the same shared spreadsheet cell from their own copies. Each reads 100, each types a new total, and whoever saves last silently wipes out the other's change. Isolation levels decide how much of that the database lets happen."
diagram: acid-and-isolation
story:
  - title: ACID in four words
    text: "A transaction groups several reads and writes into one unit. ACID names its four promises: Atomicity (all of it happens or none of it), Consistency (constraints and invariants still hold afterwards), Isolation (concurrent transactions do not see each other's half-done work) and Durability (once committed, it survives a crash)."
  - title: Two transactions read the same row
    text: "Isolation is the hard one. A balance x = 100. Transaction T1 will deposit 50 and T2 will withdraw 20, both written as read-then-write. They overlap in time: T1 reads 100, then T2 also reads 100. Nothing is wrong yet."
  - title: Both write, and the deposit vanishes
    text: "T1 writes 100 + 50 = 150 and commits. T2 writes 100 − 20 = 80, computed from its stale read, and commits. The final balance is 80; it should be 130. This anomaly is a lost update: T2 overwrote a change it never saw."
  - title: The fix, lock or abort and retry
    text: "Three cures. Let the database do the arithmetic (UPDATE … SET x = x − 20). Lock the row when reading (SELECT … FOR UPDATE) so T2 waits for T1. Or run at an isolation level that detects the conflict and aborts T2; the application retries, reads 150 and writes 130."
  - title: Isolation levels and what each one blocks
    text: "The SQL standard defines four levels by the anomalies they forbid. Read committed stops dirty reads (seeing uncommitted data). Repeatable read also stops non-repeatable reads (a row changing between two reads). Serializable also stops phantoms (new rows appearing in a repeated query) and every other anomaly."
  - title: MVCC, readers see a snapshot
    text: "Most databases implement this with multi-version concurrency control. A write creates a new version of the row stamped with its transaction; old versions stay. A reader that started at time 10 sees the newest version committed before 10 (100) and ignores the one from time 12, so readers never block writers."
keyIdeas:
  - "**ACID**: atomic (all or nothing), consistent (rules hold), isolated (as if alone), durable (committed means safe on disk)."
  - "Anomalies: **dirty read**, **non-repeatable read**, **phantom**, **lost update**, **write skew**. Weaker isolation allows more of them."
  - "Levels: read uncommitted → **read committed** (default in PostgreSQL, Oracle, SQL Server) → **repeatable read** (MySQL InnoDB default) → **serializable**."
  - "**MVCC** keeps old row versions so each reader sees a consistent snapshot without locking writers out."
  - "**Snapshot isolation is not serializable**: it still allows write skew. Serializable may abort transactions, so the app must retry."
  - "**BASE** systems (basically available, soft state, eventually consistent) give up some of this for availability and scale."
quiz:
  - q: "T1 reads row x twice. Between the reads, T2 updates x and commits, so T1 sees two different values. Which anomaly is this, and what is the weakest standard level that prevents it?"
    options: ["Dirty read; read committed", "Non-repeatable read; repeatable read", "Phantom; serializable", "Lost update; read committed"]
    answer: 1
    why: "The value changed between two reads of the same row by a committed write: a non-repeatable read. Read committed allows it because each statement sees the latest committed data; repeatable read forbids it."
  - q: "Two on-call doctors each run 'if at least 2 doctors are on call, take myself off call' at the same moment under snapshot isolation. Both commit. What happened?"
    options: ["A dirty read", "A lost update", "Write skew", "Nothing, the result is correct"]
    answer: 2
    why: "Each read a snapshot showing 2 on call and updated a different row, so no write-write conflict was detected. Together they broke the invariant 'at least 1 on call'. That is write skew; only serializable isolation (or an explicit lock) prevents it."
  - q: "Your app runs at SERIALIZABLE in PostgreSQL. What must the code be ready for?"
    options: ["Reads that return uncommitted data", "Serialization failures that require retrying the whole transaction", "Writes that silently disappear", "Commits that are not durable"]
    answer: 1
    why: "Serializable snapshot isolation detects dangerous patterns and aborts one transaction with a serialization failure (SQLSTATE 40001). Correctness is guaranteed, but the application must catch the error and rerun the transaction."
  - q: "Which statement about MVCC is true?"
    options: ["It removes the need for any locks", "Readers see a consistent snapshot and do not block writers", "It stores only the latest version of each row", "It guarantees serializability on its own"]
    answer: 1
    why: "MVCC keeps several versions, so a reader picks the one visible in its snapshot while writers create new ones. Writers still take locks against each other, and snapshot isolation alone permits write skew."
bigO:
  - { op: "PostgreSQL default", avg: "read committed", note: "repeatable read = snapshot isolation; serializable = SSI" }
  - { op: "MySQL InnoDB default", avg: "repeatable read", note: "plain reads use a snapshot; locking reads use next-key locks" }
  - { op: "Oracle, SQL Server default", avg: "read committed", note: "Oracle's 'serializable' is snapshot isolation" }
  - { op: "serialization failure", avg: "SQLSTATE 40001", note: "retry the whole transaction" }
bigOTitle: "Key numbers"
related: [sysdesign/write-ahead-log, sysdesign/two-phase-commit-vs-sagas, sysdesign/sql-vs-nosql, sysdesign/consistency-models]
prereqs: []
flashcards:
  - kind: qa
    q: "What is the difference between a non-repeatable read and a phantom?"
    a: "A non-repeatable read is one existing row changing between two reads. A phantom is the set of rows matching a query changing because another transaction inserted or deleted rows."
  - kind: cloze
    text: "Snapshot isolation prevents dirty reads, non-repeatable reads and phantoms, but still allows {{write skew}}; only {{serializable}} isolation forbids it."
  - kind: qa
    q: "Name three ways to prevent a lost update on a counter or balance."
    a: "An atomic in-place update (UPDATE … SET x = x + 50), a locking read (SELECT … FOR UPDATE), or an isolation level that detects the conflict and aborts one transaction so it can retry. Compare-and-set on a version column also works."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "RDBMS and ACID/BASE sections" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The four promises

A **transaction** is a group of reads and writes that the database treats as one unit, started with `BEGIN` and ended with `COMMIT` (keep the changes) or `ROLLBACK` (discard them).

- **Atomicity** — either every write in the transaction takes effect or none does. If the server crashes after debiting account A but before crediting account B, recovery undoes the debit. "Abortability" would be a better name: atomicity is what makes it safe to give up halfway.
- **Consistency** — the transaction moves the database from one valid state to another: `UNIQUE`, `FOREIGN KEY` and `CHECK` constraints hold, and so do the application's own invariants ("debits equal credits"). The database enforces the constraints you declare; the rest is the application's job. This is *not* the C of CAP, which is about replicas agreeing.
- **Isolation** — concurrently running transactions do not interfere. The ideal, **serializability**, means the result is the same as if the transactions had run one after another in *some* order.
- **Durability** — once `COMMIT` returns, the data survives a crash or power cut. In practice: the change is in a write-ahead log flushed to disk (and, in replicated systems, copied to other machines) before the commit is acknowledged.

Atomicity and durability are mostly solved by logging. Isolation is where the real trade-offs are, because full serializability costs throughput.

## The anomalies

Each anomaly is a way two overlapping transactions, T1 and T2, can produce a result that no serial order would.

| Anomaly | Timeline | Why it is wrong |
|---|---|---|
| **Dirty read** | T2 writes x = 5 (not committed) → T1 reads 5 → T2 rolls back | T1 acted on a value that never existed |
| **Non-repeatable read** | T1 reads x = 100 → T2 updates x = 80, commits → T1 reads x = 80 | One row changed under T1 mid-transaction |
| **Phantom** | T1 counts rows `WHERE dept = 'eng'` → 10 → T2 inserts an engineer, commits → T1 counts again → 11 | The *set* of matching rows changed |
| **Lost update** | T1 and T2 both read x = 100 → T1 writes 150 → T2 writes 80 | T1's change is overwritten unseen |
| **Write skew** | T1 and T2 both check "≥ 2 doctors on call" → each takes a *different* doctor off call → both commit | Each write is fine alone; together they break the invariant |

Write skew is the subtle one: the two transactions write *different* rows, so no row-level write conflict is ever seen. It is a generalisation of the lost update.

## The levels

The SQL standard defines levels by which of the first three anomalies they forbid. Real databases often give more than the minimum.

| Level | Dirty read | Non-repeatable read | Phantom | Typical implementation |
|---|---|---|---|---|
| Read uncommitted | possible | possible | possible | rarely used; PostgreSQL treats it as read committed |
| Read committed | prevented | possible | possible | each *statement* sees a fresh snapshot of committed data |
| Repeatable read | prevented | prevented | possible (standard) | one snapshot for the whole *transaction*; PostgreSQL also blocks phantoms |
| Serializable | prevented | prevented | prevented | serial execution, two-phase locking, or SSI |

Lost update and write skew are not in the standard's table. Under **snapshot isolation** (what PostgreSQL calls repeatable read), a lost update is caught: the second writer gets a serialization error. MySQL InnoDB's repeatable read does *not* catch it for a plain `SELECT` followed by `UPDATE`. Write skew slips through every level except serializable.

## How it works: MVCC and serializable

**Multi-version concurrency control (MVCC)** keeps several versions of each row. Every version records which transaction created it (and which one deleted or replaced it). When a transaction or statement starts, it takes a **snapshot**: the set of transactions that had committed by then. A read returns the newest version created by a transaction in that snapshot and skips anything newer or uncommitted. Consequences:

- readers never wait for writers and writers never wait for readers;
- a transaction sees a frozen, consistent picture, which gives repeatable reads for free;
- writers still lock rows against *other writers*, and old versions must be garbage-collected (PostgreSQL's `VACUUM`, InnoDB's purge of undo logs). A transaction left open for hours keeps old versions alive and bloats the tables.

**Serializable** is built one of three ways:

1. **Actually serial execution** — one thread runs transactions one at a time (VoltDB, Redis scripts). Works when transactions are short and the data fits in memory.
2. **Two-phase locking (2PL)** — readers take shared locks, writers exclusive locks, all held until commit, plus range or predicate locks to stop phantoms. Correct but readers and writers block each other and deadlocks happen.
3. **Serializable snapshot isolation (SSI)** — run on snapshots optimistically, track read/write dependencies, and abort a transaction at commit when a dangerous cycle could form. Used by PostgreSQL's serializable level; CockroachDB uses a related optimistic scheme.

## Worked example: the lost update, four ways

Balance x = 100. T1 deposits 50, T2 withdraws 20. Correct final balance: 130.

| Approach | What T2 does | Result |
|---|---|---|
| Read committed, read-then-write in app code | reads 100, writes 80 after T1 committed 150 | **80, deposit lost** |
| Atomic `UPDATE accounts SET x = x - 20` | the database re-reads the latest committed 150 under a row lock | 130 |
| Both read with `SELECT x … FOR UPDATE` | T2's locking read waits until T1 commits, then reads 150 | 130 |
| PostgreSQL repeatable read or serializable | its update fails: *could not serialize access due to concurrent update*; the app retries, reads 150 | 130 |

## Implement it in Python

The idea is language-independent; here it is in Python.

```python
# Retry loop for SERIALIZABLE / repeatable-read transactions (psycopg-style sketch)
from psycopg.errors import SerializationFailure

def transfer(conn, src, dst, amount, attempts=5):
    for _ in range(attempts):
        try:
            with conn.transaction():                       # BEGIN … COMMIT, ROLLBACK on error
                conn.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
                (bal,) = conn.execute("SELECT balance FROM accounts WHERE id = %s", (src,)).fetchone()
                if bal < amount:
                    raise ValueError("insufficient funds")
                conn.execute("UPDATE accounts SET balance = balance - %s WHERE id = %s", (amount, src))
                conn.execute("UPDATE accounts SET balance = balance + %s WHERE id = %s", (amount, dst))
            return                                          # committed
        except SerializationFailure:                        # SQLSTATE 40001: safe to rerun
            continue
    raise RuntimeError("too much contention, gave up")
```

## Edge cases and pitfalls

- **"Repeatable read" means different things.** PostgreSQL's is snapshot isolation (no phantoms, catches lost updates). MySQL's uses snapshots for plain reads but next-key locks for locking reads, and lets read-then-write lost updates through. Oracle's "serializable" is really snapshot isolation and allows write skew. Always check what your database does.
- **Retries must rerun the whole transaction**, including the reads, and must not repeat side effects outside the database (sending an email) unless they are idempotent.
- **Long transactions hurt**: they hold locks, keep MVCC versions alive and raise abort rates at serializable.
- **Write skew fixes** without serializable: lock the rows you read with `FOR UPDATE`, or turn the invariant into a constraint (a unique index, or a single row you both update so the conflict becomes visible — "materialising the conflict").

## ACID vs BASE

Many NoSQL and replicated stores trade ACID guarantees for availability and scale, summarised as **BASE**: *Basically Available* (answer even during failures), *Soft state* (replicas may differ for a while), *Eventually consistent* (they converge if writes stop). Transactions are typically limited to a single key or document. The cost is pushed to the application: it must tolerate stale reads and resolve conflicts. Modern systems blur the line — DynamoDB and MongoDB offer multi-item transactions, and distributed SQL databases (Spanner, CockroachDB) offer serializable transactions across machines at the price of extra latency.

## In the interview

When a design touches money, inventory or unique names, say which isolation level you need and why. A strong answer names the anomaly ("two checkouts could both see 1 item left and both sell it — a write skew/lost update"), then picks the cheapest fix: an atomic conditional update (`UPDATE stock SET n = n - 1 WHERE id = ? AND n > 0`), a row lock, or serializable with retries. Expect the follow-ups "what does MVCC store?" (row versions with creating-transaction ids; snapshots pick the visible one) and "why not run everything at serializable?" (more aborts or blocking under contention, so lower throughput).
