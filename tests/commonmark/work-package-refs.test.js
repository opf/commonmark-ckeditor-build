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
					'<p><opce-macro-wp-quickinfo data-detailed="false" data-display-id="6217" data-id="6217">##6217</opce-macro-wp-quickinfo></p>'
				);
			});

			it('round-trips inside surrounding text', () => {
				testDataProcessor(
					'see ##6217 here',
					'<p>see <opce-macro-wp-quickinfo data-detailed="false" data-display-id="6217" data-id="6217">##6217</opce-macro-wp-quickinfo> here</p>'
				);
			});
		});

		describe('triple ### (detailed quickinfo)', () => {
			it('upcasts ###6217 to <opce-macro-wp-quickinfo data-detailed="true">', () => {
				testDataProcessor(
					'###6217',
					'<p><opce-macro-wp-quickinfo data-detailed="true" data-display-id="6217" data-id="6217">###6217</opce-macro-wp-quickinfo></p>'
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

			it('does not crash when a WP ref appears inside a link label', () => {
				testDataProcessor(
					'[#123 text](https://example.com/)',
					'<p><a href="https://example.com/"><mention class="mention" data-id="123" data-text="#123" data-type="work_package">#123</mention> text</a></p>'
				);
			});
		});

		describe('semantic identifier shorthand', () => {
			it('upcasts #PROJ-7 to a <mention>', () => {
				testDataProcessor(
					'#PROJ-7',
					'<p><mention class="mention" data-id="PROJ-7" data-text="#PROJ-7" data-type="work_package">#PROJ-7</mention></p>'
				);
			});

			it('upcasts ##PROJ-7 to <opce-macro-wp-quickinfo>', () => {
				testDataProcessor(
					'##PROJ-7',
					'<p><opce-macro-wp-quickinfo data-detailed="false" data-display-id="PROJ-7" data-id="PROJ-7">##PROJ-7</opce-macro-wp-quickinfo></p>'
				);
			});

			it('upcasts ###PROJ-7 to <opce-macro-wp-quickinfo data-detailed="true">', () => {
				testDataProcessor(
					'###PROJ-7',
					'<p><opce-macro-wp-quickinfo data-detailed="true" data-display-id="PROJ-7" data-id="PROJ-7">###PROJ-7</opce-macro-wp-quickinfo></p>'
				);
			});

			it('matches longer project identifiers like #MACROPROJ-42', () => {
				testDataProcessor(
					'#MACROPROJ-42',
					'<p><mention class="mention" data-id="MACROPROJ-42" data-text="#MACROPROJ-42" data-type="work_package">#MACROPROJ-42</mention></p>'
				);
			});

			it('matches identifiers with underscores (e.g. #MY_PROJ-1)', () => {
				testDataProcessor(
					'#MY_PROJ-1',
					'<p><mention class="mention" data-id="MY_PROJ-1" data-text="#MY_PROJ-1" data-type="work_package">#MY_PROJ-1</mention></p>'
				);
			});

			describe('boundary handling for semantic shape', () => {
				it('does not match mid-word: foo#PROJ-1 stays as text', () => {
					testDataProcessor(
						'foo#PROJ-1',
						'<p>foo#PROJ-1</p>'
					);
				});

				it('does not match if followed by a word char: #PROJ-1abc stays as text', () => {
					testDataProcessor(
						'#PROJ-1abc',
						'<p>#PROJ-1abc</p>'
					);
				});

				it('does not match a trailing-dash-only shape: #PROJ- stays as text', () => {
					testDataProcessor(
						'#PROJ-',
						'<p>#PROJ-</p>'
					);
				});

				it('does not match lowercase project identifiers: #proj-1 stays as text', () => {
					testDataProcessor(
						'#proj-1',
						'<p>#proj-1</p>'
					);
				});
			});
		});

		describe('stored <mention> envelope round-trip', () => {
			// The two fixtures differ only in attribute order — view
			// stringify sorts alphabetically, DOM serialization preserves
			// source order.
			const inputFor = (text) =>
				`<mention class="mention" data-id="42" data-text="${text}" data-type="work_package" data-display-id="KSTP-2">${text}</mention>`;
			const viewFor = (text) =>
				`<mention class="mention" data-display-id="KSTP-2" data-id="42" data-text="${text}" data-type="work_package">${text}</mention>`;

			it('preserves single-hash <mention> envelope', () => {
				testDataProcessor(
					inputFor('#KSTP-2'),
					`<p>${viewFor('#KSTP-2')}</p>`,
					inputFor('#KSTP-2')
				);
			});

			it('preserves double-hash <mention> envelope', () => {
				testDataProcessor(
					inputFor('##KSTP-2'),
					`<p>${viewFor('##KSTP-2')}</p>`,
					inputFor('##KSTP-2')
				);
			});

			it('preserves triple-hash <mention> envelope', () => {
				testDataProcessor(
					inputFor('###KSTP-2'),
					`<p>${viewFor('###KSTP-2')}</p>`,
					inputFor('###KSTP-2')
				);
			});

			it('collapses a legacy single-attribute envelope to bare data-text', () => {
				const legacy = '<mention class="mention" data-id="6217" data-text="#6217" data-type="work_package">#6217</mention>';
				testDataProcessor(
					legacy,
					`<p>${legacy}</p>`,
					'#6217'
				);
			});
		});

	});
});
