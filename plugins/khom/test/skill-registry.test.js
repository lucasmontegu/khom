import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSkill, selectSkill } from '../src/skill-registry.js';

test('all bundled skills pass file integrity checks and workflows select one discipline', () => {
  const lock = JSON.parse(readFileSync(new URL('../skill-lock.json', import.meta.url)));
  for (const id of Object.keys(lock.skills)) assert.equal(loadSkill(id).id, id);
  assert.equal(selectSkill('implement').id, 'matt/tdd');
  assert.equal(selectSkill('review').id, 'addy/code-review-and-quality');
  assert.throws(() => selectSkill('browser'), /No skill/);
  assert.throws(() => selectSkill('plan', 'unknown'), /Unknown workflow/);
});

test('changed reference files and unexpected files fail integrity validation', () => {
  const base = mkdtempSync(join(tmpdir(), 'khom-skills-'));
  try {
    cpSync(new URL('../skill-lock.json', import.meta.url), join(base, 'skill-lock.json'));
    cpSync(new URL('../vendor/matt/skills/engineering/tdd', import.meta.url), join(base, 'vendor/matt/skills/engineering/tdd'), { recursive:true });
    const skill = loadSkill('matt/tdd', {base});
    writeFileSync(join(skill.directory, 'unexpected.md'), 'changed');
    assert.throws(() => loadSkill('matt/tdd', {base}), /inventory/);
    rmSync(join(skill.directory, 'unexpected.md'));
    writeFileSync(join(skill.directory, 'SKILL.md'), 'changed');
    assert.throws(() => loadSkill('matt/tdd', {base}), /lock mismatch/);
  } finally { rmSync(base, {recursive:true, force:true}); }
});
