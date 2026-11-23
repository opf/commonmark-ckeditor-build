/* eslint-env node */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canaryVersion, integrityOf, manifestProblems } from './publish.mjs';
import { packageName } from './paths.mjs';

const sha = 'a'.repeat(40);
const canary = `0.0.0-canary-20261123120000-${sha}`;

function manifest(overrides = {}) {
  return { name: packageName, version: canary, publishConfig: { access: 'public' }, ...overrides };
}

test('accepts a canary manifest for the expected commit', () => {
  assert.deepEqual(manifestProblems(manifest(), canaryVersion(sha)), []);
});

test('rejects another package name', () => {
  assert.equal(manifestProblems(manifest({ name: 'evil' }), canaryVersion(sha)).length, 1);
});

test('a canary rejects a stable version', () => {
  assert.equal(manifestProblems(manifest({ version: '12.0.0' }), canaryVersion(sha)).length, 1);
});

test('a canary rejects one built from another commit', () => {
  const other = `0.0.0-canary-20261123120000-${'b'.repeat(40)}`;

  assert.equal(manifestProblems(manifest({ version: other }), canaryVersion(sha)).length, 1);
});

test('a canary rejects a malformed expected commit', () => {
  assert.equal(canaryVersion(''), null);
  assert.equal(manifestProblems(manifest(), canaryVersion('')).length, 1);
});

// publishConfig can redirect the dist-tag or the registry at publish time.
test('rejects publishConfig keys other than access', () => {
  assert.equal(manifestProblems(manifest({ publishConfig: { access: 'public', tag: 'latest' } }), canaryVersion(sha)).length, 1);
  assert.equal(manifestProblems(manifest({ publishConfig: { registry: 'https://evil.test/' } }), canaryVersion(sha)).length, 1);
});

test('accepts a manifest without publishConfig', () => {
  const bare = manifest();

  delete bare.publishConfig;

  assert.deepEqual(manifestProblems(bare, canaryVersion(sha)), []);
});

test('integrityOf matches the npm sha512 format', () => {
  // sha512 of the empty input.
  assert.equal(
    integrityOf(Buffer.alloc(0)),
    'sha512-z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==',
  );
});
