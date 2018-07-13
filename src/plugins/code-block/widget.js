import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget/src/utils';

const codeBlockSymbol = Symbol( 'isOPCodeBlock' );

export function toCodeBlockWidget( viewElement, writer, label ) {
	writer.setCustomProperty( codeBlockSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: label } );
}


export function isCodeBlockWidget( viewElement ) {
	return !!viewElement.getCustomProperty( codeBlockSymbol ) && isWidget( viewElement );
}


export function isCodeBlockWidgetSelected( selection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isCodeBlockWidget( viewElement ) );
}

export function createCodeBlockWidget( modelElement, writer, label ) {
	const content = modelElement.getAttribute( 'content' );
	const languageClass = modelElement.getAttribute( 'language' ) || 'language-text';
	const language = languageClass.replace(/^language-/, '');

	const contentElement = writer.createText( content );
	const container = writer.createContainerElement( 'div', { class: 'op-ckeditor--code-block' } );

	const langElement = writer.createContainerElement( 'div', { class: 'op-ckeditor--code-block-language' } );
	const langContent = writer.createText( language );

	writer.insert( ViewPosition.createAt( langElement ), langContent );
	writer.insert( ViewPosition.createAt( container ), langElement );
	writer.insert( ViewPosition.createAt( container ), contentElement );

	return toCodeBlockWidget( container, writer, label );
}
