---
title: Real-time Communication
track: sysdesign
tags: [realtime, websockets, networking, scaling]
difficulty: 2
minutes: 5
tldr: "Polling asks repeatedly, long polling waits for news, Server-Sent Events stream one way, WebSockets talk both ways. At scale, servers share messages through a pub/sub backplane."
analogy: "Polling is asking 'are we there yet?' every five minutes. Long polling is asking once and being told when you arrive. SSE is the driver announcing each town. A WebSocket is an open phone line where both can talk."
diagram: realtime-communication
story:
  - title: "Polling: ask again and again"
    text: "Each pair of lines is a timeline: C is the client, S the server, time runs left to right. With polling the client asks every few seconds, 'anything new?'. Here 5 requests bring news once; the other 4 are wasted. News also waits up to a full interval before anyone sees it."
  - title: "Long polling: the server holds the request"
    text: "The client asks, and the server does not answer until there is news (orange: request held open), or until a timeout of about 30 s. As soon as a reply arrives the client asks again. Updates arrive almost instantly, using ordinary HTTP requests."
  - title: "Server-Sent Events: one open stream"
    text: "The client makes one HTTP request and the server never finishes the response. It writes an event into it whenever something happens. SSE is one-way, server to client, text only, and browsers reconnect automatically, resuming from the last event id."
  - title: "WebSocket: upgrade, then both ways"
    text: "A WebSocket starts as an HTTP request asking to upgrade; the server answers 101 Switching Protocols (orange). From then on the same TCP connection carries small frames in both directions at any time: full duplex. Chat, games and collaborative editors use it."
  - title: Scale out with a pub/sub backplane
    text: "One server cannot hold every connection, so Ann is connected to server 1 and Bob to server 2. When Ann posts to room 42, server 1 publishes the message to a pub/sub channel. Every server with members in that room is subscribed, so server 2 receives it and pushes it down Bob's socket."
keyIdeas:
  - "**Polling** is simple but wasteful and laggy; **long polling** gives near-instant updates over plain HTTP at one request per message."
  - "**SSE**: one long HTTP response, server → client only, text, built-in reconnect with `Last-Event-ID`. Ideal for feeds, tickers, progress and notifications."
  - "**WebSocket**: HTTP `Upgrade` → `101`, then full-duplex frames on one TCP connection. Use it when the client also sends often."
  - "Long-lived connections need **heartbeats** (proxies drop idle ones) and **reconnects with backoff and jitter** that resume from a sequence number."
  - "Each server holds only some connections; a **pub/sub backplane** (Redis, Kafka, NATS) routes a message to the servers holding its recipients."
quiz:
  - q: "A dashboard shows live order counts. The browser never sends data back. What is the simplest good fit?"
    options: ["Polling every 100 ms", "Server-Sent Events", "WebSockets", "Email"]
    answer: 1
    why: "The data flows only server to client, so SSE fits: one HTTP response, automatic reconnect with resume, and it passes through HTTP infrastructure. WebSockets work too but add a protocol you don't need."
  - q: "1,000,000 clients poll every 5 seconds. How many requests per second hit the servers, even when nothing changes?"
    options: ["5,000", "50,000", "200,000", "5,000,000"]
    answer: 2
    why: "1,000,000 ÷ 5 s = 200,000 requests per second, almost all of them answered 'nothing new'."
  - q: "Ann's WebSocket is on server 1 and Bob's on server 2. Why can't server 1 just send Ann's message to Bob?"
    options: ["WebSockets are one-way", "Bob's connection exists only on server 2; server 1 must hand the message to it, typically via a pub/sub backplane", "Server 1 must wait for Bob to poll", "Messages must go through the load balancer"]
    answer: 1
    why: "A socket lives in exactly one server process. Servers publish to a shared channel and each server delivers to the sockets it holds."
  - q: "Connections through a load balancer keep dropping after exactly 60 s of silence. What fixes it?"
    options: ["Switch to polling", "Send heartbeat pings, e.g. every 25–30 s", "Use bigger frames", "Disable TLS"]
    answer: 1
    why: "Load balancers and proxies close connections that are idle longer than their timeout (60 s by default on an AWS Application Load Balancer). Regular pings keep the connection active and detect dead peers."
bigO:
  - { op: "polling load", avg: "clients ÷ interval", note: "1 M ÷ 5 s = 200,000 req/s" }
  - { op: "polling delay", avg: "≤ interval", note: "average half of it" }
  - { op: "WebSocket upgrade", avg: "101 Switching Protocols", note: "RFC 6455" }
  - { op: "heartbeat interval", avg: "≈ 25–30 s", note: "below proxy idle timeouts, often 60 s" }
  - { op: "connections per server", avg: "10⁴–10⁶", note: "memory and file descriptors decide" }
bigOTitle: "Key numbers"
related: [sysdesign/pub-sub-and-streams, sysdesign/load-balancing, sysdesign/design-chat-system, sysdesign/client-server-basics]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "SSE or WebSocket for a stock ticker, and why?"
    a: "SSE: data flows only server to client, it is plain HTTP, and the browser reconnects and resumes with Last-Event-ID for free."
  - kind: cloze
    text: "A WebSocket begins as an HTTP request with an {{Upgrade: websocket}} header; the server replies {{101 Switching Protocols}}."
  - kind: qa
    q: "How do WebSocket servers deliver a message to a user connected to a different server?"
    a: "Through a pub/sub backplane: the receiving server publishes to a channel (e.g. room:42) and every server subscribed to it pushes the message to its own local sockets."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Communication section, background" }
---

## The problem

HTTP was designed for the client to ask and the server to answer. But chat messages, notifications, live scores and collaborative cursors start on the **server**, and the client wants them as soon as they exist. There are four standard ways to get there, each trading simplicity against latency and cost.

## The four techniques

### 1. Polling

The client sends `GET /messages?since=1040` every N seconds. Simple, cacheable and works everywhere, but:

- **Delay:** an update waits up to N seconds (N/2 on average).
- **Waste:** most responses are empty. 1,000,000 clients polling every 5 s generate 200,000 requests per second whether or not anything happens.

Fine for slow-changing data (a build status every 30 s), wrong for chat.

### 2. Long polling

The client sends a request; the server **holds it open** until it has news or a timeout (around 30 s) passes, then responds. The client immediately sends the next request. Updates arrive almost instantly, and it uses only ordinary HTTP. Costs: one full HTTP request and response per message burst, a held connection per client, and a short gap between response and re-request during which the server must buffer new messages (clients send their last seen sequence number so nothing is lost).

### 3. Server-Sent Events (SSE)

The client opens one request (`new EventSource("/events")` in a browser); the server answers with `Content-Type: text/event-stream` and **never ends the response**, writing an event whenever one occurs:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

id: 1041
data: {"from": "ann", "text": "hi"}

id: 1042
data: {"from": "bob", "text": "hello"}

```

Each event ends with a blank line. If the connection drops, the browser **reconnects automatically** and sends `Last-Event-ID: 1042`, so the server can replay what was missed. SSE is one-way and UTF-8 text only. Over HTTP/1.1 a browser allows only about 6 connections per domain, shared with everything else; over HTTP/2 many streams share one connection, so this limit stops mattering.

### 4. WebSockets

A WebSocket (RFC 6455) starts as an HTTP request and then **changes protocol** on the same TCP connection:

```http
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

The server proves it understood by hashing the key with a fixed GUID (SHA-1, then Base64) into `Sec-WebSocket-Accept`. After the `101`, both sides send **frames** (text, binary, and control frames such as ping, pong and close) **at any time, in both directions**: full duplex, with only a few bytes of framing overhead per message. Use `wss://` (TLS) in production; it also gets through proxies that would mangle plain traffic.

## Choosing

| | Direction | Latency | Overhead per message | Best for |
|---|---|---|---|---|
| Polling | client pulls | up to interval | full request, mostly empty | slow-changing status |
| Long polling | server → client | near-instant | full request per burst | fallback where nothing else works |
| SSE | server → client | instant | a few bytes | feeds, notifications, tickers, AI token streams |
| WebSocket | both ways | instant | 2–14 bytes of framing | chat, games, collaborative editing |

If the client sends rarely, SSE plus ordinary POST requests is often simpler than a WebSocket and keeps all of HTTP's tooling (auth headers, caching proxies, HTTP/2).

## Keeping connections alive

- **Heartbeats.** Load balancers and proxies close idle connections (an AWS Application Load Balancer defaults to 60 s), and a peer can vanish without a TCP close (phone loses signal). Send a ping every 25–30 s; if no pong returns within a deadline, treat the connection as dead. SSE servers send a comment line (`: ping`) for the same reason.
- **Reconnects.** Clients reconnect with **exponential backoff and jitter**, so a server restart does not cause 50,000 clients to reconnect in the same second. On reconnect they send the last sequence number they saw, and the server fills the gap from durable storage.

## Scaling WebSocket servers

Every open connection costs a file descriptor and some memory (kilobytes to tens of kilobytes, depending on buffers and TLS). A tuned server holds tens of thousands to around a million; WhatsApp reported over 2 million on a single server in 2012. So a big service runs many connection servers, and each user is connected to **just one** of them.

That creates the routing problem in scene 5: the sender's server is usually not the recipient's server. The standard fix is a **pub/sub backplane**:

1. Ann's message reaches server 1, which **stores it durably** (assigning sequence number 1043) and **publishes** it to channel `room:42`.
2. Each server **subscribes** to the channels of rooms that have members connected to it. Server 2 has Bob, so it is subscribed.
3. Server 2 receives the message and writes it to Bob's socket. Servers with no members in room 42 never see it.

For a room with 10,000 members spread over 20 servers, one publish becomes at most 20 backplane deliveries and 10,000 socket writes, spread across those servers. Redis Pub/Sub is a common backplane but is fire-and-forget; that is acceptable because the message was stored first and clients resume by sequence number. Kafka or NATS JetStream add durability. For one-to-one messages an alternative is a **presence/routing table** (user → server) so the sender's server forwards directly.

### Worked flow

```python
local = defaultdict(set)                          # room -> sockets on THIS server

async def on_connect(ws, room):
    local[room].add(ws)
    if len(local[room]) == 1:                     # first local member of this room
        await backplane.subscribe(f"room:{room}")

async def on_message(user, room, text):
    seq = await db.append(room, user, text)       # durable first: enables resume
    await backplane.publish(f"room:{room}",
                            json.dumps({"seq": seq, "from": user, "text": text}))

async def on_backplane(channel, payload):         # runs on every subscribed server
    room = channel.split(":", 1)[1]
    for ws in list(local[room]):
        await ws.send(payload)                    # fan out to local sockets only
```

## Pitfalls

- **Load balancing is per connection, not per message.** A server added during a spike gets no existing connections; deploys that drain servers cause reconnect waves. Use least-connections balancing and jittered reconnects.
- **Authentication:** browsers cannot set custom headers on a WebSocket handshake; use a cookie or a short-lived token, and re-check authorisation for every room subscription.
- **Slow receivers:** a client on a bad network cannot keep up with a busy room. Bound each connection's send buffer and drop or disconnect, or one slow phone holds server memory hostage.

## In the interview

In a chat or notification design, state which technique and why (usually WebSockets for chat, SSE for notifications), how many connections each server holds and so how many servers you need, how messages reach users on other servers (pub/sub backplane or a routing table), and how clients recover after a disconnect (sequence numbers plus durable storage). Expect *"what happens when a server dies?"*: its clients reconnect with jitter to other servers and resume from their last sequence number.
