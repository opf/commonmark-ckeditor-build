#!/usr/bin/env node
/* eslint-env node */

import { coreMirrorDir, mirrorToCore } from './lib/paths.mjs';

const result = await mirrorToCore();

if (result === 'copied') {
  console.log(`Copied build to ${coreMirrorDir()}`);
} else if (result === 'not-installed') {
  console.warn(
    `OPENPROJECT_CORE is set, but the package is not installed there (${coreMirrorDir()}). ` +
    'Run npm install in core\'s frontend first. Nothing copied.',
  );
}
