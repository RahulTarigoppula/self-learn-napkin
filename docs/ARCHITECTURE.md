> **Historical planning document.** The shipped app changed direction in October 2026 (modern "Sketchbook" design, story-driven layered napkins, 121 topics, language-agnostic lessons). See [docs/DECISIONS.md](DECISIONS.md), which supersedes this file wherever they differ.

# Napkin — ARCHITECTURE.md

> **Conflicts are resolved in `docs/IMPLEMENTATION-PROMPT.md` §0; that file wins.** This document explains *why* the system is shaped the way it is; the implementation prompt is what you build from.

**Project:** 03 · Napkin · **Date:** 2026-09-06 · **Revised:** 2026-09-08 (aligned with IMPLEMENTATION-PROMPT §0 rulings C1–C23)
**Binding:** `_shared/DECISIONS.md` (D1 Astro exception, D2 GitHub Pages, D3 Capacitor, D5 licences, D6 layout, D7 tokens, D8 row 03), `docs/RESEARCH.md` (versions and verification log), `docs/DESIGN.md` (Corner Booth tokens, screens, motion).

Napkin is a **content pipeline plus a static site**. Almost all of the engineering lives in build scripts (diagrams → SVG, frontmatter → decks and search, dist → service worker); the runtime is HTML, SVG, CSS and five small React islands (ruler scrubber, review session, search note, visualisers, placemat).

---

## 1. Stack

| Layer | Choice | Version | Why (this project) |
|---|---|---|---|
| Framework / SSG | **Astro 7** + `@astrojs/mdx` + content collections | 7.3.1 / 8.0.0 (Node ≥ 22.12) | Pages are 100 % static HTML + inline SVG; islands only where a control is interactive. DECISIONS D1 exception. |
| Islands | **React 19** via `@astrojs/react` (`npx astro add react`) | 19.x | D1/D8 say React islands: same mental model as the other seven apps, Motion's `motion/react`, Testing Library. Preact would save ~40 kB but breaks portfolio consistency; page JS budget still ≤ 80 kB gz because islands are few and `client:visible`. |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first `@theme` mapped to tokens) + hand-written CSS for materials | 4.x | Tokens in `src/styles/tokens.css` are the source of truth (DESIGN §15); Tailwind utilities read them via `@theme inline`. |
| Motion | **Motion 13** (`motion/react` for islands, `motion/dom` `animate()` in vanilla scripts); Astro `<ClientRouter />` (View Transitions) for `napkin-swap` | 13.2.0 | Spring drag for the dispenser pull, layout animation for the pen; GSAP optional only if a timeline is genuinely clearer (D1). |
| Hand-drawn primitives | **Rough.js** | 4.6.6 | Visualiser bars/nodes, bullets, check marks, highlighter swipe, re-rendered Lucide icons — same sketch language as the Excalidraw exports. |
| Diagram authoring | **Excalidraw** JSON (primary), **Mermaid** `look: handDrawn`, **D2** `--sketch` | 0.18.1 / 11.17.2 via rehype-mermaid 3.0.0 / 0.1.33 | All rendered to SVG at build; none reach the client. |
| Diagram animation | **excalidraw-animate** (SMIL injection) | 0.7.2 | Zero-JS animated SVG that plays in Android WebView and can be scrubbed with `setCurrentTime`. |
| SVG optimiser | **svgo** | 4.1.0 | 40–70 % smaller; configured to keep `<animate>`, ids, `font-family`. |
| Search | **Pagefind** (post-build CLI, shards precached) | 1.5.2 | Zero-config full-text over `dist/`, offline once precached, ~100–200 kB lazily loaded. |
| Spaced repetition | **ts-fsrs** (FSRS-6) | 5.4.2 | `fsrs()`, `createEmptyCard()`, `repeat()` preview, `next()` commit. |
| Persistence | **Dexie 4** (IndexedDB) with `liveQuery` | 4.4.5 | Cards, review logs, highlights, sessions, day stats, settings; JSON export/import. |
| UI state | **Zustand 5** (one store module shared by islands on a page) | 5.x | D1. Review session, visualiser player, sticky note open/closed. |
| Offline | **workbox-build** `generateSW` post-build (`scripts/build-sw.mjs`) | 7.4.1 | `@vite-pwa/astro` is not Astro-7 compatible (RESEARCH §8 risk 1); this path is fully verified. |
| Fonts | Fontsource variable: Caveat, Nunito, JetBrains Mono; Excalifont woff2 committed | 5.3.0 packages | OFL, self-hosted, subset with `pyftsubset` (Python 3.14) to ≤ 130 kB total. |
| Icons | **Lucide** re-rendered through Rough.js at build to a sprite | lucide-react latest | ISC; pen-drawn look, no runtime icon library. |
| Sound / haptics | **Howler.js** + `@capacitor/haptics` | 2.x / 8.5.1 | One 6-sprite CC0 sheet; haptics only in the APK. |
| Android | **Capacitor 8** (`@capacitor/android` 8.5.1) + haptics, share, filesystem, status-bar, splash-screen, app | 8.5.1 | `dist/` bundled in the APK → offline from first launch; CI signs with the shared workflow. |
| Hosting | **GitHub Pages** via Actions (D2) at `/napkin/` | — | Astro `base` = `/napkin` (no trailing slash) with `PUBLIC_BASE` = `/napkin/` for runtime URL joins (C2); Astro emits a real `404.html`, so no SPA-fallback trick is needed. |
| Tests / lint | **Vitest** + Testing Library; **Playwright** (e2e, screenshots, axe); **Biome** | latest | D1. |
| Content tooling | Python 3.14: `scripts/subset-fonts.py`, `scripts/import-anki.py`, `scripts/make-noise.py` | stdlib + `fonttools`, `brotli` | Owner already has Python; no new runtimes. |

Rejected for this project (see RESEARCH): Starlight (docs chrome fights the infographic look), MiniSearch (Pagefind's shards need no custom index), `@vite-pwa/astro` (peer range ≤ Astro 5), `excalidraw-to-svg` (stale, pre-Excalifont), vivus (stale; CSS does it), tldraw (not open source), Cloudflare Pages (D2 chooses GitHub Pages; nothing here needs a Worker).

---

## 2. System diagram

```mermaid
flowchart LR
  subgraph Authoring
    A1[src/content/cards/*.mdx<br/>frontmatter + prose] 
    A2[src/diagrams/*.excalidraw<br/>*.mmd · *.d2]
    A3[src/content/tracks/*.yaml<br/>numbers.json]
    A4[Anki .apkg (SDP, CC BY)]
  end
  subgraph Build["npm run build (local or GitHub Actions) — B1 is NOT part of it (C20)"]
    B1[build-diagrams.mjs<br/>jsdom + exportToSvg → animateSvg → svgo → pen-token rewrite<br/>run LOCALLY, output committed to public/diagrams/]
    B2[lint-licences.mjs<br/>allow-list, sources required]
    B3[build-decks.mjs<br/>flashcards → public/decks/*.json (40-hex sha1 ids)]
    B4[astro build<br/>MDX → HTML, inline SVG, islands]
    B5[pagefind --site dist]
    B6[build-sw.mjs<br/>workbox generateSW → dist/sw.js]
    B7[check-budgets.mjs]
    B8[import-anki.py]
  end
  subgraph Runtime["Browser / Android WebView (no network needed)"]
    R1[Static pages: Counter · Menu · Napkin · Placemat · House Rules]
    R2[Islands: RulerScrubber · OrderUp · GuestCheck · Griddle · Placemat]
    R3[(Dexie / IndexedDB<br/>cards · logs · highlights · sessions · days · settings)]
    R4[ts-fsrs engine]
    R5[Service worker precache]
    R6[Capacitor plugins: haptics · share · status-bar · splash · app]
  end
  A2 --> B1 --> B4
  A1 --> B2 --> B4
  A1 --> B3 --> B4
  A3 --> B4
  A4 --> B8 --> B3
  B4 --> B5 --> B6 --> B7
  B7 -->|dist/| GH[GitHub Pages /napkin/]
  B7 -->|dist/ via cap sync| APK[Signed APK on Releases]
  GH --> R5 --> R1
  APK --> R1
  R1 --> R2 --> R4 --> R3
  R2 --> R6
```

---

## 3. Folder layout (D6, adapted for Astro — deviation justified: Astro owns `src/pages`, `src/content`, `src/layouts`)

This tree is identical to IMPLEMENTATION-PROMPT §2.3 — that section is the authority; this copy exists so the rest of this document can refer to paths.

```
napkin/
├── .github/workflows/
│   ├── pages.yml                 # push main → build + deploy (VITE_BASE_PATH, npm run build, no 404 copy)
│   ├── ci.yml                    # PRs: lint, unit, diagrams-fresh, build, e2e, a11y, visual, licences
│   ├── android-release.yml       # tag v* → signed APK (VITE_BASE_PATH=/, VITE_PLATFORM=android)
│   ├── nightly.yml               # optional: 03:00 UTC offline, perf, Lighthouse
│   └── visual-baseline.yml       # optional: manual screenshot regeneration
├── android/                      # Capacitor shell (committed; generated by `npx cap add android`)
├── public/
│   ├── .nojekyll                 # empty file
│   ├── fonts/                    # Excalifont-Regular.woff2 + subset Caveat/Nunito/JetBrains Mono (scripts/subset-fonts.py)
│   ├── textures/noise-256.webp   # ≤ 6 kB, generated
│   ├── sounds/sfx.webm, sfx.mp3, CREDITS.md
│   ├── objects/                  # dispenser.svg pen.svg highlighter.svg mug.svg bell.svg dial.svg printer-edge.svg menu-tab.svg paperclip.svg coffee-ring-{1,2,3}.svg quilt-pattern.svg
│   ├── icons/                    # PWA icons 192/512 + maskable; icons.svg (Rough.js-rendered Lucide sprite)
│   ├── diagrams/                 # GENERATED AND COMMITTED (C3): <name>.svg, <name>.anim.svg, <name>.steps.json
│   └── decks/                    # generated at build, GITIGNORED (C16): dsa.json sysdesign.json ds.json all.json
├── scripts/
│   ├── build-diagrams.mjs        # §5.1
│   ├── harness.ts                # Playwright fallback exporter entry
│   ├── lint-licences.mjs         # §5.8
│   ├── build-decks.mjs           # §5.11
│   ├── build-sw.mjs              # §7
│   ├── check-budgets.mjs         # §11
│   ├── number-card.mjs           # §5.9
│   ├── rough-icons.mjs           # Lucide → Rough.js sprite
│   ├── subset-fonts.py · make-noise.py · import-anki.py
│   └── __tests__/*.test.mjs
├── src/
│   ├── pages/                    # index.astro (Counter) · menu.astro · [track]/[slug].astro (Napkin + Griddle island, C14/C15) · review.astro (Order Up) · placemat.astro · house-rules.astro · offline.astro · 404.astro · __gallery.astro (PUBLIC_GALLERY=1)
│   ├── layouts/                  # Base.astro (html, head, pre-paint script, SW registration) · Counter.astro (counter scene + bottom band) — C17
│   ├── content/
│   │   ├── config.ts             # glob() loader + zod (§4.1, C13)
│   │   ├── cards/{dsa,sysdesign,ds}/*.mdx
│   │   ├── tracks/{dsa,sysdesign,ds}.yaml
│   │   └── numbers.json          # id → napkin number, append-only
│   ├── diagrams/                 # *.excalidraw · *.mmd · *.d2 (sources, committed)
│   ├── data/attribution.json     # committed: per-file Wikimedia Commons licences
│   ├── generated/credits.json    # gitignored, written by lint-licences.mjs — never hand-edited
│   ├── components/
│   │   ├── napkin/               # Napkin.astro NapkinTitle.astro Tldr.astro Diagram.astro BulletList.astro BigOTable.astro RelatedScraps.astro Attribution.astro SourceToggle.astro
│   │   ├── counter/              # Dispenser.astro Pen.astro Mug.astro Bell.astro StickyNote.astro TicketRail.astro MenuEdge.astro FolioBar.astro
│   │   ├── menu/                 # MenuPage.astro MenuRow.astro TrackHead.astro FilterWords.astro PrereqLines.astro
│   │   └── ui/                   # PencilButton.astro LightSwitch.tsx Receipt.tsx CoffeeRing.astro
│   ├── features/                 # React islands (each: index.tsx, store.ts, *.test.tsx)
│   │   ├── scrubber/             # RulerScrubber (§5.3)
│   │   ├── review/               # OrderUp session, PenRating, Receipt (§5.2, §5.5)
│   │   ├── search/               # GuestCheck sticky note over Pagefind
│   │   ├── griddle/              # visualiser player, anchored #griddle on the napkin page (§5.4, C15)
│   │   ├── placemat/             # calendar, arcs, export/import (§5.6)
│   │   ├── highlight/            # long-press → cloze (§5.7)
│   │   └── update-ticket/        # NEW NAPKINS — REFRESH
│   ├── engine/                   # pure TS, 100 % unit-tested
│   │   ├── fsrs/ (scheduler.ts queue.ts) · decks/ids.ts · cloze/parse.ts · progress/ (streak.ts rings.ts)
│   │   ├── receipt/format.ts · theme/hour.ts · search/index.ts · attribution/credits.ts
│   │   ├── backup/schema.ts · scrubber/map.ts
│   │   └── viz/ (types.ts bubble-sort.ts insertion-sort.ts merge-sort.ts binary-search.ts bfs-grid.ts
│   │             lru-cache.ts token-bucket.ts quorum.ts hash-ring.ts fnv1a.ts hash-chaining.ts bst.ts)
│   ├── db/                       # dexie.ts schema (§4.2), migrations.ts, export.ts
│   ├── platform/                 # haptics.ts share.ts back-button.ts sound.ts (Capacitor vs web adapters)
│   ├── lib/base.ts               # the ONLY way to build a URL
│   ├── styles/tokens.css · global.css · materials.css · motion.css
│   └── sw-register.ts            # registers ${BASE}sw.js, update ticket
├── e2e/                          # Playwright: specs, visual/, a11y/, offline/, __screenshots__/linux/, _fixtures.ts
├── tests/                        # setup.ts, fixtures/, golden/
├── design/preview.html
├── docs/                         # GOAL, ARCHITECTURE, PLAN, DESIGN, RESEARCH, TESTING, DEPLOYMENT, IMPLEMENTATION-PROMPT
├── astro.config.mjs · capacitor.config.ts · biome.json · vitest.config.ts · playwright.config.ts
└── .cache/                       # gitignored diagram cache keyed by content hash
```

Gitignored: `dist`, `.cache`, `public/decks`, `src/generated`, `node_modules`, `android/local.properties`, `android/app/build`, `android/.gradle`, `*.p12`, `*.jks`, `*.keystore`, `*.b64`, `.env.local`. **`public/diagrams/` and `android/` are committed.**

`astro.config.mjs` essentials — one env var, `VITE_BASE_PATH` (C1), split into two constants (C2):

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import rehypeMermaid from 'rehype-mermaid';

const rawBase   = process.env.VITE_BASE_PATH ?? '/';                  // '/napkin/' on Pages, '/' for the APK and locally
const base      = rawBase === '/' ? '/' : rawBase.replace(/\/+$/, ''); // Astro wants '/napkin' — no trailing slash
const withSlash = base === '/' ? '/' : `${base}/`;                     // runtime URL joins want '/napkin/'
const platform  = process.env.VITE_PLATFORM ?? 'web';
const version   = process.env.APP_VERSION ?? 'dev';

export default defineConfig({
  site: 'https://ttrahul007.github.io',
  base,
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_astro', inlineStylesheets: 'auto' },
  integrations: [mdx({ rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg', mermaidConfig: { look: 'handDrawn', theme: 'base', themeVariables: { primaryColor: '#F7F1E3', lineColor: '#1B1F2A', fontFamily: 'Excalifont' } } }]] }), react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_PLATFORM':    JSON.stringify(platform),
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version),
      'import.meta.env.PUBLIC_BASE':        JSON.stringify(withSlash),
    },
  },
});
```

---

## 4. Data model

### 4.1 Content (build time, zod-validated)

The frontmatter key is **`licence`** and its values are the eight **human strings** ruled in C12 — not SPDX ids. `CC BY-SA 4.0` is **not** on the list: ShareAlike would infect the whole project, so d2l and friends may be linked from prose but never appear in `sources[]`.

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';                 // C13 — the Content Layer loader, not type: 'content'

export const ALLOWED_LICENCES = [
  'MIT', 'Apache-2.0', 'BSD-2-Clause', 'CC0', 'CC BY 4.0', 'CC BY 2.5', 'Public domain', 'Own work',
] as const;                                           // C12 — exactly these eight, exactly this spelling

const Source = z.object({
  name: z.string(),               // "The System Design Primer"
  url: z.string().url(),
  licence: z.enum(ALLOWED_LICENCES),
  note: z.string().optional(),    // "Consistent hashing, redrawn"
});

const Flashcard = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('qa'), q: z.string().min(8), a: z.string().min(1) }),
  z.object({ kind: z.literal('cloze'), text: z.string().regex(/\{\{[^}]+\}\}/) }),   // "Virtual nodes fix {{uneven load}}"
]);

const BigORow = z.object({ op: z.string(), best: z.string().optional(), avg: z.string(), worst: z.string().optional(), note: z.string().optional() });

export const cards = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/cards' }),   // C13
  schema: z.object({
    title: z.string().max(40),
    track: z.enum(['dsa', 'sysdesign', 'ds']),
    tags: z.array(z.string()).min(1).max(6),
    difficulty: z.number().int().min(1).max(3),      // chillies
    minutes: z.number().int().min(1).max(5),
    tldr: z.string().max(180),
    diagram: z.string().optional(),                  // basename in src/diagrams (no extension) → public/diagrams/<name>.svg
    steps: z.array(z.string()).optional(),           // caption override per step; else derived from "1. " callouts (§5.1)
    bigO: z.array(BigORow).optional(),
    related: z.array(z.string()).max(4).default([]), // slugs
    prereqs: z.array(z.string()).default([]),        // slugs, drawn as dotted lines on the desktop menu
    flashcards: z.array(Flashcard).min(2),
    sources: z.array(Source),
    original: z.boolean().default(false),            // true ⇒ sources may be empty
    special: z.boolean().default(false),             // "Today's specials" sticker
    griddle: z.string().optional(),                  // tracer id in src/engine/viz; renders as an island anchored #griddle (C15)
  }).refine(c => c.original || c.sources.length > 0, { message: 'sources required unless original: true' }),
});

export const tracks = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/tracks' }),   // C13
  schema: z.object({
    name: z.string(),                 // "Starters"
    subtitle: z.string(),             // "DSA"
    order: z.array(z.string()),       // card slugs in syllabus order
  }),
});
```

Derived at build:

```ts
export interface DiagramManifest {           // public/diagrams/<name>.steps.json — committed (C3)
  name: string;
  hash: string;                              // sha1 of source file, cache key
  renderer: 'jsdom' | 'playwright' | 'd2' | 'mermaid';
  width: number; height: number;             // viewBox
  elements: number;                          // element <g> count in the SVG
  animated: boolean;
  finishedMs: number;                        // total SMIL duration
  steps: StepInfo[];                         // ≥ 1; step 0 = "setup" when no callout precedes the first element
}
export interface StepInfo { index: number; caption: string; beginMs: number; endMs: number; firstElement: number; lastElement: number; }

export interface DeckItem {                  // public/decks/<track>.json — generated, gitignored, fetched at runtime (C16)
  id: string;                                // FULL 40-char lowercase hex sha1(slug + '|' + question), question RAW (C9)
  slug: string; track: 'dsa' | 'sysdesign' | 'ds'; number: number;
  title: string;                             // for the receipt line
  kind: 'qa' | 'cloze';
  front: string; back: string;               // cloze: front = text with ____ blanks, back = filled text
  source?: { name: string; licence: string };
}
export interface Deck {
  track: string; generatedAt: string; cardCount: number;
  contentHash: string;                       // sha1 of the sorted id list — drives re-seeding
  items: DeckItem[];
}
```

### 4.2 Runtime (Dexie schema, `src/db/dexie.ts`)

```ts
import Dexie, { type Table } from 'dexie';
import type { Card as FsrsCard, ReviewLog as FsrsLog } from 'ts-fsrs';

export interface ReviewCard extends FsrsCard {   // FsrsCard: due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review
  id: string;                  // DeckItem.id, or 'hl-' + sha1 for user clozes
  slug: string; track: string;
  origin: 'deck' | 'highlight';
  orphan: 0 | 1;               // 1 when the deck no longer contains this id (kept, hidden)
  introducedOn?: string;       // dayKey when first shown as new
}
export interface ReviewLogRow extends FsrsLog {  // rating, state, due, stability, difficulty, elapsed_days, last_elapsed_days, scheduled_days, learning_steps, review
  id?: number; cardId: string; sessionId: string; dayKey: string;
}
export interface Highlight { id: string; slug: string; sentence: string; blank: string; createdAt: number; }
export interface Session {
  id: string; startedAt: number; endedAt?: number; dayKey: string;
  lines: { cardId: string; title: string; rating: 1 | 2 | 3 | 4; intervalLabel: string }[];
  receiptNo: number;           // "ORDER #0412" — monotonic
}
export interface DayStat { dayKey: string; reviews: number; newCards: number; napkinsRead: number; }
export interface ReadMark { slug: string; readAt: number; finished: 0 | 1; }
export interface Setting { key: string; value: unknown; }   // sound, haptics, theme ('day'|'night'|'auto'), hourMode ('clock'|'morning'|'afternoon'|'late'), reduceMotion, newPerDay (10), legibleBody, fsrsParams

export class NapkinDB extends Dexie {
  cards!: Table<ReviewCard, string>; logs!: Table<ReviewLogRow, number>; highlights!: Table<Highlight, string>;
  sessions!: Table<Session, string>; days!: Table<DayStat, string>; reads!: Table<ReadMark, string>; settings!: Table<Setting, string>;
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

### 4.3 Visualiser types (`src/engine/viz/types.ts`)

```ts
export type TraceEvent =
  | { t: 'compare'; i: number; j: number }
  | { t: 'swap'; i: number; j: number }
  | { t: 'set'; i: number; v: number }
  | { t: 'mark'; i: number; kind: 'sorted' | 'pivot' | 'current' | 'visited' | 'frontier' | 'path' }
  | { t: 'edge'; from: string; to: string; kind: 'relax' | 'tree' }
  | { t: 'move'; key: string; from: string; to: string }          // consistent hashing
  | { t: 'caption'; text: string }
  | { t: 'done' };
export interface Frame<S> { state: S; caption: string; highlight: number[]; }
export interface Tracer<P, S> { id: string; title: string; defaults: P; init(p: P): S; run(p: P): Generator<TraceEvent>; apply(s: S, e: TraceEvent): S; }
```

---

## 5. Key algorithms

### 5.1 Diagram build pipeline (`scripts/build-diagrams.mjs`)

Inputs: `src/diagrams/<name>.excalidraw | .mmd | .d2`. Outputs: **`public/diagrams/<name>.svg`**, `<name>.anim.svg` (Excalidraw only), `<name>.steps.json` — **committed to git** (C3). Cached in `.cache/diagrams/<hash>/` so unchanged diagrams cost 0 ms.

`npm run diagrams` is **not** part of `npm run build` (C20). You run it locally when a source under `src/diagrams/` changes and commit the result; the only CI job that runs it is `ci.yml`'s `diagrams-fresh`, which installs Chromium and then `git diff --exit-code public/diagrams`. That is what keeps `pages.yml` and `android-release.yml` free of Playwright and the 60 MB D2 WASM.

**Authoring rules (enforced by the script):**
1. Use only Excalidraw's five default stroke colours (`#1e1e1e` black, `#e03131` red, `#1971c2` blue, `#2f9e44` green, `#f08c00` orange) and the four default fills (`#ffc9c9`, `#a5d8ff`, `#b2f2bb`, `#ffec99`) plus transparent. Any other colour fails the build with the element id.
2. Font = Excalifont (fontFamily 5 in 0.18) for every text element.
3. Draw in narrative order. A **step** begins with a text element matching `/^(\d+)\.\s+(.+)/` ("1. Hash servers onto the ring"); write the callout *first*, then draw what it describes. Elements before "1." are step 0 (the setup). `steps:` in frontmatter overrides captions but not boundaries.

```js
// scripts/build-diagrams.mjs (Node 22, ESM)
import { readdir, readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { optimize } from 'svgo';

const SRC = 'src/diagrams', OUT = 'public/diagrams', CACHE = '.cache/diagrams';
const STROKES = { '#1e1e1e': 'var(--pen-black)', '#e03131': 'var(--pen-red)', '#1971c2': 'var(--pen-blue)', '#2f9e44': 'var(--pen-green)', '#f08c00': 'var(--warning)' };
const FILLS   = { '#ffc9c9': 'color-mix(in srgb, var(--pen-red) 18%, var(--surface))', '#a5d8ff': 'color-mix(in srgb, var(--pen-blue) 18%, var(--surface))',
                  '#b2f2bb': 'color-mix(in srgb, var(--pen-green) 18%, var(--surface))', '#ffec99': 'var(--highlighter)', '#ffffff': 'var(--surface)' };
const PALETTE = { ...STROKES, ...FILLS };

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const w = dom.window;
  for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'DOMParser', 'XMLSerializer', 'Image', 'Path2D', 'getComputedStyle']) globalThis[k] = w[k];
  // excalidraw#10604: under jsdom FontFace.unicodeRange is undefined and the font-face → css transform throws per font.
  globalThis.FontFace = class { constructor(family, src, d = {}) { Object.assign(this, { family, src, unicodeRange: d.unicodeRange ?? 'U+0-10FFFF', status: 'loaded' }); } load() { return Promise.resolve(this); } };
  w.document.fonts = { add() {}, delete() {}, check: () => true, load: async () => [], ready: Promise.resolve(), [Symbol.iterator]: function* () {} };
  return dom;
}

const sha1 = (s) => createHash('sha1').update(s).digest('hex');

async function exportExcalidraw(json, { renderer }) {
  const { elements, appState = {}, files = {} } = JSON.parse(json);
  for (const el of elements) {
    for (const c of [el.strokeColor, el.backgroundColor]) {
      if (c && c !== 'transparent' && !PALETTE[c.toLowerCase()]) throw new Error(`element ${el.id}: colour ${c} is not in the napkin palette`);
    }
  }
  let svgText;
  if (renderer === 'playwright') {
    svgText = await exportViaPlaywright(elements, appState, files);            // §5.1.1
  } else {
    const { exportToSvg } = await import('@excalidraw/excalidraw');            // needs the DOM installed first
    const svg = await exportToSvg({ elements, appState: { ...appState, exportBackground: false, exportWithDarkMode: false, exportEmbedScene: false }, files, exportPadding: 16, skipInliningFonts: true });
    svgText = svg.outerHTML;
  }
  return { elements: elements.filter(e => !e.isDeleted), svgText };
}

function rewritePalette(svgText) {
  return svgText.replace(/#(?:[0-9a-f]{6})\b/gi, (hex) => PALETTE[hex.toLowerCase()] ?? hex)
                .replace(/font-family="[^"]*"/g, 'font-family="var(--font-diagram)"')
                .replace(/<style>[\s\S]*?<\/style>/, '');                       // page CSS supplies Excalifont
}

function deriveSteps(elements, beginTimes, finishedMs, captionsOverride) {
  // one <g> per element in export order; beginTimes[i] is element i's SMIL begin (ms)
  const steps = []; let current = { index: 0, caption: 'Setup', beginMs: 0, firstElement: 0 };
  elements.forEach((el, i) => {
    const m = el.type === 'text' && /^(\d+)\.\s+(.+)/s.exec(el.text ?? '');
    if (m) {
      if (i > 0 || steps.length) { current.lastElement = i - 1; current.endMs = beginTimes[i]; if (current.lastElement >= current.firstElement) steps.push(current); }
      current = { index: steps.length, caption: m[2].trim(), beginMs: beginTimes[i], firstElement: i };
    }
  });
  current.lastElement = elements.length - 1; current.endMs = finishedMs; steps.push(current);
  if (captionsOverride) steps.forEach((s, k) => { if (captionsOverride[k]) s.caption = captionsOverride[k]; });
  return steps;
}

async function animate(svgText, elements) {
  const { animateSvg, getBeginTimeList } = await import('excalidraw-animate');
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const svg = doc.documentElement;
  const { finishedMs } = animateSvg(svg, elements, { startMs: 0 });          // injects <animate> (opacity + path d), fill="freeze"
  const beginTimes = getBeginTimeList(svg);                                   // ms, one per animated element
  [...svg.children].filter(n => n.tagName === 'g').forEach((g, i) => g.setAttribute('data-el', String(i)));
  return { animSvg: new XMLSerializer().serializeToString(svg), finishedMs, beginTimes };
}

const svgoConfig = {
  multipass: true,
  plugins: [{ name: 'preset-default', params: { overrides: { removeUnknownsAndDefaults: false, cleanupIds: false, removeViewBox: false, convertShapeToPath: false, inlineStyles: false } } }],
};

async function buildOne(file, opts) {
  const src = await readFile(path.join(SRC, file), 'utf8');
  const name = path.parse(file).name, ext = path.extname(file);
  const hash = sha1(src + JSON.stringify(opts) + 'v1');
  const cacheDir = path.join(CACHE, hash);
  try { await access(cacheDir); await cp(cacheDir, OUT, { recursive: true }); return `${name}: cached`; } catch {}
  await mkdir(cacheDir, { recursive: true });

  let staticSvg, animSvg, manifest = { name, hash, renderer: opts.renderer, animated: false, steps: [] };
  if (ext === '.excalidraw') {
    const { elements, svgText } = await exportExcalidraw(src, opts);
    staticSvg = rewritePalette(svgText);
    const a = await animate(svgText, elements);                                 // animate the un-rewritten SVG, then rewrite
    animSvg = rewritePalette(a.animSvg);
    manifest = { ...manifest, animated: true, finishedMs: a.finishedMs, elements: elements.length,
                 steps: deriveSteps(elements, a.beginTimes, a.finishedMs, opts.captions?.[name]) };
  } else if (ext === '.d2') {
    const { D2 } = await import('@terrastruct/d2');
    const d2 = new D2(); const r = await d2.compile(src, { layout: 'elk', sketch: true });
    staticSvg = rewritePalette(await d2.render(r.diagram, r.renderOptions)); await d2.dispose();
    manifest.renderer = 'd2';
  } else if (ext === '.mmd') {
    return `${name}: .mmd is rendered inline by rehype-mermaid; nothing to do`;
  }
  const opt = (s) => optimize(s, svgoConfig).data;
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(staticSvg); Object.assign(manifest, { width: +vb[1], height: +vb[2] });
  await mkdir(OUT, { recursive: true });
  const outputs = { [`${name}.svg`]: opt(staticSvg), [`${name}.steps.json`]: JSON.stringify(manifest) };
  if (animSvg) outputs[`${name}.anim.svg`] = opt(animSvg);
  for (const [f, body] of Object.entries(outputs)) { await writeFile(path.join(OUT, f), body); await writeFile(path.join(cacheDir, f), body); }
  return `${name}: built (${(outputs[`${name}.svg`].length / 1024).toFixed(1)} kB static${animSvg ? `, ${(outputs[`${name}.anim.svg`].length / 1024).toFixed(1)} kB anim` : ''})`;
}

const exporter = process.env.NAPKIN_DIAGRAM_EXPORTER ?? 'jsdom';   // 'playwright' when jsdom output is wrong
if (exporter === 'jsdom') installDom();
const captions = JSON.parse(await readFile('.cache/captions.json', 'utf8').catch(() => '{}'));  // written by lint-licences.mjs from frontmatter `steps`
const files = (await readdir(SRC)).filter(f => /\.(excalidraw|d2|mmd)$/.test(f));
for (const f of files) console.log(await buildOne(f, { renderer: exporter, captions }));
```

**5.1.1 Playwright fallback** (`exportViaPlaywright`): esbuild (bundled with Vite) compiles `scripts/harness.ts` (`import { exportToSvg } from '@excalidraw/excalidraw'; window.__export = (e, a, f) => exportToSvg({...}).then(s => s.outerHTML)`) into `.cache/harness.js`; the script launches `chromium.launch()`, `page.setContent('<!doctype html><html><body></body></html>')`, `page.addScriptTag({ path: '.cache/harness.js', type: 'module' })`, then `page.evaluate(([e,a,f]) => window.__export(e,a,f), [...])`. Used when `NAPKIN_DIAGRAM_EXPORTER=playwright` (C1: one name, matching TESTING D1-03 and DEPLOYMENT §8); the script runs jsdom first and re-runs with Playwright automatically if any output SVG lacks a `<text>` element it should have (`elements.some(e => e.type==='text')` but `!/<text/.test(svg)`).

**Worked example.** `consistent-hashing.excalidraw` with 14 elements: ring (ellipse), 3 server rectangles + labels, text "1. Hash each server onto the ring", 3 ticks, text "2. Hash the key", key dot + arrow, text "3. Walk clockwise to the next server", arc arrow. `animateSvg` assigns 500 ms per element → `beginTimes = [0, 500, …, 6500]`, `finishedMs = 7000` (excalidraw-animate caps grouped budgets at 5 s; ungrouped elements simply chain). `deriveSteps` yields: step 0 "Setup" elements 0–3 (0–2000 ms); step 1 "Hash each server onto the ring" elements 4–7 (2000–4000 ms); step 2 "Hash the key" 8–10 (4000–5500 ms); step 3 "Walk clockwise to the next server" 11–13 (5500–7000 ms). The napkin's ruler shows ticks 0 · 1 · 2 · 3.

**Embedding** (`src/components/napkin/Diagram.astro`) — C4: the SVG is **inlined** into the page HTML, read from disk with `readFileSync`, never referenced with `<img>` (CSS custom properties such as `var(--pen-blue)` only resolve inside the document, so an `<img>` would render the diagram uncoloured). This is IMPLEMENTATION-PROMPT §6.1 verbatim:

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
  <div class="diagram__static" hidden set:html={inject(staticSvg)} />   <!-- shown under prefers-reduced-motion by CSS -->
  {manifest.animated && <napkin-scrubber client:visible manifest={JSON.stringify(manifest)} />}
</figure>
```

A missing file throws at build time with the diagram name — which is the intended failure when someone forgets to run `npm run diagrams` and commit the output. Only the diagram inside the viewport plays: an `IntersectionObserver` in `Counter.astro`'s script calls `svg.pauseAnimations()` when a figure leaves the viewport and `unpauseAnimations()` when it enters (RESEARCH §8 risk 12).

### 5.2 FSRS queue (`src/engine/fsrs/scheduler.ts` + `queue.ts`, `src/features/review`)

```ts
import { fsrs, generatorParameters, createEmptyCard, Rating, State, type Grade } from 'ts-fsrs';

/** dayKey is the LOCAL calendar date in the given IANA zone. There is NO rollover hour (C11):
 *  a review at 01:30 counts for the day it happened on. The timezone is a parameter so tests can pin it. */
export function dayKey(d: Date = new Date(), tz = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  return p.format(d);                                     // 'en-CA' formats as YYYY-MM-DD
}

export const scheduler = (params?: Partial<ReturnType<typeof generatorParameters>>) =>
  fsrs(generatorParameters({ request_retention: 0.9, maximum_interval: 365, enable_fuzz: true, ...params }));

/** Reconcile decks with the DB: seed new ids, flag orphans. Runs once per app start (idempotent). */
export async function seed(db: NapkinDB, decks: Deck[]) {
  const ids = new Set(decks.flatMap(d => d.items.map(i => i.id)));
  await db.transaction('rw', db.cards, async () => {
    const existing = new Set((await db.cards.toCollection().primaryKeys()) as string[]);
    const now = new Date();
    const fresh = decks.flatMap(d => d.items.filter(i => !existing.has(i.id)).map(i => ({ ...createEmptyCard(now), id: i.id, slug: i.slug, track: i.track, origin: 'deck' as const, orphan: 0 as const })));
    if (fresh.length) await db.cards.bulkAdd(fresh);
    await db.cards.where('orphan').equals(0).filter(c => c.origin === 'deck' && !ids.has(c.id)).modify({ orphan: 1 });
  });
}

/** Build today's queue: due reviews first (oldest due first), then new cards up to the daily cap, interleaved 1 new per 3 reviews. */
export async function buildQueue(db: NapkinDB, now: Date, newPerDay: number): Promise<ReviewCard[]> {
  const today = dayKey(now);
  const due = await db.cards.where('due').belowOrEqual(now).and(c => c.orphan === 0 && c.state !== State.New).sortBy('due');
  const introduced = await db.cards.where('introducedOn').equals(today).count();
  const fresh = await db.cards.where('state').equals(State.New).and(c => c.orphan === 0).limit(Math.max(0, newPerDay - introduced)).toArray();
  const queue: ReviewCard[] = []; let f = 0;
  due.forEach((c, i) => { queue.push(c); if ((i + 1) % 3 === 0 && f < fresh.length) queue.push(fresh[f++]); });
  while (f < fresh.length) queue.push(fresh[f++]);
  return queue;
}

/** Predicted intervals for the four plungers ("1d · 4d · 12d · 31d"). */
export function preview(card: ReviewCard, now: Date, f = scheduler()) {
  const r = f.repeat(card, now);
  const label = (due: Date) => { const m = Math.round((due.getTime() - now.getTime()) / 60_000);
    return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : m < 43200 ? `${Math.round(m / 1440)}d` : `${(m / 43200).toFixed(1)}mo`; };
  return { again: label(r[Rating.Again].card.due), hard: label(r[Rating.Hard].card.due), good: label(r[Rating.Good].card.due), easy: label(r[Rating.Easy].card.due) };
}

/** Commit a rating: one transaction, never lose the card. */
export async function rate(db: NapkinDB, card: ReviewCard, grade: Grade, sessionId: string, now = new Date(), f = scheduler()) {
  const { card: next, log } = f.next(card, now, grade);
  const today = dayKey(now);
  await db.transaction('rw', db.cards, db.logs, db.days, async () => {
    await db.cards.put({ ...card, ...next, introducedOn: card.introducedOn ?? (card.state === State.New ? today : undefined) });
    await db.logs.add({ ...log, cardId: card.id, sessionId, dayKey: today });
    const d = (await db.days.get(today)) ?? { dayKey: today, reviews: 0, newCards: 0, napkinsRead: 0 };
    await db.days.put({ ...d, reviews: d.reviews + 1, newCards: d.newCards + (card.state === State.New ? 1 : 0) });
  });
  return next;
}
```

Worked example: a new card rated **Good** at 2026-09-06 21:10 → `next.state = Learning`, `scheduled_days = 0`, due in ~10 min (FSRS-6 default learning step); rated Good again the next day → `Review`, due ≈ 4 days; the plunger labels shown before the second tap were `again 1m · hard 6m · good 4d · easy 8d` (fuzz ±).

**Deck ids (C9).** The id is the **full 40-character lowercase hex** of `sha1(id + '|' + question)`, over the **RAW** question text — no lower-casing, no trimming, no whitespace collapsing. Both locked goldens were recomputed under this rule:

| Input string | Expected id |
|---|---|
| `sysdesign/consistent-hashing\|Why does consistent hashing minimise re-mapping when a node joins?` | `f40204a70330cb3e7c3eb3b8c6bca3cefd2f8b13` |
| `dsa/binary-search\|What is the worst-case time complexity of binary search?` | `244084cb5175b111732acee58320bea08bd7a2d8` |

Rewording a question is therefore a new card (intended); so is a capitalisation fix, which is the price of a rule with no normalisation step to get wrong. For a cloze card the "question" half is the raw cloze text **including the `{{…}}` braces**; for a highlight cloze the id is `'hl-' + sha1(slug + '|' + sentence)`, also 40 hex.

**Cloze rendering (C10).** Every blank masks to **exactly four underscores**, whatever the answer's length: `{{uneven load}}` → front `Virtual nodes fix ____ by giving each server ____.`, back = the full text with the answers in `--highlighter`. Fixed-width masks stop the blank from leaking the answer's length. The parser lives in `src/engine/cloze/parse.ts` and returns a segment array, so `maskFront` is `segs.map(s => s.t === 'text' ? s.v : '____').join('')`.

### 5.3 Ruler scrubber (`src/features/scrubber`)

```ts
// x (px within the ruler) ↔ t (ms). Ticks are evenly spaced per step; time inside a step is linear.
export function xToTime(x: number, width: number, steps: StepInfo[]): number {
  const n = steps.length; const seg = width / n; const i = Math.min(n - 1, Math.max(0, Math.floor(x / seg)));
  const frac = Math.min(1, Math.max(0, (x - i * seg) / seg));
  return steps[i].beginMs + frac * (steps[i].endMs - steps[i].beginMs);
}
export function timeToStep(t: number, steps: StepInfo[]): number { return Math.max(0, steps.findLastIndex(s => t >= s.beginMs)); }

// island: pointerdown on ruler or pen → svg.pauseAnimations(); on move → svg.setCurrentTime(xToTime(x)/1000); caption = steps[timeToStep(t)].caption
// pointerup → svg.unpauseAnimations() (playback resumes from the scrubbed time). Tap a tick k → setCurrentTime(steps[k].beginMs/1000) and pause.
// reduced motion: the static SVG is shown; stepping sets  g[data-el] { opacity: 0 }  for elements > steps[k].lastElement via a CSS rule written to a <style> element.
// a11y: role="slider" aria-valuemin=0 aria-valuemax=n-1 aria-valuenow=k (all 0-based, matching the printed tick numerals).
// ONE aria-valuetext template (C21), 1-based and identical to the printed caption:
//   aria-valuetext = `Step ${k + 1} of ${n}: ${steps[k].caption}`   →  "Step 3 of 4: Hash the key" on the golden card.
```

Sound/haptic on step change (`selectionChanged`) is debounced to one per step index change.

### 5.4 Visualiser tracers (`src/engine/viz`, `src/features/griddle`)

Every Griddle is `(params) → Generator<TraceEvent>` plus a pure reducer; the island materialises frames lazily (`frames[k]` computed by replaying events up to k, memoised) so scrubbing is O(1) after the first pass. Rendering uses Rough.js with a **fixed seed per element** so the sketchy strokes do not jitter between frames.

```ts
// bubble sort
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
// caption per event: compare → `compare(${i},${j})`, swap → `swap(${i},${j})`, mark → `${i} is in place`, done → `sorted in ${swaps} swaps`
```

```ts
// consistent-hash ring (src/engine/viz/hash-ring.ts) — FNV-1a 32-bit → degrees
export function fnv1a(s: string): number { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
export const angle = (s: string) => (fnv1a(s) / 2 ** 32) * 360;
export interface Ring { nodes: { id: string; angle: number; vnode: number }[]; }   // sorted by angle
export function makeRing(servers: string[], vnodes = 1): Ring {
  return { nodes: servers.flatMap(s => Array.from({ length: vnodes }, (_, v) => ({ id: s, vnode: v, angle: angle(vnodes === 1 ? s : `${s}#${v}`) }))).sort((a, b) => a.angle - b.angle) };
}
export function owner(ring: Ring, key: string): string { const a = angle(key); return (ring.nodes.find(n => n.angle >= a) ?? ring.nodes[0]).id; }
export function* addServer(ring: Ring, keys: string[], server: string, vnodes = 1): Generator<TraceEvent> {
  const before = Object.fromEntries(keys.map(k => [k, owner(ring, k)]));
  const after = makeRing([...new Set(ring.nodes.map(n => n.id)), server], vnodes);
  yield { t: 'caption', text: `add ${server} at ${angle(server).toFixed(0)}°` };
  for (const k of keys) { const o = owner(after, k); if (o !== before[k]) yield { t: 'move', key: k, from: before[k], to: o }; }
  yield { t: 'caption', text: `${keys.filter(k => owner(after, k) !== before[k]).length} of ${keys.length} keys moved (≈ K/N)` };
  yield { t: 'done' };
}
```

Worked example (no virtual nodes): servers A/B/C hash to 40°, 160°, 300°; keys k1…k12 spread around the ring. Adding D at 200° moves only keys with angles in (160°, 200°] from C to D — with 12 keys that is typically 1–2 keys, and the caption reads `2 of 12 keys moved (≈ K/N)`. The Griddle lets the learner drag D around the ring and watch the count change; setting vnodes = 8 evens the arcs.

Other MVP/v1 tracers follow the same shape: `insertion-sort`, `merge-sort` (events on a working array with `set`), `quick-sort` (`mark pivot`), `binary-search` (`compare` + `mark current`), `bfs-grid` / `dfs-grid` (`mark frontier/visited/path`), `dijkstra` (`edge relax/tree`), `bst-insert`, `hash-chaining` (load-factor slider), `lru-cache`, `token-bucket` (tick events), `quorum` (N/R/W sliders → `caption` on consistency).

### 5.5 Receipt (`src/engine/receipt/format.ts`)

**The receipt has exactly one layout, and it is defined in IMPLEMENTATION-PROMPT §6.10** (C19). That section carries the two padding helpers and the ten-line golden that `format.test.ts` asserts with `toBe`; `design/preview.html` renders the same lines, and TESTING §4 G-RECEIPT restates the same block. Do not invent a `REVIEWS`, `ACCURACY` or `AGAIN/HARD/GOOD/EASY` row here — a session that printed one would fail both the `toBe` golden and the 32-column property test.

The rule in one paragraph: the sheet is **32 columns**, uppercase, JetBrains Mono. Item rows are `(trunc(title, 20) + ' ').padEnd(31, '.') + ' ' + value`, where `value` is the 9-column `RATING.padEnd(5) + ' ' + `${days}d`.padStart(3)`. Total rows are `label.padEnd(18) + value.padStart(14)`. Item rows, total rows and the two dashed rules are exactly 32 columns; the header, timestamp and footer lines are shorter. Truncation with `…` is what keeps the value column from shifting.

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

PNG export: the receipt is an inline `<svg>` (JetBrains Mono text, `--receipt` ground, jagged `clip-path`); `share.ts` serialises it, draws it on a 2× canvas via `new Image()` + `Blob` URL, `canvas.toBlob('image/png')`, then `navigator.share({ files })` on web or `Filesystem.writeFile({ directory: Cache })` + `Share.share({ files: [uri] })` on Android. Fonts must be embedded as `@font-face` with a data URI inside the exported SVG (only for the share path; `subset-fonts.py` also emits a `receipt-mono.b64.txt` for this).

### 5.6 Streaks and coffee rings (`src/engine/progress/streak.ts`, `rings.ts`)

```ts
export function streak(days: DayStat[], today = dayKey()): { current: number; best: number } {
  const set = new Set(days.filter(d => d.reviews > 0 || d.napkinsRead > 0).map(d => d.dayKey));
  const prev = (k: string) => { const t = new Date(k + 'T12:00:00'); t.setDate(t.getDate() - 1); return t.toISOString().slice(0, 10); };
  let cur = 0, k = set.has(today) ? today : prev(today);           // an unbroken streak may still be alive if today has no activity yet
  while (set.has(k)) { cur++; k = prev(k); }
  let best = 0; for (const start of set) { if (set.has(prev(start))) continue; let n = 0, q = start; const next = (s: string) => { const t = new Date(s + 'T12:00:00'); t.setDate(t.getDate() + 1); return t.toISOString().slice(0, 10); }; while (set.has(q)) { n++; q = next(q); } best = Math.max(best, n); }
  return { current: cur, best };
}
export const ringTier = (reviews: number) => reviews >= 20 ? 3 : reviews >= 5 ? 2 : reviews >= 1 ? 1 : 0;   // opacity .60 / .48 / .35
export const ringRotation = (key: string) => (fnv1a(key) % 360);                                             // seeded by date
```

### 5.7 Highlighter → cloze (`src/engine/cloze/pick-blank.ts`)

```ts
const STOP = new Set(['the','a','an','of','to','in','on','by','for','is','are','and','or','with','each','its','this','that','as','at','from','it','be']);
export function pickBlank(sentence: string, hints: string[]): { blank: string; start: number; end: number } {
  const tokens = [...sentence.matchAll(/[A-Za-z0-9()\-/]+/g)].map(m => ({ w: m[0], s: m.index!, e: m.index! + m[0].length }));
  let best = { score: -1, i: 0, j: 0 };
  for (let i = 0; i < tokens.length; i++) for (let len = 1; len <= 3 && i + len <= tokens.length; len++) {
    const span = tokens.slice(i, i + len); if (span.some(t => STOP.has(t.w.toLowerCase()))) continue;
    const text = span.map(t => t.w).join(' ').toLowerCase();
    let score = text.length;
    if (hints.some(h => text.includes(h.toLowerCase()))) score += 6;                  // matches a tag or title word
    if (/[A-Z0-9]/.test(span.map(t => t.w).join(''))) score += 3;                     // proper noun, acronym, number, Big-O
    if (i === 0) score -= 2;                                                          // don't blank the subject by default
    if (score > best.score) best = { score, i, j: i + len - 1 };
  }
  const s = tokens[best.i].s, e = tokens[best.j].e;
  return { blank: sentence.slice(s, e), start: s, end: e };
}
```

Worked example: sentence "Virtual nodes fix uneven load by giving each server many ring positions.", hints `['consistent','hashing','caching','sharding']`. Candidates and scores: "Virtual nodes" 13 + 3 (capital) − 2 (first) = 14; "uneven load" 11; "ring positions" 14; "many ring positions" 19 → chosen. The user can tap the blank to shift it left/right by one token before saving (`Highlight.blank` is editable). The card id is `'hl-' + sha1(slug + '|' + sentence)` — full 40 hex, like every other deck id (C9).

### 5.8 Licence lint (`scripts/lint-licences.mjs`)

Reads every `src/content/cards/**/*.mdx` frontmatter with `gray-matter`-style parsing (Astro's zod runs later; this runs first so failures are fast and readable), and fails if: a `licence` value is not one of the eight strings in `ALLOWED_LICENCES` (§4.1); a licence string matches `/NC|ND|SA/i` — which is why `CC BY-SA 4.0` is rejected, not merely flagged (C12); `sources` is empty and `original` is false; a `url` host is in the banned list (`bytebytego.com`, `github.com/ByteByteGoHq`, `roadmap.sh`, `github.com/kamranahmedse/developer-roadmap`, `visualgo.net`, `ocw.mit.edu`, `cs50.harvard.edu`). It also writes `.cache/captions.json` (`{ diagramName: steps[] }`) for the diagram script, and `src/generated/credits.json` (deduplicated sources for the House Rules credits card and README) — generated, gitignored, never hand-edited.

### 5.9 Napkin numbers (`scripts/number-card.mjs`, `src/content/numbers.json`)

Numbers are identity, so they never shift. `numbers.json` is an append-only map `{ "big-o-basics": 1, "arrays-and-pointers": 2, … }`. `npm run number -- consistent-hashing` assigns `max + 1`. `astro build` fails if any card slug lacks a number or a number is duplicated. Tracks order cards independently of number (the Menu shows `037 Consistent hashing` under Mains even though 037 was minted after 112 if that is how it happened).

### 5.10 Counter light and edition (`src/engine/hour.ts`, inline pre-paint script)

```ts
/** The `late` band wraps midnight, so it MUST be tested first (C18).
 *  20:00–05:59 late · 06:00–11:59 morning · 12:00–19:59 afternoon.
 *  Golden vectors: 00:00 late, 05:59 late, 06:00 morning, 11:59 morning,
 *  12:00 afternoon, 19:59 afternoon, 20:00 late, 23:59 late. */
export const hourBand = (h: number): 'late' | 'morning' | 'afternoon' =>
  h >= 20 || h < 6 ? 'late' : h < 12 ? 'morning' : 'afternoon';
// <head> is:inline script (runs before paint, no flash): read localStorage 'napkin:theme' ('day'|'night'|'auto') and 'napkin:hour' ('clock'|band);
// set document.documentElement.dataset.theme (omit for auto → prefers-color-scheme) and dataset.hour; a 60 s interval re-evaluates hourBand.
// The 6 s crossfade is CSS: transition on --lamp and --bg via @property registration (DESIGN §7 #12).
```

### 5.11 Deck build (`scripts/build-decks.mjs`)

For every card: `flashcards[]` → `DeckItem` with `id = sha1(id + '|' + question)` (full 40 hex, RAW question text — C9), `front/back` per kind, `number` and `title` from the collection and `numbers.json`, `source` = first source. Output `public/decks/{dsa,sysdesign,ds}.json` and `all.json` — **generated, gitignored, and fetched at runtime** with `withBase('decks/all.json')` (C16), not imported into the JS bundle. The file is precached by the service worker so it works offline, and its `contentHash` (sha1 of the sorted id list) is what drives re-seeding: the app compares it with `settings.deckHash` and only adds ids it has never seen.

`scripts/import-anki.py` (Python stdlib `zipfile` + `sqlite3`) converts `system-design-primer/resources/flash_cards/*.apkg` into `src/content/decks-extra/sdp.json` with `source: { name: 'The System Design Primer', licence: 'CC BY 4.0' }`; HTML fields are tag-stripped; items are merged by the same id rule.

---

## 6. State management

- **Persisted:** Dexie tables (§4.2) are the truth for progress and settings. Islands subscribe with `useLiveQuery` (`dexie-react-hooks`) so the dispenser count, placemat and menu rings update across tabs.
- **UI:** one Zustand store module per feature (`features/review/store.ts`: queue, index, revealed, sessionId, pendingWrite; `features/griddle/store.ts`: frames, k, playing, speed; `features/search/store.ts`: open, query). Astro shares module instances between islands on the same page, so the Pen island and the OrderUp island read the same store.
- **Settings pre-paint:** `theme`, `hour`, `reduceMotion`, `legibleBody` are mirrored to `localStorage` on write so the inline head script can set `data-*` attributes before first paint.
- **Navigation:** Astro `<ClientRouter />` gives client-side navigation and `view-transition-name: napkin` for `napkin-swap`; page state does not need to survive navigation because everything is in Dexie or derived from the URL. The `Counter.astro` script re-runs on `astro:page-load`.

---

## 7. Offline / PWA strategy

- **Web:** `scripts/build-sw.mjs`:

The full script is IMPLEMENTATION-PROMPT §6.12; the shape is:

```js
import { generateSW } from 'workbox-build';
const base = (process.env.VITE_BASE_PATH ?? '/').replace(/\/?$/, '/');   // C1; always a trailing slash here
const { count, size, warnings } = await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,svg,woff2,json,webp,webm,mp3,webmanifest,wasm,pf_index,pf_fragment,pf_meta}'],
  globIgnores: ['diagrams/**', 'videos/**', 'sw.js', 'workbox-*.js', '**/*.map'],  // C5: diagrams are inlined in the HTML
  swDest: 'dist/sw.js',
  navigateFallback: `${base}offline/index.html`,
  navigateFallbackDenylist: [/\/pagefind\//],
  skipWaiting: false, clientsClaim: true,              // the update ticket decides when to swap
  cleanupOutdatedCaches: true,
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  runtimeCaching: [{ urlPattern: /\/videos\//, handler: 'CacheFirst', options: { cacheName: 'napkin-videos', expiration: { maxEntries: 20 } } }],
});
warnings.forEach(w => console.warn('[sw]', w));
console.log(`[sw] precached ${count} files, ${(size / 1024 / 1024).toFixed(2)} MB`);
const maxMb = Number(process.env.NAPKIN_PRECACHE_MAX_MB ?? 10);   // 25 at v1, set deliberately in the workflow
if (size > maxMb * 1024 * 1024) { console.error(`[sw] precache exceeds the ${maxMb} MB budget`); process.exit(1); }
```

`public/diagrams/**` is **excluded** from the precache (C5): every diagram is already inlined into its napkin's HTML by `Diagram.astro`, so precaching the files again would double the bytes for nothing. They still ship in `dist/` for the day-1 `curl` check and for share-as-PNG debugging. Pagefind runs **before** this script in `npm run build`, so the search shards are in the manifest and search works offline.

  `src/sw-register.ts` registers `${BASE}sw.js` (from `src/lib/base.ts`, C2), listens for `updatefound` → `installed` with an active controller → shows the `NEW NAPKINS — REFRESH` ticket; tapping posts `{type:'SKIP_WAITING'}` (workbox handles it) and reloads on `controllerchange`. The footer shows `__NAPKIN_VERSION__` (git short SHA injected by Vite `define`).
- **Not cached yet:** `src/pages/offline.astro` renders the lone-napkin message (DESIGN §9.9). Astro's `404.astro` is the real 404 on Pages.
- **Android:** the APK bundles `dist/` built with `VITE_BASE_PATH=/` and `VITE_PLATFORM=android`; `Base.astro` skips service-worker registration entirely in that build (A-07 asserts no SW in the WebView), and nothing depends on one — every asset is in the bundle.
- **Budget guard:** `check-budgets.mjs` fails if any file > 3 MB, fonts > 130 kB, or any page's JS > 80 kB gz (Counter ≤ 40 kB). The precache ceiling is enforced by `build-sw.mjs` itself: `NAPKIN_PRECACHE_MAX_MB`, default **10** at MVP, raised to **25** at v1 by setting the variable in the workflow.

---

## 8. Android integration points (Capacitor 8)

`capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.rahul.napkin',                  // C6 — can NEVER change after the first install
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

| Concern | Implementation |
|---|---|
| Plugins | `@capacitor/haptics` (impact Light/Medium, selectionChanged, notification Success — DESIGN §12), `@capacitor/share` + `@capacitor/filesystem` (receipt PNG), `@capacitor/status-bar` (`--bg` colour, light icons), `@capacitor/splash-screen`, `@capacitor/app` (back button, `appStateChange` to pause SMIL) |
| Permissions | **`android.permission.VIBRATE` only.** Capacitor's default `android.permission.INTERNET` is **removed** from `AndroidManifest.xml`, so "no network, ever" is enforced by the OS rather than by good intentions — this is what A-02 (no runtime permission prompt) and A-34 (zero network requests) actually verify. Restoring INTERNET is a deliberate, reviewed change: it would be needed only if the optional TWA lane (§11 of DEPLOYMENT) or a future link-out feature ships, and it must be argued for in the PR. |
| Manifest | `android:windowSoftInputMode="adjustResize"` (search input above keyboard), `android:enableOnBackInvokedCallback="true"` (predictive back), `android:supportsRtl` unchanged; adaptive icon fg/bg/monochrome per DESIGN §14 |
| Back button | `platform/back-button.ts`: `App.addListener('backButton', ({ canGoBack }) => { if (closeTopLayer()) return; if (canGoBack) history.back(); else App.exitApp(); })` where `closeTopLayer()` closes sticky note → menu → confirm ticket in that order |
| Safe areas | `env(safe-area-inset-*)` on the folio bar and bottom band; edge-to-edge enabled by the Capacitor 8 template |
| Gradle | `_shared/templates/app-build.gradle.snippet` merged into `android/app/build.gradle` (`namespace`/`applicationId = com.rahul.napkin`, env-driven signing); `minSdk 24`, `compileSdk 36` from `android/variables.gradle` (Capacitor 8 defaults) |
| CI | `_shared/templates/android-release.yml` with the build step run as `VITE_BASE_PATH=/ VITE_PLATFORM=android npm run build`; keystore from `_shared/scripts/make-keystore.sh napkin`. It never runs `npm run diagrams` (C20). |
| Native code | none. TWA (Bubblewrap) is an optional Phase 6 lane; it needs `assetlinks.json` in the `<user>.github.io` root repo (HOSTING.md gotcha 17). |

Device checks that cannot be done on the desktop (PLAN Phase 4): SMIL playback inside the WebView for inline SVG; `setCurrentTime` scrubbing at 60 fps; long-press vs text selection; haptics; share sheet; predictive back.

---

## 9. Third-party APIs

**None at build or run time.** No endpoints, keys, rate limits or CORS concerns. Attribution obligations are for bundled *content* (README, per-napkin footer, House Rules credits), not for APIs. Optional Someday LLM helpers would follow D4 rung 2 (user's own Gemini / OpenRouter / Groq key, browser → provider, key in WebCrypto AES-GCM, CSP `connect-src` allow-list) and are not part of this architecture until scheduled.

---

## 10. Security and privacy

- No accounts, no telemetry, no analytics, no third-party requests (fonts self-hosted; Pagefind and sounds are same-origin).
- CSP (Phase 5, `<meta http-equiv="Content-Security-Policy">` in `Counter.astro`): `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval' 'sha256-<hash of the pre-paint script>'; connect-src 'self'; frame-ancestors 'none'`. Pagefind needs `wasm-unsafe-eval`.
- User data: IndexedDB only; export = one JSON file (`{ version, cards, logs, highlights, sessions, days, settings }`) validated with zod on import; "Reset progress" is a 3 s hold-to-confirm.
- Content provenance is enforced by the licence lint (§5.8); the credits page is generated, never hand-edited.
- Supply chain: exact versions pinned in `package.json`; `npm ci` in CI; Biome lint; no postinstall scripts beyond Playwright's browser download in CI.

---

## 11. Performance budget

| Metric | Budget | Enforced by |
|---|---|---|
| Precache size | ≤ 10 MB MVP (20 napkins), ≤ 25 MB v1 | `build-sw.mjs` via `NAPKIN_PRECACHE_MAX_MB` (default 10) |
| Per napkin page HTML + inline SVG | ≤ 20 kB gzipped | `check-budgets.mjs` |
| Optimised diagram | warn above 12 kB static / 40 kB animated; **hard fail above 40 kB static, 60 kB animated** | `build-diagrams.mjs` logs; `check-budgets.mjs` fails |
| Fonts | 4 files ≤ 130 kB total | `subset-fonts.py` asserts |
| JS per page (gz) | ≤ 80 kB incl. React + islands; **Counter ≤ 40 kB** | budget script over `dist/_astro/*.js` referenced per page |
| First paint (mid-range Android, cold) | ≤ 500 ms; diagram fully drawn ≤ 1.5 s | Playwright trace on CI (desktop proxy) + manual device check |
| Interaction | plunger → next card ≤ 100 ms; dispenser drag 60 fps (transform/opacity only, `will-change` on the napkin during drag) | manual + Playwright timing |
| Animation | one SMIL diagram playing per viewport; one `mix-blend-mode` layer; no `backdrop-filter`; noise as a tiled WebP | code review + DESIGN §14 |
| Lighthouse (desktop, Pages) | PWA installable, Performance ≥ 95, Accessibility 100 | Phase 5 checklist |

---

## 12. Error handling

| Where | Failure | Behaviour |
|---|---|---|
| Diagram build | unknown colour, missing font, export throws | Fail the build with `<file>: <element id>: <reason>`; never emit a partial SVG. jsdom text-less output → automatic Playwright retry. |
| Licence lint | bad licence/source | Fail the build listing every offending card; nothing deploys. |
| Astro build | card without number, related slug missing | zod / `getCollection` checks throw with the slug. |
| Runtime rating write | Dexie transaction rejects (quota, private mode) | Plunger returns to rest, `Couldn't write that — try again` ticket, card stays in queue; the rating is kept in the Zustand `pendingWrite` and retried on the next tap. |
| Pagefind missing (dev) or shard load fails | dynamic import throws | Sticky note shows "Search needs a build (npm run build)" in dev; offline "Not stocked yet — connect once" in prod. |
| SMIL unsupported / animated SVG absent | `svg.setCurrentTime` undefined | Fall back to the static SVG; ruler steps opacity groups (same as reduced motion). |
| Service worker | registration throws (file://, unsupported) | Ignore silently; the app still works online. |
| Import JSON | schema mismatch | `--danger` ticket with the first zod issue; nothing is written. |
| Deep link to an un-cached napkin (web, offline) | navigateFallback | `offline.astro` napkin with "Back to menu". |

---

## 13. No analytics

Nothing in the app records, batches or sends usage. The only counters are the learner's own (reviews per day, streak) and they exist solely for the placemat. There is no crash reporting; errors are surfaced on-screen as tickets and in the console.
