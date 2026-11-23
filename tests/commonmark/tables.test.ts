/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import {testDataProcessor, createTestEditor} from './_utils/utils';
import MarkdownDataProcessor from '../../src/commonmark/commonmarkdataprocessor';

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

				'| Heading 1 | Heading 2 |\n' +
				'| --- | --- |\n' +
				'| Cell 1 | Cell 2 |\n' +
				'| Cell 3 | Cell 4 |'
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

				'| Header 1 | Header 2 | Header 3 | Header 4 |\n' +
				'| :---: | ---: | :--- | --- |\n' +
				'| Cell 1 | Cell 2 | Cell 3 | Cell 4 |\n' +
				'| Cell 5 | Cell 6 | Cell 7 | Cell 8 |'
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

				'| Header 1 | Header 2 |\n' +
				'| --- | --- |\n' +
				'| Cell 1 | Cell 2 |\n' +
				'| Cell 3 | Cell 4 |'
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

				'| Header 1 | Header 2 | Header 3 | Header 4 |\n' +
				'| :--- | :---: | ---: | --- |\n' +
				'| _Cell 1_ | **Cell 2** | ~Cell 3~ | Cell 4 |'
			);
		});
	});
	describe('tables as produced by the editor', () => {
		const head = (...cells: string[]) =>
			'<thead class="op-uc-table--head"><tr class="op-uc-table--row">' +
			cells.map(c => `<th class="op-uc-table--cell op-uc-table--cell_head">${c}</th>`).join('') +
			'</tr></thead>';
		const row = (...cells: string[]) =>
			'<tr class="op-uc-table--row">' +
			cells.map(c => `<td class="op-uc-table--cell">${c}</td>`).join('') +
			'</tr>';
		const figure = (inner: string, figureClasses = 'table op-uc-figure_align-center op-uc-figure') =>
			`<figure class="${figureClasses}"><table class="op-uc-table">${inner}</table></figure>`;

		function toMarkdown(html: string) {
			const dataProcessor = new MarkdownDataProcessor(createTestEditor());
			return dataProcessor.toData(dataProcessor.toView(html)).trim();
		}

		// OP-17275
		it('converts the table from the bug report to a pipe table', () => {
			const p = (text: string) => `<p class="op-uc-p">${text}</p>`;
			const html = figure(
				head(p('Month'), p('Savings')) +
				'<tbody>' + row(p('January'), p('$250')) + row(p('February'), p('$80')) + '</tbody>'
			);

			expect(toMarkdown(html)).toEqual(
				'| Month | Savings |\n' +
				'| --- | --- |\n' +
				'| January | $250 |\n' +
				'| February | $80 |'
			);
		});

		it('round-trips a pipe table through the editor output', () => {
			const markdown =
				'| Month | Savings |\n' +
				'| --- | --- |\n' +
				'| January | $250 |';

			expect(toMarkdown(toMarkdown(markdown))).toEqual(markdown);
		});

		it('escapes pipes in cell text and code', () => {
			const html = figure(head('A', 'B') + '<tbody>' + row('x|y', '<code>a|b</code>') + '</tbody>');

			expect(toMarkdown(html)).toContain('| x\\|y | `a\\|b` |');
		});

		it('keeps literal HTML-like text as text and mentions intact', () => {
			const mention = '<mention class="mention" data-id="3" data-type="user" data-text="@Ann">@Ann</mention>';
			const html = figure(head('A', 'B') + '<tbody>' + row('a &lt; b &lt;b&gt;', mention) + '</tbody>');
			const markdown = toMarkdown(html);

			expect(markdown).toContain('| a &lt; b &lt;b&gt; |');
			expect(markdown).toContain(mention);
			expect(toMarkdown(markdown)).toEqual(markdown);
		});

		it('emits empty cells as empty pipe cells', () => {
			const html = figure(head('A', 'B') + '<tbody>' + row('x', '<br data-cke-filler="true">') + '</tbody>');

			expect(toMarkdown(html)).toEqual('| A | B |\n| --- | --- |\n| x |  |');
		});

		it('keeps bold text with trailing non-breaking space valid', () => {
			const html = figure(head('A') + '<tbody>' + row('<strong>bold&nbsp;</strong>') + '</tbody>');

			expect(toMarkdown(html)).toMatch(/^\| A \|\n\| --- \|\n\| \*\*bold\*\* +\|$/);
		});

		it('writes uniform column alignment into the separator row', () => {
			const html = figure(
				'<thead><tr><th style="text-align:center">A</th><th style="text-align:right">B</th></tr></thead>' +
				'<tbody><tr><td style="text-align:center">1</td><td style="text-align:right">2</td></tr></tbody>'
			);

			expect(toMarkdown(html)).toEqual('| A | B |\n| :---: | ---: |\n| 1 | 2 |');
		});

		it('converts a table nested in a list item', () => {
			const html = '<ul><li><p>item</p>' + figure(head('A') + '<tbody>' + row('x') + '</tbody>') + '</li></ul>';
			const dataProcessor = new MarkdownDataProcessor(createTestEditor());
			const markdown = toMarkdown(html);

			expect(markdown).toContain('| A |');
			expect(dataProcessor.toView(markdown)).toBeDefined();
			expect(toMarkdown(markdown)).toEqual(markdown);
		});

		describe('falls back to HTML', () => {
			const cases: Record<string, string> = {
				'a table without a header row': figure('<tbody>' + row('a', 'b') + row('c', 'd') + '</tbody>'),
				'merged cells': figure(head('A', 'B') + '<tbody><tr><td colspan="2">x</td></tr></tbody>'),
				'a cell background color': figure(head('A') + '<tbody><tr><td style="background-color:#123456">x</td></tr></tbody>'),
				'vertical cell alignment': figure(head('A') + '<tbody><tr><td style="vertical-align:top">x</td></tr></tbody>'),
				'mixed alignment within a column': figure(
					'<thead><tr><th style="text-align:center">A</th></tr></thead>' +
					'<tbody><tr><td style="text-align:right">x</td></tr></tbody>'
				),
				'a positioned table': figure(head('A') + '<tbody>' + row('x') + '</tbody>', 'table op-uc-figure_align-start op-uc-figure'),
				'an unknown figure class': figure(head('A') + '<tbody>' + row('x') + '</tbody>', 'table op-uc-figure_align-center op-uc-figure custom'),
				'a table width': `<figure class="table op-uc-figure" style="width:50%"><table class="op-uc-table">${head('A')}<tbody>${row('x')}</tbody></table></figure>`,
				'two paragraphs in a cell': figure(head('A') + '<tbody>' + row('<p>one</p><p>two</p>') + '</tbody>'),
				'a list in a cell': figure(head('A') + '<tbody>' + row('<ul><li>one</li></ul>') + '</tbody>'),
				'a line break in a cell': figure(head('A') + '<tbody>' + row('one<br>two') + '</tbody>'),
				'a header column': figure(head('A', 'B') + '<tbody><tr><th>x</th><td>y</td></tr></tbody>'),
				// markdown-it and the server's comrak disagree on backslash runs before a pipe
				'a backslash-pipe in inline code': figure(head('A') + '<tbody>' + row('<code>grep a\\|b</code>') + '</tbody>'),
				'a backslash-pipe in a link target': figure(head('A') + '<tbody>' + row('<a href="https://example.com/?q=a\\|b">x</a>') + '</tbody>'),
				'a styled paragraph in a cell': figure(head('A') + '<tbody>' + row('<p style="color:red">x</p>') + '</tbody>'),
				'justified text': figure(head('A') + '<tbody><tr><td style="text-align:justify">x</td></tr></tbody>'),
				'a caption': `<figure class="table op-uc-figure"><table class="op-uc-table">${head('A')}<tbody>${row('x')}</tbody></table><figcaption>c</figcaption></figure>`,
				'a footer row': figure(head('A') + '<tbody>' + row('x') + '</tbody><tfoot>' + row('f') + '</tfoot>'),
			};

			it('keeps raw HTML in fallback cells unescaped', () => {
				const html = figure(head('A', 'B') + '<tbody><tr><td colspan="2">a &lt; b <b>bold</b></td></tr></tbody>');
				const markdown = toMarkdown(html);

				expect(markdown).toContain('a &lt; b <b>bold</b>');
				expect(markdown).not.toContain('&amp;lt;');
			});

			it('strips the marker from nested tables', () => {
				const inner = '<table class="op-uc-table">' + head('X') + '<tbody>' + row('y') + '</tbody></table>';
				const markdown = toMarkdown(figure(head('A') + '<tbody>' + row(inner) + '</tbody>'));

				expect(markdown).toMatch(/^<figure/);
				expect(markdown).not.toContain('data-op-html-table');
			});

			it('handles a simple and a rich table in one document independently', () => {
				const simple = figure(head('A') + '<tbody>' + row('a &lt; b') + '</tbody>');
				const rich = figure(head('B') + '<tbody><tr><td style="background-color:red">c &lt; d</td></tr></tbody>');
				const markdown = toMarkdown(simple + rich);

				expect(markdown).toContain('| A |\n| --- |\n| a &lt; b |');
				expect(markdown).toContain('<td style="background-color:red;">c &lt; d</td>');
				expect(markdown.match(/<table/g)).toHaveLength(1);
			});

			Object.entries(cases).forEach(([name, html]) => {
				it(`for ${name}`, () => {
					const markdown = toMarkdown(html);

					expect(markdown).toMatch(/^<(figure|table)[\s>]/);
					expect(markdown).not.toContain('| --- |');
					expect(markdown).not.toContain('data-op-html-table');
				});
			});
		});
	});
});
