
/**
 * Empty code blocks break CKEditor so fix them for now
 * https://community.openproject.com/work_packages/31749
 */
export function fixEmptyCodeBlocks(root) {
	let walker = document.createNodeIterator(
		root,
		// Only consider element nodes
		NodeFilter.SHOW_ELEMENT,
		// Only except text nodes whose parent is one of parents
		  { acceptNode: function(node) {
			if ( node.tagName === 'CODE' && node.parentElement && node.parentElement.tagName === 'PRE') {
			  return NodeFilter.FILTER_ACCEPT;
			}
		  }
		},
		false
	  );

	let node;
	while(node = walker.nextNode()) {
		if (node.children.length === 0 && !node.textContent) {
			node.textContent = "\n"
		}
	}
}
