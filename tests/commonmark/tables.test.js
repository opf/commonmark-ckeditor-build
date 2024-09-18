/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import {testDataProcessor} from './_utils/utils.js';

describe('CommonMarkProcessor', () => {
	describe('tables', () => {
		it('should process tables', () => {
			const htmlTable = '<table>' +
				'<thead>' +
				'<tr>' +
				'<th>Heading 1</th>' +
				'<th>Heading 2</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody>' +
				'<tr>' +
				'<td>Cell 1</td>' +
				'<td>Cell 2</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Cell 3</td>' +
				'<td>Cell 4</td>' +
				'</tr>' +
				'</tbody>' +
				'</table>';

			testDataProcessor(
				'| Heading 1 | Heading 2\n' +
				'| --- | ---\n' +
				'| Cell 1    | Cell 2\n' +
				'| Cell 3    | Cell 4\n',

				htmlTable,

				// We are NOT converting back to markdown, but use the HTML version in markdown
				htmlTable
			);
		});

		it('should process tables with aligned columns', () => {
			testDataProcessor(
				'| Header 1 | Header 2 | Header 3 | Header 4 |\n' +
				'| :------: | -------: | :------- | -------- |\n' +
				'| Cell 1   | Cell 2   | Cell 3   | Cell 4   |\n' +
				'| Cell 5   | Cell 6   | Cell 7   | Cell 8   |',

				'<table>' +
				'<thead>' +
				'<tr>' +
				'<th style="text-align:center">Header 1</th>' +
				'<th style="text-align:right">Header 2</th>' +
				'<th style="text-align:left">Header 3</th>' +
				'<th>Header 4</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody>' +
				'<tr>' +
				'<td style="text-align:center">Cell 1</td>' +
				'<td style="text-align:right">Cell 2</td>' +
				'<td style="text-align:left">Cell 3</td>' +
				'<td>Cell 4</td>' +
				'</tr>' +
				'<tr>' +
				'<td style="text-align:center">Cell 5</td>' +
				'<td style="text-align:right">Cell 6</td>' +
				'<td style="text-align:left">Cell 7</td>' +
				'<td>Cell 8</td>' +
				'</tr>' +
				'</tbody>' +
				'</table>',

				// We are NOT converting back to markdown, but use the HTML version in markdown
				'<table>' +
				'<thead>' +
				'<tr>' +
				'<th style="text-align:center;">Header 1</th>' +
				'<th style="text-align:right;">Header 2</th>' +
				'<th style="text-align:left;">Header 3</th>' +
				'<th>Header 4</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody>' +
				'<tr>' +
				'<td style="text-align:center;">Cell 1</td>' +
				'<td style="text-align:right;">Cell 2</td>' +
				'<td style="text-align:left;">Cell 3</td>' +
				'<td>Cell 4</td>' +
				'</tr>' +
				'<tr>' +
				'<td style="text-align:center;">Cell 5</td>' +
				'<td style="text-align:right;">Cell 6</td>' +
				'<td style="text-align:left;">Cell 7</td>' +
				'<td>Cell 8</td>' +
				'</tr>' +
				'</tbody>' +
				'</table>'
			);
		});

		it('should process not table without borders', () => {
			const htmlTable = '<table>' +
				'<thead>' +
				'<tr>' +
				'<th>Header 1</th>' +
				'<th>Header 2</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody>' +
				'<tr>' +
				'<td>Cell 1</td>' +
				'<td>Cell 2</td>' +
				'</tr>' +
				'<tr>' +
				'<td>Cell 3</td>' +
				'<td>Cell 4</td>' +
				'</tr>' +
				'</tbody>' +
				'</table>';

			testDataProcessor(
				'Header 1 | Header 2\n' +
				'-------- | --------\n' +
				'Cell 1   | Cell 2\n' +
				'Cell 3   | Cell 4',

				htmlTable,

				// We are NOT converting back to markdown, but use the HTML version in markdown
				htmlTable
			);
		});

		it('should process formatting inside cells', () => {
			testDataProcessor(
				'Header 1|Header 2|Header 3|Header 4\n' +
				':-------|:------:|-------:|--------\n' +
				'*Cell 1*  |**Cell 2**  |~Cell 3~  |Cell 4',

				'<table>' +
				'<thead>' +
				'<tr>' +
				'<th style="text-align:left">Header 1</th>' +
				'<th style="text-align:center">Header 2</th>' +
				'<th style="text-align:right">Header 3</th>' +
				'<th>Header 4</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody>' +
				'<tr>' +
				'<td style="text-align:left">' +
				'<em>Cell 1</em>' +
				'</td>' +
				'<td style="text-align:center">' +
				'<strong>Cell 2</strong>' +
				'</td>' +
				'<td style="text-align:right">' +
				'~Cell 3~' +
				'</td>' +
				'<td>' +
				'Cell 4' +
				'</td>' +
				'</tr>' +
				'</tbody>' +
				'</table>',

				// We are NOT converting back to markdown, but use the HTML version in markdown
				'<table>' +
				'<thead>' +
				'<tr>' +
				'<th style="text-align:left;">Header 1</th>' +
				'<th style="text-align:center;">Header 2</th>' +
				'<th style="text-align:right;">Header 3</th>' +
				'<th>Header 4</th>' +
				'</tr>' +
				'</thead>' +
				'<tbody>' +
				'<tr>' +
				'<td style="text-align:left;">' +
				'<em>Cell 1</em>' +
				'</td>' +
				'<td style="text-align:center;">' +
				'<strong>Cell 2</strong>' +
				'</td>' +
				'<td style="text-align:right;">' +
				'~Cell 3~' +
				'</td>' +
				'<td>' +
				'Cell 4' +
				'</td>' +
				'</tr>' +
				'</tbody>' +
				'</table>',
			);
		});
	});
});
