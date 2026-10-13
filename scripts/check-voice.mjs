// Keeps the writing human: no em-dashes and none of the stock phrases that make text read as machine-made.
// Scans lessons, UI source, diagrams and docs. Exit 1 lists every hit as file:line.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOTS = [
  'src',
  'scripts',
  'e2e',
  'README.md',
  'CHANGELOG.md',
  'docs/AUTHORING.md',
  'docs/DECISIONS.md',
  'docs/DEPLOYMENT-NOTES.md',
];
const EXT = new Set(['.md', '.astro', '.ts', '.tsx', '.mjs', '.yaml', '.json']);
const SKIP = [/src[\\/]generated/, /\.test\.tsx?$/, /check-voice\.mjs$/];

const PHRASES = [
  new RegExp(String.fromCharCode(0x2014)), // the em-dash itself
  /\bdelve\b/i,
  /\bdive (?:in|into)\b/i,
  /\bin a nutshell\b/i,
  /\bseamless(?:ly)?\b/i,
  /\bleverag(?:e|es|ing) (?:the|our|your|this|these|it|its)\b/i, // the verb, not the statistics term
  /\bgame[- ]changer\b/i,
  /\btapestry\b/i,
  /\brealm of\b/i,
  /\bhere's the thing\b/i,
  /\bat its core\b/i,
  /\bboils down to\b/i,
  /\bunlock(?:s|ing)? the\b/i,
  /\bbeautifully\b/i,
  /\bit's not just\b/i,
];

const files = [];
const walk = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) for (const f of readdirSync(p)) walk(join(p, f));
  else if (EXT.has(extname(p)) && !SKIP.some((r) => r.test(p))) files.push(p);
};
for (const r of ROOTS) walk(r);

const hits = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const re of PHRASES)
      if (re.test(line)) hits.push(`${f}:${i + 1}  ${re.source}  ${line.trim().slice(0, 90)}`);
  });
}

if (hits.length) {
  console.error(`check-voice: ${hits.length} hit(s)\n${hits.join('\n')}`);
  process.exit(1);
}
console.log(`check-voice: ${files.length} files, no em-dashes or stock phrases`);
