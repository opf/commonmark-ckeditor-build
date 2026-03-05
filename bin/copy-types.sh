#!/usr/bin/env bash

set -eu

: ${OPENPROJECT_CORE?"Need to set OPENPROJECT_CORE"}

BUILD_FOLDER=$(realpath "${OPENPROJECT_CORE}/frontend/src/vendor/ckeditor/")
TYPES_FOLDER="build/types"

if [ ! -f "${TYPES_FOLDER}/ckeditor-types.d.ts" ]; then
  echo "Missing generated type file: ${TYPES_FOLDER}/ckeditor-types.d.ts"
  exit 1
fi

cp "${TYPES_FOLDER}/ckeditor-types.d.ts" "${BUILD_FOLDER}/types.d.ts"
cp "${TYPES_FOLDER}/op-ckeditor.d.ts" "${BUILD_FOLDER}/op-ckeditor.d.ts"
