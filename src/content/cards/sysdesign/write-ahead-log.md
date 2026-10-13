---
title: Write-Ahead Log
track: sysdesign
tags: [databases, durability, recovery, replication]
difficulty: 2
minutes: 5
tldr: "Before changing any data page, append a record of the change to a log on disk and flush it. After a crash, replay the log to redo committed work and undo the rest."
analogy: "A chef taping each order ticket to the rail before cooking. If the kitchen loses power mid-service, the tickets show exactly which dishes were promised, so nothing is forgotten and nothing half-made gets served."
diagram: write-ahead-log
story:
  - title: Pages live in memory and on disk
    text: "A database changes data in pages cached in memory (the buffer pool) and writes them back to data files later. Transaction T7 moves 50 from A to B: A 100 → 50, B 0 → 50. If the power fails after A is written but before B, the disk says the money vanished."
  - title: Log the change, fsync, then ack
    text: "So T7 first appends what it intends to do to the write-ahead log: records 101 and 102 with old and new values, then a COMMIT record. The log is fsynced, forced to stable storage, and only then is the client told 'committed'. The pages are changed in memory only and written later."
  - title: "Group commit: one fsync, many commits"
    text: "An fsync takes from tens of microseconds to milliseconds, so one per commit caps throughput. Group commit gathers the commit records of every transaction that arrives during one flush, here T7 and T8, and makes them durable with a single fsync. Meanwhile T10 has logged a change but not committed."
  - title: "Crash: memory is gone"
    text: "The machine crashes. The buffer pool, with the new values of A and B, is lost. The data file still says A = 100 and B = 0: stale, but that is fine. Everything needed to rebuild the truth is in the log, which was flushed before anyone was told 'committed'."
  - title: "Recovery: redo committed, undo the rest"
    text: "On restart the database replays the log. T7 has a COMMIT record, so its changes are redone: A = 50, B = 50. T10 never committed, so any of its changes that reached disk are undone. The result is exactly the committed transactions: atomic and durable."
  - title: Checkpoints bound replay; the log feeds replicas
    text: "A checkpoint flushes dirty pages and records a position in the log; replay starts there, not at the start of time, and older log can be recycled. The same ordered log stream is shipped to replicas, which apply it to stay in sync, and read by change-data-capture tools."
keyIdeas:
  - "**The WAL rule**: a change's log record must be on disk before the changed page is, and the COMMIT record before the client is acknowledged."
  - "**Sequential appends are cheap**; data pages can then be written lazily and in batches."
  - "**Group commit** shares one fsync between many transactions: higher throughput, slightly higher latency."
  - "**Recovery** replays from the last **checkpoint**: redo committed changes, undo uncommitted ones."
  - "**The log is the source of truth** for replication (Postgres streaming, MySQL binlog) and change data capture."
quiz:
  - q: "When may a database tell the client that a transaction has committed?"
    options: ["When all of its changed data pages have been written to disk", "When its COMMIT record is flushed to the log on stable storage", "As soon as its changes are applied to pages in the buffer pool", "After the next checkpoint has copied its changes to disk"]
    answer: 1
    why: "Durability only needs the log record on stable storage: recovery can rebuild the pages from it. Waiting for data pages would mean random writes on every commit; waiting for a checkpoint could take minutes."
  - q: "Why does a database take checkpoints?"
    options: ["To make transactions atomic by grouping all of their writes on disk together", "To bound replay after a crash and let old log segments be reused", "To compress the log by merging records for the same page", "To acquire locks on every page before it is flushed"]
    answer: 1
    why: "A checkpoint guarantees that changes before a certain log position are in the data files. Recovery starts from there, so restart time is bounded, and log segments before it can be deleted or reused."
  - q: "A disk can do about 1,000 fsyncs per second. Without group commit, roughly what is the commit ceiling for one log?"
    options: ["About 1,000 commits per second", "About 1,000,000 commits per second", "Unlimited", "About 10 commits per second"]
    answer: 0
    why: "Each commit waits for its own fsync, so commits per second cannot exceed fsyncs per second. Group commit lets one fsync cover every commit that arrived meanwhile, so 1,000 fsyncs can carry many thousands of commits."
bigO:
  - { op: "fsync, SSD with power-loss protection", avg: "~0.05–0.5 ms" }
  - { op: "fsync, spinning disk", avg: "~5–10 ms", note: "one platter rotation" }
  - { op: "PostgreSQL WAL segment", avg: "16 MB", note: "checkpoint_timeout default 5 min, max_wal_size 1 GB" }
  - { op: "InnoDB flush policy", avg: "innodb_flush_log_at_trx_commit = 1", note: "fsync per commit; 2 or 0 trade durability for speed" }
bigOTitle: "Key numbers"
related: [sysdesign/acid-and-isolation, sysdesign/lsm-trees, sysdesign/replication, sysdesign/pub-sub-and-streams]
prereqs: []
flashcards:
  - kind: qa
    q: "Why is writing a log first faster than writing the data pages at commit time?"
    a: "The log is one sequential append of a few small records, flushed with one fsync. Writing data pages would mean several random page-sized writes per transaction. Pages can be written later, in batches, by a background process."
  - kind: cloze
    text: "After a crash, recovery starts at the last {{checkpoint}}, {{redoes}} changes of committed transactions and {{undoes}} changes of transactions that never committed."
  - kind: qa
    q: "What is group commit?"
    a: "Collecting the commit records of all transactions that arrive while a log flush is in progress and making them durable with one fsync, so throughput is not capped at one commit per fsync."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem: memory is fast, crashes are real

A database keeps recently used **pages** (8–16 KB blocks of a table or index) in a memory cache, the **buffer pool**. Transactions change pages there. Writing every changed page to disk at every commit would be slow (several random writes per transaction) and still unsafe: a transaction touching two pages could crash after writing one, and a single page write can itself be **torn** (half old, half new) by a power cut.

The **write-ahead log (WAL)** solves this with one rule: **describe the change in an append-only log on disk before the change reaches the data files.** The log is the source of truth; the data files are a cache of the log that may lag behind.

## How it works

1. **Log records.** Every change appends a record with a monotonically increasing **log sequence number (LSN)**: transaction id, page, and enough information to redo it (the new value) and, in most engines, to undo it (the old value).
2. **Commit = flush the log.** At `COMMIT`, a commit record is appended and the log is **fsynced**: the operating system is told to push it through its own caches to stable storage. Only after fsync returns is the client told the transaction committed.
3. **Pages are written lazily.** A background writer flushes dirty pages whenever convenient, in batches. Before writing a page, it ensures the log is flushed at least up to that page's latest LSN (the page header stores it). That is the "write-ahead" part.
4. **Checkpoints.** Periodically the database flushes dirty pages and records a **checkpoint** in the log: "everything before LSN *x* is in the data files". Recovery starts from there and older log segments can be recycled or archived.

Two policies make this fast, and they are exactly what require both redo and undo:

- **No-force**: committed pages need not be written at commit → after a crash some committed changes exist only in the log → **redo** them.
- **Steal**: the buffer pool may write a page containing *uncommitted* changes (to free memory) → after a crash those changes are on disk → **undo** them.

### Crash recovery

The classic algorithm, **ARIES** (used in spirit by SQL Server, DB2 and InnoDB), has three passes:

1. **Analysis.** Scan from the last checkpoint to find which transactions were active at the crash and which pages may be dirty.
2. **Redo.** Replay every logged change from the earliest needed LSN, but skip a record if the page's stored LSN shows it is already applied. This makes replay **idempotent**: running recovery twice is safe.
3. **Undo.** Roll back transactions with no commit record, newest change first, logging each undo step so a crash during recovery is also recoverable.

PostgreSQL does redo only: with MVCC, row versions written by a transaction that never committed are simply invisible, because the transaction is not marked committed.

## Group commit and fsync costs

An fsync on an enterprise SSD with power-loss protection takes tens to hundreds of microseconds; on a consumer SSD it can take milliseconds; on a spinning disk it waits for the platter, about 5–10 ms. If every commit needed its own fsync, a disk doing 1,000 fsyncs per second would cap you at 1,000 commits per second.

**Group commit** fixes this: while one flush is in progress, newly committing transactions queue up; the next fsync makes all of them durable at once. Under load, one fsync carries tens or hundreds of commits. Each transaction may wait slightly longer, but throughput rises dramatically. Databases also expose knobs that trade durability for speed: PostgreSQL's `synchronous_commit = off` acknowledges before the flush (a crash can lose the last fraction of a second of commits, but never corrupts data), and InnoDB's `innodb_flush_log_at_trx_commit = 2` writes the log at each commit but fsyncs about once a second.

## Worked example

Log after a busy moment (the drawing): `…`, checkpoint, `101 T7 A 100→50`, `102 T7 B 0→50`, `103 T7 COMMIT`, `104 T8 COMMIT`, `105 T10 C 5→9`. Records 103–104 were flushed together by one fsync. The data file still has A = 100, B = 0. Crash.

| Recovery step | Action |
|---|---|
| Analysis | T7 and T8 committed; T10 has no commit record, so it is a loser |
| Redo from checkpoint | page A's LSN < 101 → set A = 50; page B's LSN < 102 → set B = 50; replay T8's records; replay 105 (C = 9) to repeat history |
| Undo losers | T10: C back to 5, log a compensation record, then an abort record |
| Result | A = 50, B = 50, C = 5: exactly the committed state |

## Implement it in Python

The idea is language-independent; here it is in Python. A toy key-value store with a redo-only WAL: writes are made durable in the log before they are applied, and recovery replays committed transactions.

```python
import json, os

class KV:
    def __init__(self, path="db"):
        self.wal_path, self.snap_path, self.data = path + ".wal", path + ".snap", {}
        self._recover()
        self.wal = open(self.wal_path, "a")

    def commit(self, txid, writes):                      # writes: {key: value}
        for k, v in writes.items():
            self.wal.write(json.dumps({"tx": txid, "k": k, "v": v}) + "\n")
        self.wal.write(json.dumps({"tx": txid, "commit": True}) + "\n")
        self.wal.flush(); os.fsync(self.wal.fileno())     # durable BEFORE ack or apply
        self.data.update(writes)                         # now change the "pages"

    def checkpoint(self):                                # bound replay time
        tmp = self.snap_path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(self.data, f); f.flush(); os.fsync(f.fileno())
        os.replace(tmp, self.snap_path)                  # atomic swap
        self.wal.close(); self.wal = open(self.wal_path, "w")  # older log not needed

    def _recover(self):
        if os.path.exists(self.snap_path):
            with open(self.snap_path) as f:
                self.data = json.load(f)
        if not os.path.exists(self.wal_path):
            return
        pending = {}
        with open(self.wal_path) as f:
            for line in f:
                try:
                    r = json.loads(line)
                except json.JSONDecodeError:             # torn final record from the crash
                    break
                if r.get("commit"):
                    self.data.update(pending.pop(r["tx"], {}))   # redo (idempotent)
                else:
                    pending.setdefault(r["tx"], {})[r["k"]] = r["v"]
        # whatever is left in `pending` never committed and is simply dropped
```

## The log as a stream

Because the log is a complete, ordered history of changes, other systems consume it:

- **Replication**: PostgreSQL streaming replication ships WAL records to standbys, which replay them continuously; MySQL replicas apply the binary log (a separate, logical log written alongside InnoDB's redo log).
- **Change data capture (CDC)**: tools such as Debezium read PostgreSQL's logical decoding output or MySQL's binlog and publish every row change to Kafka, feeding search indexes, caches and analytics without dual writes.
- **Point-in-time recovery**: a base backup plus archived WAL can rebuild the database as of any moment.
- The same idea underpins LSM-tree storage engines (WAL + memtable), Raft's replicated log and Kafka itself.

## Edge cases and pitfalls

- **fsync can lie.** Disks with volatile write caches and no power-loss protection may acknowledge before data is durable. Use hardware that honours flushes.
- **fsync errors are serious.** After a failed fsync, Linux may drop the dirty pages and report success on the next attempt; PostgreSQL now panics and recovers from the WAL instead of retrying.
- **Torn pages.** A crash mid-way through writing an 8 KB page can leave it half-written. PostgreSQL logs a full image of each page the first time it changes after a checkpoint (`full_page_writes`); InnoDB uses a doublewrite buffer.
- **Checkpoint tuning.** Frequent checkpoints mean fast recovery but more page writes; rare ones mean less I/O but longer restarts and more WAL on disk.

## In the interview

When asked "how does a database make commits durable?" or "what happens if the server crashes mid-transaction?", describe the WAL rule, the fsync at commit, and replay from a checkpoint with redo and undo. Mention group commit as the reason it is still fast. Expect follow-ups: "how do replicas stay in sync?" (they replay the same log), "how would you build CDC?" (tail the log rather than dual-writing), and "what does `synchronous_commit = off` risk?" (losing the last few hundred milliseconds of acknowledged commits, never corruption).
