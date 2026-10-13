---
title: Idempotency
track: sysdesign
tags: [reliability, retries, apis, payments]
difficulty: 2
minutes: 5
tldr: "Networks lose replies, so callers retry, and retries repeat work. Make every repeatable operation idempotent: doing it twice has the same effect as once, often via a client-made idempotency key."
analogy: "A lift call button. Press it once or ten times and exactly one lift comes. A pay-at-the-counter till without a receipt number is the opposite: hand the money over twice and you have paid twice."
diagram: idempotency
story:
  - title: A payment request
    text: "A client asks the payment API to charge $50. The API inserts charge #1 in its database and the card is charged. So far, everything worked."
  - title: The response is lost
    text: "The 201 Created reply never reaches the client: a timeout, a dropped connection or a crashed load balancer. The client cannot tell 'the charge failed' from 'the charge worked but the reply was lost'. Both look like silence."
  - title: "Blind retry: charged twice"
    text: "The safe-looking move is to retry. But the server sees a brand-new POST and inserts charge #2. The customer pays $100 for a $50 order. Retries are essential for reliability, so the operation itself has to tolerate them."
  - title: Send an idempotency key
    text: "Now the client generates a unique key, k1 (a UUID), once per intended payment and sends it with every attempt. The server stores k1 together with the charge and its response, in the same transaction. The reply is lost again."
  - title: "Same key: replay the stored reply"
    text: "The retry carries the same k1. The server finds k1 already completed and returns the stored response, the same 201 for charge #1, without charging again. The client cannot tell a replay from a first success, which is exactly the point."
keyIdeas:
  - "**Idempotent** = applying an operation twice leaves the same state as applying it once. `SET x = 5` is; `x = x + 5` is not."
  - "Lost replies make retries unavoidable, and a retry of a non-idempotent call **duplicates the effect**."
  - "**Idempotency key:** the client makes one unique key per intended action; the server stores key + result atomically and **replays the stored response** for repeats."
  - "Keys live for a **dedup window** (Stripe: at least 24 h). It must outlast every retry or redelivery, or a late duplicate gets through."
  - "**At-least-once delivery + idempotent consumer = effectively-once** processing. True exactly-once delivery is not available across a network."
quiz:
  - q: "Which of these operations is idempotent?"
    options: ["UPDATE accounts SET balance = balance - 50 WHERE id = 7", "UPDATE orders SET status = 'shipped' WHERE id = 7", "INSERT INTO charges (amount) VALUES (50)", "POST /emails to send a receipt"]
    answer: 1
    why: "Setting a field to a fixed value gives the same state however many times it runs. Subtracting, inserting a new row or sending an email each add another effect per run."
  - q: "A mobile app creates a fresh UUID for every HTTP attempt and sends it as Idempotency-Key. What happens on a retry after a lost reply?"
    options: ["The server replays the first response", "The server sees a new key and charges again", "The server rejects the retry", "Nothing, UUIDs prevent duplicates"]
    answer: 1
    why: "The key must identify the intended action, not the attempt. Generate it once when the user taps Pay, persist it, and reuse it for every retry of that payment."
  - q: "A consumer remembers processed message ids for 1 hour, but the stream keeps messages 7 days and a group may be replayed. What is the risk?"
    options: ["None", "Replayed or very late messages older than 1 hour are processed twice", "Messages are lost", "The broker rejects old ids"]
    answer: 1
    why: "Deduplication only works inside its window. The window must cover the longest possible gap between duplicates, or the effect itself must be naturally idempotent (an upsert keyed by the business id)."
  - q: "The same idempotency key arrives with amount $50, then again with amount $500. What should the server do?"
    options: ["Charge $500", "Replay the $50 response silently", "Reject the second request as a misuse of the key (e.g. 422)", "Charge both"]
    answer: 2
    why: "Store a fingerprint of the request with the key. A different body under the same key is a client bug; replaying the $50 result would hide it and charging $500 would break the guarantee."
bigO:
  - { op: "idempotent HTTP methods", avg: "GET, HEAD, PUT, DELETE", note: "also OPTIONS, TRACE (RFC 9110)" }
  - { op: "not idempotent", avg: "POST", note: "PATCH not guaranteed either" }
  - { op: "Stripe key retention", avg: "≥ 24 h", note: "then the key may be reused as new" }
  - { op: "SQS FIFO dedup interval", avg: "5 min", note: "by deduplication id" }
  - { op: "extra cost per request", avg: "1 indexed lookup + 1 write", note: "the key row" }
bigOTitle: "Key numbers"
related: [sysdesign/message-queues, sysdesign/circuit-breakers-and-retries, sysdesign/pub-sub-and-streams, sysdesign/two-phase-commit-vs-sagas]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "Why can't a client simply avoid retrying payments?"
    a: "After a timeout it cannot know whether the charge happened. Not retrying risks never charging; retrying without idempotency risks charging twice. Idempotency makes the retry safe."
  - kind: cloze
    text: "At-least-once delivery plus an {{idempotent consumer}} gives {{effectively-once}} processing."
  - kind: qa
    q: "What must the server store for each idempotency key?"
    a: "The key (scoped to the caller), a fingerprint of the request, its status (in progress or done) and the response to replay, written atomically with the effect."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## Why retries create duplicates

Any call across a network has three outcomes, not two: it succeeded, it failed, or **you don't know**. A timeout, a reset connection or a crashed proxy all look the same to the caller, and in each case the server may have finished the work. The caller's only tool is to **retry**, and every reliable system retries somewhere: HTTP clients, load balancers, message brokers (which redeliver anything not acknowledged) and users pressing the button again.

A retry is harmless only if the operation is **idempotent**: performing it N times leaves the system in the same state as performing it once. The *response* may differ (a second `DELETE` might return 404), but the *effect* does not.

## Idempotent by design

Many operations can be shaped to be naturally idempotent, which is the cheapest fix:

| Not idempotent | Idempotent rewrite |
|---|---|
| `balance = balance - 50` | `INSERT INTO ledger (txn_id, amount) ...` with `txn_id` unique |
| `INSERT INTO orders ...` (new id each time) | upsert on a client-chosen `order_id` |
| `POST /users` | `PUT /users/{id}` with the full resource |
| "increment view count" | add the view id to a set, count the set |
| "send the receipt email" | record `receipt_sent_at` and skip if set |

HTTP formalises this: by RFC 9110, `GET`, `HEAD`, `OPTIONS`, `TRACE`, `PUT` and `DELETE` are idempotent and `POST` is not (`PATCH` may or may not be). That is why proxies and clients may automatically retry a `GET` but should never blindly retry a `POST`.

## Idempotency keys

When the operation is inherently "create something new", such as charging a card, give the request an identity:

1. **The client generates a key** (a random UUID) **once per intended action**, when the user taps Pay, and stores it locally so even an app restart reuses it.
2. It sends the key with **every attempt**, e.g. the header `Idempotency-Key: 3f1c…`.
3. **The server records the key** (scoped to the caller's account) with a fingerprint of the request body and a status of *in progress*, before doing the work.
4. It does the work and stores the **response** (status code and body) with the key, ideally in the **same transaction** as the effect.
5. **On a repeat key** the server checks the fingerprint, then returns the stored response without redoing anything.

Edge cases the server must decide:

- **Same key still in progress** (the retry raced the original): answer **409 Conflict** and let the client retry later, rather than running both.
- **Same key, different body**: a client bug. Reject it (the IETF Idempotency-Key draft suggests **422**).
- **Which results to store:** if the request failed before doing anything (validation error, a 503 from a dependency before any write), it is often better not to store it so a retry can run for real. Stripe stores the result once the endpoint has started executing, including 500s.
- **Expiry:** keys are kept for a **dedup window**, after which they are deleted. Stripe keeps them at least 24 hours. Clients must stop retrying well inside that window.

## Worked example: paying for order 123

| Step | Client | Server | Card charged |
|---|---|---|---|
| 1 | taps Pay; key `k1` created and saved | | 0 |
| 2 | `POST /charges {order 123, $50}`, key `k1` | inserts `k1` (in progress), charges card, stores charge #1 and `201 {id: ch_1}` with `k1`, commits | $50 |
| 3 | reply lost, timeout after 10 s | | $50 |
| 4 | waits ~1 s (backoff), retries with `k1` | finds `k1` done, returns stored `201 {id: ch_1}` | $50 |
| 5 | shows "Paid" | | **$50 total** |

If the retry in step 4 had arrived while step 2 was still running, it would get 409 and try again a moment later. If the user had tapped Pay for a *second* order, the app would create a new key, `k2`.

## In code

```python
import hashlib, json

def create_charge(account, key, body):
    fp = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
    claimed = db.one(                                  # atomic claim of the key
        "INSERT INTO idem_keys (account, key, fingerprint, status) "
        "VALUES (%s, %s, %s, 'started') ON CONFLICT DO NOTHING RETURNING key",
        account, key, fp)
    if not claimed:                                    # seen this key before
        row = db.one("SELECT fingerprint, status, code, body FROM idem_keys "
                     "WHERE account = %s AND key = %s", account, key)
        if row.fingerprint != fp:
            return 422, {"error": "key reused with a different request"}
        if row.status == "started":
            return 409, {"error": "original request still in progress"}
        return row.code, json.loads(row.body)          # replay, do nothing else
    ch = psp.charge(body["amount"], body["card"],
                    idempotency_key=f"{account}:{key}")  # downstream is safe to repeat too
    with db.transaction():                             # effect + stored reply together
        db.execute("INSERT INTO charges (id, order_id, amount) VALUES (%s, %s, %s)",
                   ch.id, body["order_id"], body["amount"])
        db.execute("UPDATE idem_keys SET status = 'done', code = 201, body = %s "
                   "WHERE account = %s AND key = %s", json.dumps({"id": ch.id}), account, key)
    return 201, {"id": ch.id}
```

The external charge cannot join the database transaction. If the server crashes between `psp.charge` and the update, the key stays `started`. Because the same key was forwarded to the payment processor, a recovery job (or a retry after the `started` row's lease expires) can safely call it again and finish.

## Consumers: effectively-once

Message brokers give **at-least-once** delivery: a message is redelivered if the consumer crashes before acknowledging. A broker cannot offer exactly-once delivery to an arbitrary consumer, because "crashed after the work, before the ack" and "crashed before the work" look identical to it. The fix is on the consumer side:

- **Dedup table (inbox):** record each processed message id in the **same database transaction** as the effect; skip ids already present. Keep ids at least as long as a duplicate can arrive, including replays.
- **Naturally idempotent effects:** upserts keyed by a business id, or conditional writes (`UPDATE ... WHERE version = 4`).

At-least-once delivery plus an idempotent consumer gives **effectively-once** processing: duplicates may arrive, but they change nothing.

## Pitfalls

- **New key per attempt.** The most common bug; it defeats the whole mechanism.
- **Key stored separately from the effect.** If the charge commits but the key write fails (or vice versa), a retry either double-charges or replays a result that never happened.
- **Global keys.** Scope keys to the caller, or two clients that happen to pick the same string collide.
- **Forgetting the downstream.** Your API is idempotent but the email or card call it makes is not. Forward a derived key or record that the side effect is done.

## In the interview

Any design with payments, orders or queues invites "what if the request is retried?". Name the three outcomes of a remote call, say **idempotency key** with atomic storage of key and result, mention **409** for in-flight duplicates and the **dedup window**, and connect it to **at-least-once + idempotent consumers**. A common follow-up: *how long do you keep keys?* Longer than the longest retry or redelivery path, typically 24 hours to 7 days.
