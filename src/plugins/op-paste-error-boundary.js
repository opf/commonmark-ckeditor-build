import { Plugin } from '@ckeditor/ckeditor5-core';

/**
 * Convert a plain-text string into a minimal HTML string that can be fed back
 * into the clipboard's HTML data processor. This mirrors CKEditor's internal
 * `plainTextToHtml` clipboard util (which is not part of the public API) so we
 * can rebuild a safe, formatting-free paste when the regular conversion fails.
 *
 * @param {String} text
 * @returns {String}
 */
export function plainTextToHtml( text ) {
	text = ( text || '' )
		// Encode the characters that are special to HTML.
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		// Tabs are rendered as four spaces.
		.replace( /\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;' )
		// Preserve runs of whitespace by turning the leading spaces of each run
		// into non-breaking spaces (the same heuristic CKEditor uses).
		.replace( /(^|[\s\n])(\s+)/g, ( _fullMatch, before, whitespace ) => before + whitespace.replace( / /g, '&nbsp;' ) );

	const doubleLineBreak = /\r?\n\r?\n/;

	if ( doubleLineBreak.test( text ) ) {
		// Split on blank lines into paragraphs, single line breaks become <br>.
		text = '<p>' + text
			.split( /\r?\n\r?\n/ )
			.map( paragraph => paragraph.replace( /\r?\n/g, '<br>' ) )
			.join( '</p><p>' ) + '</p>';
	} else {
		text = text.replace( /\r?\n/g, '<br>' );
	}

	return text;
}

/**
 * Generic safety net around the clipboard paste/drop pipeline.
 *
 * A converter that throws while turning pasted markup into the editor model
 * (for example a custom upcast converter tripping over unexpected, syntax
 * highlighted HTML) otherwise lets the exception bubble all the way up to the
 * `EditorWatchdog`. The watchdog reacts by restarting the editor from its last
 * saved state, which silently wipes anything the user had typed so far.
 *
 * This plugin wraps the view -> model conversion that the clipboard pipeline
 * performs. When it detects that a conversion failed during a paste/drop, it
 * swallows the error (so it never reaches the watchdog), notifies the host
 * application via the `op:clipboard-paste-error` event, and degrades to
 * inserting the clipboard's plain-text representation instead of crashing.
 */
export default class OpPasteErrorBoundary extends Plugin {
	static get pluginName() {
		return 'OpPasteErrorBoundary';
	}

	afterInit() {
		const editor = this.editor;
		const clipboardPipeline = editor.plugins.get( 'ClipboardPipeline' );

		// Holds the DataTransfer of the paste/drop currently being processed.
		// It is only set while the clipboard pipeline is converting, so that the
		// regular data-loading path (setData) is never mistaken for a paste.
		this._pasteDataTransfer = null;

		// Remember the clipboard payload before the pipeline converts it...
		this.listenTo( clipboardPipeline, 'inputTransformation', ( evt, data ) => {
			this._pasteDataTransfer = data.dataTransfer;
		}, { priority: 'highest' } );

		// ...and forget it again once the pipeline is done with this event, even
		// if the conversion threw and was recovered below.
		this.listenTo( clipboardPipeline, 'inputTransformation', () => {
			this._pasteDataTransfer = null;
		}, { priority: 'lowest' } );

		// Wrap the view -> model conversion used by the clipboard pipeline.
		const originalToModel = editor.data.toModel.bind( editor.data );
		editor.data.toModel = ( viewElementOrFragment, context ) =>
			this._guardedToModel( originalToModel, viewElementOrFragment, context );
	}

	/**
	 * Run the original conversion, but during a paste/drop catch any error and
	 * fall back to a plain-text insert instead of letting it crash the editor.
	 *
	 * @private
	 */
	_guardedToModel( originalToModel, viewElementOrFragment, context ) {
		// Outside of a paste/drop we must not interfere with normal conversion.
		if ( !this._pasteDataTransfer ) {
			return originalToModel( viewElementOrFragment, context );
		}

		try {
			return originalToModel( viewElementOrFragment, context );
		} catch ( error ) {
			// Let the host application surface a message to the user.
			this.editor.fire( 'op:clipboard-paste-error', { error } );

			return this._plainTextFallback( originalToModel, this._pasteDataTransfer, context );
		}
	}

	/**
	 * Build a model fragment from the clipboard's plain-text representation.
	 * Plain text cannot trigger the rich-content converters that failed above,
	 * so this conversion is safe. A final catch keeps the promise that a paste
	 * can never crash the editor, dropping the content as an absolute last
	 * resort.
	 *
	 * @private
	 */
	_plainTextFallback( originalToModel, dataTransfer, context ) {
		const htmlProcessor = this.editor.data.htmlProcessor;
		const text = ( dataTransfer && dataTransfer.getData( 'text/plain' ) ) || '';

		try {
			return originalToModel( htmlProcessor.toView( plainTextToHtml( text ) ), context );
		} catch ( error ) {
			return originalToModel( htmlProcessor.toView( '' ), context );
		}
	}
}
