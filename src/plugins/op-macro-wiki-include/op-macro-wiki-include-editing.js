import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';
import {toWikiIncludeMacroWidget} from './utils';
import ViewRange from "@ckeditor/ckeditor5-engine/src/view/range";
import { getPluginContext } from '../op-context/op-context';

export default class OPWikiIncludePageEditing extends Plugin {

	static get pluginName() {
		return 'OPWikiIncludePageEditing';
	}

	static get buttonName() {
		return 'insertWikiPageInclude';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;
		const pluginContext = getPluginContext(editor);

		// Schema.
		model.schema.register( 'op-macro-wiki-page-include', {
			allowWhere: ['$block'],
			allowAttributes: ['page'],
			isBlock: true,
		    isLimit: true
		});

		conversion.for( 'upcast' )
			.elementToElement( {
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
			} );


		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'op-macro-wiki-page-include',
				view: (modelElement, writer) => {
					return this.createMacroViewElement(modelElement, writer);
				}
			})
			.add(dispatcher => dispatcher.on( 'attribute:page', this.modelAttributeToView.bind(this)));

		conversion.for('dataDowncast').elementToElement({
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
		});

		editor.ui.componentFactory.add( OPWikiIncludePageEditing.buttonName, locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: window.I18n.t('js.editor.macro.wiki_page_include.button'),
				withText: true
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
			} );

			return view;
		} );
	}

	modelAttributeToView( evt, data, conversionApi ) {
		const modelElement = data.item;
		if (!modelElement.is('op-macro-wiki-page-include')) {
			return;
		}

		// Mark element as consumed by conversion.
		conversionApi.consumable.consume(data.item, evt.name);

		// Get mapped view element to update.
		const viewElement = conversionApi.mapper.toViewElement(modelElement);

		// Remove current <div> element contents.
		conversionApi.writer.remove(conversionApi.writer.createRangeIn(viewElement));

		// Set current content
		this.setPlaceholderContent(conversionApi.writer, modelElement, viewElement);
	}

	macroLabel() {
		return window.I18n.t('js.editor.macro.wiki_page_include.text');
	}

	pageLabel(page) {
		if (page && page.length > 0) {
			return page
		} else {
			return window.I18n.t('js.editor.macro.wiki_page_include.not_set');
		}
	}

	createMacroViewElement(modelElement, writer) {
		const placeholderContainer = writer.createContainerElement( 'div', { class: 'macro -wiki_page_include' } );

		this.setPlaceholderContent( writer, modelElement, placeholderContainer );

		return toWikiIncludeMacroWidget(placeholderContainer, writer, { label: this.macroLabel() } )
	}

	setPlaceholderContent(writer, modelElement, placeholderContainer ) {
		const page = modelElement.getAttribute('page');
		const macroLabel = this.macroLabel();
		const pageLabel = this.pageLabel(page);
		const pageLabelContainer = writer.createContainerElement( 'span', { class: 'macro-value' } );
		let placeholderContent = [ writer.createText( `${macroLabel} ` ) ];
		writer.insert( writer.createPositionAt( pageLabelContainer, 0 ), writer.createText( `${pageLabel}` ) )
		placeholderContent.push( pageLabelContainer );

		writer.insert( writer.createPositionAt( placeholderContainer, 0 ), placeholderContent );
	}
}
