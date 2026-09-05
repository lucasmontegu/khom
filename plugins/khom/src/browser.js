import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import { validateContract } from './core.js';
import { scenarioHash } from './browser-plan.js';

function sameDeployment(actual, expected) {
  return actual?.state === 'READY' && ['deploymentId', 'sha', 'repo', 'url'].every(key => actual[key] && actual[key] === expected[key]);
}

// The inspector is trusted controller code, never worker-provided JSON.
export async function verifyBrowser({ contract, snapshot, inspectDeployment, scope = 'deployment',
  outputDir = '.khom-runtime/browser', timeoutMs = 30000, signal, launchOptions = {}, trace = false }) {
  validateContract(contract);
  if (!contract.browser) throw Error('Contract has no browser scenarios');
  if (!['local', 'deployment'].includes(scope)) throw Error('Invalid browser evidence scope');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120000) throw Error('Browser timeout must be 100..120000 ms per scenario');
  if (!snapshot?.url || !/^[a-f0-9]{40}$/.test(snapshot.sha ?? '') || snapshot.repo !== contract.repo) throw Error('Browser snapshot must match contract repository and a commit');
  const origin = new URL(snapshot.url);
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw Error('Use the exact deployment origin, without credentials or path');
  if (scope === 'local' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))) throw Error('Local verification is restricted to localhost');
  if (scope === 'deployment' && (origin.protocol !== 'https:' || !snapshot.deploymentId || typeof inspectDeployment !== 'function')) throw Error('Deployment inspection and HTTPS are required');
  const directory = resolve(outputDir, randomUUID());
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const evidence = [];
  let browser;
  let preflightFailure = null;
  try {
    signal?.throwIfAborted();
    if (scope === 'deployment' && !sameDeployment(await inspectDeployment(snapshot.deploymentId), snapshot)) throw Error('Deployment does not match candidate');
    browser = await chromium.launch({ ...launchOptions, headless: true, timeout: timeoutMs });
  } catch { preflightFailure = 'Browser launch, cancellation or deployment preflight failed'; }
  try {
    for (const scenario of contract.browser.scenarios) {
      const artifact = join(directory, `${scenario.id}.json`);
      const screenshot = join(directory, `${scenario.id}.png`);
      const tracePath = join(directory, `${scenario.id}.zip`);
      let context, timer, onAbort;
      let status = 'fail', reason = preflightFailure, captured = null, traceArtifact = null, stepIndex = -1;
      if (!preflightFailure) {
        try {
          signal?.throwIfAborted();
          context = await browser.newContext({ viewport: scenario.viewport, serviceWorkers: 'block' });
          onAbort = () => { context.close().catch(() => {}); };
          signal?.addEventListener('abort', onAbort, { once: true });
          timer = setTimeout(onAbort, timeoutMs);
          context.setDefaultTimeout(Math.min(5000, timeoutMs));
          context.setDefaultNavigationTimeout(Math.min(15000, timeoutMs));
          // Fixtures and requests stay on this deployment. Extra origins require a future explicit policy.
          await context.route('**/*', route => new URL(route.request().url()).origin === origin.origin ? route.continue() : route.abort());
          if (trace) await context.tracing.start({ screenshots: true, snapshots: true });
          const page = await context.newPage();
          const pageErrors = [];
          page.on('pageerror', () => pageErrors.push('Uncaught page error'));
          const target = new URL(scenario.path, origin.origin);
          if (target.origin !== origin.origin) throw Error('Scenario escaped deployment');
          const response = await page.goto(target.href, { waitUntil: 'domcontentloaded' });
          if (!response?.ok() || page.url() !== target.href) throw Error('Navigation failed or redirected');
          try {
            for (const [index, step] of scenario.steps.entries()) {
              stepIndex = index;
              const locator = page.locator(step.selector);
              if (step.action === 'click') await locator.click();
              else if (step.action === 'fill') await locator.fill(step.value);
              else if (step.action === 'press') await locator.press(step.value);
              else if (step.action === 'expectVisible') await expect(locator).toBeVisible();
              else if (step.action === 'expectText') await expect(locator).toHaveText(step.value);
              else if (step.action === 'expectValue') await expect(locator).toHaveValue(step.value);
            }
            if (pageErrors.length || new URL(page.url()).origin !== origin.origin) throw Error('Page error or origin change');
            signal?.throwIfAborted();
            status = 'pass';
          } finally {
            await page.screenshot({ path: screenshot, fullPage: true, mask: [page.locator('input[type=password]')] });
            captured = screenshot;
          }
        } catch {
          status = 'fail';
          reason = `Scenario failed at step ${stepIndex + 1}; inspect protected artifacts`;
        } finally {
          clearTimeout(timer);
          if (onAbort) signal?.removeEventListener('abort', onAbort);
          if (trace && context) {
            try { await context.tracing.stop({ path: tracePath }); traceArtifact = tracePath; }
            catch { status = 'fail'; reason = 'Trace could not be saved'; }
          }
          await context?.close().catch(() => {});
        }
      }
      for (const acceptanceId of scenario.acceptanceIds) evidence.push({
        kind: 'browser', engine: 'playwright', producer: 'verifier', scope, acceptanceId,
        repo: contract.repo, sha: snapshot.sha, revision: contract.revision,
        deploymentId: scope === 'deployment' ? snapshot.deploymentId : null,
        url: snapshot.url, viewport: scenario.viewport, scenario: scenario.id, scenarioHash: scenarioHash(scenario),
        status, reason, artifact, screenshot: captured, trace: traceArtifact, observedAt: new Date().toISOString(),
      });
    }
  } finally { await browser?.close(); }
  let deploymentVerifiedAt = null;
  if (scope === 'deployment' && !preflightFailure) {
    try {
      signal?.throwIfAborted();
      if (!sameDeployment(await inspectDeployment(snapshot.deploymentId), snapshot)) throw Error('Deployment changed');
      deploymentVerifiedAt = new Date().toISOString();
    } catch {
      for (const item of evidence) { item.status = 'fail'; item.reason = 'Deployment could not be reconfirmed after browser verification'; }
    }
  }
  if (signal?.aborted) {
    for (const item of evidence) { item.status = 'fail'; item.reason = 'Browser verification cancelled'; }
  }
  for (const item of evidence) item.deploymentVerifiedAt = deploymentVerifiedAt;
  for (const scenario of contract.browser.scenarios) {
    const items = evidence.filter(item => item.scenario === scenario.id);
    await writeFile(items[0].artifact, JSON.stringify(items, null, 2), { mode: 0o600 });
  }
  const report = { engine: 'playwright', scope, status: evidence.every(e => e.status === 'pass') ? 'pass' : 'fail', evidence };
  const reportPath = join(directory, 'report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
  return { ...report, reportPath };
}
