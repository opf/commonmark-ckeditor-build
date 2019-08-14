/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module markdown-gfm/commonmarkdataprocessor
 */

/* eslint-env browser */

import HtmlDataProcessor from '@ckeditor/ckeditor5-engine/src/dataprocessor/htmldataprocessor';
import DomConverter from '@ckeditor/ckeditor5-engine/src/view/domconverter';
import {highlightedCodeBlock, taskListItems} from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import {textNodesPreprocessor, linkPreprocessor} from './utils/preprocessor';
import {removeParagraphsInLists} from './utils/paragraph-in-lists';

export const originalSrcAttribute = 'data-original-src';

/**
 * This data processor implementation uses CommonMark as input/output data.
 *
 * @implements module:engine/dataprocessor/dataprocessor~DataProcessor
 */
export default class CommonMarkDataProcessor {
	constructor() {
		this._htmlDP = new HtmlDataProcessor();
		this._domConverter = new DomConverter();
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

		const html = parser.render( data );

		// Convert input HTML data to DOM DocumentFragment.
		const domFragment = this._htmlDP._toDom( html );

		// Fix some CommonMark specifics
		// Paragraphs within list elements (https://community.openproject.com/work_packages/28765)
		removeParagraphsInLists( domFragment );

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

		turndownService.use([
			highlightedCodeBlock,
		]);

		// Replace todolist with markdown representation
		turndownService.addRule('todolist', {
			filter: function (node) {
				let parent = node.parentNode;
				let grandparent = parent && parent.parentNode;

				return node.type === 'checkbox' &&
					grandparent && grandparent.nodeName === 'LI';
			  },
			  replacement: function (content, node) {
				return (node.checked ? '[x]' : '[ ]') + ' '
			  }
		});


		// Replace images with appropriate source URLs derived from an attachment,
		// if any. Otherwise use the original src
		turndownService.addRule('img', {
			filter: 'img',

			replacement: function (content, node) {
			  var alt = node.alt || '';
			  var src = node.getAttribute(originalSrcAttribute) || node.getAttribute('src') || '';
			  var title = node.title || '';
			  var titlePart = title ? ' "' + title + '"' : '';

			  return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : '';
			}
		});

		// Keep HTML tables and remove filler elements
		turndownService.addRule('htmlTables', {
			filter: ['table'],
			replacement: function (_content, node) {
				// Remove filler nodes
				node.querySelectorAll('td br[data-cke-filler]')
					.forEach((node) => node.remove());

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
				var outer = node.outerHTML;
				return outer.replace("</macro>", "\n</macro>")
			}
		});

		const output = turndownService.turndown( domFragment );
		console.debug(output);
		return output
	}
}
