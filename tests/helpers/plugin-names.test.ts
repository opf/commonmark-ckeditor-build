import type { PluginConstructor } from '@ckeditor/ckeditor5-core';
import { pluginNames } from '../../src/helpers/plugin-names';

// Stand-ins for plugin constructors; only the static name is read.
const named = ( pluginName: string ) => ( { pluginName } as unknown as PluginConstructor );
const unnamed = {} as unknown as PluginConstructor;

describe( 'pluginNames', () => {
	it( 'reads the name of a plugin constructor', () => {
		expect( pluginNames( [ named( 'OPMacroToc' ) ] ) ).toEqual( [ 'OPMacroToc' ] );
	} );

	it( 'keeps an entry given as a name', () => {
		expect( pluginNames( [ 'OpUploadPlugin' ] ) ).toEqual( [ 'OpUploadPlugin' ] );
	} );

	it( 'handles a mixed list in order', () => {
		expect( pluginNames( [ 'OpUploadPlugin', named( 'OPMacroToc' ) ] ) ).toEqual( [ 'OpUploadPlugin', 'OPMacroToc' ] );
	} );

	it( 'skips a constructor without a name', () => {
		expect( pluginNames( [ unnamed, named( 'OPMacroToc' ) ] ) ).toEqual( [ 'OPMacroToc' ] );
	} );

	it( 'returns an empty list for an empty list', () => {
		expect( pluginNames( [] ) ).toEqual( [] );
	} );
} );
