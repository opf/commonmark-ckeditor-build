import icon from '../../icons/code-block.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {modelCodeBlockToView, viewCodeBlockToModel} from './converters';
import {downcastElementToElement} from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import {createCodeBlockWidget, isCodeBlockWidget} from './widget';
import ClickObserver from './click-observer';

export default class CodeBlockEditing extends Plugin {

	static get pluginName() {
		return 'CodeBlockEditing';
	}

	init() {
		const editor = this.editor;
		const schema = editor.model.schema;
		const conversion = editor.conversion;
		const view = editor.editing.view;
		const viewDocument = view.document;
		const pluginContext = editor.config.get('openProject.pluginContext');

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

		// Register click handler to code block to edit it immediately
		view.addObserver( ClickObserver );
		this.listenTo( viewDocument, 'click', ( eventInfo, domEventData ) => {
			let element = domEventData.target;

			// If target is our widget
			if ( !isCodeBlockWidget( element ) ) {
				element = element.findAncestor( isCodeBlockWidget );

				if ( !element ) {
					return;
				}
			}

			domEventData.preventDefault();
			domEventData.stopPropagation();

			// Create model selection over widget.
			const modelElement = editor.editing.mapper.toModelElement( element );

			const macroService = pluginContext.services.macros;
			const language = modelElement.getAttribute('language');
			const content = modelElement.getAttribute('content');

			macroService
				.editCodeBlock( content, language )
				.then((update) => editor.model.change(writer => {
					writer.setAttribute( 'language', update.languageClass, modelElement );
					writer.setAttribute( 'content', update.content, modelElement );
				})
			);

		} );

		// Register toolbar button to create code block
		editor.ui.componentFactory.add( 'insertCodeBlock', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: 'Insert code block', // TODO: Integration into t() ?
				icon: icon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				pluginContext.services.macros
					.editCodeBlock()
					.then((update) => editor.model.change(writer => {

						const element = writer.createElement( 'codeblock' );
						writer.setAttribute( 'language', update.languageClass, element );
						writer.setAttribute( 'content', update.content, element );
						editor.model.insertContent( element, editor.model.document.selection );
					})
				);
			} );

			return view;
		} );
	}
}
