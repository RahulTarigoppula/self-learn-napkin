// Rewrites src/content/numbers.json from the syllabus order in src/content/tracks/*.yaml:
// dsa from 1, sysdesign from 101, ds from 201. Run after adding or reordering a napkin.
import { readFile, writeFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';

const TRACKS = [
  ['dsa', 1],
  ['sysdesign', 101],
  ['ds', 201],
];
const numbers = {};
for (const [track, first] of TRACKS) {
  const { order } = parseYaml(await readFile(`src/content/tracks/${track}.yaml`, 'utf8'));
  order.forEach((id, i) => {
    numbers[id] = first + i;
  });
}
await writeFile('src/content/numbers.json', `${JSON.stringify(numbers, null, 2)}\n`);
console.log(`numbered ${Object.keys(numbers).length} napkins from the syllabus order`);
