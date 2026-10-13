---
title: Reverse Proxies and API Gateways
track: sysdesign
tags: [networking, proxy, gateway, microservices, security]
difficulty: 2
minutes: 5
tldr: "A reverse proxy stands in front of your servers and handles TLS, compression, caching and routing for them. An API gateway is a reverse proxy for APIs that also does auth, rate limits and aggregation."
analogy: "A forward proxy is your assistant who places calls for you, so nobody sees your number. A reverse proxy is a company's receptionist: every caller dials one number, and the receptionist checks who they are and puts them through."
diagram: reverse-proxies-and-gateways
story:
  - title: "Forward proxy: speaks for the clients"
    text: "A forward proxy sits on the clients' side. Laptops in an office send their web traffic through it, and websites see only the proxy's address. Companies use it to filter, log or cache outbound traffic. The clients know it exists; the servers do not."
  - title: "Reverse proxy: speaks for the servers"
    text: "A reverse proxy is the mirror image: it sits in front of your servers, and clients think it is the server. It ends the HTTPS connection, compresses responses, serves cached ones, and forwards plain HTTP to the right machine behind it. Your servers stay hidden."
  - title: "API gateway: one door, many services"
    text: "With many back-end services, an API gateway is the single public entry point. It routes by path: a request for /orders/7 goes to the orders service. Clients know one hostname, and services can be split, moved or renamed behind it without breaking anyone."
  - title: Every request is checked first
    text: "Because every request passes through it, the gateway is the natural place for cross-cutting checks. It verifies the token (401 if missing or invalid) and counts requests per client (429 Too Many Requests over the limit) before any service does work."
  - title: "Aggregation: one call, three services"
    text: "A mobile home screen may need data from users, orders and payments. Instead of three slow round trips from the phone, the app makes one call; the gateway fans out to the three services in parallel inside the data centre and returns one combined response."
  - title: One door is also one point of failure
    text: "If every request passes through one gateway, its failure takes down everything. So you run several identical, stateless gateway instances across zones behind a load balancer, keep business logic out of them, and roll out config changes carefully."
keyIdeas:
  - "**Forward proxy = acts for clients** (servers see the proxy). **Reverse proxy = acts for servers** (clients see the proxy)."
  - "A reverse proxy commonly does **TLS termination, compression, caching, load balancing and path/host routing**."
  - "An **API gateway** adds API concerns: **authentication, rate limiting, aggregation, versioning, request transformation** and per-client metrics."
  - "**Backend for Frontend (BFF):** one thin gateway per client type (mobile, web), shaped to that UI and owned by its team."
  - "The gateway is on every request path: make it **redundant, stateless and thin**, or it becomes a single point of failure and a bottleneck."
quiz:
  - q: "A company routes all employees' web traffic through one box that blocks some sites. What is it?"
    options: ["A reverse proxy", "A forward proxy", "An API gateway", "A CDN"]
    answer: 1
    why: "It acts on behalf of the clients going out to the internet. External sites see the proxy's IP, not each employee's."
  - q: "After adding a reverse proxy, your app logs show every request coming from 10.0.0.5. Why, and what fixes it?"
    options: ["The proxy is broken", "The app sees the proxy as its client; read the real client IP from X-Forwarded-For set by the proxy", "Clients share one IP", "TLS hides IPs"]
    answer: 1
    why: "The TCP connection now comes from the proxy. The proxy passes the original IP in X-Forwarded-For (or Forwarded). Trust that header only when it was set by your own proxy, since clients can forge it."
  - q: "A phone needs data from 3 services; mobile RTT is 80 ms. Roughly what does gateway aggregation save versus three sequential calls from the phone?"
    options: ["Nothing", "About 160 ms", "About 80 ms", "About 240 ms"]
    answer: 1
    why: "Three sequential calls cost ~3 × 80 = 240 ms of round trips. One call costs ~80 ms plus the gateway's parallel internal calls (a few ms each), saving about 160 ms."
  - q: "Which belongs in an API gateway rather than in a service?"
    options: ["Calculating an order's tax", "Verifying the caller's token and enforcing a per-client rate limit", "Deciding whether a cart is eligible for a discount", "Writing the order to the database"]
    answer: 1
    why: "Cross-cutting checks that are the same for every service fit the gateway. Business rules belong in services; putting them in the gateway couples every team to one shared component."
bigO:
  - { op: "extra hop, same data centre", avg: "~0.5 ms + processing", note: "usually 1–5 ms total" }
  - { op: "TLS termination", avg: "once at the edge", note: "internal hop may be plain HTTP or mTLS" }
  - { op: "gzip on JSON/HTML", avg: "~70–90 % smaller", note: "text compresses well" }
  - { op: "instances to run", avg: "≥ 2, across zones", note: "never one" }
bigOTitle: "Key numbers"
related: [sysdesign/load-balancing, sysdesign/rate-limiting, sysdesign/api-design, sysdesign/dns-and-cdns]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "Forward proxy versus reverse proxy in one sentence each?"
    a: "A forward proxy acts for clients, so servers see the proxy. A reverse proxy acts for servers, so clients see the proxy."
  - kind: cloze
    text: "TLS {{termination}} means the proxy decrypts HTTPS so the servers behind it receive {{plain HTTP}} (or a separate internal TLS connection)."
  - kind: qa
    q: "What is the Backend for Frontend pattern?"
    a: "A separate thin gateway per client type (e.g. iOS, web) that aggregates and reshapes back-end data for exactly that UI, owned by that front-end team."
  - kind: cloze
    text: "A gateway rejects unauthenticated calls with {{401}} and clients over their quota with {{429}}."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Reverse proxy (web server) section, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

A **proxy** is a server that receives a request, then makes its own request onward on the sender's behalf. Which side it serves decides its name.

### Forward proxy

The client is configured to send its traffic to the proxy (by browser settings, a PAC file, or the network forcing it). The proxy opens connections to the destination servers. The servers see the proxy's IP address, not the client's. Typical uses: an office filtering and logging outbound traffic, caching popular downloads for many users, or hiding where users are.

### Reverse proxy

Clients connect to what they believe is the server — `shop.com` resolves to the proxy. The proxy picks a back-end server and forwards the request. The back ends are on a private network and never exposed directly. A reverse proxy is useful even with a single back end because of what it can do on the way through:

| Job | What it means | Why at the proxy |
|---|---|---|
| **TLS termination** | decrypt HTTPS, forward HTTP (or re-encrypt) | one place for certificates; app servers skip the crypto work |
| **Compression** | gzip or brotli the response | JSON and HTML often shrink 70–90 % |
| **Caching** | keep responses and serve repeats | the back end never sees them |
| **Load balancing** | spread requests over N servers | a load balancer is a reverse proxy with many back ends |
| **Routing** | by host (`api.` vs `www.`) or path (`/static/`) | one public address for many services |
| **Buffering and limits** | absorb slow clients, cap body size, timeouts | protects app servers' threads |

Proxies that understand HTTP are **layer 7** (they can route on path, headers or cookies). **Layer 4** proxies only see IP and port; they are faster but cannot look inside the request. Common software: Nginx, HAProxy, Envoy, Caddy.

Because the back end now sees the proxy as its client, the proxy adds headers such as `X-Forwarded-For` (original client IP) and `X-Forwarded-Proto` (was it https?), or the standard `Forwarded` header.

## API gateways

An **API gateway** is a layer-7 reverse proxy specialised for APIs, usually in front of microservices. On top of the reverse-proxy jobs it typically handles:

- **Authentication:** verify an API key or a signed token such as a JWT (check signature and expiry — no database call), then pass the user id to services in a header.
- **Rate limiting and quotas:** e.g. 100 requests per minute per API key, answering `429 Too Many Requests` with a `Retry-After` header beyond it.
- **Routing and versioning:** `/v1/orders` to the old service, `/v2/orders` to the new one; canary 5 % of traffic to a new build.
- **Aggregation (composition):** one client call, many internal calls in parallel, one combined response.
- **Transformation:** translate REST/JSON from clients into gRPC to internal services; strip internal fields.
- **Observability:** one place to log every request, attach a trace id, and measure latency per route and per client.

### Backend for Frontend (BFF)

A single gateway serving phones, web and partners grows into a tangle of special cases. The **BFF** pattern gives each client type its own thin gateway: the mobile BFF returns small payloads shaped for the phone screen, the web BFF richer ones. Each BFF is owned by the team building that front end, so they change it without waiting on a central team.

## Worked example

A phone calls `GET /v2/home` with `Authorization: Bearer <JWT>`; mobile RTT is 80 ms.

1. A layer-4 load balancer picks gateway instance 2 of 3.
2. The gateway terminates TLS and verifies the JWT signature and expiry: user 42.
3. Rate limiter: user 42 has used 37 of 100 requests this minute — allowed.
4. Route `/v2/home` to the home aggregator, which calls users (20 ms), orders (35 ms) and recommendations (50 ms) **in parallel**: ~50 ms total.
5. The combined 120 KB JSON is gzipped to ~20 KB and returned, with the trace id logged.

The phone pays one 80 ms round trip plus ~55 ms of server work, about 135 ms. Three sequential calls from the phone would cost 3 × 80 ms of round trips alone, plus each service's time.

## Sketch it

```nginx
upstream orders { server 10.0.1.11:8080; server 10.0.1.12:8080; }   # load-balanced pool
upstream users  { server 10.0.2.21:8080; }

limit_req_zone $binary_remote_addr zone=per_ip:10m rate=10r/s;     # leaky-bucket limiter, 10 req/s per client IP

server {
    listen 443 ssl;
    server_name api.shop.com;
    ssl_certificate     /etc/ssl/api.crt;        # TLS terminates here
    ssl_certificate_key /etc/ssl/api.key;
    gzip on;
    gzip_types application/json;                 # compress API responses

    location /orders/ {
        limit_req zone=per_ip burst=20;
        limit_req_status 429;                    # default would be 503
        proxy_pass http://orders;                # plain HTTP on the private network
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    location /users/ { proxy_pass http://users; }
}
```

Dedicated gateways (Kong, Envoy-based gateways, cloud API gateways) add token validation, per-key quotas and aggregation as configuration or plugins.

## Edge cases and pitfalls

- **Single point of failure.** Run at least two instances in different availability zones behind a load balancer, DNS or anycast. Keep instances **stateless** — rate-limit counters live in a shared store such as Redis — so any one can die.
- **A bad config is a global outage.** One wrong route rule breaks every service at once. Validate configs and roll them out gradually.
- **Business logic creep.** A gateway that knows about discounts and order rules becomes a monolith that every team must change. Keep it to cross-cutting concerns.
- **Forged headers.** Clients can send their own `X-Forwarded-For`. Services must trust it only from known proxies, and the gateway should overwrite identity headers such as `X-User-Id`.
- **Timeouts.** The gateway's timeout must be longer than the service's, or it gives up while the service is still working, and retries can double the load.

## Trade-offs

A gateway centralises security and traffic policy and simplifies clients, at the cost of an extra hop (typically 1–5 ms within a data centre), one more component to scale and operate, and a shared dependency. For a single monolith, a plain reverse proxy is usually enough; a full gateway pays off once there are several services and several kinds of clients.

## In the interview

Draw clients → load balancer → gateway → services, then list what the gateway does (TLS, auth, rate limit, routing, aggregation) and immediately add *"and I run several stateless instances across zones so it is not a single point of failure"*. Expect follow-ups: *"Where does rate-limit state live?"* (a shared store, or approximate per-instance limits) and *"Gateway versus load balancer?"* (a load balancer spreads traffic; a gateway also understands API-level policy).
