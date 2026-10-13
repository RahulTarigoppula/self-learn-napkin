// npm run icons — render the app icon (our own SVG) to every PNG the web app and the APK need.
// Output is committed: public/icons/* and resources/* (inputs for `npx capacitor-assets generate`).
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const napkin = (s = 1, dx = 0, dy = 0) => `
<g transform="translate(${dx} ${dy}) scale(${s})">
  <path d="M96 116c0-11 9-19 20-19l276 9c11 0 19 9 19 20l-5 196-96 95-195-4c-11 0-19-9-19-20z" fill="#FFFDF8" stroke="#16181D" stroke-width="16" stroke-linejoin="round"/>
  <path d="M406 320l-80 3c-10 0-17 8-17 18l3 75" fill="#E9E3D9" stroke="#16181D" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M150 262c24-52 54-55 75-9 19 42 49 45 84-13" fill="none" stroke="#3355FF" stroke-width="22" stroke-linecap="round"/>
  <circle cx="324" cy="172" r="22" fill="#F2542D"/>
</g>`;

export const ICON_SVG = (
  bg = true,
  pad = 0,
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
${bg ? '<rect width="512" height="512" rx="112" fill="#F6F3EE"/>' : ''}
${napkin(1 - pad, 256 * pad, 256 * pad + 6)}
</svg>`;

const MONO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(96 96) scale(0.62)">
<path d="M96 116c0-11 9-19 20-19l276 9c11 0 19 9 19 20l-5 196-96 95-195-4c-11 0-19-9-19-20z" fill="none" stroke="#fff" stroke-width="24" stroke-linejoin="round"/>
<path d="M150 262c24-52 54-55 75-9 19 42 49 45 84-13" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round"/></g></svg>`;

const jobs = [
  ['public/icons/icon-192.png', 192, ICON_SVG(true, 0.12)],
  ['public/icons/icon-512.png', 512, ICON_SVG(true, 0.12)],
  ['public/icons/maskable-512.png', 512, ICON_SVG(true, 0.24).replace('rx="112"', 'rx="0"')],
  ['resources/icon-only.png', 1024, ICON_SVG(true, 0.14).replace('rx="112"', 'rx="0"')],
  ['resources/icon-foreground.png', 1024, ICON_SVG(false, 0.3)],
  [
    'resources/icon-background.png',
    1024,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#F6F3EE"/></svg>',
  ],
  [
    'resources/splash.png',
    2732,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="#F6F3EE"/><g transform="translate(1066 1066) scale(1.17)">${napkin()}</g></svg>`,
  ],
  [
    'resources/splash-dark.png',
    2732,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="#0D0F15"/><g transform="translate(1066 1066) scale(1.17)">${napkin()}</g></svg>`,
  ],
];

await mkdir('public/icons', { recursive: true });
await mkdir('resources', { recursive: true });
await writeFile('public/icons/favicon.svg', ICON_SVG(true, 0.1));
await writeFile('resources/icon-monochrome.svg', MONO);
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, svg] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({
    path: file,
    omitBackground: true,
    clip: { x: 0, y: 0, width: size, height: size },
  });
  console.log(file);
}
await browser.close();
