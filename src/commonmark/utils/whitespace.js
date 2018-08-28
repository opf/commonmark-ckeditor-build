
/**
 * Replace whitespace of text nodes within the given parents in the given root element.
 * @param {*} root An HTMLElement to look for text nodes within
 * @param {*} allowed_parents String array of allowed text nodes ( ['STRONG', 'EM'] ... )
 */
export function replaceWhitespaceWithin(root, allowed_parents) {
	allowed_parents = allowed_parents.map(el => el.toUpperCase());

	let walker = document.createNodeIterator(
		root,
		// Only consider text nodes
		NodeFilter.SHOW_TEXT,
		// Only except text nodes whose parent is one of parents
		  { acceptNode: function(node) {
			if ( node.parentElement && allowed_parents.indexOf(node.parentElement.nodeName) >= 0) {
			  return NodeFilter.FILTER_ACCEPT;
			}
		  }
		},
		false
	  );

	let node;
	while(node = walker.nextNode()) {
		node.nodeValue = node.nodeValue
			.replace(/^[\u00a0]+/g, ' ')
			.replace(/[\u00a0]+$/g, ' ');
	}
}
