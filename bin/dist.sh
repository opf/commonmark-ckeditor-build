#!/usr/bin/env bash

: ${OPENPROJECT_CORE?"Need to set OPENPROJECT_CORE"}

echo "Replacing current vendored build...\n"
# Unlink previous symlinks or files if any
unlink "${OPENPROJECT_CORE}/frontend/src/vendor/ckeditor/ckeditor.js" || true
unlink "${OPENPROJECT_CORE}/frontend/src/vendor/ckeditor/ckeditor.js.map" || true

cp build/ckeditor.js "${OPENPROJECT_CORE}/frontend/src/vendor/ckeditor/ckeditor.js"
cp build/ckeditor.js.map "${OPENPROJECT_CORE}/frontend/src/vendor/ckeditor/ckeditor.js.map"


