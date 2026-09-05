import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectExecution, resolvePolicy } from '../src/model-policy.js';
import { executeCodex, codexArguments } from '../src/codex.js';
import { Store, gate } from '../src/core.js';

const contract = () => JSON.parse(readFileSync(new URL('../examples/change.json', import.meta.url)));

test('bounded work uses Luna; decisions use Sol; high-risk review uses Astra read-only', () => {
  for (const task of ['implement', 'repair', 'summarize']) assert.equal(selectExecution({ task }).model, 'gpt-5.6-luna');
  for (const task of ['clarify', 'plan', 'review']) {
    assert.equal(selectExecution({ task }).model, 'gpt-5.6-sol');
    assert.equal(selectExecution({ task }).sandbox, 'read-only');
  }
  assert.equal(selectExecution({ task: 'review', risk: 'high' }).model, 'gpt-6-astra');
  assert.equal(selectExecution({ task: 'implement', risk: 'high' }).model, 'gpt-5.6-sol');
});

test('deterministic steps never launch a model', () => {
  for (const task of ['verify', 'browser', 'checks', 'state']) {
    assert.equal(selectExecution({ task }).kind, 'tool');
    assert.throws(() => codexArguments({ cwd: '.', task }), /tool:/);
  }
});

test('escalation obeys authorization ceiling, availability and input validation', () => {
  assert.equal(selectExecution({ failedAttempts: 1 }).model, 'gpt-5.6-sol');
  assert.equal(selectExecution({ failedAttempts: 2 }).model, 'gpt-6-astra');
  assert.equal(selectExecution({ failedAttempts: 1, policy: { maxTier: 'luna' } }).kind, 'decision');
  assert.equal(selectExecution({ availableModels: ['gpt-6-astra'] }).kind, 'blocked');
  assert.throws(() => selectExecution({ task: 'typo' }), /Unknown/);
  assert.throws(() => selectExecution({ failedAttempts: -1 }), /Invalid/);
  assert.throws(() => resolvePolicy({ effort: 'max' }), /Invalid/);
  assert.throws(() => resolvePolicy({ unrecognized: true }), /Unknown/);
});

test('adapter pins model/effort and judge cannot become an implementer', () => {
  const result = codexArguments({ cwd: '/tmp/space here', judge: true, risk: 'high' });
  assert.equal(result.args[result.args.indexOf('--model') + 1], 'gpt-6-astra');
  assert.equal(result.args[result.args.indexOf('--sandbox') + 1], 'read-only');
  assert.ok(result.args.includes('model_reasoning_effort="medium"'));
  assert.throws(() => codexArguments({ cwd: '.', judge: true, task: 'implement' }), /Judge/);
});

test('CLI subprocess preserves JSONL usage and final line without newline, without a paid call', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'khom-codex-'));
  const binary = join(dir, 'fake-codex');
  writeFileSync(binary, `#!/usr/bin/env node
process.stdin.resume();
process.stdin.on('end', () => {
  console.log(JSON.stringify({type:'arguments', args:process.argv.slice(2)}));
  process.stdout.write(JSON.stringify({type:'turn.completed',usage:{input_tokens:20,cached_input_tokens:5,output_tokens:7}}));
});\n`, { mode: 0o700 });
  try {
    const result = await executeCodex({ cwd: dir, prompt: 'test only', binary, task: 'review' });
    assert.equal(result.code, 0);
    assert.equal(result.execution.model, 'gpt-5.6-sol');
    assert.deepEqual(result.usage, { input_tokens: 20, cached_input_tokens: 5, output_tokens: 7 });
    assert.equal(result.cost, 'unavailable');
    assert.ok(result.events[0].args.includes('gpt-5.6-sol'));
  } finally { rmSync(dir, { recursive: true }); }
});

test('run freezes policy and records model intent, usage and escalation stop in receipt', () => {
  const store = new Store();
  try {
    const c = contract(); c.mode = 'loop'; c.modelPolicy.maxTier = 'luna';
    store.put(c); store.approve(c.id, c.revision);
    const run = store.start(c.id, 'policy');
    c.modelPolicy.maxTier = 'astra'; // Changing a caller object cannot alter approved policy.
    const attempt = store.claim(run.id, 'worker');
    assert.equal(attempt.attempts[0].execution.model, 'gpt-5.6-luna');
    assert.equal(store.get(run.id).contract.modelPolicy.maxTier, 'luna');
    store.complete(run.id, attempt.fence, { snapshot: { sha: 'a'.repeat(40) }, evidence: [{ producer: 'verifier', status: 'fail', sha: 'a'.repeat(40), repo: c.repo, revision: c.revision, acceptanceId: c.acceptance[0].id, kind: c.acceptance[0].kind }], usage: { input_tokens: 3, cached_input_tokens: 0, output_tokens: 2 } });
    assert.equal(store.claim(run.id, 'worker').state, 'approval_required');
    const receipt = store.receipt(run.id);
    assert.equal(receipt.attempts.length, 1);
    assert.equal(receipt.attempts[0].usage.output_tokens, 2);
  } finally { store.close(); }
});

test('changing only model policy invalidates contract approval', () => {
  const store = new Store();
  try {
    const c = contract(); store.put(c); store.approve(c.id, 1);
    store.put({ ...c, revision: 2, modelPolicy: { ...c.modelPolicy, maxTier: 'sol' } });
    assert.throws(() => store.start(c.id, 'changed'), /approval/);
  } finally { store.close(); }
});


test('missing evidence does not trigger a more expensive model', () => {
  const store = new Store();
  try {
    const c = contract(); c.mode = 'loop'; store.put(c); store.approve(c.id, 1);
    const run = store.start(c.id, 'pending-evidence'); const claimed = store.claim(run.id, 'worker');
    store.complete(run.id, claimed.fence, { snapshot: {} });
    const next = store.claim(run.id, 'worker');
    assert.equal(next.attempts[0].outcome, 'unverified');
    assert.equal(next.attempts[1].execution.model, 'gpt-5.6-luna');
  } finally { store.close(); }
});

test('legacy approved contract without model policy stops before model selection', () => {
  const store = new Store();
  try {
    const c = contract(); delete c.modelPolicy;
    store.db.prepare('INSERT INTO changes VALUES(?,?,NULL)').run(c.id, JSON.stringify(c));
    store.approve(c.id, 1); const run = store.start(c.id, 'legacy');
    assert.equal(store.claim(run.id, 'worker').state, 'approval_required');
    assert.equal(store.receipt(run.id).attempts.length, 0);
  } finally { store.close(); }
});

test('high-risk direct work still requires independent judgement', () => {
  const c = contract(); c.mode = 'direct'; c.risk = 'high';
  const snapshot = { repo: c.repo, sha: 'a'.repeat(40), baseSha: c.baseSha, pr: 1, checks: 'pass' };
  const evidence = [{ producer: 'verifier', status: 'pass', repo: c.repo, sha: snapshot.sha, revision: c.revision, acceptanceId: c.acceptance[0].id, kind: c.acceptance[0].kind, observedAt: 'now', artifact: 'test.json' }];
  assert.ok(gate(c, snapshot, evidence).reasons.includes('Independent current judgement required'));
});
