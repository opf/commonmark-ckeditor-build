/* eslint-env node */

import zlib from 'node:zlib';

const BLOCK = 512;
// A canary is a few megabytes; refuse anything that inflates far beyond.
const MAX_SIZE = 200 * 1024 * 1024;

function field(block, offset, length) {
  const raw = block.subarray(offset, offset + length);
  const end = raw.indexOf(0);

  return raw.subarray(0, end === -1 ? length : end).toString('utf8');
}

function octal(block, offset, length) {
  const text = field(block, offset, length).trim();

  if (!/^[0-7]+$/.test(text)) {
    throw new Error(`invalid number ${JSON.stringify(text)} in tar header`);
  }

  return parseInt(text, 8);
}

/**
 * Reads an npm package tarball that came from an untrusted build and
 * returns its regular files, with the leading `package/` removed.
 *
 * npm strips the first path component of every entry, whatever it is
 * called, so an archive could hold two entries that both become
 * package.json. This reader fails closed instead: every entry must be a
 * plain file or directory under `package/`, with a canonical path that
 * occurs once. Long-name and pax headers are rejected rather than
 * interpreted, since npm pack writes none for this package's short paths.
 */
export function readTarball(gzipped) {
  const archive = zlib.gunzipSync(gzipped, { maxOutputLength: MAX_SIZE });
  const files = [];
  const seen = new Set();
  let offset = 0;

  while (offset + BLOCK <= archive.length) {
    const block = archive.subarray(offset, offset + BLOCK);

    if (block.every((byte) => byte === 0)) {
      break;
    }
    if (field(block, 257, 6) !== 'ustar') {
      throw new Error('not a ustar archive');
    }

    const prefix = field(block, 345, 155);
    const name = prefix ? `${prefix}/${field(block, 0, 100)}` : field(block, 0, 100);
    const type = String.fromCharCode(block[156] || 48);
    const size = octal(block, 124, 12);

    if (type !== '0' && type !== '5') {
      throw new Error(`${JSON.stringify(name)} has entry type ${JSON.stringify(type)}; only files and directories are allowed`);
    }
    if (!name.startsWith('package/')) {
      throw new Error(`${JSON.stringify(name)} is outside package/`);
    }

    const relative = name.slice('package/'.length).replace(/\/$/, '');
    const segments = relative.split('/');

    if (relative && segments.some((segment) => segment === '' || segment === '.' || segment === '..' || segment.includes('\\'))) {
      throw new Error(`${JSON.stringify(name)} is not canonical`);
    }

    const dataStart = offset + BLOCK;
    const dataEnd = dataStart + size;

    if (dataEnd > archive.length) {
      throw new Error(`${JSON.stringify(name)} is truncated`);
    }

    if (type === '0') {
      if (!relative) {
        throw new Error(`${JSON.stringify(name)} is not canonical`);
      }
      if (seen.has(relative)) {
        throw new Error(`${JSON.stringify(name)} occurs twice`);
      }
      seen.add(relative);
      files.push({ path: relative, data: archive.subarray(dataStart, dataEnd) });
    }

    offset = dataStart + Math.ceil(size / BLOCK) * BLOCK;
  }

  return files;
}
