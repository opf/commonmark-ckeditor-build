/* eslint-env node */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

import { rootDir } from './paths.mjs';

// changesets/action v1 only drives the changesets CLI v2. From CLI v3 on it
// needs action v2, whose inputs are named differently.
test('the release workflow uses a changesets action that matches the installed CLI', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  const workflow = await fs.readFile(path.join(rootDir, '.github', 'workflows', 'release.yml'), 'utf8');

  const cliMajor = Number(manifest.devDependencies['@changesets/cli'].match(/\d+/)[0]);
  const action = workflow.match(/uses: changesets\/action@[0-9a-f]{40} # v(\d+)/);

  assert.ok(action, 'changesets/action must be pinned by commit SHA with a "# v<version>" comment');

  const actionMajor = Number(action[1]);

  if (cliMajor >= 3) {
    assert.ok(actionMajor >= 2, `CLI v${cliMajor} needs changesets/action v2 or later, found v${actionMajor}`);
    assert.match(workflow, /^\s+version-script: /m);
    assert.match(workflow, /^\s+publish-script: /m);
  } else {
    assert.equal(actionMajor, 1, `CLI v${cliMajor} needs changesets/action v1, found v${actionMajor}`);
  }
});
