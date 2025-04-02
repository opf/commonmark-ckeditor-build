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



This will override the `app/assets/javascripts/vendor/ckeditor/*` contents with the newest webpack build. You need to run this before opening a pull request.

Please also ensure you always create a pull request on this repository that gets merged whenever the core counterpart gets merged to ensure the master of this branch is always the latest built version in OpenProject



### Updating CKEditor

Whenever a new CKEditor release is made, there are a plethora of packages to be updated. The easiest is to use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) to update all dependencies in the package.json and then rebuild + run openproject tests.



### Patch for ckeditor5-mention plugin

We use `patch-package` (https://www.npmjs.com/package/patch-package) to store a patch for the ckeditor5-mention plugin to ensure multiple-hash mentions for work packages (e.g., `###2134`) work correctly. See https://community.openproject.org/work_packages/47084 for context.



## Development

- Run `npm run watch`

Now the webpack development mode is building the files and outputting them to `app/assets/javascripts/vendor/ckeditor/*`, overriding anything in there.



