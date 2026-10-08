#!/usr/bin/env node
/* eslint-env node */

// Bundles the editor into dist/. Pass --watch to rebuild on change.
// With OPENPROJECT_CORE set, watch mode also copies each build into that
// checkout's installed copy of this package.

import fs from 'node:fs/promises';
import path from 'node:path';
import * as esbuild from 'esbuild';

import { coreMirrorDir, distDir, mirrorToCore, rootDir } from './lib/paths.mjs';

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

const mirrorPlugin = {
  name: 'mirror-to-core',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) {
        return;
      }

      const outcome = await mirrorToCore();

      if (outcome === 'copied') {
        console.log(`Copied build to ${coreMirrorDir()}`);
      } else if (outcome === 'not-installed') {
        console.warn(`Package not installed in ${coreMirrorDir()}; nothing copied.`);
      }
    });
  },
};

const options = {
  entryPoints: [path.join(rootDir, 'src', 'op-ckeditor.ts')],
  outfile: path.join(distDir, 'ckeditor.js'),
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
  plugins: [ignoreDependencySourceMaps, ...(watch ? [mirrorPlugin] : [])],
};

await fs.mkdir(distDir, { recursive: true });
// The bundle is a side-effect module: it sets globals and exports nothing.
await fs.writeFile(path.join(distDir, 'ckeditor.d.ts'), 'export {};\n', 'utf8');

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
