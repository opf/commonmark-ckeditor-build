// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from './../../icons/work-package-button.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import {upcastElementToElement} from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';
import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';
import {toWpButtonMacroWidget} from './utils';

export default class OPMacroWpButtonEditing extends Plugin {

	static get pluginName() {
		return 'OPMacroWpButtonEditing';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;
		const pluginContext = editor.config.get('openProject.pluginContext');

		// Schema.
		model.schema.register( 'op-macro-wp-button', {
			allowWhere: ['$block'],
			allowAttributes: ['type', 'classes'],
			isBlock: true,
		    isLimit: false
		});

		conversion.for( 'upcast' )
			.add( upcastElementToElement( {
				view: {
					name: 'macro',
					classes: 'create_work_package_link'
				},
				model: ( viewElement, modelWriter ) => {
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
			} ) );


		conversion.for( 'editingDowncast' ).add( downcastElementToElement({
			model: 'op-macro-wp-button',
			view: (modelElement, writer) => {
				return this.createMacroViewElement(modelElement, writer);
			}
	    } ));

		conversion.for('dataDowncast').add(downcastElementToElement({
			model: 'op-macro-wp-button',
			view: (modelElement, writer) => {
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
		}));

		editor.ui.componentFactory.add( 'insertWorkPackageButton', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: window.I18n.t('js.editor.macro.work_package_button.button'),
				icon: imageIcon,
				tooltip: true
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


				editor.model.change( writer => {
				} );
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
		const container = writer.createContainerElement( 'span', { class: 'macro -create_work_package_link ' + classes } );

		writer.insert( ViewPosition.createAt( container ), placeholder );
		return toWpButtonMacroWidget(container, writer, { label: label } )
	}
}
