import { Plugin } from '@ckeditor/ckeditor5-core';
import { ClipboardPipeline } from '@ckeditor/ckeditor5-clipboard';

// Guards the clipboard -> model conversion of a paste.
//
// CKEditor's ClipboardPipeline runs `editor.data.toModel()` on the pasted
// content to build the model fragment it then inserts. If any upcast
// converter throws there, the error is uncaught, bubbles up to the
// EditorWatchdog and triggers a full editor restart -- which discards
// everything the user had typed (COMMS-572).
//
// This plugin re-runs that conversion ourselves, before the pipeline's
// default insertion handler, inside a try/catch. When the conversion
// throws we abort the rich paste, fall back to inserting the plain-text
// representation of the clipboard and notify the host application so it
// can surface a flash message. The editor stays alive and the existing
// content is preserved.
export default class OPPasteGuard extends Plugin {

	static get requires() {
		return [ ClipboardPipeline ];
	}

	static get pluginName() {
		return 'OPPasteGuard';
	}

	init() {
		const editor = this.editor;
		const clipboardPipeline = editor.plugins.get( 'ClipboardPipeline' );

		// Run before the pipeline's default insertion handler (which sits
		// at 'normal' priority) but after content normalisation plugins
		// such as PasteFromOffice (which run at 'high'). `toModel()` is
		// side-effect free, so dry-running it here does not double-insert:
		// on success we let the default handler perform the real insertion.
		this.listenTo( clipboardPipeline, 'inputTransformation', ( evt, data ) => {
			if ( data.content.isEmpty ) {
				return;
			}

			try {
				editor.data.toModel( data.content );
			} catch ( error ) {
				// Stop the broken rich paste from reaching the default
				// handler (and from there the watchdog).
				evt.stop();
				this._handlePasteFailure( data, error );
			}
		}, { priority: 'high' } );
	}

	_handlePasteFailure( data, error ) {
		const editor = this.editor;

		// Let the host application show a user-facing message.
		editor.fire( 'op:clipboard-paste-error', { error } );

		// eslint-disable-next-line no-console
		console.error( 'Failed to paste content into CKEditor, inserting as plain text instead.', error );

		const plainText = data.dataTransfer ? data.dataTransfer.getData( 'text/plain' ) : '';
		if ( !plainText ) {
			return;
		}

		this._insertAsPlainText( plainText );
	}

	_insertAsPlainText( plainText ) {
		const editor = this.editor;
		const model = editor.model;

		model.change( writer => {
			const fragment = writer.createDocumentFragment();
			const lines = plainText.split( /\r\n|\r|\n/ );

			lines.forEach( line => {
				const paragraph = writer.createElement( 'paragraph' );
				if ( line.length > 0 ) {
					writer.append( writer.createText( line ), paragraph );
				}
				writer.append( paragraph, fragment );
			} );

			model.insertContent( fragment );
		} );
	}
}
