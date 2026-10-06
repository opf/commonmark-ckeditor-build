import { Command } from '@ckeditor/ckeditor5-core';

/** The name under which {@link InsertMermaidCommand} is registered in the editor. */
export const INSERT_MERMAID_COMMAND = 'insertMermaidCommand';

const DEFAULT_MERMAID_MARKUP = `flowchart TB
A --> B
B --> C`;

/**
 * The insert mermaid command.
 *
 * Allows to insert mermaid.
 */
export default class InsertMermaidCommand extends Command {

	refresh() {
		const documentSelection = this.editor.model.document.selection;
		const selectedElement = documentSelection.getSelectedElement();

		this.isEnabled = !( selectedElement && selectedElement.name === 'mermaid' );
	}

	execute( options = {} ) {
		const model = this.editor.model;
		let mermaidItem;

		model.change( writer => {
			mermaidItem = writer.createElement( 'mermaid', {
				displayMode: options.displayMode ?? 'split',
				source: options.source ?? DEFAULT_MERMAID_MARKUP
			} );

			model.insertContent( mermaidItem );
		} );

		return mermaidItem;
	}
}
