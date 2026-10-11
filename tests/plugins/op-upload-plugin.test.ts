import type { Editor } from '@ckeditor/ckeditor5-core';
import { Notification } from '@ckeditor/ckeditor5-ui';
import OpUploadPlugin from '../../src/plugins/op-upload-plugin';

// A real Notification plugin, so that its default handler (a browser
// alert for every unhandled warning) is in play.
function notificationWithUploadPlugin() {
	const fileRepository = {};
	const editor = {
		plugins: {
			get: ( name: string ) => ( name === 'Notification' ? notification : fileRepository ),
		},
	} as unknown as Editor;
	const notification = new Notification( editor );

	notification.init();
	new OpUploadPlugin( editor ).init();

	return notification;
}

describe( 'OpUploadPlugin', () => {
	let alert: jest.SpyInstance;

	beforeEach( () => {
		alert = jest.spyOn( window, 'alert' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		alert.mockRestore();
	} );

	it( 'keeps a failed upload out of the browser alert', () => {
		const notification = notificationWithUploadPlugin();

		notification.showWarning( "'image/webp' is not allowed for upload", { title: 'Upload failed', namespace: 'upload' } );

		expect( alert ).not.toHaveBeenCalled();
	} );

	it( 'leaves other warnings to CKEditor', () => {
		const notification = notificationWithUploadPlugin();

		notification.showWarning( 'Something else went wrong' );

		expect( alert ).toHaveBeenCalledWith( 'Something else went wrong' );
	} );
} );
