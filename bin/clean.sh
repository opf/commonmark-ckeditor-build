#!/usr/bin/env bash

: ${OPENPROJECT_CORE?"Need to set OPENPROJECT_CORE"}
BUILD_FOLDER=$(realpath -s "${OPENPROJECT_CORE}/frontend/src/vendor/ckeditor/")

echo "Clearing current build folder ${BUILD_FOLDER}"
rm -rf "${BUILD_FOLDER}/ckeditor.*" || true
rm -rf "${BUILD_FOLDER}/translations/" || true
