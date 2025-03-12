import {testDataProcessor} from './_utils/utils.js';

describe('CommonMarkProcessor', () => {
	describe('page breaks', () => {
		it('should process page break', () => {
			testDataProcessor(
				'First page\n\n' +
				'<br style="page-break-after:always;">\n\n' +
				'Second page',

				'<p>First page</p><p><br style="page-break-after:always"></br></p><p>Second page</p>'
			);
		});
	});
});
