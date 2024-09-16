/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module markdown-gfm/commonmarkdataprocessor
 */

/* eslint-env browser */

import { HtmlDataProcessor, DomConverter } from '@ckeditor/ckeditor5-engine';
import {highlightedCodeBlock} from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import {textNodesPreprocessor, linkPreprocessor} from './utils/preprocessor';
import {removeParagraphsInLists} from './utils/paragraph-in-lists';
import {fixEmptyCodeBlocks} from "./utils/fix-empty-code-blocks";
import {fixTasklistWhitespaces} from './utils/fix-tasklist-whitespaces';

export const originalSrcAttribute = 'data-original-src';

/**
 * This data processor implementation uses CommonMark as input/output data.
 *
 * @implements module:engine/dataprocessor/dataprocessor~DataProcessor
 */
export default class CommonMarkDataProcessor {
	constructor(document) {
		this._htmlDP = new HtmlDataProcessor(document);
		this._domConverter = new DomConverter(document);
	}

	/**
	 * Converts the provided CommonMark string to view tree.
	 *
	 * @param {String} data A CommonMark string.
	 * @returns {module:engine/view/documentfragment~DocumentFragment} The converted view element.
	 */
	toView( data ) {
		const md = require( 'markdown-it' )( {
			// Output html
			html: true,
			// Use GFM language fence prefix
			langPrefix: 'language-',
		} );

		// Use tasklist plugin
		let taskLists = require('markdown-it-task-lists');
		let parser = md.use(taskLists, {label: true});

		const markdown = data
			// _htmlDP creates from `<br>/n` a superfluous blank element `<p><br><br data-cke-filler="true"></p>/n`
			// so we create the empty paragraph ourselves
			.replace(/<br>\n/g, '<p></p>');

		const html = parser.render( markdown )

		// Convert input HTML data to DOM DocumentFragment.
		const domFragment = this._htmlDP._toDom( html );

		// Fix some CommonMark specifics
		// Paragraphs within list elements (https://community.openproject.com/work_packages/28765)
		removeParagraphsInLists( domFragment );

		// Fix empty code blocks
		fixEmptyCodeBlocks( domFragment );

		// Fix duplicate whitespace in task lists
		fixTasklistWhitespaces( domFragment );

		// Convert DOM DocumentFragment to view DocumentFragment.
		return this._domConverter.domToView( domFragment );
	}

	/**
	 * Converts the provided {@link module:engine/view/documentfragment~DocumentFragment} to data format &mdash; in this
	 * case to a CommonMark string.
	 *
	 * @param {module:engine/view/documentfragment~DocumentFragment} viewFragment
	 * @returns {String} CommonMark string.
	 */
	toData( viewFragment ) {
		// Convert view DocumentFragment to DOM DocumentFragment.
		const domFragment = this._domConverter.viewToDom( viewFragment, document );

		// Replace leading and trailing nbsp at the end of strong and em tags
		// with single spaces
		textNodesPreprocessor(
			domFragment,
			['strong', 'em'],
			// Ensure tables are allowed to have HTML contents
			// OP#29457
			['pre', 'code', 'table']
		);

		// Replace link attributes with their computed href attribute
		linkPreprocessor(domFragment);

		// Use Turndown to convert DOM fragment to markdown
		const turndownService = new TurndownService( {
			headingStyle: 'atx',
			codeBlockStyle: 'fenced'
		} );

		turndownService.keep(['br'])

		turndownService.use([
			highlightedCodeBlock,
		]);

		// Replace todolist with markdown representation
		turndownService.addRule('todolist', {
			filter: function (node) {
				// check if we're a todo list item
				if (node.nodeName !== 'LI') {
					return false;
				}

				// Check for a parent ul, this LI might however be in an OL item
				const parentUl = node.closest('ul');
				return parentUl && parentUl.classList.contains('todo-list');
			},
			replacement: function (content, node, options) {
				content = content
					.replace(/^\n+/, '') // remove leading newlines
					.replace(/\n+$/, '\n') // replace trailing newlines with just a single one
					.replace(/\n/gm, '\n    '); // indent

				const prefix = options.bulletListMarker + '   ';
				const input = node.querySelector('input[type=checkbox]');
				const tasklist = (input && input.checked) ? '[x] ' : '[ ] ';
				return prefix + tasklist + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
			}
		});

		turndownService.addRule('imageFigure', {
			filter: 'img',
			replacement: function (content, node) {
				const parent = node.parentElement;
				if (parent && parent.classList.contains('op-uc-figure--content')) {
					return parent.parentElement.outerHTML;
				}

				return node.outerHTML;
			}
		});

		// Remove figcaption text, it is processed together with the
		// figure and the image in the imageFigure rule
		turndownService.addRule('figcaption', {
			filter: 'figcaption',
			replacement: function (content, node) {
				return '';
			}
		});

		// Keep HTML tables and remove filler elements
		turndownService.addRule('htmlTables', {
			filter: function (node) {
				const tables = node.getElementsByTagName('table');
				// check if we're a todo list item
				return node.nodeName === 'FIGURE' && tables.length;
			},
			replacement: function (_content, node) {
				node.querySelectorAll('td p.op-uc-p')
					.forEach((node) => {
						if (node.childNodes.length === 0) {
							node.parentElement.insertBefore(document.createElement("br"), node);
							node.remove();
						}
					});

				return node.outerHTML;
			}
		});

		turndownService.addRule('strikethrough', {
			filter: ['del', 's', 'strike'],
			replacement: function (content) {
				return '~~' + content + '~~'
			}
		});

		turndownService.addRule( 'openProjectMacros', {
			filter: [ 'macro' ],
			replacement: ( _content, node ) => {
				node.innerHTML = '';
				const outer = node.outerHTML;
				return outer.replace("</macro>", "\n</macro>")
			}
		});

		turndownService.addRule( 'mentions', {
			filter: (node) => {
				return (
					node.nodeName === 'MENTION' &&
					node.classList.contains('mention')
				)
			},
			replacement: ( _content, node ) => node.outerHTML,
		});

		turndownService.addRule( 'emptyLines', {
			filter: (node) => {
				return (node.nodeName === 'BR') ||
					(node.nodeName === 'P' && node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR');
			},
			replacement: ( _content, node ) => '<br>',
		});

		let turndown = turndownService.turndown( domFragment );
		return turndown
			// Escape non-breaking space characters
			.replace(/\u00A0/, '&nbsp;')
			// turndown compacts `<p><br></p><p><br></p>` to `<br>\n<br>\n\n`
			// which is not what we need for two (or more) empty lines
			.replace(/<br><br>/g, '<br>\n\n<br>')

	}
}
