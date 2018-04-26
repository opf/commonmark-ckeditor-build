#!/usr/bin/env bash

: ${OPENPROJECT_CORE?"Need to set OPENPROJECT_CORE"}

echo "Replacing current vendored build...\n"
cp build/ckeditor.js "${OPENPROJECT_CORE}/app/assets/javascripts/vendor/ckeditor/ckeditor.js"
cp build/ckeditor.js.map "${OPENPROJECT_CORE}/app/assets/javascripts/vendor/ckeditor/ckeditor.js.map"


