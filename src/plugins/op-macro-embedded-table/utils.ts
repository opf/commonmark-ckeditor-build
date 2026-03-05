const embeddedTableSymbol = Symbol( 'isOPEmbeddedTable' );
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget/src/utils';

export function toEmbeddedTableWidget( viewElement, writer, _label ) {
	writer.setCustomProperty( embeddedTableSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: 'your label here' } );
}


export function isEmbeddedTableWidget( viewElement ) {
	return !!viewElement.getCustomProperty( embeddedTableSymbol ) && isWidget( viewElement );
}


export function isEmbeddedTableWidgetSelected( selection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isEmbeddedTableWidget( viewElement ) );
}
