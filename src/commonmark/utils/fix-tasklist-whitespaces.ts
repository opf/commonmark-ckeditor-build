
/**
 * Remove multiple whitespaces in task list text nodes
 */
export function fixTasklistWhitespaces(root) {
	let walker = document.createNodeIterator(
		root,
		// Only consider text nodes
		NodeFilter.SHOW_TEXT,
	  );

	let node;
	while(node = walker.nextNode()) {
		// Remove duplicate whitespace in tasklists
		if (node.previousElementSibling
			&& node.previousElementSibling.classList.contains('task-list-item-checkbox')) {
			node.textContent = node.textContent.replace(/^\s+/, '');
		}
	}
}
