# Khom

A Codex-first delivery harness: agree on a scoped change, choose the right model, implement it, and keep verifiable evidence of the result. **Codex and Cursor plugin packages are included.** Vercel Sandbox is the default remote execution provider.

[Install in Codex](#install-in-codex) · [Install in Cursor](#install-in-cursor) · [Model routing](#model-routing) · [Browser verification](#browser-verification)

> **Development status:** the plugin, model router, local control API, durable store, and Playwright verifier work as individual components. The Vercel Sandbox dispatcher is not connected yet. Creating an API run leaves it queued; it does not launch a remote worker. Cursor support provides the workflow skill and local tools, not a separate Cursor execution adapter.

## Install in Codex

### Codex app

Open **Plugins → Add marketplace** and enter:

| Field | Value |
| --- | --- |
| Source | `lucasmontegu/khom` |
| Git ref | `main` |
| Sparse paths | **Leave empty** |

Click **Add marketplace**, find **Khom**, and install it. Start a new task to load the plugin. The full Git URL also works: `https://github.com/lucasmontegu/khom.git`.

Do not enter `plugins/codex` in Sparse paths: that directory does not exist in this repository. Both clients use the package at `plugins/khom`; their marketplace catalogs live at the repository root. No manual copying into your personal marketplace is needed.

### Codex CLI

```sh
codex plugin marketplace add lucasmontegu/khom --ref main
codex plugin add khom@khom
```

The first `khom` is the plugin name; the second is the marketplace name. This adds this repository as a Git marketplace, not to OpenAI's curated public catalog.

## Install in Cursor

### Import the marketplace

In Cursor **Dashboard → Plugins → Team Marketplaces**, choose **Add Marketplace → Import from Repo** and use:

```text
https://github.com/lucasmontegu/khom
```

Review Khom with **Add to Marketplace**, save access settings, then find it under **Customize** and select **Install**. Team marketplaces require an eligible Cursor team plan. [Cursor marketplace instructions](https://cursor.com/docs/plugins).

With a Cursor CLI version that supports marketplace management, the equivalent import command is:

```sh
agent plugin marketplace add https://github.com/lucasmontegu/khom.git --git-ref main
```

This command requires Cursor authentication and the account's marketplace permissions. It imports the catalog; do not assume it also installs Khom for every workspace.

### Public Cursor catalog

The package is prepared for submission, but **Khom is not claimed to be publicly listed**. Publishing to Cursor's public catalog requires submitting this repository at [Cursor Marketplace Publish](https://cursor.com/marketplace/publish) and completing their review. A Git push alone does not publish a listing. [Submission reference](https://cursor.com/docs/reference/plugins#submitting-a-plugin).

For local development without a team marketplace, clone this repository and load the package explicitly:

```sh
agent --plugin-dir ./plugins/khom
```

This is a local development option, not a marketplace installation.

## Use the plugin

Select Khom in your client and describe the task:

```text
Use Khom to plan an activity filter. Do not implement yet.
```

```text
Use Khom to change this button label in the current session.
Keep the existing behavior and verify the result.
```

```text
Implement this approved Khom contract in the current session.
Use Playwright to verify the agreed desktop and mobile scenarios.
```

| Request | Expected behavior |
| --- | --- |
| `Khom plan: <goal>` | Inspect the project and prepare a contract without implementing |
| `Khom quick: <goal>, in this session` | Make a small authorized change and verify it proportionally |
| `Khom status: <run-id>` | Read an API run's persisted state when the API is configured |
| `Khom stop: <run-id>` | Request cancellation and report any pending confirmation |
| `Khom debrief` | Analyze existing receipts and identify evidence-backed improvements |

These are conversational requests, not native slash commands or a `khom` CLI. Session work does not automatically create an API run. Keep its contract and evidence summary in the target project's `.khom/` directory.

The skill works with the active client's tools and permissions. Installing it **does not change the current chat's model**. Astra/Sol/Luna routing applies to explicit Codex worker calls; it is not a claim that Cursor exposes those model IDs. The remote worker remains Codex-first.

## Set up the local tools

The plugin's skill can guide an existing session without a running API. The bundled JavaScript tools require **Node.js 24+** and their dependencies. To develop or run the control plane:

```sh
git clone https://github.com/lucasmontegu/khom.git
cd khom
npm ci
npm test
npm run check
npm run plugins:check
```

`npm ci` installs the pinned Playwright dependency. Core tests use an ephemeral localhost server. Browser tests run separately after installing Chromium.

Installed plugins include the same runtime files. If you run them from the plugin package, install dependencies there first; marketplace installation does not automatically run `npm ci` or download browsers. The repository checkout is the recommended place to develop the runtime.

## Start the control API

```sh
export KHOM_API_TOKEN="$(openssl rand -hex 32)"
npm start
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317) and enter the token. Keep it in a secret manager if you need to reuse it. The server requires at least 32 characters and binds to localhost by default.

| Variable | Purpose |
| --- | --- |
| `KHOM_API_TOKEN` | Required bearer token for the server and its clients |
| `PORT` | Server port; default `4317` |
| `HOST` | Listening interface; default `127.0.0.1` |
| `KHOM_API_URL` | API address provided to the agent as a client; does not configure the server |

Environment files are not loaded automatically. Use `node --env-file=.env src/server.js` instead of `npm start` if needed. Never commit credentials.

State is stored in `.khom-runtime/state.sqlite`, outside Git. The dashboard shows runs and provides a stop button; contract creation and approval use the API. This is a single-owner development service. Do not deploy its SQLite store on an ephemeral Vercel Functions filesystem.

## Try a contract and receipt

In a second terminal, export the **same** `KHOM_API_TOKEN`. Prepare a contract with the real repository and base commit:

```sh
mkdir -p .khom-runtime
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const c = JSON.parse(readFileSync("examples/change.json", "utf8"));
c.repo = "lucasmontegu/khom";
c.baseSha = execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim();
writeFileSync(".khom-runtime/change.json", JSON.stringify(c, null, 2));
'
```

Edit `.khom-runtime/change.json` to describe a real goal, acceptance criteria, invariants, permissions, and budget. The button example is illustrative; this repository does not contain that form. For actual delivery, also keep `.khom/changes/<id>/change.md` in the target project.

Register the contract, review it, then approve its exact revision:

```sh
curl --fail-with-body http://127.0.0.1:4317/api/changes \
  -H "Authorization: Bearer $KHOM_API_TOKEN" \
  -H 'Content-Type: application/json' --data-binary @.khom-runtime/change.json

# Update the ID and revision if you changed the example.
curl --fail-with-body http://127.0.0.1:4317/api/changes/button-label/approve \
  -H "Authorization: Bearer $KHOM_API_TOKEN" \
  -H 'Content-Type: application/json' -d '{"revision":1}'

curl --fail-with-body http://127.0.0.1:4317/api/changes/button-label/run \
  -H "Authorization: Bearer $KHOM_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: button-label-first-run' -d '{}'
```

Copy the returned run ID. **The expected state is `queued`** because the dispatcher is not implemented. You can test cancellation and receipt creation without launching a worker:

```sh
export KHOM_RUN_ID='replace-with-returned-run-id'
curl --fail-with-body "http://127.0.0.1:4317/api/runs/$KHOM_RUN_ID" \
  -H "Authorization: Bearer $KHOM_API_TOKEN"
curl --fail-with-body -X POST "http://127.0.0.1:4317/api/runs/$KHOM_RUN_ID/stop" \
  -H "Authorization: Bearer $KHOM_API_TOKEN"
curl --fail-with-body "http://127.0.0.1:4317/api/runs/$KHOM_RUN_ID/receipt" \
  -H "Authorization: Bearer $KHOM_API_TOKEN"
```

Stopping a queued run produces a `cancelled` receipt. Continuing creates a successor with `{"parent":"<previous-run-id>"}` and a new `Idempotency-Key`. Reuse a key only to retry the same request. Contract changes require a higher revision and renewed approval.

## Model routing

| Task | Low/standard risk | High risk |
| --- | --- | --- |
| Implement or repair | Luna | Sol |
| Clarify, plan, diagnose, or review | Sol | Astra |
| Summarize | Luna | Sol |
| Run tests, browser checks, or bookkeeping | No model | No model |

The contract includes:

```json
{
  "risk": "standard",
  "modelPolicy": { "version": 1, "maxTier": "astra", "effort": "medium" }
}
```

Supported risk levels are `low`, `standard`, and `high`. Model ceilings are `luna`, `sol`, and `astra`; reasoning effort is `low`, `medium`, or `high`. If the required model exceeds the approved ceiling, Khom requests approval instead of silently substituting a model. Older contracts without an explicit policy need a new approved revision.

Preview routing **without calling a model**:

```sh
npm run model:route -- examples/change.json implement
npm run model:route -- examples/change.json plan
npm run model:route -- examples/change.json review
npm run model:route -- examples/change.json implement 1
npm run model:route -- examples/change.json browser
```

A confirmed repairable failure can escalate Luna to Sol, then Astra, within the approved ceiling and attempt/stagnation budgets. Missing evidence alone does not trigger escalation. Routing never authorizes another attempt by itself.

The Codex adapter passes model and reasoning effort explicitly. Review uses a fresh ephemeral context and read-only sandbox. Each attempt records its requested model, selection reason, policy hash, and available usage. Monetary cost remains `unavailable`; no savings are claimed without measurement. The controller must validate model availability on the worker account.

## Browser verification

Install Chromium and run the real browser tests:

```sh
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.khom-runtime/browsers"
npm run browser:install
npm run test:browser
```

With `npm start` running in another terminal, create a local snapshot:

```sh
mkdir -p .khom-runtime
node --input-type=module -e '
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
writeFileSync(".khom-runtime/browser-snapshot.json", JSON.stringify({
  repo: "lucasmontegu/khom",
  sha: execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8"}).trim(),
  url: "http://127.0.0.1:4317"
}, null, 2));
'
npm run verify:browser -- examples/browser-change.json .khom-runtime/browser-snapshot.json --local
```

The example checks the current panel on desktop and mobile; its assertions intentionally match the panel's existing Spanish labels. The command returns status, scope, and report location, and exits with code `1` on failure. Reports and screenshots are stored under `.khom-runtime/browser/<id>/`.

**Local evidence cannot approve a remote delivery.** The local SHA is a caller-supplied reference, not an external verification of the served content.

For a real Vercel preview, prepare a snapshot with `repo`, `sha`, `deploymentId`, and its immutable HTTPS origin (no trailing slash or branch alias). Set `VERCEL_TOKEN` and, if needed, `VERCEL_TEAM_ID`, then run:

```sh
npm run verify:browser -- approved-contract.json preview-snapshot.json
```

The collector checks Vercel before and after execution and requires matching GitHub provenance. It rejects production, mismatched SHA/repository, or a deployment that is not ready. Every authorized scenario and viewport must have current evidence and a screenshot. Automated tests use local fixtures and simulated Vercel responses; a live account still needs validation.

Scenarios support `click`, `fill`, `press`, `expectVisible`, `expectText`, and `expectValue` with Playwright selectors. Each must contain an assertion. Initial redirects and cross-origin HTTP requests are blocked. Protected previews without authorized access fail. Use fixtures, not credentials, in contracts. Screenshots do not replace visual judgement or a complete accessibility audit.

## Remote execution

**Vercel Sandbox is the default remote worker provider.** The intended path is plugin → durable controller → Codex in Vercel Sandbox → verification → draft PR and evidence.

There is no `khom deploy` command or connected Sandbox dispatcher yet. Local use does not require Vercel credentials. Contract state, authorizations, and receipts must live outside a disposable worker workspace before unattended remote delivery is supported.

## Development and packaging

Canonical sources live at the repository root. Both marketplaces install the generated, self-contained `plugins/khom` directory:

```text
.agents/plugins/marketplace.json   Codex marketplace catalog
.cursor-plugin/marketplace.json   Cursor marketplace catalog
.codex-plugin/plugin.json        Source Codex manifest
.cursor-plugin/plugin.json       Source Cursor manifest
skills/khom/SKILL.md              Shared English workflow skill
src/                             Delivery core, adapters and verifier
plugins/khom/                    Generated package for both clients
```

After editing sources, rebuild and validate before committing:

```sh
npm run plugins:build
npm run plugins:check
npm test
npm run check
```

Commit the generated package so marketplace users do not need a build step. Packaging uses an explicit allowlist and rejects symlinks; it excludes credentials, runtime data, browser binaries, dependencies, and Git history. See [marketplace maintenance](docs/MARKETPLACES.md) for update and validation details.

`Store.complete` and `Store.reconcile` are trusted internal interfaces. A worker's own report cannot substitute for independent evidence or external HEAD/check/cancellation confirmation.

Remaining work includes the remote dispatcher, external recovery, Codex authentication in Sandbox, automatic PR/check collection, live judge execution, per-client isolation, and notifications. The delivery target is **ready_to_merge**; merge and production are separate actions.

Additional design notes are currently in Spanish: [PRD](docs/PRD.md), [implementation status](docs/IMPLEMENTATION.md), [model/browser integration](docs/MODELS_AND_BROWSER.md), and [Vercel Sandbox decision](docs/VERCEL_SANDBOX.md).

Proprietary code. No redistribution license is granted by this repository.
