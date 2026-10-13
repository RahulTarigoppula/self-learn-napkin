---
title: Horizontal vs Vertical Scaling
track: sysdesign
tags: [scaling, stateless, autoscaling, fundamentals]
difficulty: 1
minutes: 5
tldr: "Scale up = buy a bigger machine: simple, but capped and still one box. Scale out = add more machines behind a load balancer: nearly unlimited, but only once the app servers hold no state of their own."
analogy: "A busy café can buy a bigger espresso machine (scale up) until none bigger exists, and one breakdown stops everything. Or it can hire more baristas (scale out), as long as orders go on a shared board, not in one barista's head."
diagram: horizontal-vs-vertical-scaling
story:
  - title: One server, and it is full
    text: "Your app runs on one machine with 4 CPUs and 16 GB of RAM, and at peak the CPU sits at 95 %. Requests queue up and latency climbs. You need more capacity, and there are two directions to get it."
  - title: "Scale up: buy a bigger box"
    text: "Vertical scaling means moving to a bigger machine, say 64 CPUs and 1 TB of RAM. No code changes, no new moving parts. But there is a ceiling (the biggest box you can buy), prices rise faster than capacity near the top, and it is still one machine whose failure is a full outage."
  - title: "Scale out: many boxes, one balancer"
    text: "Horizontal scaling means running many ordinary machines (A, B, C) behind a load balancer that spreads requests across them. Capacity grows by adding boxes, and losing one costs a third of capacity instead of everything."
  - title: State on a box gets in the way
    text: "There is a catch. If box A keeps the user's shopping cart in its own memory, the next request may land on box B, which has never heard of that user. Any data held only on one app server breaks the 'any box can serve any request' promise."
  - title: "Move state out: stateless app tier"
    text: "The fix is to move state out of the app servers: the cart leaves box A for a shared store such as Redis or a database. Now the boxes are stateless, which makes them interchangeable, and cart:42 is found no matter which box handles the request. This is what makes scale-out work."
  - title: Auto-scaling adds boxes under load
    text: "Because stateless boxes are interchangeable, a controller can add or remove them automatically: for example, add a box when average CPU stays above 70 %, remove one when it falls. You pay for capacity roughly in step with traffic."
keyIdeas:
  - "**Vertical (scale up):** bigger CPU/RAM/disk. Simple and keeps everything on one box, but has a hard ceiling, rising cost and a single point of failure."
  - "**Horizontal (scale out):** more machines behind a load balancer. Near-linear for stateless work, fault-tolerant and elastic."
  - "**Scale-out needs a stateless app tier:** sessions, carts and uploads live in a shared store, not in one server's memory or disk."
  - "**The database is the hard part:** app servers scale out easily; data needs replicas, caches or sharding."
  - "**Scaling up first is often right** for small systems and for databases. It buys time without distributed-systems complexity."
quiz:
  - q: "Users randomly lose their carts after you add a second app server. What is the most likely cause?"
    options: ["The load balancer is overloaded and drops some requests", "Each server keeps carts in its own memory, so the other one has none", "The database is too slow to save each cart before the next request arrives", "The two servers run different CPUs, which corrupts session data"]
    answer: 1
    why: "With local session state, a request routed to the other server finds no cart. Move sessions to a shared store (or use sticky sessions as a stopgap)."
  - q: "Each app server handles 400 requests/s at your target CPU. Peak is 3,000 requests/s across 3 zones, and you must survive losing a whole zone. How many servers?"
    options: ["8", "9", "12", "16"]
    answer: 2
    why: "You need ⌈3,000 / 400⌉ = 8 servers left after a zone fails. With equal spread, 2 of 3 zones must hold 8, so 4 per zone: 12 in total."
  - q: "When is scaling up usually the better first move?"
    options: ["When the system must keep running through a full data-centre outage", "When one relational database is near its limit and is hard to shard", "When traffic is 100× what the largest machine on the market can handle", "Never, because adding servers is always cheaper than a bigger box"]
    answer: 1
    why: "Moving the database to a bigger machine buys headroom with no code changes, while sharding is a large, risky project. Add replicas for failover either way."
  - q: "Why do auto-scalers usually scale out fast but scale in slowly?"
    options: ["Removing servers costs extra, so scalers wait out the billing hour", "New servers take minutes to boot, so dropping them early risks overload", "Load balancers can remove only one server per hour, so scale-in always lags", "Scale-in rules are evaluated only once an hour by the cloud provider"]
    answer: 1
    why: "Under-capacity hurts users immediately, over-capacity only costs money. A cool-down window prevents adding and removing the same boxes over and over."
bigO:
  - { op: "scale up", avg: "1 box", note: "ceiling: largest machine; restart to resize" }
  - { op: "scale out (stateless)", avg: "≈ linear", note: "until a shared dependency saturates" }
  - { op: "capacity lost when 1 of N fails", avg: "1/N" }
  - { op: "typical auto-scale target", avg: "CPU 50–70 %", note: "headroom for spikes and boot time" }
bigOTitle: "Key numbers"
related: [sysdesign/load-balancing, sysdesign/sharding, sysdesign/replication, sysdesign/caching]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "What does 'stateless app tier' mean, and why does it matter?"
    a: "No request depends on data kept only on one app server; all state lives in shared stores. Any server can handle any request, so you can add, remove or lose servers freely."
  - kind: cloze
    text: "Scaling {{up}} means a bigger machine; scaling {{out}} means more machines."
  - kind: qa
    q: "Name three limits of vertical scaling."
    a: "A hard ceiling (the largest machine), cost that rises faster than capacity near the top, and a single point of failure (resizing often needs a restart too)."
  - kind: cloze
    text: "Sticky sessions pin a user to one server; they are a {{stopgap}} because a server failure still {{loses those sessions}}."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Horizontal scaling and application layer sections, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How it works

**Scalability** is a system's ability to handle more load by adding resources. There are two directions.

### Vertical scaling (scale up)

Give the existing machine more CPU cores, more RAM, faster disks or a faster network card. In the cloud this is choosing a larger instance type.

- **Why it is attractive:** zero code change. Everything stays in one process space, so there are no network calls between parts, no distributed transactions, no consistency puzzles.
- **Why it runs out:** there is a **ceiling**: the largest cloud machines top out at several hundred vCPUs and a few tens of terabytes of RAM. Near the top, price grows **faster than capacity**. Resizing usually needs a **restart**. And however big it is, it is still **one machine**: one hardware fault, kernel panic or bad deploy is a full outage.

### Horizontal scaling (scale out)

Run several copies of the service on ordinary machines and put a **load balancer** in front to spread requests. Capacity grows roughly linearly as long as each request can be served independently. Losing one of N machines costs 1/N of capacity rather than all of it, and machines can be added during the day and removed at night.

The price: more moving parts, network hops between components, and one precondition: the servers must be interchangeable.

## The stateless app tier

A server is **stateless** when it keeps nothing between requests that another server would need. Things that silently make a server stateful:

| Hidden state | Where it should live |
|---|---|
| login sessions, shopping carts | shared session store (Redis) or a signed token the client sends back |
| uploaded files on local disk | object storage (S3 or similar) |
| in-memory caches that must be correct | a shared cache, or treat local caches as disposable |
| scheduled jobs running on "the" server | a job queue or a scheduler with leader election |

**Sticky sessions** (the load balancer pins each user to one server by cookie) are a common stopgap. They work, but load becomes uneven, a server failure still logs its users out, and draining a server takes as long as its longest session.

Once the app tier is stateless, the **state lives in the data tier**, which becomes the hard part. You scale it with caching, **read replicas** (copies serving reads) and eventually **sharding** (splitting data across machines). Many teams therefore scale the app tier out and the database *up* for as long as they can.

## When vertical is the right first move

- **Early on.** One well-sized server handles far more than most new products need; adding distributed machinery early costs engineering time you could spend on the product.
- **Databases.** A relational database on a big machine with fast NVMe disks and plenty of RAM can serve a very large workload. Moving it to the next instance size is a weekend task; sharding is a quarter-long project. Stack Overflow, for example, has publicly described serving a very large site from a handful of big SQL Server machines.
- **Hard-to-split work.** Some workloads, such as a large in-memory graph or a single-threaded bottleneck, do not split well across machines.

Even then, keep a **replica** for failover: scaling up does not fix the single point of failure.

## Worked example

An app server (4 vCPU) handles 400 requests/s at 70 % CPU. Peak traffic is 3,000 requests/s. You deploy across 3 availability zones (separate data centres in one region).

1. Bare minimum: ⌈3,000 / 400⌉ = **8** servers.
2. Survive one server failing: 9.
3. Survive a whole zone failing: the 2 remaining zones must hold 8 servers, so 4 per zone → **12** servers in normal operation (running at 3,000 / (12 × 400) ≈ 63 % of target load).
4. Auto-scaling: minimum 12 at peak hours, fewer at night (e.g. 6 when traffic is 1,000 requests/s), maximum 40 for launches.

One 64-vCPU box might handle the same load, but then any failure is a total outage, and a standby twin doubles the cost while sitting idle.

## Sketch it

A stateless request handler, in pseudocode: all user state comes from the request plus a shared store.

```text
handle add_to_cart(request):
    key = "cart:" + request.cookie("sid")
    n   = shared_store.append(key, request.body.item_id)   # atomic append, e.g. in Redis
    shared_store.expire(key, 7 days)                        # idle carts expire after a week
    return { items: n }                                     # any server could have answered this
```

An auto-scaling rule, as a Kubernetes config:

```yaml
# Kubernetes Horizontal Pod Autoscaler: keep average CPU near 70 %
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: web }
  minReplicas: 6
  maxReplicas: 40
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
  behavior:
    scaleDown: { stabilizationWindowSeconds: 300 }   # wait 5 min before removing pods
```

## Auto-scaling

An **auto-scaler** watches a metric (CPU, requests per instance, queue length) and adjusts the number of instances to keep it near a target.

- **Target below 100 %.** New instances take time to boot and warm up (often a minute or more), so the target (commonly 50–70 % CPU) leaves headroom for the spike that arrives meanwhile.
- **Scale out fast, scale in slowly.** A cool-down window prevents *flapping* (adding and removing the same instances repeatedly).
- **Drain before removing.** Stop sending new requests to an instance and let in-flight ones finish.
- **Scheduled or predictive scaling** adds capacity before a known daily peak or a marketing launch.
- **Limits matter.** A maximum protects your bill and your database from a runaway scale-out; a minimum keeps enough instances to survive a failure.

## Edge cases and pitfalls

- **Shared bottlenecks.** Doubling app servers does nothing if the database is the limit. In fact more servers mean more database connections, which can make things worse. Use connection pooling.
- **Hidden local state.** A local file cache, an in-memory rate-limit counter or a cron job on one box breaks once there are several.
- **Scaling on the wrong metric.** I/O-bound services may sit at 20 % CPU while queues explode; scale on latency or queue depth instead.

## In the interview

Start simple and say so: "one server can handle the first months; I would scale the database up and the app tier out." Show that you know the precondition for scale-out (a stateless tier, sessions in a shared store), size the fleet with numbers including failure headroom, and name what breaks next (the database, then caching, replicas and sharding). Expect *"What if the load balancer fails?"* Run a redundant pair, or use a managed, multi-zone balancer.
