/**
 * Unit tests for the paste error boundary safety net.
 *
 * The full clipboard pipeline wiring (event priorities, real upcast throwing)
 * is exercised by the OpenProject core integration; here we cover the pure
 * fallback logic in isolation so it runs reliably under jsdom without booting a
 * full editor instance.
 */

import OpPasteErrorBoundary, { plainTextToHtml } from '../../src/plugins/op-paste-error-boundary';

describe('plainTextToHtml', () => {
	it('encodes HTML-special characters', () => {
		expect(plainTextToHtml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
	});

	it('turns a single line break into a <br>', () => {
		expect(plainTextToHtml('first\nsecond')).toBe('first<br>second');
	});

	it('splits blank-line separated text into paragraphs', () => {
		expect(plainTextToHtml('first\n\nsecond')).toBe('<p>first</p><p>second</p>');
	});

	it('keeps single breaks within a paragraph', () => {
		expect(plainTextToHtml('a\nb\n\nc')).toBe('<p>a<br>b</p><p>c</p>');
	});

	it('expands tabs to four non-breaking spaces', () => {
		expect(plainTextToHtml('\tx')).toBe('&nbsp;&nbsp;&nbsp;&nbsp;x');
	});

	it('handles empty input', () => {
		expect(plainTextToHtml('')).toBe('');
		expect(plainTextToHtml(undefined)).toBe('');
	});
});

describe('OpPasteErrorBoundary', () => {
	function createPlugin() {
		const editor = {
			fire: jest.fn(),
			data: {
				htmlProcessor: {
					toView: jest.fn((html) => ({ view: html })),
				},
			},
		};

		const plugin = new OpPasteErrorBoundary(editor);
		return { plugin, editor };
	}

	const RICH_VIEW = { rich: true };

	it('does not interfere when no paste is in progress', () => {
		const { plugin, editor } = createPlugin();
		plugin._pasteDataTransfer = null;

		const originalToModel = jest.fn(() => 'model');
		const result = plugin._guardedToModel(originalToModel, RICH_VIEW, '$root');

		expect(result).toBe('model');
		expect(originalToModel).toHaveBeenCalledWith(RICH_VIEW, '$root');
		expect(editor.fire).not.toHaveBeenCalled();
	});

	it('passes conversion through unchanged when a paste succeeds', () => {
		const { plugin, editor } = createPlugin();
		plugin._pasteDataTransfer = { getData: () => 'irrelevant' };

		const originalToModel = jest.fn(() => 'ok');
		const result = plugin._guardedToModel(originalToModel, RICH_VIEW, '$root');

		expect(result).toBe('ok');
		expect(editor.fire).not.toHaveBeenCalled();
	});

	it('recovers from a failed paste by inserting plain text and notifying', () => {
		const { plugin, editor } = createPlugin();
		plugin._pasteDataTransfer = { getData: jest.fn(() => 'hello\nworld') };

		const boom = new Error('boom');
		const originalToModel = jest.fn()
			.mockImplementationOnce(() => { throw boom; }) // rich conversion fails
			.mockImplementationOnce(() => 'plainModel'); // plain-text fallback

		const result = plugin._guardedToModel(originalToModel, RICH_VIEW, '$root');

		expect(result).toBe('plainModel');
		expect(editor.fire).toHaveBeenCalledTimes(1);
		expect(editor.fire).toHaveBeenCalledWith('op:clipboard-paste-error', { error: boom });

		// The fallback re-converts the clipboard's plain text, not the rich markup.
		expect(plugin._pasteDataTransfer.getData).toHaveBeenCalledWith('text/plain');
		expect(editor.data.htmlProcessor.toView).toHaveBeenCalledWith(plainTextToHtml('hello\nworld'));
	});

	it('drops the content as a last resort if even the plain-text fallback fails', () => {
		const { plugin, editor } = createPlugin();
		plugin._pasteDataTransfer = { getData: () => 'text' };

		const originalToModel = jest.fn()
			.mockImplementationOnce(() => { throw new Error('rich'); })
			.mockImplementationOnce(() => { throw new Error('plain'); })
			.mockImplementationOnce(() => 'emptyModel');

		const result = plugin._guardedToModel(originalToModel, RICH_VIEW, '$root');

		expect(result).toBe('emptyModel');
		// The error event is only fired once, for the initial failure.
		expect(editor.fire).toHaveBeenCalledTimes(1);
		// Last resort converts an empty document.
		expect(editor.data.htmlProcessor.toView).toHaveBeenLastCalledWith('');
	});
});
