import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Plugin } from '@ckeditor/ckeditor5-core';
import type {
	DowncastConversionApi,
	ModelElement,
	ViewContainerElement,
	ViewDowncastWriter,
	ViewNode,
} from '@ckeditor/ckeditor5-engine';
import type { EventInfo } from '@ckeditor/ckeditor5-utils';

import {toChildPagesMacroWidget} from './utils';

export default class OPChildPagesEditing extends Plugin {

	static get pluginName() {
		return 'OPChildPagesEditing';
	}

	static get buttonName(){
		return "insertChildPages";
	}


	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;

		// Schema.
		model.schema.register( 'op-macro-child-pages', {
			allowWhere: ['$block'],
			allowAttributes: ['page'],
			isBlock: true,
			isLimit: true
		});

		conversion.for( 'upcast' )
			.elementToElement( {
				view: {
					name: 'macro',
					classes: 'child_pages'
				},
				model: ( viewElement, {writer:modelWriter} ) => {
					const page = viewElement.getAttribute( 'data-page' ) || '';
					const includeParent = viewElement.getAttribute( 'data-include-parent' ) == 'true';

					return modelWriter.createElement(
						'op-macro-child-pages',
						{
							page: page,
							includeParent: includeParent
						}
					);
				}
			} );


		conversion.for( 'editingDowncast' )
			.elementToElement({
				model: 'op-macro-child-pages',
				view: (modelElement: ModelElement, {writer}: DowncastConversionApi) => {
					return this.createMacroViewElement(modelElement, writer);
				}
			})
			.add(dispatcher => dispatcher.on( 'attribute:page', this.modelAttributeToView.bind(this)))
			.add(dispatcher => dispatcher.on( 'attribute:includeParent', this.modelAttributeToView.bind(this)));

		conversion.for('dataDowncast').elementToElement({
			model: 'op-macro-child-pages',
			view: (modelElement, {writer}) => {
				const element = writer.createContainerElement(
					'macro',
					{
						'class': 'child_pages',
						'data-page': modelElement.getAttribute('page') || '',
						'data-include-parent': modelElement.getAttribute('includeParent') || ''
					}
				);

				return element;
			}
		});

		editor.ui.componentFactory.add( OPChildPagesEditing.buttonName, locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: window.I18n.t('js.editor.macro.child_pages.button'),
				withText: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				editor.model.change(writer => {
					const element = writer.createElement( 'op-macro-child-pages', {});

					editor.model.insertContent( element, editor.model.document.selection );
				});
			} );

			return view;
		} );
	}

	modelAttributeToView( evt: EventInfo, data: { item: ModelElement }, conversionApi: DowncastConversionApi ) {
		const modelElement = data.item;
		if (!modelElement.is('element', 'op-macro-child-pages')) {
			return;
		}

		// Mark element as consumed by conversion.
		conversionApi.consumable.consume(data.item, evt.name);

		// Get mapped view element to update.
		// The widget's view element is the container created in createMacroViewElement().
		const viewElement = conversionApi.mapper.toViewElement(modelElement) as ViewContainerElement;

		// Remove current <div> element contents.
		conversionApi.writer.remove(conversionApi.writer.createRangeIn(viewElement));

		// Set current content
		this.setPlaceholderContent(conversionApi.writer, modelElement, viewElement);
	}

	macroLabel() {
		return window.I18n.t('js.editor.macro.child_pages.text');
	}

	pageLabel(page: string | undefined) {
		if (page && page.length > 0) {
			return page
		} else {
			return window.I18n.t('js.editor.macro.child_pages.this_page');
		}
	}

	includeParentText(includeParent: boolean | undefined) {
		if (includeParent) {
			return ` (${window.I18n.t('js.editor.macro.child_pages.include_parent')})`;
		} else {
			return '';
		}
	}

	createMacroViewElement(modelElement: ModelElement, writer: ViewDowncastWriter) {
		const placeholderContainer = writer.createContainerElement( 'div' );

		this.setPlaceholderContent( writer, modelElement, placeholderContainer );

		// TODO(OP-18993): passes an object where the widget label is expected to be a string.
		return toChildPagesMacroWidget(placeholderContainer, writer, { label: this.macroLabel() } as unknown as string )
	}

	setPlaceholderContent(writer: ViewDowncastWriter, modelElement: ModelElement, placeholderContainer: ViewContainerElement ) {
		const page = modelElement.getAttribute('page') as string | undefined;
		const includeParent = modelElement.getAttribute('includeParent') as boolean | undefined;
		const macroLabel = this.macroLabel();
		const pageLabel = this.pageLabel(page);
		const pageLabelContainer = writer.createContainerElement( 'span', { class: 'macro-value' } );
		let placeholderContent: ViewNode[] = [ writer.createText( `${macroLabel} ` ) ];
		writer.insert( writer.createPositionAt( pageLabelContainer, 0 ), writer.createText( `${pageLabel}` ) )
		placeholderContent.push( pageLabelContainer );
		placeholderContent.push( writer.createText( this.includeParentText(includeParent) ));

		writer.insert( writer.createPositionAt( placeholderContainer, 0 ), placeholderContent );
	}
}
