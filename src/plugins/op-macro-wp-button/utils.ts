const wpButtonMacroSymbol = Symbol( 'isWpButtonMacroSymbol' );
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget/src/utils';

export function toWpButtonMacroWidget( viewElement, writer, label ) {
	writer.setCustomProperty( wpButtonMacroSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: label });
}


export function isWpButtonMacroWidget( viewElement ) {
	return !!viewElement.getCustomProperty( wpButtonMacroSymbol ) && isWidget( viewElement );
}


export function isWpButtonMacroWidgetSelected( selection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isWpButtonMacroWidget( viewElement ) );
}
