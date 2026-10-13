# Napkin — DEPLOYMENT.md

> **Conflicts are resolved in `docs/IMPLEMENTATION-PROMPT.md` §0; that file wins.** Revised 2026-09-08 to match rulings C1–C23.

**Project:** 03 · The Visual Tech Learning Platform (codename "Napkin") · **Date:** 2026-09-06
**Binding docs:** `_shared/DECISIONS.md` (D1 Napkin exception, D2 Pages, D3 Capacitor, D5, D6, D9.1 "Day 1 = live"), `_shared/research/HOSTING.md`, `_shared/research/ANDROID-PACKAGING.md`, `docs/RESEARCH.md` §5.6–§5.8, `docs/DESIGN.md` §14, `docs/TESTING.md`.
**Shared templates used:** `_shared/templates/pages.yml`, `android-release.yml`, `app-build.gradle.snippet`, `_shared/scripts/make-keystore.sh`. **Not used:** `worker.yml`, `worker-proxy.ts` (Napkin has no secrets and no proxy — §7).

What ships:

| Target | Mechanism | URL / artifact |
|---|---|---|
| Web (PWA) | GitHub Pages from a custom Actions workflow, sub-path `/napkin/` | `https://<owner>.github.io/napkin/` |
| Android | Capacitor 8 APK, signed in GitHub Actions, attached to a GitHub Release on every `v*` tag; bundles `dist/` so it is offline from first launch | `napkin-<version>.apk` on the Releases page |
| Backend | none | — |

Replace `<owner>` with your GitHub username everywhere below (it is the only placeholder). Runs in **Git Bash** unless a step says PowerShell.

---

## 1. Prerequisites (local, Windows 11)

| Need | Check | Fix |
|---|---|---|
| Node ≥ 22.12 (Astro 7.3.1 refuses lower; owner has 22.17) | `node -v` | `winget upgrade OpenJS.NodeJS.LTS` |
| npm ≥ 10, git, Git Bash (bundles OpenSSL 3.5.x for the keystore) | `npm -v && git --version && openssl version` | Git for Windows installer |
| Python 3.14 + `fonttools[woff]` (font subsetting) | `python -m fontTools --version` | `pip install "fonttools[woff]" brotli` |
| Playwright Chromium (diagram-export fallback, Mermaid rendering, e2e) | `npx playwright --version` | `npx playwright install chromium` (one-time, ~150 MB) |
| GitHub CLI (optional, makes §3 one command) | `gh --version` | `winget install GitHub.cli` then `gh auth login` |
| **No** Java, Android SDK, Android Studio | — | Never needed locally (D3) |

Set once in `~/.gitconfig`: `git config --global core.autocrlf input` so `android/gradlew` and `*.sh` keep LF (a `.gitattributes` in §10 enforces it anyway).

---

## 2. Scaffold to "hello world" (Phase 0, day 1)

```bash
cd /c/Work/Personal_Projects/03-napkin-visual-learning
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
# Runtime dependencies (IMPLEMENTATION-PROMPT §2.2 — that table is the authority)
npm i astro@^7.3 @astrojs/mdx @astrojs/react react react-dom
npm i tailwindcss @tailwindcss/vite motion roughjs dexie dexie-react-hooks ts-fsrs zustand zod howler workbox-window
npm i @fontsource-variable/caveat @fontsource-variable/nunito @fontsource-variable/jetbrains-mono

# Build-time / dev dependencies
npm i -D workbox-build pagefind svgo jsdom @excalidraw/excalidraw@0.18.1 excalidraw-animate@0.7.2 \
       mermaid rehype-mermaid @terrastruct/d2 \
       vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom fake-indexeddb fast-check \
       @playwright/test playwright @axe-core/playwright lighthouse @biomejs/biome license-checker-rseidelsohn
npx astro add mdx react --yes
npx playwright install chromium      # for the fallback Excalidraw exporter and the e2e suite
git init && git add -A && git commit -m "chore: scaffold Napkin (Astro 7 + MDX + React islands)"
```

Check the peer list of `@astrojs/mdx` against the registry (`npm view @astrojs/mdx peerDependencies`) before pinning — see TESTING §13 D1-11. Add the `scripts` block from IMPLEMENTATION-PROMPT §2.5 to `package.json` (TESTING §1 quotes the same block).

Minimum content for day 1: one card (`src/content/cards/sysdesign/consistent-hashing.mdx` — the golden card), one diagram (`src/diagrams/consistent-hashing.excalidraw`), `src/pages/index.astro` (Counter shell), `src/pages/offline.astro`, `src/pages/404.astro`, `src/styles/tokens.css` pasted from DESIGN §15.

---

## 3. Create the GitHub repository

Name from DECISIONS D2: **`napkin`**. Public (required for Pages on GitHub Free and for unlimited Actions minutes).

```bash
gh repo create napkin --public --source=. --remote=origin --description "Napkin — interview prep sketched on a diner napkin. Offline visual study guide for DSA, system design and data science." --push
```

Without `gh`: create it at https://github.com/new (public, no README/licence/gitignore — the scaffold has them), then `git remote add origin git@github.com:<owner>/napkin.git && git push -u origin main`.

Repo settings to set once:
- **Settings → Pages → Build and deployment → Source: "GitHub Actions"** (nothing else; the workflow creates the `github-pages` environment on its first run).
- **Settings → Actions → General → Workflow permissions: "Read and write"** is *not* needed — each workflow declares its own least-privilege `permissions`.
- **Settings → Environments → github-pages → Deployment branches: `main` only** (created after the first run; tighten then).
- Add `LICENSE` = MIT for the code, and the README **Attribution** section (D5 rule 4) generated from card `sources` + `public/sounds/CREDITS.md`.

---

## 4. Astro configuration for GitHub Pages

Napkin is a multi-page static site (not a Vite SPA), so the D1 hash-router rule does not apply: every napkin is a real `index.html`, deep links are real files, and GitHub Pages' lack of rewrites is irrelevant. Two things still matter: the **sub-path** and the **service-worker scope**.

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

// VITE_BASE_PATH is set by the shared workflow templates: "/napkin/" on Pages, "/" for the APK and locally.
const rawBase = process.env.VITE_BASE_PATH ?? '/';
const base = rawBase === '/' ? '/' : rawBase.replace(/\/+$/, '');     // Astro wants "/napkin" (no trailing slash)
const platform = process.env.VITE_PLATFORM ?? 'web';                  // "android" inside android-release.yml
const version = process.env.APP_VERSION ?? 'dev';

export default defineConfig({
  site: 'https://<owner>.github.io',
  base,
  trailingSlash: 'always',                 // every page is /slug/index.html → stable URLs in the precache
  build: { format: 'directory', assets: '_astro' },
  integrations: [mdx(), react()],
  vite: {
    define: {
      'import.meta.env.PUBLIC_PLATFORM': JSON.stringify(platform),
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version),
      'import.meta.env.PUBLIC_BASE': JSON.stringify(base === '/' ? '/' : base + '/'),
    },
  },
});
```

`src/lib/base.ts` — the only way to build a URL in the app (unit-tested, TESTING §5.10 / D1-15):

```ts
export const BASE = import.meta.env.PUBLIC_BASE as string;              // "/" or "/napkin/"
export const withBase = (p: string) => BASE + p.replace(/^\/+/, '');    // withBase('diagrams/x.svg') → '/napkin/diagrams/x.svg'
```

Other Pages-specific files:
- `public/.nojekyll` (empty). Actions-deployed artifacts are not run through Jekyll, but Astro emits `_astro/` and Jekyll would drop underscore folders if anyone ever switches the source to a branch. Cheap insurance; verify `_astro/` is served after the first deploy (TESTING D1-13).
- `src/pages/404.astro` → `dist/404.html`, which GitHub Pages serves natively for unknown paths ("Not on the menu" napkin with a link to the Menu). **Do not** copy `index.html` over it — the shared `pages.yml` template's "SPA fallback" step is removed for Napkin (§5).
- `src/pages/offline.astro` → `dist/offline/index.html`: the `navigateFallback` "This one isn't in the dispenser yet" napkin (DESIGN §9.9).
- `public/manifest.webmanifest` is generated at build by `scripts/build-sw.mjs` (below) so `start_url`/`scope` follow the base path.

`scripts/build-sw.mjs` (post-build; RESEARCH §5.6 "safest plan"):

```js
import { generateSW } from 'workbox-build';
import { writeFile } from 'node:fs/promises';

const base = (process.env.VITE_BASE_PATH ?? '/').replace(/\/?$/, '/');   // always trailing slash here

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
  globIgnores: ['diagrams/**', 'videos/**', 'sw.js', 'workbox-*.js', '**/*.map'],   // C5: diagrams are inlined in the HTML
  swDest: 'dist/sw.js',
  skipWaiting: false,                       // the "NEW NAPKINS — REFRESH" ticket controls activation (workbox-window)
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  navigateFallback: `${base}offline/index.html`,
  navigateFallbackDenylist: [/\/pagefind\//],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  runtimeCaching: [{ urlPattern: /\/videos\//, handler: 'CacheFirst', options: { cacheName: 'napkin-videos', expiration: { maxEntries: 20 } } }],
  sourcemap: false,
});
warnings.forEach(w => console.warn('[sw]', w));
console.log(`[sw] precached ${count} files, ${(size / 1024 / 1024).toFixed(2)} MB`);
const maxMb = Number(process.env.NAPKIN_PRECACHE_MAX_MB ?? 10);   // 25 at v1, set deliberately in the workflow
if (size > maxMb * 1024 * 1024) { console.error(`[sw] precache exceeds the ${maxMb} MB budget`); process.exit(1); }
```

Precache entries are relative to `sw.js`, and the SW is registered from `${BASE}sw.js`, so the same script serves `/napkin/` on Pages and `/` in `astro preview` without a base. `diagrams/**` is excluded on purpose (C5): every diagram is already inlined into its napkin's HTML by `Diagram.astro`, so precaching the files would double the bytes. Pagefind runs **before** this script inside `npm run build`, so the search shards are in the manifest and search works offline.

Registration lives in `src/layouts/Base.astro` and is skipped inside the APK:

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

Pagefind under the sub-path: `const pagefind = await import(/* @vite-ignore */ `${BASE}pagefind/pagefind.js`); await pagefind.init({ basePath: `${BASE}pagefind/` });` — verified on day 1 (TESTING D1-17).

Diagrams: `npm run diagrams` runs **locally** and its outputs in `public/diagrams/` are **committed** (C3, content-hash cached). It is **not part of `npm run build`** (C20), so neither `pages.yml` nor `android-release.yml` needs Playwright or the 60 MB D2 WASM; the only job that regenerates diagrams is `ci.yml`'s `diagrams-fresh`, which installs Chromium and then `git diff --exit-code public/diagrams tests/golden` to catch stale SVGs. This keeps `pages.yml` under three minutes and makes local and CI output byte-identical.

---

## 5. `.github/workflows/pages.yml` (shared template, adapted)

Differences from `_shared/templates/pages.yml`: `npm test -- --run` → `npm run test:unit` and `test:build`; no `cp dist/index.html dist/404.html` (Astro emits its own `404.html`); `APP_VERSION` from `git describe`; budgets are part of `npm run build`. `npm run build` here means, in this order: `lint-licences.mjs` → `build-decks.mjs` → `astro build` → `pagefind --site dist` → `build-sw.mjs` → `check-budgets.mjs` (IMPLEMENTATION-PROMPT §2.5). Pagefind before the service worker is load-bearing — it is what puts the search shards in the precache.

```yaml
# Deploy Napkin (Astro 7) to GitHub Pages. Prereq: repo Settings -> Pages -> Source = "GitHub Actions".
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
          fetch-depth: 0                       # git describe needs tags
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:build
      - name: Build (served from /napkin/; lint-licences, decks, astro build, pagefind, build-sw, check-budgets)
        run: npm run build
        env:
          VITE_BASE_PATH: /${{ github.event.repository.name }}/
          VITE_PLATFORM: web
          APP_VERSION: ${{ github.ref_type == 'tag' && github.ref_name || format('main-{0}', github.sha) }}
      - name: Sanity — files GitHub Pages must serve
        run: |
          test -f dist/index.html && test -f dist/404.html && test -f dist/offline/index.html
          test -f dist/sw.js && test -f dist/manifest.webmanifest && test -f dist/pagefind/pagefind.js
          test -f dist/.nojekyll
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

`.github/workflows/ci.yml` (PRs; the heavier checks) — jobs in order: `lint`, `unit`, `diagrams-fresh` (`npx playwright install --with-deps chromium` → `npm run diagrams` → `git diff --exit-code public/diagrams tests/golden`), `build`, `e2e` (`npx playwright install --with-deps chromium` → `npm run test:e2e`), `a11y`, `visual`, `licences`. **`diagrams-fresh` is the only job anywhere that runs `npm run diagrams`.** Each Playwright job caches `~/.cache/ms-playwright` keyed on the `@playwright/test` version. The full job list is in TESTING §15.

---

## 6. First deploy and verification

```bash
git add -A && git commit -m "feat: counter shell, golden card, pages workflow" && git push origin main
gh run watch                     # or the Actions tab; first run ≈ 2–3 min
```

The URL is printed in the `deploy` job summary and under Settings → Pages: **`https://<owner>.github.io/napkin/`**.

Verify from Git Bash (all must be `200`):

```bash
U=https://<owner>.github.io/napkin
for p in / /404.html /offline/ /sw.js /manifest.webmanifest /pagefind/pagefind.js /sysdesign/consistent-hashing/ \
         /diagrams/consistent-hashing.anim.svg /fonts/Excalifont-Regular.woff2 /.nojekyll; do
  printf '%-45s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$U$p"
done
curl -s "$U/manifest.webmanifest" | grep -o '"start_url":"[^"]*"'     # must be "/napkin/"
curl -s "$U/" | grep -o '_astro/[^"]*\.css' | head -1                  # then curl that path → 200 (D1-13)
```

Then in Chrome on the Pages URL: DevTools → Application → Service Workers shows `sw.js` activated with scope `/napkin/`; Cache Storage has a `workbox-precache-v2-…` entry whose keys start with `/napkin/`; toggle **Offline** and reload → the Counter renders (D1-16). Search for `hashing` → results (D1-17).

Day 1 is done when this passes and the debug APK from §10 installs (D9.1).

---

## 7. Worker / proxy: none

Napkin makes **zero network requests** at runtime (RESEARCH §3c, §11 "No API key needed — confirmed"). Do not copy `worker.yml` or `worker-proxy.ts`; do not create a `worker/` folder; there are no `CLOUDFLARE_*` secrets. The CSP in `Base.astro` is IMPLEMENTATION-PROMPT §7.1 verbatim — GitHub Pages cannot send headers, so it is a `<meta http-equiv="Content-Security-Policy">` tag, which still blocks accidental third-party requests:

```
default-src 'self'; img-src 'self' data: blob:; font-src 'self';
style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval' 'sha256-<hash of the pre-paint script>';
connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'
```

Two details are load-bearing. **`'wasm-unsafe-eval'` is required by Pagefind's WebAssembly** — without it, search is dead on the deployed site while working perfectly in `astro preview`. And `script-src` carries a **`'sha256-…'` hash of the inline pre-paint theme script, computed at build time and injected**, rather than `'unsafe-inline'`; a Playwright test asserts zero CSP violations on every screen (TESTING §13, PLAN 5.4).

If the optional BYO-key LLM helpers from RESEARCH §9 are ever built (D4 rung 2), they call Gemini/OpenRouter/Groq **directly from the browser with the user's own key**, so still no Worker; only the CSP `connect-src` list and the House Rules key field change. Rung 1 (Workers AI garnish) is *not* planned for Napkin — its procedural alternatives (pre-written ELI5, template flashcards, hand-authored quizzes) are the product.

---

## 8. Environment and configuration

Nothing is secret. Build-time variables only:

| Variable | Where set | Values | Effect |
|---|---|---|---|
| `VITE_BASE_PATH` | `pages.yml` (`/napkin/`), `android-release.yml` (`/`), local default `/` | path with trailing slash | Astro `base`, manifest `start_url`/`scope`, SW `navigateFallback`, `withBase()` |
| `VITE_PLATFORM` | `pages.yml` (`web`), `android-release.yml` (`android`) | `web` / `android` | `android`: no SW registration, `@capacitor/haptics` + `share` + `filesystem` adapters active, `platform/` picks native share; `web`: Web Share API, `navigator.vibrate` never used |
| `APP_VERSION` | workflows (`git describe`/tag) | `v1.4.2`, `main-<sha>` | House Rules footer `v1.4.2 · offline ready ✓`, receipt footer, backup `appVersion` |
| `NAPKIN_DIAGRAM_EXPORTER` | local shell, `ci.yml` `diagrams-fresh` | `jsdom` (default) / `playwright` | Excalidraw export path (TESTING D1-03) |
| `NAPKIN_SKIP_DIAGRAMS` | local shell | `1` | `astro dev` without regenerating diagrams |
| `PUBLIC_GALLERY` | `ci.yml` visual job | `1` | builds `/__gallery/` component page for screenshot tests |

Variable names keep the `VITE_` prefix from the shared templates even though Astro exposes client env as `PUBLIC_*`; `astro.config.mjs` reads them at build time and re-exports the client-visible ones via `vite.define` (§4). Local overrides go in `.env.local` (git-ignored); there is no `.env` in the repo.

Runtime configuration is the learner's House Rules, stored in Dexie `settings` (`edition`, `hourPin`, `sound`, `haptics`, `reduceMotion`, `newPerDay`, `legibleBody`) and mirrored to `localStorage napkin:house-rules` for the first paint (theme before hydration).

---

## 9. PWA install check (web)

1. Desktop Chrome/Edge on `https://<owner>.github.io/napkin/`: the install icon appears in the address bar; install → standalone window titled `Napkin` with the `#1E3B38` title bar; `chrome://apps` lists it.
2. Android Chrome (before the APK exists, or on a second phone): menu → **Add to Home screen** → Chrome mints a WebAPK (icon from `maskable-512.png`); launch → no browser chrome, splash `#1E3B38`.
3. Lighthouse (DevTools → Lighthouse → mobile): PWA installable, `start_url` responds offline, Performance ≥ 95, Accessibility 100 (TESTING §10.2 budgets).
4. Offline: Airplane mode → open the installed app → Counter, a napkin, search and a review all work.
5. Update: push a content change → within a minute the installed app shows the `NEW NAPKINS — REFRESH` ticket; refresh → new content. If the ticket never appears, check that `sw.js` is served with `Cache-Control` that is not immutable (GitHub Pages sends `max-age=600`, fine).
6. Uninstall/reinstall keeps Dexie data only if the origin's storage was not cleared — remind users (House Rules) that **Export** is the real backup.

---

## 10. Android pipeline (Capacitor 8, signed in GitHub Actions)

Capacitor rather than TWA (D3, D8 row 03): the APK bundles `dist/`, so "offline study on the go" holds from the first launch and no `assetlinks.json` is required. TWA remains an optional second artifact (§11).

### 10.1 Add Capacitor (local, no Java)

App id: **`com.rahul.napkin`** (C6 — the portfolio convention `com.rahul.<repo>`, matching `com.rahul.nocturne` and `com.rahul.jyoti`). It can never change after the first install; if an APK is already installed under a different id, keep that id instead.

```bash
npm i @capacitor/core @capacitor/android @capacitor/app @capacitor/haptics @capacitor/share @capacitor/filesystem @capacitor/status-bar @capacitor/splash-screen
npm i -D @capacitor/cli @capacitor/assets
npx cap init Napkin com.rahul.napkin --web-dir dist
npx cap add android            # "Gradle sync failed" warning is expected without an SDK — ignore
```

`capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.rahul.napkin',                 // C6 — can NEVER change after the first install
  appName: 'Napkin',
  webDir: 'dist',
  android: { webContentsDebuggingEnabled: false, allowMixedContent: false, backgroundColor: '#1E3B38' },
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: { launchAutoHide: true, launchFadeOutDuration: 240, backgroundColor: '#1E3B38', showSpinner: false, androidScaleType: 'CENTER_INSIDE' },
    StatusBar: { style: 'DARK', backgroundColor: '#1E3B38', overlaysWebView: true },
  },
};
export default config;
```

This is IMPLEMENTATION-PROMPT §8.1 verbatim; the plugin set is exactly the seven listed above. **`@capacitor/system-bars` is not used** — edge-to-edge insets are handled by `env(safe-area-inset-*)` in CSS (DESIGN §14), so there is no `SystemBars` plugin block.

Append to `.gitignore`: `android/local.properties`, `android/app/release/`, `*.p12`, `*.jks`, `*.keystore`, `.env.local`. Create `.gitattributes`: `android/gradlew text eol=lf` and `*.sh text eol=lf`. Commit `android/`.

### 10.2 Project-specific manifest and Gradle edits (before the first build)

`android/app/src/main/AndroidManifest.xml` — Napkin's only permission is haptics:

```xml
<uses-permission android:name="android.permission.VIBRATE" />
<!-- No INTERNET permission is required for the bundled app; Capacitor's template includes it — remove it
     to make "no network, ever" enforceable by the OS. -->
```

Inside `<activity android:name=".MainActivity" …>` keep `android:exported="true"`, `android:launchMode="singleTask"`, set `android:windowSoftInputMode="adjustResize"` (search input pinned above the keyboard, DESIGN §14), and do **not** set `android:screenOrientation` (Android 16 ignores it on ≥ 600 dp anyway; the layout handles rotation). Add `android:enableOnBackInvokedCallback="true"` on `<application>` and verify the back chain on device (TESTING D1-14); flip to `false` only if `@capacitor/app`'s `backButton` does not fire.

`android/app/build.gradle`: paste `_shared/templates/app-build.gradle.snippet` over the generated `android { … }` block with `namespace "com.rahul.napkin"` and `applicationId "com.rahul.napkin"`. Keep the generated `repositories`, `dependencies`, `apply from: 'capacitor.build.gradle'` and the `google-services` try/catch. `minSdk 24`, `compileSdk/targetSdk 36` come from `android/variables.gradle` (Capacitor 8 defaults) — leave them.

Icons and splash (DESIGN §14 adaptive icon): put `resources/icon.png` (1024², cream napkin + red scribble + `37`), `resources/icon-foreground.png`, `resources/icon-background.png` (`#1E3B38`), `resources/icon-monochrome.png` (napkin outline), `resources/splash.png`; then `npx capacitor-assets generate --android --iconBackgroundColor '#1E3B38' --splashBackgroundColor '#1E3B38'` writes `android/app/src/main/res/mipmap-*` and `public/icons/*` (pure Node, no Java). Commit the results.

### 10.3 Keystore and secrets (once, ever)

```bash
cd ~ && bash /c/Work/Personal_Projects/_shared/scripts/make-keystore.sh napkin
```

It creates `napkin-release.p12` and `napkin-release.p12.b64` with OpenSSL (no Java). Then GitHub → repo → Settings → Secrets and variables → Actions → New repository secret, four times:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | contents of `napkin-release.p12.b64` (single line) |
| `ANDROID_KEYSTORE_PASSWORD` | the passphrase you typed |
| `ANDROID_KEY_ALIAS` | `release` |
| `ANDROID_KEY_PASSWORD` | the same passphrase (PKCS12: key password = store password) |

Back up `napkin-release.p12` + passphrase now (§15). Delete the `.b64` file after pasting.

### 10.4 `.github/workflows/android-release.yml`

Copy `_shared/templates/android-release.yml` verbatim; the only Napkin-specific changes are the checkout depth (for `git describe`) and passing `APP_VERSION`. Playwright is not needed here because diagrams are committed (C3) and `npm run build` does not run `npm run diagrams` (C20, §4).

```yaml
name: android-release

on:
  push:
    tags: ['v*']
  workflow_dispatch:        # manual run -> signed APK as a downloadable artifact only (use for the day-1 build)

permissions:
  contents: write

concurrency:
  group: android-${{ github.ref }}
  cancel-in-progress: true

jobs:
  apk:
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    env:
      VERSION_CODE: ${{ github.run_number }}
      VERSION_NAME: ${{ github.ref_type == 'tag' && github.ref_name || format('0.0.{0}', github.run_number) }}
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: 21
          cache: gradle
      - name: Build web app (base "/" because Capacitor serves from https://localhost/)
        run: |
          npm ci
          npm run build
        env:
          VITE_BASE_PATH: /
          VITE_PLATFORM: android
          APP_VERSION: ${{ env.VERSION_NAME }}
      - name: Sync web assets and plugins into android/
        run: npx cap sync android
      - name: Decode keystore
        env:
          KS_B64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
        run: printf '%s' "$KS_B64" | base64 -d > "$RUNNER_TEMP/release.p12"
      - name: Build signed release APK
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
      - name: Collect output (fails loudly if the APK came out unsigned)
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
      - name: Attach APK to GitHub Release
        if: github.ref_type == 'tag'
        uses: softprops/action-gh-release@v3
        with:
          tag_name: ${{ github.ref_name }}
          draft: true                          # un-draft after the TESTING §14 checklist is pasted in
          generate_release_notes: true
          files: |
            out/*.apk
            out/SHA256SUMS.txt
```

`draft: true` is the one deliberate deviation from the template: the Release goes public only after the phone checklist is filled in.

### 10.5 First build (day 1) → first tag → sideload

1. **Day-1 debug build:** Actions → `android-release` → *Run workflow* (manual runs build a signed APK as an artifact only). First run ≈ 6–8 min (Gradle wrapper 8.14.3 download; cached afterwards). This is TESTING D1-06.
2. Download the `apk-0.0.N` artifact on the PC, unzip, copy `napkin-0.0.N.apk` to the phone (USB, Nearby Share, or upload it to a private Gist — the file is not secret), tap it, allow "install unknown apps" for Files once, install. Run TESTING §14 A-01…A-10 at minimum.
3. **First release:**
   ```bash
   git tag -a v0.1.0 -m "Napkin 0.1.0 — weekend MVP: 20 napkins, search, review, receipt"
   git push origin v0.1.0
   ```
   The workflow builds, signs and creates a **draft** Release with `napkin-0.1.0.apk` + `SHA256SUMS.txt`.
4. On the phone: open `https://github.com/<owner>/napkin/releases` in Chrome → tap the `.apk` → Open → allow Chrome to install unknown apps (once) → Install. Run the full TESTING §14 checklist, paste it into the Release notes, un-draft.
5. Updates: tag `v0.1.1` → install over the top (same keystore, `versionCode` = run number, always higher).

Debugging without a local SDK: set `webContentsDebuggingEnabled: true` in a branch, `workflow_dispatch` it, install, USB-debug the phone, and open `chrome://inspect#devices` on the PC for full DevTools on the WebView (no `adb` install needed).

Google developer verification (D3): sideloading keeps working; register the **free limited-distribution account** (no ID, ≤ 20 devices) in the Android Developer Console before your region flips (2026-09-30 regional, 2027 global) so new phones do not need the 24 h "advanced flow".

---

## 11. Optional TWA artifact (only after the Pages site is stable)

Allowed for Napkin by D3 ("pure-web apps with no native plugin needs") but it loses haptics and native share, and needs `https://<owner>.github.io/.well-known/assetlinks.json` — which must live in the **`<owner>.github.io` user-site repo** (origin root), not in `napkin`. If wanted: run `npx @bubblewrap/cli init --manifest https://<owner>.github.io/napkin/manifest.webmanifest` once locally (it downloads its own JDK 17 + SDK tools into `~/.bubblewrap`), commit `twa-manifest.json`, reuse the same keystore secrets, and add the appendix workflow from ANDROID-PACKAGING.md as `twa-release.yml`. Not part of v1.

---

## 12. Release checklist (every `v*` tag)

Before tagging:
- [ ] `main` is green: `ci.yml` (lint, unit, diagrams-fresh, build + budgets, e2e desktop + pixel7, a11y, visual, licences) and the latest `pages.yml` deploy.
- [ ] `npm run diagrams` produced no changes (`git status public/diagrams` clean) and every new card has `sources` with an allowed `licence`; the README Attribution section and House Rules credits were regenerated.
- [ ] Content count in the folio bar (`n/N`) matches `src/content/cards` (build asserts it).
- [ ] Deck IDs are stable: no card slug was renamed without an `aliases:` entry (a renamed slug orphans review history — TESTING G-DECK).
- [ ] `CHANGELOG.md` has a section for the version (napkins added, visualizers added, fixes) — `generate_release_notes` appends the PR list.
- [ ] Visual baselines were re-approved against `design/preview.html` if any token or object changed.
- [ ] Nightly `offline` + `perf` + Lighthouse passed within the last 24 h.

Tag and ship:
- [ ] `git tag -a vX.Y.Z -m "…" && git push origin vX.Y.Z`; wait for `android-release` (draft Release).
- [ ] Install the APK over the previous version on the phone; run TESTING §14 (A-01…A-35); paste the checklist into the Release notes.
- [ ] Verify the Pages site shows `vX.Y.Z` in House Rules (the tag push also triggers nothing on Pages — merge/push `main` first so `APP_VERSION` there reads the tag on the next deploy; or `workflow_dispatch` `pages.yml`).
- [ ] Un-draft the Release. Download `SHA256SUMS.txt` and the APK to the local backup folder (§15).
- [ ] Open the installed web PWA once: the `NEW NAPKINS — REFRESH` ticket appears and the refresh works.

---

## 13. Versioning

- **Tags:** SemVer `vMAJOR.MINOR.PATCH`. MAJOR = a Dexie schema or backup-schema change that needs migration; MINOR = new napkins/visualizers/features; PATCH = fixes and content corrections.
- **Android `versionCode`** = `github.run_number` of `android-release.yml` (strictly increasing, even on re-runs); **`versionName`** = tag without `v`. Never hand-edit these in Gradle.
- **`APP_VERSION`** is injected at build (`vX.Y.Z` on tags, `main-<sha>` on Pages deploys from `main`) and shown in House Rules, receipts (`NAPKIN vX.Y.Z` footer line) and backup files.
- **Content versioning:** `public/decks/*.json` carry `{ generatedAt, cardCount, contentHash }`; the app compares `contentHash` on start to decide whether to seed new cards into Dexie (never re-seeding existing ids).
- **Dexie schema:** `db.version(n)` only ever increases; migrations are `upgrade()` functions with a unit test each; the backup `schema` number tracks the Dexie version.
- **Dependencies:** Renovate/Dependabot weekly, grouped; `ts-fsrs` majors are reviewed with the G-FSRS snapshot diff in hand; `@capacitor/*` majors are bumped together and followed by a `workflow_dispatch` APK + §14 checklist.

---

## 14. Rollback

**Web (GitHub Pages):**
1. Fastest: Actions → `Deploy to GitHub Pages` → open the last good run → **Re-run all jobs**. It rebuilds that commit and redeploys it (2–3 min). The `github-pages` environment shows the deployment history.
2. Proper: `git revert <bad-commit> && git push origin main` (keeps history linear; triggers a normal deploy).
3. Service-worker safety: because `skipWaiting` is off, a broken deploy never hijacks an open session; users get the refresh ticket only. If a deploy shipped a broken `sw.js` that fails to install, the previous SW keeps serving — fix forward. If a deploy corrupted the *precache* (e.g. a 404 in the manifest), `cleanupOutdatedCaches` plus the next good deploy heals it; nothing manual is needed on users' devices.

**Android:**
1. `versionCode` only goes up, so "reinstall the older APK" is refused by Android without an uninstall (which deletes Dexie data). Instead: `git revert` (or check out the last good tag), tag `vX.Y.(Z+1)` and push — the new APK has a higher `versionCode` with the older code.
2. If the bad build already corrupted local data: the user exports what they can (House Rules → Export), uninstalls, installs the fixed build, imports. The import merge rule (newer `last_review` wins) makes a partial export safe.
3. Drafted Releases that never passed §14 are deleted, and the tag is removed (`git push origin :refs/tags/vX.Y.Z`) so `versionName` stays honest.

**Content:** a wrong or badly-licensed napkin is removed by deleting its `.mdx` and diagram and shipping a PATCH; its deck ids simply stop being seeded (existing review rows are harmless and hidden).

---

## 15. Backups

| What | Where | How often |
|---|---|---|
| **Signing keystore** `napkin-release.p12` + passphrase | Password manager (file attachment + note) **and** an encrypted offline copy (USB/`7z -p`) outside the PC. GitHub cannot show secrets back to you; losing the key means every future APK requires an uninstall (D3). | Once; verify the copy opens with `openssl pkcs12 -info -in napkin-release.p12 -noout` |
| Repo secrets list (names only) | This document (§10.3) | — |
| Source, content, diagrams | The public `napkin` repo (GitHub) + the local clone; `git bundle create napkin-YYYY-MM-DD.bundle --all` monthly into the offline copy | Monthly |
| Release APKs + `SHA256SUMS.txt` | GitHub Releases (permanent) + local `backups/apk/` | Every release |
| Visual baselines, FSRS snapshot, golden outputs | In git (`e2e/__screenshots__`, `tests/fixtures`, `tests/golden`) | With the repo |
| **Learner data** (reviews, highlights, settings) | Only on the device (D5 privacy: no accounts, no sync). House Rules → **Export** writes `napkin-backup-YYYY-MM-DD.json` (`schema 1`, streamed Dexie export). On Android it goes through the share sheet (`@capacitor/filesystem` cache → `@capacitor/share`) to Drive/Files; on web it is a download. The Placemat shows `Last backup: n days ago` and nags at 14 days. | User-driven; nagged at 14 days |
| Fonts (subset woff2) and CC0 sound sprite | In git under `public/fonts`, `public/sounds` with `CREDITS.md`; originals re-downloadable from Fontsource / plus.excalidraw.com / freesound / Kenney | With the repo |

Restore drill (do it once after the first release, and again after any MAJOR — i.e. any Dexie or backup-schema migration, §13): fresh clone → `npm ci` → `npm run build` → `astro preview` → House Rules → **Import** the exported JSON → open a napkin and its diagram renders from `public/diagrams/`, a review session serves the same flashcards, and the Placemat shows the same streak and rings as the phone. If the import is the step that fails, the backup `schema` number and `db.version(n)` have drifted — fix the migration and re-export before shipping the tag. To roll a bad deploy or APK back, see §14 Rollback.
