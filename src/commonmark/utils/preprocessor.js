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
	while (node = walker.nextNode()) {
		// Strip NBSP whitespace in given nodes
		if (node.parentElement && allowed_whitespace_nodes.indexOf(node.parentElement.nodeName) >= 0) {
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

/**
 * Replace links of A elements with their computed .href attribute
 * https://community.ooject.com/wp/29742
 * @param {} root
 * @param {*} allowed_whitespace_nodes
 * @param {*} allowed_raw_nodes
 */
export function linkPreprocessor(root, _allowed_whitespace_nodes, _allowed_raw_nodes) {
	let walker = document.createNodeIterator(
		root,
		// Only consider element nodes
		NodeFilter.SHOW_ELEMENT,
		// Accept only A tags
		function (node) {
			return node.nodeName.toLowerCase() === 'a' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
		}
	);

	let node;
	while (node = walker.nextNode()) {
		// node.href is properly escaped, while the attribute is not
		// and turndown uses the getAttribute version
		node.setAttribute('href', node.href);
	}
}

export function breaksPreprocessor(root, _allowed_whitespace_nodes, _allowed_raw_nodes) {
	let walker = document.createNodeIterator(
		root,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node) {
				if (node.tagName === 'P' && node.childNodes.length === 0 && (!node.parentElement || node.parentElement.tagName === 'LI')) {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		}
	);

	let node;
	while (node = walker.nextNode()) {
		node.appendChild(document.createElement('br'));
	}
}

export function hasParentOfType(node, tagNames) {
	let parent = node.parentElement;

	while (parent) {
		if (tagNames.indexOf(parent.tagName) >= 0) {
			return true;
		}

		parent = parent.parentElement;
	}

	return false;
}
