# OpenProject CKEditor5 build repository

This repository acts as a separated source for the custom CKEditor5 builds referenced in OpenProject.


[https://github.com/opf/openproject](https://github.com/opf/openproject)

[https://github.com/ckeditor/ckeditor5](https://github.com/ckeditor/ckeditor5)



1. Install the dependencies

```
# In this repository's root (commonmark-ckeditor-build)
npm install
```

2. Reference the link in OpenProject

```
export OPENPROJECT_CORE=/path/to/openproject/root
```



## Building


Building into the core is easy, just run

`npm run build`


This will override the `frontend/src/vendor/ckeditor/*` contents with the newest webpack build. You need to run this before opening a pull request.

> [!important]
>  Please ensure that for any changes in this repository, you have a core repository with the output of `npm run build`, so that all core tests can run and confirm your changes. Both pull requests should _always_ be merged at the same time, never alone

The generated output is written to:

`frontend/src/vendor/ckeditor/*`

### TypeScript types for downstream

This package now emits declaration files into `build/types`.
During `npm run build`, those declarations are also copied into:

- `frontend/src/vendor/ckeditor/types.d.ts`
- `frontend/src/vendor/ckeditor/op-ckeditor.d.ts`

Downstream consumers can import shared editor interfaces from:

```ts
import type { ICKEditorInstance, ICKEditorStatic } from '@openproject/commonmark-ckeditor-build/types';
```

The main package entry also exports these interfaces.


### Updating CKEditor

Whenever a new CKEditor release is made, there are a plethora of packages to be updated. The easiest is to use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) to update all dependencies in the package.json and then rebuild + run openproject tests.



### Patch for ckeditor5-mention plugin

We use `patch-package` (https://www.npmjs.com/package/patch-package) to store a patch for the ckeditor5-mention plugin to ensure multiple-hash mentions for work packages (e.g., `###2134`) work correctly. See https://community.openproject.org/work_packages/47084 for context.



## Development

- Run `npm run watch`

Now the webpack development mode is building the files and outputting them to `frontend/src/vendor/ckeditor/*`, overriding anything in there.



## Migration Notes

### jQuery Removal

As of version 11.2.0, this library no longer uses jQuery internally. All jQuery dependencies have been replaced with vanilla JavaScript equivalents using Request.JS and native DOM manipulation.

**Important for downstream consumers (e.g., OpenProject):** While this library no longer uses jQuery internally, downstream applications should continue to expose the jQuery global if other parts of the application depend on it. Do not remove the jQuery global from the downstream application (OpenProject) yet until all components have been migrated.

For more details on the downstream migration, see: https://github.com/opf/openproject/pull/19429
