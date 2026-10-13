---
title: Geo-Replication
track: sysdesign
tags: [replication, latency, availability, distributed]
difficulty: 3
minutes: 5
tldr: "Copy your system to several regions so users get nearby answers and a region can fail. Active-passive keeps one writer; active-active lets every region write and must resolve conflicts."
analogy: "A shop chain with branches on three continents. One head office can approve every price change (simple, but slow for far branches), or each branch sets prices itself and someone has to reconcile when two branches change the same item."
diagram: geo-replication
story:
  - title: Distance costs time
    text: "All servers sit in US East and a user in Paris sends each request about 6,200 km. Light in optical fibre travels at roughly 200,000 km/s, so a round trip costs at least 62 ms, around 80 ms in practice. A page that needs three sequential round trips spends a quarter of a second just on distance."
  - title: "Active-passive: copies near users"
    text: "Add regions in Europe and Asia holding asynchronous replicas. US East stays the only primary, the one place that accepts writes. Paris now reads from Europe in about 2 ms, but its writes still cross the Atlantic. If US East fails, a replica region is promoted and the writes still in flight are lost."
  - title: "Active-active: every region takes writes"
    text: "To make writes local too, let every region accept them and replicate to the others in the background. New York sets x = A in US East while Paris sets x = B in Europe at almost the same moment. Neither region knew about the other, so after replicating they disagree: a write conflict."
  - title: "Resolve conflicts: LWW or CRDT"
    text: "Last-writer-wins keeps the write with the later timestamp and silently drops the other; simple, but data is lost and clock skew can pick the wrong one. CRDTs are data types designed to merge, such as counters that add up both regions' increments, so nothing is lost."
  - title: Route users to the nearest region
    text: "Finally, each user must reach the closest region. GeoDNS answers the DNS lookup with the address of a nearby region; anycast announces one IP address from every region and lets internet routing deliver to the nearest. If a region dies, users are routed to the next closest."
keyIdeas:
  - "**Physics sets the floor:** fibre carries light at ≈ 200,000 km/s, so every 100 km of distance adds about 1 ms of round trip. No software removes it."
  - "**Active-passive:** one writable region, async replicas elsewhere. Simple, no conflicts; remote writes are slow and failover loses the replication lag."
  - "**Active-active:** every region writes locally; you must avoid conflicts (home each record in one region) or resolve them (LWW, CRDTs, app merge)."
  - "**Strong consistency across regions** needs a cross-region quorum: every write pays tens to hundreds of ms."
  - "**Data residency** laws can pin some data to a country or region, which constrains where replicas may live."
  - "**Routing:** GeoDNS or anycast sends users to the nearest healthy region; follow-the-sun shifts capacity or write ownership with daytime traffic."
quiz:
  - q: "A user in Sydney talks to a database in Virginia, about 15,700 km away. What is the minimum round-trip time imposed by light in fibre?"
    options: ["About 16 ms", "About 79 ms", "About 157 ms", "About 1.5 s"]
    answer: 2
    why: "Round trip = 2 × 15,700 km = 31,400 km. At ≈ 200,000 km/s that is ≈ 157 ms, before any routing detours or server time. Real measurements are higher."
  - q: "Active-passive with async replication. The primary region fails with a replication lag of 3 seconds. What is lost?"
    options: ["Nothing", "Up to about the last 3 seconds of acknowledged writes", "All data in the primary region", "Only reads"]
    answer: 1
    why: "Async replicas trail the primary by the lag. Writes acknowledged in that window never reached the replica that gets promoted. That window is the recovery point objective (RPO)."
  - q: "Two regions concurrently increment a 'likes' counter, by 3 and by 2. Which approach ends with 5 everywhere?"
    options: ["Last-writer-wins on the counter value", "A G-Counter CRDT that keeps a per-region count and sums them", "Taking the larger of the two values", "Rejecting both writes"]
    answer: 1
    why: "LWW keeps one region's total and drops the other's increments. A G-Counter stores each region's own count, merges by per-region maximum and reports the sum, so 3 + 2 = 5 in both regions."
  - q: "What is the main difference between GeoDNS and anycast routing?"
    options: ["GeoDNS is faster", "GeoDNS returns different IPs based on where the lookup comes from; anycast uses one IP announced from many places and lets BGP pick the nearest", "Anycast only works for UDP", "They are the same"]
    answer: 1
    why: "GeoDNS decides at name resolution time (and is subject to DNS caching). Anycast decides at packet routing time, so withdrawing a failed region's route moves traffic quickly."
bigO:
  - { op: "same datacentre RTT", avg: "≈ 0.5 ms" }
  - { op: "per 100 km of fibre", avg: "≈ 1 ms RTT", note: "light at ≈ 200,000 km/s, there and back" }
  - { op: "New York ↔ London", avg: "≥ 56 ms", note: "≈ 5,600 km; ~70 ms measured" }
  - { op: "US East ↔ Singapore", avg: "≥ 155 ms", note: "≈ 15,500 km; 200+ ms measured" }
bigOTitle: "Key numbers"
related: [sysdesign/replication, sysdesign/consistency-models, sysdesign/dns-and-cdns, sysdesign/cap-theorem]
prereqs: [sysdesign/replication, sysdesign/consistency-models]
flashcards:
  - kind: qa
    q: "Roughly how much round-trip latency does each 100 km of fibre add, and why?"
    a: "About 1 ms: light in glass moves at ≈ 200,000 km/s, i.e. 200 km per ms, and a round trip covers the distance twice."
  - kind: cloze
    text: "In {{active-passive}} geo-replication only one region accepts writes; in {{active-active}} every region does and conflicts must be resolved."
  - kind: qa
    q: "Name three ways to handle write conflicts in active-active setups."
    a: "Avoid them by giving each record a home region; last-writer-wins by timestamp (loses data); CRDTs or application-level merges that combine both writes."
  - kind: qa
    q: "What do RPO and RTO mean for a region failover?"
    a: "RPO (recovery point objective) is how much recent data you can lose, roughly the replication lag. RTO (recovery time objective) is how long until service is back in another region."
sources:
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Availability patterns and DNS, background" }
---

## Why go multi-region

**Geo-replication** runs copies of your data and services in several geographic **regions** (groups of datacentres in one metro area, hundreds or thousands of kilometres apart). Three motives:

1. **Latency.** Users far from your only region pay for distance on every round trip.
2. **Disaster tolerance.** A power, network or configuration failure can take out a whole region; another region can take over.
3. **Data residency.** Some data must, by law or contract, be stored in a particular country or region.

## The physics

Light travels at about 300,000 km/s in a vacuum but only about **200,000 km/s in optical fibre**, slowed by the glass. That is 200 km per millisecond one way, so a **round trip costs about 1 ms per 100 km** of distance. Real cables do not follow the shortest path and routers add delay, so measured times are typically 1.3 to 2 times the theoretical floor.

| Route | Distance | Floor (RTT) | Typical measured |
|---|---|---|---|
| Within one region | < 100 km | < 1 ms | 1–2 ms |
| New York ↔ London | ≈ 5,600 km | ≈ 56 ms | ≈ 70 ms |
| Paris ↔ US East | ≈ 6,200 km | ≈ 62 ms | ≈ 80 ms |
| US East ↔ Singapore | ≈ 15,500 km | ≈ 155 ms | 200+ ms |

The killer is **sequential** round trips. A page that does a TLS handshake and then three dependent database queries across the Atlantic can spend 300 ms or more on distance alone. Within a region, the same work costs a few milliseconds.

## How it works

### Active-passive (primary region + standby regions)

One region is the **primary**: it accepts all writes. Other regions hold **asynchronous replicas** that serve local reads and stand by for failover.

- **Reads** are local and fast everywhere, subject to replication lag. Users may need read-your-writes routing back to the primary right after they write.
- **Writes** from far away pay the full cross-region round trip.
- **Failover:** when the primary region fails, promote a standby region and repoint traffic. Writes not yet replicated are lost; that window is the **RPO** (recovery point objective). How long the switch takes is the **RTO** (recovery time objective), often minutes because it involves detection, promotion and DNS changes.

Making the cross-region link synchronous drives RPO to zero, but every write then waits a cross-region round trip.

### Active-active (multi-leader)

Every region accepts writes locally and replicates them asynchronously to the others. Writes are fast for everyone and any region can keep working when cut off. The price is **write conflicts**: two regions change the same item before hearing about each other. Options, best first:

1. **Avoid conflicts by homing data.** Give each user (or tenant, or document) a home region; only that region writes their records. Most traffic is local because users mostly sit near their home. Moving a user's home is an explicit, rare operation.
2. **Last-writer-wins (LWW).** Attach a timestamp and keep the highest. Easy and convergent, but the losing write vanishes silently, and with clock skew an earlier write can win.
3. **CRDTs** (conflict-free replicated data types). Data types whose merge is commutative, associative and idempotent, so replicas that have seen the same updates converge whatever the delivery order: counters, sets (add-wins), registers, collaborative text.
4. **Application merge.** Keep both versions (siblings) and let code or the user decide, like a shopping cart that unions both carts.

### Globally consistent databases

Systems such as Google Spanner and CockroachDB keep **linearizable** data across regions by running consensus (Paxos or Raft) over replicas in several regions. Nothing conflicts, but every write waits for a majority of replicas, so placing them in three continents means 100 ms or more per write. They let you place a row's replicas close to where it is used to soften this.

### Routing users

- **GeoDNS:** the DNS server answers with the IP address of the region nearest to the resolver asking. Simple and flexible, but clients and resolvers cache answers for the record's TTL, so failover is only as fast as caches expire.
- **Anycast:** every region announces the **same** IP prefix over BGP and the internet's routing delivers each packet to the topologically nearest one. Withdrawing a failed region's announcement moves traffic within seconds to minutes. CDNs and public DNS resolvers rely on it.
- **Follow-the-sun:** traffic peaks move around the globe with daytime. Systems can shift capacity, or even move a dataset's write leadership, to the region currently busiest.

### Data residency

Rules such as the EU's GDPR restrict transferring personal data outside the EU without safeguards, and some national rules require certain data, such as payment data in India, to be stored in the country. In practice: tag records with a residency zone, keep their primary and replicas inside it, and make sure backups, logs, analytics copies and caches obey the same rule.

## Worked example

A social app with users in the US and Europe, primary in US East.

| Design | Paris read | Paris write | Region failure |
|---|---|---|---|
| Single region | ≈ 80 ms | ≈ 80 ms | full outage |
| Active-passive, EU replica | ≈ 2 ms | ≈ 80 ms | promote EU; lose ~lag of writes |
| Active-active, users homed | ≈ 2 ms | ≈ 2 ms | re-home users of the dead region |
| Global consensus, 3 regions | ≈ 2 ms (stale) or ≈ 80 ms (strong) | ≈ 80 ms+ | keeps working with 2 of 3 regions |

Likes on a post are written in both regions at once. With a G-Counter CRDT each region counts its own increments, the counts replicate, and every region reports the sum.

## In code

```python
class GCounter:
    """Grow-only counter CRDT: each region bumps only its own slot."""
    def __init__(self, region):
        self.region, self.counts = region, {}

    def incr(self, n=1):
        self.counts[self.region] = self.counts.get(self.region, 0) + n

    def merge(self, other):                 # commutative, associative, idempotent
        for r, c in other.counts.items():
            self.counts[r] = max(self.counts.get(r, 0), c)

    def value(self):
        return sum(self.counts.values())

us, eu = GCounter("us"), GCounter("eu")
us.incr(3); eu.incr(2)                      # concurrent likes in two regions
us.merge(eu); eu.merge(us); us.merge(eu)    # any order, any number of times
print(us.value(), eu.value())               # 5 5: converged, nothing lost

def lww(a, b):                              # last-writer-wins register
    return max(a, b)                        # (timestamp, region, value); region breaks ties
print(lww((1000.120, "us", "A"), (1000.135, "eu", "B")))   # (1000.135, 'eu', 'B'): A is lost
```

## Edge cases and pitfalls

- **Uniqueness across regions.** Two regions can both accept the username `ada`. Constraints that must be global need a single home for that key range or a cross-region consensus check.
- **Split brain between regions.** If the link between regions breaks, both sides of an active-passive pair may decide to be primary. Use a third region as a tie-breaker witness.
- **Failover is a feature you must exercise.** Untested runbooks, stale DNS caches and capacity that cannot absorb a second region's traffic turn a region outage into a global one.
- **Chatty cross-region calls.** One service calling another across an ocean in a loop multiplies the latency. Keep request paths inside one region.

## In the interview

Typical prompts: *"Users in Asia complain the app is slow"* or *"how do you survive a region outage?"* Do the physics first (≈ 1 ms per 100 km of round trip), then propose read replicas in each region with GeoDNS or anycast routing, decide between active-passive and active-active, and say how you handle conflicts: home each user in a region, use CRDTs for counters and sets, and LWW only where losing a write is acceptable. State RPO and RTO explicitly and mention data residency if personal data is involved.
