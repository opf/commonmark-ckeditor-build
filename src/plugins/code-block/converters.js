import ModelPosition from '@ckeditor/ckeditor5-engine/src/model/position';
import ModelRange from '@ckeditor/ckeditor5-engine/src/model/range';
import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';

export function modelCodeBlockToView() {
	return dispatcher => {
		dispatcher.on( 'insert:codeblock', converter, { priority: 'high' } );
	};

	function converter( evt, data, conversionApi ) {
		const codeBlock = data.item;
		const language = codeBlock.getAttribute('language') || 'language-text';
		const content = codeBlock.getAttribute('content');

		// Consume the codeblock and text
		conversionApi.consumable.consume( codeBlock, 'insert' );

		// Wrap the element in a <pre> <code> block
		const viewWriter = conversionApi.writer;
		const preElement = viewWriter.createContainerElement( 'pre' );
		const langElement = viewWriter.createContainerElement( 'div', { class: 'op-ckeditor--code-block-language' } );
		const codeElement = viewWriter.createContainerElement( 'code', { class: language } );
		const langContent = viewWriter.createText( language );
		const contentElement = viewWriter.createText( content );

		viewWriter.insert( ViewPosition.createAt( codeElement ), contentElement );
		viewWriter.insert( ViewPosition.createAt( langElement ), langContent );
		viewWriter.insert( ViewPosition.createAt( preElement ), langElement );
		viewWriter.insert( ViewPosition.createAt( preElement ), codeElement );

		conversionApi.mapper.bindElements( codeBlock, codeElement );

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
		const codeBlock = Array.from( data.viewItem.getChildren() ).find( viewChild => viewChild.is( 'code' ) );

		// Do not convert if code block is absent
		if ( !codeBlock || !conversionApi.consumable.consume( codeBlock, { name: true } ) ) {
			return;
		}

		// Create the model element
		const modelCodeBlock = conversionApi.writer.createElement( 'codeblock' );
		conversionApi.writer.setAttribute( 'language', codeBlock.getAttribute('class'), modelCodeBlock );

		// Find allowed parent for paragraph that we are going to insert. If current parent does not allow
		// to insert paragraph but one of the ancestors does then split nodes to allowed parent.
		const splitResult = conversionApi.splitToAllowedParent( modelCodeBlock, data.modelCursor );

		// When there is no split result it means that we can't insert paragraph in this position.
		if ( splitResult ) {
			// Insert codeblock in allowed position.
			conversionApi.writer.insert( modelCodeBlock, splitResult.position );

			// Convert text child of codeblock
			// const { modelRange } = conversionApi.convertChildren( codeBlock, ModelPosition.createAt( modelCodeBlock ) );
			const child = codeBlock.getChild(0);
			conversionApi.consumable.consume( child, { name: true } );
			const content = child.data;
			conversionApi.writer.setAttribute( 'content',content, modelCodeBlock );

			// Set as conversion result, attribute converters may use this property.
			data.modelRange = new ModelRange(
				ModelPosition.createBefore( modelCodeBlock ),
				ModelPosition.createAfter( modelCodeBlock )
			);

			// Convert after pre element
			data.modelCursor = data.modelRange.end;
		}
	}
}
