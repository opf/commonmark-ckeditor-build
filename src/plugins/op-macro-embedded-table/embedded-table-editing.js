// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from '../../icons/work-packages.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import {upcastElementToElement} from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';
import {toEmbeddedTableWidget} from './utils';
import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';

export default class EmbeddedTableEditing extends Plugin {

	static get pluginName() {
		return 'EmbeddedTableEditing';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;
		const pluginContext = editor.config.get('openProject.pluginContext');

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
			.add( upcastElementToElement( {
				view: {
					name: 'macro',
					classes: 'embedded-table',
				},
				model: ( viewElement, modelWriter ) => {
					const queryProps = viewElement.getAttribute( 'data-query-props' );
					return modelWriter.createElement(
						'op-macro-embedded-table',
						{
							opEmbeddedTableQuery: queryProps ? JSON.parse(queryProps) : {}
						}
					);
				}
			} ) );


		conversion.for( 'editingDowncast' ).add( downcastElementToElement({
			model: 'op-macro-embedded-table',
			view: (modelElement, viewWriter) => {
				return toEmbeddedTableWidget(this.createEmbeddedTableView(viewWriter), viewWriter, { label: this.label } )
			}
	    } ));

		conversion.for('dataDowncast').add(downcastElementToElement({
			model: 'op-macro-embedded-table',
			view: (modelElement, viewWriter) => {
				return this.createEmbeddedTableDataElement(modelElement, viewWriter)
			}
		}));

		editor.ui.componentFactory.add( 'insertEmbeddedTable', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: this.text.button,
				icon: imageIcon,
				tooltip: true
			} );

			// Callback executed once the widget is clicked.
			view.on( 'execute', () => {
				const externalQueryConfiguration = pluginContext.services.externalQueryConfiguration;
				const currentQuery = {}; // Initial query currently empty, we may want to provide context here.

				externalQueryConfiguration.show(
					currentQuery,
					(newQuery) => editor.model.change(writer => {
						const element = writer.createElement( 'op-macro-embedded-table', { opEmbeddedTableQuery: newQuery });

						// Insert the widget in the current selection location.
						editor.model.insertContent( element, editor.model.document.selection );
					})
				);
			} );

			return view;
		} );
	}

	createEmbeddedTableView(writer) {
		const placeholder = writer.createText( this.text.macro_text );
		const container = writer.createContainerElement( 'div', { class: 'macro -embedded-table' } );

		writer.insert( ViewPosition.createAt( container ), placeholder );
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
