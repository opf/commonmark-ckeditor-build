import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget } from '@ckeditor/ckeditor5-widget';
import { uid } from '@ckeditor/ckeditor5-utils';

import { textContentOf } from '../code-block/converters';
import MermaidPreviewCommand from './mermaid_preview_command';
import MermaidSourceViewCommand from './mermaid_source_view_command';
import MermaidSplitViewCommand from './mermaid_split_view_command';
import InsertMermaidCommand, { INSERT_MERMAID_COMMAND } from './insert_mermaid_command';
import { debounce } from './utils';

// Time in milliseconds.
const DEBOUNCE_TIME = 300;

const DEFAULT_DISPLAY_MODE = 'split';

export default class MermaidEditing extends Plugin {

	static get pluginName() {
		return 'MermaidEditing';
	}

	constructor( editor ) {
		super( editor );

		/**
		 * Per-preview-element render generation. A single shared counter would discard in-flight
		 * results for other widgets when several diagrams render at once, leaving blank previews.
		 */
		this._renderGenerations = new WeakMap();

		/**
		 * Serialize mermaid.render() calls. Concurrent renders share temporary DOM measurement
		 * nodes inside the mermaid library and can leave blank or broken SVGs.
		 */
		this._renderQueue = Promise.resolve();
	}

	init() {
		this._registerCommands();
		this._defineConverters();
		this._config = this.editor.config.get( 'mermaid' );
	}

	afterInit() {
		this.editor.model.schema.register( 'mermaid', {
			allowAttributes: [ 'displayMode', 'source' ],
			allowWhere: '$block',
			isObject: true
		} );
	}

	_registerCommands() {
		const editor = this.editor;

		editor.commands.add( 'mermaidPreviewCommand', new MermaidPreviewCommand( editor ) );
		editor.commands.add( 'mermaidSplitViewCommand', new MermaidSplitViewCommand( editor ) );
		editor.commands.add( 'mermaidSourceViewCommand', new MermaidSourceViewCommand( editor ) );
		editor.commands.add( INSERT_MERMAID_COMMAND, new InsertMermaidCommand( editor ) );
	}

	_defineConverters() {
		const editor = this.editor;

		editor.data.downcastDispatcher.on( 'insert:mermaid', this._mermaidDataDowncast.bind( this ) );
		editor.editing.downcastDispatcher.on( 'insert:mermaid', this._mermaidDowncast.bind( this ) );
		editor.editing.downcastDispatcher.on( 'attribute:source:mermaid', this._sourceAttributeDowncast.bind( this ) );

		// The code block plugin claims every `<pre>` on `high`, consuming the `<code>` inside it
		// without dispatching it, so a mermaid block has to be picked up before that happens.
		editor.data.upcastDispatcher.on( 'element:pre', this._mermaidUpcast.bind( this ), { priority: 'highest' } );

		editor.conversion.for( 'editingDowncast' ).attributeToAttribute( {
			model: {
				name: 'mermaid',
				key: 'displayMode'
			},
			view: modelAttributeValue => ( {
				key: 'class',
				value: 'ck-mermaid__' + modelAttributeValue + '-mode'
			} )
		} );
	}

	_mermaidDataDowncast( evt, data, conversionApi ) {
		const { writer, mapper } = conversionApi;

		if ( !conversionApi.consumable.consume( data.item, 'insert' ) ) {
			return;
		}

		const targetViewPosition = mapper.toViewPosition( this.editor.model.createPositionBefore( data.item ) );
		// For downcast we're using only language-mermaid class. We don't set class to
		// `mermaid language-mermaid` as multiple markdown converters that we have seen are using
		// only `language-mermaid` class and not `mermaid` alone.
		const code = writer.createContainerElement( 'code', { class: 'language-mermaid' } );
		const pre = writer.createContainerElement( 'pre', { spellcheck: 'false' } );

		writer.insert( writer.createPositionAt( code, 'end' ), writer.createText( data.item.getAttribute( 'source' ) ) );
		writer.insert( writer.createPositionAt( pre, 'end' ), code );
		writer.insert( targetViewPosition, pre );
		mapper.bindElements( data.item, code );
	}

	_mermaidDowncast( evt, data, conversionApi ) {
		const { writer, mapper, consumable } = conversionApi;
		const { editor } = this;
		const { model, t } = editor;
		const that = this;

		if ( !consumable.consume( data.item, 'insert' ) ) {
			return;
		}

		const targetViewPosition = mapper.toViewPosition( model.createPositionBefore( data.item ) );

		const wrapper = writer.createContainerElement( 'div', { class: [ 'ck-mermaid__wrapper' ] } );
		const editingContainer = writer.createUIElement( 'textarea', {
			class: [ 'ck-mermaid__editing-view' ],
			placeholder: t( 'Insert Mermaid source code' ),
			'data-cke-ignore-events': true
		}, createEditingTextarea );
		const previewContainer = writer.createUIElement( 'div', { class: [ 'ck-mermaid__preview' ] }, createMermaidPreview );

		writer.insert( writer.createPositionAt( wrapper, 'start' ), previewContainer );
		writer.insert( writer.createPositionAt( wrapper, 'start' ), editingContainer );

		writer.insert( targetViewPosition, wrapper );

		mapper.bindElements( data.item, wrapper );

		return toWidget( wrapper, writer, {
			label: t( 'Mermaid widget' ),
			hasSelectionHandle: true
		} );

		function createEditingTextarea( domDocument ) {
			const domElement = this.toDomElement( domDocument );

			domElement.value = data.item.getAttribute( 'source' );

			domElement.addEventListener( 'input', debounce( event => {
				editor.model.change( writer => {
					writer.setAttribute( 'source', event.target.value, data.item );
				} );
			}, DEBOUNCE_TIME ) );

			/* Workaround for internal #1544 */
			domElement.addEventListener( 'focus', () => {
				const model = editor.model;

				// Move the selection onto the mermaid widget if it's currently not selected.
				if ( model.document.selection.getSelectedElement() !== data.item ) {
					model.change( writer => writer.setSelection( data.item, 'on' ) );
				}
			}, true );

			return domElement;
		}

		function createMermaidPreview( domDocument ) {
			const domElement = this.toDomElement( domDocument );

			that.renderMermaid( domElement, data.item.getAttribute( 'source' ) );

			return domElement;
		}
	}

	_sourceAttributeDowncast( evt, data, conversionApi ) {
		const newSource = data.attributeNewValue ?? '';
		const domConverter = this.editor.editing.view.domConverter;
		const mermaidView = conversionApi.mapper.toViewElement( data.item );

		if ( !mermaidView ) {
			return;
		}

		for ( const child of mermaidView.getChildren() ) {
			if ( child.name === 'textarea' && child.hasClass( 'ck-mermaid__editing-view' ) ) {
				const domEditingTextarea = domConverter.viewToDom( child );

				if ( domEditingTextarea.value != newSource ) {
					domEditingTextarea.value = newSource;
				}
			} else if ( child.name === 'div' && child.hasClass( 'ck-mermaid__preview' ) ) {
				const domPreviewWrapper = domConverter.viewToDom( child );

				if ( domPreviewWrapper ) {
					this.renderMermaid( domPreviewWrapper, newSource );
				}
			}
		}
	}

	_mermaidUpcast( evt, data, conversionApi ) {
		const { consumable, writer } = conversionApi;
		const viewPreElement = data.viewItem;
		const viewCodeElement = Array.from( viewPreElement.getChildren() )
			.find( child => child.is( 'element', 'code' ) && child.hasClass( 'language-mermaid' ) );

		if ( !viewCodeElement || data.modelCursor.findAncestor( 'mermaid' ) ) {
			return;
		}

		if ( !consumable.test( viewPreElement, { name: true } ) || !consumable.test( viewCodeElement, { name: true } ) ) {
			return;
		}

		const mermaidElement = writer.createElement( 'mermaid', {
			// markdown-it terminates a fenced block with a newline that is not part of the source.
			source: textContentOf( viewCodeElement ).replace( /\n$/, '' ),
			displayMode: DEFAULT_DISPLAY_MODE
		} );

		if ( !conversionApi.safeInsert( mermaidElement, data.modelCursor ) ) {
			return;
		}

		consumable.consume( viewPreElement, { name: true } );
		consumable.consume( viewCodeElement, { name: true } );

		conversionApi.updateConversionResult( mermaidElement, data );
	}

	/**
	 * Renders the given mermaid `source` into `domElement`.
	 *
	 * The mermaid library itself is never imported here: the host supplies it through the
	 * `mermaid.lazyLoad` config, which is called once and memoised.
	 */
	async renderMermaid( domElement, source ) {
		if ( !source?.trim() ) {
			// Bump the generation so an in-flight render for the previous source cannot write its
			// SVG back into a cleared preview.
			this._nextGeneration( domElement );
			domElement.innerHTML = '';
			return;
		}

		if ( !this._mermaidPromise && typeof this._config?.lazyLoad === 'function' ) {
			this._mermaidPromise = Promise.resolve( this._config.lazyLoad() ).then( instance => {
				instance.initialize( this._config?.config ?? {} );
				return instance;
			} );
		}

		const mermaid = await this._mermaidPromise;

		if ( !mermaid ) {
			return;
		}

		const generation = this._nextGeneration( domElement );
		const id = `ck-mermaid-${ uid() }`;

		const run = async () => {
			// A newer edit for this same preview landed while we waited in the queue.
			if ( generation !== this._renderGenerations.get( domElement ) ) {
				return;
			}

			try {
				const { svg } = await mermaid.render( id, source );

				// Mermaid leaves a temporary probe node with `id`. Remove it *before* inserting the
				// SVG - the returned SVG reuses the same id, so a later getElementById( id ).remove()
				// would delete the rendered diagram.
				document.getElementById( id )?.remove();

				if ( generation === this._renderGenerations.get( domElement ) ) {
					domElement.innerHTML = svg;
				}
			} catch ( err ) {
				document.getElementById( id )?.remove();

				if ( generation === this._renderGenerations.get( domElement ) ) {
					domElement.innerText = err instanceof Error ? err.message : String( err );
				}
			}
		};

		// Chain onto the queue so only one mermaid.render runs at a time, while still letting each
		// caller's promise settle when *its* turn finishes. `run` swallows its own failures, so the
		// chain never rejects; passing it as the rejection handler too means a future throw would
		// still let the next render through instead of wedging the queue permanently.
		const queued = this._renderQueue.then( run, run );

		this._renderQueue = queued;

		await queued;
	}

	_nextGeneration( domElement ) {
		const generation = ( this._renderGenerations.get( domElement ) ?? 0 ) + 1;

		this._renderGenerations.set( domElement, generation );

		return generation;
	}
}
