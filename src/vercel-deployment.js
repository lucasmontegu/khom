// Read-only collector for GitHub-linked Vercel previews. No Sandbox provisioning.
export async function inspectVercelDeployment(id, { token, teamId, fetchImpl = fetch } = {}) {
  if (!/^dpl_[A-Za-z0-9]+$/.test(id ?? '')) throw Error('Vercel deployment ID required');
  if (!token) throw Error('VERCEL_TOKEN required for deployment inspection');
  const url = new URL(`https://api.vercel.com/v13/deployments/${id}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw Error(`Vercel deployment inspection failed (${response.status})`);
  const data = await response.json();
  const sha = data.meta?.githubCommitSha;
  const org = data.meta?.githubCommitOrg;
  const repo = data.meta?.githubCommitRepo;
  if (data.id !== id || !/^[a-f0-9]{40}$/.test(sha ?? '') || !org || !repo || typeof data.url !== 'string') throw Error('Deployment lacks verified GitHub provenance');
  const deploymentUrl = new URL(`https://${data.url}`);
  if (deploymentUrl.username || deploymentUrl.password || deploymentUrl.pathname !== '/' || deploymentUrl.search || deploymentUrl.hash) throw Error('Invalid deployment hostname');
  if (data.target === 'production') throw Error('Browser verification requires a preview, not production');
  return { deploymentId: data.id, sha, repo: `${org}/${repo}`, url: deploymentUrl.origin, state: data.readyState };
}
