import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import {toWpButtonMacroWidget} from './utils';
import {getPluginContext} from '../op-context/op-context';

export default class OPMacroWpButtonEditing extends Plugin {

	static get pluginName() {
		return 'OPMacroWpButtonEditing';
	}

	static get buttonName() {
		return 'insertWorkPackageButton';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;
		const pluginContext = getPluginContext(editor);

		// Schema.
		model.schema.register( 'op-macro-wp-button', {
			allowWhere: ['$block'],
			allowAttributes: ['type', 'classes'],
			isBlock: true,
		    isLimit: true
		});

		conversion.for( 'upcast' )
			.elementToElement( {
				view: {
					name: 'macro',
					classes: 'create_work_package_link'
				},
				model: ( viewElement, {writer:modelWriter} ) => {
					const type = viewElement.getAttribute( 'data-type' ) || '';
					const classes = viewElement.getAttribute( 'data-classes' ) || '';

					return modelWriter.createElement(
						'op-macro-wp-button',
						{
							type: type,
							classes: classes
						}
					);
				}
			} );


		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'op-macro-wp-button',
			view: (modelElement, {writer}) => {
				return this.createMacroViewElement(modelElement, writer);
			}
	    } );

		conversion.for('dataDowncast').elementToElement({
			model: 'op-macro-wp-button',
			view: (modelElement, {writer}) => {
				const element = writer.createContainerElement(
					'macro',
					{
						'class': 'create_work_package_link',
						'data-type': modelElement.getAttribute('type') || '',
						'data-classes': modelElement.getAttribute('classes') || '',
					}
				);

				return element;
			}
		});

		editor.ui.componentFactory.add( OPMacroWpButtonEditing.buttonName, locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: window.I18n.t('js.editor.macro.work_package_button.button'),
				withText: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				const macroService = pluginContext.services.macros;

				macroService
					.configureWorkPackageButton()
					.then((result) => editor.model.change(writer => {
						const element = writer.createElement( 'op-macro-wp-button', {});
						writer.setAttribute( 'type', result.type, element );
						writer.setAttribute( 'classes', result.classes, element );

						editor.model.insertContent( element, editor.model.document.selection );
					})
				);
			} );

			return view;
		} );
	}

	macroLabel(type) {
		if (type) {
			return window.I18n.t('js.editor.macro.work_package_button.with_type', { typename: type });
		} else {
			return window.I18n.t('js.editor.macro.work_package_button.without_type');
		}
	}

	createMacroViewElement(modelElement, writer) {
		const type = modelElement.getAttribute('type');
		const classes = modelElement.getAttribute('classes') || '';
		const label = this.macroLabel(); // TODO: Pass type, it is not updated on coming back from the modal..
		const placeholder = writer.createText( label );
		const container = writer.createContainerElement( 'span', { class: classes } );

		writer.insert( writer.createPositionAt( container, 0 ), placeholder );
		return toWpButtonMacroWidget(container, writer, { label: label } )
	}
}
