# Napkin

*I learn by drawing, so I drew all of it.* 121 interview topics, each one sketched step by step and explained in plain words.

**Web app:** https://rahultarigoppula.github.io/self-learn-napkin/ · **Android APK:** [latest release](https://github.com/RahulTarigoppula/self-learn-napkin/releases/latest)

Napkin is a free, offline-first study app for **Data Structures & Algorithms**, **System Design** and **Data Science / ML**. Every topic is one *napkin*, taught in layers so anyone can learn it properly:

1. **The story.** A hand-drawn diagram draws itself scene by scene while a short paragraph explains each step. Concrete example first, then the mechanism, then the payoff.
2. **Key ideas** and a **complexity / key-numbers** table.
3. **Deep dive.** The full explanation: how it works, a fully worked example, clean Python, edge cases and pitfalls, trade-offs, and what interviewers listen for.
4. **Try it yourself.** 31 interactive playgrounds: partition with quicksort, slide a window over your own string, sift a heap, union-find with path compression, fill LCS / edit-distance / knapsack tables cell by cell, fool Dijkstra with a negative edge, catch a cycle in a topological sort, balance traffic across slow servers, trip a circuit breaker, steer attention weights with a temperature slider, race BFS against DFS, drag a server around a consistent-hash ring, push a learning rate until gradient descent explodes…
5. **Check your understanding.** Multiple-choice questions with an explanation for every answer.
6. **Flashcards with spaced repetition.** An on-device FSRS-6 scheduler brings each card back just before you'd forget it. Every session ends with a printable "receipt" you can share.

Plus: a **daily challenge** question, **levels, XP and achievements** (with a little confetti when you earn them), a **Quick quiz** that mixes questions from every topic, a ⌘K / Ctrl K search across everything, curated learning paths, a one-page **cheat sheet** of every complexity table, a progress page with streaks, a 18-week activity heatmap and a 7-day review forecast, light/dark themes, reduced-motion support, and JSON backup/restore. No accounts, no tracking, no network calls. Your progress never leaves your device.

## Why I built this

> A hard idea usually clicked for me the moment someone drew it.

I started my career as a tester who could also write code. Testing left me with one habit: when something works, I want to know *why* it works. Then I learned C++ to work on payment gateways, where a duplicate request or a timeout is somebody's money and the edge cases decide everything. Python came next, and I loved how simple it was. The code read like the idea. After that I learned data science and high-level design, and I was frustrated by how much of what's written about them is folklore: rules repeated until they sound like laws, with no reasons attached. Then I went deep into AI. Today I'm a Senior Software Engineer specialising in AI.

At each of those stops I ran into explanations that made simple things sound hard. What usually got me unstuck was a small drawing and one worked example, and I remember the relief every time it clicked.

Napkin is the notebook I wish I'd had along the way. The pictures draw themselves. The explanations are plain and **language-agnostic** (Python only shows up when you "implement it"). Facts are checked rather than repeated, and practice makes them stick. If it makes the road a little easier for the next person, it's doing what I built it for.

*Rahul Tarigoppula*

## What's inside

| Track | Napkins | Highlights |
|---|---|---|
| **Data Structures & Algorithms** | 42 | Big-O, recursion, two pointers, sliding window, binary search, every major sort, stacks/queues/lists, hashing, trees, heaps, tries, union-find, graphs, BFS/DFS, Dijkstra, Bellman-Ford, MST, DP (knapsack, LCS, edit distance), greedy, backtracking, bit tricks |
| **System Design** | 41 | Back-of-envelope maths, the life of a request, DNS/CDNs, load balancing, caching, consistent hashing, sharding, replication, quorums, CAP, consistency models, transactions, B-trees, LSM trees, WAL, bloom filters, queues & streams, idempotency, rate limiting, resilience, observability, Raft, distributed locks, sagas, IDs, plus three full case studies (URL shortener, news feed, chat) |
| **Data Science & ML** | 38 | Framing, splits, cross-validation, bias–variance, regularisation, feature engineering, linear & logistic regression, losses, gradient descent, trees & ensembles, SVMs, kNN, naive Bayes, clustering, PCA, t-SNE/UMAP, evaluation & calibration, A/B testing, statistics, neural nets, backprop, embeddings, attention, transformers, recommenders |

## Install

- **Web / PWA:** open the link above; use "Install app" / "Add to Home screen". After one visit everything works offline.
- **Android:** download `napkin.apk` from the [latest release](https://github.com/RahulTarigoppula/self-learn-napkin/releases/latest) on your phone and open it (allow "install unknown apps" once). The APK contains the whole library and works offline from the first launch. It requests no network permission.

## How it's built

- **Astro 7** static site with **Preact** islands for the interactive parts; content is Markdown with zod-validated frontmatter (`src/content/cards/<track>/<slug>.md`).
- **Diagrams are code.** Each `src/diagrams/<name>.mjs` uses a tiny kit over **Rough.js** to draw hand-sketched SVG at *build* time (`npm run diagrams`); `d.step()` marks story scenes. The output is committed and inlined into pages, coloured by CSS tokens so it works in light and dark. No diagram library ships to the browser.
- **Spaced repetition:** `ts-fsrs` (FSRS-6) + **Dexie** (IndexedDB). Pure, unit-tested engine code lives in `src/engine/**`.
- **Search:** a small hand-rolled ranked full-text index (`src/engine/search`). It is instant and works offline.
- **Offline:** a Workbox service worker precaches the whole site after one visit.
- **Android:** Capacitor 8 wraps the same build; GitHub Actions builds and signs the APK.
- **Quality gates:** Biome, `astro check`, Vitest (engine goldens incl. FSRS, receipt format, tracers, search), a content lint (schema, licences, scene counts, word budgets), budgets (fonts, JS, HTML, precache), and Playwright (flows on desktop + Pixel 7, axe accessibility in both themes, offline).

```bash
npm ci
npm run dev            # http://localhost:4321
npm run build          # content lint → decks/search index → astro build → service worker → budgets
npm test               # unit tests
npm run test:e2e       # Playwright (desktop + Pixel 7); also test:a11y, test:offline
npm run diagrams       # re-render src/diagrams/*.mjs → public/diagrams + public/thumbs (commit the output)
node scripts/preview-diagrams.mjs <name>   # PNG previews of one diagram (light, dark, per step)
```

Writing a new napkin? Read **[docs/AUTHORING.md](docs/AUTHORING.md)**. Design and engineering decisions are in **[docs/DECISIONS.md](docs/DECISIONS.md)**; the original planning documents are kept in `docs/` for history.

## Deploy

- Push to `main` → `.github/workflows/pages.yml` builds and deploys GitHub Pages.
- Push a tag `v*` → `.github/workflows/android-release.yml` builds a signed APK and attaches it to a GitHub Release (every push to `main` also uploads an APK artifact).
- `ci.yml` runs every quality gate on pull requests and pushes.

The Android signing key lives outside git (see `docs/DEPLOYMENT-NOTES.md`); CI reads it from four repository secrets.

## Attribution

Napkin's explanations and drawings are written and redrawn from openly licensed material; every napkin lists its sources and licence at the bottom of the page and in Settings → Credits.

- [**The System Design Primer**](https://github.com/donnemartin/system-design-primer) (Donne Martin), CC BY 4.0
- [**OpenDSA**](https://github.com/OpenDSA/OpenDSA) (Karavirta & Shaffer), MIT
- [***Algorithms***](https://jeffe.cs.illinois.edu/teaching/algorithms/) (Jeff Erickson), CC BY 4.0
- [**Open Data Structures**](https://opendatastructures.org/) (Pat Morin), CC BY 2.5
- **Stanford CS229 / CS230 VIP cheatsheets** (Afshine & Shervine Amidi), MIT
- [**Tech Interview Handbook**](https://github.com/yangshun/tech-interview-handbook) (Yangshun Tay), MIT
- [**TheAlgorithms**](https://github.com/TheAlgorithms), MIT

Nothing is derived from ByteByteGo, roadmap.sh, VisuAlgo, MIT OCW or CS50, and no ShareAlike/NonCommercial/NoDerivatives material is adapted; a build-time licence lint enforces this.

**Fonts** (SIL OFL 1.1, self-hosted): Bricolage Grotesque, Inter, JetBrains Mono, Excalifont. **Libraries** (MIT unless noted): Astro, Preact, Rough.js, ts-fsrs, Dexie (Apache-2.0), Zod, Workbox, Capacitor; icons from Lucide (ISC). Sounds are synthesised in the browser (no audio files).

Code: MIT. See [LICENSE](LICENSE).
