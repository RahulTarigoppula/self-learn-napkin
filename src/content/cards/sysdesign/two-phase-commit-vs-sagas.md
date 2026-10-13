---
title: Two-Phase Commit vs Sagas
track: sysdesign
tags: [transactions, microservices, consistency, distributed]
difficulty: 3
minutes: 6
tldr: "2PC makes several databases commit atomically but blocks if the coordinator dies mid-way. A saga runs local transactions one by one and undoes finished steps with compensating actions on failure."
analogy: "2PC is a wedding: the officiant asks everyone 'do you?', and nobody is married until the final 'I pronounce you'. A saga is booking a trip yourself: buy the flight, then try the hotel; if it is full, you cancel the flight and eat the fee."
diagram: two-phase-commit-vs-sagas
story:
  - title: One trip, three databases
    text: "Booking a trip touches three services: flight, hotel and car rental, each with its own database. We want all three bookings or none. A single database transaction cannot span three databases, so we need a protocol on top."
  - title: "2PC phase 1: prepare, everyone votes yes"
    text: "Two-phase commit adds a coordinator. In phase 1 it asks every participant to prepare: do the work, write it durably, keep the rows locked, and vote. All three vote yes. In phase 2 the coordinator would send commit, and everyone makes the change permanent."
  - title: "Coordinator dies: participants are stuck"
    text: "Suppose the coordinator crashes after collecting the votes but before sending the decision. A participant that voted yes promised to obey, so it may neither commit nor abort on its own. It waits, holding its locks, until the coordinator recovers. This is why 2PC is called blocking."
  - title: "Saga: local transactions, one after another"
    text: "A saga drops global atomicity. Each step is a normal local transaction that commits immediately: T1 books the flight and commits. T2 tries the hotel, and it has no rooms, so T2 fails. The car step never runs. No locks are held between steps."
  - title: "Compensate: cancel the flight"
    text: "To undo, the saga runs the compensating action of every step that already committed, in reverse order: C1 cancels the flight and refunds the card. Compensation is a new forward action, not a rollback, so for a while others could see a booked flight."
keyIdeas:
  - "**2PC:** prepare (vote) then commit. Atomic across databases, but locks are held across network round trips and a coordinator crash leaves participants **blocked, in doubt**."
  - "**Saga:** a sequence of local transactions T1…Tn, each with a **compensating action** Ci; on failure at step k, run C(k−1) … C1."
  - "Sagas give atomicity eventually but **no isolation**: other requests can see intermediate states. Use pending states (semantic locks) to limit the damage."
  - "**Orchestration** (a central state machine drives the steps) vs **choreography** (services react to each other's events)."
  - "The **outbox pattern** writes the state change and the event in one local transaction, so a saga step never updates its DB without announcing it."
quiz:
  - q: "In 2PC, a participant voted YES and then lost contact with the coordinator. What may it do?"
    options: ["Commit, since it voted yes", "Abort after a timeout", "Nothing: it must keep its locks and wait until it learns the decision", "Ask another participant to become coordinator and decide"]
    answer: 2
    why: "After a YES vote the participant has promised to follow the coordinator's decision, which may already be commit or abort. Deciding alone could break atomicity, so it blocks. (It can ask other participants; if any of them knows the outcome it can follow it, but if all voted yes and none heard, they all wait.)"
  - q: "A trip saga books the flight (T1), the hotel (T2) and the car (T3). T3 fails. What runs next?"
    options: ["Nothing; T1 and T2 are rolled back automatically", "C2 (cancel hotel) then C1 (cancel flight)", "C1 then C2", "T3 is retried forever"]
    answer: 1
    why: "Committed local transactions cannot be rolled back, so the saga runs the compensations of the completed steps in reverse order: cancel the hotel, then cancel the flight. (If T3's failure is transient, retrying T3 first is also a valid design.)"
  - q: "A service updates its database and then publishes an event to Kafka. It crashes between the two. Which pattern prevents the lost event?"
    options: ["Two-phase locking", "The transactional outbox: insert the event into an outbox table in the same DB transaction, and a relay publishes it", "A longer Kafka retention", "Publishing the event first"]
    answer: 1
    why: "The state change and the outbox row commit atomically in one local transaction. A relay (polling or change-data-capture) publishes outbox rows at least once, so consumers must be idempotent."
bigO:
  - { op: "2PC messages", avg: "2 round trips", note: "prepare/vote, then commit/ack, per participant" }
  - { op: "2PC lock time", avg: "≥ 2 round trips", note: "unbounded if the coordinator dies after prepare" }
  - { op: "saga, failure at step k", avg: "k − 1 compensations", note: "run in reverse order" }
  - { op: "saga isolation", avg: "none", note: "ACD without the I" }
bigOTitle: "Key numbers"
related: [sysdesign/acid-and-isolation, sysdesign/message-queues, sysdesign/idempotency, sysdesign/distributed-locks]
prereqs: [sysdesign/acid-and-isolation]
flashcards:
  - kind: qa
    q: "Why is two-phase commit called a blocking protocol?"
    a: "A participant that voted yes must wait for the coordinator's decision. If the coordinator crashes after prepare, participants stay in doubt, holding their locks, until it recovers."
  - kind: cloze
    text: "A saga undoes completed steps with {{compensating actions}}, run in {{reverse order}}."
  - kind: qa
    q: "Orchestration vs choreography for sagas?"
    a: "Orchestration: one orchestrator tells each service what to do and tracks state; easy to follow and change. Choreography: each service reacts to events from the others; no central component, but the flow is spread across services and harder to see."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The problem

Inside one database, a **transaction** makes several changes atomic: all happen or none. Once the data is split across services, each owning its own database (the normal microservice set-up), no single database can wrap the whole operation. Booking a trip must reserve a flight, a hotel and a car in three systems, and a half-booked trip is a bug: the customer pays for a flight to a city where they have no bed.

There are two classic answers: make the databases vote together (**two-phase commit**), or give up on all-at-once and make each step undoable (**sagas**).

## Two-phase commit (2PC)

A **coordinator** (often the transaction manager in the application server or the database itself) runs the protocol with every **participant**.

**Phase 1: prepare.**
1. The coordinator sends `PREPARE` to every participant.
2. Each participant executes its part, writes all changes plus a *prepared* record durably to its log, keeps the affected rows locked, and votes `YES`. If it cannot (no seats, constraint violation, timeout), it votes `NO`.
3. A `YES` is a promise: "I can commit whatever happens, even if I crash and restart, and I will not decide on my own."

**Phase 2: commit or abort.**
4. If all votes are `YES`, the coordinator writes `COMMIT` to its own log. That write is the **commit point**: the transaction is now committed, whatever crashes next. Any `NO` or missing vote means `ABORT`.
5. It sends the decision to every participant, which applies it, releases its locks and acknowledges. The coordinator keeps retrying until every participant has acknowledged.

### The blocking problem

Between voting `YES` and hearing the decision, a participant is **in doubt**. If the coordinator crashes there, the participant cannot commit (another participant might have voted `NO`) and cannot abort (the coordinator might have logged `COMMIT` and told someone else). So it waits, with rows locked, for as long as the coordinator is down. Other transactions that need those rows queue up behind it.

Even without failures, 2PC costs two network round trips plus forced disk writes, and locks are held for all of that time. Every participant must support the protocol (XA in many relational databases), and the slowest participant sets the latency. Google Spanner makes 2PC practical by making the coordinator and each participant a Paxos-replicated group, so "the coordinator died" means a majority of replicas died, which is rare.

## Sagas

A **saga** is a sequence of **local transactions** T1, T2, …, Tn. Each commits on its own and then triggers the next. Every step Ti that can be undone has a **compensating transaction** Ci that semantically reverses it. If step Tk fails, the saga runs C(k−1), …, C1 in reverse order.

Compensation is a new action, not a database rollback: cancel the reservation, refund the card, send an apology email. So it must be designed for each step, must be **idempotent** (safe to retry) and must eventually succeed; retry it until it does.

### Worked example: the trip

| Step | Transaction | Compensation |
|---|---|---|
| 1 | book flight (seat 14C, charge $400) | cancel flight, refund $400 |
| 2 | book hotel (3 nights) | cancel hotel |
| 3 | book car | cancel car |

Run: T1 commits: seat 14C is booked and $400 charged. T2 finds no rooms and fails. The saga does not run T3. It runs C1: cancel seat 14C, refund $400. Final state: no bookings, money returned, and the trip is marked `CANCELLED`. If T3 had failed instead, the saga would run C2 then C1.

Order the steps sensibly: put the steps most likely to fail early, and steps that cannot be compensated (sending a ticket by email, shipping a parcel) **last**, after the point from which the saga only moves forward.

## Orchestration vs choreography

- **Orchestration:** a central **orchestrator** (a state machine, often on a workflow engine such as Temporal or AWS Step Functions) calls each service in turn, records progress in its own log, and runs compensations on failure. The whole flow is in one place, easy to read, test and change.
- **Choreography:** no central component. The flight service emits `FlightBooked`; the hotel service listens and books, emitting `HotelBooked` or `HotelFailed`; the flight service listens for `HotelFailed` and cancels. Loosely coupled and good for short flows, but the logic is spread across services and cyclic event chains become hard to reason about.

## Isolation anomalies

A saga is atomic only eventually and offers **no isolation**: other requests see intermediate states. During our run, for a few hundred milliseconds seat 14C is taken, and another customer is told the flight is full; or a report counts revenue that is about to be refunded. Countermeasures:

- **Semantic lock:** mark records as `PENDING` while the saga runs; other operations treat pending records specially.
- **Commutative updates:** design steps so order does not matter (debit and credit amounts rather than overwriting balances).
- **Reread values** before acting on them, or use version numbers to detect changes.

## The outbox pattern

Each saga step must both update its database **and** tell the next step (send a message). Doing these as two separate writes risks committing the booking and crashing before publishing, so the saga stalls. The **transactional outbox** fixes this: insert the outgoing message into an `outbox` table **in the same local transaction** as the state change. A relay process (polling the table, or change-data-capture from the database log) publishes outbox rows to the message broker and marks them sent. Delivery is at least once, so consumers dedupe with an idempotency key.

## In code

An orchestrator sketch, with each step's change and its event written by one local transaction:

```python
STEPS = [("book_flight", "cancel_flight"),
         ("book_hotel",  "cancel_hotel"),
         ("book_car",    "cancel_car")]

def run_trip_saga(trip):
    done = []
    for action, compensate in STEPS:
        try:
            call(action, trip, idem_key=f"{trip.id}:{action}")   # local txn in that service
            done.append(compensate)
            saga_log.save(trip.id, action, "done")                # survive orchestrator restarts
        except BusinessError:
            for comp in reversed(done):                           # undo in reverse order
                retry_until_ok(comp, trip, idem_key=f"{trip.id}:{comp}")
            return "CANCELLED"
    return "CONFIRMED"
```

```sql
-- inside the flight service: state change and event commit together
BEGIN;
UPDATE seats SET status = 'BOOKED', trip_id = 7 WHERE flight = 'BA117' AND seat = '14C';
INSERT INTO outbox (id, topic, payload) VALUES (gen_random_uuid(), 'flight-booked', '{"trip": 7}');
COMMIT;
```

## Trade-offs

| | 2PC | Saga |
|---|---|---|
| Atomicity | immediate | eventual, via compensation |
| Isolation | yes (locks) | none; intermediate states visible |
| Locks held | across the whole protocol | only within each local step |
| Coordinator failure | participants block | orchestrator resumes from its log |
| Needs | all databases support 2PC/XA | a compensation designed per step |
| Good for | few databases you control, short transactions | long-running, cross-service business flows |

## In the interview

Usually: *"how do you keep data consistent across microservices when placing an order?"* A strong answer explains why 2PC is avoided across services (blocking, locks across the network, every service must speak XA), proposes an orchestrated saga with compensations and idempotent steps, uses the outbox for reliable events, and admits the isolation gap with a mitigation like a `PENDING` state. Expect *"what if a compensation fails?"*: retry it with backoff because it must eventually succeed, and alert a human if it keeps failing.
