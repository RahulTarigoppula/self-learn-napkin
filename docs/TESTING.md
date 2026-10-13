# Napkin — TESTING.md

> **Conflicts are resolved in `docs/IMPLEMENTATION-PROMPT.md` §0; that file wins.**

**Project:** 03 · The Visual Tech Learning Platform (codename "Napkin") · **Date:** 2026-09-06 · **Revised:** 2026-09-08 (aligned with IMPLEMENTATION-PROMPT §0)
**Binding docs:** `_shared/DECISIONS.md` (D1 Napkin exception, D5, D7, D9), `docs/RESEARCH.md` (§5 pipeline, §11 verification log), `docs/DESIGN.md` (v2 "Corner Booth"), `docs/DEPLOYMENT.md` (CI wiring).
**Stack under test:** Astro 7 + MDX content collections + React islands, build-time diagram pipeline (Excalidraw → jsdom/Playwright `exportToSvg` → `excalidraw-animate` SMIL → svgo → pen-token rewrite), Pagefind, `ts-fsrs` 5.4.2 + Dexie 4, `workbox-build` post-build service worker, Capacitor 8 APK from GitHub Actions.

Napkin has **no network calls, no keys, no server**. That makes it the most deterministic app in the portfolio: every test below runs offline, and every "golden" is a fixed input → fixed output pair checked into the repo.

---

## 0. Principles

1. **Engine first (D9.2).** `src/engine/**` is pure TypeScript with no DOM, no Astro, no React. It is 100 % unit-tested against golden data *before* any island renders it.
2. **The build is a test subject.** Diagrams, decks, the search index and the service worker are produced by scripts. Each script has a fixture input and an asserted output; CI fails if `public/diagrams/` drifts from `src/diagrams/`.
3. **Preview is the spec (D9.3).** Visual tests compare the real app against the tokens in `src/styles/tokens.css` (DESIGN §15) and against reference screenshots that were approved by eye against `design/preview.html`.
4. **No flakiness budget.** Clock, randomness (napkin rotation seed, coffee-ring rotation, FSRS fuzz) and `data-hour` are all injectable; tests pin them.
5. **Android is manual, but scripted.** No emulator locally (no SDK); the phone checklist in §12 is run on every tagged release with the real APK.

---

## 1. Tooling, layout, scripts

| Layer | Tool | Version (2026-09-06) | License | Notes |
|---|---|---|---|---|
| Unit | **Vitest** (via `getViteConfig` from `astro/config`) | 4.x | MIT | `environment: 'node'` for `src/engine` and `scripts/`; `// @vitest-environment jsdom` per component file |
| Component | **@testing-library/react** + **@testing-library/user-event** + **@testing-library/jest-dom** | 16.x / 14.x / 6.x | MIT | React islands. Astro `.astro` components render through `experimental_AstroContainer` (`astro/container`) and are asserted with `jsdom` + `@testing-library/dom` |
| Fake IndexedDB | **fake-indexeddb** | 6.x | Apache-2.0 | `import 'fake-indexeddb/auto'` in `tests/setup.ts` so Dexie runs in Vitest |
| E2E | **Playwright** (`@playwright/test`) | 1.5x | Apache-2.0 | Also the fallback diagram exporter, so chromium is already a dev dependency |
| Visual | Playwright `toHaveScreenshot` | — | — | Linux snapshots only (font rasterisation differs on Windows); generated and compared on `ubuntu-24.04` |
| A11y | **@axe-core/playwright** | 4.x | MPL-2.0 | Allowed by D5 as an unmodified dependency |
| Perf | **lighthouse** CLI + `scripts/check-budgets.mjs` | 12.x | Apache-2.0 | Budgets in §9 |
| Lint | **Biome** | 2.x | MIT | `biome ci .` runs before tests |
| Licences | **license-checker-rseidelsohn** | 4.x | BSD-3 | Fails on any package outside the D5 allow-list; `excalidraw-animate` needs an explicit override (npm metadata has no `license` field — RESEARCH §11 #2) |

```
napkin/
├── src/engine/               # pure logic  → tests next to source: *.test.ts
├── src/features/*/            # islands     → *.test.tsx (jsdom)
├── scripts/                   # build scripts → scripts/__tests__/*.test.mjs
├── tests/
│   ├── setup.ts               # fake-indexeddb, TZ=UTC, matchers
│   ├── fixtures/
│   │   ├── diagrams/three-shapes.excalidraw    # §4 golden G-DIA-1
│   │   ├── diagrams/bfs.mmd · load-balancer.d2
│   │   ├── content/consistent-hashing.mdx      # the golden card
│   │   ├── content/bad-licence.mdx             # must be rejected
│   │   ├── decks/expected-sysdesign.json
│   │   ├── fsrs/golden-card.snapshot.json      # locked on day 1 (§4 G-FSRS)
│   │   ├── anki/sdp-mini.apkg                  # 3-note System Design Primer subset (CC BY 4.0)
│   │   └── backup/napkin-backup-v1.json        # export/import round-trip
│   └── golden/                                 # expected SVG/JSON outputs of the build scripts
├── e2e/
│   ├── *.spec.ts              # flows (§7)
│   ├── visual/*.spec.ts       # screenshots (§8)
│   ├── a11y/*.spec.ts         # axe (§10)
│   ├── offline/*.spec.ts      # §11
│   └── __screenshots__/linux/ # committed baselines
├── playwright.config.ts
├── vitest.config.ts
└── lighthouse-budget.json
```

`package.json` scripts — this block is IMPLEMENTATION-PROMPT §2.5 verbatim; that section is the authority. **The order inside `build` matters**: the licence lint runs first so bad content fails in two seconds, **Pagefind runs before `build-sw.mjs`** so the search shards land in the precache manifest (§8.9, §12), and the budget check runs last so it sees the finished `dist/`. **`npm run diagrams` is deliberately NOT part of `build`** (C20) — diagram output is committed, and the only CI job that regenerates it is `ci.yml`'s `diagrams-fresh`.

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

`vitest.config.ts`:

```ts
import { getViteConfig } from 'astro/config';
export default getViteConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/engine/**/*.test.ts'], environment: 'node' } },
      { extends: true, test: { name: 'component', include: ['src/features/**/*.test.tsx', 'src/components/**/*.test.ts'], environment: 'jsdom' } },
      { extends: true, test: { name: 'build', include: ['scripts/__tests__/**/*.test.mjs'], environment: 'node', testTimeout: 60_000 } },
    ],
    coverage: { provider: 'v8', include: ['src/engine/**'], thresholds: { lines: 100, branches: 95 } },
  },
});
```

`tests/setup.ts` pins the environment: `process.env.TZ = 'UTC'`, `import 'fake-indexeddb/auto'`, `import '@testing-library/jest-dom/vitest'`, and `vi.setSystemTime(new Date('2026-09-06T09:41:00Z'))` for every test unless a test overrides it (09:41 is the clock in every DESIGN wireframe).

`playwright.config.ts` (essentials):

```ts
import { defineConfig, devices } from '@playwright/test';
const BASE = process.env.VITE_BASE_PATH ?? '/napkin/';          // mirror GitHub Pages sub-path
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:4321${BASE}`, trace: 'retain-on-failure', reducedMotion: 'no-preference' },
  webServer: { command: 'npm run preview -- --host 0.0.0.0 --port 4321', url: `http://localhost:4321${BASE}`, reuseExistingServer: !process.env.CI },
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}{ext}',
  projects: [
    { name: 'desktop', testIgnore: /visual|a11y|offline/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'pixel7',  testIgnore: /visual|a11y|offline/, use: { ...devices['Pixel 7'] } },                 // 412×915, DPR 2.625, touch
    { name: 'visual',  testMatch: /visual\//, use: { ...devices['Pixel 7'], colorScheme: 'light' } },
    { name: 'a11y',    testMatch: /a11y\//,   use: { ...devices['Desktop Chrome'] } },
    { name: 'offline', testMatch: /offline\//, use: { ...devices['Pixel 7'] } },
  ],
});
```

Every e2e spec starts with the same deterministic preamble (`e2e/_fixtures.ts`): `page.clock.install({ time: new Date('2026-09-06T09:41:00Z') })`, `localStorage.setItem('napkin:house-rules', JSON.stringify({ edition: 'day', hour: 'afternoon', sound: false, reduceMotion: false, newPerDay: 10 }))`, and `localStorage.setItem('napkin:seed', '37')` (napkin rotation and coffee-ring rotation seed).

---

## 2. Strategy at a glance

| Level | What it proves | Runs | Gate |
|---|---|---|---|
| Unit (Vitest, node) | `src/engine`: FSRS wrapper, queue, cloze, deck IDs, streak/rings, receipt text, counter-light, visualizer step generators, backup schema | every commit, < 10 s | 100 % line coverage on `src/engine` |
| Build (Vitest, node) | `scripts/build-diagrams.mjs`, `build-decks.mjs`, `build-sw.mjs`, `check-budgets.mjs` against fixtures | every commit, < 60 s | golden outputs byte-equal (SVG normalised) |
| Component (Testing Library, jsdom) | Islands: RulerScrubber, Pen, Dispenser, Highlighter, VizNapkin, GuestCheck, UpdateTicket, LightSwitch; Astro components via Container | every commit | a11y names/roles from DESIGN §13 present |
| E2E (Playwright) | The one-thumb loop: Counter → Menu → Napkin → Order Up → Receipt; search; House Rules; export/import | PRs + main | zero failures on `desktop` and `pixel7` |
| Visual (Playwright screenshots) | Token fidelity vs DESIGN §4/§15 and reference screenshots | PRs + main (Linux) | `maxDiffPixelRatio ≤ 0.01`, tokens exact |
| A11y (axe + manual) | WCAG AA contrast, names, focus order, 44 px targets | PRs + main | zero `serious`/`critical` axe violations |
| Offline | SW precache, `navigateFallback`, Pagefind shards, fonts, sounds all served with network off | main | all listed URLs served from cache |
| Performance | Bundle budgets, Lighthouse mobile, visualizer frame time, Pagefind latency, FSRS due-count latency | main + tags | §9 budgets |
| Android manual | §12 checklist on a real phone with the Release APK | every `v*` tag | signed-off in the Release notes |
| Day-1 verification | §13 — the unverified research claims | before Phase 0 ends | each row resolved and recorded in RESEARCH §11 |

---

## 3. What is NOT tested (and why)

- Excalidraw the *application* (we only consume its JSON).
- Third-party scheduling maths inside `ts-fsrs` beyond the snapshot in §4 — we test our wrapper and invariants; upstream owns FSRS-6 correctness.
- Pixel-perfect SMIL timing in Android WebView — verified by eye in §12; SMIL `begin`/`dur` attributes are asserted structurally in §5.7.
- Sound files' audibility — presence, size and CC0 credit lines are asserted; playback is a manual §12 item.

---

## 4. Golden data (checked into `tests/fixtures/`)

All numbers below were computed on 2026-09-06 and are the assertion values in the tests.

### G-CARD · the golden napkin

`tests/fixtures/content/consistent-hashing.mdx` is the exact frontmatter from RESEARCH §5.1: slug `sysdesign/consistent-hashing`, `track: sysdesign`, `difficulty: 2`, `minutes: 3`, `diagram: consistent-hashing`, two flashcards (one Q/A, one cloze), one source `{ name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0" }`.

### G-DECK · stable flashcard IDs

Deck IDs are `sha1(cardSlug + "|" + question)` (hex). The separator is part of the contract — changing it orphans every learner's review history.

| Input string | Expected id |
|---|---|
| `sysdesign/consistent-hashing\|Why does consistent hashing minimise re-mapping when a node joins?` | `f40204a70330cb3e7c3eb3b8c6bca3cefd2f8b13` |
| `dsa/binary-search\|What is the worst-case time complexity of binary search?` | `244084cb5175b111732acee58320bea08bd7a2d8` |

Cloze cards use the raw cloze text (with the `{{…}}` markers) as the "question" half.

### G-CLOZE · cloze parser

Input: `Virtual nodes fix {{uneven load}} by giving each server {{many ring positions}}.`
Expected: `[{t:'text',v:'Virtual nodes fix '},{t:'blank',v:'uneven load',i:0},{t:'text',v:' by giving each server '},{t:'blank',v:'many ring positions',i:1},{t:'text',v:'.'}]`; `blanks = 2`; front text (blanks masked) = `Virtual nodes fix ____ by giving each server ____.`; unbalanced `{{` throws `ClozeSyntaxError` with the column index.

### G-FSRS · scheduler wrapper (ts-fsrs 5.4.2, FSRS-6, default parameters, `request_retention: 0.9`, `enable_fuzz: false` in tests)

Fixed `now = 2026-09-06T09:41:00Z`, `card = createEmptyCard(now)`.
Invariants asserted directly:
- `f.repeat(card, now)` yields four outcomes; `scheduled_days(Again) ≤ Hard ≤ Good ≤ Easy` and `Easy > Again`.
- After `Rating.Good`, `state ∈ {Learning, Review}`, `reps === 1`, `lapses === 0`, `due > now`, `log.rating === 3`, `log.review.getTime() === now.getTime()`.
- After `Good` then `Again` (at `due`), `lapses === 1` and the new `scheduled_days` is shorter than before.
- Twelve consecutive `Good` reviews, each at the card's `due`: `scheduled_days` is non-decreasing and the 12th interval exceeds 30 days.
Exact numeric values (stability, difficulty, `scheduled_days` for each of the four ratings on the new card and after the 12-Good sequence) are **locked on day 1** by running the wrapper once and committing `tests/fixtures/fsrs/golden-card.snapshot.json`; the test then `toMatchFileSnapshot`s it. A snapshot diff means ts-fsrs was upgraded — review intervals, then update the snapshot deliberately.

### G-QUEUE · today's queue

Ten cards seeded with `due` = `now − 3d, −2d, −1d, −1h, −1m, +1m, +1h, +1d, +2d, +3d`, plus 25 New cards; `newPerDay = 10`; one New card already introduced today.
Expected: due queue = the 5 overdue cards ordered by `due` ascending; new queue = 9 cards (cap minus the one introduced today); dispenser plate text `14 due`.

### G-STREAK · coffee rings and streak

Review-log days (UTC): `2026-09-01, 09-02, 09-04, 09-05, 09-06`; today `2026-09-06`.
Expected: `streak = 3`, `best = 3` (the 09-01..09-02 run is 2). Ring variants by reviews-per-day: `1 → ring-1 (opacity .35)`, `5 → ring-2 (.48)`, `20 → ring-3 (.60)`, `0 → none`, `4 → ring-1`, `19 → ring-2`. A review at `2026-09-06T23:59:59Z` and one at `2026-09-07T00:00:00Z` count as different days (UTC day boundary; the app passes the device TZ in production).

### G-RECEIPT · thermal receipt text

The layout is defined once, in IMPLEMENTATION-PROMPT §6.10 (C19); this is that block, and `design/preview.html` renders exactly these lines.

Session: `[{title:'Binary Search', rating:'Good', days:4}, {title:'Consistent Hashing', rating:'Again', days:1}, {title:'LRU Cache', rating:'Easy', days:31}]`, `order = 412`, `streak = 12`, `now = 2026-09-06T09:41:00Z`.
Expected (exact, JetBrains Mono, uppercase, dot leaders; assert `toBe`):

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

**Padding rule (the only one).** Item rows are `(trunc(title, 20) + ' ').padEnd(31, '.') + ' ' + value`, where `value` is the 9-column `RATING.padEnd(5) + ' ' + days.padStart(3)` — `GOOD   4d`, `AGAIN  1d`, `EASY  31d`. Total rows are `label.padEnd(18) + value.padStart(14)`. Item rows, total rows and the two dashed rules are **exactly 32 columns** (verified in node, counting code points, so `·` is one column); the header is 20, the timestamp 17 and the footer 22. Titles longer than 20 characters are truncated with `…` so the value column never shifts. A zero-review session prints the same block with no item lines and `SUBTOTAL               0 reviews`.

### G-HOUR · counter light by clock

`hourBand(h)`: `20:00–05:59 → 'late'`, `06:00–11:59 → 'morning'`, `12:00–19:59 → 'afternoon'`. **The `late` band wraps midnight and must be tested first** (C18) — an implementation that checks `morning` first returns `afternoon` for 00:00–05:59 and fails this table. All eight vectors are required: `00:00 → late`, `05:59 → late`, `06:00 → morning`, `11:59 → morning`, `12:00 → afternoon`, `19:59 → afternoon`, `20:00 → late`, `23:59 → late`. `2026-09-06T09:41:00Z` in `Asia/Kolkata` (15:11 local) → `afternoon`; in `UTC` → `morning`. Pinned House Rules (`hour: 'late'`) always wins.

### G-VIZ · visualizer step generators (pure, `src/engine/viz/*`)

| Generator | Input | Expected |
|---|---|---|
| `bubbleSort` (early-exit) | `[5,3,8,1,9,2,7,4]` | 25 `compare` events, 14 `swap` events, 5 passes, final `[1,2,3,4,5,7,8,9]`; first event `compare(0,1)`, first swap `swap(0,1)` |
| `bubbleSort` (naive) | same | 28 compares, 14 swaps |
| `insertionSort` | same | 14 shifts (= inversions), final sorted |
| `mergeSort` | same | 17 compares, final sorted |
| `binarySearch` | `[1,3,5,7,9,11,13,15]`, target `11` | probes `[3,5]`, found at `5` |
| `binarySearch` | same, target `4` | probes `[3,1,2]`, `-1` |
| `bfsGrid` | 5×5 grid rows `..#..`, `.##..`, `.....`, `#.##.`, `.....`; start `(0,0)`, goal `(4,4)`; neighbour order up, down, left, right; coordinates `(row, col)` | **18 `visit` events including the goal — 17 before it**; path length 8 edges, path `[(0,0),(1,0),(2,0),(2,1),(3,1),(4,1),(4,2),(4,3),(4,4)]` |
| `lruCache(cap=2)` | `put(1,1) put(2,2) get(1) put(3,3) get(2) put(4,4) get(1) get(3) get(4)` | gets return `[1,-1,-1,3,4]`; evictions `[2,1]` |
| `tokenBucket(cap=5, refill=1/s)` | 7 requests at `t=0`, then 1 at `t=3` | `[T,T,T,T,T,F,F,T]` |
| `quorum(N,R,W)` | `(3,2,2) (3,1,1) (3,1,3) (3,3,1) (5,2,3)` | strong-consistent `[T,F,T,T,F]` (rule `R+W>N`) |
| `hashRing` (fixed positions 0–359) | servers `A@40 B@160 C@280`; keys `k1@10 k2@55 k3@170 k4@200 k5@300 k6@350` | owners `{k1:A,k2:B,k3:C,k4:C,k5:A,k6:A}` (clockwise, wrap-around) |
| `hashRing.add` | add `D@220` | only `k3,k4` move, both to `D`; `movedKeys = ['k3','k4']` |
| `hashRing.remove` | remove `B` from the original | only `k2` moves, to `C` |
| `fnv1a32` (the ring's real hash) | `''`, `'a'`, `'foobar'`, `'napkin'` | `0x811c9dc5`, `0xe40c292c`, `0xbf9cf968`, `0x4b329dd2` |
| `hashTableChaining(buckets=8, maxLoad=0.75)` | insert 12 sequential keys | resize to 16 triggered on the 7th insert (load 0.875 > 0.75); final load factor `0.75` |
| `bstInsert` | `[8,3,10,1,6,14,4,7,13]` | in-order `[1,3,4,6,7,8,10,13,14]`, height 4, `search(6)` path `[8,3,6]` |

Every generator also passes a property test (fast-check, MIT): for 200 random arrays of length ≤ 16, sort generators end sorted and the number of `swap` events equals the inversion count for bubble/insertion.

### G-DIA · diagram pipeline

`tests/fixtures/diagrams/three-shapes.excalidraw`: a rectangle (`id: r1`, stroke `#1e1e1e`, fill `#ffec99`), an arrow (`id: a1`, stroke `#1971c2`), and a text element (`id: t1`, `fontFamily: 5` = Excalifont, text `cache`), drawn in that order, no explicit animation order.
Expected after `scripts/build-diagrams.mjs`:
- `public/diagrams/three-shapes.svg` exists; root `<svg>` has `viewBox`, `width`/`height` removed (responsive); exactly 3 top-level `<g>` groups; `<title>three-shapes</title>` and `<desc>` injected from the card's `tldr` when a card references it.
- No embedded `@font-face` block; `font-family` attributes contain `Excalifont`.
- Pen-token rewrite: no literal `#1e1e1e` remains; it became `var(--pen-black)`; `#1971c2` → `var(--pen-blue)`; `#ffec99` → `var(--highlighter)`; unknown colours are left as-is and reported in the build log.
- `three-shapes.anim.svg` contains ≥ 3 `<animate>` elements, each with `fill="freeze"`; `getBeginTimeList()` sidecar `three-shapes.steps.json` = `[0, 500, 1000]` (500 ms default per element, creation order) and `finishedMs ≥ 1500`.
- svgo did not strip `<animate>` or `id="r1|a1|t1"`.
- Size: `three-shapes.svg` < 6 kB; the content-hash cache directory `.cache/diagrams/<hash>/` is written; a second run is a cache no-op (`three-shapes: cached`, mtime unchanged).
- `bfs.mmd` (Mermaid `flowchart TD; A-->B; B-->C; A-->C` with `look: handDrawn`) → `bfs.svg` with 3 nodes and 3 edges; `load-balancer.d2` (`client -> lb -> {app1; app2}`) → `load-balancer.svg` with `sketch: true` (assert the `<filter>`/`rough` path signature present).
- Reduced-motion static variant exists for every `.anim.svg`.

### G-SCHEMA · content collection guard rails

`tests/fixtures/content/bad-licence.mdx` has `sources[0].licence: "CC BY-NC-ND 4.0"`. `astro check`/`getCollection` must throw with the zod message `Licence not allowed: CC BY-NC-ND 4.0`.

The frontmatter key is **`licence`** and the allowed enum is exactly the eight human strings from C12: `MIT`, `Apache-2.0`, `BSD-2-Clause`, `CC0`, `CC BY 4.0`, `CC BY 2.5`, `Public domain`, `Own work`. **`CC BY-SA 4.0` is not allowed** — it matches the lint's `/NC|ND|SA/i` rejection, and there is no "flagged" state and no `sharealike` group anywhere in the app. ShareAlike sources such as *Dive into Deep Learning* may be mentioned in prose as a link, never listed in `sources[]`, never adapted. `difficulty ∉ {1,2,3}`, `minutes > 5`, and a `diagram` with no matching file in `public/diagrams/` also fail the build.

### G-ANKI · System Design Primer import

`tests/fixtures/anki/sdp-mini.apkg` (3 notes cut from the CC BY 4.0 deck, attribution kept). `scripts/import-anki.py` → 3 deck entries, HTML stripped (`<b>`, `<br>` gone), `sources[0].licence === 'CC BY 4.0'`, and ids computed by the same G-DECK rule so re-import is idempotent.

### G-BACKUP · export/import round trip

`tests/fixtures/backup/napkin-backup-v1.json` = `{ schema: 1, app: 'napkin', exportedAt, cards: [2], review_logs: [3], highlights: [1], settings: {...} }`. Import into an empty Dexie → counts match; import into a populated Dexie → merge by id, newer `last_review` wins; a file with `schema: 2` is refused with the ticket toast text `This backup is from a newer Napkin`.

---

## 5. Unit tests (Vitest, `src/engine`)

Format: **Given / When / Then**. File names are the real targets.

### 5.1 `engine/decks/ids.test.ts`
- Given the two G-DECK strings, when `deckId(slug, question)` runs, then the hex ids match exactly.
- Given a cloze card, when `deckId` runs, then the raw cloze text (with braces) is used, so editing the *answer* never changes the id.

### 5.2 `engine/cloze/parse.test.ts`
- Given G-CLOZE, when parsed, then the segment array, blank count and masked front match.
- Given `{{a}} {{b}} {{c}}`, then `blanks = 3` and `revealUpTo(1)` masks only `c`.
- Given `unbalanced {{x`, then `ClozeSyntaxError` at column 11.

### 5.3 `engine/fsrs/scheduler.test.ts`
- Given a new card at the fixed clock, when `previewIntervals(card)` runs, then the four labels are `Again`, `Hard`, `Good`, `Easy` and the `days` are monotone (G-FSRS).
- Given a new card, when rated `Good`, then `reps 1`, `lapses 0`, `due > now`, and `log.rating 3`.
- Given the 12-Good sequence, then intervals are non-decreasing and the last exceeds 30 d.
- Given the golden card, when the full outcome object is compared to `golden-card.snapshot.json`, then it matches (`toMatchFileSnapshot`).
- Given `enable_fuzz: true` and seed `37`, when the same card is scheduled twice, then the two results are identical (fuzz is seeded through our RNG, never `Math.random`).

### 5.4 `engine/fsrs/queue.test.ts`
- Given G-QUEUE, when `buildQueue(now, settings)` runs, then due = 5 overdue ids in due order, new = 9, plate label `14 due`.
- Given `newPerDay = 0`, then new queue is empty and the plate still counts the overdue 5.
- Given nothing due and nothing new, then plate label is `Clean` and `isEmpty === true` (drives the "The counter's clean" state).

### 5.5 `engine/progress/streak.test.ts` and `rings.test.ts`
- G-STREAK vectors; ring thresholds `1/5/20`; day-boundary case.
- Given a `tz` of `Asia/Kolkata`, when a review lands at `2026-09-05T19:30:00Z` (01:00 IST on 09-06), then it counts for 09-06 locally.

### 5.6 `engine/receipt/format.test.ts`
- G-RECEIPT exact 10-line text with `toBe`; the column invariant over 500 random titles (property test: every line ≤ 32 columns, and item rows, total rows and rules exactly 32); `order` zero-padded to 4; a session with 0 reviews produces `SUBTOTAL               0 reviews` and no item lines.

### 5.7 `engine/theme/hour.test.ts`
- All eight G-HOUR vectors, each its own `it()` — **`00:00 → late` and `05:59 → late` are the C18 regression guards and must never be deleted**; the timezone pair (`Asia/Kolkata` → `afternoon`, `UTC` → `morning`); the pinned override wins; `nextBoundary(date)` returns the next of `06:00/12:00/20:00` so the 6 s crossfade can be scheduled.

### 5.8 `engine/viz/*.test.ts`
- Every G-VIZ row as its own `it()`; plus fast-check property tests (200 runs) for sorts.
- Frame model: `toFrames(events, input)` for bubble sort on the 8-element input yields `events.length + 1` frames; frame 0 equals the input; the last frame is sorted; each frame carries `highlight: [i, j]` for a `compare` and `swapped: true` for a `swap` (this is what the Rough.js renderer and the `aria-live` caption consume).
- Caption text: `compare(2,3) → swap` for a swap event, `compare(2,3)` otherwise; `visit (2,1)` for BFS; `evict 2` for LRU (DESIGN §9.4 shows the ticket-style caption).

### 5.9 `engine/backup/schema.test.ts`
- G-BACKUP round trip; merge rule; schema refusal; export JSON is streamed in insertion order so the file is byte-stable for identical DBs.

### 5.10 `engine/search/index.test.ts` (Pagefind is post-build; this tests our adapter)
- Given a base path `/napkin/`, when `pagefindBundlePath()` runs, then it returns `/napkin/pagefind/`; given `/`, then `/pagefind/`.
- Given 3 mocked results, when `toMenuRows()` runs, then each row has `number`, `title`, `track` tag and the `url` keeps the base path.

### 5.11 `engine/attribution/credits.test.ts`
- Given 3 cards with 2 distinct sources, when `collectCredits()` runs, then the credits list is deduplicated by URL, sorted by name, and each entry renders `from System Design Primer, CC BY 4.0` (DESIGN §9.3 attribution line).
- Given a card whose `sources[].licence` is `CC BY-SA 4.0`, then the **licence lint rejects it and the build fails** (C12) — there is no ShareAlike group and no ShareAlike notice, so `collectCredits()` never sees such a card.

---

## 6. Build-script tests (Vitest project `build`, `scripts/__tests__/`)

### 6.1 `build-diagrams.test.mjs`
- G-DIA in full (static SVG, animated SVG, sidecar, pen-token rewrite, svgo preservation, cache no-op, Mermaid, D2, reduced-motion variant).
- Given `NAPKIN_DIAGRAM_EXPORTER=playwright`, when the fixture is exported, then the output, after normalising whitespace and `id` suffixes, equals the jsdom output's element count and colours (both exporters must agree — this is the day-1 fallback decision, §13 D1-03).
- Given an `.excalidraw` that references a file (`files: {...}` raster image), then the build fails with `Raster images are not allowed in napkins` (DESIGN §4.3: zero raster bytes).

### 6.2 `build-decks.test.mjs`
- Given the fixture content dir, when run, then `public/decks/sysdesign.json` equals `tests/fixtures/decks/expected-sysdesign.json` (full 40-hex ids from G-DECK, `source` carried with the `licence` key, `cloze` flagged).
- Given two cards with the same slug, then the build fails with `Duplicate slug`.

### 6.3 `build-sw.test.mjs`
- Given a temp `dist/` with `index.html`, `offline/index.html`, `_astro/x.js`, `pagefind/pagefind.js`, `pagefind/index/a.pf_index`, `fonts/Excalifont-Regular.woff2`, `diagrams/three-shapes.anim.svg`, `sounds/sfx.webm`, `videos/big.webm` (4 MB), when `build-sw.mjs` runs with `VITE_BASE_PATH=/napkin/`, then `dist/sw.js` exists; the precache manifest contains all of the above **except** `videos/big.webm` (over `maximumFileSizeToCacheInBytes` 3 MB) **and except everything under `diagrams/`** — C5 excludes them because every diagram is already inlined into its napkin's HTML, so `diagrams/three-shapes.anim.svg` must be **absent** from the manifest; `navigateFallback` is `/napkin/offline/index.html`; and `count` equals the number of remaining listed files.
- Given `VITE_PLATFORM=android`, then the script still writes `sw.js` (harmless) but the layout test in §7.9 asserts it is never registered inside the WebView.

### 6.4 `check-budgets.test.mjs`
- Given a synthetic `dist/` at exactly the budget, then exit 0; given one file at 3 MB + 1 byte, then exit 1 with `dist/videos/x.webm exceeds 3 MB`; given `dist/_astro/` containing the string `mermaid` or `excalidraw`, then exit 1 with `Build-time library leaked into client bundle`.

### 6.5 `import-anki.test.py` (pytest, Python 3.14)
- G-ANKI; run in CI only when `tests/fixtures/anki/*.apkg` changed (path filter) — the script is a one-off tool, not part of `npm run build`.

---

## 7. Component tests (Testing Library, jsdom)

Islands are React (D1 exception: "React islands"). Astro components use `experimental_AstroContainer.create()` → `renderToString()` → `document.body.innerHTML` → `@testing-library/dom` queries.

### 7.1 `RulerScrubber.test.tsx`
- Given `steps = [0, 500, 1000]` and captions `['ring', 'key K hashes to 0x3F', 'lookup']`, when rendered, then it is `role="slider"` with `aria-valuemin 0`, `aria-valuemax 2`, `aria-valuenow 0`, `aria-valuetext "Step 1 of 3: ring"`.
- When the user presses `ArrowRight`, then `aria-valuenow 1`, `aria-valuetext` becomes `Step 2 of 3: key K hashes to 0x3F`, the `aria-live="polite"` caption reads the same thing (`Step 2 of 3 · key K hashes to 0x3F`), and the mocked `svg.setCurrentTime` was called with `0.5`. **There is one template** (C21): `aria-valuenow` and the tick numerals are 0-based; the caption and `aria-valuetext` are the 1-based `Step ${k + 1} of ${n}`.
- When the user taps tick 3, then `aria-valuenow 2` and `pauseAnimations` was called before `setCurrentTime(1.0)`.
- When pointer-up ends a drag, then `unpauseAnimations` is called (lift the pen to resume).
- Given `prefers-reduced-motion: reduce` (matchMedia mock), then no `setCurrentTime` calls; instead the groups `[data-step]` beyond the current step get `opacity: 0`.
- The strip's rendered height is ≥ 44 px (`getComputedStyle` on the jsdom stylesheet from `tokens.css`).

### 7.2 `Pen.test.tsx` (rating mode)
- Given `intervals = {again:'1d', hard:'3d', good:'12d', easy:'31d'}`, when rendered in rating mode, then four `button`s named `Again — 1 day`, `Hard — 3 days`, `Good — 12 days`, `Easy — 31 days` exist, in that DOM order (colour independence, DESIGN §13).
- When `Good` is clicked, then `onRate('good')` fires exactly once and the plunger gets `data-pressed` for ≥ 90 ms (fake timers).
- When the card is not yet revealed (`armed = false`), then all four buttons are `disabled` and have `aria-disabled="true"`.
- Keyboard: keys `1`–`4` map to Again/Hard/Good/Easy only when `armed`.
- Hit areas: each plunger's bounding box is ≥ 48×56 px.

### 7.3 `Dispenser.test.tsx`
- Given `due = 7`, then the plate reads `7 due` in the mono font and the control is a `button` named `Review — 7 due`.
- Given `due = 0` and `newAvailable = 0`, then the plate reads `Clean`.
- Given `due = null` (Dexie not ready), then the plate reads `—` and the button is still focusable.
- When tapped (no drag), then `onPull()` fires (tap equivalent of the pull gesture).
- Pointer drag: down at y=0, move to y=−130 → `onPull()`; move to y=−60 and up → no call and the napkin transform returns to `translateY(0)`.
- Flick: down, move −40 in 40 ms (> 600 px/s) → `onPull()`.

### 7.4 `Highlighter.test.tsx`
- Given a paragraph with two sentences, when the user long-presses (pointer down, 450 ms, fake timers) the second sentence, then `onCloze({ text, blank })` fires with `blank` equal to the longest noun-phrase heuristic result for `Virtual nodes fix uneven load by giving each server many ring positions.` = `many ring positions`.
- When released at 300 ms, then nothing fires and the highlighter tilt class is removed.
- Given an existing highlight, when long-pressed again, then `onRemove(id)` fires.
- Desktop: the sentence has a context-menu item `Highlight` (tap/button equivalent, DESIGN §13).

### 7.5 `VizNapkin.test.tsx` (bubble sort island)
- Given `input = [5,3,8,1,9,2,7,4]`, when rendered, then frame 0 shows 8 bars with mono labels `5 3 8 1 9 2 7 4`, the ruler has `aria-valuemax 39` (25 + 14 events), and `Run` is enabled.
- When `Step ▶` is clicked once, then the caption reads `compare(0,1) → swap` and bars 0 and 1 carry `data-highlight`.
- When `Run` is clicked with fake timers advanced 39 × (500 ms / speed 1×), then the caption reads `done`, the green check mark path is present, and `onDone` fired once.
- `GriddleDial` `2×` halves the interval; `½×` doubles it.
- `N = 8 [–]` → 7 bars, reshuffled with the seeded RNG (`seed 37` → deterministic array asserted).
- With `IntersectionObserver` reporting `isIntersecting: false`, `Run` pauses and resumes on re-entry (one island animates per viewport).
- Keyboard: `space` toggles run, `ArrowLeft/Right` step, `1/2/3` speed.

### 7.6 `GuestCheck.test.tsx` (search sticky note)
- Given a mocked Pagefind returning 3 results for `quorum`, when the user types `quorum reads`, then the Caveat echo shows `quorum reads`, three rows render as menu rows (`044 Quorum (N, R, W)` with tag `SYS`), and results arrive debounced at 120 ms.
- Empty query → the "Try: LRU, CAP, backprop" hint plus up to 5 recent napkins from Dexie.
- No results → `Not on the menu. Ask the cook`.
- `Escape` and the `×` button both close; focus returns to the Search object in the bottom band.
- `Ctrl+K` / `Meta+K` opens it on desktop.

### 7.7 `UpdateTicket.test.tsx`
- Given `workbox-window` emits `waiting`, then the ticket `NEW NAPKINS — REFRESH` renders in the rail, is `role="status"`, and is dismissible; clicking `REFRESH` calls `messageSkipWaiting()` and reloads on `controlling`.

### 7.8 `LightSwitch.test.tsx` and `HouseRules.test.tsx`
- Toggles are `role="switch"` with `aria-checked`; keyboard `Space` toggles; each row ≥ 48 px.
- `Reset progress` requires a 3 s hold (fake timers): release at 2.9 s → no reset; 3.0 s → `db.delete()` called and the ticket `Counter wiped` appears.
- `Edition` radio `Day · After hours · Auto` writes `data-theme` on `<html>` (`day` | `night` | removed).
- `New cards / day` stepper clamps to `0–50`.

### 7.9 Astro components via Container (`src/components/__tests__/*.test.ts`)
- `Napkin.astro` with the G-CARD: renders `No. 037`-style number from `number` prop in Caveat class, the 2 px `--border-strong` rule, TL;DR in `--text-lg`, the inline `.anim.svg` with `<title>` + `<desc>`, the Big-O `<table>` with `<th scope="col">`, related scraps, and the attribution line `from System Design Primer, CC BY 4.0`.
- `MenuPage.astro`: a real `<table>` with `<caption>`, headers `No. · Napkin · Min · Heat · Done`; difficulty cell contains `🌶🌶` **and** visually hidden text `difficulty 2 of 3`.
- `Base.astro` with `PUBLIC_PLATFORM=android`: the inline script does **not** contain `serviceWorker.register`; with `web`: it registers `${BASE_URL}sw.js` and `BASE_URL` is `/napkin/` when built with `VITE_BASE_PATH=/napkin/`.
- `Base.astro` sets `<html data-hour="afternoon">` for the pinned House Rules fixture and `lang="en"`.

---

## 8. End-to-end tests (Playwright; projects `desktop` and `pixel7`)

Preamble from §1 applies (frozen clock 09:41, seed 37, afternoon light, day edition, sound off). Content under test is the real `src/content` (≥ 20 MVP cards); tests reference cards by slug, not by number, except where the number is the assertion.

### 8.1 `counter.spec.ts` — The Counter
- Given a first-run browser, when `/` loads, then the wordmark `NAPKIN` (Caveat), the clock `09:41`, the mug streak `0`, the dispenser plate `Pull one`, and the four labelled controls `Menu`, `Review`, `Search`, `Pen — rate this card` are present; the counter scene root has `aria-hidden="true"` and the labelled controls are outside it.
- When the dispenser is tapped, then the first napkin of the "Today's specials" list opens with `napkin-pull` (on `desktop` assert the View Transition finished: `document.getAnimations().length === 0` within 600 ms).
- Given a resume state (`localStorage napkin:last = sysdesign/consistent-hashing`), then the resume napkin shows `Consistent Hashing` rotated by `1.5deg` (computed `transform` matrix asserted) and `Continue →` navigates to it.

### 8.2 `menu.spec.ts` — The Menu
- When `Menu` is tapped, then the ruled table slides in (`menu-slide`), three track heads `STARTERS · DSA`, `MAINS · SYSTEM DESIGN`, `DESSERTS · DATA SCIENCE` show `x/y` counts equal to the collection sizes, and rows are ≥ 48 px tall.
- When `Filter: Caching` is tapped, then only rows tagged `caching` remain and the URL is `?tag=caching`; `All` restores.
- When a row is tapped, then the napkin route `/sysdesign/consistent-hashing/` loads and the folio bar reads `SYSTEM DESIGN` and `037/120`-style `n/N` where `N` equals the collection size.
- When a row is long-pressed (pixel7) or its `⋯` button used (desktop), then the ticket `Added 2 cards to today` appears and `Review` shows `2 due`.
- Empty filter (`?tag=nonexistent`) → `Nothing on the menu for that — try another tag`.

### 8.3 `napkin.spec.ts` — reading a napkin
- Given `/sysdesign/consistent-hashing/`, then the title is `Consistent Hashing`, the number `No.` is rendered, the inline SVG has `<title>` and `<desc>` equal to the TL;DR, and the ruler slider's `aria-valuemax` equals `steps.length − 1` from the sidecar.
- When the ruler is dragged to the last tick, then the SVG's `getCurrentTime()` equals the last `beginTime / 1000` and the caption matches the last step text.
- When the user swipes left (pixel7, starting 40 px from the edge, > 30 % travel), then the next napkin in the track loads (`napkin-swap`); swiping from 10 px off the edge does nothing (system back zone).
- When `see how this was drawn` is tapped, then the D2/Mermaid source appears in mono on `--surface-2` (flip on pixel7, side napkin on desktop).
- Long-press the second bullet → the yellow swipe (`--highlighter`) is drawn (`path[stroke="#FFE066"]` present), the `✎` margin mark appears, and `Review` increments by 1; reload → the highlight persists (Dexie).
- Pinch-zoom (pixel7, `touchscreen` two-finger emulation) scales the SVG wrapper; a `Reset zoom` control appears.
- Android back-equivalent (`page.goBack()`) from a napkin returns to the Menu, not the Counter.

### 8.4 `review.spec.ts` — Order Up
- Given 12 due cards (seeded via `page.evaluate` into Dexie with backdated `due`), when `Review` is tapped, then the rail shows `4/12`-style progress starting `0/12`, the ticket rail has 12 tickets, and the question renders in Caveat at ≥ 40 px on desktop / 32 px on pixel7.
- When the card is tapped, then it flips (`rotateY(180deg)` reached within 400 ms) and the four plungers are enabled with intervals equal to `previewIntervals()` for that card (read via `page.evaluate` against the engine).
- When `Good` is tapped, then a Dexie `review_logs` row exists with `rating 3`, the check mark path in `--pen-blue` is drawn, the next card is pulled, and progress reads `1/12`.
- Swipe right (pixel7) = Good; swipe left = Again; keys `1–4` on desktop.
- When the last card is rated, then the receipt prints line by line (`receipt-print`), the text equals `formatReceipt()` for the session (compare via `page.evaluate`), and a coffee ring is stamped on the placemat for today.
- When the receipt is torn (swipe across the perforation / `Tear` button), then a PNG blob ≥ 10 kB is produced (`navigator.share` stubbed to capture the file) and the Placemat's "Last check" shows the same order number.
- `Leave the counter?` confirm appears on back mid-session; `Stay` keeps the card; progress after `Leave` is preserved (the rated cards stay rated).
- Dexie write failure (inject a rejected `put` via `page.route`-free monkeypatch) → plunger returns to rest, ticket `Couldn't write that — try again`, card not lost.

### 8.5 `griddle.spec.ts` — visualizer
- `/dsa/bubble-sort/`: frame 0 bars `5 3 8 1 9 2 7 4`; `Run` completes at `2×` within 12 s; `done` check mark appears; `Shuffle` with the fixed seed yields the asserted array.
- `/sysdesign/consistent-hashing/#griddle`: drag server `D` onto the ring at 220° → the caption reads `2 keys moved` and `k3, k4` are recoloured.
- Only one island animates: with two visualizers on a long test page, scrolling the first out of view pauses it (`data-state="paused"`).

### 8.6 `search.spec.ts`
- Tap `Search` → sticky note rises; type `hashing` → the first row is the **Consistent Hashing** napkin; tap it → napkin loads; back → the note is closed and focus is on `Search`. *(Query `hashing`, not `quorum`: the quorum napkin is batch 2 — IMPLEMENTATION-PROMPT §7.7. Switch to `quorum` once card 044 ships.)*
- Type `zzzz` → `Not on the menu`.
- Latency: `performance.now()` around the query resolves in < 100 ms with the Pagefind shards already cached (second query).

### 8.7 `placemat.spec.ts`
- Seed review logs for G-STREAK; open `/placemat/` → `streak 3`, rings on `1, 2, 4, 5, 6` Sept with variants by count; drag the mug over 5 Sept → tooltip ticket `5 reviews on 5 September`; tap the ring → that day's receipt.
- `share` → PNG blob captured; the mat lifts (`--shadow-3`) for the render.

### 8.8 `house-rules.spec.ts`
- Toggle `After hours` → `html[data-theme="night"]`, `--bg` computes to `#12211F`; `Auto` + emulated `prefers-color-scheme: dark` → night.
- `Counter light: Pin → late` → `html[data-hour="late"]`.
- `Export` → a JSON download whose parsed shape matches G-BACKUP `schema: 1`; `Import` the fixture → counts on the Placemat update; import a `schema: 2` file → `This backup is from a newer Napkin`.
- `Reset progress` hold 3 s → Dexie cleared → dispenser reads `Pull one`.
- Credits card lists `OpenDSA (MIT)`, `System Design Primer (CC BY 4.0)`, `Amidi CS229 (MIT)`, the four fonts (OFL) and `sounds CC0`; the version line equals `PUBLIC_APP_VERSION`.

### 8.9 `pwa.spec.ts`
- `/manifest.webmanifest` → `name "Napkin"`, `display "standalone"`, `start_url` and `scope` equal the base path, `theme_color "#1E3B38"`, icons 192/512 + a `maskable` entry.
- `navigator.serviceWorker.ready` resolves; `caches.keys()` contains a `workbox-precache` cache; the precache includes `offline/index.html`, `pagefind/pagefind.js`, all four `.woff2` files and `sounds/sfx.webm`.

---

## 9. Visual tests (Playwright `visual` project, Linux only)

Baselines live in `e2e/__screenshots__/linux/`. They are created by the `visual-baseline` workflow (`workflow_dispatch` → `playwright test --project=visual --update-snapshots` → artifact → committed by the developer after approving them against `design/preview.html`). Never accept a baseline update that was not eyeballed.

Deterministic setup: `page.clock.setFixedTime('2026-09-06T09:41:00Z')`, `await page.evaluate(() => document.fonts.ready)`, `animations: 'disabled'`, `caret: 'hide'`, seed 37, `data-hour=afternoon`, `mask: [page.locator('[data-testid=clock]')]` is **not** used (the clock is frozen, so it must match).

| Spec | Screens | Thresholds |
|---|---|---|
| `visual/screens.spec.ts` | Counter (empty), Counter (resume + 7 due), Menu, Napkin (`consistent-hashing`, ruler at step 2), Griddle (bubble sort frame 5), Order Up (front), Order Up (back, plungers armed), Receipt (printed), Guest Check with results, Placemat, House Rules, Not-cached page | `maxDiffPixelRatio: 0.01`, full page, both `day` and `night` editions (24 images) |
| `visual/desktop.spec.ts` | Counter at 1280×800 (tri-fold menu + right column), Napkin 640 px | same |
| `visual/objects.spec.ts` | Isolated components on a `/__gallery/` page (built only when `PUBLIC_GALLERY=1`): dispenser, pen (docked/rating), highlighter, mug with 12, bell, dial, receipt tear, coffee rings ×3, sticky note, pencil buttons ×3 states | `maxDiffPixels: 40` each |
| `visual/motion.spec.ts` | Frame captures at 0 / 240 / 480 ms of `napkin-pull` and at 0 / 200 / 380 ms of `napkin-flip` (animations enabled, clock stepped with `page.clock.runFor`) | `maxDiffPixelRatio: 0.03` |

**Token fidelity (`visual/tokens.spec.ts`, runs on every platform):**
- Reads `src/styles/tokens.css` and asserts every D7 name exists: `--bg … --dur-slow` (the 40 names in DECISIONS §D7), plus the Napkin extensions in DESIGN §4.2.
- Computed values in the live page equal DESIGN §15: `--bg #1E3B38`, `--surface #F7F1E3`, `--ink #1B1F2A`, `--accent #C8322B`, `--accent-2 #1F4FA3`, `--success #276E46`, `--warning #E1A62B`, `--danger #B3261E`, `--focus #1F4FA3`, `--text-base 1.0625rem` (17 px), `--space-5 20px`, `--radius-md 12px`, `--dur-base 240ms`, `--shadow-2 0 6px 14px rgba(0,0,0,0.28)`; night edition: `--bg #12211F`, `--surface #EAE4D6`, `--accent #B52D26`.
- WCAG contrast computed from the tokens (own 15-line luminance function): `ink/surface ≥ 14.0`, `ink-muted/surface ≥ 5.0`, `accent/surface ≥ 4.5`, `accent-2/surface ≥ 6.5`, `success/surface ≥ 4.8`, `danger/surface ≥ 5.0`, `on-bg/bg ≥ 10.0`, `on-bg-muted/bg ≥ 6.5`, `focus-on-bg/bg ≥ 4.5`, `accent-ink/accent ≥ 4.5`; and for night `ink/surface ≥ 12.5`, `success/surface ≥ 4.5`. A token change that drops any pair below AA fails CI.
- Fonts: `document.fonts.check('700 32px "Caveat Variable"')`, `'400 16px Excalifont'`, `'400 17px "Nunito Variable"'`, `'400 14px "JetBrains Mono Variable"'` all `true`; no request to `fonts.googleapis.com` or `fonts.gstatic.com` was made (`page.on('request')` allow-list = same origin only).
- Typography rules: every element with `font-family` containing `Caveat` has computed `font-size ≥ 24px`; no `<p>`, `<li>`, `<td>`, `<button>` uses Caveat; all counters (`[data-testid$=count]`, folio, intervals) use JetBrains Mono.
- Materials: exactly one element in the DOM has `mix-blend-mode: soft-light` (the lamp pool); no element uses `backdrop-filter`; no `<img>` other than `textures/noise-256.webp` and icons; napkin rotation transforms are within ±1.5°.

---

## 10. Performance tests and budgets

### 10.1 Static budgets (`scripts/check-budgets.mjs`, runs inside `npm run build`, fails the build)

| Budget | Limit | Source |
|---|---|---|
| `dist/` total | ≤ 25 MB | RESEARCH §5.7 |
| Any single file | ≤ 3 MB | `maximumFileSizeToCacheInBytes` |
| Workbox precache manifest total | ≤ 10 MB | RESEARCH §5.7 |
| Fonts (`*.woff2`, 4 files) | ≤ 130 kB total; ≤ 45 kB each | DESIGN §5 |
| Each `public/diagrams/*.svg` (raw, post-svgo) | ≤ 40 kB; `.anim.svg` ≤ 60 kB | RESEARCH §5.2 |
| Client JS per route (`_astro/*.js` referenced by the page, gzip) | ≤ 80 kB; Counter ≤ 40 kB | RESEARCH §5.7 |
| Largest island chunk (viz), gzip | ≤ 60 kB | — |
| Any HTML page, gzip | ≤ 20 kB | RESEARCH §5.7 |
| `sounds/sfx.webm` + `sfx.mp3` | ≤ 120 kB combined | DESIGN §12 |
| `textures/noise-256.webp` | ≤ 6 kB | DESIGN §16 |
| Forbidden strings in `dist/_astro/**`: `mermaid`, `@excalidraw`, `terrastruct`, `roughjs` outside the viz chunk, `react-dom/server` | 0 hits | build-time libs never ship |
| Pagefind shards | present (`pagefind/pagefind.js`, `*.pf_meta`) and ≤ 1.5 MB total for ≤ 400 cards | RESEARCH §5.5 |

The script prints a table to `$GITHUB_STEP_SUMMARY` so budgets are visible on every run.

### 10.2 Lighthouse (`lighthouse-budget.json`, run on `main` against `astro preview`, mobile preset, simulated 4G)

| Metric | Budget |
|---|---|
| Performance score | ≥ 95 |
| LCP (Counter, Napkin) | ≤ 2.0 s |
| TBT | ≤ 150 ms |
| CLS | ≤ 0.02 (fonts use `font-display: swap` with size-adjusted fallbacks; napkin boxes have fixed 4:3 aspect) |
| Speed Index | ≤ 2.5 s |
| Accessibility score | 100 |
| PWA: installable, `start_url` responds offline | pass |
| `resource-summary`: script ≤ 90 kB, font ≤ 130 kB, image ≤ 10 kB, total ≤ 400 kB (Counter) | pass |

### 10.3 Runtime measurements (Playwright, `perf.spec.ts`, advisory on PRs, blocking on tags)

- **Dispenser due count**: from `DOMContentLoaded` to the plate showing a number ≤ 50 ms with 2,000 seeded cards (Dexie index on `due`).
- **Pagefind query**: second query ≤ 100 ms (shards warm).
- **Visualizer frame time**: bubble sort at `2×` on the pixel7 project, `requestAnimationFrame` sampling over 3 s → p95 frame ≤ 20 ms on the CI runner (advisory; the real gate is §12 on device).
- **SMIL diagram page**: `/sysdesign/consistent-hashing/` long task count during the first 3 s ≤ 2 (`PerformanceObserver('longtask')`).
- **View transition**: `napkin-swap` completes in ≤ 600 ms wall clock.
- **Memory**: after 30 napkin swaps, `performance.memory.usedJSHeapSize` growth ≤ 15 MB (detects leaked SMIL SVG nodes / observers).

---

## 11. Accessibility tests

### 11.1 Automated (`e2e/a11y/*.spec.ts`, `@axe-core/playwright`)
- Every screen from §9 in both editions: `AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21aa','best-practice'])` → zero `serious`/`critical`. Known-and-accepted rules are listed in `e2e/a11y/allow.json` with a reason (empty at launch).
- Contrast is also checked structurally (§9 token test) because axe cannot see text over the blend layer — the token test proves no text is *on* the counter except `--on-bg*` classes.
- Touch targets: every `button, a, [role=slider], [role=switch]` has a bounding box ≥ 44×44 px on `pixel7` (plungers ≥ 48×56, dispenser edge ≥ 56 tall, ruler ≥ 44 tall, menu rows ≥ 48).
- Focus: `Tab` order on the Napkin screen is folio bar → napkin (title link) → ruler → bullets/related → bottom band; each focused element shows an outline of `2px` with the `--focus` (paper) or `--focus-on-bg` (counter) colour; `outline: none` never appears in computed styles for `:focus-visible`.
- Reduced motion: with `reducedMotion: 'reduce'`, `document.getAnimations()` after a pull contains only opacity animations ≤ 160 ms; diagrams render the static variant; the receipt appears whole.
- Screen-reader names (roles asserted): the Menu is `table` with `columnheader`s; the ruler `slider` has `aria-valuetext`; plungers are `button`s named `Again — 1 day` etc.; coffee rings have `aria-label="5 reviews on 5 September"`; the counter art is `aria-hidden`.
- Zoom/text scaling: at `Desktop Chrome` with `deviceScaleFactor 1` and page zoom 200 % (emulated via `viewport 640×400`), no horizontal scroll; `maximum-scale` is absent from the viewport meta.
- Language: `<html lang="en">`; diagrams have `<title>`/`<desc>`.

### 11.2 Manual (per release, desktop)
- NVDA + Chrome: read the Counter, open the Menu, read one napkin including the Big-O table, run a 3-card review by keyboard only, hear the receipt lines announced (the receipt is `role="log"`).
- Windows High Contrast (forced-colors): controls keep visible borders (`forced-color-adjust` tested on plungers and ruler).

---

## 12. Offline tests (`e2e/offline/*.spec.ts`, `pixel7`)

- Given the Counter was loaded once online and `serviceWorker.ready` resolved, when `context.setOffline(true)` and the page reloads, then the Counter renders, fonts are the self-hosted faces (`document.fonts.check`), the noise texture loads, and the House Rules footer reads `offline ready ✓`.
- Given offline, when navigating to a napkin that was precached (`/sysdesign/consistent-hashing/`), then it renders with its inline `.anim.svg` and the SMIL plays (`getCurrentTime()` advances).
- Given offline, when opening Search and typing `LRU`, then results appear (Pagefind shards from precache) in < 300 ms.
- Given offline, when starting a review, rating 3 cards and printing the receipt, then all Dexie writes succeed and the placemat updates (nothing in Napkin needs the network).
- Given offline and a **new** deep link that was never precached (simulated by deleting it from the precache before going offline), then the `navigateFallback` page renders: `This one isn't in the dispenser yet — connect once to stock it` in `--danger` ink with a `Back to menu` button.
- Given a new build is deployed (second `astro preview` with a changed card), when the page goes online and `workbox-window` detects `waiting`, then the ticket `NEW NAPKINS — REFRESH` shows and, after `REFRESH`, the new card content is served.
- Given `sound: on`, when offline, then `sfx.webm` plays from cache (`Howler` `onload` fires, no network request).
- The Android build never registers the SW (asserted in §7.9); on device, offline-from-first-launch is §13 item A-07.

---

## 13. Day-1 verification (unverified research claims → concrete checks)

Run these in Phase 0 before feature work (D9.1). Record the outcome in RESEARCH §11 with the date.

| # | Claim / risk (source) | Check | Pass criterion / fallback |
|---|---|---|---|
| D1-01 | Astro 7.3.1 needs Node ≥ 22.12; owner has "Node 22.17" (RESEARCH §8 #2) | `node -v` | `≥ v22.12.0`; else `winget upgrade OpenJS.NodeJS.LTS` |
| D1-02 | `@vite-pwa/astro` has no Astro 6/7 release; direct `workbox-build` is the chosen path (RESEARCH §11 #1) | `npm view @vite-pwa/astro peerDependencies.astro`; open vite-pwa/astro#74 | Stay on `scripts/build-sw.mjs` regardless; note whether the integration became usable |
| D1-03 | `exportToSvg` under jsdom hits excalidraw#10604 (font-face `unicodeRange` undefined) (RESEARCH §11 #3) | Run `npm run diagrams` on `three-shapes.excalidraw` with `NAPKIN_DIAGRAM_EXPORTER=jsdom`; count `Couldn't transform font-face` lines; open the SVG in Chrome | SVG structurally correct (G-DIA) and the stripped-font strategy renders Excalifont from page CSS → keep jsdom with the `FontFace` stub. Otherwise flip the default to `playwright` (§6.1 asserts both agree) |
| D1-04 | `animateSvg` under jsdom was never executed (RESEARCH §11 #2) | Same run; assert `three-shapes.anim.svg` has ≥ 3 `<animate>` and plays in Chrome | Pass → keep; fail → run `animateSvg` inside the Playwright page too |
| D1-05 | SMIL playback in Android WebView, inline vs `<img>` (RESEARCH open question 2) | Open the Pages URL in Chrome for Android *and* the first debug APK; watch `consistent-hashing.anim.svg` inline and in a test `<img>` | Inline plays (DESIGN inlines all diagrams). If `<img>` does not, never use `<img>` for animated variants |
| D1-06 | `./gradlew assembleRelease` with Capacitor 8 (AGP 8.13, Gradle wrapper 8.14.3, Temurin 21) on `ubuntu-24.04` "not executed end-to-end" (RESEARCH §11 #7) | `workflow_dispatch` the `android-release` workflow on the hello-world build | Signed `napkin-0.0.N.apk` artifact; `apksigner`-style check by installing on the phone. Failure modes: wrapper download (cache), JDK mismatch (pin 21), `gradlew` exec bit (`chmod +x` step present) |
| D1-07 | `excalidraw-animate` npm metadata has no `license` field (RESEARCH §11 #2) | `npm run test:licences` | Passes only with the explicit `--excludePackages excalidraw-animate@0.7.2` override; add a comment linking the GitHub LICENSE (MIT) |
| D1-08 | `algorithm-visualizer/algorithms` and `aretecode/system-design-templates-excalidraw` have no visible license (RESEARCH §3a/§6) | Open both repos, look for `LICENSE` | Port nothing from either until a license exists; the G-VIZ generators are written from scratch |
| D1-09 | Lottie Simple License page unreachable (RESEARCH §3a) | Open one asset's license from its own page | Until read, ship **no** Lottie (`@lottiefiles/dotlottie-web` stays uninstalled); confetti is a Rough.js/CSS effect |
| D1-10 | Exact Excalidraw `customData` key for explicit animation order not verified (RESEARCH §4) | Set an order in excalidraw-animate's UI, save, `grep customData` | Document the key in `scripts/build-diagrams.mjs`; fall back to creation order |
| D1-11 | `@astrojs/mdx` 8.0.0 peer list quoted as `@astrojs/markdown-satteri ^0.4` (RESEARCH §4) — name looks wrong | `npm view @astrojs/mdx@8.0.0 peerDependencies` | Install exactly what the registry lists; correct the RESEARCH row |
| D1-12 | `actions/setup-node@v7` `cache: npm` input may warn (HOSTING claim 3) | Read the first `pages.yml` run log | No warning → keep; warning → drop `cache:` per HOSTING |
| D1-13 | GitHub Pages serves Astro's `_astro/` (underscore dir) from an Actions artifact | `curl -I https://<owner>.github.io/napkin/_astro/<hash>.css` after first deploy | 200. `public/.nojekyll` is committed anyway (DEPLOYMENT §4) |
| D1-14 | `@capacitor/app` `backButton` fires under Android 16 predictive back (ANDROID-PACKAGING pitfall 11) | On the phone: open Menu → back gesture | Menu closes. If the app exits instead, add `android:enableOnBackInvokedCallback="false"` to `<application>` |
| D1-15 | Astro `base` + `import.meta.env.BASE_URL` trailing-slash behaviour with `VITE_BASE_PATH=/napkin/` | §5.10 `withBase()` unit test + `curl` of `/napkin/sw.js`, `/napkin/pagefind/pagefind.js` | All 200; no `//` in generated links (assert on `dist/**/*.html`) |
| D1-16 | Workbox precache URLs resolve under the `/napkin/` scope (generateSW writes relative entries) | DevTools → Application → Cache Storage on the Pages URL | Entries are `/napkin/...`; `offline/index.html` present |
| D1-17 | Pagefind under a sub-path needs an explicit `bundlePath` | Search on the Pages URL | Results appear; network tab shows `/napkin/pagefind/…` |
| D1-18 | Font subset sizes fit the 130 kB budget (DESIGN §5) | `npm run build` → budget table | Pass; else tighten `pyftsubset --unicodes` |
| D1-19 | FSRS numeric snapshot (G-FSRS) | Run `scheduler.test.ts` once, commit `golden-card.snapshot.json` | Snapshot reviewed by eye: `Good` on a new card gives a single-digit-day interval; `Easy` > `Good` |
| D1-20 | Haptics via `@capacitor/haptics` need only `VIBRATE` (normal permission, no prompt) | Install APK → tap a plunger | Haptic felt, no permission dialog |
| D1-21 | `rehype-mermaid`/Playwright not needed in `pages.yml` because diagrams are committed (C3) **and `npm run build` does not call `npm run diagrams`** (C20) | Read the first `pages.yml` run log: no `playwright install`, no `build-diagrams.mjs` line | < 3 min; `ci.yml`'s `diagrams-fresh` job (which does install chromium) passes and reports no diff |

---

## 14. Android manual QA checklist (per `v*` tag, real device, signed Release APK)

Device matrix: the owner's phone (Android 14+; note WebView version from `chrome://inspect` or Settings → Apps → Android System WebView) and, when available, one Android 16 device and one ≥ 600 dp tablet/foldable. Paste the filled checklist into the GitHub Release notes.

**Install & identity**
- [ ] A-01 Download `napkin-<version>.apk` from the Release in Chrome; `SHA256SUMS.txt` matches (`sha256sum` on PC or a checksum app).
- [ ] A-02 Fresh install prompts *no* runtime permission. Napkin declares **only `VIBRATE`** — no camera, storage, notifications or location, and **Capacitor's default `INTERNET` permission has been removed** from the manifest, which is what makes A-34 an OS guarantee rather than a promise.
- [ ] A-03 Update over the previous version installs without uninstall (same keystore, higher `versionCode`); Dexie data (reviews, highlights, settings) survives.
- [ ] A-04 App icon: adaptive icon correct on the launcher; themed (monochrome) icon on Android 13+; label `Napkin`.
- [ ] A-05 Splash: `#1E3B38` background, napkin icon centred, 240 ms fade; no white flash before the counter.

**Offline-first**
- [ ] A-06 Enable Airplane mode **before** the first launch after install → Counter, Menu, a napkin with animated diagram, Search results, a 3-card review and the receipt all work.
- [ ] A-07 No service worker registered in the WebView (`chrome://inspect` → Application → Service Workers empty) — assets come from the bundle.
- [ ] A-08 Fonts render as Caveat / Excalifont / Nunito / JetBrains Mono (compare with `design/preview.html`); no system-font fallback visible on the napkin title or diagram labels.

**Navigation & gestures**
- [ ] A-09 Back gesture chain: Search note → Menu → Napkin → Counter → app exits; never a dead back press; no exit from the Counter's first back when the Menu is open.
- [ ] A-10 Predictive back (Android 14+ with the developer option / Android 16 default): the system preview animation shows and the app still handles the chain (D1-14).
- [ ] A-11 Dispenser pull starts inside the slot and never triggers the system home swipe; horizontal napkin swipes starting < 32 px from either edge do nothing (system back zone).
- [ ] A-12 Pull, flick and tap all open a napkin; below-threshold pull slides back silently.
- [ ] A-13 Pinch-zoom on a diagram works and does not zoom the whole page (`user-scalable` allowed for text scaling but the SVG wrapper handles the pinch).
- [ ] A-14 Long-press a sentence → highlighter swipe → cloze card in the queue; no text-selection handles appear (custom press timer).

**Layout**
- [ ] A-15 Edge-to-edge: status bar colour `#1E3B38` (day) / `#12211F` (night) with light icons; the folio bar sits below the status bar; the bottom band sits above the gesture-nav inset + 12 px on 3-button and gesture nav.
- [ ] A-16 Rotation to landscape on phone: napkin max 640 px centred, bottom band becomes a side rail or stays reachable; no clipped plungers. Rotation mid-review keeps the current card and its revealed state.
- [ ] A-17 ≥ 600 dp screen (tablet/foldable open): desktop layout (tri-fold menu + right column); orientation lock is ignored by Android 16 — nothing breaks in any aspect.
- [ ] A-18 System font scale 130 % and 200 %: body text scales, no horizontal scroll, plungers still ≥ 48×56, Caveat never below 24 px.
- [ ] A-19 Keyboard: opening Search pins the input above the keyboard (`adjustResize`), the sticky note shrinks and never scrolls off; closing the keyboard restores the layout.
- [ ] A-20 Night edition via House Rules and via system dark mode (`Auto`): paper dims to `#EAE4D6`, ink unchanged; the status bar follows.

**Motion, sound, haptics**
- [ ] A-21 `ink-draw` SMIL plays inline on the napkin; the ruler scrubs it (pen tip moves, drawing stops where the pen is); no jank while scrubbing.
- [ ] A-22 Bubble-sort griddle at `2×` runs visibly smooth (no dropped frames noticeable); only one island animates while scrolling a long page.
- [ ] A-23 Haptics: `impact Light` on napkin release, `selectionChanged` on plungers and ruler ticks, `impact Medium` on receipt tear, `notification Success` on the ring stamp. Turning Haptics off in House Rules silences all of them.
- [ ] A-24 Sound off by default; with the bell on, the six sprites play; with the phone in silent/vibrate mode nothing plays and no error ticket appears; haptics still fire.
- [ ] A-25 System "Remove animations" (Accessibility) → napkins fade, static diagrams, ruler still steps, receipt appears whole.
- [ ] A-26 Counter light follows the clock (set the phone clock to 07:00 → blinds; 21:00 → lamp only); `Pin` overrides; the 6 s crossfade is imperceptible, no flicker.

**Data & sharing**
- [ ] A-27 Tear the receipt → share sheet opens with a PNG (`@capacitor/share` + `@capacitor/filesystem` cache file); the PNG opens in Photos with the full receipt at ≥ 2× DPR.
- [ ] A-28 Export from House Rules → JSON goes through the share sheet / Files; Import the same file → counts unchanged; import a foreign JSON → `--danger` ticket, no data loss.
- [ ] A-29 Kill the app during a review (swipe away from Recents) → reopen → the rated cards are persisted, the unrated one is still due.
- [ ] A-30 Reset progress with the 3 s hold → dispenser `Pull one`; content still present (it is in the bundle).

**Performance & hygiene**
- [ ] A-31 Cold start to interactive Counter ≤ 1.5 s on the owner's phone (stopwatch); warm start ≤ 0.5 s.
- [ ] A-32 30 minutes of use: no memory warning, battery drain comparable to a reader app; the app does not keep the screen awake.
- [ ] A-33 `chrome://inspect` on a `webContentsDebuggingEnabled: true` debug build shows zero console errors on Counter, Menu, Napkin, Review.
- [ ] A-34 No network requests at all during the session (`chrome://inspect` → Network stays empty except `https://localhost/…` bundle loads).
- [ ] A-35 Google developer-verification status (from 2026-09-30 regional, 2027 global): install still works on this device; note whether the "advanced flow" 24 h wait was needed.

---

## 15. CI wiring (summary; full YAML in `docs/DEPLOYMENT.md`)

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | PRs, pushes to non-main branches | `lint` (Biome) → `unit` (`vitest run` all three projects, coverage gate) → `diagrams-fresh` (installs Playwright chromium, `npm run diagrams`, `git diff --exit-code public/diagrams tests/golden`) → `build` (`npm run build` incl. budgets) → `e2e` (`desktop` + `pixel7`) → `a11y` → `visual` (compare only) → `licenses` |
| `pages.yml` | push to `main` | lint + `test:unit` + `test:build` + `npm run build` (licence lint, decks, astro, Pagefind, SW, budgets), then deploy; visual/e2e already passed on the PR. **It never runs `npm run diagrams`** (C20), so it needs no Playwright and no D2 WASM and finishes in under three minutes |
| `nightly.yml` | schedule 03:00 UTC | `offline`, `perf`, Lighthouse with budgets; opens an issue on regression |
| `android-release.yml` | tag `v*` / manual | builds and signs the APK; the §14 checklist is filled by hand before the Release is un-drafted |
| `visual-baseline.yml` | manual | regenerates Linux screenshots as an artifact for approval |

**Definition of done for a feature:** engine tests green with goldens, component tests for its island, one e2e flow, a visual baseline approved against `design/preview.html`, axe clean, budgets green, and — if it touches gestures, layout or haptics — the relevant §14 rows re-run on the phone.
