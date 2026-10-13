---
title: The Life of a Request
track: sysdesign
tags: [networking, http, latency, fundamentals]
difficulty: 1
minutes: 5
tldr: "Typing a URL triggers a DNS lookup, a TCP handshake, a TLS handshake and only then the HTTP request — each a network round trip, which is where most of the first page's latency goes."
analogy: "Like phoning a shop: look up the number (DNS), wait for them to pick up and say hello (TCP), agree to talk in a private code (TLS), then finally ask your question (HTTP). Staying on the line for the next question skips the first three."
diagram: client-server-basics
story:
  - title: A browser, a DNS resolver, a server
    text: "You type https://shop.com/cart. Three parties are involved: your browser (the client), a DNS resolver that translates names into addresses, and the server that owns shop.com. Time flows down the page; every horizontal arrow is a message across the network."
  - title: "DNS: name → IP address"
    text: "Computers route by IP address, not by name, so the browser first asks a DNS resolver: where is shop.com? The resolver answers with an IP address such as 203.0.113.7. The answer is cached, so the next visit usually skips this round trip."
  - title: "TCP: the three-way handshake"
    text: "Before any data flows, TCP sets up a reliable connection: the client sends SYN, the server replies SYN-ACK, the client sends ACK. This agrees on starting sequence numbers so lost or reordered packets can be detected. It costs one full round trip (RTT)."
  - title: "TLS: agree keys, check the certificate"
    text: "For https, client and server then run a TLS handshake. They exchange key material and the server proves it really is shop.com with a certificate signed by a trusted authority. TLS 1.3 needs one round trip; the older TLS 1.2 needed two."
  - title: "HTTP: request and response"
    text: "Only now does the real request go out: GET /cart, with headers such as Host and the session cookie. The server does its work — maybe a cache or database lookup — and replies with a status line (200 OK), headers and the HTML body."
  - title: Where the time went
    text: "Count the arrows: about four round trips before the first byte of the page arrives. At a 50 ms round-trip time that is roughly 200 ms, most of it handshakes. Keep-alive reuses the open connection, so the next request costs a single round trip."
keyIdeas:
  - "**A new HTTPS connection costs ~3 RTTs before the first byte** (TCP 1 + TLS 1.3 1 + HTTP 1), plus DNS if not cached."
  - "**HTTP is stateless**: every request carries what the server needs (cookie or token), so any server can answer it — the basis of horizontal scaling."
  - "**Keep-alive and HTTP/2** reuse one connection for many requests, paying the handshakes once."
  - "**Status code classes:** 2xx success, 3xx redirect, 4xx the client's fault, 5xx the server's fault."
  - "**GET, PUT, DELETE are idempotent**; POST is not — retrying it can create a duplicate."
quiz:
  - q: "A user 50 ms (one RTT) away opens a fresh HTTPS connection with TLS 1.3. DNS is cached. Ignoring server time, when does the first byte of the response arrive?"
    options: ["After ~50 ms", "After ~100 ms", "After ~150 ms", "After ~250 ms"]
    answer: 2
    why: "TCP handshake 1 RTT, TLS 1.3 handshake 1 RTT, then the request and its response 1 RTT: 3 × 50 ms = 150 ms. With TLS 1.2 it would be 4 RTTs, 200 ms."
  - q: "What does it mean that HTTP is stateless?"
    options: ["Responses can never be cached", "The server remembers nothing between requests by protocol; each request must carry its own context", "Connections close after every request", "Cookies are not allowed"]
    answer: 1
    why: "The protocol keeps no session. Apps add state on top (cookies, tokens) that the client sends every time, which is exactly why any server behind a load balancer can handle any request."
  - q: "A request returns 503. Whose problem is it, most likely?"
    options: ["The client sent a malformed request", "The client is not logged in", "The server or something behind it is overloaded or down", "The resource has moved"]
    answer: 2
    why: "5xx codes are server-side failures; 503 Service Unavailable means the server cannot handle the request right now (overload, maintenance). Retrying later with backoff is reasonable."
  - q: "Why does keep-alive make the second request on a page faster?"
    options: ["It caches the HTML on disk", "It skips the TCP and TLS handshakes by reusing the open connection", "It compresses the request", "It uses UDP instead of TCP"]
    answer: 1
    why: "The connection stays open after the first response, so the next request goes straight out: one RTT instead of three."
bigO:
  - { op: "DNS lookup", avg: "0–1 RTT to resolver", note: "0 when cached" }
  - { op: "TCP handshake", avg: "1 RTT" }
  - { op: "TLS 1.3 handshake", avg: "1 RTT", note: "TLS 1.2: 2 RTT" }
  - { op: "HTTP request → first byte", avg: "1 RTT + server time" }
  - { op: "next request (keep-alive)", avg: "1 RTT + server time" }
bigOTitle: "Round trips per step"
related: [sysdesign/dns-and-cdns, sysdesign/load-balancing, sysdesign/api-design, sysdesign/back-of-envelope]
prereqs: []
flashcards:
  - kind: qa
    q: "Name the steps between typing https://shop.com/cart and receiving HTML."
    a: "DNS lookup (name → IP), TCP three-way handshake, TLS handshake, HTTP request, server work, HTTP response."
  - kind: cloze
    text: "The TCP handshake is {{SYN, SYN-ACK, ACK}} and costs {{one round trip}}."
  - kind: qa
    q: "What is the difference between 401 and 403?"
    a: "401 Unauthorized means 'I don't know who you are' (missing or bad credentials). 403 Forbidden means 'I know who you are, and you may not do this'."
  - kind: cloze
    text: "HTTP is {{stateless}}: session state lives in a {{cookie or token}} the client sends with every request."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Communication: HTTP, TCP, DNS — redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

Take `https://shop.com/cart`. The browser splits the **URL** into a *scheme* (`https`, so port 443 and encryption), a *host* (`shop.com`) and a *path* (`/cart`). Then:

1. **DNS resolution.** The network routes packets by IP address, so the name must become one. The browser checks its own cache, then the operating system's, then asks a **recursive resolver** (run by your ISP, company or a public service). The resolver returns an `A` record (IPv4) or `AAAA` record (IPv6) with a *TTL* that says how long it may be cached.
2. **TCP connection.** TCP gives an ordered, reliable byte stream over an unreliable network. The **three-way handshake** — `SYN` → `SYN-ACK` → `ACK` — lets both sides choose and confirm starting sequence numbers, which later reveal missing or out-of-order packets. The client can send data right after its `ACK`, so the handshake costs **one round-trip time (RTT)**.
3. **TLS handshake.** TLS encrypts the stream and authenticates the server. The client sends supported ciphers and a key share; the server answers with its key share and its **certificate**, a document signed by a certificate authority that the browser already trusts, proving the key belongs to `shop.com`. Both sides derive the same session key. **TLS 1.3 takes 1 RTT** (TLS 1.2 took 2), and a returning client can sometimes send data with **0-RTT resumption** — at the cost of possible replay, so only for safe requests.
4. **HTTP request.** A request is a *method*, a *path*, *headers* and an optional *body*. `Host` says which site (one IP can serve many); `Cookie` or `Authorization` carries identity.
5. **Server work.** Typically a load balancer forwards the request to an application server, which reads a cache or database and renders a response.
6. **HTTP response.** A *status line* (`200 OK`), *headers* (`Content-Type`, `Cache-Control`, `Set-Cookie`) and the body. The browser parses the HTML and discovers more resources (CSS, JS, images) — each another request, ideally on the same connection.

## Statelessness

HTTP itself is **stateless**: the server is not required to remember anything about a client between requests. Every request must be understandable on its own. Applications add *session state* by giving the client a cookie or token and having it send that with every request; the server looks up the session in a shared store or verifies a signed token.

This is a feature, not a limitation. If no app server keeps private memory of a user, **any** server can handle **any** request, so a load balancer can spread traffic freely, a crashed server loses nothing, and you scale by adding servers.

## Methods and status codes

| Method | Meaning | Safe? | Idempotent? |
|---|---|---|---|
| `GET` | read a resource | yes | yes |
| `POST` | create / trigger an action | no | no |
| `PUT` | replace a resource at a known URL | no | yes |
| `PATCH` | partially modify | no | not guaranteed |
| `DELETE` | remove | no | yes |

*Safe* means it does not change server state. *Idempotent* means doing it twice has the same effect as doing it once — so a client may retry after a timeout without fear.

| Class | Meaning | Common codes |
|---|---|---|
| 2xx | success | 200 OK, 201 Created, 204 No Content |
| 3xx | go elsewhere / use your copy | 301 Moved Permanently, 302 Found, 304 Not Modified |
| 4xx | the client's request is wrong | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests |
| 5xx | the server failed | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout |

## Worked example: where 310 ms goes

A user in London loads a page from a server in Virginia: RTT ≈ 80 ms. DNS is not cached and the resolver is 10 ms away but must ask other servers, taking 40 ms. The server needs 30 ms to build the page.

| Step | Cost | Running total |
|---|---|---|
| DNS lookup | 40 ms | 40 ms |
| TCP handshake | 80 ms | 120 ms |
| TLS 1.3 handshake | 80 ms | 200 ms |
| Request → server work → first byte | 80 + 30 ms | 310 ms |

So the **time to first byte (TTFB)** is ~310 ms, and only 30 ms of it is your code. The second request on the same kept-alive connection costs 80 + 30 = 110 ms. Moving the TLS termination closer to the user (a CDN edge 10 ms away) shrinks both handshakes to 10 ms each — far more effective than optimising the 30 ms.

## In code

```python
import socket, ssl, time

host = "example.com"
t0 = time.perf_counter()
ip = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)[0][4][0]   # DNS
t1 = time.perf_counter()
raw = socket.create_connection((ip, 443))                              # TCP handshake
t2 = time.perf_counter()
tls = ssl.create_default_context().wrap_socket(raw, server_hostname=host)  # TLS handshake + cert check
t3 = time.perf_counter()
tls.sendall(f"GET / HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n".encode())
first = tls.recv(4096)                                                 # blocks until the first bytes arrive
t4 = time.perf_counter()

print(first.split(b"\r\n")[0])                                         # b'HTTP/1.1 200 OK'
for name, a, b in [("DNS", t0, t1), ("TCP", t1, t2), ("TLS", t2, t3), ("HTTP", t3, t4)]:
    print(f"{name:5}{(b - a) * 1000:7.1f} ms")
```

## Keep-alive, HTTP/2 and HTTP/3

- **HTTP/1.1 keep-alive** (the default in 1.1) keeps the TCP+TLS connection open for further requests. But one connection carries one request at a time, so browsers open ~6 connections per host.
- **HTTP/2** multiplexes many concurrent requests as *streams* over one connection, with compressed headers. One lost TCP packet still stalls every stream (*head-of-line blocking*).
- **HTTP/3** runs over **QUIC** on UDP, merging the transport and TLS 1.3 handshakes into 1 RTT and giving each stream independent loss recovery.

## Edge cases and pitfalls

- **Retrying a POST** after a timeout may create two orders; the first may have succeeded. Use idempotency keys.
- **A 200 with an error in the body** breaks caches, monitoring and clients. Use the right status code.
- **Bandwidth is not latency.** A faster link does not shorten handshakes; only fewer round trips or shorter distance does.
- **DNS TTLs** that are too long slow down failover; too short add lookups.

## In the interview

"What happens when you type a URL and press Enter?" is a classic. A strong answer walks DNS → TCP → TLS → HTTP → load balancer → app → data store → response → rendering, *counting round trips*, and then names the levers: caching DNS, connection reuse, HTTP/2 or HTTP/3, a CDN to shorten RTT, and a stateless app tier so it scales. A common follow-up: *"Why does the first request to a site feel slower than the rest?"* — cold DNS and handshakes.
