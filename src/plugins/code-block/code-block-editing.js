import icon from './code-block.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {modelCodeBlockToView, viewCodeBlockToModel} from './converters';
import {registerEnterEditHandler, registerBackspaceHandler} from './keyboard-handlers';
import ModelPosition from '@ckeditor/ckeditor5-engine/src/model/position';
import ModelSelection from '@ckeditor/ckeditor5-engine/src/model/selection';
import ModelRange from '@ckeditor/ckeditor5-engine/src/model/range';

export default class CodeBlockEditing extends Plugin {

	static get pluginName() {
		return 'CodeBlockEditing';
	}

	init() {
		const editor = this.editor;
		const schema = editor.model.schema;
		const conversion = editor.conversion;

		// Insert newlines manually when pressing enter
		// within the code block
		registerEnterEditHandler(this, editor);

		// Remove the codeblock on backspace when the codeblock
		// is empty.
		registerBackspaceHandler(this, editor);

		// Escape from the code block when

		// Configure schema.
		schema.register('codeblock', {
			isObject: true,
			isBlock: true,
			allowContentOf: '$block',
			allowWhere: ['$root', '$block'],
			allowIn: ['$root'],
			allowAttributes: ['language']
		});

		conversion.for( 'upcast' )
			.add(viewCodeBlockToModel());

		conversion
			.for('editingDowncast')
			.add(modelCodeBlockToView());

		conversion
			.for('dataDowncast')
			.add(modelCodeBlockToView());

		editor.ui.componentFactory.add( 'insertCodeBlock', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: 'Insert code block', // TODO: Integration into t() ?
				icon: icon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				const modelSelection = editor.model.document.selection;
				const probe = new ModelSelection( modelSelection );
				const insertAt = findOptimalInsertionPosition(probe);

				 editor.model.change(writer => {
					const element = writer.createElement( 'codeblock' );
					const placeholder = writer.createText( '' );

					writer.insert(placeholder, element, 0);

					const targetSelection = new ModelSelection( [ new ModelRange( insertAt ) ] );
					editor.model.insertContent(element, targetSelection);
					// writer.insert( element, selectedElement, 'end' );
					// writer.setSelection( element, 'in' );
				})
			} );

			return view;
		} );
	}
}

export function findOptimalInsertionPosition( selection ) {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement ) {
		return ModelPosition.createAfter( selectedElement );
	}

	const firstBlock = selection.getSelectedBlocks().next().value;

	if ( firstBlock ) {
		// If inserting into an empty block – return position in that block. It will get
		// replaced with the image by insertContent(). #42.
		if ( firstBlock.isEmpty ) {
			return ModelPosition.createAt( firstBlock );
		}

		const positionAfter = ModelPosition.createAfter( firstBlock );

		// If selection is at the end of the block - return position after the block.
		if ( selection.focus.isTouching( positionAfter ) ) {
			return positionAfter;
		}

		// Otherwise return position before the block.
		return ModelPosition.createBefore( firstBlock );
	}

	return selection.focus;
}

