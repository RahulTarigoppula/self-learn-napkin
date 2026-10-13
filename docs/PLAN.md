> **Historical planning document.** The shipped app changed direction in October 2026 (modern "Sketchbook" design, story-driven layered napkins, 121 topics, language-agnostic lessons). See [docs/DECISIONS.md](DECISIONS.md), which supersedes this file wherever they differ.

# Napkin — PLAN.md

> **Conflicts are resolved in `docs/IMPLEMENTATION-PROMPT.md` §0; that file wins.** Revised 2026-09-08 to match rulings C1–C23.

**Project:** 03 · Napkin · **Date:** 2026-09-06
**Read with:** `GOAL.md` (what done means), `docs/ARCHITECTURE.md` (how; section numbers below refer to it), `docs/DESIGN.md` (the look; § numbers marked D), `_shared/DECISIONS.md` (D9 working agreement: day 1 = live, engine first, preview is the spec, weekend MVP exists, no paid anything).

Effort units: **E** = one evening (≈ 2.5 h), **W** = one weekend day (≈ 6 h). Every task is ≤ half a day. Acceptance criteria are in *italics*.

---

## Phase 0 — Setup: repo, tooling, CI, live hello world, keystore (≈ 2 E)

Dependencies: none. Do this before any feature work (D9.1).

- [ ] **0.1 Check Node.** Run `node -v`; if < 22.12, `winget upgrade OpenJS.NodeJS.LTS`. *`node -v` prints ≥ v22.12.0.*
- [ ] **0.2 Create the public repo `napkin` on GitHub** (public: Pages + unlimited Actions minutes). *Repo exists, default branch `main`.*
- [ ] **0.3 Scaffold** per README Quickstart steps 1–3 — `npm create astro@latest .` **into the current folder**, `astro add mdx react`, then the runtime and dev dependency tables from IMPLEMENTATION-PROMPT §2.2, then `npx playwright install chromium`. Commit. *`npm run dev` serves `http://localhost:4321/` with the minimal page.*
- [ ] **0.4 `astro.config.mjs`** as in IMPLEMENTATION-PROMPT §2.4 (`base` derived from **`VITE_BASE_PATH`** — C1 — with the un-slashed `base` / slashed `PUBLIC_BASE` split from C2, `trailingSlash: 'always'`, mdx + react + tailwind) plus `src/lib/base.ts`. *Plain `npm run build` and `VITE_BASE_PATH=/napkin/ npm run build` both succeed; `dist/index.html` references `/napkin/_astro/...` in the second.*
- [ ] **0.5 Tooling:** `biome.json` (recommended rules, 2-space, single quotes), `vitest.config.ts` (three projects per IMPLEMENTATION-PROMPT §10.1), `playwright.config.ts` (baseURL from `astro preview`), `.gitignore` (`dist`, `.cache`, `public/decks`, `src/generated`, `android/app/build`, `*.p12`, `*.b64` — **`public/diagrams/` is committed**), `.gitattributes`. *`npm run lint` and `npm test -- --run` exit 0 (one placeholder test).*
- [ ] **0.6 Hello-world Counter.** `src/pages/index.astro` with the wordmark "NAPKIN" on a `--bg` green ground using `src/styles/tokens.css` pasted from DESIGN §15. *Page renders green counter + cream wordmark locally.*
- [ ] **0.7 `pages.yml`** — use IMPLEMENTATION-PROMPT §11.1 verbatim: env `VITE_BASE_PATH: /${{ github.event.repository.name }}/` (C1), `VITE_PLATFORM` and `APP_VERSION`; no `cp dist/index.html dist/404.html` (Astro emits `404.html`); `npm test -- --run` split into `test:unit` + `test:build`. It runs `npm run build`, which does **not** call `npm run diagrams` (C20), so no Playwright step is needed. Repo Settings → Pages → Source = GitHub Actions. *Push to `main` → workflow green in under three minutes → `https://<user>.github.io/napkin/` shows the hello-world counter.*
- [ ] **0.8 Capacitor shell:** README step 4 (`npx cap init Napkin com.rahul.napkin --web-dir dist`, `cap add android`), `capacitor.config.ts` from IMPLEMENTATION-PROMPT §8.1, manifest edits from §8.2 (**`VIBRATE` only; remove Capacitor's default `INTERNET`**), merge `_shared/templates/app-build.gradle.snippet` into `android/app/build.gradle` (namespace/applicationId **`com.rahul.napkin`** — C6, immutable after the first install). Commit `android/`. *`npx cap sync android` runs clean after `VITE_BASE_PATH=/ npm run build`.*
- [ ] **0.9 Keystore + secrets:** `bash ../_shared/scripts/make-keystore.sh napkin` in Git Bash outside the repo; back up the `.p12` and passphrase; add the four secrets. *Secrets `ANDROID_KEYSTORE_BASE64/PASSWORD`, `ANDROID_KEY_ALIAS/PASSWORD` exist; `.p12` is in the password manager.*
- [ ] **0.10 `android-release.yml`** — IMPLEMENTATION-PROMPT §11.3; build step env `VITE_BASE_PATH: /`, `VITE_PLATFORM: android`, `APP_VERSION`. Tag `v0.0.1`. *Release `v0.0.1` has `napkin-0.0.1.apk` + `SHA256SUMS.txt`; the APK installs on the phone and shows the green counter.*

**Definition of done:** hello world live on Pages and installed on the phone from a signed APK; lint + test + build green in CI.
**Risks:** Astro 7 / Node mismatch (0.1 catches it); Gradle wrapper download slow on first CI run (template caches it); `cap add android` on Windows needs a path without spaces (this folder has none).

---

## Phase 1 — Design system + skeleton screens (≈ 4 E + 1 W)

Dependencies: Phase 0. Preview is the spec (D9.3): build `design/preview.html` first, then make the app match it.

- [ ] **1.1 `design/preview.html`** — **already written** (Counter, Menu, Napkin No. 037, Order Up plus the Guest Check sheet, at 360 × 780, Google Fonts hotlinks preview-only, tokens from DESIGN §15, materials from D§4.3). It is the visual contract, not a task: keep it in sync when a token or object changes, and re-approve the visual baselines against it. *A screenshot shows dispenser, pen and green formica (GOAL criterion 8).*
- [ ] **1.2 Fonts:** `scripts/subset-fonts.py` (pyftsubset, unicode ranges from D§5) over the three Fontsource variable files + Excalifont downloaded from plus.excalidraw.com to `public/fonts/`; `@font-face` in `global.css` with `font-display: swap`; JetBrains Mono ligatures off. *Four woff2 files ≤ 130 kB total; the script asserts the budget and prints sizes.*
- [ ] **1.3 Materials CSS** (`materials.css`): formica counter (radial gradient + noise tile), lamp pool (`soft-light`), napkin paper with quilt `<pattern>` emboss, chrome gradient, receipt paper, laminated menu rules, hour bands (`data-hour`). `scripts/make-noise.py` → `public/textures/noise-256.webp` ≤ 6 kB. *Side-by-side with preview.html, the counter and a blank napkin are indistinguishable at a glance.*
- [ ] **1.4 Object SVGs** (own art, MIT): dispenser, pen (4 plungers), highlighter, mug, bell, dial, printer edge, menu tab, paperclip, coffee rings ×3, quilt pattern. *Each ≤ 4 kB, uses only `--chrome*`, `--ink`, `--coffee` tokens; renders in both editions.*
- [ ] **1.5 Rough icons sprite:** `scripts/rough-icons.mjs` re-renders the eight Lucide glyphs used (x, external-link, paperclip, chevron-left/right, search, share, download) through Rough.js → `public/icons/icons.svg`. *`<use href="…#x">` works; strokes look pen-drawn.*
- [ ] **1.6 Layout `Counter.astro`:** folio bar, counter scene, bottom band with Dispenser / Pen / Guest Check objects and printed words, `<ClientRouter />`, pre-paint theme/hour script (§5.10), safe-area padding. *Tab order: folio → content → band; every band object is a `<button>`/`<a>` with a visible label.*
- [ ] **1.7 Skeleton screens** with static sample data: Menu (ruled `<table>`), Napkin (title, TL;DR, diagram box, bullets, Big-O, scraps, attribution), Order Up (front/back, plungers with placeholder intervals), Guest Check (sticky note), Placemat (calendar grid, mug stats), House Rules (stapled card + credits), offline, 404. *All eight routes render; Lighthouse accessibility ≥ 95 on each; no horizontal scroll at 360 px.*
- [ ] **1.8 Editions + light:** day/night `data-theme`, `data-hour` bands with 6 s crossfade via `@property`, House Rules toggles wired to `localStorage` (Dexie comes in Phase 2). *Switching edition never changes `--ink`; contrast spot-checks match D§4.1.*
- [ ] **1.9 Motion tokens + reduced motion:** `motion.css` with the 13 named animations as `@keyframes`/transitions where CSS suffices (title-write, plunger-click, receipt-print, menu-slide, note-rise, coffee-ring-stamp); `prefers-reduced-motion` block. *With reduced motion on, nothing travels; fades only.*
- [ ] **1.10 Screenshot baseline:** `e2e/screenshots.spec.ts` captures the eight screens at 360 × 780 and 1280 × 800 in both editions. *16 baseline PNGs committed; CI compares with 0.2 % tolerance.*

**Definition of done:** every screen exists as static HTML that matches `design/preview.html`; fonts, tokens, materials and objects are final; a11y skeleton passes.
**Risks:** Excalifont download page changes (fall back to Virgil bundled with Excalidraw, also OFL); chrome gradients looking like 2010 skeuomorphism (one highlight, one shadow — D§1); noise `mix-blend-mode` cost on WebView (keep to one layer).

---

## Phase 2 — Engine and core features (≈ 2 W + 6 E)

Dependencies: Phase 1 (components) for 2.6+, none for 2.1–2.5 (engine first, D9.2).

### Content and pipeline
- [ ] **2.1 Content schema + lint:** `src/content/config.ts` (§4.1, `glob()` loader per C13, `licence` key with C12's eight human strings), `scripts/lint-licences.mjs` (§5.8), `numbers.json` seeded from IMPLEMENTATION-PROMPT §7.5 + `scripts/number-card.mjs` (§5.9), `tracks/*.yaml`. *A card with `licence: CC BY-NC-SA 4.0` fails the build with its path; so does `CC BY-SA 4.0`; a card without a number fails `astro build`.*
- [ ] **2.2 Write the first 10 napkins**, exactly as specified in IMPLEMENTATION-PROMPT §7.6: `dsa/big-o-basics` (001), `dsa/arrays-and-pointers` (002), `dsa/binary-search` (003), `dsa/hash-tables` (004), `dsa/bfs-and-dfs` (005), `dsa/bubble-sort` (019, the griddle exemplar), `sysdesign/load-balancing` (030), `sysdesign/caching` (031), `sysdesign/consistent-hashing` (037, the golden card), `ds/bias-variance` (060). *≤ 350 words of prose each; licence lint green; `numbers.json` has 10 entries.*
- [ ] **2.2b Write the next 10** (§7.7), which completes the **MVP 20 — 7 DSA / 7 system design / 6 data science** (C23): `dsa/dynamic-programming` (024), `sysdesign/sharding` (041), `sysdesign/quorum-n-r-w` (044), `sysdesign/message-queues` (048), `sysdesign/rate-limiting` (052), `ds/train-val-test` (061), `ds/gradient-descent` (062), `ds/logistic-regression` (063), `ds/precision-recall-roc` (064), `ds/cross-validation` (065). *`numbers.json` has 20 entries; no heaps and no LRU card in the MVP — `dsa/lru-cache` (021) and `sysdesign/hashing` (036) are the first two v1 cards.*
- [ ] **2.3 Draw the diagrams** (10 for batch 1, 20 by the end of Phase 2) in excalidraw.com using only the five palette strokes, Excalifont, numbered callouts written first (§5.1 rules). Commit `.excalidraw` JSON. *Every file passes the palette check.*
- [ ] **2.4 `build-diagrams.mjs`** static path: jsdom + FontFace stub → `exportToSvg` → palette rewrite → svgo → cache. *Static SVGs land in **`public/diagrams/` and are committed** (C3), ≤ 12 kB each (hard fail at 40 kB); a second run reports every diagram as "cached" in < 1 s. `npm run diagrams` is a separate script, never part of `npm run build` (C20).*
- [ ] **2.5 Playwright fallback exporter** (`scripts/harness.ts` + `NAPKIN_DIAGRAM_EXPORTER=playwright`) and the automatic text-less retry. *Deleting the FontFace stub still yields correct SVGs via the fallback in CI.*
- [ ] **2.6 Animated variants + steps:** `animate()` + `deriveSteps()` → `.anim.svg` + `.steps.json` for all Excalidraw diagrams. *`consistent-hashing.steps.json` lists **exactly 4 steps** — `Setup`, `Hash each server onto the ring`, `Hash the key`, `Walk clockwise to the next server` — with captions from the "1." callouts (C21); the animated SVG plays in Chrome with no JS.*
- [ ] **2.7 `Diagram.astro`** inline embed with `<title>/<desc>`, static fallback, `IntersectionObserver` pause. *Two napkins open in one page: only the visible diagram animates.*
- [ ] **2.8 Ruler scrubber island** (§5.3): pen tip, ticks, `setCurrentTime`, captions in `aria-live`, keyboard, reduced-motion opacity stepping. *Dragging the pen from 0 to the end draws the diagram progressively at ≥ 55 fps on desktop; ArrowRight advances one step and updates the caption.*
- [ ] **2.9 Menu + Napkin pages from the collection:** `menu.astro` table with track heads, progress hairlines (read marks from Dexie via a tiny island), chillies, specials; **`[track]/[slug].astro`** (C14 — `/sysdesign/consistent-hashing/`) with related scraps, attribution footer and the `#griddle` island (C15); prev/next in the track. *Every card slug resolves; related slugs are validated at build.*

### Flashcards
- [ ] **2.10 Dexie schema + export/import** (`src/db`), seed on startup (§5.2 `seed`). *Fresh profile → `cards` has one row per deck item; re-running seed adds nothing.*
- [ ] **2.11 FSRS engine** (`engine/fsrs/scheduler.ts` + `queue.ts`) with unit tests: **`dayKey(date, tz)` = the local calendar date with no rollover hour** (C11), queue ordering and new-card cap, `preview` labels, `rate` transaction, orphan handling. Golden data: a 10-review script whose intervals are asserted to ±1 day against `ts-fsrs` defaults. *100 % line coverage on `src/engine`; tests run in < 2 s.*
- [ ] **2.12 `build-decks.mjs`** (§5.11) → **`public/decks/*.json`, fetched at runtime** (C16); cloze parser with the fixed `____` mask (C10). *20 cards → ≥ 40 deck items with **full 40-hex** ids over the RAW question text (C9); the two locked hashes `f40204a7…` and `244084cb…` match.*
- [ ] **2.13 Order Up island:** queue, flip, four plungers with predicted intervals, ticket rail progress, bell (end early), empty state, write-failure ticket + retry. *Rating 12 cards writes 12 logs and one session; the next card appears ≤ 100 ms after a tap (measured with `performance.now()` in a test).*
- [ ] **2.14 Receipt** (§5.5 → IMPLEMENTATION-PROMPT §6.10): lines, `receipt-print` reveal, PNG export via canvas + Web Share (web) — Android share lands in Phase 4. *The 3-card golden session prints text byte-identical to the §6.10 block; every item and total row is exactly 32 columns.*

### Search, offline, home
- [ ] **2.15 Pagefind + Guest Check island:** `pagefind --site dist` in the build script; sticky note UI with query echo, result rows in menu-row format, tag chips, dev-mode message. *Query `hashing` returns the Consistent Hashing napkin first (the quorum napkin is batch 2); Pagefind runs before `build-sw.mjs` so the shards are precached and search works offline.*
- [ ] **2.16 Service worker:** `scripts/build-sw.mjs` (§7), `sw-register.ts`, update ticket, `offline.astro`, manifest + icons. *DevTools offline: all 20 napkins, search and review work; the precache **excludes `diagrams/**`** (C5, they are inlined in the HTML) and stays ≤ 10 MB (`NAPKIN_PRECACHE_MAX_MB`).*
- [ ] **2.17 Counter (home) wired:** resume napkin (last `reads` row), due count on the dispenser plate (liveQuery), specials sticky note, mug streak. *Fresh profile shows "Pull one"; after a session the plate updates without reload.*
- [ ] **2.18 Streak engine + minimal Placemat** (§5.6): `streak()` with tests (gap, rollover, today-not-yet), coffee-ring calendar (static tiers), mug stats, export/import buttons. *Reviewing on 3 consecutive dayKeys shows streak 3; skipping a day resets to 1 next time.*

### Griddle (interactive visualisers)
- [ ] **2.19 Tracer framework** (§4.3, §5.4): generator → events, lazy frame materialisation, Rough.js renderer with per-element seeds, player store (play/pause/step/speed), ruler reuse. *`bubbleSort` on `[5,3,8,1,9,2,7,4]` yields the expected event count (25 compares with the early-exit pass, 14 swaps, sorted output `1,2,3,4,5,7,8,9`) in a unit test.*
- [ ] **2.20 Three griddles:** bubble sort, BFS on a grid, consistent-hash ring (drag a server, vnodes stepper). *Each runs at 60 fps on desktop; scrubbing to any frame is instant; captions match ARCHITECTURE examples.*

**Definition of done:** the full one-thumb loop works end to end on the web build with the 20 MVP napkins (7 DSA / 7 system design / 6 data science), offline; engine tests green with every §6 golden asserted; three griddles; live on Pages.
**Risks:** excalidraw#10604 makes jsdom output wrong (2.5 fallback exists; budget one extra evening); SMIL `setCurrentTime` quirks in Firefox (test in Chromium first; Firefox is secondary); content writing takes longer than code (20 napkins ≈ 1 W of writing + drawing — schedule it, don't squeeze it).

---

## Phase 3 — Polish, motion, sound (≈ 1 W + 4 E)

Dependencies: Phase 2.

- [ ] **3.1 Napkin pull** (D§8.1): Motion drag on the dispenser edge with 1:1 follow, rubber-band × 0.55, release threshold 120 px or 600 px/s, `napkin-pull` spring, `title-write`, tap equivalent. *Both tap and drag open the first due card; below-threshold drags slide back silently.*
- [ ] **3.2 Napkin flip + plunger check mark** (D§8.3): `napkin-flip` 380 ms, Rough.js check mark in the plunger's ink, `napkin-swap` view transition to the next card; swipe right/left shortcuts; keys 1–4. *Rating by swipe and by key both write the same log as the plunger.*
- [ ] **3.3 Receipt tear + share** (D§8.4): swipe across the perforation → `receipt-tear` → PNG → share sheet; coffee-ring stamp on the placemat. *Shared PNG is 2× resolution with embedded mono font; the ring appears with today's tier.*
- [ ] **3.4 Highlighter → cloze** (D§8.5, §5.7): 450 ms long-press with custom timer (`user-select: none` on prose), Range rects → Rough.js swipe overlay, `pickBlank` with tap-to-shift, persist `highlights` + `cards` (`origin: 'highlight'`), long-press again to remove. *A highlighted sentence appears in the next review queue as a cloze; desktop context-menu "Highlight" does the same.*
- [ ] **3.5 Sounds + haptics:** CC0 sprite (`sfx.webm`/`.mp3`, ≤ 120 kB) with `public/sounds/CREDITS.md`, Howler unlock on first gesture, `AudioContext.state` respect, bell toggle; `platform/haptics.ts` no-op on web. *Sound is off by default; each of the six events plays once per trigger; no audio errors in the console when muted.*
- [ ] **3.6 Menu polish:** filter words, `86'd` sticker, long-press "add all flashcards to today", desktop prerequisites lines (Rough.js static SVG at build from `prereqs`). *Filter "Caching" shows only tagged rows; prerequisites lines connect the right numbers.*
- [ ] **3.7 Counter light + editions polish:** 6 s crossfade verified, pinning in House Rules, morning blinds ≤ 6 % opacity. *No text sits on the blend layer (checked with the "paper is opaque" rule in a screenshot).*
- [ ] **3.8 Reduced-motion + a11y sweep:** every gesture's tap/keyboard twin, focus rings on paper and counter, `role="slider"` ruler, `aria-live` captions, coffee rings announce counts; `@axe-core/playwright` on all screens. *Zero serious/critical axe violations; keyboard-only run of the review loop succeeds.*
- [ ] **3.9 Desktop layout:** tri-fold menu, centred 640 px napkin, right column (mug, placemat, printer), `Ctrl/⌘ K` search. *At 1280 px nothing overlaps; screenshots updated.*

**Definition of done:** the app is as delightful as the preview promised; all 13 named animations exist; sound/haptics are opt-in and correct; a11y sweep clean.
**Risks:** long-press vs native text selection on Android (verified in Phase 4; keep the desktop context-menu path); drag gestures fighting the system back gesture (start ≥ 32 px from edges, D§14).

---

## Phase 4 — Android packaging (≈ 3 E)

Dependencies: Phase 2 (a real app to package); Phase 3 for haptics/share polish.

- [ ] **4.1 Plugins wired:** haptics (per DESIGN §12 table), status bar, splash, `@capacitor/app` back-button chain (§8), `appStateChange` pauses SMIL. *Back from a napkin returns to the menu, then counter, then exits; never a dead press.*
- [ ] **4.2 Manifest + icons:** `VIBRATE`, `adjustResize`, predictive back flag, adaptive icon fg/bg/monochrome (D§14), splash colour. *Themed icon renders on Android 13+; splash is `#1E3B38` with no white flash.*
- [ ] **4.3 Share on Android:** receipt PNG via `Filesystem.writeFile` (Cache) + `Share.share`. *Sharing to Keep/WhatsApp attaches the PNG.*
- [ ] **4.4 Device tests** (own phone): SMIL inline playback, scrubber 60 fps, long-press vs selection, keyboard over the search input, safe areas with gesture nav, edge-to-edge, day/night with system dark mode, airplane mode from first launch. Record results in `docs/TESTING.md` Android checklist. *All rows pass or have a filed fix task.*
- [ ] **4.5 Release:** bump `package.json` version, tag `v0.1.0`. *Signed APK on Releases installs over `v0.0.1` without uninstalling.*
- [ ] **4.6 Google limited-distribution developer registration** (free, no ID; insurance for the 2027 verification rollout — DECISIONS D3). *Account exists; note the 20-device limit in DEPLOYMENT.md.*

**Definition of done:** signed, updatable APK with haptics, share and correct back handling; device checklist recorded.
**Risks:** SMIL inside WebView (fallback: static + opacity stepping already exists); `Share` file URIs (Capacitor's FileProvider is default; test both Cache and Documents directories).

---

## Phase 5 — Testing and launch (≈ 1 W)

Dependencies: Phases 2–4.

- [ ] **5.1 Unit coverage:** `src/engine` 100 % lines (`fsrs/`, `progress/`, `cloze/`, `viz/`, `receipt/`, `theme/hour.ts`, `decks/ids.ts`, `scrubber/`, `backup/`, `search/`, `attribution/`); `scripts/*.mjs` pure helpers (`deriveSteps`, `rewritePalette`) unit-tested with fixture Excalidraw files. *`vitest --coverage` ≥ 100 % on `src/engine`, ≥ 80 % overall.*
- [ ] **5.2 E2E:** `offline.spec.ts` (GOAL criterion 1 walk), `review.spec.ts` (12-card session → receipt → placemat ring), `search.spec.ts`, `highlight.spec.ts`, `screenshots.spec.ts` refreshed, `axe.spec.ts`. *All green in CI on Chromium; ≤ 4 min total.*
- [ ] **5.3 Budgets in CI:** `check-budgets.mjs` thresholds final (§11); fonts assertion; `du -sh dist` printed. *A deliberately oversized fixture fails the workflow.*
- [ ] **5.4 CSP + headers:** meta CSP from §10 with the pre-paint script hash; verify Pagefind WASM and inline SVG still work. *No CSP violations in the console on any screen.*
- [ ] **5.5 Lighthouse (desktop, Pages URL):** PWA installable, Performance ≥ 95, Accessibility 100, Best Practices 100. *Report saved to `docs/lighthouse-v1.json`.*
- [ ] **5.6 Docs:** refresh `docs/TESTING.md` and `docs/DEPLOYMENT.md` with the as-built numbers (real budget table, real CI timings, the filled Android checklist); README status → **v1.0 — live**; Attribution regenerated from `credits.json`. *README Attribution lists every source in `credits.json` and `public/sounds/CREDITS.md`.* (Both documents already exist — this task updates them, it does not write them.)
- [ ] **5.7 Launch:** tag `v1.0.0`; install; pin the Pages URL and the Release link in the README. *Both links open the same content; version stamp matches the tag.*

**Definition of done:** CI enforces budgets, tests and a11y; docs complete; `v1.0.0` live on Pages and Releases.
**Risks:** flaky screenshot diffs across CI font rendering (self-hosted fonts and a fixed viewport keep this stable; use 0.2 % tolerance).

---

## Phase 6 — Stretch (ongoing evenings)

Dependencies: Phase 5 shipped.

- [ ] **6.1 Content to 120 napkins** (40/40/40), all animated with steps; specials rotation from `special: true`. *Precache ≤ 25 MB; lint green.*
- [ ] **6.2 Anki import:** `scripts/import-anki.py` over SDP's `.apkg` decks → `decks-extra/sdp.json` merged by `build-decks.mjs`. *≥ 100 extra items with CC BY 4.0 source lines.*
- [ ] **6.3 More griddles:** insertion/merge/quick sort, binary search, DFS, Dijkstra, BST, hash chaining, LRU, token bucket, quorum. *Each ≤ 300 lines with a tracer unit test.*
- [ ] **6.4 "See how this was drawn":** D2/Mermaid source on the napkin's back (flip) / second napkin on desktop. *Source text is the committed file, syntax-highlighted in mono.*
- [ ] **6.5 Share any napkin as PNG** (same canvas path as the receipt). *PNG contains the diagram at 2× with Excalifont embedded.*
- [ ] **6.6 `fsrs-browser` optimiser** in a Web Worker after ≥ 1,000 logs; parameters stored in `settings.fsrsParams`. *Optimised parameters change predicted intervals; a "reset to default" exists.*
- [ ] **6.7 Quiz mode** (procedural MCQ from cloze/definitions/Big-O tables). *No LLM; distractors drawn from sibling cards' answers in the same track.*
- [ ] **6.8 BYO-key LLM helpers** per DECISIONS D4 rung 2 (Gemini free tier / OpenRouter `:free` / Groq), key in WebCrypto AES-GCM with a session-only option, CSP `connect-src` allow-list, "may train on prompts" notice. *Helpers only rewrite existing procedural output; with no key the buttons are hidden.*
- [ ] **6.9 TWA lane:** `bubblewrap init` locally once, `twa-release.yml` from ANDROID-PACKAGING.md appendix, `assetlinks.json` in the `<user>.github.io` root repo. *TWA APK opens full-screen without an address bar.*
- [ ] **6.10 Scrollytelling explainers** (consistent hashing, Raft, LSM trees, backprop) with GSAP ScrollTrigger, kept out of the precache path budget. *Reduced motion shows the static frames.*
- [ ] **6.11 Hindi cards** with Kalam + Noto Sans Devanagari per DESIGN §5 scripts rule. *Font budget re-asserted.*

---

## Weekend MVP — the fast path (2 W + the Phase 0 evenings already done)

Goal: by Sunday night, at least the first 10 real napkins with diagrams (20 is the MVP target), search, FSRS review and offline, live on Pages, debug-signed APK on Releases. Skip motion polish, sound, griddles, placemat calendar and highlighter.

Saturday
1. 0.1–0.7 if not already done (1 h: repo, scaffold, tokens, Pages live).
2. 1.2 fonts (subset script) and 1.3 materials — counter, napkin paper, chrome gradient only (1.5 h).
3. 1.6 `Counter.astro` layout + 1.7 skeletons for Counter, Menu, Napkin, Order Up, Guest Check, House Rules (2 h). Skip Placemat beyond a streak number.
4. 2.1 schema + licence lint + numbers (1 h).
5. 2.2 + 2.3 write and draw the first 10 napkins from §7.6 (rest of the day — writing is the long pole).

Sunday
6. 2.4 static diagram pipeline + 2.6 animated variants + 2.7 embed (2 h). If jsdom output is wrong, switch to 2.5 Playwright immediately rather than debugging the stub.
7. 2.8 ruler scrubber in its simplest form: ticks + `setCurrentTime` + captions, no pen art (1 h).
8. 2.9 Menu + Napkin from the collection (1 h).
9. 2.10–2.13 Dexie, FSRS engine with the golden test, decks, Order Up island with the four plungers + predicted intervals (2.5 h). Receipt = plain text list (2.14 later).
10. 2.15 Pagefind + sticky note, 2.16 service worker + offline page + budget check (1 h).
11. Write the remaining 10 napkins (2.2b, §7.7) if time remains; otherwise ship with 10 and finish them on weeknights — the MVP target is 20 (7/7/6).
12. Push `main` (Pages), tag `v0.1.0` (APK), install, run the review loop in airplane mode on the bus on Monday.

Everything else in Phases 3–6 layers on top without rework: the tokens, schema, ids and pipeline outputs are final from the MVP onward.

---

## Effort summary

| Phase | Effort | Cumulative |
|---|---|---|
| 0 Setup | 2 E | 2 E |
| 1 Design system + skeletons | 4 E + 1 W | 6 E + 1 W |
| 2 Engine + core | 6 E + 2 W | 12 E + 3 W |
| 3 Polish | 4 E + 1 W | 16 E + 4 W |
| 4 Android | 3 E | 19 E + 4 W |
| 5 Testing + launch | 1 W | 19 E + 5 W |
| **v1 total** | **≈ 19 evenings + 5 weekend days** (≈ 78 h) | |
| 6 Stretch | open-ended, ≈ 1 E per napkin batch of 5, ≈ 1 E per griddle | |
