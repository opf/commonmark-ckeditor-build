const childPagesMacroSymbol = Symbol( 'isWpButtonMacroSymbol' );
import type { ViewDocumentSelection, ViewDowncastWriter, ViewElement } from '@ckeditor/ckeditor5-engine';
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget';

export function toChildPagesMacroWidget( viewElement: ViewElement, writer: ViewDowncastWriter, label: string ) {
	writer.setCustomProperty( childPagesMacroSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: label });
}


export function isChildPagesMacroWidget( viewElement: ViewElement ) {
	return !!viewElement.getCustomProperty( childPagesMacroSymbol ) && isWidget( viewElement );
}


export function isChildPagesMacroWidgetSelected( selection: ViewDocumentSelection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isChildPagesMacroWidget( viewElement ) );
}
