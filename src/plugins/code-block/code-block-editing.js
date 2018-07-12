import icon from '../../icons/code-block.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {modelCodeBlockToView, viewCodeBlockToModel} from './converters';
import {registerEnterEditHandler, registerBackspaceHandler} from './keyboard-handlers';
import ModelPosition from '@ckeditor/ckeditor5-engine/src/model/position';
import ModelSelection from '@ckeditor/ckeditor5-engine/src/model/selection';
import ModelRange from '@ckeditor/ckeditor5-engine/src/model/range';
import {downcastElementToElement} from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import {createCodeBlockWidget} from './widget';

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
		// registerEnterEditHandler(this, editor);

		// Remove the codeblock on backspace when the codeblock
		// is empty.
		//registerBackspaceHandler(this, editor);

		// Escape from the code block when

		// Configure schema.
		schema.register('codeblock', {
			isObject: true,
			isBlock: true,
			allowContentOf: '$block',
			allowWhere: ['$root', '$block'],
			allowIn: ['$root'],
			allowAttributes: ['language', 'content']
		});

		conversion.for( 'upcast' )
			.add(viewCodeBlockToModel());

		conversion.for( 'editingDowncast' )
			.add( downcastElementToElement({
				model: 'codeblock',
				view: (modelElement, viewWriter) => {
					return createCodeBlockWidget( modelElement, viewWriter, 'Code block' );
				}
			} )
		);

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
				 editor.model.change(writer => {
					const element = writer.createElement( 'codeblock' );
					writer.setAttribute('content', '', element);
					editor.model.insertContent( element, editor.model.document.selection );
				})
			} );

			return view;
		} );
	}
}
