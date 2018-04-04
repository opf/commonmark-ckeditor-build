# OpenProject CKEditor5 build repository

This repository acts as a separated source for the custom CKEditor5 builds referenced in OpenProject.


[https://github.com/opf/openproject](https://github.com/opf/openproject)

[https://github.com/ckeditor/ckeditor5](https://github.com/ckeditor/ckeditor5)


## Development

1. Link the package

```
# In this repository's root (commonmark-ckeditor-build)
npm link
```

2. Reference the link in OpenProject

```
cd <path to OpenProject>/frontend
npm link @openproject/commonmark-ckeditor-build
```


If you also need to work on some of the packaged plugins, such as GFM:

```
cd <path to local @ckeditor/ckeditor5-gfm-markdown
npm link

cd <path to local @openproject/commonmark-ckeditor-build>
npm link @ckeditor/ckeditor5-gfm-markdown
```


## Build webpack dist

```
npm run webpack
```