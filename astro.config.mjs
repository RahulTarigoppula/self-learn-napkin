// @ts-check
import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

/** '/self-learn-napkin/' on GitHub Pages, '/' inside the APK and locally. */
const rawBase = process.env.VITE_BASE_PATH ?? '/';
const base = rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`; // Astro wants '/repo'
const withSlash = base === '/' ? '/' : `${base}/`; // runtime wants '/repo/'
const platform = process.env.VITE_PLATFORM ?? 'web'; // 'android' inside android-release.yml
const version = process.env.APP_VERSION ?? 'dev';

export default defineConfig({
  site: 'https://rahultarigoppula.github.io',
  base,
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_astro', inlineStylesheets: 'auto' },
  prefetch: false,
  markdown: {
    // Code in deep dives is highlighted at build time; both themes ship as CSS variables.
    shikiConfig: {
      themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
      defaultColor: false,
      wrap: false,
      // ```python sketch marks a block that talks to a live service and is not run by check-python.
      transformers: [
        {
          pre(node) {
            if (/\bsketch\b/.test(this.options.meta?.__raw ?? '')) node.properties['data-sketch'] = '';
          },
        },
      ],
    },
  },
  devToolbar: { enabled: false },
  integrations: [preact()],
  // Strict CSP as a <meta> (GitHub Pages cannot send headers). Astro hashes every inline script/style.
  // Off inside the APK: Capacitor injects its native bridge as an inline script into served HTML.
  security: {
    csp:
      platform === 'android'
        ? false
        : {
            algorithm: 'SHA-256',
            directives: [
              "default-src 'self'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "worker-src 'self'",
              "manifest-src 'self'",
              "base-uri 'none'",
              "object-src 'none'",
              "form-action 'none'",
            ],
            scriptDirective: { resources: ["'self'"] },
            styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
          },
  },
  vite: {
    define: {
      'import.meta.env.PUBLIC_PLATFORM': JSON.stringify(platform),
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version),
      'import.meta.env.PUBLIC_BASE': JSON.stringify(withSlash),
    },
    build: { assetsInlineLimit: 0 },
  },
});
