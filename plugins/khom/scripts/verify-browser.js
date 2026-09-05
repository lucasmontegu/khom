import { readFile } from 'node:fs/promises';
import { verifyBrowser } from '../src/browser.js';
import { inspectVercelDeployment } from '../src/vercel-deployment.js';

const [contractPath, snapshotPath, ...flags] = process.argv.slice(2);
if (!contractPath || !snapshotPath || flags.some(flag => flag !== '--local')) {
  console.error('Usage: npm run verify:browser -- contract.json snapshot.json [--local]');
  process.exitCode = 2;
} else {
  try {
    const contract = JSON.parse(await readFile(contractPath, 'utf8'));
    const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
    const report = await verifyBrowser({ contract, snapshot, scope: flags.includes('--local') ? 'local' : 'deployment',
      inspectDeployment: id => inspectVercelDeployment(id, { token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID }) });
    console.log(JSON.stringify({ status: report.status, scope: report.scope, reportPath: report.reportPath }, null, 2));
    process.exitCode = report.status === 'pass' ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
