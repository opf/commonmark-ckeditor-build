# OpenProject CKEditor5 build repository

This repository acts as a separated source for the custom CKEditor5 builds referenced in OpenProject.

[https://github.com/opf/openproject](https://github.com/opf/openproject)

[https://github.com/ckeditor/ckeditor5](https://github.com/ckeditor/ckeditor5)

## Setup

```shell
npm install
# Or with docker:
docker compose run --rm install
```

## Building

`npm run build` writes the bundle, its source map, the stylesheet and the translations to `dist/`. No OpenProject checkout is needed.

## Developing against OpenProject

OpenProject core installs this build from npm as `@openproject/commonmark-ckeditor-build`. To try local changes in a running core:

```shell
export OPENPROJECT_CORE=/path/to/openproject
npm run watch
```

Each rebuild is copied over the copy in `$OPENPROJECT_CORE/frontend/node_modules/@openproject/commonmark-ckeditor-build/dist/`. Running `npm ci` in core's `frontend/` restores the pinned version. `npm run watch` rebuilds the bundle only; run `npm run build` once first so the stylesheet and translations exist.

With docker compose, the copy into core is opt-in. Add both lines to `.env`, then run `docker compose up -d watch`:

```
OPENPROJECT_CORE=/absolute/path/to/openproject
COMPOSE_FILE=docker-compose.yml:docker-compose.core.yml
```

Nothing is copied unless core's `npm ci` has installed the package, and the mount refuses to create an empty package directory in core.

## Releasing

Releases are managed with [changesets](https://github.com/changesets/changesets).

1. Run `npm run changeset` in your branch, choose patch, minor or major, and commit the generated file. A pull request without one fails the "Check for changeset" check; use the `skip changeset` label when the published build does not change.
2. After the merge to `master`, a "Release Tracking" pull request appears or is updated. Do not edit it by hand.
3. "Release Tracking" is opened with `GITHUB_TOKEN`, so its CI runs wait for a maintainer to approve them in the Actions tab.
4. Merging "Release Tracking" publishes to npm under `latest`, with npm provenance, and creates the tag `v<version>` and the GitHub release.

The Release workflow follows Changesets' [trusted publishing setup](https://github.com/changesets/changesets/blob/main/docs/guide/automating.md#trusted-publishing): on every push to `master` it either versions (opens "Release Tracking") or, when a version is not yet published or tagged, packs it and publishes it. If a publish fails, fix the cause and re-run the Release workflow, or push again: the next run picks up whatever is still unpublished.

### Testing a change in core before releasing it

1. Add the label `canary` to your pull request. The "Canary build" workflow builds `0.0.0-canary-<UTC timestamp>-<commit SHA>`, and the Release workflow on `master` publishes it under the npm dist-tag `canary`. A comment on the pull request shows the install command and links the build run. Each push to a labelled pull request publishes a new canary. Canaries carry no npm provenance, since it would name the `master` run that published them rather than the pull request they were built from.
2. Pin that version in a core pull request and let core's CI run. Core refuses to merge a `0.0.0-` pin.
3. Merge here, merge "Release Tracking", then replace the pin in the core pull request with the released version.

### How publishing is protected

npm trusts one workflow, `release.yml`, in the GitHub environment `npm`. Only `master` may deploy to that environment, and `release.yml` only runs from `master`: on a push, or through `workflow_run` after a canary build, which always uses `master`'s copy.

Only the publish jobs get an npm identity, and they neither build nor run install scripts. A release's publish job installs the changesets CLI with `--ignore-scripts` and publishes the tarballs the pack job built. Pull request code never gets an npm identity: the canary build only uploads a tarball, which `bin/verify-tarball.mjs` reads strictly, rejects anything that would run on install, and has npm pack again; that repack is what gets published. Tests in `bin/lib/release-workflow.test.mjs` keep it that way.

This needs two settings outside the repository, set up in this order:

1. The GitHub environment `npm`, with deployment branches limited to `master`. Create it before a workflow refers to it: GitHub creates a missing environment without any protection rules.
2. The trusted publisher on npmjs.com: repository `opf/commonmark-ckeditor-build`, workflow `release.yml`, environment `npm`. The environment field is optional on npm; without it, any branch's copy of `release.yml` can publish. Never keep a trusted publisher without the environment, not even temporarily.

## Maintenance

### Updating CKEditor

Whenever a new CKEditor release is made, there are a plethora of packages to be updated. The easiest is to
use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) to update all dependencies in the package.json
and then rebuild + run openproject tests.

### Updating GitHub Actions

Workflows refer to actions by full version tag, and `.github/workflows/actions.lock` pins each one, including the actions it uses, to a commit. After changing a `uses:` line, run `gh actions-lock` and commit the lockfile with it; the "Verify actions lockfile" check fails otherwise. Install the extension once with `gh extension install github/gh-actions-lock`.

### Patch for ckeditor5-mention plugin

We use `patch-package` (https://www.npmjs.com/package/patch-package) to store a patch for the ckeditor5-mention plugin
to ensure multiple-hash mentions for work packages (e.g., `###2134`) work correctly.
See https://community.openproject.org/work_packages/47084 for context.

### Type checking

The source and tests are TypeScript, checked in strict mode. esbuild and jest strip types without checking them, so run
the checker separately:

```
npm run typecheck
```
