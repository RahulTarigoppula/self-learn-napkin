---
title: Design a Chat System
track: sysdesign
tags: [case-study, interview, websockets, messaging, storage]
difficulty: 3
minutes: 6
tldr: "Phones hold WebSockets to gateways. A chat service numbers each message per conversation, stores it, acks the sender, then routes it to the recipient's gateway or sends a push notification."
analogy: "A post office with a numbered pigeonhole for every conversation. Each letter gets the next number and is filed before the sender gets a receipt; a courier who knows where each person is standing hands over a copy, and a note goes home if they are out."
diagram: design-chat-system
story:
  - title: Every phone keeps a WebSocket open
    text: "Alice and Bob each keep one long-lived WebSocket connection, through the load balancer, to a gateway server. Because the connection stays open, the server can push a message the moment it arrives — no polling. One gateway holds about 100,000 connections, so 100 million people online need about 1,000 gateways."
  - title: "Send: number it, store it, ack it"
    text: "Alice types “hi”. Gateway 1 forwards it to the chat service, which gives it the next sequence number in the Alice–Bob conversation, 42, and writes it to the message store under the key (conversation, 42). Only then does it ack Alice: one tick, sent. The message can no longer be lost."
  - title: "Deliver: find Bob’s gateway"
    text: "The chat service asks the session registry where Bob is connected — gateway 2 — and pushes the message down his socket. Bob's phone acks it, and Alice sees two ticks: delivered. When Bob opens the chat, his phone sends 'read up to 42', which becomes Alice's read receipt."
  - title: "Groups: one copy per member"
    text: "A message to group 7 is stored once, under the group's conversation, then delivered to each member's gateway in turn. That is fine for groups of a few hundred. Channels with millions of readers switch to pull, like a news feed."
  - title: "Offline? Send a push notification"
    text: "Di has no open connection, so the registry has no gateway for her. The chat service hands the message to a push notifier, which asks the phone platform's push service to wake her app. When Di reconnects, her app asks for every message with a sequence number above the last one it has."
  - title: "Presence: heartbeats say who is online"
    text: "Each phone pings its gateway about every 30 seconds so dead connections are noticed. The gateway marks the user online in a presence store with an expiry; if the pings stop, the entry expires and friends see 'last seen 2 minutes ago'."
keyIdeas:
  - "**WebSockets to stateful gateways** let the server push instantly; a **session registry** maps each user to their gateway."
  - "**Order per conversation**, not globally: a sequence number assigned by one owner per conversation. Clients spot gaps and re-fetch."
  - "**Store, then ack.** Retries carry a client message id so duplicates are dropped: at-least-once delivery, shown exactly once."
  - "**Wide-column store** partitioned by conversation, sorted by seq: 'latest 50 messages' is one partition read."
  - "**Offline:** push notification now, sync everything above the last seq on reconnect. **E2EE:** the server relays ciphertext only."
quiz:
  - q: "Why do chat apps use WebSockets rather than having phones poll the server every few seconds?"
    options: ["WebSockets encrypt messages and polling cannot", "An open connection lets the server push each message immediately without millions of empty requests", "Polling cannot carry text", "WebSockets need no servers"]
    answer: 1
    why: "Polling 100 M phones every 5 s is 20 M requests a second, nearly all empty, and still adds up to 5 s of delay. A persistent connection costs memory on the gateway but delivers in milliseconds."
  - q: "Two messages in the same conversation are sent within one millisecond from different phones. What decides their order?"
    options: ["Each phone's clock", "A per-conversation sequence number assigned by the single owner of that conversation", "The gateway that received them first", "Alphabetical order of the text"]
    answer: 1
    why: "Phone and server clocks drift, so timestamps can invert. One owner per conversation hands out 41, 42, 43 in the order it accepts messages, and every client displays by that number."
  - q: "Which partition key fits the message history table?"
    options: ["The message text", "The sender's user id", "The conversation id, with the sequence number as the sort key", "A random UUID per message"]
    answer: 2
    why: "The common read is 'the latest messages in this conversation'. Partitioning by conversation and sorting by seq puts them together, so the read touches one partition in order."
  - q: "500 million daily users each send 40 messages a day. Roughly what is the average message rate?"
    options: ["About 23,000/s", "About 230,000/s", "About 2.3 million/s", "About 20 billion/s"]
    answer: 1
    why: "500 M × 40 = 20 billion messages a day. 2 × 10^10 ÷ 86,400 s ≈ 231,000 per second; plan for a peak of two to three times that."
bigO:
  - { op: "messages sent", avg: "~230,000/s", note: "500 M DAU × 40 a day; peak ~700 k/s" }
  - { op: "message storage", avg: "~4 TB/day", note: "20 B × ~200 B; ~1.5 PB a year" }
  - { op: "open connections at peak", avg: "~100 M", note: "assume 1 in 5 daily users online at once" }
  - { op: "gateway servers", avg: "~1,000", note: "at ~100 k connections each" }
  - { op: "heartbeats", avg: "~3.3 M/s", note: "100 M ÷ 30 s — absorbed by gateways" }
bigOTitle: "Key numbers"
related: [sysdesign/pub-sub-and-streams, sysdesign/lsm-trees, sysdesign/design-news-feed, sysdesign/design-url-shortener]
prereqs: [sysdesign/back-of-envelope, sysdesign/api-design, sysdesign/load-balancing, sysdesign/realtime-communication, sysdesign/unique-id-generation, sysdesign/idempotency, sysdesign/sql-vs-nosql]
flashcards:
  - kind: qa
    q: "How does a chat system know which server to send Bob's message to?"
    a: "When Bob's WebSocket connects, his gateway records 'Bob → gateway 2' in a session registry (with an expiry). The chat service looks him up there and forwards the message to that gateway."
  - kind: cloze
    text: "Chat messages are ordered by a {{per-conversation sequence number}}, and stored partitioned by {{conversation id}}."
  - kind: qa
    q: "What happens to a message sent to someone who is offline?"
    a: "It is already stored. The service sends a push notification through the phone platform's push service; when the app reconnects it fetches every message with a sequence number above the last one it has."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Interview approach and building blocks, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## 1. Clarify requirements

**Functional:**

- One-to-one chat and group chat (say, up to 500 members).
- Message history that syncs across a user's devices.
- Sent, delivered and read receipts.
- Online / last-seen presence.
- Notifications for users who are offline.
- Attachments (photos, voice notes) — mention, then park.

**Non-functional:**

- **Low latency:** a message should arrive in well under a second when both people are online.
- **Never lose an acknowledged message**, never show one twice, and show messages in the **same order on every device**.
- **Highly available**; brief presence inaccuracy is acceptable.
- **Privacy:** ask whether end-to-end encryption is required, because it changes what the server can do.

## 2. Estimate

Assumptions (method from **Back-of-the-Envelope Estimation**): 500 M daily active users, 40 messages each per day, ~200 bytes per stored message including metadata, 1 in 5 daily users online at the peak.

| Quantity | Calculation | Result |
|---|---|---|
| Messages | 5 × 10^8 × 40 = 2 × 10^10 per day | ~230,000/s (peak ~700,000) |
| Storage | 2 × 10^10 × 200 B | ~4 TB/day, ~1.5 PB/year |
| Concurrent connections | 20 % of 500 M | ~100 M |
| Gateways | 10^8 ÷ 10^5 per server | ~1,000 |
| Heartbeats | 10^8 ÷ 30 s | ~3.3 M/s |
| Bandwidth | 230,000/s × 200 B | ~46 MB/s (~370 Mbps) |

What the numbers say: bandwidth is small; the hard parts are **100 M stateful connections**, a **write-heavy, append-only** store growing by petabytes, and the heartbeat rate, which must never reach a central database.

## 3. API

Real-time traffic runs as small JSON or binary frames over the WebSocket (see **Real-time Communication** for WebSockets vs long polling vs server-sent events):

```text
→ send      { conv: "A-B", client_id: "c-91f", body: "hi" }
← ack       { client_id: "c-91f", seq: 42 }                  (one tick)
← message   { conv: "A-B", seq: 42, from: "alice", body: "hi" }
→ delivered { conv: "A-B", up_to: 42 }   → read { conv: "A-B", up_to: 42 }
```

History and attachments use ordinary HTTP (**API Design**): `GET /conversations/{id}/messages?before=42&limit=50` with a cursor, and `POST /media` for an upload URL to blob storage.

## 4. High-level design

1. **Gateways.** Each phone opens one WebSocket through a layer-4 load balancer (**Load Balancing**) to a gateway. Gateways are stateful — they hold the open sockets — but contain no chat logic. On connect, the gateway writes `user → gateway` into the **session registry**, an in-memory store with expiry.
2. **Send.** The gateway forwards the frame to the **chat service**, routed by conversation id so a single owner handles each conversation at a time. The owner assigns the next sequence number, writes the message to the store, then acks the sender.
3. **Route.** The chat service looks up each recipient in the registry and forwards the message to that gateway, which pushes it down the socket. Gateways and the chat service can talk by direct RPC, or each gateway can subscribe to a pub/sub channel for its connected users (**Pub/Sub and Streams**).
4. **Offline.** No registry entry means offline: hand the message to the **push notifier**, which calls the phone platform's push service (APNs on iOS, FCM on Android).
5. **Presence** is kept in its own store, written by the gateways.

## 5. Deep dive: ids, ordering and receipts

Users only care about order **within a conversation**, so give each conversation its own counter. Its owner (the chat-service instance holding that conversation's partition, or an atomic increment on a per-conversation row) issues 41, 42, 43 in the order messages are accepted. Wall-clock timestamps are not enough: phone clocks are wrong and two servers' clocks can disagree by milliseconds, which inverts fast replies. For globally unique ids, use a time-sortable generator as in **Unique ID Generation**, but display by `seq`.

**Exactly once, as the user sees it.** Networks drop acks, so the client retries a send until it gets an ack. Each send carries a **client message id**; the chat service remembers recent ids per conversation and returns the original `seq` for a duplicate instead of storing it twice (see **Idempotency**). Delivery to recipients is **at least once**, and clients drop any `seq` they already have. If a client receives 44 while holding only up to 42, it knows 43 is missing and fetches it.

**Receipts** are just more messages flowing the other way. "Delivered up to 42" and "read up to 42" are **cumulative**, so one receipt covers every earlier message. In a 500-member group, store only each member's latest delivered and read positions, not a receipt per message per member. Read receipts travel to the sender's devices like any other message, and arrive later if the sender is offline.

## 6. Deep dive: storage, groups and offline sync

**Message store.** The workload is append-heavy (230,000 writes a second), and reads are almost always "the latest N messages of one conversation". A **wide-column store** such as Cassandra or HBase fits: partition key `conversation_id`, clustering (sort) key `seq` descending. One partition read returns a page of history in order, and writes are sequential appends that **LSM-Trees** handle well. Very long conversations would make huge partitions, so bucket the partition key by time, e.g. `(conversation_id, month)`. Replicate across nodes (**Replication**) for durability. See **SQL vs NoSQL** for why a single relational database struggles at petabyte scale here.

**Groups.** Store the message once under the group's conversation, then fan out delivery to each online member's gateway and push notifications to offline ones. With a 500-member cap that is at most 500 deliveries per message. Broadcast channels with millions of readers flip to the pull model from **Design a News Feed**: readers fetch new messages when they open the channel.

**Offline sync.** Each device remembers the last `seq` it has per conversation. On reconnect it sends those positions, or a single per-user "inbox" cursor if the server keeps a per-user log of conversations with new messages, and receives everything newer. The push notification only wakes the app or shows a preview; the message itself always comes from the store.

## 7. Presence and end-to-end encryption

**Presence.** Phones ping their gateway roughly every 30 seconds; this also keeps the connection alive through mobile networks and NAT boxes. 3.3 million pings a second must not hit a database, so the gateway absorbs them and writes to the presence store only when status changes, plus an infrequent refresh of an entry with a TTL. If a gateway dies, its entries simply expire. Push status changes only to contacts who currently have the chat open, not to every contact, or a single login fans out to thousands of updates.

**End-to-end encryption (E2EE)** in one paragraph: each device generates a key pair and publishes its public key to a key directory. Senders establish a shared secret with each recipient device and encrypt every message on the phone (the Signal Protocol does this with a key agreement plus a "double ratchet" that changes keys with each message). The server stores and forwards **ciphertext only**: it still sees who talks to whom and when, but not the content, so server-side search, content moderation and link previews must move to the client, and every new device needs keys of its own.

## 8. Bottlenecks and trade-offs

- **Gateway failure:** 100,000 clients reconnect at once. Use exponential backoff with jitter (**Circuit Breakers and Retries**), and have clients resync from their last `seq`, so nothing is lost.
- **Hot conversations:** one huge group's owner can saturate. Cap group size, or shard the group's delivery over several workers while keeping one sequencer.
- **Ordering vs availability:** a single sequencer per conversation is a brief point of failure; elect a new owner (**Raft Leader Election**) and accept a short pause rather than out-of-order messages.
- **Storage cost:** petabytes a year — move old messages to cheaper storage, or keep history only on devices, as some apps do.

## 9. What I'd say in the last 5 minutes

"About 230,000 messages a second across 100 M open WebSockets on ~1,000 gateways. A message is numbered per conversation, stored in a wide-column table partitioned by conversation, acked, then routed via the session registry or a push notification. Client ids make retries safe; cumulative receipts and gap detection keep every device consistent. Next I'd cover multi-device key management for E2EE, multi-region gateways, and metrics on end-to-end delivery latency (**Observability**)."
