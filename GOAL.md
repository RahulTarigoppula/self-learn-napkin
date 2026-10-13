> **Historical planning document.** The shipped app changed direction in October 2026 (modern "Sketchbook" design, story-driven layered napkins, 121 topics, language-agnostic lessons). See [docs/DECISIONS.md](docs/DECISIONS.md), which supersedes this file wherever they differ.

# Napkin — The Visual Tech Learning Platform

> **Conflicts are resolved in `docs/IMPLEMENTATION-PROMPT.md` §0; that file wins.**

**Codename:** Napkin · **Project:** 03 of 8 · **Date:** 2026-09-06
**Tagline:** *Interview prep sketched on the back of a diner napkin.*

---

## The idea

**In the owner's words.** "An offline-capable study guide for Data Science, System Design, and DSA that replaces walls of text with clean, intuitive vector-style diagrams; bite-sized, infographic-like. Fun, approachable interview prep that feels like browsing a cool infographic. Offline study on the go, on Android and webapp deployed on git. The git push should include the android apk build for download and install as well (no need of any further licsenses as this for personal developement) - the git deployed webapp is also enough. Take your descissions - think and decide."

**Sharpened.** Napkin is a static, offline-first site (and a Capacitor APK of the same build) where every CS interview topic is *one numbered cream napkin*: a Caveat title, a two-line TL;DR, one hand-drawn ballpoint diagram that draws itself, three to five bullets, a Big-O table, and two or three flashcards. Diagrams are authored in Excalidraw, Mermaid or D2 and rendered to SVG **at build time**, so the app ships zero diagram libraries and every napkin is a few kilobytes of HTML and SVG. The flashcards feed an on-device FSRS spaced-repetition scheduler, rated with a four-colour Bic pen, and every session ends with a printed receipt you can tear off and share. The whole thing lives on a bottle-green diner counter under one lamp (the "Corner Booth" design system, `docs/DESIGN.md`), and all content is redrawn from CC BY / MIT sources with automatic attribution.

## Who it's for

- **The owner**, preparing for data-science and backend interviews on a commute with patchy signal, who is tired of 40-minute videos and 4,000-word blog posts and wants the *shape* of consistent hashing, not the essay.
- Anyone revising DSA, system design or ML fundamentals who learns by looking at one good picture and then being quizzed on it a few days later.
- Not for: absolute beginners who need a full course, or people who want a coding judge.

## Why it will be fun and valuable

- **Value:** 3-minute napkins × spaced repetition = the two highest-leverage interview-prep techniques (visual chunking, retrieval practice) in one loop that fits a bus ride. Everything works in airplane mode.
- **Fun:** you physically pull a napkin from a chrome dispenser, watch the diagram draw itself stroke by stroke, scrub it with a pen along a printed ruler, flip it, click a plunger, and tear off a receipt. Streaks are coffee rings on a placemat. It is the only study app whose objects *are* the controls.
- **Screenshot-worthy:** a cream napkin with a hand-drawn diagram on a green formica counter reads as *this app* from across the room; the torn receipt is the share card.
- **Cheap to extend:** once the diagram pipeline exists, adding a topic is one MDX file plus one `.excalidraw` file; no code.

## The vibe

**Tactile · Cheerful · Legible.**

A late-night diner where somebody clever explained load balancers to you on a napkin. The paper is cream, the ink is ballpoint blue-black, the titles are marker, the counter is bottle green under one warm lamp. Nothing floats or glows; paper has weight, chrome clicks, ink appears in the order it was drawn. The joke is confined to the objects (dispenser, pen, mug, bell, printer); the prose stays precise, 17 px Nunito at 4.5:1 or better, because the point is to *learn the thing*, not to admire the theme.

## Success criteria (measurable)

1. **Airplane-mode complete.** After one online visit (web) or from first launch (APK), every napkin, the search, the review queue and the placemat work with the network off. Verified by a Playwright test that sets `context.setOffline(true)` and walks Counter → Menu → Napkin → Order Up → receipt.
2. **Napkin paints fast.** On a 2022 mid-range Android phone (Chrome WebView), a cold navigation to any napkin shows the title and TL;DR in ≤ 500 ms and the diagram fully drawn in ≤ 1.5 s (SMIL animation total ≤ 5 s, user-scrubbable at any point).
3. **One-thumb loop.** From the Counter, tap the dispenser → first flashcard visible in ≤ 300 ms; tap a plunger → rating persisted to IndexedDB and the next card on screen in ≤ 100 ms; the whole review loop (pull, read, flip, rate, next) never needs a second hand or a keyboard.
4. **Content volume with provenance.** MVP ships **20 napkins** (7 DSA, 7 system design, 6 DS/ML); v1 ships **120** (40/40/40). Every napkin has ≥ 1 diagram, ≥ 2 flashcards, a Big-O or key-numbers table where applicable, a `sources` list, and reads in ≤ 3 minutes (≤ 350 words of prose).
5. **Licence lint is green.** The frontmatter key is `licence`, and the build fails if any card's `sources[].licence` is outside the eight allowed human strings — `MIT`, `Apache-2.0`, `BSD-2-Clause`, `CC0`, `CC BY 4.0`, `CC BY 2.5`, `Public domain`, `Own work` — or matches `/NC|ND|SA/i`, or if a card has no sources and is not marked `original: true`. **`CC BY-SA 4.0` is rejected, not flagged:** ShareAlike sources (d2l) may be linked from prose, never listed in `sources[]`, never adapted. Zero content is derived from ByteByteGo, roadmap.sh, VisuAlgo, MIT OCW or CS50.
6. **Bundle discipline.** Precache ≤ 10 MB at MVP, raised deliberately to ≤ 25 MB at v1 via `NAPKIN_PRECACHE_MAX_MB`; each optimised diagram **warns above 12 kB raw and hard-fails at 40 kB** (`.anim.svg` at 60 kB); the four font files ≤ 130 kB together; per-page JavaScript ≤ 80 kB gzipped including islands, with the Counter ≤ 40 kB. A CI step fails the build when a budget is exceeded.
7. **Accessible by construction.** Every drag, swipe and long-press has a tap or keyboard equivalent; `@axe-core/playwright` reports zero *serious* or *critical* violations on all eight screens; all text is ≥ 4.5:1 on its actual ground; touch targets are ≥ 44 × 44 px; `prefers-reduced-motion` yields a static diagram that the ruler still steps through.
8. **The brand rule holds.** A screenshot test of the Counter screen shows the chrome dispenser, the four-colour pen and the green formica counter (DESIGN §1 "if a screenshot has no dispenser, no pen and no formica, it has drifted").

## Non-goals (deliberately not doing)

- No accounts, no server, no sync service, no analytics. Progress lives in IndexedDB and leaves the device only as a user-triggered JSON export.
- No LLM in the core loop. Optional BYO-key helpers (D4 rung 2) are a Someday item and only ever *rewrite* content that already exists procedurally.
- No coding judge, no LeetCode-style problem runner, no code execution.
- No video lectures inside the precache (explainer videos, if ever, are runtime-cached and optional).
- No Play Store listing, no fees, no policies; the APK is sideloaded from GitHub Releases.
- No tracing or adapting of NC/ND/proprietary infographics, ever, even "for inspiration".
- No comments, community, leaderboards or social features.
- No Hindi or other scripts in v1 (the font plan for Kalam + Noto Sans Devanagari exists in DESIGN §5 but is not scheduled).

## Feature list

### MVP ✅ (the weekend path in `docs/PLAN.md`)
- Astro 7 static site with MDX content collection `cards`, zod-validated frontmatter, licence lint, stable napkin numbers.
- 20 napkins across three tracks (Starters · DSA, Mains · System Design, Desserts · Data Science) with title, TL;DR, one diagram, bullets, Big-O table, related scraps, attribution footer.
- Build-time diagram pipeline: `.excalidraw` → static SVG (jsdom + FontFace stub, Playwright fallback), svgo, Excalidraw-palette → pen-token colour rewrite; SMIL-animated variant via `excalidraw-animate` for at least 5 napkins with a step sidecar.
- Screens: The Counter (home), The Menu (ruled table browse), The Napkin (detail with ruler scrubber), Order Up (review), Guest Check (search), House Rules (settings + credits); Placemat in minimal form (streak count + calendar).
- Flashcards: decks generated from frontmatter, `ts-fsrs` scheduler with predicted intervals on the four plungers, Dexie persistence, receipt at session end.
- Offline: `workbox-build` post-build service worker, manifest, "Not cached yet" page, update toast.
- Search: Pagefind index built post-build, precached, surfaced in the Guest Check sticky note.
- Live on GitHub Pages; signed APK on GitHub Releases via Capacitor 8 (haptics, status bar, splash, share).

### v1 🚀
- 120 napkins; every napkin animated with step captions; prerequisites lines on the desktop menu.
- The Griddle: interactive Rough.js visualisers as React islands — bubble/insertion/merge/quick sort, binary search, BFS/DFS on a grid, Dijkstra, BST insert/search, hash table with chaining, LRU cache, consistent-hash ring, token bucket, quorum reads (N/R/W sliders).
- Signature interactions polished: napkin-pull drag with spring, flip, plunger click with check mark, receipt print/tear/share as PNG, coffee-ring stamp, highlighter → cloze card, counter light by hour, sounds (CC0 sprite) and haptics.
- Placemat: full coffee-ring calendar, per-track progress arcs, last receipt, JSON export/import.
- Anki `.apkg` import of the System Design Primer decks (CC BY 4.0) via a Python script at build time.
- "See how this was drawn": D2/Mermaid source on the napkin's back.
- Reduced-motion, high-contrast and keyboard parity across all screens; strict CSP.

### Someday 🔮
- `fsrs-browser` WASM optimiser fitting personal FSRS-6 parameters after ≥ 1,000 reviews.
- Quiz mode (procedural MCQ from cloze, definitions and Big-O tables — no LLM).
- Scrollytelling explainers (consistent hashing, Raft, LSM trees, backprop) with GSAP ScrollTrigger.
- BYO-key LLM helpers ("explain like I'm 5", "3 more flashcards") per D4 rung 2, gated behind settings, keys stored with WebCrypto.
- Share any napkin as PNG; TWA build published next to the APK; Hindi cards with Kalam.
- Motion Canvas / Manim explainer videos, runtime-cached, never precached.

## Platforms

| Target | How | Status in plan |
|---|---|---|
| Web (desktop + mobile browsers) | Astro static build on **GitHub Pages** at `https://<user>.github.io/napkin/`, installable PWA | Phase 0 (hello world), Phase 2 (real) |
| Android 7.0+ (minSdk 24) | **Capacitor 8** APK built and signed in GitHub Actions, attached to Releases, sideloaded | Phase 0 (debug), Phase 4 (release) |
| Android via TWA | Optional Bubblewrap build of the hosted PWA (needs `assetlinks.json` at the `<user>.github.io` origin root) | Phase 6 |
| Desktop app | Not planned; the PWA installs from Chrome/Edge | — |

## Constraints

- **Free:** GitHub (public repo, Pages, Actions, Releases) only. No Cloudflare account needed (no secrets exist). No paid fonts, icons, sounds or services.
- **Offline:** everything a learner touches is in the precache or the APK; no runtime network calls at all in MVP and v1.
- **Privacy:** no analytics, telemetry, accounts or third-party requests; fonts self-hosted; progress exported only by the user.
- **Licences (D5):** bundled code OSI only (GSAP's free Standard License tolerated for animation, optional); bundled content from the allow-list in `docs/RESEARCH.md` §3a only; CC BY-SA sources (d2l) linked, never adapted; every napkin carries attribution; the README carries the credits.
- **Tooling:** Windows 11, Node ≥ 22.12 (Astro 7 requirement; owner has 22.17), Python 3.14 for font subsetting and the Anki importer; no Java or Android SDK locally.

## The one-sentence pitch

Napkin turns every CS interview topic into a numbered cream napkin with a hand-drawn diagram that draws itself, then quizzes you on it with a four-colour pen — offline, free, and screenshot-worthy.
