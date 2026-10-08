#!/usr/bin/env node
/* eslint-env node */

// Asserts what `npm publish` would upload, and that installing the
// package runs none of our scripts on the consumer's machine.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { rootDir } from './lib/paths.mjs';

const REQUIRED = [
  'package.json',
  'dist/ckeditor.js',
  'dist/ckeditor.js.map',
  'dist/ckeditor.d.ts',
  'dist/ckeditor.css',
  'dist/translations/index.js',
  'dist/translations/index.d.ts',
  'dist/translations/de.js',
];
const ALLOWED_OUTSIDE_DIST = /^(package\.json|README\.md|LICENSE\.md|CHANGELOG\.md)$/;
// npm runs these on the consumer's machine.
const CONSUMER_SCRIPTS = ['preinstall', 'install', 'postinstall'];

const failures = [];

const packOutput = execFileSync(
  'npm',
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
);
const files = JSON.parse(packOutput)[0].files.map((file) => file.path);

for (const file of REQUIRED) {
  if (!files.includes(file)) {
    failures.push(`tarball lacks ${file}`);
  }
}
for (const file of files) {
  if (!file.startsWith('dist/') && !ALLOWED_OUTSIDE_DIST.test(file)) {
    failures.push(`tarball contains unexpected file ${file}`);
  }
}

const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));

for (const script of CONSUMER_SCRIPTS) {
  if (manifest.scripts?.[script]) {
    failures.push(`package.json has a "${script}" script, which would run in the consumer's install`);
  }
}
if (Object.keys(manifest.dependencies ?? {}).length > 0) {
  failures.push('package.json has runtime dependencies, but the bundle is self-contained');
}

if (failures.length > 0) {
  console.error('Package is not publishable:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Package OK (${files.length} files)`);
