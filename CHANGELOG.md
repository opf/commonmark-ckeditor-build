# Changelog

## [Unreleased]

### Changed

- Removed jQuery dependency from the CKEditor build. All jQuery usage has been replaced with vanilla JavaScript equivalents:
  - `jQuery.each()` replaced with native `Array.forEach()`
  - `jQuery.getJSON()` replaced with `fetch()` API
  - `jQuery.ajax()` replaced with `fetch()` API
  - jQuery DOM manipulation replaced with native DOM APIs (`document.createElement()`, `element.parentElement`, `element.style`, etc.)

### Migration Notes

This library no longer uses jQuery internally. However, downstream consumers (such as OpenProject) should keep the jQuery global available for other parts of the application until they are ready to remove it. This change only affects the internal implementation of this library and should not require changes in consuming applications.

For more context, see the related OpenProject pull request: https://github.com/opf/openproject/pull/19429
