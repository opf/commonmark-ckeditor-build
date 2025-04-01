import { ButtonView } from '@ckeditor/ckeditor5-ui';

import { Plugin } from '@ckeditor/ckeditor5-core';

import {toEmbeddedTableWidget} from './utils';
import {getPluginContext} from '../op-context/op-context';

export default class EmbeddedTableEditing extends Plugin {

	static get pluginName() {
		return 'EmbeddedTableEditing';
	}

	static get buttonName() {
		return 'insertEmbeddedTable';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;
		const pluginContext = getPluginContext(editor);

		this.text = {
			button: window.I18n.t('js.editor.macro.embedded_table.button'),
			macro_text: window.I18n.t('js.editor.macro.embedded_table.text'),
		};

		// Schema.
		model.schema.register( 'op-macro-embedded-table', {
			allowWhere: '$block',
			allowAttributes: ['opEmbeddedTableQuery'],
			isBlock: true,
			isObject: true
		});

		conversion.for( 'upcast' )
			.elementToElement( {
				view: {
					name: 'macro',
					classes: 'embedded-table',
				},
				model: ( viewElement, {writer:modelWriter} ) => {
					const queryProps = viewElement.getAttribute( 'data-query-props' );
					return modelWriter.createElement(
						'op-macro-embedded-table',
						{
							opEmbeddedTableQuery: queryProps ? JSON.parse(queryProps) : {}
						}
					);
				}
			} );


		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'op-macro-embedded-table',
			view: (modelElement, {writer:viewWriter}) => {
				return toEmbeddedTableWidget(this.createEmbeddedTableView(viewWriter), viewWriter, { label: this.label } )
			}
	    } );

		conversion.for('dataDowncast').elementToElement({
			model: 'op-macro-embedded-table',
			view: (modelElement, {writer:viewWriter}) => {
				return this.createEmbeddedTableDataElement(modelElement, viewWriter)
			}
		});

		editor.ui.componentFactory.add( EmbeddedTableEditing.buttonName, locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: this.text.button,
				withText: true
			} );

			// Callback executed once the widget is clicked.
			view.on( 'execute', () => pluginContext.runInZone(() => {
				const externalQueryConfiguration = pluginContext.services.externalQueryConfiguration;
				const currentQuery = {}; // Initial query currently empty, we may want to provide context here.

				externalQueryConfiguration.show({
					currentQuery: currentQuery,
					callback: (newQuery) => editor.model.change(writer => {
						const element = writer.createElement('op-macro-embedded-table', {opEmbeddedTableQuery: newQuery});

						// Insert the widget in the current selection location.
						editor.model.insertContent(element, editor.model.document.selection);
					})
				});
			} ) );

			return view;
		} );
	}

	createEmbeddedTableView(writer) {
		const placeholder = writer.createText( this.text.macro_text );
		const container = writer.createContainerElement( 'div' );

		writer.insert( writer.createPositionAt( container, 0 ), placeholder );
		return container;

		// The following doesnt work when removing the widget...
		// let that = this;
		// return writer.createUIElement( 'div', { class: 'macro -embedded-table' }, function(containerDocument) {
		// 	const containerElement = this.toDomElement(containerDocument);
		// 	containerElement.innerHTML = imageIcon + '<div class="macro--description">' + that.text.macro_text + '</div>';

		// 	return containerElement;
		// } );
	}

	createEmbeddedTableDataElement(modelElement, writer) {
		const queryProps = modelElement.getAttribute('opEmbeddedTableQuery') || {};
		const element = writer.createContainerElement(
			'macro',
			{
				'class': 'embedded-table',
				'data-query-props': JSON.stringify(queryProps)
			}
		);

		return element;
	}

}
