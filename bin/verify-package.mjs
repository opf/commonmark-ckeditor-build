#!/usr/bin/env node
/* eslint-env node */

// Asserts what `npm publish` would upload, and that installing the
// package runs none of our scripts on the consumer's machine.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { consumerSafetyProblems, missingRequiredFiles } from './lib/package-rules.mjs';
import { rootDir } from './lib/paths.mjs';

const failures = [];

const packOutput = execFileSync(
  'npm',
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
);
const files = JSON.parse(packOutput)[0].files.map((file) => file.path);

for (const file of missingRequiredFiles(files)) {
  failures.push(`tarball lacks ${file}`);
}

const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));

failures.push(...consumerSafetyProblems(manifest, files));

if (failures.length > 0) {
  console.error('Package is not publishable:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`Package OK (${files.length} files)`);
