/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { _stringifyView as stringify } from "@ckeditor/ckeditor5-engine";
import { EditingView, StylesProcessor } from "@ckeditor/ckeditor5-engine";
import type { Editor } from "@ckeditor/ckeditor5-core";

import MarkdownDataProcessor from '../../../src/commonmark/commonmarkdataprocessor';

/**
 * Tests MarkdownDataProcessor.
 *
 * @param {String} markdown Markdown to be processed to view.
 * @param {String} viewString Expected view structure.
 * @param {String} [normalizedMarkdown] When converting back to the markdown it might be different than provided input
 * @param {Object} [options] Additional options.
 * @param {Function} [options.setup] A function that receives the data processor instance before its execution.
 * @param {Function} [options.simulatePlugin] A function that simulates a viewFragment changed by a plugin
 * markdown string (which will be used if this parameter is not provided).
 * @returns {module:engine/view/documentfragment~DocumentFragment}
 */
interface TestOptions {
	setup?: (dataProcessor: MarkdownDataProcessor) => void;
	simulatePlugin?: () => string;
}

export function testDataProcessor(markdown: string, viewString: string, normalizedMarkdown?: string, options?: TestOptions) {
	const editor = createTestEditor();

	const dataProcessor = new MarkdownDataProcessor(editor);

	if (options && options.setup) {
		options.setup(dataProcessor);
	}
	let viewFragment = dataProcessor.toView(markdown);

	const html = cleanHtml(stringify(viewFragment));

	// Check if view has correct data.
	expect(html).toEqual(viewString);

	// Check if converting back gives the same result.
	const normalized = typeof normalizedMarkdown !== 'undefined' ? normalizedMarkdown : markdown;

	if (options && options.simulatePlugin) {
		viewFragment = dataProcessor.toView(options.simulatePlugin());
	}

	expect(cleanMarkdown(dataProcessor.toData(viewFragment))).toEqual(normalized);

	return viewFragment;
}

export function createTestEditor() {
	const view = new EditingView(new StylesProcessor());

	// The data processor only reads editing.view from the editor.
	return { editing: { view } } as unknown as Editor;
}

function cleanHtml(html: string) {
	// Space between table elements.
	html = html.replace(/(th|td|tr)>\s+<(\/?(?:th|td|tr))/g, '$1><$2');
	return html;
}

function cleanMarkdown(markdown: string) {
	// Trim spaces at the end of the lines.
	markdown = markdown.replace(/ +$/gm, '');
	// Trim linebreak at the very beginning.
	markdown = markdown.replace(/^\s+/g, '');
	return markdown;
}
