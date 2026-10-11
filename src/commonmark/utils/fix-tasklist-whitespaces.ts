
/**
 * Remove multiple whitespaces in task list text nodes
 */
export function fixTasklistWhitespaces(root: Node) {
	let walker = document.createNodeIterator(
		root,
		// Only consider text nodes
		NodeFilter.SHOW_TEXT,
	  );

	// Text nodes do have previousElementSibling, but only CharacterData declares it.
	let node: CharacterData | null;
	while(node = walker.nextNode() as CharacterData | null) {
		// Remove duplicate whitespace in tasklists
		if (node.previousElementSibling
			&& node.previousElementSibling.classList.contains('task-list-item-checkbox')) {
			node.textContent = node.textContent!.replace(/^\s+/, '');
		}
	}
}
