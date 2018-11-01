
/**
 * Remove paragraphs within lists since they will be stripped by CKEditor
 * https://community.openproject.com/work_packages/28765
 */
export function removeParagraphsInLists(root) {
	let walker = document.createNodeIterator(
		root,
		// Only consider element nodes
		NodeFilter.SHOW_ELEMENT,
		// Only except text nodes whose parent is one of parents
		  { acceptNode: function(node) {
			if ( node.tagName === 'P' && node.parentElement && node.parentElement.tagName === 'LI') {
			  return NodeFilter.FILTER_ACCEPT;
			}
		  }
		},
		false
	  );

	let node;
	while(node = walker.nextNode()) {
		node.outerHTML = node.innerHTML;
	}
}
