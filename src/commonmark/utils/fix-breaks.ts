import {isPageBreakNode} from "./page-breaks";

/**
 * Remove breaks in empty table paragraphs
 *
 * CKEditor adds a superfluous break for paragraphs in tables containing only a break
 * e.g. `<td><p>Demo<p><p><br></p><p>End</p></td>` converted to `<td><p>Demo<p><p><br><br data-ck-filler="true"></p><p>End</p></td>`
 * to avoid this, we remove the breaks, so CKEditor can add `<br data-ck-filler="true">`
 * e.g. `<td><p>Demo<p><p><br></p><p>End</p></td>` converted to `<td><p>Demo<p><p><br data-ck-filler="true"></p><p>End</p></td>` */
export function fixBreaksInTables(root:Node) {
	const walker = document.createNodeIterator(
		root,
		// Only consider element nodes
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node:Node) {
				if (!(node instanceof Element)) {
					return NodeFilter.FILTER_REJECT;
				}

				const onlyBreak = node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR';
				if (node.tagName === 'P' && node.parentElement?.tagName === 'TD' && onlyBreak) {
					return NodeFilter.FILTER_ACCEPT;
				}

				return NodeFilter.FILTER_REJECT;
			}
		}
	);

	let node:Node | null;
	while ((node = walker.nextNode())) {
		node.firstChild?.remove();
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
export function fixBreaksOnRootLevel(root:Node) {
	const walker = document.createNodeIterator(
		root,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node:Node) {
				if (node instanceof Element && node.tagName === 'BR' && !node.parentElement) {
					return NodeFilter.FILTER_ACCEPT;
				}

				return NodeFilter.FILTER_REJECT;
			}
		}
	);

	const list:Node[] = [];
	let node:Node | null;
	while ((node = walker.nextNode())) {
		list.push(node);
	}
	for (const breakNode of list) {
		const paragraph = document.createElement('p');
		root.insertBefore(paragraph, breakNode);
		if (breakNode instanceof Element && isPageBreakNode(breakNode)) {
			paragraph.appendChild(breakNode);
		} else {
			breakNode.parentNode?.removeChild(breakNode);
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
export function fixBreaksInLists(root:Node) {
	const walker = document.createNodeIterator(
		root,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode: function (node:Node) {
				if (node instanceof Element && node.tagName === 'BR' && node.parentElement?.tagName === 'LI') {
					return NodeFilter.FILTER_ACCEPT;
				}

				return NodeFilter.FILTER_REJECT;
			}
		}
	);

	const list:Node[] = [];
	let node:Node | null;
	while ((node = walker.nextNode())) {
		list.push(node);
	}
	for (const breakNode of list) {
		breakNode.parentElement?.insertBefore(document.createElement('p'), breakNode);
		breakNode.parentNode?.removeChild(breakNode);
	}
}
