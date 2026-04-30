import { testDataProcessor } from './_utils/utils.js';

describe('CommonMarkProcessor', () => {
	describe('work package references', () => {
		describe('single # (plain mention)', () => {
			it('upcasts #6217 to a <mention>', () => {
				testDataProcessor(
					'#6217',
					'<p><mention class="mention" data-id="6217" data-text="#6217" data-type="work_package">#6217</mention></p>'
				);
			});

			it('round-trips inside surrounding text', () => {
				testDataProcessor(
					'see #6217 here',
					'<p>see <mention class="mention" data-id="6217" data-text="#6217" data-type="work_package">#6217</mention> here</p>'
				);
			});
		});

		describe('double ## (non-detailed quickinfo)', () => {
			it('upcasts ##6217 to <opce-macro-wp-quickinfo>', () => {
				testDataProcessor(
					'##6217',
					'<p><opce-macro-wp-quickinfo data-detailed="false" data-id="6217">##6217</opce-macro-wp-quickinfo></p>'
				);
			});

			it('round-trips inside surrounding text', () => {
				testDataProcessor(
					'see ##6217 here',
					'<p>see <opce-macro-wp-quickinfo data-detailed="false" data-id="6217">##6217</opce-macro-wp-quickinfo> here</p>'
				);
			});
		});

		describe('triple ### (detailed quickinfo)', () => {
			it('upcasts ###6217 to <opce-macro-wp-quickinfo data-detailed="true">', () => {
				testDataProcessor(
					'###6217',
					'<p><opce-macro-wp-quickinfo data-detailed="true" data-id="6217">###6217</opce-macro-wp-quickinfo></p>'
				);
			});
		});

		describe('boundary handling', () => {
			it('does not match mid-word: foo##6217 stays as text', () => {
				testDataProcessor(
					'foo##6217',
					'<p>foo##6217</p>'
				);
			});

			it('does not match if followed by a word char: ##6217abc stays as text', () => {
				testDataProcessor(
					'##6217abc',
					'<p>##6217abc</p>'
				);
			});

			it('does not match a 4+ hash run: ####6217 stays as text', () => {
				testDataProcessor(
					'####6217',
					'<p>####6217</p>'
				);
			});

			it('does not interfere with ATX headings (## title with space)', () => {
				testDataProcessor(
					'## title',
					'<h2>title</h2>'
				);
			});
		});
	});
});
