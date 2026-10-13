// Last step of `npm run build`: fail on any budget breach, leaked build-time library, or broken link shape.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const BUDGETS = {
  distMb: 40,
  fileKb: 3072,
  pageJsGzKb: 80,
  htmlGzKb: 60,
  fontsKb: 140,
  forbidden: ['@excalidraw', 'terrastruct', 'roughjs/bundled', 'react-dom/server'],
};

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

export async function check(dist = 'dist', b = BUDGETS) {
  const problems = [];
  let total = 0;
  let fonts = 0;
  const html = [];
  const js = new Map();
  for await (const f of walk(dist)) {
    const rel = path.relative(dist, f).split(path.sep).join('/');
    const s = (await stat(f)).size;
    total += s;
    if (s > b.fileKb * 1024)
      problems.push(`${rel}: ${(s / 1024).toFixed(0)} kB is over the ${b.fileKb} kB single-file limit`);
    if (rel.endsWith('.woff2')) fonts += s;
    if (rel.endsWith('.html')) html.push(rel);
    if (rel.startsWith('_astro/') && rel.endsWith('.js')) {
      const src = await readFile(f, 'utf8');
      js.set(rel, gzipSync(src).length);
      for (const bad of b.forbidden)
        if (src.includes(bad))
          problems.push(`${rel}: build-time library leaked into the client bundle (${bad})`);
    }
  }
  let worstPage = { page: '', kb: 0 };
  let worstHtml = { page: '', kb: 0 };
  for (const page of html) {
    const src = await readFile(path.join(dist, page), 'utf8');
    if (/href="\/\/|src="\/\//.test(src)) problems.push(`${page}: protocol-relative double slash in a link`);
    const gz = gzipSync(src).length / 1024;
    if (gz > worstHtml.kb) worstHtml = { page, kb: gz };
    if (gz > b.htmlGzKb) problems.push(`${page}: ${gz.toFixed(1)} kB gzipped HTML is over ${b.htmlGzKb} kB`);
    const scripts = [...src.matchAll(/(?:src|href)="[^"]*?(_astro\/[^"]+\.js)"/g)].map((m) => m[1]);
    const kb = [...new Set(scripts)].reduce((s, r) => s + (js.get(r) ?? 0), 0) / 1024;
    if (kb > worstPage.kb) worstPage = { page, kb };
    if (kb > b.pageJsGzKb)
      problems.push(`${page}: ${kb.toFixed(1)} kB of eagerly loaded JS (gzip) is over ${b.pageJsGzKb} kB`);
  }
  if (fonts > b.fontsKb * 1024)
    problems.push(`fonts total ${(fonts / 1024).toFixed(0)} kB is over ${b.fontsKb} kB`);
  if (total > b.distMb * 1024 * 1024)
    problems.push(`dist is ${(total / 1048576).toFixed(1)} MB, over ${b.distMb} MB`);
  const rows = [
    ['dist total', `${(total / 1048576).toFixed(2)} MB`, `${b.distMb} MB`],
    ['fonts', `${(fonts / 1024).toFixed(0)} kB`, `${b.fontsKb} kB`],
    ['heaviest page JS (gzip)', `${worstPage.kb.toFixed(1)} kB, ${worstPage.page}`, `${b.pageJsGzKb} kB`],
    ['heaviest HTML (gzip)', `${worstHtml.kb.toFixed(1)} kB, ${worstHtml.page}`, `${b.htmlGzKb} kB`],
    ['pages', String(html.length), ''],
  ];
  return { problems, rows };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { problems, rows } = await check();
  console.table(rows.map(([what, value, limit]) => ({ what, value, limit })));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `### Budgets\n\n| what | value | limit |\n|---|---|---|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`,
    );
  }
  if (problems.length) {
    console.error(`\n✗ budgets: ${problems.length} problem(s)`);
    for (const p of problems) console.error(`  • ${p}`);
    process.exit(1);
  }
  console.log('✓ budgets green');
}
