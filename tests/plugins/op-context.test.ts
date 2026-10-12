import type { Editor } from '@ckeditor/ckeditor5-core';
import { getOPHelper, getOPService } from '../../src/plugins/op-context/op-context';

function editorWith( openProject: unknown ) {
	return { config: { _config: { openProject } } } as unknown as Editor;
}

describe( 'op-context', () => {
	it( 'returns a service of the plugin context', () => {
		const i18n = { t: ( key: string ) => key };
		const editor = editorWith( { pluginContext: { services: { i18n }, helpers: {} } } );

		expect( getOPService( editor, 'i18n' ) ).toBe( i18n );
	} );

	it( 'names the missing plugin context when a service is requested', () => {
		expect( () => getOPService( editorWith( {} ), 'i18n' ) )
			.toThrow( 'CKEditor: openProject.pluginContext is missing' );
	} );

	it( 'names the missing plugin context when a helper is requested', () => {
		// OpHelpers declares no members yet, so there is no valid name to pass.
		expect( () => getOPHelper( editorWith( {} ), 'anything' as never ) )
			.toThrow( 'CKEditor: openProject.pluginContext is missing' );
	} );
} );
