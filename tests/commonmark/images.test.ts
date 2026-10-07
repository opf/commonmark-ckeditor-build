/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import {testDataProcessor} from './_utils/utils.js';

describe('CommonMarkProcessor', () => {
	describe('images', () => {
		it('should process images', () => {
			testDataProcessor(
				'![alt text](http://example.com/image.png "title text")',

				// GitHub is rendering as:
				// <p><a href="..." target="_blank"><img src="..." alt="..." title="..." data-canonical-src="..."></a></p>
				// We will handle images separately by features.
				'<p><img alt="alt text" src="http://example.com/image.png" title="title text"></img></p>',
				// we are NOT converting back to markdown, but use HTML for images
				'<img src="http://example.com/image.png" alt="alt text" title="title text">'
			);
		});

		it('should process images without title', () => {
			testDataProcessor(
				'![alt text](http://example.com/image.png)',
				'<p><img alt="alt text" src="http://example.com/image.png"></img></p>',
				// we are NOT converting back to markdown, but use HTML for images
				'<img src="http://example.com/image.png" alt="alt text">'
			);
		});

		it('should process images without alt text', () => {
			testDataProcessor(
				'![](http://example.com/image.png "title text")',
				'<p><img alt="" src="http://example.com/image.png" title="title text"></img></p>',
				// we are NOT converting back to markdown, but use HTML for images
				'<img src="http://example.com/image.png" alt="" title="title text">'
			);
		});

		it('should process referenced images', () => {
			testDataProcessor(
				'![alt text][logo]\n\n' +
				'[logo]: http://example.com/image.png "title text"',

				'<p><img alt="alt text" src="http://example.com/image.png" title="title text"></img></p>',

				// we are NOT converting back to markdown, but use HTML for images
				// Referenced images when converting back are converted to direct links.
				'<img src="http://example.com/image.png" alt="alt text" title="title text">'
			);
		});

		it('should process referenced images without title', () => {
			testDataProcessor(
				'![alt text][logo]\n\n' +
				'[logo]: http://example.com/image.png',

				'<p><img alt="alt text" src="http://example.com/image.png"></img></p>',

				// we are NOT converting back to markdown, but use HTML for images
				// Referenced images when converting back are converted to direct links.
				'<img src="http://example.com/image.png" alt="alt text">'
			);
		});

		it('should process referenced images without alt text', () => {
			testDataProcessor(
				'![][logo]\n\n' +
				'[logo]: http://example.com/image.png "title text"',

				'<p><img alt="" src="http://example.com/image.png" title="title text"></img></p>',

				// we are NOT converting back to markdown, but use HTML for images
				// Referenced images when converting back are converted to direct links.
				'<img src="http://example.com/image.png" alt="" title="title text">'
			);
		});
	});
});
