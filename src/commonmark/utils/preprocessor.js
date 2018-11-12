
/**
 * Replace whitespace of text nodes within the given parents in the given root element.
 * @param {*} root An HTMLElement to look for text nodes within
 * @param {*} allowed_whitespace_nodes String array of allowed text nodes ( ['STRONG', 'EM'] ... )
 * @param {*} allowed_raw_nodes String array of allowed raw text nodes ( ['PRE', 'CODE'] ... )
 */
export function textNodesPreprocessor(root, allowed_whitespace_nodes, allowed_raw_nodes) {
	allowed_whitespace_nodes = allowed_whitespace_nodes.map(el => el.toUpperCase());
	allowed_raw_nodes = allowed_raw_nodes.map(el => el.toUpperCase());

	let walker = document.createNodeIterator(
		root,
		// Only consider text nodes
		NodeFilter.SHOW_TEXT,
	  );

	let node;
	while(node = walker.nextNode()) {
		// Strip NBSP whitespace in given nodes
		if ( node.parentElement && allowed_whitespace_nodes.indexOf(node.parentElement.nodeName) >= 0) {
		node.nodeValue = node.nodeValue
			.replace(/^[\u00a0]+/g, ' ')
			.replace(/[\u00a0]+$/g, ' ');
		}

		// Re-encode < and > that would otherwise be output as HTML by turndown
		// https://github.com/domchristie/turndown/issues/106
		if (!hasParentOfType(node, allowed_raw_nodes)) {
			node.nodeValue = _.escape(node.nodeValue);
		}
	}
}

export function hasParentOfType(node, tagNames) {
	let parent = node.parentElement;

	while (parent) {
		console.log(parent.tagName);
		if (tagNames.indexOf(parent.tagName) >= 0) {
			return true;
		}

		parent = parent.parentElement;
	}

	return false;
}
