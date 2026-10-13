# Napkin — DESIGN.md (design system, v2 "Corner Booth")

> **Conflicts are resolved in `docs/IMPLEMENTATION-PROMPT.md` §0; that file wins.** Revised 2026-09-08 to match rulings C1–C23.

**Project:** 03 · The Visual Tech Learning Platform (codename "Napkin") · **Date:** 2026-09-06
**Binding docs:** `_shared/DECISIONS.md` (D1 Napkin exception, D5 licensing, D7 token contract), `docs/RESEARCH.md` (stack, diagram pipeline, FSRS), `_shared/research/DESIGN-TOOLKIT.md` (fonts/libs).
**Portfolio typography rule for this app:** hand-drawn / marker display voice (Excalifont, Caveat) + friendly readable body (Nunito). **No Fraunces, no Inter.**
**Rule of the house:** `design/preview.html` is the visual contract (D9.3). If the app looks worse than this document, it is not done.

This v2 supersedes the v1 "PLATES" document (editorial serif). v1 conflicted with the portfolio typography rule and with the "fun, approachable" vibe; its usability discipline survives here as grafts (§3).

---

## 1. Identity

**Name:** Corner Booth (the design system); the app is still called **Napkin**.

**One-liner:** *Interview prep sketched on the back of a diner napkin at 2 a.m.* — every topic in CS is a numbered cream napkin on a bottle-green formica counter: pull one from the chrome dispenser, watch the ballpoint drawing draw itself, flip it for the question, click the four-colour pen to rate it, and print the check when you're done.

**Three adjectives:** Tactile · Cheerful · Legible.

**The rule that makes it coherent:** exactly three materials (paper, chrome, formica), exactly three pens (ballpoint for diagrams, marker for titles, thermal printer for anything the machine spat out), one light source (the lamp above the counter). Everything you read sits on cream paper in dark ink at ≥ 4.5:1; everything you *do* is an object in the thumb zone. Skeuomorphism is confined to objects; body copy stays plain, precise interview-prep prose.

**What it must never look like**
- **"Yet another sketchy docs site."** Hand-drawn diagrams alone are no longer an identity (Excalidraw docs, tldraw clones). If a screenshot has no chrome dispenser, no pen and no green formica, it has drifted. The object system *is* the brand.
- **2010 iOS wood-and-leather kitsch.** No bevels, no photographic textures, no bevel-and-emboss on text, no more than one shadow per object, textures ≤ 3 % opacity, no fake 3D rooms. Top-down orthographic camera only.
- **Lofi-Girl wallpaper / a dark SaaS dashboard.** No purple, no gradient blobs, no glassmorphism, no illustrated characters, no cards with 2 px borders on a dark grey ground. The counter is green, the paper is cream, that is the whole palette story.
- **Illegible art project.** Caveat never sets body copy; napkins never rotate more than 1.5°; nothing readable sits under the lamp-pool blend layer; every gesture has a tap equivalent and a visible label.

---

## 2. Moodboard & references

| Reference | What we take | URL |
|---|---|---|
| Edward Hopper, *Nighthawks* (1942) | Bottle-green counter, one warm lamp pool, cream surfaces at night | https://www.artic.edu/artworks/111628/nighthawks |
| Bic 4-Colour ballpoint pen | The plunger click; red/black/blue/green ink as a four-way control | https://en.wikipedia.org/wiki/Bic_Cristal#Bic_4_Colours |
| Tabletop chrome napkin dispenser (Model 10 type) | Slot, spring plate, fan of cream paper | https://commons.wikimedia.org/wiki/Category:Napkin_holders |
| Formica "Boomerang" / speckle laminate | Counter texture — reproduced as 2–3 % noise, never a photo | https://en.wikipedia.org/wiki/Formica_(plastic) |
| Excalidraw + Excalifont | The hand-drawn vector language every diagram is rendered in at build time | https://excalidraw.com · https://plus.excalidraw.com/excalifont |
| Amidi CS229 cheatsheets (MIT) | The density and infographic economy each napkin must hit | https://github.com/afshinea/stanford-cs-229-machine-learning |
| Receiptify / thermal-receipt posters | Monospace on curling paper as a shareable summary format | https://receiptify.herokuapp.com/ |
| Paper Mario / Things 3 | Paper that bends under a thumb, springs that settle, tactile without kitsch | https://culturedcode.com/things/ |
| Oliver Byrne's *Elements of Euclid* (1847, public domain) — grafted from PLATES | Coloured shapes set inline with text; the ur-napkin | https://www.c82.net/euclid/ |
| Bloomberg Businessweek numerals — grafted from PLATES | One big numeral per page as identity and wayfinding | https://www.itsnicethat.com/articles/richard-turley-bloomberg-businessweek |
| Monument Valley — grafted from Lamplight | Flat geometry whose light shifts with the hour | https://www.monumentvalleygame.com/ |

---

## 3. Judging summary

Scores 1–10; total /50. Judged harshly on genericness *and* on illegible art-direction. The portfolio typography rule (hand-drawn display + friendly body; Fraunces forbidden) was applied as a hard constraint, not a tie-breaker.

| Concept | Distinct. | Vibe fit | Usability | Feasibility | Screenshot | **Total** | Verdict |
|---|---|---|---|---|---|---|---|
| 1 · Plates (editorial / typographic) | 7 | 5 | 9 | 9 | 7 | **37** | Best legibility, density and cheapest to build; but "museum catalogue, restraint everywhere" is the opposite of the "fun, bite-sized, approachable" brief, its identity depends on Fraunces (reserved for another app) and explicitly *forbids* handwriting in the UI — a head-on collision with this app's reserved hand-drawn direction. Editorial-serif is also the most common "premium" look of the decade. |
| 2 · Lamplight (atmospheric room) | 8 | 8 | 6 | 6 | 9 | **37** | Gorgeous and unmistakable; "dark mode is the room, not the paper" is a genuinely fresh rule. But the scatter home hurts scanning, motes + lamp breathing + hour-tweening shader compete with reading, a live blend layer over a canvas is a real Android WebView cost, and the identity collapses to "cream cards on brown" if the light system slips. Lofi-Girl adjacency is a reputational risk. |
| 3 · Corner Booth (diner object system) | 9 | 9 | 6 | 5 | 9 | **38** | **Winner.** The only concept whose objects *are* the controls (dispenser = queue, pen = rating, receipt = session summary, coffee rings = streak), so every distinctive element carries meaning. Fits the reserved typography direction natively. Weak spots — gesture-only navigation, four typefaces, bespoke object art — are fixed below without losing the counter. |

**Why Corner Booth won.** The brief asks for "interview prep that feels like browsing a cool infographic" and the portfolio reserves the hand-drawn voice for this app. Corner Booth is fun on its face, hand-drawn by construction, and its screenshot reads as *this app* from across a room. Lamplight ties on atmosphere but spends its budget on ambience rather than on studying; Plates is the better reading machine but the wrong personality and the wrong fonts for this slot in the portfolio.

**What was grafted (and how conflicts were resolved)**
1. **Numbered napkins + a ruled menu** (from Plates). Every napkin carries a number (`No. 037`) in Caveat at the top-right corner and in the folio bar in tabular mono; the Menu is a *ruled table* (number · title · minutes · chilli difficulty · progress hairline), never a grid of tiles. *Conflict:* Plates' small-caps word navigation vs Corner Booth's objects → objects stay, but every object in the bottom band gets a printed word under it (Menu · Review · Search) and everything is tappable; drag is an enhancement.
2. **Ruler scrubber** (Plates' ink scrubber merged with Corner Booth's pen scrubber). Under every animated diagram sits a printed hairline ruler with step tick numerals; the pen tip rides the ruler. Drag anywhere on the ruler or on the pen; tap a tick to jump. *Conflict:* none — the ruler gives the pen a visible track and 44 px targets.
3. **Highlighter marginalia → cloze cards** (from Plates). Long-press a sentence: a mustard highlighter swipe (Rough.js) sweeps it and it becomes a cloze flashcard. *Conflict:* the four-colour pen has no yellow → the highlighter is a fifth object that lives in the pen tray only on the Napkin screen.
4. **Counter light follows the clock** (from Lamplight, reduced to zero-cost CSS). Morning: cool daylight through blinds (faint stripes at 6 %); afternoon: neutral; after 20:00 the lamp pool alone. No shader, no motes, no location. *Conflict:* Lamplight's 90 s tween became a 6 s crossfade at the hour boundary; the lamp never breathes.

**Rejected:** Lamplight's OGL window shader and dust motes (battery, blend-layer cost, distraction); Plates' poster export (the receipt is the share card — one voice, not two); Courier Prime as a fourth family (receipts are set in JetBrains Mono with thermal styling); Bricolage Grotesque as body (replaced by Nunito per the portfolio rule).

---

## 4. Colour system

Two editions, both with a **green counter and cream paper**. "Day shift" is the light palette (bright paper, lamp + daylight); "After hours" is the dark palette (counter deepens, paper dims to a lit-at-night cream, ink unchanged). A white-counter "light mode" does not exist and is justified here: the reading surface is *always* light paper, so text contrast is measured on `--surface`, never on `--bg`; `--bg` is the frame, not a text ground. Both editions satisfy D7.

### 4.1 Core tokens (D7 names)

| Token | Day shift | After hours | Usage · contrast notes |
|---|---|---|---|
| `--bg` | `#1E3B38` | `#12211F` | Counter formica. Frame only; the only text that ever sits on it uses `--on-bg*` |
| `--bg-elevated` | `#2A4A45` | `#1B302C` | Lamp-pool centre, raised pencil tray, ticket rail |
| `--surface` | `#F7F1E3` | `#EAE4D6` | Napkin paper, menu pages, index cards. All reading happens here |
| `--surface-2` | `#EDE5D2` | `#E0D8C6` | Paper folds, second napkin in a stack, laminated menu backing, Big-O table stripes (ink 13.1:1 / 12.2:1) |
| `--ink` | `#1B1F2A` | `#1B1F2A` | Ballpoint blue-black: body text, diagram strokes. 14.6:1 day / 13.0:1 night on `--surface` |
| `--ink-muted` | `#5C5F6B` | `#585B67` | Captions, attribution, predicted intervals. 5.6:1 / 5.3:1 |
| `--ink-faint` | `#8B8E98` | `#878A94` | Perforation dots, disabled ticks, placeholder glyphs — **decorative only** (2.9:1), never body text |
| `--accent` | `#C8322B` | `#B52D26` | Diner-red vinyl and red ink: primary action fill, `Again` plunger, hot paths. As text on paper 4.7:1 / 4.9:1 (AA, ≥ 14 px only) |
| `--accent-ink` | `#F7F1E3` | `#F7F1E3` | Text on `--accent` fills. 4.7:1 / 5.5:1 |
| `--accent-2` | `#1F4FA3` | `#1C478F` | Blue ballpoint: links, `Good` plunger, selected menu underline, data-flow arrows. 6.9:1 / 7.1:1 |
| `--success` | `#276E46` | `#276E46` | Green ink: `Easy` plunger, session complete, healthy nodes. 5.5:1 / 4.9:1 |
| `--warning` | `#E1A62B` | `#E1A62B` | Mustard sticker: `SPECIAL` badges, price-tag stickers. 1.9:1 on paper → **forbidden for text on paper**; fine as a fill with `--ink` text (9.4:1), and as text on the counter (5.6:1 / 7.7:1) |
| `--danger` | `#B3261E` | `#B3261E` | Destructive confirms, "not cached" notice. 5.8:1 / 5.2:1 |
| `--border` | `#D9CFB8` | `#D2C7AE` | Quilted napkin emboss lines, menu rule lines, receipt perforation (non-text, 1.4:1 by design) |
| `--border-strong` | `#1B1F2A` | `#1B1F2A` | The one 2 px ink rule under a napkin title and menu section heads |
| `--focus` | `#1F4FA3` | `#1C478F` | 2 px ring + 2 px offset on paper (6.9:1). On the counter the ring switches to `--focus-on-bg` |

### 4.2 Brand extension tokens (Napkin-only, additive)

| Token | Day | Night | Usage |
|---|---|---|---|
| `--on-bg` | `#F7F1E3` | `#EAE4D6` | Text on the counter (labels under objects, folio bar). 10.7:1 / 13.1:1 |
| `--on-bg-muted` | `#B7C6BF` | `#A9B8B1` | Secondary counter text. 6.8:1 / 8.1:1 |
| `--on-bg-faint` | `#7E958D` | `#6F857D` | Decorative counter marks only (3.8:1) |
| `--focus-on-bg` | `#6FA0FF` | `#6FA0FF` | Focus ring on counter (4.7:1 / 6.5:1) |
| `--chrome-hi` / `--chrome` / `--chrome-lo` | `#F2F3F5` / `#C9CCD1` / `#8E9297` | same | Dispenser, pen clip, bell, griddle dial — always as a 3-stop linear gradient, never flat |
| `--coffee` | `#6B3F22` | `#6B3F22` | Coffee-ring stains at 35–60 % opacity (streak calendar, "read" marks). 7.9:1 if ever used as text |
| `--highlighter` | `#FFE066` | `#F5D95C` | Yellow highlighter underlay; ink over it 12.6:1 |
| `--pen-red` / `--pen-black` / `--pen-blue` / `--pen-green` | = `--accent` / `--ink` / `--accent-2` / `--success` | aliases | The four plungers; diagrams post-processed to these |
| `--receipt` | `#FFFDF8` | `#F3EFE6` | Thermal paper (whiter than napkin) |
| `--lamp` | `rgba(255, 196, 96, .14)` | `rgba(255, 176, 64, .22)` | Lamp-pool radial gradient colour |
| `--grain-opacity` | `0.03` | `0.04` | Paper + formica noise |

### 4.3 Materials, gradients, textures (zero raster bytes except one 256 px noise tile)

- **Formica counter:** `background: radial-gradient(ellipse 80% 55% at 50% 22%, var(--bg-elevated), var(--bg) 70%)` + `url(/textures/noise-256.webp)` tiled at `var(--grain-opacity)` via a pseudo-element with `mix-blend-mode: overlay`. **Never** a live `feTurbulence` over a full screen on phones (RESEARCH §8 hard part 2).
- **Lamp pool:** a second radial-gradient of `--lamp` (`ellipse 70% 40% at 50% 18%`) in `mix-blend-mode: soft-light` on the counter layer *below* every paper object. Paper is opaque, so text never sits on the blend layer.
- **Counter light by hour (graft):** `[data-hour="morning"]` adds `repeating-linear-gradient(100deg, rgba(255,255,255,.06) 0 14px, transparent 14px 34px)` (venetian-blind daylight) and cools `--lamp` to `rgba(200,220,255,.10)`; `afternoon` = defaults; `late` (20:00–06:00) deepens `--bg` by 8 % and warms `--lamp`. Crossfade 6 s on the hour boundary. Pinnable in House Rules.
- **Napkin paper:** `--surface` + 3 % noise + a 6 px **quilted emboss border** drawn by an SVG `<pattern>` of 1 px `--border` diagonal cross-hatch, inset 1 px `--border` line, `border-radius: var(--radius-md)`.
- **Chrome:** `linear-gradient(180deg, var(--chrome-hi) 0%, var(--chrome) 45%, var(--chrome-lo) 100%)`; a 1 px `rgba(255,255,255,.55)` top highlight; no other bevel.
- **Coffee rings:** three pre-rendered SVG variants (~1 kB each), `--coffee` stroke 7–9 px, roughness 1.2, at 35 / 48 / 60 % opacity for 1 / 5 / 20+ reviews; rotation seeded by date.
- **Receipt:** `--receipt` ground, `border-top/bottom: 1px dashed var(--ink-faint)` perforations, jagged tear via `clip-path: polygon(...)` (24 points).
- **Laminated menu:** `--surface` with a 1 px `--border` rule every 44 px (`repeating-linear-gradient`), 2 px `--border-strong` under section heads, a `--warning` `SPECIAL` sticker rotated −8°.

---

## 5. Typography

Three families, four files. All OFL-1.1, self-hosted via Fontsource (D1 — no Google Fonts links in production builds; `design/preview.html` may hotlink).

| Role | Face | Google Fonts | Fontsource package | Weights / axes |
|---|---|---|---|---|
| Display (marker) | **Caveat** | https://fonts.google.com/specimen/Caveat | `@fontsource-variable/caveat` (5.3.0) | wght 400–700; use 500 for notes, 700 for titles |
| Diagram labels (ballpoint) | **Excalifont** (self-hosted woff2, ~30 kB Latin subset) | — (https://plus.excalidraw.com/excalifont) | committed to `public/fonts/Excalifont-Regular.woff2` | 400 only |
| Body / UI | **Nunito** | https://fonts.google.com/specimen/Nunito | `@fontsource-variable/nunito` (5.3.0) | wght 400 prose, 600 labels, 700 emphasis |
| Mono (ticket printer) | **JetBrains Mono** | https://fonts.google.com/specimen/JetBrains+Mono | `@fontsource-variable/jetbrains-mono` (5.3.0) | 400 / 700; ligatures **off** |

**Rationale.** Three materials, three voices: Caveat is the marker a human used on the napkin title; Excalifont is the ballpoint inside the drawing (and matches the Excalidraw authoring app so exported SVGs need no re-flow); Nunito is the friendly rounded grotesque the diner printed on laminate — its rounded terminals rhyme with marker strokes and it stays legible at 17 px on a 5-inch WebView; JetBrains Mono is anything the machine printed (receipts, Big-O, code). Nunito replaces the concepts' Bricolage Grotesque per the portfolio rule; Courier Prime was cut to keep to one mono file. Atkinson Hyperlegible (`@fontsource/atkinson-hyperlegible`) is reserved as an optional "high-legibility body" toggle in House Rules — not shipped in v1.

**Type scale** (base 16 px; body 17 px on phone; `clamp()` for headline growth):

| Token | rem | px | Face / use |
|---|---|---|---|
| `--text-xs` | 0.75 | 12 | Nunito 600 caps labels, attribution lines, ticket rail |
| `--text-sm` | 0.875 | 14 | Nunito meta, chips; JetBrains Mono code + Big-O + receipt body |
| `--text-base` | 1.0625 | 17 | Nunito 400 body, bullets; line-height `--leading-body` 1.55 |
| `--text-lg` | 1.25 | 20 | Nunito 600 TL;DR, menu item titles |
| `--text-xl` | 1.5 | 24 | Caveat 700 section scrawls, sticky-note query echo |
| `--text-2xl` | 2 | 32 | Caveat 700 napkin title (phone) |
| `--text-3xl` | 2.5 | 40 | Caveat 700 napkin title (desktop), flashcard question |
| `--text-4xl` | 3.5 | 56 | Caveat 700 napkin number `No. 037`, due count on the dispenser plate |
| `--text-5xl` | 5 | 80 | Caveat 700 "NAPKIN" wordmark on the menu cover, streak numeral on the mug |

**Rules**
- Caveat's x-height is small: set Caveat at **1.15×** the Nunito size it sits beside, and never below `--text-xl` (24 px). Caveat is *never* used for body copy, bullets, tables, buttons under 24 px, or anything a learner must read fast.
- Letter-spacing: Nunito caps labels `0.08em`; Nunito prose `0`; Caveat `0` (tracking kills handwriting); JetBrains Mono receipt `0.04em` uppercase; code `0`.
- `--leading-tight: 1.1` (Caveat headlines), `--leading-body: 1.55` (prose), 1.4 for mono tables.
- Numerals: **every counter, interval, timer and folio is JetBrains Mono** (monospace = tabular by construction; Nunito's `tnum` coverage is not relied on). Nunito prose uses default lining figures. Caveat numerals appear only as the decorative napkin number and the mug streak — never in something that counts up.
- `text-wrap: balance` on Caveat titles; `text-wrap: pretty` on bullets; max line length 60–72 ch (napkin max-width 420 px phone / 640 px desktop).
- Scripts: content is English. If Hindi cards ever ship, **Kalam** (allowed hand-drawn face, has Devanagari) replaces Caveat and **Noto Sans Devanagari** joins Nunito; Excalifont is Latin-only, so Devanagari diagram labels would be rendered through Kalam at build via the font-family rewrite.
- Subsetting: `pyftsubset` (Python 3.14, `fonttools`) to `--unicodes="U+0020-007E,U+00A0-00FF,U+2013-2026,U+2190-21FF,U+2200-22FF"` (arrows and math for Big-O), woff2, `font-display: swap`. Budget: 4 files ≤ 130 kB total in the precache.

---

## 6. Spacing, radius, elevation, borders

| Group | Tokens |
|---|---|
| Spacing (8 px base, 4 px half-step) | `--space-1: 4px` `--space-2: 8px` `--space-3: 12px` `--space-4: 16px` `--space-5: 20px` `--space-6: 24px` `--space-7: 32px` `--space-8: 40px` `--space-9: 48px` `--space-10: 64px` `--space-11: 80px` `--space-12: 96px` |
| Radius | `--radius-sm: 4px` (chips, ticket corners, code blocks) · `--radius-md: 12px` (napkins, index cards) · `--radius-lg: 20px` (menu fold, sticky note) · `--radius-xl: 28px` (mug, griddle dial) · `--radius-full: 999px` (plunger caps, rings) |
| Elevation (one lamp, top-centre → shadows fall straight down) | `--shadow-1: 0 1px 0 rgba(0,0,0,.18)` paper edge on the counter · `--shadow-2: 0 6px 14px rgba(0,0,0,.28)` any object resting on the counter · `--shadow-3: 0 14px 32px rgba(0,0,0,.36)` a lifted napkin, the open menu, the sticky note. **One shadow per object, never stacked.** |
| Borders | `1px solid var(--border)` hairlines inside paper; `2px solid var(--border-strong)` under titles/section heads; the quilted emboss is an SVG pattern, not a CSS border |
| Layout | Napkin inner padding `--space-5` phone / `--space-7` desktop; bottom band height 88 px + safe-area; 8 px baseline everywhere; diagram box 4:3 or 16:10 at full napkin width |
| Z-order | 0 counter + lamp pool · 1 coffee rings + placemat · 2 napkin stack / menu / receipt · 3 pen, mug, dispenser (objects that overlap paper) · 4 sticky-note search, toasts · 5 focus rings |

---

## 7. Motion language

**Principles.** Paper, chrome and ink each move differently and never share an easing. Paper has weight and friction (ease-out, spring settle, ≤ 1.5° rotation correction). Chrome is mechanical (two-frame `steps(1)`, no easing). Ink appears in authoring order (SMIL / stroke-dashoffset). Nothing floats, nothing breathes, nothing loops except the receipt chatter while printing and the ink draw while a diagram is playing. Ambient light changes are so slow (6 s) you only notice afterwards.

**Tokens (D7 names + two brand extras)**
`--dur-fast: 120ms` (taps, chip toggles, plunger) · `--dur-base: 240ms` (menu slide, card lift, note rise) · `--dur-slow: 480ms` (napkin travel, view transitions)
`--ease-out: cubic-bezier(0.22, 1, 0.36, 1)` · `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` · `--ease-spring: linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.6%, 0.99 45.6%, 1.003 49.7%, 1.012 55%, 1.012 60.3%, 1.004 68.2%, 0.999 80.2%, 1)` (Motion spring stiffness 420, damping 26, mass 0.9 — one small overshoot)
`--ease-click: steps(1, end)` (chrome) · `--ease-flip: cubic-bezier(0.45, 0, 0.2, 1)`

**Named animations**

| # | Name | Property, from → to | Duration · easing · stagger |
|---|---|---|---|
| 1 | `napkin-pull` | `transform: translateY(100%) rotate(-1.5deg)` → `translateY(0) rotate(0)`; `box-shadow --shadow-1 → --shadow-2` | 480 ms `--ease-spring`; during drag, position follows the finger with rubber-band `d × 0.55` beyond 80 px |
| 2 | `ink-draw` | SMIL from excalidraw-animate (opacity + path `d`), or CSS `stroke-dashoffset: length → 0` for Rough.js islands | 500 ms per element, `calcMode="spline"` ease-out, stagger 40 ms, total capped at 5 s |
| 3 | `title-write` | `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` on the Caveat title | 600 ms `--ease-in-out`, starts 120 ms after `napkin-pull` lands |
| 4 | `napkin-flip` | `transform: rotateY(0)` → `rotateY(180deg)`; `backface-visibility: hidden`; shadow blur 14 → 28 px at 90° | 380 ms `--ease-flip` |
| 5 | `plunger-click` | `transform: translateY(0)` → `translateY(4px)` → `translateY(0)` (two frames) | 90 ms `--ease-click`, no easing, ever |
| 6 | `receipt-print` | each line `transform: translateY(8px); opacity 0` → `0; 1` | 40 ms per line, `--ease-click`, lines revealed in order (thermal chatter) |
| 7 | `receipt-tear` | `clip-path` jagged polygon appears; the torn half `translateX(0) rotate(0)` → `translateX(-24px) rotate(-3deg)`, opacity 1 → 0 | 220 ms `--ease-out` |
| 8 | `coffee-ring-stamp` | `transform: scale(0.8) rotate(seed)` → `scale(1)`, opacity 0 → 0.35/0.48/0.60 | 600 ms `--ease-out` |
| 9 | `highlighter-swipe` | Rough.js path `stroke-dashoffset: length → 0` in `--highlighter` at 55 % | 280 ms `--ease-spring` (stiff) |
| 10 | `menu-slide` | menu `translateX(-100%)` → `0`; counter dims via overlay opacity 0 → 0.2 | 240 ms `--ease-out` |
| 11 | `note-rise` (search) | `translateY(24px); opacity 0` → `0; 1` | 240 ms `--ease-out` |
| 12 | `counter-light` | `--lamp` and `--bg` colour crossfade on the hour boundary (`@property` registered colours) | 6000 ms linear |
| 13 | `napkin-swap` (View Transition) | `view-transition-name: napkin` — old napkin slides off the counter left (`translateX(-40%)`, fade), new one rises from the dispenser | 480 ms `--ease-out`; on Android a horizontal swipe tracks 1:1 and commits at 30 % travel or > 600 px/s |

**Reduced motion (`prefers-reduced-motion: reduce` or the House Rules override):** napkins fade (opacity 160 ms) instead of travelling; diagrams ship pre-drawn (the static `.svg` variant, ruler still scrubs frames by stepping opacity); flip becomes a 160 ms crossfade; receipts appear whole; no spring overshoot; `counter-light` snaps; coffee rings appear at final opacity. Haptics are unaffected.

---

## 8. Signature interactions

### 8.1 Pull a napkin
1. The chrome dispenser sits in the bottom band with the top edge of the next napkin peeking 28 px out of the slot; the spring plate shows the due count (`7 due`) embossed in mono.
2. Touch the peeking edge (56 px hit area) and drag up: the paper follows the finger 1:1 for 80 px, then rubber-bands (`d × 0.55`).
3. Past 120 px or a flick > 600 px/s the napkin springs free onto the counter (`napkin-pull`), lands with a 1.5° correction, and the title writes itself (`title-write`) while the ballpoint drawing draws (`ink-draw`).
4. Tap on the peeking edge does the same thing with no drag — required for discoverability and accessibility.
- **Sound/haptic:** paper "fwip" (≤ 120 ms) + `impact Light` on release. Below the threshold the napkin slides back with no sound.
- **Why it delights:** you literally take a napkin; the one-thumb loop (pull → read → flip → click → next) is the whole product in one gesture.

### 8.2 The ruler scrubber with the pen (graft)
1. Under every animated diagram a printed hairline ruler runs the napkin width: tick marks and mono numerals `0 · 1 · 2 … n` for each step in `beginTimeList` (sidecar JSON from excalidraw-animate).
2. The pen's tip rests at the current step. Drag the pen (or anywhere on the 44 px-tall ruler strip): `svg.pauseAnimations(); svg.setCurrentTime(t(x))` — the drawing exists only up to where the pen has reached. Tap a tick to jump. Lift the pen to resume playback.
3. The step caption under the ruler swaps to the current step's text.
- **Sound/haptic:** pencil tick per step (opt-in) + `selectionChanged` per step.
- **Why it delights:** learners trace consistent hashing or BFS stroke by stroke, and the control looks like a printed scale, not a media player.

### 8.3 Four-colour pen rating
1. In a review session, tap or swipe-up to flip the napkin (`napkin-flip`) and read the answer.
2. The pen docked at the right of the bottom band rises 8 px and its four plungers become the FSRS ratings — red `Again`, black `Hard`, blue `Good`, green `Easy` — each showing its predicted interval on the barrel in mono (`1d · 4d · 12d · 31d`).
3. Tap a plunger: it clicks (`plunger-click`), the pen writes a check mark in that ink on the napkin corner (Rough.js path, 180 ms), and the napkin slides off left as the next one is pulled.
4. Shortcuts: swipe right = Good, swipe left = Again (Lamplight's card flick, kept as a shortcut only); keys 1–4 on desktop.
- **Sound/haptic:** plunger "click" + `selectionChanged`.
- **Why it delights:** a Bic 4-Colour is the most universally owned tactile control on earth; the predicted interval printed on the barrel makes FSRS legible.

### 8.4 Print the check, tear it, share it
1. Ending a session (last due card, or the brass bell) starts the thermal printer at the bottom edge: a receipt in JetBrains Mono chatters upward line by line (`receipt-print`): `BINARY SEARCH ........ GOOD   4d`, subtotal of reviews, streak as the "tip", `THANK YOU · COME AGAIN`.
2. Swipe sideways across the perforation to tear (`receipt-tear`); the torn receipt is rendered to PNG (inline SVG → canvas) and offered via `@capacitor/share` / Web Share.
3. Today's coffee ring is stamped on the placemat calendar (`coffee-ring-stamp`).
- **Sound/haptic:** chatter loop while printing, "rip" + `impact Medium` on tear, `notification Success` when the ring lands.
- **Why it delights:** the session summary is a physical object you tear off and post — the screenshot people share.

### 8.5 Highlighter → cloze card (graft)
1. On a napkin, long-press (450 ms) any sentence; the highlighter in the pen tray tilts.
2. A mustard swipe sweeps the sentence (`highlighter-swipe`); a small `✎` mark appears in the margin; the sentence becomes a cloze card in the dispenser queue (blank = the longest noun phrase, editable).
3. Long-press again to remove.
- **Sound/haptic:** none / `impact Medium` on commit.
- **Why it delights:** napkins accumulate yellow marks like a used textbook, and every mark is a card you will see again. Implementation: `user-select: none` on prose on Android WebView with a custom press timer; Range.getClientRects() positions the overlay SVG.

---

## 9. Screen-by-screen

Legend: `[ ]` tappable object · `~~~` paper · `===` chrome · `- - -` perforation / hairline · `•` coffee ring. All phone wireframes are 360 × 780 logical px, edge-to-edge; the bottom band always sits above the gesture-nav inset.

### 9.1 The Counter (home)

Phone:
```
┌────────────────────────────────────┐
│ NAPKIN            ☕ 12       09:41 │  ← wordmark (Caveat), mug streak, clock
│┌─────┐                              │
││MENU │  ~~~~~~~~~~~~~~~~~~~~~~~~   │  ← laminated menu edge (tap/drag right)
││ DSA │  ~ No. 037                ~ │
││ SYS │  ~ Consistent Hashing     ~ │  ← last napkin you read, rotated 1.5°
││ DS  │  ~ [ballpoint diagram]    ~ │
│└─────┘  ~                       •~ │  ← coffee ring if finished
│         ~ Continue →              ~ │
│         ~~~~~~~~~~~~~~~~~~~~~~~~   │
│  ┌ sticky ┐                        │
│  │ 7 due  │  Today's specials: 2    │  ← sticky note (--warning fill, ink text)
│  └────────┘                        │
├────────────────────────────────────┤
│ [guest   ]   ===========   [ pen ] │  ← bottom band 88px
│ [ check  ]   = 7 due   =   [  |  ] │     dispenser slot in the middle
│  SEARCH       REVIEW        (tray)  │  ← printed words under objects
└────────────────────────────────────┘
```
Desktop (≥ 1024 px): the counter widens; the menu is permanently open as a tri-fold on the left (320 px), the napkin sits centre (max 640 px), the mug, placemat calendar and receipt printer sit in a right column (280 px). Bottom band becomes a left-column rail.

- **Components:** Wordmark, Mug (streak), Clock, MenuEdge, Napkin (resume), StickyNote (due), Dispenser, Pen (docked), GuestCheckPad.
- **States:** *empty* (first run) — the dispenser plate reads `Pull one` and the resume napkin is replaced by a napkin with a hand-drawn arrow to the slot; *loading* — napkins are static HTML, no spinner; the FSRS due count arrives from Dexie within one frame, plate shows `—` until then; *error* — never (no network); *offline update available* — a small `NEW NAPKINS — REFRESH` ticket clipped to the rail.
- **Gestures:** tap/drag-up dispenser (8.1); tap/drag-right menu edge; tap napkin → Napkin screen; Android back exits.

### 9.2 The Menu (browse)

Phone (slides over the counter):
```
┌────────────────────────────────────┐
│ ‹ Counter          MENU        🔍  │
│ ══════════════════════════════════ │  ← 2px ink rule
│ TODAY'S SPECIALS       [SPECIAL]   │
│ 037 Consistent Hashing   3 min ▸   │
│ 112 Raft leader election 4 min ▸   │
│ - - - - - - - - - - - - - - - - -  │
│ STARTERS · DSA        14/40 ▮▮▮░░  │  ← track head, progress hairline
│ 001 Big-O basics      2 min 🌶      │
│ 002 Arrays & pointers 3 min 🌶      │
│ 003 Binary search     3 min 🌶🌶    │
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ read  │  ← per-row progress hairline fill
│ MAINS · SYSTEM DESIGN  9/40 ▮▮░░░  │
│ 030 Load balancing    3 min 🌶      │
│ 037 Consistent hashing 3 min 🌶🌶  •│  ← coffee ring = finished
│ DESSERTS · DATA SCIENCE 3/40 ░░░░░ │
│ …                                  │
├────────────────────────────────────┤
│ Filter: All · Caching · Trees · DP │  ← underlined words, not pills
└────────────────────────────────────┘
```
Desktop: the same table lives in the permanent left tri-fold; a right marginal column draws the prerequisites graph as dotted pen lines between item numbers (Rough.js, static SVG at build).

- **Components:** MenuPage (ruled table), TrackHead with ProgressHairline, MenuRow (number · title · minutes · ChilliDifficulty 1–3 · CoffeeRing), SpecialSticker, FilterWords, PrereqLines (desktop).
- **States:** *empty filter* — a pencil note "Nothing on the menu for that — try another tag"; *all done* — the track head gets a green `86'd` sticker (diner slang for sold out) and a full hairline.
- **Gestures:** tap row → napkin slides out of the dispenser (View Transition); drag left or Android back closes the menu; long-press a row → "add all flashcards to today".

### 9.3 The Napkin (card detail)

Phone:
```
┌────────────────────────────────────┐
│ ‹ Menu     SYSTEM DESIGN   037/120 │  ← folio bar, mono numerals
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│ ~ Consistent Hashing       No.037 ~│  ← Caveat 700 title, number top-right
│ ~ ═══════════════════════════════ ~│
│ ~ Hash servers and keys onto a    ~│  ← TL;DR Nunito 600 20px
│ ~ ring; a key belongs to the next ~│
│ ~ server clockwise.               ~│
│ ~ ┌───────────────────────────┐   ~│
│ ~ │   [ballpoint ring diagram  │   ~│  ← inline SMIL SVG, 4:3
│ ~ │    drawing itself]         │   ~│
│ ~ └───────────────────────────┘   ~│
│ ~ 0····1····2····3           🖊  ~│  ← ruler scrubber (4 steps, C21), pen at step 2
│ ~ Step 3 of 4 · Hash the key       ~│  ← caption == aria-valuetext
│ ~ ○ Only ~K/N keys move on join.  ~│  ← hand-drawn bullet circles
│ ~ ○ Virtual nodes fix uneven load.~│
│ ~ ○ Used by DynamoDB, Cassandra.  ~│
│ ~ ┌ Big-O ─────────────────────┐  ~│
│ ~ │ lookup   O(log n)  (bsearch)│  ~│  ← JetBrains Mono table
│ ~ └────────────────────────────┘  ~│
│ ~ Related: 036 Hashing · 041 Shard~│  ← paper-clipped scraps overlapping edge
│ ~ from System Design Primer, CC BY~│  ← attribution, 12px muted
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
├────────────────────────────────────┤
│ [search]  ===dispenser===  [pen][🖍]│  ← highlighter joins the tray here
└────────────────────────────────────┘
```
Desktop: napkin 640 px centred; the "diagram source" (D2/Mermaid text in mono on `--surface-2`) shows on the napkin's back when you tap **"see how this was drawn"** (flip); on desktop it opens as a second napkin to the right.

- **Components:** FolioBar, Napkin, NapkinTitle, TLDR, Diagram (inline SVG, post-processed to pen tokens), RulerScrubber + PenTip, StepCaption, BulletList (Rough.js bullets), BigOTable, RelatedScraps, Attribution, SourceToggle, Highlighter.
- **States:** *loading* — static HTML; the animated SVG is inline so no wait; *reduced motion* — static SVG, ruler steps opacity groups; *offline-uncached* (deep link never visited on web) — a napkin reading "This one isn't in the dispenser yet — connect once to stock it" in `--danger` ink; *highlighted* — yellow swipes persist from Dexie.
- **Gestures:** swipe left/right → previous/next napkin in track (`napkin-swap`; starts ≥ 32 px from screen edges to avoid Android back); swipe up → flip to this napkin's flashcards; long-press sentence → highlighter; pinch → zoom the diagram (transform on the SVG wrapper); Android back → menu.

### 9.4 The Griddle (interactive visualizer)

Phone:
```
┌────────────────────────────────────┐
│ ‹ Menu        DSA          019/120 │
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│ ~ Bubble Sort               No.019~│
│ ~ ┌───────────────────────────┐   ~│
│ ~ │ ▯ ▯ ▮ ▮ ▯ ▯ ▯ ▯   (Rough.js │   ~│  ← bars as stacked plates; compare pair
│ ~ │ 5 3 8 1 9 2 7 4    bars)    │   ~│     highlighted in --highlighter
│ ~ └───────────────────────────┘   ~│
│ ~ 0····5····10····15····20  🖊    ~│  ← same ruler, steps = frames
│ ~ compare(2,3) → swap             ~│  ← caption in mono like a ticket
│ ~  [◀ Step] [▶ Run] [Step ▶]  ◎1× ~│  ← pencil-drawn buttons, chrome dial
│ ~ N = 8  [–] [+]   Shuffle        ~│
│ ~ ○ Best O(n) when already sorted ~│
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
├────────────────────────────────────┤
│ [search]  ===dispenser===  [pen]   │
└────────────────────────────────────┘
```
Desktop: the napkin widens to 760 px; the controls move to a right margin column; keyboard `space` run/pause, `←/→` step, `1–3` speed.

- **Components:** VizNapkin (**React island**, `client:visible` — C7; the whole portfolio is React 19 and ARCHITECTURE §1 explicitly rejects Preact), RoughCanvas (SVG), RulerScrubber, StepCaption, PencilButton, GriddleDial (speed ½× · 1× · 2×), ParamStepper (N, R, W…). The Griddle is an island anchored `#griddle` on the napkin page, not a separate route (C15).
- **States:** *idle* (frame 0, "Run" pulses once via `plunger-click`), *running*, *paused*, *done* (green check mark written in the corner, `notification Success`), *reduced motion* (frames swap with no tween). Only one island animates per viewport (`IntersectionObserver` → pause offscreen).
- **Gestures:** drag ruler/pen; tap ticks; pinch-zoom; drag "servers" onto the ring in the consistent-hashing griddle.

### 9.5 Order Up (review session)

Phone:
```
┌────────────────────────────────────┐
│ ‹ Counter  ORDER UP  ▮▮▮▮░░░░ 4/12 │  ← ticket rail progress, mono
│ ┌tkt┐┌tkt┐┌tkt┐┌tkt┐┌tkt┐          │  ← clipped order tickets (done = flipped)
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│ ~ No.037 · System Design          ~│
│ ~                                 ~│
│ ~  Why does consistent hashing    ~│  ← question, Caveat 700 40px / balance
│ ~  minimise re-mapping when a     ~│
│ ~  node joins?                    ~│
│ ~                                 ~│
│ ~        (tap to flip)            ~│
│ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│                                    │
│         🔔 end early               │
├────────────────────────────────────┤
│  ===dispenser===   ┌ PEN ────────┐ │
│  = 8 left     =    │ ●red  Again 1d│ │  ← plungers with predicted intervals
│                    │ ●blk  Hard  3d│ │     (48×56 hit areas, mono numerals)
│                    │ ●blue Good 12d│ │
│                    │ ●grn  Easy 31d│ │
└────────────────────┴──────────────┘ │
```
Desktop: card centred at 560 px; the pen lies horizontally under it with four plungers left→right; keys 1–4.

- **Components:** TicketRail, ReviewNapkin (front/back), ClozeBlank (highlighter swipe that wipes on flip), Pen (rating mode), Bell, Dispenser (remaining count).
- **States:** *empty* — "Nothing due. The counter's clean." with a coffee-ring calendar peek and a "Pull 5 new" pencil button; *revealed* (back face, plungers armed); *session end* → receipt (8.4); *error* (Dexie write failed) — plunger returns to rest, toast ticket "Couldn't write that — try again", never lose the card.
- **Gestures:** tap/swipe-up flip; swipe right Good / left Again; tap plungers; Android back → confirm ticket "Leave the counter? Progress is saved".

### 9.6 The Guest Check (search)

Phone (sticky note rises from the bottom band):
```
┌────────────────────────────────────┐
│ (counter dimmed 20 %)              │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ GUEST CHECK        [ × ]     │  │  ← --warning sticky note, ink text
│  │ ─────────────────────────────│  │
│  │  quorum reads_                │  │  ← query echoed in Caveat 24px
│  │ ─────────────────────────────│  │
│  │ 044 Quorum (N, R, W)   SYS   │  │  ← Pagefind results as menu rows
│  │ 045 Read repair        SYS   │  │
│  │ 112 Raft leader elect  SYS   │  │
│  │ tags: consistency · replicas │  │  ← pen-drawn chips
│  └──────────────────────────────┘  │
├────────────────────────────────────┤
│ [ type here…                  ] ⌫  │  ← input pinned to the keyboard
└────────────────────────────────────┘
```
Desktop: `Ctrl/⌘ K` opens the same note centred at 560 px.

- **Components:** StickyNote, SearchInput, QueryEcho, ResultRow (menu row format + track tag), TagChips.
- **States:** *empty query* — recent napkins + "Try: LRU, CAP, backprop"; *no results* — "Not on the menu. Ask the cook (add a suggestion)"; *loading* — Pagefind shards load < 100 ms offline, a pencil dot blinks once if > 300 ms.
- **Gestures:** drag down / back closes; tap row → napkin.

### 9.7 The Placemat (progress)

Phone:
```
┌────────────────────────────────────┐
│ ‹ Counter       PLACEMAT     share │
│ ┌──────────────────────────────┐   │
│ │ SEPTEMBER                    │   │
│ │ M T W T F S S                │   │
│ │ • • ◦ • ◉ ◉ •   (coffee rings│   │  ← 1 / 5 / 20+ reviews = 35/48/60 %
│ │ ◦ • • ◉ • ◦ ◦    on the mat) │   │
│ │ …                            │   │
│ └──────────────────────────────┘   │
│  ☕ streak 12    best 31    1,204 rev│  ← mono numerals
│ ┌ Starters ┐ ┌ Mains ┐ ┌ Desserts ┐│
│ │  ◔ 33%   │ │ ◑ 15% │ │ ◔  8%    ││  ← pen-scribbled progress arcs
│ └──────────┘ └───────┘ └──────────┘│
│ Last check:                        │
│ ┌ - - - - - - - - - - - - - - - ┐  │
│ │ NAPKIN · ORDER #0412           │  │  ← last receipt, tearable/shareable
│ │ BINARY SEARCH ...... GOOD   4d │  │  ← cropped to fit this frame
│ └ - - - - - - - - - - - - - - - ┘  │
├────────────────────────────────────┤
│ [search]  ===dispenser===  [pen]   │
└────────────────────────────────────┘
```

The receipt drawn inside the wireframe is a **crop**: the real sheet is 32 columns wide and is defined once, in IMPLEMENTATION-PROMPT §6.10. Design never invents receipt rows.
Desktop: placemat, arcs and receipt side by side in the right column of the Counter.

- **Components:** PlacematCalendar, CoffeeRing (3 variants), MugStat, ProgressArc (Rough.js), Receipt, ShareButton (PNG via canvas), ExportImport (paperclip: Dexie JSON out/in).
- **States:** *empty* — clean mat, one pencil note "Your first ring goes here"; *share rendering* — the mat lifts (`--shadow-3`) for 240 ms; *import error* — ticket toast in `--danger`.
- **Gestures:** drag the mug across the mat to read per-day counts (tooltip ticket); tap a ring → that day's receipt.

### 9.8 House Rules (settings & credits)

```
┌────────────────────────────────────┐
│ ‹ Counter      HOUSE RULES         │
│ ┌ stapled card ─────────────────┐  │
│ │ Sound            [bell: off]   │  │  ← rows are ruled lines; controls are
│ │ Haptics          [on]          │  │     light-switch toggles (chrome)
│ │ Edition   Day · After hours · Auto│ │
│ │ Counter light  Follow clock · Pin│ │
│ │ Reduce motion    [system]      │  │
│ │ New cards / day  [ 10 ] – +    │  │  ← mono stepper
│ │ High-legibility body  [off]    │  │  ← Atkinson toggle (v2)
│ │ Export / Import  📎            │  │
│ │ Reset progress   (red ink)     │  │
│ └────────────────────────────────┘  │
│ ┌ CREDITS ───────────────────────┐  │
│ │ OpenDSA (MIT) · System Design   │  │
│ │ Primer (CC BY 4.0) · Amidi CS229│  │
│ │ (MIT) · Excalifont, Caveat,     │  │
│ │ Nunito, JetBrains Mono (OFL) ·  │  │
│ │ sounds CC0 (freesound/Kenney)   │  │
│ └────────────────────────────────┘  │
│ v1.4.2 · offline ready ✓           │
└────────────────────────────────────┘
```
Desktop identical, centred at 560 px.

- **States:** *reset confirm* — a red-ink ticket with a 3 s hold-to-confirm plunger; *version update* — the offline-ready line becomes "New napkins — refresh".
- **Gestures:** none special; all rows ≥ 48 px.

### 9.9 Utility screens
- **Not cached yet** (`navigateFallback` on web): a lone napkin on the counter, "This one isn't in the dispenser yet", with a "Back to menu" pencil button.
- **Update toast:** an order ticket clipped to the rail (`NEW NAPKINS — REFRESH`), dismissible, never modal.

---

## 10. Component inventory

| Component | Variants | States |
|---|---|---|
| Napkin | read, review-front, review-back, viz, stub (offline), resume (rotated 1.5°) | rest, lifted (`--shadow-3`), dragging, flipping, highlighted |
| Dispenser | home (count + peek), review (remaining), empty | idle, drag, release, empty ("Pull one" / "Clean") |
| Pen | docked, rating (4 plungers), scrubbing (tip on ruler) | rest, pressed plunger (per colour), disabled (no card revealed) |
| Highlighter | tray | rest, tilted (press timer), committing |
| RulerScrubber | SMIL (beginTimeList), frames (viz) | idle, dragging, at-step n, reduced-motion |
| MenuPage / MenuRow | specials, track section, filtered | default, read (hairline filled), finished (coffee ring), 86'd |
| StickyNote | due (home), search | rising, open, closing |
| Receipt | session, last (placemat) | printing, printed, tearing, torn/shared |
| TicketRail / Ticket | progress, toast (info / danger) | pending, done (flipped), dismissed |
| CoffeeRing | 1 / 5 / 20+ | stamping, at rest |
| PlacematCalendar | month, year (desktop) | empty, populated, scrubbing (mug drag) |
| ProgressArc | per track | 0–100 % |
| PencilButton | primary (`--accent` fill, `--accent-ink` text), secondary (ink outline), word-link (underlined Nunito 600) | rest, hover (desktop: underline thickens), pressed (`plunger-click`), disabled (`--ink-faint`), focus (ring) |
| LightSwitch (toggle) | chrome | on/off, focus |
| FolioBar | napkin, viz | — |
| BigOTable | 2–4 columns | — |
| Attribution | inline | — |
| FocusRing | on paper (`--focus`), on counter (`--focus-on-bg`) | always visible on `:focus-visible` |

---

## 11. Iconography, illustration, imagery

- **Icons:** Lucide (ISC) is the baseline for the few glyphs that are not objects (close, external link, paperclip, chevron). Each Lucide path is re-rendered once at build through Rough.js (`roughness 1.2`, stroke `--ink`) so icons look pen-drawn; cached as static SVG sprites. No filled icons; no icon-only navigation (every object has a printed word).
- **Objects (dispenser, pen, mug, bell, dial, printer):** hand-authored SVG in the repo (our own, MIT), built from `--chrome*` gradients and `--ink` outlines; no photographs, no stock illustrations.
- **Diagrams:** authored in Excalidraw (MIT) with Excalifont; Mermaid `look: handDrawn` and D2 `--sketch` for graph-shaped diagrams; all rendered to SVG at build (RESEARCH §5.2). Redraw from CC-BY/MIT text sources; **never trace ByteByteGo / roadmap.sh / VisuAlgo** (D5).
- **Reference imagery:** Wikimedia Commons diners/napkin-holders (per-file licence; look, don't ship); Byrne's Euclid (public domain, c82.net) for the inline-shape idiom.

---

## 12. Sound & haptics

Off by default; the bell in House Rules turns sound on. Howler.js (MIT) with one 6-sprite CC0 sheet (< 120 kB, precached), unlocked on first pointer gesture; the app respects Android silent mode by checking `AudioContext.state` and never forcing playback. Every audible event has a visible counterpart.

| Event | Sound (CC0 source) | Length | Haptic (`@capacitor/haptics`, APK only) |
|---|---|---|---|
| Napkin release | paper "fwip" — freesound.org CC0 filter ("paper slide") | ≤ 120 ms | `impact Light` |
| Plunger / pencil button | Kenney UI Audio pack "click" (CC0) | 60 ms | `selectionChanged` |
| Ruler step | pencil tick (freesound CC0 "pencil tap") | 40 ms | `selectionChanged` |
| Receipt printing | thermal chatter loop (freesound CC0 "receipt printer") | loop ≤ 2 s | none |
| Receipt tear | paper rip (freesound CC0) | 200 ms | `impact Medium` |
| Session end / ring stamp | single brass "ding" (Kenney / freesound CC0 bell) | 300 ms | `notification Success` |
| Menu open, search, navigation, scroll | none | — | none |

Web falls back to no haptics (no `navigator.vibrate` spam). Reduced-motion and muted users still get haptics — haptics are the "sound" of this app. Optional café room tone (Lamplight's idea) is **not** shipped in v1.

---

## 13. Accessibility rules

- **Contrast:** all text ≥ 4.5:1 on its actual ground (`--surface` / `--surface-2` for paper, `--bg` for counter labels) — verified values in §4. `--warning` and `--ink-faint` are never text on paper. Diagram strokes are `--ink` (14.6:1); accent strokes inside diagrams are ≥ 3:1 (non-text).
- **Focus:** `:focus-visible` shows a 2 px ring, 2 px offset, `--focus` on paper and `--focus-on-bg` on the counter; never removed. Focus order follows the reading order (folio bar → napkin → ruler → bullets → bottom band).
- **Touch targets:** ≥ 44 × 44 px everywhere; plungers 48 × 56; dispenser edge 56 px tall; ruler strip 44 px tall; menu rows 48 px.
- **Gestures:** every drag/swipe/long-press has a tap or button equivalent (tap dispenser, "Next" chevron in the folio bar, "Highlight" in a sentence's context menu on desktop, rating plungers). Swipes start ≥ 32 px from screen edges.
- **Motion:** `prefers-reduced-motion` honoured per §7 plus a manual override; no autoplaying motion beyond the current diagram; one animated island per viewport.
- **Screen readers:** the counter scene is `aria-hidden` decoration except the four labelled controls (`Menu`, `Review — 7 due`, `Search`, `Pen — rate this card`). The Menu is a real `<table>` with headers; diagrams carry `<title>` + `<desc>` (the TL;DR) and the step captions live in an `aria-live="polite"` region; the ruler is `role="slider"` with `aria-valuemin=0`, `aria-valuemax=n−1` and `aria-valuenow=k` all **0-based** (matching the printed tick numerals `0 · 1 · 2 · 3`), and exactly one `aria-valuetext` template, **1-based and word-for-word identical to the printed caption**: `` `Step ${k + 1} of ${n}: ${steps[k].caption}` `` — on the golden card, `Step 3 of 4: Hash the key` (C21); plungers are buttons named `Again — 1 day`; coffee rings expose the count (`5 reviews on 3 September`).
- **Text:** Nunito body 17 px, line length ≤ 72 ch, `text-wrap: pretty`; Caveat only ≥ 24 px; user font scaling respected (no `maximum-scale`); diagrams pinch-zoomable.
- **Colour independence:** ratings are named and positioned, not only coloured; difficulty uses 1–3 chilli glyphs plus text; progress hairlines have percentages in the head.

---

## 14. Android-specific notes (Capacitor 8, minSdk 24, compile/target 36)

- **Status bar:** `@capacitor/status-bar` colour = `--bg` (`#1E3B38` day / `#12211F` night), style `Dark` (light icons); the counter runs edge-to-edge under it with `padding-top: env(safe-area-inset-top)` on the folio bar.
- **Gesture navigation:** the bottom band sits above `env(safe-area-inset-bottom)` plus 12 px; the dispenser pull must *start inside the slot element* (not at the screen edge) so it never fights the system home swipe; horizontal napkin swipes ignore the first 32 px from either edge (system back). Predictive back: `@capacitor/app` `backButton` closes the sticky note → menu → napkin → counter, then exits; never a dead back press.
- **Keyboard:** the search input is pinned above the keyboard (`resize: native`, `100dvh`); the sticky note shrinks, never scrolls off.
- **WebView performance:** exactly one `mix-blend-mode` layer (the lamp pool), no `backdrop-filter`, noise as a tiled WebP not a live filter, SMIL SVGs inlined (RESEARCH open question 2), `pauseAnimations()` offscreen, DPR-independent hairlines (`1px` borders, `transform: translateZ(0)` on rules).
- **Splash:** `@capacitor/splash-screen` background `#1E3B38`, the napkin icon centred, 240 ms fade.
- **Adaptive icon:** foreground = cream napkin with a red ballpoint scribble and the number `37` in Caveat; background `#1E3B38`; monochrome layer = the napkin outline; safe zone respected (66 % inner circle). Themed icons (Android 13+) tint the monochrome layer.
- **Share:** `@capacitor/share` with the receipt PNG file written via `@capacitor/filesystem` cache dir.
- **Offline:** the APK bundles `dist/`, so all napkins, fonts, Pagefind shards and sounds are available from first launch; the service worker still runs for the web build (workbox-build post-build, RESEARCH §5.6).

---

## 15. CSS design tokens (ready to paste — `src/styles/tokens.css`)

```css
:root {
  color-scheme: light;

  /* ---- Colour: Day shift (default) ---- */
  --bg: #1E3B38;             /* counter formica — frame only, never a text ground */
  --bg-elevated: #2A4A45;    /* lamp-pool centre, tray, ticket rail */
  --surface: #F7F1E3;        /* napkin paper — all reading happens here */
  --surface-2: #EDE5D2;      /* folds, menu backing, table stripes */
  --ink: #1B1F2A;            /* 14.6:1 on --surface */
  --ink-muted: #5C5F6B;      /* 5.6:1 */
  --ink-faint: #8B8E98;      /* decorative only (2.9:1) */
  --accent: #C8322B;         /* diner red — fills, Again plunger; text ≥ 14px only (4.7:1) */
  --accent-ink: #F7F1E3;
  --accent-2: #1F4FA3;       /* blue ballpoint — links, Good (6.9:1) */
  --success: #276E46;        /* green ink — Easy, done (5.5:1) */
  --warning: #E1A62B;        /* mustard sticker — never text on paper */
  --danger: #B3261E;         /* 5.8:1 */
  --border: #D9CFB8;
  --border-strong: #1B1F2A;
  --focus: #1F4FA3;

  /* brand extensions */
  --on-bg: #F7F1E3;  --on-bg-muted: #B7C6BF;  --on-bg-faint: #7E958D;  --focus-on-bg: #6FA0FF;
  --chrome-hi: #F2F3F5;  --chrome: #C9CCD1;  --chrome-lo: #8E9297;
  --coffee: #6B3F22;  --highlighter: #FFE066;  --receipt: #FFFDF8;
  --pen-red: var(--accent);  --pen-black: var(--ink);  --pen-blue: var(--accent-2);  --pen-green: var(--success);
  --lamp: rgba(255, 196, 96, 0.14);
  --grain-opacity: 0.03;
  --blinds: none;            /* the morning hour band overrides this; the default must exist here
                                or `background: var(--blinds), …` on .counter::after is invalid */

  /* ---- Typography ---- */
  --font-display: "Caveat Variable", "Caveat", "Segoe Print", cursive;
  --font-diagram: "Excalifont", "Caveat Variable", cursive;
  --font-body: "Nunito Variable", "Nunito", "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, Consolas, monospace;
  --text-xs: 0.75rem;  --text-sm: 0.875rem;  --text-base: 1.0625rem;  --text-lg: 1.25rem;
  --text-xl: 1.5rem;   --text-2xl: 2rem;     --text-3xl: 2.5rem;      --text-4xl: 3.5rem;  --text-5xl: 5rem;
  --leading-tight: 1.1;  --leading-body: 1.55;
  --tracking-caps: 0.08em;  --tracking-receipt: 0.04em;
  --display-scale: 1.15;   /* Caveat sits at 1.15× the neighbouring Nunito size */

  /* ---- Spacing / radius ---- */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-7: 32px; --space-8: 40px; --space-9: 48px;  --space-10: 64px; --space-11: 80px; --space-12: 96px;
  --radius-sm: 4px;  --radius-md: 12px;  --radius-lg: 20px;  --radius-xl: 28px;  --radius-full: 999px;

  /* ---- Elevation (one lamp, straight down) ---- */
  --shadow-1: 0 1px 0 rgba(0, 0, 0, 0.18);
  --shadow-2: 0 6px 14px rgba(0, 0, 0, 0.28);
  --shadow-3: 0 14px 32px rgba(0, 0, 0, 0.36);

  /* ---- Motion ---- */
  --dur-fast: 120ms;  --dur-base: 240ms;  --dur-slow: 480ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.6%, 0.99 45.6%, 1.003 49.7%, 1.012 55%, 1.012 60.3%, 1.004 68.2%, 0.999 80.2%, 1);
  --ease-click: steps(1, end);
  --ease-flip: cubic-bezier(0.45, 0, 0.2, 1);

  /* ---- Layout ---- */
  --napkin-max: 420px;  --napkin-max-desktop: 640px;  --band-h: 88px;
  --safe-top: env(safe-area-inset-top, 0px);  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* After hours: the counter darkens, the paper dims, the ink never changes */
[data-theme="night"] {
  color-scheme: dark;
  --bg: #12211F;  --bg-elevated: #1B302C;
  --surface: #EAE4D6;  --surface-2: #E0D8C6;
  --ink-muted: #585B67;  --ink-faint: #878A94;
  --accent: #B52D26;  --accent-2: #1C478F;  --focus: #1C478F;
  --border: #D2C7AE;
  --on-bg: #EAE4D6;  --on-bg-muted: #A9B8B1;  --on-bg-faint: #6F857D;
  --highlighter: #F5D95C;  --receipt: #F3EFE6;
  --lamp: rgba(255, 176, 64, 0.22);
  --grain-opacity: 0.04;
}
/* Auto edition: the same night values, applied only when the learner has not pinned "Day shift".
   These declarations are a verbatim copy of the [data-theme="night"] block above — the two must never
   drift, and visual/tokens.spec.ts asserts they compute identically (C22). Without this block the
   `Auto` edition would never turn night, and house-rules.spec.ts / A-20 would both fail. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="day"]) {
    color-scheme: dark;
    --bg: #12211F;  --bg-elevated: #1B302C;
    --surface: #EAE4D6;  --surface-2: #E0D8C6;
    --ink-muted: #585B67;  --ink-faint: #878A94;
    --accent: #B52D26;  --accent-2: #1C478F;  --focus: #1C478F;
    --border: #D2C7AE;
    --on-bg: #EAE4D6;  --on-bg-muted: #A9B8B1;  --on-bg-faint: #6F857D;
    --highlighter: #F5D95C;  --receipt: #F3EFE6;
    --lamp: rgba(255, 176, 64, 0.22);
    --grain-opacity: 0.04;
  }
}

/* Counter light by hour (set by a 10-line script from Date; pinnable) */
[data-hour="morning"] { --lamp: rgba(200, 220, 255, 0.10); --blinds: repeating-linear-gradient(100deg, rgba(255,255,255,.06) 0 14px, transparent 14px 34px); }
[data-hour="afternoon"] { --blinds: none; }
[data-hour="late"] { --blinds: none; --lamp: rgba(255, 176, 64, 0.20); }

```

---

## 16. Asset checklist

**Fonts (4 files, ≤ 130 kB)**
- [ ] `@fontsource-variable/caveat` → subset woff2 (Latin + arrows)
- [ ] `public/fonts/Excalifont-Regular.woff2` (OFL, from plus.excalidraw.com/excalifont, subset)
- [ ] `@fontsource-variable/nunito` → subset woff2
- [ ] `@fontsource-variable/jetbrains-mono` → subset woff2, ligatures off in CSS
- [ ] `scripts/subset-fonts.py` (pyftsubset) + size budget check in CI

**Objects & textures (own SVG, MIT)**
- [ ] `dispenser.svg` (slot, spring plate, count slot), `pen.svg` (4 plungers, clip), `highlighter.svg`, `mug.svg`, `bell.svg`, `dial.svg`, `printer-edge.svg`, `menu-tab.svg`, `paperclip.svg`
- [ ] `coffee-ring-1/2/3.svg` · `quilt-pattern.svg` (napkin emboss `<pattern>`) · `receipt-tear.svg` (clip-path polygon)
- [ ] `textures/noise-256.webp` (≤ 6 kB, generated by `scripts/make-noise.py`)
- [ ] Lucide → Rough.js icon sprite (`icons.svg`, built by `scripts/rough-icons.mjs`)

**Diagrams**
- [ ] `src/diagrams/*.excalidraw|.mmd|.d2` for the 20 MVP napkins (7 DSA, 7 SYS, 6 DS), drawn from OpenDSA / SDP / Amidi with `sources` frontmatter
- [ ] `scripts/build-diagrams.mjs`: exportToSvg (jsdom + FontFace stub; Playwright fallback) → excalidraw-animate SMIL → svgo (keep `<animate>`, ids) → pen-token colour rewrite → `beginTimeList` sidecar JSON → static + `.anim.svg` variants
- [ ] Reduced-motion static variants for every animated napkin

**Sound (CC0, ≤ 120 kB sprite)**
- [ ] `sfx.webm` + `sfx.mp3` sprite: fwip, click, tick, chatter loop, rip, ding — with `public/sounds/CREDITS.md` listing each freesound/Kenney source

**App shell**
- [ ] `manifest.webmanifest`: name Napkin, `theme_color #1E3B38`, `background_color #1E3B38`, icons 192/512 + maskable
- [ ] Android adaptive icon (fg/bg/monochrome), splash, status-bar config, `VIBRATE` permission
- [ ] `design/preview.html` — Counter, Menu, Napkin, Order Up screens with Google Fonts hotlinks (preview only)
- [ ] `src/styles/tokens.css` (§15) + `global.css` bridge
- [ ] Attribution: README section + House Rules credits card generated from `sources` frontmatter and `public/sounds/CREDITS.md`
