# Marketplace distribution

Khom ships one package with two host manifests. The source repository is also its marketplace source; users do not need to edit global configuration JSON or copy individual skills.

## Layout and resolution

- Codex reads `.agents/plugins/marketplace.json` and resolves the local entry `./plugins/khom` from the repository root.
- Cursor reads `.cursor-plugin/marketplace.json` and resolves the same directory.
- Each package contains `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`, the shared skill, runtime sources, examples, docs and a dependency lockfile.
- The root manifests remain source templates. The catalogs point only to the generated package, avoiding duplicate entries.

No paths escape the package and no symlinks are required. The package includes the files referenced by the skill, so installation does not depend on an adjacent source checkout. Browser binaries and npm dependencies are installed separately when running the tools.

## Add the Git marketplace

Codex:

```sh
codex plugin marketplace add lucasmontegu/khom --ref main
codex plugin add khom@khom
```

In the app's Add marketplace form, enter `lucasmontegu/khom`, ref `main`, and leave Sparse paths empty. This is a repository marketplace, not the implicit personal marketplace.

Cursor CLI versions with marketplace support:

```sh
agent plugin marketplace add https://github.com/lucasmontegu/khom.git --git-ref main
```

Account permissions apply. This imports a marketplace; installation is selected in Cursor. Public catalog submission is separate from a team import and from a Git push. The README links the supported dashboard and submission flows.

## Update sources and packages

1. Edit files at the repository root, including the shared skill and source manifests.
2. For a real release, update both manifest versions together.
3. Run `npm run plugins:build`.
4. Run `npm run plugins:check`, `npm test` and `npm run check`.
5. Commit both the source edits and generated `plugins/khom` changes, then push the tracked branch.
6. Refresh the Git marketplace in the client and load the updated plugin in a new task.

`plugins:check` detects stale copies and verifies that both catalogs resolve to complete packages. It does not claim marketplace approval or a successful account-specific installation.

For CLI refresh, inspect `codex plugin marketplace upgrade --help` or `agent plugin marketplace update --help` on the installed client. The global personal-marketplace copy workflow is not needed here. Local cachebuster/reinstall iterations should use the official `plugin-creator` helpers rather than editing an existing marketplace config by hand.

## Validation sources

The Codex manifest follows the official `plugin-creator` scaffold and validator. Cursor metadata follows its [plugin reference](https://cursor.com/docs/reference/plugins) and [official template](https://github.com/cursor/plugin-template). The repository's validator checks the subset used by Khom; it is not a replacement for either host's full ingestion validation.

The Cursor interface exposes the shared workflow only. Khom's model IDs and execution adapter remain specific to Codex. No Cursor model switch, automatic npm install, remote worker, or public listing is implied by package installation.
