/* eslint-env node */

import crypto from 'node:crypto';

import { packageName } from './paths.mjs';

/** The only version a canary of commit `headSha` may carry, or null. */
export function canaryVersion(headSha) {
  return /^[0-9a-f]{40}$/.test(headSha) ? new RegExp(`^0\\.0\\.0-canary-\\d{14}-${headSha}$`) : null;
}

/**
 * Lists why a tarball's manifest must not be published, or returns an
 * empty list. The tarball comes from a pull request build, so it is
 * untrusted: only this package, only the expected version, and no
 * publishConfig that could change the dist-tag or registry.
 */
export function manifestProblems(manifest, expectedVersion) {
  const problems = [];

  if (manifest.name !== packageName) {
    problems.push(`name is ${JSON.stringify(manifest.name)}, expected ${packageName}`);
  }

  if (!expectedVersion || !expectedVersion.test(String(manifest.version))) {
    problems.push(`version ${JSON.stringify(manifest.version)} is not the expected one (${expectedVersion ?? 'none valid'})`);
  }

  const extraKeys = Object.keys(manifest.publishConfig ?? {}).filter((key) => key !== 'access');

  if (extraKeys.length > 0) {
    problems.push(`publishConfig sets ${extraKeys.join(', ')}`);
  }

  return problems;
}

/** The npm `dist.integrity` value for a tarball's bytes. */
export function integrityOf(bytes) {
  return `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
}
