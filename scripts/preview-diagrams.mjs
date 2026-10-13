// Dev helper: render diagrams to PNG so you can eyeball them without a browser.
// node scripts/preview-diagrams.mjs <name> [name...]  → .cache/preview/<name>-light.png, -dark.png, -steps.png
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { buildAll } from './build-diagrams.mjs';

const names = process.argv.slice(2);
await buildAll(names);
await mkdir('.cache/preview', { recursive: true });
const font = pathToFileURL(path.resolve('src/assets/fonts/Excalifont.woff2')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
for (const name of names) {
  const svg = (await readFile(`public/diagrams/${name}.svg`, 'utf8')).replace(/<style>[\s\S]*?<\/style>/, '');
  const man = JSON.parse(await readFile(`public/diagrams/${name}.json`, 'utf8'));
  const css = (
    await Promise.all(
      ['src/styles/tokens.css', 'src/styles/diagram.css', 'scripts/preview.css'].map((f) =>
        readFile(f, 'utf8'),
      ),
    )
  ).join('');
  for (const theme of ['light', 'dark']) {
    await page.setContent(
      `<!doctype html><html data-theme="${theme}"><head><style>@font-face{font-family:Excalifont;src:url(${font})}${css}</style></head><body><div class="card">${svg}</div></body></html>`,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.card').screenshot({ path: `.cache/preview/${name}-${theme}.png` });
  }
  // one small frame per story step, side by side
  const frames = man.steps
    .map(
      (s) =>
        `<figure><div class="card small" data-upto="${s.index}">${svg}</div><figcaption>${s.index}. ${s.caption}</figcaption></figure>`,
    )
    .join('');
  await page.setContent(
    `<!doctype html><html data-theme="light"><head><style>@font-face{font-family:Excalifont;src:url(${font})}${css}</style></head><body class="grid">${frames}</body></html>`,
  );
  await page.evaluate(() => {
    for (const c of document.querySelectorAll('[data-upto]')) {
      const k = Number(c.getAttribute('data-upto'));
      for (const g of c.querySelectorAll('g[data-step]'))
        if (Number(g.getAttribute('data-step')) > k) g.style.opacity = '0.08';
    }
    return document.fonts.ready;
  });
  await page.locator('body').screenshot({ path: `.cache/preview/${name}-steps.png` });
  console.log(`.cache/preview/${name}-{light,dark,steps}.png`);
}
await browser.close();
