import { Plugin } from '@ckeditor/ckeditor5-core';
import { Widget, toWidget } from '@ckeditor/ckeditor5-widget';

import { isWorkPackageQuickinfoMention } from './predicate';

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
			allowAttributes: [ 'wpId', 'wpDisplayId', 'detailed', 'markerText' ],
		});

		conversion.for( 'upcast' ).elementToElement( {
			view: { name: QUICKINFO_TAG },
			model: ( viewElement, { writer } ) => {
				const dataId = viewElement.getAttribute( 'data-id' ) || '';
				const dataDisplayId = viewElement.getAttribute( 'data-display-id' ) || '';
				const wpDisplayId = dataDisplayId || dataId;
				const detailed = viewElement.getAttribute( 'data-detailed' ) === 'true';
				const attrs = { wpDisplayId, detailed };
				if (dataId && dataId !== wpDisplayId) {
					attrs.wpId = dataId;
				}
				return writer.createElement( 'op-macro-wp-quickinfo', attrs );
			},
			converterPriority: 'high',
		} );

		// Reopened comments preview as widgets instead of plain links by
		// routing stored work-package `<mention>` envelopes through the
		// same widget model their autocomplete-picked counterparts use.
		conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'mention',
				classes: 'mention',
			},
			model: ( viewElement, { writer } ) => {
				if (!isWorkPackageQuickinfoMention(viewElement)) return null;
				const markerText = viewElement.getAttribute( 'data-text' );
				const detailed = markerText.startsWith('###');
				const wpId = viewElement.getAttribute( 'data-id' ) || '';
				const wpDisplayId = viewElement.getAttribute( 'data-display-id' ) || wpId;
				return writer.createElement( 'op-macro-wp-quickinfo', { wpId, wpDisplayId, detailed, markerText } );
			},
			converterPriority: 'highest',
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'op-macro-wp-quickinfo',
			view: ( modelElement, { writer } ) => {
				const wpDisplayId = modelElement.getAttribute( 'wpDisplayId' ) || '';
				const detailed = !!modelElement.getAttribute( 'detailed' );
				const wpId = modelElement.getAttribute( 'wpId' ) || wpDisplayId;

				const wrapper = writer.createContainerElement( 'span', {
					class: 'op-macro-wp-quickinfo-widget',
				} );
				const raw = writer.createRawElement(
					QUICKINFO_TAG,
					{
						'data-id': wpId,
						'data-display-id': wpDisplayId,
						'data-detailed': String(detailed),
					},
					() => {},
				);
				writer.insert( writer.createPositionAt( wrapper, 0 ), raw );

				return toWidget( wrapper, writer, { label: `#${wpDisplayId}` } );
			},
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'op-macro-wp-quickinfo',
			view: ( modelElement, { writer } ) => {
				const wpDisplayId = modelElement.getAttribute( 'wpDisplayId' ) || '';
				const detailed = !!modelElement.getAttribute( 'detailed' );
				const wpId = modelElement.getAttribute( 'wpId' );
				const markerText = modelElement.getAttribute( 'markerText' ) || `${detailed ? '###' : '##'}${wpDisplayId}`;

				// Autocomplete picks carry a `wpId`; source-typed widgets
				// don't. Autocomplete persists as a `<mention>` envelope;
				// the shorthand path collapses to bare markdown via turndown.
				if (wpId) {
					const envelope = writer.createContainerElement('mention', {
						'class': 'mention',
						'data-id': wpId,
						'data-type': 'work_package',
						'data-text': markerText,
						'data-display-id': wpDisplayId,
					});
					writer.insert(writer.createPositionAt(envelope, 0), writer.createText(markerText));
					return envelope;
				}

				// Inline the literal `##ID` / `###ID` so turndown's isBlank
				// check doesn't skip the empty element.
				const container = writer.createContainerElement( QUICKINFO_TAG, {
					'data-id': wpId || wpDisplayId,
					'data-display-id': wpDisplayId,
					'data-detailed': String(detailed),
				} );
				writer.insert( writer.createPositionAt( container, 0 ), writer.createText( markerText ) );
				return container;
			},
		} );
	}

	afterInit() {
		const editor = this.editor;
		const mentionCommand = editor.commands.get( 'mention' );
		if (!mentionCommand) return;

		// Take over ##/### work_package mentions as a widget; the data
		// downcast chooses bare quickinfo or `<mention>` envelope at save
		// time based on whether the id matches the displayed identifier.
		mentionCommand.on( 'execute', ( evt, args ) => {
			const opts = args && args[0];
			if (!opts || !opts.mention) return;
			if (opts.mention.type !== 'work_package') return;

			const marker = opts.marker;
			if (marker !== '##' && marker !== '###') return;

			evt.stop();

			const detailed = marker === '###';
			const wpDisplayId = String(opts.mention.dataDisplayId);
			const wpId = opts.mention.dataId != null ? String(opts.mention.dataId) : null;
			const markerText = opts.mention.text || `${marker}${wpDisplayId}`;

			editor.model.change( writer => {
				const range = opts.range || editor.model.document.selection.getFirstRange();
				if (range) {
					writer.remove( range );
				}
				const attrs = { wpDisplayId, detailed, markerText };
				if (wpId) attrs.wpId = wpId;
				const el = writer.createElement( 'op-macro-wp-quickinfo', attrs );
				editor.model.insertContent( el, editor.model.document.selection );
				writer.setSelection( writer.createPositionAfter( el ) );
			} );
		}, { priority: 'high' } );
	}
}
