jest.mock( '../../src/icons/revisions.svg', () => 'icon' );
// The plugin module imports the UI back; only its key constant is needed.
jest.mock( '../../src/plugins/op-content-revisions/op-content-revisions', () => ( {
	OP_CONTENT_REVISION_KEY: 'opContentRevisionKey',
} ) );
jest.mock( '../../src/plugins/op-content-revisions/storage' );

import type { Editor } from '@ckeditor/ckeditor5-core';
import type { ListDropdownItemDefinition } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';
import { loadFromLocalStorage } from '../../src/plugins/op-content-revisions/storage';
import type { OpRevisionRecord } from '../../src/plugins/op-content-revisions/storage';
import { addAvailableRevisions } from '../../src/plugins/op-content-revisions/ui';

const load = loadFromLocalStorage as jest.MockedFunction<typeof loadFromLocalStorage>;

// Translations echo their key and every time reads "now", so labels are predictable.
const editor = {
	getData: () => '',
	config: {
		get: () => 'storage-key',
		_config: {
			openProject: {
				pluginContext: {
					services: {
						i18n: { t: ( key: string ) => key },
						timezone: { formattedRelativeDateTime: () => 'now' },
					},
				},
			},
		},
	},
} as unknown as Editor;

function labelsFor( record: OpRevisionRecord | null ) {
	load.mockReturnValue( record );

	const collection = new Collection<ListDropdownItemDefinition>();
	addAvailableRevisions( editor, collection );

	return Array.from( collection, item => ( item as unknown as { model: { label: string } } ).model.label );
}

describe( 'addAvailableRevisions', () => {
	it( 'offers "no revisions" when nothing is stored', () => {
		expect( labelsFor( null ) ).toEqual( [ 'js.editor.no_revisions' ] );
	} );

	it( 'offers "no revisions" for a record without any item', () => {
		expect( labelsFor( { items: [] } ) ).toEqual( [ 'js.editor.no_revisions' ] );
	} );

	it( 'offers "no revisions" for a stored record that lacks its items', () => {
		expect( labelsFor( {} as OpRevisionRecord ) ).toEqual( [ 'js.editor.no_revisions' ] );
	} );

	it( 'lists a stored revision', () => {
		const record = { items: [ { timestamp: 1760000000000, hash: 12345, content: 'one two' } ] };

		expect( labelsFor( record ) ).toEqual( [ 'now (js.units.word)' ] );
	} );
} );
