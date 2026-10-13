# Napkin — THE IMPLEMENTATION PROMPT

**Project:** 03 · The Visual Tech Learning Platform · codename **Napkin** · repo name **`napkin`**
**Written:** 2026-09-08 · **Audience:** the AI coding agent (or the owner) who will build this from an empty folder.

> **This document is self-contained, with one exception.** The only other file you need is **`design/preview.html`** — the visual contract you check every screen against (§12 "Design fidelity"). You do not need `GOAL.md`, `DESIGN.md`, `ARCHITECTURE.md`, `PLAN.md`, `TESTING.md`, `DEPLOYMENT.md`, `RESEARCH.md` or `_shared/DECISIONS.md`. Everything else binding has been inlined here, and every conflict between those documents has already been resolved (see the table below). If you *do* open them and they disagree with this file, **this file wins**.

---

## 0. Conflicts already resolved (do not re-litigate)

The planning docs were written independently and disagree in the places listed below. These are the rulings. Follow them exactly.

| # | Disagreement | **Ruling** | Why |
|---|---|---|---|
| C1 | Base-path env var: the shared-template name vs an Astro-flavoured alias invented in ARCHITECTURE/PLAN | **`VITE_BASE_PATH`, and no alias** | It matches `_shared/templates/pages.yml`, `_shared/templates/android-release.yml`, `playwright.config.ts` and DEPLOYMENT §8. One name everywhere; the alias is deleted from every document, and a grep for it must come back empty. |
| C2 | Astro `base` value: `/napkin/` vs `/napkin` | **`base` = `/napkin` (no trailing slash)**; a separate `PUBLIC_BASE` = `/napkin/` (with slash) is what runtime code uses | Astro wants the un-slashed form; every runtime URL join wants the slashed form. Two constants, one source. |
| C3 | Diagram output: `src/generated/diagrams/` (gitignored) vs `public/diagrams/` (committed) | **`public/diagrams/`, committed to git** | CI then needs no Playwright/no 60 MB D2 WASM to deploy; a `diagrams-fresh` job proves they are not stale. |
| C4 | Diagrams embedded as `<img>` vs inlined | **Inlined** into the page HTML at build time by reading the file from disk in `Diagram.astro` | CSS custom properties (`var(--pen-blue)`) only resolve inside the document. `<img>` would render the diagram uncoloured. |
| C5 | Are `public/diagrams/*` precached by the service worker? | **No** — they are excluded from the precache glob | Every diagram is already inlined in its napkin's HTML; precaching would double the bytes. The files still ship in `dist/` for the day-1 `curl` check and for share-as-PNG debugging. |
| C6 | Android app id: four mutually exclusive forms across the package (a reverse-DNS-of-Pages form, a personal-handle form, an owner-placeholder form and a scaffolding placeholder) | **`com.rahul.napkin`** | The portfolio convention is `com.rahul.<repo>` — 01 Nocturne is `com.rahul.nocturne`, 02 Jyoti is `com.rahul.jyoti`. One shape across all eight apps. **This can never change after the first install** — if an APK is already installed under a different id, keep that id instead. All four earlier forms are deleted from every document; a grep for any of them must come back empty. |
| C7 | Islands: Preact vs React | **React 19** | Portfolio consistency; the JS budget still holds because islands are few and `client:visible`. |
| C8 | PWA: `@vite-pwa/astro` / `vite-plugin-pwa` vs post-build `workbox-build` | **Post-build `scripts/build-sw.mjs` calling `workbox-build.generateSW()`** | `@vite-pwa/astro` declares peer `astro ≤ 5`; this path is fully verified. |
| C9 | Deck id: `sha1(...).slice(0,16)` lower-cased vs full 40-hex raw | **Full 40-char lowercase hex of `sha1(slug + "\|" + question)`, question text used RAW** | Verified: `sha1("sysdesign/consistent-hashing\|Why does consistent hashing minimise re-mapping when a node joins?")` = `f40204a70330cb3e7c3eb3b8c6bca3cefd2f8b13`. That is the locked golden. |
| C10 | Cloze mask: variable-length underscores vs fixed `____` | **Fixed four underscores `____`** per blank | Matches the locked golden string. |
| C11 | Day boundary: 04:00 rollover vs local calendar date | **Local calendar date in the device timezone, no rollover** (`dayKey(date, tz)`) | Matches the streak and hour goldens; simpler; timezone is injectable for tests. |
| C12 | Licence allow-list: SPDX ids vs human strings; is `CC BY-SA 4.0` allowed? | **Human strings; `CC BY-SA 4.0` is NOT allowed.** Allow-list: `MIT`, `Apache-2.0`, `BSD-2-Clause`, `CC0`, `CC BY 4.0`, `CC BY 2.5`, `Public domain`, `Own work`. The lint rejects anything matching `/NC\|ND\|SA/i` | ShareAlike would infect the whole project. ShareAlike sources (d2l) may be *mentioned in prose as a link*, never listed in `sources[]`, never adapted. |
| C13 | Content collections API: `defineCollection({ type: 'content' })` vs the Content Layer loader | **`loader: glob({ ... })` from `astro/loaders`** | `type: 'content'` is the legacy API and is not the Astro 7 path. |
| C14 | Napkin route: `/n/[slug]/` vs `/[track]/[slug]/` | **`/[track]/[slug]/`** → `/sysdesign/consistent-hashing/` | The deploy verification and every e2e spec use this shape. |
| C15 | Griddle (interactive visualiser): separate route vs island on the napkin | **An island on the napkin page**, anchored at `#griddle`, switched on by the `griddle:` frontmatter key | One URL per topic; no duplicate content; `/dsa/bubble-sort/#griddle` works. |
| C16 | Decks: bundled JS import vs fetched JSON | **`public/decks/*.json`, fetched at runtime** with `withBase('decks/all.json')` | Keeps the review island's JS small; the file is precached so it works offline; a `contentHash` field drives re-seeding. |
| C17 | Root layout name: `Counter.astro` vs `Base.astro` | **Both exist.** `Base.astro` = `<html>`, head, pre-paint script, SW registration. `Counter.astro` = the counter scene + bottom band, used by the screens | They are different jobs. |
| C18 | `hourBand`: is `00:00–05:59` `late` or `afternoon`? Is the morning boundary `11` or `12`? | **The wrap-around band is tested first:** `h >= 20 \|\| h < 6 → 'late'`, then `h < 12 → 'morning'`, else `'afternoon'` (§6.11) | Both earlier implementations returned `afternoon` for 00:00–05:59 while their own golden said `late`. Testing the wrap-around band first is the only ordering that satisfies the golden. `05:59 → late` stays locked. |
| C19 | Receipt layout: three incompatible renderings (ARCHITECTURE `receiptLines()`, §6.10 golden, `design/preview.html`) | **One 32-column format, defined once in §6.10.** Item rows use `row()`, total rows use `total()`; both emit exactly 32 columns. `TIP` prints `12-day streak` right-aligned in a 14-column value field | The §6.10 golden is asserted with `toBe` *and* by a 32-column property test; only one layout can satisfy both. ARCHITECTURE, TESTING and the preview now all point at §6.10. |
| C20 | Does `npm run build` regenerate diagrams? | **No.** `build` = lint-licences → decks → `astro build` → Pagefind → `build-sw` → `check-budgets`. `npm run diagrams` is a **separate** script run locally when a diagram source changes; its output is committed (C3). CI runs it **only** in `ci.yml`'s `diagrams-fresh` job, which is the job that installs Chromium | Otherwise every Pages and android-release run would re-export every diagram from a cold `.cache/` without Playwright installed, and the automatic Playwright fallback in §6.1 would crash the deploy. |
| C21 | The golden `consistent-hashing` diagram: 6 ruler steps (preview, wireframes) vs 4 (the §6.1 worked example, §7.6 card ⑨, checkpoint 2.6) | **4 steps.** Ruler ticks are the 0-based step **index** `0 · 1 · 2 · 3`; the caption and `aria-valuetext` are the 1-based human count, `Step ${k+1} of ${n}: ${caption}` | The worked example, the frontmatter `steps:` array and checkpoint 2.6 are all four; `design/preview.html` and the wireframes were re-authored to match. |
| C22 | `@media (prefers-color-scheme: dark)` in the token file: an empty placeholder rule | **Auto dark mode is real.** The media block repeats every `[data-theme="night"]` declaration verbatim (§3.1), so pasting the token file gives a working `Auto` edition | `house-rules.spec.ts` asserts that `Auto` + emulated dark mode computes `--bg` to `#12211F`, and A-20 tests it on device. An empty rule fails both. |
| C23 | MVP napkin count: 20 (7/7/6) vs 21 (8/7/6) | **20 napkins: 7 DSA, 7 system design, 6 data science** | That is what §7.6 (10 cards) plus §7.7 (10 cards) actually enumerate, and what GOAL criterion 4 says. |

---

## 1. Role & mission

You are a principal front-end engineer with a strong illustration eye, building **one** app end to end, solo, on **Windows 11** (Node ≥ 22.12, npm, git with Git Bash, Python 3.14). **No Java, no Android SDK, no Android Studio, no Flutter locally** — the Android APK is built and signed by GitHub Actions and downloaded from GitHub Releases.

**The product, in one paragraph.** Napkin is a static, offline-first study site (and a Capacitor Android APK of the same build) where every CS interview topic is *one numbered cream napkin* lying on a bottle-green diner counter: a marker-written title, a two-line TL;DR, one hand-drawn ballpoint diagram that draws itself stroke by stroke, three to five bullets, a Big-O table, and two or three flashcards. Diagrams are authored in Excalidraw / Mermaid / D2 and rendered to SVG **at build time**, so the app ships zero diagram libraries and every napkin is a few kilobytes of HTML and SVG. The flashcards feed an on-device FSRS-6 spaced-repetition scheduler that you rate by clicking the plungers of a four-colour Bic pen, and every session ends with a thermal receipt you tear off and share. Streaks are coffee rings on a placemat. All content is redrawn from CC BY / MIT sources with automatic attribution, and a licence lint fails the build on anything NonCommercial, NoDerivatives or ShareAlike.

**The quality bar.** *If a screenshot has no chrome dispenser, no four-colour pen and no green formica counter, you have drifted — start over.* The objects **are** the controls: the dispenser is the review queue, the pen is the rating widget, the receipt is the session summary, the coffee rings are the streak. This is not a theme painted onto a generic study app; it is the interaction model. At the same time, **the prose stays plain**: 17 px Nunito at ≥ 4.5:1 contrast, precise interview-prep sentences, no whimsy in the body copy. The joke lives in the objects; the learning lives in the text.

**Three adjectives:** Tactile · Cheerful · Legible.

**Never looks like** (each of these is a failure condition):

- **"Yet another sketchy docs site."** Hand-drawn diagrams alone are not an identity any more (Excalidraw docs, tldraw clones). Without the object system it is generic.
- **2010 iOS wood-and-leather skeuomorphism.** No bevels, no photographic textures, no emboss on text, **never more than one shadow per object**, textures ≤ 4 % opacity, no fake 3D rooms. Top-down orthographic camera only.
- **Lofi-Girl wallpaper or a dark SaaS dashboard.** No purple, no gradient blobs, no glassmorphism, no `backdrop-filter`, no illustrated characters, no 2 px-bordered cards on dark grey. The counter is green, the paper is cream; that is the entire palette story.
- **An illegible art project.** Caveat never sets body copy. Napkins never rotate more than 1.5°. Nothing readable ever sits on the lamp blend layer. Every gesture has a tap equivalent and a visible printed label.

**Success is measurable.** Airplane-mode complete; a napkin's title and TL;DR painted in ≤ 500 ms and its diagram fully drawn in ≤ 1.5 s on a mid-range 2022 Android phone; the whole review loop reachable with one thumb; 20 napkins at MVP with provenance on every one; licence lint green; precache ≤ 10 MB; zero serious/critical axe violations on all eight screens.

---

## 2. Non-negotiables

### 2.1 Rules

1. **Free only.** GitHub (public repo, Pages, Actions, Releases) is the entire infrastructure. No Cloudflare account, no Worker, no paid fonts/icons/sounds/services. If a step asks for a credit card, stop — it is the wrong step.
2. **Offline is a feature, not a nicety.** After one online visit on the web (or from first launch in the APK) every napkin, the search, the review queue and the placemat work with the network off. **Napkin makes zero network requests at runtime.** No fonts from a CDN, no analytics, no telemetry, no accounts, no crash reporting.
3. **Privacy.** Progress lives in IndexedDB on the device and leaves it only as a user-triggered JSON export.
4. **Licences (code).** Bundled runtime code must be OSI-licensed: MIT / Apache-2.0 / BSD / ISC / MPL-2.0 / Unlicense / CC0 / OFL. **AGPL is banned.** GSAP's free Webflow "Standard License" is tolerated *for animation only* and is optional — prefer Motion (MIT); do not add GSAP unless a timeline is genuinely clearer, and never for anything structural.
5. **Licences (content).** Every napkin's `sources[]` entries must use the allow-list in §7.2. **Zero content may be derived from ByteByteGo, roadmap.sh, VisuAlgo, MIT OpenCourseWare or CS50** — not adapted, not traced, not "for inspiration". The build fails on a banned host.
6. **Diagrams never reach the client.** Excalidraw, Mermaid, D2, jsdom and Playwright are `devDependencies`. A CI check greps `dist/_astro/**` for `mermaid`, `@excalidraw`, `terrastruct` and fails on a hit.
7. **Accessibility is a build gate, not a phase.** ≥ 4.5:1 text contrast on the actual ground, ≥ 44 × 44 px touch targets, visible focus rings, `prefers-reduced-motion` honoured, every gesture has a tap/keyboard twin.
8. **Day 1 = live.** Phase 0 ends with a hello-world Counter on GitHub Pages *and* a signed APK installed on the phone, before any feature work.
9. **Engine first, UI second.** `src/engine/**` is pure TypeScript — no DOM, no React, no Astro — written with unit tests and golden data before it gets a face.

### 2.2 Exact stack

Pin these versions in `package.json`. Where a version is given as a range the latest patch is fine; where an exact number is given, use it.

**Runtime dependencies**

| Package | Version | Licence | Role |
|---|---|---|---|
| `astro` | `^7.3.1` | MIT | SSG. **Requires Node ≥ 22.12** |
| `@astrojs/mdx` | `^8.0.0` | MIT | MDX in content collections |
| `@astrojs/react` | latest for Astro 7 | MIT | React islands |
| `react`, `react-dom` | `^19` | MIT | islands only |
| `@tailwindcss/vite` + `tailwindcss` | `^4` | MIT | CSS-first `@theme` mapped to our tokens |
| `motion` | `^13.2.0` | MIT | `motion/react` in islands, `motion/dom` `animate()` in vanilla scripts |
| `roughjs` | `4.6.6` | MIT | hand-drawn primitives at runtime (bullets, check marks, highlighter, visualisers) |
| `dexie` | `^4.4.5` | Apache-2.0 | IndexedDB |
| `dexie-react-hooks` | latest | Apache-2.0 | `useLiveQuery` |
| `ts-fsrs` | `5.4.2` | MIT | FSRS-6 scheduler |
| `zustand` | `^5` | MIT | per-feature UI state |
| `zod` | `^3` | MIT | frontmatter + backup validation |
| `howler` | `^2` | MIT | one CC0 sound sprite |
| `workbox-window` | `^7.4.1` | MIT | update ticket |
| `@fontsource-variable/caveat`, `/nunito`, `/jetbrains-mono` | `^5.3.0` | OFL-1.1 | source files for subsetting |
| `@capacitor/core` | `8.5.1` | MIT | |
| `@capacitor/android`, `/app`, `/haptics`, `/share`, `/filesystem`, `/status-bar`, `/splash-screen` | `8.5.1` | MIT | |

**Dev dependencies**

| Package | Version | Licence | Role |
|---|---|---|---|
| `@excalidraw/excalidraw` | `0.18.1` | MIT | build-time `exportToSvg` |
| `excalidraw-animate` | `0.7.2` | MIT (via GitHub `LICENSE`; **npm metadata has no `license` field**, so the licence checker needs an explicit exclusion) | SMIL injection |
| `jsdom` | `^27` | MIT | DOM for the export |
| `svgo` | `^4.1.0` | MIT | SVG minify |
| `mermaid` `11.17.2` + `rehype-mermaid` `^3.0.0` | | MIT | `.mmd` → inline SVG at build |
| `@terrastruct/d2` | `0.1.33` | MPL-2.0 (unmodified dependency — fine) | `.d2` → sketch SVG at build |
| `pagefind` | `^1.5.2` | MIT | post-build search index |
| `workbox-build` | `^7.4.1` | MIT | `generateSW` |
| `@playwright/test` + `playwright` | `^1.5x` | Apache-2.0 | e2e, visual, a11y, and the fallback diagram exporter |
| `@axe-core/playwright` | `^4` | MPL-2.0 | a11y |
| `vitest` | `^4` | MIT | unit/component/build tests |
| `@testing-library/react`, `/user-event`, `/jest-dom` | latest | MIT | island tests |
| `fake-indexeddb` | `^6` | Apache-2.0 | Dexie in Vitest |
| `fast-check` | latest | MIT | property tests |
| `@biomejs/biome` | `^2` | MIT | lint + format |
| `license-checker-rseidelsohn` | `^4` | BSD-3 | dependency licence gate |
| `lighthouse` | `^12` | Apache-2.0 | budgets |
| `@capacitor/cli`, `@capacitor/assets` | 8.5.1 / latest | MIT | shell + icon generation |

**Python 3.14** (`pip install "fonttools[woff]" brotli`) for `scripts/subset-fonts.py`, `scripts/make-noise.py`, `scripts/import-anki.py`.

**Explicitly rejected:** Starlight (docs chrome fights the infographic look), MiniSearch (Pagefind's shards need no custom index), `@vite-pwa/astro` (peer ≤ Astro 5), `excalidraw-to-svg` (stale, pre-Excalifont), `vivus` (stale; CSS does it), tldraw (not open source), Lottie (licence page unreachable — ship none), any hosted LLM in the core loop.

### 2.3 Folder layout

```
napkin/
├── .github/workflows/
│   ├── pages.yml                  # push main → build + deploy to GitHub Pages
│   ├── ci.yml                     # PRs: lint, unit, diagrams-fresh, build, e2e, a11y, visual, licences
│   ├── android-release.yml        # tag v* (or manual) → signed APK on a draft Release
│   ├── nightly.yml                # OPTIONAL (§11.2 prose, no YAML inlined): 03:00 UTC offline, perf, Lighthouse
│   └── visual-baseline.yml        # OPTIONAL (§11.2 prose, no YAML inlined): manual screenshot regeneration
├── android/                       # Capacitor shell — COMMITTED (generated by `npx cap add android`)
├── public/
│   ├── .nojekyll                  # empty file
│   ├── fonts/                     # 4 subset woff2 (Caveat, Excalifont, Nunito, JetBrains Mono)
│   ├── textures/noise-256.webp    # ≤ 6 kB, generated
│   ├── objects/                   # our own SVG: dispenser, pen, highlighter, mug, bell, dial,
│   │                              #   printer-edge, menu-tab, paperclip, coffee-ring-{1,2,3}, quilt-pattern
│   ├── icons/                     # PWA icons 192/512/maskable + icons.svg (Rough-rendered Lucide sprite)
│   ├── sounds/                    # sfx.webm, sfx.mp3, CREDITS.md
│   ├── diagrams/                  # GENERATED AND COMMITTED: <name>.svg, <name>.anim.svg, <name>.steps.json
│   └── decks/                     # generated at build, gitignored: dsa.json sysdesign.json ds.json all.json
├── scripts/
│   ├── build-diagrams.mjs         # §6.1
│   ├── harness.ts                 # Playwright fallback exporter entry
│   ├── lint-licences.mjs          # §7.3
│   ├── build-decks.mjs            # §6.4
│   ├── build-sw.mjs               # §6.12
│   ├── check-budgets.mjs          # §10.5
│   ├── number-card.mjs            # §6.11
│   ├── rough-icons.mjs            # Lucide → Rough.js sprite
│   ├── subset-fonts.py · make-noise.py · import-anki.py
│   └── __tests__/*.test.mjs
├── src/
│   ├── pages/
│   │   ├── index.astro            # The Counter
│   │   ├── menu.astro             # The Menu
│   │   ├── [track]/[slug].astro   # The Napkin (+ Griddle island)
│   │   ├── review.astro           # Order Up
│   │   ├── placemat.astro         # The Placemat
│   │   ├── house-rules.astro      # Settings + credits
│   │   ├── offline.astro · 404.astro · __gallery.astro (only when PUBLIC_GALLERY=1)
│   ├── layouts/Base.astro · Counter.astro
│   ├── content/
│   │   ├── config.ts              # loaders + zod (§5.1)
│   │   ├── cards/{dsa,sysdesign,ds}/*.mdx
│   │   ├── tracks/{dsa,sysdesign,ds}.yaml
│   │   └── numbers.json           # slug → napkin number, append-only
│   ├── diagrams/                  # SOURCES, committed: *.excalidraw, *.mmd, *.d2
│   ├── data/attribution.json      # COMMITTED, hand-maintained: per-file Wikimedia Commons licences (§7.2)
│   ├── generated/credits.json     # GENERATED by lint-licences.mjs, gitignored — never hand-edited (§7.3)
│   ├── components/
│   │   ├── napkin/  Napkin.astro NapkinTitle.astro Tldr.astro Diagram.astro BulletList.astro
│   │   │            BigOTable.astro RelatedScraps.astro Attribution.astro SourceToggle.astro
│   │   ├── counter/ Dispenser.astro Pen.astro Mug.astro Bell.astro StickyNote.astro
│   │   │            TicketRail.astro MenuEdge.astro FolioBar.astro
│   │   ├── menu/    MenuPage.astro MenuRow.astro TrackHead.astro FilterWords.astro PrereqLines.astro
│   │   └── ui/      PencilButton.astro LightSwitch.tsx Receipt.tsx CoffeeRing.astro
│   ├── features/                  # React islands: index.tsx + store.ts + *.test.tsx
│   │   ├── scrubber/ review/ search/ griddle/ placemat/ highlight/ update-ticket/
│   ├── engine/                    # PURE TS, 100 % unit-tested
│   │   ├── fsrs/ (scheduler.ts queue.ts) · decks/ids.ts · cloze/parse.ts · progress/ (streak.ts rings.ts)
│   │   ├── receipt/format.ts · theme/hour.ts · search/index.ts · attribution/credits.ts
│   │   ├── backup/schema.ts · scrubber/map.ts
│   │   └── viz/ (types.ts bubble-sort.ts insertion-sort.ts merge-sort.ts binary-search.ts bfs-grid.ts
│   │             lru-cache.ts token-bucket.ts quorum.ts hash-ring.ts fnv1a.ts hash-chaining.ts bst.ts)
│   ├── db/dexie.ts · migrations.ts · export.ts
│   ├── platform/haptics.ts · share.ts · back-button.ts · sound.ts
│   ├── lib/base.ts                # the ONLY way to build a URL
│   ├── styles/tokens.css · global.css · materials.css · motion.css
│   └── sw-register.ts
├── e2e/ (specs, visual/, a11y/, offline/, __screenshots__/linux/, _fixtures.ts)
├── tests/ (setup.ts, fixtures/, golden/)
├── design/preview.html            # the visual contract
├── docs/                          # these planning docs
├── astro.config.mjs · capacitor.config.ts · biome.json · vitest.config.ts · playwright.config.ts
├── lighthouse-budget.json · .gitattributes · .gitignore · LICENSE (MIT) · README.md · CHANGELOG.md
└── .cache/                        # gitignored diagram cache keyed by content hash
```

`.gitignore` must contain: `dist`, `.cache`, `public/decks`, `src/generated`, `node_modules`, `android/local.properties`, `android/app/build`, `android/.gradle`, `*.p12`, `*.jks`, `*.keystore`, `*.b64`, `.env.local`.
`.gitattributes` must contain: `android/gradlew text eol=lf` and `*.sh text eol=lf`.
**`public/diagrams/` is committed** (C3). `public/decks/` is not.

### 2.4 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import rehypeMermaid from 'rehype-mermaid';

const rawBase  = process.env.VITE_BASE_PATH ?? '/';          // '/napkin/' on Pages, '/' for the APK and locally
const base     = rawBase === '/' ? '/' : rawBase.replace(/\/+$/, '');   // Astro wants '/napkin'
const withSlash = base === '/' ? '/' : `${base}/`;                      // runtime wants '/napkin/'
const platform = process.env.VITE_PLATFORM ?? 'web';         // 'android' inside android-release.yml
const version  = process.env.APP_VERSION ?? 'dev';

export default defineConfig({
  site: 'https://ttrahul007.github.io',
  base,
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_astro', inlineStylesheets: 'auto' },
  integrations: [
    mdx({
      rehypePlugins: [[rehypeMermaid, {
        strategy: 'inline-svg',
        mermaidConfig: {
          look: 'handDrawn', theme: 'base',
          themeVariables: { primaryColor: '#F7F1E3', lineColor: '#1B1F2A', fontFamily: 'Excalifont' },
        },
      }]],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_PLATFORM':   JSON.stringify(platform),
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version),
      'import.meta.env.PUBLIC_BASE':        JSON.stringify(withSlash),
    },
  },
});
```

`src/lib/base.ts` — **the only place URLs are built** (unit-tested):

```ts
export const BASE = import.meta.env.PUBLIC_BASE as string;            // '/' or '/napkin/'
export const withBase = (p: string) => BASE + p.replace(/^\/+/, ''); // withBase('decks/all.json') → '/napkin/decks/all.json'
```

A build-time assertion in `check-budgets.mjs` greps every `dist/**/*.html` for `//napkin` or `href="//"` and fails on a hit (no double slashes, ever).

### 2.5 `package.json` scripts

Every workflow, checkpoint and test instruction in this document refers to these exact names. **The order inside `build` matters**: the licence lint runs first so bad content fails in two seconds; Pagefind runs **before** `build-sw.mjs` so the search shards are in the precache manifest; and the budget check runs last so it sees the finished `dist/`.

**`npm run diagrams` is NOT part of `npm run build` (C20).** Diagram output is committed (C3), so the build never needs Excalidraw, Playwright or the 60 MB D2 WASM. You run `npm run diagrams` locally whenever a file under `src/diagrams/` changes, and commit the result; the only CI job that runs it is `ci.yml`'s `diagrams-fresh`, which installs Chromium for exactly that purpose and then `git diff --exit-code`s the output.

```json
{
  "scripts": {
    "dev": "astro dev",
    "diagrams": "node scripts/build-diagrams.mjs",
    "decks": "node scripts/build-decks.mjs",
    "fonts": "python scripts/subset-fonts.py",
    "icons": "node scripts/rough-icons.mjs",
    "number": "node scripts/number-card.mjs",
    "build": "node scripts/lint-licences.mjs && npm run decks && astro build && pagefind --site dist && node scripts/build-sw.mjs && node scripts/check-budgets.mjs",
    "preview": "astro preview",
    "lint": "biome ci .",
    "format": "biome format --write .",
    "test": "vitest run",
    "test:unit": "vitest run --project unit",
    "test:component": "vitest run --project component",
    "test:build": "vitest run --project build",
    "test:e2e": "playwright test --project=desktop --project=pixel7",
    "test:visual": "playwright test --project=visual",
    "test:a11y": "playwright test --project=a11y",
    "test:offline": "playwright test --project=offline",
    "test:licences": "license-checker-rseidelsohn --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;MPL-2.0;0BSD;CC0-1.0;Unlicense;OFL-1.1;Python-2.0' --excludePackages 'excalidraw-animate@0.7.2' --production",
    "test:all": "npm run lint && npm test && npm run build && npm run test:e2e && npm run test:a11y && npm run test:offline"
  }
}
```

`npm run diagrams` reads the caption overrides from `.cache/captions.json`, which `scripts/lint-licences.mjs` writes from each card's `steps:` frontmatter — so when you change a `steps:` array, run `node scripts/lint-licences.mjs && npm run diagrams` (or simply `npm run build && npm run diagrams`). The script treats a missing `.cache/captions.json` as `{}` and falls back to the captions derived from the `1.` callouts.

`NAPKIN_SKIP_DIAGRAMS=1` lets `astro dev` run without regenerating diagrams; `NAPKIN_DIAGRAM_EXPORTER=playwright` switches the Excalidraw exporter; `NAPKIN_PRECACHE_MAX_MB` (default `10`) is the precache ceiling in `build-sw.mjs`; `PUBLIC_GALLERY=1` adds the `/__gallery/` route used by the visual tests.

---

## 3. Design & aesthetics — the complete frontend brief

**Design system name:** *Corner Booth*. The app is *Napkin*.

**One-liner:** interview prep sketched on the back of a diner napkin at 2 a.m.

**The rule that makes it coherent:** exactly **three materials** (paper, chrome, formica), exactly **three pens** (ballpoint for diagrams, marker for titles, thermal printer for anything the machine spat out), and **one light source** (the lamp above the counter). Everything you *read* sits on cream paper in dark ink at ≥ 4.5:1. Everything you *do* is an object in the thumb zone. Skeuomorphism is confined to objects; body copy is plain interview-prep prose.

### 3.1 Design tokens — paste this into `src/styles/tokens.css` verbatim

```css
:root {
  color-scheme: light;

  /* ---- Colour: Day shift (default) ---- */
  --bg: #1E3B38;             /* counter formica — frame only, NEVER a text ground */
  --bg-elevated: #2A4A45;    /* lamp-pool centre, pencil tray, ticket rail */
  --surface: #F7F1E3;        /* napkin paper — all reading happens here */
  --surface-2: #EDE5D2;      /* folds, menu backing, Big-O table stripes */
  --ink: #1B1F2A;            /* ballpoint blue-black. 14.6:1 on --surface */
  --ink-muted: #5C5F6B;      /* captions, attribution, predicted intervals. 5.6:1 */
  --ink-faint: #8B8E98;      /* perforation dots, disabled ticks — DECORATIVE ONLY (2.9:1) */
  --accent: #C8322B;         /* diner red — fills, Again plunger; as text ≥ 14px only (4.7:1) */
  --accent-ink: #F7F1E3;     /* text on --accent fills (4.7:1) */
  --accent-2: #1F4FA3;       /* blue ballpoint — links, Good plunger, data-flow arrows (6.9:1) */
  --success: #276E46;        /* green ink — Easy plunger, done (5.5:1) */
  --warning: #E1A62B;        /* mustard sticker — NEVER text on paper (1.9:1); fill only */
  --danger: #B3261E;         /* destructive confirms, "not cached" (5.8:1) */
  --border: #D9CFB8;         /* quilt emboss, menu rules, perforation (non-text) */
  --border-strong: #1B1F2A;  /* the one 2px ink rule under a napkin title */
  --focus: #1F4FA3;

  /* ---- Brand extensions (Napkin-only, additive) ---- */
  --on-bg: #F7F1E3;          /* text on the counter (10.7:1) */
  --on-bg-muted: #B7C6BF;    /* secondary counter text (6.8:1) */
  --on-bg-faint: #7E958D;    /* decorative counter marks only (3.8:1) */
  --focus-on-bg: #6FA0FF;    /* focus ring on the counter (4.7:1) */
  --chrome-hi: #F2F3F5;  --chrome: #C9CCD1;  --chrome-lo: #8E9297;  /* ALWAYS a 3-stop gradient */
  --coffee: #6B3F22;         /* coffee rings at 35 / 48 / 60 % opacity */
  --highlighter: #FFE066;    /* ink over it is 12.6:1 */
  --receipt: #FFFDF8;        /* thermal paper, whiter than the napkin */
  --pen-red: var(--accent);  --pen-black: var(--ink);
  --pen-blue: var(--accent-2); --pen-green: var(--success);
  --lamp: rgba(255, 196, 96, 0.14);
  --grain-opacity: 0.03;
  --blinds: none;

  /* ---- Typography ---- */
  --font-display: "Caveat Variable", "Caveat", "Segoe Print", cursive;
  --font-diagram: "Excalifont", "Caveat Variable", cursive;
  --font-body: "Nunito Variable", "Nunito", "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, Consolas, monospace;
  --text-xs: 0.75rem;   --text-sm: 0.875rem;  --text-base: 1.0625rem; --text-lg: 1.25rem;
  --text-xl: 1.5rem;    --text-2xl: 2rem;     --text-3xl: 2.5rem;
  --text-4xl: 3.5rem;   --text-5xl: 5rem;
  --leading-tight: 1.1; --leading-body: 1.55;
  --tracking-caps: 0.08em; --tracking-receipt: 0.04em;
  --display-scale: 1.15;  /* Caveat sits at 1.15× the Nunito size beside it */

  /* ---- Spacing / radius ---- */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-7: 32px; --space-8: 40px; --space-9: 48px; --space-10: 64px; --space-11: 80px; --space-12: 96px;
  --radius-sm: 4px; --radius-md: 12px; --radius-lg: 20px; --radius-xl: 28px; --radius-full: 999px;

  /* ---- Elevation: one lamp, top-centre → shadows fall straight down. ONE per object, never stacked ---- */
  --shadow-1: 0 1px 0 rgba(0, 0, 0, 0.18);      /* paper edge resting on the counter */
  --shadow-2: 0 6px 14px rgba(0, 0, 0, 0.28);   /* any object on the counter */
  --shadow-3: 0 14px 32px rgba(0, 0, 0, 0.36);  /* a lifted napkin, the open menu, the sticky note */

  /* ---- Motion ---- */
  --dur-fast: 120ms; --dur-base: 240ms; --dur-slow: 480ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.6%, 0.99 45.6%, 1.003 49.7%, 1.012 55%, 1.012 60.3%, 1.004 68.2%, 0.999 80.2%, 1);
  --ease-click: steps(1, end);
  --ease-flip: cubic-bezier(0.45, 0, 0.2, 1);

  /* ---- Layout ---- */
  --napkin-max: 420px; --napkin-max-desktop: 640px; --band-h: 88px;
  --safe-top: env(safe-area-inset-top, 0px); --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* After hours: the counter darkens, the paper dims, THE INK NEVER CHANGES */
[data-theme="night"] {
  color-scheme: dark;
  --bg: #12211F; --bg-elevated: #1B302C;
  --surface: #EAE4D6; --surface-2: #E0D8C6;
  --ink-muted: #585B67; --ink-faint: #878A94;
  --accent: #B52D26; --accent-2: #1C478F; --focus: #1C478F;
  --border: #D2C7AE;
  --on-bg: #EAE4D6; --on-bg-muted: #A9B8B1; --on-bg-faint: #6F857D;
  --highlighter: #F5D95C; --receipt: #F3EFE6;
  --lamp: rgba(255, 176, 64, 0.22);
  --grain-opacity: 0.04;
}
/* Auto edition: the same night values, applied only when the learner has not pinned "Day shift".
   These declarations are a verbatim copy of the [data-theme="night"] block above — the two must never
   drift, and visual/tokens.spec.ts asserts they compute identically (C22). */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="day"]) {
    color-scheme: dark;
    --bg: #12211F; --bg-elevated: #1B302C;
    --surface: #EAE4D6; --surface-2: #E0D8C6;
    --ink-muted: #585B67; --ink-faint: #878A94;
    --accent: #B52D26; --accent-2: #1C478F; --focus: #1C478F;
    --border: #D2C7AE;
    --on-bg: #EAE4D6; --on-bg-muted: #A9B8B1; --on-bg-faint: #6F857D;
    --highlighter: #F5D95C; --receipt: #F3EFE6;
    --lamp: rgba(255, 176, 64, 0.22);
    --grain-opacity: 0.04;
  }
}

/* Counter light by hour — set by the pre-paint script from the clock; pinnable in House Rules */
[data-hour="morning"]   { --lamp: rgba(200, 220, 255, 0.10);
                          --blinds: repeating-linear-gradient(100deg, rgba(255,255,255,.06) 0 14px, transparent 14px 34px); }
[data-hour="afternoon"] { --blinds: none; }
[data-hour="late"]      { --blinds: none; --lamp: rgba(255, 176, 64, 0.20); }

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 1ms; --dur-base: 1ms; --dur-slow: 160ms; --ease-spring: linear; }
}
```

**Contrast contract (a CI test recomputes these from the token file and fails if any pair drops below):**
`ink/surface ≥ 14.0` · `ink-muted/surface ≥ 5.0` · `accent/surface ≥ 4.5` · `accent-2/surface ≥ 6.5` · `success/surface ≥ 4.8` · `danger/surface ≥ 5.0` · `on-bg/bg ≥ 10.0` · `on-bg-muted/bg ≥ 6.5` · `focus-on-bg/bg ≥ 4.5` · `accent-ink/accent ≥ 4.5`; night: `ink/surface ≥ 12.5`, `success/surface ≥ 4.5`.
`--warning` and `--ink-faint` may **never** be text on paper. Text contrast is measured on `--surface`/`--surface-2`, never on `--bg` — `--bg` is the frame; only `--on-bg*` classes ever sit on it.

### 3.2 Typography

Three families, four files, all OFL-1.1, all self-hosted. **No Google Fonts `<link>` in the app** (`design/preview.html` may hotlink; production must not).

| Role | Face | Source | Weights |
|---|---|---|---|
| Display (marker) | **Caveat** | `@fontsource-variable/caveat` → subset | 500 notes, 700 titles |
| Diagram labels (ballpoint) | **Excalifont** | download the woff2 from `https://plus.excalidraw.com/excalifont`, commit to `public/fonts/` | 400 only |
| Body / UI | **Nunito** | `@fontsource-variable/nunito` → subset | 400 prose, 600 labels, 700 emphasis |
| Mono (the machine) | **JetBrains Mono** | `@fontsource-variable/jetbrains-mono` → subset | 400 / 700, **ligatures off** (`font-variant-ligatures: none`) |

*Fallback if the Excalifont download page changes:* **Virgil**, bundled with `@excalidraw/excalidraw` — also OFL. Never substitute a system cursive.

**Subsetting** — `scripts/subset-fonts.py` runs `pyftsubset` with
`--unicodes="U+0020-007E,U+00A0-00FF,U+2013-2026,U+2190-21FF,U+2200-22FF"` (Latin + arrows + math for Big-O), `--flavor=woff2`, `--layout-features=kern,liga` (drop `liga` for the mono). It **asserts the budget**: four files ≤ 130 kB total, ≤ 45 kB each, and prints the table. All faces use `font-display: swap` with a size-adjusted fallback (`size-adjust` / `ascent-override` in `@font-face`) so CLS ≤ 0.02.

**Type scale** (base 16 px; body 17 px on phone):

| Token | px | Face / use |
|---|---|---|
| `--text-xs` | 12 | Nunito 600 caps labels, attribution, ticket rail |
| `--text-sm` | 14 | Nunito meta and chips; JetBrains Mono code, Big-O cells, receipt body |
| `--text-base` | 17 | Nunito 400 body and bullets, line-height 1.55 |
| `--text-lg` | 20 | Nunito 600 TL;DR, menu item titles |
| `--text-xl` | 24 | Caveat 700 section scrawls, sticky-note query echo |
| `--text-2xl` | 32 | Caveat 700 napkin title (phone) |
| `--text-3xl` | 40 | Caveat 700 napkin title (desktop), flashcard question |
| `--text-4xl` | 56 | Caveat 700 `No. 037`, due count on the dispenser plate |
| `--text-5xl` | 80 | Caveat 700 `NAPKIN` wordmark, streak numeral on the mug |

**Rules (enforced by a visual test):**
- Caveat's x-height is small: set Caveat at **1.15×** the Nunito size beside it, and **never below 24 px**. Caveat never sets `<p>`, `<li>`, `<td>`, or a `<button>`.
- **Every counter, interval, timer, folio and table number is JetBrains Mono** (monospace = tabular by construction). Caveat numerals appear only as the decorative napkin number and the mug streak — never in something that counts up.
- Letter-spacing: Nunito caps labels `0.08em`; Nunito prose `0`; Caveat `0` (tracking kills handwriting); mono receipt `0.04em` uppercase, code `0`.
- `text-wrap: balance` on Caveat titles; `text-wrap: pretty` on bullets; max measure 60–72 ch (napkin 420 px phone / 640 px desktop).
- Content is English (`<html lang="en">`). No Devanagari in v1.

### 3.3 Materials — how to build every surface (zero raster bytes except one 6 kB noise tile)

```css
/* Formica counter */
.counter {
  background:
    radial-gradient(ellipse 80% 55% at 50% 22%, var(--bg-elevated), var(--bg) 70%);
  position: relative; isolation: isolate;
}
.counter::before {                                   /* grain */
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: url("/textures/noise-256.webp");  /* use withBase() when emitted from JS */
  background-repeat: repeat; opacity: var(--grain-opacity);
  mix-blend-mode: overlay;
}
.counter::after {                                    /* THE lamp pool — the ONLY blend layer in the app */
  content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background:
    var(--blinds),
    radial-gradient(ellipse 70% 40% at 50% 18%, var(--lamp), transparent 72%);
  mix-blend-mode: soft-light;
  transition: background 6000ms linear;              /* the hour crossfade */
}
```

- **Never** run `feTurbulence` over a full screen on a phone. The noise is a tiled 256 px WebP generated once by `scripts/make-noise.py`.
- **Exactly one** `mix-blend-mode` element must exist in the DOM (a visual test asserts this). Paper is opaque and sits above it, so no text ever renders on the blend layer.
- **Napkin paper:** `background: var(--surface)`, 3 % noise, a 6 px **quilted emboss border** drawn with an SVG `<pattern>` of 1 px `--border` diagonal cross-hatch, plus a 1 px inset `--border` line, `border-radius: var(--radius-md)`, `box-shadow: var(--shadow-2)`.
- **Chrome:** `linear-gradient(180deg, var(--chrome-hi) 0%, var(--chrome) 45%, var(--chrome-lo) 100%)` plus a single 1 px `rgba(255,255,255,.55)` top highlight. No other bevel, ever.
- **Coffee rings:** three pre-rendered SVG variants (~1 kB each), `--coffee` stroke 7–9 px, Rough roughness 1.2, drawn at 35 / 48 / 60 % opacity for 1 / 5 / 20+ reviews; rotation seeded by the date.
- **Receipt:** `--receipt` ground, `border-top/bottom: 1px dashed var(--ink-faint)` perforations, jagged tear via a 24-point `clip-path: polygon(...)`.
- **Laminated menu:** `--surface` with a 1 px `--border` rule every 44 px (`repeating-linear-gradient`), a 2 px `--border-strong` rule under section heads, and a `--warning` `SPECIAL` sticker rotated −8°.
- **Forbidden:** `backdrop-filter`, photographic textures, more than one shadow per object, any raster image other than `noise-256.webp` and the PWA icons.

### 3.4 Motion language

**Principles.** Paper, chrome and ink each move differently and never share an easing. Paper has weight and friction (ease-out, spring settle, ≤ 1.5° rotation correction). Chrome is mechanical (`steps(1)`, no easing, two frames). Ink appears in authoring order. **Nothing floats, nothing breathes, nothing loops** except the receipt chatter while printing and the ink draw while a diagram plays. Ambient light changes take 6 s so you only notice afterwards.

| # | Name | Property, from → to | Duration · easing |
|---|---|---|---|
| 1 | `napkin-pull` | `translateY(100%) rotate(-1.5deg)` → `translateY(0) rotate(0)`; shadow 1 → 2 | 480 ms `--ease-spring`; during drag it follows the finger 1:1 for 80 px then rubber-bands `d × 0.55` |
| 2 | `ink-draw` | SMIL from `excalidraw-animate` (opacity + path `d`), or CSS `stroke-dashoffset: len → 0` for Rough.js islands | 500 ms per element, spline ease-out, 40 ms stagger, **total capped at 5 s** |
| 3 | `title-write` | `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` on the Caveat title | 600 ms `--ease-in-out`, starts 120 ms after `napkin-pull` lands |
| 4 | `napkin-flip` | `rotateY(0)` → `rotateY(180deg)`, `backface-visibility: hidden`, shadow blur 14 → 28 px at 90° | 380 ms `--ease-flip` |
| 5 | `plunger-click` | `translateY(0)` → `translateY(4px)` → `translateY(0)`, exactly two frames | 90 ms `--ease-click` — **no easing, ever** |
| 6 | `receipt-print` | per line `translateY(8px); opacity 0` → `0; 1`, revealed in order | 40 ms per line, `--ease-click` |
| 7 | `receipt-tear` | jagged `clip-path` appears; torn half `translateX(-24px) rotate(-3deg)`, opacity → 0 | 220 ms `--ease-out` |
| 8 | `coffee-ring-stamp` | `scale(0.8) rotate(seed)` → `scale(1)`, opacity 0 → tier | 600 ms `--ease-out` |
| 9 | `highlighter-swipe` | Rough path `stroke-dashoffset: len → 0` in `--highlighter` at 55 % | 280 ms stiff `--ease-spring` |
| 10 | `menu-slide` | menu `translateX(-100%)` → `0`; counter overlay opacity 0 → 0.2 | 240 ms `--ease-out` |
| 11 | `note-rise` | `translateY(24px); opacity 0` → `0; 1` | 240 ms `--ease-out` |
| 12 | `counter-light` | `--lamp` / `--bg` crossfade at the hour boundary (`@property`-registered colours) | 6000 ms linear |
| 13 | `napkin-swap` | View Transition, `view-transition-name: napkin`: old napkin slides off left and fades, new one rises from the dispenser | 480 ms `--ease-out`; on touch a horizontal swipe tracks 1:1 and commits at 30 % travel or > 600 px/s |

**Reduced motion** (`prefers-reduced-motion: reduce` **or** the House Rules override — both must work): napkins fade (160 ms opacity) instead of travelling; diagrams render the **static** `.svg` and the ruler steps them by toggling group opacity; flip becomes a 160 ms crossfade; receipts appear whole; no spring overshoot; `counter-light` snaps; coffee rings appear at final opacity. **Haptics are unaffected** — they are the "sound" of this app.

**`motion.css` states the preference twice, and the CSS media query comes first.** A JavaScript-only implementation (`matchMedia` mirrored onto a `data-motion` attribute) ignores the preference until the script runs, and entirely if JS is blocked — so every reduced-motion declaration appears in *both* of these, with identical bodies:

```css
/* (a) the system preference, honoured before any script runs.
   Scoped so a deliberate House Rules "Full" pin can still win — the same shape
   the token file uses for :root:not([data-theme="day"]). */
@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion="full"]) .napkin.pull { animation: fade-in 160ms linear both; }
  /* … every rule below, repeated verbatim … */
}

/* (b) the House Rules override, set on <html> by the pre-paint script. */
[data-motion="reduced"] .napkin.pull { animation: fade-in 160ms linear both; }
```

`design/preview.html` carries the same two-block structure; a11y tests run with `reducedMotion: 'reduce'` and assert that the only animations after a pull are opacity, ≤ 160 ms.

### 3.5 The five signature interactions (build these exactly)

**3.5.1 Pull a napkin.**
1. The chrome dispenser sits in the bottom band with the top edge of the next napkin peeking **28 px** out of the slot; the spring plate shows the due count (`7 due`) embossed in mono.
2. Touch the peeking edge (**56 px** tall hit area) and drag up: the paper follows the finger **1:1 for the first 80 px**, then rubber-bands at `delta × 0.55`.
3. Past **120 px** of travel, or a flick faster than **600 px/s**, the napkin springs free (`napkin-pull`), lands with the 1.5° correction, the title writes itself (`title-write`) and the ballpoint diagram draws (`ink-draw`). Below the threshold it slides back silently with no sound.
4. **A plain tap on the peeking edge does exactly the same thing.** This is required, not optional.
- Sound: paper "fwip" ≤ 120 ms. Haptic: `impact Light` on release.
- The drag must **start inside the slot element**, never at the screen edge, so it cannot fight the Android home swipe.

**3.5.2 The ruler scrubber.**
1. Under every animated diagram runs a printed hairline ruler the width of the napkin: tick marks and mono numerals `0 · 1 · 2 … n−1`, one per step from the diagram's sidecar JSON. **The printed numerals are the 0-based step index** (`steps[k].index`), so the golden `consistent-hashing` napkin shows `0 · 1 · 2 · 3` (C21). The strip is **44 px tall**.
2. The pen's tip rests at the current step. Drag the pen — or anywhere on the strip — and the island calls `svg.pauseAnimations(); svg.setCurrentTime(t(x)/1000)`, so **the drawing exists only up to where the pen has reached**. Tap a tick to jump to it. Lift the pen (`pointerup`) to `unpauseAnimations()` and resume from there.
3. The step caption beneath swaps to the current step's text, inside an `aria-live="polite"` region. **The caption and the `aria-valuetext` say exactly the same thing**, in the 1-based human form: `Step 3 of 4 · Hash the key` printed, `Step 3 of 4: Hash the key` announced.
- `role="slider"`, `aria-valuemin=0`, `aria-valuemax=n-1`, `aria-valuenow=k` (all 0-based, matching the printed tick numerals), and `aria-valuetext` built by **exactly one** template: `` `Step ${k + 1} of ${n}: ${steps[k].caption}` `` (C21). On the golden card that is `Step 3 of 4: Hash the key`. `ArrowLeft/Right` step, `Home/End` jump.
- Sound: pencil tick per step (opt-in). Haptic: `selectionChanged`, debounced to one per step-index change.

**3.5.3 Four-colour pen rating.**
1. In a review session, tap the napkin (or swipe up) to flip it (`napkin-flip`) and read the answer.
2. The pen docked at the right of the bottom band rises 8 px and its four plungers arm as the FSRS ratings — red **Again**, black **Hard**, blue **Good**, green **Easy** — each printing its **predicted interval on the barrel** in mono (`1d · 4d · 12d · 31d`). Hit areas are **48 × 56 px**.
3. Tap a plunger: it clicks (`plunger-click`), the pen writes a Rough.js check mark in that ink in the napkin's corner (180 ms), and the napkin slides off left as the next one is pulled.
4. Shortcuts: swipe right = Good, swipe left = Again; keys `1`–`4` on desktop. Before the card is revealed all four buttons are `disabled` with `aria-disabled="true"`.
- Accessible names are `Again — 1 day`, `Hard — 3 days`, `Good — 12 days`, `Easy — 31 days`: **named and positioned, never colour-only**.

**3.5.4 Print the check, tear it, share it.**
1. Ending a session (last due card, or tapping the brass bell) starts the thermal printer at the bottom edge: the receipt chatters upward line by line in JetBrains Mono (`receipt-print`).
2. Swipe sideways across the perforation — or press the `Tear` button — to tear it (`receipt-tear`). The torn receipt is rendered to PNG at 2× (inline SVG → `Image` → `canvas.toBlob`) and offered through `navigator.share` on web or `Filesystem.writeFile(Cache)` + `Share.share` on Android. **The mono font must be embedded as a data-URI `@font-face` inside the exported SVG** or the PNG will use a fallback face; `subset-fonts.py` emits `receipt-mono.b64.txt` for this.
3. Today's coffee ring stamps onto the placemat calendar (`coffee-ring-stamp`).
- Sound: chatter loop while printing, "rip" on tear, brass "ding" on the ring. Haptics: `impact Medium` on tear, `notification Success` on the stamp.

**3.5.5 Highlighter → cloze card.**
1. On a napkin, long-press any sentence for **450 ms** (custom press timer; `user-select: none` on prose so Android WebView shows no selection handles). The highlighter in the pen tray tilts while the timer runs.
2. A mustard swipe sweeps the sentence (`highlighter-swipe`, positioned from `Range.getClientRects()` into an overlay SVG), a small `✎` appears in the margin, and the sentence becomes a **cloze card** in the queue. The blank is chosen by `pickBlank()` (§6.6) and can be nudged left/right one token before saving.
3. Long-press again to remove it. On desktop the same action is available from a context-menu item **Highlight** on the sentence.
- Haptic: `impact Medium` on commit. No sound.

### 3.6 Iconography and illustration

- **Icons:** Lucide (ISC) is the baseline for the eight glyphs that are not objects: `x`, `external-link`, `paperclip`, `chevron-left`, `chevron-right`, `search`, `share`, `download`. Each path is re-rendered **once at build** through Rough.js (`roughness: 1.2`, stroke `--ink`) by `scripts/rough-icons.mjs` into `public/icons/icons.svg`, used via `<use href="…#x">`. **No runtime icon library.** No filled icons. **No icon-only navigation** — every object in the bottom band carries a printed word beneath it.
- **Objects** (dispenser, pen, highlighter, mug, bell, dial, printer edge, menu tab, paperclip, coffee rings, quilt pattern): hand-authored SVG in `public/objects/`, our own work, MIT, built only from `--chrome*` gradients and `--ink` outlines. Each ≤ 4 kB. No photographs, no stock illustration, no AI-generated raster art.
- **Diagrams:** authored in Excalidraw with Excalifont; Mermaid `look: handDrawn` and D2 `--sketch` for graph-shaped ones. Redrawn from CC-BY/MIT text sources. **Never trace ByteByteGo / roadmap.sh / VisuAlgo.**

### 3.7 Sound and haptics

Sound is **off by default**; the bell in House Rules turns it on. One 6-sprite CC0 sheet (`sfx.webm` + `sfx.mp3`, ≤ 120 kB combined), played through Howler, unlocked on the first pointer gesture, respecting `AudioContext.state` (never force playback; Android silent mode wins). **Every audible event has a visible counterpart.** `public/sounds/CREDITS.md` lists each clip's freesound/Kenney source.

| Event | Sound | Length | Haptic (APK only) |
|---|---|---|---|
| Napkin release | paper "fwip" | ≤ 120 ms | `impact Light` |
| Plunger / pencil button | UI click | 60 ms | `selectionChanged` |
| Ruler step | pencil tick | 40 ms | `selectionChanged` |
| Receipt printing | thermal chatter loop | ≤ 2 s loop | — |
| Receipt tear | paper rip | 200 ms | `impact Medium` |
| Session end / ring stamp | brass ding | 300 ms | `notification Success` |
| Menu open, search, navigation, scroll | **none** | — | none |

Web gets no haptics (`navigator.vibrate` is never called).

### 3.8 Accessibility rules

- **Contrast** per §3.1, measured on the actual ground. Diagram strokes are `--ink` (14.6:1); accent strokes inside diagrams are non-text and need only ≥ 3:1.
- **Focus:** `:focus-visible` → 2 px ring, 2 px offset, `--focus` on paper / `--focus-on-bg` on the counter. `outline: none` never appears in a computed style. Focus order follows reading order: folio bar → napkin → ruler → bullets → bottom band.
- **Touch targets:** ≥ 44 × 44 px everywhere; plungers 48 × 56; dispenser edge 56 tall; ruler strip 44 tall; menu rows 48 tall.
- **Gestures:** every drag/swipe/long-press has a tap or button twin. Horizontal swipes ignore the first **32 px** from either screen edge (Android system back).
- **Screen readers:** the counter scene is `aria-hidden="true"` decoration; the four labelled controls (`Menu`, `Review — 7 due`, `Search`, `Pen — rate this card`) live outside it. The Menu is a real `<table>` with `<caption>` and `<th scope="col">`. Diagrams carry `<title>` (card title) and `<desc>` (the TL;DR). Step captions are `aria-live="polite"`. The ruler is `role="slider"` with `aria-valuetext`. Plungers are buttons named as in §3.5.3. Coffee rings expose `aria-label="5 reviews on 3 September"`. The receipt is `role="log"`.
- **Colour independence:** ratings are named and ordered, not only coloured; difficulty is 1–3 chilli glyphs **plus** visually-hidden text `difficulty 2 of 3`; progress hairlines carry a percentage in the track head.
- **Text scaling:** no `maximum-scale` in the viewport meta; body scales with the system font size; diagrams are pinch-zoomable.

### 3.9 Android chrome

- **Status bar:** colour `--bg` (`#1E3B38` day / `#12211F` night), style `DARK` (light icons), overlaying the WebView; the folio bar carries `padding-top: env(safe-area-inset-top)`.
- **Navigation bar:** the bottom band sits above `env(safe-area-inset-bottom) + 12px`.
- **Splash:** background `#1E3B38`, the napkin icon centred, 240 ms fade, no spinner, no white flash.
- **Adaptive icon:** foreground = a cream napkin with a red ballpoint scribble and the number `37` in Caveat; background `#1E3B38`; **monochrome layer** = the napkin outline (Android 13+ themed icons); 66 % safe zone respected.
- **Keyboard:** `android:windowSoftInputMode="adjustResize"`, `100dvh` layout; the search input pins above the keyboard and the sticky note shrinks rather than scrolling away.
- **Predictive back:** `android:enableOnBackInvokedCallback="true"`; the back chain closes sticky note → menu → napkin → counter, then exits. Never a dead back press.

---

## 4. Screens

Legend: `[ ]` tappable object · `~~~` paper · `===` chrome · `- - -` perforation/hairline · `•` coffee ring.
All phone wireframes are **360 × 780** logical px, edge-to-edge, bottom band always above the gesture-nav inset. Desktop breakpoint is **≥ 1024 px**.

### 4.1 The Counter — `/` (`src/pages/index.astro`)

**Purpose:** the home surface. Answer three questions in one glance: what am I in the middle of, how much is due, and where do I go.

```
┌────────────────────────────────────┐
│ NAPKIN            ☕ 12       09:41 │  wordmark (Caveat 80), mug streak, clock (mono)
│┌─────┐                             │
││MENU │  ~~~~~~~~~~~~~~~~~~~~~~~~~  │  laminated menu edge (tap or drag right)
││ DSA │  ~ No. 037               ~  │
││ SYS │  ~ Consistent Hashing    ~  │  the napkin you last read, rotated 1.5°
││ DS  │  ~ [ballpoint diagram]   ~  │
│└─────┘  ~                      •~  │  coffee ring if finished
│         ~ Continue →             ~ │
│         ~~~~~~~~~~~~~~~~~~~~~~~~~  │
│  ┌ sticky ┐                        │
│  │ 7 due  │  Today's specials: 2   │  sticky note: --warning fill, --ink text
│  └────────┘                        │
├────────────────────────────────────┤
│ [guest  ]   ============  [ pen ]  │  bottom band, 88 px + safe area
│ [ check ]   = 7 due    =  [  |  ]  │  chrome dispenser centred in the band
│  SEARCH        REVIEW      (tray)  │  printed words under every object
└────────────────────────────────────┘
```

**Desktop:** the counter widens; the Menu is permanently open as a tri-fold on the left (320 px), the napkin sits centre (max 640 px), and the mug, placemat calendar and receipt printer occupy a right column (280 px). The bottom band becomes a left-column rail.

**Component tree:** `Base` → `Counter` → { `FolioBar`(Wordmark, Mug, Clock), `MenuEdge`, `Napkin`(resume variant), `StickyNote`(due), `BottomBand`{ `GuestCheckPad`, `Dispenser`, `Pen`(docked) } }.

**States**
- *empty / first run* — the dispenser plate reads `Pull one`; the resume napkin is replaced by a napkin bearing a hand-drawn arrow pointing at the slot.
- *loading* — napkins are static HTML, so there is no spinner. The FSRS due count arrives from Dexie within a frame; until then the plate shows `—` and the button is still focusable.
- *error* — does not exist (no network, no fetch).
- *update available* — a small `NEW NAPKINS — REFRESH` order ticket clips to the rail. Dismissible, `role="status"`, never modal.

**Gestures:** tap or drag-up the dispenser (§3.5.1); tap or drag-right the menu edge; tap the resume napkin → Napkin screen; Android back exits.

**Transitions out:** Menu → `menu-slide`. Napkin → `napkin-swap` View Transition. Review → the dispenser pushes a napkin up, `napkin-pull`.

### 4.2 The Menu — `/menu/`

**Purpose:** browse everything. It is a **ruled table**, never a grid of tiles.

```
┌────────────────────────────────────┐
│ ‹ Counter          MENU        🔍  │
│ ══════════════════════════════════ │  2 px --border-strong ink rule
│ TODAY'S SPECIALS       [SPECIAL]   │  mustard sticker, rotated −8°
│ 037 Consistent Hashing   3 min ▸   │
│ 112 Raft leader election 4 min ▸   │
│ - - - - - - - - - - - - - - - - -  │
│ STARTERS · DSA        14/40 ▮▮▮░░  │  track head + progress hairline + %
│ 001 Big-O basics      2 min 🌶     │
│ 002 Arrays & pointers 3 min 🌶     │
│ 003 Binary search     3 min 🌶🌶   │
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ read   │  per-row progress hairline fill
│ MAINS · SYSTEM DESIGN  9/40 ▮▮░░░  │
│ 030 Load balancing     3 min 🌶    │
│ 037 Consistent hashing 3 min 🌶🌶 •│  coffee ring = finished
│ DESSERTS · DATA SCIENCE 3/40 ░░░░░ │
├────────────────────────────────────┤
│ Filter: All · Caching · Trees · DP │  underlined words, NOT pills
└────────────────────────────────────┘
```

**Desktop:** the same table lives in the permanent left tri-fold; a right marginal column draws the **prerequisites graph** as dotted pen lines between item numbers (Rough.js, rendered to static SVG at build from the `prereqs` frontmatter).

The track fractions are `read/total` where `total` is the real collection size — `40` per track at v1 (§7.4), `120` in the folio bar. `menu.spec.ts` asserts the denominators equal the collection sizes, so never draw a wireframe number that the syllabus cannot reach.

**Component tree:** `MenuPage`(`<table>`) → `TrackHead`+`ProgressHairline` → `MenuRow`(number · title · minutes · `ChilliDifficulty` · `CoffeeRing`) ; `SpecialSticker`, `FilterWords`, `PrereqLines`(desktop).

**States:** *empty filter* — a pencil note "Nothing on the menu for that — try another tag". *track complete* — the head gets a green `86'd` sticker (diner slang for sold out) and a full hairline.

**Gestures:** tap a row → the napkin slides out of the dispenser (View Transition). Drag left or Android back closes the menu. Long-press a row (or its `⋯` button on desktop) → ticket `Added 2 cards to today`.

**URL contract:** the filter is a query param, `?tag=caching`, so it is linkable and testable.

### 4.3 The Napkin — `/[track]/[slug]/`

**Purpose:** the product. One topic, three minutes, one drawing that draws itself.

```
┌────────────────────────────────────┐
│ ‹ Menu     SYSTEM DESIGN   037/120 │  folio bar, mono numerals
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│ ~ Consistent Hashing      No.037  ~│  Caveat 700 title, number top-right
│ ~ ════════════════════════════════~│  2 px ink rule
│ ~ Hash servers and keys onto a    ~│  TL;DR — Nunito 600, 20 px
│ ~ ring; a key belongs to the next ~│
│ ~ server clockwise.               ~│
│ ~ ┌───────────────────────────┐   ~│
│ ~ │  [ballpoint ring diagram  │   ~│  inline SMIL SVG, 4:3
│ ~ │   drawing itself]         │   ~│
│ ~ └───────────────────────────┘   ~│
│ ~ 0····1····2····3           🖊   ~│  ruler scrubber, pen tip at step 2
│ ~ Step 3 of 4 · Hash the key      ~│  aria-live caption
│ ~ ○ Only ~K/N keys move on join.  ~│  Rough.js bullet circles
│ ~ ○ Virtual nodes fix uneven load.~│
│ ~ ○ Used by DynamoDB, Cassandra.  ~│
│ ~ ┌ Big-O ─────────────────────┐  ~│
│ ~ │ lookup   O(log n)  (bsearch)│  ~│  JetBrains Mono table
│ ~ └────────────────────────────┘  ~│
│ ~ Related: 036 Hashing · 041 Shard~│  paper-clipped scraps over the edge
│ ~ from System Design Primer, CC BY~│  attribution, 12 px --ink-muted
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
├────────────────────────────────────┤
│ [search]  ===dispenser===  [pen][🖍]│  the highlighter joins the tray here
└────────────────────────────────────┘
```

**Desktop:** the napkin is 640 px centred. Tapping **"see how this was drawn"** flips the napkin (phone) or opens a second napkin to the right (desktop) showing the committed `.d2`/`.mmd`/Excalidraw-summary source in mono on `--surface-2`.

**Component tree:** `FolioBar` → `Napkin` → { `NapkinTitle`, `Tldr`, `Diagram`(inline SVG) + `RulerScrubber`(island) + `StepCaption`, `BulletList`, `BigOTable`, `Griddle`(island, only when `griddle:` is set, anchored `#griddle`), `RelatedScraps`, `Attribution`, `SourceToggle` } ; `Highlighter`(island).

**States:** *loading* — none; the animated SVG is inline. *reduced motion* — the static SVG renders and the ruler steps group opacity. *offline-uncached deep link (web only)* — a lone napkin reading "This one isn't in the dispenser yet — connect once to stock it" in `--danger` ink with a `Back to menu` pencil button. *highlighted* — yellow swipes are restored from Dexie on load.

**Gestures:** swipe left/right → previous/next napkin in the track (`napkin-swap`; **must start ≥ 32 px from the screen edge**); swipe up → flip to this napkin's flashcards; long-press a sentence → highlighter; pinch → zoom the SVG wrapper (a `Reset zoom` control appears); Android back → the Menu, not the Counter.

### 4.4 The Griddle — an island on the napkin, `#griddle`

**Purpose:** for topics where watching the algorithm beats reading it.

```
│ ~ ┌───────────────────────────┐   ~│
│ ~ │ ▯ ▯ ▮ ▮ ▯ ▯ ▯ ▯  (Rough.js│   ~│  bars as stacked plates; the compared
│ ~ │ 5 3 8 1 9 2 7 4   bars)   │   ~│  pair is washed in --highlighter
│ ~ └───────────────────────────┘   ~│
│ ~ 0····5····10····15····20  🖊    ~│  the same ruler; steps = frames
│ ~ compare(2,3) → swap             ~│  caption in mono, like a ticket
│ ~  [◀ Step] [▶ Run] [Step ▶] ◎1×  ~│  pencil-drawn buttons, chrome dial
│ ~ N = 8  [–] [+]   Shuffle        ~│
```

**Components:** `VizNapkin`(`client:visible`), `RoughCanvas`(inline SVG), `RulerScrubber` (reused), `StepCaption`, `PencilButton`, `GriddleDial`(½× · 1× · 2×), `ParamStepper`(N, R, W, capacity…).

**States:** *idle* (frame 0; `Run` pulses once with `plunger-click`), *running*, *paused*, *done* (a green Rough check mark in the corner + `notification Success`), *reduced motion* (frames swap with no tween). **Only one island animates per viewport** — an `IntersectionObserver` pauses offscreen visualisers and sets `data-state="paused"`.

**Gestures:** drag the ruler/pen; tap ticks; pinch-zoom; drag "servers" onto the ring in the consistent-hashing griddle. Keyboard: `space` run/pause, `←/→` step, `1/2/3` speed.

### 4.5 Order Up — `/review/`

**Purpose:** the one-thumb retrieval loop.

```
┌────────────────────────────────────┐
│ ‹ Counter  ORDER UP  ▮▮▮▮░░░░ 4/12 │  ticket rail progress, mono
│ ┌tkt┐┌tkt┐┌tkt┐┌tkt┐┌tkt┐          │  clipped order tickets (done = flipped)
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│ ~ No.037 · System Design          ~│
│ ~                                 ~│
│ ~  Why does consistent hashing    ~│  question: Caveat 700, 40 px desktop /
│ ~  minimise re-mapping when a     ~│  32 px phone, text-wrap: balance
│ ~  node joins?                    ~│
│ ~        (tap to flip)            ~│
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│         🔔 end early               │
├────────────────────────────────────┤
│  ===dispenser===  ┌ PEN ─────────┐ │
│  = 8 left     =   │ ●red  Again 1d│ │  plungers, 48×56, mono intervals
│                   │ ●blk  Hard  3d│ │
│                   │ ●blue Good 12d│ │
│                   │ ●grn  Easy 31d│ │
└───────────────────┴───────────────┘ │
```

**Desktop:** the card is centred at 560 px; the pen lies horizontally beneath it with the four plungers left→right; keys `1`–`4`.

**Components:** `TicketRail`, `ReviewNapkin`(front/back), `ClozeBlank` (a highlighter swipe that wipes away on flip), `Pen`(rating mode), `Bell`, `Dispenser`(remaining count), `Receipt`.

**States:** *empty* — "Nothing due. The counter's clean." with a peek at the coffee-ring calendar and a `Pull 5 new` pencil button. *revealed* — back face, plungers armed. *session end* — the receipt (§3.5.4). *write failure* — the plunger returns to rest, a ticket reads `Couldn't write that — try again`, and **the card is never lost**: the rating sits in the Zustand `pendingWrite` slot and retries on the next tap.

**Gestures:** tap or swipe-up to flip; swipe right = Good, left = Again; tap plungers; Android back → confirm ticket `Leave the counter? Progress is saved` with `Stay` / `Leave`.

### 4.6 The Guest Check (search) — a sheet, opened from any screen

```
┌────────────────────────────────────┐
│ (counter dimmed 20 %)              │
│  ┌──────────────────────────────┐  │
│  │ GUEST CHECK        [ × ]     │  │  --warning sticky note, --ink text
│  │ ─────────────────────────────│  │
│  │  quorum reads_               │  │  query echoed in Caveat 24 px
│  │ ─────────────────────────────│  │
│  │ 044 Quorum (N, R, W)   SYS   │  │  Pagefind results in menu-row format
│  │ 045 Read repair        SYS   │  │
│  │ 112 Raft leader elect  SYS   │  │
│  │ tags: consistency · replicas │  │  pen-drawn chips
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│ [ type here…                  ] ⌫  │  input pinned above the keyboard
└────────────────────────────────────┘
```

**Desktop:** `Ctrl/⌘ K` opens the same note, centred at 560 px.

**States:** *empty query* — the hint `Try: LRU, CAP, backprop` plus up to five recent napkins from Dexie. *no results* — "Not on the menu. Ask the cook (add a suggestion)". *dev build* — "Search needs a build (npm run build)". *loading* — Pagefind shards resolve in < 100 ms from cache; a pencil dot blinks once only if it exceeds 300 ms. Queries are debounced at **120 ms**.

**Gestures:** drag down or back closes it and returns focus to the Search object in the bottom band; tap a row → that napkin.

### 4.7 The Placemat — `/placemat/`

```
┌────────────────────────────────────┐
│ ‹ Counter       PLACEMAT     share │
│ ┌──────────────────────────────┐   │
│ │ SEPTEMBER                    │   │
│ │ M T W T F S S                │   │
│ │ • • ◦ • ◉ ◉ •  (coffee rings │   │  1 / 5 / 20+ reviews → 35/48/60 %
│ │ ◦ • • ◉ • ◦ ◦   on the mat)  │   │
│ └──────────────────────────────┘   │
│  ☕ streak 12   best 31  1,204 rev │  mono numerals
│ ┌ Starters ┐ ┌ Mains ┐ ┌ Desserts┐ │
│ │  ◔ 33%   │ │ ◑ 15% │ │ ◔  8%   │ │  Rough.js progress arcs
│ └──────────┘ └───────┘ └─────────┘ │
│ Last check:                        │
│ ┌ - - - - - - - - - - - - - - - ┐  │
│ │ NAPKIN · ORDER #0412          │  │  last receipt, tearable/shareable
│ │ BINARY SEARCH ....... GOOD  4d│  │  (cropped)
│ └ - - - - - - - - - - - - - - - ┘  │
└────────────────────────────────────┘
```

The receipt inside this wireframe is **cropped to fit the 36-column ASCII frame**. The real sheet is 32 columns wide and is defined once, in §6.10 — never copy the crop into code or a test.

**Components:** `PlacematCalendar`, `CoffeeRing`(3 variants), `MugStat`, `ProgressArc`(per track), `Receipt`(last), `ShareButton`, `ExportImport`(a paperclip: Dexie JSON out/in).

**States:** *empty* — a clean mat with one pencil note "Your first ring goes here". *share rendering* — the mat lifts to `--shadow-3` for 240 ms. *import error* — a `--danger` ticket carrying the first zod issue. *backup nag* — `Last backup: 21 days ago` in `--danger` after 14 days.

**Gestures:** drag the mug across the mat to read per-day counts (tooltip ticket); tap a ring → that day's receipt.

**Desktop:** the placemat, arcs and receipt live in the Counter's right column instead of a separate screen (the route still exists and still works).

### 4.8 House Rules — `/house-rules/`

```
┌────────────────────────────────────┐
│ ‹ Counter      HOUSE RULES         │
│ ┌ stapled card ────────────────┐   │
│ │ Sound             [bell: off] │   │  rows are ruled lines; controls are
│ │ Haptics           [on]        │   │  chrome light-switch toggles
│ │ Edition   Day · After hours · Auto│
│ │ Counter light  Follow clock · Pin │
│ │ Reduce motion     [system]    │   │
│ │ New cards / day   [ 10 ] – +  │   │  mono stepper, clamps 0–50
│ │ High-legibility body  [off]   │   │  (Atkinson Hyperlegible — v2, not v1)
│ │ Export / Import   📎          │   │
│ │ Reset progress    (red ink)   │   │  3 s hold-to-confirm plunger
│ └───────────────────────────────┘   │
│ ┌ CREDITS ──────────────────────┐   │  GENERATED from credits.json —
│ │ OpenDSA (MIT) · System Design │   │  never hand-edited
│ │ Primer (CC BY 4.0) · Amidi    │   │
│ │ CS229 (MIT) · Excalifont,     │   │
│ │ Caveat, Nunito, JetBrains Mono│   │
│ │ (OFL) · sounds CC0            │   │
│ └───────────────────────────────┘   │
│ v1.4.2 · offline ready ✓           │
└────────────────────────────────────┘
```

Toggles are `role="switch"` with `aria-checked`, ≥ 48 px rows, `Space` toggles. `Reset progress` requires a genuine 3-second hold (release at 2.9 s does nothing) and then shows the ticket `Counter wiped`.

### 4.9 Utility screens

- **`/offline/`** — the `navigateFallback`. A lone napkin: "This one isn't in the dispenser yet — connect once to stock it", `--danger` ink, `Back to menu` pencil button.
- **`/404/`** (`404.astro` → `dist/404.html`, served natively by GitHub Pages) — "Not on the menu" napkin with a link to the Menu. **Do not** copy `index.html` over `404.html`.
- **Update ticket** — an order ticket clipped to the rail, `NEW NAPKINS — REFRESH`, `role="status"`, dismissible, never modal.
- **`/__gallery/`** — built only when `PUBLIC_GALLERY=1`; renders every object and component state in isolation for the visual tests.

---

## 5. Data model

### 5.1 Content collections (build time, zod-validated) — `src/content/config.ts`

```ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

export const ALLOWED_LICENCES = [
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'CC0',
  'CC BY 4.0', 'CC BY 2.5', 'Public domain', 'Own work',
] as const;                                   // C12: no NC, no ND, no SA. Ever.

const Source = z.object({
  name: z.string(),                            // "System Design Primer"
  url: z.string().url(),
  licence: z.enum(ALLOWED_LICENCES),
  note: z.string().optional(),                 // "§ Consistent hashing, redrawn"
});

const Flashcard = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('qa'), q: z.string().min(8), a: z.string().min(1) }),
  z.object({ kind: z.literal('cloze'), text: z.string().regex(/\{\{[^}]+\}\}/) }),
]);

const BigORow = z.object({
  op: z.string(), best: z.string().optional(), avg: z.string(),
  worst: z.string().optional(), note: z.string().optional(),
});

export const collections = {
  cards: defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/cards' }),   // C13
    schema: z.object({
      title: z.string().max(40),
      track: z.enum(['dsa', 'sysdesign', 'ds']),
      tags: z.array(z.string()).min(1).max(6),
      difficulty: z.number().int().min(1).max(3),        // chillies
      minutes: z.number().int().min(1).max(5),
      tldr: z.string().max(180),
      diagram: z.string().optional(),                    // basename in src/diagrams (no extension)
      steps: z.array(z.string()).optional(),             // caption overrides, one per step
      bigO: z.array(BigORow).optional(),
      related: z.array(z.string()).max(4).default([]),   // "track/slug"
      prereqs: z.array(z.string()).default([]),          // "track/slug"
      flashcards: z.array(Flashcard).min(2),
      sources: z.array(Source).default([]),
      original: z.boolean().default(false),              // true ⇒ sources may be empty
      special: z.boolean().default(false),               // "Today's specials" sticker
      griddle: z.string().optional(),                    // visualiser id in src/engine/viz
    }).refine(c => c.original || c.sources.length > 0,
              { message: 'sources required unless original: true' }),
  }),

  tracks: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './src/content/tracks' }),
    schema: z.object({
      name: z.string(),          // "Starters"
      subtitle: z.string(),      // "DSA"
      order: z.array(z.string()),// card ids ("dsa/binary-search") in syllabus order
    }),
  }),
};
```

The collection **id** for `src/content/cards/sysdesign/consistent-hashing.mdx` is `sysdesign/consistent-hashing`. That id is the slug, the route (`/sysdesign/consistent-hashing/`) and half of every deck id. **Renaming a file orphans review history** — if you must rename, add an `aliases:` entry and migrate ids deliberately.

Build-time invariants, each of which **fails the build with the offending id**: every card has an entry in `numbers.json`; numbers are unique; every `related`/`prereqs` id resolves; every `diagram` has a matching `public/diagrams/<name>.svg`; every `griddle` matches an exported tracer id.

### 5.2 Generated artefacts

```ts
// public/diagrams/<name>.steps.json
export interface DiagramManifest {
  name: string;
  hash: string;                    // sha1 of the source file + options — the cache key
  renderer: 'jsdom' | 'playwright' | 'd2' | 'mermaid';
  width: number; height: number;   // from the viewBox
  elements: number;                // element <g> count
  animated: boolean;
  finishedMs: number;              // total SMIL duration
  steps: StepInfo[];               // ≥ 1; step 0 is "Setup" when no callout precedes the first element
}
export interface StepInfo {
  index: number; caption: string;
  beginMs: number; endMs: number;
  firstElement: number; lastElement: number;
}

// public/decks/<track>.json and all.json
export interface DeckItem {
  id: string;                      // 40-hex sha1(id + '|' + question), RAW text (C9)
  slug: string;                    // "sysdesign/consistent-hashing"
  track: 'dsa' | 'sysdesign' | 'ds';
  number: number;                  // napkin number
  title: string;                   // for the receipt line
  kind: 'qa' | 'cloze';
  front: string; back: string;     // cloze: front = masked text, back = filled text
  source?: { name: string; licence: string };
}
export interface Deck {
  track: string; generatedAt: string; cardCount: number;
  contentHash: string;             // sha1 of the sorted id list — drives re-seeding
  items: DeckItem[];
}
```

### 5.3 Runtime persistence — `src/db/dexie.ts`

```ts
import Dexie, { type Table } from 'dexie';
import type { Card as FsrsCard, ReviewLog as FsrsLog } from 'ts-fsrs';

export interface ReviewCard extends FsrsCard {
  // FsrsCard supplies: due, stability, difficulty, elapsed_days, scheduled_days,
  // learning_steps, reps, lapses, state, last_review
  id: string;                    // DeckItem.id, or 'hl-' + sha1(slug + '|' + sentence) for user clozes
  slug: string; track: string;
  origin: 'deck' | 'highlight';
  orphan: 0 | 1;                 // 1 when the deck no longer contains this id (kept, hidden)
  introducedOn?: string;         // dayKey when first shown as new
}
export interface ReviewLogRow extends FsrsLog {
  id?: number; cardId: string; sessionId: string; dayKey: string;
}
export interface Highlight { id: string; slug: string; sentence: string; blank: string; createdAt: number; }
export interface Session {
  id: string; startedAt: number; endedAt?: number; dayKey: string;
  lines: { cardId: string; title: string; rating: 1 | 2 | 3 | 4; intervalLabel: string }[];
  receiptNo: number;             // monotonic, "ORDER #0412"
}
export interface DayStat { dayKey: string; reviews: number; newCards: number; napkinsRead: number; }
export interface ReadMark { slug: string; readAt: number; finished: 0 | 1; }
export interface Setting { key: string; value: unknown; }

export class NapkinDB extends Dexie {
  cards!: Table<ReviewCard, string>;
  logs!: Table<ReviewLogRow, number>;
  highlights!: Table<Highlight, string>;
  sessions!: Table<Session, string>;
  days!: Table<DayStat, string>;
  reads!: Table<ReadMark, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('napkin');
    this.version(1).stores({
      cards: 'id, due, state, slug, track, orphan, introducedOn',
      logs: '++id, cardId, sessionId, dayKey, review',
      highlights: 'id, slug',
      sessions: 'id, dayKey, startedAt',
      days: 'dayKey',
      reads: 'slug, readAt',
      settings: 'key',
    });
  }
}
export const db = new NapkinDB();
```

**Settings keys** (all in `settings`, and **mirrored to `localStorage` under `napkin:house-rules`** so the pre-paint script can set `data-*` before first paint): `edition` (`day`|`night`|`auto`), `hourPin` (`clock`|`morning`|`afternoon`|`late`), `sound` (bool), `haptics` (bool), `reduceMotion` (`system`|`on`|`off`), `newPerDay` (0–50, default 10), `legibleBody` (bool), `fsrsParams` (number[] | null), `lastBackupAt` (number | null).

**Migrations.** `db.version(n)` only ever increases; each new version ships an `upgrade()` function **and a unit test that migrates a fixture database from n−1 to n**. Never mutate an existing `version()` block.

### 5.4 Export / import format

```jsonc
{
  "schema": 1,                       // bump only with a Dexie migration
  "app": "napkin",
  "appVersion": "v1.4.2",
  "exportedAt": "2026-09-06T09:41:00.000Z",
  "cards": [ /* ReviewCard[] */ ],
  "logs": [ /* ReviewLogRow[] without the auto id */ ],
  "highlights": [ /* Highlight[] */ ],
  "sessions": [ /* Session[] */ ],
  "days": [ /* DayStat[] */ ],
  "reads": [ /* ReadMark[] */ ],
  "settings": { "edition": "night", "newPerDay": 10 }
}
```

Rules: rows are written **in insertion order** so two identical databases produce byte-identical files. Import validates with zod and refuses a higher `schema` with the ticket `This backup is from a newer Napkin`. Import into a populated database **merges by id, newer `last_review` wins**; logs are appended and de-duplicated on `(cardId, review)`. Filename `napkin-backup-YYYY-MM-DD.json`. On Android the export goes through the share sheet (`Filesystem.writeFile(Cache)` → `Share.share`); on web it is a download.

---

## 6. Engine and algorithms

Everything in this section lives in `src/engine/**`: **pure TypeScript, no DOM, no React, no Astro, 100 % line coverage**. All the numbers given below are *golden values that have been computed and verified* — assert them.

### 6.1 The diagram pipeline — `scripts/build-diagrams.mjs`

**Inputs:** `src/diagrams/<name>.excalidraw | .mmd | .d2`
**Outputs (committed):** `public/diagrams/<name>.svg`, `<name>.anim.svg` (Excalidraw only), `<name>.steps.json`
**Cache:** `.cache/diagrams/<hash>/` keyed on `sha1(source + options + 'v1')` so an unchanged diagram costs 0 ms.

**Authoring rules the script enforces (build fails with the element id):**
1. Only Excalidraw's five default strokes — `#1e1e1e` black, `#e03131` red, `#1971c2` blue, `#2f9e44` green, `#f08c00` orange — and the four default fills `#ffc9c9`, `#a5d8ff`, `#b2f2bb`, `#ffec99`, plus `transparent` and `#ffffff`. Any other colour is a build error.
2. Every text element uses **Excalifont** (`fontFamily: 5` in 0.18.x).
3. **Draw in narrative order.** A *step* begins with a text element matching `/^(\d+)\.\s+(.+)/` — e.g. `1. Hash servers onto the ring`. Write the callout **first**, then draw what it describes. Elements before `1.` form step 0, captioned `Setup`. Frontmatter `steps:` overrides captions but never step boundaries.
4. **No raster images.** An `.excalidraw` with a non-empty `files` map fails with `Raster images are not allowed in napkins`.

```js
// scripts/build-diagrams.mjs — Node 22, ESM
import { readdir, readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { optimize } from 'svgo';

const SRC = 'src/diagrams', OUT = 'public/diagrams', CACHE = '.cache/diagrams';

const STROKES = {
  '#1e1e1e': 'var(--pen-black)', '#e03131': 'var(--pen-red)',
  '#1971c2': 'var(--pen-blue)',  '#2f9e44': 'var(--pen-green)', '#f08c00': 'var(--warning)',
};
const FILLS = {
  '#ffc9c9': 'color-mix(in srgb, var(--pen-red) 18%, var(--surface))',
  '#a5d8ff': 'color-mix(in srgb, var(--pen-blue) 18%, var(--surface))',
  '#b2f2bb': 'color-mix(in srgb, var(--pen-green) 18%, var(--surface))',
  '#ffec99': 'var(--highlighter)', '#ffffff': 'var(--surface)',
};
const PALETTE = { ...STROKES, ...FILLS };
const sha1 = (s) => createHash('sha1').update(s).digest('hex');

/** jsdom + the FontFace stub that works around excalidraw#10604
 *  (under jsdom `FontFace.unicodeRange` is undefined and the font-face→CSS transform throws per font). */
function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const w = dom.window;
  for (const k of ['window','document','navigator','HTMLElement','SVGElement','DOMParser',
                   'XMLSerializer','Image','Path2D','getComputedStyle']) globalThis[k] = w[k];
  globalThis.FontFace = class {
    constructor(family, src, d = {}) {
      Object.assign(this, { family, src, unicodeRange: d.unicodeRange ?? 'U+0-10FFFF', status: 'loaded' });
    }
    load() { return Promise.resolve(this); }
  };
  w.document.fonts = { add() {}, delete() {}, check: () => true,
                       load: async () => [], ready: Promise.resolve(),
                       [Symbol.iterator]: function* () {} };
  return dom;
}

function rewritePalette(svgText) {
  return svgText
    .replace(/#(?:[0-9a-f]{6})\b/gi, (hex) => PALETTE[hex.toLowerCase()] ?? hex)
    .replace(/font-family="[^"]*"/g, 'font-family="var(--font-diagram)"')
    .replace(/<style>[\s\S]*?<\/style>/, '')      // the page CSS supplies Excalifont
    .replace(/\s(width|height)="[\d.]+"/g, '');   // responsive: keep only the viewBox
}

/** One <g> per element in export order; beginTimes[i] is element i's SMIL begin, in ms. */
function deriveSteps(elements, beginTimes, finishedMs, captionsOverride) {
  const steps = [];
  let current = { index: 0, caption: 'Setup', beginMs: 0, firstElement: 0 };
  elements.forEach((el, i) => {
    const m = el.type === 'text' && /^(\d+)\.\s+(.+)/s.exec(el.text ?? '');
    if (!m) return;
    if (i > 0 || steps.length) {
      current.lastElement = i - 1;
      current.endMs = beginTimes[i];
      if (current.lastElement >= current.firstElement) steps.push(current);
    }
    current = { index: steps.length, caption: m[2].trim(), beginMs: beginTimes[i], firstElement: i };
  });
  current.lastElement = elements.length - 1;
  current.endMs = finishedMs;
  steps.push(current);
  if (captionsOverride) steps.forEach((s, k) => { if (captionsOverride[k]) s.caption = captionsOverride[k]; });
  return steps;
}

const svgoConfig = {
  multipass: true,
  plugins: [{ name: 'preset-default', params: { overrides: {
    removeUnknownsAndDefaults: false,   // keeps <animate> attributes
    cleanupIds: false,                  // begin="id.end" references must survive
    removeViewBox: false, convertShapeToPath: false, inlineStyles: false,
  } } }],
};
```

The rest of `buildOne()`: read the source; short-circuit on the cache; for `.excalidraw` call `exportToSvg({ elements, appState: { exportBackground: false, exportWithDarkMode: false, exportEmbedScene: false }, files, exportPadding: 16, skipInliningFonts: true })`, then `animateSvg(svg, elements, { startMs: 0 })` and `getBeginTimeList(svg)` from `excalidraw-animate`, tag each top-level `<g>` with `data-el="i"` and `data-step="k"`, run `rewritePalette` **after** animating, run svgo over both variants, write all three outputs to `public/diagrams/` and to the cache directory. For `.d2`: `const d2 = new D2(); const r = await d2.compile(src, { layout: 'elk', sketch: true }); rewritePalette(await d2.render(r.diagram, r.renderOptions)); await d2.dispose();`. For `.mmd`: nothing — `rehype-mermaid` renders it inline inside the MDX.

**Playwright fallback.** `NAPKIN_DIAGRAM_EXPORTER=playwright` swaps the exporter: esbuild (bundled with Vite) compiles `scripts/harness.ts` (`import { exportToSvg } from '@excalidraw/excalidraw'; window.__export = (e,a,f) => exportToSvg({...}).then(s => s.outerHTML)`) into `.cache/harness.js`; the script launches `chromium.launch()`, `page.setContent('<!doctype html><html><body></body></html>')`, `page.addScriptTag({ path: '.cache/harness.js', type: 'module' })`, then `page.evaluate(([e,a,f]) => window.__export(e,a,f), [...])`. **Automatic retry:** if a diagram has text elements (`elements.some(e => e.type === 'text')`) but the output SVG has no `<text>`, the script re-runs that diagram through Playwright automatically and logs the switch. A build test asserts both exporters agree on element count and colours.

**Worked example — `consistent-hashing.excalidraw`, 14 elements.** Ring (ellipse), 3 server rectangles + 3 labels, text `1. Hash each server onto the ring`, 3 ticks, text `2. Hash the key`, key dot + arrow, text `3. Walk clockwise to the next server`, arc arrow. `animateSvg` gives 500 ms per element → `beginTimes = [0, 500, 1000, …, 6500]`, `finishedMs = 7000`. `deriveSteps` yields:

| step | caption | elements | ms |
|---|---|---|---|
| 0 | Setup | 0–3 | 0 – 2000 |
| 1 | Hash each server onto the ring | 4–7 | 2000 – 4000 |
| 2 | Hash the key | 8–10 | 4000 – 5500 |
| 3 | Walk clockwise to the next server | 11–13 | 5500 – 7000 |

The napkin's ruler therefore shows ticks `0 · 1 · 2 · 3`.

**Golden fixture `tests/fixtures/diagrams/three-shapes.excalidraw`** — a rectangle (`id: r1`, stroke `#1e1e1e`, fill `#ffec99`), an arrow (`id: a1`, stroke `#1971c2`), a text element (`id: t1`, `fontFamily: 5`, text `cache`), in that order. Assert: `three-shapes.svg` exists with a `viewBox` and no `width`/`height`; exactly 3 top-level `<g>`; no `@font-face` block; `font-family` resolves through `var(--font-diagram)`; **no literal `#1e1e1e` survives** (it became `var(--pen-black)`), `#1971c2` → `var(--pen-blue)`, `#ffec99` → `var(--highlighter)`; `three-shapes.anim.svg` has ≥ 3 `<animate>` elements each with `fill="freeze"`; `three-shapes.steps.json` has `beginTimes` `[0, 500, 1000]` and `finishedMs ≥ 1500`; svgo kept `<animate>` and the ids `r1`/`a1`/`t1`; `three-shapes.svg` < 6 kB; a second run is a cache no-op.

**Embedding — `src/components/napkin/Diagram.astro`** (C4: read from disk and inline; do **not** use `<img>`):

```astro
---
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const { name, title, tldr, animate = true } = Astro.props;
const dir = join(process.cwd(), 'public', 'diagrams');
const manifest = JSON.parse(readFileSync(join(dir, `${name}.steps.json`), 'utf8'));
const staticSvg = readFileSync(join(dir, `${name}.svg`), 'utf8');
const animSvg = manifest.animated ? readFileSync(join(dir, `${name}.anim.svg`), 'utf8') : null;
const inject = (svg) => svg.replace('>', `><title>${title}</title><desc>${tldr}</desc>`);
---
<figure class="diagram" data-diagram={name} style={`aspect-ratio:${manifest.width}/${manifest.height}`}>
  <div class="diagram__anim" set:html={inject(animate && animSvg ? animSvg : staticSvg)} />
  <div class="diagram__static" hidden set:html={inject(staticSvg)} />
  {manifest.animated && <napkin-scrubber client:visible manifest={JSON.stringify(manifest)} />}
</figure>
```

CSS shows `.diagram__static` and hides `.diagram__anim` under `prefers-reduced-motion: reduce` and under `[data-reduce-motion="on"]`. A script in `Counter.astro` runs an `IntersectionObserver` that calls `svg.pauseAnimations()` when a figure leaves the viewport and `unpauseAnimations()` when it re-enters — **only the diagram in view ever plays.**

### 6.2 Deck ids — `src/engine/decks/ids.ts`

```ts
import { createHash } from 'node:crypto';   // in the browser: a 40-line pure-TS sha1, no deps

/** The separator is part of the contract. Changing it orphans every learner's review history. */
export const deckId = (slug: string, question: string): string =>
  sha1(`${slug}|${question}`);              // RAW question text — no lower-casing, no trimming (C9)
```

**Locked goldens (verified):**

| Input | Expected id |
|---|---|
| `sysdesign/consistent-hashing\|Why does consistent hashing minimise re-mapping when a node joins?` | `f40204a70330cb3e7c3eb3b8c6bca3cefd2f8b13` |
| `dsa/binary-search\|What is the worst-case time complexity of binary search?` | `244084cb5175b111732acee58320bea08bd7a2d8` |

For a **cloze** card the "question" half is the **raw cloze text including the `{{…}}` braces**, so editing the *answer* text changes the id (intended: a different answer is a different card) but re-wording the mask does not silently keep history. For a **highlight** cloze the id is `'hl-' + sha1(slug + '|' + sentence)`.

### 6.3 Cloze parsing — `src/engine/cloze/parse.ts`

```ts
export type ClozeSegment =
  | { t: 'text'; v: string }
  | { t: 'blank'; v: string; i: number };

export class ClozeSyntaxError extends Error { constructor(public column: number) { super(`Unbalanced {{ at column ${column}`); } }

export function parseCloze(text: string): ClozeSegment[] { /* scan for {{ … }} */ }
export const maskFront = (segs: ClozeSegment[]) =>
  segs.map(s => (s.t === 'text' ? s.v : '____')).join('');    // exactly four underscores (C10)
export const revealUpTo = (segs: ClozeSegment[], i: number) => /* blanks with index > i stay masked */;
```

**Golden.** Input `Virtual nodes fix {{uneven load}} by giving each server {{many ring positions}}.` →

```
[{t:'text',v:'Virtual nodes fix '},
 {t:'blank',v:'uneven load',i:0},
 {t:'text',v:' by giving each server '},
 {t:'blank',v:'many ring positions',i:1},
 {t:'text',v:'.'}]
```

`blanks = 2`; `maskFront` = `Virtual nodes fix ____ by giving each server ____.`; `{{a}} {{b}} {{c}}` gives `blanks = 3` and `revealUpTo(1)` masks only `c`; `unbalanced {{x` throws `ClozeSyntaxError` with `column === 11`.

### 6.4 Deck build — `scripts/build-decks.mjs`

For every card: turn each `flashcards[]` entry into a `DeckItem` (`id` per §6.2, `front`/`back` per kind, `number` from `numbers.json`, `title` from frontmatter, `source` = the first entry of `sources`). Write `public/decks/{dsa,sysdesign,ds}.json` and `all.json`, each with `generatedAt`, `cardCount` and `contentHash = sha1(sorted ids joined by '\n')`. Fail the build on a duplicate slug or a duplicate id.

`scripts/import-anki.py` (Python stdlib `zipfile` + `sqlite3`) converts the System Design Primer `.apkg` decks into `src/content/decks-extra/sdp.json` with `source: { name: 'System Design Primer', licence: 'CC BY 4.0' }`; HTML fields are tag-stripped; items merge by the same id rule so re-import is idempotent. This is a one-off tool, **not** part of `npm run build`.

### 6.5 FSRS scheduling — `src/engine/fsrs/scheduler.ts` and `queue.ts`

```ts
import { fsrs, generatorParameters, createEmptyCard, Rating, State, type Grade } from 'ts-fsrs';

/** dayKey is the LOCAL calendar date in the given IANA zone. No rollover hour (C11). */
export function dayKey(d: Date = new Date(), tz = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  return p.format(d);                                     // 'en-CA' formats as YYYY-MM-DD
}

export const scheduler = (params?: Partial<ReturnType<typeof generatorParameters>>) =>
  fsrs(generatorParameters({ request_retention: 0.9, maximum_interval: 365, enable_fuzz: true, ...params }));
```

**Seeding (idempotent, runs once per app start).** Fetch `withBase('decks/all.json')`; if its `contentHash` differs from `settings.deckHash`, reconcile: `bulkAdd` a `createEmptyCard()` row for every id not already in `cards`; set `orphan = 1` on every `origin === 'deck'` row whose id is no longer in the deck (**never delete** — history is kept and simply hidden); store the new hash. Re-running seed with no content change must add nothing.

**Queue.** Due reviews first, oldest `due` first; then new cards up to `newPerDay` minus those already `introducedOn` today; interleaved **one new card per three reviews**, with the remainder appended.

```ts
export async function buildQueue(db, now: Date, newPerDay: number): Promise<ReviewCard[]> {
  const today = dayKey(now);
  const due = await db.cards.where('due').belowOrEqual(now)
                  .and(c => c.orphan === 0 && c.state !== State.New).sortBy('due');
  const introduced = await db.cards.where('introducedOn').equals(today).count();
  const fresh = await db.cards.where('state').equals(State.New).and(c => c.orphan === 0)
                    .limit(Math.max(0, newPerDay - introduced)).toArray();
  const queue: ReviewCard[] = []; let f = 0;
  due.forEach((c, i) => { queue.push(c); if ((i + 1) % 3 === 0 && f < fresh.length) queue.push(fresh[f++]); });
  while (f < fresh.length) queue.push(fresh[f++]);
  return queue;
}
```

**Predicted intervals for the four plungers.**

```ts
export function preview(card: ReviewCard, now: Date, f = scheduler()) {
  const r = f.repeat(card, now);
  const label = (due: Date) => {
    const m = Math.round((due.getTime() - now.getTime()) / 60_000);
    return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h`
         : m < 43200 ? `${Math.round(m / 1440)}d` : `${(m / 43200).toFixed(1)}mo`;
  };
  return { again: label(r[Rating.Again].card.due), hard: label(r[Rating.Hard].card.due),
           good:  label(r[Rating.Good].card.due),  easy: label(r[Rating.Easy].card.due) };
}
```

**Commit a rating — one transaction, never lose the card.**

```ts
export async function rate(db, card: ReviewCard, grade: Grade, sessionId: string,
                           now = new Date(), f = scheduler()) {
  const { card: next, log } = f.next(card, now, grade);
  const today = dayKey(now);
  await db.transaction('rw', db.cards, db.logs, db.days, async () => {
    await db.cards.put({ ...card, ...next,
      introducedOn: card.introducedOn ?? (card.state === State.New ? today : undefined) });
    await db.logs.add({ ...log, cardId: card.id, sessionId, dayKey: today });
    const d = (await db.days.get(today)) ?? { dayKey: today, reviews: 0, newCards: 0, napkinsRead: 0 };
    await db.days.put({ ...d, reviews: d.reviews + 1,
                        newCards: d.newCards + (card.state === State.New ? 1 : 0) });
  });
  return next;
}
```

If the transaction rejects (quota, private mode): the plunger returns to rest, a `Couldn't write that — try again` ticket appears, the card stays at the head of the queue, and the grade is kept in the Zustand `pendingWrite` slot for the next attempt.

**FSRS invariants to assert** (fixed `now = 2026-09-06T09:41:00Z`, `card = createEmptyCard(now)`, `enable_fuzz: false` in tests):
- `f.repeat(card, now)` yields four outcomes with `scheduled_days(Again) ≤ Hard ≤ Good ≤ Easy` and `Easy > Again`.
- After `Good`: `state ∈ {Learning, Review}`, `reps === 1`, `lapses === 0`, `due > now`, `log.rating === 3`, `log.review.getTime() === now.getTime()`.
- After `Good` then `Again` at the due date: `lapses === 1` and the new `scheduled_days` is shorter.
- Twelve consecutive `Good` reviews each taken at the card's `due`: `scheduled_days` is non-decreasing and the 12th interval exceeds 30 days.
- The exact numbers (stability, difficulty, per-rating `scheduled_days`) are **locked on day 1** by running the wrapper once and committing `tests/fixtures/fsrs/golden-card.snapshot.json`, then asserted with `toMatchFileSnapshot`. A snapshot diff means `ts-fsrs` moved — review the intervals by eye before updating.
- Fuzz is seeded through our own RNG (never `Math.random`), so seed `37` produces identical results twice.

**Queue golden.** Ten cards with `due` at `now − 3d, −2d, −1d, −1h, −1m, +1m, +1h, +1d, +2d, +3d` plus 25 New cards, `newPerDay = 10`, one New card already introduced today → the due queue is the **5 overdue cards in ascending `due` order**, the new queue is **9** cards, and the dispenser plate reads `14 due`. With `newPerDay = 0` the plate still reads `5 due`. With nothing due and nothing new the plate reads `Clean` and `isEmpty === true`.

**Worked example.** A new card rated **Good** at 2026-09-06 21:10 → `state = Learning`, `scheduled_days = 0`, due in about 10 minutes (the FSRS-6 default learning step). Rated Good again the next day → `Review`, due in roughly 4 days. The plunger labels shown before that second tap were `again 1m · hard 6m · good 4d · easy 8d` (± fuzz).

### 6.6 Highlighter → cloze — `src/engine/cloze/pick-blank.ts`

```ts
const STOP = new Set(['the','a','an','of','to','in','on','by','for','is','are','and','or',
                      'with','each','its','this','that','as','at','from','it','be']);

export function pickBlank(sentence: string, hints: string[]): { blank: string; start: number; end: number } {
  const tokens = [...sentence.matchAll(/[A-Za-z0-9()\-/]+/g)]
    .map(m => ({ w: m[0], s: m.index!, e: m.index! + m[0].length }));
  let best = { score: -1, i: 0, j: 0 };
  for (let i = 0; i < tokens.length; i++)
    for (let len = 1; len <= 3 && i + len <= tokens.length; len++) {
      const span = tokens.slice(i, i + len);
      if (span.some(t => STOP.has(t.w.toLowerCase()))) continue;
      const text = span.map(t => t.w).join(' ').toLowerCase();
      let score = text.length;
      if (hints.some(h => text.includes(h.toLowerCase()))) score += 6;   // matches a tag or title word
      if (/[A-Z0-9]/.test(span.map(t => t.w).join(''))) score += 3;      // proper noun, acronym, Big-O
      if (i === 0) score -= 2;                                           // don't blank the subject
      if (score > best.score) best = { score, i, j: i + len - 1 };
    }
  const s = tokens[best.i].s, e = tokens[best.j].e;
  return { blank: sentence.slice(s, e), start: s, end: e };
}
```

**Worked example.** Sentence `Virtual nodes fix uneven load by giving each server many ring positions.` with hints `['consistent','hashing','caching','sharding']`. Scores: `Virtual nodes` 13 + 3 (capital) − 2 (first) = 14; `uneven load` 11; `ring positions` 14; **`many ring positions` 19 → chosen.** The learner can nudge the blank one token left or right before saving; `Highlight.blank` stores the final choice.

### 6.7 Ruler scrubber mapping — `src/engine/scrubber/map.ts`

```ts
/** Ticks are evenly spaced per step; time inside a step is linear. */
export function xToTime(x: number, width: number, steps: StepInfo[]): number {
  const n = steps.length, seg = width / n;
  const i = Math.min(n - 1, Math.max(0, Math.floor(x / seg)));
  const frac = Math.min(1, Math.max(0, (x - i * seg) / seg));
  return steps[i].beginMs + frac * (steps[i].endMs - steps[i].beginMs);
}
export const timeToStep = (t: number, steps: StepInfo[]) =>
  Math.max(0, steps.findLastIndex(s => t >= s.beginMs));
```

Island behaviour: `pointerdown` on the strip or the pen → `svg.pauseAnimations()`; `pointermove` → `svg.setCurrentTime(xToTime(x, width, steps) / 1000)`; `pointerup` → `svg.unpauseAnimations()`; tapping tick *k* → `setCurrentTime(steps[k].beginMs / 1000)` **and stay paused**. Under reduced motion (or when `setCurrentTime` is undefined) the static SVG is shown and a generated `<style>` rule sets `opacity: 0` on `g[data-el]` whose index exceeds `steps[k].lastElement`.

### 6.8 Visualiser tracers — `src/engine/viz/*`

Every visualiser is `(params) → Generator<TraceEvent>` **plus** a pure reducer. The island materialises frames lazily (frame *k* = replay of events 0…k, memoised), so scrubbing is O(1) after the first pass. Rendering uses Rough.js with a **fixed seed per element** so sketchy strokes do not jitter between frames.

```ts
export type TraceEvent =
  | { t: 'compare'; i: number; j: number }
  | { t: 'swap'; i: number; j: number }
  | { t: 'set'; i: number; v: number }
  | { t: 'mark'; i: number; kind: 'sorted' | 'pivot' | 'current' | 'visited' | 'frontier' | 'path' }
  | { t: 'edge'; from: string; to: string; kind: 'relax' | 'tree' }
  | { t: 'move'; key: string; from: string; to: string }
  | { t: 'caption'; text: string }
  | { t: 'done' };

export interface Frame<S> { state: S; caption: string; highlight: number[]; }
export interface Tracer<P, S> {
  id: string; title: string; defaults: P;
  init(p: P): S; run(p: P): Generator<TraceEvent>; apply(s: S, e: TraceEvent): S;
}
```

**Verified golden values** — assert every one of these:

| Tracer | Input | Expected |
|---|---|---|
| `bubbleSort` (early-exit) | `[5,3,8,1,9,2,7,4]` | **25 `compare`, 14 `swap`, 5 passes**, result `[1,2,3,4,5,7,8,9]`; first event `compare(0,1)`, first swap `swap(0,1)` |
| `bubbleSort` (naive, no early exit) | same | **28 compares, 14 swaps** |
| `insertionSort` | same | **14 shifts** (= the inversion count), sorted result |
| `mergeSort` | same | 17 compares, sorted result |
| `binarySearch` | `[1,3,5,7,9,11,13,15]`, target `11` | probes **`[3,5]`**, found at index `5` |
| `binarySearch` | same, target `4` | probes **`[3,1,2]`**, returns `-1` |
| `bfsGrid` | 5×5 rows `..#..` / `.##..` / `.....` / `#.##.` / `.....`, start `(0,0)`, goal `(4,4)`, neighbour order up, down, left, right, coordinates `(row, col)` | **18 `visit` events including the goal (17 before it)**; path `[(0,0),(1,0),(2,0),(2,1),(3,1),(4,1),(4,2),(4,3),(4,4)]`, **8 edges** |
| `lruCache(cap = 2)` | `put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4) get(1) get(3) get(4)` | gets return `[1,-1,-1,3,4]`; evictions `[2,1]` |
| `tokenBucket(cap = 5, refill = 1/s)` | 7 requests at `t=0`, then 1 at `t=3` | `[T,T,T,T,T,F,F,T]` |
| `quorum(N,R,W)` | `(3,2,2) (3,1,1) (3,1,3) (3,3,1) (5,2,3)` | strongly consistent `[T,F,T,T,F]` (rule `R + W > N`) |
| `hashRing` (fixed positions) | servers `A@40 B@160 C@280`; keys `k1@10 k2@55 k3@170 k4@200 k5@300 k6@350` | owners `{k1:A, k2:B, k3:C, k4:C, k5:A, k6:A}` (clockwise, wrapping) |
| `hashRing.add` | add `D@220` | only `k3, k4` move, both to `D` |
| `hashRing.remove` | remove `B` | only `k2` moves, to `C` |
| `fnv1a32` | `''`, `'a'`, `'foobar'`, `'napkin'` | **`0x811c9dc5`, `0xe40c292c`, `0xbf9cf968`, `0x4b329dd2`** |
| `hashTableChaining(buckets = 8, maxLoad = 0.75)` | insert 12 sequential keys | resize to 16 triggered on the 7th insert; final load factor `0.75` |
| `bstInsert` | `[8,3,10,1,6,14,4,7,13]` | in-order `[1,3,4,6,7,8,10,13,14]`, height 4, `search(6)` path `[8,3,6]` |

Plus a **property test** with fast-check (200 random arrays of length ≤ 16): sort tracers always end sorted, and the swap count for bubble/insertion always equals the inversion count.

Reference implementation shape (this exact code is the template for every other tracer):

```ts
export const bubbleSort: Tracer<{ values: number[] }, { a: number[]; sorted: Set<number> }> = {
  id: 'bubble-sort', title: 'Bubble Sort', defaults: { values: [5, 3, 8, 1, 9, 2, 7, 4] },
  init: p => ({ a: [...p.values], sorted: new Set() }),
  *run(p) {
    const a = [...p.values];
    for (let end = a.length - 1; end > 0; end--) {
      let swapped = false;
      for (let i = 0; i < end; i++) {
        yield { t: 'compare', i, j: i + 1 };
        if (a[i] > a[i + 1]) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; swapped = true; yield { t: 'swap', i, j: i + 1 }; }
      }
      yield { t: 'mark', i: end, kind: 'sorted' };
      if (!swapped) { for (let k = 0; k < end; k++) yield { t: 'mark', i: k, kind: 'sorted' }; break; }
    }
    yield { t: 'done' };
  },
  apply(s, e) {
    if (e.t === 'swap') { const a = [...s.a]; [a[e.i], a[e.j]] = [a[e.j], a[e.i]]; return { ...s, a }; }
    if (e.t === 'mark' && e.kind === 'sorted') return { ...s, sorted: new Set([...s.sorted, e.i]) };
    return s;
  },
};
```

**Caption contract** (this is what the `aria-live` region and the ticket caption read): `compare(2,3)` for a compare, `compare(2,3) → swap` when the very next event is the matching swap, `${i} is in place` for a sorted mark, `visit (2,1)` for BFS, `evict 2` for LRU, `add D at 220°` and `2 of 12 keys moved (≈ K/N)` for the ring, `done` at the end.

### 6.9 Consistent-hash ring — `src/engine/viz/hash-ring.ts`

```ts
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export const angle = (s: string) => (fnv1a(s) / 2 ** 32) * 360;

export interface Ring { nodes: { id: string; angle: number; vnode: number }[] }   // sorted by angle

export function makeRing(servers: string[], vnodes = 1): Ring {
  return { nodes: servers
    .flatMap(s => Array.from({ length: vnodes }, (_, v) =>
      ({ id: s, vnode: v, angle: angle(vnodes === 1 ? s : `${s}#${v}`) })))
    .sort((a, b) => a.angle - b.angle) };
}
export const owner = (ring: Ring, key: string) => {
  const a = angle(key);
  return (ring.nodes.find(n => n.angle >= a) ?? ring.nodes[0]).id;    // wrap-around
};
export function* addServer(ring: Ring, keys: string[], server: string, vnodes = 1): Generator<TraceEvent> {
  const before = Object.fromEntries(keys.map(k => [k, owner(ring, k)]));
  const after = makeRing([...new Set(ring.nodes.map(n => n.id)), server], vnodes);
  yield { t: 'caption', text: `add ${server} at ${angle(server).toFixed(0)}°` };
  for (const k of keys) { const o = owner(after, k); if (o !== before[k]) yield { t: 'move', key: k, from: before[k], to: o }; }
  const moved = keys.filter(k => owner(after, k) !== before[k]).length;
  yield { t: 'caption', text: `${moved} of ${keys.length} keys moved (≈ K/N)` };
  yield { t: 'done' };
}
```

**Worked example (no virtual nodes).** Servers A/B/C at 40°, 160°, 300°; keys k1…k12 spread around. Adding D at 200° moves only the keys whose angle falls in (160°, 200°] — with 12 keys that is typically 1–2 — and the caption reads `2 of 12 keys moved (≈ K/N)`. In the Griddle the learner drags D around the ring and watches the count change; setting `vnodes = 8` visibly evens the arcs.

### 6.10 Receipt formatting — `src/engine/receipt/format.ts`

The receipt is **32 columns**, uppercase, dot leaders, JetBrains Mono. **This section is the only definition of the format** (C19) — ARCHITECTURE §5.5, TESTING §4 G-RECEIPT and `design/preview.html` all render these exact lines; nothing else may invent a row.

**The two padding helpers. Both return exactly 32 columns; every other line is shorter.**

```ts
const W = 32;
export const RATING_WORD = { 1: 'AGAIN', 2: 'HARD', 3: 'GOOD', 4: 'EASY' } as const;

/** Titles are truncated to 20 columns with '…' so the value column never shifts. */
const trunc = (s: string) => (s.length <= 20 ? s : s.slice(0, 19) + '…');

/** Item row: TITLE, a space, dot leaders, a space, then a right-hand value. */
const row   = (l: string, r: string) => (trunc(l) + ' ').padEnd(W - r.length - 1, '.') + ' ' + r;

/** Total row: an 18-column label field and a 14-column right-aligned value field. */
const total = (l: string, r: string) => l.padEnd(18) + r.padStart(14);
```

The item value is always 9 columns: `RATING_WORD[r].padEnd(5) + ' ' + `${days}d`.padStart(3)` → `GOOD   4d`, `AGAIN  1d`, `EASY  31d`.

**Golden.** Session `[{title:'Binary Search', rating:'Good', days:4}, {title:'Consistent Hashing', rating:'Again', days:1}, {title:'LRU Cache', rating:'Easy', days:31}]`, `order = 412`, `streak = 12`, `now = 2026-09-06T09:41:00Z`. `formatReceipt()` must return **exactly** these ten lines (assert with `toBe`):

```
NAPKIN · ORDER #0412
2026-09-06  09:41
--------------------------------
BINARY SEARCH ........ GOOD   4d
CONSISTENT HASHING ... AGAIN  1d
LRU CACHE ............ EASY  31d
--------------------------------
SUBTOTAL               3 reviews
TIP                12-day streak
THANK YOU · COME AGAIN
```

Column check (verified in node, counting code points, so `·` counts as one column): lines 3–7 and 8–9 are **32**; line 1 is 20, line 2 is 17, line 10 is 22.

A session with zero reviews produces the same block with no item lines and `SUBTOTAL               0 reviews` (32 columns; note `0 reviews`, plural). A property test over 500 random titles asserts every line is **32 columns or shorter**, that the item and total rows are exactly 32, and that the order number is always zero-padded to 4. The footer of the shared PNG also carries `NAPKIN vX.Y.Z`.

### 6.11 Streaks, rings, numbers, hour — `src/engine/progress/*`, `theme/hour.ts`, `scripts/number-card.mjs`

```ts
export function streak(days: DayStat[], today = dayKey()): { current: number; best: number } {
  const set = new Set(days.filter(d => d.reviews > 0 || d.napkinsRead > 0).map(d => d.dayKey));
  const shift = (k: string, n: number) => { const t = new Date(`${k}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  let cur = 0, k = set.has(today) ? today : shift(today, -1);   // a live streak survives a day with no activity yet
  while (set.has(k)) { cur++; k = shift(k, -1); }
  let best = 0;
  for (const start of set) {
    if (set.has(shift(start, -1))) continue;                     // only run-starts
    let n = 0, q = start;
    while (set.has(q)) { n++; q = shift(q, 1); }
    best = Math.max(best, n);
  }
  return { current: cur, best };
}
export const ringTier = (reviews: number) => reviews >= 20 ? 3 : reviews >= 5 ? 2 : reviews >= 1 ? 1 : 0;
export const ringRotation = (dayKey: string) => fnv1a(dayKey) % 360;
/** The `late` band wraps midnight, so it MUST be tested first (C18).
 *  20:00–05:59 late · 06:00–11:59 morning · 12:00–19:59 afternoon. */
export const hourBand = (h: number): 'late' | 'morning' | 'afternoon' =>
  h >= 20 || h < 6 ? 'late' : h < 12 ? 'morning' : 'afternoon';
```

**Streak golden.** Activity on `2026-09-01, 09-02, 09-04, 09-05, 09-06`, today `2026-09-06` → `current = 3`, `best = 3`. Ring tiers: `0 → none`, `1 → tier 1 (35 %)`, `4 → tier 1`, `5 → tier 2 (48 %)`, `19 → tier 2`, `20 → tier 3 (60 %)`.

**Hour golden — assert all eight vectors, and never delete the first two** (they are the regression that C18 fixes): `00:00 → late`, `05:59 → late`, `06:00 → morning`, `11:59 → morning`, `12:00 → afternoon`, `19:59 → afternoon`, `20:00 → late`, `23:59 → late`. `2026-09-06T09:41:00Z` read in `Asia/Kolkata` (15:11 local) → `afternoon`; read in `UTC` → `morning`. A pinned House Rules value always wins. `nextBoundary(date)` returns the next of `06:00 / 12:00 / 20:00` so the 6 s crossfade can be scheduled.

**Napkin numbers.** `src/content/numbers.json` is an **append-only** map `{ "dsa/big-o-basics": 1, … }`. `npm run number -- sysdesign/consistent-hashing` mints `max + 1`. Numbers are identity: they never shift, never get reused, and a card without one fails the build. Seed the file with the values in §7.5 so the wireframes and screenshots line up.

### 6.12 Service worker — `scripts/build-sw.mjs`

```js
import { generateSW } from 'workbox-build';
import { writeFile } from 'node:fs/promises';

const base = (process.env.VITE_BASE_PATH ?? '/').replace(/\/?$/, '/');   // always a trailing slash here

await writeFile('dist/manifest.webmanifest', JSON.stringify({
  name: 'Napkin', short_name: 'Napkin', id: base, start_url: base, scope: base,
  display: 'standalone', orientation: 'any', lang: 'en',
  theme_color: '#1E3B38', background_color: '#1E3B38',
  description: 'Interview prep sketched on a diner napkin. Works offline.',
  icons: [
    { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
    { src: `${base}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}));

const { count, size, warnings } = await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,svg,woff2,json,webp,webm,mp3,webmanifest,wasm,pf_index,pf_fragment,pf_meta}'],
  globIgnores: ['diagrams/**', 'videos/**', 'sw.js', 'workbox-*.js', '**/*.map'],   // C5: diagrams are inlined
  swDest: 'dist/sw.js',
  skipWaiting: false,            // the NEW NAPKINS ticket decides when to activate
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  navigateFallback: `${base}offline/index.html`,
  navigateFallbackDenylist: [/\/pagefind\//],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  runtimeCaching: [{ urlPattern: /\/videos\//, handler: 'CacheFirst',
                     options: { cacheName: 'napkin-videos', expiration: { maxEntries: 20 } } }],
  sourcemap: false,
});
warnings.forEach(w => console.warn('[sw]', w));
console.log(`[sw] precached ${count} files, ${(size / 1024 / 1024).toFixed(2)} MB`);

// 10 MB is the MVP budget. v1 (120 napkins) raises it deliberately by setting NAPKIN_PRECACHE_MAX_MB=25
// in the workflow; there is no other way to exceed it, and the value is printed on every run.
const maxMb = Number(process.env.NAPKIN_PRECACHE_MAX_MB ?? 10);
if (size > maxMb * 1024 * 1024) {
  console.error(`[sw] precache exceeds the ${maxMb} MB budget`);
  process.exit(1);
}
```

Registration lives in `Base.astro` and is **skipped inside the APK**:

```astro
<script>
  import { Workbox } from 'workbox-window';
  import { BASE } from '../lib/base';
  if (import.meta.env.PROD && import.meta.env.PUBLIC_PLATFORM !== 'android' && 'serviceWorker' in navigator) {
    const wb = new Workbox(`${BASE}sw.js`, { scope: BASE });
    wb.addEventListener('waiting', () => document.dispatchEvent(new CustomEvent('napkin:update', { detail: wb })));
    wb.register();
  }
</script>
```

The update ticket calls `wb.messageSkipWaiting()` and reloads on `controlling`.

**Pagefind under the sub-path:**
```ts
const pf = await import(/* @vite-ignore */ `${BASE}pagefind/pagefind.js`);
await pf.init({ basePath: `${BASE}pagefind/` });
```

### 6.13 Error handling matrix

| Where | Failure | Behaviour |
|---|---|---|
| Diagram build | unknown colour, raster file, export throws | **Fail the build** with `<file>: <element id>: <reason>`. Never emit a partial SVG. Text-less jsdom output triggers the Playwright retry automatically. |
| Licence lint | bad licence, missing source, banned host | **Fail the build**, listing every offending card. Nothing deploys. |
| Astro build | card without a number, unresolved `related`/`prereqs`, missing diagram file | zod / collection check throws with the id. |
| Rating write | Dexie transaction rejects | Plunger rests, ticket `Couldn't write that — try again`, card stays in the queue, grade retried from `pendingWrite`. |
| Pagefind | dynamic import throws | Dev: `Search needs a build (npm run build)`. Prod offline: `Not stocked yet — connect once`. |
| SMIL absent | `svg.setCurrentTime` undefined | Fall back to the static SVG; the ruler steps group opacity (identical to reduced motion). |
| Service worker | registration throws (`file://`, unsupported) | Ignore silently; the app still works. |
| Import JSON | schema mismatch | `--danger` ticket with the first zod issue; **nothing is written**. |
| Deep link to an un-cached napkin (web, offline) | `navigateFallback` | `offline.astro` with `Back to menu`. |
| Un-caught island error | React error boundary | Renders a napkin reading "This one tore. Reload the counter." with a reload button; the rest of the page still works. |

---

## 7. Content: sources, licence lint, and the starter syllabus

### 7.1 There are no APIs

**Napkin calls zero endpoints at build time and zero at runtime.** No keys, no rate limits, no CORS, no proxy, no Cloudflare Worker, no `worker/` folder, no `CLOUDFLARE_*` secrets. If you find yourself writing a `fetch()` to another origin, you have taken a wrong turn. The only `fetch` in the app is `fetch(withBase('decks/all.json'))` — same origin, precached.

The CSP is therefore a hard allow-nothing list, emitted as a `<meta http-equiv>` in `Base.astro` (GitHub Pages cannot send headers):

```
default-src 'self'; img-src 'self' data: blob:; font-src 'self';
style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval' 'sha256-<hash of the pre-paint script>';
connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'
```

(`wasm-unsafe-eval` is required by Pagefind's WASM. Compute the inline-script hash in the build and inject it; a Playwright test asserts zero CSP violations on every screen.)

### 7.2 Content licence allow-list and ban-list

**Allowed in `sources[].licence` (C12):** `MIT` · `Apache-2.0` · `BSD-2-Clause` · `CC0` · `CC BY 4.0` · `CC BY 2.5` · `Public domain` · `Own work`.

**Approved source repertoire** (verified licences — use these and cite them):

| Source | URL | Licence | Use it for |
|---|---|---|---|
| OpenDSA eTextbook | `https://github.com/OpenDSA/OpenDSA` | MIT (© 2011–2025 Karavirta & Shaffer) | the canonical DSA syllabus: lists, trees, heaps, hashing, graphs, sorting, complexity |
| The System Design Primer | `https://github.com/donnemartin/system-design-primer` | CC BY 4.0 | the system-design syllabus, trade-off bullet style, and its Anki decks |
| *Algorithms*, Jeff Erickson (**textbook only**) | `https://jeffe.cs.illinois.edu/teaching/algorithms/` | CC BY 4.0 | rigorous DP / graph / flow explanations |
| Open Data Structures, Pat Morin | `https://opendatastructures.org/` | CC BY 2.5 | short, clean data-structure chapters |
| Stanford CS229/230/221 VIP cheatsheets, Amidi & Amidi | `https://github.com/afshinea/stanford-cs-229-machine-learning` | MIT | the DS/ML syllabus and the density target for a napkin |
| Tech Interview Handbook, Yangshun Tay | `https://github.com/yangshun/tech-interview-handbook` | MIT | per-topic cheatsheets, the Grind-75 ordering |
| TheAlgorithms | `https://github.com/TheAlgorithms` | MIT | reference implementations for code snippets |
| Data Structure Visualizations, David Galles | `https://www.cs.usfca.edu/~galles/JavascriptVisual/` | FreeBSD (BSD-2-Clause) | *step-generation logic* to study; ship none of its code |
| Wikimedia Commons | `https://commons.wikimedia.org/` | **per file**: PD / CC0 / CC BY only | occasional reference diagrams; record each file in `src/data/attribution.json` |

**Banned — the build fails on these hosts:** `bytebytego.com`, `github.com/ByteByteGoHq`, `roadmap.sh`, `github.com/kamranahmedse/developer-roadmap`, `visualgo.net`, `ocw.mit.edu`, `cs50.harvard.edu`. Reasons: ByteByteGo is CC BY-**NC-ND** (NoDerivatives forbids redrawing); roadmap.sh is all-rights-reserved; VisuAlgo forbids forking and re-hosting; OCW and CS50 are NC-SA. **Never trace their images, not even "for inspiration".**

**ShareAlike:** *Dive into Deep Learning* (d2l) is CC BY-SA 4.0. It may be **linked from prose**, never listed in `sources[]`, never adapted. Erickson's non-textbook lecture notes are CC BY-NC-SA — the textbook only.

**Unverified, therefore unused:** `algorithm-visualizer/algorithms` (scripts repo, no visible LICENSE), `aretecode/system-design-templates-excalidraw` (no licence), Lottie assets (licence page unreachable), vendor icon packs (AWS/Azure/GCP artwork is not OSI — draw generic hand-drawn server/cache/queue glyphs instead).

### 7.3 The licence lint — `scripts/lint-licences.mjs`

Runs **first** in `npm run build`, before Astro, so failures are fast and readable. It parses every `src/content/cards/**/*.mdx` frontmatter and **fails the build**, listing every offending file, when:

1. a `licence` value is outside the allow-list, **or** the string matches `/NC|ND|SA/i`;
2. `sources` is empty and `original` is not `true`;
3. a `url` host is on the ban-list;
4. a card has no `numbers.json` entry, or two cards share a number;
5. a `diagram` name has no `public/diagrams/<name>.svg`;
6. a `related` or `prereqs` id does not resolve to an existing card;
7. prose exceeds **350 words** (GOAL: a napkin reads in ≤ 3 minutes) or `minutes > 5`;
8. a card has fewer than 2 flashcards.

It also writes two artefacts: `.cache/captions.json` (`{ diagramName: steps[] }`, consumed by `build-diagrams.mjs`) and `src/generated/credits.json` (sources de-duplicated by URL, sorted by name, consumed by the House Rules credits card and by the README's Attribution section — **generated, never hand-edited**).

Attribution renders on every napkin as one `--ink-muted` 12 px line: `from System Design Primer, CC BY 4.0`.

Separately, `npm run test:licences` gates **dependency** licences:

```
license-checker-rseidelsohn --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;MPL-2.0;0BSD;CC0-1.0;Unlicense;OFL-1.1;Python-2.0' \
  --excludePackages 'excalidraw-animate@0.7.2' --production
```

The exclusion is required because `excalidraw-animate`'s npm metadata has **no `license` field** even though its GitHub `LICENSE` is MIT (© 2020 Daishi Kato). Put that sentence in a comment next to the flag.

### 7.4 The syllabus — 120 napkins, three tracks

Tracks are named for a diner menu: **Starters · DSA**, **Mains · System Design**, **Desserts · Data Science**. **MVP ships 20 napkins — 7 DSA, 7 system design, 6 data science** (C23): the ten in §7.6 plus the ten in §7.7. v1 grows each track to 40. `src/content/tracks/<track>.yaml` holds the syllabus order (which is independent of napkin numbers).

**Starters · DSA (40)** — complexity and Big-O · arrays and pointers · two pointers and sliding window · prefix sums · binary search · binary search on the answer · sorting overview · bubble sort · insertion sort · merge sort · quicksort and pivots · heapsort · counting/radix sort · stacks · queues and deques · linked lists · hash tables and collisions · hash functions · sets and multisets · trees and traversals · binary search trees · BST balancing (AVL/red-black) · heaps and priority queues · tries · union-find · graphs and representations · BFS · DFS · topological sort · shortest paths (Dijkstra) · Bellman-Ford and negative edges · minimum spanning trees · dynamic programming: memoisation vs tabulation · knapsack · longest common subsequence · edit distance · greedy vs DP · backtracking and pruning · bit manipulation · amortised analysis.

**Mains · System Design (40)** — client-server basics · DNS and CDNs · load balancing · reverse proxies · horizontal vs vertical scaling · caching strategies · cache eviction (LRU/LFU) · cache invalidation · consistent hashing · sharding and partitioning · replication (leader/follower) · quorum reads and writes (N, R, W) · read repair and anti-entropy · CAP and PACELC · eventual consistency · ACID vs BASE · SQL vs NoSQL · indexes and B-trees · LSM trees and SSTables · write-ahead logs · message queues · pub/sub · idempotency and exactly-once · rate limiting (token/leaky bucket) · backpressure · circuit breakers and retries with jitter · timeouts and deadlines · API gateways · REST vs gRPC vs GraphQL · webhooks · blob storage · search indexing · time-series and metrics · logging and tracing · leader election and Raft · distributed locks · two-phase commit vs sagas · geo-replication · designing a URL shortener · designing a news feed.

**Desserts · Data Science (40)** — the ML problem framing · supervised vs unsupervised · train/validation/test splits · cross-validation · bias–variance trade-off · overfitting and regularisation (L1/L2) · feature scaling · categorical encoding · missing data · linear regression · logistic regression · the loss-function zoo · gradient descent · learning rate and schedules · stochastic vs batch vs mini-batch · convexity · decision trees · random forests · gradient boosting · SVMs and kernels · k-nearest neighbours · naive Bayes · k-means · hierarchical clustering · PCA · t-SNE and UMAP · precision, recall and F1 · the ROC curve and AUC · confusion matrices · class imbalance · calibration · A/B testing basics · p-values and confidence intervals · the central limit theorem · Bayes' theorem · maximum likelihood · neural network basics · backpropagation · embeddings · attention in one picture.

### 7.5 `src/content/numbers.json` — seed exactly this

Numbers are identity and are chosen to match the wireframes and `design/preview.html`. Seed the file with these before writing any card; mint later ones with `npm run number`.

```json
{
  "dsa/big-o-basics": 1,
  "dsa/arrays-and-pointers": 2,
  "dsa/binary-search": 3,
  "dsa/hash-tables": 4,
  "dsa/bfs-and-dfs": 5,
  "dsa/bubble-sort": 19,
  "dsa/lru-cache": 21,
  "dsa/dynamic-programming": 24,
  "sysdesign/load-balancing": 30,
  "sysdesign/caching": 31,
  "sysdesign/hashing": 36,
  "sysdesign/consistent-hashing": 37,
  "sysdesign/sharding": 41,
  "sysdesign/quorum-n-r-w": 44,
  "sysdesign/read-repair": 45,
  "sysdesign/message-queues": 48,
  "sysdesign/rate-limiting": 52,
  "ds/bias-variance": 60,
  "ds/train-val-test": 61,
  "ds/gradient-descent": 62,
  "ds/logistic-regression": 63,
  "ds/precision-recall-roc": 64,
  "ds/cross-validation": 65,
  "sysdesign/raft-leader-election": 112
}
```

### 7.6 The first ten napkins — write these exactly

Each napkin is one `.mdx` file under `src/content/cards/<track>/` plus one `.excalidraw`, `.d2` or `.mmd` in `src/diagrams/`. Prose ≤ 350 words. Diagrams use only the five palette strokes and Excalifont, with **numbered callouts written before the shapes they describe**.

> **Note for the search e2e:** until the quorum napkin exists (batch 2), `search.spec.ts` should query `hashing`, not `quorum`.

---

**① `dsa/big-o-basics` — No. 001 — "Big-O Basics"**

```yaml
title: Big-O Basics
track: dsa
tags: [complexity, fundamentals]
difficulty: 1
minutes: 2
tldr: "Big-O names how fast work grows as n grows — constants and small terms are dropped on purpose."
diagram: big-o-curves
steps:
  - "Axes: n across, operations up"
  - "O(1) and O(log n) stay flat"
  - "O(n) and O(n log n) climb"
  - "O(n²) and O(2ⁿ) leave the napkin"
bigO:
  - { op: "O(1)",        avg: "constant",  note: "array index, hash lookup" }
  - { op: "O(log n)",    avg: "log",       note: "binary search, balanced BST" }
  - { op: "O(n)",        avg: "linear",    note: "one scan" }
  - { op: "O(n log n)",  avg: "linearithmic", note: "merge/heap sort — the sorting floor" }
  - { op: "O(n²)",       avg: "quadratic", note: "nested loops over the same data" }
related: [dsa/binary-search, dsa/bubble-sort]
prereqs: []
flashcards:
  - kind: qa
    q: "Why does Big-O drop constant factors and lower-order terms?"
    a: "It describes growth as n → ∞; for large n the dominant term decides, and constants depend on the machine, not the algorithm."
  - kind: cloze
    text: "Comparison sorts cannot beat {{O(n log n)}} in the worst case."
  - kind: qa
    q: "An algorithm does 3n² + 200n + 5000 operations. What is its Big-O, and when would the 5000 still matter?"
    a: "O(n²). The constant dominates for small n, so for tiny inputs a 'worse' algorithm can be faster in practice."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Analysis of Algorithms chapter, redrawn" }
```

**Bullets:** Big-O is an upper bound on *growth*, not a stopwatch. · Constants matter in the real world, asymptotics matter when n gets big. · Best/average/worst are three different questions — say which one you mean. · Space complexity uses the same notation for memory.
**Diagram (`big-o-curves.excalidraw`, ~12 elements):** axes drawn first (step 0), then callout `1. O(1) and O(log n) stay flat` with two nearly flat curves in `#1971c2`; `2. O(n) and O(n log n) climb` with two rising curves in `#2f9e44`; `3. O(n²) and O(2ⁿ) leave the napkin` with two steep curves in `#e03131` that exit the frame; each curve gets an Excalifont label.

---

**② `dsa/arrays-and-pointers` — No. 002 — "Arrays & Pointers"**

```yaml
title: Arrays & Pointers
track: dsa
tags: [arrays, two-pointers, fundamentals]
difficulty: 1
minutes: 3
tldr: "An array is contiguous memory with O(1) indexing; two moving pointers turn many O(n²) scans into O(n)."
diagram: two-pointers
steps: ["A sorted array in a row of boxes", "Put one pointer at each end", "Sum too big? move the right pointer in", "Sum too small? move the left pointer out"]
bigO:
  - { op: "index",  avg: "O(1)" }
  - { op: "search (unsorted)", avg: "O(n)" }
  - { op: "insert/delete at end", avg: "O(1)", note: "amortised, dynamic array" }
  - { op: "insert/delete in middle", avg: "O(n)", note: "everything after it shifts" }
related: [dsa/big-o-basics, dsa/binary-search]
prereqs: [dsa/big-o-basics]
flashcards:
  - kind: qa
    q: "Why is inserting into the middle of an array O(n) but appending amortised O(1)?"
    a: "Insertion shifts every later element; appending writes one slot and only occasionally pays for a doubling copy, which amortises to constant."
  - kind: cloze
    text: "The two-pointer technique needs the array to be {{sorted}} before the pointers can move meaningfully."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Array-based lists, redrawn" }
```

**Bullets:** Contiguity is the whole trick: index arithmetic is one multiply and one add. · Cache locality makes arrays beat linked lists far more often than the Big-O suggests. · Two pointers, sliding window and prefix sums are the three moves that most array questions want. · Growing by doubling is what makes append amortised O(1).
**Diagram (`two-pointers.excalidraw`):** eight numbered boxes (step 0), then `1. Put one pointer at each end` with two `#e03131` arrows, `2. Sum too big? move the right pointer in`, `3. Sum too small? move the left pointer out`, with a small running-sum label in `#1971c2`.

---

**③ `dsa/binary-search` — No. 003 — "Binary Search"**

```yaml
title: Binary Search
track: dsa
tags: [search, divide-and-conquer, arrays]
difficulty: 2
minutes: 3
tldr: "Halve a sorted range each step: 20 probes are enough for a million items."
diagram: binary-search
steps: ["A sorted array with lo and hi", "Probe the middle", "Target is bigger — discard the left half", "Probe the middle of what is left", "Found it"]
bigO:
  - { op: "search", best: "O(1)", avg: "O(log n)", worst: "O(log n)" }
  - { op: "space",  avg: "O(1)", note: "iterative; O(log n) if recursive" }
related: [dsa/big-o-basics, dsa/hash-tables]
prereqs: [dsa/arrays-and-pointers]
griddle: binary-search
flashcards:
  - kind: qa
    q: "What is the worst-case time complexity of binary search?"
    a: "O(log n) — each probe halves the remaining range."
  - kind: cloze
    text: "Writing `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2` avoids {{integer overflow}}."
  - kind: qa
    q: "Binary search on [1,3,5,7,9,11,13,15] for 4 — which indices are probed, and what is returned?"
    a: "Indices 3, 1, 2, then −1: the value is not present, and lo ends at the insertion point."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Binary search module, redrawn" }
```

**Bullets:** The array must be sorted — that precondition *is* the algorithm. · Prefer `lo + (hi - lo) / 2`. · Decide once whether `hi` is inclusive and never change your mind mid-function. · "Binary search on the answer" applies the same halving to a monotone predicate, not to an array.
**Note:** the second flashcard's question text is a **locked golden** (`244084cb…`) — do not reword `What is the worst-case time complexity of binary search?`.

---

**④ `dsa/hash-tables` — No. 004 — "Hash Tables"**

```yaml
title: Hash Tables
track: dsa
tags: [hashing, collisions, arrays]
difficulty: 2
minutes: 3
tldr: "A hash turns a key into a bucket index; collisions are expected, and the load factor decides your speed."
diagram: hash-chaining
steps: ["Eight buckets in a column", "Hash each key to a bucket", "Two keys collide — chain them", "Load factor passes 0.75 — resize and rehash"]
bigO:
  - { op: "lookup", best: "O(1)", avg: "O(1)", worst: "O(n)", note: "worst = every key in one bucket" }
  - { op: "insert", avg: "O(1)", worst: "O(n)", note: "amortised over resizes" }
  - { op: "space",  avg: "O(n)" }
related: [dsa/arrays-and-pointers, sysdesign/consistent-hashing]
prereqs: [dsa/arrays-and-pointers]
griddle: hash-chaining
flashcards:
  - kind: qa
    q: "What makes a hash table degrade to O(n) lookups?"
    a: "Collisions concentrating in one bucket — a poor hash, adversarial keys, or a load factor left too high."
  - kind: cloze
    text: "Most implementations resize when the load factor exceeds {{0.75}}, then rehash every key."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Hash tables chapter, redrawn" }
```

**Bullets:** Load factor = entries ÷ buckets; it, not n, controls the average chain length. · Chaining stores collisions in a list; open addressing probes for the next free slot — both are fine, they fail differently. · Resizing is O(n) but amortises to O(1) per insert. · Hash order is not iteration order; never rely on it.

---

**⑤ `dsa/bfs-and-dfs` — No. 005 — "BFS & DFS"**

```yaml
title: BFS & DFS
track: dsa
tags: [graphs, traversal, queues]
difficulty: 2
minutes: 3
tldr: "Same walk, different container: a queue explores level by level, a stack dives deep first."
diagram: bfs-vs-dfs
steps: ["A 5×5 grid with walls", "BFS: queue the neighbours, expand a ring at a time", "DFS: push the neighbours, follow one branch to the end", "BFS reaches the goal in the fewest edges"]
bigO:
  - { op: "BFS / DFS", avg: "O(V + E)" }
  - { op: "space", avg: "O(V)", note: "the frontier, plus the visited set" }
related: [dsa/hash-tables, dsa/big-o-basics]
prereqs: [dsa/arrays-and-pointers]
griddle: bfs-grid
flashcards:
  - kind: qa
    q: "Why does BFS find the shortest path on an unweighted graph but DFS does not?"
    a: "BFS expands nodes in non-decreasing distance from the source, so the first time it reaches a node it has used the fewest edges; DFS commits to a branch and may reach it by a longer route first."
  - kind: cloze
    text: "BFS uses a {{queue}}; DFS uses a {{stack}} (or the call stack)."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Graph traversal modules, redrawn" }
```

**Bullets:** Mark nodes visited **when you enqueue**, not when you dequeue, or you will queue duplicates. · BFS memory is the frontier, which can be huge on wide graphs; DFS memory is the depth. · Weighted edges break BFS's shortest-path guarantee — that is Dijkstra's job. · Neighbour order changes the traversal but never the reachable set.
**Griddle golden:** the grid `..#..` / `.##..` / `.....` / `#.##.` / `.....` from `(0,0)` to `(4,4)` visits 18 nodes and produces an 8-edge path (§6.8).

---

**⑥ `dsa/bubble-sort` — No. 019 — "Bubble Sort"** *(the griddle exemplar)*

```yaml
title: Bubble Sort
track: dsa
tags: [sorting, comparison]
difficulty: 1
minutes: 2
tldr: "Repeatedly swap neighbours that are out of order; after pass k the largest k values have bubbled to the end."
diagram: bubble-sort
steps: ["Eight plates in a row", "Compare the first pair", "Out of order — swap them", "After one pass the largest plate is parked at the end"]
bigO:
  - { op: "compare", best: "O(n)", avg: "O(n²)", worst: "O(n²)", note: "best case needs the early-exit flag" }
  - { op: "swap",    best: "0",    avg: "O(n²)", worst: "O(n²)" }
  - { op: "space",   avg: "O(1)",  note: "in place, stable" }
related: [dsa/big-o-basics]
prereqs: [dsa/arrays-and-pointers]
griddle: bubble-sort
special: true
flashcards:
  - kind: qa
    q: "When is bubble sort O(n), and what does that require?"
    a: "On already-sorted input, but only if the implementation keeps a 'swapped' flag and exits after a clean pass."
  - kind: cloze
    text: "Bubble sort is {{stable}} and {{in place}}, which is the only reason anyone still mentions it."
sources:
  - { name: "OpenDSA", url: "https://github.com/OpenDSA/OpenDSA", licence: "MIT", note: "Sorting chapter, redrawn" }
```

**Bullets:** Each pass parks one more maximum at the end, so the inner loop shrinks. · The swap count equals the number of inversions — 14 for `[5,3,8,1,9,2,7,4]`. · Never use it in production; do use it to explain what "stable" and "in place" mean. · Insertion sort does the same work with far fewer writes.
**Griddle goldens:** 25 compares, 14 swaps, 5 passes, result `[1,2,3,4,5,7,8,9]` (§6.8).

---

**⑦ `sysdesign/load-balancing` — No. 030 — "Load Balancing"**

```yaml
title: Load Balancing
track: sysdesign
tags: [scaling, availability, routing]
difficulty: 1
minutes: 3
tldr: "One address in front of many servers: spread the work, hide the dead ones, and never become the single point of failure yourself."
diagram: load-balancer
steps: ["Clients on the left, a box marked LB in the middle", "Three app servers behind it", "Health checks mark one server down", "Traffic reroutes to the healthy two"]
related: [sysdesign/caching, sysdesign/consistent-hashing]
prereqs: []
flashcards:
  - kind: qa
    q: "Why does 'sticky sessions' make a load balancer harder to scale?"
    a: "Pinning a user to one server ties state to a machine, so that machine cannot be drained or replaced without losing sessions — externalise the session store instead."
  - kind: cloze
    text: "A layer-4 balancer routes on {{IP and port}}; a layer-7 balancer can route on {{the URL path}}."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Load balancer section, redrawn" }
```

**Bullets:** Algorithms in order of usefulness: least-connections, round-robin, hash-on-key, weighted. · Health checks are the feature — balancing without them just spreads failure evenly. · The balancer itself needs a partner (active/passive with a floating IP or DNS). · TLS termination at the balancer simplifies certificates and complicates debugging.
**Diagram:** `load-balancer.d2` — `client -> lb -> {app1; app2; app3}` compiled with `sketch: true, layout: 'elk'`.

---

**⑧ `sysdesign/caching` — No. 031 — "Caching"**

```yaml
title: Caching
track: sysdesign
tags: [caching, latency, performance]
difficulty: 2
minutes: 3
tldr: "Keep the hot answers close; the hard part is not storing them but knowing when they are wrong."
diagram: cache-aside
steps: ["A client, a cache and a database", "1. Client asks the cache", "2. Miss — read the database", "3. Write the answer into the cache", "4. Next read is a hit"]
bigO:
  - { op: "hit",  avg: "~1 ms",   note: "in-memory, same datacentre" }
  - { op: "miss", avg: "~10 ms+", note: "hit cost plus the database read" }
related: [dsa/hash-tables, sysdesign/consistent-hashing]
prereqs: [sysdesign/load-balancing]
flashcards:
  - kind: qa
    q: "In cache-aside, who writes to the cache and when?"
    a: "The application, after a read miss (and it invalidates or updates the entry on write). The cache never talks to the database itself."
  - kind: cloze
    text: "A {{TTL}} bounds staleness without needing an explicit invalidation for every write."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Cache section, redrawn" }
```

**Bullets:** Patterns: cache-aside (most common), read-through, write-through, write-behind. · Eviction is LRU by default; LFU when popularity is stable; TTL when staleness is the risk. · A "thundering herd" on expiry is fixed with jittered TTLs or a single-flight lock. · The two hard problems are naming things and cache invalidation, and this napkin is only about the second one.

---

**⑨ `sysdesign/consistent-hashing` — No. 037 — "Consistent Hashing"** *(the golden card)*

```yaml
title: Consistent Hashing
track: sysdesign
tags: [caching, sharding, distributed]
difficulty: 2
minutes: 3
tldr: "Hash servers and keys onto a ring; a key belongs to the next server clockwise."
diagram: consistent-hashing
steps: ["Setup", "Hash each server onto the ring", "Hash the key", "Walk clockwise to the next server"]
bigO:
  - { op: "lookup", avg: "O(log n)", note: "binary search over the sorted ring positions" }
  - { op: "keys moved when a node joins", avg: "≈ K/N" }
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
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Consistent hashing, redrawn" }
```

**Bullets:** Only ~K/N keys move when a node joins or leaves. · Virtual nodes fix uneven load by giving each server many ring positions. · Used by DynamoDB, Cassandra and memcached client libraries. · Plain `hash(key) % N` re-maps almost everything when N changes — that is the whole problem it solves.
**This card is the day-1 golden.** Its first flashcard question text is locked (`f40204a7…`); do not reword it. Its diagram is `src/diagrams/consistent-hashing.excalidraw` — the **14-element worked example in §6.1**, animated, with the four steps above; that is the only authoring format that produces `.anim.svg` plus a step sidecar, which the ruler scrubber needs. "See how this was drawn" therefore reveals the **committed Excalidraw element summary** (type, id, stroke, text, in draw order), rendered in mono on `--surface-2`. The `.d2` flavour of that panel is demonstrated by card ⑦ `sysdesign/load-balancing`, which already declares `load-balancer.d2`.

---

**⑩ `ds/bias-variance` — No. 060 — "Bias–Variance"**

```yaml
title: Bias–Variance
track: ds
tags: [generalisation, model-selection, fundamentals]
difficulty: 2
minutes: 3
tldr: "Test error = bias² + variance + noise; the model that fits the training data best is rarely the one that generalises best."
diagram: bias-variance
steps: ["Axes: model complexity across, error up", "Training error falls forever", "Test error falls, then rises", "The gap between them is variance"]
related: [ds/train-val-test, ds/cross-validation]
prereqs: []
flashcards:
  - kind: qa
    q: "You see 2 % training error and 18 % validation error. Bias or variance, and what do you do?"
    a: "Variance (overfitting). Get more data, regularise harder, simplify the model, or add augmentation — not a bigger model."
  - kind: cloze
    text: "Underfitting shows as {{high bias}}: training and validation error are both high and close together."
sources:
  - { name: "Stanford CS229 VIP cheatsheets (Amidi)", url: "https://github.com/afshinea/stanford-cs-229-machine-learning", licence: "MIT", note: "Machine-learning tips and tricks, redrawn" }
```

**Bullets:** Bias is error from wrong assumptions; variance is sensitivity to the particular training sample. · Irreducible noise sets the floor — no model beats it. · More data reduces variance, not bias. · Regularisation deliberately buys bias to sell variance.

### 7.7 The next ten (completes the MVP 20)

`dsa/dynamic-programming` (024) · `sysdesign/sharding` (041) · `sysdesign/quorum-n-r-w` (044) · `sysdesign/message-queues` (048) · `sysdesign/rate-limiting` (052) · `ds/train-val-test` (061) · `ds/gradient-descent` (062) · `ds/logistic-regression` (063) · `ds/precision-recall-roc` (064) · `ds/cross-validation` (065).

That completes the MVP **20**, split **7 DSA** (①②③④⑤⑥ + `dynamic-programming`), **7 system design** (⑦⑧⑨ + `sharding`, `quorum-n-r-w`, `message-queues`, `rate-limiting`) and **6 data science** (⑩ + `train-val-test`, `gradient-descent`, `logistic-regression`, `precision-recall-roc`, `cross-validation`). `dsa/lru-cache` (021) and `sysdesign/hashing` (036) are the first two v1 cards, written when the Griddle work lands — they are **not** part of the MVP count.

Give the quorum napkin the `quorum` griddle (N/R/W sliders, rule `R + W > N`) and the rate-limiting napkin the `token-bucket` griddle — both tracers already have goldens in §6.8.

---

## 8. Platform integration — Capacitor 8 on Android

### 8.1 Setup (local, no Java required)

```bash
npm i @capacitor/core @capacitor/android @capacitor/app @capacitor/haptics \
      @capacitor/share @capacitor/filesystem @capacitor/status-bar @capacitor/splash-screen
npm i -D @capacitor/cli @capacitor/assets
npx cap init Napkin com.rahul.napkin --web-dir dist
npx cap add android          # "Gradle sync failed" without an SDK is expected — ignore it
```

`npx cap add android` only writes files; it needs no Java. **Commit the whole `android/` folder.**

`capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.rahul.napkin',      // C6 — can NEVER change after the first install
  appName: 'Napkin',
  webDir: 'dist',
  android: { webContentsDebuggingEnabled: false, allowMixedContent: false, backgroundColor: '#1E3B38' },
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { launchAutoHide: true, launchFadeOutDuration: 240, backgroundColor: '#1E3B38',
                    showSpinner: false, androidScaleType: 'CENTER_INSIDE' },
    StatusBar: { style: 'DARK', backgroundColor: '#1E3B38', overlaysWebView: true },
  },
};
export default config;
```

### 8.2 Manifest and Gradle edits

`android/app/src/main/AndroidManifest.xml`:
- Add `<uses-permission android:name="android.permission.VIBRATE" />` — the **only** permission.
- **Remove Capacitor's default `<uses-permission android:name="android.permission.INTERNET" />`** so "no network, ever" is enforced by the OS, not by good intentions. (If a future feature needs it, put it back deliberately.)
- On `<application>`: `android:enableOnBackInvokedCallback="true"`.
- On `<activity android:name=".MainActivity">`: keep `android:exported="true"` and `android:launchMode="singleTask"`; add `android:windowSoftInputMode="adjustResize"`; do **not** set `android:screenOrientation`.

`android/app/build.gradle` — paste this over the generated `android { … }` block, keeping the file's `repositories`, `dependencies`, `apply from: 'capacitor.build.gradle'` and the `google-services` try/catch:

```gradle
def ciVersionCode = (project.findProperty('versionCode') ?: '1').toInteger()
def ciVersionName = project.findProperty('versionName') ?: '0.0.0'
def ksFile = System.getenv('ANDROID_KEYSTORE_FILE')

android {
    namespace "com.rahul.napkin"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.rahul.napkin"
        minSdkVersion rootProject.ext.minSdkVersion        // 24
        targetSdkVersion rootProject.ext.targetSdkVersion  // 36
        versionCode ciVersionCode
        versionName ciVersionName
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions { ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~' }
    }
    signingConfigs {
        release {
            if (ksFile) {
                storeFile file(ksFile)
                storeType 'PKCS12'
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
            }
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            if (ksFile) signingConfig signingConfigs.release
        }
    }
}
```

Leave `minSdk 24` / `compileSdk 36` / `targetSdk 36` in `android/variables.gradle` alone — they are the Capacitor 8 defaults and they are correct.

### 8.3 Icons and splash

Put `resources/icon.png` (1024², a cream napkin with a red ballpoint scribble and `37` in Caveat), `resources/icon-foreground.png`, `resources/icon-background.png` (flat `#1E3B38`), `resources/icon-monochrome.png` (the napkin outline only) and `resources/splash.png` in place, then:

```bash
npx capacitor-assets generate --android --iconBackgroundColor '#1E3B38' --splashBackgroundColor '#1E3B38'
```

This is pure Node — no Java. It writes `android/app/src/main/res/mipmap-*` and `public/icons/*`. Commit the output.

### 8.4 Platform adapters — `src/platform/`

Every native call goes through a thin adapter that is a no-op on web. Islands never import a Capacitor plugin directly.

```ts
// haptics.ts
const native = import.meta.env.PUBLIC_PLATFORM === 'android';
export const haptic = {
  async light()     { if (native && await enabled()) (await import('@capacitor/haptics')).Haptics.impact({ style: ImpactStyle.Light }); },
  async medium()    { /* … ImpactStyle.Medium */ },
  async selection() { /* … Haptics.selectionChanged() */ },
  async success()   { /* … Haptics.notification({ type: NotificationType.Success }) */ },
};
// Web never calls navigator.vibrate. `enabled()` reads the House Rules haptics setting.
```

```ts
// share.ts — receipt PNG or backup JSON
export async function shareFile(name: string, blob: Blob, title: string) {
  if (import.meta.env.PUBLIC_PLATFORM === 'android') {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const { uri } = await Filesystem.writeFile({ path: name, data: await toBase64(blob),
                                                 directory: Directory.Cache });
    await Share.share({ title, files: [uri] });
  } else if (navigator.canShare?.({ files: [new File([blob], name)] })) {
    await navigator.share({ title, files: [new File([blob], name)] });
  } else {
    /* fall back to an <a download> click */
  }
}
```

```ts
// back-button.ts — the chain must never dead-end
App.addListener('backButton', ({ canGoBack }) => {
  if (closeTopLayer()) return;          // sticky note → menu → confirm ticket, in that order
  if (canGoBack) history.back();
  else App.exitApp();
});
// Also: App.addListener('appStateChange', ({ isActive }) =>
//   document.querySelectorAll('svg').forEach(s => isActive ? s.unpauseAnimations() : s.pauseAnimations()));
```

### 8.5 Web vs Android differences

| Concern | Web | Android APK |
|---|---|---|
| Assets | served from `/napkin/`, precached by the service worker after one visit | bundled inside the APK at `/`; **offline from first launch** |
| `VITE_BASE_PATH` | `/napkin/` | `/` |
| `VITE_PLATFORM` | `web` | `android` |
| Service worker | registered | **never registered** (a component test asserts the inline script omits `serviceWorker.register`) |
| Haptics | none | `@capacitor/haptics` |
| Share | Web Share API, else a download link | `Filesystem` (Cache) + `Share` |
| Back navigation | browser history | the `backButton` chain, plus predictive back |
| Status bar / splash | `theme_color` in the manifest | `@capacitor/status-bar`, `@capacitor/splash-screen` |
| Install | PWA install prompt / Add to Home screen | sideloaded APK from GitHub Releases |

### 8.6 Device checks that cannot be done on a desktop

Verify each of these on a real phone during Phase 4 and record the result: SMIL playback of an **inline** SVG inside Android System WebView; `setCurrentTime` scrubbing at 60 fps; the 450 ms long-press vs native text selection; haptics with only the `VIBRATE` permission (no prompt should appear); the share sheet receiving the receipt PNG; predictive back honouring the chain; safe-area insets with both gesture and 3-button navigation; system font scale at 130 % and 200 %.

**Known fallbacks if a check fails:** if inline SMIL misbehaves, ship the static SVG and drive the ruler by group opacity (that code path already exists for reduced motion). If `backButton` does not fire under predictive back, set `android:enableOnBackInvokedCallback="false"`. If long-press fights text selection, keep the desktop context-menu path and add an explicit `Highlight` button in the bullet's row.

### 8.7 The optional TWA lane (not part of v1)

A Bubblewrap TWA of the hosted PWA is allowed but loses haptics and native share, and requires `https://ttrahul007.github.io/.well-known/assetlinks.json` — which must live in the **`ttrahul007.github.io` user-site repo**, not in `napkin`. If you ever want it: `npx @bubblewrap/cli init --manifest https://ttrahul007.github.io/napkin/manifest.webmanifest` once locally, commit `twa-manifest.json`, reuse the same keystore secrets, and add a `twa-release.yml`. Capacitor remains the default.

---

## 9. Build order with checkpoints

Effort units: **E** = one evening (~2.5 h), **W** = one weekend day (~6 h). After every step there is a command to run and a thing to verify. **Do not proceed past a red checkpoint.**

### Phase 0 — repo, tooling, CI, live hello world, keystore (≈ 2 E)

| # | Do | Verify |
|---|---|---|
| 0.1 | `node -v` | prints ≥ `v22.12.0`; if not, `winget upgrade OpenJS.NodeJS.LTS` |
| 0.2 | Create the **public** GitHub repo `napkin` (public is required for Pages and unlimited Actions minutes) | repo exists, default branch `main` |
| 0.3 | Scaffold: `npm create astro@latest . -- --template minimal --typescript strict`, then `npx astro add mdx react --yes`, then install the dependency lists from §2.2, then `npx playwright install chromium` | `npm run dev` serves `http://localhost:4321/` |
| 0.4 | Write `astro.config.mjs` (§2.4) and `src/lib/base.ts` | both `npm run build` and `VITE_BASE_PATH=/napkin/ npm run build` succeed; in the second, `dist/index.html` references `/napkin/_astro/…` |
| 0.5 | Tooling: `biome.json` (2-space, single quotes, recommended rules), `vitest.config.ts` (§10.1), `playwright.config.ts` (§10.2), `.gitignore`, `.gitattributes` | `npm run lint` and `npm test -- --run` both exit 0 with one placeholder test |
| 0.6 | Paste `src/styles/tokens.css` (§3.1) verbatim; build a hello-world Counter: the `NAPKIN` wordmark in Caveat on the green formica ground | the page renders a green counter with a cream wordmark |
| 0.7 | `.github/workflows/pages.yml` (§11.1); repo **Settings → Pages → Source = GitHub Actions** | push to `main` → workflow green → `https://ttrahul007.github.io/napkin/` shows the counter |
| 0.8 | Capacitor shell (§8.1–8.2); commit `android/` | `VITE_BASE_PATH=/ npm run build && npx cap sync android` runs clean |
| 0.9 | Keystore: in Git Bash, outside the repo, `openssl req -x509 -newkey rsa:4096 -keyout k.pem -out c.pem -days 10950 -subj "/CN=Napkin"` then `openssl pkcs12 -export -inkey k.pem -in c.pem -name release -out napkin-release.p12`; base64 it; add the four secrets. **Back up the `.p12` and the passphrase before doing anything else** | `openssl pkcs12 -info -in napkin-release.p12 -noout` succeeds; the four secrets exist; the `.b64` file is deleted |
| 0.10 | `.github/workflows/android-release.yml` (§11.3); run it via **workflow_dispatch** | a signed `napkin-0.0.N.apk` artifact appears; it installs on the phone and shows the green counter |

**Phase 0 is done when** hello world is live on Pages *and* installed on the phone from a signed APK, with lint + test + build green in CI.

**Day-1 verifications to run and record now** (these are the claims that were never executed):
`D1-03` run `npm run diagrams` on the `three-shapes` fixture with the jsdom exporter — is the SVG structurally correct despite the `Couldn't transform font-face` noise? If not, flip the default to `playwright`.
`D1-04` does `three-shapes.anim.svg` contain ≥ 3 `<animate>` and play in Chrome?
`D1-05` does an **inline** SMIL SVG play inside Android WebView (Pages URL in Chrome for Android *and* the debug APK)?
`D1-06` did `./gradlew assembleRelease` actually work on `ubuntu-24.04` with Temurin 21?
`D1-11` `npm view @astrojs/mdx@8 peerDependencies` — install exactly what the registry lists.
`D1-13` `curl -I https://ttrahul007.github.io/napkin/_astro/<hash>.css` → 200 (underscore directories served from an Actions artifact).
`D1-15` no `//` appears in any generated link; `/napkin/sw.js` and `/napkin/pagefind/pagefind.js` are 200.
`D1-17` Pagefind resolves under the sub-path with an explicit `basePath`.
`D1-20` tapping a plunger produces a haptic with no permission dialog.

### Phase 1 — design system and skeleton screens (≈ 4 E + 1 W)

**The preview is the spec.** Build `design/preview.html` first (Counter, Menu, Napkin, Order Up at 360 × 780, tokens from §3.1, materials from §3.3, one hand-placed sample diagram, Google Fonts hotlink allowed **in the preview only**), then make the app match it.

1.1 preview.html → *a screenshot shows a dispenser, a pen and green formica.*
1.2 `scripts/subset-fonts.py` over the three Fontsource variable files plus Excalifont → `public/fonts/`; `@font-face` in `global.css` with `font-display: swap`; mono ligatures off → *four woff2 ≤ 130 kB total; the script prints the table and asserts the budget.*
1.3 `materials.css` (§3.3) + `scripts/make-noise.py` → `public/textures/noise-256.webp` ≤ 6 kB → *side by side with the preview, the counter and a blank napkin are indistinguishable at a glance.*
1.4 Object SVGs (§3.6) → *each ≤ 4 kB, uses only `--chrome*`/`--ink`/`--coffee`, renders correctly in both editions.*
1.5 `scripts/rough-icons.mjs` → `public/icons/icons.svg` → *`<use href="…#x">` works and the strokes look pen-drawn.*
1.6 `Base.astro` + `Counter.astro`: folio bar, counter scene, bottom band with Dispenser / Pen / Guest Check plus printed words, `<ClientRouter />`, the pre-paint theme/hour script, safe-area padding → *tab order is folio → content → band; every band object is a `<button>`/`<a>` with a visible label.*
1.7 Skeleton screens with sample data: Menu (a real `<table>`), Napkin, Order Up, Guest Check, Placemat, House Rules, offline, 404 → *all eight routes render; axe reports zero serious/critical; no horizontal scroll at 360 px.*
1.8 Editions and hour bands with the 6 s crossfade (`@property`-registered colours), House Rules toggles wired to `localStorage` → *switching edition never changes `--ink`; contrast spot-checks match §3.1.*
1.9 `motion.css` with the 13 named animations plus the reduced-motion block → *with reduced motion on, nothing travels; fades only.*
1.10 `e2e/visual/screens.spec.ts` baselines at 360 × 780 and 1280 × 800 in both editions → *16 baseline PNGs committed; CI compares at `maxDiffPixelRatio 0.01`.*

### Phase 2 — engine and core features (≈ 2 W + 6 E)

**Content and pipeline**
2.1 `src/content/config.ts` (§5.1), `scripts/lint-licences.mjs` (§7.3), `numbers.json` seeded from §7.5, `number-card.mjs`, `tracks/*.yaml` → *a card with `licence: CC BY-NC-SA 4.0` fails the build naming its path; a card with no number fails `astro build`.*
2.2 Write the first **10 napkins** exactly as specified in §7.6 → *licence lint green; every card ≤ 350 words; `numbers.json` has 10 entries.*
2.3 Draw the 10 diagrams in excalidraw.com using only the five palette strokes, Excalifont, and numbered callouts written first; commit the `.excalidraw` JSON → *every file passes the palette check.*
2.4 `build-diagrams.mjs` static path → *10 static SVGs ≤ 12 kB each in `public/diagrams/`; a second run reports 10 × "cached" in < 1 s.*
2.5 Playwright fallback exporter + the automatic text-less retry → *deleting the `FontFace` stub still yields correct SVGs.*
2.6 Animated variants and steps → *`consistent-hashing.steps.json` lists 4 steps with the captions from the `1.` callouts; the `.anim.svg` plays in Chrome with no JS.*
2.7 `Diagram.astro` inline embed with `<title>`/`<desc>`, static fallback, `IntersectionObserver` pause → *with two napkins on one page, only the visible diagram animates.*
2.8 Ruler scrubber island (§6.7) → *dragging from 0 to the end draws the diagram progressively at ≥ 55 fps on desktop; `ArrowRight` advances one step and updates the caption.*
2.9 Menu and Napkin pages generated from the collection, with prev/next inside the track → *every id resolves; `related` slugs are validated at build.*

**Flashcards**
2.10 Dexie schema, seed, export/import (§5.3, §5.4) → *a fresh profile gets one `cards` row per deck item; re-running seed adds nothing.*
2.11 FSRS engine with unit tests and the committed snapshot (§6.5) → *100 % line coverage on `src/engine/fsrs`; tests run in < 2 s.*
2.12 `build-decks.mjs` and the cloze parser (§6.3, §6.4) → *10 cards → ≥ 20 deck items with the golden ids; the two locked hashes match.*
2.13 Order Up island: queue, flip, four plungers with predicted intervals, ticket rail, bell, empty state, write-failure ticket and retry → *rating 12 cards writes 12 logs and one session; the next card appears ≤ 100 ms after a tap.*
2.14 Receipt (§6.10) → *a 3-card session prints text byte-identical to the golden block.*

**Search, offline, home**
2.15 Pagefind + Guest Check island → *querying `hashing` returns the consistent-hashing napkin first; shards load offline.*
2.16 `build-sw.mjs`, `sw-register.ts`, the update ticket, `offline.astro`, the manifest and icons → *DevTools Offline: every napkin, search and review work; `check-budgets.mjs` reports precache ≤ 10 MB.*
2.17 Counter wired up: resume napkin, due count on the plate via `useLiveQuery`, specials sticky note, mug streak → *a fresh profile shows `Pull one`; after a session the plate updates with no reload.*
2.18 Streak engine and a minimal Placemat (§6.11) → *reviewing on three consecutive `dayKey`s shows streak 3; skipping a day resets it.*

**Griddle**
2.19 Tracer framework, lazy frames, Rough.js renderer with per-element seeds, player store, ruler reuse → *`bubbleSort` on `[5,3,8,1,9,2,7,4]` yields exactly 25 compares, 14 swaps and `[1,2,3,4,5,7,8,9]`.*
2.20 Three griddles: bubble sort, BFS on a grid, the consistent-hash ring (drag a server, vnode stepper) → *each runs at 60 fps on desktop; scrubbing to any frame is instant; captions match §6.8.*

**Phase 2 is done when** the whole one-thumb loop works end to end, offline, with 10 real napkins, engine tests green, three griddles, live on Pages. Write the remaining 10 napkins (§7.7) next — that is the MVP 20.

### Phase 3 — polish, motion, sound (≈ 1 W + 4 E)

3.1 Napkin pull with Motion drag, 1:1 for 80 px, rubber-band × 0.55, thresholds 120 px / 600 px/s, `napkin-pull`, `title-write`, and the tap twin.
3.2 Flip and plunger check mark; `napkin-swap` View Transition; swipe and keyboard shortcuts → *rating by swipe, by key and by plunger all write the identical log.*
3.3 Receipt tear and share → *the shared PNG is 2× with the mono font embedded; the coffee ring appears at today's tier.*
3.4 Highlighter → cloze (§3.5.5, §6.6) → *a highlighted sentence appears in the next queue as a cloze; the desktop context-menu path does the same.*
3.5 Sounds and haptics (§3.7) → *sound is off by default; each of the six events fires once per trigger; muting produces no console errors.*
3.6 Menu polish: filter words, the `86'd` sticker, long-press "add all flashcards to today", desktop prerequisite lines.
3.7 Counter light and edition polish → *no text sits on the blend layer; the 6 s crossfade is imperceptible.*
3.8 Reduced-motion and a11y sweep → *zero serious/critical axe violations; a keyboard-only run of the review loop succeeds.*
3.9 Desktop layout: tri-fold menu, 640 px napkin, right column, `Ctrl/⌘ K` → *nothing overlaps at 1280 px; screenshots updated.*

### Phase 4 — Android packaging (≈ 3 E)

4.1 Plugins wired (§8.4) → *back from a napkin goes to the Menu, then the Counter, then exits; never a dead press.*
4.2 Manifest, permissions, adaptive icon, splash → *the themed icon renders on Android 13+; the splash is `#1E3B38` with no white flash.*
4.3 Share on Android → *sharing the receipt to Keep or WhatsApp attaches the PNG.*
4.4 Device tests — run the full checklist in §10.6 and record the results.
4.5 Release: bump the version, tag `v0.1.0` → *the signed APK installs over `v0.0.N` without an uninstall and keeps Dexie data.*
4.6 Register the free Google **limited-distribution** developer account (no ID, ≤ 20 devices) as insurance for the verification rollout.

### Phase 5 — testing and launch (≈ 1 W)

5.1 Unit coverage: `src/engine` 100 % lines, ≥ 95 % branches; script helpers tested against fixtures.
5.2 E2E: offline walk, 12-card review → receipt → placemat ring, search, highlight, screenshots, axe → *all green on Chromium in ≤ 4 min.*
5.3 Budgets final in CI; a deliberately oversized fixture must fail the workflow.
5.4 CSP with the pre-paint script hash → *no CSP violations on any screen; Pagefind WASM still works.*
5.5 Lighthouse on the Pages URL → *installable, Performance ≥ 95, Accessibility 100, Best Practices 100; report saved.*
5.6 Docs and README Attribution regenerated from `credits.json`; `CHANGELOG.md` started.
5.7 Tag `v1.0.0`; install; pin the Pages URL and the Release link in the README.

### Phase 6 — stretch (ongoing evenings)

Content to 120 napkins, all animated · Anki import of the SDP decks · the remaining ten griddles · "see how this was drawn" on every napkin · share any napkin as PNG · `fsrs-browser` WASM optimiser after ≥ 1 000 reviews · procedural quiz mode (no LLM) · BYO-key LLM helpers that only *rewrite* existing procedural output, keys in WebCrypto AES-GCM, hidden when no key is set · the TWA lane · scrollytelling explainers · Hindi cards with Kalam.

### The weekend MVP path

**Saturday** — 0.1–0.7 (1 h: repo, scaffold, tokens, Pages live) · 1.2 fonts and 1.3 materials, counter/paper/chrome only (1.5 h) · 1.6 layout and 1.7 skeletons for Counter, Menu, Napkin, Order Up, Guest Check, House Rules (2 h; skip the Placemat beyond a streak number) · 2.1 schema, lint, numbers (1 h) · 2.2 + 2.3 write and draw the first ten napkins (the rest of the day — **writing is the long pole; schedule it, do not squeeze it**).

**Sunday** — 2.4 + 2.6 + 2.7 the diagram pipeline (2 h; if the jsdom output is wrong, switch straight to Playwright rather than debugging the stub) · 2.8 the ruler in its simplest form, ticks plus `setCurrentTime` plus captions, no pen art (1 h) · 2.9 Menu and Napkin from the collection (1 h) · 2.10–2.13 Dexie, FSRS with the golden test, decks, Order Up with the four plungers (2.5 h; the receipt can be a plain list for now) · 2.15–2.16 Pagefind, service worker, offline page, budget check (1 h) · push `main`, tag `v0.1.0`, install, and run the loop in airplane mode on Monday's commute.

Nothing in Phases 3–6 forces rework: the tokens, the schema, the ids and the pipeline outputs are final from the MVP onward.

---

## 10. Testing requirements

Nothing is "done" until the tests below exist and pass. Napkin has no network, no keys and no server, which makes it the most deterministic app you will ever test: every golden is a fixed input paired with a fixed output committed to the repo.

**Determinism rules (non-negotiable):** the clock, the RNG (napkin rotation seed, coffee-ring rotation, FSRS fuzz) and `data-hour` are all **injectable**, and every test pins them. `tests/setup.ts` sets `process.env.TZ = 'UTC'`, imports `fake-indexeddb/auto` and `@testing-library/jest-dom/vitest`, and calls `vi.setSystemTime(new Date('2026-09-06T09:41:00Z'))` — 09:41 is the clock printed in every wireframe. Every e2e spec starts with the same preamble from `e2e/_fixtures.ts`: `page.clock.install({ time: '2026-09-06T09:41:00Z' })`, `localStorage['napkin:house-rules'] = {edition:'day', hourPin:'afternoon', sound:false, reduceMotion:'off', newPerDay:10}`, `localStorage['napkin:seed'] = '37'`. **There is no flakiness budget** — a flaky test is a bug in the test.

### 10.1 Unit tests — Vitest, `src/engine/**`

```ts
// vitest.config.ts
import { getViteConfig } from 'astro/config';
export default getViteConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    projects: [
      { extends: true, test: { name: 'unit',      include: ['src/engine/**/*.test.ts'],  environment: 'node' } },
      { extends: true, test: { name: 'component', include: ['src/features/**/*.test.tsx', 'src/components/**/*.test.ts'], environment: 'jsdom' } },
      { extends: true, test: { name: 'build',     include: ['scripts/__tests__/**/*.test.mjs'], environment: 'node', testTimeout: 60_000 } },
    ],
    coverage: { provider: 'v8', include: ['src/engine/**'], thresholds: { lines: 100, branches: 95 } },
  },
});
```

Every golden in §6 gets its own `it()`, written **Given / When / Then**:

- `engine/decks/ids.test.ts` — the two locked sha1 hashes; a cloze card hashes the raw `{{…}}` text.
- `engine/cloze/parse.test.ts` — the segment array, `blanks = 2`, the masked front, `revealUpTo(1)`, and `ClozeSyntaxError` at column 11.
- `engine/fsrs/scheduler.test.ts` — the four invariants, the 12-Good sequence, `toMatchFileSnapshot` against `golden-card.snapshot.json`, seeded-fuzz determinism.
- `engine/fsrs/queue.test.ts` — the queue golden (5 due, 9 new, plate `14 due`); `newPerDay = 0` → plate `5 due`; nothing due and nothing new → plate `Clean`, `isEmpty === true`.
- `engine/progress/streak.test.ts` and `rings.test.ts` — `current 3 / best 3`; ring tiers at 0/1/4/5/19/20; a review at 01:00 IST counting for the local day.
- `engine/receipt/format.test.ts` — the exact 10-line golden with `toBe`; a 32-column property test over 500 random titles; a zero-review session.
- `engine/theme/hour.test.ts` — the six band vectors, the timezone pair, the pin override, `nextBoundary`.
- `engine/viz/*.test.ts` — every row of the §6.8 table, plus fast-check property tests (200 runs).
- `engine/backup/schema.test.ts` — the round trip, the merge rule, the `schema: 2` refusal, byte-stable export ordering.
- `engine/search/index.test.ts` — `pagefindBundlePath()` returns `/napkin/pagefind/` for base `/napkin/` and `/pagefind/` for `/`; result rows keep the base path.
- `engine/attribution/credits.test.ts` — de-duplication by URL, sorting by name, and the rendered line `from System Design Primer, CC BY 4.0`.
- `lib/base.test.ts` — `withBase()` never produces a double slash, for both base values.

### 10.2 Build-script tests — Vitest project `build`

- `build-diagrams.test.mjs` — the full G-DIA fixture assertions from §6.1; both exporters agree (normalising whitespace and id suffixes); an `.excalidraw` carrying a raster file fails with `Raster images are not allowed in napkins`; an out-of-palette colour fails naming the element id; the cache no-op.
- `build-decks.test.mjs` — the fixture content directory produces a deck byte-equal to `tests/fixtures/decks/expected-sysdesign.json`; a duplicate slug fails.
- `build-sw.test.mjs` — a synthetic `dist/` containing `index.html`, `offline/index.html`, `_astro/x.js`, `pagefind/pagefind.js`, `pagefind/index/a.pf_index`, `fonts/Excalifont-Regular.woff2`, `diagrams/three-shapes.anim.svg`, `sounds/sfx.webm` and a 4 MB `videos/big.webm` → `sw.js` exists; the precache contains everything **except** `videos/big.webm` (over 3 MB) and **except** `diagrams/**` (C5); `navigateFallback` is `/napkin/offline/index.html`.
- `check-budgets.test.mjs` — exactly at the budget exits 0; one byte over fails with the file name; `dist/_astro/**` containing `mermaid` or `@excalidraw` fails with `Build-time library leaked into the client bundle`.
- `lint-licences.test.mjs` — `bad-licence.mdx` (`CC BY-NC-ND 4.0`) is rejected with the licence in the message; a banned host is rejected; a card with no sources and `original: false` is rejected; a 400-word card is rejected.

### 10.3 Component tests — Testing Library + jsdom (React islands) and `experimental_AstroContainer` (Astro components)

- **RulerScrubber** — `role="slider"`, `aria-valuemin/max/now`, `aria-valuetext "Step 1 of 3: ring"`; `ArrowRight` moves to step 1, updates the `aria-live` caption and calls `setCurrentTime(0.5)`; tapping tick 3 calls `pauseAnimations` **before** `setCurrentTime(1.0)`; `pointerup` calls `unpauseAnimations`; under reduced motion there are **no** `setCurrentTime` calls and groups beyond the step get `opacity: 0`; the strip is ≥ 44 px tall.
- **Pen (rating mode)** — four buttons named `Again — 1 day`, `Hard — 3 days`, `Good — 12 days`, `Easy — 31 days`, in that DOM order; `Good` fires `onRate('good')` exactly once and holds `data-pressed` for ≥ 90 ms; unarmed → all four `disabled` and `aria-disabled="true"`; keys `1`–`4` only when armed; each plunger's box ≥ 48 × 56.
- **Dispenser** — `due = 7` → plate `7 due`, button named `Review — 7 due`; `due = 0` → `Clean`; `due = null` → `—` and still focusable; a tap fires `onPull()`; a drag to −130 px fires `onPull()`, a drag to −60 px does not and the transform returns to `translateY(0)`; a −40 px flick in 40 ms (> 600 px/s) fires `onPull()`.
- **Highlighter** — a 450 ms long-press on `Virtual nodes fix uneven load by giving each server many ring positions.` fires `onCloze` with `blank === 'many ring positions'`; releasing at 300 ms fires nothing; a second long-press fires `onRemove(id)`; the desktop context menu offers `Highlight`.
- **VizNapkin** — frame 0 shows 8 bars labelled `5 3 8 1 9 2 7 4` and the ruler's `aria-valuemax` is 39 (25 + 14 events); one `Step ▶` gives the caption `compare(0,1) → swap` and marks bars 0 and 1; `Run` at 1× with fake timers ends on `done` with the green check and one `onDone`; the dial halves/doubles the interval; `N = 7` reshuffles deterministically with seed 37; `IntersectionObserver` reporting `false` pauses it; `space`/arrows/`1-2-3` work.
- **GuestCheck** — a mocked Pagefind returns three rows in menu-row format after a 120 ms debounce, with the query echoed in Caveat; empty query shows the hint plus recents; no results shows `Not on the menu. Ask the cook`; `Escape` and `×` both close and return focus to the Search object; `Ctrl/⌘ K` opens it.
- **UpdateTicket** — a `waiting` event renders `NEW NAPKINS — REFRESH` as `role="status"`; `REFRESH` calls `messageSkipWaiting()` and reloads on `controlling`.
- **LightSwitch / HouseRules** — `role="switch"` with `aria-checked`, `Space` toggles, rows ≥ 48 px; `Reset progress` needs a genuine 3 s hold (2.9 s does nothing); the Edition radio writes `data-theme`; the new-cards stepper clamps to 0–50.
- **Astro components via Container** — `Napkin.astro` renders the number in Caveat, the 2 px `--border-strong` rule, the TL;DR at `--text-lg`, the inline `.anim.svg` with `<title>`/`<desc>`, a Big-O `<table>` with `<th scope="col">`, the related scraps and `from System Design Primer, CC BY 4.0`. `MenuPage.astro` is a real `<table>` with a `<caption>` and headers `No. · Napkin · Min · Heat · Done`, and the difficulty cell holds `🌶🌶` **plus** visually-hidden `difficulty 2 of 3`. `Base.astro` with `PUBLIC_PLATFORM=android` contains **no** `serviceWorker.register`; with `web` it registers `${BASE}sw.js`; it always sets `lang="en"` and the pinned `data-hour`.

### 10.4 End-to-end — Playwright

```ts
// playwright.config.ts (essentials)
const BASE = process.env.VITE_BASE_PATH ?? '/napkin/';
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:4321${BASE}`, trace: 'retain-on-failure', reducedMotion: 'no-preference' },
  webServer: { command: 'npm run preview -- --host 0.0.0.0 --port 4321',
               url: `http://localhost:4321${BASE}`, reuseExistingServer: !process.env.CI },
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}{ext}',
  projects: [
    { name: 'desktop', testIgnore: /visual|a11y|offline/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'pixel7',  testIgnore: /visual|a11y|offline/, use: { ...devices['Pixel 7'] } },
    { name: 'visual',  testMatch: /visual\//,  use: { ...devices['Pixel 7'], colorScheme: 'light' } },
    { name: 'a11y',    testMatch: /a11y\//,    use: { ...devices['Desktop Chrome'] } },
    { name: 'offline', testMatch: /offline\//, use: { ...devices['Pixel 7'] } },
  ],
});
```

Required specs:

- **`counter.spec.ts`** — first run shows the wordmark, the clock `09:41`, mug streak `0`, plate `Pull one`, and the four labelled controls; the counter scene root is `aria-hidden="true"` and the controls sit outside it. Tapping the dispenser opens the first special. A seeded resume state shows the napkin rotated by 1.5° (assert the computed transform matrix) and `Continue →` navigates.
- **`menu.spec.ts`** — the ruled table slides in; three track heads show counts equal to the collection sizes; rows are ≥ 48 px; `?tag=caching` filters and `All` restores; a row opens `/sysdesign/consistent-hashing/` with the folio reading `SYSTEM DESIGN` and `n/N`; long-press (or `⋯`) shows `Added 2 cards to today` and `Review` becomes `2 due`; `?tag=nonexistent` shows the pencil note.
- **`napkin.spec.ts`** — title, number, `<title>`/`<desc>` equal to the TL;DR, ruler `aria-valuemax === steps.length − 1`; dragging the ruler to the last tick makes `getCurrentTime()` equal the last `beginMs / 1000` and swaps the caption; a swipe starting 40 px from the edge navigates, one starting 10 px from the edge does **not**; `see how this was drawn` reveals the source in mono on `--surface-2`; a long-press on a bullet draws the `--highlighter` path, adds the `✎` mark, increments `Review`, and survives a reload; pinch-zoom scales the wrapper and shows `Reset zoom`; `page.goBack()` from a napkin lands on the Menu.
- **`review.spec.ts`** — 12 seeded due cards; the rail starts `0/12` with 12 tickets; the question renders in Caveat at ≥ 40 px desktop / 32 px mobile; tapping flips within 400 ms and arms four plungers whose labels equal `preview()` for that card; `Good` writes a log with `rating 3`, draws the `--pen-blue` check, pulls the next card and shows `1/12`; swipe right = Good and left = Again; keys `1`–`4`; the last rating prints the receipt line by line, its text equals `formatReceipt()`, and a coffee ring is stamped for today; tearing produces a PNG blob ≥ 10 kB (with `navigator.share` stubbed) and the Placemat's "Last check" shows the same order number; back mid-session shows the confirm ticket and `Stay` keeps the card; a monkey-patched failing `put` shows `Couldn't write that — try again` and **does not lose the card**.
- **`griddle.spec.ts`** — `/dsa/bubble-sort/` frame 0 shows `5 3 8 1 9 2 7 4`; `Run` at 2× completes within 12 s and shows `done`; `Shuffle` with seed 37 gives the asserted array; on `/sysdesign/consistent-hashing/#griddle` dragging server `D` to 220° gives the caption `2 keys moved` and recolours `k3, k4`; with two visualisers on one page, scrolling the first out of view sets `data-state="paused"`.
- **`search.spec.ts`** — the sticky note rises; typing `hashing` puts the consistent-hashing napkin first; tapping it navigates; closing returns focus to the Search object; `zzzz` shows `Not on the menu`; the second query resolves in < 100 ms.
- **`placemat.spec.ts`** — seeded logs give `streak 3` with rings on 1, 2, 4, 5, 6 September at the right tiers; dragging the mug over 5 Sept shows `5 reviews on 5 September`; tapping a ring opens that day's receipt; `share` captures a PNG blob.
- **`house-rules.spec.ts`** — `After hours` sets `data-theme="night"` and `--bg` computes to `#12211F`; `Auto` plus emulated dark mode does the same; pinning the hour sets `data-hour="late"`; Export downloads a `schema: 1` JSON; importing the fixture updates the Placemat; a `schema: 2` file shows `This backup is from a newer Napkin`; a 3 s hold resets to `Pull one`; the credits card lists every source and the version line equals `PUBLIC_APP_VERSION`.
- **`pwa.spec.ts`** — the manifest has `name "Napkin"`, `display "standalone"`, `start_url` and `scope` equal to the base, `theme_color "#1E3B38"` and a maskable icon; `serviceWorker.ready` resolves; a `workbox-precache` cache exists containing `offline/index.html`, `pagefind/pagefind.js`, all four `.woff2` and `sounds/sfx.webm`.
- **`offline/*.spec.ts`** — after one online load and `serviceWorker.ready`, `context.setOffline(true)` and reload: the Counter renders, `document.fonts.check` confirms the self-hosted faces, the noise texture loads, and House Rules reads `offline ready ✓`. Offline: a precached napkin renders with SMIL advancing; search returns results in < 300 ms; a 3-card review plus receipt writes successfully and updates the placemat; a deep link that was never precached renders the `navigateFallback` napkin with `Back to menu`; a new deployment surfaces the `NEW NAPKINS — REFRESH` ticket and refreshing serves the new content; with sound on, `sfx.webm` plays from cache with no network request.

### 10.5 Visual, a11y and performance gates

**Visual** (Linux baselines only — font rasterisation differs on Windows; generate them in the `visual-baseline` workflow and **only commit a baseline you have eyeballed against `design/preview.html`**). Setup: fixed clock, `await document.fonts.ready`, `animations: 'disabled'`, `caret: 'hide'`, seed 37, `data-hour="afternoon"`.

| Spec | Shots | Threshold |
|---|---|---|
| `visual/screens.spec.ts` | Counter (empty), Counter (resume + 7 due), Menu, Napkin at ruler step 2, Griddle at frame 5, Order Up front, Order Up back with plungers armed, Receipt printed, Guest Check with results, Placemat, House Rules, Not-cached — **× both editions = 24 images** | `maxDiffPixelRatio: 0.01` |
| `visual/desktop.spec.ts` | Counter at 1280 × 800 (tri-fold + right column), Napkin at 640 px | same |
| `visual/objects.spec.ts` | every object and state on `/__gallery/` | `maxDiffPixels: 40` |
| `visual/motion.spec.ts` | `napkin-pull` at 0/240/480 ms and `napkin-flip` at 0/200/380 ms (`page.clock.runFor`) | `maxDiffPixelRatio: 0.03` |

**`visual/tokens.spec.ts`** runs on every platform and is the design contract in code: every token name from §3.1 exists; the computed values match exactly (`--bg #1E3B38`, `--surface #F7F1E3`, `--ink #1B1F2A`, `--accent #C8322B`, `--accent-2 #1F4FA3`, `--success #276E46`, `--warning #E1A62B`, `--danger #B3261E`, `--text-base 1.0625rem`, `--space-5 20px`, `--radius-md 12px`, `--dur-base 240ms`, `--shadow-2 0 6px 14px rgba(0,0,0,0.28)`; night `--bg #12211F`, `--surface #EAE4D6`, `--accent #B52D26`); a 15-line luminance function recomputes every contrast pair in §3.1; `document.fonts.check` passes for all four faces and **no request to `fonts.googleapis.com` or `fonts.gstatic.com` was made** (a same-origin allow-list on `page.on('request')`); every element whose font-family contains Caveat computes to ≥ 24 px and no `<p>/<li>/<td>/<button>` uses it; every counter and interval uses JetBrains Mono; **exactly one** element has `mix-blend-mode: soft-light`; no element uses `backdrop-filter`; the only `<img>` are the noise tile and the icon sprite; napkin rotations are within ±1.5°.

**A11y** — `@axe-core/playwright` with `wcag2a, wcag2aa, wcag21aa, best-practice` on every screen in both editions: **zero serious or critical**. `e2e/a11y/allow.json` is empty at launch and every future entry needs a written reason. Also assert: every `button, a, [role=slider], [role=switch]` has a box ≥ 44 × 44 on `pixel7`; tab order on the Napkin screen is folio → napkin → ruler → bullets → band; no `:focus-visible` computes `outline: none`; with `reducedMotion: 'reduce'` the only animations after a pull are opacity, ≤ 160 ms; at 200 % zoom (emulated 640 × 400) there is no horizontal scroll and the viewport meta has no `maximum-scale`. Manual, once per release: NVDA + Chrome reads the Counter, the Menu, a whole napkin including the Big-O table, and a keyboard-only 3-card review; Windows High Contrast keeps visible borders on the plungers and the ruler.

**Performance — `scripts/check-budgets.mjs` runs inside `npm run build` and fails it:**

| Budget | Limit |
|---|---|
| `dist/` total | ≤ 25 MB |
| Any single file | ≤ 3 MB |
| Workbox precache total | ≤ 10 MB (MVP); raise deliberately with `NAPKIN_PRECACHE_MAX_MB=25` at v1 |
| Fonts (4 × woff2) | ≤ 130 kB total, ≤ 45 kB each |
| Each `public/diagrams/*.svg` | ≤ 40 kB; `*.anim.svg` ≤ 60 kB (warn above 12 kB / 40 kB) |
| Client JS per route, gzipped | ≤ 80 kB; the Counter ≤ 40 kB |
| Largest island chunk, gzipped | ≤ 60 kB |
| Any HTML page, gzipped | ≤ 20 kB |
| `sounds/sfx.webm` + `sfx.mp3` | ≤ 120 kB combined |
| `textures/noise-256.webp` | ≤ 6 kB |
| Forbidden strings in `dist/_astro/**` | `mermaid`, `@excalidraw`, `terrastruct`, `react-dom/server` → 0 hits |
| Pagefind shards | present and ≤ 1.5 MB total |

The script prints its table to `$GITHUB_STEP_SUMMARY`. **Lighthouse** (mobile preset, simulated 4G, on `astro preview`): Performance ≥ 95, LCP ≤ 2.0 s, TBT ≤ 150 ms, CLS ≤ 0.02, Accessibility 100, PWA installable with `start_url` responding offline. **Runtime measurements** (`perf.spec.ts`, advisory on PRs, blocking on tags): the dispenser due count paints ≤ 50 ms after `DOMContentLoaded` with 2 000 seeded cards; the second Pagefind query ≤ 100 ms; bubble sort at 2× has a p95 frame ≤ 20 ms; a napkin page has ≤ 2 long tasks in its first 3 s; `napkin-swap` completes ≤ 600 ms; 30 napkin swaps grow the JS heap by ≤ 15 MB (this catches leaked SMIL nodes and observers).

### 10.6 Android manual checklist — run on a real phone for every `v*` tag, paste into the Release notes

**Install & identity** — A-01 the APK's SHA-256 matches `SHA256SUMS.txt`. A-02 a fresh install prompts for **no** runtime permission. A-03 an update over the previous version installs without an uninstall and keeps all Dexie data. A-04 the adaptive icon is correct and the monochrome/themed icon works on Android 13+. A-05 the splash is `#1E3B38` with a 240 ms fade and no white flash.

**Offline-first** — A-06 airplane mode **before** the first launch: Counter, Menu, an animated napkin, search, a 3-card review and the receipt all work. A-07 `chrome://inspect` shows **no** service worker registered in the WebView. A-08 all four faces render (compare with `design/preview.html`); no system-font fallback on the title or the diagram labels.

**Navigation & gestures** — A-09 the back chain never dead-ends. A-10 predictive back animates and still follows the chain. A-11 the dispenser pull never triggers the system home swipe; horizontal swipes starting < 32 px from an edge do nothing. A-12 pull, flick and tap all open a napkin; a below-threshold pull slides back silently. A-13 pinch-zoom scales the diagram, not the page. A-14 a long-press highlights with **no text-selection handles**.

**Layout** — A-15 edge-to-edge: the status bar is `#1E3B38`/`#12211F` with light icons; the folio bar sits below it; the band sits above the nav inset + 12 px, on both gesture and 3-button nav. A-16 landscape keeps the napkin centred and the plungers un-clipped; rotating mid-review keeps the card and its revealed state. A-17 a ≥ 600 dp screen gets the desktop layout. A-18 system font scale 130 % and 200 %: no horizontal scroll, plungers still ≥ 48 × 56, Caveat never below 24 px. A-19 opening Search pins the input above the keyboard and the note shrinks. A-20 night edition via House Rules and via system dark mode; the status bar follows.

**Motion, sound, haptics** — A-21 inline SMIL plays and the ruler scrubs it without jank. A-22 the bubble-sort griddle at 2× is smooth and only one island animates while scrolling. A-23 all four haptics fire in the right places and the House Rules toggle silences them. A-24 sound is off by default; with the bell on all six sprites play; in silent mode nothing plays, no error ticket appears, and haptics still fire. A-25 the system "Remove animations" setting yields fades, static diagrams, a still-working ruler and a whole receipt. A-26 setting the phone clock to 07:00 shows blinds and 21:00 shows the lamp only; `Pin` overrides; the crossfade never flickers.

**Data & sharing** — A-27 tearing the receipt opens the share sheet with a ≥ 2× PNG. A-28 Export goes through the share sheet; re-importing changes nothing; a foreign JSON shows a `--danger` ticket and loses no data. A-29 killing the app mid-review keeps the rated cards and leaves the unrated one due. A-30 the 3 s reset wipes progress but not content.

**Performance & hygiene** — A-31 cold start to an interactive Counter ≤ 1.5 s, warm ≤ 0.5 s. A-32 thirty minutes of use produces no memory warning and does not hold the screen awake. A-33 zero console errors on Counter, Menu, Napkin and Review (via a `webContentsDebuggingEnabled` debug build). A-34 **zero network requests** during a whole session. A-35 note whether Google's developer-verification flow was needed on this device.

---

## 11. Deployment

Everything below is complete and adapted to this project. Replace `ttrahul007` with the real GitHub username if it differs — it is the only placeholder.

| Target | Mechanism | URL / artifact |
|---|---|---|
| Web (PWA) | GitHub Pages from a custom Actions workflow, sub-path `/napkin/` | `https://ttrahul007.github.io/napkin/` |
| Android | Capacitor 8 APK signed in GitHub Actions, attached to a **draft** Release on every `v*` tag | `napkin-<version>.apk` |
| Backend | none | — |

Repo settings to set **once**: Settings → Pages → Source = **GitHub Actions**. Settings → Environments → `github-pages` → deployment branches = `main` only (do this after the first run creates the environment). Add `LICENSE` = MIT. Workflow permissions stay at the default — each workflow declares its own least-privilege `permissions` block.

### 11.1 `.github/workflows/pages.yml`

```yaml
# Deploy Napkin (Astro 7) to GitHub Pages.
# Prereq: repo Settings -> Pages -> Source = "GitHub Actions".
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0                     # git describe needs tags
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:build
      - name: Build (served from /napkin/; runs astro build, build-sw, pagefind, check-budgets)
        run: npm run build
        env:
          VITE_BASE_PATH: /${{ github.event.repository.name }}/
          VITE_PLATFORM: web
          APP_VERSION: ${{ github.ref_type == 'tag' && github.ref_name || format('main-{0}', github.sha) }}
      - name: Sanity — the files GitHub Pages must serve
        run: |
          test -f dist/index.html
          test -f dist/404.html
          test -f dist/offline/index.html
          test -f dist/sw.js
          test -f dist/manifest.webmanifest
          test -f dist/pagefind/pagefind.js
          test -f dist/.nojekyll
          ! grep -rl 'href="//' dist --include='*.html' | grep . || (echo "double slash in a link"; exit 1)
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-24.04
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Deliberate differences from the shared template:** no `cp dist/index.html dist/404.html` (Astro emits a real `404.html` and Pages serves it natively); `npm test -- --run` split into `test:unit` and `test:build`; `VITE_PLATFORM` and `APP_VERSION` added; the sanity step added. **This workflow never runs `npm run diagrams`** — diagrams are committed (C3) and `npm run build` does not call them (C20) — so it needs neither Playwright nor the 60 MB D2 WASM and finishes in under three minutes. `ci.yml`'s `diagrams-fresh` job is the one place that installs Chromium and regenerates them, and it proves the committed output is not stale.

### 11.2 `.github/workflows/ci.yml` (pull requests and non-main pushes)

```yaml
name: ci
on:
  pull_request:
  push:
    branches-ignore: [main]

jobs:
  checks:
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:licences
      - run: npm test -- --run              # unit + component + build projects, with coverage gates
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: pw-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npx playwright install --with-deps chromium
      - name: diagrams-fresh — committed SVGs must match their sources
        run: |
          npm run diagrams
          git diff --exit-code public/diagrams tests/golden
      - run: npm run build
        env: { VITE_BASE_PATH: /napkin/, VITE_PLATFORM: web, PUBLIC_GALLERY: '1' }
      - run: npm run test:e2e
      - run: npm run test:a11y
      - run: npm run test:visual
      - run: npm run test:offline
      - if: failure()
        uses: actions/upload-artifact@v7
        with: { name: playwright-report, path: playwright-report/, retention-days: 7 }
```

Also add `nightly.yml` (schedule `0 3 * * *`, running `test:offline`, `perf` and Lighthouse against `astro preview`, opening an issue on regression) and `visual-baseline.yml` (`workflow_dispatch` only, running `playwright test --project=visual --update-snapshots` and uploading the PNGs as an artifact for you to eyeball and commit).

### 11.3 `.github/workflows/android-release.yml`

```yaml
name: android-release

on:
  push:
    tags: ['v*']
  workflow_dispatch:        # manual run -> signed APK as a downloadable artifact only (use it on day 1)

permissions:
  contents: write

concurrency:
  group: android-${{ github.ref }}
  cancel-in-progress: true

jobs:
  apk:
    runs-on: ubuntu-24.04   # Android SDK 34-37, build-tools and JDK 8-25 preinstalled
    timeout-minutes: 30
    env:
      VERSION_CODE: ${{ github.run_number }}
      VERSION_NAME: ${{ github.ref_type == 'tag' && github.ref_name || format('0.0.{0}', github.run_number) }}
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with: { node-version: 22, cache: npm }
      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: 21        # Capacitor 8 targets Java 21; the runner default is 17
          cache: gradle
      - name: Build the web app (base "/" because Capacitor serves from https://localhost/)
        run: |
          npm ci
          npm run build
        env:
          VITE_BASE_PATH: /
          VITE_PLATFORM: android
          APP_VERSION: ${{ env.VERSION_NAME }}
      - name: Sync web assets and plugins into android/
        run: npx cap sync android
      - name: Decode the keystore
        env:
          KS_B64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
        run: printf '%s' "$KS_B64" | base64 -d > "$RUNNER_TEMP/release.p12"
      - name: Build the signed release APK
        working-directory: android
        env:
          ANDROID_KEYSTORE_FILE: ${{ runner.temp }}/release.p12
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          chmod +x gradlew
          ./gradlew --no-daemon :app:assembleRelease \
            -PversionCode="$VERSION_CODE" -PversionName="${VERSION_NAME#v}"
      - name: Collect the output (fails loudly if the APK came out unsigned)
        run: |
          mkdir -p out
          cp android/app/build/outputs/apk/release/app-release.apk "out/napkin-${VERSION_NAME#v}.apk"
          (cd out && sha256sum *.apk > SHA256SUMS.txt)
          ls -la out
      - uses: actions/upload-artifact@v7
        with:
          name: apk-${{ env.VERSION_NAME }}
          path: out/
          retention-days: 14
      - name: Attach the APK to a GitHub Release
        if: github.ref_type == 'tag'
        uses: softprops/action-gh-release@v3
        with:
          tag_name: ${{ github.ref_name }}
          draft: true                        # un-draft only after the §10.6 checklist is pasted in
          generate_release_notes: true
          files: |
            out/*.apk
            out/SHA256SUMS.txt
```

**No worker.** Do not copy `worker.yml` or `worker-proxy.ts`; do not create a `worker/` folder; there are no `CLOUDFLARE_*` secrets. Napkin has no secrets at all beyond the four Android signing ones.

### 11.4 Secrets (four, once, ever)

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the single-line base64 of `napkin-release.p12` |
| `ANDROID_KEYSTORE_PASSWORD` | the passphrase you chose |
| `ANDROID_KEY_ALIAS` | `release` |
| `ANDROID_KEY_PASSWORD` | the same passphrase (PKCS12: key password = store password) |

**Back up `napkin-release.p12` and its passphrase into a password manager and an encrypted offline copy before the first release.** GitHub cannot show a secret back to you, and losing this key means every future APK requires a full uninstall — which deletes the learner's data. Delete the `.b64` file after pasting.

### 11.5 First-deploy verification

```bash
U=https://ttrahul007.github.io/napkin
for p in / /404.html /offline/ /sw.js /manifest.webmanifest /pagefind/pagefind.js \
         /sysdesign/consistent-hashing/ /diagrams/consistent-hashing.anim.svg \
         /fonts/Excalifont-Regular.woff2 /.nojekyll; do
  printf '%-45s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$U$p"
done
curl -s "$U/manifest.webmanifest" | grep -o '"start_url":"[^"]*"'    # must be "/napkin/"
curl -s "$U/" | grep -o '_astro/[^"]*\.css' | head -1                 # then curl it → 200
```

Then in Chrome: DevTools → Application → Service Workers shows `sw.js` activated with scope `/napkin/`; Cache Storage has a `workbox-precache-…` entry whose keys start with `/napkin/`; toggle **Offline** and reload → the Counter renders; search for `hashing` → results.

### 11.6 Release checklist (every `v*` tag)

- `main` is green on `ci.yml` and the latest `pages.yml` deploy.
- `npm run diagrams` produced no diff (`git status public/diagrams` is clean); every new card has allowed sources; README Attribution and the House Rules credits were regenerated from `credits.json`.
- No card slug was renamed without a deliberate id migration (renaming orphans review history).
- `CHANGELOG.md` has a section for the version.
- Visual baselines were re-approved by eye against `design/preview.html` if any token or object changed.
- Tag, wait for `android-release`, install the APK over the previous version, run §10.6, paste the checklist into the Release notes, un-draft, and archive the APK plus `SHA256SUMS.txt` locally.

### 11.7 Versioning, rollback, backups

**Versioning.** Tags are SemVer `vMAJOR.MINOR.PATCH`: MAJOR = a Dexie or backup-schema change needing migration; MINOR = new napkins, visualisers or features; PATCH = fixes and content corrections. Android `versionCode` = the workflow run number (strictly increasing, even on re-runs); `versionName` = the tag without the `v`. Never hand-edit either in Gradle. `APP_VERSION` is injected at build and appears in House Rules, in the receipt footer and in every backup file.

**Rollback (web).** Fastest: re-run the last good `pages.yml` run. Proper: `git revert` and push. Because `skipWaiting` is **off**, a broken deploy can never hijack an open session — users only see the refresh ticket; and `cleanupOutdatedCaches` plus the next good deploy heals a corrupted precache with nothing to do on the device.

**Rollback (Android).** `versionCode` only increases, so you cannot reinstall an older APK without an uninstall (which deletes data). Instead revert the code, tag `vX.Y.(Z+1)` and ship a higher `versionCode` carrying the older behaviour. Delete any drafted Release that never passed §10.6, and delete its tag so `versionName` stays honest.

**Backups.** The keystore (password manager **and** an encrypted offline copy). Source, content and diagrams (the public repo plus a monthly `git bundle`). Release APKs and their checksums. Visual baselines, the FSRS snapshot and golden outputs (in git). **Learner data lives only on the device** — House Rules → Export is the only backup, the Placemat shows `Last backup: n days ago` and nags at 14 days. Run the restore drill once after the first release and again after every MAJOR: fresh clone → `npm ci` → `npm run build` → `astro preview` → Import the exported JSON → the same flashcards, streak and rings appear.

---

## 12. Definition of done

Tick every box. Each maps to a measurable success criterion, not a feeling.

**Product**
- [ ] **Airplane-mode complete.** A Playwright test sets `context.setOffline(true)` and walks Counter → Menu → Napkin → Order Up → receipt with zero failures. The APK does the same **from first launch**, before it has ever been online.
- [ ] **Napkin paints fast.** On a mid-range 2022 Android phone, a cold navigation to any napkin shows the title and TL;DR in ≤ 500 ms and the diagram fully drawn in ≤ 1.5 s; the SMIL total is ≤ 5 s and is scrubbable at any point.
- [ ] **One-thumb loop.** Counter → tap the dispenser → first flashcard visible in ≤ 300 ms; tap a plunger → rating persisted and the next card on screen in ≤ 100 ms. The whole loop needs no second hand and no keyboard.
- [ ] **Content volume with provenance.** **20 napkins shipped: 7 DSA, 7 system design, 6 data science** (C23; the §7.6 ten plus the §7.7 ten). Every napkin has ≥ 1 diagram, ≥ 2 flashcards, a Big-O or key-numbers table where applicable, a `sources` list, and ≤ 350 words of prose.
- [ ] **Licence lint is green.** The build fails on any licence outside the §7.2 allow-list, on anything matching NC/ND/SA, on a card with no sources that is not `original: true`, and on any banned host. **Zero** content derives from ByteByteGo, roadmap.sh, VisuAlgo, MIT OCW or CS50.
- [ ] **Bundle discipline.** Precache ≤ 10 MB (`NAPKIN_PRECACHE_MAX_MB`, default 10); each optimised diagram warns above 12 kB raw and hard-fails at 40 kB (`.anim.svg` at 60 kB); the four fonts ≤ 130 kB together; per-page JS ≤ 80 kB gzipped including islands; the Counter ≤ 40 kB. CI fails on any breach.
- [ ] **Accessible by construction.** Every drag, swipe and long-press has a tap or keyboard equivalent; axe reports zero serious or critical violations on all eight screens in both editions; all text is ≥ 4.5:1 on its actual ground; touch targets ≥ 44 × 44 px; `prefers-reduced-motion` yields a static diagram that the ruler still steps through.
- [ ] **The brand rule holds.** A screenshot test of the Counter shows the chrome dispenser, the four-colour pen and the green formica counter.

**Design fidelity — check each against `design/preview.html` side by side**
- [ ] Every token in §3.1 exists with exactly the stated value, in both editions, verified by `visual/tokens.spec.ts`.
- [ ] All four faces load self-hosted; **no request ever reaches `fonts.googleapis.com` or `fonts.gstatic.com`**; Caveat never appears below 24 px and never in body copy; every number that counts is JetBrains Mono.
- [ ] All 13 named animations exist with the stated durations and easings; `plunger-click` is two `steps(1)` frames; ink appears in authoring order; nothing loops except the printing receipt and the drawing diagram.
- [ ] All five signature interactions work with their stated physics: the 80 px 1:1 / × 0.55 rubber band and the 120 px / 600 px/s thresholds; the ruler's pause-scrub-resume; the four plungers with printed intervals; print → tear → share; the 450 ms long-press → cloze.
- [ ] Exactly one `mix-blend-mode` layer; no `backdrop-filter`; one shadow per object; the only rasters are the noise tile and the PWA icons; napkin rotation never exceeds 1.5°.
- [ ] Both editions and all three hour bands render correctly, and switching edition never changes `--ink`.

**Engineering**
- [ ] `src/engine/**` is 100 % line-covered and ≥ 95 % branch-covered; every golden value in §6 is asserted; the FSRS snapshot is committed.
- [ ] The e2e, visual, a11y and offline suites are green on `desktop` and `pixel7`; the whole e2e run takes ≤ 4 minutes.
- [ ] `npm run build` runs the licence lint, the deck build, `astro build`, Pagefind, the service worker and the budget check — in that order — and fails on any breach. It does **not** run `npm run diagrams` (C20); `ci.yml`'s `diagrams-fresh` job proves the committed diagrams are current.
- [ ] `diagrams-fresh` proves the committed SVGs match their sources.
- [ ] The dependency licence gate passes with the single documented `excalidraw-animate` exclusion.
- [ ] No CSP violations on any screen; no third-party request of any kind, at build or at runtime.

**Ship**
- [ ] Live at `https://ttrahul007.github.io/napkin/`, installable as a PWA, Lighthouse Performance ≥ 95 and Accessibility 100.
- [ ] A signed `v1.0.0` APK on GitHub Releases that installs over the previous version without an uninstall and keeps all data.
- [ ] The §10.6 phone checklist is filled in and pasted into the Release notes.
- [ ] README carries the status, both links, and an Attribution section generated from `credits.json` plus `public/sounds/CREDITS.md`.
- [ ] The keystore is backed up in two places and the restore drill has been run once.

---

## 13. Code quality rules

1. **TypeScript strict, everywhere.** `strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride`. **No `any`.** If you need an escape hatch use `unknown` and narrow it. Build scripts are ESM `.mjs` with JSDoc types, checked by `tsc --checkJs` in CI.
2. **Biome is the only linter and formatter.** 2-space indent, single quotes, semicolons, trailing commas, 110-column soft wrap. `biome ci .` runs before the tests and blocks the merge. No ESLint, no Prettier, no `// biome-ignore` without a reason on the same line.
3. **Engine purity is a hard boundary.** Nothing in `src/engine/**` may import React, Astro, Dexie, `window`, `document` or `Date.now()` — time, timezone and randomness are always **parameters**. A CI grep enforces the import ban. This is what makes the goldens possible.
4. **The layers, and which way imports flow.** `engine` → nothing. `db` → `engine` types only. `features` (islands) → `engine`, `db`, `platform`, `components/ui`. `components` (Astro) → `content`, `lib`. `platform` → Capacitor plugins, behind adapters. **Never the other way, never sideways between features.** Two features that need to share state share a Zustand store module, not an import.
5. **Component conventions.** Astro components are the default; a React island exists only where something is genuinely interactive, and it is mounted with `client:visible` unless it must be live before scroll (`client:load` needs a comment justifying it). One component per file, named after the file. Props are a typed `interface Props`. No default exports from `.tsx` except the island entry point. Islands receive **serialisable props only** — never functions, never class instances.
6. **CSS conventions.** Tokens live in `tokens.css` and nowhere else; **no raw hex, px shadow, duration or easing may appear outside that file** (a CI grep enforces this over `src/**/*.css` and `*.astro`). Tailwind utilities read the tokens through `@theme inline`; hand-written CSS carries the materials. Class names are BEM-ish and scoped by component. No `!important`. No `z-index` above 5 — the stack is fixed at 0 counter, 1 rings, 2 paper, 3 objects, 4 overlays, 5 focus rings.
7. **State.** Dexie is the truth for anything persisted; Zustand is UI-only and never mirrors Dexie. Islands subscribe with `useLiveQuery` so the due count, the placemat and the menu rings update across tabs without a refresh. Settings are written to Dexie **and** mirrored to `localStorage` in the same call, because the pre-paint script needs them.
8. **Accessibility is written with the component, not after it.** A new interactive element ships with its role, its accessible name, its keyboard path and its ≥ 44 px box **in the same commit**. A gesture without a tap twin does not get merged.
9. **No dead code.** No commented-out blocks, no `TODO` without an issue number, no unused exports (Biome's `noUnusedImports` and `noUnusedVariables` are errors, not warnings), no feature flags left behind after the feature lands, no orphan files under `src/generated`. Delete it; git remembers.
10. **Errors are visible, never swallowed.** Every `catch` either recovers meaningfully or surfaces an on-screen ticket. `console.error` is allowed for developer context; a silent `catch {}` is not (the only exception is the service-worker registration, which is documented in place).
11. **Tests live beside their source** (`*.test.ts` next to the module, `scripts/__tests__/` for build scripts, `e2e/` for flows). A bug fix ships with the failing test that proves it. **A golden value is never edited to make a test pass** — if a golden changes, that is a deliberate, reviewed, separately-committed decision with a note explaining why.
12. **Commit cadence.** Small, working commits with Conventional Commit prefixes (`feat:`, `fix:`, `content:`, `chore:`, `docs:`, `test:`, `perf:`). Every commit leaves `main` green. Content commits use `content:` and name the napkins added. Never commit `dist/`, `.cache/`, `public/decks/`, a keystore, or a `.env`. **Always** commit `public/diagrams/` and `android/`.
13. **Dependencies.** Exact versions in `package.json`, `npm ci` in CI. Adding a dependency requires: a licence on the allow-list, an active maintenance record, and a one-line justification in the PR description. Anything that would ship a diagram library, an analytics SDK or a font CDN to the client is rejected on sight.
14. **Performance is reviewed like correctness.** Animate `transform` and `opacity` only. `will-change` goes on during a drag and comes off after. One SMIL diagram plays per viewport. No layout thrash in a pointer handler — read once, write once, in a `requestAnimationFrame`. If a change adds more than 5 kB gzipped to any route, say so in the PR.
15. **When in doubt, re-read §1.** If a screenshot of what you just built has no dispenser, no pen and no green formica — or if the body copy has started making jokes — you have drifted. Start that piece over.

