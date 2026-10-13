// Runs every ```python block in every napkin, so "every code block is run" stays true.
// Blocks of one napkin run in order in a single interpreter (later blocks may reuse earlier
// definitions). ```python sketch blocks talk to a live service and are skipped. A napkin
// fails when the interpreter exits non-zero or takes longer than 20 s.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'src/content/cards';
const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
const fence = /^```python(?![^\n]*\bsketch\b)[^\n]*\n([\s\S]*?)^```/gm;

let ran = 0;
const failures = [];
for (const track of readdirSync(root)) {
  for (const file of readdirSync(join(root, track)).filter((f) => f.endsWith('.md'))) {
    const src = readFileSync(join(root, track, file), 'utf8').replace(/\r\n/g, '\n');
    const blocks = [...src.matchAll(fence)].map((m) => m[1]);
    if (blocks.length === 0) continue;
    const program = blocks.join('\n\n');
    const res = spawnSync(python, ['-I', '-X', 'utf8', '-'], {
      input: program,
      encoding: 'utf8',
      timeout: 20_000,
    });
    ran++;
    if (res.error || res.status !== 0) {
      failures.push(
        `${track}/${file}\n${(res.stderr || String(res.error)).trim().split('\n').slice(-6).join('\n')}`,
      );
    }
  }
}

if (failures.length) {
  console.error(`check-python: ${failures.length} of ${ran} napkins failed\n\n${failures.join('\n\n')}`);
  process.exit(1);
}
console.log(`check-python: ${ran} napkins, all Python blocks ran cleanly`);
