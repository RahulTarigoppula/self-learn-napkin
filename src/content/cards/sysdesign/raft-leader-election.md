---
title: Raft Leader Election
track: sysdesign
tags: [consensus, distributed, replication, leader-election]
difficulty: 3
minutes: 5
tldr: "Followers wait for a heartbeat; when a randomised timer runs out, one becomes a candidate, asks for votes, and leads its term if a majority agrees. Random timeouts make split votes rare."
analogy: "A meeting with no chair: everyone waits a random few seconds for someone to speak up. The first person to say 'shall I chair?' usually gets most nods before anyone else even asks, and keeps saying 'still here' so nobody else tries."
diagram: raft-election
story:
  - title: Five followers, each with a timer
    text: "A fresh cluster of five servers starts in term 0 with no leader; everyone is a follower. Each picks a random election timeout between 150 and 300 ms, here 162, 210, 245, 275 and 298 ms. If a timer runs out before a follower hears from a leader, it assumes there is none."
  - title: A timer fires, S1 becomes a candidate
    text: "S1 has the shortest timeout, so it fires first. S1 increments the term to 1, switches to candidate, and votes for itself. A term is an election number: each term has at most one leader, and every message carries its term."
  - title: S1 asks everyone for a vote
    text: "S1 sends RequestVote for term 1 to the other four. Each server votes for at most one candidate per term, first come first served, and only if the candidate's log is at least as up to date as its own. The others' timers are still running, so nobody else is campaigning yet."
  - title: A majority makes a leader
    text: "S2 and S5 reply yes. With its own vote S1 has 3 of 5, a majority, so it is leader for term 1; the other replies no longer matter. Two leaders in one term are impossible, because two majorities of 5 must share a server, and that server voted only once."
  - title: Heartbeats keep followers quiet
    text: "The leader sends heartbeats (empty AppendEntries messages) every 50 ms. Each heartbeat resets a follower's election timer, so as long as the leader is alive no timer ever fires. If S1 crashes, the heartbeats stop and the next timer to expire starts term 2."
  - title: Split vote, so retry
    text: "Had S2 and S4 timed out together, each might win 2 votes, with no majority. Both wait for a new random timeout and the first to fire starts a fresh election with a higher term. Randomness makes repeated ties unlikely, so elections usually finish within a few hundred milliseconds."
keyIdeas:
  - "Three roles: **follower** (passive), **candidate** (asking for votes), **leader** (sends heartbeats and log entries)."
  - "A **term** is a numbered election; a server that sees a higher term updates and steps down to follower."
  - "**One vote per server per term** + **majority to win** = at most one leader per term."
  - "A voter refuses candidates whose log is **less up to date** than its own, so a new leader holds every committed entry."
  - "**Randomised timeouts** (e.g. 150–300 ms) spread candidates out in time and make split votes rare."
  - "Heartbeat interval ≪ election timeout ≪ time between failures, or the cluster keeps re-electing."
quiz:
  - q: "In a 5-server Raft cluster, how many votes does a candidate need to become leader, counting its own?"
    options: ["2", "3", "4", "5"]
    answer: 1
    why: "A majority of 5 is 3. The candidate's own vote counts, so it needs two more."
  - q: "Why can two servers never both be leader in the same term?"
    options: ["The leader with the lower id wins ties", "Each server votes once per term, and any two majorities share at least one server", "Leaders check a global clock", "Only the first server to start may lead"]
    answer: 1
    why: "Two majorities of the same cluster must overlap. The overlapping server cast only one vote in that term, so only one candidate can collect a majority."
  - q: "What is the main purpose of randomising election timeouts?"
    options: ["To save network bandwidth", "To make it unlikely that several followers become candidates at once and split the vote", "To pick the fastest server as leader", "To hide the leader's identity"]
    answer: 1
    why: "If every follower used the same timeout they would all become candidates together, split the votes, and repeat. Random timeouts let one server start (and usually win) before the others' timers fire."
  - q: "A leader that was cut off by a partition rejoins and sends heartbeats with term 3, but the rest elected a new leader in term 4. What happens?"
    options: ["Two leaders share the cluster", "Followers reject term 3; the old leader sees term 4 in their replies and steps down", "The old leader wins because it was first", "The cluster stops until an operator intervenes"]
    answer: 1
    why: "Messages from an older term are rejected. When the old leader sees a higher term, it updates its term and becomes a follower."
bigO:
  - { op: "votes to win, N servers", avg: "⌊N/2⌋ + 1" }
  - { op: "failures tolerated", avg: "⌊(N − 1)/2⌋", note: "1 of 3, 2 of 5" }
  - { op: "election timeout", avg: "150–300 ms", note: "random per server, per election" }
  - { op: "heartbeat interval", avg: "≈ 50 ms", note: "well below the shortest timeout" }
bigOTitle: "Key numbers"
related: [sysdesign/quorum-n-r-w, sysdesign/cap-theorem, sysdesign/sharding]
prereqs: [sysdesign/quorum-n-r-w]
special: true
flashcards:
  - kind: qa
    q: "What does a Raft follower do when its election timeout expires?"
    a: "It increments its term, becomes a candidate, votes for itself and sends RequestVote to every other server."
  - kind: cloze
    text: "Raft prevents endless split votes by using {{randomised election timeouts}}; a leader needs votes from a {{majority}} of servers."
  - kind: qa
    q: "Why does a Raft voter reject a candidate whose log is behind its own?"
    a: "A committed entry is on a majority, and the winner needs a majority of votes, so at least one voter holds every committed entry. Refusing less up-to-date candidates guarantees the new leader has all committed entries."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why elect a leader at all

A replicated system — a configuration store, a database's metadata, a lock service — must agree on **one order of updates** across several machines even when some crash. Raft solves this with a **leader**: one server accepts every write, appends it to its log, and copies the log to the others. A write is **committed** once a majority stores it. That is simple as long as there is exactly one leader. Leader election is the part of Raft that picks a leader, replaces it when it fails, and guarantees there are never two leaders for the same term. (The authors' site, raft.github.io, has the paper and an interactive visualisation.)

## How it works

Every server is in one of three **roles**:

- **Follower** — passive. Answers requests from leaders and candidates. Holds an **election timer**.
- **Candidate** — trying to become leader.
- **Leader** — sends **heartbeats** and log entries to everyone.

Time is divided into **terms**, numbered 1, 2, 3, … Each term starts with an election and has **at most one** leader. Every message carries the sender's term. Whenever a server sees a term higher than its own, it adopts that term and becomes a follower; messages with a lower term are rejected.

The election, step by step:

1. A follower's timer expires without a heartbeat. It **increments its term**, becomes a candidate and **votes for itself**.
2. It sends **RequestVote(term, lastLogIndex, lastLogTerm)** to every other server.
3. A server grants its vote if (a) the request's term is not older than its own, (b) it has not already voted for someone else in this term, and (c) the candidate's log is **at least as up to date** — its last entry has a higher term, or the same term and an index at least as large.
4. With votes from a **majority** (3 of 5), the candidate becomes leader and immediately sends heartbeats.
5. If instead it hears a heartbeat from a leader with a term at least as high, it steps down.
6. If its timer expires again with no winner (a **split vote**), it starts a new election with term + 1.

Timeouts are **re-randomised** for every election, typically in a range like 150–300 ms, so one server usually times out well before the others.

## Worked example

Five servers, heartbeat every 50 ms.

| Time | Event | Term |
|---|---|---|
| 0 ms | Cluster starts, all followers; timers 162, 210, 245, 275, 298 ms | 0 |
| 162 ms | S1 times out → candidate, votes for itself, sends RequestVote | 1 |
| ~165 ms | S2 and S5 reply yes → S1 has 3 of 5 → **leader** | 1 |
| every 50 ms | S1 heartbeats; every follower's timer resets | 1 |
| 10 s | S1 crashes; heartbeats stop | 1 |
| ~10.2 s | First follower to time out, say S3, starts term 2 and wins | 2 |

**Split vote:** S2 and S4 time out within a millisecond of each other in term 5. S2 gets votes from S3 and itself; S4 from S5 and itself; S1 is down. Nobody has 3. Both wait for a fresh random timeout; S4 fires first in term 6 and wins before S2 wakes up.

## In code

```python
import random

def on_election_timeout(self):
    self.term += 1
    self.role, self.voted_for, votes = "candidate", self.id, 1
    for peer in self.peers:
        reply = peer.request_vote(self.term, self.id, self.last_log_index(), self.last_log_term())
        if reply.term > self.term:                 # someone is ahead: step down
            self.term, self.role, self.voted_for = reply.term, "follower", None
            return
        votes += reply.granted
    if votes > (len(self.peers) + 1) // 2:
        self.role = "leader"                       # start heartbeats now
    self.reset_timer(random.uniform(0.150, 0.300))

def on_request_vote(self, term, cand, last_idx, last_term):
    if term > self.term:
        self.term, self.role, self.voted_for = term, "follower", None
    up_to_date = (last_term, last_idx) >= (self.last_log_term(), self.last_log_index())
    grant = term == self.term and self.voted_for in (None, cand) and up_to_date
    if grant:
        self.voted_for = cand                      # persisted to disk before replying
        self.reset_timer(random.uniform(0.150, 0.300))
    return Reply(self.term, grant)
```

(Real implementations send the requests in parallel and count replies as they arrive.)

## Edge cases and pitfalls

- **Votes and terms must be persisted** before replying. A server that forgets it voted, after a restart, could vote twice in one term.
- **Even cluster sizes buy nothing:** 4 servers need 3 votes and tolerate 1 failure, the same as 3 servers. Use 3 or 5.
- **A minority cannot elect.** In a partition, only the side with a majority can choose a leader; the other side keeps timing out and raising its term, which is why a rejoining server can force a needless re-election (implementations add a "pre-vote" step to avoid this).
- **Timing requirement:** heartbeat interval ≪ election timeout ≪ mean time between failures. Timeouts close to network latency cause constant elections.
- **Stale leader:** an old leader cut off by a partition may still think it leads, but it cannot commit anything without a majority, and it steps down the moment it sees a higher term.

## In the interview

Typical prompts: "how does a cluster pick a leader?" or "how do etcd or Consul stay consistent?" A strong answer covers the three roles, **terms**, **one vote per term + majority**, **randomised timeouts** and **heartbeats**, and the **log up-to-date check** that keeps committed data safe. Expect follow-ups on split votes, why 5 nodes rather than 4, and what happens to an old leader after a partition. Numbers worth knowing: timeouts of a few hundred ms, heartbeats tens of ms, 5 servers tolerate 2 failures.
