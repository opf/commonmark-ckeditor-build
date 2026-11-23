/* eslint-env node */

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

import { renderTranslationsIndex, TRANSLATIONS_INDEX_DTS } from './translations-index.mjs';

// Writes an index for the given locales next to stub locale modules that
// record being loaded, and imports it.
async function importIndex(locales) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'op-ckeditor-i18n-'));

  await fs.writeFile(path.join(dir, 'package.json'), '{"type":"module"}');
  for (const locale of locales) {
    await fs.writeFile(
      path.join(dir, `${locale}.js`),
      `(globalThis.loadedLocales ||= []).push(${JSON.stringify(locale)});\n`,
    );
  }
  await fs.writeFile(path.join(dir, 'index.js'), renderTranslationsIndex(locales));

  return import(pathToFileURL(path.join(dir, 'index.js')).href);
}

test('loadTranslation loads only the requested locale', async () => {
  globalThis.loadedLocales = [];
  const { loadTranslation } = await importIndex(['de', 'fr', 'zh-cn']);

  await loadTranslation('zh-cn');

  assert.deepEqual(globalThis.loadedLocales, ['zh-cn']);
});

test('loadTranslation resolves with the locale it loaded', async () => {
  const { loadTranslation } = await importIndex(['de']);

  assert.equal(await loadTranslation('de'), 'de');
});

test('loadTranslation rejects for a locale without translation', async () => {
  const { loadTranslation } = await importIndex(['de']);

  await assert.rejects(loadTranslation('xx'), /No CKEditor translation for locale "xx"/);
});

test('loadTranslation falls back to the lower-cased locale', async () => {
  globalThis.loadedLocales = [];
  const { loadTranslation } = await importIndex(['zh', 'zh-cn']);

  // Core says zh-CN; CKEditor names the file, and the dictionary, zh-cn.
  assert.equal(await loadTranslation('zh-CN'), 'zh-cn');
  assert.deepEqual(globalThis.loadedLocales, ['zh-cn']);
});

test('loadTranslation does not fall back to the bare language', async () => {
  const { loadTranslation } = await importIndex(['pt', 'pt-br']);

  await assert.rejects(loadTranslation('pt-PT'), /No CKEditor translation for locale "pt-PT"/);
});

test('loadTranslation ignores inherited object keys', async () => {
  const { loadTranslation } = await importIndex(['de']);

  await assert.rejects(loadTranslation('toString'), /No CKEditor translation for locale "toString"/);
});

test('the declaration names the same export', () => {
  assert.match(TRANSLATIONS_INDEX_DTS, /export declare function loadTranslation\(locale: string\): Promise<string>;/);
});

test('renderTranslationsIndex rejects a locale name that is not plain', () => {
  for (const locale of ['../de', 'de"; alert(1); "', 'de</script>', '']) {
    assert.throws(() => renderTranslationsIndex(['de', locale]), /Unexpected locale name/);
  }
});
