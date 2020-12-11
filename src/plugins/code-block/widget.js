import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';
import {toWidget, isWidget} from '@ckeditor/ckeditor5-widget/src/utils';
import {setContent} from './widget';

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
	const container = writer.createContainerElement(
		'pre',
		{
			title: window.I18n.t('js.editor.macro.toolbar_help')
		}
	);
	renderCodeBlockContent( writer, modelElement, container );

	return toCodeBlockWidget( container, writer, label );
}

export function renderCodeBlockContent( writer, modelElement, container ) {
	// Append language element
	const languageClass = modelElement.getAttribute( 'opCodeblockLanguage' ) || 'language-text';
	const language = languageClass.replace(/^language-/, '');
	const langElement = writer.createContainerElement( 'div', { class: 'op-ckeditor--code-block-language' } );
	setTextNode( writer, language, langElement, 'text' );
	writer.insert( writer.createPositionAt( container, 0 ), langElement );

	// Append code block content
	const content = modelElement.getAttribute( 'opCodeblockContent' );
	setTextNode( writer, content, container, '(empty)' );
}

export function setTextNode( writer, content, container, empty_text ) {
    const placeholder = writer.createText( content || empty_text );
    writer.insert( writer.createPositionAt( container, 0 ), placeholder );
}
