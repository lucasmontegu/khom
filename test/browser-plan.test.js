import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gate, validateContract } from '../src/core.js';
import { scenarioHash } from '../src/browser-plan.js';
import { inspectVercelDeployment } from '../src/vercel-deployment.js';
const contract = () => JSON.parse(readFileSync(new URL('../examples/browser-change.json', import.meta.url)));
const snapshot = { repo: 'lucasmontegu/khom', sha: 'a'.repeat(40), baseSha: '0'.repeat(40), deploymentId: 'dpl_test', url: 'https://preview.vercel.app', checks: 'pass', pr: 1 };
const judgement = { verdict: 'pass', sha: snapshot.sha, revision: 1, producer: 'judge', findings: [] };
const evidence = c => c.browser.scenarios.map(s => ({ acceptanceId: 'UI1', kind: 'browser', engine: 'playwright', scope: 'deployment', status: 'pass', producer: 'verifier', repo: c.repo, sha: snapshot.sha, revision: c.revision, deploymentId: snapshot.deploymentId, url: snapshot.url, scenario: s.id, scenarioHash: scenarioHash(s), viewport: s.viewport, artifact: 'report.json', screenshot: 'screenshot.png', observedAt: '2026-09-05T00:00:00Z', deploymentVerifiedAt: '2026-09-05T00:00:01Z' }));

test('browser acceptance requires executable mapped scenarios and real assertions', () => {
  const c = contract(); assert.equal(validateContract(c), c);
  const missing = structuredClone(c); delete missing.browser;
  assert.throws(() => validateContract(missing), /scenarios/);
  c.browser.scenarios[0].steps = [{ action: 'click', selector: '#connect' }];
  assert.throws(() => validateContract(c), /assertion/);
});

test('browser gate needs every viewport and rejects local, stale, unverified or changed-scenario evidence', () => {
  const c = contract(); const all = evidence(c);
  assert.equal(gate(c, snapshot, all, judgement).pass, true);
  assert.equal(gate(c, snapshot, all.slice(0, 1), judgement).pass, false);
  for (const delta of [{ scope: 'local' }, { sha: 'b'.repeat(40) }, { deploymentId: 'dpl_old' }, { url: 'https://alias.vercel.app' }, { scenarioHash: 'changed' }, { screenshot: null }, { deploymentVerifiedAt: null }, { viewport: { width: 800, height: 600 } }]) {
    assert.equal(gate(c, snapshot, all.map(e => ({ ...e, ...delta })), judgement).pass, false, JSON.stringify(delta));
  }
  c.browser.scenarios[0].steps[0].value = 'New requirement';
  assert.equal(gate(c, snapshot, all, judgement).pass, false);
});

test('unknown actions and paths escaping deployment are invalid', () => {
  for (const path of ['https://evil.test', '//evil.test', '/\\evil.test']) {
    const c = contract(); c.browser.scenarios[0].path = path;
    assert.throws(() => validateContract(c), /origin/);
  }
});

test('Vercel collector binds deployment ID and GitHub provenance without leaking auth', async () => {
  let request;
  const data = { id: 'dpl_test', url: 'preview.vercel.app', readyState: 'READY', target: 'preview', meta: { githubCommitSha: snapshot.sha, githubCommitOrg: 'lucasmontegu', githubCommitRepo: 'khom' } };
  const result = await inspectVercelDeployment('dpl_test', { token: 'private-token', teamId: 'team_x', fetchImpl: async (url, options) => { request = { url, options }; return { ok: true, json: async () => data }; } });
  assert.equal(result.repo, snapshot.repo);
  assert.equal(result.url, snapshot.url);
  assert.equal(request.url.searchParams.get('teamId'), 'team_x');
  assert.equal(request.options.headers.Authorization, 'Bearer private-token');
  assert.equal(JSON.stringify(result).includes('private-token'), false);
  await assert.rejects(() => inspectVercelDeployment('dpl_test', { token: 'x', fetchImpl: async () => ({ ok: true, json: async () => ({ ...data, meta: {} }) }) }), /provenance/);
  await assert.rejects(() => inspectVercelDeployment('dpl_test', { token: 'x', fetchImpl: async () => ({ ok: true, json: async () => ({ ...data, target: 'production' }) }) }), /production/);
});
