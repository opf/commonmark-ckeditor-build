/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import {testDataProcessor} from './_utils/utils.js';

describe('CommonMarkProcessor', () => {
	describe('Strikethrough', () => {
		it('should process strikethrough text', () => {
			testDataProcessor(
				'~deleted~',

				'<p>~deleted~</p>',

				'~deleted~',
			);
		});

		it('should process strikethrough inside text', () => {
			testDataProcessor(
				'This is ~deleted content~.',

				'<p>This is ~deleted content~.</p>',

				'This is ~deleted content~.',
			);
		});
	});
});
