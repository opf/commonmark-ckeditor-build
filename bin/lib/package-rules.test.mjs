/* eslint-env node */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REQUIRED_FILES, consumerSafetyProblems, missingRequiredFiles } from './package-rules.mjs';

const files = ['package.json', 'README.md', 'dist/ckeditor.js'];

test('accepts a manifest that runs nothing on install', () => {
  assert.deepEqual(consumerSafetyProblems({ scripts: { build: 'x' } }, files), []);
});

test('rejects install scripts', () => {
  for (const script of ['preinstall', 'install', 'postinstall']) {
    assert.equal(consumerSafetyProblems({ scripts: { [script]: 'x' } }, files).length, 1, script);
  }
});

test('rejects runtime dependencies of any kind', () => {
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    assert.equal(consumerSafetyProblems({ [field]: { evil: '1' } }, files).length, 1, field);
  }
  assert.equal(consumerSafetyProblems({ bundleDependencies: ['evil'] }, files).length, 1);
});

// A binding.gyp at the root makes npm run `node-gyp rebuild` on install.
test('rejects files outside dist other than the package metadata', () => {
  assert.equal(consumerSafetyProblems({}, [...files, 'binding.gyp']).length, 1);
  assert.equal(consumerSafetyProblems({}, [...files, '.npmrc']).length, 1);
});

// npm links declared commands into node_modules/.bin, ahead of PATH in
// the consumer's scripts.
test('rejects commands the package would install', () => {
  assert.equal(consumerSafetyProblems({ bin: { tsc: 'dist/ckeditor.js' } }, files).length, 1);
  assert.equal(consumerSafetyProblems({ bin: 'dist/ckeditor.js' }, files).length, 1);
  assert.equal(consumerSafetyProblems({ directories: { bin: 'dist' } }, files).length, 1);
});

test('missingRequiredFiles names each absent entry point', () => {
  assert.deepEqual(missingRequiredFiles(REQUIRED_FILES), []);
  assert.deepEqual(missingRequiredFiles(REQUIRED_FILES.filter((file) => file !== 'dist/ckeditor.css')), ['dist/ckeditor.css']);
});
