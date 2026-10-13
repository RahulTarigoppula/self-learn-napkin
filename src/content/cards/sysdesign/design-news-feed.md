---
title: Design a News Feed
track: sysdesign
tags: [case-study, interview, fan-out, caching, pagination]
difficulty: 3
minutes: 6
tldr: "Store each post once and push its id into every follower's cached feed list. Celebrities are the exception: pull their posts at read time and merge. Rank, page with cursors, serve media from a CDN."
analogy: "A newsagent who pre-packs a bundle for every subscriber as each paper arrives, so pick-up is instant. For the one magazine half the town reads, he keeps a single stack at the counter and slips a copy in as each person collects."
diagram: design-news-feed
story:
  - title: "Post path: save the post once"
    text: "Ana shares a photo. Her request goes through the load balancer to the post service, which stores it once in the posts table as post 91, with her id, text and a link to the photo. The post itself is never copied again. Everything else refers to it by id."
  - title: "Fan-out on write: push to followers"
    text: "The post service drops a job on a queue and replies to Ana straight away. Fan-out workers look up her followers and add id 91 to the front of each follower's list in the feed cache. That is one small write per follower: 200 followers, 200 writes."
  - title: "Read path: fetch the ready-made list"
    text: "Ben opens the app. The feed service reads feed:Ben from the cache in about a millisecond. It's a list of the newest post ids, already built. It then fetches the posts behind those ids in one batch. Reads are cheap because the work was done when the posts were written."
  - title: "Celebrities: pull at read time"
    text: "Pushing a post from a star with 50 million followers means 50 million cache writes, which is minutes of work for one post. So accounts above a threshold are not fanned out. When Ben reads, the feed service fetches recent posts from the few stars he follows and merges them in. This mix of push and pull is the hybrid model."
  - title: "Rank, then page with a cursor"
    text: "The merged candidates are scored on recency, how often Ben interacts with the author and how much engagement the post has, then returned 20 at a time. The cursor names a position in this session's ranked snapshot (for a purely chronological feed, simply the last post id seen), so new posts arriving at the top never shift or duplicate a page."
  - title: Photos come from a CDN
    text: "The feed response carries only text and media URLs, a few kilobytes. The photos themselves were uploaded once to blob storage and are served by a CDN edge server close to Ben, so the heavy bytes never pass through the feed service."
keyIdeas:
  - "**Fan-out on write (push):** cheap reads, expensive writes (one cache write per follower per post)."
  - "**Fan-out on read (pull):** cheap writes, slow reads. Every open gathers posts from everyone you follow."
  - "**Hybrid:** push for normal accounts, pull for celebrities and merge at read time. Skip inactive users too."
  - "The feed cache holds **post ids only**; bodies, counts and media are fetched (hydrated) per page."
  - "**Cursor pagination** keeps pages stable while new posts arrive; media goes via **blob storage + CDN**."
quiz:
  - q: "100 million posts a day, each author has 200 followers on average. Roughly how many feed-cache writes per second does push cause?"
    options: ["About 1,200", "About 23,000", "About 230,000", "About 20 million"]
    answer: 2
    why: "100 M × 200 = 20 billion inserts a day. 2 × 10^10 ÷ 86,400 s ≈ 231,000 writes per second. That's far more than the ~1,160 posts per second that cause them."
  - q: "Why are celebrity posts usually pulled at read time instead of pushed?"
    options: ["Celebrities post far more often, so pushing them would never stop", "One post would need tens of millions of writes and stall the fan-out", "Their posts carry larger media that is too big to copy", "Pull is always faster for readers than a precomputed feed"]
    answer: 1
    why: "Push cost is proportional to follower count. 50 million writes for a single post ties up the fan-out workers for minutes, while pulling it costs one cached read per viewer of a list that stays hot."
  - q: "Why does a feed API return a cursor rather than accept ?offset=20?"
    options: ["Cursors compress better, so the URLs stay short on mobile", "New posts at the top shift offsets, so pages repeat or skip items", "Offsets are not allowed in REST, which only permits cursors", "A cursor encrypts the user id, so other users cannot read it"]
    answer: 1
    why: "If three posts arrive between page 1 and page 2, offset 20 now points three items earlier and the reader sees duplicates. A cursor names the last item seen, so the next page starts right after it."
  - q: "What does a typical per-user feed cache entry hold?"
    options: ["The full JSON of every post, ready to send as is", "A capped list of recent post ids, newest first", "The user's followers, so new posts can be pushed", "Rendered HTML for the first page of the feed"]
    answer: 1
    why: "Ids are 8 bytes each, so 500 of them is about 4 KB per user. Bodies, like counts and author names are fetched for just the 20 being shown, so edits and deletes never need to touch millions of lists."
bigO:
  - { op: "feed reads", avg: "~23,000/s", note: "200 M DAU × 10 opens ÷ 86,400; peak ~70 k/s" }
  - { op: "new posts", avg: "~1,160/s", note: "100 M per day" }
  - { op: "fan-out writes (push)", avg: "~230,000/s", note: "100 M posts × 200 followers" }
  - { op: "feed cache size", avg: "~800 GB", note: "200 M users × 500 ids × 8 B, before overhead" }
  - { op: "one celebrity post, pushed", avg: "~4 min", note: "50 M writes at 200 k/s, so pull instead" }
  - { op: "new media per day", avg: "~5 TB", note: "10 M photos × 500 KB, served by a CDN" }
bigOTitle: "Key numbers"
related: [sysdesign/dns-and-cdns, sysdesign/consistency-models, sysdesign/design-url-shortener, sysdesign/design-chat-system]
prereqs: [sysdesign/back-of-envelope, sysdesign/api-design, sysdesign/load-balancing, sysdesign/caching, sysdesign/message-queues, sysdesign/blob-storage, sysdesign/unique-id-generation, sysdesign/sharding]
flashcards:
  - kind: qa
    q: "Compare fan-out on write and fan-out on read in one sentence each."
    a: "Write (push): copy each new post id into every follower's feed, so reads are fast but write cost grows with follower count. Read (pull): build the feed from followees' posts when it is opened, so writes are cheap but reads are slow."
  - kind: cloze
    text: "A hybrid feed {{pushes}} posts from normal accounts and {{pulls}} posts from celebrities at read time."
  - kind: qa
    q: "Why does the feed cache store post ids rather than full posts?"
    a: "Ids are tiny (about 8 bytes), so millions of lists fit in memory, and edits, deletes and like counts are read fresh when a page is hydrated instead of being copied into every follower's list."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Twitter timeline exercise, rewritten" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## 1. Clarify requirements

A **news feed** is the scrolling list of posts from the people and pages you follow, as on a social network's home screen. Agree on scope first.

**Functional:**

- A user can publish a post (text, optionally photos or video).
- A user sees a feed of posts from accounts they follow, newest or best first, and can scroll back through it.
- Follow and unfollow.

**Non-functional:**

- **Fast feed loads**: under ~200 ms for the first page, since this is the app's main screen.
- **Highly available**, and **eventually consistent** is fine: a post may take a few seconds to reach followers (see **Consistency Models**).
- **Read-heavy**: people scroll far more than they post.

Out of scope unless asked: comments, ads, notifications, search.

## 2. Estimate

Assumptions, said out loud (method from **Back-of-the-Envelope Estimation**): 200 M daily active users, each opens the feed 10 times a day; 100 M new posts a day; 200 followers per user on average; 1 in 10 posts carries a 500 KB photo.

| Quantity | Calculation | Result |
|---|---|---|
| Feed reads | 2 × 10^9 per day ÷ 86,400 s | ~23,000/s (peak ~70,000) |
| New posts | 10^8 ÷ 86,400 s | ~1,160/s |
| Fan-out writes | 10^8 × 200 = 2 × 10^10 per day | ~230,000/s |
| Feed cache | 2 × 10^8 users × 500 ids × 8 B | ~800 GB of ids |
| Post text | 10^8 × 1 KB | ~100 GB/day, ~37 TB/year |
| Media | 10^7 × 500 KB | ~5 TB/day, ~1.8 PB/year |

The striking number is the third row: **push turns 1,160 posts a second into 230,000 cache writes a second.** That trade is worth it only because reads (23,000/s, each needing a sorted, merged list) would otherwise be very expensive. Media volume says photos belong in object storage behind a CDN.

## 3. API

Following **API Design**:

```text
POST /posts                 { "text": "...", "media_ids": ["m7"] }   → 201 { "post_id": 91 }
GET  /feed?limit=20&cursor=… → 200 { "posts": [...], "next_cursor": "52" }
POST /users/{id}/follow     DELETE /users/{id}/follow
POST /media                 → a short-lived upload URL for blob storage
```

## 4. High-level design

**Post path.** The client uploads any photo straight to blob storage first (see **Blob Storage**), then calls `POST /posts`. Behind the load balancer (**Load Balancing**), the post service writes one row to the posts table (`post_id, author_id, text, media_urls, created_at`) and publishes a "new post" event to a queue (**Message Queues**). Post ids come from a time-sortable generator, so sorting by id is sorting by time (see **Unique ID Generation**).

**Fan-out.** Workers consume the event, read the author's follower list from the social-graph store (a `follows(follower_id, followee_id)` table indexed both ways), and push the post id into each follower's feed list. In Redis that is a sorted set `feed:{user}` scored by time and trimmed to the newest ~500 entries.

**Read path.** The feed service reads `feed:Ben`, merges in celebrity posts (below), ranks the candidates, and **hydrates** the top 20: one batched multi-get for post bodies, author names and like counts, mostly from caches (**Caching**). Deleted posts and blocked authors are filtered out here.

**Media.** The JSON contains only media URLs; the client fetches the images from a CDN edge near the user (**DNS and CDNs**), in a size suited to the screen.

**Storage choices.** The posts table is large (tens of TB a year) but only ever read by id, so a key-value or wide-column store sharded by `post_id` fits well (**SQL vs NoSQL**). The follow graph serves two lookups: "who follows Ana?" for fan-out and "whom does Ben follow?" for the celebrity merge. Store both directions, each partitioned by its first column. The feed cache is a derived copy: if it is lost, it can be rebuilt from the other two.

## Sketch it

The idea is language-independent, so here is the read path as plain pseudocode:

```text
get_feed(user, cursor, limit = 20):
    ids ← newest 500 ids in feed:{user}               # pushed earlier by fan-out workers
    for each celebrity that user follows:              # usually a handful
        ids ← ids + newest 50 ids in recent:{star}     # pulled now, at read time
    if cursor is given:
        keep only ids smaller than cursor              # ids are time-sortable
    page ← the `limit` largest distinct ids            # newest first
    posts ← one batched get of those posts from the post cache
    drop posts that are deleted or from blocked authors
    return posts, next_cursor = smallest id in page (none if page is empty)
```

## 5. Deep dive: push, pull or both

| | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| Work per post | one write per follower | one write |
| Work per feed open | read one ready list | query every followee, merge, sort |
| Freshness | after the fan-out delay | immediate |
| Breaks on | celebrities, inactive users | users who follow thousands |

Neither alone survives real traffic. **Push** fails on celebrities: one post from an account with 50 M followers is 50 M writes. That takes about four minutes even if the whole 200,000 writes/s fan-out fleet does nothing else, and other people's posts queue behind it. It also wastes work on users who never log in. **Pull** fails on readers: Ben follows 300 accounts, so every open becomes 300 lookups plus a merge, 23,000 times a second.

The **hybrid** used in practice:

1. Push for ordinary accounts (say, under 100,000 followers).
2. Do **not** push for celebrity accounts. Each keeps a short "recent posts" list that millions of readers share. That makes it a hot key, so replicate it across cache nodes.
3. At read time, merge Ben's pushed list with the recent posts of the few celebrities he follows.
4. Skip fan-out to users inactive for, say, 30 days; rebuild their feed by pull when they return.

## 6. Deep dive: ranking and pagination

**Ranking basics.** A chronological feed simply sorts by time. A ranked feed takes a few hundred **candidates** (the merged ids), computes features for each (post age, how often the reader interacts with the author, likes and comments so far, media type) and scores them. A simple score is a weighted sum with a time decay; large products train a model that predicts the chance the reader engages. Sort by score and return the top 20. For example, with `score = (likes + 5 × comments + 1) × affinity ÷ (age_hours + 2)^1.5`, a 1-hour-old post with 10 likes from a close friend (affinity 3) scores 33 ÷ 5.2 ≈ 6.4, while a 10-hour-old post with 100 likes from a stranger (affinity 1) scores 101 ÷ 41.6 ≈ 2.4. Freshness and closeness beat raw popularity. The exact formula matters less in an interview than naming the inputs and the decay.

**Cursor pagination.** Offsets break on a live feed: if three posts arrive while Ben reads page 1, `offset=20` now starts three items earlier and he sees duplicates. A **cursor** names the last item he saw. For a chronological feed it is the last post id, and the next page is "ids less than 52". For a ranked feed, store the ranked list for the session briefly and let the cursor be a position in that snapshot, so scores changing mid-scroll cannot reorder pages.

## 7. Bottlenecks and trade-offs

- **Fan-out lag.** A backlog on the queue delays posts. Scale workers horizontally, partition the queue by author, and prioritise followers who are online now.
- **Feed cache memory.** About 800 GB of ids calls for a sharded cache cluster (**Sharding**, **Consistent Hashing**). If a feed is evicted or lost, rebuild it by pull; the cache is derived data.
- **Hot posts.** Like and comment counters for a viral post are written thousands of times a second; batch increments or use sharded counters.
- **Unfollow and delete.** Remove lazily: filter at hydration time instead of editing millions of lists.
- **Consistency.** Eventual is acceptable, but authors should see their own post at once: insert it into their own feed synchronously (read-your-writes).

## 8. What I'd say in the last 5 minutes

"Posts are stored once, and ~1,160 posts a second fan out to ~230,000 cache writes a second, which buys us ~23,000 feed reads a second that are a single cache lookup plus a batched hydrate. Celebrities are pulled and merged at read time, inactive users are skipped, feeds hold ids only and are rebuilt by pull if lost. Pages use cursors and media comes from a CDN. Next I'd look at the ranking model, multi-region replication of the feed caches, and monitoring the fan-out queue lag as the main health signal (**Observability**)."
