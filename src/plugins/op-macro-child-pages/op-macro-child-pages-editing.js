// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from './../../icons/hierarchy.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import {upcastElementToElement} from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';
import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';
import {toChildPagesMacroWidget} from './utils';

export default class OPChildPagesEditing extends Plugin {

	static get pluginName() {
		return 'OPChildPagesEditing';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;
		const pluginContext = editor.config.get('openProject.pluginContext');

		// Schema.
		model.schema.register( 'op-macro-child-pages', {
			allowWhere: ['$block'],
			allowAttributes: ['page'],
			isBlock: true,
			isLimit: true
		});

		conversion.for( 'upcast' )
			.add( upcastElementToElement( {
				view: {
					name: 'macro',
					classes: 'child_pages'
				},
				model: ( viewElement, modelWriter ) => {
					const page = viewElement.getAttribute( 'data-page' ) || '';

					return modelWriter.createElement(
						'op-macro-child-pages',
						{
							page: page
						}
					);
				}
			} ) );


		conversion.for( 'editingDowncast' ).add(downcastElementToElement({
			model: 'op-macro-child-pages',
			view: (modelElement, writer) => {
				return this.createMacroViewElement(modelElement, writer);
			}
		}));

		conversion.for('dataDowncast').add(downcastElementToElement({
			model: 'op-macro-child-pages',
			view: (modelElement, writer) => {
				const element = writer.createContainerElement(
					'macro',
					{
						'class': 'child_pages',
						'data-page': modelElement.getAttribute('page') || '',
					}
				);

				return element;
			}
		}));

		editor.ui.componentFactory.add( 'insertChildPages', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: window.I18n.t('js.editor.macro.child_pages.button'),
				icon: imageIcon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				const macroService = pluginContext.services.macros;

				macroService
					.configureChildPages()
					.then((page) => editor.model.change(writer => {
							const element = writer.createElement( 'op-macro-child-pages', {});
							writer.setAttribute( 'page', page, element );

							editor.model.insertContent( element, editor.model.document.selection );
						})
					);


				editor.model.change( writer => {
				} );
			} );

			return view;
		} );
	}

	macroLabel() {
		return window.I18n.t('js.editor.macro.child_pages.text');
	}

	createMacroViewElement(modelElement, writer) {
		// TODO: Pass page, it is not updated on coming back from the modal..
		// const page = modelElement.getAttribute('page');
		const label = this.macroLabel();
		const placeholder = writer.createText( label );
		const container = writer.createContainerElement( 'div', { class: 'macro -child_page' } );

		writer.insert( ViewPosition.createAt( container ), placeholder );
		return toChildPagesMacroWidget(container, writer, { label: label } )
	}
}
