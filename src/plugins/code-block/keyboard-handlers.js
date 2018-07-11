export function registerEnterEditHandler(plugin, editor) {
	const view = editor.editing.view;
	const viewDocument = view.document;

	plugin.listenTo(
		viewDocument,
		'enter',
		( evt, data ) => {
			if ( data.domEvent.keyCode !== 13 ) {
				return;
			}

			// Test if we're within the codeblock
			const selection = editor.model.document.selection;

			if ( !getCodeBlockWithin(selection.getFirstPosition()) ) {
				return;
			}

			editor.execute( 'input', { text: '\n' } );
			data.preventDefault();
		},
		{ priority: 'highest' }
	);
}

export function registerBackspaceHandler(plugin, editor) {
	const view = editor.editing.view;
	const viewDocument = view.document;

	viewDocument.on(
		'keydown',
		( evt, data ) => {
			if ( data.domEvent.keyCode !== 8 ) {
				return;
			}

			// Test if we're within the codeblock
			const selection = editor.model.document.selection;
			const codeBlock = getCodeBlockWithin(selection.getFirstPosition());

			// Test if the codeblock is empty
			if (!(codeBlock && codeBlock.isEmpty)) {
				return;
			}

			editor.model.enqueueChange( writer => writer.remove(codeBlock) );
			data.preventDefault();
		},
		{ priority: 'highest' }
	);
}

export function getCodeBlockWithin( position ) {
	let parent = position.parent;

	while ( parent ) {
		if ( parent.name === 'codeblock' ) {
			return parent;
		}

		parent = parent.parent;
	}

	return null;
}
