#!/usr/bin/env bash

echo "Building 'build/op-ckeditor.js'..."
echo ""

NODE_ENV=production webpack

echo ""
echo "Done."
