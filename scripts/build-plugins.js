import { readdir, readFile, writeFile, mkdir, lstat, unlink } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'plugins', 'khom');
const check = process.argv.includes('--check');
// Explicit allowlist: never ship .git, secrets, node_modules, browsers or runtime artifacts.
const inputs = ['.codex-plugin/plugin.json', '.cursor-plugin/plugin.json', '.gitignore',
  'README.md', 'package.json', 'package-lock.json', 'skills', 'src', 'scripts', 'examples', 'docs', 'test'];

async function files(path) {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) throw Error(`Plugin packages cannot contain symlinks: ${path}`);
  if (stat.isFile()) return [path];
  const children = await readdir(path);
  return (await Promise.all(children.sort().map(child => files(join(path, child))))).flat();
}

const expected = new Map();
for (const input of inputs) for (const source of await files(join(root, input))) {
  expected.set(relative(root, source), await readFile(source));
}
expected.set('GENERATED.md', Buffer.from('# Generated plugin package\n\nEdit the source files at the repository root, then run `npm run plugins:build`.\nDo not edit this directory directly. Both marketplaces install this self-contained package.\n'));
let existing = [];
try { existing = await files(output); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const stale = [];
for (const [path, bytes] of expected) {
  const target = join(output, path);
  let current;
  try { current = await readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (current?.equals(bytes)) continue;
  if (check) stale.push(path);
  else { await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes); }
}
for (const path of existing) {
  if (expected.has(relative(output, path))) continue;
  if (check) stale.push(relative(output, path));
  else await unlink(path);
}
if (stale.length) throw Error(`Plugin package is stale. Run npm run plugins:build. Files: ${stale.join(', ')}`);
console.log(check ? 'Plugin package matches source.' : `Built ${expected.size} files in plugins/khom.`);
