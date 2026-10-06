import { Command } from '@ckeditor/ckeditor5-core';
import { checkIsOn } from './utils';

/**
 * Switches the selected mermaid widget to the split view mode.
 */
export default class MermaidSplitViewCommand extends Command {

	refresh() {
		const editor = this.editor;
		const documentSelection = editor.model.document.selection;
		const selectedElement = documentSelection.getSelectedElement();
		const isSelectedElementMermaid = selectedElement && selectedElement.name === 'mermaid';

		if ( isSelectedElementMermaid || documentSelection.getLastPosition()?.findAncestor( 'mermaid' ) ) {
			this.isEnabled = !!selectedElement;
		} else {
			this.isEnabled = false;
		}

		this.value = checkIsOn( editor, 'split' );
	}

	execute() {
		const model = this.editor.model;
		// `mermaid` is an object element, so the selection is always *on* it - never inside.
		const mermaidItem = this.editor.model.document.selection.getSelectedElement();

		if ( !mermaidItem ) {
			return;
		}

		model.change( writer => {
			if ( mermaidItem.getAttribute( 'displayMode' ) !== 'split' ) {
				writer.setAttribute( 'displayMode', 'split', mermaidItem );
			}
		} );
	}
}
