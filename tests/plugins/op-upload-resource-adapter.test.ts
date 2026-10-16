import type { Editor } from '@ckeditor/ckeditor5-core';
import type { FileLoader } from '@ckeditor/ckeditor5-upload';
import OpUploadResourceAdapter from '../../src/plugins/op-upload-resource-adapter';
import type { OpAttachment, OpResource } from '../../src/op-types';

const resource: OpResource = { _type: 'WorkPackage', id: 1 };
const loader = {
	file: Promise.resolve( new File( [ 'x' ], 'picture.webp', { type: 'image/webp' } ) ),
} as unknown as FileLoader;

// The adapter reads the attachments service from the raw editor
// configuration and fires an event on the model.
function editorWhoseUpload( attachFiles: () => Promise<OpAttachment[]> ) {
	const fire = jest.fn();
	const editor = {
		model: { fire },
		config: {
			_config: {
				openProject: {
					pluginContext: {
						services: {
							attachmentsResourceService: {
								attachFiles: () => ( { toPromise: attachFiles } ),
							},
						},
					},
				},
			},
		},
	} as unknown as Editor;

	return { editor, fire };
}

describe( 'OpUploadResourceAdapter', () => {
	beforeEach( () => {
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'resolves with the download location of the uploaded attachment', async () => {
		const attachment: OpAttachment = { _links: { staticDownloadLocation: { href: '/attachments/7/picture.png' } } };
		const { editor, fire } = editorWhoseUpload( () => Promise.resolve( [ attachment ] ) );

		const response = await new OpUploadResourceAdapter( loader, resource, editor ).upload();

		expect( response ).toEqual( { default: '/attachments/7/picture.png' } );
		expect( fire ).toHaveBeenCalledWith( 'op:attachment-added', [ attachment ] );
	} );

	it( 'rejects with the message of a HAL error', async () => {
		const halError = { error: { message: "'image/webp' is not allowed for upload" } };
		const { editor } = editorWhoseUpload( () => Promise.reject( halError ) );

		await expect( new OpUploadResourceAdapter( loader, resource, editor ).upload() )
			.rejects.toEqual( "'image/webp' is not allowed for upload" );
	} );

	it( 'rejects with the message of a plain error', async () => {
		const { editor } = editorWhoseUpload( () => Promise.reject( new Error( 'Network unreachable' ) ) );

		await expect( new OpUploadResourceAdapter( loader, resource, editor ).upload() )
			.rejects.toEqual( 'Network unreachable' );
	} );

	it( 'rejects with a string it was rejected with', async () => {
		const { editor } = editorWhoseUpload( () => Promise.reject( 'Upload aborted' ) );

		await expect( new OpUploadResourceAdapter( loader, resource, editor ).upload() )
			.rejects.toEqual( 'Upload aborted' );
	} );

	it( 'rejects when the editor has no resource', async () => {
		const { editor } = editorWhoseUpload( () => Promise.resolve( [] ) );

		await expect( new OpUploadResourceAdapter( loader, undefined, editor ).upload() )
			.rejects.toEqual( 'Not possible to upload attachments without resource' );
	} );
} );
