# Decisions (October 2026 build) — these supersede the planning docs

The planning documents in this folder (GOAL, PLAN, DESIGN, ARCHITECTURE, IMPLEMENTATION-PROMPT, …) describe the original "Corner Booth" diner concept. During the build the owner asked for a more modern look ("not a poker table"), for stories that make hard ideas easy, and for far broader and deeper coverage. Where this file and the planning docs disagree, **this file wins**.

## Product

| Area | Planned | Built | Why |
|---|---|---|---|
| Visual identity | Green formica counter, chrome dispenser, four-colour pen as controls | **"Sketchbook"**: warm paper ground with a dot grid, clean cards, Bricolage Grotesque display type, hand-drawn diagrams on blueprint-grid paper, track colours (DSA tomato, System Design blue, Data Science green), light + dark themes | Modern, legible, fast; keeps the napkin soul in the drawings and small touches (napkin logo, "Today's pick" tape, receipt) |
| Napkin page | One diagram + ruler scrubber + bullets | **Layered lesson**: TL;DR + analogy → scene-by-scene **story** (each scene draws its strokes) → key ideas + complexity → **deep dive** (worked example, Python, pitfalls, interview angle) → playground → **quiz** → flashcards → related/prev/next → sources + "behind the sketch" | "Explain hard things easier", "in detail so anyone can learn" |
| Scope | 20 napkins (MVP), 120 at v1 | **121 napkins** (DSA 42, System Design 41, DS/ML 38) | Owner asked for full coverage |
| Playgrounds | 3 griddles | **16**: bubble/insertion/merge sort, binary search, BFS vs DFS grid (editable walls), hash chaining, LRU, BST, consistent-hash ring (drag + vnodes), quorum N/R/W, live token bucket, bloom filter, gradient descent, threshold/ROC, least-squares fit, k-means | Interaction makes the idea stick |
| Extras | — | Learning paths, cheat sheet (print-friendly), **Quick quiz** (mixed multiple-choice rounds across all napkins), progress heatmap + 7-day forecast, ⌘K search palette, "Did you know?" card, share links, synthesised sounds | Daily-use quality of life; curiosity |
| Story of the app | — | **About page** ("Why Napkin"): the owner's journey (tester → C++ payment gateways → Python → data science & system design → AI) told with the same scene-by-scene sketch player, plus the principles it led to; teased on Home and in the README | Personal, honest root for the product |
| Code in lessons | Python snippets | **Language-agnostic** explanations (plain words, pictures, pseudocode); code sits only in `## Implement it in Python` (or `## Sketch it` for configs/flows), with a language label and copy button | Learn the idea once, apply it in any language |
| Signature interactions | Napkin pull, plunger pen, highlighter → cloze | Kept the spirit: flip cards, swipe to rate, rating buttons show the FSRS interval, receipt at the end of a session (shareable PNG). Highlighter → cloze and the napkin-pull gesture were dropped. | Simpler, standard, accessible |

## Engineering

| Area | Planned | Built | Why |
|---|---|---|---|
| Islands | React 19 | **Preact 10** | Same API, ~10× smaller; keeps every page under the JS budget |
| Styling | Tailwind v4 + tokens | Hand-written CSS with tokens (`src/styles/tokens.css`) | Fewer moving parts; tokens are the design contract |
| Diagrams | Excalidraw / Mermaid / D2 exported at build (jsdom or Playwright) | **Code-authored diagrams** (`src/diagrams/*.mjs`) rendered with a small kit over the Rough.js generator in Node. Output committed to `public/diagrams` (+ light thumbnails in `public/thumbs`) | Deterministic, diff-able, no flaky exporters, scene steps are first-class (`d.step`) |
| Animation | SMIL + `setCurrentTime` scrubbing | CSS stroke-dash drawing per scene (classes toggled by `src/features/story/story.ts`) | Works everywhere including Android WebView; reduced motion just skips the drawing |
| Search | Pagefind (WASM) | Hand-rolled ranked index over a ~JSON file (`src/engine/search`) | Instant, tiny, no WASM/CSP exceptions, fully tested |
| Content files | `.mdx` | `.md` with zod schema shared by Astro and the lint (`src/content/schema.mjs`) | No MDX needed; one schema everywhere |
| Napkin numbers | Hand-picked (037…) | DSA 001–042, System Design 101–141, DS 201–238, assigned from the syllabus order in `src/content/tracks/*.yaml` | Numbers tell you the track at a glance |
| Fonts | Caveat, Nunito, JetBrains Mono, Excalifont | Bricolage Grotesque, Inter (+ Greek subset for maths symbols), JetBrains Mono, Excalifont — subset by `scripts/subset-fonts.py` | Modern look; still ≤ 140 kB total |
| Sounds | CC0 sprite via Howler | Synthesised with Web Audio (`src/platform/sound.ts`), off by default | Zero bytes, no licensing |
| Repo / URL | `napkin`, `ttrahul007.github.io/napkin` | `self-learn-napkin`, `rahultarigoppula.github.io/self-learn-napkin/` | The repository the owner created |
| APK base | `/` with directory URLs | `/`; page links become `…/index.html` on Android (`src/lib/base.ts`) | Capacitor's local server serves the root index for any extension-less path |
| Dependency licences | OSI-only gate | Same gate, plus `CC-BY-4.0` (caniuse-lite data, build-time only); Astro's optional `sharp`/libvips (LGPL) is excluded because it never ships to users | Honest gate without blocking the build toolchain |
| CSP | Hand-hashed meta | Astro's built-in `security.csp` (web build only; off in the APK because Capacitor injects an inline bridge script) | Automatic hashes for every inline script/style |

## Kept from the plan

Offline-first PWA (Workbox, precache everything), FSRS-6 scheduling with the locked deck-id goldens (`sha1(slug|question)`), the 32-column receipt format and its goldens, streak/day-key rules, the licence allow-list and ban-list, no accounts/analytics/network calls, Capacitor 8 APK built and signed in GitHub Actions, MIT licence.
