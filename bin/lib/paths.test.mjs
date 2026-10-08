/* eslint-env node */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { coreMirrorDir, mirrorToCore, packageName } from './paths.mjs';

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'op-ckeditor-'));
}

test('coreMirrorDir is null without OPENPROJECT_CORE', () => {
  assert.equal(coreMirrorDir({}), null);
});

test('coreMirrorDir points into core node_modules', () => {
  assert.equal(
    coreMirrorDir({ OPENPROJECT_CORE: '/core' }),
    path.resolve('/core', 'frontend', 'node_modules', packageName, 'dist'),
  );
});

test('mirrorToCore does nothing without OPENPROJECT_CORE', async () => {
  const from = await tempDir();

  assert.equal(await mirrorToCore({ from, env: {} }), 'no-core');
});

test('mirrorToCore skips a core that has not installed the package', async () => {
  const from = await tempDir();
  const core = await tempDir();

  assert.equal(await mirrorToCore({ from, env: { OPENPROJECT_CORE: core } }), 'not-installed');
  // It must not create the package directory as a side effect.
  await assert.rejects(fs.access(path.join(core, 'frontend')));
});

test('mirrorToCore copies the build into an installed package', async () => {
  const from = await tempDir();
  const core = await tempDir();
  const installed = path.join(core, 'frontend', 'node_modules', packageName);

  await fs.mkdir(path.join(from, 'translations'), { recursive: true });
  await fs.writeFile(path.join(from, 'ckeditor.js'), 'new build');
  await fs.writeFile(path.join(from, 'translations', 'de.js'), 'de');
  await fs.mkdir(path.join(installed, 'dist'), { recursive: true });
  await fs.writeFile(path.join(installed, 'dist', 'ckeditor.js'), 'pinned build');

  assert.equal(await mirrorToCore({ from, env: { OPENPROJECT_CORE: core } }), 'copied');
  assert.equal(await fs.readFile(path.join(installed, 'dist', 'ckeditor.js'), 'utf8'), 'new build');
  assert.equal(await fs.readFile(path.join(installed, 'dist', 'translations', 'de.js'), 'utf8'), 'de');
});
