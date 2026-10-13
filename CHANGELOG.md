# Changelog

## v1.2.0 (2026-10-14)

- **Profiles without accounts**: everyone sharing a device gets their own progress, streaks and settings. Names live only in that browser.
- **Updates apply themselves**: a new release downloads in the background and the page reloads onto it. Your progress is never touched. Settings has a "Get the latest version" button.
- **How Napkin is made**: every source and what it gave, every check the content goes through, the algorithms inside, and exactly what is stored on your device.
- **Human voice**: about 1,050 sentences rewritten without em-dashes or stock phrases; the build now fails if one creeps back in.
- **Fair quizzes**: 238 questions rewritten so the right answer is no longer the longest one.
- **Flashcards unlock as you read**, so day one never starts with a pile of "due" cards for topics you have not seen.
- Design pass across the app: phone story player with sticky controls, quiz bottom sheet, library grid view and per-track progress, a real empty state on Progress, achievements with progress bars, dark-mode thumbnails, keyboard shortcuts (press ?), a reading progress bar and many smaller fixes.

## v1.1.0 (2026-10-13)

- **31 playgrounds** (15 new): quicksort partitioning, two pointers, sliding window, monotonic stack, min-heap, union-find, Dijkstra (with a negative edge that fools it), topological sort with cycle detection, Kruskal, LCS, edit distance, 0/1 knapsack vs greedy, load balancing strategies, circuit breaker with retries and jitter, and attention weights.
- **Play layer**: daily challenge on Home, XP and levels, 18 achievements, combos in Quick quiz, confetti for clean sweeps (skipped with reduced motion), "Surprise me".
- **Syllabus order now follows prerequisites** in all three tracks; `npm run number` renumbers from the track files and the lint rejects a prereq that comes later.
- Content review fixes across all tracks (see the commit log), every runnable Python example executed in CI, sketches that need a live service marked as such.
- Design polish: rotating daily picks, aligned course cards, clearer cheat-sheet costs, contrast fixes, no leftover diner vocabulary.

## v1.0.0 (2026-10-13)

First public release.

- **121 napkins** across three tracks: Data Structures & Algorithms (42), System Design (41, including three full case studies) and Data Science & ML (38).
- Every napkin is a layered lesson: TL;DR and analogy, a hand-drawn **story** diagram that draws itself scene by scene, key ideas, a complexity / key-numbers table, a **deep dive** (worked example, edge cases, interview angle, *Implement it in Python*), a **quiz** with explanations and **flashcards**.
- **16 interactive playgrounds** (sorting, binary search, BFS vs DFS, hash chaining, LRU, BST, consistent-hash ring, quorums, token bucket, bloom filter, gradient descent, thresholds/ROC, least squares, k-means).
- **Spaced repetition** with FSRS-6 (ts-fsrs + IndexedDB), session receipts you can share as an image, progress heatmap, streaks and a 7-day forecast.
- **Quick quiz** across topics, learning paths, a printable cheat sheet, ⌘K search, "Did you know?" facts, share links.
- **Why Napkin**: the story behind the app, told with the same sketch player.
- Light and dark themes, reduced-motion support, keyboard support, zero serious accessibility violations (axe) on every page in both themes.
- Works fully offline after one visit (Workbox); installable PWA; Android APK (Capacitor 8) built and signed in GitHub Actions.
- No accounts, no analytics, no network calls; JSON backup and restore.
