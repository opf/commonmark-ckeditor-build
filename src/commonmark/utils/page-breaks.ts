
export const PAGE_BREAK_MARKDOWN = '<br style="page-break-after:always;">';
export function isPageBreakNode(node) {
	const style = node.getAttribute('style') || '';
	return style.includes('page-break-');
}
