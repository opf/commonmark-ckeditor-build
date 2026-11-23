/* eslint-env node */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

import { parse } from 'yaml';

import { rootDir } from './paths.mjs';

// The changesets CLI v3 needs changesets/action v2, whose select-mode,
// version, pack and publish sub-actions the release jobs use.
test('the release workflow uses changesets sub-actions that match the installed CLI', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  const workflow = await fs.readFile(path.join(rootDir, '.github', 'workflows', 'release.yml'), 'utf8');
  const cliMajor = Number(manifest.devDependencies['@changesets/cli'].match(/\d+/)[0]);

  for (const subAction of ['select-mode', 'version', 'pack', 'publish']) {
    // The commit SHA lives in .github/workflows/actions.lock.
    const action = workflow.match(new RegExp(`uses: changesets/action/${subAction}@v(\\d+)\\.\\d+\\.\\d+\\s`));

    assert.ok(action, `changesets/action/${subAction} must be pinned to a full version tag`);
    if (cliMajor >= 3) {
      assert.ok(Number(action[1]) >= 2, `CLI v${cliMajor} needs changesets/action v2 or later`);
    }
  }
});

async function workflows() {
  const dir = path.join(rootDir, '.github', 'workflows');
  const files = (await fs.readdir(dir)).filter((file) => /\.ya?ml$/.test(file));

  return Promise.all(files.map(async (file) => ({
    file,
    workflow: parse(await fs.readFile(path.join(dir, file), 'utf8')),
  })));
}

function triggers(workflow) {
  const on = workflow.on;

  return typeof on === 'string' ? [on] : Array.isArray(on) ? on : Object.keys(on ?? {});
}

function grantsIdToken(permissions) {
  return permissions === 'write-all' || permissions?.['id-token'] === 'write';
}

// npm trusts release.yml by name. Pull request code must never run with an
// npm identity, or any branch could publish anything.
test('no workflow triggered by a pull request can mint an npm identity', async () => {
  for (const { file, workflow } of await workflows()) {
    if (!triggers(workflow).some((trigger) => trigger.startsWith('pull_request'))) {
      continue;
    }

    assert.ok(!grantsIdToken(workflow.permissions), `${file} grants id-token: write at the top level`);

    for (const [id, job] of Object.entries(workflow.jobs)) {
      assert.ok(!grantsIdToken(job.permissions), `${file} job ${id} grants id-token: write`);
    }
  }
});

// The `npm` environment only admits master, and npm's trusted publisher is
// bound to it.
test('every job with an npm identity runs in the npm environment', async () => {
  for (const { file, workflow } of await workflows()) {
    assert.ok(!grantsIdToken(workflow.permissions), `${file} grants id-token: write at the top level`);

    for (const [id, job] of Object.entries(workflow.jobs)) {
      if (grantsIdToken(job.permissions)) {
        const environment = typeof job.environment === 'string' ? job.environment : job.environment?.name;

        assert.equal(environment, 'npm', `${file} job ${id} grants id-token: write outside the npm environment`);
      }
    }
  }
});

// Install scripts and builds run whatever the dependency tree ships. A job
// holding an npm identity must run none of it.
test('no job with an npm identity installs or runs package code', async () => {
  // npm ci --ignore-scripts only installs files, such as the changesets CLI.
  const installsOrRuns = /\bnpm\s+(ci|install|i)\b(?![^\n]*--ignore-scripts)|\bnpm\s+(run|run-script|exec|test|rebuild)\b|\bnpx\b|\byarn\b|\bpnpm\b/;

  for (const { file, workflow } of await workflows()) {
    for (const [id, job] of Object.entries(workflow.jobs)) {
      if (!grantsIdToken(job.permissions)) {
        continue;
      }

      for (const step of job.steps ?? []) {
        assert.ok(!installsOrRuns.test(step.run ?? ''), `${file} job ${id} runs ${JSON.stringify(step.run)}`);
      }
    }
  }
});

// An explicit `--tag latest` bypasses npm's guard against moving latest
// back to an older version.
test('no workflow publishes with an explicit latest tag', async () => {
  for (const { file, workflow } of await workflows()) {
    for (const [id, job] of Object.entries(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        assert.doesNotMatch(step.run ?? '', /--tag\s+latest\b/, `${file} job ${id}`);
      }
    }
  }
});
