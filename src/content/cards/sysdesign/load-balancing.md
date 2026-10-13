---
title: Load Balancing
track: sysdesign
tags: [scaling, availability, routing]
difficulty: 1
minutes: 4
tldr: "One address in front of many servers: spread the work, hide the dead ones, and never become the single point of failure yourself."
analogy: "A host at a busy restaurant: guests queue at one door, the host seats each party at a free table, and a table with a broken chair simply stops getting guests until it is fixed."
diagram: load-balancer
story:
  - title: Many clients, one address
    text: "Every user types shop.com, which resolves to one public IP: the load balancer (LB). Clients never learn how many servers sit behind it, so you can add, remove or replace servers without anyone changing a setting."
  - title: Spread the requests
    text: "Behind the LB sit three identical, stateless app servers A, B and C. With round robin, request 1 goes to A, 2 to B, 3 to C, 4 back to A. Three servers now carry roughly a third of the load each, and capacity grows by adding boxes."
  - title: Health checks catch a dead server
    text: "Every few seconds the LB calls GET /health on each server. A and C answer 200 OK. B times out three checks in a row, so the LB marks it unhealthy. Without health checks, a balancer would spread failure evenly: one request in three would hit the dead box."
  - title: Traffic reroutes
    text: "The LB stops sending anything to B. A and C now take half of the traffic each, and users see no errors. B keeps being probed and rejoins the rotation only after it passes several checks in a row."
  - title: The balancer needs a partner
    text: "Now the LB is the single point of failure. Run a standby LB 2 that watches LB 1 through a heartbeat. If LB 1 goes quiet, LB 2 takes over the floating public IP within seconds. Managed cloud load balancers do this for you."
keyIdeas:
  - "**Health checks are the real feature.** Balancing without them just spreads failure evenly."
  - "**Least connections** suits requests of uneven cost; **round robin** is fine when requests are uniform; **hashing** on a key keeps a user or key on one server."
  - "**Layer 4** forwards TCP/UDP by IP and port; **layer 7** reads HTTP and can route `/api` and `/images` to different pools."
  - "Keep app servers **stateless** (sessions in a shared store) so any request can go to any server."
  - "The balancer must not be a **single point of failure**: run an active/passive pair with a floating IP, or several active ones behind DNS."
quiz:
  - q: "Requests to your API take anywhere from 5 ms to 5 s. Which algorithm spreads the load most evenly?"
    options: ["Round robin", "Least connections", "Random", "Hash on client IP"]
    answer: 1
    why: "Round robin and random hand out equal counts, so a server stuck on slow requests keeps getting more. Least connections sends each new request to the server with the fewest in flight, which tracks actual busyness."
  - q: "One of three servers starts returning errors, and the LB has no health checks. Roughly what share of requests fail?"
    options: ["None; the LB notices errors", "About one third", "About two thirds", "All of them"]
    answer: 1
    why: "The LB keeps sending that server its normal share (one request in three with round robin), so about a third fail until someone removes it."
  - q: "You need to send /video/* to a separate pool of servers. What do you need?"
    options: ["A layer-4 balancer", "A layer-7 balancer", "DNS round robin", "Sticky sessions"]
    answer: 1
    why: "The path is inside the HTTP request, which only a layer-7 balancer parses. Layer 4 sees only IP addresses and ports."
related: [sysdesign/horizontal-vs-vertical-scaling, sysdesign/reverse-proxies-and-gateways, sysdesign/consistent-hashing, sysdesign/dns-and-cdns]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "Why does 'sticky sessions' make a load balancer harder to scale?"
    a: "Pinning a user to one server ties state to a machine, so that machine cannot be drained or replaced without losing sessions. Externalise the session store instead."
  - kind: cloze
    text: "A layer-4 balancer routes on {{IP and port}}; a layer-7 balancer can route on {{the URL path}}."
  - kind: qa
    q: "Some requests take 5 ms and others 5 s. Round robin or least connections, and why?"
    a: "Least connections. Round robin hands out equal counts, so a server stuck on slow requests keeps getting more; least connections sends new work to whoever is least busy right now."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Load balancer section, redrawn" }
griddle: load-balancer
---

## Why you need one

One server has a ceiling: so many CPU cores, so much memory, so many open connections. You can buy a bigger machine (**vertical scaling**) for a while, but eventually you need several machines (**horizontal scaling**). That raises two problems: clients need *one* address to talk to, and something must decide which machine handles each request. A **load balancer** is that something. It accepts connections on a public address and forwards each request to one of a pool of **backends** (the app servers behind it).

It also gives you **availability**. If a backend dies, the balancer stops using it, and users never notice. And it makes deploys painless: take one server out of the pool, upgrade it, put it back, repeat.

## How it works

1. **DNS** maps `shop.com` to the balancer's IP address, not to any app server.
2. The client opens a connection to the balancer.
3. The balancer picks a **healthy** backend using its algorithm and forwards the request.
4. The backend replies through the balancer (in most setups) back to the client.

### Algorithms

| Algorithm | How it picks | Good when |
|---|---|---|
| Round robin | Next server in a fixed cycle | Requests cost about the same |
| Weighted round robin | Like round robin, bigger servers appear more often | Servers differ in size |
| Least connections | Server with the fewest requests in flight | Request cost varies a lot |
| Hash (IP, user id, key) | `hash(key) % N`, or a hash ring | You want the same user or key on the same server, e.g. for a local cache |
| Power of two choices | Pick two at random, send to the less busy one | Many balancers, little shared state |

### Health checks

The balancer probes every backend on a schedule, for example `GET /health` every 5 s with a 2 s timeout. After a number of consecutive failures (say 3) it marks the server **unhealthy** and stops routing to it; after a number of consecutive successes (say 2) it brings it back. Requiring several results in a row stops one dropped packet from flapping a server in and out. A good `/health` endpoint checks what the server needs to do real work (can it reach its database?) but stays cheap.

### Layer 4 vs layer 7

A **layer-4** (transport) balancer forwards TCP or UDP connections by IP address and port. It never looks inside, so it is fast and protocol-agnostic. A **layer-7** (application) balancer terminates HTTP, reads the method, path, headers and cookies, and can route `/api/*` to one pool and `/images/*` to another, add headers, retry a failed request on another backend, or terminate **TLS** (decrypt HTTPS once at the edge, so backends do not each need certificates).

## Worked example

Three servers, round robin, health check every 5 s, unhealthy after 3 failures.

| Time | Event | Pool | Request 1, 2, 3, 4 go to |
|---|---|---|---|
| t = 0 s | All healthy | A, B, C | A, B, C, A |
| t = 1 s | B's process hangs | A, B, C | A, B ✗, C, A (every third request fails) |
| t = 15 s | B fails its third check in a row | A, C | A, C, A, C (no errors) |
| t = 60 s | B restarted, passes 2 checks | A, B, C | A, B, C, A |

The window from 1 s to 15 s is why short check intervals matter, and why layer-7 balancers that **retry a failed request on another backend** hide even that window (safe only for idempotent requests).

## Sketch it

A balancer config sketch (nginx-style). Note that open-source nginx's `max_fails` is a *passive* check that counts failed real requests, while the active `GET /health` probes described above need a dedicated health-check feature or a cloud balancer:

```
upstream app {
    least_conn;                       # algorithm
    server 10.0.0.11:8080 max_fails=3 fail_timeout=10s;   # 3 failures → out for 10 s
    server 10.0.0.12:8080 max_fails=3 fail_timeout=10s;
    server 10.0.0.13:8080 weight=2;   # bigger box, double share
}
server {
    listen 443 ssl;                   # TLS terminates here
    location /api/ { proxy_pass http://app; }
}
```

## Edge cases and pitfalls

- **Sticky sessions** (pinning a user to one server via a cookie) tie state to a machine. When it dies, those users lose their session; when you add servers, old users do not move to them. Prefer stateless servers with sessions in a shared store such as Redis.
- **Long-lived connections** (WebSockets, gRPC streams) stay on the server they started on, so a freshly added server gets no load until clients reconnect.
- **Slow start**: a server that just rejoined has a cold cache; some balancers ramp its share up gradually.
- **The balancer itself fails.** Pair it: active/passive with a heartbeat and a floating (virtual) IP, or several active balancers behind DNS. Cloud load balancers are redundant by design.

## In the interview

Usually it appears as "how would you scale this to 10× traffic?" A strong answer puts a balancer in front of **stateless** app servers, names an algorithm and why (least connections for uneven work), mentions **health checks**, and says how the balancer avoids being a single point of failure. Expect the follow-up "what about sessions?" The answer is a shared session store or signed tokens, not sticky sessions. Worth knowing: a software balancer adds well under a millisecond of latency, and a single instance can handle tens of thousands of requests per second.
