const childPagesMacroSymbol = Symbol( 'isWpButtonMacroSymbol' );
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget/src/utils';

export function toChildPagesMacroWidget( viewElement, writer, label ) {
	writer.setCustomProperty( childPagesMacroSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: label });
}


export function isChildPagesMacroWidget( viewElement ) {
	return !!viewElement.getCustomProperty( childPagesMacroSymbol ) && isWidget( viewElement );
}


export function isChildPagesMacroWidgetSelected( selection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isChildPagesMacroWidget( viewElement ) );
}
