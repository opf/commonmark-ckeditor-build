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

With docker compose, set `OPENPROJECT_CORE` in `.env` and run `docker compose up -d watch`.

## Releasing

Releases are managed with [changesets](https://github.com/changesets/changesets).

1. Run `npm run changeset` in your branch, choose patch, minor or major, and commit the generated file. A pull request without one fails the "Check for changeset" check; use the `skip changeset` label when the published build does not change.
2. After the merge to `master`, a "Release Tracking" pull request appears or is updated. Do not edit it by hand.
3. Merging "Release Tracking" publishes to npm and creates the tag and GitHub release.

### Testing a change in core before releasing it

1. Add the label `canary` to your pull request. A snapshot version `0.0.0-canary-<timestamp>` is published under the npm dist-tag `canary`, and a comment on the pull request shows the install command.
2. Pin that version in a core pull request and let core's CI run. Core refuses to merge a `0.0.0-` pin.
3. Merge here, merge "Release Tracking", then replace the pin in the core pull request with the released version.

## Maintenance

### Updating CKEditor

Whenever a new CKEditor release is made, there are a plethora of packages to be updated. The easiest is to
use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) to update all dependencies in the package.json
and then rebuild + run openproject tests.

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

## Migration Notes

### jQuery Removal

As of version 12.0.0, this library no longer uses jQuery internally. All jQuery dependencies have been replaced with
vanilla JavaScript equivalents using Request.JS and native DOM manipulation.

**Important for downstream consumers (e.g., OpenProject):** While this library no longer uses jQuery internally,
downstream applications should continue to expose the jQuery global if other parts of the application depend on it. Do
not remove the jQuery global from the downstream application (OpenProject) yet until all components have been migrated.

For more details on the downstream migration, see: https://github.com/opf/openproject/pull/19429.

