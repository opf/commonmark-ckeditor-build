import type TurndownService from 'turndown';

// OP-17275: tables that GFM can express without loss are written as pipe tables.
// Anything carrying editor-only features (styles, merged cells, block content,
// positioning) keeps the HTML output so nothing is dropped.

const EDITOR_FIGURE_CLASSES = ['table', 'op-uc-figure', 'op-uc-figure_align-center'];
const EDITOR_TABLE_CLASSES = ['op-uc-table'];
const NON_INLINE_IN_CELL = 'p, div, ul, ol, li, pre, blockquote, table, figure, figcaption, img, h1, h2, h3, h4, h5, h6, hr, macro, input, br:not([data-cke-filler])';
const ALIGNMENT_MARKERS: Record<string, string> = { '': '---', left: ':---', center: ':---:', right: '---:' };

export function isMarkdownRepresentableTable(table: HTMLTableElement): boolean {
	const figure = table.parentElement?.nodeName === 'FIGURE' ? table.parentElement : null;

	if (figure && !isPlainFigure(figure, table)) {
		return false;
	}

	if (table.hasAttribute('style') || !onlyClasses(table, EDITOR_TABLE_CLASSES) ||
		table.querySelector(':scope > colgroup, :scope > caption, :scope > tfoot')) {
		return false;
	}

	const rows = Array.from(table.rows);
	if (rows.length === 0 || !isHeaderRow(table, rows[0])) {
		return false;
	}

	const width = rows[0].cells.length;
	const bodyRows = rows.slice(1);

	return rows.every(row => row.cells.length === width && Array.from(row.cells).every(isPlainCell)) &&
		bodyRows.every(row => Array.from(row.cells).every(cell => cell.nodeName === 'TD')) &&
		columnAlignments(rows, width) !== null;
}

export function tableToMarkdown(table: HTMLTableElement, turndownService: TurndownService): string {
	const rows = Array.from(table.rows);
	const alignments = columnAlignments(rows, rows[0].cells.length)!;
	const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
	const markdownRows = rows.map(row => line(Array.from(row.cells).map(cell => cellToMarkdown(cell, turndownService))));

	return [
		markdownRows[0],
		line(alignments.map(alignment => ALIGNMENT_MARKERS[alignment])),
		...markdownRows.slice(1),
	].join('\n');
}

function isPlainFigure(figure: HTMLElement, table: HTMLTableElement) {
	return !figure.hasAttribute('style') &&
		onlyClasses(figure, EDITOR_FIGURE_CLASSES) &&
		figure.children.length === 1 &&
		figure.children[0] === table;
}

function onlyClasses(element: Element, allowed: string[]) {
	return Array.from(element.classList).every(name => allowed.includes(name));
}

function isHeaderRow(table: HTMLTableElement, firstRow: HTMLTableRowElement) {
	const cells = Array.from(firstRow.cells);
	const inHead = table.tHead !== null && table.tHead.rows.length === 1 && firstRow.parentElement === table.tHead;
	const allHeaderCells = cells.length > 0 && cells.every(cell => cell.nodeName === 'TH');

	return allHeaderCells && (inHead || table.tHead === null);
}

function isPlainCell(cell: HTMLTableCellElement) {
	if (cell.colSpan > 1 || cell.rowSpan > 1) {
		return false;
	}

	const style = cell.style;
	if (style.length > 1 || (style.length === 1 && !style.textAlign)) {
		return false;
	}

	const content = cellContent(cell);
	return content !== null && !content.querySelector(NON_INLINE_IN_CELL) && !hasUnescapableBackslashPipe(content);
}

// GFM has no encoding for a literal "\|" in inline code or a link target that both
// markdown-it (editor) and comrak (server) read back identically.
function hasUnescapableBackslashPipe(content: Element) {
	const rawTexts = [
		...Array.from(content.querySelectorAll('code')).map(code => code.textContent || ''),
		...Array.from(content.querySelectorAll('a[href]')).map(link => link.getAttribute('href') || ''),
	];

	return rawTexts.some(text => text.includes('\\|'));
}

// A cell holding a single paragraph is unwrapped to that paragraph; anything else
// that contains a paragraph alongside other content is not inline-only.
function cellContent(cell: HTMLTableCellElement): Element | null {
	const children = Array.from(cell.childNodes).filter(node => !isBlankText(node));

	if (children.length === 1 && children[0].nodeName === 'P') {
		const paragraph = children[0] as Element;
		return paragraph.hasAttribute('style') ? null : paragraph;
	}

	return cell;
}

function isBlankText(node: Node) {
	return node.nodeType === Node.TEXT_NODE && !(node.textContent || '').trim();
}

// Returns one alignment per column, or null when a column mixes alignments.
function columnAlignments(rows: HTMLTableRowElement[], width: number): string[] | null {
	const alignments: string[] = [];

	for (let column = 0; column < width; column++) {
		const values = new Set(rows.map(row => row.cells[column].style.textAlign || ''));
		if (values.size > 1) {
			return null;
		}
		const [value] = values;
		if (!(value in ALIGNMENT_MARKERS)) {
			return null;
		}
		alignments.push(value);
	}

	return alignments;
}

function cellToMarkdown(cell: HTMLTableCellElement, turndownService: TurndownService) {
	const content = cellContent(cell)!;
	const isEmpty = !(content.textContent || '').replace(/\u00a0/g, '').trim() && !content.querySelector('*:not(br)');

	if (isEmpty) {
		return '';
	}

	const wrapper = document.createElement('div');
	content.childNodes.forEach(node => wrapper.appendChild(node.cloneNode(true)));

	return turndownService.turndown(wrapper)
		.replace(/\s*\n\s*/g, ' ')
		.replace(/\|/g, '\\|')
		.trim();
}
