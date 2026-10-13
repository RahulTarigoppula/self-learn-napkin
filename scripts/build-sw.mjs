// Post-build: write the web manifest and a Workbox service worker that precaches the whole app,
// so after one online visit every napkin, the search index and the review deck work offline.
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { generateSW } from 'workbox-build';

export function manifest(base) {
  return {
    name: 'Napkin: visual interview prep',
    short_name: 'Napkin',
    id: base,
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'any',
    lang: 'en',
    theme_color: '#F6F3EE',
    background_color: '#F6F3EE',
    description:
      'Hard ideas, drawn simply: visual stories, deep dives and spaced repetition for DSA, system design and ML. Works offline.',
    categories: ['education', 'productivity'],
    icons: [
      { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

export async function buildSw({ dist = 'dist', base = '/', maxMb = 25 } = {}) {
  await writeFile(`${dist}/manifest.webmanifest`, JSON.stringify(manifest(base), null, 2));
  const { count, size, warnings } = await generateSW({
    globDirectory: dist,
    globPatterns: ['**/*.{html,js,css,woff2,json,webmanifest,png,svg}'],
    // The standalone diagram files are only for sharing/debugging: every diagram is inlined in its page.
    globIgnores: ['diagrams/*.svg', 'diagrams/*.json', 'sw.js', 'workbox-*.js', '**/*.map', 'videos/**'],
    modifyURLPrefix: { '': base },
    swDest: `${dist}/sw.js`,
    skipWaiting: false,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    // Precached pages are served from the cache; anything newer than this worker (e.g. a napkin added by a
    // later deploy) goes to the network, and only falls back to the offline page when there is no network.
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'napkin-pages',
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 200 },
          precacheFallback: { fallbackURL: `${base}offline/index.html` },
        },
      },
    ],
    directoryIndex: 'index.html',
    ignoreURLParametersMatching: [/^utm_/, /^topic$/, /^track$/, /^tag$/],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    sourcemap: false,
    inlineWorkboxRuntime: true,
  });
  for (const w of warnings) console.warn('[sw]', w);
  const mb = size / 1024 / 1024;
  console.log(`✓ service worker: precached ${count} files, ${mb.toFixed(2)} MB`);
  if (mb > maxMb)
    throw new Error(`precache ${mb.toFixed(2)} MB exceeds the ${maxMb} MB budget (NAPKIN_PRECACHE_MAX_MB)`);
  return { count, size };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const base = (process.env.VITE_BASE_PATH ?? '/').replace(/\/?$/, '/');
  await buildSw({ base, maxMb: Number(process.env.NAPKIN_PRECACHE_MAX_MB ?? 25) });
}
