const wpButtonMacroSymbol = Symbol( 'isWpButtonMacroSymbol' );
import type { ViewDocumentSelection, ViewDowncastWriter, ViewElement } from '@ckeditor/ckeditor5-engine';
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget';

export function toWpButtonMacroWidget( viewElement: ViewElement, writer: ViewDowncastWriter, label: string ) {
	writer.setCustomProperty( wpButtonMacroSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: label });
}


export function isWpButtonMacroWidget( viewElement: ViewElement ) {
	return !!viewElement.getCustomProperty( wpButtonMacroSymbol ) && isWidget( viewElement );
}


export function isWpButtonMacroWidgetSelected( selection: ViewDocumentSelection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isWpButtonMacroWidget( viewElement ) );
}
