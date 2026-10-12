# Changelog

## [Unreleased]

### Changed

- Upgraded CKEditor 5 to v49.0.0. See the [v49.0.0 update guide](https://ckeditor.com/docs/ckeditor5/latest/updating/guides/update-to-49.html).
- Removed the `window.OPEditorWatchdog` global, because CKEditor 5 v49 removes the Watchdog. Consumers create editors directly and observe errors with `onEditorError()`, which every editor class also has as a static method (for example `window.OPClassicEditor.onEditorError()`). After an error, the editor keeps running with its content instead of restarting.
- The generated `ckeditor.css` now ends with the CKEditor 5 legacy theme preset, so the editor keeps its look from before v49.
- Removed jQuery dependency from the CKEditor build. All jQuery usage has been replaced with vanilla JavaScript equivalents:
  - `jQuery.each()` replaced with native `Array.forEach()`
  - `jQuery.getJSON()` replaced with Request.JS
  - `jQuery.ajax()` replaced with Request.JS
  - jQuery DOM manipulation replaced with native DOM APIs (`document.createElement()`, `element.parentElement`, `element.style`, etc.)

### Migration Notes

This library no longer uses jQuery internally. However, downstream consumers (such as OpenProject) should keep the jQuery global available for other parts of the application until they are ready to remove it. This change only affects the internal implementation of this library and should not require changes in consuming applications.

For more context, see the related OpenProject pull request: https://github.com/opf/openproject/pull/19429
