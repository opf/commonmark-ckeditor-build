/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module markdown-gfm/commonmarkdataprocessor
 */

/* eslint-env browser */

import { HtmlDataProcessor, ViewDomConverter } from '@ckeditor/ckeditor5-engine';
import { highlightedCodeBlock } from 'turndown-plugin-gfm';
import TurndownService from 'turndown';
import { textNodesPreprocessor, linkPreprocessor, breaksPreprocessor } from './utils/preprocessor';
import { fixTasklistWhitespaces } from './utils/fix-tasklist-whitespaces';
import { hoistTaskListCheckboxes } from './utils/hoist-task-list-checkboxes';
import { fixBreaksInTables, fixBreaksInLists, fixBreaksOnRootLevel } from "./utils/fix-breaks";
import markdownIt from 'markdown-it';
import markdownItTaskLists from 'markdown-it-task-lists';
import { isPageBreakNode, PAGE_BREAK_MARKDOWN } from "./utils/page-breaks";
import { getOPPath } from "../plugins/op-context/op-context";

export const originalSrcAttribute = 'data-original-src';

// `#` / `##` / `###` followed by either a numeric id (`6217`) or a
// semantic identifier (`PROJ-7`, `MY_PROJ-1`, `MACROPROJ-42`). The
// trailing `(?!\w)` rejects mid-word continuations like `#PROJ-1abc`.
// Group 1 is the marker, group 2 is the id.
const WP_REF_RE = /^(#{1,3})(\d+|[A-Z][A-Z0-9_]*-\d+)(?!\w)/;

// Stored `<mention>X</mention>` envelopes round-trip through markdown-it
// as three independent `html_inline` tokens; `#`-leading text between
// the open and close must not be re-promoted by this rule.
function isInsideStoredMention(tokens) {
	for (let i = tokens.length - 1; i >= 0; i--) {
		const token = tokens[i];
		if (token.type !== 'html_inline') continue;
		const c = token.content;
		if (c.startsWith('</mention')) return false;
		if (c.startsWith('<mention')) return true;
	}
	return false;
}

function workPackageRefInlineRule(state, silent) {
	const start = state.pos;
	const src = state.src;

	if (src.charCodeAt(start) !== 0x23 /* # */) return false;
	// Left boundary: refuse if preceded by a word char or another '#'
	// (preventing partial matches inside ####+ states)
	if (start > 0 && /[\w#]/.test(src[start - 1])) return false;

	const match = WP_REF_RE.exec(src.slice(start));
	if (!match) return false;
	// If we are in markdown-it silent mode, don't do anything and return true.
	if (silent) return true;

	if (isInsideStoredMention(state.tokens)) return false;

	const hashes = match[1].length;
	const id = match[2];
	const ref = match[0];
	// Convert to CKEditor structures
	// # results in <mention> model
	// ##/### results in <opce-macro-wp-quickinfo> custom element
	const html = hashes === 1
		? `<mention class="mention" data-id="${id}" data-type="work_package" data-text="${ref}">${ref}</mention>`
		: `<opce-macro-wp-quickinfo data-id="${id}" data-display-id="${id}" data-detailed="${hashes === 3}">${ref}</opce-macro-wp-quickinfo>`;

	const token = state.push('html_inline', '', 0);
	token.content = html;
	state.pos = start + match[0].length;
	return true;
}

const WIKI_PAGE_LINK_RE = /(?:\\\[){3}([0-9]+):([^\\\n]+)(?:\\\]){3}/;

function wikiPageLinkInlineRule(state, silent, editor) {
	const start = state.pos;
	const src = state.src;

	if (src.charCodeAt(start) !== 0x5c /* \ */) return false;

	const word = src.slice(start);
	const match = WIKI_PAGE_LINK_RE.exec(word);
	if (!match) return false;
	if (silent) return true;

	const providerId = match[1];
	const pageIdentifier = match[2];

	const frameId = crypto.randomUUID();
	const frameSrc = getOPPath(editor).wikiPageLinkMacro(providerId, pageIdentifier, frameId)

	const html = `
<turbo-frame
  id="${frameId}"
  src="${frameSrc}"
  data-provider-id="${providerId}"
  data-page-identifier="${pageIdentifier}"
  data-type="wiki-page-link"
></turbo-frame>`

	const token = state.push('html_inline', '', 0);
	token.content = html;
	state.pos = start + match[0].length;
	return true;
}

/**
 * This data processor implementation uses CommonMark as input/output data.
 *
 * @implements module:engine/dataprocessor/dataprocessor~DataProcessor
 */
export default class CommonMarkDataProcessor {
	constructor(editor) {
		const document = editor.editing.view.document;
		this._htmlDP = new HtmlDataProcessor(document);
		this._domConverter = new ViewDomConverter(document);
		this.editor = editor;
	}

	/**
	 * Converts the provided CommonMark string to view tree.
	 *
	 * @param {String} data A CommonMark string.
	 * @returns {module:engine/view/documentfragment~DocumentFragment} The converted view element.
	 */
	toView(data) {
		const md = markdownIt({
			// Output html
			html: true,
			breaks: true,
			// Use GFM language fence prefix
			langPrefix: 'language-'
		});

		// Use tasklist plugin
		let parser = md.use(markdownItTaskLists, { label: true });

		parser.inline.ruler.before('text', 'op_workpackage_ref', workPackageRefInlineRule);
		parser.inline.ruler.before(
			'text',
			'op_wiki_page_link',
			(state, silent) => wikiPageLinkInlineRule(state, silent, this.editor)
		);

		const previousRenderer = parser.renderer.rules.code_block;
		md.renderer.rules.code_block = function (tokens, idx, options, env, self) {
			// markdown-it adds a newline to the end of code blocks, we need to remove it
			tokens[idx].content = tokens[idx].content.replace(/\n$/, '');
			return previousRenderer(tokens, idx, options, env, self);
		};

		const html = parser.render(data);

		// Convert input HTML data to DOM DocumentFragment.
		const domFragment = this._htmlDP._toDom(html);

		// Fix duplicate whitespace in task lists
		fixTasklistWhitespaces(domFragment);

		// Fix for multiple empty lines in markdown
		fixBreaksOnRootLevel(domFragment)

		// Fix for multiple empty lines in html tables
		fixBreaksInTables(domFragment)

		// Fix for multiple empty lines in markdown lists
		fixBreaksInLists(domFragment)

		// Preprocess task list checkboxes to ensure they are direct children of <li>
		hoistTaskListCheckboxes(domFragment);

		// Convert DOM DocumentFragment to view DocumentFragment.
		const viewFragment = this._domConverter.domToView(domFragment);

		return viewFragment;
	}

	/**
	 * Converts the provided {@link module:engine/view/documentfragment~DocumentFragment} to data format &mdash; in this
	 * case to a CommonMark string.
	 *
	 * @param {module:engine/view/documentfragment~DocumentFragment} viewFragment
	 * @returns {String} CommonMark string.
	 */
	toData(viewFragment) {
		// Convert view DocumentFragment to DOM DocumentFragment.
		const domFragment = this._domConverter.viewToDom(viewFragment, document);

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

		// Turndown is filtering out empty paragraphs <p></p>, so we need to fix that with <p><br></p>
		breaksPreprocessor(domFragment);

		const blankReplacement = function (content, node) {
			if (node.tagName === 'CODE') {
				// we don't want to remove code silently
				const prefix = (node.getAttribute('class') || '').replace('language-', '');
				const textContent = node.textContent || '';

				return "```" + prefix + '\n' + (textContent.length ? textContent : '\n') + "```\n";
				// we don't want to remove pre silently
			} else if (node.tagName === 'PRE') {
				return content;
			}
			return node.isBlock ? '\n\n' : ''
		};

		// Use Turndown to convert DOM fragment to markdown
		const turndownService = new TurndownService({
			headingStyle: 'atx',
			codeBlockStyle: 'fenced',
			blankReplacement: blankReplacement,
		});

		turndownService.use([
			highlightedCodeBlock,
		]);

		/**
		 * This rule is used to convert task list items with checkboxes to markdown.
		 *
		 * This is based on the turndown-plugin-gfm taskListItems rule, but modified to
		 * support list items with checkboxes that are not direct children of a ul or ol.
		 *
		 * @see
		 */
		turndownService.addRule('taskListItems', {
			filter: function (node) {
				const nodeIsCheckbox = node.type === "checkbox";
				const parentIsListItem = node.parentNode && node.parentNode.nodeName === 'LI';
				const grandparentIsListItem = node.parentNode && node.parentNode.parentNode && node.parentNode.parentNode.nodeName === 'LI';
				return nodeIsCheckbox && (parentIsListItem || grandparentIsListItem);
			},
			replacement: function (content, node) {
				return (node.checked ? '[x]' : '[ ]') + ' '
			}
		})

		/**
		 * This rule is used to convert ordered list items to markdown.
		 *
		 * This is based on he turndownService rule for listItems, but modified to
		 * indent ordered list items with the appropriate amount of indentation spaces.
		 * This fixes an issue with the indentation of ordered list items with more
		 * than 10 items.
		 *
		 * 1. item
		 *     - subitem # four spaces is enough
		 * ...
		 * 10. item
		 *      - subitem # five spaces are necessary because `10.` is three digits, and wider than `#.`
		 *
		 * @see
		 */
		turndownService.addRule('orderedListItems', {
			filter: function (node) {
				if (node.nodeName !== 'LI') {
					return false;
				}

				return !!node.closest('ol');
			},
			replacement: function (content, node, options) {
				content = content
					.replace(/^\n+/, '') // remove leading newlines
					.replace(/\n+$/, '\n'); // replace trailing newlines with just a single one

				var parent = node.parentNode;
				var prefix = options.bulletListMarker + '   ';
				var number = 1;
				if (parent.nodeName === 'OL') {
					var start = parent.getAttribute('start');
					var index = Array.prototype.indexOf.call(parent.children, node);
					number = start ? Number(start) + index : index + 1;
					prefix = number + '.  ';
				}

				// Calculate indentation based on the width of the number prefix
				var indentWidth = prefix.length;
				var indent = ' '.repeat(indentWidth);
				content = content.replace(/\n/gm, '\n' + indent);

				return (
					prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
				);
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
			replacement: function (_content, _node) {
				return '';
			}
		});

		turndownService.addRule('markdownTables', {
			filter: function (node) {
				return node.nodeName === 'TABLE' && (!node.parentElement || node.parentElement.nodeName !== 'FIGURE');
			},
			replacement: function (_content, node) {
				return node.outerHTML; // we do not convert back to markdown, but use HTML for tables
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
				// Remove filler attribute, but keep empty lines
				node.querySelectorAll('td br[data-cke-filler]').forEach((node) => {
					if (node.nextElementSibling) {
						node.removeAttribute('data-cke-filler');
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

		turndownService.addRule('workPackageQuickinfo', {
			filter: (node) => node.nodeName === 'OPCE-MACRO-WP-QUICKINFO',
			replacement: (_content, node) => {
				const id = node.getAttribute('data-display-id') || node.getAttribute('data-id') || '';
				if (!id) return '';
				const detailed = node.getAttribute('data-detailed') === 'true';
				return detailed ? `###${id}` : `##${id}`;
			},
		});

		turndownService.addRule('wikiPageLink', {
			filter: (node) => node.nodeName === 'TURBO-FRAME' && node.getAttribute('data-type') === 'wiki-page-link',
			replacement: (_content, node) => {
				const providerId = node.getAttribute('data-provider-id') || '';
				const pageIdentifier = node.getAttribute('data-page-identifier') || '';
				return `\\[\\[\\[${providerId}:${pageIdentifier}\\]\\]\\]`;
			},
		});

		turndownService.addRule('openProjectMacros', {
			filter: ['macro'],
			replacement: (_content, node) => {
				node.innerHTML = '';
				const outer = node.outerHTML;
				return outer.replace("</macro>", "\n</macro>")
			}
		});

		turndownService.addRule('mentions', {
			filter: (node) => {
				return (
					node.nodeName === 'MENTION' &&
					node.classList.contains('mention')
				)
			},
			replacement: (_content, node) => {
				if (node.getAttribute('data-type') === 'work_package') {
					// `data-display-id` signals an autocomplete-picked or
					// round-tripped envelope; preserve those intact.
					// Parser-emitted single-hash shorthand has no
					// `data-display-id` and collapses to bare markdown.
					if (node.getAttribute('data-display-id')) {
						return node.outerHTML;
					}
					return node.getAttribute('data-text') || node.textContent || '';
				}
				return node.outerHTML;
			},
		});

		turndownService.addRule('emptyParagraphs', {
			filter: (node) => {
				return (
					(node.nodeName === 'P') &&
					((node.childNodes.length === 0) ||
						(node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR')
					)
				);
			},
			replacement: (_content, node) => {
				if (!node.parentElement && !node.nextSibling && !node.previousSibling) { //document with only one empty paragraph
					return '';
				} else if (node.childNodes.length === 1 && isPageBreakNode(node.childNodes[0])) {
					return PAGE_BREAK_MARKDOWN + '\n\n'
				} else {
					return '<br>\n\n'
				}
			},
		});

		turndownService.addRule('openProjectPageBreak', {
			filter: (node) => {
				return (
					node.nodeName === 'DIV' &&
					node.classList.contains('page-break')
				)
			},
			replacement: (_content, _node) => {
				// return the page break in a format CKEditor detects as page break if rereading it
				return PAGE_BREAK_MARKDOWN;
			}
		});

		let turndown = turndownService.turndown(domFragment);

		// Escape non-breaking space characters
		return turndown.replace(/\u00A0/, '&nbsp;').replace('###turndown-ignore###\n', '');
	}
}
