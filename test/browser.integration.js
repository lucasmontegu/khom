import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyBrowser } from '../src/browser.js';
import { Store, gate } from '../src/core.js';
import { createServer } from '../src/server.js';
const contract = async () => JSON.parse(await readFile(new URL('../examples/browser-change.json', import.meta.url), 'utf8'));
const start = server => new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const close = server => new Promise(resolve => server.close(resolve));

test('real Chromium tests Khom on desktop/mobile and emits screenshots; local evidence cannot approve delivery', async () => {
  const store = new Store(); const server = createServer(store, 'x'.repeat(32));
  const dir = await mkdtemp(join(tmpdir(), 'khom-browser-'));
  await start(server);
  try {
    const c = await contract();
    const snapshot = { repo: c.repo, sha: 'a'.repeat(40), url: `http://127.0.0.1:${server.address().port}` };
    const report = await verifyBrowser({ contract: c, snapshot, scope: 'local', outputDir: dir });
    assert.equal(report.status, 'pass', JSON.stringify(report.evidence));
    assert.equal(report.evidence.length, 2);
    for (const e of report.evidence) {
      const png = await readFile(e.screenshot);
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.equal(e.scope, 'local'); assert.equal(e.deploymentVerifiedAt, null);
    }
    assert.equal(gate(c, { ...snapshot, checks: 'pass', pr: 1, baseSha: c.baseSha }, report.evidence).pass, false);
    c.browser.scenarios = [c.browser.scenarios[0]];
    c.browser.scenarios[0].steps[0].value = 'Incorrect title';
    const failed = await verifyBrowser({ contract: c, snapshot, scope: 'local', outputDir: dir });
    assert.equal(failed.status, 'fail'); assert.ok(failed.evidence[0].screenshot);
  } finally { await close(server); store.close(); await rm(dir, { recursive: true }); }
});

test('real Chromium executes interactions; redirects and uncaught application errors fail', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/redirect') { res.writeHead(302, { Location: '/' }); res.end(); return; }
    res.setHeader('Content-Type', 'text/html');
    res.end(`<input id="name"><button onclick="document.querySelector('#result').textContent=document.querySelector('#name').value">Save</button><p id="result"></p>${req.url === '/error' ? '<script>throw Error("broken")</script>' : ''}`);
  });
  const dir = await mkdtemp(join(tmpdir(), 'khom-interactions-'));
  await start(server);
  try {
    const c = await contract(); const scenario = c.browser.scenarios[0]; c.browser.scenarios = [scenario];
    scenario.steps = [{ action: 'fill', selector: '#name', value: 'Ada' }, { action: 'click', selector: 'button' }, { action: 'expectText', selector: '#result', value: 'Ada' }];
    const snapshot = { repo: c.repo, sha: 'a'.repeat(40), url: `http://127.0.0.1:${server.address().port}` };
    assert.equal((await verifyBrowser({ contract: c, snapshot, scope: 'local', outputDir: dir })).status, 'pass');
    for (const path of ['/redirect', '/error']) {
      scenario.path = path;
      assert.equal((await verifyBrowser({ contract: c, snapshot, scope: 'local', outputDir: dir })).status, 'fail');
    }
  } finally { await close(server); await rm(dir, { recursive: true }); }
});

test('deployment preflight mismatch prevents browser execution and yields failed evidence', async () => {
  const c = await contract(); const dir = await mkdtemp(join(tmpdir(), 'khom-preflight-'));
  try {
    const snapshot = { repo: c.repo, sha: 'a'.repeat(40), deploymentId: 'dpl_test', url: 'https://preview.vercel.app' };
    const report = await verifyBrowser({ contract: c, snapshot, outputDir: dir, inspectDeployment: async () => ({ ...snapshot, sha: 'b'.repeat(40), state: 'READY' }) });
    assert.equal(report.status, 'fail'); assert.equal(report.evidence[0].screenshot, null);
  } finally { await rm(dir, { recursive: true }); }
});
