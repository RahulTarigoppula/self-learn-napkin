---
title: DNS and CDNs
track: sysdesign
tags: [networking, caching, dns, cdn, latency]
difficulty: 2
minutes: 5
tldr: "DNS turns a name into an IP via root → TLD → authoritative servers, caching answers for their TTL. A CDN keeps copies of your files on edges near users, so most requests never reach your origin."
analogy: "DNS is directory enquiries that remembers every number it has looked up for a while. A CDN is a chain of corner shops stocked from one central warehouse: buy locally if they have it, otherwise the shop orders it once and keeps it on the shelf."
diagram: dns-and-cdns
story:
  - title: Who knows img.shop.com?
    text: "Your browser needs the IP address for img.shop.com. It does not search the internet itself; it asks a recursive resolver — usually run by your ISP or a public service like 1.1.1.1 — which does the legwork and remembers the answers."
  - title: Walk down the hierarchy
    text: "With an empty cache the resolver starts at a root server, which does not know the answer but says 'ask the .com servers'. The .com TLD server says 'ask ns1.shop.com'. Each step is a referral one level down the name, read right to left."
  - title: The authoritative answer, cached for its TTL
    text: "The authoritative server for shop.com finally answers: 203.0.113.7, valid for 300 seconds. The resolver caches it for that TTL and returns it, so the next user asking within five minutes gets an instant answer and nobody bothers the root or .com servers."
  - title: That IP is a nearby CDN edge
    text: "For a site behind a CDN, the name is usually aliased (a CNAME) to the CDN, whose DNS hands back the IP of an edge server close to you rather than the origin. You request /logo.png from 10 ms away. If the edge already has it — a cache hit — it answers immediately, and the origin never sees the request."
  - title: A miss goes to the origin once
    text: "If the edge does not have the file — a miss — it fetches it from the origin, perhaps 150 ms away, returns it to you and keeps a copy for as long as the Cache-Control max-age allows. Every later user near that edge gets a hit."
  - title: "Changing a file: purge or rename"
    text: "The hard part is updates. Edges keep serving the old logo until its max-age expires. Either purge it from every edge through the CDN's API, or — better — publish the new file under a new name like logo.v2.png so old and new can never be confused."
keyIdeas:
  - "**Resolution is a chain of referrals:** recursive resolver → root → TLD → authoritative. Caching means most lookups stop at the resolver."
  - "**TTL is a trade-off:** short TTLs make changes and failover fast but cost more lookups; long TTLs are cheap but slow to change."
  - "**A CDN cuts round-trip time and origin load**: hits are served from an edge near the user; only misses reach the origin."
  - "**Pull CDN** fetches on first miss; **push CDN** is loaded by you in advance. Pull is the common default."
  - "**Cache key = what makes two requests 'the same'** (usually host + path + query). Put too much in it and the cache fragments; leave out something that changes the response and users get the wrong — or another user's — page."
  - "**Best invalidation is no invalidation:** fingerprinted file names with long max-age; purge only for mistakes."
quiz:
  - q: "A resolver with an empty cache looks up img.shop.com. Which server does it ask second?"
    options: ["The root server", "The .com TLD server", "The authoritative server for shop.com", "The CDN edge"]
    answer: 1
    why: "The root refers it to the .com TLD servers; the TLD refers it to shop.com's authoritative servers, which give the final answer."
  - q: "You plan to move shop.com to a new IP tomorrow. Its A record has a TTL of 86,400 s. What should you do today?"
    options: ["Nothing; DNS updates instantly", "Lower the TTL (e.g. to 60 s) at least a day before the move", "Raise the TTL so the change sticks", "Purge the CDN"]
    answer: 1
    why: "Resolvers may keep the old answer for up to the TTL they received. Lower it at least one old-TTL in advance so that at switch time caches hold the record for only a minute."
  - q: "Edge hit ratio goes from 95 % to 99 % at 10,000 requests/s. How does origin traffic change?"
    options: ["Drops by 4 %", "Halves", "Drops from 500 to 100 requests/s — five times less", "Does not change"]
    answer: 2
    why: "The origin sees only misses: 5 % of 10,000 = 500/s versus 1 % = 100/s. Small gains in hit ratio are large cuts in origin load."
  - q: "Why do teams name static files like app.3f9a1c.js?"
    options: ["To hide the code", "The hash changes whenever the content changes, so the file can be cached forever and a new version is a new URL", "CDNs require hashes", "It makes files smaller"]
    answer: 1
    why: "A content hash in the name means a URL's content never changes. Set max-age to a year; a deploy simply references new URLs, and no purge is needed."
bigO:
  - { op: "lookup, resolver cache hit", avg: "~1 RTT to resolver", note: "often < 20 ms" }
  - { op: "lookup, cold cache", avg: "+3 queries", note: "root and TLD refer; the authoritative server answers" }
  - { op: "CDN hit", avg: "RTT to edge", note: "often 5–30 ms" }
  - { op: "CDN miss", avg: "RTT to edge + edge→origin", note: "can be 100+ ms" }
  - { op: "origin load", avg: "requests × (1 − hit ratio)" }
bigOTitle: "Key numbers"
related: [sysdesign/client-server-basics, sysdesign/caching, sysdesign/cache-invalidation, sysdesign/load-balancing]
prereqs: [sysdesign/client-server-basics]
flashcards:
  - kind: qa
    q: "Walk through a cold DNS lookup for img.shop.com."
    a: "Browser/OS asks a recursive resolver. The resolver asks a root server (referral to .com), a .com TLD server (referral to shop.com's nameservers), then the authoritative server, which returns the record and its TTL. The resolver caches it."
  - kind: cloze
    text: "A {{pull}} CDN fetches from the origin on the first miss; a {{push}} CDN is uploaded to in advance."
  - kind: qa
    q: "What goes wrong if a CDN's cache key ignores the session cookie on a personalised page?"
    a: "The first user's page is cached and served to everyone who requests that URL — a data leak. Personalised responses must be marked private or no-store."
  - kind: cloze
    text: "With a hit ratio of 99 %, only {{1 %}} of requests reach the {{origin}}."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Domain name system and content delivery network sections, redrawn" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## How DNS works

The **Domain Name System** is a distributed, cached database that maps names to records. Names are a tree read right to left: `img.shop.com.` sits under `shop.com`, under `com`, under the unnamed **root**. Each level *delegates* the level below to other servers.

1. **Stub resolver.** Your OS has a tiny client that checks the local cache and the hosts file, then sends the question (usually over UDP port 53, or encrypted with DNS over HTTPS/TLS) to a configured **recursive resolver**.
2. **Recursive resolver.** It answers from cache if it can. Otherwise it resolves *iteratively*:
   - asks a **root server** — there are 13 root server names (a–m), each served by many machines worldwide via anycast. The root replies with a *referral*: the nameservers for `.com`.
   - asks a **TLD server** for `.com`, which refers it to the nameservers listed for `shop.com`.
   - asks shop.com's **authoritative nameserver**, which holds the actual records and answers.
3. The resolver caches each answer — including the referrals — for its **TTL** (time to live, in seconds) and returns the final record to the client.

Because referrals are cached too (the `.com` nameserver records have a TTL of two days), a busy resolver almost never talks to the root; most lookups are one hop to a warm resolver.

### Records you will meet

| Type | Maps | Example |
|---|---|---|
| `A` / `AAAA` | name → IPv4 / IPv6 address | `img.shop.com → 203.0.113.7` |
| `CNAME` | name → another name (alias) | `img.shop.com → shop.cdn-provider.net` |
| `NS` | zone → its authoritative servers | `shop.com → ns1.shop.com` |
| `MX` / `TXT` | mail servers / free text (verification, SPF) | |

### TTL trade-offs

A **short TTL** (30–300 s) lets you fail over or move traffic quickly, at the cost of more queries and a little more latency for users. A **long TTL** (hours to a day) is cheap and fast but means a change can take that long to reach everyone, because resolvers keep the old answer until it expires. The standard move before a migration: lower the TTL at least one old-TTL in advance, switch, then raise it again. Note also that failed lookups (`NXDOMAIN`) are cached — *negative caching* — so a typo'd record can linger after you fix it.

DNS can also do coarse traffic steering. **GeoDNS** answers differently depending on where the resolver is. **Anycast** announces the *same* IP from many locations and lets internet routing (BGP) deliver each packet to the nearest one. CDNs use both.

## How a CDN works

A **content delivery network** is a fleet of caching reverse proxies, grouped into **points of presence (PoPs)** in many cities. You point a hostname at it — typically `img.shop.com CNAME shop.cdn-provider.net` — and the CDN's DNS or anycast routes each user to a nearby edge.

- **Hit:** the edge has a fresh copy and responds directly. The round trip is to a server maybe 10 ms away instead of 150 ms.
- **Miss:** the edge forwards the request to your **origin**, returns the response, and stores it if the headers allow. Many CDNs add an **origin shield** (a mid-tier cache) so a miss in 200 edges becomes one request to the origin, not 200.
- **Revalidation:** when a copy expires, the edge can ask the origin "has it changed?" with `If-None-Match: "<etag>"`; the origin answers `304 Not Modified` with no body if not.

Even uncacheable requests benefit: the edge terminates TCP and TLS close to the user (short handshakes) and reuses warm connections to the origin.

### Push versus pull

| | Pull CDN | Push CDN |
|---|---|---|
| How content arrives | edge fetches on first miss | you upload it ahead of time |
| First request | slow (miss) | fast |
| Effort | almost none; driven by headers | you manage uploads and deletions |
| Best for | websites, most traffic | large, rarely changing files (videos, installers) |

### Cache keys

The **cache key** decides when two requests are the same object. The default is roughly host + path + query string. Add too much (every query parameter, tracking tags such as `utm_source`, cookies) and identical content is stored under thousands of keys — the hit ratio collapses. Leave out something that changes the response (the `Accept-Encoding` that chose gzip vs brotli, the user's session) and the CDN serves the wrong variant, or another user's private page. The `Vary` header tells caches which request headers matter.

## Worked example

A shop in Virginia serves shoppers in Sydney (RTT ≈ 200 ms) through a CDN edge in Sydney (RTT ≈ 10 ms). Static assets get 10,000 requests a second.

| Situation | Latency for a user | Requests/s reaching origin |
|---|---|---|
| no CDN | ~200 ms per round trip | 10,000 |
| CDN, hit ratio 95 % | ~10 ms on hits | 500 |
| CDN, hit ratio 99 % | ~10 ms on hits | 100 |

Going from 95 % to 99 % looks small but cuts origin traffic **five-fold**, because the origin only sees misses. That is why teams obsess over cache keys and TTLs.

## Sketch it

```text
# 1) DNS: follow the referrals yourself
$ dig +trace img.shop.com
.             518400 IN NS a.root-servers.net.   <- root
com.          172800 IN NS a.gtld-servers.net.   <- TLD referral
shop.com.     172800 IN NS ns1.shop.com.         <- authoritative servers
img.shop.com.    300 IN A  203.0.113.7           <- the answer, TTL 300 s

# 2) CDN: the origin's headers drive the edge
/static/app.3f9a1c.js   Cache-Control: public, max-age=31536000, immutable
/products/42            Cache-Control: public, max-age=0, s-maxage=60
/cart                   Cache-Control: private, no-store
```

`s-maxage` applies to shared caches such as CDNs only, so the product page is cached at the edge for 60 s but always revalidated by the browser. `private, no-store` keeps the personalised cart out of every shared cache.

## Edge cases and pitfalls

- **Invalidation lag.** A purge takes seconds to minutes to reach every PoP, and browsers may still hold their own copy. Prefer fingerprinted URLs.
- **Caching errors.** An origin outage that returns a cached `500` for an hour is worse than the outage. Cache errors briefly, if at all.
- **Thundering herd on expiry.** When a hot object expires, many edges miss at once. Origin shields, request collapsing and `stale-while-revalidate` smooth this.
- **DNS is not instant failover.** Some clients ignore low TTLs; pair DNS changes with health-checked load balancers.

## In the interview

When a design serves images, video or any static file to a global audience, say "put it behind a CDN" and justify it with numbers: RTT to edge versus origin, and origin load = requests × (1 − hit ratio). Mention TTLs, versioned URLs for invalidation, and what must never be cached (personalised responses). A common follow-up: *"How does the user get routed to the nearest edge?"* — GeoDNS or anycast.
