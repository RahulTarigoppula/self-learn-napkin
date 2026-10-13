# Napkin — The Visual Tech Learning Platform: Research Dossier

> **This is the research log, not the build spec.** It records what was investigated and verified on 2026-09-06, including options that were later rejected. **Conflicts are resolved in `docs/IMPLEMENTATION-PROMPT.md` §0; that file wins.** Rows that its rulings supersede are marked ⚠ inline.

**Codename:** Napkin
**Date of research:** 2026-09-06 (all versions/licenses below were checked against npm registry, GitHub, or the project's own site on this date unless marked otherwise)
**Owner constraints:** Solo dev, Windows 11, Node 22 + Python 3.14 locally, no Java/Android SDK. Web app must be free-hostable static; Android via APK built on GitHub Actions. Everything free, prefer OSI licenses.

---

## 1. Summary & Feasibility

**Feasibility: 5 / 5.** Napkin is a pure content + static-site problem. Every hard piece has a mature, MIT-licensed, browser-only solution with no API keys and no servers:

- **Content** = MDX cards in an Astro content collection; diagrams authored as **Excalidraw JSON** (hand-drawn look, editable in the free Excalidraw app) and **Mermaid/D2 text**, all rendered to **static SVG at build time** so the runtime ships zero diagram libraries.
- **Animation** = self-contained **SMIL-animated SVGs** produced at build time by `excalidraw-animate` (MIT), plus GSAP (now free, all plugins) / `motion` (MIT) for interactive islands only.
- **Offline** = Workbox precache via `vite-plugin-pwa` (MIT). A few hundred SVG cards + subset fonts fit comfortably under a ~10 MB precache budget.
- **Search** = Pagefind (MIT) or MiniSearch (MIT); both run fully offline once precached.
- **Flashcards** = `ts-fsrs` (MIT, FSRS-6) + Dexie/IndexedDB (Apache-2.0). Optional `fsrs-browser` (BSD-3) for on-device parameter optimization.
- **Syllabus** = a whitelist of genuinely open sources: OpenDSA (MIT), System Design Primer (CC BY 4.0, includes Anki decks), Erickson's *Algorithms* (CC BY 4.0), Open Data Structures (CC BY 2.5), Amidi CS229 ML cheatsheets (MIT), Galles' DS visualizations (FreeBSD), algorithm-visualizer (MIT). Several popular sources are **not** usable and are flagged in §3 (ByteByteGo system-design-101 is CC BY-NC-**ND**, roadmap.sh is all-rights-reserved, VisuAlgo forbids forking).
- **Android** = Capacitor (MIT) wrapping the same static build, APK produced by `./gradlew assembleDebug` on `ubuntu-latest`, which ships JDK 17 + Android SDK + Gradle preinstalled. Alternative: Bubblewrap TWA.

The two real risks are (1) a tooling version gap — `@vite-pwa/astro` has not been updated for Astro 6/7, so use `vite-plugin-pwa` directly (§8); and (2) **content licensing discipline** — the most-shared "system design infographic" repos are non-derivative or proprietary, so Napkin must draw its own diagrams from CC-BY / MIT text sources rather than tracing popular images.

---

## 2. Recommended Stack

| Layer | Choice | Version (2026-09-06) | License | Why |
|---|---|---|---|---|
| Framework / SSG | **Astro** (plain, content collections + MDX) | 7.3.1 (needs Node ≥ 22.12) | MIT | Islands architecture ships zero JS for static cards; MDX + content collections give typed frontmatter; View Transitions built in for the "browsing an infographic" feel. Starlight (0.42.0, MIT) is a fast MVP alternative but its docs chrome fights the infographic vibe. |
| UI islands | ~~**Preact** (via `@astrojs/preact`)~~ → **React 19** via `@astrojs/react` | — | MIT | **⚠ Superseded by IMPLEMENTATION-PROMPT §0.** C7 rules React 19 for portfolio consistency (Motion's `motion/react`, Testing Library, the same mental model as the other seven apps). Preact would save ~40 kB but the JS budget already holds because islands are few and `client:visible`. |
| Diagram authoring | **Excalidraw** `.excalidraw` JSON files in repo; **Mermaid** (`look: handDrawn`) and **D2** (`--sketch`) text for graph-shaped diagrams | `@excalidraw/excalidraw` 0.18.1; `mermaid` 11.17.2; `@terrastruct/d2` 0.1.33 | MIT / MIT / MPL-2.0 | All three have a hand-drawn "napkin" render mode. All rendered to SVG **at build time**; none ship to the client. |
| Diagram animation | **`excalidraw-animate`** (SMIL `<animate>` injected into exported SVG) | 0.7.2 (published 2026-04-24) | MIT per repo `LICENSE` (© 2020 Daishi Kato) — **the npm `package.json` has no `license` field**, so license scanners will report "none" | Zero-JS animated diagrams that play offline in an `<img>` or inline SVG. ESM-only (`"module"` entry, no `"main"`/`"exports"`); hard-depends on `@excalidraw/excalidraw@0.18.1`. |
| Interactive motion | **GSAP** (core + DrawSVG, MorphSVG, SplitText, ScrollTrigger) and/or **`motion`** | GSAP 3.15.0; motion 13.2.0 | GSAP: free proprietary "Standard License" (not OSI); motion: MIT | GSAP for premium SVG choreography in visualizer islands; `motion` if you want an OSI-only stack. |
| Hand-drawn primitives | **Rough.js** | 4.6.6 (< 9 kB) | MIT | Procedurally draw arrays/trees/hash tables in the same sketchy style as Excalidraw inside interactive islands. Mermaid itself depends on it. |
| Search | **Pagefind** (post-build CLI over `dist/`) — or **MiniSearch** if you want a fully custom UI | 1.5.2 / 7.2.0 | MIT / MIT | Both offline-capable once precached; Pagefind shards the index so only touched chunks load. |
| Spaced repetition | **`ts-fsrs`** (+ optional **`fsrs-browser`** optimizer) | 5.4.2 (FSRS-6) / 6.6.0 | MIT / BSD-3-Clause | State-of-the-art scheduler, pure TS, browser-ready. |
| Local storage | **Dexie** (IndexedDB) | 4.4.5 | Apache-2.0 | Reliable, indexed queries for `due <= now`, survives PWA/APK updates. |
| Offline / PWA | **⚠ Superseded by IMPLEMENTATION-PROMPT §0.** C8 rules a post-build `scripts/build-sw.mjs` calling `workbox-build.generateSW()` — not a Vite plugin. ~~**`vite-plugin-pwa`** (generateSW, Workbox 7.4.1) wired via `astro.config.mjs` → `vite.plugins`~~ | 1.3.0 (2026-05-05) | MIT | `@vite-pwa/astro` 1.2.0 only declares Astro ≤ 5 peer support (open issues vite-pwa/astro#72 "Astro 6 peer dependency range" and #74 "Astro 7 support", still open 2026-09-06); the underlying Vite plugin declares Vite `^3.1–^8` and Astro 7.3.1 depends on Vite `^8.0.13`, so the peer range matches. **"Works inside Astro 7" is a plausible inference, not something tested today** — see §5.6 fallback. |
| Fonts | **Excalifont** (hand-drawn, successor to Virgil) + ~~Inter / Manrope~~ **Caveat, Nunito and JetBrains Mono**, self-hosted and subset to Latin | — | SIL OFL-1.1 | **⚠ Superseded by IMPLEMENTATION-PROMPT §0.** DESIGN §5 bans Inter and reserves Fraunces for Chez Fridge (06); the four faces are fixed. Self-hosting is mandatory for offline; subsetting keeps each face ≈ 20–40 kB woff2. |
| Web hosting | **⚠ Superseded by IMPLEMENTATION-PROMPT §0.** DECISIONS D2 and DEPLOYMENT §1 rule **GitHub Pages**; nothing here needs a Worker, and no Cloudflare account is created. ~~Cloudflare Pages (primary)~~ | Free: 500 builds/mo, 20 000 files/site, 25 MiB/file, 100 custom domains (re-read from https://developers.cloudflare.com/pages/platform/limits/ on 2026-09-06) | — | The limits page does not mention a card requirement either way; Cloudflare's Free plan has historically needed none. Brotli + HTTP/2 automatically; `_headers` file lets you set long cache TTLs for hashed assets. |
| Android | **Capacitor** (`@capacitor/android` 8.5.1) — APK built by GitHub Actions and attached to a Release | 8.5.1 | MIT | Bundles the static `dist/` inside the APK → **works offline from first launch**, no hosted URL needed, no Digital Asset Links. `npx cap add android` needs no Java locally; only the CI build does. |
| Android (alt) | **Bubblewrap TWA** (`@bubblewrap/cli` 1.25.0) | 1.25.0 | Apache-2.0 | Smaller APK, content auto-updates from the hosted PWA, but needs one online visit to populate the service-worker cache and needs `/.well-known/assetlinks.json`. |
| Backend / proxy | **None.** | — | — | Nothing in Napkin needs a secret. Optional future BYO-key LLM features would call providers directly from the client with the user's own key. |

### Stack rationale in one paragraph
Astro is the only mainstream SSG that lets a page be 100 % static HTML+SVG *and* drop an island exactly where an interactive sort/BFS visualizer belongs (⚠ **Superseded by IMPLEMENTATION-PROMPT §0 C7: React 19, not Preact.** The argument is unchanged; only the framework is), which is precisely Napkin's shape (mostly static infographics, occasional interactivity). Rendering all diagrams at build time means the offline bundle contains SVG text (tiny, Brotli-friendly, crisp on any DPI) and none of Excalidraw (≈ 1 MB), Mermaid (≈ 2–3 MB) or D2 (multi-MB WASM). Capacitor beats TWA for this specific brief because the owner said "offline study on the go" and "I only want to install an APK": a Capacitor APK is self-contained and does not depend on the site being reachable at first launch.

---

## 3. Data Sources & Content (open-licensed syllabus)

Confidence: **verified** = license text/page read today; **likely** = strong secondary evidence; **unsure** = not confirmed.

### 3a. USE THESE (open licenses)

| Name | URL | License / terms | Free tier / limits | Purpose in Napkin | Confidence |
|---|---|---|---|---|---|
| OpenDSA (Virginia Tech eTextbook, "Everything" and "CS3" books) | https://github.com/OpenDSA/OpenDSA · https://opendsa-server.cs.vt.edu/ODSA/Books/Everything/html/ | MIT (file is named `MIT-license.txt`, © 2011-2025 Ville Karavirta & Cliff Shaffer; GitHub's detector reports "Other" because of the filename — it is standard MIT text) | Static content, no API | Canonical DSA syllabus: lists, trees, heaps, hashing, graphs, sorting, complexity. Source `.rst` modules in repo. | verified |
| JSAV (OpenDSA's algorithm-visualization JS library) | https://github.com/vkaravir/JSAV | MIT | — | Reference/port source for slideshow-style AV logic. (Older jQuery-era code; port ideas, don't ship it.) | verified (license) |
| The System Design Primer (Donne Martin) | https://github.com/donnemartin/system-design-primer | CC BY 4.0 (LICENSE.txt) | Static repo | System design syllabus + **Anki `.apkg` decks** in `resources/flash_cards/` that you can convert to Napkin flashcards (attribution required). | verified |
| *Algorithms* by Jeff Erickson (textbook only) | https://jeffe.cs.illinois.edu/teaching/algorithms/ · https://github.com/jeffgerickson/algorithms | CC BY 4.0 for the **textbook**; his *other lecture notes* are CC BY-NC-SA 4.0 (avoid those) | — | Rigorous explanations for DP, graphs, flows; good "why" text to compress into a napkin. | verified |
| Open Data Structures (Pat Morin) | https://opendatastructures.org/ · https://github.com/patmorin/ods | CC BY 2.5 (Canada) | — | Clean, short DS chapters (array stacks, skip lists, hash tables, treaps, B-trees) with Java/C++/Python source. | verified |
| Stanford CS 229 ML "VIP cheatsheets" (Afshine & Shervine Amidi) | https://github.com/afshinea/stanford-cs-229-machine-learning | MIT (© 2018 Afshine & Shervine Amidi) | — | Illustrated ML/DS syllabus: supervised/unsupervised, DL, tips & tricks, probability/stat/linear-algebra refreshers. Sister repos `stanford-cs-230-deep-learning` and `stanford-cs-221-artificial-intelligence` by the same authors both show an MIT license on GitHub (checked 2026-09-06). | verified (CS229, CS230, CS221) |
| Dive into Deep Learning (d2l) | https://github.com/d2l-ai/d2l-en | Text: **CC BY-SA 4.0**; code: modified MIT | — | Deep learning reference. **ShareAlike gotcha:** any Napkin card that adapts d2l text must itself be CC BY-SA. Keep d2l-derived cards in a clearly marked section or just link out. | verified |
| Tech Interview Handbook (Yangshun Tay) | https://github.com/yangshun/tech-interview-handbook | MIT | — | Per-topic algorithm cheatsheets, "Grind 75" question list, interview tips. | verified |
| Data Structure Visualizations (David Galles, USF) | https://www.cs.usfca.edu/~galles/JavascriptVisual/about.html · source tarball at https://www.cs.usfca.edu/~galles/JavascriptVisual/source.html | FreeBSD (2-clause BSD), © 2011 David Galles — "you can use it for whatever you like" | — | ~40 canvas-based visualizers (BST, AVL, B-tree, heaps, hashing, Dijkstra…). Port the animation-manager pattern or embed selected ones. | verified |
| algorithm-visualizer (platform + algorithm scripts) | https://github.com/algorithm-visualizer/algorithm-visualizer · https://github.com/algorithm-visualizer/algorithms | Platform repo: MIT (re-confirmed 2026-09-06). Scripts repo (`algorithms`, ~493 stars): **no license badge visible on the repo page today** — open the repo and check for a LICENSE before porting any script; assume all-rights-reserved until then. | — | Tracer-based "code → visualization" architecture; catalogue of algorithms by paradigm (backtracking, DP, greedy, divide & conquer…). | verified (platform) / likely (scripts) |
| Excalidraw public libraries | https://libraries.excalidraw.com/ · https://github.com/excalidraw/excalidraw-libraries | Repo MIT; each library is submitted under the repo's terms (MIT) — but **vendor icon packs (AWS/Azure/GCP) reuse vendor artwork under vendor terms, not OSI** | — | Software-architecture, system-design, UX-wireframe shape libraries to compose diagrams fast. | verified (repo) / unsure (individual vendor icons) |
| Excalifont (+ Virgil, Cascadia, Comic Shanns, Lilita, Nunito, Xiaolai bundled with Excalidraw) | https://plus.excalidraw.com/excalifont | SIL OFL-1.1, free for personal & commercial | — | The hand-drawn typeface that makes exported SVGs look like the Excalidraw app. | verified |
| Google Fonts handwritten faces (Caveat, Kalam, Patrick Hand, Architects Daughter) | https://fonts.google.com/ | SIL OFL-1.1 | — | Alternate "napkin" display faces. Self-host, don't hot-link (offline). | likely |
| Wikimedia Commons SVGs | https://commons.wikimedia.org/ | Per-file: PD, CC0, CC BY, CC BY-SA | — | Occasional reference diagrams (e.g. B-tree, CAP). Check each file; prefer PD/CC0/CC BY to avoid ShareAlike contamination. | likely |
| TheAlgorithms (Python/JS/…) | https://github.com/TheAlgorithms | MIT (per repo) | — | Reference implementations for code snippets on cards. | likely |
| Lottie free assets | https://lottiefiles.com/free-animations | "Lottie Simple License" (free use, no resale of the asset itself) — per-asset, check each. **Could not be re-read on 2026-09-06** (license page URLs returned 404/403); treat as unverified until you open the license from the asset page itself | Free account optional | A handful of delight animations (confetti on streak). Not for core diagrams. | unsure |

### 3b. DO NOT USE (license gotchas)

| Name | URL | Why not |
|---|---|---|
| ByteByteGo `system-design-101` | https://github.com/ByteByteGoHq/system-design-101 | **CC BY-NC-ND 4.0** — NoDerivatives forbids redrawing/adapting their infographics; NonCommercial too. Read for inspiration only; never trace. | 
| roadmap.sh (`kamranahmedse/developer-roadmap`) | https://github.com/kamranahmedse/developer-roadmap | Custom license: "Everything including text and images … protected by copyright"; publishing content elsewhere requires prior consent. Link out only. |
| VisuAlgo | https://visualgo.net/en | Not open source. Site states: no forking, no variants, no re-hosting of client files; screenshots allowed with citation. Use as a UX reference only. |
| MIT OpenCourseWare, Harvard CS50 | — | CC BY-NC-SA — NonCommercial + ShareAlike; avoid to keep Napkin's license clean and future-proof. |
| Jeff Erickson's non-textbook lecture notes | https://jeffe.cs.illinois.edu/teaching/algorithms/ | CC BY-NC-SA (only the *Algorithms* textbook is CC BY). |
| Remotion (if considered for explainer videos) | https://github.com/remotion-dev/remotion/blob/main/LICENSE.md | Free for individuals and companies ≤ 3 employees; otherwise paid company license. Fine for a solo dev, but not OSI — prefer Motion Canvas (MIT) or Manim (MIT). |

### 3c. APIs
None are required. Napkin is content-shaped and all content is compiled into the repo at build time. Optional BYO-key upgrades are listed in §9 (full vision) and always have a procedural alternative.

---

## 4. Key Libraries

| Package | Version | License | Purpose | Notes / gotchas |
|---|---|---|---|---|
| `astro` | 7.3.1 | MIT | SSG, MDX, content collections, View Transitions | Requires **Node ≥ 22.12** — run `node -v` (Node 22.x < 22.12 will refuse). https://www.npmjs.com/package/astro |
| `@astrojs/mdx`, ~~`@astrojs/preact`~~ → `@astrojs/react` | 8.0.0 (peer astro ^7.2.6, also needs peer `@astrojs/markdown-satteri ^0.4`), 6.0.5 | MIT | MDX cards; islands | ⚠ **Superseded by IMPLEMENTATION-PROMPT §0 C7: React 19, not Preact.** Install `@astrojs/react` + `react`/`react-dom` ^19 instead. Both require Node ≥ 22.12 like Astro itself. |
| `@astrojs/starlight` | 0.42.0 (peer astro ^7.2.10) | MIT | Optional docs shell with built-in Pagefind, sidebar, i18n | Fastest MVP; harder to make look like an infographic. https://starlight.astro.build/ |
| `vite-plugin-pwa` | 1.3.0 (Vite ^3–^8, Workbox 7.4.1) | MIT | Service worker + manifest, precache | Use directly in `astro.config.mjs` → `vite.plugins: [VitePWA({...})]`. https://vite-pwa-org.netlify.app/ |
| `@vite-pwa/astro` | 1.2.0 (last publish 2025-11-27) | MIT | Astro integration | **Peer range stops at Astro ^5** — do not rely on it with Astro 7 without checking for a newer release. https://github.com/vite-pwa/astro |
| `@serwist/next` | 9.5.12 (next ≥ 14) | MIT | PWA for the Next.js static-export alternative | Only if you pick Next instead of Astro; Astro is recommended. |
| `@excalidraw/excalidraw` | 0.18.1 (published 2026-04-20; peer React ^17.0.2 ‖ ^18.2 ‖ ^19) | MIT | `exportToSvg({elements, appState, files, exportPadding, metadata})` used **at build time** | Needs a DOM (`document.createElementNS`) → run under `jsdom` in Node. **Known open bug (excalidraw#10604, Jan 2026, fix PR #11764 still open):** under Node 22 + jsdom the export succeeds but floods the console with `Couldn't transform font-face to css … Cannot read properties of undefined (reading 'split')` because `FontFace.unicodeRange` is missing — expect noisy logs and possibly un-embedded fonts; the official docs say nothing about Node/SSR support. Do **not** ship this to the client. https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export |
| `excalidraw-to-svg` | 3.1.0 (**last publish 2024-02-13 — stale**) | MIT (npm) | Node CLI/API: `.excalidraw` → SVG (jsdom 24 + `canvas-5-polyfill` + `@excalidraw/utils ^0.1.2`) | Wraps the *old* `@excalidraw/utils` export, which predates Excalifont, elbow arrows and 0.18-era file features — treat as a last-resort fallback, not the primary path. https://github.com/JRJurman/excalidraw-to-svg |
| `@excalidraw/utils` | 0.1.3-test32 (npm `latest` tag really points at this test build; modified 2026-09-03) | MIT | Older standalone export utils | Pre-release naming; prefer the main package. |
| `excalidraw-animate` | 0.7.2 (2026-04-24) | MIT per GitHub `LICENSE` (© 2020 Daishi Kato); no `license` field in npm metadata | Exports (`src/library.ts`): `animateSvg(svg: SVGSVGElement, elements, options?) → {finishedMs}`, `getBeginTimeList(svg)`, `exportToSvgFile`, `exportToWebmFile`, `prepareWebmData`. `animateSvg` injects SMIL `<animate>` (attributeName `opacity`/path `d`, `begin`, `dur`, `fill="freeze"`, `calcMode`) — **no `requestAnimationFrame`, no JS at play time** (verified in `src/animate.ts`) | README: elements without an explicit order are Order = 0 and animate in creation order; 500 ms default per element; grouped elements share a 5 s budget. The "explicit order" is set in the app's Animate-mode UI; the exact `customData` key was not verified. Running `animateSvg` under jsdom is untested (it only needs `ownerDocument.createElementNS`, so it should work). https://github.com/dai-shi/excalidraw-animate |
| `mermaid` | 11.17.2 (depends on `roughjs ^4.6.6`) | MIT | Flowcharts, sequence, state, ER, mindmaps with `look: handDrawn` | 2–3 MB runtime → render at build. https://mermaid.js.org/ |
| `rehype-mermaid` | 3.0.0 (Playwright optional peer) | MIT | Build-time Mermaid → inline SVG inside MDX | Full Mermaid (incl. handDrawn) needs Playwright's headless Chromium at build (fine on CI/locally). https://github.com/remcohaszing/rehype-mermaid |
| `beautiful-mermaid` | 1.1.3 | MIT | Zero-DOM Mermaid → SVG/ASCII (flowchart, sequence, class, ER, state, XY) | Runs in plain Node without a browser; own theming (not Mermaid's handDrawn look). Good fallback if Playwright is unwanted. |
| `@terrastruct/d2` | 0.1.33 | **MPL-2.0** (file-level copyleft; fine as an unmodified dependency) | D2 text → SVG via WASM in a worker; `--sketch` hand-drawn mode; Dagre/ELK layouts | Unpacked ≈ 60 MB → **build-time only**. `const d2=new D2(); const r=await d2.compile(src,{layout:'elk',sketch:true}); const svg=await d2.render(r.diagram, r.renderOptions); await d2.dispose();` https://d2lang.com/ |
| `roughjs` | 4.6.6 (< 9 kB; **last npm publish 2023-11-20, i.e. > 2.5 years without a release**) | MIT | Sketchy primitives (`rough.svg(svgEl).rectangle(...)`) for procedural, hand-drawn DS visualizers | Effectively frozen but stable; Mermaid 11.17.2 still depends on `roughjs ^4.6.6`, so it is exercised daily. Star count not re-verified. https://roughjs.com/ |
| `gsap` (+ `DrawSVGPlugin`, `MorphSVGPlugin`, `SplitText`, `ScrollTrigger`, `Flip`) | 3.15.0 (2026-04-13) | npm `license` field literally reads `Standard 'no charge' license: https://gsap.com/standard-license`. Webflow's Standard License: free incl. commercial, all former Club plugins; **not OSI**; "Prohibited Uses" = building no-code visual-animation tools that compete with Webflow (AI-generated code explicitly allowed) | Premium SVG line-draw, morph, text reveals, scroll choreography | https://gsap.com/community/standard-license/ · announcement: https://gsap.com/blog/3-13/ (GSAP 3.13, 2025-04-29/30) |
| `motion` (ex-Framer Motion; vanilla + React APIs) | 13.2.0 (2026-09-02) | MIT (Motion+ paid extras are optional: Cursor, Ticker, examples) | OSI alternative for spring-based UI motion, layout animations | React/react-dom are listed as peers (^18 ‖ ^19) but the vanilla `motion` / `motion/dom` entry does not need React at runtime. https://motion.dev/ |
| `animejs` | 4.5.0 (2026-08-17) | MIT | Lightweight timeline/SVG morph alternative | Declares `three` as an *optional* peer — ignore the warning. |
| `vivus` | 0.4.6 (last publish 2022-06-28) | MIT | SVG "being drawn" effect without GSAP | Stale (> 4 years); GSAP DrawSVG or a 10-line `stroke-dashoffset` CSS keyframe does the same. |
| `@lottiefiles/dotlottie-web` | 0.80.0 | MIT | Play `.lottie`/JSON delight animations via WASM renderer | Keep out of the diagram pipeline; lazy-load. |
| `@xyflow/react` (React Flow) | 12.11.6 (React ≥ 17) | MIT | Interactive, pannable system-design canvases (drag nodes, animated edges) | Only for a few "playground" pages; React island. https://reactflow.dev/ |
| `pagefind` | 1.5.2 | MIT | Post-build static search index (`npx pagefind --site dist`) | Precache `pagefind/*.{js,wasm,pf_index,pf_fragment,pf_meta}` for offline. https://pagefind.app/ |
| `minisearch` | 7.2.0 | MIT | In-memory full-text index built at build time (`MiniSearch.loadJSON`) | Best when you want a custom, instant, fuzzy search UI over a few hundred cards. |
| `flexsearch` | 0.8.212 | Apache-2.0 | Fastest option, worker support | Overkill for Napkin's corpus. |
| `ts-fsrs` | 5.4.2 (FSRS-6) | MIT | Scheduler: `fsrs()`, `createEmptyCard()`, `f.next(card, now, Rating.Good)`, `f.repeat(card, now)` | https://open-spaced-repetition.github.io/ts-fsrs/ |
| `fsrs-browser` | 6.6.0 | BSD-3-Clause | WASM FSRS optimizer + scheduler in the browser (fit personal parameters from review logs) | Nice-to-have after ~1 000 reviews. |
| `dexie` | 4.4.5 | Apache-2.0 | IndexedDB wrapper for cards, review logs, progress | https://dexie.org/ |
| `svgo` | 4.1.0 (`latest`; 3.3.5 on the `v3` tag) | MIT | Minify exported SVGs at build (often 40–70 % smaller) | Keep `<animate>` elements: disable `removeUnknownsAndDefaults` on animated files or run before animation injection. |
| `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` | 8.5.1 (`@capacitor/cli` engines `node >=22.0.0`; Capacitor 8 docs: "requires NodeJS 22 or greater") | MIT | Wrap `dist/` into an Android project; `npx cap add android` (no Java needed locally) | Capacitor 8 Android template: Gradle wrapper 8.14.3, AGP 8.13.0, Kotlin 2.2.20, minSdk 24, compile/targetSdk 36. Build in CI: `cd android && ./gradlew assembleDebug` (the wrapper downloads its own Gradle 8.14.x; the runner's preinstalled Gradle is not used). https://capacitorjs.com/docs/updating/8-0 |
| `@bubblewrap/cli` | 1.25.0 (Node ≥ 18, JDK 17; downloads JDK/SDK itself) | Apache-2.0 | PWA → TWA APK/AAB; `--skipPwaValidation`, `--skipSigning`, env `BUBBLEWRAP_KEYSTORE_PASSWORD` / `BUBBLEWRAP_KEY_PASSWORD` for CI | https://github.com/GoogleChromeLabs/bubblewrap |
| `@motion-canvas/core` | 3.17.2 | MIT | Code-authored explainer videos (TS) | Output is video → keep outside the precache; optional. |
| `manim` (PyPI) | 0.21.0, Python ≥ 3.11 incl. 3.14 | MIT | 3Blue1Brown-style math/algorithm videos | Works with the owner's Python 3.14; heavy output; optional. |

---

## 5. How the Core Problem Is Solved (step by step)

### 5.1 Content architecture

```
src/
  content/
    cards/                     # one MDX file per "napkin"
      dsa/binary-search.mdx
      sysdesign/consistent-hashing.mdx
      ds/bias-variance.mdx
    tracks/                    # ordered syllabi (YAML/JSON) referencing card slugs
  diagrams/
    consistent-hashing.excalidraw     # authored in excalidraw.com, committed as JSON
    load-balancer.d2
    bfs.mmd
  components/
    viz/SortVisualizer.tsx     # island (React 19 — C7 supersedes the Preact note)
scripts/
  build-diagrams.mjs           # excalidraw/d2/mermaid -> public/diagrams/*.svg (+ animated variants)
  build-decks.mjs              # frontmatter -> public/decks/*.json (flashcards)
  build-search.mjs             # (only if MiniSearch) -> public/search-index.json
```

Card frontmatter (validated by Astro `defineCollection` + zod):

```yaml
---
title: Consistent Hashing
track: sysdesign
tags: [caching, sharding, distributed]
difficulty: 2          # 1-3
minutes: 3
diagram: consistent-hashing   # -> /diagrams/consistent-hashing.svg (+ .anim.svg)
tldr: "Hash both servers and keys onto a ring; a key belongs to the next server clockwise."
flashcards:
  - q: "Why does consistent hashing minimise re-mapping when a node joins?"
    a: "Only keys between the new node and its predecessor move (~K/N keys)."
  - cloze: "Virtual nodes fix {{uneven load}} by giving each server {{many ring positions}}."
sources:
  - { name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", license: "CC BY 4.0" }
---
```

The `sources` array feeds an automatic **Attribution** footer on every card and a site-wide credits page — this is what keeps CC BY compliance effortless.

### 5.2 Diagram pipeline (build time, zero runtime cost)

1. **Author** in the free Excalidraw web app (or the Obsidian/VS Code plugins), using Excalifont and shape libraries from libraries.excalidraw.com. Save the `.excalidraw` JSON into `src/diagrams/`. Set each element's animation order via Excalidraw's "custom data" or simply draw in narrative order (excalidraw-animate uses creation order by default).
2. **Static SVG**: `scripts/build-diagrams.mjs` runs `exportToSvg` under jsdom (or `excalidraw-to-svg`) → `public/diagrams/<name>.svg`. Embed Excalifont as a subset `@font-face` in the SVG *or* strip the font and let the page CSS supply it (smaller: one shared font file instead of per-SVG embedding).
3. **Animated SVG**: same script parses the exported SVG with jsdom, calls `animateSvg(svg, elements, { startMs: 0 })` from `excalidraw-animate`, writes `<name>.anim.svg`. Result plays as pure SMIL — works in `<img>`, `<object>`, inline, offline, no JS. Also record `getBeginTimeList()` into a sidecar JSON so an inline island can offer "step ▶" buttons by toggling `svg.pauseAnimations()/setCurrentTime(t)`.
4. **Text diagrams**: `.mmd` → `rehype-mermaid` (Playwright, handDrawn look) inline in MDX; `.d2` → `@terrastruct/d2` with `sketch: true, layout: 'elk'` → SVG file. Both run only in the build script.
5. **Optimize**: `svgo` with a preset that preserves `<animate>`, `id` attributes referenced by `begin="id.end"`, and `font-family`. Typical Excalidraw export: 30–120 kB → 10–40 kB → 3–10 kB Brotli.
6. **Embed**: MDX `<Napkin name="consistent-hashing" animate />` component renders `<img src="/diagrams/x.anim.svg" loading="lazy">` (cheapest) or inlines the SVG when interactivity/theming is needed (dark mode via `currentColor` and CSS variables — exported Excalidraw SVGs use literal colors, so run a post-process that maps the Excalidraw palette to CSS variables if you want theme-aware diagrams).

### 5.3 Interactive algorithm visualizers (islands)

- Model each visualizer as **(state, steps[])**: a pure function produces a list of frames (`{arr, i, j, swapped}`) or events (`compare(i,j)`, `swap(i,j)`, `visit(node)`), exactly like algorithm-visualizer's *tracer* concept and Galles' *animation manager*.
- Render frames with **Rough.js** into an inline SVG (sketchy rectangles/circles match the Excalidraw diagrams), and animate transitions with GSAP `Flip` / `motion`'s `animate()` (or plain CSS transitions on `transform`) — 60 fps on Android WebView.
- Controls: play/pause/step/speed slider; keyboard shortcuts; reduced-motion respects `prefers-reduced-motion`.
- Starter set (each ~150–300 lines Preact): bubble/insertion/merge/quick sort; binary search; BFS/DFS on a grid; Dijkstra; BST insert/search; hash table with chaining + load factor; LRU cache; consistent-hash ring (add/remove node, watch key movement); leaky/token bucket rate limiter; CAP/quorum reads (N, R, W sliders).
- Ports: Galles' visualizers (FreeBSD) are canvas-based with a clean `AnimationManager`; port the *step generation* logic and re-skin with Rough.js.

### 5.4 Spaced repetition (flashcards)

1. `build-decks.mjs` collects every `flashcards[]` entry across cards → `public/decks/<track>.json` with stable IDs (`sha1(cardSlug + question)`), so re-deploys never orphan review history.
2. On first run, seed Dexie table `cards` with `createEmptyCard()` per deck item (`due`, `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state`, `last_review`) and an empty `review_logs` table.
3. Review session: `const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true }))`; `const preview = f.repeat(card, now)` gives the four outcomes (Again/Hard/Good/Easy) with predicted intervals to show under the buttons; on tap, `const { card: next, log } = f.next(card, now, Rating.Good)`; write both.
4. Queue = `cards.where('due').belowOrEqual(now)` + N new cards/day cap. Cloze cards render via a tiny `{{…}}` parser. Everything is offline.
5. Optional: after ≥ 1 000 logs, run `fsrs-browser`'s WASM optimizer in a Web Worker to fit the 21 FSRS-6 parameters to the user; store in `settings`.
6. Import: convert System Design Primer's Anki `.apkg` (a zip containing a SQLite `collection.anki2`) with a 30-line Python script (stdlib `zipfile` + `sqlite3`) into the same deck JSON. Fields are HTML; strip tags, keep attribution.

### 5.5 Offline search

- **Pagefind route** (recommended with Starlight or minimal custom UI): `astro build && npx pagefind --site dist`. Add `pagefind/**` to `workbox.globPatterns` (`**/*.{html,js,css,svg,woff2,json,wasm,pagefind,pf_index,pf_fragment,pf_meta}` — the pattern the Starlight-Pwa template uses) so shards are precached. Pagefind loads `pagefind.js` + WASM (~ 100–200 kB) lazily.
- **MiniSearch route** (recommended for a bespoke command-palette UI): build script indexes `{id, title, tldr, tags, body}` → `search-index.json` (a few hundred cards ≈ 100–300 kB raw, ~ 30–60 kB Brotli); at runtime `MiniSearch.loadJSON(json, opts)` in a worker; fuzzy + prefix + field boosts. Simpler mental model, one file to precache.

### 5.6 Offline / PWA

```js
// astro.config.mjs
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  vite: { plugins: [VitePWA({
    registerType: 'autoUpdate',
    manifest: { name: 'Napkin', short_name: 'Napkin', display: 'standalone', theme_color: '#fffdf7', icons: [...] },
    workbox: {
      globDirectory: 'dist',
      globPatterns: ['**/*.{html,js,css,svg,woff2,json,wasm,pf_index,pf_fragment,pf_meta}'],
      navigateFallback: '/offline/',        // or '/404/' for a "Not cached yet" page
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      runtimeCaching: [{ urlPattern: /\/videos\//, handler: 'CacheFirst', options: { cacheName: 'videos', expiration: { maxEntries: 20 } } }],
    },
  })]},
});
```
Note: `vite-plugin-pwa` inside Astro may need a post-build `workbox-build.generateSW()` call instead (Astro's build output dir timing differs from a Vite SPA). The Starlight-Pwa template (MIT, https://github.com/abdulhakim-alshanqiti/Starlight-Pwa) shows a working configuration *shape* — but note its `package.json` pins **`astro ^4.14`, `@astrojs/starlight ^0.26`, `@vite-pwa/astro ^0.4.0`**, i.e. it is an Astro 4 project using the (now peer-incompatible) integration, not a direct `vite-plugin-pwa` setup on Astro 7. Its config options (`registerType:'autoUpdate'`, `skipWaiting`, `clientsClaim`, `navigateFallback:'/404'`, `ignoreURLParametersMatching:[/./]`, pagefind globs, `experimental.directoryAndTrailingSlashHandler`) could not be re-read today (raw `astro.config.mjs` 404 on both `main` and `master`) — copy them from the repo UI, not from memory.

**Safest plan (verified components only):** run `astro build`, then a 20-line `scripts/build-sw.mjs` calling `workbox-build.generateSW({ globDirectory: 'dist', globPatterns, swDest: 'dist/sw.js', navigateFallback, skipWaiting: true, clientsClaim: true })` (workbox-build 7.4.1, MIT, Node ≥ 20) and register `sw.js` yourself. This sidesteps both the `@vite-pwa/astro` peer problem and any Astro/Vite plugin-ordering surprises.

Update UX: show a "New napkins available — refresh" toast from the `onNeedRefresh` hook rather than silently swapping.

### 5.7 Bundle-size discipline for offline

| Tactic | Effect |
|---|---|
| Diagrams as optimized SVG, fonts *not* embedded per-file | 3–10 kB Brotli per diagram → 300 diagrams ≈ 2–3 MB precache |
| Subset fonts (`pyftsubset` from `fonttools`, Python; or `subfont`) to Latin + used glyphs, woff2 | Excalifont ≈ 25–40 kB; text face ≈ 20–30 kB per weight; ship ≤ 3 files |
| React 19 islands (C7 — the row originally said Preact); no Excalidraw/Mermaid/D2 at runtime | App JS ≤ 80 kB gz per route, Counter ≤ 40 kB |
| `client:visible` / `client:idle` for islands; `loading="lazy"` for `<img>` SVGs | First paint is pure HTML |
| No raster images; if unavoidable, AVIF/WebP ≤ 50 kB | — |
| Video/Lottie via `runtimeCaching` (CacheFirst, capped), never precache | Precache stays < 10 MB |
| `astro build` + Cloudflare/GitHub Pages Brotli | HTML pages 5–15 kB each |
| Budget check in CI: `du -sh dist` + fail if `dist` > 25 MB or any file > 3 MB | Prevents drift |

### 5.8 Android build (GitHub Actions, no local Java)

Capacitor route:
1. Locally: `npm i @capacitor/core @capacitor/cli @capacitor/android && npx cap init Napkin com.rahul.napkin --web-dir dist && npx cap add android` (pure file generation; commit `android/`). The app id is `com.rahul.napkin` (C6) — the portfolio convention, and immutable after the first install.
2. `.github/workflows/android.yml` on `ubuntu-latest` (= Ubuntu 24.04 as of 2026-09-06; 26.04 is still "preview"). The 24.04 image ships JDK 8.0.502 / 11.0.32 / **17.0.20 (default)** / 21.0.12 / 25.0.4, Android Command Line Tools 12.0, build-tools 34.0.0 · 35.0.0/35.0.1 · 36.0.0/36.1.0 · 37.0.0, platforms android-34 … android-37.2-beta3, Gradle 9.7.1, Node 22.23.2 (system) + 24.19.0 cached. Capacitor 8's template needs compileSdk 36 (present) and AGP 8.13 (needs JDK ≥ 17 — the default is fine; pin with `actions/setup-java` `temurin` 17 or 21 anyway so a future image change cannot break you). `./gradlew` downloads Gradle 8.14.3 itself (~130 MB, cache with `gradle/actions/setup-gradle`). Steps: `npm ci && npm run build && npx cap sync android && cd android && ./gradlew assembleDebug` → upload `app/build/outputs/apk/debug/app-debug.apk` as a workflow artifact and to a GitHub Release (`softprops/action-gh-release`). Source: https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md
3. For a signed release APK: generate a keystore once (`keytool` also runs in CI; or run it in a one-off workflow and download), store base64 in repo secrets, decode at build, pass `-Pandroid.injected.signing.*` Gradle props.

TWA route (alternative): `npx @bubblewrap/cli init --manifest https://napkin.pages.dev/manifest.webmanifest` locally once (it offers to download JDK 17 + SDK; on Windows this works but is a ~1 GB download), commit the generated project, then CI runs `bubblewrap build --skipPwaValidation` with `BUBBLEWRAP_KEYSTORE_PASSWORD`/`BUBBLEWRAP_KEY_PASSWORD` secrets. Publish `/.well-known/assetlinks.json` with the signing cert's SHA-256 or the app shows browser chrome. The marketplace "PWA to APK action" (v1.0.0, https://github.com/marketplace/actions/pwa-to-apk-action) wraps this but still needs the pre-generated project committed.

---

## 6. Reference Projects

| Project | URL | License | What to borrow |
|---|---|---|---|
| algorithm-visualizer | https://github.com/algorithm-visualizer/algorithm-visualizer | MIT | Tracer/renderer split (`Array1DTracer`, `GraphTracer`, `LogTracer`), player controls, algorithm catalogue by paradigm. |
| Data Structure Visualizations (Galles) | https://www.cs.usfca.edu/~galles/JavascriptVisual/ | FreeBSD | `AnimationManager` + `ObjectManager` pattern; step lists for BST/AVL/B-tree/heap/hash; proven pedagogy. |
| OpenDSA + JSAV | https://github.com/OpenDSA/OpenDSA · https://github.com/vkaravir/JSAV | MIT | Module ordering for a DSA syllabus; "slideshow" AV UX (step captions synchronized with visuals). |
| System Design Primer | https://github.com/donnemartin/system-design-primer | CC BY 4.0 | Topic tree, trade-off bullet style, Anki decks to bootstrap flashcards. |
| Starlight-Pwa | https://github.com/abdulhakim-alshanqiti/Starlight-Pwa | MIT | Offline config shape for Astro + Pagefind precache — **but it is an Astro 4 / Starlight 0.26 / `@vite-pwa/astro` 0.4 project**; port the workbox options, not the dependency list. |
| excalidraw-animate | https://github.com/dai-shi/excalidraw-animate (demo: https://dai-shi.github.io/excalidraw-animate/) | MIT | SMIL animation injection; also exports WebM. |
| Amidi CS229 cheatsheets | https://github.com/afshinea/stanford-cs-229-machine-learning | MIT | The gold standard for "infographic-style" ML study sheets; structure and density to emulate. |
| Tech Interview Handbook | https://github.com/yangshun/tech-interview-handbook | MIT | Per-topic cheatsheets + Grind 75 as a "track". |
| Excalidraw system-design templates (aretecode) | https://github.com/aretecode/system-design-templates-excalidraw | **No license shown on the repo page (2026-09-06)** → legally all-rights-reserved; do not copy shapes without asking the author | Loosely-grouped reusable shapes for rapid system-design sketches — look, don't lift. |

---

## 7. Visual / Design Enablers ("best of the best" for this project)

- **Hand-drawn coherence end-to-end:** Excalidraw exports, Mermaid `look: handDrawn`, D2 `--sketch`, and Rough.js islands all share the same sketchy language; set one palette (paper `#fffdf7`, ink `#1e1e1e`, 4 accent hues) and apply it to Excalidraw's element colors, Mermaid theme variables, D2 `style` and Rough.js `stroke/fill` so nothing looks pasted in.
- **Typography:** **⚠ Superseded by IMPLEMENTATION-PROMPT §0.** DESIGN §5 fixes the set at **Caveat (display), Excalifont (diagram labels), Nunito (body), JetBrains Mono (numbers)** — explicitly *no Inter*, and Fraunces is reserved for Chez Fridge (06). ~~Inter/Manrope/Fraunces for body~~. GSAP `SplitText` (free) for playful title reveals stays optional; `text-wrap: balance`/`pretty` for napkin headlines.
- **Paper feel with zero bytes:** SVG `feTurbulence` + `feColorMatrix` grain filter and a subtle `linear-gradient` "ruled" background; CSS `mask` torn-edge cards; all pure CSS.
- **Animated diagrams without JS:** SMIL from `excalidraw-animate`; CSS `stroke-dasharray/offset` keyframes for "being drawn" lines; `prefers-reduced-motion` fallback to the static SVG.
- **Interactive choreography:** GSAP DrawSVG (line draw), MorphSVG (array → linked list morph), Flip (re-layout of nodes during sort), ScrollTrigger (scrollytelling explainers); or `motion` (MIT) `animate()`/`layout` for spring physics.
- **Navigation as a "flip through a notebook":** Astro View Transitions (`<ClientRouter />`) with `view-transition-name` on the card so the diagram slides between list and detail; swipe gestures on Android via `motion`'s drag or a tiny pointer handler.
- **Icons:** Lucide (ISC) or Phosphor (MIT); hand-drawn icon look via Rough.js re-render of Lucide paths (`rough.svg(svg).path(d, {roughness: 1.2})`).
- **Delight:** `@lottiefiles/dotlottie-web` (MIT) for a streak confetti; keep to 1–2 assets, lazy.
- **Explainer videos (optional, out of precache):** Motion Canvas (MIT, TypeScript) or Manim (MIT, Python 3.14-compatible) rendered in CI to WebM; runtime-cached on demand.
- **Share-as-image:** inline SVG → PNG via `canvas.drawImage(new Image(svgBlobURL))` for "post this napkin" — no library needed.

---

## 8. Risks & Mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | `@vite-pwa/astro` 1.2.0 declares Astro peer ≤ 5; Astro 7 is current (upstream issues #72 / #74 open, no release since 2025-11-27) | Use `vite-plugin-pwa` 1.3.0 directly in `vite.plugins`, or — the fully verified path — a post-build `workbox-build.generateSW()` script (Workbox 7.4.1, MIT). Check https://github.com/vite-pwa/astro/issues/74 before starting. |
| 2 | Astro 7 requires Node ≥ 22.12; owner has "Node 22" | `node -v`; upgrade to 22.x LTS latest if below 22.12 (nvm-windows / winget). |
| 3 | Excalidraw `exportToSvg` needs DOM APIs in Node, and the jsdom path has an **open upstream bug** (excalidraw#10604: `FontFace.unicodeRange` undefined → font-face CSS transform errors; SVG still produced) | Try jsdom first with a tiny `FontFace` polyfill / `document.fonts` stub and strip the embedded `@font-face` anyway (page CSS supplies Excalifont). If output is wrong, the reliable fallback is a Playwright page (`npx playwright install chromium`, already needed for `rehype-mermaid`) that loads `@excalidraw/excalidraw` and calls `exportToSvg` in a real browser. `excalidraw-to-svg` (2024, old `@excalidraw/utils`) is a last resort. Cache outputs by content hash so builds stay fast. |
| 4 | Mermaid handDrawn look needs a headless browser at build | `rehype-mermaid` + Playwright in CI (`npx playwright install chromium`) — or `beautiful-mermaid` (zero-DOM) for a crisp non-sketch style. Never ship Mermaid to the client. |
| 5 | D2 WASM is huge (package ≈ 60 MB unpacked) | Build-time only; keep it a devDependency; MPL-2.0 is compatible as an unmodified dependency. |
| 6 | Content license contamination (NC/ND/ShareAlike/proprietary sources) | Whitelist (§3a) enforced by the `sources` frontmatter (zod enum of allowed licenses); auto-generated attribution footers; CC BY-SA-derived cards isolated or avoided; never trace ByteByteGo/roadmap.sh art. |
| 7 | Offline bundle bloat over time | Budgets in CI (§5.7); `maximumFileSizeToCacheInBytes`; video/Lottie only in runtime caches. |
| 8 | Service-worker staleness / confusing updates | `registerType:'autoUpdate'` + "refresh" toast; version stamp in footer; `navigateFallback` to an explicit "not cached yet" page. |
| 9 | Rough.js and Vivus have slow maintenance | Rough.js is tiny, stable, and a Mermaid dependency (de-facto maintained); skip Vivus entirely (CSS or GSAP DrawSVG). |
| 10 | GSAP is free but not OSI (Webflow license) | Acceptable for this project; if you insist on OSI-only, `motion` + `animejs` cover 90 %. Never embed GSAP into a no-code animation builder product. |
| 11 | Capacitor APK is a debug build unless signed | Keystore in GitHub Secrets (base64), inject Gradle signing props; or accept debug APK for personal sideload. |
| 12 | Android WebView performance with many SMIL animations on one page | One animated SVG in viewport at a time (`IntersectionObserver` → `pauseAnimations()` offscreen); static SVG in lists. |
| 13 | Dark mode vs literal colors inside exported SVGs | Post-process SVGs mapping Excalidraw palette → `var(--ink)` etc. when inlined; for `<img>` usage, export a dark variant at build. |
| 14 | Starlight's docs look vs the infographic brief | Use plain Astro; borrow Starlight only for the weekend MVP or its sidebar/i18n if needed later. |

---

## 9. MVP (a weekend) vs Full Vision

### MVP — one weekend
1. `npm create astro@latest` (Astro 7, MDX, **React islands** — C7 supersedes Preact), content collection `cards` with the frontmatter schema above; **20 cards** (7 DSA, 7 system design, 6 DS/ML) written from the whitelisted sources with attribution.
2. Author 20 diagrams in excalidraw.com → commit JSON → `scripts/build-diagrams.mjs` (jsdom + `exportToSvg`, svgo) → static SVG. Animated variants for 5 of them via `excalidraw-animate`.
3. Home = masonry of napkin cards with View Transitions; card page = title, tldr, diagram, 3–5 bullets, "related" chips, attribution.
4. Search via Pagefind CLI post-build; simple search modal.
5. Flashcards: `ts-fsrs` + Dexie, one "Review" page fed by `decks/*.json` generated from frontmatter (no Anki import yet).
6. Offline: **⚠ Superseded by IMPLEMENTATION-PROMPT §0.** C8 — post-build `scripts/build-sw.mjs` (`workbox-build.generateSW`) with the glob list above, manifest, icons; test with DevTools "Offline".
7. **⚠ Superseded by IMPLEMENTATION-PROMPT §0.** Deploy to **GitHub Pages** via `pages.yml` (DECISIONS D2) and add `android-release.yml` that builds a signed Capacitor APK and attaches it to a Release. Install on phone.

### Full vision
- 200–400 cards across 3 tracks with ordered "syllabus" tracks, prerequisites graph, progress ring per track (all local, exportable/importable JSON).
- 12–15 interactive visualizers (§5.3) with Rough.js rendering and GSAP/motion choreography; scrollytelling explainers for consistent hashing, Raft, LSM trees, backprop.
- Every diagram animated (SMIL) with step captions and a scrubber; dark-mode variants; share-as-PNG.
- Anki import of System Design Primer decks; `fsrs-browser` personal parameter optimization; daily goals, streaks, heatmap.
- D2/Mermaid "diagram source" toggle on each card ("see how this napkin was drawn") for learners who want the text form.
- Quiz mode (procedural: MCQ generated from cloze/definitions/Big-O tables — no LLM required).
- Optional BYO-key **LLM helpers** (user pastes their own key; calls go browser → provider; nothing stored server-side): "explain like I'm 5", "generate 3 more flashcards from this card", "quiz me". Procedural alternatives ship by default: pre-written ELI5 field, template-generated flashcards (term/definition, complexity-table cloze, "which structure would you use for…" from tags), and hand-authored quizzes.
- Signed release APK; optional TWA variant published to the site for one-tap install; optional Play Store listing later.
- i18n via Astro content collections (Starlight-style) if desired.

---

## 10. Open Questions

1. Does `@vite-pwa/astro` get an Astro 6/7-compatible release soon (track vite-pwa/astro#72 and #74), or is the direct `vite-plugin-pwa`/`workbox-build` path the permanent choice? (Check the repo before scaffolding.)
2. Do Excalidraw-exported SVGs with `excalidraw-animate` SMIL render correctly inside Android WebView when used as `<img>` (SMIL in `<img>` is supported in Chromium, but verify on the target device) — fall back to inline SVG if not.
3. Should ML/DS diagrams adapt the Amidi cheatsheets' visuals (MIT, so allowed) or be redrawn from scratch for stylistic unity? (Recommendation: redraw, cite.)
4. License of `algorithm-visualizer/algorithms` (scripts repo) and `aretecode/system-design-templates-excalidraw` — read the LICENSE files before porting anything.
5. Which vendor icon packs (AWS/Azure/GCP) are acceptable? Vendor terms generally permit use in architecture diagrams but are not open licenses; for a purely educational personal project this is low risk, but generic hand-drawn "server/cache/queue" glyphs avoid the question entirely.
6. Pagefind vs MiniSearch: decide once the card UI is designed — Pagefind if the standard modal is fine, MiniSearch if a custom command palette with fuzzy tag filtering is wanted.
7. Capacitor vs TWA long-term: Capacitor for guaranteed offline-at-install; TWA if you want content to update without reinstalling. (Both can coexist: same `dist/`.)

---

## 11. Verification log (2026-09-06)

Adversarial re-check of the dossier. Method: npm registry metadata via `npm view` (local Node 22), raw GitHub files / GitHub license API / repo pages, official docs pages. "Confirmed" = primary source read today; "Corrected" = dossier text changed above; "Unverifiable" = could not reach a primary source today.

### Flagged claims

| # | Claim | Verdict | Evidence / source |
|---|---|---|---|
| 1 | `@vite-pwa/astro` latest 1.2.0, peer `astro ^1.6–^5`, last published 2025-11-27; no Astro 6/7 release | **Confirmed** | `npm view @vite-pwa/astro`: `peerDependencies.astro = "^1.6.0 ‖ ^2.0.0 ‖ ^3.0.0 ‖ ^4.0.0 ‖ ^5.0.0"`, `time.modified 2025-11-27T22:14:33Z`, 26 versions total, none after 1.2.0. Open issues https://github.com/vite-pwa/astro/issues/72 (Astro 6 peer range) and https://github.com/vite-pwa/astro/issues/74 (Astro 7 support, 2026-07-11). `vite-plugin-pwa` 1.3.0 (2026-05-05) peers: `vite ^3.1 … ^8.0`, `workbox-build/window ^7.4.1`; Astro 7.3.1 depends on `vite ^8.0.13`, so the peer range matches. "Works inside Astro 7" itself is untested; `workbox-build.generateSW` post-build is the guaranteed path. |
| 2 | `excalidraw-animate` 0.7.2, MIT, 2026-04-24, `animateSvg()` emits pure SMIL | **Confirmed with nuance** | npm: version 0.7.2, `time 2026-04-24T23:48:47Z`, deps `@excalidraw/excalidraw 0.18.1` + `pako 2.1.0`, **no `license` field**; GitHub license API reports `MIT`, "Copyright (c) 2020 Daishi Kato" (https://api.github.com/repos/dai-shi/excalidraw-animate/license). `src/animate.ts` creates `<animate>` via `createElementNS(SVG_NS,'animate')` with `attributeName`/`begin`/`dur`/`fill="freeze"`; no `requestAnimationFrame` (https://raw.githubusercontent.com/dai-shi/excalidraw-animate/main/src/animate.ts). Exports from `src/library.ts`: `animateSvg`, `getBeginTimeList`, `exportToSvgFile`, `exportToWebmFile`, `prepareWebmData`. SMIL inside `<img>` on Android WebView is Chromium-standard behaviour but was **not device-tested**; `animateSvg` under jsdom was **not executed**. |
| 3 | `exportToSvg` from `@excalidraw/excalidraw` 0.18.1 works in Node under jsdom (or via `excalidraw-to-svg`) | **Corrected (partially true, risky)** | 0.18.1 published 2026-04-20, MIT, peer React ^17.0.2 / ^18.2 / ^19. Official docs (https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export) document only the browser signature, nothing about Node. Open issue https://github.com/excalidraw/excalidraw/issues/10604 (Jan 2026, Node 22 + jsdom 27): SVG is produced but font-face transformation throws `Cannot read properties of undefined (reading 'split')` for every font; fix PR #11764 (2026-07-26) still open. `excalidraw-to-svg` 3.1.0: MIT, **last publish 2024-02-13**, deps `@excalidraw/utils ^0.1.2`, `jsdom ^24`, `canvas-5-polyfill`, so it predates Excalifont/elbow arrows. Dossier now recommends jsdom + FontFace stub with a Playwright fallback. |
| 4 | Amidi CS229 MIT; System Design Primer CC BY 4.0; Erickson textbook CC BY 4.0; ODS CC BY 2.5; OpenDSA & JSAV MIT; Galles FreeBSD | **Confirmed** | Amidi: raw LICENSE "MIT License / Copyright (c) 2018 Afshine Amidi and Shervine Amidi"; CS230 and CS221 repo pages also show MIT. SDP: raw LICENSE.txt "Creative Commons Attribution 4.0 International License (CC BY 4.0)", (c) 2017 Donne Martin. Erickson: https://jeffe.cs.illinois.edu/teaching/algorithms/ — textbook "Creative Commons Attribution 4.0 International"; "All other lecture notes … Attribution-NonCommercial-ShareAlike 4.0". ODS: https://opendatastructures.org/ — "Creative Commons Attribution License" linking to by/2.5/ca. OpenDSA: `MIT-license.txt` "Distributed under the MIT License, (c) 2011-2025 Ville Karavirta and Cliff Shaffer". JSAV: `MIT-license.txt`, SPDX MIT. Galles: about.html "Everything is licensed under FreeBSD, and you can use it for whatever you like", (c) 2011. |
| 5 | ByteByteGo CC BY-NC-ND 4.0; roadmap.sh custom all-rights-reserved; VisuAlgo forbids forking/re-hosting | **Confirmed** | ByteByteGo `LICENSE.md`: "This work is licensed under CC BY-NC-ND 4.0" (GitHub API + README). roadmap.sh `license` file: "Everything including text and images in this project are protected by the copyright laws… must get prior consent" (https://api.github.com/repos/kamranahmedse/developer-roadmap/license). VisuAlgo https://visualgo.net/en: "we do not permit others to fork this project or create VisuAlgo variants"; "Please refrain from downloading VisuAlgo's client-side files and hosting them on your website"; screenshots OK with citation; personal offline copy OK. |
| 6 | GSAP + all former Club plugins free for commercial use since 2025-04-30 under Webflow Standard License; only restriction = competing no-code animation tools | **Confirmed (date ±1 day)** | https://gsap.com/community/standard-license/ — "Standard 'No Charge' GSAP License" granted by Webflow; FAQ "Can I really use GSAP in commercial projects without paying anything? Yes"; "All of GSAP including the plugins that were formerly 'members-only' like SplitText and MorphSVG can be used in commercial projects at no charge"; Prohibited Uses = "tools that allow users to build visual animations without code" competing with Webflow; "AI-generated code is not a 'Prohibited Use'". Announcement post https://gsap.com/blog/3-13/ is dated 2025-04-29 (widely reported as April 30). npm `gsap` 3.15.0 license string: `Standard 'no charge' license: https://gsap.com/standard-license`. |
| 7 | ubuntu-24.04 runners ship JDK 17 default, cmdline-tools 12, build-tools 34–37, platforms 34–37, Gradle 9.7.1, so `./gradlew assembleDebug` works with no local Java | **Confirmed with nuance** | https://raw.githubusercontent.com/actions/runner-images/main/images/ubuntu/Ubuntu2404-Readme.md: Java 8.0.502 / 11.0.32 / **17.0.20 (default)** / 21.0.12 / 25.0.4; Android Command Line Tools 12.0; build-tools 34.0.0, 35.0.0, 35.0.1, 36.0.0, 36.1.0, 37.0.0; platforms android-34 … android-37.2-beta3; Gradle 9.7.1; Node 22.23.2. `ubuntu-latest` = 24.04 (runner-images README; 26.04 is preview). Nuance: Capacitor 8 template uses Gradle **wrapper 8.14.3** + AGP 8.13 (https://capacitorjs.com/docs/updating/8-0), so the preinstalled Gradle 9.7.1 is irrelevant and the wrapper download should be cached; JDK 17 satisfies AGP 8.13. Not executed end-to-end today. |
| 8 | Astro 7.3.1 needs Node ≥ 22.12; Starlight 0.42.0 peer astro ^7.2.10; Pagefind 1.5.2 / MiniSearch 7.2.0 / ts-fsrs 5.4.2 (FSRS-6) / Dexie 4.4.5 / Capacitor 8.5.1 with MIT/MIT/MIT/Apache-2.0/MIT | **Confirmed** | `npm view`: astro 7.3.1 (2026-09-03) `engines.node ">=22.12.0"`, MIT; @astrojs/starlight 0.42.0 (2026-09-02) peer `astro ^7.2.10`, MIT; pagefind 1.5.2 (2026-04-12) MIT; minisearch 7.2.0 (2025-09-16) MIT; ts-fsrs 5.4.2 (2026-09-01) MIT, README badge "FSRS-v6" (https://github.com/open-spaced-repetition/ts-fsrs; note 6.0.0-beta.8 exists on npm); dexie 4.4.5 (2026-08-14) Apache-2.0; @capacitor/android 8.5.1 MIT (`latest`; 9.0.0-alpha.6 on `next`), @capacitor/cli engines `node >=22.0.0`. |

### Whole-file scan

| Item | Verdict | Note / source |
|---|---|---|
| APIs requiring payment / card / shut down | **None found** | The dossier uses no third-party APIs. Cloudflare Pages Free limits re-read (500 builds/mo, 20 000 files, 25 MiB/file, 100 custom domains) at https://developers.cloudflare.com/pages/platform/limits/ — that page does not state a card requirement. |
| Licenses — AGPL / non-commercial | **No hidden AGPL/NC in the "use" list** | `@terrastruct/d2` 0.1.33 MPL-2.0 (npm) — correctly flagged. GSAP non-OSI — correctly flagged. Remotion: LICENSE.md "an individual" / "a for-profit organization with up to 3 employees" free, otherwise Company License — confirmed. d2l-en: README "Creative Commons Attribution-ShareAlike 4.0" for the book, "modified MIT license" for code — confirmed. excalidraw-libraries repo: MIT — confirmed; per-library vendor icon terms still unverified. Tech Interview Handbook: MIT — confirmed. Excalifont: https://plus.excalidraw.com/excalifont "Released under the OFL-1.1 license … personal and commercial use" — confirmed. |
| Licenses — corrected / downgraded | **4 changes** | `excalidraw-to-svg` "check LICENSE (MIT expected)" → MIT confirmed on npm but stale. `aretecode/system-design-templates-excalidraw` → no license visible on the repo page → treated as all-rights-reserved. `algorithm-visualizer/algorithms` → no license badge visible today → downgraded to "verify before porting". `excalidraw-animate` → MIT but only via GitHub LICENSE (npm metadata has no license field). |
| Unmaintained > 2 years | **3 packages** | `roughjs` 4.6.6 last publish 2023-11-20 (noted; still a Mermaid dependency). `vivus` 0.4.6 last publish 2022-06-28 (dossier said 2021; corrected; already marked "skip"). `excalidraw-to-svg` 3.1.0 last publish 2024-02-13 (corrected, demoted to last resort). Borderline: `@motion-canvas/core` 3.17.2 last publish 2025-02-16 (optional). |
| Nonexistent package names | **None** | Every npm name in §2/§4 resolved on the registry today: astro, @astrojs/starlight, @astrojs/mdx (8.0.0), @astrojs/preact (6.0.5), vite-plugin-pwa, @vite-pwa/astro, @excalidraw/excalidraw, @excalidraw/utils (`latest` tag = 0.1.3-test32, as stated), excalidraw-animate, excalidraw-to-svg, mermaid 11.17.2, rehype-mermaid 3.0.0 (peer `playwright 1`), beautiful-mermaid 1.1.3, @terrastruct/d2 0.1.33, roughjs 4.6.6, gsap 3.15.0, motion **13.2.0** (dossier said 12.x — corrected), animejs 4.5.0 (optional peer `three`), vivus 0.4.6, @lottiefiles/dotlottie-web 0.80.0, @xyflow/react 12.11.6, pagefind 1.5.2, minisearch 7.2.0, flexsearch 0.8.212 Apache-2.0, ts-fsrs 5.4.2, fsrs-browser 6.6.0 BSD-3-Clause, dexie 4.4.5, svgo **4.1.0** (dossier said 3.x/4.x — pinned), @capacitor/* 8.5.1, @bubblewrap/cli 1.25.0 Apache-2.0 (node ≥ 18), @motion-canvas/core 3.17.2, @serwist/next 9.5.12, workbox-build 7.4.1 (node ≥ 20). PyPI `manim` 0.21.0, MIT, `requires_python >=3.11`, classifier "Python :: 3.14" present — confirmed. |
| "No API key needed" claims | **Confirmed** | §3c "None are required" holds: no external API is called at build or runtime; optional LLM features are BYO-key by design. |
| "Works in browser / CORS" claims | **N/A / partially verified** | No cross-origin fetches exist. Verified from source: SMIL-only output of `excalidraw-animate`. Not verified on device: SMIL playback inside `<img>` on Android WebView (Open Question 2 stands). |
| Rate limits stated without source | **Sourced now** | Cloudflare Pages limits (see above). GitHub Actions free minutes were never quantified in the dossier (public repos: unlimited standard runners; private repos: 2 000 min/mo on Free — **not re-verified today**). |
| Other reference checks | — | PWA-to-APK marketplace action exists (v1.0.0 by sharadcodes; requires a pre-generated Bubblewrap project) — confirmed. Starlight-Pwa repo exists, MIT, but is Astro 4 + `@vite-pwa/astro` 0.4 — dossier corrected; its `astro.config.mjs` could not be fetched raw (404 on `main` and `master`), so the quoted option list is from the researcher's earlier read, not re-verified. Lottie Simple License page not reachable today (404/403) — marked unsure. Capacitor 8 docs: "requires NodeJS 22 or greater", Android Studio 2025.2.1+, minSdk 24, target/compileSdk 36 — confirmed. |

**Overall:** No blocking errors. The two substantive corrections are (a) the Node/jsdom `exportToSvg` path has an open upstream bug and `excalidraw-to-svg` is stale, so plan for a Playwright fallback; (b) the Starlight-Pwa "reference config" is an Astro 4 project. Minor version drift fixed: motion 13.2.0, gsap 3.15.0, svgo 4.1.0, vivus last publish 2022.
