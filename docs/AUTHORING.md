# Authoring a napkin

A napkin = **one topic, taught in layers** so anyone — from a beginner to someone cramming for an interview — can learn it properly:

1. **TL;DR + analogy** — the idea in one breath, and an everyday picture that makes it click.
2. **The story** — a hand-drawn diagram that draws itself scene by scene, with 2–4 plain sentences per scene. Concrete example first.
3. **Key ideas** — 3–6 crisp bullets to remember.
4. **Deep dive** — the full, careful explanation (markdown body): how it works, a fully worked example, code, edge cases/pitfalls, trade-offs, when to use it, interview angles. This is where depth lives. Explain *why*, not just *what*.
5. **Complexity / key numbers**, an optional interactive **playground**, a **quiz** (multiple choice with explanations) and **flashcards** for spaced repetition.

Two files:

1. `src/content/cards/<track>/<slug>.md` — frontmatter (data + story) and a short markdown body (key ideas).
2. `src/diagrams/<name>.mjs` — the hand-drawn diagram, written in code with the diagram kit. Each `d.step()` in the diagram is one **scene** of the story.

The app shows the diagram on a paper card with the story beside it. The learner taps **Next**: the next scene's text appears and that scene's strokes draw themselves in, while earlier scenes stay visible (slightly faded). So the story text for scene *k* must describe exactly what scene *k* of the diagram draws.

## Workflow

```bash
node scripts/preview-diagrams.mjs <diagram-name>   # renders public/diagrams/<name>.svg/.json AND PNG previews
#   → .cache/preview/<name>-light.png, <name>-dark.png, <name>-steps.png   (open them and LOOK)
node scripts/lint-licences.mjs                      # validates every card (schema, licences, scene count = steps)
```

Iterate on the diagram until all three PNGs look clean: **no overlapping text, nothing clipped at the edges, labels clearly next to what they label, readable in dark mode, and each step frame tells its part of the story on its own.**

## Card frontmatter

```yaml
---
title: Consistent Hashing            # ≤ 40 chars
track: sysdesign                     # dsa | sysdesign | ds  (must match the folder)
tags: [caching, sharding, distributed]   # 1–6, lowercase, used by Library filters
difficulty: 2                        # 1–3
minutes: 3                           # 1–6 reading time
tldr: "One or two sentences, ≤ 200 chars. The whole idea if they read nothing else."
analogy: "Optional, ≤ 260 chars. An everyday picture that makes the idea click."
diagram: consistent-hashing          # basename of src/diagrams/<name>.mjs
story:                               # EXACTLY one entry per d.step() in the diagram, 2–8 scenes
  - title: The problem with hash % N # ≤ 60 chars, optional (defaults to the diagram step caption)
    text: "20–420 chars. 2–4 plain sentences. Explain what this scene draws and WHY it matters."
keyIdeas:                            # 3–6 bullets, ≤ 280 chars each; **bold** and `code` allowed
  - "**Only ~K/N keys move** when a node joins — the rest of the cache stays warm."
quiz:                                # 2–5 multiple-choice checks with an explanation of the right answer
  - q: "A ring has servers at 40°, 160° and 280°. Which server owns a key hashed to 300°?"
    options: ["The one at 280°", "The one at 40°", "The one at 160°", "It depends on the key"]
    answer: 1                        # 0-based index into options
    why: "Walk clockwise from 300°: the next server is past 360°, wrapping around to 40°."
bigO:                                # optional; a complexity OR key-numbers table
  - { op: "lookup", best: "O(1)", avg: "O(log n)", worst: "O(n)", note: "short note" }
bigOTitle: "Key numbers"             # optional heading override (default "Complexity")
related: [dsa/hash-tables]           # ≤ 4 existing card ids
prereqs: []                          # existing card ids
griddle: hash-ring                   # optional interactive playground id (only the ids you were given)
special: false                       # "Today's pick" badge
flashcards:                          # ≥ 2, ideally 3; mix kinds
  - kind: qa
    q: "A real interview-style question?"
    a: "A crisp answer, 1–2 sentences."
  - kind: cloze
    text: "Sentence with {{the key term}} blanked; up to two {{blanks}}."
sources:
  - { name: "The System Design Primer", url: "https://github.com/donnemartin/system-design-primer", licence: "CC BY 4.0", note: "Section, redrawn" }
---
```

**Body = the deep dive** (markdown after the frontmatter), 250–1800 words (code blocks don't count), organised with `##` headings. Use the sections that fit the topic, typically:

- `## How it works` — the mechanism, step by step, with the reasoning behind each step.
- `## Worked example` — trace a small concrete input all the way through (tables or numbered steps are great).
- `## Implement it in Python` — a clean, correct, idiomatic **Python** implementation (open with one line saying the idea works in any language) (```python fenced; comments on the non-obvious lines). For system design use `## Sketch it` with a small sketch: pseudo-code, a config, or a request flow. Keep it short (≤ 40 lines) and runnable where it's an algorithm.
- `## Edge cases and pitfalls` — what people get wrong in practice and in interviews.
- `## Trade-offs` / `## When to use it` (vs the alternatives).
- `## In the interview` — how the question is usually asked, what a strong answer mentions, a follow-up you should expect.

**Napkin is programming-language agnostic.** Explain every idea in plain words, pictures and language-neutral pseudocode; Python appears only inside the implementation section. If you mention a library or language feature, frame it as one example among languages.

Write for someone smart who has never seen the topic: define every term the first time, no hand-waving, no "simply/obviously". Markdown tables, `inline code`, **bold** for key terms and `> **Tip:**` / `> **Pitfall:**` callouts are all supported.

The story layer (tldr + analogy + story + keyIdeas) must stay ≤ 700 words — the lint counts both layers.

### Writing the story — the most important part

- Teach like a great senior engineer at a whiteboard: **concrete first, abstract second**. Start from a problem or a tiny example, then reveal the mechanism, then the payoff/trade-off.
- Each scene adds **one** new idea. Use the same concrete example across scenes (e.g. the key `cart:42`, the array `[1,3,5,7,9,11,13,15]`).
- Numbers beat adjectives ("about 80 % of keys move", "20 probes for a million items").
- Plain, precise English. No jokes in the prose, no hype, no "simply". British or American spelling, but be consistent within a card.
- Everything must be **technically correct** and interview-grade. If unsure, leave it out.

### Licences (the build fails otherwise)

Allowed `licence` strings exactly: `MIT`, `Apache-2.0`, `BSD-2-Clause`, `CC0`, `CC BY 4.0`, `CC BY 2.5`, `Public domain`, `Own work`.
Approved sources: OpenDSA (`https://github.com/OpenDSA/OpenDSA`, MIT) · The System Design Primer (`https://github.com/donnemartin/system-design-primer`, CC BY 4.0) · Open Data Structures (`https://opendatastructures.org/`, CC BY 2.5) · *Algorithms* by Jeff Erickson (`https://jeffe.cs.illinois.edu/teaching/algorithms/`, CC BY 4.0) · Stanford CS229 cheatsheets (`https://github.com/afshinea/stanford-cs-229-machine-learning`, MIT) · Stanford CS230 cheatsheets (`https://github.com/afshinea/stanford-cs-230-deep-learning`, MIT) · Tech Interview Handbook (`https://github.com/yangshun/tech-interview-handbook`, MIT) · TheAlgorithms (`https://github.com/TheAlgorithms`, MIT).
For your own explanation use `{ name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }`.
**Never** use or cite ByteByteGo, roadmap.sh, VisuAlgo, MIT OCW, CS50, or any CC BY-SA / NC / ND source (d2l.ai may only be mentioned as a link in prose, never in `sources`).

## The diagram kit

```js
// src/diagrams/<name>.mjs
export const meta = { title: 'Accessible title of the drawing', width: 520, height: 360 };

export default (d) => {
  d.step('Scene caption');      // starts scene 0 — must come before drawing
  d.rect(x, y, w, h, { pen: 'blue', fill: 'blue', label: 'LB', size: 17, bold: true });
  d.step('Next scene');
  d.arrow(x1, y1, x2, y2, { pen: 'red', bend: 20, label: 'request', thick: true });
};
```

Coordinates are SVG user units in a `width × height` canvas (default 520 × 360; keep width 520, height 300–420). Everything you draw must stay ≥ 12 units inside the edges.

Every call creates **one element** that animates in as a unit (strokes draw, fills and text fade), in call order, staggered within its scene.

| Call | Draws |
|---|---|
| `d.rect(x, y, w, h, o)` | rough rectangle; `o.label` centres text in it |
| `d.circle(cx, cy, diameter, o)` / `d.ellipse(cx, cy, w, h, o)` | rough circle/ellipse; `o.label` centred |
| `d.line(x1, y1, x2, y2, o)` | line (`o.dashed: true` for dashed) |
| `d.arrow(x1, y1, x2, y2, o)` | arrow; `o.bend` (px, ±) bows it; `o.both` two heads; `o.label` mid-label (`o.labelDx/labelDy` offsets, default 12 above) |
| `d.arcArrow(cx, cy, r, fromDeg, toDeg, o)` | arrow following a circle; clock angles (0 = 12 o'clock, clockwise) |
| `d.arc(cx, cy, w, h, fromDeg, toDeg, o)` | arc of an ellipse, clock angles |
| `d.curve([[x,y], …], o)` | smooth hand-drawn curve through points (great for plots) |
| `d.poly([[x,y], …], o)` | polyline; `o.closed: true` for a polygon |
| `d.text(x, y, 'text\nsecond line', o)` | hand-lettered text; `o.size` (default 18), `o.anchor` `'start'|'middle'|'end'` (default middle), `o.mono` for code/numbers, `o.bold` |
| `d.dot(x, y, diameter, o)` | filled dot; `o.label` places text 16 above (`o.dx/o.dy` to move it) |
| `d.highlight(x, y, w, h)` | yellow highlighter swipe (draw it BEFORE the thing it highlights) |
| `d.group(() => { … })` | everything inside becomes ONE element (appears together) |
| `d.at(cx, cy, r, deg)` | helper → `[x, y]` on a circle at a clock angle |

Options `o`: `pen` (stroke & text colour), `fill` (soft wash colour), `fillStyle` (`'solid'` default, `'hachure'`, `'cross-hatch'`, `'zigzag'`), `thick`, `thin`, `dashed`, `rough` (roughness, default 1.1; use 0.6 for neat grids), `textPen` (label colour if different from pen), `size`, `mono`, `bold`.

Colours (`pen`/`fill`): `ink` (default), `muted`, `red`, `blue`, `green`, `orange`, `violet`, `paper`, `hl` (highlighter, fill only). Use colour with meaning and consistently: e.g. blue = data/request flow, green = healthy/correct/kept, red = failure/the key idea/attention, orange = new/changed, violet = a third actor, muted = scaffolding (axes, gridlines, captions).

### Diagram quality bar

- **Legible on a phone**: the canvas is shown ~340 px wide on a phone, so use `size` ≥ 15 for labels (17–18 for key labels), ≥ 14 only for tiny annotations. Never below 13.
- **No overlaps.** Text never sits on top of strokes or other text. Put labels beside shapes with `anchor: 'start'`/`'end'`, not centred on a line.
- Leave breathing room; 520 units wide fits about 40 characters of 18-size text per line.
- 15–45 elements is typical. Keep each scene to roughly 2–8 elements. The output should be ≤ 24 kB (the build reports size).
- Group things that belong together (a box and its caption) with `d.group`.
- Scene 0 sets the stage (axes, the array, the boxes); later scenes add the action.
- Look at the `-dark.png` too: muted text must still be readable.

See `src/diagrams/consistent-hashing.mjs` and `src/content/cards/sysdesign/consistent-hashing.md` for the reference napkin.
