// npm run diagrams — render every src/diagrams/<name>.mjs into public/diagrams/<name>.svg + <name>.json.
// Output is committed (CI's diagrams-fresh job re-runs this and fails on any diff), so `npm run build`
// never needs to run it. Usage: node scripts/build-diagrams.mjs [name ...]
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createDiagram, STANDALONE_STYLE, THUMB_STYLE } from './diagram-kit.mjs';

const SRC = 'src/diagrams';
const OUT = 'public/diagrams';
const THUMBS = 'public/thumbs';
const MAX_BYTES = 60_000;
const WARN_BYTES = 24_000;

/** Render one source file; returns { svg, manifest }. */
export async function renderDiagram(file) {
  const name = path.basename(file, '.mjs');
  const source = await readFile(file, 'utf8');
  const mod = await import(`${pathToFileURL(path.resolve(file)).href}?v=${Date.now()}`);
  const meta = mod.meta ?? {};
  const d = createDiagram({ name, width: meta.width, height: meta.height });
  mod.default(d);
  const { svg, manifest } = d.render();
  const t = createDiagram({ name, width: meta.width, height: meta.height, thumb: true });
  mod.default(t);
  const thumb = t
    .render()
    .svg.replace(/ style="--i:\d+"/g, '')
    .replace(/ data-el="\d+" data-step="\d+"/g, '')
    .replace(/ pathLength="1"/g, '');
  const normalized = source.split('\r\n').join('\n');
  manifest.hash = createHash('sha1').update(`${normalized}|kit-v1`).digest('hex');
  manifest.title = meta.title ?? name;
  return { svg, manifest, thumb };
}

export async function buildAll(only = []) {
  await mkdir(OUT, { recursive: true });
  await mkdir(THUMBS, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => f.endsWith('.mjs')).sort();
  const picked = only.length ? files.filter((f) => only.includes(path.basename(f, '.mjs'))) : files;
  const rows = [];
  for (const f of picked) {
    const { svg, manifest, thumb } = await renderDiagram(path.join(SRC, f));
    const standalone = svg
      .replace('class="dg"', 'class="dg" font-family="Excalifont"')
      .replace(/(<svg[^>]*>)/, `$1${STANDALONE_STYLE}`);
    const bytes = Buffer.byteLength(svg);
    if (bytes > MAX_BYTES)
      throw new Error(`${f}: ${bytes} bytes is over the ${MAX_BYTES} byte diagram budget`);
    await writeFile(path.join(OUT, `${manifest.name}.svg`), `${standalone}\n`);
    await writeFile(
      path.join(THUMBS, `${manifest.name}.svg`),
      `${thumb.replace(/(<svg[^>]*>)/, `$1${THUMB_STYLE}`)}\n`,
    );
    await writeFile(path.join(OUT, `${manifest.name}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
    rows.push({
      name: manifest.name,
      steps: manifest.steps.length,
      elements: manifest.elements,
      kB: (bytes / 1024).toFixed(1),
      thumbKB: (Buffer.byteLength(thumb) / 1024).toFixed(1),
      warn: bytes > WARN_BYTES ? '⚠' : '',
    });
  }
  return rows;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const rows = await buildAll(process.argv.slice(2));
  console.table(rows);
}
