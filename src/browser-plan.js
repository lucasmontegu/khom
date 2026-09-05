import { createHash } from 'node:crypto';
export const scenarioHash = scenario => createHash('sha256').update(JSON.stringify(scenario)).digest('hex');
const actions = new Set(['click', 'fill', 'press', 'expectVisible', 'expectText', 'expectValue']);

export function validateBrowserPlan(contract) {
  const criteria = contract.acceptance.filter(ac => ac.kind === 'browser');
  if (!criteria.length && !contract.browser) return;
  const plan = contract.browser;
  if (!plan || plan.engine !== 'playwright' || !Array.isArray(plan.scenarios) || !plan.scenarios.length || plan.scenarios.length > 20) throw Error('Browser acceptance requires Playwright scenarios');
  const ids = new Set();
  for (const scenario of plan.scenarios) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(scenario.id ?? '') || ids.has(scenario.id)) throw Error('Unique browser scenario ID required');
    ids.add(scenario.id);
    if (!Array.isArray(scenario.acceptanceIds) || !scenario.acceptanceIds.length || scenario.acceptanceIds.some(id => !criteria.some(ac => ac.id === id))) throw Error('Scenario must map to browser acceptance IDs');
    if (typeof scenario.path !== 'string' || !scenario.path.startsWith('/') || scenario.path.startsWith('//') || scenario.path.includes('\\')) throw Error('Scenario path must stay on deployment origin');
    for (const key of ['width', 'height']) if (!Number.isInteger(scenario.viewport?.[key]) || scenario.viewport[key] < 200 || scenario.viewport[key] > 3840) throw Error('Invalid scenario viewport');
    if (!Array.isArray(scenario.steps) || !scenario.steps.length || scenario.steps.length > 50 || !scenario.steps.some(step => step.action?.startsWith('expect'))) throw Error('Each scenario needs at least one assertion');
    for (const step of scenario.steps) {
      if (!actions.has(step.action)) throw Error(`Unsupported browser action: ${step.action}`);
      if (typeof step.selector !== 'string' || !step.selector.trim()) throw Error('Browser step selector required');
      if (['fill', 'press', 'expectText', 'expectValue'].includes(step.action) && typeof step.value !== 'string') throw Error('Browser step value required');
    }
  }
  for (const ac of criteria) if (!plan.scenarios.some(s => s.acceptanceIds.includes(ac.id))) throw Error(`No browser scenario for ${ac.id}`);
}

export function currentBrowserEvidence(contract, ac, snapshot, evidence) {
  const scenarios = contract.browser?.scenarios?.filter(s => s.acceptanceIds.includes(ac.id));
  if (!scenarios?.length || !snapshot?.deploymentId || !snapshot?.url) return false;
  return scenarios.every(scenario => evidence.some(e =>
    e.acceptanceId === ac.id && e.kind === 'browser' && e.status === 'pass' && e.scope === 'deployment' &&
    e.producer === 'verifier' && e.engine === 'playwright' && e.repo === contract.repo &&
    e.sha === snapshot.sha && e.revision === contract.revision &&
    e.deploymentId === snapshot.deploymentId && e.url === snapshot.url &&
    e.scenario === scenario.id && e.scenarioHash === scenarioHash(scenario) &&
    e.viewport?.width === scenario.viewport.width && e.viewport?.height === scenario.viewport.height &&
    e.artifact && e.screenshot && e.observedAt && e.deploymentVerifiedAt));
}
