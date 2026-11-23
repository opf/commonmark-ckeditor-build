#!/usr/bin/env node
/* eslint-env node */

// Usage: verify-tarball.mjs --canary <head-sha> <artifact-dir> <work-dir>
//
// Turns the tarball a pull request's canary build uploaded into one that
// release.yml may publish. The upload is untrusted and is never published
// as is: its files are read strictly, checked, written to
// <work-dir>/package, and packed again by npm. npm then reads exactly the
// manifest checked here. On success prints `tarball=`, `version=` and
// `integrity=` lines for $GITHUB_OUTPUT.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { consumerSafetyProblems, missingRequiredFiles } from './lib/package-rules.mjs';
import { canaryVersion, integrityOf, manifestProblems } from './lib/publish.mjs';
import { readTarball } from './lib/tarball.mjs';

const USAGE = 'usage: verify-tarball.mjs --canary <head-sha> <artifact-dir> <work-dir>';
const [mode, expected, artifactDir, workDir] = process.argv.slice(2);

function fail(message) {
  console.error(`Refusing to publish: ${message}`);
  process.exit(1);
}

const expectedVersion = { '--canary': canaryVersion }[mode]?.(expected ?? '');

if (expectedVersion === undefined || !artifactDir || !workDir) {
  fail(USAGE);
}

function check(manifest, files) {
  const problems = [...manifestProblems(manifest, expectedVersion), ...consumerSafetyProblems(manifest, files)];

  if (problems.length > 0) {
    fail(problems.join('; '));
  }
}

const entries = await fs.readdir(artifactDir);

if (entries.length !== 1 || !entries[0].endsWith('.tgz')) {
  fail(`expected exactly one .tgz in ${artifactDir}, found ${JSON.stringify(entries)}`);
}

let files;

try {
  files = readTarball(await fs.readFile(path.join(artifactDir, entries[0])));
} catch (error) {
  fail(error.message);
}

const packageDir = path.resolve(workDir, 'package');
const outDir = path.resolve(workDir, 'out');

await fs.mkdir(outDir, { recursive: true });
for (const file of files) {
  const target = path.join(packageDir, file.path);

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.data, { flag: 'wx' });
}

let manifest;

try {
  manifest = JSON.parse(await fs.readFile(path.join(packageDir, 'package.json'), 'utf8'));
} catch (error) {
  fail(`cannot read package.json: ${error.message}`);
}

check(manifest, files.map((file) => file.path));

// Run from the empty work directory, so no project .npmrc applies.
const packed = JSON.parse(execFileSync(
  'npm',
  ['pack', packageDir, '--ignore-scripts', '--json', '--pack-destination', outDir],
  { cwd: workDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
))[0];
const packedFiles = packed.files.map((file) => file.path);

// What npm will publish: the same checks on its own view of the package.
check({ ...manifest, name: packed.name, version: packed.version }, packedFiles);

const missing = missingRequiredFiles(packedFiles);

if (missing.length > 0) {
  fail(`the repack lacks ${missing.join(', ')}`);
}

const tarball = path.join(outDir, packed.filename);

console.log(`tarball=${tarball}`);
console.log(`version=${packed.version}`);
console.log(`integrity=${integrityOf(await fs.readFile(tarball))}`);
