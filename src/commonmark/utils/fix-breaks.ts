import {isPageBreakNode} from "./page-breaks";

// The filters below return undefined for nodes they do not accept, which the
// DOM treats like FILTER_SKIP but NodeFilter's typing does not allow.

/**
 * Remove breaks in empty table paragraphs
 *
 * CKEditor adds a superfluous break for paragraphs in tables containing only a break
 * e.g. `<td><p>Demo<p><p><br></p><p>End</p></td>` converted to `<td><p>Demo<p><p><br><br data-ck-filler="true"></p><p>End</p></td>`
 * to avoid this, we remove the breaks, so CKEditor can add `<br data-ck-filler="true">`
 * e.g. `<td><p>Demo<p><p><br></p><p>End</p></td>` converted to `<td><p>Demo<p><p><br data-ck-filler="true"></p><p>End</p></td>` */
export function fixBreaksInTables(root: Node) {
	const walker = document.createNodeIterator(
		root,
		// Only consider element nodes
		NodeFilter.SHOW_ELEMENT,
		// Only except text nodes whose parent is one of parents
		{
			acceptNode: function (node: Element) {
				if (node.tagName === 'P' && node.parentElement &&
					node.parentElement.tagName === 'TD' &&
					(node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR')) {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		} as NodeFilter
	);

	let node: Node | null;
	while (node = walker.nextNode()) {
		node.childNodes[0].remove();
	}
}

/**
 * Converts root level breaks into paragraphs
 *
 * CKEditor creates a paragraph for all consecutive breaks at the root level and adds an own filler break element
 * e.g. `<p>Demo<p><br><br><p>End</p>` converted to `<p>Demo</p><p><br><br><br data-ck-filler="true"><p>End</p>`
 * to avoid these, we exchange all root level breaks with paragraphs
 * e.g. `<p>Demo<p><br><br><p>End</p>` will be converted to `<p>Demo</p><p></p><p></p><p>End</p>`
 * (except for page breaks, which are kept but are wrapped in a paragraph)
 */
export function fixBreaksOnRootLevel(root: Node) {
	let walker = document.createNodeIterator(
		root,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node: Element) {
				if (node.tagName === 'BR' && !node.parentElement) {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		} as NodeFilter
	);

	let node: Element | null;
	let list: Element[] = []
	while (node = walker.nextNode() as Element | null) {
		list.push(node);
	}
	for (const node of list) {
		const p = document.createElement('p');
		root.insertBefore(p, node);
		if (isPageBreakNode(node)) {
			p.appendChild(node);
		} else {
			node.remove();
		}
	}
}

/**
 * Converts breaks in lists into paragraphs
 *
 * CKEditor creates a paragraph for all consecutive breaks and adds an own filler break element
 * e.g. `<li><p>Start</p><br><br><p>End</p></li>` converted to
 * `<li><p>Demo</p><p><br><br><br data-ck-filler="true"></p><p>End</p>`
 * to avoid these, we exchange all root level breaks with paragraphs
 * e.g. `<li><p>Start</p><br><br><p>End</p></li>` will be converted to
 * `<li><p>Start</p><p></p><p></p><p>End</p></li>>`
 */
export function fixBreaksInLists(root: Node) {
	const walker = document.createNodeIterator(
		root,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node: Element) {
				if (node.tagName === 'BR' && node.parentElement && node.parentElement.tagName === 'LI') {
					return NodeFilter.FILTER_ACCEPT;
				}
			}
		} as NodeFilter
	);

	let node: Element | null;
	let list: Element[] = []
	while (node = walker.nextNode() as Element | null) {
		list.push(node);
	}
	for (const node of list) {
		node.parentElement!.insertBefore(document.createElement('p'), node);
		node.remove();
	}
}
