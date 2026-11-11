import type { Editor } from '@ckeditor/ckeditor5-core';
import * as LZString from 'lz-string';
import OpContentRevisions, { OP_CONTENT_REVISION_KEY } from '../../src/plugins/op-content-revisions/op-content-revisions';
import {
	removeForeignAndExpiredRevisions,
	scheduleRevisionCleanup,
} from '../../src/plugins/op-content-revisions/storage';

const HOUR = 60 * 60 * 1000;
const now = Date.UTC( 2026, 10, 11, 12 );
const ownPrefix = 'op_ckeditor_rev_u7_';

function fakeEditor( { storageKey, field }: { storageKey?: string; field?: string } ) {
	const values: Record<string, unknown> = { storageKey };
	const config = {
		_config: {
			openProject: {
				context: { resource: { href: '/api/v3/work_packages/42' }, field },
				pluginContext: { services: { currentUser: { userId: '7' } } },
			},
		},
		get: ( name: string ) => values[ name ],
		define: ( name: string, value: unknown ) => {
			values[ name ] = value;
		},
	};

	return { config, once: jest.fn(), commands: { add: jest.fn() } } as unknown as Editor;
}

function storeRecord( key: string, updatedAt?: number ) {
	localStorage.setItem( key, LZString.compress( JSON.stringify( { items: [], updatedAt } ) ) );
}

describe( 'OpContentRevisions storage key', () => {
	it( 'prefixes the default key with the current user', () => {
		const editor = fakeEditor( { field: 'description' } );

		new OpContentRevisions( editor );

		expect( editor.config.get( OP_CONTENT_REVISION_KEY ) )
			.toEqual( 'op_ckeditor_rev_u7_/api/v3/work_packages/42_description' );
	} );

	it( 'prefixes a custom storage key with the current user', () => {
		const editor = fakeEditor( { storageKey: 'work_package-42-notes-new' } );

		new OpContentRevisions( editor );

		expect( editor.config.get( OP_CONTENT_REVISION_KEY ) )
			.toEqual( 'op_ckeditor_rev_u7_work_package-42-notes-new' );
	} );
} );

describe( 'removeForeignAndExpiredRevisions', () => {
	beforeEach( () => localStorage.clear() );

	it( 'keeps only recent records of the current user and unrelated keys', () => {
		storeRecord( `${ ownPrefix }work_package-42-notes-new`, now - HOUR );
		storeRecord( `${ ownPrefix }/api/v3/work_packages/42_description`, now - 9 * HOUR );
		storeRecord( 'op_ckeditor_rev_u8_work_package-42-notes-new', now - HOUR );
		storeRecord( 'op_ckeditor_rev_/api/v3/work_packages/42_description', now - HOUR );
		storeRecord( 'work_package-42-notes-new', now - HOUR );
		storeRecord( 'work_package-42-notes-17', now - HOUR );
		storeRecord( 'forum-topic-3-reply-new', now - HOUR );
		storeRecord( 'meeting-5-agenda-item-new', now - HOUR );
		storeRecord( 'meeting-agenda-9-outcome-new', now - HOUR );
		localStorage.setItem( 'recent', '["42"]' );
		localStorage.setItem( 'work-package-42-rescued-editor-data-7', 'draft' );

		removeForeignAndExpiredRevisions( ownPrefix, now );

		expect( Object.keys( localStorage ).sort() ).toEqual( [
			`${ ownPrefix }work_package-42-notes-new`,
			'recent',
			'work-package-42-rescued-editor-data-7',
		] );
	} );

	it( 'removes records of the current user without a timestamp', () => {
		storeRecord( `${ ownPrefix }work_package-42-notes-new` );

		removeForeignAndExpiredRevisions( ownPrefix, now );

		expect( localStorage.length ).toEqual( 0 );
	} );
} );

describe( 'scheduleRevisionCleanup', () => {
	beforeEach( () => {
		localStorage.clear();
		jest.useFakeTimers();
	} );

	afterEach( () => jest.useRealTimers() );

	it( 'runs the cleanup once after the last call', () => {
		storeRecord( 'op_ckeditor_rev_u8_work_package-42-notes-new', Date.now() );

		scheduleRevisionCleanup( ownPrefix );
		jest.advanceTimersByTime( 900 );
		scheduleRevisionCleanup( ownPrefix );
		jest.advanceTimersByTime( 900 );

		expect( localStorage.length ).toEqual( 1 );

		jest.advanceTimersByTime( 100 );

		expect( localStorage.length ).toEqual( 0 );
	} );
} );
