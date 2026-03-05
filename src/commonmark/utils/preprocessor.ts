/**
 * Replace whitespace of text nodes within the given parents in the given root element.
 * @param {*} root An HTMLElement to look for text nodes within
 * @param {*} allowed_whitespace_nodes String array of allowed text nodes ( ['STRONG', 'EM'] ... )
 * @param {*} allowed_raw_nodes String array of allowed raw text nodes ( ['PRE', 'CODE'] ... )
 */
export function textNodesPreprocessor(root:Node, allowed_whitespace_nodes:string[], allowed_raw_nodes:string[], _unused:string[] = []) {
	allowed_whitespace_nodes = allowed_whitespace_nodes.map(el => el.toUpperCase());
	allowed_raw_nodes = allowed_raw_nodes.map(el => el.toUpperCase());

	const walker = document.createNodeIterator(
		root,
		// Only consider text nodes
		NodeFilter.SHOW_TEXT,
	);

	let node:Node | null;
	while ((node = walker.nextNode())) {
		const textNode = node as Text;
		const value = textNode.nodeValue ?? '';

		// Strip NBSP whitespace in given nodes
		if (textNode.parentElement && allowed_whitespace_nodes.includes(textNode.parentElement.nodeName)) {
			textNode.nodeValue = value
				.replace(/^[\u00a0]+/g, ' ')
				.replace(/[\u00a0]+$/g, ' ');
		}

		// Re-encode < and > that would otherwise be output as HTML by turndown
		// https://github.com/domchristie/turndown/issues/106
		if (!hasParentOfType(textNode, allowed_raw_nodes)) {
			textNode.nodeValue = _.escape(textNode.nodeValue ?? '');
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
export function linkPreprocessor(root:Node, _allowed_whitespace_nodes:string[], _allowed_raw_nodes:string[]) {
	const walker = document.createNodeIterator(
		root,
		// Only consider element nodes
		NodeFilter.SHOW_ELEMENT,
		// Accept only A tags
		function (node:Node) {
			return node instanceof HTMLAnchorElement ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
		}
	);

	let node:Node | null;
	while ((node = walker.nextNode())) {
		const link = node as HTMLAnchorElement;
		// node.href is properly escaped, while the attribute is not
		// and turndown uses the getAttribute version
		link.setAttribute('href', link.href);
	}
}

export function breaksPreprocessor(root:Node, _allowed_whitespace_nodes:string[], _allowed_raw_nodes:string[]) {
	const walker = document.createNodeIterator(
		root,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node:Node) {
				if (node instanceof Element
					&& node.tagName === 'P'
					&& node.childNodes.length === 0
					&& (!node.parentElement || node.parentElement.tagName === 'LI')) {
					return NodeFilter.FILTER_ACCEPT;
				}

				return NodeFilter.FILTER_REJECT;
			}
		}
	);

	let node:Node | null;
	while ((node = walker.nextNode())) {
		node.appendChild(document.createElement('br'));
	}
}

export function hasParentOfType(node:Node, tagNames:string[]) {
	let parent = node.parentElement;

	while (parent) {
		if (tagNames.includes(parent.tagName)) {
			return true;
		}

		parent = parent.parentElement;
	}

	return false;
}
