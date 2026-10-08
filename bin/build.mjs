#!/usr/bin/env node
/* eslint-env node */

// Bundles the editor. Pass --watch to rebuild on change.

import fs from 'node:fs/promises';
import path from 'node:path';
import * as esbuild from 'esbuild';

const core = process.env.OPENPROJECT_CORE;

if (!core) {
  throw new Error("Expected OPENPROJECT_CORE to be present, but wasn't.");
}

const root = path.resolve(import.meta.dirname, '..');
const outdir = path.resolve(core, 'frontend', 'src', 'vendor', 'ckeditor');
const production = process.env.NODE_ENV === 'production';
const watch = process.argv.includes('--watch');

const banner = `/*!
 * @license Copyright (c) 2003-${new Date().getFullYear()}, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */`;

// Dependencies ship source maps that point at their own sources. Following
// them doubles the size of our source map, so map to the files we bundle.
const ignoreDependencySourceMaps = {
  name: 'ignore-dependency-source-maps',
  setup(build) {
    build.onLoad({ filter: /[\\/]node_modules[\\/].*\.js$/ }, async (args) => {
      const contents = await fs.readFile(args.path, 'utf8');

      return { contents: contents.replace(/^\/\/# sourceMappingURL=.*$/gm, ''), loader: 'js' };
    });
  },
};

const options = {
  entryPoints: [path.join(root, 'src', 'op-ckeditor.ts')],
  outfile: path.join(outdir, 'ckeditor.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: production,
  sourcemap: true,
  // Keep the licence comments of bundled dependencies where they are.
  legalComments: 'inline',
  // Icons are imported as strings and inlined into templates.
  loader: { '.svg': 'text' },
  banner: { js: banner },
  logLevel: 'info',
  plugins: [ignoreDependencySourceMaps],
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
