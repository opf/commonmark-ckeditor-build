# OpenProject CKEditor5 build repository

This repository acts as a separated source for the custom CKEditor5 builds referenced in OpenProject.

[https://github.com/opf/openproject](https://github.com/opf/openproject)

[https://github.com/ckeditor/ckeditor5](https://github.com/ckeditor/ckeditor5)

## Setup

### Install the dependencies

```shell
# In this repository's root (commonmark-ckeditor-build)
npm install
# Or with docker:
docker compose run --rm install
```

### Reference the link in OpenProject

```shell
export OPENPROJECT_CORE=/path/to/openproject/root
```

If using the docker compose services, the `OPENPROJECT_CORE` environment variable must be set in the `.env` file.

## Building

To build for the OpenProject core, run `npm run build` or `docker compose run --rm build`. This will override the
`frontend/src/vendor/ckeditor/*` contents in the core repository with the newest webpack build. You need to run this
before opening a pull request.

> [!IMPORTANT]
> Please ensure that for any changes in this repository, you have a core repository with the output of `npm run build`,
> so that all core tests can run and confirm your changes. Both pull requests should _always_ be merged at the same
> time,
> never alone

### Updating CKEditor

Whenever a new CKEditor release is made, there are a plethora of packages to be updated. The easiest is to
use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) to update all dependencies in the package.json
and then rebuild + run openproject tests.

### Patch for ckeditor5-mention plugin

We use `patch-package` (https://www.npmjs.com/package/patch-package) to store a patch for the ckeditor5-mention plugin
to ensure multiple-hash mentions for work packages (e.g., `###2134`) work correctly.
See https://community.openproject.org/work_packages/47084 for context.

## Development

- Run `npm run watch`
- Alternatively, run `docker compose up -d watch`

Now the webpack development mode is building the files and outputting them to `frontend/src/vendor/ckeditor/*` in the
core repository, overriding anything in there.

## Migration Notes

### jQuery Removal

As of version 11.2.0, this library no longer uses jQuery internally. All jQuery dependencies have been replaced with
vanilla JavaScript equivalents using Request.JS and native DOM manipulation.

**Important for downstream consumers (e.g., OpenProject):** While this library no longer uses jQuery internally,
downstream applications should continue to expose the jQuery global if other parts of the application depend on it. Do
not remove the jQuery global from the downstream application (OpenProject) yet until all components have been migrated.

For more details on the downstream migration, see: https://github.com/opf/openproject/pull/19429.

