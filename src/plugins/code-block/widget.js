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
	const content = modelElement.getAttribute('content')
	const placeholder = writer.createText( content );
	const container = writer.createContainerElement( 'div', { class: 'op-ckeditor--code-block' } );

	writer.insert( ViewPosition.createAt( container ), placeholder );
	return toCodeBlockWidget( container, writer, label );

	// The following doesnt work when removing the widget...
	// let that = this;
	// return writer.createUIElement( 'div', { class: 'macro -embedded-table' }, function(containerDocument) {
	// 	const containerElement = this.toDomElement(containerDocument);
	// 	containerElement.innerHTML = imageIcon + '<div class="macro--description">' + that.text.macro_text + '</div>';

	// 	return containerElement;
	// } );
}
