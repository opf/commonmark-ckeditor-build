/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

export function debounce( fn, waitMs ) {
	let timeout = null;

	return function( ...args ) {
		if ( timeout ) {
			clearTimeout( timeout );
		}

		timeout = setTimeout( () => fn.apply( this, args ), waitMs );
	};
}

/**
 * Helper function for setting the `isOn` state of buttons.
 *
 * @param commandName Short name of the command.
 */
export function checkIsOn( editor, commandName ) {
	const selection = editor.model.document.selection;
	const mermaidItem = selection.getSelectedElement() || selection.getLastPosition()?.parent;

	return !!mermaidItem &&
		mermaidItem.is( 'element', 'mermaid' ) &&
		mermaidItem.getAttribute( 'displayMode' ) === commandName;
}
