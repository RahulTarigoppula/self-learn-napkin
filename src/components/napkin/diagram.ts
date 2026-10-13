import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface DiagramStep {
  index: number;
  caption: string;
  firstElement: number;
  lastElement: number;
}
export interface DiagramManifest {
  name: string;
  title: string;
  width: number;
  height: number;
  elements: number;
  steps: DiagramStep[];
}

const dir = () => join(process.cwd(), 'public', 'diagrams');
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function loadManifest(name: string): DiagramManifest {
  return JSON.parse(readFileSync(join(dir(), `${name}.json`), 'utf8')) as DiagramManifest;
}

/** The diagram SVG for inlining: standalone <style> removed (page tokens colour it), titled for screen readers. */
export function loadSvg(name: string, title: string, desc: string, idSuffix = ''): string {
  const raw = readFileSync(join(dir(), `${name}.svg`), 'utf8').trim();
  const id = `dg-${name}${idSuffix}`;
  return raw
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replace(/ font-family="Excalifont"/, '')
    .replace(
      /^<svg([^>]*)>/,
      `<svg$1 role="img" aria-labelledby="${id}-t ${id}-d"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>`,
    );
}
