# Workflow skills

Khom ships 25 Addy Osmani skills and 25 stable Matt Pocock engineering/productivity skills. Matt's `in-progress`, deprecated and miscellaneous packs are excluded. Both upstreams are MIT licensed; see [third-party notices](../THIRD_PARTY_NOTICES.md). Full directories preserve local references and scripts without rewriting upstream instructions.

The marketplace package includes these files offline. Install Khom once; a separate global skills installation is unnecessary. Khom is the discoverable entry point; the upstream packs are loaded from `vendor/` on demand rather than registering 50 competing automatic triggers.

## Select a workflow

From the Khom package directory:

```sh
npm run skill:route -- plan balanced
npm run skill:route -- implement matt
npm run skill:route -- review addy
npm run skill:route -- matt/to-spec --content
```

The output identifies the skill directory, content hash and upstream provenance. `--content` also emits the instructions. Read referenced files relative to that directory as needed; do not paste entire packs into context.

| Stage | balanced (default) | addy | matt |
| --- | --- | --- | --- |
| clarify | Matt grilling | Addy interview-me | Matt grilling |
| plan | Addy planning-and-task-breakdown | same | Matt codebase-design |
| implement | Matt tdd | Addy incremental-implementation | Matt tdd |
| repair | Addy debugging-and-error-recovery | same | Matt diagnosing-bugs |
| review | Addy code-review-and-quality | same | Matt code-review |
| test design | Matt tdd | Addy test-driven-development | Matt tdd |

Matt's planning selection supplies architecture discipline. Explicit orchestration skills such as `to-spec`, `to-tickets`, `implement` and `wayfinder` remain available by ID; they are not implicitly invoked, since upstream marks them user-invoked. Before using Matt's tracker workflows, run/read `matt/setup-matt-pocock-skills` in the target project to configure its tracker and document locations. Khom does not create issues or configure external services during installation.

## Host adaptation

Upstream instructions are workflow guidance under the current user's authorization, host instructions, approved contract and budgets. A skill cannot expand permissions or turn a failed check into PASS. Claude-specific slash commands, tools, hooks and agent types are not automatically supported in Codex or Cursor. Use equivalent available host capabilities; report missing required capabilities.

Default to one worker. Where upstream requests parallel agents, use sequential review passes unless the user authorized delegation and the host supports it. Retain separate review context and evidence. Installing Khom does not switch the current chat's model. Browser execution remains Khom's Playwright verifier; the `test` stage above designs tests and does not replace deterministic verification.

## Worker context and integrity

```js
import { selectSkill } from './src/skill-registry.js';
import { compileContext } from './src/core.js';
const skill = selectSkill('implement', 'balanced');
const context = compileContext(contract, { sha, capability: 'implement', skill });
```

The loader verifies the complete skill directory, including references, before returning content. The context manifest records the skill content hash, upstream revision and bundle hash. Explicitly supplied reference files are also hashed by the context compiler. Keep that manifest with the attempt. This is a callable integration, not an automatic remote dispatcher; the existing queued-run limitation still applies. Existing runs must retain their selected revision and context; do not reload a newly updated pack midway through an approved run.

## Updating upstreams

`skill-lock.json` pins both repository commits and every bundled file. Updates are deliberate source changes, not runtime downloads. Fetch the desired commit, review its instructions and license, replace the applicable complete vendor directories, regenerate their checksums, test, and rebuild the plugin. Do not use `npx skills update` to mutate the vendored package.

For independent installations outside Khom, upstream provides:

```sh
npx skills add addyosmani/agent-skills
npx skills add mattpocock/skills
```

These install separately and do not update Khom's pinned bundle. Addy's [Codex setup](https://github.com/addyosmani/agent-skills/blob/main/docs/codex-setup.md) also documents its native plugin. Avoid duplicate independent installations unless you intend to use both entry points.
