import { createHash } from 'node:crypto';

const tiers = ['luna', 'sol', 'astra'];
const models = { luna: 'gpt-5.6-luna', sol: 'gpt-5.6-sol', astra: 'gpt-6-astra' };
const efforts = ['low', 'medium', 'high'];
const tools = new Set(['verify', 'browser', 'checks', 'state']);
const tasks = new Set(['clarify', 'plan', 'implement', 'repair', 'debug', 'review', 'summarize']);
const readOnly = new Set(['clarify', 'plan', 'review', 'summarize']);

export function resolvePolicy(input = {}) {
  if (!input || Array.isArray(input) || typeof input !== 'object') throw Error('Invalid model policy');
  for (const key of Object.keys(input)) {
    if (!['version', 'maxTier', 'effort'].includes(key)) throw Error(`Unknown model policy option: ${key}`);
  }
  const policy = { version: 1, maxTier: 'astra', effort: 'medium', ...input };
  if (policy.version !== 1 || !tiers.includes(policy.maxTier) || !efforts.includes(policy.effort)) throw Error('Invalid model policy');
  return policy;
}

// Selection is deterministic. This never dispatches or authorizes another attempt.
export function selectExecution({ task = 'implement', risk = 'standard', failedAttempts = 0, policy: input, availableModels } = {}) {
  const policy = resolvePolicy(input);
  if (!['low', 'standard', 'high'].includes(risk)) throw Error('Invalid task risk');
  if (!Number.isInteger(failedAttempts) || failedAttempts < 0) throw Error('Invalid failed attempt count');
  const policyHash = createHash('sha256').update(JSON.stringify(policy)).digest('hex');
  if (tools.has(task)) return { kind: 'tool', task, model: null, reasoningEffort: null, policyHash, reason: 'Deterministic verification or bookkeeping; no model call' };
  if (!tasks.has(task)) throw Error(`Unknown model task: ${task}`);
  let tier = ['clarify', 'plan', 'debug', 'review'].includes(task) ? 1 : 0;
  if (risk === 'high') tier = ['implement', 'repair', 'summarize'].includes(task) ? Math.max(tier, 1) : 2;
  if (['implement', 'repair', 'debug'].includes(task)) tier = Math.min(2, tier + failedAttempts);
  const selected = tiers[tier];
  const reason = `${task}; risk=${risk}; failedAttempts=${failedAttempts}; selected=${selected}`;
  if (tier > tiers.indexOf(policy.maxTier)) {
    return { kind: 'decision', task, policyHash, reason: `${reason}; exceeds authorized ceiling ${policy.maxTier}` };
  }
  const model = models[selected];
  if (availableModels && !availableModels.includes(model)) {
    return { kind: 'blocked', task, policyHash, reason: `${model} is unavailable; no silent substitution` };
  }
  return { kind: 'model', task, tier: selected, model, reasoningEffort: policy.effort, sandbox: readOnly.has(task) ? 'read-only' : 'workspace-write', policyHash, reason };
}
