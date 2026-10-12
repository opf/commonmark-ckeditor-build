// The real module pulls in every CKEditor plugin of the build. The
// customizer only reads these two lists from it.
jest.mock( '../src/op-plugins', () => ( { opImageUploadPlugins: [], opMacroPlugins: [] } ) );

import type { EditorConfig } from '@ckeditor/ckeditor5-core';
import type { DecoupledEditor } from '@ckeditor/ckeditor5-editor-decoupled';
import { configurationCustomizer } from '../src/op-config-customizer';

describe( 'configurationCustomizer', () => {
	const wrapper = document.createElement( 'div' );
	const create = jest.fn( () => Promise.resolve( {} ) );
	const editorClass = { create } as unknown as typeof DecoupledEditor;

	it( 'names the missing openProject configuration', () => {
		expect( () => configurationCustomizer( editorClass )( wrapper, {} ) )
			.toThrow( 'CKEditor: openProject configuration is missing' );
	} );

	it( 'creates the editor with the given configuration', async () => {
		const configuration = { openProject: { context: {}, pluginContext: {} } } as unknown as EditorConfig;

		await configurationCustomizer( editorClass )( wrapper, configuration );

		expect( create ).toHaveBeenCalledWith( wrapper, configuration );
	} );

	it( 'disables all macros when the context turns them off', async () => {
		const configuration = { openProject: { context: { macros: false }, pluginContext: {} } } as unknown as EditorConfig;

		await configurationCustomizer( editorClass )( wrapper, configuration );

		expect( configuration.openProject!.disableAllMacros ).toBe( true );
	} );
} );
