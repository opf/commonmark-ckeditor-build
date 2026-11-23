/* eslint-env node */

// What a published tarball may contain so that installing it runs nothing
// on the consumer's machine. Shared by verify-package (the local build)
// and verify-tarball (an untrusted pull request build).

// The entry points the exports map and core rely on.
export const REQUIRED_FILES = [
  'package.json',
  'dist/ckeditor.js',
  'dist/ckeditor.js.map',
  'dist/ckeditor.d.ts',
  'dist/ckeditor.css',
  'dist/translations/index.js',
  'dist/translations/index.d.ts',
  'dist/translations/de.js',
];
export const ALLOWED_OUTSIDE_DIST = /^(package\.json|README\.md|LICENSE\.md|CHANGELOG\.md)$/;
// npm runs these on the consumer's machine.
export const CONSUMER_SCRIPTS = ['preinstall', 'install', 'postinstall'];
// The bundle is self-contained; npm would install any of these.
const DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies', 'bundleDependencies', 'bundledDependencies'];

export function consumerSafetyProblems(manifest, files) {
  const problems = [];

  for (const file of files) {
    // A root binding.gyp, for one, makes npm run `node-gyp rebuild`.
    if (!file.startsWith('dist/') && !ALLOWED_OUTSIDE_DIST.test(file)) {
      problems.push(`tarball contains unexpected file ${file}`);
    }
  }

  for (const script of CONSUMER_SCRIPTS) {
    if (manifest.scripts?.[script]) {
      problems.push(`package.json has a "${script}" script, which would run in the consumer's install`);
    }
  }

  // npm links these into node_modules/.bin, ahead of PATH in the
  // consumer's own scripts.
  if (manifest.bin || manifest.directories?.bin) {
    problems.push('package.json declares commands (bin), which npm would install for the consumer');
  }

  for (const field of DEPENDENCY_FIELDS) {
    const value = manifest[field];

    if (value && (Array.isArray(value) ? value.length : Object.keys(value).length) > 0) {
      problems.push(`package.json has ${field}, but the bundle is self-contained`);
    }
  }

  return problems;
}

export function missingRequiredFiles(files) {
  return REQUIRED_FILES.filter((file) => !files.includes(file));
}
