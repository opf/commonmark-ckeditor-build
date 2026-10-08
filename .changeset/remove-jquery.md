---
"@openproject/commonmark-ckeditor-build": major
---

jQuery is no longer used. `jQuery.each()`, `jQuery.getJSON()`, `jQuery.ajax()` and jQuery DOM manipulation were replaced with native APIs and Request.JS. Applications that expose a jQuery global for other code should keep doing so. See https://github.com/opf/openproject/pull/19429.
