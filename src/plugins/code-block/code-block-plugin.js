import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import Text from '@ckeditor/ckeditor5-engine/src/view/text';
import first from '@ckeditor/ckeditor5-utils/src/first';
import ModelPosition from '@ckeditor/ckeditor5-engine/src/model/position';

export default class CodeBlockPlugin extends Plugin {
	static get pluginName() {
		return 'CodeBlock';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;
		const conversion = editor.conversion;

		// Configure schema.
		schema.register('codeblock', {
			isObject: true,
			isBlock: true,
			allowWhere: ['$block', '$root'],
			allowContentOf: ['$text'],
			allowAttributes: ['language']
		});

		conversion
			.for( 'upcast' )
			.add(viewCodeBlockToModel());

		conversion
			.for('editingDowncast')
			.add(modelCodeBlockToView());

		conversion
			.for('dataDowncast')
			.add(modelCodeBlockToView());
	}
}

export function toCodeBlock(modelElement, viewWriter) {
	const emptyElement = writer.createEmptyElement( 'code' );
	const figure = writer.createContainerElement( 'pre', { class: 'language-TODO' } );

	writer.insert( ViewPosition.createAt( figure ), emptyElement );

	return figure;
}

export function modelCodeBlockToView() {
	return dispatcher => {
		dispatcher.on( 'insert:codeblock', converter, { priority: 'high' } );
	};

	function converter( evt, data, conversionApi ) {
		// We require the codeblock to have a single text node.
		if ( data.item.childCount === 0 ) {
			return;
		}

		const codeBlock = data.item;
		const codeContent = codeBlock.getChild(0);

		// Consume the codeblock and text
		conversionApi.consumable.consume( codeBlock, 'insert' );
		conversionApi.consumable.consume( codeContent, 'insert' );


		// Wrap the element in a <pre> <code> block
		const textElement = new Text( codeContent.data );
		const codeElement = new ViewElement( 'code', {}, textElement );
		const preElement = new ViewElement( 'pre', { class: 'language-TODO' } , codeElement );

		conversionApi.mapper.bindElements( codeBlock, preElement );

		// Insert at matching position
		const insertPosition = conversionApi.mapper.toViewPosition( data.range.start );
		conversionApi.writer.insert( insertPosition, preElement );

		evt.stop();
	}
}

export function viewCodeBlockToModel() {
	return dispatcher => {
		dispatcher.on( 'element:pre', converter );
	};

	function converter( evt, data, conversionApi ) {
		// Do not convert if we cannot consume the parent element
		if ( !conversionApi.consumable.test( data.viewItem, { name: true } ) ) {
			return;
		}

		// Find an code element inside the pre element.
		const codeBlock = Array.from( data.viewItem.getChildren() ).find( viewChild => viewChild.is( 'code' ) );

		// Ignore pre tags without code blocks
		if ( !codeBlock ) {
			return;
		}

		// Do not convert if we cannot consume the pre element
		if ( !(conversionApi.consumable.consume( data.viewItem, { name: true } )) ) {
			return;
		}

		// Convert view block to model block.
		const conversionResult = conversionApi.convertItem( codeBlock, data.modelCursor );

		// Get image element from conversion result.
		const modelCodeBlock = first( conversionResult.modelRange.getItems() );

		// When image wasn't successfully converted then finish conversion.
		if ( !modelCodeBlock ) {
			return;
		}

		// Convert rest of the codeblock element's children as an image children.
		conversionApi.convertChildren( codeBlock, ModelPosition.createAt( modelCodeBlock ) );

		// Set image range as conversion result.
		data.modelRange = conversionResult.modelRange;

		// Continue conversion where image conversion ends.
		data.modelCursor = conversionResult.modelCursor;

		evt.stop();
	}
}
