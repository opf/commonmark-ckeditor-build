/**
 * Remove breaks in empty table paragraphs
 *
 * CKEditor adds a superfluous break for paragraphs in tables containing only a break
 * e.g. `<td><p>Demo<p><p><br></p><p>End</p></td>` converted to `<td><p>Demo<p><p><br><br data-ck-filler="true"></p><p>End</p></td>`
 * to avoid this, we remove the breaks, so CKEditor can add `<br data-ck-filler="true">`
 * e.g. `<td><p>Demo<p><p><br></p><p>End</p></td>` converted to `<td><p>Demo<p><p><br data-ck-filler="true"></p><p>End</p></td>` */
export function fixBreaksInTableParagraphs(root) {
	const walker = document.createNodeIterator(
		root,
		// Only consider element nodes
		NodeFilter.SHOW_ELEMENT,
		// Only except text nodes whose parent is one of parents
		{
			acceptNode: function (node) {
				if (node.tagName === 'P' && node.parentElement &&
					node.parentElement.tagName === 'TD' &&
					(node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR')) {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		}
	);

	let node;
	while (node = walker.nextNode()) {
		node.childNodes[0].remove();
	}
}
