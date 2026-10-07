import type {
	ModelElement,
	ViewContainerElement,
	ViewDocumentSelection,
	ViewDowncastWriter,
	ViewElement,
} from '@ckeditor/ckeditor5-engine';
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget';

const codeBlockSymbol = Symbol( 'isOPCodeBlock' );

export function toCodeBlockWidget( viewElement: ViewElement, writer: ViewDowncastWriter, label: string ) {
	writer.setCustomProperty( codeBlockSymbol, true, viewElement );
	return toWidget( viewElement, writer, { label: label } );
}


export function isCodeBlockWidget( viewElement: ViewElement ) {
	return !!viewElement.getCustomProperty( codeBlockSymbol ) && isWidget( viewElement );
}


export function isCodeBlockWidgetSelected( selection: ViewDocumentSelection ) {
	const viewElement = selection.getSelectedElement();

	return !!( viewElement && isCodeBlockWidget( viewElement ) );
}

export function createCodeBlockWidget( modelElement: ModelElement, writer: ViewDowncastWriter, label: string ) {
	const container = writer.createContainerElement(
		'pre',
		{
			title: window.I18n.t('js.editor.macro.toolbar_help')
		}
	);
	renderCodeBlockContent( writer, modelElement, container );

	return toCodeBlockWidget( container, writer, label );
}

export function renderCodeBlockContent( writer: ViewDowncastWriter, modelElement: ModelElement, container: ViewContainerElement ) {
	// Append language element
	const languageClass = modelElement.getAttribute( 'opCodeblockLanguage' ) as string | undefined || 'language-text';
	const language = languageClass.replace(/^language-/, '');
	const langElement = writer.createContainerElement( 'div', { class: 'op-uc-code-block--language' } );
	setTextNode( writer, language, langElement, 'text' );
	writer.insert( writer.createPositionAt( container, 0 ), langElement );

	// Append code block content
	const content = modelElement.getAttribute( 'opCodeblockContent' ) as string | undefined;
	setTextNode( writer, content, container, '(empty)' );
}

export function setTextNode( writer: ViewDowncastWriter, content: string | undefined, container: ViewContainerElement, empty_text: string ) {
    const placeholder = writer.createText( content || empty_text );
    writer.insert( writer.createPositionAt( container, 0 ), placeholder );
}
