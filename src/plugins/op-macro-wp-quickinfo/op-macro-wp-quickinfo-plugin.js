import { Plugin } from '@ckeditor/ckeditor5-core';
import { Widget, toWidget } from '@ckeditor/ckeditor5-widget';

const QUICKINFO_TAG = 'opce-macro-wp-quickinfo';

// Renders OpenProject's ##/### work-package quickinfo references as inline
// widgets, whose DOM children are not further processed by CKEditor.
// Inside the widget, we render the <opce-macro-wp-quickinfo> as when rendering as HTML.
export default class OPMacroWpQuickinfoPlugin extends Plugin {

	static get requires() {
		return [ Widget ];
	}

	static get pluginName() {
		return 'OPMacroWpQuickinfo';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const conversion = editor.conversion;

		model.schema.register( 'op-macro-wp-quickinfo', {
			allowWhere: '$text',
			isInline: true,
			isObject: true,
			allowAttributes: [ 'wpId', 'detailed' ],
		});

		conversion.for( 'upcast' ).elementToElement( {
			view: { name: QUICKINFO_TAG },
			model: ( viewElement, { writer } ) => {
				const wpId = viewElement.getAttribute( 'data-id' ) || '';
				const detailed = viewElement.getAttribute( 'data-detailed' ) === 'true';
				return writer.createElement( 'op-macro-wp-quickinfo', { wpId, detailed } );
			},
			converterPriority: 'high',
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'op-macro-wp-quickinfo',
			view: ( modelElement, { writer } ) => {
				const wpId = modelElement.getAttribute( 'wpId' ) || '';
				const detailed = !!modelElement.getAttribute( 'detailed' );

				// toWidget needs a ContainerElement, so we wrap it in a span
				const wrapper = writer.createContainerElement( 'span', {
					class: 'op-macro-wp-quickinfo-widget',
				} );
				const raw = writer.createRawElement(
					QUICKINFO_TAG,
					{
						'data-id': wpId,
						'data-detailed': String(detailed),
					},
					() => {},
				);
				writer.insert( writer.createPositionAt( wrapper, 0 ), raw );

				return toWidget( wrapper, writer, { label: `#${wpId}` } );
			},
		} );

		// Data view: include the literal ##ID / ###ID inside the element so
		// turndown's isBlank check doesn't skip the content and parent.
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'op-macro-wp-quickinfo',
			view: ( modelElement, { writer } ) => {
				const wpId = modelElement.getAttribute( 'wpId' ) || '';
				const detailed = !!modelElement.getAttribute( 'detailed' );
				const container = writer.createContainerElement( QUICKINFO_TAG, {
					'data-id': wpId,
					'data-detailed': String(detailed),
				} );
				const ref = (detailed ? '###' : '##') + wpId;
				writer.insert( writer.createPositionAt( container, 0 ), writer.createText( ref ) );
				return container;
			},
		} );
	}

	afterInit() {
		const editor = this.editor;
		const mentionCommand = editor.commands.get( 'mention' );
		if (!mentionCommand) return;

		// Take over ##/### work_package mentions as a widget
		mentionCommand.on( 'execute', ( evt, args ) => {
			const opts = args && args[0];
			if (!opts || !opts.mention) return;
			if (opts.mention.type !== 'work_package') return;

			const marker = opts.marker;
			if (marker !== '##' && marker !== '###') return;

			evt.stop();

			const detailed = marker === '###';
			const wpId = String(opts.mention.idNumber);

			editor.model.change( writer => {
				const range = opts.range || editor.model.document.selection.getFirstRange();
				if (range) {
					writer.remove( range );
				}
				const el = writer.createElement( 'op-macro-wp-quickinfo', { wpId, detailed } );
				editor.model.insertContent( el, editor.model.document.selection );
				writer.setSelection( writer.createPositionAfter( el ) );
			} );
		}, { priority: 'high' } );
	}
}
