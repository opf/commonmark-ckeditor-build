/* eslint-env node */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import zlib from 'node:zlib';

import { readTarball } from './tarball.mjs';

// A minimal ustar writer, enough to build hostile archives.
function header(name, { type = '0', size = 0, prefix = '' } = {}) {
  const block = Buffer.alloc(512);

  block.write(name, 0, 100, 'utf8');
  block.write('0000644\0', 100);
  block.write('0000000\0', 108);
  block.write('0000000\0', 116);
  block.write(`${size.toString(8).padStart(11, '0')}\0`, 124);
  block.write('00000000000\0', 136);
  block.write(type, 156);
  block.write('ustar\0', 257);
  block.write('00', 263);
  block.write(prefix, 345, 155, 'utf8');
  block.fill(' ', 148, 156);

  let sum = 0;

  for (const byte of block) {
    sum += byte;
  }
  block.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148);

  return block;
}

function tarball(entries) {
  const blocks = [];

  for (const { name, type, data = '', prefix } of entries) {
    const bytes = Buffer.from(data);

    blocks.push(header(name, { type, size: bytes.length, prefix }));
    if (bytes.length > 0) {
      blocks.push(bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512));
    }
  }
  blocks.push(Buffer.alloc(1024));

  return zlib.gzipSync(Buffer.concat(blocks));
}

test('reads files under package/ with the prefix stripped', () => {
  const files = readTarball(tarball([
    { name: 'package/package.json', data: '{"name":"x"}' },
    { name: 'package/dist', type: '5' },
    { name: 'package/dist/a.js', data: 'a' },
  ]));

  assert.deepEqual(files.map((file) => [file.path, file.data.toString()]), [
    ['package.json', '{"name":"x"}'],
    ['dist/a.js', 'a'],
  ]);
});

test('joins the ustar prefix field', () => {
  const files = readTarball(tarball([{ name: 'a.js', prefix: 'package/dist', data: 'a' }]));

  assert.equal(files[0].path, 'dist/a.js');
});

// npm strips the first path component whatever it is called, so another
// top-level directory could supply the manifest npm reads.
test('rejects entries outside package/', () => {
  assert.throws(() => readTarball(tarball([{ name: 'other/package.json', data: '{}' }])), /outside package/);
});

test('rejects two entries for the same path', () => {
  assert.throws(() => readTarball(tarball([
    { name: 'package/package.json', data: '{}' },
    { name: 'package//package.json', data: '{}' },
  ])), /not canonical/);
  assert.throws(() => readTarball(tarball([
    { name: 'package/package.json', data: '{}' },
    { name: 'package/package.json', data: '{}' },
  ])), /twice/);
});

test('rejects dot segments and absolute paths', () => {
  assert.throws(() => readTarball(tarball([{ name: 'package/../package.json', data: '{}' }])), /not canonical/);
  assert.throws(() => readTarball(tarball([{ name: 'package/./package.json', data: '{}' }])), /not canonical/);
  assert.throws(() => readTarball(tarball([{ name: '/package/package.json', data: '{}' }])), /outside package/);
});

test('rejects links, pax headers and other entry types', () => {
  for (const type of ['1', '2', 'x', 'g', 'L', '3', '6']) {
    assert.throws(() => readTarball(tarball([{ name: 'package/package.json', type }])), /entry type/, `type ${type}`);
  }
});
