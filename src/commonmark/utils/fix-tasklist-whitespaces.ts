/**
 * Remove multiple whitespaces in task list text nodes
 */
export function fixTasklistWhitespaces(root:Node) {
	let walker = document.createNodeIterator(
		root,
		// Only consider text nodes
		NodeFilter.SHOW_TEXT,
	  );

	let node:Text|null;
	while((node = walker.nextNode() as Text | null)) {
		// Remove duplicate whitespace in tasklists
		if (node.previousElementSibling
			&& node.previousElementSibling.classList.contains('task-list-item-checkbox')) {
			node.textContent = (node.textContent || '').replace(/^\s+/, '');
		}
	}
}
