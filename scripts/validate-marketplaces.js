import { readFile, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
async function contained(base, path) {
  assert.equal(typeof path, 'string');
  const target = resolve(base, path);
  const rel = relative(base, target);
  assert.ok(!isAbsolute(path) && rel && !rel.startsWith('..'), `Path escapes plugin root: ${path}`);
  assert.ok(!(await lstat(target)).isSymbolicLink(), `Symlink not allowed: ${path}`);
  return target;
}
const codex = await json('.agents/plugins/marketplace.json');
const cursor = await json('.cursor-plugin/marketplace.json');
for (const catalog of [codex, cursor]) {
  assert.match(catalog.name, /^[a-z0-9][a-z0-9-]*$/);
  assert.ok(catalog.plugins.length > 0);
  assert.equal(new Set(catalog.plugins.map(p => p.name)).size, catalog.plugins.length);
}
assert.ok(codex.interface.displayName);
assert.ok(cursor.owner.name);
assert.deepEqual(codex.plugins.map(p => p.name), cursor.plugins.map(p => p.name));
for (const entry of codex.plugins) {
  assert.equal(entry.source.source, 'local');
  assert.equal(entry.policy.installation, 'AVAILABLE');
  assert.equal(entry.policy.authentication, 'ON_INSTALL');
  assert.ok(entry.category);
  const cursorEntry = cursor.plugins.find(p => p.name === entry.name);
  assert.equal(cursorEntry.source, entry.source.path);
  const plugin = await contained(root, entry.source.path);
  assert.equal(basename(plugin), entry.name);
  const manifests = [];
  for (const format of ['.codex-plugin', '.cursor-plugin']) {
    const manifest = await json(relative(root, resolve(plugin, format, 'plugin.json')));
    assert.equal(manifest.name, entry.name);
    assert.match(manifest.version, /^\d+\.\d+\.\d+(?:\+[a-zA-Z0-9.-]+)?$/);
    assert.ok(manifest.description && manifest.author.name);
    const skillDirectory = await contained(plugin, manifest.skills);
    const skill = await readFile(resolve(skillDirectory, 'khom', 'SKILL.md'), 'utf8');
    assert.match(skill, /^---\nname: khom\ndescription: .+\n---\n/);
    manifests.push(manifest);
  }
  assert.equal(manifests[0].version, manifests[1].version);
  for (const path of ['package.json', 'package-lock.json', 'src/codex.js', 'src/browser.js', 'scripts/model-route.js', 'scripts/verify-browser.js', 'examples/change.json', 'README.md']) {
    await contained(plugin, path);
  }
}
console.log('Codex and Cursor marketplace entries resolve to complete plugin packages.');
