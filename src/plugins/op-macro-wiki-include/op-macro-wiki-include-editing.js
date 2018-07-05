// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from './../../icons/include_page.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import {upcastElementToElement} from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';
import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';
import {toWikiIncludeMacroWidget} from './utils';

export default class OPWikiIncludePageEditing extends Plugin {

	static get pluginName() {
		return 'OPWikiIncludePageEditing';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;
		const pluginContext = editor.config.get('openProject.pluginContext');

		// Schema.
		model.schema.register( 'op-macro-wiki-page-include', {
			allowWhere: ['$block'],
			allowAttributes: ['page'],
			isBlock: true,
		    isLimit: true
		});

		conversion.for( 'upcast' )
			.add( upcastElementToElement( {
				view: {
					name: 'macro',
					classes: 'include_wiki_page'
				},
				model: ( viewElement, modelWriter ) => {
					const page = viewElement.getAttribute( 'data-page' ) || '';

					return modelWriter.createElement(
						'op-macro-wiki-page-include',
						{
							page: page
						}
					);
				}
			} ) );


		conversion.for( 'editingDowncast' ).add( downcastElementToElement({
			model: 'op-macro-wiki-page-include',
			view: (modelElement, writer) => {
				return this.createMacroViewElement(modelElement, writer);
			}
	    } ));

		conversion.for('dataDowncast').add(downcastElementToElement({
			model: 'op-macro-wiki-page-include',
			view: (modelElement, writer) => {
				const element = writer.createContainerElement(
					'macro',
					{
						'class': 'include_wiki_page',
						'data-page': modelElement.getAttribute('page') || '',
					}
				);

				return element;
			}
		}));

		editor.ui.componentFactory.add( 'insertWikiPageInclude', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: window.I18n.t('js.editor.macro.wiki_page_include.button'),
				icon: imageIcon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				const macroService = pluginContext.services.macros;

				macroService
					.configureWikiPageInclude()
					.then((page) => editor.model.change(writer => {
						const element = writer.createElement( 'op-macro-wiki-page-include', {});
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
		return window.I18n.t('js.editor.macro.wiki_page_include.text');
	}

	createMacroViewElement(modelElement, writer) {
		// TODO: Pass page, it is not updated on coming back from the modal..
		// const page = modelElement.getAttribute('page');
		const label = this.macroLabel();
		const placeholder = writer.createText( label );
		const container = writer.createContainerElement( 'div', { class: 'macro -wiki_page_include' } );

		writer.insert( ViewPosition.createAt( container ), placeholder );
		return toWikiIncludeMacroWidget(container, writer, { label: label } )
	}
}
