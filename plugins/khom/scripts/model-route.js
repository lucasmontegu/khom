import { readFile } from 'node:fs/promises';
import { selectExecution } from '../src/model-policy.js';
import { validateContract } from '../src/core.js';
const [path, task = 'implement', failures = '0'] = process.argv.slice(2);
try {
  if (!path) throw Error('Usage: npm run model:route -- contract.json [task] [failed-attempts]');
  const contract = validateContract(JSON.parse(await readFile(path, 'utf8')));
  const execution = selectExecution({ task, risk: contract.risk, policy: contract.modelPolicy, failedAttempts: Number(failures) });
  console.log(JSON.stringify(execution, null, 2));
  if (['decision', 'blocked'].includes(execution.kind)) process.exitCode = 1;
} catch (error) { console.error(error.message); process.exitCode = 1; }
