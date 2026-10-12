/* eslint-env node */

import fs from 'node:fs/promises';
import path from 'node:path';

export const packageName = '@openproject/commonmark-ckeditor-build';
export const rootDir = path.resolve(import.meta.dirname, '..', '..');
export const distDir = path.join(rootDir, 'dist');

/**
 * Where this package's build lives inside a core checkout, or null when
 * OPENPROJECT_CORE is not set.
 */
export function coreMirrorDir(env = process.env) {
  const core = env.OPENPROJECT_CORE;

  if (!core) {
    return null;
  }

  return path.resolve(core, 'frontend', 'node_modules', packageName, 'dist');
}

/**
 * Copies the build over the copy core installed from npm, so that a local
 * build shows up in a running core. The next `npm ci` in core undoes it.
 */
export async function mirrorToCore({ from = distDir, env = process.env } = {}) {
  const target = coreMirrorDir(env);

  if (!target) {
    return 'no-core';
  }

  try {
    await fs.access(path.dirname(target));
  } catch {
    return 'not-installed';
  }

  await fs.cp(from, target, { recursive: true });

  return 'copied';
}
