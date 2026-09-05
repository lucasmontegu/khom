import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const digest = value => createHash('sha256').update(value).digest('hex');
export const workflows = {
  addy: { clarify:'addy/interview-me', plan:'addy/planning-and-task-breakdown', implement:'addy/incremental-implementation', repair:'addy/debugging-and-error-recovery', review:'addy/code-review-and-quality', test:'addy/test-driven-development' },
  matt: { clarify:'matt/grilling', plan:'matt/codebase-design', implement:'matt/tdd', repair:'matt/diagnosing-bugs', review:'matt/code-review', test:'matt/tdd' },
};
workflows.balanced = { ...workflows.addy, clarify:'matt/grilling', implement:'matt/tdd', test:'matt/tdd' };

function contained(base, path) {
  const target = resolve(base, path), rel = relative(base, target);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw Error('Invalid skill path');
  return target;
}
export function loadSkill(id, { base = root } = {}) {
  const lock = JSON.parse(readFileSync(resolve(base, 'skill-lock.json'), 'utf8'));
  const entry = lock.skills[id];
  if (!entry) throw Error(`Unknown skill: ${id}`);
  const directory = contained(base, entry.path);
  const actual = [];
  function walk(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = resolve(dir, name), stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw Error('Skill symlinks are forbidden');
      if (stat.isDirectory()) walk(path);
      else actual.push(relative(directory, path));
    }
  }
  walk(directory);
  if (JSON.stringify(actual.sort()) !== JSON.stringify(Object.keys(entry.files).sort())) throw Error('Skill file inventory mismatch');
  for (const [path, expected] of Object.entries(entry.files)) {
    if (digest(readFileSync(contained(directory, path))) !== expected) throw Error(`Skill lock mismatch: ${id}/${path}`);
  }
  const content = readFileSync(resolve(directory, 'SKILL.md'), 'utf8');
  return { id, content, hash:digest(JSON.stringify(content)), provenance: { ...lock.sources[id.split('/')[0]], bundleHash:digest(JSON.stringify(entry.files)), path:entry.path }, directory };
}
export function selectSkill(stage, preset = 'balanced') {
  if (!Object.hasOwn(workflows, preset)) throw Error(`Unknown workflow: ${preset}`);
  const id = workflows[preset][stage];
  if (!id) throw Error(`No skill for stage: ${stage}`);
  return loadSkill(id);
}
