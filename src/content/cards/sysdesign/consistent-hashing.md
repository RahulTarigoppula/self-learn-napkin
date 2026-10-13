---
title: Consistent Hashing
track: sysdesign
tags: [caching, sharding, distributed]
difficulty: 2
minutes: 4
tldr: "Hash servers and keys onto the same ring; a key belongs to the next server clockwise — so adding a server moves only one slice of keys."
analogy: "Picture a circular food court: every customer walks clockwise to the nearest open stall. Open a new stall and only the customers just behind it change where they eat."
diagram: consistent-hashing
story:
  - title: The problem with hash % N
    text: "The naive way to spread keys over N cache servers is server = hash(key) % N. It works until N changes: go from 4 to 5 servers and about 80 % of keys suddenly map somewhere else — a cache stampede. Consistent hashing starts by bending the hash range into a circle."
  - title: Servers get a spot on the ring
    text: "Hash each server's name with the same hash function you use for keys. Each server lands at some point on the ring. Nothing is assigned yet — we have just placed landmarks."
  - title: Keys land on the same ring
    text: "Now hash a key, say cart:42. It lands on the ring too, somewhere between two servers. Because both use one hash function, servers and keys share a single coordinate system."
  - title: Walk clockwise
    text: "The rule is one line: a key belongs to the first server you meet walking clockwise. cart:42 walks past nothing until it reaches B, so B owns it. Lookups are a binary search over the sorted server positions — O(log n)."
  - title: Add a server, move one slice
    text: "Server D joins between B and C. Only the keys that sat between B and D change owner — they now hit D first. Everything else stays put. On average just K/N keys move instead of nearly all of them."
keyIdeas:
  - "**Only ~K/N keys move** when a node joins or leaves — the rest of the cache stays warm."
  - "**Virtual nodes** give each server many ring positions, which evens out load and lets a big machine take a bigger share."
  - "Lookup is a **binary search** over the sorted ring positions: O(log n) in the number of positions."
  - "Plain `hash(key) % N` re-maps almost everything when N changes — that is the whole problem this solves."
  - "Used by **Cassandra**, Amazon's original **Dynamo** design and many memcached client libraries."
quiz:
  - q: "A ring has servers at 40°, 160° and 280°. Which server owns a key hashed to 300°?"
    options: ["The one at 280°", "The one at 40°", "The one at 160°", "It depends on the key's size"]
    answer: 1
    why: "Walk clockwise from 300°. Nothing sits between 300° and 360°, so you wrap past 0° and the first server you meet is the one at 40°."
  - q: "You have 1,000,000 keys on 10 servers and add an 11th. Roughly how many keys move with consistent hashing?"
    options: ["About 1,000", "About 91,000", "About 500,000", "About 909,000"]
    answer: 1
    why: "The new server takes roughly an equal share, ≈ K/N = 1,000,000 / 11 ≈ 91,000 keys. With hash % N about 909,000 (10/11) would move."
  - q: "Why do real systems give each server many virtual nodes?"
    options: ["To make lookups O(1)", "To spread each server's share evenly around the ring", "To encrypt keys", "To avoid hashing server names"]
    answer: 1
    why: "With one position per server, arcs are random lengths and one server may own a huge slice. Many small positions average out, and a failed server's load spreads over all the others instead of one neighbour."
bigO:
  - { op: "lookup", avg: "O(log n)", note: "binary search over the sorted ring positions" }
  - { op: "keys moved when a node joins", avg: "≈ K/N" }
  - { op: "keys moved with hash % N", avg: "≈ K·(N−1)/N", note: "almost everything" }
related: [dsa/hash-tables, sysdesign/sharding, sysdesign/caching]
prereqs: [dsa/hash-tables]
griddle: hash-ring
special: true
flashcards:
  - kind: qa
    q: "Why does consistent hashing minimise re-mapping when a node joins?"
    a: "Only keys between the new node and its predecessor move (~K/N keys)."
  - kind: cloze
    text: "Virtual nodes fix {{uneven load}} by giving each server {{many ring positions}}."
  - kind: qa
    q: "With plain hash(key) % N, roughly what fraction of keys move when N goes from 4 to 5?"
    a: "About 80 % — a key stays only if hash % 4 and hash % 5 happen to agree, which is rare. That stampede is exactly what consistent hashing avoids."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Consistent hashing, redrawn" }
---

## Why `hash % N` breaks

Suppose four cache servers hold your users' sessions and you route with `server = hash(key) % 4`. Traffic grows, you add a fifth server, and the formula becomes `hash(key) % 5`. A key keeps its server only when both remainders agree — for a uniform hash that is about 1 in 5. So roughly **80 % of keys now look on the wrong server**, miss, and hammer the database at the same moment. The same happens when a server *dies*. Modulo hashing ties every key's location to the total count, so any change to the count reshuffles nearly everything.

## How it works

1. **Pick a hash space and bend it into a ring.** With a 32-bit hash the positions run from 0 to 2³²−1, and the position after the last wraps back to 0.
2. **Place every server on the ring** by hashing something stable about it — its name or address: `pos(A) = hash("A")`.
3. **Place every key on the same ring** with the same hash function: `pos(k) = hash(k)`.
4. **Owner rule:** a key belongs to the first server at or after its position, walking clockwise (wrapping around at the end).

Keep the server positions in a **sorted array**. Finding the owner is then a binary search for the first position ≥ `pos(k)`, falling back to index 0 if you run off the end — O(log n).

### Why only a slice moves

When server D joins, it lands somewhere between two existing servers, say B before it and C after it. Keys between B and D used to walk past that spot and on to C; now they stop at D. **No other key's walk changes**, because D is invisible to anyone who reaches a server before D's position. With N servers evenly spread, the slice is ~1/N of the ring, so ~K/N keys move. Removing a server is the mirror image: only its keys move, to its clockwise successor.

## Virtual nodes

Three random points on a circle almost never divide it evenly — one server might own 50 % of the ring. And when that server fails, *all* its keys land on a single neighbour, which may then fall over too.

The fix: hash each server many times (`A#0`, `A#1`, … `A#99`) so it owns many small arcs scattered around the ring. The arcs average out to an even share, a failed server's keys spread across *all* the survivors, and a machine with twice the memory can simply get twice the virtual nodes.

## Worked example

Servers at A = 40°, B = 160°, C = 280° (one position each). Keys at k1 = 10°, k2 = 55°, k3 = 170°, k4 = 200°, k5 = 300°, k6 = 350°.

| Key | Position | Walk clockwise to | Owner |
|---|---|---|---|
| k1 | 10° | 40° | A |
| k2 | 55° | 160° | B |
| k3 | 170° | 280° | C |
| k4 | 200° | 280° | C |
| k5 | 300° | wraps to 40° | A |
| k6 | 350° | wraps to 40° | A |

Add D at 220°: k3 (170°) and k4 (200°) now meet D before C, so **only k3 and k4 move**. Remove B instead: only k2 moves, on to C.

## Implement it in Python

The idea is language-independent; here it is in Python.

```python
import bisect, hashlib

def h(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)  # 32-bit position

class Ring:
    def __init__(self, servers, vnodes=100):
        self.points = []                       # sorted list of (position, server)
        for s in servers:
            self.add(s, vnodes)

    def add(self, server, vnodes=100):
        for v in range(vnodes):
            bisect.insort(self.points, (h(f"{server}#{v}"), server))

    def remove(self, server):
        self.points = [p for p in self.points if p[1] != server]

    def owner(self, key: str) -> str:
        i = bisect.bisect_left(self.points, (h(key), ""))
        return self.points[i % len(self.points)][1]   # wrap past the end
```

## Edge cases and pitfalls

- **Replication:** to keep R copies, walk clockwise and take the next R *distinct physical* servers — skip virtual nodes of a server you already chose.
- **Hot keys** still hurt: consistent hashing balances *keys*, not *traffic*. One celebrity key overloads its owner no matter where it lands — cache it in more places or split it.
- **Everyone must agree on the ring.** Clients with different server lists route the same key differently. Distribute membership through a coordinator or gossip.

## In the interview

Draw the ring first, place three servers and a key, and say "first server clockwise". Then volunteer the two follow-ups interviewers usually ask: *what happens when a node joins or dies* (only its neighbour's slice moves) and *how do you avoid hot spots* (virtual nodes, replication to the next distinct nodes).
