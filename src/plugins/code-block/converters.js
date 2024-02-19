import { Range } from '@ckeditor/ckeditor5-engine';
import {renderCodeBlockContent} from './widget';


export function modelCodeBlockToView() {
	return dispatcher => {
		dispatcher.on( 'insert:codeblock', converter, { priority: 'high' } );
	};

	function converter( evt, data, conversionApi ) {
		const codeBlock = data.item;
		const language = codeBlock.getAttribute('opCodeblockLanguage') || 'language-text';
		const content = codeBlock.getAttribute('opCodeblockContent');

		// Consume the codeblock and text
		conversionApi.consumable.consume( codeBlock, 'insert' );

		// Wrap the element in a <pre> <code> block
		const viewWriter = conversionApi.writer;
		const preElement = viewWriter.createContainerElement( 'pre' );
		const langElement = viewWriter.createContainerElement( 'div', { class: 'op-uc-code-block--language' } );
		const codeElement = viewWriter.createContainerElement( 'code', { class: language } );
		const langContent = viewWriter.createText( language );
		const contentElement = viewWriter.createText( content );

		viewWriter.insert( viewWriter.createPositionAt( codeElement, 0 ), contentElement );
		viewWriter.insert( viewWriter.createPositionAt( langElement, 0 ), langContent );
		viewWriter.insert( viewWriter.createPositionAt( preElement, 0 ), langElement );
		viewWriter.insert( viewWriter.createPositionAt( preElement, 0 ), codeElement );

		conversionApi.mapper.bindElements( codeBlock, codeElement );
		conversionApi.mapper.bindElements( codeBlock, preElement );
		conversionApi.mapper.bindElements( codeBlock, langElement );

		// Insert at matching position
		const insertPosition = conversionApi.mapper.toViewPosition( data.range.start );
		viewWriter.insert( insertPosition, preElement );

		evt.stop();
	}
}

export function viewCodeBlockToModel() {
	return dispatcher => {
		dispatcher.on( 'element:pre', converter, { priority: 'high' } );
	};

	function converter( evt, data, conversionApi ) {
		// Do not convert if this is not an "image figure".
		if ( !conversionApi.consumable.test( data.viewItem, { name: true } ) ) {
			return;
		}

		// Find an code element inside the pre element.
		const codeBlock = Array.from( data.viewItem.getChildren() ).find( viewChild => viewChild.is('element', 'code'));

		// Do not convert if code block is absent
		if ( !codeBlock || !conversionApi.consumable.consume( codeBlock, { name: true } ) ) {
			return;
		}

		// Create the model element
		const modelCodeBlock = conversionApi.writer.createElement( 'codeblock' );
		conversionApi.writer.setAttribute( 'opCodeblockLanguage', codeBlock.getAttribute('class'), modelCodeBlock );

		// Find allowed parent for paragraph that we are going to insert. If current parent does not allow
		// to insert paragraph but one of the ancestors does then split nodes to allowed parent.
		const splitResult = conversionApi.splitToAllowedParent( modelCodeBlock, data.modelCursor );

		// When there is no split result it means that we can't insert paragraph in this position.
		if ( splitResult ) {
			// Insert codeblock in allowed position.
			conversionApi.writer.insert( modelCodeBlock, splitResult.position );

			// Convert text child of codeblock
			const child = codeBlock.getChild(0);
			conversionApi.consumable.consume( child, { name: true } );
			// Replace last newline since that text is incorrectly mapped
			// Regression OP#28609
			const content = child.data.replace(/\n$/, "");
			conversionApi.writer.setAttribute( 'opCodeblockContent', content, modelCodeBlock );

			// Set as conversion result, attribute converters may use this property.
			data.modelRange = new Range(
				conversionApi.writer.createPositionBefore( modelCodeBlock ),
				conversionApi.writer.createPositionAfter( modelCodeBlock )
			);

			// Convert after pre element
			data.modelCursor = data.modelRange.end;
		}
	}
}


export function codeBlockContentToView() {
	return dispatcher => {
		dispatcher.on( 'attribute:opCodeblockContent', converter );
		dispatcher.on( 'attribute:opCodeblockLanguage', converter );
	};

	function converter( evt, data, conversionApi ) {
        const modelElement = data.item;

        // Mark element as consumed by conversion.
        conversionApi.consumable.consume( data.item, evt.name );

        // Get mapped view element to update.
        const viewElement = conversionApi.mapper.toViewElement( modelElement );

        // Remove current <div> element contents.
        conversionApi.writer.remove( conversionApi.writer.createRangeOn( viewElement.getChild( 1 ) ) );
        conversionApi.writer.remove( conversionApi.writer.createRangeOn( viewElement.getChild( 0 ) ) );

		// Set current content
		renderCodeBlockContent( conversionApi.writer, modelElement, viewElement );
	}
}
