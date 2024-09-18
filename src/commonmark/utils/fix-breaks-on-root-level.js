/**
 * Converts root level breaks into paragraphs
 *
 * CKEditor creates a paragraph for all consecutive breaks at the root level and adds an own filler break element
 * e.g. `<p>Demo<p><br><br><p>End</p>` converted to `<p>Demo</p><p><br><br><br data-ck-filler="true"><p>End</p>`
 * to avoid these, we exchange all root level breaks with paragraphs
 * e.g. `<p>Demo<p><br><br><p>End</p>` will be converted to `<p>Demo</p><p></p><p></p><p>End</p>`
 */
export function fixBreaksOnRootLevel(root) {
	let walker = document.createNodeIterator(
		root,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node) {
				if (node.tagName === 'BR' && !node.parentElement) {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		}
	);

	let node;
	let list = []
	while (node = walker.nextNode()) {
		list.push(node);
	}
	for (const node of list) {
		root.insertBefore(document.createElement('p'), node);
		node.remove();
	}
}
