---
title: "API Design: REST, gRPC, GraphQL"
track: sysdesign
tags: [api, rest, grpc, graphql, pagination]
difficulty: 2
minutes: 6
tldr: "REST models resources with URLs and HTTP verbs; gRPC is typed, binary RPC over HTTP/2 for service-to-service calls; GraphQL lets each client ask one endpoint for exactly the fields it needs."
analogy: "REST is a library with a fixed shelf for every book. gRPC is an internal phone line between departments with a strict script. GraphQL is a personal shopper: hand over one list of exactly what you want and get it back in one bag."
diagram: api-design
story:
  - title: "REST: nouns in the URL, verbs in the method"
    text: "In REST the URL names a resource — /orders/7 — and the HTTP method says what to do: GET reads, POST creates, PUT replaces, DELETE removes. Status codes report the outcome. GET, PUT and DELETE are idempotent: repeating them has the same effect, so clients can retry safely. POST is not."
  - title: "Pagination: offset vs cursor"
    text: "A list of orders, newest first, comes back 3 at a time. With ?offset=3, a new order arriving between page loads shifts everything down one, so order 104 appears twice. A cursor — ?after=104 — says 'continue after the last item I saw', which stays correct and stays fast even deep into the list."
  - title: "gRPC: typed calls over HTTP/2"
    text: "Between your own services, gRPC feels like calling a function: checkout calls Charge(ChargeRequest) on payments. Request and reply types are defined in a .proto file, sent as compact protobuf binary, over one long-lived HTTP/2 connection that carries many calls and streams at once."
  - title: "GraphQL: the client shapes the response"
    text: "GraphQL exposes a single endpoint. The client sends a query listing exactly the fields it wants — 50 posts with title and author name — and the JSON comes back in that same shape: no extra fields, and no second request for authors."
  - title: The N+1 trap and its fix
    text: "Behind the scenes, each field has a resolver. Done naively, fetching 50 posts is 1 query, then each post's author is another — 51 database queries. Batching the author lookups into one WHERE id IN (…) query brings it down to 2."
keyIdeas:
  - "**REST:** resources as URLs, HTTP verbs, status codes; cacheable and universal — the default for public APIs."
  - "**Idempotent:** GET, PUT, DELETE (safe to retry). **POST is not** — add an `Idempotency-Key` header for retries."
  - "**Cursor pagination** (`WHERE id < last ORDER BY id DESC LIMIT n`) is stable and O(page); **offset** is simple but slows with depth and skips or repeats items."
  - "**gRPC:** contract-first protobuf, HTTP/2 multiplexing, streaming, generated clients — best for internal service-to-service calls."
  - "**GraphQL:** one endpoint, client-chosen fields, no over- or under-fetching — but watch **N+1 resolvers**, caching and query cost."
  - "**Version by addition:** add fields freely; never remove or rename one without a new version."
quiz:
  - q: "A client's POST /payments times out. What makes a retry safe?"
    options: ["Switching to GET", "Sending the same Idempotency-Key header so the server can return the first result instead of charging twice", "Waiting 10 seconds", "Using PUT on /payments"]
    answer: 1
    why: "POST is not idempotent, and the first attempt may have succeeded. The server stores the key with the result; a repeat with the same key returns the stored result."
  - q: "Why does ?offset=100000&limit=20 get slow on a large table?"
    options: ["JSON gets bigger", "The database must walk past 100,000 rows to throw them away before returning 20", "Offsets are not indexed by HTTP", "It is not slow"]
    answer: 1
    why: "OFFSET skips rows by reading them. A cursor (WHERE id < :last ORDER BY id DESC LIMIT 20) seeks straight to the position with an index and reads only 20 rows."
  - q: "A GraphQL query fetches 100 posts and each post's author. Without batching, how many database queries run?"
    options: ["1", "2", "101", "200"]
    answer: 2
    why: "One query for the posts, then the author resolver runs once per post: 1 + 100 = 101. A per-request batcher (DataLoader) collects the 100 author ids into one query: 2 in total."
  - q: "Which is the best fit for low-latency calls between internal microservices written in Go, Java and Python?"
    options: ["GraphQL", "gRPC", "SOAP", "Offset pagination"]
    answer: 1
    why: "gRPC generates typed clients in each language from one .proto contract, uses compact binary encoding, and multiplexes calls over HTTP/2."
bigO:
  - { op: "offset page at depth k", avg: "O(k + n)", note: "rows skipped are still read" }
  - { op: "cursor (keyset) page", avg: "O(log N + n)", note: "index seek, then n rows" }
  - { op: "GraphQL list + nested field, naive", avg: "1 + N queries" }
  - { op: "with batching (DataLoader)", avg: "2 queries" }
bigOTitle: "Key numbers"
related: [sysdesign/idempotency, sysdesign/rate-limiting, sysdesign/reverse-proxies-and-gateways, sysdesign/realtime-communication]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "Offset versus cursor pagination: one advantage of each?"
    a: "Offset can jump to any page number and is trivial to build. Cursor is stable when rows are inserted and stays fast however deep you go."
  - kind: cloze
    text: "GET, PUT and DELETE are {{idempotent}}; POST is not, so retries need an {{idempotency key}}."
  - kind: qa
    q: "What is the N+1 problem in GraphQL, and the standard fix?"
    a: "A list resolver runs one query, then a nested field's resolver runs once per item: N more queries. Fix: batch and cache per request (DataLoader) so the N lookups become one IN (…) query."
  - kind: cloze
    text: "gRPC sends {{protobuf}} messages over {{HTTP/2}}, which multiplexes many calls on one connection."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "REST and RPC communication sections, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How REST works

**REST** (representational state transfer) is a style, not a protocol. Its practical rules:

- **Resources are nouns with URLs:** `/users/42`, `/users/42/orders`, `/orders/7`. Avoid verbs in paths (`/getOrder`).
- **HTTP methods are the verbs.** `GET` reads, `POST` creates (or triggers an action), `PUT` replaces, `PATCH` partially updates, `DELETE` removes.
- **Status codes are the outcome:** `200 OK`, `201 Created` (with a `Location` header), `204 No Content`, `400` bad input, `401` not authenticated, `403` not allowed, `404` not found, `409` conflict with the current state, `422` validation failed, `429` too many requests, `5xx` server failures.
- **Stateless:** each request carries its own credentials and context.
- **Cacheable:** `GET` responses can be cached by browsers, CDNs and proxies using `Cache-Control` and `ETag`.

### Idempotency

An operation is **idempotent** if doing it twice leaves the server in the same state as doing it once. `GET`, `PUT` and `DELETE` are idempotent by definition — a second `DELETE /orders/7` may return `404`, but the order is just as deleted. `POST` is not: two `POST /payments` can mean two charges. Networks time out, and the client cannot tell whether the first attempt landed, so payment-style APIs accept an `Idempotency-Key` header: the server remembers the key with the first result and returns that result for any repeat.

### Pagination

Never return an unbounded list. Two common designs:

| | Offset / limit | Cursor (keyset) |
|---|---|---|
| Request | `?offset=40&limit=20` | `?limit=20&cursor=eyJpZCI6MTA0fQ` |
| Query | `ORDER BY id DESC LIMIT 20 OFFSET 40` | `WHERE id < 104 ORDER BY id DESC LIMIT 20` |
| Cost at depth | grows with offset — skipped rows are still read | constant — an index seek, then 20 rows |
| New rows inserted | items shift: repeats or skips | stable |
| Jump to page 37 | yes | no, only next/previous |

At page 5,000 with 20 per page, `OFFSET 99980` makes the database read ~100,000 rows to return 20; the cursor version reads 20. The cursor is usually an **opaque token** (base64 of the last row's sort key) so clients do not build it themselves, and it must include a unique tie-breaker (`created_at, id`) when the sort key can repeat.

### Versioning and errors

- **Add, don't change.** Adding a field or endpoint is safe; removing or renaming a field, changing a type, or making an optional field required breaks clients. For breaking changes, publish a new version — usually in the path (`/v2/orders`), sometimes in a header — and give the old one a deprecation date.
- **One error shape everywhere.** A standard is *problem details* (RFC 9457): `{"type": "...", "title": "Out of stock", "status": 409, "detail": "Item 31 has 0 left"}`. Never return `200` with an error inside.

## How gRPC works

**gRPC** is a remote procedure call framework. You write the contract first in a `.proto` file; a compiler generates client and server code for many languages, so calling another service looks like calling a local, typed function.

- **Protocol Buffers** encode messages as compact binary using numbered fields, typically much smaller and faster to parse than JSON. New fields can be added without breaking old clients, as long as field numbers are never reused.
- **HTTP/2** carries many concurrent calls as streams over one connection.
- **Four call shapes:** unary (one request, one reply), server streaming, client streaming and bidirectional streaming.
- **Deadlines** travel with each call, so a whole chain of services can give up together.

Downsides: binary payloads are not human-readable, browsers cannot speak native gRPC (you need gRPC-Web and a proxy), and HTTP caching does not apply.

## How GraphQL works

**GraphQL** exposes one endpoint (usually `POST /graphql`) and a typed **schema**. The client sends a query naming exactly the fields it wants, and the response mirrors the query's shape. This solves **over-fetching** (getting fields you do not need) and **under-fetching** (needing several round trips to assemble one screen), which matters most for mobile clients and for UIs that combine many back ends.

On the server, every field has a **resolver** function. That is where the **N+1 problem** comes from: the `posts` resolver runs one query; then the `author` resolver runs once per post. The standard fix is a per-request **batching loader** (DataLoader) that waits a tick, collects all requested author ids and runs one `WHERE id IN (...)` query.

Other costs: HTTP caching is harder because every query is a `POST` to one URL (persisted queries help); a deeply nested query can be extremely expensive, so servers enforce depth and cost limits; and errors usually come back as `200` with an `errors` array, so monitoring must look inside the body.

## Worked example: an orders API

| Call | Request | Response |
|---|---|---|
| list a user's orders | `GET /users/42/orders?limit=20` | `200 {"items": [...], "next_cursor": "eyJ..."}` |
| next page | `GET /users/42/orders?limit=20&cursor=eyJ...` | `200`, `next_cursor: null` on the last page |
| place an order | `POST /orders` + `Idempotency-Key: 9f1c` | `201`, `Location: /orders/7` |
| retry after timeout | same `POST`, same key | the stored `201`, no second order |
| cancel | `PATCH /orders/7 {"status": "cancelled"}` | `200`, or `409` if already shipped |
| unknown id | `GET /orders/999` | `404` with a problem-details body |

Internally, the orders service calls payments over gRPC (`Charge`), and the mobile app's home screen may use a GraphQL gateway that pulls orders, user and recommendations in one query.

## In code

```python
import base64, json

def encode(key): return base64.urlsafe_b64encode(json.dumps(key).encode()).decode()
def decode(tok): return json.loads(base64.urlsafe_b64decode(tok))

def list_orders(db, user_id, limit=20, cursor=None):
    sql, args = "SELECT id, created_at, total FROM orders WHERE user_id = ?", [user_id]
    if cursor:                                        # keyset: continue after the last row sent
        created_at, last_id = decode(cursor)
        sql += " AND (created_at, id) < (?, ?)"       # id breaks ties between equal timestamps
        args += [created_at, last_id]
    sql += " ORDER BY created_at DESC, id DESC LIMIT ?"
    rows = db.execute(sql, args + [limit + 1]).fetchall()   # one extra row tells us if more exist
    page = rows[:limit]
    more = len(rows) > limit
    return {"items": page, "next_cursor": encode([page[-1][1], page[-1][0]]) if more else None}
```

```proto
service Payments {
  rpc Charge (ChargeRequest) returns (ChargeReply);                  // unary
  rpc WatchPayments (WatchRequest) returns (stream PaymentEvent);    // server streaming
}
message ChargeRequest { string order_id = 1; int64 amount_cents = 2; string currency = 3; }
```

## Choosing

| Need | Pick |
|---|---|
| public API, third-party developers, simple CRUD, HTTP caching | **REST** |
| internal service-to-service calls, many languages, low latency, streaming | **gRPC** |
| many client types with different data needs, one screen from many back ends | **GraphQL** |

Many systems use all three: REST at the public edge, gRPC inside, GraphQL as a backend-for-frontend for the apps.

## Edge cases and pitfalls

- **Chatty APIs:** a screen that needs 12 REST calls is a design smell — add a composite endpoint or a BFF.
- **Leaking the database:** expose stable resources, not table rows; internal renames should not break clients.
- **Floating-point money:** send integer minor units (`amount_cents`) plus a currency code.
- **Unbounded GraphQL queries:** enforce depth and cost limits, or one query can take down the database.

## In the interview

Write out the endpoints for the core use cases with method, path, request and response — that alone shows fluency. Mention pagination (and why cursor), idempotency keys on create/payment calls, rate limiting, and versioning. If asked "REST or gRPC or GraphQL?", answer by audience: public clients → REST, internal hops → gRPC, diverse front ends → GraphQL.
