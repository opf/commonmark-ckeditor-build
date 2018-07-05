const wikiIncludeMacroSymbol = Symbol( 'isWpButtonMacroSymbol' );
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget/src/utils';

export function toWikiIncludeMacroWidget( viewElement, writer, label ) {
	writer.setCustomProperty( wikiIncludeMacroSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: label });
}


export function isWikiIncludeMacroWidget( viewElement ) {
	return !!viewElement.getCustomProperty( wikiIncludeMacroSymbol ) && isWidget( viewElement );
}


export function isWikiIncludeMacroWidgetSelected( selection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isWikiIncludeMacroWidget( viewElement ) );
}
