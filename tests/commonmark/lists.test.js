/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import {testDataProcessor} from './_utils/utils.js';

describe('CommonMarkProcessor', () => {
	describe('lists', () => {
		it('should process tight asterisks', () => {
			testDataProcessor(
				'*	item 1\n' +
				'*	item 2\n' +
				'*	item 3',

				// GitHub renders it as (notice spaces before list items)
				// <ul>
				// <li>  item 1</li>
				// <li>  item 2</li>
				// <li>  item 3</li>
				// </ul>
				'<ul><li>item 1</li><li>item 2</li><li>item 3</li></ul>',

				// List will be normalized to 3-space representation.
				'*   item 1\n' +
				'*   item 2\n' +
				'*   item 3'
			);
		});

		it('should process loose asterisks', () => {
			testDataProcessor(
				'*	item 1\n' +
				'\n' +
				'*	item 2\n' +
				'\n' +
				'*	item 3',

				// Loose lists are rendered with with paragraph inside.
				'<ul>' +
				'<li>' +
				'<p>item 1</p>' +
				'</li>' +
				'<li>' +
				'<p>item 2</p>' +
				'</li>' +
				'<li>' +
				'<p>item 3</p>' +
				'</li>' +
				'</ul>',

				// List will be normalized to 3-space representation.
				'*   item 1\n' +
				'\n' +
				'*   item 2\n' +
				'\n' +
				'*   item 3'
			);
		});

		it('should process tight pluses', () => {
			testDataProcessor(
				'+	item 1\n' +
				'+	item 2\n' +
				'+	item 3',

				'<ul>' +
				'<li>item 1</li>' +
				'<li>item 2</li>' +
				'<li>item 3</li>' +
				'</ul>',

				// List will be normalized to asterisks, 3-space representation.
				'*   item 1\n' +
				'*   item 2\n' +
				'*   item 3'
			);
		});

		it('should process loose pluses', () => {
			testDataProcessor(
				'+	item 1\n' +
				'\n' +
				'+	item 2\n' +
				'\n' +
				'+	item 3',

				'<ul>' +
				'<li>' +
				'<p>item 1</p>' +
				'</li>' +
				'<li>' +
				'<p>item 2</p>' +
				'</li>' +
				'<li>' +
				'<p>item 3</p>' +
				'</li>' +
				'</ul>',

				// List will be normalized to asterisks, 3-space representation.
				'*   item 1\n' +
				'\n' +
				'*   item 2\n' +
				'\n' +
				'*   item 3'
			);
		});

		it('should process tight minuses', () => {
			testDataProcessor(
				'-	item 1\n' +
				'-	item 2\n' +
				'-	item 3',

				'<ul>' +
				'<li>item 1</li>' +
				'<li>item 2</li>' +
				'<li>item 3</li>' +
				'</ul>',

				// List will be normalized to asterisks, 3-space representation.
				'*   item 1\n' +
				'*   item 2\n' +
				'*   item 3'
			);
		});

		it('should process loose minuses', () => {
			testDataProcessor(
				'-	item 1\n' +
				'\n' +
				'-	item 2\n' +
				'\n' +
				'-	item 3',

				'<ul>' +
				'<li>' +
				'<p>item 1</p>' +
				'</li>' +
				'<li>' +
				'<p>item 2</p>' +
				'</li>' +
				'<li>' +
				'<p>item 3</p>' +
				'</li>' +
				'</ul>',

				// List will be normalized to asterisks, 3-space representation.
				'*   item 1\n' +
				'\n' +
				'*   item 2\n' +
				'\n' +
				'*   item 3'
			);
		});

		it('should process ordered list with tabs', () => {
			testDataProcessor(
				'1.	item 1\n' +
				'2.	item 2\n' +
				'3.	item 3',

				'<ol>' +
				'<li>item 1</li>' +
				'<li>item 2</li>' +
				'<li>item 3</li>' +
				'</ol>',

				// List will be normalized to 2-space representation.
				'1.  item 1\n' +
				'2.  item 2\n' +
				'3.  item 3'
			);
		});

		it('should process ordered list with spaces', () => {
			testDataProcessor(
				'1. item 1\n' +
				'2. item 2\n' +
				'3. item 3',

				'<ol>' +
				'<li>item 1</li>' +
				'<li>item 2</li>' +
				'<li>item 3</li>' +
				'</ol>',

				// List will be normalized to 2-space representation.
				'1.  item 1\n' +
				'2.  item 2\n' +
				'3.  item 3'
			);
		});

		it('should process loose ordered list with tabs', () => {
			testDataProcessor(
				'1.	item 1\n' +
				'\n' +
				'2.	item 2\n' +
				'\n' +
				'3.	item 3',

				'<ol>' +
				'<li>' +
				'<p>item 1</p>' +
				'</li>' +
				'<li>' +
				'<p>item 2</p>' +
				'</li>' +
				'<li>' +
				'<p>item 3</p>' +
				'</li>' +
				'</ol>',

				// List will be normalized to 2-space representation.
				'1.  item 1\n' +
				'\n' +
				'2.  item 2\n' +
				'\n' +
				'3.  item 3'
			);
		});

		it('should process loose ordered list with spaces', () => {
			testDataProcessor(
				'1. item 1\n' +
				'\n' +
				'2. item 2\n' +
				'\n' +
				'3. item 3',

				'<ol>' +
				'<li>' +
				'<p>item 1</p>' +
				'</li>' +
				'<li>' +
				'<p>item 2</p>' +
				'</li>' +
				'<li>' +
				'<p>item 3</p>' +
				'</li>' +
				'</ol>',

				// List will be normalized to 2-space representation.
				'1.  item 1\n' +
				'\n' +
				'2.  item 2\n' +
				'\n' +
				'3.  item 3'
			);
		});

		it('should process nested and mixed lists', () => {
			testDataProcessor(
				'1. First\n' +
				'2. Second:\n' +
				'	* Fee\n' +
				'	* Fie\n' +
				'	* Foe\n' +
				'3. Third',

				'<ol>' +
				'<li>First</li>' +
				'<li>Second:' +
				'<ul>' +
				'<li>Fee</li>' +
				'<li>Fie</li>' +
				'<li>Foe</li>' +
				'</ul>' +
				'</li>' +
				'<li>Third</li>' +
				'</ol>',

				// All lists will be normalized after converting back.
				'1.  First\n' +
				'2.  Second:\n' +
				'    *   Fee\n' +
				'    *   Fie\n' +
				'    *   Foe\n' +
				'3.  Third'
			);
		});

		it('should process nested and mixed loose lists', () => {
			testDataProcessor(
				'1. First\n' +
				'\n' +
				'2. Second:\n' +
				'	* Fee\n' +
				'	* Fie\n' +
				'	* Foe\n' +
				'\n' +
				'3. Third',

				'<ol>' +
				'<li>' +
				'<p>First</p>' +
				'</li>' +
				'<li>' +
				'<p>Second:</p>' +
				'<ul>' +
				'<li>Fee</li>' +
				'<li>Fie</li>' +
				'<li>Foe</li>' +
				'</ul>' +
				'</li>' +
				'<li>' +
				'<p>Third</p>' +
				'</li>' +
				'</ol>',

				// All lists will be normalized after converting back.
				'1.  First\n' +
				'\n' +
				'2.  Second:\n' +
				'\n' +
				'    *   Fee\n' +
				'    *   Fie\n' +
				'    *   Foe\n' +
				'3.  Third'
			);
		});

		it('should create different lists from different list indicators', () => {
			testDataProcessor(
				'* test\n' +
				'+ test\n' +
				'- test',

				'<ul>' +
				'<li>test</li>' +
				'</ul>' +
				'<ul>' +
				'<li>test</li>' +
				'</ul>' +
				'<ul>' +
				'<li>test</li>' +
				'</ul>',

				// After converting back list items will be unified.
				'*   test\n' +
				'\n' +
				'*   test\n' +
				'\n' +
				'*   test'
			);
		});
	});

	it('should create multi lines in lists', () => {
		testDataProcessor(
			'1.  First\n' +
			'    Flup\n' +
			'    End\n\n' +
			'2.  Second\n\n' +
			'3.  Third\n' +
			'    Fluppy\n' +
			'    End\n\n' +
			'4.  Fourth',

			'<ol>' +
			'<li><p>First<br></br>Flup<br></br>End</p></li>' +
			'<li><p>Second</p></li>' +
			'<li><p>Third<br></br>Fluppy<br></br>End</p></li>' +
			'<li><p>Fourth</p></li>' +
			'</ol>'
		);
	});

	it('should allow empty lines in lists', () => {
		testDataProcessor(
			'*  First\n' +
			'   \n' +
			'   Last\n' +
			'   \n' +
			'*  Second',
			'<ul>' +
			'<li><p>First</p><p>Last</p></li>' +
			'<li><p>Second</p></li>' +
			'</ul>',
			'*   First\n' +
			'\n' +
			'    Last\n' +
			'\n' +
			'*   Second',
		);
	});

	it('should allow empty lines with breaks in lists', () => {
		testDataProcessor(
			'*  First\n' +
			'   \n' +
			'    <br>\n' +
			'   \n' +
			'   Last\n' +
			'   \n' +
			'*  Second',
			'<ul>' +
			'<li><p>First</p><p></p><p>Last</p></li>' +
			'<li><p>Second</p></li>' +
			'</ul>',
			'*   First\n' +
			'\n' +
			'    <br>\n' +
			'\n' +
			'    Last\n' +
			'\n' +
			'*   Second',
		);
	});

	describe('todo lists', () => {
		it('should process todo lists', () => {
			testDataProcessor(
				'*   [ ] Item 1\n' +
				'*   [x] Item 2',

				'<ul class="contains-task-list">' +
				'<li class="task-list-item"><label><input class="task-list-item-checkbox" disabled="" type="checkbox"></input>Item 1</label></li>' +
				'<li class="task-list-item"><label><input checked="" class="task-list-item-checkbox" disabled="" type="checkbox"></input>Item 2</label></li>' +
				'</ul>',

				'*   [ ] Item 1\n' +
				'*   [x] Item 2',
				{
					simulatePlugin: () => {
						return '<ul class="todo-list">' +
							'<li class="task-list-item"><label><input class="task-list-item-checkbox" disabled="" type="checkbox"></input>Item 1</label></li>' +
							'<li class="task-list-item"><label><input checked="" class="task-list-item-checkbox" disabled="" type="checkbox"></input>Item 2</label></li>' +
							'</ul>';
					}
				}
			);
		});
	});
});
