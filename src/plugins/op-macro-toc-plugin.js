import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import ViewPosition from '@ckeditor/ckeditor5-engine/src/view/position';

export default class OPMacroTocPlugin extends Plugin {

	static get pluginName() {
		return 'OPMacroToc';
	}

	static get buttonName() {
		return 'insertToc';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;

		// Schema.
		model.schema.register( 'op-macro-toc', {
			allowWhere: '$block',
			isBlock: true,
		    isLimit: true
		});

		conversion.for( 'upcast' )
			.elementToElement( {
				view: {
					name: 'macro',
					classes: 'toc'
				},
				model: 'op-macro-toc'
			} );


		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'op-macro-toc',
			view: (modelElement, viewWriter) => {
				return toWidget(this.createTocViewElement(viewWriter), viewWriter, { label: this.label } )
			}
	    } );

		conversion.for('dataDowncast').elementToElement({
			model: 'op-macro-toc',
			view: (modelElement, viewWriter) => {
				return this.createTocDataElement(viewWriter)
			}
		});

		editor.ui.componentFactory.add( OPMacroTocPlugin.buttonName, locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: this.label,
				withText: true,
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				editor.model.change( writer => {
					const tocElement = writer.createElement( 'op-macro-toc', {});

					// Insert the image in the current selection location.
					editor.model.insertContent( tocElement, editor.model.document.selection );
				} );
			} );

			return view;
		} );
	}

	get label() {
		return window.I18n.t('js.editor.macro.toc');
	}

	createTocViewElement(writer) {
		const placeholder = writer.createText( this.label );
		const container = writer.createContainerElement( 'div', { class: 'macro -toc' } );

		writer.insert( writer.createPositionAt( container, 0 ), placeholder );
		return container;
	}

	createTocDataElement(writer) {
		return writer.createContainerElement('macro', { class: 'toc' } );
	}

}
