#!/usr/bin/env node
/* eslint-env node */

// Asserts that a directory holds a usable editor build.
// Usage: node bin/verify-build.mjs <build directory>

import fs from 'node:fs/promises';
import path from 'node:path';

// The webpack build was 1.3 MB. Fail well before a regression doubles it.
const MAX_BUNDLE_BYTES = 1_500_000;
// The webpack source map was 7.7 MB. It doubles when the bundler follows the
// source maps of dependencies back to their original sources.
const MAX_SOURCE_MAP_BYTES = 9_000_000;
const MIN_LOCALES = 50;

const dir = process.argv[2];

if (!dir) {
  console.error('Usage: node bin/verify-build.mjs <build directory>');
  process.exit(1);
}

const failures = [];

async function read(file) {
  try {
    return await fs.readFile(path.join(dir, file), 'utf8');
  } catch {
    failures.push(`${file} is missing`);
    return null;
  }
}

const bundle = await read('ckeditor.js');
const sourceMap = await read('ckeditor.js.map');
const css = await read('ckeditor.css');
await read('ckeditor.d.ts');

if (bundle !== null) {
  const bytes = Buffer.byteLength(bundle);

  if (bytes > MAX_BUNDLE_BYTES) {
    failures.push(`ckeditor.js is ${bytes} bytes, over the ${MAX_BUNDLE_BYTES} budget`);
  }
  if (!bundle.startsWith('/*!')) {
    failures.push('ckeditor.js does not start with the licence banner');
  }
  if (!bundle.includes('@license Copyright (c) 2003-')) {
    failures.push('ckeditor.js lacks the CKSource licence notice');
  }
  for (const global of ['OPClassicEditor', 'OPConstrainedEditor', 'OPEditorWatchdog']) {
    if (!bundle.includes(global)) {
      failures.push(`ckeditor.js never assigns window.${global}`);
    }
  }
}

if (sourceMap !== null) {
  const { sources } = JSON.parse(sourceMap);
  const bytes = Buffer.byteLength(sourceMap);

  if (bytes > MAX_SOURCE_MAP_BYTES) {
    failures.push(`ckeditor.js.map is ${bytes} bytes, over the ${MAX_SOURCE_MAP_BYTES} budget`);
  }

  if (!sources.some((source) => source.endsWith('src/op-ckeditor.ts'))) {
    failures.push('ckeditor.js.map does not map back to src/op-ckeditor.ts');
  }
}

if (css !== null && css.trim().length === 0) {
  failures.push('ckeditor.css is empty');
}

let locales = null;
try {
  locales = (await fs.readdir(path.join(dir, 'translations')))
    .filter((name) => /^[a-z-]+\.js$/.test(name) && name !== 'index.js');
} catch {
  failures.push('translations/ is missing');
}

if (locales !== null && locales.length < MIN_LOCALES) {
  failures.push(`translations/ holds ${locales.length} locales, expected at least ${MIN_LOCALES}`);
}
if (locales !== null && !locales.includes('de.js')) {
  failures.push('translations/de.js is missing');
}

if (failures.length > 0) {
  console.error(`Build in ${dir} is not usable:`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Build OK (${Buffer.byteLength(bundle)} bytes, ${locales.length} locales)`);
