# Changelog

## [Unreleased]

### Fixed

- Simple tables are saved as GFM pipe tables instead of HTML, so tables written in markdown survive switching to the WYSIWYG editor and back ([OP-17275](https://community.openproject.org/wp/OP-17275)). A table qualifies when it has one header row, no merged cells, only inline cell content, and no styling other than uniform column alignment. Every other table is still saved as HTML so no formatting is lost. New tables inserted from the toolbar now start with a header row.

### Changed

- Removed jQuery dependency from the CKEditor build. All jQuery usage has been replaced with vanilla JavaScript equivalents:
  - `jQuery.each()` replaced with native `Array.forEach()`
  - `jQuery.getJSON()` replaced with Request.JS
  - `jQuery.ajax()` replaced with Request.JS
  - jQuery DOM manipulation replaced with native DOM APIs (`document.createElement()`, `element.parentElement`, `element.style`, etc.)

### Migration Notes

This library no longer uses jQuery internally. However, downstream consumers (such as OpenProject) should keep the jQuery global available for other parts of the application until they are ready to remove it. This change only affects the internal implementation of this library and should not require changes in consuming applications.

For more context, see the related OpenProject pull request: https://github.com/opf/openproject/pull/19429
