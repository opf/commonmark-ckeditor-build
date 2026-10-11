const embeddedTableSymbol = Symbol( 'isOPEmbeddedTable' );
import type { ViewDocumentSelection, ViewDowncastWriter, ViewElement } from '@ckeditor/ckeditor5-engine';
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget';

export function toEmbeddedTableWidget( viewElement: ViewElement, writer: ViewDowncastWriter, _label: unknown ) {
	writer.setCustomProperty( embeddedTableSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: 'your label here' } );
}


export function isEmbeddedTableWidget( viewElement: ViewElement ) {
	return !!viewElement.getCustomProperty( embeddedTableSymbol ) && isWidget( viewElement );
}


export function isEmbeddedTableWidgetSelected( selection: ViewDocumentSelection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isEmbeddedTableWidget( viewElement ) );
}
